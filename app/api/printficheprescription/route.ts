import { NextRequest, NextResponse } from 'next/server';
import { Consultation } from '@/models/consultation';
import { Patient } from '@/models/patient';
import { LignePrestation } from '@/models/lignePrestation';
import { PatientPrescription } from '@/models/PatientPrescription';
import { db } from '@/db/mongoConnect';

export async function GET(request: NextRequest) {
    await db();

    try {
    
    const { searchParams } = new URL(request.url);
    const codeConsultation = searchParams.get('codeConsultation');
    
    console.log('🔍 API PrintFichePrescription - codeConsultation reçu:', codeConsultation);
    
    if (!codeConsultation) {
      return NextResponse.json(
        { error: 'Code consultation requis' },
        { status: 400 }
      );
    }

    // Requête SQL équivalente en MongoDB selon la logique Windev
    // 1. Trouver la consultation liée au CodePrestation saisi UNIQUEMENT
    // 2. Rechercher le patient lié à la consultation trouvée à partir de son IdPatient
    
    const consultationData = await Consultation.aggregate([
      {
        $match: {
          CodePrestation: codeConsultation  // Recherche UNIQUEMENT par CodePrestation
        }
      },
      {
        $lookup: {
          from: 'patients',
          localField: 'IdPatient',
          foreignField: '_id',
          as: 'patientInfo'
        }
      },
      {
        $unwind: '$patientInfo'
      },
      {
        $project: {
          // Champs CONSULTATION - champs exacts du modèle MongoDB
          _id: 1,
          CodePrestation: 1,
          designationC: 1,
          Date_consulation: 1,
          Temperature: 1,
          Tension: 1,
          Glycemie: 1,
          TailleCons: 1,
          Poids: 1,
          IdPatient: 1,
          ExamenClinique: 1,
          ExamenParaclinique: 1,
          TraitementClinique: 1,
          ConclusionClinique: 1,
          Diagnostic: 1,
          MotifConsultation: 1,
          Code_dossier: 1,
          Medecin: 1,
          CodeAffection: 1,
          
          // Champs PATIENT - champs exacts du modèle MongoDB
          'patientInfo.Nom': 1,
          'patientInfo.Prenoms': 1,
          'patientInfo.sexe': 1,
          'patientInfo.Age_partient': 1,
          'patientInfo.Contact': 1,
          'patientInfo.Situationgeo': 1,
          'patientInfo.AnteChirurgico': 1,
          'patientInfo.AntecedentMedico': 1,
          'patientInfo.AnteFamille': 1,
          'patientInfo.AutreAnte': 1,
          'patientInfo.Code_dossier': 1,
          'patientInfo.Assurance': 1,
          'patientInfo.Matricule': 1
        }
      },
      {
        $sort: {
          'Date_consulation': 1
        }
      }
    ]);

    if (!consultationData || consultationData.length === 0) {
      return NextResponse.json(
        { 
          error: 'Aucune consultation trouvée pour ce CodePrestation',
          codeConsultation: codeConsultation,
          message: 'Vérifiez que le CodePrestation existe dans la collection consultations'
        },
        { status: 404 }
      );
    }

    console.log('✅ API PrintFichePrescription - données trouvées:', consultationData.length, 'consultations');
    console.log('📊 Premier résultat:', consultationData[0]);
    
    // Récupérer les LignePrestation pour l'examen paraclinique
    const lignesPrestation = await LignePrestation.find({
      CodePrestation: codeConsultation
    }).lean();
    
    console.log('🔬 LignePrestation trouvées:', lignesPrestation.length, 'examens paracliniques');
    
    // Récupérer les PatientPrescription pour le traitement
    const prescriptions = await PatientPrescription.find({
      CodePrestation: codeConsultation
    }).lean();
    
    console.log('💊 PatientPrescription trouvées:', prescriptions.length, 'traitements');
    
    // Ajouter les données aux résultats
    const resultData = consultationData.map(consultation => ({
      ...consultation,
      lignesPrestation: lignesPrestation,
      prescriptions: prescriptions
    }));
    
    return NextResponse.json({
      success: true,
      data: resultData
    });

  } catch (error) {
    console.error('Erreur API PrintFichePrescriptionMedecin:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
