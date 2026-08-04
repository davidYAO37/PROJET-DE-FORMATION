import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';
import { IConsultation } from '@/models/consultation';
import { IPatient } from '@/models/patient';
import { IPatientPrescription } from '@/models/PatientPrescription';

const ROLES = ['admin', 'medecin', 'accueil', 'infirmier'];

export async function GET(request: NextRequest) {
  const { context, response: tenantErrorResponse } = await withTenant(request, ROLES);
  if (!context) return tenantErrorResponse;
  const { connection } = context;
  const Consultation = getTenantModel<IConsultation>(connection, 'Consultation');
  const Patient = getTenantModel<IPatient>(connection, 'Patient');
  const PatientPrescription = getTenantModel<IPatientPrescription>(connection, 'PatientPrescription');

  try {
    
    const { searchParams } = new URL(request.url);
    const consultationId = searchParams.get('consultationId');
    const codePrestation = searchParams.get('codePrestation');
    
    // Accepter soit consultationId soit codePrestation
    if (!consultationId && !codePrestation) {
      return NextResponse.json({ error: 'ID de consultation ou Code Prestation requis' }, { status: 400 });
    }
    
    let consultation;
    
    // Rechercher par consultationId ou par codePrestation
    if (consultationId) {
      consultation = await Consultation.findById(consultationId)
        .populate('IdPatient')
        .populate('IDMEDECIN');
    } else if (codePrestation) {
      consultation = await Consultation.findOne({ CodePrestation: codePrestation })
        .populate('IdPatient')
        .populate('IDMEDECIN');
    }
    
    if (!consultation) {
      return NextResponse.json(
        { error: consultationId ? 'Consultation non trouvée' : 'Consultation avec ce Code Prestation non trouvée' },
        { status: 404 }
      );
    }
    
    // Récupérer les antécédents du patient
    const patient = await Patient.findById(consultation.IdPatient);
    
    // Récupérer les prescriptions associées à cette consultation
    const consultationDate = new Date(consultation.Date_consulation);
    const debutJour = new Date(consultationDate);
    debutJour.setHours(0, 0, 0, 0);
    const finJour = new Date(consultationDate);
    finJour.setHours(23, 59, 59, 999);
    const prescriptions = await PatientPrescription.find({
      IdPatient: consultation.IdPatient,
      CodePrestation: consultation.CodePrestation,
      DatePres: {
        $gte: debutJour,
        $lt: finJour
      }
    }).populate('medicament');
    
    // Préparer les données pour la réponse
    const responseData = {
      patient: patient ? {
        _id: patient._id,
        Nom: patient.Nom,
        Prenoms: patient.Prenoms,
        Date_naisse: patient.Date_naisse,
        Contact: patient.Contact,
        Code_dossier: patient.Code_dossier,
        Age_partient: patient.Age_partient,
        Situationgeo: patient.Situationgeo,
        Assurance: patient.Assurance,
        SOCIETE_PATIENT: patient.SOCIETE_PATIENT || patient.SocieteP,
        Matricule: patient.Matricule,
        nom: patient.Nom,
        prenoms: patient.Prenoms,
        dateNaissance: patient.Date_naisse,
        age: patient.Age_partient,
        sexe: patient.sexe,
        telephone: patient.Contact,
        codeDossier: patient.Code_dossier,
        situationGeo: patient.Situationgeo,
        assurance: patient.Assurance,
        matricule: patient.Matricule
      } : null,
      consultation: {
        _id: consultation._id,
        CodePrestation: consultation.CodePrestation,
        Code_dossier: consultation.Code_dossier,
        Date_consulation: consultation.Date_consulation,
        Heure_Consultation: consultation.Heure_Consultation,
        Temperature: consultation.Temperature,
        Poids: consultation.Poids,
        Tension: consultation.Tension,
        Glycemie: consultation.Glycemie,
        TailleCons: consultation.TailleCons,
        ExamenClinique: consultation.ExamenClinique || '',
        CodeAffection: consultation.CodeAffection || '',
        Diagnostic: consultation.Diagnostic,
        Medecin: consultation.Medecin,
        NumBon: consultation.NumBon,
        StatutPaiement: consultation.StatutPaiement,
        Modepaiement: consultation.Modepaiement,
        montantapayer: consultation.montantapayer,
        codePrestation: consultation.CodePrestation,
        codeDossier: consultation.Code_dossier,
        dateConsultation: consultation.Date_consulation,
        heureConsultation: consultation.Heure_Consultation,
        temperature: consultation.Temperature,
        poids: consultation.Poids,
        tension: consultation.Tension,
        glycemie: consultation.Glycemie,
        taille: consultation.TailleCons,
        frequenceCardiaque: '', // Champ non disponible dans le modèle
        frequenceRespiratoire: '', // Champ non disponible dans le modèle
        MotifConsultation: consultation.MotifConsultation,
        examenClinique: consultation.ExamenClinique || '',
        codeAffection: consultation.CodeAffection || '',
        ExamenParaclinique: consultation.ExamenParaclinique || '',
        TraitementClinique: consultation.TraitementClinique || '',
        ConclusionClinique: consultation.ConclusionClinique || '',
        diagnostic: consultation.Diagnostic,
        medecin: consultation.Medecin,
        idMedecin: consultation.IDMEDECIN
      },
      antecedents: patient ? {
        antecedentMedico: patient.AntecedentMedico,
        anteChirurgico: patient.AnteChirurgico,
        anteFamille: patient.AnteFamille,
        autreAnte: patient.AutreAnte,
        AlergiePatient: patient.AlergiePatient,
        allergies: patient.AlergiePatient
      } : {},
      prescriptions: prescriptions.map(presc => {
        const designation = presc.nomMedicament || '';

        return {
          _id: presc._id,
          type: 'medicament',
          designation,
          posologie: presc.posologie,
          duree: '',
          instructions: '',
          Designation: designation,
          DatePres: presc.DatePres,
          Montanttotal: presc.prixTotal,
          idPrescription: presc.IDPRESCRIPTION,
          nomMedicament: presc.nomMedicament,
          qteP: presc.QteP,
          datePres: presc.DatePres,
          heure: presc.heure,
          statutPrescription: presc.StatutPrescriptionMedecin,
          partAssurance: presc.partAssurance,
          partAssure: presc.partAssure,
          medicament: presc.medicament
        };
      })
    };
    
    return NextResponse.json(responseData);
    
  } catch (error) {
    console.error('Erreur lors du chargement de la fiche de consultation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { context, response: tenantErrorResponse } = await withTenant(request, ROLES);
  if (!context) return tenantErrorResponse;
  const { connection } = context;
  const Consultation = getTenantModel<IConsultation>(connection, 'Consultation');

  try {
    const body = await request.json();
    const { 
      consultationId,
      codePrestation,
      MotifConsultation, 
      examenClinique, 
      codeAffection, 
      ExamenParaclinique,
      TraitementClinique,
      ConclusionClinique,
      diagnostic 
    } = body;
    
    // Accepter soit consultationId soit codePrestation
    if (!consultationId && !codePrestation) {
      return NextResponse.json({ error: 'ID de consultation ou Code Prestation requis' }, { status: 400 });
    }
    
    let consultation;
    
    // Rechercher par consultationId ou par codePrestation
    if (consultationId) {
      consultation = await Consultation.findById(consultationId);
    } else if (codePrestation) {
      consultation = await Consultation.findOne({ CodePrestation: codePrestation });
    }
    
    if (!consultation) {
      return NextResponse.json({ 
        error: consultationId ? 'Consultation non trouvée' : 'Consultation avec ce Code Prestation non trouvée', 
        status: 404 
      });
    }
    
    // Préparer l'objet de mise à jour
    const updateData: any = {};
    
    // Mettre à jour les champs disponibles
    if (MotifConsultation !== undefined) {
      updateData.MotifConsultation = MotifConsultation;
    }
    if (examenClinique !== undefined) {
      updateData.ExamenClinique = examenClinique;
    }
    if (codeAffection !== undefined) {
      updateData.CodeAffection = codeAffection;
    }
    if (ExamenParaclinique !== undefined) {
      updateData.ExamenParaclinique = ExamenParaclinique;
    }
    if (TraitementClinique !== undefined) {
      updateData.TraitementClinique = TraitementClinique;
    }
    if (ConclusionClinique !== undefined) {
      updateData.ConclusionClinique = ConclusionClinique;
    }
    if (diagnostic !== undefined) {
      updateData.Diagnostic = diagnostic;
    }
    
    // Mettre à jour la consultation si des données sont fournies
    if (Object.keys(updateData).length > 0) {
      await Consultation.findByIdAndUpdate(
        consultation._id,
        updateData,
        { new: true, runValidators: true }
      );
    }
    
    return NextResponse.json({ 
      message: 'Consultation mise à jour avec succès',
      consultation: {
        ...updateData,
        MotifConsultation: updateData.MotifConsultation,
        examenClinique: updateData.ExamenClinique,
        codeAffection: updateData.CodeAffection,
        ConclusionClinique: updateData.ConclusionClinique
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la consultation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
