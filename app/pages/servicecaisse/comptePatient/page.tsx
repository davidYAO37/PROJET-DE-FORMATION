'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Container, Form, InputGroup, Row, Col, Pagination, Spinner, Table } from 'react-bootstrap';
import { FaArrowDown, FaArrowUp, FaChartLine, FaPlus, FaSearch, FaUsers, FaWallet } from 'react-icons/fa';
import FicheComptePatient from './FicheComptePatient';
import DetailComptePatientModal from './DetailComptePatientModal';

interface Patient {
  _id: string;
  Nom: string;
  Prenoms: string;
  Contact?: string;
  Code_dossier?: string;
  ProvisionClient?: number;
}

interface ComptePatient {
  _id: string;
  DateAjout?: string;
  MontantClient?: number;
  TypeCompte?: 'Paiement' | 'Remboursement';
}

const ITEMS_PER_PAGE = 10;

export default function ComptePatientPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [mouvements, setMouvements] = useState<ComptePatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showFiche, setShowFiche] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const [patientsResponse, mouvementsResponse] = await Promise.all([
        fetch('/api/patients', { cache: 'no-store' }),
        fetch('/api/comptePatient', { cache: 'no-store' }),
      ]);
      if (!patientsResponse.ok || !mouvementsResponse.ok) throw new Error('Erreur de chargement');
      const [patientsData, mouvementsData] = await Promise.all([
        patientsResponse.json(),
        mouvementsResponse.json(),
      ]);
      setPatients(Array.isArray(patientsData) ? patientsData : []);
      setMouvements(Array.isArray(mouvementsData.data) ? mouvementsData.data : []);
    } catch (err) {
      console.error(err);
      alert('Impossible de charger les patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const filteredPatients = patients.filter((p) =>
    `${p.Nom} ${p.Prenoms}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.Contact?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.Code_dossier?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statistiques = useMemo(() => {
    const totalProvision = patients.reduce((total, patient) => total + (Number(patient.ProvisionClient) || 0), 0);
    const totalPaiements = mouvements
      .filter((mouvement) => mouvement.TypeCompte === 'Paiement')
      .reduce((total, mouvement) => total + Math.abs(Number(mouvement.MontantClient) || 0), 0);
    const totalRemboursements = mouvements
      .filter((mouvement) => mouvement.TypeCompte === 'Remboursement')
      .reduce((total, mouvement) => total + Math.abs(Number(mouvement.MontantClient) || 0), 0);

    return { totalProvision, totalPaiements, totalRemboursements };
  }, [mouvements, patients]);

  const totalPages = Math.ceil(filteredPatients.length / ITEMS_PER_PAGE);
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleOpenFiche = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowFiche(true);
  };

  const handleOpenDetail = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowDetail(true);
  };

  return (
    <Container fluid className="py-4 px-lg-4">
      <Card className="border-0 shadow-sm mb-4 overflow-hidden" style={{ background: 'linear-gradient(120deg, #0f4c81, #0a8fbd)' }}>
        <Card.Body className="p-4 p-lg-5 text-white">
          <Row className="align-items-center g-3">
            <Col>
              <div className="d-flex align-items-center gap-3">
                <div className="rounded-circle d-flex align-items-center justify-content-center bg-white bg-opacity-25" style={{ width: 54, height: 54 }}>
                  <FaWallet size={25} />
                </div>
                <div>
                  <h2 className="mb-1 fw-bold">Gestion du compte patient</h2>
                  <p className="mb-0 opacity-75">Suivez les provisions, paiements et remboursements de vos patients.</p>
                </div>
              </div>
            </Col>
            <Col xs="auto">
              <Button variant="light" className="rounded-pill px-4 fw-semibold" onClick={loadPatients}>
                <FaChartLine className="me-2" /> Actualiser
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row className="g-3 mb-4">
        <Col md={6} xl={3}>
          <Card className="border-0 shadow-sm h-100"><Card.Body className="d-flex align-items-center gap-3">
            <div className="rounded-3 bg-primary bg-opacity-10 text-primary p-3"><FaUsers size={22} /></div>
            <div><div className="text-muted small">Patients suivis</div><div className="fs-4 fw-bold">{patients.length}</div></div>
          </Card.Body></Card>
        </Col>
        <Col md={6} xl={3}>
          <Card className="border-0 shadow-sm h-100"><Card.Body className="d-flex align-items-center gap-3">
            <div className="rounded-3 bg-success bg-opacity-10 text-success p-3"><FaWallet size={22} /></div>
            <div><div className="text-muted small">Solde des comptes</div><div className="fs-5 fw-bold text-success">{statistiques.totalProvision.toLocaleString()} FCFA</div></div>
          </Card.Body></Card>
        </Col>
        <Col md={6} xl={3}>
          <Card className="border-0 shadow-sm h-100"><Card.Body className="d-flex align-items-center gap-3">
            <div className="rounded-3 bg-info bg-opacity-10 text-info p-3"><FaArrowDown size={22} /></div>
            <div><div className="text-muted small">Paiements enregistrés</div><div className="fs-5 fw-bold text-info">{statistiques.totalPaiements.toLocaleString()} FCFA</div></div>
          </Card.Body></Card>
        </Col>
        <Col md={6} xl={3}>
          <Card className="border-0 shadow-sm h-100"><Card.Body className="d-flex align-items-center gap-3">
            <div className="rounded-3 bg-danger bg-opacity-10 text-danger p-3"><FaArrowUp size={22} /></div>
            <div><div className="text-muted small">Remboursements</div><div className="fs-5 fw-bold text-danger">{statistiques.totalRemboursements.toLocaleString()} FCFA</div></div>
          </Card.Body></Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white border-0 pt-4 px-4 d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
          <div><h5 className="mb-1 fw-bold">Comptes patients</h5><span className="text-muted small">Recherchez un patient puis enregistrez un mouvement ou consultez son historique.</span></div>
          <InputGroup style={{ maxWidth: 430 }}>
            <InputGroup.Text className="bg-white"><FaSearch /></InputGroup.Text>
            <Form.Control
              placeholder="Patient, contact ou n° dossier..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </InputGroup>
        </Card.Header>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /><p className="text-muted mt-3 mb-0">Chargement des comptes patients...</p></div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0 align-middle">
                <thead className="table-light">
                  <tr><th className="ps-4">Patient</th><th>Solde disponible</th><th>Contact</th><th>N° dossier</th><th className="text-center pe-4">Actions</th></tr>
                </thead>
                <tbody>
                  {paginatedPatients.length === 0 ? (
                    <tr><td colSpan={5} className="text-center text-muted py-5">Aucun patient trouvé.</td></tr>
                  ) : paginatedPatients.map((patient) => (
                    <tr key={patient._id}>
                      <td className="ps-4"><div className="fw-semibold">{patient.Nom} {patient.Prenoms}</div><small className="text-muted">Compte patient</small></td>
                      <td><span className="fw-bold text-success">{(patient.ProvisionClient || 0).toLocaleString()} FCFA</span></td>
                      <td>{patient.Contact || '-'}</td>
                      <td><code>{patient.Code_dossier || '-'}</code></td>
                      <td className="text-center pe-4">
                        <Button variant="outline-success" size="sm" className="me-2" title="Ajouter un paiement ou remboursement" onClick={() => handleOpenFiche(patient)}><FaPlus className="me-1" /> Mouvement</Button>
                        <Button variant="outline-primary" size="sm" title="Voir l'historique" onClick={() => handleOpenDetail(patient)}><FaArrowDown className="me-1" /> Historique</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
        {totalPages > 1 && <Card.Footer className="bg-white border-0 d-flex justify-content-center py-3"><Pagination className="mb-0"><Pagination.Prev onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))} disabled={currentPage === 1} /><Pagination.Item active>{currentPage}</Pagination.Item><Pagination.Next onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))} disabled={currentPage === totalPages} /></Pagination></Card.Footer>}
      </Card>

      <FicheComptePatient
        show={showFiche}
        onHide={() => setShowFiche(false)}
        patient={selectedPatient}
        onSaved={loadPatients}
      />

      <DetailComptePatientModal
        show={showDetail}
        onHide={() => setShowDetail(false)}
        patient={selectedPatient}
      />
    </Container>
  );
}
