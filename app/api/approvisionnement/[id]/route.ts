import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IApprovisionnement } from "@/models/Approvisionnement";
import { IEntreeStock } from "@/models/EntreeStock";
import {
    annulerEntree,
    enregistrerEntree,
    stockErrorResponse,
    verifierDisponibilites,
    ROLES_MOUVEMENT_PHARMACIE,
} from "@/lib/stockService";

// -------------------- MODIFICATION D'UN ACHAT ET TOUTES ENTREESTOCK --------------------
// Si `lignes` est fourni, les entrées de l'achat sont remplacées et le stock est
// ajusté de l'écart (nouvelles quantités - anciennes), sans jamais passer sous 0.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { context, response } = await withTenant(req, ROLES_MOUVEMENT_PHARMACIE);
    if (!context) return response;
    const Approvisionnement = getTenantModel<IApprovisionnement>(context.connection, "Approvisionnement");
    const EntreeStock = getTenantModel<IEntreeStock>(context.connection, "EntreeStock");
    try {
        const { id } = await params;
        const { lignes, ...entete } = await req.json();

        const appro = await Approvisionnement.findById(id);
        if (!appro) {
            return NextResponse.json({ error: "Approvisionnement introuvable" }, { status: 404 });
        }

        if (Array.isArray(lignes)) {
            const invalide = lignes.find((l: any) => !(Number(l.Quantite) > 0));
            if (invalide) throw new Error(`Quantité invalide pour « ${invalide.Medicament || invalide.Reference || "médicament"} ».`);

            const anciennes = await EntreeStock.find({ IDAppro: id }).lean<any[]>();
            await verifierDisponibilites(context, [
                ...anciennes.map((e) => ({ idMedicament: e.IDMEDICAMENT, reference: e.Reference, medicament: e.Medicament, delta: -(Number(e.Quantite) || 0) })),
                ...lignes.map((l: any) => ({ idMedicament: l.IDMEDICAMENT, reference: l.Reference, medicament: l.Medicament, delta: Number(l.Quantite) || 0 })),
            ]);

            // On ajoute d'abord les nouvelles lignes puis on retire les anciennes :
            // le stock ne descend jamais sous 0 même si une partie a déjà été vendue.
            for (const ligne of lignes) {
                await enregistrerEntree(context, { ...ligne, IDAppro: id }, { majPrix: true });
            }
            for (const ancienne of anciennes) {
                await annulerEntree(context, ancienne, entete.SaisiPar);
            }
        }

        const updated = await Approvisionnement.findByIdAndUpdate(id, entete, { new: true });
        return NextResponse.json(updated);
    } catch (err: any) {
        return stockErrorResponse(err);
    }
}

// -------------------- SUPPRESSION D'UN ACHAT ET TOUS SES ENTREESTOCK --------------------
// Les quantités sont retirées du stock ; refusé si une partie a déjà été consommée.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { context, response } = await withTenant(req, ROLES_MOUVEMENT_PHARMACIE);
    if (!context) return response;
    const Approvisionnement = getTenantModel<IApprovisionnement>(context.connection, "Approvisionnement");
    const EntreeStock = getTenantModel<IEntreeStock>(context.connection, "EntreeStock");
    try {
        const { id } = await params;

        // Vérifier si l'acte existe
        const acte = await Approvisionnement.findById(id);
        if (!acte) {
            return NextResponse.json({ error: "Achat introuvable" }, { status: 404 });
        }

        const entrees = await EntreeStock.find({ IDAppro: id }).lean<any[]>();
        await verifierDisponibilites(
            context,
            entrees.map((e) => ({ idMedicament: e.IDMEDICAMENT, reference: e.Reference, medicament: e.Medicament, delta: -(Number(e.Quantite) || 0) }))
        );

        // Supprimer toutes les entrées de stock associées en retirant leurs quantités
        for (const entree of entrees) {
            await annulerEntree(context, entree, context.user.email);
        }

        // Supprimer l'acte
        await Approvisionnement.findByIdAndDelete(id);

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return stockErrorResponse(err);
    }
}
