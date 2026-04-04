import { db } from "@/db/mongoConnect";
import { Facturation } from "@/models/Facturation";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        await db();

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