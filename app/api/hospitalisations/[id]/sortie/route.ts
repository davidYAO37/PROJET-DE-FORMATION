import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { ILit } from "@/models/lit";
import { IChambre } from "@/models/chambre";
import { IExamenHospitalisation } from "@/models/examenHospit";
import { ILignePrestation } from "@/models/lignePrestation";
import { IFactureHospitalisation } from "@/models/hospitalisation/FactureHospitalisation";
import { IMouvementHospitalisation } from "@/models/hospitalisation/MouvementHospitalisation";

const ROLES = ["admin", "medecin", "accueil", "infirmier"];

function normalizeId(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "object" && "_id" in (value as object)) {
    return String((value as { _id: unknown })._id);
  }
  return String(value);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { context, response } = await withTenant(req, ROLES);
  if (!context) return response;
  const { connection, userObjectId } = context;

  try {
    const { id } = await params;
    const body = await req.json();

    getTenantModel(connection, "Chambre");
    getTenantModel(connection, "Lit");
    const ExamenHospitalisation = getTenantModel<IExamenHospitalisation>(connection, "ExamenHospitalisation");
    const hospitalisation = await ExamenHospitalisation.findById(id)
      .populate("litId", "numero tarifJournalier")
      .populate("IDCHAMBRE", "numero tarifJournalier")
      .populate("IDASSURANCE")
      .lean();

    if (!hospitalisation) {
      return NextResponse.json({ message: "Hospitalisation introuvable" }, { status: 404 });
    }

    if (hospitalisation.statutHospitalisation !== "en_cours") {
      return NextResponse.json(
        { message: "La sortie n'est possible que pour un séjour en cours" },
        { status: 409 }
      );
    }

    const dateSortie = body.dateSortie ? new Date(body.dateSortie) : new Date();
    const heureSortie =
      body.heureSortie ||
      dateSortie.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

    const dateEntree = new Date(hospitalisation.Entrele || hospitalisation.DatePres || new Date());
    const diffMs = dateSortie.getTime() - dateEntree.getTime();
    const nombreJours = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    const lit = hospitalisation.litId as unknown as ILit | undefined;
    const chambre = hospitalisation.IDCHAMBRE as unknown as IChambre | undefined;
    const tarifJournalier = lit?.tarifJournalier || chambre?.tarifJournalier || 0;
    const montantChambre = tarifJournalier * nombreJours;

    // Récupération des lignes de prestation liées à cet examen
    const Ligne = getTenantModel<ILignePrestation>(connection, "LignePrestation");
    const lignesPrestation = await Ligne.find({ idHospitalisation: id }).lean();

    const lignesFacture: Array<{
      type: string;
      designation: string;
      quantite: number;
      prixUnitaire: number;
      total: number;
    }> = [];

    lignesFacture.push({
      type: "chambre",
      designation: `Chambre ${chambre?.numero || hospitalisation.Chambre || ""} / Lit ${lit?.numero || ""}`,
      quantite: nombreJours,
      prixUnitaire: tarifJournalier,
      total: montantChambre,
    });

    let montantActes = 0;
    let montantExamens = 0;

    for (const ligne of lignesPrestation) {
      const typeActe = (hospitalisation.Designationtypeacte || "").toLowerCase();
      const type = typeActe.includes("examen") || typeActe.includes("labo") ? "examen" : "acte";
      const quantite = ligne.qte || 1;
      const prixUnitaire = ligne.prix || 0;
      const total = ligne.prixTotal || quantite * prixUnitaire || 0;

      lignesFacture.push({
        type,
        designation: ligne.prestation || "Prestation",
        quantite,
        prixUnitaire,
        total,
      });

      if (type === "examen") montantExamens += total;
      else montantActes += total;
    }

    const taux = Number(hospitalisation.Taux || 0);
    const remise = body.remise || hospitalisation.remise || 0;
    const montantMedicaments = hospitalisation.montantMedicaments || 0;
    const montantSoins = hospitalisation.montantSoins || 0;
    const montantHonoraires = hospitalisation.montantHonoraires || 0;

    const totalGeneral =
      montantChambre +
      montantActes +
      montantExamens +
      montantMedicaments +
      montantSoins +
      montantHonoraires -
      remise;

    const partAssurance = totalGeneral * (taux / 100);
    const partPatient = totalGeneral - partAssurance;
    const dejaPaye = body.dejaPaye || 0;
    const resteAPayer = partPatient - dejaPaye;

    const Facture = getTenantModel<IFactureHospitalisation>(connection, "FactureHospitalisation");
    const countFactures = await Facture.countDocuments();
    const numeroFacture = `FH-${(countFactures + 1).toString().padStart(5, "0")}`;

    const facture = await Facture.create({
      hospitalisationId: hospitalisation._id,
      patientId: hospitalisation.IdPatient,
      numeroFacture,
      dateEmission: new Date(),
      dateSortie,
      lignes: lignesFacture,
      montantChambre,
      nombreJours,
      montantActes,
      montantExamens,
      montantMedicaments,
      montantSoins,
      montantHonoraires,
      remise,
      totalGeneral,
      partAssurance,
      partPatient,
      dejaPaye,
      resteAPayer,
      statut: "brouillon",
      createdBy: userObjectId,
    });

    await ExamenHospitalisation.findByIdAndUpdate(id, {
      statutHospitalisation: "sortie",
      SortieLe: dateSortie,
      heureSortie,
      montantChambre,
      nombreDeJours: nombreJours,
      montantActes,
      montantExamens,
      remise,
      PartAssuranceP: partAssurance,
      TotalapayerPatient: partPatient,
      Restapayer: resteAPayer,
    });

    // Libération du lit et de la chambre
    const Lit = getTenantModel<ILit>(connection, "Lit");
    const Chambre = getTenantModel<IChambre>(connection, "Chambre");

    const litId = normalizeId(hospitalisation.litId);
    const chambreId = normalizeId(hospitalisation.IDCHAMBRE);

    if (litId) {
      await Lit.findByIdAndUpdate(litId, {
        etat: "libre",
        patientId: undefined,
        dateLiberation: new Date(),
      });
    }

    if (chambreId) {
      const activeInRoom = await ExamenHospitalisation.findOne({
        IDCHAMBRE: chambreId,
        statutHospitalisation: "en_cours",
        _id: { $ne: hospitalisation._id },
      });
      if (!activeInRoom) {
        await Chambre.findByIdAndUpdate(chambreId, { etat: "libre" });
      }
    }

    const Mouvement = getTenantModel<IMouvementHospitalisation>(connection, "MouvementHospitalisation");
    await Mouvement.create({
      hospitalisationId: hospitalisation._id,
      patientId: hospitalisation.IdPatient,
      type: "sortie",
      date: dateSortie,
      heure: heureSortie,
      chambreIdSource: hospitalisation.IDCHAMBRE,
      litIdSource: hospitalisation.litId,
      auteurId: userObjectId,
      motif: body.orientation || body.motif,
      observation: body.observations,
    });

    const updatedHospitalisation = await ExamenHospitalisation.findById(id).lean();

    return NextResponse.json(
      { success: true, hospitalisation: updatedHospitalisation, facture },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur sortie hospitalisation:", error);
    return NextResponse.json(
      { message: "Erreur serveur", details: error instanceof Error ? error.message : "" },
      { status: 500 }
    );
  }
}
