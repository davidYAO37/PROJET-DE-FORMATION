import { NextResponse } from 'next/server';
import { db } from '@/db/mongoConnect';
import { Consultation } from '@/models/consultation';
import { ExamenHospitalisation } from '@/models/examenHospit';
import { LignePrestation } from '@/models/lignePrestation';
import { Prescription } from '@/models/Prescription';
import { PatientPrescription } from '@/models/PatientPrescription';

export async function POST(request: Request) {
    try {
        await db();
        
        const { dateDebut, dateFin } = await request.json();

        // Validation des paramètres - correspond au code WinDev
        if (!dateDebut || !dateFin) {
            return NextResponse.json(
                { error: 'Veuillez saisir votre période de recherche' },
                { status: 400 }
            );
        }

        const debut = new Date(dateDebut);
        debut.setHours(0, 0, 0, 0); // Début de journée à 00:00:00
    
        const fin = new Date(dateFin);
        fin.setHours(23, 59, 59, 999); // Fin de journée à 23:59:59

        if (debut > fin) {
            return NextResponse.json(
                { error: 'Mauvaise période. Merci de saisir la bonne période de recherche avant cette opération' },
                { status: 400 }
            );
        }

        // Initialiser le tableau des résultats - correspond à TABLE_POINT_DE_SAISIE.SupprimeTout()
        const results: any[] = [];

        // 1. Parcourir toutes les consultations dans la période POUR TOUT CONSULTATION
        // SI CONSULTATION.Date_consulation>= SAI_Debut ET CONSULTATION.Date_consulation<= SAI_Fin ALORS
        const consultationsQuery: any = {
            Date_consulation: { $gte: debut, $lte: fin }
        };

        const consultations = await Consultation.find(consultationsQuery);

        // TableAjouteLigne(TABLE_POINT_DE_SAISIE,CONSULTATION.Date_consulation,CONSULTATION.PatientP+"=>"+CONSULTATION.Code_Prestation,CONSULTATION.designationC,CONSULTATION.PrixClinique,CONSULTATION.tiket_moderateur,CONSULTATION.PartAssurance,CONSULTATION.Recupar,CONSULTATION.StatutPaiement)
        consultations.forEach((consultation: any) => {
          let statutPaiement = '';
                    switch(consultation.statutPrescriptionMedecin) {
                        case 1:
                            statutPaiement = 'Pas Facturé';
                            break;
                        case 2:
                            statutPaiement = 'En cours';
                            break;
                        case 3:
                            statutPaiement = 'Facturé';
                            break;
                        default:
                            statutPaiement = consultation.StatutPaiement || 'Pas Facturé';
                    }
            results.push({
                id: `CONS_${consultation._id}`,
                date: consultation.Date_consulation.toISOString().split('T')[0],
                patientPrestation: `${consultation.PatientP}=>${consultation.CodePrestation}`,
                designation: consultation.designationC || '',
                prixClinique: consultation.PrixClinique?.toString() || '0',
                ticketModerateur: consultation.tiket_moderateur?.toString() || '0',
                partAssurance: consultation.PartAssurance?.toString() || '0',
                statutPaiement: statutPaiement,
                saisiPar: consultation.Recupar || '',
                type: 'CONSULTATION',
            });
        });

        // 2. Parcourir les examens hospitalisation liés aux consultations
        // POUR TOUT EXAMENS_HOSPITALISATION AVEC Code_Prestation=CONSULTATION.Code_Prestation
        for (const consultation of consultations) {
            const examensQuery: any = {
                CodePrestation: consultation.CodePrestation,
                DatePres: { $gte: debut, $lte: fin }
            };

            const examensHospitalisation = await ExamenHospitalisation.find(examensQuery);

            // Ajouter les examens hospitalisation
            for (const examen of examensHospitalisation) {
                // SI EXAMENS_HOSPITALISATION.DatePres>= SAI_Debut ET EXAMENS_HOSPITALISATION.DatePres<= SAI_Fin ALORS
                results.push({
                    id: `EXAM_${examen._id}`,
                    date: examen.DatePres?.toISOString().split('T')[0] || '',
                    patientPrestation: `${examen.PatientP}=>${examen.CodePrestation}`,
                    designation: examen.Designationtypeacte || '',
                    prixClinique: '',
                    ticketModerateur: '',
                    partAssurance: '',
                    statutPaiement: '',
                    saisiPar: examen.SaisiPar || '',
                    type: 'EXAMEN_HOSPITALISATION',
                });

                // TableAjouteLigne(TABLE_POINT_DE_SAISIE,EXAMENS_HOSPITALISATION.DatePres,EXAMENS_HOSPITALISATION.PatientP+"=>"+EXAMENS_HOSPITALISATION.Code_Prestation,EXAMENS_HOSPITALISATION.Désignationtypeacte,"","","",EXAMENS_HOSPITALISATION.SaisiPar)
                // Ajouter les lignes de prestation associées
                // POUR TOUTE LIGNE_PRESTATION AVEC Code_Prestation= EXAMENS_HOSPITALISATION.Code_Prestation
                // SI LIGNE_PRESTATION.IDHOSPITALISATION=EXAMENS_HOSPITALISATION.IDHOSPITALISATION
                const lignesPrestation = await LignePrestation.find({
                    CodePrestation: examen.CodePrestation,
                    idHospitalisation: examen._id,
                });

                lignesPrestation.forEach((ligne: any) => {
                    // TableAjouteLigne(TABLE_POINT_DE_SAISIE,LIGNE_PRESTATION.Date_ligne_prestaion,"""",LIGNE_PRESTATION.Prestation,LIGNE_PRESTATION.PrixTotal+LIGNE_PRESTATION.totalsurplus,LIGNE_PRESTATION.MontanttotalApayer,LIGNE_PRESTATION.PartAssurance,"",LIGNE_PRESTATION.ACTEPAYECAISSE)
                    // Déterminer le statut selon statutPrescriptionMedecin
                        let statutPaiement = '';
                        switch(ligne.statutPrescriptionMedecin) {
                            case 1:
                                statutPaiement = 'Pas Facturé';
                                break;
                            case 2:
                                statutPaiement = 'En cours';
                                break;
                            case 3:
                                statutPaiement = 'Facturé';
                                break;
                            default:
                                statutPaiement = ligne.actePayeCaisse || 'Pas Facturé';
                        }

                        results.push({
                            id: `LIGNE_${ligne._id}`,
                            date: ligne.dateLignePrestation?.toISOString().split('T')[0] || '',
                            patientPrestation: '',
                            designation: ligne.prestation || '',
                            prixClinique: ((ligne.prixTotal || 0) + (ligne.totalSurplus || 0)).toString(),
                            ticketModerateur: ligne.montantTotalAPayer?.toString() || '0',
                            partAssurance: ligne.partAssurance?.toString() || '0',
                            statutPaiement: statutPaiement,
                            saisiPar: '',
                            type: 'LIGNE_PRESTATION',
                        });
                });
            }
        }

        // 3. Parcourir les prescriptions liées aux consultations
        // POUR TOUT PRESCRIPTION AVEC Code_Prestation=CONSULTATION.Code_Prestation
        for (const consultation of consultations) {
            const prescriptionsQuery: any = {
                CodePrestation: consultation.CodePrestation,
                DatePres: { $gte: debut, $lte: fin }
            };

            const prescriptions = await Prescription.find(prescriptionsQuery);

            // Ajouter les prescriptions
            for (const prescription of prescriptions) {
                // SI PRESCRIPTION.DatePres>= SAI_Debut ET PRESCRIPTION.DatePres<= SAI_Fin ALORS
                results.push({
                    id: `PRES_${prescription._id}`,
                    date: prescription.DatePres?.toISOString().split('T')[0] || '',
                    patientPrestation: `${prescription.PatientP}=>${prescription.CodePrestation}`,
                    designation: prescription.Designation || '',
                    prixClinique: '',
                    ticketModerateur: '',
                    partAssurance: '',
                    statutPaiement: '',
                    saisiPar: prescription.SaisiPar || '',
                    type: 'PRESCRIPTION',
                });

                // TableAjouteLigne(TABLE_POINT_DE_SAISIE,PRESCRIPTION.DatePres,PRESCRIPTION.PatientP+"=>"+PRESCRIPTION.Code_Prestation,PRESCRIPTION.Designation,"","","",PRESCRIPTION.SaisiPar)
                // Ajouter les lignes de prescription associées
                // POUR TOUTE PARTIENT_PRESCRIPTION AVEC Code_Prestation= PRESCRIPTION.Code_Prestation
                // SI PARTIENT_PRESCRIPTION.IDPRESCRIPTION=PRESCRIPTION.IDPRESCRIPTION
                const lignesPrescription = await PatientPrescription.find({
                    CodePrestation: prescription.CodePrestation,
                    IDPRESCRIPTION: prescription._id.toString(),
                });

                lignesPrescription.forEach((ligne: any) => {
                    // TableAjouteLigne(TABLE_POINT_DE_SAISIE,PARTIENT_PRESCRIPTION.DatePres,"""",PARTIENT_PRESCRIPTION.nomMedicament,PARTIENT_PRESCRIPTION.PrixTotal,PARTIENT_PRESCRIPTION.Partassuré,PARTIENT_PRESCRIPTION.PartAssurance,"",PARTIENT_PRESCRIPTION.ACTEPAYECAISSE)
                    // Déterminer le statut selon StatutPrescriptionMedecin
                    let statutPaiement = '';
                    switch(ligne.StatutPrescriptionMedecin) {
                        case 1:
                            statutPaiement = 'Pas Facturé';
                            break;
                        case 2:
                            statutPaiement = 'En cours';
                            break;
                        case 3:
                            statutPaiement = 'Facturé';
                            break;
                        default:
                            statutPaiement = ligne.actePayeCaisse || 'Pas Facturé';
                    }

                    results.push({
                        id: `LIGNE_PRES_${ligne._id}`,
                        date: ligne.DatePres?.toISOString().split('T')[0] || '',
                        patientPrestation: '',
                        designation: ligne.nomMedicament || '',
                        prixClinique: ligne.prixTotal?.toString() || '0',
                        ticketModerateur: ligne.partAssure?.toString() || '0',
                        partAssurance: ligne.partAssurance?.toString() || '0',
                        statutPaiement: statutPaiement,
                        saisiPar: '',
                        type: 'LIGNE_PRESCRIPTION',
                    });
                });
            }
        }

        // Trier les résultats par date
        results.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return NextResponse.json({
            success: true,
            data: results,
            count: results.length,
        });

    } catch (error) {
        console.error('Erreur lors de la recherche des données de point de saisie:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la recherche des données' },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'API Point de Saisie - Utilisez POST pour rechercher des données',
        endpoints: {
            POST: 'Rechercher des données par période et/ou utilisateur',
            body: {
                dateDebut: 'YYYY-MM-DD (requis)',
                dateFin: 'YYYY-MM-DD (requis)'
            }
        }
    });
}

