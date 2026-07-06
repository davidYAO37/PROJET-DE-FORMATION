import { NextResponse } from 'next/server';
import { TypeActe } from '@/models/TypeActe';
import { db } from '@/db/mongoConnect';

// GET les types d'actes avec Hospitalisation=true
export async function GET() {
  try {
    await db();
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
