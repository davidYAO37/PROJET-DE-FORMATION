import { NextResponse } from 'next/server';
import { db } from '@/db/mongoConnect';
import { EncaissementCaisseAnnule } from '@/models/EncaissementCaisseAnnule';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await db();

        const annulations = await EncaissementCaisseAnnule.find()
            .sort({ Annulerle: -1, createdAt: -1 })
            .lean();

        return NextResponse.json({ success: true, data: annulations });
    } catch (error) {
        console.error('Erreur lors de la récupération des annulations:', error);
        return NextResponse.json(
            { success: false, message: 'Erreur lors de la récupération des annulations' },
            { status: 500 }
        );
    }
}
