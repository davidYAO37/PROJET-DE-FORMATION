import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IAffection } from "@/models/affection";

const READ_ROLES = ["admin", "accueil", "biologiste", "caisse", "comptable", "infirmier", "medecin", "pharmacien", "radiologue", "technicienlabo"];
const WRITE_ROLES = ["admin"];

export async function GET(req: NextRequest) {
    const { context, response } = await withTenant(req, READ_ROLES);
    if (!context) return response;
    const Affection = getTenantModel<IAffection>(context.connection, "Affection");

    // Récupérer les paramètres de l'URL
    const { searchParams } = new URL(req.url);
    
    // Construire le filtre
    let filter: any = {};
    
    const affections = await Affection.find(filter).lean();
    return NextResponse.json(affections);
}

export async function POST(req: NextRequest) {
    const { context, response } = await withTenant(req, WRITE_ROLES);
    if (!context) return response;
    const Affection = getTenantModel<IAffection>(context.connection, "Affection");
    try {
        const body = await req.json();
        console.log('POST /api/affections - Body:', body);
        
        // Validation des champs requis
        if (!body.designation || !body.lettreCle) {
            return NextResponse.json({ 
                error: "Champs requis manquants", 
                details: !body.designation ? "designation est requis" : "lettreCle est requis"
            }, { status: 400 });
        }
        
        // Nettoyage des données
        const affectionData = {
            designation: body.designation.toString().trim(),
            lettreCle: body.lettreCle.toString().trim()
        };
        
        // Vérification que les champs ne sont pas vides après nettoyage
        if (!affectionData.designation || !affectionData.lettreCle) {
            return NextResponse.json({ 
                error: "Champs requis vides", 
                details: "Les champs designation et lettreCle ne peuvent pas être vides"
            }, { status: 400 });
        }
        
        const affection = await Affection.create(affectionData);
        console.log('Affection créée:', affection);
        return NextResponse.json(affection);
    } catch (e: any) {
        console.error('Erreur POST affection:', e);
        let errorMessage = e.message;
        let status = 400;
        
        // Gestion des erreurs MongoDB spécifiques
        if (e.code === 11000) {
            errorMessage = "Une affection avec cette désignation ou lettre clé existe déjà";
            status = 409;
        } else if (e.name === 'ValidationError') {
            errorMessage = "Erreur de validation: " + Object.values(e.errors).map((err: any) => err.message).join(', ');
        }
        
        return NextResponse.json({ error: errorMessage }, { status });
    }
}
