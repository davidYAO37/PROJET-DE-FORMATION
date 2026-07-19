import { NextResponse } from 'next/server';
import { db } from '@/db/mongoConnect';
import { Chambre } from '@/models/chambre';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await db();
        const { id } = await params;
        const chambre = await Chambre.findById(id).lean();
        if (!chambre) return NextResponse.json({ message: 'Introuvable' }, { status: 404 });
        return NextResponse.json(chambre);
    } catch (error) {
        console.error('Erreur chambre GET by id', error);
        return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await db();
        const { id } = await params;
        const body = await request.json();
        const updated = await Chambre.findByIdAndUpdate(
            id,
            {
                ...body,
                prixClinique: Number(body.prixClinique ?? 0),
                prixMutuel: Number(body.prixMutuel ?? 0),
                prixPreferentiel: Number(body.prixPreferentiel ?? 0),
                tarifJournalier: Number(body.tarifJournalier ?? body.prixClinique ?? 0),
                nombreLits: Number(body.nombreLits ?? 1),
            },
            { new: true }
        );

        if (!updated) return NextResponse.json({ message: 'Introuvable' }, { status: 404 });
        return NextResponse.json(updated);
    } catch (error) {
        console.error('Erreur chambre PUT', error);
        return NextResponse.json({ message: 'Erreur lors de la mise à jour' }, { status: 500 });
    }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await db();
        const { id } = await params;
        const deleted = await Chambre.findByIdAndDelete(id);
        if (!deleted) return NextResponse.json({ message: 'Introuvable' }, { status: 404 });
        return NextResponse.json({ message: 'Supprimée' });
    } catch (error) {
        console.error('Erreur chambre DELETE', error);
        return NextResponse.json({ message: 'Erreur lors de la suppression' }, { status: 500 });
    }
}
