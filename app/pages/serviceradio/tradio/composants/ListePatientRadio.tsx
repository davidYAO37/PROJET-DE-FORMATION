"use client";
import { useState, useEffect } from "react";
import { Table, Button, Spinner, Alert, Form, Row, Col } from "react-bootstrap";
import { FaEye, FaCalendarAlt, FaUser, FaPhone, FaSearch } from "react-icons/fa";
import { ILignePrestation } from "@/models/lignePrestation";
import { IPatient } from "@/models/patient";

interface Props {
  onPatientSelect: (patient: IPatient) => void;
}

const ListePatientRadio: React.FC<Props> = ({ onPatientSelect }) => {
  const [patients, setPatients] = useState<IPatient[]>([]);
  const [lignePrestations, setLignePrestations] = useState<ILignePrestation[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<IPatient | null>(null);
  const [patientPrestations, setPatientPrestations] = useState<ILignePrestation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  // Charger les patients (sans lignes de prestations au départ)
  const loadPatients = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (dateDebut) params.append("dateDebut", dateDebut);
      if (dateFin) params.append("dateFin", dateFin);
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(`/api/compteRenduRadio/tPatientsRadio?${params}`);
      if (!response.ok) throw new Error("Erreur lors du chargement des patients");
      
      const data = await response.json();
      setPatients(data.patients || []);
      setLignePrestations(data.lignePrestations || []);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  // Charger les lignes de prestations pour un patient spécifique (logique WinDev)
  const loadPatientPrestations = async (patientId: string) => {
    try {
      const params = new URLSearchParams();
      if (dateDebut) params.append("dateDebut", dateDebut);
      if (dateFin) params.append("dateFin", dateFin);
      params.append("patientId", patientId);

      const response = await fetch(`/api/compteRenduRadio/patientPrestations?${params}`);
      if (!response.ok) throw new Error("Erreur lors du chargement des prestations du patient");
      
      const data = await response.json();
      return data.lignePrestations || [];
    } catch (err: any) {
      console.error("Erreur lors du chargement des prestations du patient:", err);
      return [];
    }
  };

  useEffect(() => {
    loadPatients();
  }, [dateDebut, dateFin, searchTerm]);

  // Gérer la sélection d'un patient (logique WinDev exacte)
  const handlePatientSelect = async (patient: IPatient) => {
    setSelectedPatient(patient);
    
    // TableSupprimeTout(TABLE_LIGNE_PRESTATION_patient) - Vider le tableau
    setPatientPrestations([]);
    
    // Charger les prestations du patient sélectionné avec la logique WinDev
    const prestations = await loadPatientPrestations(patient._id.toString());
    
    // Trier par date (TableTrie(TABLE_LIGNE_PRESTATION,"+COL_Date"))
    const sortedPrestations = prestations.sort((a: any, b: any) => 
      new Date(a.Date_ligne_prestaion || a.dateLignePrestation).getTime() - new Date(b.Date_ligne_prestaion || b.dateLignePrestation).getTime()
    );
    
    setPatientPrestations(sortedPrestations);
    onPatientSelect(patient);
  };

  // Formater la date
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR');
  };

  // Calculer l'âge du patient
  const calculateAge = (dateNaissance: Date | string) => {
    const today = new Date();
    const birthDate = new Date(dateNaissance);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  return (
    <div>
      {/* Filtres */}
      <div className="mb-4">
        <Row>
          <Col md={4}>
            <Form.Group>
              <Form.Label><FaSearch className="me-2" />Recherche</Form.Label>
              <Form.Control
                type="text"
                placeholder="Nom, prénom ou dossier N°..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Form.Group>
          </Col>
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
          <Col md={2}>
            <Form.Group className="d-flex align-items-end">
              <Button variant="primary" onClick={loadPatients} disabled={loading}>
                {loading ? <Spinner size="sm" /> : <FaSearch />}
              </Button>
            </Form.Group>
          </Col>
        </Row>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Tableau des patients */}
      <div className="mb-4">
        <h5><FaUser className="me-2" />Liste des Patients</h5>
        <Table striped bordered hover responsive>
          <thead className="table-primary">
            <tr>
              <th>Patient</th>
              <th>Contact</th>
              <th>Âge</th>
              <th>Dossier N°</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center">
                  <Spinner animation="border" />
                </td>
              </tr>
            ) : patients.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center">
                  Aucun patient trouvé
                </td>
              </tr>
            ) : (
              patients.map((patient) => (
                <tr 
                  key={patient._id.toString()}
                  className={selectedPatient?._id === patient._id ? "table-active" : ""}
                  style={{ cursor: "pointer" }}
                  onClick={() => handlePatientSelect(patient)}
                >
                  <td>
                    <strong>{patient.Nom} {patient.Prenoms}</strong>
                  </td>
                  <td>
                    <FaPhone className="me-1" />
                    {patient.Contact || "N/A"}
                  </td>
                  <td>{calculateAge(patient.Date_naisse)} ans</td>
                  <td>
                    <strong>{patient.Code_dossier}</strong>
                  </td>
                  <td>
                    <Button
                      size="sm"
                      variant={selectedPatient?._id === patient._id ? "primary" : "outline-primary"}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePatientSelect(patient);
                      }}
                    >
                      <FaEye />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      {/* Tableau des lignes de prestations du patient sélectionné */}
      {selectedPatient && (
        <div>
          <h5>
            <FaCalendarAlt className="me-2" />
            Prestations de {selectedPatient.Nom} {selectedPatient.Prenoms}
          </h5>
          <Table striped bordered hover responsive>
            <thead className="table-success">
              <tr>
                <th>Date prestation</th>
                <th>Prestation</th>
                <th>Médecin exécutant</th>
                <th>Saisie par</th>
                <th>Saisie le</th>
                <th>Validé par</th>
                <th>Validé le</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {patientPrestations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center">
                    Aucune prestation trouvée pour ce patient
                  </td>
                </tr>
              ) : (
                patientPrestations
                  .sort((a: any, b: any) => new Date(a.Date_ligne_prestaion || a.dateLignePrestation).getTime() - new Date(b.Date_ligne_prestaion || b.dateLignePrestation).getTime())
                  .map((ligne: any, index: number) => (
                    <tr key={ligne.IDLIGNE_PRESTATION?.toString() || index}>
                      <td>{formatDate(ligne.Date_ligne_prestaion || ligne.dateLignePrestation)}</td>
                      <td>
                        <strong>{ligne.Prestation || ligne.prestation}</strong>
                        <br />
                        <small className="text-muted">Lettre clé: {ligne.lettreCle}</small>
                      </td>
                      <td>{ligne.MedecinExécutant || ligne.medecinExecutant || "N/A"}</td>
                      <td>{ligne.Résultatsaisiepar || ligne.resultatSaisiePar || "N/A"}</td>
                      <td>
                        {ligne.DatesaisieResultat || ligne.dateSaisieResultat ? formatDate(ligne.DatesaisieResultat || ligne.dateSaisieResultat) : "N/A"}
                      </td>
                      <td>{ligne.CompterenduValidépar || ligne.compteRenduValidePar || "N/A"}</td>
                      <td>
                        {ligne.compterenduValidéLe || ligne.compteRenduValideLe ? formatDate(ligne.compterenduValidéLe || ligne.compteRenduValideLe) : "N/A"}
                      </td>
                      <td>
                        <Button size="sm" variant="outline-info">
                          <FaEye />
                        </Button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default ListePatientRadio;