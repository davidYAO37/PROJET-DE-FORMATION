import { NextResponse } from 'next/server';
import { db } from '@/db/mongoConnect';
import { Hospitalisation } from '@/models/hospitalisation';
import { Lit } from '@/models/lit';
import { Chambre } from '@/models/chambre';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await db();
        const { id } = await params;
        const hospitalisation = await Hospitalisation.findById(id).lean();
        if (!hospitalisation) return NextResponse.json({ message: 'Introuvable' }, { status: 404 });
        return NextResponse.json(hospitalisation);
    } catch (error) {
        console.error('Erreur hospitalisation GET by id', error);
        return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await db();
        const { id } = await params;
        const body = await request.json();
        const existing = await Hospitalisation.findById(id);

        if (!existing) {
            return NextResponse.json({ message: 'Introuvable' }, { status: 404 });
        }

        const previousLitId = existing.litId?.toString();
        const previousChambreId = existing.chambreId?.toString();
        const nextLitId = body.litId ? body.litId.toString() : previousLitId;
        const nextChambreId = body.chambreId ? body.chambreId.toString() : previousChambreId;

        const shouldRelease = body.statut === 'sortie' || body.statut === 'transfere' || body.statut === 'decede';

        if (shouldRelease) {
            if (previousLitId) {
                await Lit.findByIdAndUpdate(previousLitId, {
                    etat: 'libre',
                    patientId: undefined,
                    dateLiberation: new Date(),
                });
            }

            if (previousChambreId) {
                const activeInRoom = await Hospitalisation.findOne({
                    chambreId: previousChambreId,
                    statut: 'en_cours',
                    _id: { $ne: existing._id },
                });

                if (!activeInRoom) {
                    await Chambre.findByIdAndUpdate(previousChambreId, { etat: 'libre' });
                }
            }
        } else {
            if (previousLitId && nextLitId && previousLitId !== nextLitId) {
                await Lit.findByIdAndUpdate(previousLitId, {
                    etat: 'libre',
                    patientId: undefined,
                    dateLiberation: new Date(),
                });
            }

            if (previousChambreId && nextChambreId && previousChambreId !== nextChambreId) {
                const activeInRoom = await Hospitalisation.findOne({
                    chambreId: previousChambreId,
                    statut: 'en_cours',
                    _id: { $ne: existing._id },
                });

                if (!activeInRoom) {
                    await Chambre.findByIdAndUpdate(previousChambreId, { etat: 'libre' });
                }
            }
        }

        const updated = await Hospitalisation.findByIdAndUpdate(id, body, { new: true });

        if (updated?.litId) {
            await Lit.findByIdAndUpdate(updated.litId, {
                etat: 'occupe',
                patientId: updated.patientId,
                dateOccupation: new Date(),
            });
        }

        if (updated?.chambreId) {
            await Chambre.findByIdAndUpdate(updated.chambreId, { etat: 'occupee' });
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Erreur hospitalisation PUT', error);
        return NextResponse.json({ message: 'Erreur lors de la mise à jour' }, { status: 500 });
    }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await db();
        const { id } = await params;
        const deleted = await Hospitalisation.findByIdAndDelete(id);
        if (deleted?.litId) {
            await Lit.findByIdAndUpdate(deleted.litId, { etat: 'libre', patientId: undefined, dateLiberation: new Date() });
        }
        if (deleted?.chambreId) {
            await Chambre.findByIdAndUpdate(deleted.chambreId, { etat: 'libre' });
        }
        return NextResponse.json({ message: 'Supprimé' });
    } catch (error) {
        console.error('Erreur hospitalisation DELETE', error);
        return NextResponse.json({ message: 'Erreur lors de la suppression' }, { status: 500 });
    }
}
