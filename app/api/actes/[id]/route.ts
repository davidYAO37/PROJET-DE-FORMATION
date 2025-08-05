import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { ActeClinique } from "@/models/acteclinique";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await db();
    try {
        const { id } = await params;
        const deleted = await ActeClinique.findByIdAndDelete(id);
        if (!deleted) {
            return NextResponse.json({ error: "Acte introuvable" }, { status: 404 });
        }
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}


/* import { NextRequest, NextResponse } from "next/server";
import { ActeClinique } from "@/models/acteclinique";
import { db } from "@/db/mongoConnect";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await db();
    const body = await req.json();
    try {
        const acte = await ActeClinique.findByIdAndUpdate(params.id, body, { new: true });
        return NextResponse.json(acte);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await db();
    try {
        await ActeClinique.findByIdAndDelete(params.id);
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
 */