import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { Consultation, IConsultation } from "@/models/consultation";
import { Patient } from "@/models/patient";
import { Assurance } from "@/models/assurance";
import { Medecin } from "@/models/medecin";
import { db } from "@/db/mongoConnect";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await db();

    try {
        const { id } = await params;
        const data = await req.json();

        // ✅ Validation
        if (!data.selectedActe || data.selectedActe === "") {
            return NextResponse.json({ error: "Merci de préciser l'acte de consultation" }, { status: 400 });
        }
        if (!data.selectedMedecin || data.selectedMedecin === "") {
            return NextResponse.json({ error: "Merci de préciser le médecin prescripteur" }, { status: 400 });
        }
        if (data.assure !== "non") {
            if (!data.taux || data.taux === 0) {
                return NextResponse.json({ error: "Merci de préciser le taux de couverture SVP" }, { status: 400 });
            }
            if (!data.matricule || data.matricule === "") {
                return NextResponse.json({ error: "Merci de préciser le matricule du patient SVP" }, { status: 400 });
            }
            if (!data.selectedAssurance || data.selectedAssurance === "") {
                return NextResponse.json({ error: "Merci de préciser l'assurance du patient SVP" }, { status: 400 });
            }
        }

        const consultation = await Consultation.findById(id);
        if (!consultation) {
            return NextResponse.json({ error: "Consultation non trouvée" }, { status: 404 });
        }

        // Correction des types _id :
        const patient = data.IDPARTIENT ? await Patient.findById(typeof data.IDPARTIENT === "string" ? new mongoose.Types.ObjectId(data.IDPARTIENT) : data.IDPARTIENT) : null;
        const assurance = data.selectedAssurance ? await Assurance.findById(typeof data.selectedAssurance === "string" ? new mongoose.Types.ObjectId(data.selectedAssurance) : data.selectedAssurance) : null;
        const medecin = data.selectedMedecin ? await Medecin.findById(typeof data.selectedMedecin === "string" ? new mongoose.Types.ObjectId(data.selectedMedecin) : data.selectedMedecin) : null;

        // Calcul Montants
        let montantActe = data.montantClinique || 0;
        let partAssurance = 0;
        let partPatient = 0;
        let surplus = 0;
        const tauxNum = Number(data.taux) || 0;

        if (data.assure === "mutualiste" || data.assure === "assure") {
            montantActe = data.montantAssurance || montantActe;
        }
        if (data.montantClinique > montantActe) {
            surplus = data.montantClinique - montantActe;
        }
        partAssurance = (tauxNum * montantActe) / 100;
        partPatient = montantActe - partAssurance;
        const totalPatient = partPatient + surplus;

        // Mise à jour consultation
        consultation.designationC = data.selectedActeDesignation;
        consultation.assurance = assurance?.desiganationassurance || "NON ASSURE";
        consultation.Assuré = data.assure === "non" ? "NON ASSURE" : data.assure === "mutualiste" ? "TARIF MUTUALISTE" : "TARIF ASSURE";

        // ✅ Conversion explicite en ObjectId
        consultation.IDASSURANCE = assurance?._id ? new mongoose.Types.ObjectId(String(assurance._id)) : undefined;
        consultation.IDPARTIENT = patient?._id ? new mongoose.Types.ObjectId(String(patient._id)) : undefined;
        consultation.IDMEDECIN = medecin?._id ? new mongoose.Types.ObjectId(String(medecin._id)) : undefined;

        consultation.Prix_Assurance = montantActe;
        consultation.PrixClinique = data.montantClinique || 0;
        consultation.Restapayer = totalPatient;
        consultation.montantapayer = partPatient;
        consultation.ReliquatPatient = surplus;

        consultation.Code_dossier = data.Code_dossier;
        consultation.Code_Prestation = data.Code_Prestation;
        consultation.Date_consulation = data.Date_consulation || consultation.Date_consulation;
        consultation.Heure_Consultation = data.Heure_Consultation || consultation.Heure_Consultation;

        consultation.StatutC = data.montantClinique === 0;
        consultation.StatutPaiement = data.montantClinique === 0 ? "Pas facturé" : "En cours de Paiement";
        consultation.Toutencaisse = data.montantClinique === 0;

        consultation.tauxAssurance = tauxNum;
        consultation.PartAssurance = partAssurance;
        consultation.tiket_moderateur = partPatient;
        consultation.numero_carte = data.matricule;
        consultation.NumBon = data.NumBon;

        consultation.Recupar = data.Recupar;
        consultation.IDACTE = data.selectedActe;
        consultation.PatientP = patient?.nom || "";
        consultation.Medecin = medecin ? `${medecin.nom} ${medecin.prenoms}` : "";
        consultation.StatuPrescriptionMedecin = 2;

        await consultation.save();

        return NextResponse.json({ success: true, consultation });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await db();

    try {
        const { id } = await params; // ✅ récupération correcte de l'ID
        const consultation = await Consultation.findByIdAndDelete(id);

        if (!consultation) {
            return NextResponse.json({ error: "Consultation non trouvée" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Consultation supprimée" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

