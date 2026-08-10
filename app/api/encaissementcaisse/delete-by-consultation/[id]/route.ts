import { NextRequest, NextResponse } from 'next/server';
import { IEncaissementCaisse } from '@/models/EncaissementCaisse';
import { withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';

export const dynamic = 'force-dynamic';

// Supprimer tous les encaissements pour une consultation
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { context, response } = await withTenant(req, ["admin"]);
    if (!context) return response;
    const EncaissementCaisse = getTenantModel<IEncaissementCaisse>(context.connection, "EncaissementCaisse");

    try {
        const { id } = await params;

        // Supprimer tous les encaissements liés à cette consultation
        const result = await EncaissementCaisse.deleteMany({
            IDCONSULTATION: id
        });

        return NextResponse.json({
            success: true,
            deletedCount: result.deletedCount,
            message: `${result.deletedCount} encaissement(s) supprimé(s) pour la consultation`
        });

    } catch (error: any) {
        console.error('Erreur suppression encaissements consultation:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}