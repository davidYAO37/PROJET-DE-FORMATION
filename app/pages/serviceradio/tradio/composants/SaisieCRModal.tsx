"use client";
import { useState, useEffect } from "react";
import { Modal, Form, Button, Alert, Row, Col } from "react-bootstrap";
import { FaSave, FaTimes, FaUser, FaCalendarAlt } from "react-icons/fa";
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
  onSuccess 
}) => {
  // États du formulaire (correspondent aux champs SAI_* WinDev)
  const [formData, setFormData] = useState({
    Patient: "",
    DatesaisieResultat: "",
    Sexe: "",
    Age: "",
    Situationgeo: "",
    Résultatsaisiepar: "",
    Texte_RTF: "",
    ObservationExame: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [acteDesignation, setActeDesignation] = useState("");

  // 1. A l'ouverture du modal - Logique WinDev
  useEffect(() => {
    if (show && ligne) {
      initializeFormData();
    }
  }, [show, ligne]);

  const initializeFormData = async () => {
    try {
      // Debug : afficher les données disponibles
      console.log('=== DEBUG SAISIE CR ===');
      console.log('Patient:', patient);
      console.log('Ligne:', ligne);
      console.log('Tous les champs patient:', patient);
      console.log('Champs ligne:', {
        Nompatient: ligne.Nompatient,
        Sexe: ligne.Sexe,
        Age_partient: ligne.Age_partient,
        SituationGéo: ligne.SituationGéo
      });

      // Récupérer les informations de l'acte
      const acteResponse = await fetch(`/api/actes/${ligne.idActe}`);
      let acteData = null;
      if (acteResponse.ok) {
        acteData = await acteResponse.json();
        setActeDesignation(acteData.Designation || "");
      }

      // Logique WinDev : SI LIGNE_PRESTATION.resultatacte="" OU LIGNE_PRESTATION.resultatacte=0 ALORS
      if (!ligne.resultatActe || ligne.resultatActe === "") {
        // Nouvelle saisie - utiliser patient en priorité, puis ligne comme fallback
        const newFormData = {
          Patient: patient?.Nom && patient?.Prenoms ? `${patient.Nom} ${patient.Prenoms}` : (ligne.Nompatient || ""),
          DatesaisieResultat: new Date().toISOString().split('T')[0],
          Sexe: patient?.sexe || ligne.Sexe || "",
          Age: patient?.Age_partient?.toString() || ligne.Age_partient?.toString() || "",
          Situationgeo: patient?.Situationgeo || ligne.SituationGéo || "",
          Résultatsaisiepar: utilisateur,
          Texte_RTF: acteData?.resultatacte || "",
          ObservationExame: ""
        };
        
        console.log('NewFormData (nouvelle saisie):', newFormData);

        // Récupérer Rclinique depuis EXAMENS_HOSPITALISATION si disponible
        if (ligne.IDHOSPITALISATION) {
          try {
            const hospResponse = await fetch(`/api/examenhospitalisation/${ligne.IDHOSPITALISATION}`);
            if (hospResponse.ok) {
              const hospData = await hospResponse.json();
              newFormData.ObservationExame = hospData.Rclinique || "";
            }
          } catch (err) {
            console.log("Erreur lors de la récupération des données d'hospitalisation");
          }
        }

        setFormData(newFormData);
      } else {
        // Modification d'une saisie existante
        const existingFormData = {
          Patient: ligne.Nompatient || "",
          DatesaisieResultat: ligne.DatesaisieResultat ? new Date(ligne.DatesaisieResultat).toISOString().split('T')[0] : "",
          Sexe: ligne.Sexe || "",
          Age: ligne.Age_partient?.toString() || "",
          Situationgeo: ligne.SituationGéo || "",
          Résultatsaisiepar: ligne.Résultatsaisiepar || "",
          Texte_RTF: ligne.resultatActe || "",
          ObservationExame: ligne.observationExamen || ""
        };
        
        console.log('ExistingFormData (modification):', existingFormData);
        console.log('Champs ligne disponibles:', {
          Nompatient: ligne.Nompatient,
          Sexe: ligne.Sexe,
          Age_partient: ligne.Age_partient,
          SituationGéo: ligne.SituationGéo,
          DatesaisieResultat: ligne.DatesaisieResultat
        });
        
        setFormData(existingFormData);
      }
    } catch (err) {
      console.error("Erreur lors de l'initialisation:", err);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 2. A la validation de la saisie - Logique WinDev
  const handleValidation = async () => {
    // Validation des champs requis (logique WinDev)
    if (!formData.Texte_RTF.trim()) {
      setError("Merci de saisir le résultat avant cette opération\nMerci pour votre compréhension");
      return;
    }

    if (!formData.DatesaisieResultat) {
      setError("Merci de mentionner la date de saisie");
      return;
    }

    if (!formData.Résultatsaisiepar) {
      setError("Merci de mentionner l'opérateur de saisie");
      return;
    }

    if (!formData.Patient) {
      setError("Merci de saisir le patient");
      return;
    }

    if (!formData.Age) {
      setError("Merci de saisir l'age du patient");
      return;
    }

    if (!formData.Sexe) {
      setError("Merci de saisir le sexe du patient");
      return;
    }

    // Confirmation
    if (!window.confirm("Voulez-vous valider ce compte rendu")) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Préparer les données pour la mise à jour (logique WinDev)
      const updateData: any = {
        resultatacte: formData.Texte_RTF,
        ObservationExame: formData.ObservationExame,
        Nompatient: formData.Patient,
        DatesaisieResultat: new Date(formData.DatesaisieResultat),
        Sexe: formData.Sexe,
        Age_partient: parseInt(formData.Age) || 0,
        SituationGéo: formData.Situationgeo,
        Résultatsaisiepar: formData.Résultatsaisiepar
      };

      // Récupérer l'ID du médecin (logique WinDev : HLitRecherchePremier(MEDECIN,Nom,gsUtilisateur))
      const medecinResponse = await fetch(`/api/medecins/byName/${encodeURIComponent(utilisateur)}`);
      if (medecinResponse.ok) {
        const medecinData = await medecinResponse.json();
        updateData.NummedecinExécutant = medecinData._id;
        updateData.MedecinExécutant = medecinData.Nom;
      }

      // Mettre à jour la ligne de prestation (logique WinDev : HModifie(LIGNE_PRESTATION))
      const response = await fetch(`/api/lignePrestation/${ligne.IDLIGNE_PRESTATION}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour du compte rendu");
      }

      alert("Résultat enregistré avec succès");
      onSuccess();
      onHide();
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de l'enregistrement");
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
      size="lg"
      backdrop="static"
    >
      <Modal.Header closeButton>
        <Modal.Title className="w-100">
          <h5 className="mb-0">{getModalTitle()}</h5>
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {error && (
          <Alert variant="danger" onClose={() => setError("")} dismissible>
            {error}
          </Alert>
        )}

        <Form>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label><FaUser className="me-2" />Patient</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.Patient}
                  onChange={(e) => handleInputChange("Patient", e.target.value)}
                  placeholder="Nom du patient"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Âge</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.Age}
                  onChange={(e) => handleInputChange("Age", e.target.value)}
                  placeholder="Âge"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Sexe</Form.Label>
                <Form.Select
                  value={formData.Sexe}
                  onChange={(e) => handleInputChange("Sexe", e.target.value)}
                >
                  <option value="">Sélectionner</option>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label><FaCalendarAlt className="me-2" />Date de saisie</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.DatesaisieResultat}
                  onChange={(e) => handleInputChange("DatesaisieResultat", e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Saisi par</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.Résultatsaisiepar}
                  onChange={(e) => handleInputChange("Résultatsaisiepar", e.target.value)}
                  placeholder="Opérateur de saisie"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={12}>
              <Form.Group>
                <Form.Label>Situation géographique</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.Situationgeo}
                  onChange={(e) => handleInputChange("Situationgeo", e.target.value)}
                  placeholder="Situation géographique"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={12}>
              <Form.Group>
                <Form.Label>Observation examen</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={formData.ObservationExame}
                  onChange={(e) => handleInputChange("ObservationExame", e.target.value)}
                  placeholder="Observations cliniques"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={12}>
              <Form.Group>
                <Form.Label><strong>Résultat de l'examen *</strong></Form.Label>
                <Form.Control
                  as="textarea"
                  rows={6}
                  value={formData.Texte_RTF}
                  onChange={(e) => handleInputChange("Texte_RTF", e.target.value)}
                  placeholder="Saisir le résultat de l'examen..."
                  required
                />
              </Form.Group>
            </Col>
          </Row>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          <FaTimes className="me-2" />
          Annuler
        </Button>
        <Button variant="primary" onClick={handleValidation} disabled={loading}>
          <FaSave className="me-2" />
          {loading ? "Enregistrement..." : "Valider"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SaisieCRModal;
