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

    // Logique WinDev : SI TABLE_LIGNE_PRESTATION.COL_SaisiePar=" "ALORS
    if (!ligne.resultatSaisiePar || ligne.resultatSaisiePar.trim() === "") {
      return NextResponse.json(
        { 
          error: 'Veuillez saisir le compte rendu avant cette action',
          code: 'NO_RESULTAT'
        },
        { status: 400 }
      );
    }

    // Logique WinDev : SI TABLE_LIGNE_PRESTATION.COL_ValidePar="" ALORS
    if (ligne.compteRenduValidePar && ligne.compteRenduValidePar.trim() !== "") {
      return NextResponse.json(
        { 
          error: `Compte rendu déjà validé par ${ligne.compteRenduValidePar}`,
          code: 'DEJA_VALIDE'
        },
        { status: 400 }
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

    // Logique WinDev : HLitRecherche + HModifie
    const now = new Date();
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM format
    
    const updatedLigne = await LignePrestation.findByIdAndUpdate(
      id,
      {
        // LIGNE_PRESTATION.CompteRenduValidéA=HeureSys()
        compteRenduValideA: currentTime,
        // LIGNE_PRESTATION.compterenduValidéLe=DateSys()
        compteRenduValideLe: now,
        // LIGNE_PRESTATION.CompterenduValidépar=gsUtilisateur
        compteRenduValidePar: utilisateur,
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Compte rendu validé avec succès',
      ligne: updatedLigne
    });

  } catch (error: any) {
    console.error('Erreur lors de la validation du compte rendu:', error);
    return NextResponse.json(
      { 
        error: 'Erreur serveur lors de la validation du compte rendu',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
