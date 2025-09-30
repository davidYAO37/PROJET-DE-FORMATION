import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { ExamenHospitalisation } from "@/models/examenHospit";
import { LignePrestation } from "@/models/lignePrestation";

export async function POST(req: NextRequest) {
    try {
        await db();
        const body = await req.json();
        const {
            header,
            lignes,
        } = body || {};

        if (!header || !Array.isArray(lignes)) {
            return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
        }

        // Création ou mise à jour de l'examen
        const isUpdate = Boolean(header._id);

        const saved = isUpdate
            ? await ExamenHospitalisation.findByIdAndUpdate(header._id, header, { new: true })
            : await ExamenHospitalisation.create(header);

        const hospId = saved?._id;

        // Upsert des lignes
        await Promise.all(
            lignes.map(async (l: any) => {
                const doc = {
                    codePrestation: header.Code_Prestation,
                    idHospitalisation: hospId,
                    idPatient: header.IDPARTIENT,
                    qte: l.QteP,
                    dateLignePrestation: new Date(l.DATE),
                    prix: l.Prixunitaire,
                    prixTotal: l.PrixTotal,
                    partAssurance: l.PartAssurance,
                    partAssure: l.PartAssure,
                    tauxAssurance: header.Taux,
                    prestation: l.Acte,
                    coefficientActe: l.Coefficient,
                    lettreCle: l.Lettre_Cle,
                    idTypeActe: l.IDTYPE,
                    idActe: l.IDACTE,
                    prixClinique: l.SURPLUS,
                    reliquatPatient: l.Reliquat,
                    montantMedecinExecutant: l.Montant_MedExecutant,
                    acteMedecin: l.StatutMedecinActe === "OUI" ? "OUI" : "NON",
                    totalCoefficient: l.TotalRelicatCoefAssur,
                    reliquatCoefAssurance: l.Coef_ASSUR,
                    exclusionActe: l.Exclusion,
                    coefficientAssur: l.COEFFICIENT_ASSURANCE,
                    tarifAssurance: l.TARIF_ASSURANCE,
                    totalSurplus: (l.Reliquat || 0) + (l.TotalRelicatCoefAssur || 0),
                    montantTotalAPayer: (l.Reliquat || 0) + (l.TotalRelicatCoefAssur || 0) + (l.PartAssure || 0),
                    idFamilleActeBiologie: l.IDFAMILLE,
                    prixAccepte: l.Accepter,
                    prixRefuse: l.Refuser,
                    statutPrescriptionMedecin: l.Statutprescription,
                };

                if (l.IDLignePrestation) {
                    await LignePrestation.findByIdAndUpdate(l.IDLignePrestation, doc, { upsert: true });
                } else {
                    await LignePrestation.create(doc);
                }
            })
        );

        return NextResponse.json({ success: true, id: hospId });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}


