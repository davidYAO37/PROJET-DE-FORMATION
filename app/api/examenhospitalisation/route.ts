import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { ExamenHospitalisation } from "@/models/examenHospit";
import { LignePrestation } from "@/models/lignePrestation";
import mongoose, { Schema } from "mongoose";
import { Assurance } from "@/models/assurance";

export async function GET(req: NextRequest) {
    try {
        await db();
        const { searchParams } = new URL(req.url);
        const CodePrestation = searchParams.get("CodePrestation");
        const typeActe = searchParams.get("typeActe");

        if (!CodePrestation || !typeActe) {
            return NextResponse.json(
                { error: "Paramètres manquants", message: "Code prestation et type acte requis" },
                { status: 400 }
            );
        }

        // Rechercher l'examen avec le code prestation et le type d'acte
        const examen = await ExamenHospitalisation.findOne({
            CodePrestation: CodePrestation,
            Designationtypeacte: typeActe
        }).lean();

        if (!examen) {
            return NextResponse.json(
                { error: "Examen introuvable" },
                { status: 404 }
            );
        }

        return NextResponse.json(examen);
    } catch (error) {
        console.error("Erreur GET examenhospitalisation:", error);
        return NextResponse.json(
            { error: "Erreur serveur", message: String(error) },
            { status: 500 }
        );
    }
}
// enregistrement ou modification de l'examen

