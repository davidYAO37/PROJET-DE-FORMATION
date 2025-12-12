import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { Consultation, IConsultation } from "@/models/consultation";
import { Patient } from "@/models/patient";
import { Assurance } from "@/models/assurance";
import { Medecin } from "@/models/medecin";
import { db } from "@/db/mongoConnect";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await db();

    try {
        const { id } = await params;
        const consultation = await Consultation.findById(id);

        if (!consultation) {
            return NextResponse.json({ error: "Consultation non trouvée" }, { status: 404 });
        }

        return NextResponse.json(consultation, { status: 200 });
    } catch (error: any) {
        console.error('Erreur API GET /api/consultationFacture/[id]:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await db();

    try {
        const { id } = await params;
        const data = await req.json();

        // Validation minimale
        if (!data.selectedActe) return NextResponse.json({ error: "Merci de préciser l'acte de consultation" }, { status: 400 });
        if (!data.selectedMedecin) return NextResponse.json({ error: "Merci de préciser le médecin prescripteur" }, { status: 400 });

        const consultation = await Consultation.findById(id);
        if (!consultation) return NextResponse.json({ error: "Consultation non trouvée" }, { status: 404 });

        // Récupération patient, assurance, médecin
        const patient = data.IdPatient ? await Patient.findById(
            typeof data.IdPatient === "string" ? new mongoose.Types.ObjectId(data.IdPatient) : data.IdPatient
        ) : null;

        const assurance = data.selectedAssurance ? await Assurance.findById(
            typeof data.selectedAssurance === "string" ? new mongoose.Types.ObjectId(data.selectedAssurance) : data.selectedAssurance
        ) : null;

        const medecin = data.selectedMedecin ? await Medecin.findById(
            typeof data.selectedMedecin === "string" ? new mongoose.Types.ObjectId(data.selectedMedecin) : data.selectedMedecin
        ) : null;

        // Calcul montants
        let montantActe = data.montantClinique || 0;
        const tauxNum = Number(data.taux) || 0;
        let partAssurance = 0;
        let Partassure = 0;
        let surplus = 0;

        if (data.assure === "mutualiste" || data.assure === "assure") {
            montantActe = data.montantAssurance || montantActe;
        }
        if ((data.montantClinique || 0) > montantActe) {
            surplus = (data.montantClinique || 0) - montantActe;
        }
        partAssurance = (tauxNum * montantActe) / 100;
        Partassure = montantActe - partAssurance;
        const totalPatient = Partassure + surplus;

        // Mise à jour consultation
        consultation.designationC = data.selectedActeDesignation;
        consultation.assurance = assurance?.desiganationassurance || "NON ASSURE";
        consultation.Assure = data.assure === "non" ? "NON ASSURE" : data.assure === "mutualiste" ? "TARIF MUTUALISTE" : "TARIF ASSURE";

        consultation.IDASSURANCE = assurance?._id ? new mongoose.Types.ObjectId(String(assurance._id)) : undefined;
        consultation.IdPatient = patient?._id ? new mongoose.Types.ObjectId(String(patient._id)) : undefined;
        consultation.IDMEDECIN = medecin?._id ? new mongoose.Types.ObjectId(String(medecin._id)) : undefined;

        consultation.Prix_Assurance = montantActe;
        consultation.PrixClinique = data.montantClinique || 0;

        consultation.montantapayer = Partassure;
        consultation.ReliquatPatient = surplus;

        consultation.Code_dossier = data.Code_dossier;
        consultation.CodePrestation = data.CodePrestation;
        consultation.Date_consulation = data.Date_consulation || consultation.Date_consulation;
        consultation.Heure_Consultation = data.Heure_Consultation || consultation.Heure_Consultation;

        consultation.tauxAssurance = tauxNum;
        consultation.PartAssurance = partAssurance;
        consultation.tiket_moderateur = Partassure;
        consultation.numero_carte = data.matricule;
        consultation.NumBon = data.NumBon;
        consultation.Recupar = data.Recupar;
        consultation.IDACTE = data.selectedActe;
        consultation.PatientP = patient?.Nom || "";
        consultation.Medecin = medecin ? `${medecin.nom} ${medecin.prenoms}` : "";

        // Calcul Toutencaisse
        const resteAPayer = totalPatient - (data.Montantencaisse || 0);
        consultation.Restapayer = resteAPayer >= 0 ? resteAPayer : 0;
        const toutEncaisse = resteAPayer <= 0;

        // Mise à jour consultation apres paiement
        consultation.Toutencaisse = toutEncaisse; // True si Restapayer = 0
        consultation.StatuPrescriptionMedecin = 3;
        consultation.DateFacturation = data.DateFacturation || new Date();
        consultation.FacturéPar = data.FacturéPar || data.Recupar || "";
        consultation.Modepaiement = data.Modepaiement || "Espèce";
        consultation.Montantencaisse = data.Montantencaisse || 0;
        consultation.StatutPaiement = toutEncaisse ? "En cours de Paiement" : "Pas facturé";
        consultation.StatutC = true;


        await consultation.save();

        // ✅ Réponse structurée pour React
        return NextResponse.json({
            success: true,
            consultation,
            assure: consultation.Assure,          // Type visiteur
            patient: {
                _id: patient?._id,
                Nom: patient?.Nom,
                Prenoms: patient?.Prenoms || "",
            },
            medecinPrescripteur: medecin?.nom || "",
            idAssurance: assurance?._id || "",
            matricule: data.matricule || "",
            societe: assurance?.societes || "",
            numeroBon: data.NumBon || "",
            taux: tauxNum,
            info: `Patient trouvé : ${patient?.Nom || ""}`,
        });
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

