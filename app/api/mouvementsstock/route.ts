import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { EntreeStock } from "@/models/EntreeStock";
import { SortieStock } from "@/models/SortieStock";

// GET /api/mouvementsstock?IDMEDICAMENT=xxx&reference=xxx
// Retourne l'historique unifié entrées + sorties triées par date
export async function GET(request: NextRequest) {
    await db();

    try {
        const { searchParams } = new URL(request.url);
        const IDMEDICAMENT = searchParams.get("IDMEDICAMENT");
        const reference = searchParams.get("reference");
        const entrepriseId = searchParams.get("entrepriseId");

        const entreeQuery: any = {};
        const sortieQuery: any = {};

        if (IDMEDICAMENT) {
            entreeQuery.IDMEDICAMENT = IDMEDICAMENT;
        }
        if (reference) {
            entreeQuery.Reference = reference;
            sortieQuery.Reference = reference;
        }
        if (entrepriseId) {
            entreeQuery.entrepriseId = entrepriseId;
            sortieQuery.entrepriseId = entrepriseId;
        }

        const [entrees, sorties] = await Promise.all([
            EntreeStock.find(entreeQuery).lean(),
            SortieStock.find(sortieQuery).lean(),
        ]);

        const mouvements = [
            ...entrees.map((e: any) => ({
                _id: e._id,
                type: "ENTREE",
                date: e.DateAppro || e.createdAt,
                reference: e.Reference,
                medicament: e.Medicament,
                IDMEDICAMENT: e.IDMEDICAMENT,
                quantite: e.Quantite,
                prixUnitaire: e.PrixAchat,
                montantTotal: e.MontantTTCE,
                motif: "Approvisionnement",
                saisiPar: e.SaisiPar,
                numLot: e.NumeroLot || "",
                datePeremption: e.DatePeremption || null,
                observations: e.Observations,
            })),
            ...sorties.map((s: any) => ({
                _id: s._id,
                type: "SORTIE",
                date: s.DateSortie || s.createdAt,
                reference: s.Reference,
                medicament: s.ArticleS,
                IDMEDICAMENT: null,
                quantite: s.Quantite,
                prixUnitaire: s.Prix_unitaire,
                montantTotal: s.Prix_TotalS,
                motif: s.Motif || "Vente",
                saisiPar: s.SaisiPar,
                numLot: "",
                datePeremption: null,
                observations: s.Observations,
                prescription: s.Prescription,
                patient: s.Patient,
            })),
        ];

        // Trier par date décroissante
        mouvements.sort((a, b) => {
            const dA = a.date ? new Date(a.date).getTime() : 0;
            const dB = b.date ? new Date(b.date).getTime() : 0;
            return dB - dA;
        });

        return NextResponse.json(mouvements);
    } catch (error: any) {
        console.error("Erreur GET /api/mouvementsstock:", error);
        return NextResponse.json(
            { error: "Erreur lors de la récupération des mouvements", details: error.message },
            { status: 500 }
        );
    }
}
