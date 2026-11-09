import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { convertirEnUnites, enregistrerEntree, stockErrorResponse, ROLES_MOUVEMENT_PHARMACIE } from "@/lib/stockService";

export async function POST(req: NextRequest) {
    const { context, response } = await withTenant(req, ROLES_MOUVEMENT_PHARMACIE);
    if (!context) return response;
    try {
        const body = await req.json();

        // Récupérer le conditionnement du médicament
        const { mode, qteParCond, qteUnites, qteConditionnement } = await convertirEnUnites(context, body.IDMEDICAMENT, body.Quantite, body.ModeVente);

        // Prix conditionnement / unitaire
        const prixAchatCond = Number(body.PrixAchatConditionnement) || (mode === "BOITE" ? Number(body.PrixAchat) || 0 : (Number(body.PrixAchat) || 0) * qteParCond);
        const prixAchatUnite = qteParCond > 0 ? prixAchatCond / qteParCond : (mode === "DETAIL" ? Number(body.PrixAchat) || 0 : 0);

        // Le stock est créé s'il n'existe pas encore (auparavant l'entrée était perdue)
        const entree = await enregistrerEntree(context, {
            ...body,
            Motif: body.Motif || "Entrée manuelle",
            Quantite: qteUnites,
            QteConditionnement: qteConditionnement,
            PrixAchat: prixAchatUnite,
            PrixAchatConditionnement: mode === "BOITE" ? prixAchatCond : undefined,
        });

        return NextResponse.json(entree, { status: 201 });
    } catch (err: any) {
        return stockErrorResponse(err);
    }
}
