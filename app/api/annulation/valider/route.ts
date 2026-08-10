import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IConsultation } from "@/models/consultation";
import { IFacturation } from "@/models/Facturation";
import { IPatient } from "@/models/patient";
import { IEncaissementCaisse } from "@/models/EncaissementCaisse";
import { IEncaissementCaisseAnnule } from "@/models/EncaissementCaisseAnnule";
import { IPatientPrescription } from "@/models/PatientPrescription";
import { ILignePrestation } from "@/models/lignePrestation";

const ROLES = ["admin", "caisse", "comptable", "accueil"];

async function archiverAnnulationFacture(
    EncaissementCaisseAnnule: any,
    facture: any,
    encaissements: any[],
    typeFacture: 'Consultation' | 'Facturation',
    motifAnnulation: string,
    utilisateur: string
) {
    const factureId = String(facture._id);
    const archiveFacture = {
        DatePrest: typeFacture === 'Consultation' ? facture.Date_consulation : facture.DatePres,
        Patient: facture.PatientP,
        ACTE: typeFacture === 'Consultation' ? facture.designationC : facture.Designationtypeacte,
        Designation: typeFacture === 'Consultation' ? facture.designationC : facture.Designationtypeacte,
        typeAnnulation: 'Facture' as const,
        sourceId: factureId,
        Taux: typeFacture === 'Consultation' ? facture.tauxAssurance : facture.Taux,
        Restapayer: facture.Restapayer,
        Medecin: typeFacture === 'Consultation' ? facture.Medecin : facture.NomMed,
        Utilisateur: typeFacture === 'Consultation' ? facture.Caissiere : facture.SaisiPar,
        DateEncaissement: typeFacture === 'Consultation' ? facture.DateFacturation : facture.DateFacturation,
        Montantencaisse: typeFacture === 'Consultation' ? facture.PrixClinique : facture.Montanttotal,
        Modepaiement: facture.Modepaiement,
        ...(typeFacture === 'Consultation' ? { Consultation: facture._id } : { Facturation: facture._id }),
        AnnulationOrdonneLe: facture.AnnulationOrdonneLe,
        annulationOrdonnepar: facture.AnnulOrdonnerPar,
        Annulerle: new Date(),
        AnnulerPar: utilisateur,
        motifAnnulation,
        entrepriseId: facture.entrepriseId
    };

    const archivesEncaissements = encaissements.map((encaissement) => ({
        DatePrest: encaissement.DatePrest,
        Patient: encaissement.Patient,
        ACTE: encaissement.Designation,
        Designation: encaissement.Designation,
        typeAnnulation: 'Encaissement' as const,
        sourceId: String(encaissement._id),
        Taux: encaissement.Taux,
        Restapayer: encaissement.Restapayer,
        Medecin: encaissement.Medecin,
        Utilisateur: encaissement.Utilisateur,
        DateEncaissement: encaissement.DateEncaissement,
        Montantencaisse: encaissement.Montantencaisse,
        HeureEncaissement: encaissement.HeureEncaissement,
        Modepaiement: encaissement.Modepaiement,
        Facturation: encaissement.IDFACTURATION,
        Consultation: encaissement.IDCONSULTATION,
        restapayerBilan: encaissement.restapayerBilan,
        TotalapayerPatient: encaissement.TotalapayerPatient,
        AnnulationOrdonneLe: encaissement.AnnulationOrdonneLe,
        annulationOrdonnepar: encaissement.annulationOrdonnepar,
        Annulerle: new Date(),
        AnnulerPar: utilisateur,
        motifAnnulation,
        entrepriseId: encaissement.entrepriseId
    }));

    await EncaissementCaisseAnnule.insertMany([archiveFacture, ...archivesEncaissements]);
}

