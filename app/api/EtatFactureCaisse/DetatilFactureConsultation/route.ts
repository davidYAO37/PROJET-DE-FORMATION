import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";

export async function GET(req: NextRequest) {
    try {
        await db();
        
        const { searchParams } = new URL(req.url);
        const ParamCode_consultation = searchParams.get("ParamCode_consultation");

        if (!ParamCode_consultation) {
            return NextResponse.json({ error: "Le paramètre ParamCode_consultation est requis" }, { status: 400 });
        }

        // Importer les modèles dynamiquement après la connexion
        const { Consultation } = await import("@/models/consultation");
        const { Patient } = await import("@/models/patient");

        // Recherche de la consultation avec les critères spécifiés
        const consultation = await Consultation.findOne({
            CodePrestation: ParamCode_consultation,
        }).populate('IdPatient', 'Nom Prenoms Contact sexe Age_partient Souscripteur SOCIETE_PATIENT');

        if (!consultation) {
            return NextResponse.json({ error: "Consultation non trouvée" }, { status: 404 });
        }

        // Construction des données selon la structure SQL
        const factureData = {
            // Données de consultation
            Code_consultation: consultation.CodePrestation,
            designationC: consultation.designationC,
            Prix_consultation: consultation.Prix_Assurance,
            PartAssurance: consultation.PartAssurance,
            tiket_moderateur: consultation.tiket_moderateur,
            ReliquatPatient: consultation.ReliquatPatient,
            Restapayer: consultation.Restapayer,
            Code_dossier: consultation.Code_dossier,
            ASSURANCE: consultation.assurance,
            tauxAssurance: consultation.tauxAssurance,
            numero_carte: consultation.numero_carte,
            Date_consulation: consultation.Date_consulation,
            NumBon: consultation.NumBon,
            PrixClinique: consultation.PrixClinique,
            Medecin_CO: consultation.Medecin,
            NCC: '', // Champ non existant dans le modèle
            FacturéPar: consultation.Recupar, // Utiliser Recupar au lieu de FacturéPar
            StatutC: consultation.StatutC,
            montantapayer: consultation.montantapayer,
            Toutencaisse: consultation.Toutencaisse,
            DateFacturation: consultation.DateFacturation,
            
            // Données patient (peuplées via populate)
            Nom: consultation.PatientP,
            Contact: (consultation.IdPatient as any)?.Contact,
            Sexe: (consultation.IdPatient as any)?.sexe,
            Age_partient: (consultation.IdPatient as any)?.Age_partient,
            Souscripteur: (consultation.IdPatient as any)?.Souscripteur,
            SOCIETE_PATIENT: (consultation.IdPatient as any)?.SOCIETE_PATIENT
        };

        return NextResponse.json(factureData);
    } catch (error: any) {
        console.error("Erreur dans DetatilFactureConsultation:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await db();
        
        // Importer les modèles dynamiquement après la connexion
        const { Consultation } = await import("@/models/consultation");
        const { Patient } = await import("@/models/patient");
        
        const data = await req.json();
        const { ParamCode_consultation } = data;

        if (!ParamCode_consultation) {
            return NextResponse.json({ error: "Le paramètre ParamCode_consultation est requis" }, { status: 400 });
        }

        // Recherche de la consultation avec les critères spécifiés
        const consultation = await Consultation.findOne({
            CodePrestation: ParamCode_consultation,
        }).populate('IdPatient', 'Nom Prenoms Contact sexe Age_partient Souscripteur SOCIETE_PATIENT');

        if (!consultation) {
            return NextResponse.json({ error: "Consultation non trouvée" }, { status: 404 });
        }

        // Construction des données selon la structure SQL
        const factureData = {
            // Données de consultation
            Code_consultation: consultation.CodePrestation,
            designationC: consultation.designationC,
            Prix_consultation: consultation.Prix_Assurance,
            PartAssurance: consultation.PartAssurance,
            tiket_moderateur: consultation.tiket_moderateur,
            ReliquatPatient: consultation.ReliquatPatient,
            Restapayer: consultation.Restapayer,
            Code_dossier: consultation.Code_dossier,
            ASSURANCE: consultation.assurance,
            tauxAssurance: consultation.tauxAssurance,
            numero_carte: consultation.numero_carte,
            Date_consulation: consultation.Date_consulation,
            NumBon: consultation.NumBon,
            PrixClinique: consultation.PrixClinique,
            Medecin_CO: consultation.Medecin,
            NCC: '', // Champ non existant dans le modèle
            FacturéPar: consultation.Recupar, // Utiliser Recupar au lieu de FacturéPar
            StatutC: consultation.StatutC,
            montantapayer: consultation.montantapayer,
            Toutencaisse: consultation.Toutencaisse,
            DateFacturation: consultation.DateFacturation,
            
            // Données patient (peuplées via populate)
            Nom: consultation.PatientP,
            Contact: (consultation.IdPatient as any)?.Contact,
            Sexe: (consultation.IdPatient as any)?.sexe,
            Age_partient: (consultation.IdPatient as any)?.Age_partient,
            Souscripteur: (consultation.IdPatient as any)?.Souscripteur,
            SOCIETE_PATIENT: (consultation.IdPatient as any)?.SOCIETE_PATIENT
        };

        return NextResponse.json(factureData);
    } catch (error: any) {
        console.error("Erreur dans DetatilFactureConsultation POST:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
