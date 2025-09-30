import { NextRequest, NextResponse } from "next/server";
import { TypeActe } from "@/models/TypeActe";
import { db } from "@/db/mongoConnect";

// GET toutes les types d’acte
export async function GET() {
    await db();
    const actes = await TypeActe.find().sort({ Designation: 1 });
    return NextResponse.json(actes);
}

// POST ajout d’un type d’acte
export async function POST(req: NextRequest) {
    try {
        await db();
        const body = await req.json();
        const { Designation } = body;

        if (!Designation) {
            return NextResponse.json({ error: "La désignation est obligatoire" }, { status: 400 });
        }

        const newActe = new TypeActe({ Designation });
        await newActe.save();

        return NextResponse.json(newActe, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
