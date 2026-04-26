import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/mongoConnect';

export async function GET(request: NextRequest) {
  try {
    await db();
    
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const consultationId = searchParams.get('consultationId');
    
    // Si on a consultationId, récupérer le patientId depuis la consultation
    let finalPatientId = patientId;
    if (consultationId && !patientId) {
      // Importer dynamiquement pour éviter les dépendances circulaires
      const { Consultation } = await import('@/models/consultation');
      const consultation = await Consultation.findById(consultationId);
      if (consultation && consultation.IdPatient) {
        finalPatientId = consultation.IdPatient.toString();
      }
    }
    
    if (!finalPatientId) {
      return NextResponse.json({ error: 'ID de patient requis' }, { status: 400 });
    }
    
    // Importer dynamiquement pour éviter les dépendances circulaires
    const { Patient } = await import('@/models/patient');
    
    // Récupérer les antécédents du patient
    const patient = await Patient.findById(finalPatientId);
    
    if (!patient) {
      return NextResponse.json({ error: 'Patient non trouvé' }, { status: 404 });
    }
    
    // Retourner les antécédents du patient
    const antecedents = {
      antecedentMedico: patient.AntecedentMedico || '',
      anteChirurgico: patient.AnteChirurgico || '',
      anteFamille: patient.AnteFamille || '',
      autreAnte: patient.AutreAnte || '',
      allergies: patient.AlergiePatient || ''
    };
    
    return NextResponse.json(antecedents);
    
  } catch (error) {
    console.error('Erreur lors de la récupération des antécédents:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await db();
    
    const body = await request.json();
    const { patientId, consultationId, antecedents, type } = body;
    
    console.log('POST antecedents - Body:', body);
    
    // Importer dynamiquement pour éviter les dépendances circulaires
    const { Patient } = await import('@/models/patient');
    const { Consultation } = await import('@/models/consultation');
    
    let finalPatientId = patientId;
    
    // Si on a consultationId mais pas patientId, récupérer le patientId depuis la consultation
    if (consultationId && !patientId) {
      const consultation = await Consultation.findById(consultationId);
      if (consultation && consultation.IdPatient) {
        finalPatientId = consultation.IdPatient.toString();
      }
    }
    
    if (!finalPatientId) {
      return NextResponse.json({ error: 'ID de patient requis (directement ou via consultationId)' }, { status: 400 });
    }
    
    if (!antecedents) {
      return NextResponse.json({ error: 'Données d\'antécédents requises' }, { status: 400 });
    }
    
    console.log('Antecedents data:', antecedents);
    
    // Préparer l'objet de mise à jour selon le type
    const updateData: any = {};
    
    // Si un type spécifique est fourni, ne mettre à jour que ce champ
    if (type) {
      // Normaliser le type et gérer les différents formats
      const normalizedType = type.toLowerCase();
      
      // Récupérer la valeur depuis différents formats possibles
      // Format 1: { description: 'CHIRURGIE', date: '2026-04-26' }
      // Format 2: { AntecedentMedico: 'valeur' }
      // Format 3: 'valeur directe'
      let value = '';
      let date = '';
      
      if (typeof antecedents === 'string') {
        value = antecedents;
      } else if (antecedents.description || antecedents.value) {
        value = antecedents.description || antecedents.value || '';
        date = antecedents.date || '';
      } else {
        // Chercher dans les champs directs
        value = antecedents.AntecedentMedico || antecedents.antecedentMedico || 
               antecedents.AnteChirurgico || antecedents.anteChirurgico ||
               antecedents.AnteFamille || antecedents.anteFamille ||
               antecedents.AutreAnte || antecedents.autreAnte ||
               antecedents.AlergiePatient || antecedents.allergies || '';
      }
      
      // Formater la valeur avec la date si fournie
      let formattedValue = value;
      if (date && value) {
        formattedValue = `${value} (${date})`;
      }
      
      switch (normalizedType) {
        case 'antecedentmedico':
        case 'médical':
        case 'medical':
        case 'medico':
          updateData.AntecedentMedico = formattedValue;
          break;
        case 'antechirurgico':
        case 'chirurgical':
        case 'chirurgie':
        case 'chirurgical':
          updateData.AnteChirurgico = formattedValue;
          break;
        case 'antefamille':
        case 'familial':
        case 'famille':
        case 'familial':
          updateData.AnteFamille = formattedValue;
          break;
        case 'autreante':
        case 'autre':
        case 'autres':
          updateData.AutreAnte = formattedValue;
          break;
        case 'alergiepatient':
        case 'allergie':
        case 'allergies':
        case 'allergique':
          updateData.AlergiePatient = formattedValue;
          break;
        default:
          return NextResponse.json({ 
            error: 'Type d\'antécédent invalide', 
            typesValides: ['médical', 'chirurgical', 'familial', 'autre', 'allergie'],
            typeRecu: type 
          }, { status: 400 });
      }
    } else {
      // Sinon, mettre à jour tous les champs d'antécédents
      updateData.AntecedentMedico = antecedents.AntecedentMedico || antecedents.antecedentMedico || '';
      updateData.AnteChirurgico = antecedents.AnteChirurgico || antecedents.anteChirurgico || '';
      updateData.AnteFamille = antecedents.AnteFamille || antecedents.anteFamille || '';
      updateData.AutreAnte = antecedents.AutreAnte || antecedents.autreAnte || '';
      updateData.AlergiePatient = antecedents.AlergiePatient || antecedents.allergies || '';
    }
    
    console.log('Update data:', updateData);
    
    // Mettre à jour les antécédents du patient
    const patient = await Patient.findByIdAndUpdate(
      finalPatientId,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!patient) {
      return NextResponse.json({ error: 'Patient non trouvé' }, { status: 404 });
    }
    
    console.log('Patient mis à jour:', patient);
    
    return NextResponse.json({ 
      message: 'Antécédents mis à jour avec succès',
      patientId: finalPatientId,
      updatedFields: Object.keys(updateData),
      antecedents: {
        antecedentMedico: patient.AntecedentMedico,
        anteChirurgico: patient.AnteChirurgico,
        anteFamille: patient.AnteFamille,
        autreAnte: patient.AutreAnte,
        allergies: patient.AlergiePatient
      }
    });
    
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour des antécédents:', error);
    return NextResponse.json({ 
      error: 'Erreur serveur', 
      details: error.message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  // Alias pour POST (même fonctionnalité)
  return POST(request);
}
