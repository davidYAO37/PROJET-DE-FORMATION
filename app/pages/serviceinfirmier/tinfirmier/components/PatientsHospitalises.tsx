'use client';

import React, { useEffect, useState } from 'react';
import {
  Container, Row, Col, Table, Form, InputGroup,
  Spinner, Badge, Button, Pagination,
} from 'react-bootstrap';
import { FaHospital, FaHeartbeat, FaClipboard, FaPrescription, FaSignOutAlt } from 'react-icons/fa';
import { Modal, Alert } from 'react-bootstrap';
import ConstantesVitalesModal from './ConstantesVitalesModal';
import ExamenHospitModalInfirmier from './ExamenHospitModalInfirmier';
import PharmacieModalInfirmier from './PharmacieModalInfirmier';
import PrescriptionsAExecuter from './PrescriptionsAExecuter';

const ITEMS_PER_PAGE = 10;

interface Hospit {
  _id: string;
  PatientP?: string;           // Nom du patient
  CodePrestation?: string;     // Code prestation consultation
  Code_dossier?: string;       // Code dossier patient
  IdPatient?: any;             // ID patient (peut être ObjectId)
  Chambre?: string;            // Chambre du patient
  Entrele?: string;            // Date d'entrée
  SortieLe?: string;           // Date de sortie (null si encore hospitalisé)
  nombreDeJours?: number;      // Nombre de jours
  NomMed?: string;             // Nom du médecin
  ObservationHospitalisation?: string; // Observation
  Designationtypeacte?: string; // Type d'acte d'hospitalisation
  hospitalisationId?: string;  // ID de l'hospitalisation liée
  // Champs peuplés depuis les populations
  patientInfo?: {
    Nom?: string;
    Prenoms?: string;
    Code_dossier?: string;
  };
  medecinInfo?: {
    nom?: string;
  };
}

