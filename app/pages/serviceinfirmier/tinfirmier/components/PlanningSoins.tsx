'use client';

import React, { useEffect, useState } from 'react';
import {
  Container, Row, Col, Card, Badge, Spinner,
  Button, Alert, Form,
} from 'react-bootstrap';
import { FaCalendarCheck, FaHeartbeat, FaPills, FaNotesMedical, FaClock } from 'react-icons/fa';
import ConstantesVitalesModal from './ConstantesVitalesModal';
import FeuilleSoinsModal from './FeuilleSoinsModal';
import HospitalisationsPatientModal from './HospitalisationsPatientModal';

interface PatientItem {
  _id: string;
  PatientP?: string;
  Nom?: string;
  Prenoms?: string;
  Code_dossier?: string;
  IdPatient?: string;
  Chambre?: string;
  nbPrescriptions?: number;
  nbSoins?: number;
}

interface Hospit {
  _id: string;
  PatientP?: string;
  Code_dossier?: string;
  IdPatient?: string | { _id?: string; Nom?: string; Prenoms?: string; Code_dossier?: string };
  Chambre?: string;
  Entrele?: string;
  SortieLe?: string;
}

interface Soin {
  _id: string;
  Patient?: string;
  TypeSoin?: string;
  createdAt?: string;
}

interface Prescription {
  _id: string;
  IdPatient?: string;
  PatientP?: string;
  nomMedicament?: string;
  administre?: boolean;
  StatutPrescriptionMedecin?: number;
}

