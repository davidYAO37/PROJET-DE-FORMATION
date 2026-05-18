"use client";
import { useState, useEffect, useRef } from "react";

// Styles personnalisés pour le modal
const modalStyles = `
  .saisie-cr-modal .modal-dialog {
    max-width: 95vw;
    min-height: 90vh;
  }
  
  .saisie-cr-modal .modal-content {
    border-radius: 1rem;
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    border: none;
  }
  
  .saisie-cr-modal .modal-header {
    border-radius: 1rem 1rem 0 0;
    border-bottom: 2px solid #e9ecef;
  }
  
  .saisie-cr-modal .modal-body {
    max-height: calc(90vh - 120px);
    overflow-y: auto;
  }
  
  .saisie-cr-modal .card {
    border-radius: 0.75rem;
    transition: transform 0.2s ease-in-out;
  }
  
  .saisie-cr-modal .card:hover {
    transform: translateY(-2px);
  }
  
  .saisie-cr-modal .form-control:focus {
    border-color: #007bff;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  }
  
  .saisie-cr-modal .btn-primary {
    background: linear-gradient(45deg, #007bff, #0056b3);
    border: none;
    transition: all 0.3s ease;
  }
  
  .saisie-cr-modal .btn-primary:hover {
    background: linear-gradient(45deg, #0056b3, #004085);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
  }
  
  .saisie-cr-modal .btn-outline-secondary:hover {
    background-color: #6c757d;
    border-color: #6c757d;
  }
  
  .saisie-cr-modal .form-label {
    font-weight: 600;
    color: #495057;
  }
  
  .saisie-cr-modal .form-label.text-muted {
    font-weight: 500;
  }
  
  /* Style pour l'éditeur de contenu */
  .saisie-cr-modal .editor-toolbar {
    background: linear-gradient(to bottom, #f8f9fa, #e9ecef);
    border-bottom: 1px solid #dee2e6;
  }
  
  .saisie-cr-modal .content-editor {
    border: 1px solid #dee2e6;
    border-radius: 0 0 0.375rem 0.375rem;
    background: white;
  }
  
  .saisie-cr-modal .content-editor:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  }
  
  /* Animation de chargement */
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
  
  .saisie-cr-modal .loading {
    animation: pulse 1.5s infinite;
  }
`;

// Injecter les styles dans le DOM
if (
  typeof window !== "undefined" &&
  !document.getElementById("saisie-cr-modal-styles")
) {
  const styleElement = document.createElement("style");
  styleElement.id = "saisie-cr-modal-styles";
  styleElement.textContent = modalStyles;
  document.head.appendChild(styleElement);
}
import {
  Modal,
  Form,
  Button,
  Alert,
  Row,
  Col,
  ButtonGroup,
  Dropdown,
  Badge,
  Card,
} from "react-bootstrap";
import {
  FaSave,
  FaTimes,
  FaUser,
  FaCalendarAlt,
  FaBold,
  FaItalic,
  FaUnderline,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaAlignJustify,
  FaPalette,
  FaFont,
  FaListUl,
  FaListOl,
  FaIndent,
  FaOutdent,
  FaUndo,
  FaRedo,
  FaTable,
  FaTrash,
  FaPlus,
  FaObjectGroup,
  FaExclamationTriangle,
  FaClipboardCheck,
  FaUserMd,
  FaFileMedical,
} from "react-icons/fa";
import { ILignePrestation } from "@/models/lignePrestation";
import { IPatient } from "@/models/patient";

interface Props {
  show: boolean;
  onHide: () => void;
  ligne: any; // LignePrestationWinDev
  patient: IPatient | null;
  utilisateur: string; // gsUtilisateur
  onSuccess: () => void;
}

