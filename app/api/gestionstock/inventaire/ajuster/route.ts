import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { Stock } from "@/models/Stock";
import { EntreeStock } from "@/models/EntreeStock";
import { SortieStock } from "@/models/SortieStock";
import { HistoriqueInventaire } from "@/models/HistoriqueInventaire";

// POST /api/gestionstock/inventaire/ajuster
// Body: { lignes: [{ stockId, IDMEDICAMENT, Medicament, Reference, qteTheorique, qtePhysique, saisiPar }] }
export async function POST(req: NextRequest) {
    await db();
    try {
        const { lignes, saisiPar } = await req.json();
        const now = new Date();
        const resultats = [];

        for (const ligne of lignes) {
            const ecart = ligne.qtePhysique - ligne.qteTheorique;
            if (ecart === 0) continue;

            // Mettre à jour le stock
            await Stock.findByIdAndUpdate(ligne.stockId, {
                QteEnStock: ligne.qtePhysique,
                AuteurModif: saisiPar,
                DateModif: now,
            });

            // Tracer le mouvement
            if (ecart > 0) {
                // Entrée : on a plus que prévu
                await EntreeStock.create({
                    DateAppro: now,
                    Reference: ligne.Reference,
                    Medicament: ligne.Medicament,
                    IDMEDICAMENT: ligne.IDMEDICAMENT,
                    Quantite: ecart,
                    PrixAchat: 0,
                    PrixVente: 0,
                    PRIXTHT: 0,
                    MontantTTCE: 0,
                    Motif: "Ajustement inventaire",
                    Observations: `Inventaire physique : théorique ${ligne.qteTheorique}, compté ${ligne.qtePhysique}`,
                    SaisiPar: saisiPar,
                    SaisiLe: now,
                });
            } else {
                // Sortie : on a moins que prévu
                await SortieStock.create({
                    DateSortie: now,
                    Reference: ligne.Reference,
                    ArticleS: ligne.Medicament,
                    IDMEDICAMENT: ligne.IDMEDICAMENT,
                    Quantite: Math.abs(ecart),
                    Prix_unitaire: 0,
                    Prix_TotalS: 0,
                    Motif: "Ajustement inventaire",
                    TypeMouvement: "Ajustement inventaire",
                    Observations: `Inventaire physique : théorique ${ligne.qteTheorique}, compté ${ligne.qtePhysique}`,
                    SaisiPar: saisiPar,
                    SaisiLe: now,
                });
            }

            resultats.push({ stockId: ligne.stockId, ecart });
        }

        // Sauvegarder la session d'inventaire
        await HistoriqueInventaire.create({
            DateInventaire: now,
            SaisiPar: saisiPar,
            NbLignes: resultats.length,
            Lignes: lignes.map((l: any) => ({
                IDMEDICAMENT: l.IDMEDICAMENT,
                Medicament: l.Medicament,
                Reference: l.Reference,
                QteTheorique: l.qteTheorique,
                QtePhysique: l.qtePhysique,
                Ecart: l.qtePhysique - l.qteTheorique,
            })),
        });

        return NextResponse.json({ success: true, ajustements: resultats.length });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
