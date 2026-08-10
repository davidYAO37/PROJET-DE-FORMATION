import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IFamilleActe } from "@/models/familleActe";

const WRITE_ROLES = ["admin"];

// PUT : modifier une famille bilologique
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { context, response } = await withTenant(req, WRITE_ROLES);
    if (!context) return response;
    const FamilleActe = getTenantModel<IFamilleActe>(context.connection, "FamilleActe");
    try {
        const { id } = await params;
        const body = await req.json();
        const acte = await FamilleActe.findByIdAndUpdate(id, body, { new: true });

        if (!acte) {
            return NextResponse.json({ error: "Famille acte biologique introuvable" }, { status: 404 });
        }

        return NextResponse.json(acte);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE : supprimer une famille biologique
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { context, response } = await withTenant(req, WRITE_ROLES);
    if (!context) return response;
    const FamilleActe = getTenantModel<IFamilleActe>(context.connection, "FamilleActe");
    try {
        const { id } = await params;
        const acte = await FamilleActe.findByIdAndDelete(id);

        if (!acte) {
            return NextResponse.json({ error: "Famille actes biologiques introuvable" }, { status: 404 });
        }

        return NextResponse.json({ message: "Supprimé avec succès" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
