import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { ParametreNfs } from "@/models/parametreNfs";

export async function GET() {
    try {
        await db();
        const params = await ParametreNfs.find().sort({ PARAMETRE: 1 });
        return NextResponse.json({ success: true, data: params });
    } catch (error) {
        console.error("Erreur GET ParametreNfs:", error);
        return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await db();
        const body = await req.json();
        const { PARAMETRE, DESCRIPTION } = body;

        if (!PARAMETRE) {
            return NextResponse.json({ message: "PARAMETRE est requis" }, { status: 400 });
        }

        const nouveau = await ParametreNfs.create({ PARAMETRE, DESCRIPTION });
        return NextResponse.json({ success: true, data: nouveau, message: "Paramètre créé" }, { status: 201 });
    } catch (error) {
        console.error("Erreur POST ParametreNfs:", error);
        return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
    }
}
