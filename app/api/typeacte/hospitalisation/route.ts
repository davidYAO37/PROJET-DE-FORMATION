import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';
import { ITypeActe } from '@/models/TypeActe';

const READ_ROLES = ["admin", "accueil", "biologiste", "caisse", "comptable", "infirmier", "medecin", "pharmacien", "radiologue", "technicienlabo"];

// GET les types d'actes avec Hospitalisation=true
export async function GET(req: NextRequest) {
  const { context, response } = await withTenant(req, READ_ROLES);
  if (!context) return response;
  const TypeActe = getTenantModel<ITypeActe>(context.connection, "TypeActe");
  try {
    const actesHospitalisation = await TypeActe.find({ 
      Hospitalisation: true 
    }).sort({ Designation: 1 }).lean();
    
    return NextResponse.json(actesHospitalisation);
  } catch (error) {
    console.error('Erreur récupération actes hospitalisation:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' }, 
      { status: 500 }
    );
  }
}
