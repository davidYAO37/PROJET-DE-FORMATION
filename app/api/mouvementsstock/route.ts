import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IEntreeStock } from "@/models/EntreeStock";
import { ISortieStock } from "@/models/SortieStock";

const ROLES = ["admin", "medecin", "accueil", "infirmier", "pharmacien"];

// GET /api/mouvementsstock?IDMEDICAMENT=xxx&reference=xxx
// Retourne l'historique unifié entrées + sorties triées par date
export async function GET(request: NextRequest) {
    const { context, response } = await withTenant(request, ROLES);
    if (!context) return response;
    const EntreeStock = getTenantModel<IEntreeStock>(context.connection, "EntreeStock");
    const SortieStock = getTenantModel<ISortieStock>(context.connection, "SortieStock");

    try {
        const { searchParams } = new URL(request.url);
        const IDMEDICAMENT = searchParams.get("IDMEDICAMENT");
        const reference = searchParams.get("reference");
        const entrepriseId = searchParams.get("entrepriseId");

        const entreeQuery: any = {};
        const sortieQuery: any = {};

        // Un mouvement appartient au médicament s'il porte son ID OU (anciens mouvements) sa référence
        const criteres: any[] = [];
        if (IDMEDICAMENT && mongoose.Types.ObjectId.isValid(IDMEDICAMENT)) criteres.push({ IDMEDICAMENT });
        if (reference) criteres.push({ Reference: reference });
        if (criteres.length) {
            entreeQuery.$or = criteres;
            sortieQuery.$or = criteres;
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
                motif: e.Motif || (e.IDAppro || e.IDAPPRO_LEGACY ? "Approvisionnement" : "Entrée manuelle"),
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
                IDMEDICAMENT: s.IDMEDICAMENT || null,
                modeVente: s.ModeVente || "DETAIL",
                qteConditionnement: s.QteConditionnement ?? null,
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
