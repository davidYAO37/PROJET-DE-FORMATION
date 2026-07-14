'use client';

import React, { useEffect, useState } from 'react';
import { Button, Table, Container, Form, InputGroup, Row, Col, Pagination, Spinner } from 'react-bootstrap';
import { FaPlus, FaArrowDown, FaWallet, FaSearch } from 'react-icons/fa';
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

const ITEMS_PER_PAGE = 10;

export default function ComptePatientPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showFiche, setShowFiche] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/patients');
      if (!res.ok) throw new Error('Erreur de chargement');
      const data = await res.json();
      setPatients(data);
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
    <Container className="py-4">
      <Row className="mb-3 align-items-center">
        <Col xs={12} md={6}>
          <h2 className="d-flex align-items-center gap-2">
            <FaWallet /> Gestion du compte patient
          </h2>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col xs={12} md={6}>
          <InputGroup>
            <InputGroup.Text><FaSearch /></InputGroup.Text>
            <Form.Control
              placeholder="Rechercher par patient, contact ou n° dossier..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </InputGroup>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p>Chargement des patients...</p>
        </div>
      ) : (
        <div className="table-responsive">
          <Table bordered hover className="text-center align-middle">
            <thead className="table-primary">
              <tr>
                <th>Patient</th>
                <th>Montant en cours</th>
                <th>Contact</th>
                <th>N° dossier</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPatients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted">
                    Aucun patient trouvé.
                  </td>
                </tr>
              ) : (
                paginatedPatients.map((patient) => (
                  <tr key={patient._id}>
                    <td className="text-start fw-semibold">
                      {patient.Nom} {patient.Prenoms}
                    </td>
                    <td className="fw-bold text-primary">
                      {(patient.ProvisionClient || 0).toLocaleString()} F CFA
                    </td>
                    <td>{patient.Contact || '-'}</td>
                    <td>{patient.Code_dossier || '-'}</td>
                    <td>
                      <Button
                        variant="success"
                        size="sm"
                        className="me-2"
                        title="Nouveau paiement / remboursement"
                        onClick={() => handleOpenFiche(patient)}
                      >
                        <FaPlus />
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        title="Voir le détail et imprimer"
                        onClick={() => handleOpenDetail(patient)}
                      >
                        <FaArrowDown />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-3">
          <Pagination>
            <Pagination.Prev onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} />
            <Pagination.Next onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} />
          </Pagination>
        </div>
      )}

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
