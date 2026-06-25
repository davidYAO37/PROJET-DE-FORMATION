import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/mongoConnect';
import { ExamenHospitalisation } from '@/models/examenHospit';

const startOfDay = (d: Date) => { const v = new Date(d); v.setHours(0, 0, 0, 0); return v; };
const endOfDay = (d: Date) => { const v = new Date(d); v.setHours(23, 59, 59, 999); return v; };

export async function GET(req: NextRequest) {
    try {
        await db();

        const { searchParams } = new URL(req.url);
        const dateDebutParam = searchParams.get('dateDebut');
        const dateFinParam = searchParams.get('dateFin');

        if (!dateDebutParam || !dateFinParam) {
            return NextResponse.json({ error: 'dateDebut et dateFin sont requis' }, { status: 400 });
        }

        const dateDebut = startOfDay(new Date(dateDebutParam));
        const dateFin = endOfDay(new Date(dateFinParam));

        const examens = await ExamenHospitalisation.find(
            {
                Designationtypeacte: 'EXAMEN BIOLOGIQUE',
                Datetransferbiologiste: { $gte: dateDebut, $lte: dateFin },
                StatutLaboratoire: 3,
            },
            {
                _id: 1,
                CodePrestation: 1,
                Designationtypeacte: 1,
                PatientP: 1,
                StatutLaboratoire: 1,
                IdPatient: 1,
                Datetransferbiologiste: 1,
            }
        )
            .sort({ Datetransferbiologiste: -1 })
            .lean();

        return NextResponse.json({ success: true, total: examens.length, examens });

    } catch (error) {
        console.error('Erreur API examens à valider:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
