import { NextRequest, NextResponse } from 'next/server';
import { LignePrestation } from '@/models/lignePrestation';
import { Patient } from '@/models/patient';
import { ParametreCRendu } from '@/models/ParametreCRendu';
import { db } from '@/db/mongoConnect';

export async function GET(request: NextRequest) {
  try {
    await db();
    
    const { searchParams } = new URL(request.url);
    const dateDebut = searchParams.get('dateDebut');
    const dateFin = searchParams.get('dateFin');
    const lettreCle = searchParams.get('lettreCle');

    // Logique WinDev exacte :
    // TableSupprimeTout(TABLE_LIGNE_PRESTATION_VALIDE)
    // ON va regarder les lettre clé associé au compte rendu
    // POUR TOUT Parametre_CRendu 
    //    // on parcours les lignes prestations avec les mêmes paramètres de lettre clé
    //    POUR TOUT LIGNE_PRESTATION AVEC LIGNE_PRESTATION.LettreCle=Parametre_CRendu.LettreCle
    //        // on verifie si l'acte est deja payé et pas encore saisi
    //        SI LIGNE_PRESTATION.StatuPrescriptionMedecin=3 ET LIGNE_PRESTATION.CompterenduValidépar<>"" 
    //            // on verifie si la période
    //            SI LIGNE_PRESTATION.Date_ligne_prestaion>=SAI_Debut ET LIGNE_PRESTATION.Date_ligne_prestaion<=SAI_Fin ALORS
    //                // on vérifie la période de saisie		
    //                SI LIGNE_PRESTATION.IDPARTIENT=TABLE_PARTIENT.COL_IDPARTIENT ALORS
    //                    TableAjouteLigne(TABLE_LIGNE_PRESTATION,LIGNE_PRESTATION.Date_ligne_prestaion,LIGNE_PRESTATION.Nompatient,LIGNE_PRESTATION.IDHOSPITALISATION,LIGNE_PRESTATION.IDLIGNE_PRESTATION,LIGNE_PRESTATION.Prestation,LIGNE_PRESTATION.MedecinExécutant,LIGNE_PRESTATION.resultatsaisiepar,LIGNE_PRESTATION.DatesaisieResultat,LIGNE_PRESTATION.compterenduValidéLe,LIGNE_PRESTATION.CompterenduValidépar,LIGNE_PRESTATION.ActeMedecin)
    //                FIN
    //            FIN
    //        FIN	
    //        FIN	
    // FIN
    // TableTrie(TABLE_LIGNE_PRESTATION_VALIDE,"+COL_Date")
    
    // Étape 1 : Récupérer les paramètres de compte rendu (équivalent POUR TOUT Parametre_CRendu)
    const parametresCR = await ParametreCRendu.find({});
    const lettresClesDisponibles = parametresCR.map(p => p.LettreCle);

    // Étape 2 : Construire la requête de base pour les lignes de prestations validées
    // La requête MongoDB ci-dessous correspond exactement à la logique WinDev :
    // SI LIGNE_PRESTATION.StatuPrescriptionMedecin=3 ET LIGNE_PRESTATION.CompterenduValidépar<>""
    let query: any = {
      // SI LIGNE_PRESTATION.StatuPrescriptionMedecin=3 (statut 3 = validé selon WinDev)
      statutPrescriptionMedecin: 3,
      // ET LIGNE_PRESTATION.CompterenduValidépar<> "" (non vide = validé)
      compteRenduValidePar: { $ne: "", $exists: true }
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
    const lignePrestations = await LignePrestation.find(query)
      .populate('IdPatient', 'Nom Prenoms Contact Code_dossier Date_naisse')
      .sort({ dateLignePrestation: 1 }); // TableTrie(TABLE_LIGNE_PRESTATION,"+COL_Date")
    

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
      // Correspond exactement à : TableAjouteLigne(TABLE_LIGNE_PRESTATION,LIGNE_PRESTATION.Date_ligne_prestaion,LIGNE_PRESTATION.Nompatient,LIGNE_PRESTATION.IDHOSPITALISATION,LIGNE_PRESTATION.IDLIGNE_PRESTATION,LIGNE_PRESTATION.Prestation,LIGNE_PRESTATION.MedecinExécutant,LIGNE_PRESTATION.resultatsaisiepar,LIGNE_PRESTATION.DatesaisieResultat,LIGNE_PRESTATION.compterenduValidéLe,LIGNE_PRESTATION.CompterenduValidépar,LIGNE_PRESTATION.ActeMedecin)
      lignePrestationsFormatees.push({
        // LIGNE_PRESTATION.Date_ligne_prestaion
        Date_ligne_prestaion: ligne.dateLignePrestation,
        // LIGNE_PRESTATION.Nompatient
        Nompatient: ligne.nomPatient,
        // LIGNE_PRESTATION.IDHOSPITALISATION
        IDHOSPITALISATION: ligne.idHospitalisation,
        // LIGNE_PRESTATION.IDLIGNE_PRESTATION
        IDLIGNE_PRESTATION: ligne._id,
        // LIGNE_PRESTATION.Prestation
        Prestation: ligne.prestation,
        // LIGNE_PRESTATION.MedecinExécutant
        MedecinExécutant: ligne.medecinExecutant,
        // LIGNE_PRESTATION.resultatsaisiepar
        resultatsaisiepar: ligne.resultatSaisiePar,
        // LIGNE_PRESTATION.DatesaisieResultat
        DatesaisieResultat: ligne.dateSaisieResultat,
        // LIGNE_PRESTATION.compterenduValidéLe
        compterenduValidéLe: ligne.compteRenduValideLe,
        // LIGNE_PRESTATION.CompterenduValidépar
        CompterenduValidépar: ligne.compteRenduValidePar,
        // LIGNE_PRESTATION.ActeMedecin
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
    console.error('Erreur détaillée dans CompteRenduValides:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { 
        error: 'Erreur lors du chargement des prestations validées',
        details: error.message,
        lignePrestations: [],
        patients: []
      },
      { status: 500 }
    );
  }
}
