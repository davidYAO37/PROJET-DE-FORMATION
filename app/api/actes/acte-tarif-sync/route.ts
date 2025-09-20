import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { ActeClinique } from "@/models/acteclinique";
import { Assurance } from "@/models/assurance";
import { TarifAssurance } from "@/models/tarifassurance";

// -------------------- AJOUT D'UN ACTE  POUR TOUTES LES ASSURANCES --------------------
export async function POST(req: NextRequest) {
    await db();
    const body = await req.json();

    try {
        // Création de l'acte
        const acte = await ActeClinique.create(body);

        // Récupérer toutes les assurances
        const assurances = await Assurance.find().lean();

        // Créer un tarif pour chaque assurance avec acteId
        const tarifs = assurances.map((a: any) => ({
            acte: acte.designationacte,
            acteId: acte._id,
            lettreCle: acte.lettreCle,
            coefficient: acte.coefficient,
            prixmutuel: acte.prixMutuel,
            prixpreferenciel: acte.prixPreferentiel,
            assurance: a._id,
        }));

        await TarifAssurance.insertMany(tarifs);

        return NextResponse.json(acte);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}

// -------------------- MODIFICATION D'UN ACTE DE TOUTES LES ASSURANCES --------------------
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await db();
    const { id } = await params;
    const body = await req.json();

    try {
        // Récupérer l'acte avant modification
        const acteAvant = await ActeClinique.findById(id).lean();
        if (!acteAvant) return NextResponse.json({ error: "Acte introuvable" }, { status: 404 });

        // Mettre à jour l'acte
        const acteModifie = await ActeClinique.findByIdAndUpdate(id, body, { new: true });

        // Mettre à jour tous les tarifs liés à cet acte via acteId
        await TarifAssurance.updateMany(
            { acteId: id },
            {
                $set: {
                    acte: body.designationacte,
                    lettreCle: body.lettreCle,
                },
            }
        );

        return NextResponse.json(acteModifie);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}

// -------------------- SUPPRESSION D'UN ACTE DE TOUTES LES ASSURANCES --------------------
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await db();
    const { id } = await params;

    try {
        // Récupérer l'acte avant suppression
        const acte = await ActeClinique.findById(id).lean();
        if (!acte) return NextResponse.json({ error: "Acte introuvable" }, { status: 404 });

        // Supprimer l'acte
        await ActeClinique.findByIdAndDelete(id);

        // Supprimer tous les tarifs liés à cet acte via acteId
        await TarifAssurance.deleteMany({ acteId: id });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}




/* import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { ActeClinique } from "@/models/acteclinique";
import { Assurance } from "@/models/assurance";
import { TarifAssurance } from "@/models/tarifassurance";

// -------------------- AJOUT D'UN ACTE  POUR TOUTES LES ASSURANCES--------------------
export async function POST(req: NextRequest) {
    await db();
    const body = await req.json();

    try {
        // Création de l'acte
        const acte = await ActeClinique.create(body);

        // Récupérer toutes les assurances
        const assurances = await Assurance.find().lean();

        // Créer un tarif pour chaque assurance
        const tarifs = assurances.map((a: any) => ({
            acte: acte.designationacte,
            lettreCle: acte.lettreCle,
            coefficient: acte.coefficient,
            prixmutuel: acte.prixMutuel,
            prixpreferenciel: acte.prixPreferentiel,
            assurance: a._id,
        }));

        await TarifAssurance.insertMany(tarifs);

        return NextResponse.json(acte);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}

// -------------------- MODIFICATION D'UN ACTE DE TOUTES LES ASSURANCES--------------------
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    await db();
    const { id } = params;
    const body = await req.json();

    try {
        // Récupérer l'acte avant modification
        const acteAvant = await ActeClinique.findById(id).lean();
        if (!acteAvant) {
            return NextResponse.json({ error: "Acte introuvable" }, { status: 404 });
        }

        // Mettre à jour l'acte
        const acteModifie = await ActeClinique.findByIdAndUpdate(id, body, { new: true });

        // Mettre à jour tous les tarifs ayant la même designation que l'acte avant modification
        await TarifAssurance.updateMany(
            { acte: acteAvant.designationacte },
            {
                $set: {
                    acte: body.designationacte,
                    lettreCle: body.lettreCle,
                },
            }
        );

        return NextResponse.json(acteModifie);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}

// -------------------- SUPPRESSION D'UN ACTE DE TOUTES LES ASSURANCES --------------------
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    await db();
    const { id } = params;

    try {
        // Récupérer l'acte avant suppression
        const acte = await ActeClinique.findById(id).lean();
        if (!acte) {
            return NextResponse.json({ error: "Acte introuvable" }, { status: 404 });
        }

        // Supprimer l'acte
        await ActeClinique.findByIdAndDelete(id);

        // Supprimer tous les tarifs ayant la même designation
        await TarifAssurance.deleteMany({ acte: acte.designationacte });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
 */