export async function POST(req: NextRequest) {
    const { context, response } = await withTenant(req, ROLES);
    if (!context) return response;
    const Consultation = getTenantModel<IConsultation>(context.connection, "Consultation");
    const Facturation = getTenantModel<IFacturation>(context.connection, "Facturation");
    const Patient = getTenantModel<IPatient>(context.connection, "Patient");
    const EncaissementCaisse = getTenantModel<IEncaissementCaisse>(context.connection, "EncaissementCaisse");
    const EncaissementCaisseAnnule = getTenantModel<IEncaissementCaisseAnnule>(context.connection, "EncaissementCaisseAnnule");
    const PatientPrescription = getTenantModel<IPatientPrescription>(context.connection, "PatientPrescription");
    const LignePrestation = getTenantModel<ILignePrestation>(context.connection, "LignePrestation");

    try {
        const { factureId, typeFacture, motifAnnulation, utilisateur } = await req.json();

        if (!factureId || !typeFacture || !motifAnnulation || !utilisateur) {
            return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
        }

        if (typeFacture === 'Consultation') {
            // Logique pour les consultations
            const consultation = await Consultation.findById(factureId);
            if (!consultation) {
                return NextResponse.json({ error: "Consultation non trouvée" }, { status: 404 });
            }

            // Trouver le patient
            const patient = await Patient.findById(consultation.IdPatient);
            if (!patient) {
                return NextResponse.json({ error: "Patient non trouvé" }, { status: 404 });
            }

            // Restaurer la caution du patient si Modepaiement est "Caution"
            if (consultation.Modepaiement === "Caution") {
                const montantRestitue = (Number(consultation.tiket_moderateur) || 0) + (Number(consultation.ReliquatPatient) || 0);
                const depenseActuelle = Number(patient.DepenseProvision) || 0;
                const provisionActuelle = Number(patient.ProvisionClient) || 0;
                patient.DepenseProvision = depenseActuelle - montantRestitue;
                patient.ProvisionClient = provisionActuelle + montantRestitue;
                await patient.save();
            }

            const encaissements = await EncaissementCaisse.find({ IDCONSULTATION: String(consultation._id) });
            await archiverAnnulationFacture(EncaissementCaisseAnnule, consultation, encaissements, 'Consultation', motifAnnulation, utilisateur);

            // Mettre à jour la consultation
            consultation.StatutC = true;
            consultation.statutPrescriptionMedecin = 1;
            consultation.Ordonnerlannulation = 2;
            consultation.StatutAnnulation = 'validee';
            consultation.Annulerle = new Date();
            consultation.AnnulerPar = utilisateur;
            consultation.StatutPaiement = "Paiement Annulé";
            consultation.MotifAnnulationFacture = motifAnnulation;
            consultation.PrixClinique = 0;
            consultation.PartAssurance = 0;
            consultation.tiket_moderateur = 0;
            consultation.montantapayer = 0;
            consultation.Montantencaisse = 0;
            consultation.ReliquatPatient = 0;
            consultation.Restapayer = 0;
            consultation.Toutencaisse = true;
            await consultation.save();

            // Supprimer les encaissements pour cette consultation
            await EncaissementCaisse.deleteMany({ IDCONSULTATION: consultation._id });

        } else if (typeFacture === 'Facturation') {
            // Logique pour les facturations
            const facturation = await Facturation.findById(factureId);
            if (!facturation) {
                return NextResponse.json({ error: "Facturation non trouvée" }, { status: 404 });
            }

            const encaissements = await EncaissementCaisse.find({ IDFACTURATION: String(facturation._id) });
            await archiverAnnulationFacture(EncaissementCaisseAnnule, facturation, encaissements, 'Facturation', motifAnnulation, utilisateur);

            // Restaurer la caution du patient si Modepaiement est "Caution"
            if (facturation.Modepaiement === "Caution" && facturation.IdPatient) {
                const patient = await Patient.findById(facturation.IdPatient);
                if (patient) {
                    const cautionAmount = Number(facturation.CautionPatient || facturation.TotalapayerPatient || 0);
                    const depenseActuelle = Number(patient.DepenseProvision) || 0;
                    const provisionActuelle = Number(patient.ProvisionClient) || 0;
                    patient.DepenseProvision = depenseActuelle - cautionAmount;
                    patient.ProvisionClient = provisionActuelle + cautionAmount;
                    await patient.save();
                }
            }

            if (facturation.Designationtypeacte === "PHARMACIE") {
                // Cas pharmacie - mettre à jour les prescriptions
                const prescriptions = await PatientPrescription.find({ facturation: facturation._id });
                for (const prescription of prescriptions) {
                    prescription.StatutPrescriptionMedecin = 1;
                    prescription.actePayeCaisse = "Paiement Annulé";
                    prescription.payeLe = undefined;
                    prescription.heure = "";
                    prescription.payePar = "";
                    prescription.facturation = undefined as any;
                    await prescription.save();
                }

                // Supprimer les encaissements pour cette facturation
                await EncaissementCaisse.deleteMany({ IDFACTURATION: facturation._id });

                // Supprimer la facturation
                await Facturation.findByIdAndDelete(facturation._id);

            } else {
                // Cas autres examens/hospitalisations - mettre à jour les lignes de prestation
                const lignesPrestation = await LignePrestation.find({ idFacturation: facturation._id });
                for (const ligne of lignesPrestation) {
                    if (ligne.statutPrescriptionMedecin === 3) {
                        ligne.statutPrescriptionMedecin = 1;
                        ligne.actePayeCaisse = "Non Payé";
                        ligne.datePaiementCaisse = undefined;
                        ligne.heurePaiement = "";
                        ligne.payePar = "";
                        ligne.idFacturation = undefined as any;
                        await ligne.save();
                    }
                }

                // Supprimer les encaissements pour cette facturation
                await EncaissementCaisse.deleteMany({ IDFACTURATION: facturation._id });

                // Supprimer la facturation
                await Facturation.findByIdAndDelete(facturation._id);
            }
        } else {
            return NextResponse.json({ error: "Type de facture non reconnu" }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            message: "Facture annulée avec succès"
        }, { status: 200 });

    } catch (error: any) {
        console.error('Erreur API POST /api/annulation/valider:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}