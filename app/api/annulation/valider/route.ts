import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { Consultation } from "@/models/consultation";
import { Facturation } from "@/models/Facturation";
import { Patient } from "@/models/patient";
import { EncaissementCaisse } from "@/models/EncaissementCaisse";
import { PatientPrescription } from "@/models/PatientPrescription";
import { LignePrestation } from "@/models/lignePrestation";
import { db } from "@/db/mongoConnect";

export async function POST(req: NextRequest) {
    await db();

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
                patient.DepenseProvision -= (consultation.tiket_moderateur + consultation.ReliquatPatient);
                patient.ProvisionClient += (consultation.tiket_moderateur + consultation.ReliquatPatient);
                await patient.save();
            }

            // Mettre à jour la consultation
            consultation.StatutC = true;
            consultation.statutPrescriptionMedecin = 1;
            consultation.Ordonnerlannulation = 2;
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