import { NextResponse } from 'next/server';
import { db } from '@/db/mongoConnect';
import mongoose from 'mongoose';

// Interface pour l'utilisateur
interface IUser {
  _id: string;
  name: string;
  uid: string;
  type: string;
  entrepriseId: string;
  email?: string;
  [key: string]: any;
}

export async function GET(request: Request) {
  try {
    await db();
    
    const { searchParams } = new URL(request.url);
    const entrepriseId = searchParams.get('entrepriseId');

    if (!entrepriseId) {
      return NextResponse.json(
        { error: 'entrepriseId est requis' },
        { status: 400 }
      );
    }

    // Vérifier si le modèle User existe déjà
    const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}, { strict: false }));

    // Récupérer les utilisateurs liés à l'entreprise
    const users = await User.find({ 
      entrepriseId: entrepriseId 
    }).select('name uid type email entrepriseId');

    return NextResponse.json({
      success: true,
      users: users,
      count: users.length
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des utilisateurs' },
      { status: 500 }
    );
  }
}
