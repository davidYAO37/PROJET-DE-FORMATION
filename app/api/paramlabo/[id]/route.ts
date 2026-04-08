import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { ParamLabo } from "@/models/paramLabo";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await db();
    try {
        const { id } = await params;
        const body = await req.json();
        const updatedParamLabo = await ParamLabo.findByIdAndUpdate(
            id,
            body,
            { new: true, runValidators: true }
        );
        
        if (!updatedParamLabo) {
            return NextResponse.json({ error: "Paramètre non trouvé" }, { status: 404 });
        }
        
        return NextResponse.json(updatedParamLabo);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await db();
    
    try {
        const { id } = await params;
        const deletedParamLabo = await ParamLabo.findByIdAndDelete(id);
        
        if (!deletedParamLabo) {
            return NextResponse.json({ error: "Paramètre non trouvé" }, { status: 404 });
        }
        
        return NextResponse.json({ message: "Paramètre supprimé avec succès" });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
