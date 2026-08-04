import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { ICommandeFournisseur } from "@/models/CommandeFournisseur";

const ROLES = ["admin", "medecin", "accueil", "infirmier"];

export async function GET(req: NextRequest) {
    const { context, response } = await withTenant(req, ROLES);
    if (!context) return response;
    const CommandeFournisseur = getTenantModel<ICommandeFournisseur>(context.connection, "CommandeFournisseur");
    const { searchParams } = new URL(req.url);
    const statut       = searchParams.get("statut");
    const idFournisseur = searchParams.get("IDFournisseur");

    const query: any = {};
    if (statut)        query.Statut        = statut;
    if (idFournisseur) query.IDFournisseur = idFournisseur;

    const commandes = await CommandeFournisseur.find(query).sort({ DateCommande: -1 }).lean();
    return NextResponse.json(commandes);
}

export async function POST(req: NextRequest) {
    const { context, response } = await withTenant(req, ROLES);
    if (!context) return response;
    const CommandeFournisseur = getTenantModel<ICommandeFournisseur>(context.connection, "CommandeFournisseur");
    const body = await req.json();
    try {
        // Générer un numéro de commande automatique si absent
        if (!body.NumeroCommande) {
            const count = await CommandeFournisseur.countDocuments();
            body.NumeroCommande = `CMD-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
        }
        body.SaisiLe = new Date();
        const commande = await CommandeFournisseur.create(body);
        return NextResponse.json(commande, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
