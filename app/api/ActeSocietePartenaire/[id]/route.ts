import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IActeSocietePartenaire } from "@/models/acteSocietePartenaire";

const WRITE_ROLES = ["admin"];

// PUT : modifier un acte société partenaire
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { context, response } = await withTenant(req, WRITE_ROLES);
    if (!context) return response;
    const ActeSocietePartenaire = getTenantModel<IActeSocietePartenaire>(context.connection, "ActeSocietePartenaire");
    try {
        const { id } = await params;
        const body = await req.json();
        const acteSocietePartenaire = await ActeSocietePartenaire.findByIdAndUpdate(id, body, { new: true });

        if (!acteSocietePartenaire) {
            return NextResponse.json({ error: "Acte société partenaire introuvable" }, { status: 404 });
        }

        return NextResponse.json(acteSocietePartenaire);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE : supprimer un acte société partenaire
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { context, response } = await withTenant(req, WRITE_ROLES);
    if (!context) return response;
    const ActeSocietePartenaire = getTenantModel<IActeSocietePartenaire>(context.connection, "ActeSocietePartenaire");
    try {
        const { id } = await params;
        const acteSocietePartenaire = await ActeSocietePartenaire.findByIdAndDelete(id);

        if (!acteSocietePartenaire) {
            return NextResponse.json({ error: "Acte société partenaire introuvable" }, { status: 404 });
        }

        return NextResponse.json({ message: "Supprimé avec succès" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
