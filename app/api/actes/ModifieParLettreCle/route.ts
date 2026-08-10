import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IActeClinique } from "@/models/acteclinique";

const WRITE_ROLES = ["admin"];

export async function POST(req: NextRequest) {
    const { context, response } = await withTenant(req, WRITE_ROLES);
    if (!context) return response;
    const ActeClinique = getTenantModel<IActeClinique>(context.connection, "ActeClinique");
    try {
        const { lettreCle, prixClinique, prixMutuel, prixPreferentiel } = await req.json();

        if (!lettreCle) {
            return NextResponse.json({ error: "Lettre clé manquante" }, { status: 400 });
        }

        await ActeClinique.updateMany(
            { lettreCle },
            {
                $set: {
                    ...(prixClinique !== "" && { prixClinique }),
                    ...(prixMutuel !== "" && { prixMutuel }),
                    ...(prixPreferentiel !== "" && { prixPreferentiel })
                }
            }
        );

        return NextResponse.json({ message: "Mise à jour effectuée" });
    } catch (error) {
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
