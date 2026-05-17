import { NextRequest, NextResponse } from 'next/server';
import { LignePrestation } from '@/models/lignePrestation';
import { Patient } from '@/models/patient';
import { ParametreCRendu } from '@/models/ParametreCRendu';
import { db } from '@/db/mongoConnect';

export async function GET(request: NextRequest) {
  try {
    console.log('Début de l\'API Avalider');
    await db();
    console.log('Connexion à la base de données établie');
    
    const { searchParams } = new URL(request.url);
    const dateDebut = searchParams.get('dateDebut');
    const dateFin = searchParams.get('dateFin');
    const lettreCle = searchParams.get('lettreCle');

    // Logique WinDev exacte :
    // TableSupprimeTout(TABLE_LIGNE_PRESTATION)
    // POUR TOUT Parametre_CRendu 
    //    POUR TOUT LIGNE_PRESTATION AVEC LIGNE_PRESTATION.LettreCle=Parametre_CRendu.LettreCle
    //        SI LIGNE_PRESTATION.StatuPrescriptionMedecin=3 ET LIGNE_PRESTATION.CompterenduValidépar="" ALORS
    //        SI LIGNE_PRESTATION.Date_ligne_prestaion>=SAI_Debut ET LIGNE_PRESTATION.Date_ligne_prestaion<=SAI_Fin ALORS
    //            SI LIGNE_PRESTATION.IDPARTIENT=TABLE_PARTIENT.COL_IDPARTIENT ALORS
    //                TableAjouteLigne(TABLE_LIGNE_PRESTATION,...)
    
    // Étape 1 : Récupérer les paramètres de compte rendu (équivalent POUR TOUT Parametre_CRendu)
    console.log('Récupération des paramètres CR');
    const parametresCR = await ParametreCRendu.find({});
    console.log('Paramètres CR trouvés:', parametresCR.length);
    const lettresClesDisponibles = parametresCR.map(p => p.LettreCle);

    // Étape 2 : Construire la requête de base pour les lignes de prestations à valider
    let query: any = {
      // SI LIGNE_PRESTATION.StatuPrescriptionMedecin=3
      statutPrescriptionMedecin: 3,
      // ET LIGNE_PRESTATION.CompterenduValidépar=""
      compteRenduValidePar: { $in: [null, '', undefined] }
    };

    // Ajouter le filtre par lettres clés des paramètres CR
    if (lettresClesDisponibles.length > 0) {
      query.lettreCle = { $in: lettresClesDisponibles };
    }

    // Ajouter le filtre de lettre clé spécifique si fourni
    if (lettreCle) {
      query.lettreCle = lettreCle;
    }

    // Ajouter le filtre de dates (SI LIGNE_PRESTATION.Date_ligne_prestaion>=SAI_Debut ET LIGNE_PRESTATION.Date_ligne_prestaion<=SAI_Fin)
    if (dateDebut || dateFin) {
      query.dateLignePrestation = {};
      if (dateDebut) {
        query.dateLignePrestation.$gte = new Date(dateDebut);
      }
      if (dateFin) {
        query.dateLignePrestation.$lte = new Date(dateFin);
      }
    }

    // Récupérer les lignes de prestations (équivalent POUR TOUT LIGNE_PRESTATION)
    console.log('Requête lignes prestations:', JSON.stringify(query, null, 2));
    const lignePrestations = await LignePrestation.find(query)
      .populate('IdPatient', 'Nom Prenoms Contact Code_dossier Date_naisse')
      .sort({ dateLignePrestation: 1 }); // TableTrie(TABLE_LIGNE_PRESTATION,"+COL_Date")
    console.log('Lignes prestations trouvées:', lignePrestations.length);

    // Extraire les patients uniques
    const patientsMap = new Map<string, any>();
    const lignePrestationsFormatees = [];

    for (const ligne of lignePrestations) {
      const patient = ligne.IdPatient as any;

      // Ajouter le patient à la map s'il n'existe pas déjà
      const patientId = patient._id.toString();
      if (!patientsMap.has(patientId)) {
        patientsMap.set(patientId, {
          _id: patient._id,
          Nom: patient.Nom,
          Prenoms: patient.Prenoms,
          Contact: patient.Contact,
          Code_dossier: patient.Code_dossier,
          Date_naisse: patient.Date_naisse
        });
      }

      // Formater la ligne de prestation (TableAjouteLigne exact)
      lignePrestationsFormatees.push({
        // Correspond exactement aux champs du code WinDev :
        // LIGNE_PRESTATION.Date_ligne_prestaion,
        // LIGNE_PRESTATION.Nompatient,
        // LIGNE_PRESTATION.IDHOSPITALISATION,
        // LIGNE_PRESTATION.IDLIGNE_PRESTATION,
        // LIGNE_PRESTATION.Prestation,
        // LIGNE_PRESTATION.MedecinExécutant,
        // LIGNE_PRESTATION.Résultatsaisiepar,
        // LIGNE_PRESTATION.DatesaisieResultat,
        // LIGNE_PRESTATION.compterenduValidéLe,
        // LIGNE_PRESTATION.CompterenduValidépar,
        // LIGNE_PRESTATION.ActeMedecin
        Date_ligne_prestaion: ligne.dateLignePrestation,
        Nompatient: ligne.nomPatient,
        IDHOSPITALISATION: ligne.idHospitalisation,
        IDLIGNE_PRESTATION: ligne._id,
        Prestation: ligne.prestation,
        MedecinExécutant: ligne.medecinExecutant,
        Résultatsaisiepar: ligne.resultatSaisiePar,
        DatesaisieResultat: ligne.dateSaisieResultat,
        compterenduValidéLe: ligne.compteRenduValideLe,
        CompterenduValidépar: ligne.compteRenduValidePar,
        ActeMedecin: ligne.acteMedecin,
        // Champs supplémentaires pour l'affichage
        lettreCle: ligne.lettreCle,
        CodePrestation: ligne.CodePrestation,
        idActe: ligne.idActe,
        IdPatient: ligne.IdPatient,
        statutPrescriptionMedecin: ligne.statutPrescriptionMedecin
      });
    }

    // Convertir la map en tableau
    const patients = Array.from(patientsMap.values());

    return NextResponse.json({
      patients,
      lignePrestations: lignePrestationsFormatees
    });

  } catch (error: any) {
    console.error('Erreur détaillée dans Avalider:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { 
        error: 'Erreur lors du chargement des prestations à valider',
        details: error.message,
        lignePrestations: [],
        patients: []
      },
      { status: 500 }
    );
  }
}
