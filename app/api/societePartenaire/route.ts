import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { SocietePartenaire } from "@/models/SocietePartenaire";

export async function GET() {
    await db();
    const societes = await SocietePartenaire.find().sort({ Designation: 1 });
    return NextResponse.json(societes);
}

export async function POST(req: NextRequest) {
    try {
        await db();
        const body = await req.json();
        const { Designation } = body;

        if (!Designation?.trim()) {
            return NextResponse.json({ error: "La désignation est obligatoire" }, { status: 400 });
        }

        const newSociete = new SocietePartenaire({ Designation: Designation.trim() });
        await newSociete.save();

        return NextResponse.json(newSociete, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
