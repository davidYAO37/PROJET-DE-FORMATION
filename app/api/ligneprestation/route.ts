import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { LignePrestation } from "@/models/lignePrestation";

// GET /api/ligneprestation?codePrestation=XXX&idHospitalisation=YYY
// Récupère les lignes de prestation liées à une hospitalisation donnée
export async function GET(req: NextRequest) {
    try {
        await db();
        const { searchParams } = new URL(req.url);
        const codePrestation = searchParams.get("codePrestation") || searchParams.get("Code_Prestation") || "";
        const idHospitalisation = searchParams.get("idHospitalisation") || searchParams.get("IDHOSPITALISATION") || "";

        if (!codePrestation) {
            return NextResponse.json({ error: "codePrestation requis" }, { status: 400 });
        }

        const query: any = { codePrestation };
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
}


