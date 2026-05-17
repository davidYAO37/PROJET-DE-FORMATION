"use client";

import { ExamenHospitalisationForm } from "@/types/examenHospitalisation";
import { useState } from "react";
import { Button, Row, Col, Alert } from "react-bootstrap";

// Props mises à jour
type Props = {
  disabled?: boolean;
  formData: ExamenHospitalisationForm;
  lignes?: any[];
  modeModification?: boolean;
  examenHospitId?: string;
  onSubmit?: (payload: any) => Promise<void>;
  onSuccess?: () => void;
  onError?: (message: string) => void;
};

// Composant principal
export default function ActionsButtonsCaisse({
  disabled = false,
  formData,
  lignes = [],
  modeModification = false,
  examenHospitId,
  onSubmit,
  onSuccess,
  onError,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locked, setLocked] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  // Validation simple
  const validateForm = (): boolean => {
    const errors: string[] = [];

    // Vérifier le patient - accepter N'IMPORTE QUELLE source de données patient
    const hasPatient =
      formData.patientId ||
      formData.IdPatient ||
      formData.PatientP ||
      (lignes && lignes.length > 0 && lignes[0]?.IdPatient);
    if (!hasPatient) {
      errors.push("Patient obligatoire");
    }

    // Vérifier les actes (accepter actes OU lignes passées comme prop)
    const hasActes = (formData.actes && formData.actes.length > 0) || (lignes && lignes.length > 0);
    if (!hasActes) {
      errors.push("Au moins un acte requis");
    }

    // Vérifier le mode de paiement - être plus flexible
    const hasModePaiement = formData.Modepaiement || formData.TotalapayerPatient > 0 || (lignes && lignes.length > 0);
    if (!hasModePaiement) {
      errors.push("Mode de paiement obligatoire");
    }

    if (errors.length > 0) {
      const message = errors.join(", ");
      setErrorMessage(message);
      onError?.(message);
      return false;
    }

    return true;
  };

  // Confirmation
  const showConfirmation = (): boolean => {
    const action = modeModification ? "valider" : "enregistrer";
    const patientName = formData.PatientP || formData.patientId || "ce patient";
    const message = `Voulez-vous ${action} la facture du patient ${patientName}?`;
    return window.confirm(message);
  };

  // Construction du payload
  const buildPayload = () => {
    const recuPar = localStorage.getItem("nom_utilisateur") || "Système";

    return {
      header: {
        ...(modeModification && examenHospitId ? { _id: examenHospitId } : {}),
        PatientP: formData.PatientP || "",
        IdPatient: formData.patientId,
        Code_dossier: formData.Code_dossier || "",
        DatePres: formData.DatePres.toISOString(),
        Rclinique: formData.renseignementclinique || "",
        Montanttotal: formData.factureTotal || 0,
        MontantRecu: formData.TotalPaye || 0,
        TotalapayerPatient: formData.TotalapayerPatient || 0,
        PartAssuranceP: formData.partAssurance || 0,
        Partassuré: formData.Partassure || 0,
        Assurance: formData.assurance?.designationassurance || "",
        IDASSURANCE: formData.assurance.assuranceId,
        IDSOCIETEASSURANCE: formData.assurance.societe || "",
        Souscripteur: formData.assurance.adherent || "",
        SOCIETE_PATIENT: formData.societePatient || "",
        TotalPaye: formData.TotalPaye || 0,
        Restapayer: formData.resteAPayer || 0,
        Taux: formData.assurance.taux || 0,
        NumBon: formData.assurance.numeroBon || "",
        medecinPrescripteur: { nom: formData.medecinPrescripteur },
        CodePrestation: formData.CodePrestation,
        reduction: formData.reduction || 0,
        MotifRemise: formData.MotifRemise || "",
        tauxreduction: formData.tauxreduction || 0,
        TotaleTaxe: formData.TotaleTaxe || 0,
        Numcarte: formData.assurance.numero || "",
        IDTYPE_ACTE: formData.CodePrestation,
        Entrele: formData.dateEntree,
        SortieLe: formData.dateSortie,
        Heure_Facturation: new Date().toLocaleTimeString("fr-FR"),
        DateEncaissement: new Date().toISOString().split("T")[0],
        nombreDeJours: formData.nombreDeJours || 1,
        Designationtypeacte: formData.typeacte,
        Assuré: formData.Assure === "OUI",
        Payéoupas: true,
        StatutLaboratoire: 1,
        TotalReliquatPatient: formData.surplus || 0,
        statutPrescriptionMedecin: 3,
        StatutPaiement: "Facture Payée",
        CompteClient: formData.Modepaiement === "Caution",
        CautionPatient: formData.Modepaiement === "Caution" ? formData.TotalapayerPatient : 0,
        Modepaiement: formData.Modepaiement,
        IDMEDECIN: formData.medecinId,
        MontantMedecin: formData.MontantMedecinExécutant || 0,
        assuranceInfo: formData.assurance,
      },
      lignes: lignes.map((ligne) => ({
        ...ligne,
        Statutprescription: ligne.payé ? 3 : 1,
      })),
      Recupar: recuPar,
    };
  };

  // Vérification de l'enregistrement effectif dans les 3 collections
  const verifyRecordings = async (examenId: string): Promise<boolean> => {
    try {
      console.log("🔍 Vérification de l'enregistrement dans les 3 collections...");

      // 1️⃣ Vérifier ExamenHospitalisation
      const examenResponse = await fetch(
        `/api/examenhospitalisationFacture?CodePrestation=${encodeURIComponent(formData.CodePrestation || "")}&typeActe=${encodeURIComponent(formData.typeacte || "")}`,
        { method: "GET" }
      );

      if (!examenResponse.ok) {
        throw new Error("❌ ExamenHospitalisation non trouvé en base");
      }
      const examen = await examenResponse.json();
      console.log("✅ ExamenHospitalisation vérifié avec ID:", examen._id);

      // 2️⃣ Vérifier Facturation via idHospitalisation
      const facturationResponse = await fetch(
        `/api/facturation?hospitalId=${examenId}`,
        { method: "GET" }
      );

      if (!facturationResponse.ok) {
        throw new Error("❌ Aucune facturation trouvée pour cette hospitalisation");
      }

      const facturationData = await facturationResponse.json();
      if (!facturationData.success || !facturationData.data || facturationData.data.length === 0) {
        throw new Error("❌ Facturation n'a pas été enregistrée correctement");
      }
      console.log("✅ Facturation vérifié(e):", facturationData.data.length, "enregistrement(s)");

      // 3️⃣ Vérifier LignePrestation via idHospitalisation
      const lignesResponse = await fetch(
        `/api/ligneprestationFacture?idHospitalisation=${examenId}`,
        { method: "GET" }
      );

      if (!lignesResponse.ok) {
        throw new Error("❌ Impossible de récupérer les lignes de prestation");
      }

      const lignesData = await lignesResponse.json();
      if (!lignesData.success || !lignesData.data || lignesData.data.length === 0) {
        throw new Error("❌ Aucune ligne de prestation n'a été enregistrée");
      }
      console.log("✅ LignePrestation vérifiée(s):", lignesData.data.length, "enregistrement(s)");

      console.log("✅✅✅ Tous les enregistrements ont été vérifiés avec succès!");
      return true;
    } catch (err: any) {
      console.error("❌ Erreur lors de la vérification:", err.message);
      throw err;
    }
  };

  // Fonction pour créer une nouvelle facture
  const creerFacture = async (examenId: string) => {
    const facturePayload = {
      idHospitalisation: examenId,
      patientId: formData.patientId,

      ////////////////////////////////// facture fields

      CodePrestation: formData.CodePrestation || "",
      PatientP: formData.PatientP || "",
      Code_dossier: formData.Code_dossier || "",
      DatePres: formData.dateEntree || new Date().toISOString(),
      Montanttotal: formData.factureTotal || 0,
      MontantRecu: formData.MontantRecu || formData.TotalPaye || 0,
      TotalapayerPatient: formData.TotalapayerPatient || 0,
      PartAssuranceP: formData.partAssurance || 0,
      Partassure: formData.Partassure || 0,
      Assurance: formData.assurance?.designationassurance || "",
      IDASSURANCE: formData.assurance.assuranceId,
      IDSOCIETEASSURANCE: formData.assurance.societe || "",
      NomMed: formData.medecinPrescripteur || "",
      IDTYPE_ACTE: formData.typeacte || undefined,
      Entrele: formData.dateEntree || undefined,
      SortieLe: formData.dateSortie || undefined,
      nombreDeJours: formData.nombreDeJours || undefined,
      Désignationtypeacte: formData.typeacte || "",
      StatutPaiement: formData.StatutPaiement || "Facture Payée",
      //FacturePar: recuPar || undefined,
      Rclinique: formData.renseignementclinique,
      reduction: formData.reduction || 0,
      MotifRemise: formData.MotifRemise || "",
      Restapayer: formData.resteAPayer || 0,

      //////////////////////////////////////////////////

      lignes: lignes.map(ligne => ({
        idLigne: ligne.IDLignePrestation,
        designation: ligne.Acte,
        quantite: ligne.QteP,
        prixUnitaire: ligne.Prixunitaire,
        montant: ligne.PrixTotal,
        statut: ligne.AFacturer === 'Payé' ? 'payé' : 'non_paye'
      }))
    };

    const response = await fetch('/api/facturation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(facturePayload)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Erreur lors de la création de la facture: ${error.message}`);
    }

    return response.json();
  };

  // Fonction pour mettre à jour les lignes de prestation
  const mettreAJourLignes = async (examenId: string) => {
    const promises = lignes.map(async (ligne) => {
      // Ne pas inclure l'ID pour les nouvelles lignes
      const { IDLignePrestation, ...ligneSansId } = ligne;
      const lignePayload = {
        ...ligneSansId,
        IDHOSPO: examenId, // Utiliser le paramètre examenId
        Code_dossier: formData.Code_dossier || "",
        statutPrescriptionMedecin: ligne.AFacturer === 'Payé' ? 3 : 1, // 3 = Payé, 1 = Non payé
        datePaiementCaisse: ligne.AFacturer === 'Payé' ? new Date().toISOString() : null,
        payePar: ligne.AFacturer === 'Payé' ? localStorage.getItem("nom_utilisateur") || 'Système' : null
      };

      // Pour les nouvelles lignes (sans ID), on fait un POST
      if (!IDLignePrestation) {
        const response = await fetch('/api/ligneprestationFacture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lignePayload)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(`Erreur lors de la création de la ligne: ${error.message}`);
        }
        return response.json();
      }
      // Pour les lignes existantes, on fait un PUT
      else {
        const response = await fetch(`/api/ligneprestationFacture/${IDLignePrestation}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lignePayload)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(`Erreur lors de la mise à jour de la ligne: ${error.message}`);
        }
        return response.json();
      }
    });

    return Promise.all(promises);
  };

  // Fonction utilitaire pour extraire l'ID d'un objet ou d'une chaîne
  const extractId = (id: any): string | null => {
    if (!id) return null;
    if (typeof id === 'string') return id;
    if (id.id) return String(id.id);
    if (id._id) return String(id._id);
    return null;
  };

  // Soumission principale
  const handleSubmit = async () => {
    if (isSubmitting || disabled || locked) return;

    try {
      setErrorMessage("");
      setSuccessMessage("");
      setIsSubmitting(true);

      // Si onSubmit est fourni, l'utiliser directement (les validations sont faites dans onSubmit)
      if (onSubmit) {
        await onSubmit({});
        setIsSubmitting(false);
        return;
      }

      if (!validateForm()) return;
      if (!showConfirmation()) return;

      const payload = buildPayload();
      let responseData: any = null;
      let examenId: string | null = null;

      // 1. Gestion de l'examen d'hospitalisation
      if (modeModification) {
        // Cas B: Modification d'une prestation existante
        const idToUpdate = extractId(examenHospitId);
        if (!idToUpdate) {
          throw new Error("ID d'examen invalide pour la mise à jour");
        }

        const response = await fetch(`/api/examenhospitalisationFacture/${idToUpdate}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Erreur lors de la mise à jour de l'examen");
        }
        responseData = await response.json();
        examenId = responseData._id || idToUpdate;
      } else {
        // Cas A: Création d'une nouvelle prestation
        const response = await fetch("/api/examenhospitalisationFacture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Erreur lors de la création de l'examen");
        }
        responseData = await response.json();
        examenId = responseData._id;
      }

      if (!examenId) {
        throw new Error("Impossible de déterminer l'ID de l'examen après enregistrement");
      }

      // Créer une nouvelle facture pour l'historique
      await creerFacture(examenId);

      // Mettre à jour les lignes existantes
      await mettreAJourLignes(examenId);

      // Vérification finale des enregistrements
      await verifyRecordings(examenId);

      setSuccessMessage(
        modeModification
          ? "✅ Facture validée avec succès"
          : "✅ Facture enregistrée avec succès"
      );
      setLocked(true);

      setTimeout(() => onSuccess?.(), 1500);
    } catch (err: any) {
      const message = err.message || "❌ Erreur lors de l'enregistrement";
      console.error('Erreur détaillée:', err);
      setErrorMessage(message);
      onError?.(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Row className="mt-4">
      <Col>
        {errorMessage && (
          <Alert
            variant="danger"
            dismissible
            onClose={() => setErrorMessage("")}
          >
            {errorMessage}
          </Alert>
        )}
        {successMessage && (
          <Alert
            variant="success"
            dismissible
            onClose={() => setSuccessMessage("")}
          >
            {successMessage}
          </Alert>
        )}
        <Button
          variant={locked ? "secondary" : "success"}
          size="lg"
          className="w-100"
          disabled={disabled || isSubmitting || locked}
          onClick={handleSubmit}
        >
          {isSubmitting
            ? "⏳ Enregistrement en cours..."
            : locked
              ? "✅ Enregistré avec succès"
              : modeModification
                ? "📝 Valider la facture"
                : "💾 Enregistrer la facture"}
        </Button>
      </Col>
    </Row>
  );
}
