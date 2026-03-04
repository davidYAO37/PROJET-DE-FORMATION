"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Modal, Button, Form, Alert, Spinner, Row, Col, Card } from 'react-bootstrap';
import InfoPatient from "./InfoPatient";
import TableMedicaments, { IMedicament, ILigneMedicament } from "./TableMedicaments";
import ModePaiement from "./ModePaiement";
import ValidationPaiement from "./ValidationPaiement";
import { PrescriptionForm } from "@/types/Prescription";

// Types pour la validation
type ValidationResult = {
  isValid: boolean;
  message: string;
  type: 'error' | 'warning' | 'info';
};

// Interfaces
interface Patient {
  _id?: string;
  Nom?: string;
  Sexe?: string;
  Age_partient?: string;
  Date_naisse?: string;
  Situationgeo?: string;
}

interface Consultation {
  _id?: string;
  CodePrestation?: string;
  Code_dossier?: string;
  StatutC?: boolean;
  statutPrescriptionMedecin?: number;
  ticket_moderateur?: number;
  Temperature?: string;
  Tension?: string;
  TailleCons?: string;
  Glycemie?: string;
  Poids?: string;
  DatePres?: string;
  IDMEDECIN?: string;
  tauxAssurance?: number;
  assurance?: string;
  IDASSURANCE?: string;
  NumBon?: string; // Ajout du champ NumBon
  SOCIETE_PATIENT?: string; // Ajout du champ SOCIETE_PATIENT
}

interface Prescription {
  _id?: string;
  BanqueC?: string;
  NumChèque?: string;
  Modepaiement?: string;
  Partassuré?: number;
  MotifRemise?: string; // Ajout du champ MotifRemise
}

interface TotauxPharmacie {
  montantTotal: number;
  partAssurance: number;
  partAssure: number;
  montantRecu: number;
  resteAPayer: number;
  remise: number;
}

type Props = {
  show: boolean;
  onHide: () => void;
  codePrestation?: string;
};

