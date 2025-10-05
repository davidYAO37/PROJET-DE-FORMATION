import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { ActeClinique } from "@/models/acteclinique";
import { TarifAssurance } from "@/models/tarifassurance";

// -------------------- MODIFICATION D'UN ACTE ET TOUS SES TARIFS --------------------
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await db();
    try {
        const { id } = await params;
        const body = await req.json();

        // Nettoyer les champs ObjectId vides
        if (body.IDFAMILLE_ACTE_BIOLOGIE === "" || body.IDFAMILLE_ACTE_BIOLOGIE === null) {
            delete body.IDFAMILLE_ACTE_BIOLOGIE;
        }
        if (body.IDTYPE_ACTE === "" || body.IDTYPE_ACTE === null) {
            delete body.IDTYPE_ACTE;
        }

        // Mettre à jour l'acte
        const updated = await ActeClinique.findByIdAndUpdate(id, body, { new: true });
        if (!updated) {
            return NextResponse.json({ error: "Acte introuvable" }, { status: 404 });
        }

        // Mettre à jour tous les tarifs liés à cet acte
        await TarifAssurance.updateMany(
            { acteId: id },
            {
                $set: {
                    acte: body.designationacte,
                    lettreCle: body.lettreCle,
                    coefficient: body.coefficient,
                    prixmutuel: body.prixMutuel,
                    prixpreferenciel: body.prixPreferentiel,
                },
            }
        );

        return NextResponse.json(updated);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}

// -------------------- SUPPRESSION D'UN ACTE ET TOUS SES TARIFS --------------------
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await db();
    try {
        const { id } = await params;

        // Vérifier si l'acte existe
        const acte = await ActeClinique.findById(id);
        if (!acte) {
            return NextResponse.json({ error: "Acte introuvable" }, { status: 404 });
        }

        // Supprimer l'acte
        await ActeClinique.findByIdAndDelete(id);

        // Supprimer tous les tarifs associés
        await TarifAssurance.deleteMany({ acteId: id });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}



/* import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { ActeClinique } from "@/models/acteclinique";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await db();
    try {
        const { id } = await params;
        const body = await req.json();
        const updated = await ActeClinique.findByIdAndUpdate(id, body, { new: true });
        if (!updated) {
            return NextResponse.json({ error: "Acte introuvable" }, { status: 404 });
        }
        return NextResponse.json(updated);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await db();
    try {
        const { id } = await params;
        const deleted = await ActeClinique.findByIdAndDelete(id);
        if (!deleted) {
            return NextResponse.json({ error: "Acte introuvable" }, { status: 404 });
        }
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
} */