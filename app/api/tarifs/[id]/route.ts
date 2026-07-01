import { db } from "@/db/mongoConnect";
import { ActeClinique } from "@/models/acteclinique";
import { TarifAssurance } from "@/models/tarifassurance";
import { NextRequest, NextResponse } from "next/server";

// ✅ Récupération des tarifs ou initialisation si vides
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await db();
        const { id } = await params;

        // 1. On récupère les tarifs existants
        let tarifs = await TarifAssurance.find({ assurance: id }).lean();

        // 2. Compléter avec les actes cliniques manquants
        const actes = await ActeClinique.find().lean();
        const acteIdsExistants = new Set(tarifs.map((t: any) => t.acteId?.toString()));
        const nouveauxTarifs = actes
            .filter((acte: any) => !acteIdsExistants.has(acte._id.toString()))
            .map((acte: any) => ({
                acte: acte.designationacte,
                lettreCle: acte.lettreCle ?? "",
                coefficient: acte.coefficient ?? 0,
                prixmutuel: acte.prixMutuel ?? 0,
                prixpreferenciel: acte.prixPreferentiel ?? 0,
                assurance: id,
                acteId: acte._id,
            }));

        if (nouveauxTarifs.length > 0) {
            await TarifAssurance.insertMany(nouveauxTarifs, { ordered: false }).catch((err) => {
                if (err.code !== 11000) throw err;
            });
            tarifs = await TarifAssurance.find({ assurance: id }).lean();
        }

        return NextResponse.json(tarifs);
    } catch (error: any) {
        console.error("Erreur GET /tarifs :", error);
        return NextResponse.json(
            { error: "Impossible de récupérer les tarifs" },
            { status: 500 }
        );
    }
}

// ✅ Mise à jour des tarifs (sauvegarde)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await db();
        const { id } = await params;
        const body = await req.json();

        if (!Array.isArray(body)) {
            return NextResponse.json(
                { error: "Format invalide, tableau attendu" },
                { status: 400 }
            );
        }

        // 1. Mise à jour en base de chaque tarif
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
        return NextResponse.json(
            { error: "Impossible de mettre à jour les tarifs" },
            { status: 500 }
        );
    }
}
