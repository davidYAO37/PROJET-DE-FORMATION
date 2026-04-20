import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/mongoConnect';
import { Consultation } from '@/models/consultation';
import { Patient } from '@/models/patient';
import { ExamenHospitalisation } from '@/models/examenHospit';
import { LignePrestation } from '@/models/lignePrestation';

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

        const database = await db();
        
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

        // Récupérer les informations d'hospitalisation et examens
        // Faire la jointure entre EXAMENS_HOSPITALISATION et LIGNE_PRESTATION
        // Selon la requête SQL: EXAMENS_HOSPITALISATION.IDHOSPITALISATION = LIGNE_PRESTATION.IDHOSPITALISATION
        const lignesPrestation = await LignePrestation.find({
            CodePrestation: ParamCODEcONSULTATION,
            statutPrescriptionMedecin: 3
        }).populate({
            path: 'idHospitalisation',
            model: 'ExamenHospitalisation'
        });

        // Construire les données d'examens selon la structure SQL exacte
        const examens = [];
        
        for (const ligne of lignesPrestation) {
            const examen = ligne.idHospitalisation as any;
            if (!examen) continue;
            
            // Calculer les valeurs selon la logique SQL
            const prix = Number(ligne.prix) || 0;
            const qte = Number(ligne.qte) || 1;
            const coef = Number(ligne.coefficientActe) || 1;
            const prixTotal = prix * qte * coef;
            
            // Calculer la part assurance et part assuré selon le taux
            const tauxAssurance = Number(ligne.tauxAssurance) || 0;
            const partAssurance = prixTotal * (tauxAssurance / 100);
            const partAssuré = prixTotal - partAssurance;

            // Utiliser la date de consultation comme date de facturation si non disponible
            const dateFacturation = ligne.datePaiementCaisse || 
                examen.DatePres || 
                consultation.Date_consulation || 
                new Date().toISOString().split('T')[0];

            examens.push({
                CODEcONSULTATION: examen.CodePrestation,
                StatuPrescriptionMedecin: examen.statutPrescriptionMedecin,
                reduction: Number(examen.reduction) || 0,
                Désignationtypeacte: examen.Designationtypeacte || ligne.prestation || '',
                Taux: Number(examen.Taux) || 0,
                Prestation: ligne.prestation || '',
                Qte: qte,
                CoefficientActe: coef,
                Prix: prix,
                PartAssurance: ligne.partAssurance,
                Partassuré: ligne.montantTotalAPayer,
                NomMed: examen.NomMed || '',
                totalsurplus: Number(ligne.totalSurplus) || 0,
                PrixTotal: prixTotal,
                StatuPrescriptionMedecin_LI: ligne.statutPrescriptionMedecin,
                TotalapayerPatient: Number(examen.TotalapayerPatient) || 0,
                MontanttotalApayer: Number(ligne.montantTotalAPayer) || prixTotal,
                Datepaiementcaisse: dateFacturation,
                tauxAssurance: tauxAssurance,
                // Ajouter la date de consultation pour le tri
                DateConsultation: examen.DatePres || consultation.Date_consulation
            });
        }

        // Trier par Désignationtypeacte comme dans la requête SQL
        examens.sort((a, b) => (a.Désignationtypeacte || '').localeCompare(b.Désignationtypeacte || ''));

        // Construire la réponse avec les informations patient et assurance
        const responseData = {
            examens: examens,
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
                ASSURANCE: consultation.assurance || '',
                Code_consultation: consultation.CodePrestation,
                Prix_consultation: consultation.PrixClinique || 0,
                montantapayer: consultation.montantapayer || 0,
                Souscripteur:consultation.SOCIETE_PATIENT,
                Matricule: consultation.numero_carte,
                NumBon:consultation.NumBon,
                TauxAssurance:consultation.tauxAssurance,
                Caissiere:consultation.Caissiere,
                ModePaiement: consultation.Modepaiement,                
            }
        };

        return NextResponse.json(responseData);

    } catch (error) {
        console.error('Erreur dans DetailFactureExamenActe:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
