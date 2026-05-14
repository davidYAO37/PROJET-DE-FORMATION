import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import ArretTravail from '@/models/arretTravail';
import { Patient } from '@/models/patient';
import { Medecin } from '@/models/medecin';

// Connexion à la base de données
async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bd_esaymed');
  }
}

// GET - Récupérer les arrêts de travail
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const medecinId = searchParams.get('medecinId');
    const statut = searchParams.get('statut');
    const entrepriseId = searchParams.get('entrepriseId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Construire le filtre
    const filter: any = {};
    
    if (patientId) {
      filter.patientId = new mongoose.Types.ObjectId(patientId);
    }
    
    if (medecinId) {
      filter.medecinId = new mongoose.Types.ObjectId(medecinId);
    }
    
    if (statut) {
      filter.statut = statut;
    }
    
    if (entrepriseId) {
      filter.entrepriseId = entrepriseId;
    }
    
    // Pagination
    const skip = (page - 1) * limit;
    
    // Récupérer les arrêts de travail
    const arrets = await ArretTravail.find(filter)
      .populate('patientId', 'Nom Prenoms Code_dossier Contact')
      .populate('medecinId', 'nom prenoms')
      .sort({ dateCreation: -1 })
      .skip(skip)
      .limit(limit);
    
    // Compter le total
    const total = await ArretTravail.countDocuments(filter);
    
    return NextResponse.json({
      success: true,
      data: arrets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error: any) {
    console.error('Erreur lors de la récupération des arrêts de travail:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Créer un nouvel arrêt de travail
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    
    // Validation des champs requis
    const { patientId, dateDebut, dateFin, motif, medecinTraitant } = body;
    
    if (!patientId || !dateDebut || !dateFin || !motif || !medecinTraitant) {
      return NextResponse.json(
        { success: false, error: 'Champs requis manquants' },
        { status: 400 }
      );
    }
    
    // Vérifier que le patient existe
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return NextResponse.json(
        { success: false, error: 'Patient non trouvé' },
        { status: 404 }
      );
    }
    
    // Vérifier que les dates sont valides
    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);
    
    if (debut >= fin) {
      return NextResponse.json(
        { success: false, error: 'La date de fin doit être postérieure à la date de début' },
        { status: 400 }
      );
    }
    
    // Vérifier s'il y a déjà un arrêt en cours pour cette période
    const arretExistant = await ArretTravail.findOne({
      patientId,
      statut: 'en_cours',
      $or: [
        { dateDebut: { $lte: debut }, dateFin: { $gte: debut } },
        { dateDebut: { $lte: fin }, dateFin: { $gte: fin } },
        { dateDebut: { $gte: debut }, dateFin: { $lte: fin } }
      ]
    });
    
    if (arretExistant) {
      return NextResponse.json(
        { success: false, error: 'Un arrêt de travail existe déjà pour cette période' },
        { status: 400 }
      );
    }
    
    // Créer le nouvel arrêt de travail
    const nouvelArret = new ArretTravail({
      ...body,
      patientNom: patient.Nom,
      patientPrenoms: patient.Prenoms,
      numeroDocument: body.numeroDocument || `AT-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    });
    
    await nouvelArret.save();
    
    // Peupler les informations pour la réponse
    const arretPopule = await ArretTravail.findById(nouvelArret._id)
      .populate('patientId', 'Nom Prenoms Code_dossier Contact')
      .populate('medecinId', 'nom prenoms');
    
    return NextResponse.json({
      success: true,
      message: 'Arrêt de travail créé avec succès',
      data: arretPopule
    });
    
  } catch (error: any) {
    console.error('Erreur lors de la création de l\'arrêt de travail:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour un arrêt de travail
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de l\'arrêt de travail requis' },
        { status: 400 }
      );
    }
    
    // Vérifier que l'arrêt existe
    const arret = await ArretTravail.findById(id);
    if (!arret) {
      return NextResponse.json(
        { success: false, error: 'Arrêt de travail non trouvé' },
        { status: 404 }
      );
    }
    
    // Validation des dates si elles sont modifiées
    if (updateData.dateDebut || updateData.dateFin) {
      const debut = new Date(updateData.dateDebut || arret.dateDebut);
      const fin = new Date(updateData.dateFin || arret.dateFin);
      
      if (debut >= fin) {
        return NextResponse.json(
          { success: false, error: 'La date de fin doit être postérieure à la date de début' },
          { status: 400 }
        );
      }
    }
    
    // Mettre à jour l'arrêt
    const arretUpdate = await ArretTravail.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('patientId', 'Nom Prenoms Code_dossier Contact')
     .populate('medecinId', 'nom prenoms');
    
    return NextResponse.json({
      success: true,
      message: 'Arrêt de travail mis à jour avec succès',
      data: arretUpdate
    });
    
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour de l\'arrêt de travail:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un arrêt de travail
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de l\'arrêt de travail requis' },
        { status: 400 }
      );
    }
    
    // Vérifier que l'arrêt existe
    const arret = await ArretTravail.findById(id);
    if (!arret) {
      return NextResponse.json(
        { success: false, error: 'Arrêt de travail non trouvé' },
        { status: 404 }
      );
    }
    
    // Supprimer l'arrêt
    await ArretTravail.findByIdAndDelete(id);
    
    return NextResponse.json({
      success: true,
      message: 'Arrêt de travail supprimé avec succès'
    });
    
  } catch (error: any) {
    console.error('Erreur lors de la suppression de l\'arrêt de travail:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
