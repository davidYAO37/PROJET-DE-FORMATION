import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';
import { IArretTravail } from '@/models/arretTravail';

const ROLES = ['admin', 'medecin', 'accueil', 'infirmier'];

// GET - Test simple
export async function GET(request: NextRequest) {
  try {
    const { context, response } = await withTenant(request, ROLES);
    if (!context) return response;
    const ArretTravail = getTenantModel<IArretTravail>(context.connection, 'ArretTravail');

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    
    if (patientId) {
      const arrets = await ArretTravail.find({ patientId }).sort({ dateCreation: -1 });
      return NextResponse.json({
        success: true,
        data: arrets,
        message: 'Test récupération réussie'
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'API arrettravail-simple fonctionne'
    });
    
  } catch (error: any) {
    console.error('Erreur GET arrettravail-simple:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Test simple
export async function POST(request: NextRequest) {
  try {
    const { context, response } = await withTenant(request, ROLES);
    if (!context) return response;
    const ArretTravail = getTenantModel<IArretTravail>(context.connection, 'ArretTravail');

    const body = await request.json();
    
    console.log('Données reçues:', body);
    
    const { patientId, dateDebut, dateFin, motif, medecinTraitant } = body;
    
    if (!patientId || !dateDebut || !dateFin || !motif || !medecinTraitant) {
      return NextResponse.json(
        { success: false, error: 'Champs requis manquants' },
        { status: 400 }
      );
    }
    
    // Créer un arrêt simple
    const nouvelArret = new ArretTravail({
      ...body,
      numeroDocument: `AT-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    });
    
    await nouvelArret.save();
    
    return NextResponse.json({
      success: true,
      message: 'Arrêt de travail créé avec succès (test)',
      data: nouvelArret
    });
    
  } catch (error: any) {
    console.error('Erreur POST arrettravail-simple:', error);
    return NextResponse.json(
      { success: false, error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}
