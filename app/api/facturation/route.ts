import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { Facturation } from "@/models/Facturation";

// GET /api/facturation?hospitalId=XXX
// Récupère les facturations liées à une hospitalisation donnée
export async function GET(req: NextRequest) {
    try {
        await db();
        const { searchParams } = new URL(req.url);
        const hospitalId = searchParams.get("hospitalId") || searchParams.get("idHospitalisation");
        const id = searchParams.get("id");

        // Si un ID est fourni, récupérer une seule facturation
        if (id) {
            const facturation = await Facturation.findById(id).lean();

            if (!facturation) {
                return NextResponse.json(
                    { error: "Facturation non trouvée", message: "La facturation n'existe pas" },
                    { status: 404 }
                );
            }

            return NextResponse.json({
                success: true,
                data: facturation,
                message: "Facturation trouvée",
            });
        }

        // Si hospitalId est fourni, récupérer les facturations par hospitalisation
        if (hospitalId) {
            const facturations = await Facturation.find({ idHospitalisation: hospitalId }).lean();

            return NextResponse.json({
                success: true,
                data: facturations,
                total: facturations.length,
                message: `${facturations.length} facturation(s) trouvée(s)`,
            });
        }

        return NextResponse.json(
            { error: "Paramètre manquant", message: "L'ID ou l'hospitalId est requis" },
            { status: 400 }
        );
    } catch (e: any) {
        console.error("Erreur GET /api/facturation:", e);
        return NextResponse.json(
            { error: "Erreur serveur", message: e.message || "Impossible de récupérer les facturations" },
            { status: 500 }
        );
    }
}

// POST /api/facturation - Créer une nouvelle facturation
export async function POST(req: NextRequest) {
    try {
        await db();
        const body = await req.json();

        // Créer la facturation
        const newFacturation = await Facturation.create(body);

        return NextResponse.json({
            success: true,
            message: "Facturation créée avec succès",
            data: newFacturation,
        }, { status: 201 });
    } catch (e: any) {
        console.error("Erreur POST /api/facturation:", e);
        return NextResponse.json(
            { error: "Erreur serveur", message: e.message || "Impossible de créer la facturation" },
            { status: 500 }
        );
    }
}

// PUT /api/facturation - Mettre à jour une facturation
export async function PUT(req: NextRequest) {
    try {
        await db();
        const body = await req.json();
        const { _id, ...updateData } = body;

        if (!_id) {
            return NextResponse.json(
                { error: "ID manquant", message: "L'identifiant de la facturation est requis" },
                { status: 400 }
            );
        }

        const updated = await Facturation.findByIdAndUpdate(_id, updateData, { new: true });

        if (!updated) {
            return NextResponse.json(
                { error: "Facturation introuvable", message: "La facturation à mettre à jour n'existe pas" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Facturation mise à jour avec succès",
            data: updated,
        });
    } catch (e: any) {
        console.error("Erreur PUT /api/facturation:", e);
        return NextResponse.json(
            { error: "Erreur serveur", message: e.message || "Impossible de mettre à jour la facturation" },
            { status: 500 }
        );
    }
}

// DELETE /api/facturation?id=XXX - Supprimer une facturation
export async function DELETE(req: NextRequest) {
    try {
        await db();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "ID manquant", message: "L'identifiant de la facturation est requis" },
                { status: 400 }
            );
        }

        const deleted = await Facturation.findByIdAndDelete(id);

        if (!deleted) {
            return NextResponse.json(
                { error: "Facturation introuvable", message: "La facturation à supprimer n'existe pas" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Facturation supprimée avec succès",
            data: deleted,
        });
    } catch (e: any) {
        console.error("Erreur DELETE /api/facturation:", e);
        return NextResponse.json(
            { error: "Erreur serveur", message: e.message || "Impossible de supprimer la facturation" },
            { status: 500 }
        );
    }
}
