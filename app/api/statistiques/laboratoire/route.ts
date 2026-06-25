import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/mongoConnect';
import { ExamenHospitalisation } from '@/models/examenHospit';
import { LignePrestation } from '@/models/lignePrestation';
import { ResultatLignePrestation } from '@/models/resultatLignePrestation';

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

        const periodStart = dateDebutParam ? startOfDay(new Date(dateDebutParam)) : startOfDay(addDays(today, -29));
        const periodEnd = dateFinParam ? endOfDay(new Date(dateFinParam)) : endOfDay(today);
        const periodDays = Math.max(1, Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (24 * 60 * 60 * 1000)) + 1);

        const dateFilter = { dateretour: { $gte: periodStart, $lte: periodEnd } };
        const ligneFilter = { dateLignePrestation: { $gte: periodStart, $lte: periodEnd }, lettreCle: 'B' };

        const [
            totalExamens,
            examensEnAttente,
            examensValides,
            examensRetournes,
            patientsDistincts,
            topExamens,
            repartitionSexe,
            examensFamilleActe,
            montantTotal,
            resultatsSaisis,
        ] = await Promise.all([
            // KPI : Total examens biologiques sur la période
            ExamenHospitalisation.countDocuments({
                Designationtypeacte: 'EXAMEN BIOLOGIQUE',
                dateretour: { $gte: periodStart, $lte: periodEnd }
            }),
            // KPI : Examens en attente (statut < 5)
            ExamenHospitalisation.countDocuments({
                Designationtypeacte: 'EXAMEN BIOLOGIQUE',
                StatutLaboratoire: { $in: [1, 2, 3] },
                dateretour: { $gte: periodStart, $lte: periodEnd }
            }),
            // KPI : Examens validés (statut 5)
            ExamenHospitalisation.countDocuments({
                Designationtypeacte: 'EXAMEN BIOLOGIQUE',
                StatutLaboratoire: 5,
                dateretour: { $gte: periodStart, $lte: periodEnd }
            }),
            // KPI : Examens retournés (statut 4)
            ExamenHospitalisation.countDocuments({
                Designationtypeacte: 'EXAMEN BIOLOGIQUE',
                StatutLaboratoire: 4,
                dateretour: { $gte: periodStart, $lte: periodEnd }
            }),
            // KPI : Patients distincts
            ExamenHospitalisation.distinct('PatientP', {
                Designationtypeacte: 'EXAMEN BIOLOGIQUE',
                dateretour: { $gte: periodStart, $lte: periodEnd }
            }),
            // Top 10 examens les plus demandés
            LignePrestation.aggregate([
                { $match: { ...ligneFilter } },
                { $group: { _id: '$prestation', total: { $sum: '$qte' }, montant: { $sum: '$montantTotalAPayer' } } },
                { $sort: { total: -1 } },
                { $limit: 10 },
                { $project: { _id: 0, prestation: { $ifNull: ['$_id', 'Non renseigné'] }, total: 1, montant: 1 } }
            ]),
            // Répartition par sexe
            LignePrestation.aggregate([
                { $match: { ...ligneFilter } },
                { $group: { _id: '$sexe', total: { $sum: '$qte' } } },
                { $project: { _id: 0, sexe: { $ifNull: ['$_id', 'Non renseigné'] }, total: 1 } }
            ]),
            // Répartition par famille d'acte biologique
            LignePrestation.aggregate([
                { $match: { ...ligneFilter } },
                { $group: { _id: '$familleActe', total: { $sum: '$qte' }, montant: { $sum: '$montantTotalAPayer' } } },
                { $sort: { total: -1 } },
                { $limit: 8 },
                { $project: { _id: 0, famille: { $ifNull: ['$_id', 'Non classé'] }, total: 1, montant: 1 } }
            ]),
            // Montant total des actes biologiques
            LignePrestation.aggregate([
                { $match: { ...ligneFilter } },
                { $group: { _id: null, montant: { $sum: '$montantTotalAPayer' } } }
            ]),
            // Résultats saisis sur la période
            ResultatLignePrestation.countDocuments({
                dateSaisieResultat: { $gte: periodStart, $lte: periodEnd }
            }),
        ]);

        // Evolution journalière des examens
        const evolutionJournaliere = await Promise.all(
            Array.from({ length: Math.min(periodDays, 30) }).map(async (_, i) => {
                const day = startOfDay(addDays(periodStart, i));
                const dayEnd = endOfDay(day);
                const [recus, valides] = await Promise.all([
                    ExamenHospitalisation.countDocuments({
                        Designationtypeacte: 'EXAMEN BIOLOGIQUE',
                        dateretour: { $gte: day, $lte: dayEnd }
                    }),
                    ExamenHospitalisation.countDocuments({
                        Designationtypeacte: 'EXAMEN BIOLOGIQUE',
                        StatutLaboratoire: 5,
                        dateretour: { $gte: day, $lte: dayEnd }
                    }),
                ]);
                return {
                    date: day.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
                    recus,
                    valides,
                };
            })
        );

        // Taux de validation
        const tauxValidation = totalExamens > 0
            ? Math.round((examensValides / totalExamens) * 100)
            : 0;

        return NextResponse.json({
            periode: { dateDebut: periodStart, dateFin: periodEnd },
            kpis: {
                totalExamens,
                examensEnAttente,
                examensValides,
                examensRetournes,
                patients: patientsDistincts.length,
                montantTotal: montantTotal[0]?.montant || 0,
                resultatsSaisis,
                tauxValidation,
            },
            topExamens,
            repartitionSexe,
            examensFamilleActe,
            evolutionJournaliere,
        });

    } catch (error) {
        console.error('Erreur API statistiques laboratoire:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
