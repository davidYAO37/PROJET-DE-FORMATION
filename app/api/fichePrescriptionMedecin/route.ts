import { NextRequest, NextResponse } from 'next/server';
import { Consultation } from '@/models/consultation';
import { Patient } from '@/models/patient';
import { Prescription } from '@/models/Prescription';
import { PatientPrescription } from '@/models/PatientPrescription';
import { db } from '@/db/mongoConnect';

export async function GET(request: NextRequest) {
  try {
    await db();
    
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
      return NextResponse.json({ 
        error: consultationId ? 'Consultation non trouvée' : 'Consultation avec ce Code Prestation non trouvée', 
        status: 404 
      });
    }
    
    // Récupérer les antécédents du patient
    const patient = await Patient.findById(consultation.IdPatient);
    
    // Récupérer les prescriptions associées à cette consultation
    const prescriptions = await PatientPrescription.find({ 
      IdPatient: consultation.IdPatient,
      DatePres: { 
        $gte: new Date(consultation.Date_consulation.setHours(0,0,0,0)),
        $lt: new Date(consultation.Date_consulation.setHours(23,59,59,999))
      }
    }).populate('medicament');
    
    // Préparer les données pour la réponse
    const responseData = {
      patient: patient ? {
        _id: patient._id,
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
        AlergiePatient: patient.AlergiePatient
      } : {},
      prescriptions: prescriptions.map(presc => ({
        _id: presc._id,
        idPrescription: presc.IDPRESCRIPTION,
        nomMedicament: presc.nomMedicament,
        qteP: presc.QteP,
        posologie: presc.posologie,
        //prixUnitaire: presc.prixUnitaire,
       // prixTotal: presc.prixTotal,
        datePres: presc.DatePres,
        heure: presc.heure,
        statutPrescription: presc.StatutPrescriptionMedecin,
        partAssurance: presc.partAssurance,
        partAssure: presc.partAssure,
        medicament: presc.medicament
      }))
    };
    
    return NextResponse.json(responseData);
    
  } catch (error) {
    console.error('Erreur lors du chargement de la fiche de consultation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await db();
    
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
    
    // Importer dynamiquement pour éviter les dépendances circulaires
    const { Consultation } = await import('@/models/consultation');
    
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
