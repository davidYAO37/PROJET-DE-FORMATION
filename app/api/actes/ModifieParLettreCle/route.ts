import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IActeClinique } from "@/models/acteclinique";

const WRITE_ROLES = ["admin"];
// Accès alternatif : utilisateurs ayant l'action "parametrage_actes_clinique"
const WRITE_OPTIONS = { actions: ["parametrage_actes_clinique"] };

export async function POST(req: NextRequest) {
    const { context, response } = await withTenant(req, WRITE_ROLES, WRITE_OPTIONS);
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
