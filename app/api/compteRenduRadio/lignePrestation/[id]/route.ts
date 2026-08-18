import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';
import { ILignePrestation } from '@/models/lignePrestation';

const ROLES = ['admin', 'medecin', 'accueil', 'infirmier', 'radiologue'];

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { context, response } = await withTenant(req, ROLES);
    if (!context) return response;
    const LignePrestation = getTenantModel<ILignePrestation>(context.connection, 'LignePrestation');
    try {
        const { id } = await params;
        const updateData = await req.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID de la ligne de prestation requis' },
        { status: 400 }
      );
    }

    // Logique WinDev : HModifie(LIGNE_PRESTATION)
    // Mettre à jour la ligne de prestation avec les nouvelles données
    const updatedLigne = await LignePrestation.findByIdAndUpdate(
      id,
      {
        ...updateData,
        // Mettre à jour les champs spécifiques au compte rendu
        resultatActe: updateData.resultatActe,
        observationExamen: updateData.observationExamen,
        dateSaisieResultat: updateData.dateSaisieResultat,
        resultatSaisiePar: updateData.resultatSaisiePar,
        sexe: updateData.sexe,
        agePatient: updateData.agePatient,
        situationGeo: updateData.situationGeo,
        nummedecinExecutant: updateData.nummedecinExecutant,
        medecinExecutant: updateData.medecinExecutant,
        
      },
      { new: true, runValidators: true }
    );

    if (!updatedLigne) {
      return NextResponse.json(
        { error: 'Ligne de prestation non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedLigne);
    
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la ligne de prestation:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la mise à jour de la ligne de prestation' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { context, response } = await withTenant(req, ROLES);
  if (!context) return response;
  const LignePrestation = getTenantModel<ILignePrestation>(context.connection, 'LignePrestation');

  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'ID de la ligne de prestation requis' },
        { status: 400 }
      );
    }

    // Récupérer une ligne de prestation spécifique
    const ligne = await LignePrestation.findById(id);

    if (!ligne) {
      return NextResponse.json(
        { error: 'Ligne de prestation non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json(ligne);
    
  } catch (error) {
    console.error('Erreur lors de la récupération de la ligne de prestation:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération de la ligne de prestation' },
      { status: 500 }
    );
  }
}
