import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { ActeSocietePartenaire } from "@/models/acteSocietePartenaire";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
    await db();
    const { searchParams } = new URL(req.url);
    const societeId = searchParams.get("societeId");

    const filter: Record<string, unknown> = {};
    if (societeId) {
        filter.IDSOCIETEPARTENAIRE = mongoose.Types.ObjectId.isValid(societeId)
            ? new mongoose.Types.ObjectId(societeId)
            : societeId;
    }

    const actes = await ActeSocietePartenaire.find(filter).sort({ OrdonnacementAffichage: 1 });
    return NextResponse.json(actes);
}

export async function POST(req: NextRequest) {
    try {
        await db();
        const body = await req.json();
        const { IDSOCIETEPARTENAIRE, IDACTEP } = body;

        if (!IDSOCIETEPARTENAIRE) {
            return NextResponse.json({ error: "La société partenaire est obligatoire" }, { status: 400 });
        }
        if (!IDACTEP) {
            return NextResponse.json({ error: "L'acte est obligatoire" }, { status: 400 });
        }

        const newActe = new ActeSocietePartenaire(body);
        await newActe.save();

        return NextResponse.json(newActe, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
