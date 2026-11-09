import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IPharmacie } from "@/models/Pharmacie";

// Rôles qui saisissent un prix de vente lors d'une prescription ou d'une vente.
// Contrairement à PUT /api/medicaments/[id], seule la valeur PrixVente peut être modifiée ici.
const ROLES = ["admin", "medecin", "pharmacien", "caisse", "accueil", "infirmier"];

// -------------------- MISE À JOUR DU PRIX DE VENTE --------------------
// Body : { PrixVente: number }  (entier FCFA, > 0)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { context, response } = await withTenant(req, ROLES);
    if (!context) return response;
    const Pharmacie = getTenantModel<IPharmacie>(context.connection, "Pharmacie");
    try {
        const { id } = await params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: "Identifiant de médicament invalide" }, { status: 400 });
        }

        const body = await req.json();
        const prix = Number(body?.PrixVente);
        if (!Number.isInteger(prix) || prix <= 0) {
            return NextResponse.json({ error: "Le prix de vente doit être un nombre entier supérieur à 0" }, { status: 400 });
        }

        const updated = await Pharmacie.findByIdAndUpdate(
            id,
            { $set: { PrixVente: prix } },
            { new: true, projection: { _id: 1, Designation: 1, PrixVente: 1 } }
        ).lean();
        if (!updated) {
            return NextResponse.json({ error: "Médicament introuvable" }, { status: 404 });
        }
        return NextResponse.json(updated);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
