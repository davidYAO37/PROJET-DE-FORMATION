import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { ActeClinique } from "@/models/acteclinique";
import { TarifAssurance } from "@/models/tarifassurance";

// Synchronise tous les actes cliniques dans les tarifs d'une assurance
export async function POST(req: NextRequest) {
    await db();
    const { assuranceId } = await req.json();
    if (!assuranceId) {
        return NextResponse.json({ error: "assuranceId requis" }, { status: 400 });
    }
    try {
        // Récupérer tous les actes
        const actes = await ActeClinique.find().lean();
        // Récupérer tous les tarifs existants pour cette assurance
        const tarifsExistants = await TarifAssurance.find({ assurance: assuranceId }).lean();
        const actesTarifExistants = new Set(tarifsExistants.map(t => t.acte + "-" + t.lettreCle));
        // Pour chaque acte, si pas déjà dans les tarifs, on l'ajoute
        const nouveauxTarifs = actes.filter(a => !actesTarifExistants.has(a.designationacte + "-" + a.lettreCle)).map(a => ({
            acte: a.designationacte,
            lettreCle: a.lettreCle,
            coefficient: a.coefficient,
            prixmutuel: a.prixMutuel,
            prixpreferenciel: a.prixPreferentiel,
            assurance: assuranceId,
            acteId: a._id, // lien direct avec l'acte
        }));
        if (nouveauxTarifs.length > 0) {
            await TarifAssurance.insertMany(nouveauxTarifs);
        }
        return NextResponse.json({ success: true, ajout: nouveauxTarifs.length });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
