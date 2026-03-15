"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Modal, Button, Form, Alert, Spinner, Row, Col, Card } from 'react-bootstrap';
import { PrescriptionForm } from "@/types/Prescription";
import TableMedicamentsPharmAccueil, { ILigneMedicament, IMedicament } from "./TableMedicamentsPharmAccueil";
import ModePaiementPharmAccueil from "./ModePaiementPharmAccueil";
import InfoPatientPharmAccueil from "./InfoPatientPharmAccueil";
import ValidationPaiementPharmAccueil from "./ValidationPaiementPharmAccueil";

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
  Prenoms?:string;
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
  StatutPrescriptionMedecin?: number;
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
  IDSOCIETEASSURANCE?: string; // Ajout du champ IDSOCIETEASSURANCE
  IdPatient?: string; // Identifiant patient
  patientId?: string; // alias retourné par l'API
}

interface Prescription {
  _id?: string;
  BanqueC?: string;
  NumChèque?: string;
  Modepaiement?: string;
  Partassuré?: number;
  MotifRemise?: string; // Ajout du champ MotifRemise
  Payéoupas?: boolean;
  Payele?: string;
  Heure?: string;
  TotalapayerPatient?: number;
  Caissiere?: string;
  Montanttotal?: number;
  PartAssurance?: number;
  PartAssure?: number;
  Remise?: number;
  CodePrestation?: string;
}

interface TotauxPharmacie {
  montantTotal: number;
  partAssurance: number;
  partAssure: number;
  remise?: number; // Ajout du champ remise
}

type Props = {
  show: boolean;
  onHide: () => void;
  codePrestation?: string;
};

