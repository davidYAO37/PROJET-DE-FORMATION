import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/mongoConnect';
import { LignePrestation } from '@/models/lignePrestation';

const startOfDay = (d: Date) => { const v = new Date(d); v.setHours(0, 0, 0, 0); return v; };
const endOfDay = (d: Date) => { const v = new Date(d); v.setHours(23, 59, 59, 999); return v; };
const addDays = (d: Date, n: number) => { const v = new Date(d); v.setDate(v.getDate() + n); return v; };

export async function GET(req: NextRequest) {
    try {
        await db();

        const { searchParams } = new URL(req.url);
        const today = new Date();
        const dateDebutParam = searchParams.get('dateDebut');
        const dateFinParam = searchParams.get('dateFin');
        const mode = searchParams.get('mode') || 'acte'; // 'acte' | 'famille'

        const periodStart = dateDebutParam ? startOfDay(new Date(dateDebutParam)) : startOfDay(addDays(today, -29));
        const periodEnd = dateFinParam ? endOfDay(new Date(dateFinParam)) : endOfDay(today);

        const baseMatch = {
            lettreCle: 'B',
            statutPrescriptionMedecin: 3,
            datePaiementCaisse: { $gte: periodStart, $lte: periodEnd },
        };

        // Totaux de la période (dénominateur pour les %)
        const totauxPeriode = await LignePrestation.aggregate([
            { $match: baseMatch },
            {
                $group: {
                    _id: null,
                    montantTotal: { $sum: { $ifNull: ['$prixTotal', 0] } },
                    nombreTotal: { $sum: 1 },
                }
            }
        ]);

        const montantTotal: number = totauxPeriode[0]?.montantTotal || 0;
        const nombreTotal: number = totauxPeriode[0]?.nombreTotal || 0;

        let lignes: any[] = [];

        if (mode === 'famille') {
            // Regroupement par famille d'acte biologique
            const raw = await LignePrestation.aggregate([
                { $match: baseMatch },
                {
                    $lookup: {
                        from: 'familleactes',
                        localField: 'idFamilleActeBiologie',
                        foreignField: '_id',
                        as: 'familleInfo',
                    }
                },
                { $unwind: { path: '$familleInfo', preserveNullAndEmptyArrays: true } },
                {
                    $group: {
                        _id: {
                            familleId: '$idFamilleActeBiologie',
                            familleLabel: { $ifNull: ['$familleInfo.Description', { $ifNull: ['$familleActe', 'Non classé'] }] },
                        },
                        montant: { $sum: { $ifNull: ['$prixTotal', 0] } },
                        nombre: { $sum: 1 },
                    }
                },
                { $sort: { montant: -1 } },
            ]);

            lignes = raw.map((r: any) => ({
                label: r._id.familleLabel || 'Non classé',
                montant: r.montant,
                pourcentageMontant: montantTotal > 0 ? (r.montant * 100) / montantTotal : 0,
                nombre: r.nombre,
                pourcentageNombre: nombreTotal > 0 ? (r.nombre * 100) / nombreTotal : 0,
            }));
        } else {
            // Regroupement par acte (prestation) avec lookup famille
            const raw = await LignePrestation.aggregate([
                { $match: baseMatch },
                {
                    $lookup: {
                        from: 'familleactes',
                        localField: 'idFamilleActeBiologie',
                        foreignField: '_id',
                        as: 'familleInfo',
                    }
                },
                { $unwind: { path: '$familleInfo', preserveNullAndEmptyArrays: true } },
                {
                    $group: {
                        _id: {
                            acteId: '$idActe',
                            acteLabel: '$prestation',
                            famille: { $ifNull: ['$familleInfo.Description', { $ifNull: ['$familleActe', ''] }] },
                        },
                        montant: { $sum: { $ifNull: ['$prixTotal', 0] } },
                        nombre: { $sum: 1 },
                    }
                },
                { $sort: { montant: -1 } },
            ]);

            lignes = raw.map((r: any) => ({
                label: r._id.acteLabel || 'Non renseigné',
                famille: r._id.famille || '',
                montant: r.montant,
                pourcentageMontant: montantTotal > 0 ? (r.montant * 100) / montantTotal : 0,
                nombre: r.nombre,
                pourcentageNombre: nombreTotal > 0 ? (r.nombre * 100) / nombreTotal : 0,
            }));
        }

        return NextResponse.json({
            success: true,
            periode: { dateDebut: periodStart, dateFin: periodEnd },
            totaux: { montantTotal, nombreTotal },
            mode,
            lignes,
        });

    } catch (error) {
        console.error('Erreur API relevé compte biologie:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
