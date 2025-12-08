import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { LignePrestation } from "@/models/lignePrestation";

// GET /api/ligneprestation?CodePrestation=XXX&idHospitalisation=YYY
// OU GET /api/ligneprestation?id=XXX (pour récupérer une seule ligne)
// Récupère les lignes de prestation liées à une hospitalisation donnée ou une ligne spécifique
export async function GET(req: NextRequest) {
    try {
        await db();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        const CodePrestation = searchParams.get("CodePrestation") || searchParams.get("CodePrestation") || "";
        const idHospitalisation = searchParams.get("idHospitalisation") || searchParams.get("idHospitalisation") || "";

        // Si un ID est fourni, récupérer une seule ligne
        if (id) {
            const ligne = await LignePrestation.findById(id).lean();

            if (!ligne) {
                return NextResponse.json(
                    { error: "Ligne non trouvée", message: "La ligne de prestation n'existe pas" },
                    { status: 404 }
                );
            }

            return NextResponse.json({
                success: true,
                data: ligne,
                message: "Ligne de prestation trouvée",
            });
        }

        // Sinon, récupérer les lignes par CodePrestation
        if (!CodePrestation) {
            return NextResponse.json(
                { error: "Paramètre manquant", message: "Le code de prestation ou l'ID est requis" },
                { status: 400 }
            );
        }

        const query: any = { CodePrestation };
        if (idHospitalisation) {
            query.idHospitalisation = idHospitalisation;
        }

        const data = await LignePrestation.find(query).lean();

        return NextResponse.json({
            success: true,
            data,
            total: data.length,
            message: `${data.length} ligne(s) de prestation trouvée(s)`,
        });
    } catch (e: any) {
        console.error("Erreur GET /api/ligneprestation:", e);
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
        console.error("Erreur POST /api/ligneprestation:", e);
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
        console.error("Erreur PUT /api/ligneprestation:", e);
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
        console.error("Erreur DELETE /api/ligneprestation:", e);
        return NextResponse.json(
            { error: "Erreur serveur", message: e.message || "Impossible de supprimer la ligne de prestation" },
            { status: 500 }
        );
    }
}


/* 
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { LignePrestation } from "@/models/lignePrestation";

// GET /api/ligneprestation?CodePrestation=XXX&idHospitalisation=YYY
// Récupère les lignes de prestation liées à une hospitalisation donnée
export async function GET(req: NextRequest) {
    try {
        await db();
        const { searchParams } = new URL(req.url);
        const CodePrestation = searchParams.get("CodePrestation") || searchParams.get("CodePrestation") || "";
        const idHospitalisation = searchParams.get("idHospitalisation") || searchParams.get("idHospitalisation") || "";

        if (!CodePrestation) {
            return NextResponse.json({ error: "CodePrestation requis" }, { status: 400 });
        }

        const query: any = { CodePrestation };
        if (idHospitalisation) {
            query.idHospitalisation = idHospitalisation;
        }

        const rows = await LignePrestation.find(query).lean();

        // Mapping backend -> structure attendue par ActesTable.presetLines
        const mapped = rows.map((l: any) => {
            const prixUnitaire = Number(l.prix ?? 0);
            return {
                DATE: l.dateLignePrestation ? new Date(l.dateLignePrestation).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
                Acte: l.prestation || "",
                Lettre_Cle: l.lettreCle || "",
                Coefficient: Number(l.coefficientActe ?? 1),
                QteP: Number(l.qte ?? 1),
                Coef_ASSUR: Number(l.reliquatCoefAssurance ?? 0),
                SURPLUS: Number(l.totalSurplus ?? 0),
                Prixunitaire: prixUnitaire,
                TAXE: Number(l.taxe ?? 0),
                PrixTotal: Number(l.prixTotal ?? 0),
                PartAssurance: Number(l.partAssurance ?? 0),
                PartAssure: Number(l.partAssure ?? 0),
                IDTYPE: String(l.idTypeActe || ""),
                Reliquat: Number(l.reliquatPatient ?? 0),
                TotalRelicatCoefAssur: 0,
                Montant_MedExecutant: Number(l.montantMedecinExecutant ?? 0),
                StatutMedecinActe: l.acteMedecin ? "OUI" : "NON",
                IDACTE: String(l.idActe || ""),
                Exclusion: l.exclusionActe === "Refuser" ? "Refuser" : "Accepter",
                COEFFICIENT_ASSURANCE: Number(l.coefficientAssur ?? 0),
                TARIF_ASSURANCE: Number(l.tarifAssurance ?? 0),
                IDHOSPO: String(l.idHospitalisation || ""),
                IDFAMILLE: String(l.idFamilleActeBiologie || ""),
                Refuser: Number(l.prixRefuse ?? 0),
                Accepter: Number(l.prixAccepte ?? 0),
                IDLignePrestation: String(l._id),
                Statutprescription: Number(l.statutPrescriptionMedecin ?? 2),
                CoefClinique: Number(l.coefficientClinique ?? l.coefficientActe ?? 1),
                forfaitclinique: 0,
                Action: "",
            };
        });

        return NextResponse.json({ data: mapped, total: mapped.length });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
} */
