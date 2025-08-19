import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { ActeClinique } from "@/models/acteclinique";
import { Assurance } from "@/models/assurance";
import { TarifAssurance } from "@/models/tarifassurance";

// Lorsqu'on ajoute un acte, on l'ajoute à tous les tarifs assurances existants
export async function POST(req: NextRequest) {
    await db();
    const body = await req.json();
    try {
        // Création de l'acte
        const acte = await ActeClinique.create(body);
        // Récupérer toutes les assurances
        const assurances = await Assurance.find().lean();
        // Pour chaque assurance, créer un tarif
        const tarifs = assurances.map((a: any) => ({
            acte: acte.designationacte,
            lettreCle: acte.lettreCle,
            coefficient: acte.coefficient,
            prixmutuel: acte.prixMutuel,
            prixpreferenciel: acte.prixPreferenciel,
            assurance: a._id,
        }));
        await TarifAssurance.insertMany(tarifs);
        return NextResponse.json(acte);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}

// Lorsqu'on modifie un acte, on met à jour la désignation et la lettre clé dans tous les tarifs assurances
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await db();
    const body = await req.json();
    const id = params
    try {
        // Mettre à jour l'acte
        const acte = await ActeClinique.findByIdAndUpdate(id, body, { new: true });
        // Mettre à jour tous les tarifs correspondants (par ancienne désignation ou lettreCle)
        await TarifAssurance.updateMany(
            { lettreCle: body.lettreCle },
            {
                $set: {
                    acte: body.designationacte,
                    lettreCle: body.lettreCle,
                },
            }
        );
        return NextResponse.json(acte);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