export async function POST(req: NextRequest) {
    try {
        await db();
        const body = await req.json();
        const { header, lignes, Recupar } = body || {};

        // Validation du payload
        if (!header) {
            return NextResponse.json(
                { error: "En-tête manquant", message: "Les informations de l'examen sont requises" },
                { status: 400 }
            );
        }

        if (!Array.isArray(lignes)) {
            return NextResponse.json(
                { error: "Lignes invalides", message: "Les lignes de prestation doivent être un tableau" },
                { status: 400 }
            );
        }

        if (lignes.length === 0) {
            return NextResponse.json(
                { error: "Aucune ligne", message: "Au moins une ligne de prestation est requise" },
                { status: 400 }
            );
        }


        const currentDate = new Date();
        let assuranceName = '';

        // Si un ID d'assurance est fourni, récupérer le nom de l'assurance
        if (header.assurance?.assuranceId) {
            try {
                const assurance = await Assurance.findById(header.assurance.assuranceId);
                assuranceName = assurance?.desiganationassurance || '';
            } catch (error) {
                console.error('Error fetching assurance:', error);
            }
        }

        // Récupérer les informations de la consultation si disponible
        let consultationData: any = {};
        if (header.CodePrestation) {
            const Consultation = mongoose.models.Consultation || mongoose.model("Consultation", new Schema({}, { strict: false }));
            consultationData = await Consultation.findOne({ CodePrestation: header.CodePrestation }).lean() || {};
            console.log("📋 Données de la consultation récupérées:", {
                IdPatient: consultationData.IdPatient,
                PatientP: consultationData.PatientP,
                Medecin: consultationData.Medecin,
                IDMEDECIN: consultationData.IDMEDECIN
            });
        }

        // Préparer les données de l'examen avec les champs supplémentaires
        const examenData = {
            ...header,
            // Utiliser le médecin du formulaire, de l'assurance ou celui de la consultation
            NomMed: header.assuranceInfo?.medecinPrescripteur.nom || header.medecinPrescripteur.nom || consultationData.Medecin || "",
            idMedecin: header.medecinPrescripteur ?
                (consultationData.IDMEDECIN ? new mongoose.Types.ObjectId(consultationData.IDMEDECIN) : null) : null,

            // Utiliser les informations patient de la consultation
            IdPatient: consultationData.IdPatient ?
                new mongoose.Types.ObjectId(consultationData.IdPatient) : null,
            PatientP: consultationData.PatientP || header.PatientP || "",

            //StatutPrescription
            statutPrescriptionMedecin: header.Statutprescription || 2,

            // Informations de suivi
            SaisiPar: Recupar,

            // Date de prescription (uniquement à la création)
            ...(!header._id && { DatePres: currentDate }),

            // Informations d'assurance
            Assurance: assuranceName,
            ...(header.assurance?.assuranceId && {
                IDASSURANCE: new mongoose.Types.ObjectId(header.assurance.assuranceId)
            }),
        };

        // Création ou mise à jour de l'examen
        const isUpdate = Boolean(header._id);
        let saved;

        if (isUpdate) {
            saved = await ExamenHospitalisation.findByIdAndUpdate(header._id, examenData, { new: true });
            if (!saved) {
                return NextResponse.json(
                    { error: "Examen introuvable", message: "L'examen à mettre à jour n'existe pas" },
                    { status: 404 }
                );
            }
        } else {
            saved = await ExamenHospitalisation.create(examenData);
        }

        const hospId = saved._id;

        // Récupérer l'IdPatient depuis la consultation s'il n'est pas fourni
        let patientId = header.IdPatient;
        if (!patientId && header.CodePrestation) {
            const Consultation = mongoose.models.Consultation || mongoose.model("Consultation", new Schema({}, { strict: false }));
            const consultation: any = await Consultation.findOne({ CodePrestation: header.CodePrestation }).lean();
            if (consultation) {
                patientId = consultation.IdPatient || consultation.IdPatient;
                console.log("✅ IdPatient récupéré depuis la consultation:", patientId);
            }
        }

        // Mise à jour ou insertion des lignes de prestation
        console.log("📋 Nombre de lignes à enregistrer:", lignes.length);

        const results = await Promise.allSettled(
            lignes.map(async (l: any, index: number) => {
                try {
                    console.log(`📝 Traitement ligne ${index + 1}:`, {
                        Acte: l.Acte,
                        IDACTE: l.IDACTE,
                        IDLignePrestation: l.IDLignePrestation
                    });

                    // Vérifier que IdPatient est fourni
                    if (!patientId && !l.IdPatient) {
                        throw new Error("IdPatient est requis pour la ligne de prestation");
                    }

                    const doc: any = {
                        ...l,
                        CodePrestation: header.CodePrestation,
                        idHospitalisation: hospId,
                        IdPatient: patientId || l.IdPatient,
                        qte: l.QteP || 1,
                        dateLignePrestation: l.DATE ? new Date(l.DATE) : new Date(),
                        prix: l.Prixunitaire || 0,
                        prixTotal: l.PrixTotal || 0,
                        partAssurance: l.PartAssurance || 0,
                        partAssure: l.PartAssure || 0,
                        tauxAssurance: header.Taux || 0,
                        prestation: l.Acte || "",
                        coefficientActe: l.Coefficient || 1,
                        lettreCle: l.Lettre_Cle || "",
                        idActe: l.IDACTE,
                        prixClinique: l.SURPLUS || 0,
                        reliquatPatient: l.Reliquat || 0,
                        montantMedecinExecutant: l.Montant_MedExecutant || 0,
                        numMedecinExecutant: (l.StatutMedecinActe === "OUI" && header.medecinId) ? header.medecinId : "",
                        acteMedecin: l.StatutMedecinActe === "OUI" ? "OUI" : "NON",
                        totalCoefficient: l.TotalRelicatCoefAssur || 0,
                        reliquatCoefAssurance: l.Coef_ASSUR || 0,
                        exclusionActe: l.Exclusion || "Accepter",
                        coefficientAssur: l.COEFFICIENT_ASSURANCE || 0,
                        tarifAssurance: l.TARIF_ASSURANCE || 0,
                        totalSurplus: (l.Reliquat || 0) + (l.TotalRelicatCoefAssur || 0),
                        montantTotalAPayer: (l.Reliquat || 0) + (l.TotalRelicatCoefAssur || 0) + (l.PartAssure || 0),
                        prixAccepte: l.Accepter || 0,
                        prixRefuse: l.Refuser || 0,
                        statutPrescriptionMedecin: l.Statutprescription || 2,
                        coefficientClinique: l.CoefClinique || l.Coefficient || 1,
                        taxe: l.TAXE || 0,
                        Assurance: header.Assurance?.desiganationassurance || "",
                        medecinPrescripteur: header.assuranceInfo?.medecinPrescripteur?.nom || header.medecinPrescripteur?.nom || consultationData.Medecin || "",
                        SOCIETE_PATIENT: header.assuranceInfo?.societePatient || header.SOCIETE_PATIENT || "",
                    };

                    // Ajouter idTypeActe uniquement s'il est valide
                    if (l.IDTYPE && l.IDTYPE.trim() !== "") {
                        doc.idTypeActe = l.IDTYPE;
                    }

                    // Ajouter idFamilleActeBiologie uniquement s'il est valide
                    if (l.IDFAMILLE && l.IDFAMILLE.trim() !== "") {
                        doc.idFamilleActeBiologie = l.IDFAMILLE;
                    }

                    let result;
                    // Vérifier si l'ID est un ObjectId MongoDB valide (24 caractères hexadécimaux)
                    const isValidObjectId = l.IDLignePrestation &&
                        l.IDLignePrestation.length === 24 &&
                        /^[0-9a-fA-F]{24}$/.test(l.IDLignePrestation);

                    if (isValidObjectId) {
                        console.log(`✏️ Mise à jour ligne ${index + 1} avec ObjectId:`, l.IDLignePrestation);
                        result = await LignePrestation.findByIdAndUpdate(l.IDLignePrestation, doc, { new: true });
                        if (!result) {
                            // Si pas trouvé, créer une nouvelle ligne
                            console.log(`⚠️ Ligne non trouvée, création d'une nouvelle ligne ${index + 1}`);
                            result = await LignePrestation.create(doc);
                        }
                    } else {
                        // UUID ou ID invalide -> créer une nouvelle ligne
                        console.log(`➕ Création nouvelle ligne ${index + 1} (ID invalide ou absent: ${l.IDLignePrestation})`);
                        result = await LignePrestation.create(doc);
                    }
                    console.log(`✅ Ligne ${index + 1} enregistrée avec succès, ID:`, result._id);
                    return result;
                } catch (error: any) {
                    console.error(`❌ Erreur ligne ${index + 1}:`, error.message);
                    throw error;
                }
            })
        );

        // Vérifier les échecs
        const failures = results.filter((r) => r.status === "rejected");
        if (failures.length > 0) {
            console.error("❌ Erreurs lors de l'enregistrement des lignes:", failures);

            // Extraire les détails des erreurs
            const errorDetails = failures.map((f: any, idx) => {
                const reason = f.reason;
                return {
                    ligne: idx + 1,
                    message: reason?.message || "Erreur inconnue",
                    code: reason?.code,
                    name: reason?.name
                };
            });

            console.error("📊 Détails des erreurs:", errorDetails);

            return NextResponse.json(
                {
                    error: "Erreur partielle",
                    message: `${failures.length} ligne(s) n'ont pas pu être enregistrées`,
                    details: errorDetails,
                    successCount: results.filter(r => r.status === "fulfilled").length,
                    totalCount: lignes.length
                },
                { status: 207 }
            );
        }

        return NextResponse.json({
            success: true,
            message: isUpdate ? "Examen mis à jour avec succès" : "Examen créé avec succès",
            id: hospId,
            lignesCount: lignes.length,
        });
    } catch (e: any) {
        console.error("Erreur POST /api/examenhospitalisation:", e);
        return NextResponse.json(
            {
                error: "Erreur serveur",
                message: e.message || "Une erreur est survenue lors de l'enregistrement",
            },
            { status: 500 }
        );
    }
}


