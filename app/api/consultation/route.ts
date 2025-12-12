import { NextRequest, NextResponse } from "next/server";
import { Consultation } from "@/models/consultation";
import { Patient } from "@/models/patient";
import { Assurance } from "@/models/assurance";
import { Medecin } from "@/models/medecin";
import { db } from "@/db/mongoConnect";


export async function GET(req: NextRequest) {
    await db();
    try {
        const { searchParams } = new URL(req.url);
        const patientId = searchParams.get("patientId");

        let query: any = {};
        if (patientId) {
            query.IdPatient = patientId;
        }

        const consultations = await Consultation.find(query)
            .populate("IDASSURANCE", "desiganationassurance")
            .populate("IdPatient", "Nom Prenoms")
            .populate("IDMEDECIN", "nom prenoms");

        return NextResponse.json(consultations);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


export async function POST(req: NextRequest) {
    await db();

    try {
        const data = await req.json();

        // ✅ Validation (selon WLangage)
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
            if (data.selectedAssurance === "" || !data.selectedAssurance) {
                return NextResponse.json({ error: "Merci de préciser l'assurance du patient SVP" }, { status: 400 });
            }
        }
        // ✅ Préparation de la consultation
        const patient = await Patient.findById(data.IdPatient);
        const assurance = data.selectedAssurance ? await Assurance.findById(data.selectedAssurance) : null;
        const medecin = await Medecin.findById(data.selectedMedecin);

        // Montants et calculs (tous en entiers)
        let montantActe = Math.round(data.montantClinique || 0);
        let partAssurance = 0;
        let Partassure = 0;
        let surplus = 0;
        let statutC = false;
        let statutPaiement = "En cours de Paiement";

        const tauxNum = Number(data.taux) || 0;

        // Calcul Part Assurance, Part Patient, Surplus
        if (data.assure === "mutualiste") {
            montantActe = Math.round(data.montantAssurance || montantActe);
        } else if (data.assure === "assure") {
            montantActe = Math.round(data.montantAssurance || montantActe);
        }

        if (data.montantClinique > montantActe) {
            surplus = Math.round(data.montantClinique - montantActe);
        }

        partAssurance = Math.round((tauxNum * montantActe) / 100);
        Partassure = montantActe - partAssurance;
        const totalPatient = Partassure + surplus;

        // Correction des champs obligatoires
        if (!patient || !patient.Code_dossier) {
            return NextResponse.json({ error: "Impossible de trouver le code dossier du patient." }, { status: 400 });
        }
        if (!data.Recupar || data.Recupar === "") {
            return NextResponse.json({ error: "Utilisateur (Recupar) manquant. Veuillez vous reconnecter." }, { status: 400 });
        }

        const consultation = new Consultation({
            designationC: data.selectedActeDesignation,
            assurance: assurance?.desiganationassurance || "NON ASSURE",
            Assure: data.assure === "non" ? "NON ASSURE" : data.assure === "mutualiste" ? "TARIF MUTUALISTE" : "TARIF ASSURE",
            IDASSURANCE: assurance?._id,


            Prix_Assurance: Math.round(montantActe),
            PrixClinique: Math.round(data.montantClinique || 0),
            Restapayer: Math.round(totalPatient),
            montantapayer: Math.round(Partassure + surplus),
            ReliquatPatient: Math.round(surplus),

            Code_dossier: patient.Code_dossier, // Toujours le code dossier du patient
            // CodePrestation: généré automatiquement par le modèle
            Date_consultation: data.Date_consultation || new Date(),
            Heure_Consultation: data.Heure_Consultation || new Date().toLocaleTimeString(),

            StatutC: data.montantClinique === 0 ? true : false,
            StatutPaiement: data.montantClinique === 0 ? "Pas facturé" : "En cours de Paiement",
            Toutencaisse: data.montantClinique === 0 ? true : false,

            tauxAssurance: tauxNum,
            PartAssurance: Math.round(partAssurance),
            tiket_moderateur: Math.round(Partassure),
            numero_carte: data.matricule,
            NumBon: data.NumBon,

            Recupar: data.Recupar, // Nom de l'utilisateur connecté
            IDACTE: data.selectedActe,
            IdPatient: patient?._id,
            Souscripteur: patient?.Souscripteur,
            PatientP: patient?.Nom + " " + patient?.Prenoms,
            SOCIETE_PATIENT: patient?.SOCIETE_PATIENT || data.societePatient,
            IDSOCIETEASSURANCE: patient?.IDSOCIETEASSURANCE || data.selectedAssurance,

            Medecin: medecin ? `${medecin.nom} ${medecin.prenoms}` : "",
            IDMEDECIN: medecin?._id,

            StatutPrescriptionMedecin: 2, // pour afficher l'acte dans la liste des actes prescrits
            AttenteAccueil: false, // Par défaut, le patient est en attente d'accueil
            attenteMedecin: 0, // Par défaut, le patient n'a pas encore vu le médecin
        });
        await consultation.save();

        return NextResponse.json({ success: true, consultation });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
