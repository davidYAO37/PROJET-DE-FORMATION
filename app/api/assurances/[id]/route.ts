import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IAssurance } from "@/models/assurance";

const WRITE_ROLES = ["admin"];

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { context, response } = await withTenant(req, WRITE_ROLES);
    if (!context) return response;
    const Assurance = getTenantModel<IAssurance>(context.connection, "Assurance");
    const body = await req.json();
    const { id } = await params;
    try {
        const assurance = await Assurance.findByIdAndUpdate(id, body, { new: true });
        return NextResponse.json(assurance);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { context, response } = await withTenant(req, WRITE_ROLES);
    if (!context) return response;
    const Assurance = getTenantModel<IAssurance>(context.connection, "Assurance");
    const { id } = await params;
    try {
        await Assurance.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
