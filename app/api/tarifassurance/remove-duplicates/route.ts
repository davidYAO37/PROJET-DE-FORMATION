import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { TarifAssurance } from "@/models/tarifassurance";

// Supprime les doublons de tarifs pour une assurance donnée
export async function POST(req: NextRequest) {
    await db();
    const { assuranceId } = await req.json();
    
    if (!assuranceId) {
        return NextResponse.json({ error: "assuranceId requis" }, { status: 400 });
    }

    try {
        // Récupérer tous les tarifs de cette assurance
        const tarifs = await TarifAssurance.find({ assurance: assuranceId }).lean();
        
        // Identifier les doublons basés sur acteId
        const seen = new Map<string, any>();
        const duplicates: string[] = [];
        
        for (const tarif of tarifs) {
            const key = tarif.acteId.toString();
            if (seen.has(key)) {
                // C'est un doublon, on garde le plus ancien (premier trouvé)
                duplicates.push(tarif._id.toString());
            } else {
                seen.set(key, tarif);
            }
        }
        
        // Supprimer les doublons
        if (duplicates.length > 0) {
            await TarifAssurance.deleteMany({ _id: { $in: duplicates } });
        }
        
        return NextResponse.json({ 
            success: true, 
            supprimés: duplicates.length,
            message: `${duplicates.length} doublon(s) supprimé(s)` 
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
