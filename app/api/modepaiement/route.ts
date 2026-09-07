import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IModeDePaiement } from "@/models/ModeDePaiement";

const READ_ROLES = ["admin", "adminsuper", "accueil", "biologiste", "caisse", "comptable", "facturation", "infirmier", "medecin", "pharmacien", "radiologue", "technicienlabo"];
const WRITE_ROLES = ["admin"];

export async function GET(req: NextRequest) {

    const { context, response } = await withTenant(req, READ_ROLES);
    if (!context) return response;
    const ModeDePaiement = getTenantModel<IModeDePaiement>(context.connection, "ModeDePaiement");

    // Pas de filtre entrepriseId ici : les modes de paiement sont isolés par tenant DB.
    // Si un jour un mode est marqué entrepriseId, on peut le réintroduire.
    const allModes = await ModeDePaiement.find({}).lean();

    // Dédoublonner par valeur de Modepaiement (garder le premier document)
    const uniqueMap = new Map<string, any>();
    for (const mode of allModes) {
      if (mode.Modepaiement && !uniqueMap.has(mode.Modepaiement)) {
        uniqueMap.set(mode.Modepaiement, mode);
      }
    }

    // Supprimer les doublons en excès
    const idsToKeep = new Set<string>();
    for (const mode of uniqueMap.values()) {
      idsToKeep.add(String(mode._id));
    }
    const idsToDelete: any[] = [];
    for (const mode of allModes) {
      if (!idsToKeep.has(String(mode._id))) {
        idsToDelete.push(mode._id);
      }
    }
    if (idsToDelete.length > 0) {
      await ModeDePaiement.deleteMany({ _id: { $in: idsToDelete } });
    }

    const modepaiements = Array.from(uniqueMap.values());

    return NextResponse.json({
        success: true,
        data: modepaiements
    });

}



export async function POST(req: NextRequest) {

    const { context, response } = await withTenant(req, WRITE_ROLES);
    if (!context) return response;
    const ModeDePaiement = getTenantModel<IModeDePaiement>(context.connection, "ModeDePaiement");

    const body = await req.json();

    try {

        // Vérifier les doublons avant création
        if (body?.Modepaiement) {
            const existant = await ModeDePaiement.findOne({ Modepaiement: body.Modepaiement }).lean();
            if (existant) {
                return NextResponse.json({
                    success: false,
                    error: 'Ce mode de paiement existe déjà'
                }, { status: 409 });
            }
        }

        const modepaiements = await ModeDePaiement.create(body);

        return NextResponse.json(modepaiements);

    } catch (e: any) {

        return NextResponse.json({ error: e.message }, { status: 400 });

    }

}

