import { NextRequest, NextResponse } from "next/server";
import { IStock } from "@/models/Stock";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";

const WRITE_ROLES = ["admin", "pharmacien"];

// -------------------- MODIFICATION D'UN STOCK --------------------
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { context, response } = await withTenant(req, WRITE_ROLES);
    if (!context) return response;
    const Stock = getTenantModel<IStock>(context.connection, "Stock");
    try {
        const { id } = await params;
        const body = await req.json();

        // Mettre à jour le stock
        const updated = await Stock.findByIdAndUpdate(id, body, { new: true });
        if (!updated) {
            return NextResponse.json({ error: "Stock introuvable" }, { status: 404 });
        }
        return NextResponse.json(updated);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}

// -------------------- SUPPRESSION D'UN STOCK --------------------
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { context, response } = await withTenant(req, WRITE_ROLES);
    if (!context) return response;
    const Stock = getTenantModel<IStock>(context.connection, "Stock");
    try {
        const { id } = await params;

        // Vérifier si le stock existe
        const stock = await Stock.findById(id);
        if (!stock) {
            return NextResponse.json({ error: "Stock introuvable" }, { status: 404 });
        }

        // Supprimer le stock
        await Stock.findByIdAndDelete(id);

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