export default function PlanningSoins() {
  const [patients, setPatients]         = useState<PatientItem[]>([]);
  const [soinsJour, setSoinsJour]       = useState<Soin[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading]           = useState(true);

  const [selectedPatient, setSelectedPatient]   = useState<PatientItem | null>(null);
  const [showConstantes, setShowConstantes]     = useState(false);
  const [showSoins, setShowSoins]               = useState(false);

  const formatDateInput = (d: Date) => d.toISOString().slice(0, 10);
  const [dateDebut, setDateDebut] = useState(formatDateInput(new Date()));
  const [dateFin, setDateFin]     = useState(formatDateInput(new Date()));

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [hospRes, soinsRes, prescRes] = await Promise.all([
          fetch('/api/examenhospitalisation/hospitalises'),
          fetch('/api/feuillesoins'),
          fetch('/api/patientprescription'),
        ]);

        const hospRaw: Hospit[] = hospRes.ok ? await hospRes.json() : [];
        const soins = soinsRes.ok ? await soinsRes.json() : [];
        const presc = prescRes.ok ? await prescRes.json() : [];

        const todayStr = new Date().toDateString();
        const soinsAujourdhui = soins.filter((s: Soin) =>
          new Date(s.createdAt || '').toDateString() === todayStr
        );

        const start = new Date(dateDebut);
        start.setHours(0, 0, 0, 0);
        const end = new Date(dateFin);
        end.setHours(23, 59, 59, 999);

        const pats: PatientItem[] = hospRaw
          .filter((h) => {
            if (!h.Entrele) return false;
            const d = new Date(h.Entrele);
            return d >= start && d <= end;
          })
          .map((h) => {
            const populated = typeof h.IdPatient === 'object' ? h.IdPatient : undefined;
            const patientId = populated?._id || (typeof h.IdPatient === 'string' ? h.IdPatient : h._id);
            return {
              _id: patientId,
              PatientP: h.PatientP || populated?.Nom,
              Nom: populated?.Nom || h.PatientP,
              Prenoms: populated?.Prenoms,
              Code_dossier: h.Code_dossier || populated?.Code_dossier,
              IdPatient: patientId,
              Chambre: h.Chambre,
            };
          });

        setPatients(pats);
        setSoinsJour(soinsAujourdhui);
        setPrescriptions(presc);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [dateDebut, dateFin]);

  const prescAFaire = prescriptions.filter(
    (p) => !p.administre && p.StatutPrescriptionMedecin !== 1
  );

  const getPatientPrescriptions = (patientId: string) =>
    prescAFaire.filter((p) => p.IdPatient === patientId || p.PatientP?.includes(patientId));

  const getPatientSoins = (patientId: string) =>
    soinsJour.filter((s) => s.Patient === patientId);

  return (
    <Container className="py-4">
      <Row className="mb-4 align-items-center">
        <Col md={6}>
          <h2>
            <FaCalendarCheck className="me-2 text-primary" />
            Planning des Soins du Jour
          </h2>
          <p className="text-muted mb-0">
            <FaClock className="me-1" />
            {today}
          </p>
        </Col>
        <Col md={6}>
          <Row className="g-2">
            <Col sm={6}>
              <Form.Label className="small text-muted mb-1">Du</Form.Label>
              <Form.Control
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
              />
            </Col>
            <Col sm={6}>
              <Form.Label className="small text-muted mb-1">Au</Form.Label>
              <Form.Control
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
              />
            </Col>
          </Row>
        </Col>
      </Row>

      {/* Résumé du jour */}
      <Row className="g-3 mb-4">
        <Col md={4}>
          <Card className="border-0 shadow-sm" style={{ borderLeft: '4px solid #0dcaf0' }}>
            <Card.Body className="d-flex align-items-center gap-3">
              <FaHeartbeat size={32} className="text-info" />
              <div>
                <div className="fw-bold fs-4">{soinsJour.length}</div>
                <small className="text-muted">Soins enregistrés aujourd'hui</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm" style={{ borderLeft: '4px solid #dc3545' }}>
            <Card.Body className="d-flex align-items-center gap-3">
              <FaPills size={32} className="text-danger" />
              <div>
                <div className="fw-bold fs-4">{prescAFaire.length}</div>
                <small className="text-muted">Prescriptions à administrer</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm" style={{ borderLeft: '4px solid #198754' }}>
            <Card.Body className="d-flex align-items-center gap-3">
              <FaCalendarCheck size={32} className="text-success" />
              <div>
                <div className="fw-bold fs-4">{patients.length}</div>
                <small className="text-muted">Patients en charge</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" /></div>
      ) : patients.length === 0 ? (
        <Alert variant="info">Aucun patient trouvé.</Alert>
      ) : (
        <Row className="g-3">
          {patients.map((patient) => {
            const prescsPatient = getPatientPrescriptions(patient._id);
            const soinsPatient  = getPatientSoins(patient._id);
            const hasTodo = prescsPatient.length > 0;

            return (
              <Col md={6} xl={4} key={patient._id}>
                <Card
                  className={`h-100 shadow-sm border-0 ${hasTodo ? 'border-start border-danger border-3' : ''}`}
                  style={{ borderLeft: hasTodo ? '4px solid #dc3545' : '4px solid #dee2e6' }}
                >
                  <Card.Header className="d-flex justify-content-between align-items-center bg-light">
                    <div>
                      <span className="fw-bold">{patient.Nom || patient.PatientP} {patient.Prenoms}</span>
                      {patient.Chambre && (
                        <Badge bg="info" className="ms-2">Chambre {patient.Chambre}</Badge>
                      )}
                    </div>
                    <Badge bg="secondary" pill>{patient.Code_dossier}</Badge>
                  </Card.Header>
                  <Card.Body className="pb-2">
                    {/* Prescriptions à faire */}
                    {prescsPatient.length > 0 && (
                      <div className="mb-2">
                        <small className="text-danger fw-bold">
                          <FaPills className="me-1" />
                          {prescsPatient.length} médicament(s) à administrer
                        </small>
                        <ul className="mb-0 ps-3" style={{ fontSize: '0.82rem' }}>
                          {prescsPatient.slice(0, 3).map((p) => (
                            <li key={p._id}>{p.nomMedicament}</li>
                          ))}
                          {prescsPatient.length > 3 && (
                            <li className="text-muted">+{prescsPatient.length - 3} autres</li>
                          )}
                        </ul>
                      </div>
                    )}
                    {/* Soins du jour */}
                    {soinsPatient.length > 0 && (
                      <div className="mb-2">
                        <small className="text-success fw-bold">
                          <FaNotesMedical className="me-1" />
                          {soinsPatient.length} soin(s) fait(s) aujourd'hui
                        </small>
                      </div>
                    )}
                    {prescsPatient.length === 0 && soinsPatient.length === 0 && (
                      <small className="text-muted">Aucune tâche en attente</small>
                    )}
                  </Card.Body>
                  <Card.Footer className="bg-transparent d-flex gap-2 pt-0">
                    <Button
                      variant="outline-info"
                      size="sm"
                      className="flex-grow-1"
                      onClick={() => { setSelectedPatient(patient); setShowConstantes(true); }}
                    >
                      <FaHeartbeat className="me-1" />Constantes
                    </Button>
                    <Button
                      variant="outline-warning"
                      size="sm"
                      className="flex-grow-1"
                      onClick={() => { setSelectedPatient(patient); setShowSoins(true); }}
                    >
                      <FaNotesMedical className="me-1" />Soins
                    </Button>
                  </Card.Footer>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {selectedPatient && (
        <ConstantesVitalesModal
          show={showConstantes}
          onHide={() => setShowConstantes(false)}
          patientId={selectedPatient._id}
          patientNom={selectedPatient.Nom || selectedPatient.PatientP}
          codeDossier={selectedPatient.Code_dossier}
        />
      )}

      {selectedPatient && (
        <HospitalisationsPatientModal
          show={showSoins}
          onHide={() => setShowSoins(false)}
          patientId={selectedPatient._id}
          patientNom={selectedPatient.Nom || selectedPatient.PatientP}
          patientPrenoms={selectedPatient.Prenoms}
        />
      )}
    </Container>
  );
}
