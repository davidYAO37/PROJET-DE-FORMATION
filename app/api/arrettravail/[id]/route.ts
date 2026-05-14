import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import ArretTravail from '@/models/arretTravail';
import { db } from '@/db/mongoConnect';

// Connexion à la base de données
async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medical_db');
  }
}

// PUT - Mettre à jour un arrêt de travail spécifique
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await db();
    
    const { id } = params;
    const body = await request.json();
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'ID invalide' },
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
    if (body.dateDebut || body.dateFin) {
      const debut = new Date(body.dateDebut || arret.dateDebut);
      const fin = new Date(body.dateFin || arret.dateFin);
      
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
      body,
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

// DELETE - Supprimer un arrêt de travail spécifique
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await db();
    
    const { id } = params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'ID invalide' },
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
