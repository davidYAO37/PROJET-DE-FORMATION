import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IModeDePaiement } from "@/models/ModeDePaiement";

const WRITE_ROLES = ["admin"];

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { context, response } = await withTenant(req, WRITE_ROLES);
    if (!context) return response;
    const ModeDePaiement = getTenantModel<IModeDePaiement>(context.connection, "ModeDePaiement");
    const body = await req.json();
    const { id } = await params;
    try {
        // Empêcher la duplication par valeur
        if (body?.Modepaiement) {
            const existant = await ModeDePaiement.findOne({
                _id: { $ne: id },
                Modepaiement: body.Modepaiement
            }).lean();
            if (existant) {
                return NextResponse.json({
                    success: false,
                    error: 'Ce mode de paiement existe déjà'
                }, { status: 409 });
            }
        }

        const modepaiements = await ModeDePaiement.findByIdAndUpdate(id, body, { new: true });
        return NextResponse.json(modepaiements);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { context, response } = await withTenant(req, WRITE_ROLES);
    if (!context) return response;
    const ModeDePaiement = getTenantModel<IModeDePaiement>(context.connection, "ModeDePaiement");
    const { id } = await params;
    try {
        await ModeDePaiement.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
