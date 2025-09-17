// PUT /api/societeassurance
export async function PUT(request: Request) {
    const body = await request.json();
    const { id, societe } = body;
    await db();
    if (!id || !societe) {
        return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
    }
    const doc = await SocieteAssurance.findByIdAndUpdate(id, { societe }, { new: true });
    if (!doc) {
        return NextResponse.json({ error: "Société non trouvée" }, { status: 404 });
    }
    // Retourne la liste à jour (par assurance)
    const societes = await SocieteAssurance.find({ Assurance: doc.Assurance }).lean();
    return NextResponse.json(societes);
}

// DELETE /api/societeassurance
export async function DELETE(request: Request) {
    const body = await request.json();
    const { id } = body;
    await db();
    if (!id) {
        return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }
    const doc = await SocieteAssurance.findByIdAndDelete(id);
    if (!doc) {
        return NextResponse.json({ error: "Société non trouvée" }, { status: 404 });
    }
    // Retourne la liste à jour (par assurance)
    const societes = await SocieteAssurance.find({ Assurance: doc.Assurance }).lean();
    return NextResponse.json(societes);
}
import { NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { SocieteAssurance } from "@/models/SocieteAssurance";

// GET /api/societeassurance?assuranceId=xxx
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const assuranceId = searchParams.get("assuranceId");
    await db();
    if (!assuranceId) {
        return NextResponse.json([], { status: 200 });
    }
    const societes = await SocieteAssurance.find({ Assurance: assuranceId }).lean();
    return NextResponse.json(societes);
}

// POST /api/societeassurance
export async function POST(request: Request) {
    const body = await request.json();
    const { societe, assuranceId } = body;
    await db();
    if (!assuranceId || !societe) {
        return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
    }
    await SocieteAssurance.create({
        societe,
        Assurance: assuranceId,
    });
    // Retourne la liste à jour
    const societes = await SocieteAssurance.find({ Assurance: assuranceId }).lean();
    return NextResponse.json(societes);
}
