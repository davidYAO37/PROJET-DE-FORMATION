'use client';

import React, { useEffect, useState } from 'react';
import {
  Container, Row, Col, Table, Form, InputGroup,
  Spinner, Badge, Button, Pagination,
} from 'react-bootstrap';
import { FaHospital, FaHeartbeat, FaClipboard, FaPrescription } from 'react-icons/fa';
import ConstantesVitalesModal from './ConstantesVitalesModal';
import ExamenHospitModalInfirmier from './ExamenHospitModalInfirmier';
import PharmacieModalInfirmier from './PharmacieModalInfirmier';

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
                <th>Observation</th>
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
                      <td className="fw-bold">{patientName}</td>
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
    </Container>
  );
}
