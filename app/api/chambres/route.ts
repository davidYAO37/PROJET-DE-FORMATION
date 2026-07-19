import { NextResponse } from 'next/server';
import { db } from '@/db/mongoConnect';
import { Chambre } from '@/models/chambre';
import { Lit } from '@/models/lit';

export async function GET() {
    try {
        await db();
        const chambres = await Chambre.find().sort({ numero: 1 }).lean();
        return NextResponse.json(chambres);
    } catch (error) {
        console.error('Erreur chambres GET', error);
        return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await db();
        const body = await request.json();
        const chambre = await Chambre.create({
            ...body,
            prixClinique: Number(body.prixClinique || 0),
            prixMutuel: Number(body.prixMutuel || 0),
            prixPreferentiel: Number(body.prixPreferentiel || 0),
            tarifJournalier: Number(body.tarifJournalier || body.prixClinique || 0),
            nombreLits: Number(body.nombreLits || 1),
        });

        const nombreLits = Number(body.nombreLits || 1);
        const litsToCreate = Array.from({ length: nombreLits }, (_, index) => ({
            numero: `${chambre.numero}-${index + 1}`,
            chambreId: chambre._id,
            service: chambre.service,
            tarifJournalier: Number(body.tarifJournalier || body.prixClinique || 0),
            prixClinique: Number(body.prixClinique || 0),
            prixMutuel: Number(body.prixMutuel || 0),
            prixPreferentiel: Number(body.prixPreferentiel || 0),
            etat: 'libre',
        }));

        await Lit.insertMany(litsToCreate);
        return NextResponse.json(chambre, { status: 201 });
    } catch (error) {
        console.error('Erreur chambres POST', error);
        return NextResponse.json({ message: 'Erreur lors de la création' }, { status: 500 });
    }
}
