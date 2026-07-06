import { NextResponse } from 'next/server';
import { ExamenHospitalisation } from '@/models/examenHospit';
import { TypeActe } from '@/models/TypeActe';
import { db } from '@/db/mongoConnect';

// GET les ExamenHospitalisation avec Designationtypeacte dans TypeActe.Hospitalisation=true
export async function GET() {
  try {
    await db();
    
    // Récupérer d'abord les types d'actes avec Hospitalisation=true
    const actesHospitalisation = await TypeActe.find({ 
      Hospitalisation: true 
    }).lean();
    
    const designationActes = actesHospitalisation.map(acte => acte.Designation);
    
    // Récupérer les ExamenHospitalisation avec ces Designationtypeacte
    const hospitalisations = await ExamenHospitalisation.find({
      Designationtypeacte: { $in: designationActes },
      Entrele: { $exists: true },
      SortieLe: { $exists: true, $gte: new Date() } 
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
