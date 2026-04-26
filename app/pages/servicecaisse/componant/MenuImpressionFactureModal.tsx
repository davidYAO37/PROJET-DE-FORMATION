"use client";

import React, { useState, useRef, useEffect } from "react";
import { Modal, Form } from "react-bootstrap";
import {
  createPrintWindow,
  generatePrintHeader,
  generatePrintFooter,
} from "@/utils/printRecu";
import styles from "./MenuImpressionFactureModal.module.css";
import PrintFactureCosultatAssurance from "../../MesImpressions/FactureActePrint/printFactureCosultatAssurance";
import PrintFactureConsultationPatient from "../../MesImpressions/FactureActePrint/printFactureConsultationPatient";
import PrintFactureExamenAssurance from "../../MesImpressions/FactureActePrint/printFactureExamenAssurance";
import PrintFactureDetailleAssurance from "../../MesImpressions/FactureActePrint/printFactureDetailleAssurance";
import PrintFactureDetaillePatient from "../../MesImpressions/FactureActePrint/printFactureDetaillePatient";
import PrintFactureExamenPatient from "../../MesImpressions/FactureActePrint/printFactureExamenPatient";
import PrintFacturePharmacieAssurance from "../../MesImpressions/FactureActePrint/printFacturePharmacieAssurance";
import PrintFacturePharmaciePatient from "../../MesImpressions/FactureActePrint/printFacturePharmaciePatient";
import PrintFactureRecapAssurance from "../../MesImpressions/FactureActePrint/printFactureRecapAssurance";
import PrintFactureRecapPatient from "../../MesImpressions/FactureActePrint/printFactureRecapPatient";

interface MenuImpressionFactureModalProps {
  show: boolean;
  onHide: () => void;
}