const SaisieCRModal: React.FC<Props> = ({
  show,
  onHide,
  ligne,
  patient,
  utilisateur,
  onSuccess,
}) => {
  // États du formulaire (correspondent directement aux champs du modèle LignePrestation)
  const [formData, setFormData] = useState({
    nomPatient: "",
    dateSaisieResultat: "",
    sexe: "",
    agePatient: "",
    situationGeo: "",
    resultatSaisiePar: "",
    resultatActe: "",
    observationExamen: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [acteDesignation, setActeDesignation] = useState("");

   // Récupérer l'utilisateur connecté
    const utilisateurConnecte = localStorage.getItem("nom_utilisateur");
    utilisateur = utilisateurConnecte || "";
  // États pour l'éditeur enrichi
  const editorRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState("14px");
  const [editorHeight, setEditorHeight] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);

  // 1. A l'ouverture du modal - Logique WinDev
  useEffect(() => {
    if (show && ligne) {
      initializeFormData();
    }
  }, [show, ligne]);

  const initializeFormData = async () => {
    try {
      
      // Fonction pour calculer l'âge à partir de la date de naissance
      const calculateAge = (dateNaissance: Date | string): number => {
        const birthDate = new Date(dateNaissance);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
          age--;
        }

        return age;
      };

      // Améliorer les données patient avec calcul de l'âge si nécessaire
      const enhancedPatient = patient
        ? {
            ...patient,
            Age_partient:
              patient.Age_partient || calculateAge(patient.Date_naisse),
            sexe:
              patient.sexe ||
              (patient.Nom && patient.Nom.toLowerCase().includes("mme")
                ? "F"
                : "M"),
          }
        : null;

      
      // Récupérer les informations de l'acte
      let acteData = null;
      if (ligne.idActe) {
        try {
          const acteResponse = await fetch(
            `/api/compteRenduRadio/actes/${ligne.idActe}`,
          );
          if (acteResponse.ok) {
            acteData = await acteResponse.json();
            setActeDesignation(
              acteData.designationacte || acteData.Designation || "",
            );
          } else {
            setActeDesignation(ligne.Prestation || "");
          }
        } catch (err) {
          setActeDesignation(ligne.Prestation || "");
        }
      } else {
        setActeDesignation(ligne.Prestation || "");
      }

      // Logique WinDev : SI LIGNE_PRESTATION.resultatacte="" OU LIGNE_PRESTATION.resultatacte=0 ALORS
      // Vérifier avec fallbacks pour compatibilité API
      const hasResultat = ligne.resultatActe || ligne.resultatacte || ligne.Texte_RTF;
      
      if (!hasResultat || hasResultat === "") {
        // Nouvelle saisie - utiliser patient amélioré en priorité, puis ligne comme fallback
        const newFormData = {
          nomPatient:
            enhancedPatient?.Nom && enhancedPatient?.Prenoms
              ? `${enhancedPatient.Nom} ${enhancedPatient.Prenoms}`
              : ligne.nomPatient || ligne.Nompatient || "",
          dateSaisieResultat: new Date().toISOString().split("T")[0],
          sexe: enhancedPatient?.sexe || ligne.sexe || ligne.Sexe || "",
          agePatient:
            enhancedPatient?.Age_partient?.toString() ||
            ligne.agePatient?.toString() || ligne.Age_partient?.toString() ||
            "",
          situationGeo:
            enhancedPatient?.Situationgeo || ligne.situationGeo || ligne.SituationGéo || "",
          resultatSaisiePar: utilisateur,
          resultatActe: acteData?.resultatacte || "",
          observationExamen: "",
        };

        // Récupérer Rclinique depuis EXAMENS_HOSPITALISATION si disponible
        if (ligne.IDHOSPITALISATION) {
          try {
            // Essayer d'abord par ID direct
            let hospResponse = await fetch(
              `/api/compteRenduRadio/examenhospitalisation/${ligne.IDHOSPITALISATION}`,
            );
            let hospData = null;

            if (hospResponse.ok) {
              hospData = await hospResponse.json();
              newFormData.observationExamen = hospData.Rclinique || "";
            } else if (ligne.CodePrestation && ligne.Prestation) {
              // Fallback : recherche par CodePrestation et typeActe
              const codePrestation = encodeURIComponent(ligne.CodePrestation);
              const typeActe = encodeURIComponent(ligne.Prestation || "");
              hospResponse = await fetch(
                `/api/compteRenduRadio/examenhospitalisation?CodePrestation=${codePrestation}&typeActe=${typeActe}`,
              );

              if (hospResponse.ok) {
                hospData = await hospResponse.json();
                newFormData.observationExamen = hospData.Rclinique || "";
              } else {
                // Erreur lors de la récupération des données d'hospitalisation (fallback)
              }
            } else {
              // Erreur lors de la récupération des données d'hospitalisation (ID)
            }
          } catch (err) {
            // Erreur lors de la récupération des données d'hospitalisation
          }
        } else {
          // Données d'hospitalisation insuffisantes
        }

        setFormData(newFormData);
      } else {
        // Modification d'une saisie existante - utiliser les données de la ligne en priorité, puis patient amélioré comme fallback
        const existingFormData = {
          nomPatient:
            ligne.nomPatient || ligne.Nompatient ||
            (enhancedPatient?.Nom && enhancedPatient?.Prenoms
              ? `${enhancedPatient.Nom} ${enhancedPatient.Prenoms}`
              : ""),
          dateSaisieResultat: ligne.dateSaisieResultat || ligne.DatesaisieResultat
            ? new Date(ligne.dateSaisieResultat || ligne.DatesaisieResultat).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          sexe: ligne.sexe || ligne.Sexe || enhancedPatient?.sexe || "",
          agePatient:
            ligne.agePatient?.toString() || ligne.Age_partient?.toString() ||
            enhancedPatient?.Age_partient?.toString() ||
            "",
          situationGeo:
            ligne.situationGeo || ligne.SituationGéo || enhancedPatient?.Situationgeo || "",
          resultatSaisiePar: ligne.resultatSaisiePar || utilisateur,
          resultatActe: ligne.resultatActe || ligne.resultatacte || ligne.Texte_RTF || "",
          observationExamen: ligne.observationExamen || "",
        };

        setFormData(existingFormData);
      }
    } catch (err) {
      console.error("Erreur lors de l'initialisation:", err);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Fonctions de formatage pour l'éditeur enrichi
  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const insertColor = (color: string) => {
    execCommand("foreColor", color);
  };

  const insertBackgroundColor = (color: string) => {
    execCommand("hiliteColor", color);
  };

  const changeFontSize = (size: string) => {
    setFontSize(size);
    execCommand("fontSize", size);
  };

  // Fonctions pour les tableaux
  const insertTable = (rows: number, cols: number) => {
    if (!editorRef.current) return;

    let tableHTML =
      '<table border="1" style="border-collapse: collapse; width: 100%; margin: 10px 0;">';
    for (let i = 0; i < rows; i++) {
      tableHTML += "<tr>";
      for (let j = 0; j < cols; j++) {
        tableHTML +=
          '<td style="border: 1px solid #ddd; padding: 8px; min-width: 100px;">Cellule</td>';
      }
      tableHTML += "</tr>";
    }
    tableHTML += "</table><br>";

    execCommand("insertHTML", tableHTML);
  };

  const deleteTable = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const table = range.startContainer.parentElement?.closest("table");
      if (table) {
        table.remove();
      }
    }
  };

  // Gestionnaire pour le copier-coller amélioré
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();

    const clipboardData = e.clipboardData || (window as any).clipboardData;
    const htmlData = clipboardData.getData("text/html");
    const textData = clipboardData.getData("text/plain");

    if (htmlData) {
      // Nettoyer et insérer le HTML
      const cleanHTML = htmlData
        .replace(/<meta[^>]*>/gi, "")
        .replace(/<link[^>]*>/gi, "");
      execCommand("insertHTML", cleanHTML);
    } else if (textData) {
      execCommand("insertText", textData);
    }
  };

  // Gestion du redimensionnement de l'éditeur
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const startY = e.clientY;
    const startHeight = editorHeight;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - startY;
      const newHeight = Math.max(200, Math.min(1500, startHeight + deltaY));
      setEditorHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Synchroniser le contenu de l'éditeur avec le formulaire
  useEffect(() => {
    if (
      editorRef.current &&
      formData.resultatActe !== editorRef.current.innerHTML
    ) {
      editorRef.current.innerHTML = formData.resultatActe;
    }
  }, [formData.resultatActe]);

  // Mettre à jour le formulaire quand le contenu de l'éditeur change
  const handleEditorChange = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      setFormData((prev) => ({
        ...prev,
        resultatActe: content,
      }));
    }
  };

  // 2. A la sauvegarde de la saisie - Logique WinDev
  const handleSave = async () => {
    // Vérification des champs requis (logique WinDev)
    if (!formData.resultatActe.trim()) {
      setError(
        "Merci de saisir le résultat avant cette opération\nMerci pour votre compréhension",
      );
      return;
    }

    if (!formData.dateSaisieResultat) {
      setError("Merci de mentionner la date de saisie");
      return;
    }

    if (!formData.resultatSaisiePar) {
      setError("Merci de mentionner l'opérateur de saisie");
      return;
    }

    if (!formData.nomPatient) {
      setError("Merci de mentionner le nom du patient");
      return;
    }

    if (!formData.agePatient) {
      setError("Merci de mentionner l'âge du patient");
      return;
    }

    if (!formData.sexe) {
      setError("Merci de saisir le sexe du patient");
      return;
    }

    // Confirmation
    if (!window.confirm("Voulez-vous enregistrer ce compte rendu")) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Préparer les données pour la mise à jour (logique WinDev)
      const updateData: any = {
        nomPatient: formData.nomPatient,
        dateSaisieResultat: new Date(formData.dateSaisieResultat),
        sexe: formData.sexe,
        agePatient: parseInt(formData.agePatient) || 0,
        situationGeo: formData.situationGeo,
        resultatSaisiePar: formData.resultatSaisiePar,
        // Ajouter les champs du résultat (essentiels pour l'enregistrement)
        resultatActe: formData.resultatActe,
        observationExamen: formData.observationExamen,
      };

      // Récupérer l'ID du médecin (logique WinDev : HLitRecherchePremier(MEDECIN,Nom,gsUtilisateur))
      const medecinResponse = await fetch(
        `/api/compteRenduRadio/medecins/byName/${encodeURIComponent(utilisateur)}`,
      );
      if (medecinResponse.ok) {
        const medecinData = await medecinResponse.json();
        updateData.nummedecinExecutant = medecinData._id;
        updateData.medecinExecutant = medecinData.nom + " " + medecinData.prenoms;
      }

      // Mettre à jour la ligne de prestation (logique WinDev : HModifie(LIGNE_PRESTATION))
      const response = await fetch(
        `/api/compteRenduRadio/lignePrestation/${ligne.IDLIGNE_PRESTATION}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        },
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour du compte rendu");
      }

      alert("Résultat enregistré avec succès");
      onSuccess();
      onHide();
    } catch (err: any) {
      setError(
        err.message || "Une erreur est survenue lors de l'enregistrement",
      );
    } finally {
      setLoading(false);
    }
  };

  const getModalTitle = () => {
    return `COMPTE RENDU: ${acteDesignation}`;
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="xl"
      backdrop="static"
      centered
      className="saisie-cr-modal"
    >
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title className="w-100">
          <div className="d-flex align-items-center justify-content-between">
            
              <h4 className="mb-1">{getModalTitle()}</h4>             
                    
          </div>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-4 bg-light">
        {error && (
          <Alert
            variant="danger"
            onClose={() => setError("")}
            dismissible
            className="mb-4"
          >
            <div className="d-flex align-items-center">
              <FaExclamationTriangle className="me-2" />
              <div>
                <strong>Erreur:</strong> {error}
              </div>
            </div>
          </Alert>
        )}

        <Form>
          <Row className="g-4">
            <Col lg={8} className="mb-4">
              <Card className="shadow-sm border-0 h-100">
                <Card.Header className="bg-white border-bottom py-3">
                  <div className="d-flex align-items-center">
                    <FaFileMedical className="text-primary me-2" />
                    <h6 className="mb-0 text-primary fw-bold">
                      Résultat de l'examen *
                    </h6>
                  </div>
                </Card.Header>
                <Card.Body className="p-0">
                  {/* Barre d'outils de l'éditeur */}
                  <div className="border border-secondary rounded-top p-2 editor-toolbar">
                    <div className="d-flex flex-wrap gap-2 align-items-center">
                      {/* Formatage de texte */}
                      <ButtonGroup size="sm">
                        <Button
                          variant="outline-secondary"
                          onClick={() => execCommand("bold")}
                          title="Gras"
                        >
                          <FaBold />
                        </Button>
                        <Button
                          variant="outline-secondary"
                          onClick={() => execCommand("italic")}
                          title="Italique"
                        >
                          <FaItalic />
                        </Button>
                        <Button
                          variant="outline-secondary"
                          onClick={() => execCommand("underline")}
                          title="Souligné"
                        >
                          <FaUnderline />
                        </Button>
                      </ButtonGroup>

                      {/* Alignement */}
                      <ButtonGroup size="sm">
                        <Button
                          variant="outline-secondary"
                          onClick={() => execCommand("justifyLeft")}
                          title="Aligner à gauche"
                        >
                          <FaAlignLeft />
                        </Button>
                        <Button
                          variant="outline-secondary"
                          onClick={() => execCommand("justifyCenter")}
                          title="Centrer"
                        >
                          <FaAlignCenter />
                        </Button>
                        <Button
                          variant="outline-secondary"
                          onClick={() => execCommand("justifyRight")}
                          title="Aligner à droite"
                        >
                          <FaAlignRight />
                        </Button>
                        <Button
                          variant="outline-secondary"
                          onClick={() => execCommand("justifyFull")}
                          title="Justifier"
                        >
                          <FaAlignJustify />
                        </Button>
                      </ButtonGroup>

                      {/* Listes */}
                      <ButtonGroup size="sm">
                        <Button
                          variant="outline-secondary"
                          onClick={() => execCommand("insertUnorderedList")}
                          title="Liste à puces"
                        >
                          <FaListUl />
                        </Button>
                        <Button
                          variant="outline-secondary"
                          onClick={() => execCommand("insertOrderedList")}
                          title="Liste numérotée"
                        >
                          <FaListOl />
                        </Button>
                      </ButtonGroup>

                      {/* Indentation */}
                      <ButtonGroup size="sm">
                        <Button
                          variant="outline-secondary"
                          onClick={() => execCommand("indent")}
                          title="Augmenter l'indentation"
                        >
                          <FaIndent />
                        </Button>
                        <Button
                          variant="outline-secondary"
                          onClick={() => execCommand("outdent")}
                          title="Diminuer l'indentation"
                        >
                          <FaOutdent />
                        </Button>
                      </ButtonGroup>

                      {/* Historique */}
                      <ButtonGroup size="sm">
                        <Button
                          variant="outline-secondary"
                          onClick={() => execCommand("undo")}
                          title="Annuler"
                        >
                          <FaUndo />
                        </Button>
                        <Button
                          variant="outline-secondary"
                          onClick={() => execCommand("redo")}
                          title="Refaire"
                        >
                          <FaRedo />
                        </Button>
                      </ButtonGroup>

                      {/* Couleurs */}
                      <Dropdown drop="down">
                        <Dropdown.Toggle
                          variant="outline-secondary"
                          size="sm"
                          title="Couleur du texte"
                        >
                          <FaPalette />
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => insertColor("#000000")}>
                            Noir
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => insertColor("#FF0000")}>
                            Rouge
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => insertColor("#0000FF")}>
                            Bleu
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => insertColor("#008000")}>
                            Vert
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => insertColor("#FFA500")}>
                            Orange
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>

                      {/* Taille de police */}
                      <Dropdown drop="down">
                        <Dropdown.Toggle
                          variant="outline-secondary"
                          size="sm"
                          title="Taille de police"
                        >
                          <FaFont />
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => changeFontSize("1")}>
                            Très petit
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => changeFontSize("2")}>
                            Petit
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => changeFontSize("3")}>
                            Normal
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => changeFontSize("4")}>
                            Moyen
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => changeFontSize("5")}>
                            Grand
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => changeFontSize("6")}>
                            Très grand
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>

                      {/* Tableaux */}
                      <Dropdown drop="down">
                        <Dropdown.Toggle
                          variant="outline-secondary"
                          size="sm"
                          title="Insérer un tableau"
                        >
                          <FaTable />
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => insertTable(2, 2)}>
                            2x2
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => insertTable(3, 3)}>
                            3x3
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => insertTable(4, 4)}>
                            4x4
                          </Dropdown.Item>
                          <Dropdown.Divider />
                          <Dropdown.Item
                            onClick={() => deleteTable()}
                            className="text-danger"
                          >
                            <FaTrash className="me-2" />
                            Supprimer le tableau
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>

                    {/* Éditeur de contenu */}
                    <div style={{ position: "relative" }}>
                      <div
                        ref={editorRef}
                        contentEditable
                        className="border border-secondary border-top-0 rounded-bottom p-3 content-editor"
                        style={{
                          height: `${editorHeight}px`,
                          width: "100%",
                          fontSize: "14px",
                          fontFamily: "Arial, sans-serif",
                          lineHeight: "1.6",
                          overflow: "auto",
                          backgroundColor: "#FFFFFF",
                          minHeight: "200px",
                          maxHeight: "1500px",
                          padding: "15px",
                        }}
                        data-placeholder="Saisir le résultat de l'examen ici..."
                        onPaste={handlePaste}
                        onInput={handleEditorChange}
                        onBlur={handleEditorChange}
                      />

                      {/* Zone de redimensionnement */}
                      <div
                        ref={resizeRef}
                        onMouseDown={handleMouseDown}
                        style={{
                          position: "absolute",
                          bottom: "0",
                          left: "0",
                          right: "0",
                          height: "8px",
                          background:
                            "linear-gradient(to bottom, transparent, #007bff)",
                          cursor: "ns-resize",
                          borderRadius: "0 0 0.375rem 0.375rem",
                        }}
                      />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4} className="mb-4">
              <Card className="shadow-sm border-0 h-100">
                <Card.Header className="bg-white border-bottom py-3">
                  <div className="d-flex align-items-center">
                    <FaUserMd className="text-primary me-2" />
                    <h6 className="mb-0 text-primary fw-bold">
                      Informations Patient
                    </h6>
                  </div>
                </Card.Header>
                <Card.Body className="p-4">
                  <Row className="g-3">
                    <Col xs={12}>
                      <Form.Group>
                        <Form.Label className="text-muted small">
                          Patient
                        </Form.Label>
                        <Form.Control
                          type="text"
                          value={formData.nomPatient}
                          onChange={(e) =>
                            handleInputChange("nomPatient", e.target.value)
                          }
                          placeholder="Nom du patient"
                          className="border-0 bg-light"
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={6}>
                      <Form.Group>
                        <Form.Label className="text-muted small">
                          Âge
                        </Form.Label>
                        <Form.Control
                          type="text"
                          value={formData.agePatient}
                          onChange={(e) =>
                            handleInputChange("agePatient", e.target.value)
                          }
                          placeholder="Âge"
                          className="border-0 bg-light"
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={6}>
                      <Form.Group>
                        <Form.Label className="text-muted small">
                          Sexe
                        </Form.Label>
                        <Form.Select
                          value={formData.sexe}
                          onChange={(e) =>
                            handleInputChange("sexe", e.target.value)
                          }
                          className="border-0 bg-light"
                        >
                          <option value="">Sélectionner</option>
                          <option value="M">Masculin</option>
                          <option value="F">Féminin</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="g-3">
                    <Col xs={12}>
                      <Form.Group>
                        <Form.Label className="text-muted small">
                          <FaCalendarAlt className="me-1" />
                          Date de saisie
                        </Form.Label>
                        <Form.Control
                          type="date"
                          value={formData.dateSaisieResultat}
                          onChange={(e) =>
                            handleInputChange(
                              "dateSaisieResultat",
                              e.target.value,
                            )
                          }
                          className="border-0 bg-light"
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12}>
                      <Form.Group>
                        <Form.Label className="text-muted small">
                          Situation géographique
                        </Form.Label>
                        <Form.Control
                          type="text"
                          value={formData.situationGeo}
                          onChange={(e) =>
                            handleInputChange("situationGeo", e.target.value)
                          }
                          placeholder="Situation géographique"
                          className="border-0 bg-light"
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12}>
                      <Form.Group>
                        <Form.Label className="text-muted small">
                          Saisi par
                        </Form.Label>
                        <Form.Control
                          type="text"
                          value={formData.resultatSaisiePar}
                          onChange={(e) =>
                            handleInputChange(
                              "resultatSaisiePar",
                              e.target.value,
                            )
                          }
                          placeholder="Opérateur de saisie"
                          className="border-0 bg-light"
                        />
                      </Form.Group>
                    </Col>
                    
                    <Col xs={12}>
                      <Form.Group>
                        <Form.Label className="text-muted small">
                          Observation examen
                        </Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={4}
                          value={formData.observationExamen}
                          onChange={(e) =>
                            handleInputChange(
                              "observationExamen",
                              e.target.value,
                            )
                          }
                          placeholder="Observations cliniques"
                          className="border-0 bg-light"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Form>
      </Modal.Body>

      <Modal.Footer className="bg-white border-top py-3">
        <div className="d-flex justify-content-between w-100">
          <div className="text-muted small">
            <FaClipboardCheck className="me-1" />
            Les champs marqués d'un * sont obligatoires
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="outline-secondary"
              onClick={onHide}
              disabled={loading}
              className="px-4"
            >
              <FaTimes className="me-2" />
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={loading}
              className="px-4"
            >
              <FaSave className="me-2" />
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Enregistrement...
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default SaisieCRModal;
