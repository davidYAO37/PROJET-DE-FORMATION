import { NextRequest, NextResponse } from 'next/server';
import { IExamenHospitalisation } from '@/models/examenHospit';
import { ITypeActe } from '@/models/TypeActe';
import { withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';

const READ_ROLES = ["admin", "medecin", "accueil", "caisse", "comptable", "biologiste", "infirmier"];

// GET les ExamenHospitalisation avec Designationtypeacte dans TypeActe.Hospitalisation=true
export async function GET(req: NextRequest) {
  try {
    const { context, response } = await withTenant(req, READ_ROLES);
    if (!context) return response;
    const ExamenHospitalisation = getTenantModel<IExamenHospitalisation>(context.connection, "ExamenHospitalisation");
    const TypeActe = getTenantModel<ITypeActe>(context.connection, "TypeActe");

    // Récupérer d'abord les types d'actes avec Hospitalisation=true
    const actesHospitalisation = await TypeActe.find({ 
      Hospitalisation: true 
    }).lean();
    
    const designationActes = actesHospitalisation.map(acte => acte.Designation);
    
    // Récupérer les ExamenHospitalisation avec ces Designationtypeacte
    // Inclure aussi ceux avec statutHospitalisation='en_cours' (nouveau flux)
    const hospitalisations = await ExamenHospitalisation.find({
      Designationtypeacte: { $in: designationActes },
      Entrele: { $exists: true },
      $or: [
        { statutHospitalisation: 'en_cours' },
        { SortieLe: { $exists: true, $gte: new Date() } },
      ],
    })
    .populate('IdPatient', 'Nom Prenoms Code_dossier')
    .populate('idMedecin', 'nom')
    .sort({ Entrele: -1 })
    .lean();
    
    return NextResponse.json(hospitalisations);
  } catch (error) {
    console.error('Erreur récupération hospitalisés:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' }, 
      { status: 500 }
    );
  }
}
