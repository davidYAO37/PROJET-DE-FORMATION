import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/db/mongoConnect';
import { User } from '@/models/users.model';

export async function POST(req: Request) {
  try {
    await db();
    const { nom, prenom, email, type, uid, password, entrepriseId } = await req.json();

    if (!nom || !prenom || !email || !type || !uid || !password || !entrepriseId) {
      return NextResponse.json(
        { message: 'Tous les champs sont requis, y compris le mot de passe et l\'entreprise' },
        { status: 400 }
      );
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() }).lean();
    if (existing) {
      return NextResponse.json(
        { message: 'Un utilisateur avec cet email existe déjà' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      nom,
      prenom,
      email: email.toLowerCase().trim(),
      type,
      uid,
      password: hashedPassword,
      entrepriseId,
      failedAttempts: 0,
      remainingAttempts: 4,
      isLocked: false,
    });

    return NextResponse.json(
      { message: 'Utilisateur créé', user: { _id: newUser._id.toString(), email: newUser.email } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erreur création utilisateur :', error);
    return NextResponse.json({ message: 'Erreur serveur', details: error instanceof Error ? error.message : '' }, { status: 500 });
  }
}