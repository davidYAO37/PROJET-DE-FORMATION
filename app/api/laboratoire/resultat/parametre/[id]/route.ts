import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IResultatLignePrestation } from "@/models/resultatLignePrestation";

const ROLES = ["admin", "medecin", "accueil", "infirmier", "biologiste", "technicienlabo"];

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { context, response } = await withTenant(req, ROLES);
    if (!context) return response;
    const ResultatLignePrestation = getTenantModel<IResultatLignePrestation>(context.connection, "ResultatLignePrestation");

    try {
        const { id } = await params;

        const resultat = await ResultatLignePrestation.findById(id);

        if (!resultat) {
            return NextResponse.json(
                { message: "Résultat introuvable" },
                { status: 404 }
            );
        }

        await ResultatLignePrestation.findByIdAndDelete(id);

        return NextResponse.json({
            success: true,
            message: "Paramètre retiré avec succès"
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: "Erreur serveur lors de la suppression" },
            { status: 500 }
        );
    }
}