export default function PharmacieCaisseModal({
  show,
  onHide,
  codePrestation: initialCodePrestation,
}: Props) {
  const [medicaments, setMedicaments] = useState<IMedicament[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // États pour les données patient/consultation
  const [patient, setPatient] = useState<Patient>({});
  const [consultation, setConsultation] = useState<Consultation>({});
  const [prescription, setPrescription] = useState<Prescription>({});
  const [codePrestation, setCodePrestation] = useState(
    initialCodePrestation || "",
  );

  // États pour les médicaments et totaux
  const [lignesMedicaments, setLignesMedicaments] = useState<ILigneMedicament[]>([]);
  const [presetLines, setPresetLines] = useState<ILigneMedicament[] | undefined>(undefined);
  const [resetKey, setResetKey] = useState(0); // Clé pour réinitialiser TableMedicaments
  const [totaux, setTotaux] = useState<TotauxPharmacie>({
    montantTotal: 0,
    partAssurance: 0,
    partAssure: 0,
    montantRecu: 0,
    resteAPayer: 0,
    remise: 0,
  });
  const [consultationTrouvee, setConsultationTrouvee] = useState(false); // État pour savoir si une consultation est trouvée

  // États pour le paiement
  const [modePaiement, setModePaiement] = useState("");
  const [montantEncaisse, setMontantEncaisse] = useState(0);

  // Simulation utilisateur (à remplacer par l'utilisateur réel)
  const currentUser = "Utilisateur Test";
  const isObjectId = (value?: string) => typeof value === "string" && /^[a-f\\d]{24}$/i.test(value);

  const imprimerRecuPharmacie = (facturationId: string) => {
    // Équivalent Web de iInitRequêteEtat/iImprimeEtat : on ouvre une page imprimable dédiée.
    const url = `/pages/servicecaisse/recu-pharmacie?facturationId=${encodeURIComponent(facturationId)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // État pour le formulaire de paiement (remise + motif notamment)
  const [formData, setFormData] = useState<PrescriptionForm>({
    Montanttotal: 0,
    PartAssurance: 0,
    PartAssure: 0,
    Remise: 0,
    MotifRemise: "",
    Restapayer: 0,
  });

  // Fonction de validation selon la logique WLangage
  const validerPaiement = useCallback((): ValidationResult => {
    // 1. Vérifier qu'au moins une ligne est payée
    // Équivalent: nMoncompte = 0, POUR TOUTE LIGNE, SI COL_FActuré="Payé" ALORS nMoncompte++
    const lignesPayees = lignesMedicaments.filter(ligne => ligne.paye);

    if (lignesPayees.length === 0) {
      return {
        isValid: false,
        message: "Merci de régler une facture avant cette action",
        type: 'warning'
      };
    }

    // 2. Vérifier la remise et le motif
    // Équivalent: SI SAI_REMISE <> 0 ET SAI_Motif_remise="" ALORS
    if (totaux.remise > 0 && !(formData.MotifRemise || "").trim()) {
      return {
        isValid: false,
        message: "Veuillez saisir le motif de la remise",
        type: 'error'
      };
    }

    // 3. Vérifier le mode de paiement
    // Équivalent: SI COMBO_ModedePaiement="" ALORS
    if (!modePaiement || modePaiement.trim() === "") {
      return {
        isValid: false,
        message: "Veuillez ajouter le mode de paiement",
        type: 'error'
      };
    }

    // 4. Vérifications supplémentaires (basées sur la logique métier)
    // Vérifier que le montant encaissé est suffisant
    if (montantEncaisse < totaux.resteAPayer) {
      return {
        isValid: false,
        message: `Montant encaissé insuffisant. Il manque ${totaux.resteAPayer - montantEncaisse} FCFA`,
        type: 'error'
      };
    }

    // 5. Vérifier qu'il y a des médicaments dans les lignes payées
    const lignesPayeesAvecMedicaments = lignesPayees.filter(ligne => ligne.medicamentId);
    if (lignesPayeesAvecMedicaments.length === 0) {
      return {
        isValid: false,
        message: "Aucun médicament valide dans les lignes payées",
        type: 'error'
      };
    }

    // Si toutes les validations passent
    return {
      isValid: true,
      message: `Validation réussie: ${lignesPayees.length} ligne(s) payée(s) pour un total de ${totaux.partAssure + totaux.partAssurance} FCFA`,
      type: 'info'
    };
  }, [lignesMedicaments, totaux, formData.MotifRemise, modePaiement, montantEncaisse]);

  // Charger les médicaments au montage du modal
  useEffect(() => {
    if (show) {
      loadMedicaments();
    }
  }, [show]);

  // Initialiser le code prestation si fourni
  useEffect(() => {
    if (show && initialCodePrestation) {
      setCodePrestation(initialCodePrestation);
    }
  }, [show, initialCodePrestation]);

  // Mettre à jour le formulaire de paiement quand les totaux changent
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      Montanttotal: totaux.montantTotal,
      PartAssurance: totaux.partAssurance,
      PartAssure: totaux.partAssure,
      Remise: totaux.remise,
      Restapayer: totaux.resteAPayer,
    }));
  }, [totaux]);

  const loadMedicaments = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/medicaments");
      if (res.ok) {
        const data = await res.json();
        setMedicaments(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des médicaments:", error);
      setErrorMessage("Impossible de charger les médicaments");
    } finally {
      setLoading(false);
    }
  };

  // Handler pour les changements de code prestation
  const verifierStockMedicament = async (medicamentId: string, quantiteRequise: number): Promise<boolean> => {
    try {
      const response = await fetch(`/api/stock?IDMEDICAMENT=${encodeURIComponent(medicamentId)}`);
      if (response.ok) {
        const stocks = await response.json();
        const stock = stocks.find((s: any) => s.IDMEDICAMENT === medicamentId);
        return stock && stock.QteEnStock >= quantiteRequise;
      }
      return false;
    } catch (error) {
      console.error("Erreur vérification stock:", error);
      return false;
    }
  };

  // Fonction pour charger les patientprescription liées à la prescription
  const loadPatientPrescriptions = useCallback(async (codePrestation: string, prescriptionId?: string) => {
    try {
      // Charger les patientprescription par Code prestation (param attendu: Code_Prestation)
      let url = `/api/patientprescriptionFacture?Code_Prestation=${encodeURIComponent(codePrestation)}`;
      if (prescriptionId) {
        url += `&IDPRESCRIPTION=${encodeURIComponent(prescriptionId)}`;
      }

      console.log("📡 Chargement des patientprescription:", url);
      const response = await fetch(url);

      if (response.ok) {
        const patientPrescriptions = await response.json();
        console.log("✅ Patientprescription reçues:", patientPrescriptions);

        if (Array.isArray(patientPrescriptions) && patientPrescriptions.length > 0) {
          // Filtrer les patientprescriptions selon les critères
          const prescriptionsFiltrees = await Promise.all(
            patientPrescriptions.map(async (pp: any) => {
              // Critère 1: statutPrescriptionMedecin < 3
              if (pp.statutPrescriptionMedecin >= 3) {
                console.log(`⚠️ Medicament ${pp.nomMedicament} ignoré - statutPrescriptionMedecin >= 3 (${pp.statutPrescriptionMedecin})`);
                return null;
              }

              // Critère 2: médicament en stock avec quantité suffisante
              const medicamentId = pp.medicament?.toString() || pp.IDMEDICAMENT || "";
              if (!medicamentId) {
                console.log(`⚠️ Medicament ${pp.nomMedicament} ignoré - aucun IDMEDICAMENT`);
                return null;
              }

              const quantiteRequise = Number(pp.QteP) || 1;
              const estEnStock = await verifierStockMedicament(medicamentId, quantiteRequise);
              
              if (!estEnStock) {
                console.log(`⚠️ Medicament ${pp.nomMedicament} ignoré - quantité insuffisante en stock (${quantiteRequise} requise)`);
                return null;
              }

              console.log(`✅ Medicament ${pp.nomMedicament} validé - en stock et statut < 3`);
              return pp;
            })
          );

          // Filtrer les null et convertir en ILigneMedicament
          const lignesValidées = prescriptionsFiltrees.filter(Boolean);
          
          // Afficher un message si des médicaments ont été filtrés
          const nombreTotal = patientPrescriptions.length;
          const nombreValidés = lignesValidées.length;
          const nombreFiltrés = nombreTotal - nombreValidés;
          
          if (nombreFiltrés > 0) {
            console.log(`ℹ️ ${nombreFiltrés} médicament(s) filtré(s) sur ${nombreTotal} total - ${nombreValidés} éligible(s) pour le paiement`);
            setInfoMessage(`${nombreFiltrés} médicament(s) non éligible(s) pour le paiement (stock insuffisant ou déjà payé)`);
            // Effacer le message après 5 secondes
            setTimeout(() => setInfoMessage(null), 5000);
          }
          
          if (lignesValidées.length === 0) {
            console.log("ℹ️ Aucun médicament valide trouvé pour le paiement à la caisse");
            setInfoMessage("Aucun médicament éligible pour le paiement (stock insuffisant ou déjà payé)");
            setPresetLines([]);
            setResetKey(prev => prev + 1);
            return;
          }

          // Convertir les patientprescription validées en ILigneMedicament
          const lignesConverties: ILigneMedicament[] = lignesValidées.map((pp: any) => ({
            id: pp._id || Math.random().toString(36).substr(2, 9),
            medicamentId: pp.medicament?.toString() || pp.IDMEDICAMENT || "",
            designation: pp.nomMedicament || "",
            quantite: Number(pp.QteP) || 1,
            posologie: pp.posologie || "",
            prixUnitaire: Number(pp.prixUnitaire) || 0,
            total: Number(pp.prixTotal) || 0,
            paye: pp.actePayeCaisse === "Payé" || false,
            refuse: pp.exclusionActe === "Refuser" || pp.ExclusionActae === "Refuser",
            partAssurance: Number(pp.partAssurance) || 0,
            partAssure: Number(pp.partAssure) || 0,
            DATE: pp.DatePres ? (typeof pp.DatePres === 'string' ? pp.DatePres : new Date(pp.DatePres).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
            reference: pp.reference || "",
            payeLe: pp.payeLe ? (typeof pp.payeLe === 'string' ? pp.payeLe : new Date(pp.payeLe).toISOString().split('T')[0]) : undefined,
            payePar: pp.payePar || undefined,
            payeA: pp.heure || undefined,
          }));

          console.log("📋 Lignes converties:", lignesConverties);
          setPresetLines(lignesConverties);
          setResetKey(prev => prev + 1);
        } else {
          setPresetLines([]);
          setResetKey(prev => prev + 1);
        }
      } else {
        setPresetLines([]);
        setResetKey(prev => prev + 1);
      }
    } catch (error) {
      console.error("❌ Erreur lors du chargement des patientprescription:", error);
      setPresetLines([]);
      setResetKey(prev => prev + 1);
    }
  }, []);

  const handleCodePrestationChange = useCallback((code: string) => {
    setCodePrestation(code);
    // À la saisie du code, on remet tout à zéro côté pharmacie
    // et on attend qu'une prescription valide soit trouvée
    setLignesMedicaments([]);
    setPresetLines(undefined);
    setMontantEncaisse(0);
    setModePaiement("");
    setTotaux({
      montantTotal: 0,
      partAssurance: 0,
      partAssure: 0,
      montantRecu: 0,
      resteAPayer: 0,
      remise: 0
    });
    setResetKey(prev => prev + 1);
  }, []);

  const handlePatientChange = useCallback((patientData: Patient) => {
    setPatient(patientData);
  }, []);

  const handleConsultationChange = useCallback(
    (consultationData: Consultation) => {
      setConsultation(consultationData);
    },
    [],
  );

  // Handler pour les changements de prescription (mis à jour)
  const handlePrescriptionChangeUpdated = useCallback(
    async (prescriptionData: Prescription) => {
      console.log("📋 Prescription reçue de InfoPatient:", prescriptionData);
      setPrescription(prescriptionData);

      if (prescriptionData.Modepaiement) {
        setModePaiement(prescriptionData.Modepaiement);
      }

      // Le chargement des patientprescriptions est maintenant géré par InfoPatient
      // via handlePatientPrescriptionsChange - plus besoin de charger manuellement ici
    },
    [],
  );

  // Handler pour les changements de patientprescriptions venant de InfoPatient
  const handlePatientPrescriptionsChange = useCallback(async (patientPrescriptions: any[]) => {
    console.log("📋 Patientprescriptions reçues de InfoPatient:", patientPrescriptions);
    
    if (!Array.isArray(patientPrescriptions) || patientPrescriptions.length === 0) {
      console.log("ℹ️ Aucune patientprescription reçue - table vide");
      setPresetLines([]);
      setResetKey(prev => prev + 1);
      return;
    }

    // Filtrer les patientprescriptions selon les critères
    const prescriptionsFiltrees = await Promise.all(
      patientPrescriptions.map(async (pp: any) => {
        // Critère 1: statutPrescriptionMedecin < 3
        if (pp.statutPrescriptionMedecin >= 3) {
          console.log(`⚠️ Medicament ${pp.nomMedicament} ignoré - statutPrescriptionMedecin >= 3 (${pp.statutPrescriptionMedecin})`);
          return null;
        }

        // Critère 2: médicament en stock avec quantité suffisante
        const medicamentId = pp.medicament?.toString() || pp.IDMEDICAMENT || "";
        if (!medicamentId) {
          console.log(`⚠️ Medicament ${pp.nomMedicament} ignoré - aucun IDMEDICAMENT`);
          return null;
        }

        const quantiteRequise = Number(pp.QteP) || 1;
        const estEnStock = await verifierStockMedicament(medicamentId, quantiteRequise);
        
        if (!estEnStock) {
          console.log(`⚠️ Medicament ${pp.nomMedicament} ignoré - quantité insuffisante en stock (${quantiteRequise} requise)`);
          return null;
        }

        console.log(`✅ Medicament ${pp.nomMedicament} validé - en stock et statut < 3`);
        return pp;
      })
    );

    // Filtrer les null et convertir en ILigneMedicament
    const lignesValidées = prescriptionsFiltrees.filter(Boolean);
    
    // Afficher un message si des médicaments ont été filtrés
    const nombreTotal = patientPrescriptions.length;
    const nombreValidés = lignesValidées.length;
    const nombreFiltrés = nombreTotal - nombreValidés;
    
    if (nombreFiltrés > 0) {
      console.log(`ℹ️ ${nombreFiltrés} médicament(s) filtré(s) sur ${nombreTotal} total - ${nombreValidés} éligible(s) pour le paiement`);
      setInfoMessage(`${nombreFiltrés} médicament(s) non éligible(s) pour le paiement (stock insuffisant ou déjà payé)`);
      // Effacer le message après 5 secondes
      setTimeout(() => setInfoMessage(null), 5000);
    }
    
    if (lignesValidées.length === 0) {
      console.log("ℹ️ Aucun médicament valide trouvé pour le paiement à la caisse");
      setInfoMessage("Aucun médicament éligible pour le paiement (stock insuffisant ou déjà payé)");
      setPresetLines([]);
      setResetKey(prev => prev + 1);
      return;
    }

    // Convertir les patientprescriptions validées en ILigneMedicament
    const lignesConverties: ILigneMedicament[] = lignesValidées.map((pp: any) => ({
      id: pp._id || Math.random().toString(36).substr(2, 9),
      medicamentId: pp.medicament?.toString() || pp.IDMEDICAMENT || "",
      designation: pp.nomMedicament || "",
      quantite: Number(pp.QteP) || 1,
      prixUnitaire: Number(pp.prixUnitaire) || 0,
      total: Number(pp.prixTotal) || 0,
      paye: pp.actePayeCaisse === "Payé" || false,
      refuse: pp.exclusionActe === "Refuser" || pp.ExclusionActae === "Refuser",
      partAssurance: Number(pp.partAssurance) || 0,
      partAssure: Number(pp.partAssure) || 0,
      DATE: pp.DatePres ? (typeof pp.DatePres === 'string' ? pp.DatePres : new Date(pp.DatePres).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
      reference: pp.reference || "",
      payeLe: pp.payeLe ? (typeof pp.payeLe === 'string' ? pp.payeLe : new Date(pp.payeLe).toISOString().split('T')[0]) : undefined,
      payePar: pp.payePar || undefined,
      payeA: pp.heure || undefined,
    }));

    console.log("📋 Lignes converties:", lignesConverties);
    setPresetLines(lignesConverties);
    setResetKey(prev => prev + 1);
  }, [setInfoMessage, verifierStockMedicament]);

  const handleTotauxChange = useCallback((newTotaux: {
    montantTotal: number;
    partAssurance: number;
    partAssure: number;
    montantRecu: number;
    resteAPayer: number;
  }) => {
    setTotaux(prev => ({
      ...prev,
      montantTotal: newTotaux.montantTotal,
      partAssurance: newTotaux.partAssurance,
      partAssure: newTotaux.partAssure,
      resteAPayer: newTotaux.resteAPayer
    }));
  }, []);

  const handleLignesChange = useCallback((lignes: ILigneMedicament[]) => {
    setLignesMedicaments(lignes);
  }, []);

  const handleFormDataChange = useCallback((newFormData: PrescriptionForm | ((prev: PrescriptionForm) => PrescriptionForm)) => {
    if (typeof newFormData === 'function') {
      setFormData(newFormData);
    } else {
      setFormData(newFormData);
      // Mettre à jour les totaux si la remise change
      if (newFormData.Remise !== totaux.remise) {
        setTotaux(prev => ({ ...prev, remise: newFormData.Remise || 0 }));
      }
    }
  }, [totaux.remise]);

  const handleMontantEncaisseChange = useCallback((value: number) => {
    setMontantEncaisse(value);
  }, []);

  const handlePaiementValide = useCallback(async (): Promise<{ facturationId: string; prescriptionId: string }> => {
    const gsUtilisateur = currentUser;
    const now = new Date();

    const toTimeHHMMSS = (d: Date) => d.toTimeString().slice(0, 8);
    const toYMD = (d: Date) => d.toISOString().split("T")[0];

    const fetchJson = async <T,>(url: string, init?: RequestInit): Promise<T> => {
      const res = await fetch(url, init);
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = (data && (data.error || data.message)) ? (data.error || data.message) : `HTTP ${res.status}`;
        throw new Error(msg);
      }
      return data as T;
    };

    const isModification = Boolean(prescription?._id);

    // 1) Ajouter ou modifier la prescription (selon nMonid = 0 ou non)
    const prescriptionPayload = {
      StatuPrescriptionMedecin: 3,
      FacturéPar: gsUtilisateur,
      Payele: toYMD(now),
      Heure: toTimeHHMMSS(now),
      Payéoupas: true,
      PatientP: patient.Nom || "",
      Numcarte: consultation.NumBon || "",
      NumBon: consultation.NumBon || "",
      Designation: "PHARMACIE",
      DatePres: consultation.DatePres || toYMD(now),
      Rclinique: "",
      Montanttotal: totaux.montantTotal,
      PartAssuranceP: totaux.partAssurance,
      Partassuré: totaux.partAssure,
      MontantRecu: montantEncaisse,
      Assurance: consultation.assurance || "",
      Taux: consultation.tauxAssurance || 0,
      REMISE: totaux.remise,
      MotifRemise: (formData.MotifRemise || "").trim(),
      TotalapayerPatient: Math.max(0, totaux.partAssure - (totaux.remise || 0)),
      Restapayer: totaux.resteAPayer,
      Code_Prestation: codePrestation,
      IDpriseCharge: "",
      IDMEDECIN: consultation.IDMEDECIN || "",
      StatutPaiement: "Facture payée",
      Modepaiement: modePaiement,
      IDASSURANCE: consultation.IDASSURANCE || "",
      IDSOCEITEASSUANCE: consultation._id || "",
      SOCIETE_PATIENT: consultation.SOCIETE_PATIENT || ""
    };

    let prescriptionId = "";
    if (isModification && prescription._id) {
      const updated = await fetchJson<{ success: boolean; data?: any }>(`/api/prescription/${prescription._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prescriptionPayload),
      });
      prescriptionId = updated?.data?._id || prescription._id;
    } else {
      const created = await fetchJson<{ success: boolean; data?: any }>(`/api/prescription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prescriptionPayload),
      });
      prescriptionId = created?.data?._id;
    }

    if (!prescriptionId) {
      throw new Error("Impossible de déterminer l'ID de prescription");
    }

    // 2) Ajouter une nouvelle facture (toujours)
    const facturePayload: any = {
      IDPRESCRIPTION: prescriptionId,
      StatuPrescriptionMedecin: 3,
      FacturéPar: gsUtilisateur,
      DateModif: toYMD(now),
      DateFacturation: toYMD(now),
      Heure_Facturation: toTimeHHMMSS(now),
      Payéoupas: true,
      PatientP: patient.Nom || "",
      IDPARTIENT: patient._id || "",
      Numcarte: consultation.NumBon || "",
      NumBon: consultation.NumBon || "",
      Désignationtypeacte: "PHARMACIE",
      DatePres: consultation.DatePres || toYMD(now),
      Rclinique: "",
      Montanttotal: totaux.montantTotal,
      PartAssuranceP: totaux.partAssurance,
      Partassuré: totaux.partAssure,
      TotalPaye: montantEncaisse,
      MontantRecu: montantEncaisse,
      Assuance: consultation.assurance || "",
      Taux: consultation.tauxAssurance || 0,
      reduction: totaux.remise,
      TotalapayerPatient: Math.max(0, totaux.partAssure - (totaux.remise || 0)),
      Restapayer: totaux.resteAPayer,
      CodePrestation: codePrestation,
      Code_Prestation: codePrestation, // compat / cohérence
      IDMEDECIN: consultation.IDMEDECIN || "",
      IDASSURANCE: consultation.IDASSURANCE || "",
      Modepaiement: modePaiement,
      BanqueC: prescription.BanqueC || "",
      NumChèque: prescription.NumChèque || "",
      IDSOCEITEASSUANCE: consultation._id || consultation.IDASSURANCE || "",
      SOCIETE_PATIENT: consultation.SOCIETE_PATIENT || ""
    };

    const factureCreated = await fetchJson<{ success: boolean; data?: any }>(`/api/facturation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(facturePayload),
    });
    const facturationId = factureCreated?.data?._id;
    if (!facturationId) {
      throw new Error("Impossible de déterminer l'ID de facturation");
    }

    // 3) Charger l'état actuel des lignes en base (pour savoir si on modifie ou on ajoute)
    const existingLines = await fetchJson<any[]>(
      `/api/patientprescriptionFacture?IDPRESCRIPTION=${encodeURIComponent(prescriptionId)}&Code_Prestation=${encodeURIComponent(codePrestation)}`,
    );
    const existingById = new Map<string, any>();
    for (const l of existingLines || []) {
      if (l?._id) existingById.set(String(l._id), l);
    }

    // 4) Appliquer les procédures ligne par ligne (Payé / Non Payé)
    const lignesValides = (lignesMedicaments || []).filter((l) => l.medicamentId && l.designation);

    for (const ligne of lignesValides) {
      const lineDate = ligne.DATE ? new Date(ligne.DATE) : now;
      const exclusionActe = ligne.refuse ? "Refuser" : "Accepter";

      const commonPayload: any = {
        IDPRESCRIPTION: prescriptionId,
        PatientP: patient.Nom || "",
        reference: (ligne.reference || "").trim(),
        IDPARTIENT: patient._id || "",
        QteP: Number(ligne.quantite) || 1,
        posologie: (ligne.posologie || "").trim(),
        DatePres: lineDate,
        heureFacturation: toTimeHHMMSS(now),
        prixUnitaire: Number(ligne.prixUnitaire) || 0,
        prixTotal: Number(ligne.total) || 0,
        nomMedicament: ligne.designation || "",
        partAssurance: Number(ligne.partAssurance) || 0,
        partAssure: Number(ligne.partAssure) || 0,
        CodePrestation: codePrestation,
        medicament: ligne.medicamentId,
        exclusionActe,
        IDSOCIETEASSURANCE: consultation._id || "",
        SOCIETE_PATIENT: consultation.SOCIETE_PATIENT || "",
      };

      const payloadPayee = {
        ...commonPayload,
        statutPrescriptionMedecin: 3,
        actePayeCaisse: "Payé",
        payeLe: now,
        payePar: gsUtilisateur,
        datePaiement: now,
        heure: toTimeHHMMSS(now),
        facturation: facturationId,
      };

      const payloadNonPayee = {
        ...commonPayload,
        statutPrescriptionMedecin: 1,
        actePayeCaisse: "Non Payé",
        payeLe: null,
        payePar: "",
        datePaiement: null,
        heure: "",
        facturation: null,
      };

      const shouldUpdate = isObjectId(ligne.id) && existingById.has(ligne.id);
      const payload = ligne.paye ? payloadPayee : payloadNonPayee;

      if (shouldUpdate) {
        await fetchJson(`/api/patientprescriptionFacture/${ligne.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // Important: ne jamais forcer un _id non ObjectId (sinon CastError côté Mongo)
        await fetchJson(`/api/patientprescriptionFacture`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
    }

    // 5) Stock: appliquer aux lignes payées + restaurer si une ligne passe en Non Payé
    const patientId = patient._id || "";

    const getSortiesForLine = async (reference: string) => {
      const qs = new URLSearchParams();
      qs.set("reference", reference);
      qs.set("IDPRESCRIPTION", prescriptionId);
      if (patientId) qs.set("Patient", patientId);
      return await fetchJson<any[]>(`/api/sortiestock?${qs.toString()}`);
    };

    const updateStockForReference = async (reference: string, applyDelta: (s: any) => { QteEnStock: number; QteStockVirtuel: number }) => {
      const stocks = await fetchJson<any[]>(`/api/stock?reference=${encodeURIComponent(reference)}`);
      const stockActuel = stocks?.[0];
      if (!stockActuel?._id) return;

      const { QteEnStock, QteStockVirtuel } = applyDelta(stockActuel);
      await fetchJson(`/api/stock/${stockActuel._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          QteEnStock,
          QteStockVirtuel,
          AuteurModif: gsUtilisateur,
          DateModif: now,
        }),
      });
    };

    // 5.a) Lignes Payé => upsert sortie + ajuster stock (avec restauration ancienne quantité)
    const lignesPayees = lignesValides.filter((l) => l.paye && (l.reference || "").trim() !== "");
    for (const ligne of lignesPayees) {
      const reference = (ligne.reference || "").trim();
      const sortiesExistantes = await getSortiesForLine(reference);
      const ancienneQuantite = sortiesExistantes?.[0]?.Quantite ? Number(sortiesExistantes[0].Quantite) : 0;

      const sortieStockData: any = {
        DateSortie: now,
        Reference: reference,
        Quantite: Number(ligne.quantite) || 0,
        Prix_unitaire: Number(ligne.prixUnitaire) || 0,
        Prix_TotalS: Number(ligne.total) || 0,
        Motif: "Vente",
        Observations: "",
        SaisiPar: gsUtilisateur,
        SaisiLe: now,
        ArticleS: ligne.designation,
        Prescription: prescriptionId,
        Patient: patientId || null,
      };

      if (sortiesExistantes && sortiesExistantes.length > 0) {
        await fetchJson(`/api/sortiestock/${sortiesExistantes[0]._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sortieStockData),
        });
      } else {
        await fetchJson(`/api/sortiestock`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sortieStockData),
        });
      }

      await updateStockForReference(reference, (stockActuel) => {
        const qteStock = Number(stockActuel.QteEnStock || 0);
        const qteVirtuel = Number(stockActuel.QteStockVirtuel || 0);
        const nouvelleQteEnStock = qteStock - (Number(ligne.quantite) || 0) + ancienneQuantite;
        const nouveauQteStockVirtuel = qteVirtuel + (Number(ligne.quantite) || 0) - ancienneQuantite;
        return { QteEnStock: nouvelleQteEnStock, QteStockVirtuel: nouveauQteStockVirtuel };
      });
    }

    // 5.b) Lignes Non Payé => si une sortie existe, restaurer stock puis supprimer sortie
    const lignesNonPayees = lignesValides.filter((l) => !l.paye && (l.reference || "").trim() !== "");
    for (const ligne of lignesNonPayees) {
      const reference = (ligne.reference || "").trim();
      const sortiesExistantes = await getSortiesForLine(reference);
      if (!sortiesExistantes || sortiesExistantes.length === 0) continue;

      const sortie = sortiesExistantes[0];
      const ancienneQuantite = Number(sortie?.Quantite || 0);
      if (ancienneQuantite <= 0) continue;

      await updateStockForReference(reference, (stockActuel) => {
        const qteStock = Number(stockActuel.QteEnStock || 0);
        const qteVirtuel = Number(stockActuel.QteStockVirtuel || 0);
        return { QteEnStock: qteStock + ancienneQuantite, QteStockVirtuel: Math.max(0, qteVirtuel - ancienneQuantite) };
      });

      await fetchJson(`/api/sortiestock/${sortie._id}`, { method: "DELETE" });
    }

    return { facturationId, prescriptionId };
  }, [currentUser, prescription, patient, consultation, totaux, montantEncaisse, formData.MotifRemise, modePaiement, codePrestation, lignesMedicaments]);

  const handleValiderPaiement = useCallback(async (): Promise<{ success: boolean; message?: string }> => {
    if (!codePrestation) {
      const msg = "Veuillez d'abord saisir un N° de prestation";
      setErrorMessage(msg);
      return { success: false, message: msg };
    }

    // Utiliser la fonction de validation
    const validation = validerPaiement();

    if (!validation.isValid) {
      setErrorMessage(validation.message);
      return { success: false, message: validation.message };
    }

    try {
      const { facturationId, prescriptionId } = await handlePaiementValide();
      console.log("✅ Paiement terminé. Prescription:", prescriptionId, "Facturation:", facturationId);
      imprimerRecuPharmacie(facturationId);
      return { success: true };
    } catch (e: any) {
      const msg = e?.message || "Erreur lors du traitement du paiement";
      setErrorMessage(msg);
      return { success: false, message: msg };
    }
  }, [codePrestation, validerPaiement, handlePaiementValide]);

  const handleHide = useCallback(() => {
    // Réinitialiser les états à la fermeture
    setCodePrestation("");
    setPatient({});
    setConsultation({});
    setPrescription({});
    setLignesMedicaments([]);
    setMontantEncaisse(0);
    setModePaiement("");
    setTotaux({
      montantTotal: 0,
      partAssurance: 0,
      partAssure: 0,
      montantRecu: 0,
      resteAPayer: 0,
      remise: 0,
    });
    setErrorMessage(null);
    onHide();
  }, [onHide]);

  return (
    <>
      <Modal show={show} onHide={handleHide} size="xl" centered backdrop="static" keyboard={false}>
        <Modal.Header closeButton>
          <Modal.Title>CAISSE PHARMACIE</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {errorMessage && (
            <Alert
              variant="danger"
              onClose={() => setErrorMessage(null)}
              dismissible
            >
              {errorMessage}
            </Alert>
          )}

          {infoMessage && (
            <Alert
              variant="info"
              onClose={() => setInfoMessage(null)}
              dismissible
            >
              {infoMessage}
            </Alert>
          )}

          <Row>
            {/* Colonne de gauche : Informations patient */}
            <Col md={4}>
              <InfoPatient
                onPatientChange={handlePatientChange}
                onConsultationChange={handleConsultationChange}
                onPrescriptionChange={handlePrescriptionChangeUpdated}
                onCodePrestationChange={handleCodePrestationChange}
                onPatientPrescriptionsChange={handlePatientPrescriptionsChange}
                initialCodePrestation={codePrestation}
              />
            </Col>

            {/* Colonne de droite : Médicaments et paiement */}
            <Col md={8}>
              {/* Tableau des médicaments */}
              <Card className="shadow-sm">
                <Card.Header className="bg-light">
                  Médicaments Prescrits
                </Card.Header>
                <Card.Body>
                  <TableMedicaments
                    medicaments={medicaments}
                    onLignesChange={handleLignesChange}
                    tauxAssurance={consultation.tauxAssurance || 0}
                    onTotauxChange={handleTotauxChange}
                    remise={totaux.remise}
                    presetLines={presetLines}
                    externalResetKey={resetKey}
                  />
                </Card.Body>
              </Card>

              {/* Totaux et paiement */}
              <ModePaiement
                formData={formData}
                setFormData={handleFormDataChange}
                modePaiement={modePaiement}
                setModePaiement={setModePaiement}
                montantEncaisse={montantEncaisse}
                setMontantEncaisse={handleMontantEncaisseChange}
                totaux={totaux}
              />

              {/* Bouton de validation */}
              <ValidationPaiement onValidate={handleValiderPaiement} onHide={onHide} />
            </Col>
          </Row>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Annuler
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
