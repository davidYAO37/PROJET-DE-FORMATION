import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { ActeClinique } from "@/models/acteclinique";
import { TarifAssurance } from "@/models/tarifassurance";

export async function PUT(req: NextRequest) {
    await db();
    const body = await req.json();
    const { id } = body; // on récupère l’id dans le body

    if (!id) {
        return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    try {
        const acteAvant = await ActeClinique.findById(id).lean();
        if (!acteAvant) {
            return NextResponse.json({ error: "Acte introuvable" }, { status: 404 });
        }

        const acteModifie = await ActeClinique.findByIdAndUpdate(id, body, { new: true });

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

export async function DELETE(req: NextRequest) {
    await db();
    const body = await req.json();
    const { id } = body;

    if (!id) {
        return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    try {
        await ActeClinique.findByIdAndDelete(id);
        await TarifAssurance.deleteMany({ acteId: id });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