export default function PatientsHospitalises() {
  const [hospits, setHospits]           = useState<Hospit[]>([]);
  const [loading, setLoading]           = useState(true);
  const [searchTerm, setSearchTerm]     = useState('');
  const [currentPage, setCurrentPage]   = useState(1);

  const [selectedHospit, setSelectedHospit]       = useState<Hospit | null>(null);
  const [showConstantes, setShowConstantes]        = useState(false);
  const [showActes, setShowActes] = useState(false);
  const [showPharmacie, setShowPharmacie] = useState(false);
  const [showPrescriptions, setShowPrescriptions] = useState(false);
  const [showSortieModal, setShowSortieModal] = useState(false);
  const [sortieLoading, setSortieLoading] = useState(false);
  const [sortieError, setSortieError] = useState('');
  const [sortieSuccess, setSortieSuccess] = useState('');
  const [sortieData, setSortieData] = useState({
    dateSortie: new Date().toISOString().split('T')[0],
    heureSortie: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    observations: '',
  });

  useEffect(() => {
    const fetchHospits = async () => {
      try {
        // 🏥 Nouvelle approche : ExamenHospitalisation avec Designationtypeacte dans TypeActe.Hospitalisation=true
        const res = await fetch('/api/examenhospitalisation/hospitalises');
        if (res.ok) {
          const data = await res.json();
          const hospitalisations = Array.isArray(data) ? data : [];
          setHospits(hospitalisations);
        }
      } catch (error) {
        console.error('Erreur chargement hospitalisés:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHospits();
  }, []);

  const fetchHospits = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/examenhospitalisation/hospitalises');
      if (res.ok) {
        const data = await res.json();
        setHospits(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erreur chargement hospitalisés:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSortie = async () => {
    if (!selectedHospit?._id) {
      setSortieError('Aucune hospitalisation liée à cet enregistrement.');
      return;
    }
    setSortieLoading(true);
    setSortieError('');
    try {
      const res = await fetch(`/api/hospitalisations/${selectedHospit._id}/sortie`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sortieData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Échec de la sortie');
      setSortieSuccess(`Sortie enregistrée pour ${selectedHospit.PatientP || 'le patient'}`);
      setShowSortieModal(false);
      // Rafraîchir la liste
      await fetchHospits();
      setTimeout(() => setSortieSuccess(''), 5000);
    } catch (err) {
      setSortieError(err instanceof Error ? err.message : 'Erreur lors de la sortie');
    } finally {
      setSortieLoading(false);
    }
  };

  const formatDate = (d?: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR');
  };

  

  

  const filtered = hospits.filter((h) => {
    const patientName = h.PatientP || 
      (h.patientInfo ? `${h.patientInfo.Nom} ${h.patientInfo.Prenoms}` : '') || '';
    const codeDossier = h.Code_dossier || h.patientInfo?.Code_dossier || '';
    const chambre = h.Chambre || '';
    const typeActe = h.Designationtypeacte || '';
    
    return patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           codeDossier.toLowerCase().includes(searchTerm.toLowerCase()) ||
           chambre.toLowerCase().includes(searchTerm.toLowerCase()) ||
           typeActe.toLowerCase().includes(searchTerm.toLowerCase()) ||
           h.CodePrestation?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <Container className="py-4">
      <Row className="mb-3 align-items-center">
        <Col>
          <h2>
            <FaHospital className="me-2 text-info" />
            Patients Hospitalisés
            <Badge bg="info" className="ms-3">{hospits.length}</Badge>
          </h2>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={5}>
          <InputGroup>
            <Form.Control
              placeholder="Rechercher par nom, code dossier, chambre..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </InputGroup>
        </Col>
      </Row>

      {sortieSuccess && <Alert variant="success" dismissible onClose={() => setSortieSuccess('')}>{sortieSuccess}</Alert>}

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" /> Chargement...</div>
      ) : (
        <div className="table-responsive">
          <Table bordered hover className="text-center">
            <thead className="table-info">
              <tr>
                <th>#</th>
                <th>Patient</th>
                <th>Code Prestation</th>
                <th>Chambre / Lit</th>
                <th>Entrée le</th>
                <th>Durée</th>
                <th>Médecin</th>
                <th>Service</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={9} className="text-muted">Aucun patient hospitalisé en cours.</td></tr>
              ) : (
                paginated.map((h, idx) => {
                  const patientName = h.PatientP || 
                    (h.patientInfo ? `${h.patientInfo.Nom} ${h.patientInfo.Prenoms}` : '') || '—';
                  const codeDossier = h.Code_dossier || h.patientInfo?.Code_dossier || '—';
                  const medecinName = h.NomMed || h.medecinInfo?.nom || '—';
                  
                  return (
                    <tr key={h._id}>
                      <td>{idx + 1 + (currentPage - 1) * ITEMS_PER_PAGE}</td>
                      <td
                        className="fw-bold text-primary"
                        style={{ cursor: 'pointer' }}
                        title="Voir les prescriptions"
                        onClick={() => { setSelectedHospit(h); setShowPrescriptions(true); }}
                      >{patientName}</td>
                      <td><Badge bg="secondary">{h.CodePrestation || '—'}</Badge></td>
                      <td><Badge bg="success">{h.Chambre || '—'}</Badge></td>
                      <td>{formatDate(h.Entrele)}</td>
                      <td>
                        <Badge bg="warning" text="dark">{h.nombreDeJours}</Badge>
                      </td>
                      <td>{medecinName}</td>
                      <td className="text-start" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <div>
                          <Badge bg="info" className="mb-1">{h.Designationtypeacte || '—'}</Badge>
                          <br />
                          <small>{h.ObservationHospitalisation || '—'}</small>
                        </div>
                      </td>
                      <td>
                        <Button
                          variant="outline-info"
                          size="sm"
                          className="me-1"
                          title="Saisir constantes vitales"
                          onClick={() => { setSelectedHospit(h); setShowConstantes(true); }}
                        >
                          <FaHeartbeat />
                        </Button>
                        {/* Saisir les actes ExamenHospitModalInfirmier */}
                        <Button
                          variant="outline-success"
                          size="sm"
                          className="me-1"
                          title="Saisir actes médicaux"
                          onClick={() => { setSelectedHospit(h); setShowActes(true); }}
                        >
                          <FaClipboard />
                        </Button>
                        {/* Saisir les actes PharmacieModalInfirmier */}
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-1"
                          title="Saisir médicaments"
                          onClick={() => { setSelectedHospit(h); setShowPharmacie(true); }}
                        >
                          <FaPrescription />
                        </Button>
                        {h._id && (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            title="Sortie du patient"
                            onClick={() => {
                              setSelectedHospit(h);
                              setSortieData({
                                dateSortie: new Date().toISOString().split('T')[0],
                                heureSortie: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                                observations: '',
                              });
                              setSortieError('');
                              setShowSortieModal(true);
                            }}
                          >
                            <FaSignOutAlt />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-3">
          <Pagination>
            <Pagination.Prev disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>Précédent</Pagination.Prev>
            <Pagination.Next disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>Suivant</Pagination.Next>
          </Pagination>
        </div>
      )}

      {selectedHospit && (
        <ConstantesVitalesModal
          show={showConstantes}
          onHide={() => setShowConstantes(false)}
          patientId={
            typeof selectedHospit.IdPatient === 'string'
              ? selectedHospit.IdPatient
              : selectedHospit.IdPatient?._id?.toString() || ''
          }
          patientNom={selectedHospit.PatientP || selectedHospit.patientInfo?.Nom || selectedHospit.IdPatient?.Nom || ''}
          patientPrenoms={selectedHospit.patientInfo?.Prenoms || selectedHospit.IdPatient?.Prenoms || ''}
          codeDossier={selectedHospit.Code_dossier || selectedHospit.patientInfo?.Code_dossier || selectedHospit.IdPatient?.Code_dossier || ''}
          codePrestation={selectedHospit.CodePrestation || ''}
          hospitalisationId={selectedHospit._id}
          selectedHospit={selectedHospit}
        />
      )}

      {selectedHospit && (
        <ExamenHospitModalInfirmier
          show={showActes}
          onHide={() => setShowActes(false)}
          CodePrestation={selectedHospit.CodePrestation || ''}
          Designationtypeacte={selectedHospit.Designationtypeacte || ''}
          examenHospitId={selectedHospit._id}
          PatientP={selectedHospit.PatientP || ''}
          onSuccess={() => {
            setShowActes(false);
          }}
        />
      )}

      {selectedHospit && (
        <PharmacieModalInfirmier
          show={showPharmacie}
          onHide={() => setShowPharmacie(false)}
          codePrestation={selectedHospit.CodePrestation || ''}
        />
      )}

      {/* Modal Prescriptions à exécuter */}
      {selectedHospit && (
        <Modal show={showPrescriptions} onHide={() => setShowPrescriptions(false)} size="xl" centered>
          <Modal.Header closeButton className="bg-success text-white">
            <Modal.Title>
              <FaPrescription className="me-2" />
              Prescriptions - {selectedHospit.PatientP || selectedHospit.patientInfo?.Nom || ''}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <PrescriptionsAExecuter codePrestation={selectedHospit.CodePrestation || ''} />
          </Modal.Body>
        </Modal>
      )}
      {/* Modal de confirmation de sortie */}
      <Modal show={showSortieModal} onHide={() => setShowSortieModal(false)} centered>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>
            <FaSignOutAlt className="me-2" />
            Sortie du patient
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {sortieError && <Alert variant="danger">{sortieError}</Alert>}
          <p className="fw-bold mb-3">
            Confirmer la sortie de <span className="text-primary">{selectedHospit?.PatientP || '—'}</span> ?
          </p>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">Date de sortie</Form.Label>
                <Form.Control
                  type="date"
                  value={sortieData.dateSortie}
                  onChange={(e) => setSortieData(prev => ({ ...prev, dateSortie: e.target.value }))}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">Heure de sortie</Form.Label>
                <Form.Control
                  type="time"
                  value={sortieData.heureSortie}
                  onChange={(e) => setSortieData(prev => ({ ...prev, heureSortie: e.target.value }))}
                />
              </Form.Group>
            </Col>
          </Row>
          <Form.Group>
            <Form.Label className="fw-semibold">Observations</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              placeholder="Observations de sortie..."
              value={sortieData.observations}
              onChange={(e) => setSortieData(prev => ({ ...prev, observations: e.target.value }))}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSortieModal(false)} disabled={sortieLoading}>
            Annuler
          </Button>
          <Button variant="danger" onClick={handleSortie} disabled={sortieLoading}>
            {sortieLoading ? 'Sortie en cours...' : 'Confirmer la sortie'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
