import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { ICommandeFournisseur } from "@/models/CommandeFournisseur";

const ROLES = ["admin","medecin","accueil","infirmier","pharmacien"];

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { context, response } = await withTenant(_req, ROLES);
    if (!context) return response;
    const CommandeFournisseur = getTenantModel<ICommandeFournisseur>(context.connection, "CommandeFournisseur");
    const { id } = await params;
    const commande = await CommandeFournisseur.findById(id).lean();
    if (!commande) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    return NextResponse.json(commande);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { context, response } = await withTenant(req, ROLES);
    if (!context) return response;
    const CommandeFournisseur = getTenantModel<ICommandeFournisseur>(context.connection, "CommandeFournisseur");
    const { id } = await params;
    const body = await req.json();
    try {
        const updated = await CommandeFournisseur.findByIdAndUpdate(id, body, { new: true });
        if (!updated) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
        return NextResponse.json(updated);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { context, response } = await withTenant(_req, ROLES);
    if (!context) return response;
    const CommandeFournisseur = getTenantModel<ICommandeFournisseur>(context.connection, "CommandeFournisseur");
    const { id } = await params;
    await CommandeFournisseur.findByIdAndUpdate(id, { Statut: "ANNULEE" });
    return NextResponse.json({ ok: true });
}
