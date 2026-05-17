"use client";
import { useState, useEffect } from "react";
import { Table, Button, Spinner, Alert, Form, Row, Col, Badge } from "react-bootstrap";
import { FaEdit, FaCalendarAlt, FaUser, FaClock, FaCheckCircle, FaSearch, FaFilter } from "react-icons/fa";
import { ILignePrestation } from "@/models/lignePrestation";
import { IPatient } from "@/models/patient";
import SaisieCRModal from "./SaisieCRModal";

interface Props {
  onLigneSelect: (ligne: ILignePrestation, patient: IPatient) => void;
}

const ListeAvalider: React.FC<Props> = ({ onLigneSelect }) => {
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

  // Obtenir les informations du patient pour une ligne de prestation
  const getPatientInfo = (ligne: any): any => {
    // Debug : afficher les IDs pour comprendre le problème
    console.log('Recherche patient pour:', {
      ligneIdPatient: ligne.IdPatient,
      ligneIdPatientType: typeof ligne.IdPatient,
      ligneIdPatientString: ligne.IdPatient?.toString(),
      availablePatients: patients.map(p => ({
        id: p._id,
        idString: p._id.toString(),
        nom: p.Nom
      }))
    });
    
    // Essayer différentes façons de trouver le patient
    let patient: any = null;
    
    // 1. Correspondance directe avec IdPatient (peut être ObjectId ou string)
    if (ligne.IdPatient) {
      patient = patients.find(p => {
        const ligneIdStr = ligne.IdPatient.toString();
        const patientIdStr = p._id.toString();
        console.log('Comparaison:', ligneIdStr, '===', patientIdStr, ligneIdStr === patientIdStr);
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
    
    console.log('Patient trouvé:', patient ? patient.Nom : 'NON');
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

  // Obtenir le statut de la ligne
  const getStatutBadge = (ligne: any) => {
    if (ligne.CompterenduValidépar) {
      return <Badge bg="success"><FaCheckCircle className="me-1" />Validé</Badge>;
    } else if (ligne.Résultatsaisiepar) {
      return <Badge bg="warning"><FaClock className="me-1" />En attente de validation</Badge>;
    } else {
      return <Badge bg="danger"><FaEdit className="me-1" />À saisir</Badge>;
    }
  };

  return (
    <div>
      {/* Filtres */}
      <div className="mb-4">
        <h5><FaFilter className="me-2" />Filtres</h5>
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
              <th>Lettre clé</th>
              <th>Médecin exécutant</th>
              <th>Saisie par</th>
              <th>Saisie le</th>
              <th>Validé par</th>
              <th>Validé le</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={13} className="text-center">
                  <Spinner animation="border" />
                </td>
              </tr>
            ) : lignePrestations.length === 0 ? (
              <tr>
                <td colSpan={13} className="text-center">
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
                        {ligne.ActeMedecin && (
                          <small className="d-block text-muted">Acte: {ligne.ActeMedecin}</small>
                        )}
                      </td>
                      <td>
                        <Badge bg="info">{ligne.lettreCle}</Badge>
                      </td>
                      <td>{ligne.MedecinExécutant || "N/A"}</td>
                      <td>{ligne.Résultatsaisiepar || "N/A"}</td>
                      <td>
                        {ligne.DatesaisieResultat ? formatDateTime(ligne.DatesaisieResultat) : "N/A"}
                      </td>
                      <td>{ligne.CompterenduValidépar || "N/A"}</td>
                      <td>
                        {ligne.compterenduValidéLe ? formatDateTime(ligne.compterenduValidéLe) : "N/A"}
                      </td>
                      <td>{getStatutBadge(ligne)}</td>
                      <td>
                        <Button
                          size="sm"
                          variant={ligne.Résultatsaisiepar ? "outline-warning" : "outline-primary"}
                          onClick={() => handleOpenSaisieCRModal(ligne)}
                        >
                          {ligne.Résultatsaisiepar ? <FaClock /> : <FaEdit />}
                        </Button>
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
                  {lignePrestations.filter((l: any) => !l.Résultatsaisiepar).length}
                </h3>
              </div>
            </div>
          </Col>
          <Col md={4}>
            <div className="card border-warning">
              <div className="card-body text-center">
                <h6 className="card-title text-warning">En attente de validation</h6>
                <h3 className="text-warning">
                  {lignePrestations.filter((l: any) => l.Résultatsaisiepar && !l.CompterenduValidépar).length}
                </h3>
              </div>
            </div>
          </Col>
          <Col md={4}>
            <div className="card border-success">
              <div className="card-body text-center">
                <h6 className="card-title text-success">Validés</h6>
                <h3 className="text-success">
                  {lignePrestations.filter((l: any) => l.CompterenduValidépar).length}
                </h3>
              </div>
            </div>
          </Col>
        </Row>
      </div>

      {/* Modal de saisie de compte rendu */}
      <SaisieCRModal
        show={showSaisieCRModal}
        onHide={handleCloseSaisieCRModal}
        ligne={selectedLigneForCR}
        patient={selectedPatientForCR}
        utilisateur="Utilisateur" // À remplacer avec l'utilisateur connecté
        onSuccess={handleSaisieCRSuccess}
      />
    </div>
  );
};

export default ListeAvalider;