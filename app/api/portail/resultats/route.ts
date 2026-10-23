import { NextRequest, NextResponse } from "next/server";
import { requirePatientAuth } from "@/lib/patientAuth";
import { getTenantModel } from "@/lib/tenantModels";
import { getPrimaryConnection } from "@/lib/tenantDb";
import { ILignePrestation } from "@/models/lignePrestation";
import { IExamenHospitalisation } from "@/models/examenHospit";
import { IParametreCRendu } from "@/models/ParametreCRendu";
import "@/models";

// Résultats d'examens du patient : lignes de prestation ayant des résultats
// saisis, groupées par acte. Seuls les résultats saisis sont exposés.
export async function GET(req: NextRequest) {
  const { context, response } = await requirePatientAuth(req);
  if (!context) return response;

  try {
    const Ligne = getTenantModel<ILignePrestation>(context.connection, "LignePrestation");
    const Examen = getTenantModel<IExamenHospitalisation>(context.connection, "ExamenHospitalisation");
    const Parametre = getTenantModel<IParametreCRendu>(context.connection, "ParametreCRendu");
    const filter = context.connection === await getPrimaryConnection()
      ? { entrepriseId: context.entrepriseId } : {};
    const [biologie, parametres] = await Promise.all([
      Examen.find({ ...filter, IdPatient: context.patientId, Designationtypeacte: "EXAMEN BIOLOGIQUE" })
        .select("DatePres CodePrestation NomMed StatutLaboratoire DateValidation dateRemiseResultat")
        .sort({ DatePres: -1 }).lean(),
      Parametre.find({}).select("LettreCle").lean(),
    ]);
    const lettres = parametres.map((p) => p.LettreCle).filter(Boolean);
    const [lignesBio, radios] = await Promise.all([
      Ligne.find({ ...filter, IdPatient: context.patientId, idHospitalisation: { $in: biologie.map((b) => b._id) } })
        .select("idHospitalisation prestation").lean(),
      Ligne.find({ ...filter, IdPatient: context.patientId, lettreCle: { $in: lettres } })
        .select("dateLignePrestation CodePrestation prestation medecinPrescripteur compteRenduValideLe dateSaisieResultat")
        .sort({ dateLignePrestation: -1 }).lean(),
    ]);
    const statuts: Record<number, string> = {
      1: "Non reçu", 2: "Réceptionné — en cours de traitement",
      3: "En attente de validation", 4: "Validé", 5: "Retour pour reprise",
    };
    const examens = [
      ...biologie.map((b) => ({
        _id: `bio-${b._id}`, type: "biologie", prestation: "EXAMEN BIOLOGIQUE",
        code: b.CodePrestation || "", date: b.DatePres, medecinPrescripteur: b.NomMed || "",
        valide: b.StatutLaboratoire === 4,
        remis: !!b.dateRemiseResultat,
        dateRemise: b.dateRemiseResultat || null,
        statut: b.dateRemiseResultat ? "Résultat reçu / remis" : statuts[b.StatutLaboratoire || 0] || "En attente",
        dateValidation: b.DateValidation || null,
        examens: lignesBio.filter((l) => String(l.idHospitalisation) === String(b._id))
          .map((l) => ({ _id: String(l._id), libelle: l.prestation })),
      })),
      ...radios.map((r) => ({
        _id: `radio-${r._id}`, type: "radiologie", prestation: "RADIOLOGIE",
        code: r.CodePrestation || "", date: r.dateLignePrestation,
        medecinPrescripteur: r.medecinPrescripteur || "",
        valide: !!r.compteRenduValideLe,
        statut: r.compteRenduValideLe ? "Validé" : r.dateSaisieResultat ? "En attente de validation" : "En attente de réalisation",
        dateValidation: r.compteRenduValideLe || null,
        examens: [{ _id: String(r._id), libelle: r.prestation }],
      })),
    ].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
      // N'expose au patient que les examens effectivement terminés.
    return NextResponse.json({ examens });
  } catch (error) {
    console.error("Erreur résultats portail:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
