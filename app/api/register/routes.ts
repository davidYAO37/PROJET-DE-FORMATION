import { NextResponse } from 'next/server';
import { db } from '@/db/mongoConnect';
import { UserCollection } from '@/models/users.model';

export async function POST(req: Request) {
  try {
    await db();
    const { nom, prenom, email, type, uid, } = await req.json();



    const newUser = await UserCollection.create({
      nom,
      prenom,
      email,
      type,
      uid,
    });

    return NextResponse.json({ message: 'Utilisateur créé', user: newUser });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}