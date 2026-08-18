import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IEntreeStock } from "@/models/EntreeStock";
import { IStock } from "@/models/Stock";
import { IPharmacie } from "@/models/Pharmacie";

const ROLES = ["admin", "medecin", "accueil", "infirmier", "pharmacien"];

export async function POST(req: NextRequest) {
    const { context, response } = await withTenant(req, ROLES);
    if (!context) return response;
    const EntreeStock = getTenantModel<IEntreeStock>(context.connection, "EntreeStock");
    const Stock = getTenantModel<IStock>(context.connection, "Stock");
    const Pharmacie = getTenantModel<IPharmacie>(context.connection, "Pharmacie");
    try {
        const body = await req.json();

        // Récupérer le conditionnement du médicament
        const med = body.IDMEDICAMENT ? await Pharmacie.findById(body.IDMEDICAMENT).lean() : null;
        const qteParCond = med?.QteParConditionnement || 1;
        const mode = body.ModeVente === "BOITE" ? "BOITE" : "DETAIL";
        const qteCond = Number(body.Quantite) || 0;
        const qteUnites = mode === "BOITE" ? qteCond * qteParCond : qteCond;

        // Prix conditionnement / unitaire
        const prixAchatCond = Number(body.PrixAchatConditionnement) || (mode === "BOITE" ? Number(body.PrixAchat) || 0 : (Number(body.PrixAchat) || 0) * qteParCond);
        const prixAchatUnite = qteParCond > 0 ? prixAchatCond / qteParCond : (mode === "DETAIL" ? Number(body.PrixAchat) || 0 : 0);

        const entreeData = {
            ...body,
            Quantite: qteUnites,
            QteConditionnement: mode === "BOITE" ? qteCond : undefined,
            PrixAchat: prixAchatUnite,
            PrixAchatConditionnement: mode === "BOITE" ? prixAchatCond : undefined,
        };

        const entree = await EntreeStock.create(entreeData);

        // Mise à jour du stock physique
        if (body.IDMEDICAMENT && qteUnites) {
            const stock = await Stock.findOne({ IDMEDICAMENT: body.IDMEDICAMENT });
            if (stock) {
                await Stock.findByIdAndUpdate(stock._id, {
                    QteEnStock: (stock.QteEnStock ?? 0) + qteUnites,
                    AuteurModif: body.SaisiPar,
                    DateModif: new Date(),
                });
            }
        }

        return NextResponse.json(entree, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
