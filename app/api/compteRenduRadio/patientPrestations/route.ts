import { NextRequest, NextResponse } from 'next/server';
import { LignePrestation } from '@/models/lignePrestation';
import { ParametreCRendu } from '@/models/ParametreCRendu';
import { db } from '@/db/mongoConnect';

export async function GET(request: NextRequest) {
  try {
    await db();
    
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const dateDebut = searchParams.get('dateDebut');
    const dateFin = searchParams.get('dateFin');

    if (!patientId) {
      return NextResponse.json(
        { error: 'patientId est requis' },
        { status: 400 }
      );
    }

    // Logique WinDev exacte :
    // 1. TableSupprimeTout(TABLE_LIGNE_PRESTATION_patient)
    // 2. POUR TOUT Parametre_CRendu 
    // 3.    POUR TOUT LIGNE_PRESTATION AVEC LIGNE_PRESTATION.LettreCle=Parametre_CRendu.LettreCle
    // 4.        SI LIGNE_PRESTATION.IDPARTIENT=TABLE_PARTIENT.COL_IDPARTIENT ALORS
    // 5.            TableAjouteLigne(TABLE_LIGNE_PRESTATION_patient,...)
    
    // Étape 1 : Récupérer les paramètres de compte rendu (équivalent POUR TOUT Parametre_CRendu)
    const parametresCR = await ParametreCRendu.find({});
    const lettresCles = parametresCR.map(p => p.LettreCle);

    // Étape 2 : Construire la requête de base pour les lignes de prestations
    let query: any = {
      IdPatient: patientId,
      actePayeCaisse: 'Payé'
    };

    // Ajouter le filtre par lettres clés des paramètres CR
    if (lettresCles.length > 0) {
      query.lettreCle = { $in: lettresCles };
    }

    // Ajouter le filtre de dates (période de saisie)
    if (dateDebut || dateFin) {
      query.dateLignePrestation = {};
      if (dateDebut) {
        query.dateLignePrestation.$gte = new Date(dateDebut);
      }
      if (dateFin) {
        query.dateLignePrestation.$lte = new Date(dateFin);
      }
    }

    // Étape 3 : Récupérer les lignes de prestations (équivalent POUR TOUT LIGNE_PRESTATION)
    const lignePrestations = await LignePrestation.find(query)
      .sort({ dateLignePrestation: 1 }); // TableTrie(TABLE_LIGNE_PRESTATION,"+COL_Date")

    // Étape 4 : Formater les données (équivalent TableAjouteLigne)
    const formattedPrestations = lignePrestations.map(ligne => ({
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
      idActe: ligne.idActe
    }));

    return NextResponse.json({
      lignePrestations: formattedPrestations,
      total: formattedPrestations.length
    });

  } catch (error: any) {
    console.error('Erreur dans patientPrestations:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des prestations du patient' },
      { status: 500 }
    );
  }
}
