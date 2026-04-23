import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/mongoConnect';
import { Consultation } from '@/models/consultation';
import { Patient } from '@/models/patient';
import { Prescription } from '@/models/Prescription';
import { PatientPrescription } from '@/models/PatientPrescription';

export async function GET(req: NextRequest) {
    await db();
    
    try {
        const { searchParams } = new URL(req.url);
        const ParamCODEcONSULTATION = searchParams.get('ParamCODEcONSULTATION');

        if (!ParamCODEcONSULTATION) {
            return NextResponse.json(
                { error: 'ParamCODEcONSULTATION est requis' },
                { status: 400 }
            );
        }

        // Récupérer les informations consultation depuis la collection Consultation
        const consultation = await Consultation.findOne({
            CodePrestation: ParamCODEcONSULTATION
        });

        if (!consultation) {
            return NextResponse.json(
                { error: 'Consultation non trouvée' },
                { status: 404 }
            );
        }

        // Récupérer les informations patient
        const patient = await Patient.findOne({
            _id: consultation.IdPatient
        });

        // Trouver une prescription liée au code visiteur
        const prescription = await Prescription.findOne({
            CodePrestation: ParamCODEcONSULTATION
        });

        if (!prescription) {
            return NextResponse.json(
                { error: 'Prescription non trouvée' },
                { status: 404 }
            );
        }

        // Récupérer tous les PatientPrescription avec StatuPrescriptionMedecin: 3 liés à cette prescription
        const lignesPatientPrescription = await PatientPrescription.find({
            IDPRESCRIPTION: prescription._id.toString(),
            StatutPrescriptionMedecin: 3
        });

        // Construire les données de pharmacie selon la structure exacte de la requête SQL
        const medicaments = [];
        
        for (const ligne of lignesPatientPrescription) {
            // Utiliser la prescription trouvée
            
            // Utiliser les champs exacts de la requête SQL
            const QtéP = Number(ligne.QteP) || 1;
            const prixunitaire = Number(ligne.prixUnitaire) || 0;
            const PrixTotal = Number(ligne.prixTotal) || (QtéP * prixunitaire);
            const Taux = Number(prescription.Taux) || 0;
            const PartAssurance = Number(ligne.partAssurance) || 0;
            const Partassuré = Number(ligne.partAssure) || 0;

            // Date de facturation (utiliser datePaiement ou DatePres)
            const dateFacturation = ligne.datePaiement?.toISOString().split('T')[0] || 
                ligne.DatePres?.toISOString().split('T')[0] || 
                prescription.DatePres?.toISOString().split('T')[0] || 
                new Date().toISOString().split('T')[0];

            medicaments.push({
                // Champs exacts de la requête SQL
                Code_consultation: prescription.CodePrestation,
                Designation: prescription.Designation,
                Taux: Taux,
                nomMedicament: ligne.nomMedicament,
                QtéP: QtéP,
                prixunitaire: prixunitaire,
                PartAssurance: PartAssurance,
                Partassuré: Partassuré,
                PrixTotal: PrixTotal,
                Payele: prescription.Payele,
                REMISE: prescription.Remise || 0,
                
                // Champs additionnels pour le composant
                Datepaiementcaisse: dateFacturation,
                DateConsultation: prescription.DatePres || consultation.Date_consulation,
                CODEcONSULTATION: prescription.CodePrestation,
                StatuPrescriptionMedecin: prescription.StatuPrescriptionMedecin,
                Prestation: ligne.nomMedicament,
                Qte: QtéP,
                Prix: prixunitaire,
                PartPatient: Partassuré,
                NomMed: consultation.Medecin || '',
                StatuPrescriptionMedecin_LI: prescription.StatuPrescriptionMedecin,
                TotalapayerPatient: PrixTotal,
                MontanttotalApayer: PrixTotal,
                posologie: ligne.posologie || '',
                medicamentId: ligne.medicament?._id,
                IDPRESCRIPTION: ligne.IDPRESCRIPTION
            });
        }

       
        // Construire la réponse avec les informations patient et consultation
        const responseData = {
            examens: medicaments, // Garder le nom "examens" pour compatibilité frontend
            patient: {
                Nom: patient?.Nom || '',
                Prenom: patient?.Prenoms || '',
                Contact: patient?.Contact || '',
                DateNaissance: patient?.Date_naisse || '',
                Sexe: patient?.sexe || ''
            },
            consultation: {
                CodePrestation: consultation.CodePrestation,
                DateConsultation: consultation.Date_consulation,
                assurance: consultation.assurance || '',
                Code_consultation: consultation.CodePrestation,
                Prix_consultation: consultation.PrixClinique || 0,
                montantapayer: consultation.montantapayer || 0,
                souscripteur: consultation.SOCIETE_PATIENT,
                numero_carte: consultation.numero_carte,
                numero_bon: consultation.NumBon,
                taux_assurance: consultation.tauxAssurance,
                Caissiere: consultation.Caissiere,
                ModePaiement: consultation.Modepaiement,                
            }
        };

        return NextResponse.json(responseData);

    } catch (error) {
        console.error('Erreur dans DetailFacturePharmacie:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}