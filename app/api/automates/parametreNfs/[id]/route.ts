import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IParametreNfs } from "@/models/parametreNfs";

const WRITE_ROLES = ["admin"];

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { context, response } = await withTenant(req, WRITE_ROLES);
    if (!context) return response;
    const ParametreNfs = getTenantModel<IParametreNfs>(context.connection, "ParametreNfs");
    try {
        const { id } = await params;
        const body = await req.json();
        const { PARAMETRE, DESCRIPTION } = body;

        if (!PARAMETRE) {
            return NextResponse.json({ message: "PARAMETRE est requis" }, { status: 400 });
        }

        const updated = await ParametreNfs.findByIdAndUpdate(
            id,
            { PARAMETRE, DESCRIPTION },
            { new: true }
        );

        if (!updated) {
            return NextResponse.json({ message: "Paramètre introuvable" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: updated, message: "Paramètre mis à jour" });
    } catch (error) {
        console.error("Erreur PUT ParametreNfs:", error);
        return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { context, response } = await withTenant(_req, WRITE_ROLES);
    if (!context) return response;
    const ParametreNfs = getTenantModel<IParametreNfs>(context.connection, "ParametreNfs");
    try {
        const { id } = await params;
        const deleted = await ParametreNfs.findByIdAndDelete(id);

        if (!deleted) {
            return NextResponse.json({ message: "Paramètre introuvable" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Paramètre supprimé" });
    } catch (error) {
        console.error("Erreur DELETE ParametreNfs:", error);
        return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
    }
}
