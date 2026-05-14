import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

// Connexion à la base de données
async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bd_esaymed');
  }
}

// Schéma simple pour tester
const SimpleArretSchema = new mongoose.Schema({
  patientId: { type: String, required: true },
  patientNom: { type: String, required: true },
  patientPrenoms: { type: String, required: true },
  dateDebut: { type: Date, required: true },
  dateFin: { type: Date, required: true },
  motif: { type: String, required: true },
  medecinTraitant: { type: String, required: true },
  statut: { type: String, enum: ['en_cours', 'termine', 'annule'], default: 'en_cours' },
  numeroDocument: { type: String, required: true, unique: true },
  dateCreation: { type: Date, default: Date.now }
}, { collection: 'arrettravails' });

const SimpleArret = mongoose.models.SimpleArret || mongoose.model('SimpleArret', SimpleArretSchema);

// GET - Test simple
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    
    if (patientId) {
      const arrets = await SimpleArret.find({ patientId }).sort({ dateCreation: -1 });
      return NextResponse.json({
        success: true,
        data: arrets,
        message: 'Test récupération réussie'
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'API arrettravail-simple fonctionne',
      models: mongoose.modelNames(),
      connectionState: mongoose.connection.readyState
    });
    
  } catch (error: any) {
    console.error('Erreur GET arrettravail-simple:', error);
    return NextResponse.json(
      { success: false, error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}

// POST - Test simple
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    
    console.log('Données reçues:', body);
    
    const { patientId, dateDebut, dateFin, motif, medecinTraitant } = body;
    
    if (!patientId || !dateDebut || !dateFin || !motif || !medecinTraitant) {
      return NextResponse.json(
        { success: false, error: 'Champs requis manquants' },
        { status: 400 }
      );
    }
    
    // Créer un arrêt simple
    const nouvelArret = new SimpleArret({
      ...body,
      numeroDocument: `AT-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    });
    
    await nouvelArret.save();
    
    return NextResponse.json({
      success: true,
      message: 'Arrêt de travail créé avec succès (test)',
      data: nouvelArret
    });
    
  } catch (error: any) {
    console.error('Erreur POST arrettravail-simple:', error);
    return NextResponse.json(
      { success: false, error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}
