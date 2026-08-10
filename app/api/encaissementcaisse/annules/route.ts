import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';
import { IEncaissementCaisseAnnule } from '@/models/EncaissementCaisseAnnule';

export const dynamic = 'force-dynamic';

const READ_ROLES = ["admin", "caisse", "comptable", "accueil"];

export async function GET(req: NextRequest) {
    try {
        const { context, response } = await withTenant(req, READ_ROLES);
        if (!context) return response;
        const EncaissementCaisseAnnule = getTenantModel<IEncaissementCaisseAnnule>(context.connection, "EncaissementCaisseAnnule");

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
