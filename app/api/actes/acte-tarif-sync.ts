import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IActeClinique } from "@/models/acteclinique";
import { IAssurance } from "@/models/assurance";
import { ITarifAssurance } from "@/models/tarifassurance";

const WRITE_ROLES = ["admin"];

// Lorsqu'on ajoute un acte, on l'ajoute à tous les tarifs assurances existants
export async function POST(req: NextRequest) {
    const { context, response } = await withTenant(req, WRITE_ROLES);
    if (!context) return response;
    const ActeClinique = getTenantModel<IActeClinique>(context.connection, "ActeClinique");
    const Assurance = getTenantModel<IAssurance>(context.connection, "Assurance");
    const TarifAssurance = getTenantModel<ITarifAssurance>(context.connection, "TarifAssurance");
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
            prixpreferenciel: acte.prixPreferentiel,
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
    const { context, response } = await withTenant(req, WRITE_ROLES);
    if (!context) return response;
    const ActeClinique = getTenantModel<IActeClinique>(context.connection, "ActeClinique");
    const TarifAssurance = getTenantModel<ITarifAssurance>(context.connection, "TarifAssurance");
    const { id } = await params;
    const body = await req.json();
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
