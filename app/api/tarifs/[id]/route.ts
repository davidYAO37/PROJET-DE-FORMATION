import { db } from "@/db/mongoConnect";
import { ActeClinique } from "@/models/acteclinique";
import { TarifAssurance } from "@/models/tarifassurance";
import { NextRequest, NextResponse } from "next/server";

// 🔹 Récupérer ou initialiser les tarifs
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await db();
        const { id } = await params;

        let tarifs = await TarifAssurance.find({ assurance: id }).lean();

        if (tarifs.length === 0) {
            const actes = await ActeClinique.find().lean();
            const nouveauxTarifs = actes.map((acte: any) => ({
                acte: acte.designationacte,
                lettreCle: acte.lettreCle,
                coefficient: acte.coefficient,
                prixmutuel: acte.prixMutuel,
                prixpreferenciel: acte.prixPreferenciel,
                assurance: id,
            }));
            console.log("Nouveaux tarifs à insérer :", nouveauxTarifs);

            await TarifAssurance.insertMany(nouveauxTarifs);
            tarifs = await TarifAssurance.find({ assurance: id }).lean();
        }

        return NextResponse.json(tarifs);
    } catch (error: any) {
        console.error("Erreur GET /tarifs :", error);
        return NextResponse.json({ error: "Impossible de récupérer les tarifs" }, { status: 500 });
    }
}

// 🔹 Sauvegarder les tarifs
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await db();
        const { id } = await params;
        const body = await req.json();

        if (!Array.isArray(body)) {
            return NextResponse.json({ error: "Format invalide, tableau attendu" }, { status: 400 });
        }

        await Promise.all(
            body.map((t: any) => {
                if (!t._id) return;
                return TarifAssurance.findByIdAndUpdate(t._id, {
                    prixmutuel: t.prixmutuel,
                    prixpreferenciel: t.prixpreferenciel,
                    coefficient: t.coefficient,
                });
            })
        );

        return NextResponse.json({ message: "Tarifs mis à jour ✅" });
    } catch (error: any) {
        console.error("Erreur PUT /tarifs :", error);
        return NextResponse.json({ error: "Impossible de mettre à jour les tarifs" }, { status: 500 });
    }
}
