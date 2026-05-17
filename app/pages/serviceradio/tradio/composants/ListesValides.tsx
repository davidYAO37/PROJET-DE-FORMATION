"use client";
import { useState, useEffect } from "react";
import { Table, Button, Spinner, Alert, Form, Row, Col, Badge } from "react-bootstrap";
import { FaEdit, FaCalendarAlt, FaUser, FaClock, FaCheckCircle, FaSearch, FaFilter } from "react-icons/fa";
import { ILignePrestation } from "@/models/lignePrestation";
import { IPatient } from "@/models/patient";

// Interface pour les données WinDev retournées par l'API
interface LignePrestationWinDev {
  Date_ligne_prestaion: Date | string;
  Nompatient?: string;
  IDHOSPITALISATION?: string;
  IDLIGNE_PRESTATION: string | any;
  Prestation: string;
  MedecinExécutant?: string;
  Résultatsaisiepar?: string;
  DatesaisieResultat?: Date | string;
  compterenduValidéLe?: Date | string;
  CompterenduValidépar?: string;
  ActeMedecin?: string;
  lettreCle?: string;
  CodePrestation?: string;
  idActe?: string;
  IdPatient?: string | any;
  statutPrescriptionMedecin?: number;
}

interface Props {
  onLigneSelect: (ligne: ILignePrestation, patient: IPatient) => void;
}

const ListesValides: React.FC<Props> = ({ onLigneSelect }) => {
  const [lignePrestations, setLignePrestations] = useState<ILignePrestation[]>([]);
  const [patients, setPatients] = useState<IPatient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [lettreCleFilter, setLettreCleFilter] = useState("");
  const [lettreClesDisponibles, setLettreClesDisponibles] = useState<string[]>([]);

  // Charger les lignes de prestations validées
  const loadLignesValides = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (dateDebut) params.append("dateDebut", dateDebut);
      if (dateFin) params.append("dateFin", dateFin);
      if (lettreCleFilter) params.append("lettreCle", lettreCleFilter);

      const response = await fetch(`/api/compteRenduRadio/CompteRenduValides?${params}`);
      if (!response.ok) throw new Error("Erreur lors du chargement des prestations validées");
      
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
    loadLignesValides();
  }, [dateDebut, dateFin, lettreCleFilter]);

  // Obtenir les informations du patient pour une ligne de prestation
  const getPatientInfo = (ligne: any) => {
    return patients.find(p => p._id.toString() === ligne.IdPatient?.toString());
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

  // Gérer la sélection d'une ligne pour consulter/modifier le compte rendu validé
  const handleLigneSelect = (ligne: any) => {
    const patient = getPatientInfo(ligne);
    if (patient) {
      onLigneSelect(ligne, patient);
    }
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
              <Button variant="primary" onClick={loadLignesValides} disabled={loading}>
                {loading ? <Spinner size="sm" /> : <FaSearch />}
              </Button>
            </Form.Group>
          </Col>
        </Row>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Tableau des lignes de prestations validées */}
      <div>
        <h5><FaCheckCircle className="me-2" />Compte Rendus Validés</h5>
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
                  Aucun compte rendu validé trouvé
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
                          variant="outline-info"
                          onClick={() => handleLigneSelect(ligne)}
                          disabled={!patient}
                          title="Consulter le compte rendu validé"
                        >
                          <FaCheckCircle />
                        </Button>
                      </td>
                    </tr>
                  );
                })
            )}
          </tbody>
        </Table>
      </div>

      {/* Statistiques - Comptes rendus validés */}
      <div className="mt-4">
        <Row>
          <Col md={6}>
            <div className="card border-success">
              <div className="card-body text-center">
                <h6 className="card-title text-success">
                  <FaCheckCircle className="me-2" />
                  Comptes rendus validés
                </h6>
                <h3 className="text-success">
                  {lignePrestations.filter((l: any) => l.CompterenduValidépar).length}
                </h3>
              </div>
            </div>
          </Col>
          <Col md={6}>
            <div className="card border-info">
              <div className="card-body text-center">
                <h6 className="card-title text-info">
                  <FaCalendarAlt className="me-2" />
                  Période sélectionnée
                </h6>
                <h3 className="text-info">
                  {lignePrestations.length}
                </h3>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default ListesValides;