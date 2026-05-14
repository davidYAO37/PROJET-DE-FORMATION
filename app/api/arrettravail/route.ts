import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import ArretTravail from '@/models/arretTravail';
import { Patient } from '@/models/patient';
import { isTypeArretTravail, ARRET_TRAVAIL_STATUTS } from '@/types/arretTravail';

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
    await ArretTravail.updateMany(
      { statut: 'en_cours', dateFin: { $lt: new Date() } },
      { statut: 'termine' }
    );

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
    const { patientId, dateDebut, dateFin, motif, medecinTraitant, typeArret, statut } = body;

    if (!patientId || !dateDebut || !dateFin || !motif || !medecinTraitant) {
      return NextResponse.json(
        { success: false, error: 'Champs requis manquants' },
        { status: 400 }
      );
    }

    if (typeArret && !isTypeArretTravail(typeArret)) {
      return NextResponse.json(
        { success: false, error: 'Type d\'arrêt invalide' },
        { status: 400 }
      );
    }

    if (statut && !ARRET_TRAVAIL_STATUTS.includes(statut)) {
      return NextResponse.json(
        { success: false, error: 'Statut d\'arrêt invalide' },
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
    const aujourdHui = new Date();
    aujourdHui.setHours(0, 0, 0, 0);

    if (debut < aujourdHui) {
      return NextResponse.json(
        { success: false, error: 'La date de début ne peut pas être antérieure à aujourd\'hui' },
        { status: 400 }
      );
    }

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

// PUT - Non supporté sur la route collection
export async function PUT(request: NextRequest) {
  return NextResponse.json(
    { success: false, error: 'Modification non supportée sur /api/arrettravail, utilisez /api/arrettravail/{id}' },
    { status: 405 }
  );
}

// DELETE - Non supporté sur la route collection
export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    { success: false, error: 'Suppression non supportée sur /api/arrettravail, utilisez /api/arrettravail/{id}' },
    { status: 405 }
  );
}
