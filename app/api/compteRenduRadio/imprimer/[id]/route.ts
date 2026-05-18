import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/mongoConnect';
import { LignePrestation } from '@/models/lignePrestation';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await db();
    
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID de la ligne de prestation requis' },
        { status: 400 }
      );
    }

    // Logique WinDev : Requête REQ_RESULTAT_RADIO_SOLO
    // SELECT avec JOIN entre EXAMENS_HOSPITALISATION et LIGNE_PRESTATION
    const ligne = await LignePrestation.findById(id).lean();

    if (!ligne) {
      return NextResponse.json(
        { error: 'Ligne de prestation non trouvée' },
        { status: 404 }
      );
    }

    // Logique WinDev : SI LIGNE_PRESTATION.resultatacte <> ''
    // Utiliser fallbacks pour compatibilité avec différents formats de champs
    const resultatActe = ligne.resultatActe;
    
    if (!resultatActe || resultatActe.trim() === "") {
      return NextResponse.json(
        { 
          error: 'Aucun résultat à imprimer',
          code: 'NO_RESULTAT_A_IMPRIMER'
        },
        { status: 400 }
      );
    }

    // Construire les données d'impression selon la requête WinDev
    const donneesImpression = {
      // SELECT LIGNE_PRESTATION.Prestation AS Prestation
      Prestation: ligne.prestation || "",
      // SELECT LIGNE_PRESTATION.resultatacte AS resultatacte
      resultatacte: resultatActe,
      // SELECT LIGNE_PRESTATION.ObservationExame AS ObservationExame
      ObservationExame: ligne.observationExamen || "",
      // SELECT EXAMENS_HOSPITALISATION.IDHOSPITALISATION AS IDHOSPITALISATION
      IDHOSPITALISATION: ligne.idHospitalisation,
      // SELECT LIGNE_PRESTATION.Nompatient AS Nompatient
      Nompatient: ligne.nomPatient || "",
      // SELECT LIGNE_PRESTATION.DatesaisieResultat AS DatesaisieResultat
      DatesaisieResultat: ligne.dateSaisieResultat,
      // SELECT LIGNE_PRESTATION.Sexe AS Sexe
      Sexe: ligne.sexe,
      // SELECT LIGNE_PRESTATION.Age_partient AS Age_partient
      Age_partient: ligne.agePatient,
      // SELECT LIGNE_PRESTATION.Situationgeo AS Situationgeo
      Situationgeo: ligne.situationGeo,
      // SELECT LIGNE_PRESTATION.Résultatsaisiepar AS Docteursaisieresultat
      Docteursaisieresultat: ligne.resultatSaisiePar,
      // SELECT LIGNE_PRESTATION.MedecinPrescripteur AS MedecinPrescripteur
      MedecinPrescripteur: ligne.medecinPrescripteur || "",
      // SELECT LIGNE_PRESTATION.Code_Prestation AS Code_Prestation
      Code_Prestation: ligne.CodePrestation,
      // SELECT LIGNE_PRESTATION.IDLIGNE_PRESTATION AS IDLIGNE_PRESTATION
      IDLIGNE_PRESTATION: ligne._id,
      
      // Informations supplémentaires pour l'impression
      dateImpression: new Date(),
      medecinExecutant: ligne.medecinExecutant,
      dateLignePrestation: ligne.dateLignePrestation,
      lettreCle: ligne.lettreCle
    };

    return NextResponse.json({
      success: true,
      message: 'Données d\'impression récupérées avec succès',
      donnees: donneesImpression,
      // Indiquer que ces données sont prêtes pour l'impression
      pretPourImpression: true
    });

  } catch (error: any) {
    console.error('Erreur lors de la préparation de l\'impression:', error);
    return NextResponse.json(
      { 
        error: 'Erreur serveur lors de la préparation de l\'impression',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
