import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/mongoConnect';

export async function GET(request: NextRequest) {
  try {
    await db();
    
    // Test de connexion et vérification des modèles
    const models: { [key: string]: string } = {};
    
    try {
      const { Consultation } = await import('@/models/consultation');
      models.Consultation = 'OK';
    } catch (e: any) {
      models.Consultation = 'ERROR: ' + e.message;
    }
    
    try {
      const { Patient } = await import('@/models/patient');
      models.Patient = 'OK';
    } catch (e: any) {
      models.Patient = 'ERROR: ' + e.message;
    }
    
    try {
      const { Prescription } = await import('@/models/Prescription');
      models.Prescription = 'OK';
    } catch (e: any) {
      models.Prescription = 'ERROR: ' + e.message;
    }
    
    try {
      const { PatientPrescription } = await import('@/models/PatientPrescription');
      models.PatientPrescription = 'OK';
    } catch (e: any) {
      models.PatientPrescription = 'ERROR: ' + e.message;
    }
    
    return NextResponse.json({
      message: 'Test des endpoints fichePrescriptionMedecin',
      database: 'OK',
      models: models,
      endpoints: {
        main: '/api/fichePrescriptionMedecin',
        constantes: '/api/fichePrescriptionMedecin/constantes',
        antecedents: '/api/fichePrescriptionMedecin/antecedents',
        test: '/api/fichePrescriptionMedecin/test'
      }
    });
    
  } catch (error: any) {
    console.error('Erreur lors du test:', error);
    return NextResponse.json({ 
      error: 'Erreur lors du test',
      details: error.message 
    }, { status: 500 });
  }
}
