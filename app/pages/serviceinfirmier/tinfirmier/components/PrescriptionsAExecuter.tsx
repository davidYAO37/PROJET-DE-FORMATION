'use client';

import React, { useEffect, useState } from 'react';
import {
  Container, Row, Col, Table, Form, InputGroup,
  Spinner, Badge, Button, Pagination, Toast, ToastContainer,
} from 'react-bootstrap';
import { FaPills, FaCheckCircle } from 'react-icons/fa';

const ITEMS_PER_PAGE = 12;

interface Prescription {
  _id: string;
  PatientP?: string;
  IdPatient?: string;
  Code_dossier?: string;
  nomMedicament?: string;
  posologie?: string;
  QteP?: number;
  DatePres?: string;
  StatutPrescriptionMedecin?: number;
  administre?: boolean;
  administreLe?: string;
  administrePar?: string;
}

export default function PrescriptionsAExecuter() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading]             = useState(true);
  const [searchTerm, setSearchTerm]       = useState('');
  const [currentPage, setCurrentPage]     = useState(1);
  const [filter, setFilter]               = useState<'toutes' | 'aFaire' | 'faites'>('aFaire');

  const [toastMsg, setToastMsg]       = useState('');
  const [showToast, setShowToast]     = useState(false);
  const [loadingId, setLoadingId]     = useState<string | null>(null);

  const nomInfirmier = typeof window !== 'undefined'
    ? localStorage.getItem('nom_utilisateur') || 'Infirmier'
    : 'Infirmier';

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/patientprescription');
      if (res.ok) {
        const data = await res.json();
        setPrescriptions(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erreur prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdministrer = async (presc: Prescription) => {
    setLoadingId(presc._id);
    try {
      const res = await fetch(`/api/patientprescription/${presc._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          administre:    true,
          administreLe:  new Date().toISOString(),
          administrePar: nomInfirmier,
          StatutPrescriptionMedecin: 1,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPrescriptions((prev) => prev.map((p) => (p._id === presc._id ? { ...p, ...updated } : p)));
        setToastMsg(`✅ "${presc.nomMedicament}" marqué comme administré`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (error) {
      console.error('Erreur marquage:', error);
    } finally {
      setLoadingId(null);
    }
  };

  const formatDate = (d?: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const filtered = prescriptions
    .filter((p) => {
      if (filter === 'aFaire') return !p.administre && p.StatutPrescriptionMedecin !== 1;
      if (filter === 'faites') return p.administre || p.StatutPrescriptionMedecin === 1;
      return true;
    })
    .filter((p) =>
      p.PatientP?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nomMedicament?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.Code_dossier?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const nbAFaire = prescriptions.filter((p) => !p.administre && p.StatutPrescriptionMedecin !== 1).length;

  return (
    <Container className="py-4">
      <Row className="mb-3 align-items-center">
        <Col>
          <h2>
            <FaPills className="me-2 text-success" />
            Prescriptions à Exécuter
            {nbAFaire > 0 && <Badge bg="danger" className="ms-3">{nbAFaire} à faire</Badge>}
          </h2>
        </Col>
      </Row>

      <Row className="mb-3 g-2">
        <Col md={5}>
          <InputGroup>
            <Form.Control
              placeholder="Rechercher par patient, médicament, code dossier..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </InputGroup>
        </Col>
        <Col md={4}>
          <div className="d-flex gap-2">
            {(['aFaire', 'faites', 'toutes'] as const).map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? 'primary' : 'outline-secondary'}
                onClick={() => { setFilter(f); setCurrentPage(1); }}
              >
                {f === 'aFaire' ? 'À administrer' : f === 'faites' ? 'Administrées' : 'Toutes'}
              </Button>
            ))}
          </div>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" /></div>
      ) : (
        <div className="table-responsive">
          <Table bordered hover className="text-center">
            <thead className="table-success">
              <tr>
                <th>#</th>
                <th>Patient</th>
                <th>Code Dossier</th>
                <th>Médicament</th>
                <th>Posologie</th>
                <th>Qté</th>
                <th>Date prescription</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={9} className="text-muted">Aucune prescription trouvée.</td></tr>
              ) : (
                paginated.map((p, idx) => {
                  const estFait = p.administre || p.StatutPrescriptionMedecin === 1;
                  return (
                    <tr key={p._id} className={estFait ? 'table-light text-muted' : ''}>
                      <td>{idx + 1 + (currentPage - 1) * ITEMS_PER_PAGE}</td>
                      <td className="fw-bold">{p.PatientP || '—'}</td>
                      <td><Badge bg="secondary">{p.Code_dossier || '—'}</Badge></td>
                      <td>{p.nomMedicament || '—'}</td>
                      <td>{p.posologie || '—'}</td>
                      <td>{p.QteP ?? '—'}</td>
                      <td>{formatDate(p.DatePres)}</td>
                      <td>
                        {estFait ? (
                          <Badge bg="success">
                            <FaCheckCircle className="me-1" />Administré
                          </Badge>
                        ) : (
                          <Badge bg="warning" text="dark">En attente</Badge>
                        )}
                      </td>
                      <td>
                        {!estFait && (
                          <Button
                            variant="success"
                            size="sm"
                            disabled={loadingId === p._id}
                            onClick={() => handleAdministrer(p)}
                          >
                            {loadingId === p._id ? (
                              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            ) : (
                              <><FaCheckCircle className="me-1" />Administré</>
                            )}
                          </Button>
                        )}
                        {estFait && p.administreLe && (
                          <small className="text-muted d-block">{formatDate(p.administreLe)}</small>
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

      <ToastContainer position="bottom-end" className="p-3">
        <Toast show={showToast} onClose={() => setShowToast(false)} bg="success" delay={3000} autohide>
          <Toast.Body className="text-white">{toastMsg}</Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  );
}
