import { db } from '@/db/mongoConnect';

// Service pour la consultation
export const getDetailConsultation = async (ParamCode_consultation: string) => {
    const { Consultation } = await import("@/models/consultation");
    const { Patient } = await import("@/models/patient");

    // Recherche de la consultation
    const consultation = await Consultation.findOne({
        CodePrestation: ParamCode_consultation,
    }).populate('IdPatient', 'Nom Prenoms Contact sexe Age_partient Souscripteur SOCIETE_PATIENT DateNaissance');

    if (!consultation) {
        throw new Error("Consultation non trouvée");
    }

    // Récupérer les informations patient
    const patient = await Patient.findOne({
        _id: consultation.IdPatient
    });

    return {
        consultation: {
            Code_consultation: consultation.CodePrestation,
            designationC: consultation.designationC,
            Prix_consultation: consultation.Prix_Assurance,
            PartAssurance: consultation.PartAssurance,
            tiket_moderateur: consultation.tiket_moderateur,
            ReliquatPatient: consultation.ReliquatPatient,
            Restapayer: consultation.Restapayer,
            Code_dossier: consultation.Code_dossier,
            assurance: consultation.assurance,
            tauxAssurance: consultation.tauxAssurance,
            numero_carte: consultation.numero_carte,
            Date_consulation: consultation.Date_consulation,
            NumBon: consultation.NumBon,
            PrixClinique: consultation.PrixClinique,
            Medecin: consultation.Medecin,
            FacturéPar: consultation.Recupar,
            StatutC: consultation.StatutC,
            montantapayer: consultation.montantapayer,
            Toutencaisse: consultation.Toutencaisse,
            DateFacturation: consultation.DateFacturation,
            Modepaiement: consultation.Modepaiement,
            SOCIETE_PATIENT: consultation.SOCIETE_PATIENT,
            Caissiere: consultation.Caissiere
        },
        patient: patient
    };
};

// Service pour les examens
export const getDetailExamens = async (ParamCode_consultation: string) => {
    const { Consultation } = await import("@/models/consultation");
    const { Patient } = await import("@/models/patient");
    const { ExamenHospitalisation } = await import("@/models/examenHospit");
    const { LignePrestation } = await import("@/models/lignePrestation");

    // Recherche de la consultation
    const consultation = await Consultation.findOne({
        CodePrestation: ParamCode_consultation,
    });

    if (!consultation) {
        throw new Error("Consultation non trouvée");
    }

    // Récupérer les informations patient
    const patient = await Patient.findOne({
        _id: consultation.IdPatient
    });

    // Faire la jointure entre EXAMENS_HOSPITALISATION et LIGNE_PRESTATION
    const lignesPrestation = await LignePrestation.find({
        CodePrestation: ParamCode_consultation,
        statutPrescriptionMedecin: 3
    }).populate({
        path: 'idHospitalisation',
        model: 'ExamenHospitalisation'
    });

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
            DateConsultation: examen.DatePres || consultation.Date_consulation,
            
        });
    }

    // Trier par Désignationtypeacte comme dans la requête SQL
    examens.sort((a, b) => (a.Désignationtypeacte || '').localeCompare(b.Désignationtypeacte || ''));

    return {
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
            Souscripteur: consultation.SOCIETE_PATIENT,
            Matricule: consultation.numero_carte,
            NumBon: consultation.NumBon,
            TauxAssurance: consultation.tauxAssurance,
            Caissiere: consultation.Caissiere,
            ModePaiement: consultation.Modepaiement,                
        }
    };
};

// Service pour la pharmacie
export const getDetailPharmacie = async (ParamCode_consultation: string) => {
    const { Consultation } = await import("@/models/consultation");
    const { Patient } = await import("@/models/patient");
    const { Prescription } = await import("@/models/Prescription");
    const { PatientPrescription } = await import("@/models/PatientPrescription");

    // Recherche de la consultation
    const consultation = await Consultation.findOne({
        CodePrestation: ParamCode_consultation,
    });

    if (!consultation) {
        throw new Error("Consultation non trouvée");
    }

    // Récupérer les informations patient
    const patient = await Patient.findOne({
        _id: consultation.IdPatient
    });

    // Trouver une prescription liée au code visiteur
    const prescription = await Prescription.findOne({
        CodePrestation: ParamCode_consultation
    });

    let medicaments: any[] = [];
    
    // Si pas de prescription, retourner un tableau vide (pas d'erreur)
    if (prescription) {
        // Récupérer tous les PatientPrescription avec StatuPrescriptionMedecin: 3 liés à cette prescription
        const lignesPatientPrescription = await PatientPrescription.find({
            IDPRESCRIPTION: prescription._id.toString(),
            StatutPrescriptionMedecin: 3
        });

        for (const ligne of lignesPatientPrescription) {
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
                DateFacturation: dateFacturation,
                
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
    }

    return {
        medicaments: medicaments,
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
            Souscripteur: consultation.SOCIETE_PATIENT,
            Matricule: consultation.numero_carte,
            NumBon: consultation.NumBon,
            TauxAssurance: consultation.tauxAssurance,
            Caissiere: consultation.Caissiere,
            ModePaiement: consultation.Modepaiement,
        }
    };
};

// Service composite pour FactureDetailleActe
export const getFactureDetailleActe = async (ParamCode_consultation: string) => {
    await db();
    
    try {
        // D'abord récupérer les données de consultation
        const consultationData = await getDetailConsultation(ParamCode_consultation);
        
        // Exécuter les services en parallèle
        const [examensData, pharmacieData] = await Promise.all([
            getDetailExamens(ParamCode_consultation),
            getDetailPharmacie(ParamCode_consultation).catch(() => ({ 
                medicaments: []
            }))
        ]);

        // Combiner les données
        return {
            patient: consultationData.patient,
            consultation: consultationData.consultation,
            examens: examensData.examens,
            medicaments: pharmacieData.medicaments
        };

    } catch (error) {
        console.error('Erreur dans getFactureDetailleActe:', error);
        
        // Ne lever l'erreur que si la consultation n'existe pas
        if (error instanceof Error && error.message === "Consultation non trouvée") {
            throw error;
        }
        
        // Pour les autres erreurs, retourner une erreur serveur
        throw new Error('Erreur lors de la récupération des données');
    }
};
