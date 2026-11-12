import { NextRequest, NextResponse } from "next/server";
import { accesCatalogueMedicaments } from "@/lib/medicamentsAccess";
import { getTenantModel } from "@/lib/tenantModels";
import { IPharmacie } from "@/models/Pharmacie";

const ROLES = ["admin", "medecin", "accueil", "infirmier", "pharmacien", "caisse"];

const PREFIX = "MED";

// GET /api/medicaments/next-reference
// Retourne la prochaine référence libre au format MED0001, MED0002, ...
// basée sur le plus grand suffixe numérique existant parmi les références MED*.
export async function GET(req: NextRequest) {
    const { context, response } = await accesCatalogueMedicaments(req, ROLES);
    if (!context) return response;
    const Pharmacie = getTenantModel<IPharmacie>(context.connection, "Pharmacie");

    try {
        const dernier = await Pharmacie.findOne({ Reference: new RegExp(`^${PREFIX}\\d+$`) })
            .sort({ Reference: -1 })
            .select("Reference")
            .lean<{ Reference?: string } | null>();

        let prochain = 1;
        const match = dernier?.Reference?.match(new RegExp(`^${PREFIX}(\\d+)$`));
        if (match) {
            prochain = parseInt(match[1], 10) + 1;
        }

        // Sécurité : boucler tant que la référence existe déjà
        let reference = `${PREFIX}${String(prochain).padStart(4, "0")}`;
        while (await Pharmacie.exists({ Reference: reference })) {
            prochain += 1;
            reference = `${PREFIX}${String(prochain).padStart(4, "0")}`;
        }

        return NextResponse.json({ reference });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Erreur serveur" }, { status: 500 });
    }
}
