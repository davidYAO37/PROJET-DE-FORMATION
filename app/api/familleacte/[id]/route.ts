import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { FamilleActe } from "@/models/familleActe";

// PUT : modifier une famille bilologique
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await db();
        const { id } = await params;
        const body = await req.json();
        const acte = await FamilleActe.findByIdAndUpdate(id, body, { new: true });

        if (!acte) {
            return NextResponse.json({ error: "Famille acte biologique introuvable" }, { status: 404 });
        }

        return NextResponse.json(acte);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE : supprimer une famille biologique
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await db();
        const { id } = await params;
        const acte = await FamilleActe.findByIdAndDelete(id);

        if (!acte) {
            return NextResponse.json({ error: "Famille actes biologiques introuvable" }, { status: 404 });
        }

        return NextResponse.json({ message: "Supprimé avec succès" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
