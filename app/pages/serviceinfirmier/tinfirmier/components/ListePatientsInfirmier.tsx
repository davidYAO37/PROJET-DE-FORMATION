'use client';

import React, { useEffect, useState } from 'react';
import {
  Button, Table, Container, Form, InputGroup,
  Row, Col, Pagination, Spinner,
} from 'react-bootstrap';
import { FaBed } from 'react-icons/fa';
import { Patient } from '@/types/patient';
import HospitalisationsPatientModal from './HospitalisationsPatientModal';

const ITEMS_PER_PAGE = 10;

export default function ListePatientsInfirmier() {
  const [patients, setPatients]               = useState<Patient[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState<string | null>(null);
  const [searchTerm, setSearchTerm]           = useState('');
  const [currentPage, setCurrentPage]         = useState(1);

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showHospitalisations, setShowHospitalisations] = useState(false);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await fetch('/api/patients');
        if (!res.ok) throw new Error('Erreur de chargement');
        const data = await res.json();
        setPatients(data);
      } catch {
        setError('Impossible de charger les patients');
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const handleHospitalisations = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowHospitalisations(true);
  };

  const filteredPatients = patients.filter((p) =>
    p.Nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.Prenoms?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.Code_dossier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.Contact?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages    = Math.ceil(filteredPatients.length / ITEMS_PER_PAGE);
  const paginated     = filteredPatients.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <Container className="py-4">
      <Row className="mb-3 align-items-center">
        <Col><h2>Liste des Patients</h2></Col>
      </Row>

      <Row className="mb-3">
        <Col xs={12} md={6}>
          <InputGroup>
            <Form.Control
              placeholder="Rechercher par nom, prénoms ou code dossier..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </InputGroup>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center"><Spinner animation="border" /> Chargement...</div>
      ) : error ? (
        <div className="text-danger text-center">{error}</div>
      ) : (
        <div className="table-responsive">
          <Table bordered hover className="text-center">
            <thead className="table-info">
              <tr>
                <th>#</th>
                <th>Nom</th>
                <th>Prénoms</th>
                <th>Âge</th>
                <th>Sexe</th>
                <th>Contact</th>
                <th>Code Dossier</th>
                <th>Actions Infirmier</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center">Aucun patient trouvé.</td>
                </tr>
              ) : (
                paginated.map((patient, index) => (
                  <tr key={patient._id}>
                    <td>{index + 1 + (currentPage - 1) * ITEMS_PER_PAGE}</td>
                    <td>{patient.Nom}</td>
                    <td>{patient.Prenoms}</td>
                    <td>{patient.Age_partient}</td>
                    <td>{patient.sexe}</td>
                    <td>{patient.Contact}</td>
                    <td>{patient.Code_dossier}</td>
                    <td className="bg-info bg-opacity-10">
                      <div className="d-flex flex-wrap gap-1">
                        <Button
                          variant="outline-info"
                          size="sm"
                          title="Hospitalisations"
                          onClick={() => handleHospitalisations(patient)}
                        >
                          <FaBed className="me-1" />
                          Hospitalisations
                        </Button>
                      </div>
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
            <Pagination.Prev onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
              Précédent
            </Pagination.Prev>
            <Pagination.Next onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>
              Suivant
            </Pagination.Next>
          </Pagination>
        </div>
      )}

      {selectedPatient && (
        <HospitalisationsPatientModal
          show={showHospitalisations}
          onHide={() => setShowHospitalisations(false)}
          patientId={selectedPatient._id?.toString() || ''}
          patientNom={selectedPatient.Nom}
          patientPrenoms={selectedPatient.Prenoms}
        />
      )}
    </Container>
  );
}
