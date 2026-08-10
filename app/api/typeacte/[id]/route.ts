import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { ITypeActe } from "@/models/TypeActe";

const WRITE_ROLES = ["admin"];

// PUT : modifier un type d’acte
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { context, response } = await withTenant(req, WRITE_ROLES);
    if (!context) return response;
    const TypeActe = getTenantModel<ITypeActe>(context.connection, "TypeActe");
    try {
        const { id } = await params;
        const body = await req.json();
        const acte = await TypeActe.findByIdAndUpdate(id, body, { new: true });

        if (!acte) {
            return NextResponse.json({ error: "Type Acte introuvable" }, { status: 404 });
        }

        return NextResponse.json(acte);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE : supprimer un type d’acte
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { context, response } = await withTenant(req, WRITE_ROLES);
    if (!context) return response;
    const TypeActe = getTenantModel<ITypeActe>(context.connection, "TypeActe");
    try {
        const { id } = await params;
        const acte = await TypeActe.findByIdAndDelete(id);

        if (!acte) {
            return NextResponse.json({ error: "Type Acte introuvable" }, { status: 404 });
        }

        return NextResponse.json({ message: "Supprimé avec succès" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