export default function PharmacieModalPharmAccueil({
  show,
  onHide,
  codePrestation: initialCodePrestation,
}: Props) {
  const [medicaments, setMedicaments] = useState<IMedicament[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [codePrestation, setCodePrestation] = useState<string>(
    initialCodePrestation || "",
  );
  const [patient, setPatient] = useState<Patient>({});
  const [consultation, setConsultation] = useState<Consultation>({});
  const [prescription, setPrescription] = useState<Prescription & { _id?: string; Rclinique?: string }>({});
  const [modeModification, setModeModification] = useState(false);
  const [prescriptionId, setPrescriptionId] = useState<string | undefined>(undefined);
  const [resetKey, setResetKey] = useState(0); // Clé pour réinitialiser TableMedicamentsPharmAccueil

  // États pour les médicaments et totaux
  const [lignesMedicaments, setLignesMedicaments] = useState<ILigneMedicament[]>([]);
  const [presetLines, setPresetLines] = useState<ILigneMedicament[] | undefined>(undefined);
  const [totaux, setTotaux] = useState<TotauxPharmacie>({
    montantTotal: 0,
    partAssurance: 0,
    partAssure: 0,
    remise: 0, // Ajout du champ remise avec valeur par défaut
  });

  // États pour la validation
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  // État pour le formulaire de paiement
  const [formData, setFormData] = useState<PrescriptionForm>({
    Montanttotal: 0,
    PartAssurance: 0,
    PartAssure: 0,
  });

const [currentUser, setCurrentUser] = useState<string | null>(null);

useEffect(() => {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem("nom_utilisateur");
    setCurrentUser(user);
    
  }
}, []);
  // PROCÉDURE Modifie_prescription() selon le pseudo-code
  const modifiePrescription = useCallback(async (gxMonidORDONNANCE?: string): Promise<any> => {
    // Récupérer le nom du médecin si IDMEDECIN existe
    let nomMed = "";
    if (consultation.IDMEDECIN) {
      try {
        const medecinRes = await fetch(`/api/medecins/${consultation.IDMEDECIN}`);
        if (medecinRes.ok) {
          const medecin = await medecinRes.json();
          nomMed = medecin.nom || "";
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du médecin:", error);
      }
    }

    const prescriptionData: any = {
      PatientP: patient.Nom +" "+ patient.Prenoms || "",
      IdPatient: consultation.IdPatient || consultation.patientId || patient._id || "",
      Numcarte: consultation.NumBon || "",
      NumBon: consultation.NumBon || "",
      Designation: "PHARMACIE",
      DatePres: formData.DatePres || new Date().toISOString().split('T')[0],
      SaisiPar: currentUser || "",
      Rclinique: formData.Rclinique || prescription.Rclinique || "",
      CodePrestation: codePrestation, // ✅ Déjà inclus - champ requis
      StatuPrescriptionMedecin: 2,
      IDpriseCharge: gxMonidORDONNANCE || "",
      IDMEDECIN: consultation.IDMEDECIN || "",
      StatutPaiement: "En cours de Paiement",
      NomMed: nomMed,
      
      // Champs supplémentaires pour la pharmacie (selon le modèle)
      Payéoupas: false,
      Payele: new Date().toISOString().split('T')[0],
      Heure: new Date().toTimeString().split(' ')[0],
      TotalapayerPatient: totaux.partAssure || 0,
      Caissiere: currentUser || "",
      
      // Champs additionnels pour complétude
      Montanttotal: totaux.montantTotal || 0,
      PartAssurance: totaux.partAssurance || 0,
      PartAssure: totaux.partAssure || 0,
      Remise: totaux.remise || 0,
      Modepaiement: prescription.Modepaiement || "",
    };

    // Ajouter les champs d'assurance si disponibles
    if (consultation.IDASSURANCE) {
      prescriptionData.IDASSURANCE = consultation.IDASSURANCE;
    }
    
    // Synchroniser les champs d'assurance et société avec la consultation
    if (consultation.assurance) {
      prescriptionData.Assurance = consultation.assurance;
    }
    
    if (consultation.IDSOCIETEASSURANCE) {
      prescriptionData.IDSOCIETEASSURANCE = consultation.IDSOCIETEASSURANCE;
    }
    
    if (consultation.SOCIETE_PATIENT) {
      prescriptionData.SOCIETE_PATIENT = consultation.SOCIETE_PATIENT;
    }

    return prescriptionData;
  }, [patient, consultation, formData, codePrestation, currentUser, prescription]);

  // Fonction de validation selon la logique WLangage
  const validerPaiement = useCallback(async (): Promise<ValidationResult> => {
    console.log("💰 Début de la procédure de validation WLangage");

    try {
      // 0. Vérifier que IdPatient existe
      if (!consultation.IdPatient && !consultation.patientId && !patient._id) {
        return {
          isValid: false,
          message: "Identifiant patient manquant. Veuillez recharger la consultation.",
          type: 'error'
        };
      }

      if (!codePrestation) {
        return {
          isValid: false,
          message: "Code prestation manquant",
          type: 'error'
        };
      }

      // Récupérer l'utilisateur actuel
      const gsUtilisateur = currentUser;
      const nMonid = prescriptionId || prescription._id || ""; // ID de la prescription

      // SI nMonid=0 ALORS // à la création
      if (!nMonid || nMonid === "") {
        console.log("📝 nMonid=0 - Création nouvelle prescription");

        // Modifie_prescription()
        const prescriptionData = await modifiePrescription();

        // HAjoute(PRESCRIPTION)
        const prescriptionResponse = await fetch('/api/prescription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(prescriptionData)
        });

        if (!prescriptionResponse.ok) {
          const errorData = await prescriptionResponse.json();
          throw new Error(errorData.error || 'Erreur lors de la création de la prescription');
        }

        const newPrescriptionResponse = await prescriptionResponse.json();
        const newPrescription = newPrescriptionResponse.data || newPrescriptionResponse;
        console.log("✅ Prescription créée:", newPrescription);

        // Continuer avec la nouvelle prescription
        await traiterLignesMedicaments(newPrescription._id || newPrescription.id, newPrescription._id || newPrescription.id);

      } else {
        // SINON
        console.log("📝 nMonid≠0 - Modification prescription existante");

        // HLitRecherche(PRESCRIPTION,IDPRESCRIPTION,nMonid)
        const prescriptionResponse = await fetch(`/api/prescription/${nMonid}`);

        if (prescriptionResponse.ok) {
          const existingPrescription = await prescriptionResponse.json();
          console.log("✅ Prescription trouvée:", existingPrescription);

          // SI HTrouve(PRESCRIPTION)=Vrai ALORS
          if (existingPrescription && existingPrescription._id) {
            // Modifie_prescription()	
            const updatedPrescriptionData = await modifiePrescription();

            // HModifie(PRESCRIPTION)
            const updateResponse = await fetch(`/api/prescription/${nMonid}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedPrescriptionData)
            });

            if (!updateResponse.ok) {
              const errorData = await updateResponse.json();
              throw new Error(errorData.error || 'Erreur lors de la mise à jour de la prescription');
            }

            const updatedPrescriptionResponse = await updateResponse.json();
            const updatedPrescription = updatedPrescriptionResponse.data || updatedPrescriptionResponse;
            console.log("✅ Prescription mise à jour:", updatedPrescription);

            // Continuer avec la prescription mise à jour
            await traiterLignesMedicaments(nMonid, nMonid);
          }
        } else {
          throw new Error('Prescription non trouvée');
        }
      }

      return {
        isValid: true,
        message: "Validation effectuée avec succès",
        type: 'info'
      };

    } catch (error: any) {
      console.error("❌ Erreur lors de la validation:", error);
      return {
        isValid: false,
        message: error.message || "Erreur lors de la validation",
        type: 'error'
      };
    }
  }, [currentUser, prescription, prescriptionId, formData, codePrestation, consultation, lignesMedicaments, modifiePrescription]);

  // Charger les médicaments au montage du modal
  useEffect(() => {
    if (show) {
      loadMedicaments();
    }
  }, [show]);

  // Fonction utilitaire pour normaliser les dates au format YYYY-MM-DD
const normalizeDate = (dateInput: any): string => {
  if (!dateInput) return new Date().toISOString().split('T')[0];
  
  if (typeof dateInput === 'string') {
    // Si c'est déjà au format YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      return dateInput;
    }
    // Si c'est une chaîne ISO avec T
    if (dateInput.includes('T')) {
      return dateInput.split('T')[0];
    }
    // Autre format de chaîne
    return new Date(dateInput).toISOString().split('T')[0];
  }
  
  if (dateInput instanceof Date) {
    return dateInput.toISOString().split('T')[0];
  }
  
  // Fallback
  return new Date(dateInput).toISOString().split('T')[0];
};

// Fonction utilitaire pour vérifier si un ID est généré (nouvelle ligne) ou existant (base de données)
const isGeneratedId = (id: string): boolean => {
  // Les IDs générés sont des chaînes alphanumériques courtes (9 caractères)
  // Les IDs MongoDB sont des hexadécimaux de 24 caractères
  return /^[a-z0-9]{9}$/.test(id);
};

// Fonction utilitaire pour générer un ID unique
  const generateLineId = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  // Fonction pour charger les patientprescription liées à la prescription
  const loadPatientPrescriptions = useCallback(async (codePrestation: string, prescriptionId?: string) => {
    try {
      // Charger les patientprescription par CodePrestation ou IDPRESCRIPTION
      let url = `/api/patientprescription?CodePrestation=${encodeURIComponent(codePrestation)}`;
      if (prescriptionId) {
        url += `&IDPRESCRIPTION=${encodeURIComponent(prescriptionId)}`;
      }

      console.log("📡 Chargement des patientprescription:", url);
      const response = await fetch(url);

      if (response.ok) {
        const patientPrescriptions = await response.json();
        console.log("✅ Patientprescription reçues:", patientPrescriptions);
        
        // Debug: afficher les dates reçues
        patientPrescriptions.forEach((pp: any, index: number) => {
          console.log(`📅 Ligne ${index + 1} - DatePres brute:`, pp.DatePres, "Type:", typeof pp.DatePres);
        });

        if (Array.isArray(patientPrescriptions) && patientPrescriptions.length > 0) {
          // Convertir les patientprescription en ILigneMedicament
          const lignesConverties: ILigneMedicament[] = patientPrescriptions.map((pp: any) => ({
            id: pp._id || generateLineId(),
            medicamentId: pp.medicament?.toString() || pp.IDMEDICAMENT || "",
            designation: pp.nomMedicament || "",
            quantite: Number(pp.QteP) || 1,
            prixUnitaire: Number(pp.prixUnitaire) || 0,
            total: Number(pp.prixTotal) || 0,
            refuse: pp.exclusionActe === "Refuser" || pp.ExclusionActae === "Refuser",
            partAssurance: Number(pp.partAssurance) || 0,
            partAssure: Number(pp.partAssure) || 0,
            DatePres: normalizeDate(pp.DatePres),
            reference: pp.reference || "",
            Exclus: pp.exclusionActe || pp.ExclusionActae || "NON",
            StatuPrescriptionMedecin: Number(pp.StatutPrescriptionMedecin) || 2,
            posologie: pp.posologie || "",
          }));

          // Debug: afficher les dates après conversion
          lignesConverties.forEach((ligne, index: number) => {
            console.log(`🔄 Ligne ${index + 1} convertie - DatePres:`, ligne.DatePres, "DATE:", ligne.DATE);
          });

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

  // Fonction pour charger la prescription existante (comme dans examenhospitalisation)
  const loadPrescription = useCallback(async (code: string) => {
    if (!code) {
      setModeModification(false);
      setPrescriptionId(undefined);
      setPrescription({});
      setPresetLines(undefined);
      return;
    }

    try {
      // Rechercher la prescription par CodePrestation
      const prescriptionRes = await fetch(`/api/prescription?CodePrestation=${encodeURIComponent(code)}`);

      if (prescriptionRes.ok) {
        const presData = await prescriptionRes.json();

        if (presData && presData._id) {
          // Prescription trouvée - Mode modification
          console.log("✅ Prescription trouvée - Mode MODIFICATION", presData._id);
          
          // Vérifier que la consultation est payée (StatutPrescriptionMedecin <3 et ticket_moderateur>0)
          if (presData.StatutPrescriptionMedecin < 3 && (presData.ticket_moderateur || 0) > 0) {
            console.error("❌ ATTENTION: La consultation n'est pas encore payée à la caisse");
            setErrorMessage("ATTENTION: La consultation n'est pas encore payée à la caisse");
            setModeModification(false);
            setPrescriptionId(undefined);
            setPrescription({});
            setPresetLines(undefined);
            return;
          }
          
          setModeModification(true);
          setPrescriptionId(presData._id);
          setPrescription(presData);

          // Charger les patientprescription liées à cette prescription
          await loadPatientPrescriptions(code, presData._id);
        } else {
          // Prescription non trouvée - Mode création
          console.log("ℹ️ Prescription non trouvée - Mode CRÉATION");
          setModeModification(false);
          setPrescriptionId(undefined);
          setPrescription({});
          setPresetLines(undefined);
        }
      } else {
        // Erreur ou non trouvé - Mode création
        setModeModification(false);
        setPrescriptionId(undefined);
        setPrescription({});
        setPresetLines(undefined);
      }
    } catch (error) {
      console.error("Erreur lors du chargement de la prescription:", error);
      setModeModification(false);
      setPrescriptionId(undefined);
      setPrescription({});
      setPresetLines(undefined);
    }
  }, [loadPatientPrescriptions]);

  // Initialiser le code prestation si fourni et charger la prescription
  useEffect(() => {
    if (show && initialCodePrestation) {
      setCodePrestation(initialCodePrestation);
      loadPrescription(initialCodePrestation);
    } else if (show && codePrestation) {
      loadPrescription(codePrestation);
    }
  }, [show, initialCodePrestation, loadPrescription]);

  // Mettre à jour le formulaire de paiement quand les totaux changent
  useEffect(() => {
    setFormData({
      Montanttotal: totaux.montantTotal,
      PartAssurance: totaux.partAssurance,
      PartAssure: totaux.partAssure,
    });
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


  const handleCodePrestationChange = useCallback((code: string) => {
    setCodePrestation(code);
    // Réinitialiser les lignes de médicaments quand le code change
    setLignesMedicaments([]);
    setPresetLines(undefined);
    setTotaux({
      montantTotal: 0,
      partAssurance: 0,
      partAssure: 0,
      remise: 0, // Ajout du champ remise
    });
    // Charger la prescription si elle existe
    if (code) {
      loadPrescription(code);
    } else {
      setModeModification(false);
      setPrescriptionId(undefined);
      setPrescription({});
      setResetKey(prev => prev + 1);
    }
  }, [loadPrescription]);

  const handlePatientChange = useCallback((patientData: Patient) => {
    setPatient(patientData);
  }, []);

  const handleConsultationChange = useCallback(
    (consultationData: Consultation) => {
      setConsultation(consultationData);
    },
    [],
  );

  const handlePrescriptionChange = useCallback(
    (prescriptionData: Prescription) => {
      setPrescription(prescriptionData);
    },
    [],
  );

  // Handler pour recevoir les médicaments prescrits depuis InfoPatientPharmAccueil
  const handleMedicamentsPrescritsChange = useCallback((medicamentsPrescrits: any[]) => {
    console.log("📋 Médicaments prescrits reçus:", medicamentsPrescrits);
    
    if (!Array.isArray(medicamentsPrescrits) || medicamentsPrescrits.length === 0) {
      console.log("ℹ️ Aucune patientprescription reçue - table vide");
      setPresetLines([]);
      setResetKey(prev => prev + 1);
      return;
    }

    // Ne plus filtrer les médicaments déjà payés - afficher tous les médicaments
    const prescriptionsFiltrees = medicamentsPrescrits;
    
    console.log(`✅ ${prescriptionsFiltrees.length} médicament(s) affiché(s) (incluant ceux déjà payés)`);

    // Convertir toutes les patientprescriptions en ILigneMedicament
    const lignesConverties: ILigneMedicament[] = prescriptionsFiltrees.map((pp: any) => ({
      id: pp._id || generateLineId(),
      medicamentId: pp.medicament?.toString() || pp.IDMEDICAMENT || "",
      designation: pp.nomMedicament || "",
      quantite: Number(pp.QteP) || 1, // Corrigé: QteP selon le modèle
      prixUnitaire: Number(pp.prixUnitaire) || 0, // Corrigé: prixUnitaire selon le modèle
      total: Number(pp.prixTotal) || 0, // Corrigé: prixTotal selon le modèle
      refuse: pp.exclusionActe === "Refuser", // Corrigé: exclusionActe selon le modèle
      partAssurance: Number(pp.partAssurance) || 0, // Corrigé: partAssurance selon le modèle
      partAssure: Number(pp.partAssure) || 0, // Corrigé: partAssure selon le modèle
      DatePres: normalizeDate(pp.DatePres),
      reference: pp.reference || "", // Corrigé: reference selon le modèle
      Exclus: pp.exclusionActe || "NON", // Corrigé: exclusionActe selon le modèle
      StatuPrescriptionMedecin: Number(pp.StatutPrescriptionMedecin) || 2, // Corrigé: StatutPrescriptionMedecin selon le modèle
      posologie: pp.posologie || "", // Corrigé: posologie selon le modèle
    }));

    console.log("📋 Lignes converties depuis InfoPatient:", lignesConverties);
    setPresetLines(lignesConverties);
    setResetKey(prev => prev + 1);
  }, []);

  const handleTotauxChange = useCallback((newTotaux: {
    montantTotal: number;
    partAssurance: number;
    partAssure: number;
  }) => {
    setTotaux(prev => ({
      ...prev,
      montantTotal: newTotaux.montantTotal,
      partAssurance: newTotaux.partAssurance,
      partAssure: newTotaux.partAssure
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
    }
  }, []);

  const handlePaiementValide = useCallback(async () => {
    // Utiliser la fonction de validation principale
    const validation = await validerPaiement();

    if (!validation.isValid) {
      setErrorMessage(validation.message);
      return;
    }

    // Si validation réussie, afficher le message de succès
    console.log("✅ Validation WLangage:", validation.message);
    setErrorMessage(null);
    alert(validation.message || "Prescription enregistrée avec succès");
  }, [validerPaiement]);

  // PROCÉDURE Modifie_Ligne_medicament() selon le pseudo-code
  const modifieLigneMedicament = useCallback((ligne: ILigneMedicament, prescriptionId: string, gxMonidORDONNANCE?: string): any => {
    // S'assurer que tous les champs requis ont des valeurs valides
    const datePres = ligne.DatePres || ligne.DATE || new Date().toISOString().split('T')[0];

    const ligneData: any = {
      // Champs requis
      IDPRESCRIPTION: prescriptionId || "",
      PatientP: patient.Nom +" "+ patient.Prenoms || "", // Champ requis
      IdPatient: consultation.IdPatient || consultation.patientId || patient._id || "", // Identifiant patient
      QteP: Number(ligne.quantite) || 1, // Champ requis, s'assurer que c'est un nombre
      posologie: ligne.posologie || "", // Champ requis
      DatePres: datePres, // Champ requis - sera converti en Date par MongoDB
      prixUnitaire: Number(ligne.prixUnitaire) || 0, // Champ requis
      prixTotal: Number(ligne.total) || 0, // Champ requis
      nomMedicament: ligne.designation || "", // Champ requis
      partAssurance: Number(ligne.partAssurance) || 0, // Champ requis
      partAssure: Number(ligne.partAssure) || 0, // Champ requis
      CodePrestation: codePrestation || "", // Champ requis

      // Champs optionnels
      reference: ligne.reference || "",
      IDPARTIENT: patient._id || "",
      exclusionActe: ligne.Exclus || "NON",
      StatutPrescriptionMedecin: Number(ligne.StatuPrescriptionMedecin) || 2,

      //info assurance et medecin
      
    };

    // priseCharge doit être un Number, pas un string (ID)
    // gxMonidORDONNANCE est un ID (string), donc on ne l'utilise pas pour priseCharge
    // priseCharge est un montant numérique, pas un identifiant
    // On ne l'inclut pas si ce n'est pas un nombre valide

    // Gérer le champ medicament (ObjectId) - ne l'inclure que s'il est valide
    if (ligne.medicamentId && ligne.medicamentId.trim() !== "" && ligne.medicamentId !== "undefined") {
      ligneData.medicament = ligne.medicamentId;
    }

    return ligneData;
  }, [patient, codePrestation, consultation]);

  // PROCÉDURE pour traiter les lignes de médicaments
  const traiterLignesMedicaments = useCallback(async (prescriptionId: string, gxMonidORDONNANCE?: string) => {
    console.log("💊 Début traitement des lignes médicaments");

    try {
      // on ajoute ou on modifie les détails médicaments*********************
      // POUR TOUTE LIGNE DE TABLE_PARTIENT_PRESCRIPTION
      for (const ligne of lignesMedicaments) {
        if (!ligne.medicamentId) continue;

        // Vérifier si c'est une nouvelle ligne (ID généré) ou une ligne existante
        const isNewLine = isGeneratedId(ligne.id);
        console.log(`🔍 Ligne ${ligne.id} - Nouvelle ligne: ${isNewLine}`);

        if (isNewLine) {
          // NOUVELLE LIGNE : Création directe sans recherche
          console.log("📝 Nouvelle ligne détectée, création avec ID:", ligne.id);

          // Modifie_Ligne_medicament()	
          const newLigneData = modifieLigneMedicament(ligne, prescriptionId, gxMonidORDONNANCE);

          // PARTIENT_PRESCRIPTION.ACTEPAYECAISSE="En cours"
          newLigneData.actePayeCaisse = "En cours"; // ACTEPAYECAISSE -> actePayeCaisse

          // Validation des champs requis avant l'envoi
          if (!newLigneData.IDPRESCRIPTION || !newLigneData.PatientP || !newLigneData.CodePrestation) {
            console.error("❌ Champs requis manquants:", {
              IDPRESCRIPTION: newLigneData.IDPRESCRIPTION,
              PatientP: newLigneData.PatientP,
              CodePrestation: newLigneData.CodePrestation
            });
            throw new Error('Champs requis manquants pour la création de la ligne médicament');
          }

          console.log("📤 Données à envoyer (POST):", newLigneData);

          // HAjoute(PARTIENT_PRESCRIPTION)
          const createResponse = await fetch('/api/patientprescription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newLigneData)
          });

          if (!createResponse.ok) {
            const errorData = await createResponse.json();
            console.error("❌ Erreur API (POST):", errorData);
            throw new Error(errorData.error || errorData.details || 'Erreur lors de la création de la ligne médicament');
          }

          console.log("✅ Nouvelle ligne médicament créée");

        } else {
          // LIGNE EXISTANTE : Recherche puis modification
          console.log(`🔍 Recherche de ligne existante avec _id: ${ligne.id}`);
          const ligneResponse = await fetch(`/api/patientprescription?_id=${encodeURIComponent(ligne.id)}`);

          if (ligneResponse.ok) {
            const existingLignes = await ligneResponse.json();
            const existingLigne = Array.isArray(existingLignes) && existingLignes.length > 0 ? existingLignes[0] : null;

            console.log(`📋 Résultat recherche - Ligne existante:`, existingLigne);

            // SI HTrouve(PARTIENT_PRESCRIPTION)=Vrai ALORS
            if (existingLigne && existingLigne._id) {
              console.log("📝 Ligne existante trouvée, modification:", existingLigne);

              // Modifie_Ligne_medicament()		
              const updatedLigneData = modifieLigneMedicament(ligne, prescriptionId, gxMonidORDONNANCE);

              // HModifie(PARTIENT_PRESCRIPTION)
              console.log(`🔄 Mise à jour de la ligne avec URL: /api/patientprescription/${existingLigne._id}`);
              const updateResponse = await fetch(`/api/patientprescription/${existingLigne._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedLigneData)
              });

              if (!updateResponse.ok) {
                const errorData = await updateResponse.json();
                throw new Error(errorData.error || 'Erreur lors de la mise à jour de la ligne médicament');
              }

              console.log("✅ Ligne médicament mise à jour");

            } else {
              // Ligne avec ID existant non trouvée (cohérence de données)
              console.log("⚠️ Ligne avec ID existant non trouvée en base, création avec NOUVEL ID");
              
              // Créer la ligne avec un NOUVEL ID généré
              const newLigneData = modifieLigneMedicament(ligne, prescriptionId, gxMonidORDONNANCE);
              newLigneData.actePayeCaisse = "En cours";

              const createResponse = await fetch('/api/patientprescription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newLigneData)
              });

              if (!createResponse.ok) {
                const errorData = await createResponse.json();
                throw new Error(errorData.error || 'Erreur lors de la création de la ligne médicament');
              }

              console.log("✅ Ligne recréée avec NOUVEL ID et succès");
            }
          } else {
            throw new Error('Erreur lors de la recherche de ligne existante');
          }
        }
      }

      console.log("🎉 Procédure WLangage terminée avec succès!");

    } catch (error: any) {
      console.error("❌ Erreur lors de la procédure WLangage:", error);
      throw error;
    }
  }, [lignesMedicaments, modifieLigneMedicament]);

  const handleValiderPaiement = useCallback(async () => {
    if (!codePrestation) {
      setErrorMessage("Veuillez d'abord saisir un N° de prestation");
      return;
    }

    // Utiliser la fonction de validation
    const validation = await validerPaiement();

    if (!validation.isValid) {
      if (validation.type === 'error') {
        setErrorMessage(validation.message);
      } else if (validation.type === 'warning') {
        setErrorMessage(validation.message);
      }
      return;
    }

    // Si validation réussie, afficher le message de succès et continuer
    console.log("✅ Validation WLangage:", validation.message);

    // Effacer le message d'erreur
    setErrorMessage(null);
  }, [codePrestation, validerPaiement]);

  const handleHide = useCallback(() => {
    // Réinitialiser les états à la fermeture
    setCodePrestation("");
    setPatient({});
    setConsultation({});
    setPrescription({});
    setLignesMedicaments([]);
    setTotaux({
      montantTotal: 0,
      partAssurance: 0,
      partAssure: 0,
      remise: 0, // Ajout du champ remise
    });
    setErrorMessage(null);
    onHide();
  }, [onHide]);

  return (
    <>
      <Modal show={show} onHide={handleHide} size="xl" centered backdrop="static" keyboard={false}>
        <Modal.Header closeButton>
          <Modal.Title>FICHE PHARMACIE</Modal.Title>
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

          <Row>
            {/* Colonne de gauche : Informations patient */}
            <Col md={4}>
              <InfoPatientPharmAccueil
                onPatientChange={handlePatientChange}
                onConsultationChange={handleConsultationChange}
                onPrescriptionChange={handlePrescriptionChange}
                onMedicamentsPrescritsChange={handleMedicamentsPrescritsChange}
                onCodePrestationChange={handleCodePrestationChange}
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
                  <TableMedicamentsPharmAccueil
                    medicaments={medicaments}
                    onLignesChange={handleLignesChange}
                    tauxAssurance={consultation.tauxAssurance || 0}
                    onTotauxChange={handleTotauxChange}
                    presetLines={presetLines}
                    externalResetKey={resetKey}
                  />
                </Card.Body>
              </Card>

              {/* Totaux et paiement */}
              <ModePaiementPharmAccueil
                formData={formData}
                setFormData={handleFormDataChange}
                totaux={totaux}
              />

              {/* Bouton de validation */}
              <ValidationPaiementPharmAccueil onValidate={handleValiderPaiement} onHide={onHide} />
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
