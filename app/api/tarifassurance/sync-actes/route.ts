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
        const acteIdsExistants = new Set(tarifsExistants.map(t => t.acteId.toString()));
        
        // Pour chaque acte, si pas déjà dans les tarifs, on l'ajoute
        const nouveauxTarifs = actes
            .filter(a => !acteIdsExistants.has(a._id.toString()))
            .map(a => ({
                acte: a.designationacte,
                lettreCle: a.lettreCle,
                coefficient: a.coefficient,
                prixmutuel: a.prixMutuel,
                prixpreferenciel: a.prixPreferentiel,
                assurance: assuranceId,
                acteId: a._id, // lien direct avec l'acte
            }));
        
        if (nouveauxTarifs.length > 0) {
            // Utiliser insertMany avec ordered: false pour continuer même en cas de doublon
            await TarifAssurance.insertMany(nouveauxTarifs, { ordered: false }).catch(err => {
                // Ignorer les erreurs de doublons (code 11000)
                if (err.code !== 11000) throw err;
            });
        }
        return NextResponse.json({ success: true, ajout: nouveauxTarifs.length });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
