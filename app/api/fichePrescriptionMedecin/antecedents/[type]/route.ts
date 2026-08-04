import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';
import { IPatient } from '@/models/patient';
import { IConsultation } from '@/models/consultation';

const ROLES = ['admin', 'medecin', 'accueil', 'infirmier'];

export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<{ type: string }> }
) {
  const { context, response: tenantErrorResponse } = await withTenant(request, ROLES);
  if (!context) return tenantErrorResponse;
  const { connection } = context;
  const Patient = getTenantModel<IPatient>(connection, 'Patient');
  const Consultation = getTenantModel<IConsultation>(connection, 'Consultation');

  try {
    const { type } = await params;
    console.log('DELETE antecedent - Type:', type);
    
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const consultationId = searchParams.get('consultationId');
    
    let finalPatientId = patientId;
    
    // Si on a consultationId mais pas patientId, récupérer le patientId depuis la consultation
    if (consultationId && !patientId) {
      const consultation = await Consultation.findById(consultationId);
      if (consultation && consultation.IdPatient) {
        finalPatientId = consultation.IdPatient.toString();
      }
    }
    
    if (!finalPatientId) {
      return NextResponse.json({ 
        error: 'ID de patient requis (directement ou via consultationId)' 
      }, { status: 400 });
    }
    
    // Normaliser le type et mapper vers le champ correct
    const normalizedType = type.toLowerCase();
    let updateField: string;
    
    switch (normalizedType) {
      case 'medical':
      case 'antecedentmedico':
        updateField = 'AntecedentMedico';
        break;
      case 'chirurgical':
      case 'antechirurgico':
        updateField = 'AnteChirurgico';
        break;
      case 'familial':
      case 'antefamille':
        updateField = 'AnteFamille';
        break;
      case 'autre':
      case 'autreante':
        updateField = 'AutreAnte';
        break;
      case 'allergie':
      case 'allergies':  // Supporter les deux formats
      case 'alergiepatient':
        updateField = 'AlergiePatient';
        break;
      default:
        return NextResponse.json({ 
          error: 'Type d\'antécédent invalide', 
          typesValides: ['medical', 'chirurgical', 'familial', 'autre', 'allergie', 'allergies'],
          typeRecu: type 
        }, { status: 400 });
    }
    
    // Mettre à jour le patient en vidant le champ spécifique
    const updateData: any = {};
    updateData[updateField] = '';
    
    console.log('Update data for DELETE:', updateData);
    
    const patient = await Patient.findByIdAndUpdate(
      finalPatientId,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!patient) {
      return NextResponse.json({ error: 'Patient non trouvé' }, { status: 404 });
    }
    
    console.log('Antécédent supprimé avec succès:', updateField);
    
    return NextResponse.json({ 
      message: 'Antécédent supprimé avec succès',
      type: type,
      field: updateField,
      patientId: finalPatientId
    });
    
  } catch (error: any) {
    console.error('Erreur lors de la suppression de l\'antécédent:', error);
    return NextResponse.json({ 
      error: 'Erreur serveur', 
      details: error.message 
    }, { status: 500 });
  }
}
