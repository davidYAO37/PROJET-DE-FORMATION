import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { ActeClinique } from "@/models/acteclinique";

export async function POST(req: NextRequest) {
    try {
        await db();
        const { lettreCle, prixClinique, prixMutuel, prixPreferenciel } = await req.json();

        if (!lettreCle) {
            return NextResponse.json({ error: "Lettre clé manquante" }, { status: 400 });
        }

        await ActeClinique.updateMany(
            { lettreCle },
            {
                $set: {
                    ...(prixClinique !== "" && { prixClinique }),
                    ...(prixMutuel !== "" && { prixMutuel }),
                    ...(prixPreferenciel !== "" && { prixPreferenciel })
                }
            }
        );

        return NextResponse.json({ message: "Mise à jour effectuée" });
    } catch (error) {
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
