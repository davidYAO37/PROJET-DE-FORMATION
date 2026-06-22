import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { ActeSocietePartenaire } from "@/models/acteSocietePartenaire";

// PUT : modifier un acte société partenaire
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await db();
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
    try {
        await db();
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
