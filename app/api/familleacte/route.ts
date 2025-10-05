import { NextRequest, NextResponse } from "next/server";
import { FamilleActe } from "@/models/familleActe";
import { db } from "@/db/mongoConnect";

// GET toutes les famille actes bilogique
export async function GET() {
    await db();
    const actes = await FamilleActe.find().sort({ Description: 1 });
    return NextResponse.json(actes);
}

// POST ajout d’un type d’acte
export async function POST(req: NextRequest) {
    try {
        await db();
        const body = await req.json();
        const { Description } = body;

        if (!Description) {
            return NextResponse.json({ error: "La description est obligatoire" }, { status: 400 });
        }

        const newActe = new FamilleActe({ Description });
        await newActe.save();

        return NextResponse.json(newActe, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
