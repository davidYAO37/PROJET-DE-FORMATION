import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { requirePatientAuth } from "@/lib/patientAuth";
import { getTenantModel } from "@/lib/tenantModels";
import { IRendezVous } from "@/models/RendezVous";
import { IMedecin } from "@/models/medecin";
import { IPlanningMed } from "@/models/PlanningMed";
import { getPrimaryConnection } from "@/lib/tenantDb";
import "@/models";

// GET : liste des rendez-vous du patient connecté.
export async function GET(req: NextRequest) {
  const { context, response } = await requirePatientAuth(req);
  if (!context) return response;

  try {
    const RendezVous = getTenantModel<IRendezVous>(context.connection, "RendezVous");
    const tenantFilter = context.connection === await getPrimaryConnection() ? { entrepriseId: context.entrepriseId } : {};
    const medecinId = req.nextUrl.searchParams.get("medecinId");
    if (medecinId) {
      if (!mongoose.isValidObjectId(medecinId)) return NextResponse.json({ message: "Médecin invalide" }, { status: 400 });
      const Planning = getTenantModel<IPlanningMed>(context.connection, "PlanningMed");
      const plannings = await Planning.find({ ...tenantFilter, IDMEDECIN: medecinId }).select("_id").lean();
      const slots = await RendezVous.find({
        ...tenantFilter, IDMEDECIN: medecinId, IDPLANNING_MED: { $in: plannings.map((p) => p._id) },
        Statutrdvpris: { $ne: true }, StatutRdv: { $in: ["0", "", null] },
        ServiceIndisponible: { $ne: true },
        $and: [{ $or: [{ PatientR: "" }, { PatientR: null }] }, { $or: [{ IdPatient: null }, { IdPatient: { $exists: false } }] }],
      }).select("DateDisponinibilite IDPLANNING_MED").sort({ DateDisponinibilite: 1 }).lean();
      return NextResponse.json({ creneaux: slots.filter((s) => new Date(s.DateDisponinibilite).getTime() > Date.now())
        .map((s) => ({ _id: String(s._id), date: s.DateDisponinibilite })) });
    }
    const Medecin = getTenantModel<IMedecin>(context.connection, "Medecin");
    const rdvs = await RendezVous.find({ ...tenantFilter, IdPatient: context.patientId })
      .populate({ path: "IDMEDECIN", select: "nom prenoms specialite", model: Medecin, match: tenantFilter })
      .sort({ DateDisponinibilite: -1, createdAt: -1 })
      .limit(100)
      .lean();

    const items = (rdvs as any[]).map((r) => {
      const date = r.DateDisponinibilite || r.RENDEZVOUSLE;
      return {
        _id: r._id.toString(),
        date,
        libelle: r.LibelleRDV || r.DESCRIPTION || "Consultation",
        description: r.DESCRIPTION || "",
        medecin: r.IDMEDECIN
          ? `Dr ${r.IDMEDECIN.nom || ""} ${r.IDMEDECIN.prenoms || ""}`.trim()
          : r.Medecinr || "Non attribué",
        specialite: r.IDMEDECIN?.specialite || "",
        statut:
          r.StatutRdv === "0"
            ? "En attente de confirmation"
            : r.StatutRdv === "1"
            ? "Confirmé"
            : r.StatutRdv === "2"
            ? "Patient présent"
            : r.StatutRdv === "3"
            ? "Annulé"
            : r.StatutRdv === "4" ? "Reporté" : "En attente de confirmation",
        statutCode: r.StatutRdv || "0",
      };
    });

    return NextResponse.json({ rendezVous: items }, { status: 200 });
  } catch (error) {
    console.error("Erreur liste RDV portail:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

// POST : le patient demande un rendez-vous.
// La demande est créée avec StatutRdv "0" (en attente) : l'accueil doit la confirmer.
export async function POST(req: NextRequest) {
  const { context, response } = await requirePatientAuth(req);
  if (!context) return response;

  try {
    const { medecinId, creneauId, motif } = await req.json();
    const tenantFilter = context.connection === await getPrimaryConnection() ? { entrepriseId: context.entrepriseId } : {};
    if (!mongoose.isValidObjectId(medecinId) || !mongoose.isValidObjectId(creneauId)) {
      return NextResponse.json({ message: "Sélectionnez un médecin et un créneau du planning." }, { status: 400 });
    }
    const Slots = getTenantModel<IRendezVous>(context.connection, "RendezVous");
    const slot = await Slots.findOne({ ...tenantFilter, _id: creneauId, IDMEDECIN: medecinId }).lean();
    const Planning = getTenantModel<IPlanningMed>(context.connection, "PlanningMed");
    if (!slot || !await Planning.exists({ ...tenantFilter, _id: slot.IDPLANNING_MED, IDMEDECIN: medecinId })) {
      return NextResponse.json({ message: "Créneau introuvable dans le planning du médecin." }, { status: 404 });
    }
    const dateSouhaitee = slot.DateDisponinibilite;

    if (!dateSouhaitee || !motif || !String(motif).trim()) {
      return NextResponse.json(
        { message: "La date souhaitée et le motif sont requis" },
        { status: 400 }
      );
    }

    const date = new Date(dateSouhaitee);
    if (isNaN(date.getTime())) {
      return NextResponse.json({ message: "Date invalide" }, { status: 400 });
    }

    if (date.getTime() <= Date.now()) {
      return NextResponse.json(
        { message: "La date souhaitée ne peut pas être dans le passé" },
        { status: 400 }
      );
    }

    const RendezVous = getTenantModel<IRendezVous>(context.connection, "RendezVous");

    let medecinNom = "";
    let medecinObjectId: mongoose.Types.ObjectId | undefined;
    if (medecinId) {
      const Medecin = getTenantModel<IMedecin>(context.connection, "Medecin");
      const med = await Medecin.findOne({ ...tenantFilter, _id: medecinId }).lean();
      if (!med) {
        return NextResponse.json({ message: "Médecin introuvable" }, { status: 404 });
      }
      medecinNom = `Dr ${(med as any).nom} ${(med as any).prenoms || ""}`.trim();
      medecinObjectId = new mongoose.Types.ObjectId(String(medecinId));
    }

    const p = context.patient;
    const created = await RendezVous.findOneAndUpdate({
      ...tenantFilter, _id: creneauId, IDMEDECIN: medecinId,
      Statutrdvpris: { $ne: true }, StatutRdv: { $in: ["0", "", null] }, ServiceIndisponible: { $ne: true },
      $and: [{ $or: [{ PatientR: "" }, { PatientR: null }] }, { $or: [{ IdPatient: null }, { IdPatient: { $exists: false } }] }],
    }, { $set: {
      LibelleRDV: String(motif).slice(0, 200),
      PatientR: `${p.Nom} ${p.Prenoms}`.trim(),
      Medecinr: medecinNom,
      IdPatient: context.patientId,
      IDMEDECIN: medecinObjectId,
      StatutRdv: "0",
      DateDisponinibilite: slot.DateDisponinibilite,
      RendezVousPrisPar: "Patient (portail)",
      RENDEZVOUSLE: date,
      DESCRIPTION: `Demande du portail patient — ${String(motif).slice(0, 500)}`,
      Statutrdvpris: false,
      Contact: p.Contact || "",
      entrepriseId: context.entrepriseId,
    } }, { new: true });
    if (!created) return NextResponse.json({ message: "Ce créneau vient d’être réservé. Choisissez un autre créneau." }, { status: 409 });

    return NextResponse.json(
      {
        message:
          "Votre demande de rendez-vous a été envoyée. Elle sera confirmée par l'accueil.",
        rendezVous: { _id: created._id.toString() },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur création RDV portail:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
