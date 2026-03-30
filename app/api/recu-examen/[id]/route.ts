import { NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { Facturation } from "@/models/Facturation";
import { LignePrestation } from "@/models/lignePrestation";
import { Patient } from "@/models/patient";
import { PatientPrescription } from "@/models/PatientPrescription";
import { Types } from "mongoose";
import { Assurance } from "@/models/assurance";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  await db();
  const { id } = await context.params;

  try {
    if (!id) {
      return NextResponse.json(
        { error: "ID Facturation manquant" },
        { status: 400 }
      );
    }

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Format d'ID invalide" },
        { status: 400 }
      );
    }

    /* ================= FACTURATION ================= */
    const facturation = await Facturation.findById(id).lean();
      
    if (!facturation) {
      console.log("Facture non trouvée", facturation)
      return NextResponse.json({ error: "Facturation introuvable" }, { status: 404 });
    }

    /* ================= PATIENT ================= */
    const patient = await Patient.findById(facturation.IdPatient).lean();
    if (!patient) {
      console.log("Patient non trouvé", patient)
      return NextResponse.json({ error: "Patient introuvable" }, { status: 404 });
    }

/* ================= ASSURANCE ================= */
    let designationassurance = "";
    if (facturation.Assurance) {
      const assurance = await Assurance.findById(facturation.Assurance).lean();
      if (assurance) {
        designationassurance = assurance.designationassurance || "";
      }
    }
    /* ================= LIGNES DE PRESTATION ================= */
    let lignes: any[] = [];
    let patientPrescriptions: any[] = [];

    // Vérifier si c'est une facturation de prescription
    if (facturation.IDPRESCRIPTION) {
      // Récupérer les patientprescriptions liées à cette facturation
      patientPrescriptions = await PatientPrescription.find({
        facturation: facturation._id
      })
      .populate('medicament', 'Designation')
      .sort({ DatePres: 1 })
      .lean();

      console.log("PatientPrescriptions trouvées:", patientPrescriptions.length);
    } else {
      // Pour les factures normales, récupérer les lignes de prestation
      lignes = await LignePrestation.find({
        idFacturation: facturation._id,
      })
        .sort({ ordonnancementAffichage: 1 })
        .lean();
    }

    /* ================= RESPONSE ================= */
    return NextResponse.json({
      header: {
        idFacturation: facturation._id,
        CodePrestation: facturation.CodePrestation,
        Designationtypeacte: facturation.Designationtypeacte,
        typefacture: facturation.typefacture,
        DateFacturation: facturation.DateFacturation,

        Patient: {
          Nom: patient.Nom,
          Prenoms: patient.Prenoms,
          sexe: patient.sexe,
          Age_partient: patient.Age_partient,
          Date_naisse: patient.Date_naisse,
          Contact: patient.Contact,
          Code_dossier: patient.Code_dossier,
          SOCIETE_PATIENT: patient.SOCIETE_PATIENT,
        },

        NomMed: facturation.NomMed,
        Rclinique: facturation.Rclinique,

        Entrele: facturation.Entrele,
        SortieLe: facturation.SortieLe,
        nombreDeJours: facturation.nombreDeJours,

        Assurance: designationassurance,
        Taux: facturation.Taux,
        Souscripteur: facturation.Souscripteur,
        SOCIETE_PATIENT: facturation.SOCIETE_PATIENT,
        NumBon: facturation.NumBon,

        Modepaiement: facturation.Modepaiement,
        BanqueC: facturation.BanqueC,
        NumCheque: facturation.NumCheque,
        NumCarteVisa: facturation.NumCarteVisa,
        NumCompteVisa: facturation.NumCompteVisa,

        Montanttotal: facturation.Montanttotal,
        PartAssuranceP: facturation.PartAssuranceP,
        Partassure: facturation.Partassure,
        reduction: facturation.reduction,
        TotalapayerPatient: facturation.TotalapayerPatient,
        TotalReliquatPatient: facturation.TotalReliquatPatient,
        TotalPaye: facturation.TotalPaye,
        MontantRecu: facturation.MontantRecu,
        Restapayer: facturation.Restapayer,
        Numcarte: facturation.Numcarte,
        DatePres: facturation.DatePres,
        SaisiPar: facturation.SaisiPar,
        
      },

      lignes: lignes.map(l => ({
        _id: l._id.toString(),
        Prestation: l.prestation,
        CoefficientActe: l.coefficientActe,
        Qte: l.qte,
        Prix: l.prix,
        PrixTotal: l.prixTotal,
        PartAssurance: l.partAssurance,
        tauxAssurance: l.tauxAssurance,
        Partassure: l.partAssure,
        totalsurplus: l.totalSurplus || 0,
        ReliquatPatient: l.reliquatPatient || 0,
      })),

      patientPrescriptions: patientPrescriptions.map(pp => ({
        _id: pp._id.toString(),
        IDPRESCRIPTION: pp.IDPRESCRIPTION,
        PatientP: pp.PatientP,
        QteP: pp.QteP,
        posologie: pp.posologie,
        DatePres: pp.DatePres,
        prixUnitaire: pp.prixUnitaire,
        prixTotal: pp.prixTotal,
        nomMedicament: pp.nomMedicament,
        partAssurance: pp.partAssurance,
        partAssure: pp.partAssure,
        StatutPrescriptionMedecin: pp.StatutPrescriptionMedecin,
        actePayeCaisse: pp.actePayeCaisse,
        payeLe: pp.payeLe,
        payePar: pp.payePar,
        reference: pp.reference,
        exclusionActe: pp.exclusionActe,
        medicament: pp.medicament ? {
          _id: pp.medicament._id,
          Designation: pp.medicament.Designation
        } : null
      })),

    });

  } catch (error) {
    console.error("Erreur API recu-examen :", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la génération du reçu" },
      { status: 500 }
    );
  }
}
