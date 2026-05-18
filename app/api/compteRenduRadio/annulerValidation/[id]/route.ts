import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/mongoConnect';
import { LignePrestation } from '@/models/lignePrestation';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await db();
    
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID de la ligne de prestation requis' },
        { status: 400 }
      );
    }

    // Récupérer la ligne de prestation
    const ligne = await LignePrestation.findById(id);
    
    if (!ligne) {
      return NextResponse.json(
        { error: 'Ligne de prestation non trouvée' },
        { status: 404 }
      );
    }

    // Récupérer l'utilisateur depuis le corps de la requête
    const body = await req.json();
    const utilisateur = body.utilisateur;
    
    if (!utilisateur) {
      return NextResponse.json(
        { error: 'Utilisateur non spécifié' },
        { status: 400 }
      );
    }

    // Logique WinDev : SI utilisateurconnecte=TABLE_LIGNE_PRESTATION_VALIDE.COL_ValidePar ALORS
    if (ligne.compteRenduValidePar !== utilisateur) {
      return NextResponse.json(
        { 
          error: 'Pour la reprise veuillez voir ' + (ligne.compteRenduValidePar || "l'utilisateur qui a validé"),
          code: 'USER_NOT_VALIDATOR'
        },
        { status: 403 }
      );
    }

    // Logique WinDev : nMONjour=DateDifférence(LIGNE_PRESTATION.compterenduValidéLe,DateSys())
    const dateValidation = ligne.compteRenduValideLe;
    const dateActuelle = new Date();
    
    if (!dateValidation) {
      return NextResponse.json(
        { error: 'Date de validation non trouvée' },
        { status: 400 }
      );
    }
    
    const differenceJours = Math.floor((dateActuelle.getTime() - new Date(dateValidation).getTime()) / (1000 * 60 * 60 * 24));
    
    // Logique WinDev : SI nMONjour < 15 ALORS
    if (differenceJours >= 15) {
      return NextResponse.json(
        { 
          error: 'Désolé, nous ne pouvons donner suite à votre requête. Délai de 15 jours dépassé.',
          code: 'DEADLINE_EXCEEDED',
          daysElapsed: differenceJours
        },
        { status: 403 }
      );
    }

    // Logique WinDev : HModifie(LIGNE_PRESTATION)
    // LIGNE_PRESTATION.CompteRenduValidéA=""
    // LIGNE_PRESTATION.compterenduValidéLe=""
    // LIGNE_PRESTATION.CompterenduValidépar=""
    
    const updatedLigne = await LignePrestation.findByIdAndUpdate(
      id,
      {
        // Effacer les champs de validation
        compteRenduValideA: "",
        compteRenduValideLe: null,
        compteRenduValidePar: "",
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Validation annulée avec succès. Vous pouvez maintenant modifier le compte rendu.',
      ligne: updatedLigne
    });

  } catch (error: any) {
    console.error('Erreur lors de l\'annulation de la validation:', error);
    return NextResponse.json(
      { 
        error: 'Erreur serveur lors de l\'annulation de la validation',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
