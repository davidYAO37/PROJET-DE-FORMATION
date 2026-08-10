import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IActeClinique } from "@/models/acteclinique";

const READ_ROLES = ["admin", "accueil", "biologiste", "caisse", "comptable", "infirmier", "medecin", "pharmacien", "radiologue", "technicienlabo"];
const WRITE_ROLES = ["admin"];

export async function GET(req: NextRequest) {
    const { context, response } = await withTenant(req, READ_ROLES);
    if (!context) return response;
    const ActeClinique = getTenantModel<IActeClinique>(context.connection, "ActeClinique");

    // Récupérer les paramètres de l'URL
    const { searchParams } = new URL(req.url);
    const consultationviste = searchParams.get('consultationviste');
    
    // Construire le filtre
    let filter: any = {};
    if (consultationviste !== null) {
        filter.consultationviste = consultationviste === 'true';
    }
    
    const actes = await ActeClinique.find(filter).lean();
    return NextResponse.json(actes);
}

export async function POST(req: NextRequest) {
    const { context, response } = await withTenant(req, WRITE_ROLES);
    if (!context) return response;
    const ActeClinique = getTenantModel<IActeClinique>(context.connection, "ActeClinique");

    const body = await req.json();
    
    console.log("POST /api/actes - Données reçues:", body);
    
    try {
        const acte = await ActeClinique.create(body);
        console.log("POST /api/actes - Acte créé avec succès:", acte._id);
        return NextResponse.json(acte);
    } catch (e: any) {
        console.error("POST /api/actes - Erreur:", e.message);
        console.error("POST /api/actes - Détails:", e);
        
        // Gérer les erreurs spécifiques
        if (e.code === 11000) {
            // Erreur de duplicité (designationacte unique)
            return NextResponse.json({ error: "Cette désignation d'acte existe déjà" }, { status: 400 });
        }
        
        if (e.name === 'ValidationError') {
            // Erreur de validation Mongoose
            const errors = Object.values(e.errors).map((err: any) => err.message).join(', ');
            return NextResponse.json({ error: `Erreur de validation: ${errors}` }, { status: 400 });
        }
        
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
