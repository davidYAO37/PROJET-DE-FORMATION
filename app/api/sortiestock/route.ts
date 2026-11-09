import { NextRequest, NextResponse } from "next/server";
import { ISortieStock } from "@/models/SortieStock";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { convertirEnUnites, enregistrerSortie, idValide, nettoyerSortieCaisse, stockErrorResponse, ROLES_VENTE } from "@/lib/stockService";

const READ_ROLES = ["admin", "pharmacien", "accueil", "caisse", "comptable"];

// GET /api/sortiestock?reference=xxx&IDPRESCRIPTION=xxx&Patient=xxx&IDMEDICAMENT=xxx
export async function GET(request: NextRequest) {
    const { context, response } = await withTenant(request, READ_ROLES);
    if (!context) return response;
    const SortieStock = getTenantModel<ISortieStock>(context.connection, "SortieStock");

    try {
        const { searchParams } = new URL(request.url);
        const reference = searchParams.get("reference");
        const IDPRESCRIPTION = searchParams.get("IDPRESCRIPTION");
        const Patient = searchParams.get("Patient");
        const IDMEDICAMENT = searchParams.get("IDMEDICAMENT");
        
        let query: any = {};
        
        if (reference && reference.trim() !== "") query.Reference = reference;
        if (idValide(IDPRESCRIPTION)) query.Prescription = IDPRESCRIPTION;
        if (idValide(Patient)) query.Patient = Patient;
        if (idValide(IDMEDICAMENT)) query.IDMEDICAMENT = IDMEDICAMENT;
        
        const sortiesStock = await SortieStock.find(query).lean();
        
        return NextResponse.json(sortiesStock);
    } catch (error: any) {
        console.error("Erreur GET /api/sortiestock:", error);
        return NextResponse.json({ 
            error: "Erreur lors de la récupération des sorties de stock",
            details: error.message 
        }, { status: 500 });
    }
}

// POST /api/sortiestock - Vente caisse : décrémente le stock côté serveur (refus si insuffisant)
export async function POST(request: NextRequest) {
    const { context, response } = await withTenant(request, ROLES_VENTE);
    if (!context) return response;

    try {
        const body = await request.json();
        // Ligne « intégrée » malgré un stock insuffisant : le stock peut devenir négatif (quantité due)
        const autoriserNegatif = body?.StockNegatifAutorise === true;
        const data = nettoyerSortieCaisse(body);

        // Prix selon le mode de vente (boîte / détail)
        const { med, mode, qteUnites, qteConditionnement } = await convertirEnUnites(context, data.IDMEDICAMENT, data.Quantite, data.ModeVente);
        const prixUnitaire = mode === "BOITE"
            ? Number(data.PrixVenteConditionnement) || Number(data.Prix_unitaire) || med?.PrixVenteConditionnement || med?.PrixVente || 0
            : Number(data.Prix_unitaire) || med?.PrixVenteUnite || med?.PrixVente || 0;
        data.Prix_unitaire = prixUnitaire;
        data.Prix_TotalS = (qteConditionnement ?? qteUnites) * prixUnitaire;

        const newSortieStock = await enregistrerSortie(context, data, { stockVirtuel: true, autoriserNegatif });

        return NextResponse.json({
            success: true,
            data: newSortieStock,
            message: "Sortie de stock créée avec succès"
        }, { status: 201 });
    } catch (error: any) {
        console.error("Erreur POST /api/sortiestock:", error);
        return stockErrorResponse(error);
    }
}

/* // PUT /api/sortiestock/[id] - Mettre à jour une sortie de stock
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await db();
    
    try {
        const { id } = await params;
        const body = await request.json();
        
        const updated = await SortieStock.findByIdAndUpdate(id, body, { new: true });
        
        if (!updated) {
            return NextResponse.json({ 
                error: "Sortie de stock introuvable" 
            }, { status: 404 });
        }
        
        return NextResponse.json({
            success: true,
            data: updated,
            message: "Sortie de stock mise à jour avec succès"
        });
    } catch (error: any) {
        console.error("Erreur PUT /api/sortiestock:", error);
        return NextResponse.json({ 
            error: "Erreur lors de la mise à jour de la sortie de stock",
            details: error.message 
        }, { status: 500 });
    }
}
 */
/* // DELETE /api/sortiestock/[id] - Supprimer une sortie de stock
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await db();
    
    try {
        const { id } = await params;
        
        const deleted = await SortieStock.findByIdAndDelete(id);
        
        if (!deleted) {
            return NextResponse.json({ 
                error: "Sortie de stock introuvable" 
            }, { status: 404 });
        }
        
        return NextResponse.json({
            success: true,
            message: "Sortie de stock supprimée avec succès"
        });
    } catch (error: any) {
        console.error("Erreur DELETE /api/sortiestock:", error);
        return NextResponse.json({ 
            error: "Erreur lors de la suppression de la sortie de stock",
            details: error.message 
        }, { status: 500 });
    }
}
 */