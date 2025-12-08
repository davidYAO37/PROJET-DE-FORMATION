import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { LignePrestation } from "@/models/lignePrestation";

// GET /api/ligneprestationFacture?CodePrestation=XXX&idHospitalisation=YYY
// OU GET /api/ligneprestation?id=XXX (pour récupérer une seule ligne)
// Récupère les lignes de prestation liées à une hospitalisation donnée ou une ligne spécifique
// GET /api/ligneprestationFacture
export async function GET(req: NextRequest) {
    try {
        await db();
        const { searchParams } = new URL(req.url);

        const id = searchParams.get("id");
        const CodePrestation = searchParams.get("CodePrestation") || searchParams.get("CodePrestation") || "";
        const idHospitalisation = searchParams.get("idHospitalisation") || "";

        // 📌 FILTRE GLOBAL
        const baseFilter = { statutPrescriptionMedecin: { $lt: 3 } };

        // Si un ID est fourni, récupérer une seule ligne
        if (id) {
            const ligne = await LignePrestation.findOne({
                _id: id,
                ...baseFilter
            }).lean();

            if (!ligne) {
                return NextResponse.json(
                    { error: "Ligne non trouvée", message: "Aucune ligne correspondante ou statut >= 3" },
                    { status: 404 }
                );
            }

            return NextResponse.json({
                success: true,
                data: ligne,
                message: "Ligne de prestation trouvée",
            });
        }

        // Si aucun paramètre clé → erreur
        if (!CodePrestation && !idHospitalisation) {
            return NextResponse.json(
                { error: "Paramètre manquant", message: "Le CodePrestation ou idHospitalisation est requis" },
                { status: 400 }
            );
        }

        // Construction de la requête
        const query: any = { ...baseFilter };

        if (CodePrestation) {
            query.CodePrestation = CodePrestation;
        }
        if (idHospitalisation) {
            query.idHospitalisation = idHospitalisation;
        }

        const data = await LignePrestation.find(query).lean();

        return NextResponse.json({
            success: true,
            data,
            total: data.length,
            message: `${data.length} ligne(s) trouvée(s)`,
        });

    } catch (e: any) {
        console.error("Erreur GET /api/ligneprestationFacture:", e);
        return NextResponse.json(
            { error: "Erreur serveur", message: e.message || "Impossible de récupérer les lignes de prestation" },
            { status: 500 }
        );
    }
}


// POST /api/ligneprestation - Créer une nouvelle ligne de prestation
export async function POST(req: NextRequest) {
    try {
        await db();
        const body = await req.json();

        // Validation des champs requis
        if (!body.CodePrestation) {
            return NextResponse.json(
                { error: "Code prestation manquant", message: "Le code de prestation est requis" },
                { status: 400 }
            );
        }

        if (!body.idHospitalisation) {
            return NextResponse.json(
                { error: "ID hospitalisation manquant", message: "L'identifiant de l'hospitalisation est requis" },
                { status: 400 }
            );
        }

        if (!body.prestation) {
            return NextResponse.json(
                { error: "Prestation manquante", message: "Le libellé de la prestation est requis" },
                { status: 400 }
            );
        }

        // Créer la ligne de prestation
        const newLigne = await LignePrestation.create(body);
        return NextResponse.json({
            success: true,
            message: "Ligne de prestation créée avec succès",
            data: newLigne,
        }, { status: 201 });
    } catch (e: any) {
        console.error("Erreur POST /api/ligneprestationFacture:", e);
        return NextResponse.json(
            { error: "Erreur serveur", message: e.message || "Impossible de créer la ligne de prestation" },
            { status: 500 }
        );
    }
}

// PUT /api/ligneprestation - Mettre à jour une ligne de prestation
export async function PUT(req: NextRequest) {
    try {
        await db();
        const body = await req.json();
        const { _id, ...updateData } = body;

        if (!_id) {
            return NextResponse.json(
                { error: "ID manquant", message: "L'identifiant de la ligne de prestation est requis" },
                { status: 400 }
            );
        }

        const updated = await LignePrestation.findByIdAndUpdate(_id, updateData, { new: true });

        if (!updated) {
            return NextResponse.json(
                { error: "Ligne introuvable", message: "La ligne de prestation à mettre à jour n'existe pas" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Ligne de prestation mise à jour avec succès",
            data: updated,
        });
    } catch (e: any) {
        console.error("Erreur PUT /api/ligneprestationFacture:", e);
        return NextResponse.json(
            { error: "Erreur serveur", message: e.message || "Impossible de mettre à jour la ligne de prestation" },
            { status: 500 }
        );
    }
}

// DELETE /api/ligneprestation?id=XXX - Supprimer une ligne de prestation
export async function DELETE(req: NextRequest) {
    try {
        await db();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "ID manquant", message: "L'identifiant de la ligne de prestation est requis" },
                { status: 400 }
            );
        }

        const deleted = await LignePrestation.findByIdAndDelete(id);

        if (!deleted) {
            return NextResponse.json(
                { error: "Ligne introuvable", message: "La ligne de prestation à supprimer n'existe pas" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Ligne de prestation supprimée avec succès",
            data: deleted,
        });
    } catch (e: any) {
        console.error("Erreur DELETE /api/ligneprestationFacture:", e);
        return NextResponse.json(
            { error: "Erreur serveur", message: e.message || "Impossible de supprimer la ligne de prestation" },
            { status: 500 }
        );
    }
}

