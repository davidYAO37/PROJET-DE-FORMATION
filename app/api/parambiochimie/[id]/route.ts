import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IParamBiochimie } from "@/models/paramBiochimie";

const WRITE_ROLES = ["admin"];

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { context, response } = await withTenant(req, WRITE_ROLES);
    if (!context) return response;
    const ParamBiochimie = getTenantModel<IParamBiochimie>(context.connection, "ParamBiochimie");
    try {
        const { id } = await params;
        const body = await req.json();
        const updatedParamBiochimie = await ParamBiochimie.findByIdAndUpdate(
            id,
            body,
            { new: true, runValidators: true }
        );
        
        if (!updatedParamBiochimie) {
            return NextResponse.json({ error: "ParamBiochimie non trouvé" }, { status: 404 });
        }
        
        return NextResponse.json(updatedParamBiochimie);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { context, response } = await withTenant(req, WRITE_ROLES);
    if (!context) return response;
    const ParamBiochimie = getTenantModel<IParamBiochimie>(context.connection, "ParamBiochimie");

    try {
        const { id } = await params;
        const deletedParamBiochimie = await ParamBiochimie.findByIdAndDelete(id);
        
        if (!deletedParamBiochimie) {
            return NextResponse.json({ error: "ParamBiochimie non trouvé" }, { status: 404 });
        }
        
        return NextResponse.json({ message: "ParamBiochimie supprimé avec succès" });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
