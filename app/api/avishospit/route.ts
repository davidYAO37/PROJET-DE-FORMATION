import { NextRequest, NextResponse } from 'next/server';
import { AvisHospit } from '@/models/AvisHospit';
import { db } from '@/db/mongoConnect';

// Fonction pour définir les flags de service selon le serviceHospit
function setServiceFlags(serviceHospit: string) {
  const flags = {
    MED: false,
    CHR: false,
    CHRSP: false,
    OBST: false,
    GYN: false,
    PED: false
  };

  switch (serviceHospit) {
    case 'MED':
      flags.MED = true;
      break;
    case 'CHIR':
      flags.CHR = true;
      break;
    case 'CHR.SP':
      flags.CHRSP = true;
      break;
    case 'OBST':
      flags.OBST = true;
      break;
    case 'GYN':
      flags.GYN = true;
      break;
    case 'PED':
      flags.PED = true;
      break;
  }

  return flags;
}

// Fonction pour définir les flags d'état selon etatPatient
function setEtatFlags(etatPatient: string) {
  const flags = {
    URGENT: false,
    SEMIURGENT: false,
    ELECTIF: false
  };

  switch (etatPatient) {
    case 'Urgent':
      flags.URGENT = true;
      break;
    case 'Semi-Urgent':
      flags.SEMIURGENT = true;
      break;
    case 'Electif':
      flags.ELECTIF = true;
      break;
  }

  return flags;
}

export async function GET(request: NextRequest) {
  try {
    await db();
    
    const { searchParams } = new URL(request.url);
    const consultationId = searchParams.get('consultationId');
    const patientId = searchParams.get('patientId');
    
    let query: any = {};
    
    if (consultationId) {
      query.IDCONSULTATION = consultationId;
    }
    
    if (patientId) {
      query.IDPARTIENT = patientId;
    }
    
    const avis = await AvisHospit.find(query)
      .populate('IDPARTIENT', 'Nom Prenoms Code_dossier')
      .populate('IDCONSULTATION', 'CodePrestation Date_consulation')
      .sort({ createdAt: -1 })
      .lean();
    
    return NextResponse.json({
      success: true,
      data: avis,
      total: avis.length
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des avis d\'hospitalisation:', error);
    return NextResponse.json({
      error: 'Erreur serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue',
      data: []
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await db();
    
    const body = await request.json();
    
    // Validation des champs requis
    const requiredFields = [
      'serviceHospit', 'etatPatient', 'DureHospit', 'Patient',
      'DateIntervention', 'HeureHospit', 'NumDoc', 
      'MedecinTraitant', 'Diagnostic', 'DatePrevue', 'IDPARTIENT'
    ];
    
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({
          error: `Champ requis manquant: ${field}`,
          details: `Le champ ${field} est obligatoire`
        }, { status: 400 });
      }
    }
    
    // Définir les flags selon le service et l'état
    const serviceFlags = setServiceFlags(body.serviceHospit);
    const etatFlags = setEtatFlags(body.etatPatient);
    
    // Créer l'avis d'hospitalisation
    const nouvelAvis = new AvisHospit({
      ...body,
      ...serviceFlags,
      ...etatFlags,
      DateIntervention: new Date(body.DateIntervention),
      DatePrevue: new Date(body.DatePrevue),
      Isolement: body.Isolement || false,
      HospitAnt: body.HospitAnt || false,
      sejourunjour: body.sejourunjour || false
    });
    
    await nouvelAvis.save();
    
    return NextResponse.json({
      success: true,
      message: 'Avis d\'hospitalisation créé avec succès',
      data: nouvelAvis
    }, { status: 201 });
    
  } catch (error) {
    console.error('Erreur lors de la création de l\'avis d\'hospitalisation:', error);
    return NextResponse.json({
      error: 'Erreur serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await db();
    
    const body = await request.json();
    const { _id, ...updateData } = body;
    
    if (!_id) {
      return NextResponse.json({
        error: 'ID manquant',
        details: 'L\'identifiant de l\'avis d\'hospitalisation est requis'
      }, { status: 400 });
    }
    
    // Définir les flags si le service ou l'état sont modifiés
    if (updateData.serviceHospit) {
      const serviceFlags = setServiceFlags(updateData.serviceHospit);
      Object.assign(updateData, serviceFlags);
    }
    
    if (updateData.etatPatient) {
      const etatFlags = setEtatFlags(updateData.etatPatient);
      Object.assign(updateData, etatFlags);
    }
    
    // Convertir les dates si présentes
    if (updateData.DateIntervention) {
      updateData.DateIntervention = new Date(updateData.DateIntervention);
    }
    
    if (updateData.DatePrevue) {
      updateData.DatePrevue = new Date(updateData.DatePrevue);
    }
    
    const updated = await AvisHospit.findByIdAndUpdate(
      _id,
      updateData,
      { new: true, runValidators: true }
    ).populate('IDPARTIENT', 'Nom Prenoms Code_dossier')
     .populate('IDCONSULTATION', 'CodePrestation Date_consulation');
    
    if (!updated) {
      return NextResponse.json({
        error: 'Avis introuvable',
        details: 'L\'avis d\'hospitalisation à modifier n\'existe pas'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Avis d\'hospitalisation mis à jour avec succès',
      data: updated
    });
    
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'avis d\'hospitalisation:', error);
    return NextResponse.json({
      error: 'Erreur serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await db();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({
        error: 'ID manquant',
        details: 'L\'identifiant de l\'avis d\'hospitalisation est requis'
      }, { status: 400 });
    }
    
    const deleted = await AvisHospit.findByIdAndDelete(id);
    
    if (!deleted) {
      return NextResponse.json({
        error: 'Avis introuvable',
        details: 'L\'avis d\'hospitalisation à supprimer n\'existe pas'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Avis d\'hospitalisation supprimé avec succès',
      data: deleted
    });
    
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'avis d\'hospitalisation:', error);
    return NextResponse.json({
      error: 'Erreur serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
