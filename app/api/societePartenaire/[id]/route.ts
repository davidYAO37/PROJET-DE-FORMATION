import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { ISocietePartenaire } from "@/models/SocietePartenaire";

const WRITE_ROLES = ["admin"];

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { context, response } = await withTenant(req, WRITE_ROLES);
    if (!context) return response;
    const SocietePartenaire = getTenantModel<ISocietePartenaire>(context.connection, "SocietePartenaire");
    try {
        const { id } = await params;
        const body = await req.json();
        const societe = await SocietePartenaire.findByIdAndUpdate(id, body, { new: true });

        if (!societe) {
            return NextResponse.json({ error: "Société partenaire introuvable" }, { status: 404 });
        }

        return NextResponse.json(societe);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { context, response } = await withTenant(_req, WRITE_ROLES);
    if (!context) return response;
    const SocietePartenaire = getTenantModel<ISocietePartenaire>(context.connection, "SocietePartenaire");
    try {
        const { id } = await params;
        const societe = await SocietePartenaire.findByIdAndDelete(id);

        if (!societe) {
            return NextResponse.json({ error: "Société partenaire introuvable" }, { status: 404 });
        }

        return NextResponse.json({ message: "Supprimé avec succès" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
