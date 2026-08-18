import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IFournisseur } from "@/models/Fournisseur";

const ROLES = ["admin","medecin","accueil","infirmier","pharmacien"];

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { context, response } = await withTenant(req, ROLES);
    if (!context) return response;
    const Fournisseur = getTenantModel<IFournisseur>(context.connection, "Fournisseur");
    try {
        const { id } = await params;
        const body = await req.json();
        const updated = await Fournisseur.findByIdAndUpdate(id, body, { new: true });
        if (!updated) return NextResponse.json({ error: "Fournisseur introuvable" }, { status: 404 });
        return NextResponse.json(updated);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { context, response } = await withTenant(req, ROLES);
    if (!context) return response;
    const Fournisseur = getTenantModel<IFournisseur>(context.connection, "Fournisseur");
    try {
        const { id } = await params;
        await Fournisseur.findByIdAndUpdate(id, { Actif: false });
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
