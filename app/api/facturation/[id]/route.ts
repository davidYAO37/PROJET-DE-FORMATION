import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { Facturation } from "@/models/Facturation";
import { db } from "@/db/mongoConnect";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await db();

    try {
        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: "ID invalide" }, { status: 400 });
        }

        const facturation = await Facturation.findById(id);

        if (!facturation) {
            return NextResponse.json({ error: "Facturation non trouvée" }, { status: 404 });
        }

        return NextResponse.json(facturation, { status: 200 });
    } catch (error: any) {
        console.error('Erreur API GET /api/facturation/[id]:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await db();

    try {
        const { id } = await params;
        const data = await req.json();

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: "ID invalide" }, { status: 400 });
        }

        const facturation = await Facturation.findById(id);
        if (!facturation) {
            return NextResponse.json({ error: "Facturation non trouvée" }, { status: 404 });
        }

        // Mise à jour des champs fournis (annulation ou autres modifications)
        Object.assign(facturation, data);
        await facturation.save();

        return NextResponse.json({ success: true, facturation }, { status: 200 });
    } catch (error: any) {
        console.error('Erreur API PATCH /api/facturation/[id]:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await db();

    try {
        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: "ID invalide" }, { status: 400 });
        }

        const facturation = await Facturation.findByIdAndDelete(id);

        if (!facturation) {
            return NextResponse.json({ error: "Facturation non trouvée" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Facturation supprimée" });
    } catch (error: any) {
        console.error('Erreur API DELETE /api/facturation/[id]:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
