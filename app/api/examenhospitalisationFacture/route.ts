import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { ExamenHospitalisation } from "@/models/examenHospit";
import { LignePrestation } from "@/models/lignePrestation";
import mongoose, { Schema } from "mongoose";
import { Assurance } from "@/models/assurance";
import { Facturation } from "@/models/Facturation";

export async function GET(req: NextRequest) {
    try {
        await db();
        const { searchParams } = new URL(req.url);
        const codePrestation = searchParams.get("codePrestation");
        const typeActe = searchParams.get("typeActe");

        if (!codePrestation || !typeActe) {
            console.log("Examen trouve avec le code")
            return NextResponse.json(
                { error: "Paramètres manquants", message: "Code prestation et type acte requis" },
                { status: 400 }
            );
        }

        // Rechercher l'examen avec le code prestation et le type d'acte
        const examen = await ExamenHospitalisation.findOne({
            Code_Prestation: codePrestation,
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

// Utilitaire pour transformer différents formats d'ID en ObjectId
function toObjectId(value: any) {
    if (!value) return null;
    
    try {
        // Si c'est déjà un ObjectId
        if (value instanceof mongoose.Types.ObjectId) return value;
        
        // Si c'est une chaîne
        if (typeof value === 'string') {
            // Si la chaîne est vide ou ne contient que des espaces
            if (!value.trim()) return null;
            return new mongoose.Types.ObjectId(value);
        }
        
        // Si c'est un objet avec une propriété _id
        if (value._id) return toObjectId(value._id);
        
        // Si c'est un objet avec une propriété id
        if (value.id) return toObjectId(value.id);
        
        // Si c'est un objet avec une propriété $oid (format BSON)
        if (value.$oid) return new mongoose.Types.ObjectId(value.$oid);
        
        return null;
    } catch (error) {
        console.error('Erreur de conversion en ObjectId:', { value, error });
        return null;
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
        if (header.Code_Prestation) {
            const Consultation = mongoose.models.Consultation || mongoose.model("Consultation", new Schema({}, { strict: false }));
            consultationData = await Consultation.findOne({ Code_Prestation: header.Code_Prestation }).lean() || {};
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
            NomMed: header.assuranceInfo?.medecinPrescripteur?.nom || header.medecinPrescripteur?.nom || consultationData.Medecin || "",
            idMedecin: header.medecinPrescripteur ?
                (consultationData.IDMEDECIN ? new mongoose.Types.ObjectId(consultationData.IDMEDECIN) : null) : null,

            // Utiliser les informations patient de la consultation
            IdPatient: consultationData.IdPatient ?
                new mongoose.Types.ObjectId(consultationData.IdPatient) : null,
            PatientP: consultationData.PatientP || header.PatientP || "",

            //StatutPrescription
            statutPrescriptionMedecin: header.Statutprescription || 3,

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

        // Utiliser une session/transaction pour garantir atomiticité : examen + facturation + lignes
        const session = await mongoose.startSession();
        let factureSaved: any = null;
        let saved: any = null;
        const isUpdate = Boolean(header._id);
        let hospId: any = null;
        try {
            session.startTransaction();

            // Création ou mise à jour de l'examen dans la session
            if (isUpdate) {
                saved = await ExamenHospitalisation.findByIdAndUpdate(header._id, examenData, { new: true, session });
                if (!saved) {
                    await session.abortTransaction();
                    session.endSession();
                    return NextResponse.json(
                        { error: "Examen introuvable", message: "L'examen à mettre à jour n'existe pas" },
                        { status: 404 }
                    );
                }
            } else {
                // create with session
                const created = await ExamenHospitalisation.create([examenData], { session });
                saved = Array.isArray(created) ? created[0] : created;
            }

            hospId = saved._id;

            // Construire facturation à partir du header (noms conformes au schéma Facturation)
            const factData: any = {
                Code_Prestation: header.Code_Prestation || "",
                NomMed: header.medecinPrescripteur?.nom || header.NomMed || "",
                PatientP: header.PatientP || "",
                DatePres: header.DatePres ? new Date(header.DatePres) : currentDate,
                SaisiPar: Recupar || header.SaisiPar || "",
                Rclinique: header.Rclinique || "",
                Montanttotal: header.Montanttotal || header.factureTotal || 0,
                MontantRecu: header.MontantRecu || 0,
                TotalapayerPatient: header.TotalapayerPatient || header.TotalapayerPatient || 0,
                PartAssuranceP: header.PartAssuranceP || header.partAssurance || 0,
                Partassure: header.Partassure || header.Partassure || 0,
                Assurance: header.Assurance?.desiganationassurance || (typeof header.Assurance === 'string' ? header.Assurance : ''),
                IDSOCIETEASSURANCE: header.IDSOCIETEASSURANCE || undefined,
                Souscripteur: header.Souscripteur || "",
                SOCIETE_PATIENT: header.SOCIETE_PATIENT || "",
                TotalPaye: header.TotalPaye || header.MontantRecu || 0,
                Restapayer: header.Restapayer || header.resteAPayer || 0,
                Taux: header.Taux || 0,
                NumBon: header.NumBon || "",
                reduction: header.reduction || 0,
                MotifRemise: header.MotifRemise || "",
                tauxreduction: header.tauxreduction || 0,
                TotaleTaxe: header.TotaleTaxe || 0,
                FacturéPar: Recupar || header.SaisiPar || "",
                IdPatient: header.IdPatient || header.IdPatient || undefined,
                Numcarte: header.Numcarte || "",
                IDTYPE_ACTE: header.IDTYPE_ACTE || undefined,
                Entrele: header.Entrele ? new mongoose.Types.ObjectId(header.Entrele) : undefined,
                SortieLe: header.SortieLe ? new mongoose.Types.ObjectId(header.SortieLe) : undefined,
                DureeE: header.DureeE || 0,
                Designationtypeacte: header.Designationtypeacte || header.typeacte || "",
                Assure: typeof header.Assuré === 'boolean' ? (header.Assuré ? 'Oui' : 'Non') : header.Assure || '',
                Payeoupas: true,
                StatutLaboratoire: header.StatutLaboratoire || 1,
                TotalReliquatPatient: header.TotalReliquatPatient || header.surplus || 0,
                StatuPrescriptionMedecin: header.StatuPrescriptionMedecin || 3,
                StatutPaiement: header.StatutPaiement || "Facture Payée",
                CompteClient: header.CompteClient || false,
                CautionPatient: header.CautionPatient || 0,
                Modepaiement: header.Modepaiement || "",
                IDMEDECIN: header.IDMEDECIN || undefined,
                MontantMedecin: header.MontantMedecin || 0,
                DateFacturation: currentDate,
                Heure_Facturation: new Date().toLocaleTimeString("fr-FR"),
                idHospitalisation: hospId,
            };

            if (header.IDASSURANCE) {
                try {
                    factData.Assurance = new mongoose.Types.ObjectId(header.IDASSURANCE);
                } catch (err) {
                    // ignore invalid id
                }
            }

            // Créer la facturation dans la session
            const createdFact = await Facturation.create([factData], { session });
            factureSaved = Array.isArray(createdFact) ? createdFact[0] : createdFact;
        } catch (err) {
            console.error("Erreur création Facturation :", err);
            // Annuler la transaction et fermer la session avant de renvoyer l'erreur
            try {
                await session.abortTransaction();
            } catch (abErr) {
                console.error('Erreur abort transaction après échec facturation:', abErr);
            }
            session.endSession();
            return NextResponse.json(
                { error: "Erreur création facture", message: String(err) },
                { status: 500 }
            );
        }

        // Récupérer l'IdPatient depuis la consultation s'il n'est pas fourni
        let patientId = header.IdPatient;
        if (!patientId && header.Code_Prestation) {
            const Consultation = mongoose.models.Consultation || mongoose.model("Consultation", new Schema({}, { strict: false }));
            const consultation: any = await Consultation.findOne({ Code_Prestation: header.Code_Prestation }).lean();
            if (consultation) {
                patientId = consultation.IdPatient || consultation.IdPatient;
                console.log("✅ IdPatient récupéré depuis la consultation:", patientId);
            }
        }

        // Mise à jour ou insertion des lignes de prestation (dans la même transaction)
        console.log("📋 Nombre de lignes à enregistrer:", lignes.length);

        const results = await Promise.allSettled(
            lignes.map(async (l: any, index: number) => {
                try {
                    console.log(`📝 Traitement ligne ${index + 1}:`, {
                        Acte: l.Acte,
                        IDACTE: l.IDACTE,
                        IDLignePrestation: l.IDLignePrestation
                    });

                    /*  // Vérifier que IdPatient est fourni
                     if (!patientId && !l.IdPatient) {
                         throw new Error("IdPatient est requis pour la ligne de prestation");
                     } */

                    const doc: any = {
                        ...l,
                        codePrestation: header.Code_Prestation,
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

                    // Ajouter idTypeActe et idFamille si fournis
                    if (l.IDTYPE && l.IDTYPE.trim() !== "") doc.idTypeActe = l.IDTYPE;
                    if (l.IDFAMILLE && l.IDFAMILLE.trim() !== "") doc.idFamilleActeBiologie = l.IDFAMILLE;

                    // Gestion paiement / facturation
                    const isPaid = (l.AFacturer && String(l.AFacturer).toLowerCase().includes('pay')) || (l.Statutprescription === 3) || (l.payé === true);
                    if (isPaid) {
                        if (factureSaved && factureSaved._id) doc.idFacturation = factureSaved._id;
                        doc.datePaiementCaisse = l.datePaiementCaisse ? new Date(l.datePaiementCaisse) : new Date();
                        doc.heurePaiement = l.heurePaiement || new Date().toLocaleTimeString('fr-FR');
                        doc.payePar = l.payePar || Recupar || '';
                        doc.statutPrescriptionMedecin = 3;
                        doc.actePayeCaisse = 'Payé';
                    } else {
                        doc.idFacturation = undefined;
                        doc.datePaiementCaisse = undefined;
                        doc.heurePaiement = '';
                        doc.payePar = '';
                        doc.statutPrescriptionMedecin = l.Statutprescription || 1;
                        doc.actePayeCaisse = l.AFacturer || 'Non Payé';
                    }

                    let result: any;
                    const isValidObjectId = l.IDLignePrestation && l.IDLignePrestation.length === 24 && /^[0-9a-fA-F]{24}$/.test(l.IDLignePrestation);

                    if (isValidObjectId) {
                        console.log(`✏️ Mise à jour ligne ${index + 1} avec ObjectId:`, l.IDLignePrestation);
                        result = await LignePrestation.findByIdAndUpdate(l.IDLignePrestation, doc, { new: true, session });
                        if (!result) {
                            console.log(`⚠️ Ligne non trouvée, création d'une nouvelle ligne ${index + 1}`);
                            const created = await LignePrestation.create([doc], { session });
                            result = Array.isArray(created) ? created[0] : created;
                        }
                    } else {
                        console.log(`➕ Création nouvelle ligne ${index + 1} (ID invalide ou absent: ${l.IDLignePrestation})`);
                        const created = await LignePrestation.create([doc], { session });
                        result = Array.isArray(created) ? created[0] : created;
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
            // Annuler la transaction
            try {
                await session.abortTransaction();
            } catch (abErr) {
                console.error('Erreur abort transaction:', abErr);
            }
            session.endSession();

            const errorDetails = failures.map((f: any, idx) => {
                const reason = f.reason;
                return {
                    ligne: idx + 1,
                    message: reason?.message || "Erreur inconnue",
                    code: reason?.code,
                    name: reason?.name
                };
            });

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

        // Tout est bon -> valider la transaction
        await session.commitTransaction();
        session.endSession();

        return NextResponse.json({
            success: true,
            message: isUpdate ? "Examen mis à jour avec succès" : "Examen créé avec succès",
            id: hospId,
            lignesCount: lignes.length,
        });
    } catch (e: any) {
        console.error("Erreur POST /api/examenhospitalisationFacture:", e);
        return NextResponse.json(
            {
                error: "Erreur serveur",
                message: e.message || "Une erreur est survenue lors de l'enregistrement",
            },
            { status: 500 }
        );
    }
}