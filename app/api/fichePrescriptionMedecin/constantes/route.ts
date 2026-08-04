import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';
import { IConsultation } from '@/models/consultation';

const ROLES = ['admin', 'medecin', 'accueil', 'infirmier'];

export async function GET(request: NextRequest) {
  const { context, response: tenantErrorResponse } = await withTenant(request, ROLES);
  if (!context) return tenantErrorResponse;
  const Consultation = getTenantModel<IConsultation>(context.connection, 'Consultation');

  try {
    const { searchParams } = new URL(request.url);
    const consultationId = searchParams.get('consultationId');
    
    if (!consultationId) {
      return NextResponse.json({ error: 'ID de consultation requis' }, { status: 400 });
    }
    
    // Récupérer la consultation pour obtenir les constantes
    const consultation = await Consultation.findById(consultationId);
    
    if (!consultation) {
      return NextResponse.json({ error: 'Consultation non trouvée' }, { status: 404 });
    }
    
    // Retourner les constantes de la consultation
    const constantes = {
      temperature: consultation.Temperature || null,
      poids: consultation.Poids || null,
      tension: consultation.Tension || null,
      glycemie: consultation.Glycemie || null,
      taille: consultation.TailleCons || null,
      dateConsultation: consultation.Date_consulation,
      heureConsultation: consultation.Heure_Consultation
    };
    
    return NextResponse.json(constantes);
    
  } catch (error) {
    console.error('Erreur lors de la récupération des constantes:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const { context, response: tenantErrorResponse } = await withTenant(request, ROLES);
  if (!context) return tenantErrorResponse;
  const Consultation = getTenantModel<IConsultation>(context.connection, 'Consultation');

  try {
    const body = await request.json();
    const { consultationId, constantes } = body;
    
    if (!consultationId || !constantes) {
      return NextResponse.json({ error: 'ID de consultation et constantes requis' }, { status: 400 });
    }
    
    // Mettre à jour les constantes de la consultation
    const consultation = await Consultation.findByIdAndUpdate(
      consultationId,
      {
        Temperature: constantes.temperature,
        Poids: constantes.poids,
        Tension: constantes.tension,
        Glycemie: constantes.glycemie,
        TailleCons: constantes.taille
      },
      { new: true, runValidators: true }
    );
    
    if (!consultation) {
      return NextResponse.json({ error: 'Consultation non trouvée' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      message: 'Constantes mises à jour avec succès',
      constantes: {
        temperature: consultation.Temperature,
        poids: consultation.Poids,
        tension: consultation.Tension,
        glycemie: consultation.Glycemie,
        taille: consultation.TailleCons
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de la mise à jour des constantes:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