const MenuImpressionFactureModal: React.FC<MenuImpressionFactureModalProps> = ({
  show,
  onHide,
}) => {
  const [codeVisiteur, setCodeVisiteur] = useState("");
  const [consultationData, setConsultationData] = useState<any>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showPrintAssuranceModal, setShowPrintAssuranceModal] = useState(false);
  const [showPrintPatientModal, setShowPrintPatientModal] = useState(false);
  const [showPrintExamenAssuranceModal, setShowPrintExamenAssuranceModal] = useState(false);
  const [showPrintExamenPatientModal, setShowPrintExamenPatientModal] = useState(false);
  const [showPrintDetailleAssuranceModal, setShowPrintDetailleAssuranceModal] = useState(false);
  const [showPrintDetaillePatientModal, setShowPrintDetaillePatientModal] = useState(false);
  const [showPrintPharmacieAssuranceModal, setShowPrintPharmacieAssuranceModal] = useState(false);
  const [showPrintPharmaciePatientModal, setShowPrintPharmaciePatientModal] = useState(false);
  const [showPrintRecapAssuranceModal, setShowPrintRecapAssuranceModal] = useState(false);
  const [showPrintRecapPatientModal, setShowPrintRecapPatientModal] = useState(false);
  
  const [consultationAssuranceData, setConsultationAssuranceData] =
    useState<any>(null);
  const [consultationPatientData, setConsultationPatientData] =
    useState<any>(null);
  const [consultationExamenData, setConsultationExamenData] =
    useState<any>(null);
  const [consultationDetailleAssuranceData, setConsultationDetailleAssuranceData] =
    useState<any>(null);
  const [consultationDetaillePatientData, setConsultationDetaillePatientData] =
    useState<any>(null);
  const [consultationExamenPatientData, setConsultationExamenPatientData] =
    useState<any>(null);
  const [consultationPharmacieAssuranceData, setConsultationPharmacieAssuranceData] =
    useState<any>(null);
  const [consultationPharmaciePatientData, setConsultationPharmaciePatientData] =
    useState<any>(null);
  const [consultationRecapAssuranceData, setConsultationRecapAssuranceData] =
    useState<any>(null);
  const [consultationRecapPatientData, setConsultationRecapPatientData] =
    useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [hasFacturesNonSoldees, setHasFacturesNonSoldees] = useState<
    boolean | null
  >(null);
  const [showButtons, setShowButtons] = useState(false);
  const [searchError, setSearchError] = useState("");
  const printRef = useRef<HTMLDivElement>(null);
  const printAssuranceRef = useRef<HTMLDivElement>(null);
  const printPatientRef = useRef<HTMLDivElement>(null);
  const printExamenRef = useRef<HTMLDivElement>(null);
  const printDetailleAssuranceRef = useRef<HTMLDivElement>(null);
  const printDetaillePatientRef = useRef<HTMLDivElement>(null);
  const printExamenPatientRef = useRef<HTMLDivElement>(null);
  const printPharmacieAssuranceRef = useRef<HTMLDivElement>(null);
  const printPharmaciePatientRef = useRef<HTMLDivElement>(null);
  const printRecapAssuranceRef = useRef<HTMLDivElement>(null);
  const printRecapPatientRef = useRef<HTMLDivElement>(null);

  // Réinitialiser à la réouverture du modal
  useEffect(() => {
    if (show) {
      setCodeVisiteur("");
      setShowButtons(false);
      setHasFacturesNonSoldees(null);
      setSearchError("");
    }
  }, [show]);

  // Masquer les boutons à chaque changement de code visiteur
  useEffect(() => {
    if (codeVisiteur) {
      setShowButtons(false);
      setHasFacturesNonSoldees(null);
      setSearchError("");
    }
  }, [codeVisiteur]);

 
  const printFactureCosultatAssurance = async () => {
    setIsLoading(true);
    setLoadingMessage("Chargement des données de consultation...");

    try {
      await new Promise((resolve) => setTimeout(resolve, 10));

      const response = await fetch(
        `/api/EtatFactureCaisse/DetatilFactureConsultation?ParamCode_consultation=${codeVisiteur}`,
      );

      const consultationData = await response.json();

      setTimeout(() => {
        setConsultationAssuranceData(consultationData);
        setShowPrintAssuranceModal(true);
        setIsLoading(false);
        setLoadingMessage("");
      }, 50);
    } catch (error) {
      console.error("Erreur:", error);
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const printFactureConsultationPatient = async () => {
    setIsLoading(true);
    setLoadingMessage("Chargement des données de consultation...");

    try {
      await new Promise((resolve) => setTimeout(resolve, 10));

      const response = await fetch(
        `/api/EtatFactureCaisse/DetatilFactureConsultation?ParamCode_consultation=${codeVisiteur}`,
      );

      const consultationData = await response.json();

      setTimeout(() => {
        setConsultationPatientData(consultationData);
        setShowPrintPatientModal(true);
        setIsLoading(false);
        setLoadingMessage("");
      }, 50);
    } catch (error) {
      console.error("Erreur:", error);
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const printFactureExamenAssurance = async () => {
    setIsLoading(true);
    setLoadingMessage("Chargement des données d'examen...");

    try {
      await new Promise((resolve) => setTimeout(resolve, 10));

      const response = await fetch(
        `/api/EtatFactureCaisse/DetailFactureExamenActe?ParamCODEcONSULTATION=${encodeURIComponent(codeVisiteur)}`,
      );

      const consultationData = await response.json();

      setTimeout(() => {
        setConsultationExamenData(consultationData);
        setShowPrintExamenAssuranceModal(true);
        setIsLoading(false);
        setLoadingMessage("");
      }, 50);
    } catch (error) {
      console.error("Erreur:", error);
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const printFactureDetailleAssurance = async () => {
    setIsLoading(true);
    setLoadingMessage("Chargement des données détaillées...");

    try {
      await new Promise((resolve) => setTimeout(resolve, 10));

      const response = await fetch(
        `/api/EtatFactureCaisse/FactureDetailleActe?ParamCode_consultation=${encodeURIComponent(codeVisiteur)}`,
      );

      const consultationData = await response.json();

      setTimeout(() => {
        setConsultationDetailleAssuranceData(consultationData);
        setShowPrintDetailleAssuranceModal(true);
        setIsLoading(false);
        setLoadingMessage("");
      }, 50);
    } catch (error) {
      console.error("Erreur:", error);
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const handlePrintDetaillePatient = async () => {
    setIsLoading(true);
    setLoadingMessage("Chargement des données détaillées...");

    try {
      await new Promise((resolve) => setTimeout(resolve, 10));

      const response = await fetch(
        `/api/EtatFactureCaisse/FactureDetailleActe?ParamCode_consultation=${codeVisiteur}`,
      );

      const consultationData = await response.json();

      setTimeout(() => {
        setConsultationDetaillePatientData(consultationData);
        setShowPrintDetaillePatientModal(true);
        setIsLoading(false);
        setLoadingMessage("");
      }, 50);
    } catch (error) {
      console.error("Erreur:", error);
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const printFactureExamenPatient = async () => {
    setIsLoading(true);
    setLoadingMessage("Chargement des données d'examen...");

    try {
      await new Promise((resolve) => setTimeout(resolve, 10));

       const response = await fetch(
        `/api/EtatFactureCaisse/DetailFactureExamenActe?ParamCODEcONSULTATION=${encodeURIComponent(codeVisiteur)}`,
      );

      const consultationData = await response.json();

      setTimeout(() => {
        setConsultationExamenData(consultationData);
        setShowPrintExamenPatientModal(true);
        setIsLoading(false);
        setLoadingMessage("");
      }, 50);
    } catch (error) {
      console.error("Erreur:", error);
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const printFacturePharmacieAssurance = async () => {
    setIsLoading(true);
    setLoadingMessage("Chargement des données de pharmacie...");

    try {
      await new Promise((resolve) => setTimeout(resolve, 10));

      const response = await fetch(
        `/api/EtatFactureCaisse/DetailFacturePharmacie?ParamCODEcONSULTATION=${encodeURIComponent(codeVisiteur)}`,
      );

      const consultationData = await response.json();

      setTimeout(() => {
        setConsultationPharmacieAssuranceData(consultationData);
        setShowPrintPharmacieAssuranceModal(true);
        setIsLoading(false);
        setLoadingMessage("");
      }, 50);
    } catch (error) {
      console.error("Erreur:", error);
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const printFacturePharmaciePatient = async () => {
    setIsLoading(true);
    setLoadingMessage("Chargement des données de pharmacie...");

    try {
      await new Promise((resolve) => setTimeout(resolve, 10));

      const response = await fetch(
        `/api/EtatFactureCaisse/DetailFacturePharmacie?ParamCODEcONSULTATION=${encodeURIComponent(codeVisiteur)}`,
      );

      const consultationData = await response.json();

      setTimeout(() => {
        setConsultationPharmaciePatientData(consultationData);
        setShowPrintPharmaciePatientModal(true);
        setIsLoading(false);
        setLoadingMessage("");
      }, 50);
    } catch (error) {
      console.error("Erreur:", error);
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const printFactureRecapAssurance = async () => {
    setIsLoading(true);
    setLoadingMessage("Chargement des données récapitulatives...");

    try {
      await new Promise((resolve) => setTimeout(resolve, 10));

      const response = await fetch(
        `/api/EtatFactureCaisse/FactureRecap?ParamCode_consultation=${codeVisiteur}`,
      );

      const consultationData = await response.json();

      setTimeout(() => {
        setConsultationRecapAssuranceData(consultationData);
        setShowPrintRecapAssuranceModal(true);
        setIsLoading(false);
        setLoadingMessage("");
      }, 50);
    } catch (error) {
      console.error("Erreur:", error);
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const printFactureRecapPatient = async () => {
    setIsLoading(true);
    setLoadingMessage("Chargement des données récapitulatives...");

    try {
      await new Promise((resolve) => setTimeout(resolve, 10));

      const response = await fetch(
        `/api/EtatFactureCaisse/FactureRecap?ParamCode_consultation=${codeVisiteur}`,
      );

      const consultationData = await response.json();

      setTimeout(() => {
        setConsultationRecapPatientData(consultationData);
        setShowPrintRecapPatientModal(true);
        setIsLoading(false);
        setLoadingMessage("");
      }, 50);
    } catch (error) {
      console.error("Erreur:", error);
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const extraireListeFacturesApi = (data: unknown): any[] => {
    if (Array.isArray(data)) return data;
    if (
      data &&
      typeof data === "object" &&
      Array.isArray((data as { data?: unknown }).data)
    ) {
      return (data as { data: any[] }).data;
    }
    return [];
  };

  const fetchOptsNoCache: RequestInit = {
    cache: "no-store",
    headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
  };

  const verifierExistenceCodeVisiteur = async (codeVisiteur: string) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 10));
      
      // Vérifier d'abord si le code visiteur existe dans les consultations
      const response = await fetch(
        `/api/EtatFactureCaisse/DetatilFactureConsultation?ParamCode_consultation=${encodeURIComponent(codeVisiteur)}`,
        { cache: 'no-store' }
      );
      
      if (response.ok) {
        const consultationData = await response.json();
        if (consultationData && !consultationData.error) {
          return { existe: true, consultation: consultationData };
        }
      }
      
      return { existe: false, consultation: null };
    } catch (error) {
      console.error("Erreur lors de la vérification du code visiteur:", error);
      return { existe: false, consultation: null };
    }
  };

  const handleSearch = async () => {
    if (!codeVisiteur || codeVisiteur.trim() === "") {
      alert("Veuillez saisir le code visiteur pour rechercher");
      return;
    }

    setIsSearching(true);
    setSearchError("");
    setHasFacturesNonSoldees(null);

    try {
      // Étape 1: Vérifier l'existence du code visiteur
      const verificationResult = await verifierExistenceCodeVisiteur(codeVisiteur);
      
      if (!verificationResult.existe) {
        setSearchError("Mauvais code ou Code inexistant");
        setIsSearching(false);
        return;
      }

      // Étape 2: Si le code existe, vérifier les factures à solder
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Récupérer toutes les factures non soldées (comme dans FacturesNonSoldesModal)
      const response = await fetch("/api/facturesnonsoldees", fetchOptsNoCache);
      
      if (!response.ok) {
        setSearchError("Erreur lors de la vérification des factures");
        return;
      }

      const data = await response.json();
      const facturesBrutes = extraireListeFacturesApi(data);

      // Appliquer la logique exacte de FacturesNonSoldesModal
      const facturesFiltrees = await Promise.all(
        facturesBrutes.map(async (facture) => {
          // Si le reste à payer est <= 0, on n'affiche pas
          if (facture.montantRestant <= 0) {
            return null;
          }

          const idBrut = facture.id != null ? String(facture.id).trim() : "";
          if (!idBrut) {
            return facture;
          }

          const idEnc = encodeURIComponent(idBrut);
          let encaissements: Response;
          if (facture.type === "consultation") {
            encaissements = await fetch(
              `/api/encaissementcaisse?idConsultation=${idEnc}`,
              fetchOptsNoCache,
            );
          } else {
            encaissements = await fetch(
              `/api/encaissementcaisse?idFacturation=${idEnc}`,
              fetchOptsNoCache,
            );
          }

          if (encaissements.ok) {
            const encaissementsData = await encaissements.json();
            const sommeEncaissements =
              encaissementsData.data?.reduce(
                (sum: number, enc: any) => sum + (enc.Montantencaisse || 0),
                0,
              ) || 0;

            // Calculer le reste réel à payer
            const resteReel = facture.montantRestant - sommeEncaissements;

            // Si le reste à payer - la somme des encaissements = 0, on n'affiche pas
            if (resteReel <= 0) {
              return null;
            }

            // Sinon on affiche avec le reste réel
            return {
              ...facture,
              montantRestant: resteReel,
            };
          } else {
            // Si pas trouvé dans encaissements, on affiche directement
            return facture;
          }
        }),
      );

      // Filtrer les null
      const facturesValidées = facturesFiltrees.filter(
        (f): f is NonNullable<typeof f> => f !== null,
      );

      // Filtrer pour le code visiteur spécifique
      const facturesVisiteur = facturesValidées.filter(
        (facture: any) => facture.code === codeVisiteur.trim(),
      );

      setTimeout(() => {
        if (facturesVisiteur.length > 0) {
          setSearchError("Ce code visiteur a des factures à solder. Veuillez régler d'abord.");
          setHasFacturesNonSoldees(true);
          setShowButtons(false);
        } else {
          setSearchError("");
          setHasFacturesNonSoldees(false);
          setShowButtons(true);
        }
        setIsSearching(false);
      }, 50);
    } catch (error) {
      console.error("Erreur lors de la recherche:", error);
      setSearchError("Erreur de connexion");
      setIsSearching(false);
    }
  };

  const handlePrint = (type: string, by: string) => {
    setTimeout(() => {
      if (type === "recap" && by === "assurance") {
        printFactureRecapAssurance();
      } else if (type === "recap" && by === "patient") {
        printFactureRecapPatient();
      } else if (type === "consultation" && by === "assurance") {
        printFactureCosultatAssurance();
      } else if (type === "consultation" && by === "patient") {
        printFactureConsultationPatient();
      } else if (type === "Detaille" && by === "assurance") {
        printFactureDetailleAssurance();
      } else if (type === "Detaille" && by === "patient") {
        handlePrintDetaillePatient();
      } else if (type === "examen" && by === "assurance") {
        printFactureExamenAssurance();
      } else if (type === "examen" && by === "patient") {
        printFactureExamenPatient();
      } else if (type === "pharmacie" && by === "assurance") {
        printFacturePharmacieAssurance();
      } else if (type === "pharmacie" && by === "patient") {
        printFacturePharmaciePatient();
      } else {
        console.log(`Printing ${type} by ${by}`);
        return;
      }
    }, 0);
  };

  return (
    <>
      <Modal
        show={show}
        onHide={onHide}
        size="lg"
        centered
        className={styles.professionalModal}
      >
        <Modal.Header closeButton className={styles.modalHeader}>
          <div className={styles.headerContent}>
            <i
              className="bi bi-printer-fill"
              style={{ fontSize: "1.75rem", marginRight: "12px" }}
            ></i>
            <Modal.Title className={styles.modalTitle}>
              Menu Impression Facture
            </Modal.Title>
          </div>
        </Modal.Header>
        <Modal.Body className={styles.modalBody}>
          <div className="mb-4">
            <label className={`form-label ${styles.formLabel}`}>
              <i className="bi bi-person-badge me-2"></i>
              Code Visiteur
            </label>
            <div className="input-group">
              <Form.Control
                type="text"
                placeholder="Entrez le code visiteur..."
                value={codeVisiteur}
                onChange={(e) => setCodeVisiteur(e.target.value)}
                className={`${styles.formControl}`}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
              />
              <button
                className="btn btn-primary"
                type="button"
                onClick={handleSearch}
                disabled={isSearching}
              >
                {isSearching ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Recherche...
                  </>
                ) : (
                  <>
                    <i className="bi bi-search me-2"></i>
                    Rechercher
                  </>
                )}
              </button>
            </div>
          </div>

          {searchError && (
            <div className="alert alert-danger mb-3">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {searchError}
            </div>
          )}

          {hasFacturesNonSoldees === true && (
            <div className="alert alert-warning mb-3">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              Veuillez vérifier la liste des factures à solder avant cette
              opération
            </div>
          )}

          {hasFacturesNonSoldees === false && (
            <div className="alert alert-success mb-3">
              <i className="bi bi-check-circle-fill me-2"></i>
              Aucune facture à solder trouvée pour ce code visiteur
            </div>
          )}

          <div className={styles.separator}></div>

          {showButtons && (
            <div className={styles.menuContainer}>
              {/* Facture Détaillée */}
              <div className={styles.menuSection}>
                <div className="btn-group dropend w-100" role="group">
                  <button
                    type="button"
                    className={`btn btn-outline-primary ${styles.menuButton}`}
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i className="bi bi-pencil-square me-2"></i>
                    Éditer la Facture Détaillée
                  </button>
                   <ul className={`dropdown-menu ${styles.dropdownMenu}`}>
                    <li>
                      <a
                        className={`dropdown-item ${styles.dropdownItem}`}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePrint("Detaille", "patient");
                        }}
                      >
                        <i className="bi bi-person-circle"></i>
                        <span>Par patient</span>
                      </a>
                    </li>
                    <li>
                      <a
                        className={`dropdown-item ${styles.dropdownItem}`}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePrint("Detaille", "assurance");
                        }}
                      >
                        <i className="bi bi-shield-check"></i>
                        <span>Par Assurance</span>
                      </a>
                    </li>
                  </ul>
                </div>
              </div>

                {/* Facture Recap */}
              <div className={styles.menuSection}>
                <div className="btn-group dropend w-100" role="group">
                  <button
                    type="button"
                    className={`btn btn-outline-primary ${styles.menuButton}`}
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i className="bi bi-file-earmark-pdf me-2"></i>
                    Facture Recap
                  </button>
                  <ul className={`dropdown-menu ${styles.dropdownMenu}`}>
                    <li>
                      <a
                        className={`dropdown-item ${styles.dropdownItem}`}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePrint("recap", "patient");
                        }}
                      >
                        <i className="bi bi-person-circle"></i>
                        <span>Par patient</span>
                      </a>
                    </li>
                    <li>
                      <a
                        className={`dropdown-item ${styles.dropdownItem}`}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePrint("recap", "assurance");
                        }}
                      >
                        <i className="bi bi-shield-check"></i>
                        <span>Par Assurance</span>
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
              {/* Détail Consultation */}
              <div className={styles.menuSection}>
                <div className="btn-group dropend w-100" role="group">
                  <button
                    type="button"
                    className={`btn btn-outline-primary ${styles.menuButton}`}
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i className="bi bi-receipt me-2"></i>
                    Détail Consultation
                  </button>
                  <ul className={`dropdown-menu ${styles.dropdownMenu}`}>
                    <li>
                      <a
                        className={`dropdown-item ${styles.dropdownItem}`}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePrint("consultation", "patient");
                        }}
                      >
                        <i className="bi bi-person-circle"></i>
                        <span>Par patient</span>
                      </a>
                    </li>
                    <li>
                      <a
                        className={`dropdown-item ${styles.dropdownItem}`}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePrint("consultation", "assurance");
                        }}
                      >
                        <i className="bi bi-shield-check"></i>
                        <span>Par Assurance</span>
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
              {/*  Détail Examens-Autres actes */}
              <div className={styles.menuSection}>
                <div className="btn-group dropend w-100" role="group">
                  <button
                    type="button"
                    className={`btn btn-outline-primary ${styles.menuButton}`}
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i className="bi bi-receipt me-2"></i>
                    Détail Examens-Autres actes
                  </button>

                  <ul className={`dropdown-menu ${styles.dropdownMenu}`}>
                    <li>
                      <a
                        className={`dropdown-item ${styles.dropdownItem}`}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePrint("examen", "patient");
                        }}
                      >
                        <i className="bi bi-person-circle"></i>
                        <span>Par patient</span>
                      </a>
                    </li>
                    <li>
                      <a
                        className={`dropdown-item ${styles.dropdownItem}`}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePrint("examen", "assurance");
                        }}
                      >
                        <i className="bi bi-shield-check"></i>
                        <span>Par Assurance</span>
                      </a>
                    </li>
                  </ul>
                </div>
              </div>

              {/*  Détail Pharmacie */}
              <div className={styles.menuSection}>
                <div className="btn-group dropend w-100" role="group">
                  <button
                    type="button"
                    className={`btn btn-outline-primary ${styles.menuButton}`}
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i className="bi bi-receipt me-2"></i>
                    Détail Pharmacie
                  </button>

                  <ul className={`dropdown-menu ${styles.dropdownMenu}`}>
                    <li>
                      <a
                        className={`dropdown-item ${styles.dropdownItem}`}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePrint("pharmacie", "patient");
                        }}
                      >
                        <i className="bi bi-person-circle"></i>
                        <span>Par patient</span>
                      </a>
                    </li>
                    <li>
                      <a
                        className={`dropdown-item ${styles.dropdownItem}`}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePrint("pharmacie", "assurance");
                        }}
                      >
                        <i className="bi bi-shield-check"></i>
                        <span>Par Assurance</span>
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="text-center mb-3">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
              <div className="mt-2 text-muted">{loadingMessage}</div>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Modal pour l'impression de FactureCosultatAssurance */}
      <Modal
        show={showPrintAssuranceModal}
        onHide={() => setShowPrintAssuranceModal(false)}
        size="xl"
        centered
        className={styles.professionalModal}
      >
        <Modal.Header closeButton className={styles.modalHeader}>
          <div className={styles.headerContent}>
            <i
              className="bi bi-printer-fill"
              style={{ fontSize: "1.75rem", marginRight: "12px" }}
            ></i>
            <Modal.Title className={styles.modalTitle}>
              Facture Consultation Assurance
            </Modal.Title>
          </div>
        </Modal.Header>
        <Modal.Body className={styles.modalBody}>
          {consultationAssuranceData && (
            <PrintFactureCosultatAssurance
              ref={printAssuranceRef}
              consultation={consultationAssuranceData}
            />
          )}
          <div className="text-center mt-3">
              <button
              className="btn btn-secondary"
              onClick={() => setShowPrintAssuranceModal(false)}
            >
              <i className="bi bi-x-circle me-2"></i>
              Fermer
            </button>
          </div>
        </Modal.Body>
      </Modal>

      {/* Modal pour l'impression de FactureConsultationPatient */}
      <Modal
        show={showPrintPatientModal}
        onHide={() => setShowPrintPatientModal(false)}
        size="xl"
        centered
        className={styles.professionalModal}
      >
        <Modal.Header closeButton className={styles.modalHeader}>
          <div className={styles.headerContent}>
            <i
              className="bi bi-printer-fill"
              style={{ fontSize: "1.75rem", marginRight: "12px" }}
            ></i>
            <Modal.Title className={styles.modalTitle}>
              Facture Consultation Patient
            </Modal.Title>
          </div>
        </Modal.Header>
        <Modal.Body className={styles.modalBody}>
          {consultationPatientData && (
            <PrintFactureConsultationPatient
              ref={printPatientRef}
              consultation={consultationPatientData}
            />
          )}
          <div className="text-center mt-3">           
            <button
              className="btn btn-secondary"
              onClick={() => setShowPrintPatientModal(false)}
            >
              <i className="bi bi-x-circle me-2"></i>
              Fermer
            </button>
          </div>
        </Modal.Body>
      </Modal>
          {/* Modal pour l'impression de FactureExamenPatient */}
           <Modal
        show={showPrintExamenPatientModal}
        onHide={() => setShowPrintExamenPatientModal(false)}
        size="xl"
        centered
        className={styles.professionalModal}
      >
        <Modal.Header closeButton className={styles.modalHeader}>
          <div className={styles.headerContent}>
            <i
              className="bi bi-printer-fill"
              style={{ fontSize: "1.75rem", marginRight: "12px" }}
            ></i>
            <Modal.Title className={styles.modalTitle}>
              Facture Examens Patient
            </Modal.Title>
          </div>
        </Modal.Header>
        <Modal.Body className={styles.modalBody}>
          {consultationExamenData && (
            <PrintFactureExamenPatient
              ref={printExamenPatientRef}
              consultation={consultationExamenData}
            />
          )}
          <div className="text-center mt-3">          
            <button
              className="btn btn-secondary"
              onClick={() => setShowPrintExamenPatientModal(false)}
            >
              <i className="bi bi-x-circle me-2"></i>
              Fermer
            </button>
          </div>
        </Modal.Body>
      </Modal>
      {/* Modal pour l'impression de FactureExamenAssurance */}
      <Modal
        show={showPrintExamenAssuranceModal}
        onHide={() => setShowPrintExamenAssuranceModal(false)}
        size="xl"
        centered
        className={styles.professionalModal}
      >
        <Modal.Header closeButton className={styles.modalHeader}>
          <div className={styles.headerContent}>
            <i
              className="bi bi-printer-fill"
              style={{ fontSize: "1.75rem", marginRight: "12px" }}
            ></i>
            <Modal.Title className={styles.modalTitle}>
              Facture Examens Assurance
            </Modal.Title>
          </div>
        </Modal.Header>
        <Modal.Body className={styles.modalBody}>
          {consultationExamenData && (
            <PrintFactureExamenAssurance
              ref={printExamenRef}
              consultation={consultationExamenData}
            />
          )}
          <div className="text-center mt-3">           
            <button
              className="btn btn-secondary"
              onClick={() => setShowPrintExamenAssuranceModal(false)}
            >
              <i className="bi bi-x-circle me-2"></i>
              Fermer
            </button>
          </div>
        </Modal.Body>
      </Modal>
      
      {/* Modal pour l'impression de FacturePharmacieAssurance */}
      <Modal
        show={showPrintPharmacieAssuranceModal}
        onHide={() => setShowPrintPharmacieAssuranceModal(false)}
        size="xl"
        centered
        className={styles.professionalModal}
      >
        <Modal.Header closeButton className={styles.modalHeader}>
          <div className={styles.headerContent}>
            <i
              className="bi bi-printer-fill"
              style={{ fontSize: "1.75rem", marginRight: "12px" }}
            ></i>
            <Modal.Title className={styles.modalTitle}>
              Facture Pharmacie Assurance
            </Modal.Title>
          </div>
        </Modal.Header>
        <Modal.Body className={styles.modalBody}>
          {consultationPharmacieAssuranceData && (
            <PrintFacturePharmacieAssurance
              ref={printPharmacieAssuranceRef}
              consultation={consultationPharmacieAssuranceData}
            />
          )}
          <div className="text-center mt-3">           
            <button
              className="btn btn-secondary"
              onClick={() => setShowPrintPharmacieAssuranceModal(false)}
            >
              <i className="bi bi-x-circle me-2"></i>
              Fermer
            </button>
          </div>
        </Modal.Body>
      </Modal>

      {/* Modal pour l'impression de FactureDetailleAssurance */}
      <Modal
        show={showPrintDetailleAssuranceModal}
        onHide={() => setShowPrintDetailleAssuranceModal(false)}
        size="xl"
        centered
        className={styles.professionalModal}
      >
        <Modal.Header closeButton className={styles.modalHeader}>
          <div className={styles.headerContent}>
            <i
              className="bi bi-printer-fill"
              style={{ fontSize: "1.75rem", marginRight: "12px" }}
            ></i>
            <Modal.Title className={styles.modalTitle}>
              Facture Détaillée Assurance
            </Modal.Title>
          </div>
        </Modal.Header>
        <Modal.Body className={styles.modalBody}>
          {consultationDetailleAssuranceData && (
            <PrintFactureDetailleAssurance
              ref={printDetailleAssuranceRef}
              consultation={consultationDetailleAssuranceData}
            />
          )}
          <div className="text-center mt-3">           
            <button
              className="btn btn-secondary"
              onClick={() => setShowPrintDetailleAssuranceModal(false)}
            >
              <i className="bi bi-x-circle me-2"></i>
              Fermer
            </button>
          </div>
        </Modal.Body>
      </Modal>

           {/* Modal pour l'impression de FactureDetaillePatient */}
      <Modal
        show={showPrintDetaillePatientModal}
        onHide={() => setShowPrintDetaillePatientModal(false)}
        size="xl"
        centered
        className={styles.professionalModal}
      >
        <Modal.Header closeButton className={styles.modalHeader}>
          <div className={styles.headerContent}>
            <i
              className="bi bi-printer-fill"
              style={{ fontSize: "1.75rem", marginRight: "12px" }}
            ></i>
            <Modal.Title className={styles.modalTitle}>
              Facture Détaillée Patient
            </Modal.Title>
          </div>
        </Modal.Header>
        <Modal.Body className={styles.modalBody}>
          {consultationDetaillePatientData && (
            <PrintFactureDetaillePatient
              ref={printDetaillePatientRef}
              consultation={consultationDetaillePatientData}
            />
          )}
          <div className="text-center mt-3">           
            <button
              className="btn btn-secondary"
              onClick={() => setShowPrintDetaillePatientModal(false)}
            >
              <i className="bi bi-x-circle me-2"></i>
              Fermer
            </button>
          </div>
        </Modal.Body>
      </Modal>

      {/* Modal pour l'impression de FacturePharmaciePatient */}
      <Modal
        show={showPrintPharmaciePatientModal}
        onHide={() => setShowPrintPharmaciePatientModal(false)}
        size="xl"
        centered
        className={styles.professionalModal}
      >
        <Modal.Header closeButton className={styles.modalHeader}>
          <div className={styles.headerContent}>
            <i
              className="bi bi-printer-fill"
              style={{ fontSize: "1.75rem", marginRight: "12px" }}
            ></i>
            <Modal.Title className={styles.modalTitle}>
              Facture Pharmacie Patient
            </Modal.Title>
          </div>
        </Modal.Header>
        <Modal.Body className={styles.modalBody}>
          {consultationPharmaciePatientData && (
            <PrintFacturePharmaciePatient
              ref={printPharmaciePatientRef}
              consultation={consultationPharmaciePatientData}
            />
          )}
          <div className="text-center mt-3">           
            <button
              className="btn btn-secondary"
              onClick={() => setShowPrintPharmaciePatientModal(false)}
            >
              <i className="bi bi-x-circle me-2"></i>
              Fermer
            </button>
          </div>
        </Modal.Body>
      </Modal>
      {/* Modal pour l'impression de printFactureRecapAssurance */}
      <Modal
        show={showPrintRecapAssuranceModal}
        onHide={() => setShowPrintRecapAssuranceModal(false)}
        size="xl"
        centered
        className={styles.professionalModal}
      >
        <Modal.Header closeButton className={styles.modalHeader}>
          <div className={styles.headerContent}>
            <i
              className="bi bi-printer-fill"
              style={{ fontSize: "1.75rem", marginRight: "12px" }}
            ></i>
            <Modal.Title className={styles.modalTitle}>
              Facture Récapitulative Assurance
            </Modal.Title>
          </div>
        </Modal.Header>
        <Modal.Body className={styles.modalBody}>
          {consultationRecapAssuranceData && (
            <PrintFactureRecapAssurance
              ref={printRecapAssuranceRef}
              consultation={consultationRecapAssuranceData}
            />
          )}
          <div className="text-center mt-3">           
            <button
              className="btn btn-secondary"
              onClick={() => setShowPrintRecapAssuranceModal(false)}
            >
              <i className="bi bi-x-circle me-2"></i>
              Fermer
            </button>
          </div>
        </Modal.Body>
      </Modal>
      
      {/* Modal pour l'impression de printFactureRecapPatient */}
      <Modal
        show={showPrintRecapPatientModal}
        onHide={() => setShowPrintRecapPatientModal(false)}
        size="xl"
        centered
        className={styles.professionalModal}
      >
        <Modal.Header closeButton className={styles.modalHeader}>
          <div className={styles.headerContent}>
            <i
              className="bi bi-printer-fill"
              style={{ fontSize: "1.75rem", marginRight: "12px" }}
            ></i>
            <Modal.Title className={styles.modalTitle}>
              Facture Récapitulative Patient
            </Modal.Title>
          </div>
        </Modal.Header>
        <Modal.Body className={styles.modalBody}>
          {consultationRecapPatientData && (
            <PrintFactureRecapPatient
              ref={printRecapPatientRef}
              consultation={consultationRecapPatientData}
            />
          )}
          <div className="text-center mt-3">           
            <button
              className="btn btn-secondary"
              onClick={() => setShowPrintRecapPatientModal(false)}
            >
              <i className="bi bi-x-circle me-2"></i>
              Fermer
            </button>
          </div>
        </Modal.Body>
      </Modal>

    </>
  );
};

export default MenuImpressionFactureModal;
