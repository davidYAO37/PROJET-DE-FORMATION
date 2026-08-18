import { NextRequest } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IFacturation } from "@/models/Facturation";

export const dynamic = 'force-dynamic';

const ROLES = ['admin', 'medecin', 'accueil', 'infirmier', 'facturation', 'caisse'];

export async function GET(request: NextRequest) {
    const { context, response: tenantErrorResponse } = await withTenant(request, ROLES);
    if (!context) return tenantErrorResponse;
    const Facturation = getTenantModel<IFacturation>(context.connection, 'Facturation');

    try {
        // Récupérer toutes les facturations avec demande d'annulation
        const facturations = await Facturation.find({
            Ordonnerlannulation: true
        })
            .sort({ AnnulationOrdonneLe: -1 })
            .lean();

        return Response.json(facturations);
    } catch (error) {
        console.error('Error fetching facturations:', error);
        return Response.json(
            { error: 'Erreur lors de la récupération des facturations' },
            { status: 500 }
        );
    }
}