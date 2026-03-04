import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { PatientPrescription } from "@/models/PatientPrescription";

// GET /api/patientprescriptionFacture?reference=xxx&IDPRESCRIPTION=xxx&_id=xxx&Code_Prestation=xxx
export async function GET(request: Request) {
    await db();

    try {
        const { searchParams } = new URL(request.url);
        const reference = searchParams.get("reference");
        const IDPRESCRIPTION = searchParams.get("IDPRESCRIPTION");
        const IDPARTIENT = searchParams.get("IDPARTIENT");
        const _id = searchParams.get("_id");
        const Code_Prestation = searchParams.get("Code_Prestation");

        let query: any = {};

        if (reference) query.Reference = reference;
        if (IDPRESCRIPTION) query.IDPRESCRIPTION = IDPRESCRIPTION;
        if (IDPARTIENT) query.IDPARTIENT = IDPARTIENT;
        if (_id) query._id = _id;
        if (Code_Prestation) query.CodePrestation = Code_Prestation;

        const patientPrescriptions = await PatientPrescription.find(query).lean();

        return NextResponse.json(patientPrescriptions);
    } catch (error: any) {
        console.error("Erreur GET /api/patientprescriptionFacture:", error);
        return NextResponse.json({
            error: "Erreur lors de la récupération des prescriptions patient",
            details: error.message
        }, { status: 500 });
    }
}

// POST /api/patientprescriptionFacture - Créer une nouvelle prescription patient
export async function POST(request: NextRequest) {
    await db();

    try {
        const body = await request.json();

        // Validation des champs requis
        if (!body.IDPRESCRIPTION) {
            return NextResponse.json({
                error: "IDPRESCRIPTION est requis",
                details: "Le champ IDPRESCRIPTION est manquant"
            }, { status: 400 });
        }

        if (!body.PatientP) {
            return NextResponse.json({
                error: "PatientP est requis",
                details: "Le champ PatientP (nom du patient) est manquant"
            }, { status: 400 });
        }

        if (!body.CodePrestation) {
            return NextResponse.json({
                error: "CodePrestation est requis",
                details: "Le champ CodePrestation est manquant"
            }, { status: 400 });
        }

        // Mapper les champs et gérer les ObjectId
        const patientPrescriptionData: any = {
            IDPRESCRIPTION: body.IDPRESCRIPTION,
            PatientP: body.PatientP || "",
            QteP: Number(body.QteP) || 1,
            posologie: body.posologie || "",
            DatePres: body.DatePres ? new Date(body.DatePres) : new Date(),
            prixUnitaire: Number(body.prixUnitaire) || 0,
            prixTotal: Number(body.prixTotal) || 0,
            nomMedicament: body.nomMedicament || "",
            partAssurance: Number(body.partAssurance) || 0,
            partAssure: Number(body.partAssure) || 0,
            CodePrestation: body.CodePrestation,
            // Champs optionnels
            reference: body.reference,
            IDPARTIENT: body.IDPARTIENT,
            exclusionActe: body.exclusionActe,
            statutPrescriptionMedecin: Number(body.statutPrescriptionMedecin) || 2,
            actePayeCaisse: body.actePayeCaisse,
            heureFacturation: body.heureFacturation,
        };

        // Gérer le _id personnalisé si fourni
        if (body._id && body._id.trim() !== "") {
            patientPrescriptionData._id = body._id;
        }

        // priseCharge doit être un Number, pas un string (ID)
        // Ne pas mapper IDpriseCharge vers priseCharge car IDpriseCharge est un string (ID)
        // Ne l'inclure que si c'est un nombre valide
        if (body.priseCharge !== undefined && body.priseCharge !== null && body.priseCharge !== "") {
            const priseChargeNum = Number(body.priseCharge);
            if (!isNaN(priseChargeNum) && typeof body.priseCharge !== 'string') {
                patientPrescriptionData.priseCharge = priseChargeNum;
            }
        }
        // Ignorer IDpriseCharge car c'est un identifiant (string), pas un montant (number)

        // Gérer les champs ObjectId - ne les inclure que s'ils sont valides
        if (body.medicament && body.medicament.trim() !== "" && body.medicament !== "undefined") {
            try {
                patientPrescriptionData.medicament = body.medicament;
            } catch (e) {
                console.warn("Erreur lors de la conversion de medicament en ObjectId:", e);
            }
        }

        if (body.facturation && body.facturation.trim() !== "" && body.facturation !== "undefined") {
            try {
                patientPrescriptionData.facturation = body.facturation;
            } catch (e) {
                console.warn("Erreur lors de la conversion de facturation en ObjectId:", e);
            }
        }

        console.log("📤 Création patientprescription avec données:", patientPrescriptionData);

        // Créer une nouvelle prescription patient
        const newPatientPrescription = await PatientPrescription.create(patientPrescriptionData);

        return NextResponse.json({
            success: true,
            data: newPatientPrescription,
            message: "Prescription patient créée avec succès"
        }, { status: 201 });
    } catch (error: any) {
        console.error("Erreur POST /api/patientprescriptionFacture:", error);
        console.error("Détails de l'erreur:", error.message);
        console.error("Stack:", error.stack);
        return NextResponse.json({
            error: "Erreur lors de la création de la prescription patient",
            details: error.message
        }, { status: 500 });
    }
}
