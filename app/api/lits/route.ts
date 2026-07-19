import { NextResponse } from 'next/server';
import { db } from '@/db/mongoConnect';
import { Lit } from '@/models/lit';

export async function GET() {
    try {
        await db();
        const lits = await Lit.find().sort({ numero: 1 }).lean();
        return NextResponse.json(lits);
    } catch (error) {
        console.error('Erreur lits GET', error);
        return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await db();
        const body = await request.json();
        const lit = await Lit.create({
            ...body,
            tarifJournalier: Number(body.tarifJournalier || 0),
            prixClinique: Number(body.prixClinique || 0),
            prixMutuel: Number(body.prixMutuel || 0),
            prixPreferentiel: Number(body.prixPreferentiel || 0),
        });
        return NextResponse.json(lit, { status: 201 });
    } catch (error) {
        console.error('Erreur lits POST', error);
        return NextResponse.json({ message: 'Erreur lors de la création' }, { status: 500 });
    }
}
