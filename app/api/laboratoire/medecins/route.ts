import { NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { Medecin } from "@/models/medecin";
export async function GET() {

    try {

        await db();

        const medecins =
            await Medecin
                .find({})
                .sort({
                    nom: 1,
                    prenoms: 1
                })
                .lean();

        return NextResponse.json(medecins);

    } catch (error) {

        console.error(error);

        return NextResponse.json(
            { message: "Erreur serveur" },
            { status: 500 }
        );
    }
}