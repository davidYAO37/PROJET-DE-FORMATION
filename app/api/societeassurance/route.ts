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

    // Retourner uniquement les sociétés de l'assurance concernée
    const societes = await SocieteAssurance.find({ Assurance: assuranceId }).lean();
    return NextResponse.json(societes);
}

// PUT /api/societeassurance
export async function PUT(request: Request) {
    const body = await request.json();
    const { id, societe, assuranceId } = body;
    await db();
    if (!id || !societe || !assuranceId) {
        return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
    }

    await SocieteAssurance.findByIdAndUpdate(id, { societe });

    const updated = await SocieteAssurance.find({ Assurance: assuranceId }).lean();
    return NextResponse.json(updated);
}

// DELETE /api/societeassurance
export async function DELETE(request: Request) {
    const body = await request.json();
    const { id, assuranceId } = body;
    await db();
    if (!id || !assuranceId) {
        return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
    }

    await SocieteAssurance.findByIdAndDelete(id);

    const updated = await SocieteAssurance.find({ Assurance: assuranceId }).lean();
    return NextResponse.json(updated);
}
