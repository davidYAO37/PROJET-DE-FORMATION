"use client";
import { useState, useEffect } from "react";
import { Table, Button, Spinner, Alert, Form, Row, Col, Badge } from "react-bootstrap";
import { FaEdit, FaCalendarAlt, FaUser, FaClock, FaCheckCircle, FaSearch, FaFilter, FaPrint, FaCheck } from "react-icons/fa";
import { ILignePrestation } from "@/models/lignePrestation";
import { IPatient } from "@/models/patient";
import SaisieCRModal from "./SaisieCRModal";
import PrintCompteRenduUnified from "./MesImpressions/CompteRendu/PrintCompteRenduUnified";
import { useEntreprise } from "@/hooks/useEntreprise";

interface Props {
  onLigneSelect: (ligne: ILignePrestation, patient: IPatient) => void;
}

const ListeAvalider: React.FC<Props> = ({ onLigneSelect }) => {
  const { entreprise } = useEntreprise();
  const [lignePrestations, setLignePrestations] = useState<ILignePrestation[]>([]);
  const [patients, setPatients] = useState<IPatient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [lettreCleFilter, setLettreCleFilter] = useState("");
  const [lettreClesDisponibles, setLettreClesDisponibles] = useState<string[]>([]);
  
  // États pour le modal de saisie de compte rendu
  const [showSaisieCRModal, setShowSaisieCRModal] = useState(false);
  const [selectedLigneForCR, setSelectedLigneForCR] = useState<any>(null);
  const [selectedPatientForCR, setSelectedPatientForCR] = useState<IPatient | null>(null);

  // États pour les actions de validation et d'impression
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printData, setPrintData] = useState<any>(null);

  // Charger les lignes de prestations à valider
  const loadLignesAValider = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (dateDebut) params.append("dateDebut", dateDebut);
      if (dateFin) params.append("dateFin", dateFin);
      if (lettreCleFilter) params.append("lettreCle", lettreCleFilter);

      const response = await fetch(`/api/compteRenduRadio/Avalider?${params}`);
      if (!response.ok) throw new Error("Erreur lors du chargement des prestations à valider");
      
      const data = await response.json();
      setLignePrestations(data.lignePrestations || []);
      setPatients(data.patients || []);
      
      // Extraire les lettres clés uniques (utiliser le champ WinDev)
      const lettresCles = [...new Set(data.lignePrestations.map((ligne: any) => ligne.lettreCle) as string[])];
      setLettreClesDisponibles(lettresCles);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLignesAValider();
  }, [dateDebut, dateFin, lettreCleFilter]);

  // Écouter l'événement de rafraîchissement d'onglet
  useEffect(() => {
    const handleRefreshTabData = (event: CustomEvent) => {
      const { activeTab } = event.detail;
      // Rafraîchir seulement si on est sur l'onglet "avalider"
      if (activeTab === 'avalider') {
        loadLignesAValider();
      }
    };

    // Ajouter l'écouteur d'événement
    window.addEventListener('refreshTabData', handleRefreshTabData as EventListener);
    
    // Nettoyer l'écouteur lors du démontage
    return () => {
      window.removeEventListener('refreshTabData', handleRefreshTabData as EventListener);
    };
  }, [dateDebut, dateFin, lettreCleFilter]);

  // Obtenir les informations du patient pour une ligne de prestation
  const getPatientInfo = (ligne: any): any => {
    // Essayer différentes façons de trouver le patient
    let patient: any = null;
    
    // 1. Correspondance directe avec IdPatient (peut être ObjectId ou string)
    if (ligne.IdPatient) {
      patient = patients.find(p => {
        const ligneIdStr = ligne.IdPatient.toString();
        const patientIdStr = p._id.toString();
        return ligneIdStr === patientIdStr;
      });
    }
    
    // 2. Si IdPatient est un objet (cas du populate)
    if (!patient && ligne.IdPatient && typeof ligne.IdPatient === 'object') {
      patient = patients.find(p => p._id.toString() === ligne.IdPatient._id?.toString());
    }
    
    // 3. Essayer avec idPatient (minuscule)
    if (!patient && ligne.idPatient) {
      patient = patients.find(p => p._id.toString() === ligne.idPatient?.toString());
    }
    
    // 4. Essayer avec les propriétés du patient directement dans la ligne (cas du populate)
    if (!patient && ligne.IdPatient && typeof ligne.IdPatient === 'object' && ligne.IdPatient.Nom) {
      // Créer un patient temporaire à partir des données de la ligne
      patient = {
        _id: ligne.IdPatient._id,
        Nom: ligne.IdPatient.Nom,
        Prenoms: ligne.IdPatient.Prenoms,
        Contact: ligne.IdPatient.Contact,
        Code_dossier: ligne.IdPatient.Code_dossier,
        Date_naisse: ligne.IdPatient.Date_naisse
      };
    }
    
    return patient;
  };

  // Formater la date
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR');
  };

  // Formater la date et heure
  const formatDateTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString('fr-FR');
  };

  // Gérer la sélection d'une ligne pour saisir le résultat
  const handleLigneSelect = (ligne: any) => {
    const patient = getPatientInfo(ligne);
    if (patient) {
      onLigneSelect(ligne, patient);
    }
  };

  // Gérer l'ouverture du modal de saisie de compte rendu
  const handleOpenSaisieCRModal = (ligne: any) => {
    const patient = getPatientInfo(ligne);
    setSelectedLigneForCR(ligne);
    setSelectedPatientForCR(patient || null);
    setShowSaisieCRModal(true);
  };

  // Gérer la fermeture du modal
  const handleCloseSaisieCRModal = () => {
    setShowSaisieCRModal(false);
    setSelectedLigneForCR(null);
    setSelectedPatientForCR(null);
  };

  // Gérer le succès de la saisie
  const handleSaisieCRSuccess = () => {
    loadLignesAValider(); // Recharger les données
  };

  // Gérer la validation du compte rendu
  const handleValidate = async (ligne: any) => {
    // Logique WinDev : SI TABLE_LIGNE_PRESTATION.COL_SaisiePar=" "ALORS
    if (!ligne.resultatSaisiePar || ligne.resultatSaisiePar.trim() === "") {
      alert("Veuillez saisir le compte rendu avant cette action");
      return;
    }

    // Logique WinDev : SI OuiNon(0,"Voulez-vous valider le compte rendu ?")=Vrai ALORS
    if (!window.confirm("Voulez-vous valider le compte rendu ?")) {
      return;
    }

    // Logique WinDev : SI OKAnnuler(0,"Action irréversible")=Vrai ALORS
    if (!window.confirm("Action irréversible")) {
      return;
    }

    // Logique WinDev : SI TABLE_LIGNE_PRESTATION.COL_ValidePar="" ALORS
    if (ligne.compteRenduValidePar && ligne.compteRenduValidePar.trim() !== "") {
      alert(`Compte rendu déjà validé par ${ligne.compteRenduValidePar}`);
      return;
    }

    setValidatingId(ligne.IDLIGNE_PRESTATION);
    setError("");

    try {
      const utilisateur = localStorage.getItem("nom_utilisateur") || "";
      
      const response = await fetch(`/api/compteRenduRadio/valider/${ligne.IDLIGNE_PRESTATION}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ utilisateur }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.code === 'NO_RESULTAT') {
          alert("Veuillez saisir le compte rendu avant cette action");
        } else if (result.code === 'DEJA_VALIDE') {
          alert(result.error);
        } else {
          throw new Error(result.error || "Erreur lors de la validation");
        }
        return;
      }

      alert("Compte rendu validé avec succès");
      loadLignesAValider(); // Logique WinDev : rafraichir

    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de la validation");
    } finally {
      setValidatingId(null);
    }
  };

  // Gérer l'impression du compte rendu avec design unifié
  const handlePrint = async (ligne: any) => {
    // Logique WinDev : SI LIGNE_PRESTATION.resultatacte <> ''
    if (!ligne.resultatActe || ligne.resultatActe.trim() === "") {
      alert("Aucun résultat à imprimer");
      return;
    }

    setPrintingId(ligne.IDLIGNE_PRESTATION);
    setError("");

    try {
      const response = await fetch(`/api/compteRenduRadio/imprimer/${ligne.IDLIGNE_PRESTATION}`);
      
      if (!response.ok) {
        const result = await response.json();
        if (result.code === 'NO_RESULTAT_A_IMPRIMER') {
          alert("Aucun résultat à imprimer");
        } else {
          throw new Error(result.error || "Erreur lors de la préparation de l'impression");
        }
        return;
      }

      const result = await response.json();
      
      if (result.success && result.donnees) {
        // Préparer les données pour l'impression
        const printData = {
          Nompatient: result.donnees.Nompatient,
          Sexe: result.donnees.Sexe,
          Age_partient: result.donnees.Age_partient,
          Situationgeo: result.donnees.Situationgeo,
          Code_Prestation: result.donnees.Code_Prestation,
          Prestation: result.donnees.Prestation,
          DatesaisieResultat: result.donnees.DatesaisieResultat,
          MedecinPrescripteur: result.donnees.MedecinPrescripteur,
          Docteursaisieresultat: result.donnees.Docteursaisieresultat,
          resultatacte: result.donnees.resultatacte,
          ObservationExame: result.donnees.ObservationExame
        };

        // Ouvrir le modal d'impression avec le nouveau design
        setPrintData({ donnees: printData });
        setPrintModalOpen(true);
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de la préparation de l'impression");
    } finally {
      setPrintingId(null);
    }
  };

  // Gérer l'impression sans entête du compte rendu avec design unifié
  const handlePrintWithoutHeader = async (ligne: any) => {
    // Logique WinDev : SI LIGNE_PRESTATION.resultatacte <> ''
    if (!ligne.resultatActe || ligne.resultatActe.trim() === "") {
      alert("Aucun résultat à imprimer");
      return;
    }

    setPrintingId(ligne.IDLIGNE_PRESTATION);
    setError("");

    try {
      const response = await fetch(`/api/compteRenduRadio/imprimer/${ligne.IDLIGNE_PRESTATION}`);
      
      if (!response.ok) {
        const result = await response.json();
        if (result.code === 'NO_RESULTAT_A_IMPRIMER') {
          alert("Aucun résultat à imprimer");
        } else {
          throw new Error(result.error || "Erreur lors de la préparation de l'impression");
        }
        return;
      }

      const result = await response.json();
      
      if (result.success && result.donnees) {
        // Préparer les données pour l'impression
        const printData = {
          Nompatient: result.donnees.Nompatient,
          Sexe: result.donnees.Sexe,
          Age_partient: result.donnees.Age_partient,
          Situationgeo: result.donnees.Situationgeo,
          Code_Prestation: result.donnees.Code_Prestation,
          Prestation: result.donnees.Prestation,
          DatesaisieResultat: result.donnees.DatesaisieResultat,
          MedecinPrescripteur: result.donnees.MedecinPrescripteur,
          Docteursaisieresultat: result.donnees.Docteursaisieresultat,
          resultatacte: result.donnees.resultatacte,
          ObservationExame: result.donnees.ObservationExame
        };

        // Ouvrir le modal d'impression sans entête
        setPrintData({ donnees: printData });
        setPrintModalOpen(true);
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de la préparation de l'impression");
    } finally {
      setPrintingId(null);
    }
  };

  // Obtenir le statut de la ligne
  const getStatutBadge = (ligne: any) => {
    if (ligne.compteRenduValidePar) {
      return <Badge bg="success"><FaCheckCircle className="me-1" />Validé</Badge>;
    } else if (ligne.resultatSaisiePar) {
      return <Badge bg="warning"><FaClock className="me-1" />En attente de validation</Badge>;
    } else {
      return <Badge bg="danger"><FaEdit className="me-1" />À saisir</Badge>;
    }
  };

  return (
    <div>
      {/* Filtres */}
      <div className="mb-4">
        <h5><FaFilter className="me-2" />Option de Recherche</h5>
        <Row>
          <Col md={3}>
            <Form.Group>
              <Form.Label><FaCalendarAlt className="me-2" />Date début</Form.Label>
              <Form.Control
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group>
              <Form.Label><FaCalendarAlt className="me-2" />Date fin</Form.Label>
              <Form.Control
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group>
              <Form.Label>Lettre clé</Form.Label>
              <Form.Select
                value={lettreCleFilter}
                onChange={(e) => setLettreCleFilter(e.target.value)}
              >
                <option value="">Toutes les lettres clés</option>
                {lettreClesDisponibles.map((lettre: string) => (
                  <option key={lettre} value={lettre}>{lettre}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group className="d-flex align-items-end">
              <Button variant="primary" onClick={loadLignesAValider} disabled={loading}>
                {loading ? <Spinner size="sm" /> : <FaSearch />}
              </Button>
            </Form.Group>
          </Col>
        </Row>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Tableau des lignes de prestations à valider */}
      <div>
        <h5><FaClock className="me-2" />Compte Rendu à Saisir/Valider</h5>
        <Table striped bordered hover responsive>
          <thead className="table-warning">
            <tr>
              <th>Date prestation</th>
              <th>Patient</th>
              <th>Contact</th>
              <th>Dossier N°</th>
              <th>Prestation</th>
              <th>Médecin exécutant</th>
              <th>Saisie par</th>
              <th>Saisie le</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="text-center">
                  <Spinner animation="border" />
                </td>
              </tr>
            ) : lignePrestations.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center">
                  Aucune prestation à saisir/valider trouvée
                </td>
              </tr>
            ) : (
              lignePrestations
                .sort((a: any, b: any) => new Date(a.Date_ligne_prestaion).getTime() - new Date(b.Date_ligne_prestaion).getTime())
                .map((ligne: any) => {
                  const patient = getPatientInfo(ligne);
                  return (
                    <tr key={ligne.IDLIGNE_PRESTATION?.toString()}>
                      <td>{formatDate(ligne.Date_ligne_prestaion)}</td>
                      <td>
                        {patient ? (
                          <strong>{patient.Nom} {patient.Prenoms}</strong>
                        ) : (
                          <span className="text-muted">{ligne.Nompatient || "Patient non trouvé"}</span>
                        )}
                      </td>
                      <td>{patient?.Contact || "N/A"}</td>
                      <td>
                        <strong>{patient?.Code_dossier || "N/A"}</strong>
                      </td>
                      <td>
                        <strong>{ligne.Prestation}</strong>                       
                      </td>                      
                      <td>{ligne.MedecinExécutant || "N/A"}</td>
                      <td>{ligne.resultatSaisiePar || "N/A"}</td>
                      <td>
                        {ligne.DatesaisieResultat ? formatDateTime(ligne.DatesaisieResultat) : "N/A"}
                      </td>
                      <td>{getStatutBadge(ligne)}</td>
                      <td>
                        <div className="d-flex gap-1">
                          {/* Bouton Saisie/Modifier */}
                          <Button
                            size="sm"
                            variant={ligne.resultatSaisiePar ? "outline-warning" : "outline-primary"}
                            onClick={() => handleOpenSaisieCRModal(ligne)}
                            title={ligne.resultatSaisiePar ? "Modifier la saisie" : "Saisir le compte rendu"}
                          >
                            {ligne.resultatSaisiePar ? <FaClock /> : <FaEdit />}
                          </Button>
                          
                          {/* Boutons actifs seulement si résultat saisi */}
                          {ligne.resultatSaisiePar && (
                            <>
                              {/* Bouton Valider */}
                              <Button
                                size="sm"
                                variant="outline-success"
                                onClick={() => handleValidate(ligne)}
                                disabled={validatingId === ligne.IDLIGNE_PRESTATION || ligne.compteRenduValidePar}
                                title="Valider le compte rendu"
                              >
                                {validatingId === ligne.IDLIGNE_PRESTATION ? (
                                  <Spinner size="sm" />
                                ) : (
                                  <FaCheck />
                                )}
                              </Button>
                              
                              {/* Boutons Imprimer */}
                              <div className="d-flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline-primary"
                                  onClick={() => handlePrint(ligne)}
                                  disabled={printingId === ligne.IDLIGNE_PRESTATION}
                                  title="Imprimer avec entête"
                                >
                                  {printingId === ligne.IDLIGNE_PRESTATION ? (
                                    <Spinner size="sm" />
                                  ) : (
                                    <FaPrint />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline-secondary"
                                  onClick={() => handlePrintWithoutHeader(ligne)}
                                  disabled={printingId === ligne.IDLIGNE_PRESTATION}
                                  title="Imprimer sans entête"
                                >
                                  {printingId === ligne.IDLIGNE_PRESTATION ? (
                                    <Spinner size="sm" />
                                  ) : (
                                    <FaPrint />
                                  )}
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
            )}
          </tbody>
        </Table>
      </div>

      {/* Statistiques */}
      <div className="mt-4">
        <Row>
          <Col md={4}>
            <div className="card border-danger">
              <div className="card-body text-center">
                <h6 className="card-title text-danger">À saisir</h6>
                <h3 className="text-danger">
                  {lignePrestations.filter((l: any) => !l.resultatSaisiePar).length}
                </h3>
              </div>
            </div>
          </Col>
          <Col md={4}>
            <div className="card border-warning">
              <div className="card-body text-center">
                <h6 className="card-title text-warning">En attente de validation</h6>
                <h3 className="text-warning">
                  {lignePrestations.filter((l: any) => l.resultatSaisiePar && !l.compteRenduValidePar).length}
                </h3>
              </div>
            </div>
          </Col>
          <Col md={4}>
            <div className="card border-success">
              <div className="card-body text-center">
                <h6 className="card-title text-success">Validés</h6>
                <h3 className="text-success">
                  {lignePrestations.filter((l: any) => l.compteRenduValidePar).length}
                </h3>
              </div>
            </div>
          </Col>
        </Row>
      </div>

      {/* Modal de saisie de compte rendu */}
      {showSaisieCRModal && (
        <SaisieCRModal
          show={showSaisieCRModal}
          onHide={handleCloseSaisieCRModal}
          onSuccess={handleSaisieCRSuccess}
          ligne={selectedLigneForCR}
          patient={selectedPatientForCR}
          utilisateur={localStorage.getItem("nom_utilisateur") || ""}
        />
      )}

      {/* Modal d'impression avec design unifié */}
      {printModalOpen && (
        <div 
          className="modal fade show d-block" 
          style={{ 
            display: 'block', 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            zIndex: 1050, 
            width: '100%', 
            height: '100%', 
            backgroundColor: 'rgba(0,0,0,0.5)' 
          }}
          onClick={() => setPrintModalOpen(false)}
        >
          <div 
            className="modal-dialog modal-lg" 
            onClick={(e) => e.stopPropagation()}
            style={{ 
              margin: '50px auto', 
              maxWidth: '900px', 
              backgroundColor: 'white', 
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div className="modal-content">
              <div className="modal-header border-bottom">
                <h5 className="modal-title">
                  <FaPrint className="me-2" />
                  Aperçu de l'impression
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setPrintModalOpen(false)}
                >
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                {printData && (
                  <PrintCompteRenduUnified 
                    donnees={printData.donnees}
                    titre="COMPTE RENDU RADIOLOGIQUE"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListeAvalider;
