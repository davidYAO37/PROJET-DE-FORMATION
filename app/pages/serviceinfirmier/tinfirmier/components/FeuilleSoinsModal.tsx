'use client';

import React, { useEffect, useState } from 'react';
import {
  Modal, Button, Form, Row, Col, Table,
  Spinner, Badge,
} from 'react-bootstrap';
import { FaNotesMedical, FaSave, FaHistory } from 'react-icons/fa';

interface FeuilleSoinsModalProps {
  show: boolean;
  onHide: () => void;
  patientId: string;
  patientNom?: string;
  patientPrenoms?: string;
  codeDossier?: string;
}

interface Soin {
  _id: string;
  TypeSoin: string;
  Description?: string;
  DateSoin?: string;
  Heure?: string;
  InfirmierNom?: string;
  createdAt?: string;
}

const TYPES_SOINS = [
  'Pansement simple',
  'Pansement chirurgical',
  'Injection IM (intramusculaire)',
  'Injection IV (intraveineuse)',
  'Perfusion',
  'Pose de sonde urinaire',
  'Pose de sonde naso-gastrique',
  'Aspiration trachéale',
  'Surveillance post-opératoire',
  'Soins de nursing',
  'Administration de médicament oral',
  'Prise de constantes',
  'Prélèvement sanguin',
  'Nettoyage plaie / cicatrice',
  'Autre',
];

export default function FeuilleSoinsModal({
  show, onHide, patientId, patientNom, patientPrenoms, codeDossier,
}: FeuilleSoinsModalProps) {
  const [typeSoin, setTypeSoin]         = useState('');
  const [description, setDescription]   = useState('');
  const [loading, setLoading]           = useState(false);
  const [historique, setHistorique]     = useState<Soin[]>([]);
  const [loadingHist, setLoadingHist]   = useState(false);
  const [activeTab, setActiveTab]       = useState<'saisie' | 'historique'>('saisie');

  const nomInfirmier = typeof window !== 'undefined'
    ? localStorage.getItem('nom_utilisateur') || 'Infirmier'
    : 'Infirmier';

  useEffect(() => {
    if (show && patientId) chargerHistorique();
  }, [show, patientId]);

  const chargerHistorique = async () => {
    setLoadingHist(true);
    try {
      const res = await fetch(`/api/feuillesoins?patientId=${patientId}`);
      if (res.ok) setHistorique(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHist(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const now = new Date();
      const payload = {
        Patient:      patientId,
        Code_dossier: codeDossier,
        DateSoin:     now.toISOString(),
        Heure:        now.toTimeString().slice(0, 5),
        TypeSoin:     typeSoin,
        Description:  description,
        InfirmierNom: nomInfirmier,
      };
      const res = await fetch('/api/feuillesoins', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      if (res.ok) {
        setTypeSoin('');
        setDescription('');
        await chargerHistorique();
        setActiveTab('historique');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton className="bg-warning">
        <Modal.Title>
          <FaNotesMedical className="me-2" />
          Feuille de Soins — {patientNom} {patientPrenoms}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="d-flex mb-3 gap-2">
          <Button
            variant={activeTab === 'saisie' ? 'warning' : 'outline-warning'}
            size="sm"
            onClick={() => setActiveTab('saisie')}
          >
            Nouveau soin
          </Button>
          <Button
            variant={activeTab === 'historique' ? 'secondary' : 'outline-secondary'}
            size="sm"
            onClick={() => setActiveTab('historique')}
          >
            <FaHistory className="me-1" />
            Historique
            {historique.length > 0 && (
              <Badge bg="light" text="dark" className="ms-2">{historique.length}</Badge>
            )}
          </Button>
        </div>

        {activeTab === 'saisie' && (
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Type de soin <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    value={typeSoin}
                    onChange={(e) => setTypeSoin(e.target.value)}
                    required
                  >
                    <option value="">-- Sélectionner --</option>
                    {TYPES_SOINS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Description / Observations</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Détails du soin effectué, état de la plaie, réaction du patient..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Form.Group>
            <div className="text-end">
              <Button variant="secondary" onClick={onHide} className="me-2">Fermer</Button>
              <Button variant="warning" type="submit" disabled={loading}>
                {loading ? (
                  <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Enregistrement...</>
                ) : (
                  <><FaSave className="me-2" />Enregistrer</>
                )}
              </Button>
            </div>
          </Form>
        )}

        {activeTab === 'historique' && (
          <>
            {loadingHist ? (
              <div className="text-center py-4"><Spinner animation="border" /></div>
            ) : historique.length === 0 ? (
              <p className="text-center text-muted py-4">Aucun soin enregistré pour ce patient.</p>
            ) : (
              <div className="table-responsive">
                <Table bordered hover size="sm" className="text-center">
                  <thead className="table-warning">
                    <tr>
                      <th>Date</th>
                      <th>Heure</th>
                      <th>Type de soin</th>
                      <th>Description</th>
                      <th>Infirmier(e)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historique.map((s) => (
                      <tr key={s._id}>
                        <td>{formatDate(s.DateSoin || s.createdAt)}</td>
                        <td>{s.Heure || '—'}</td>
                        <td><Badge bg="warning" text="dark">{s.TypeSoin}</Badge></td>
                        <td className="text-start">{s.Description || '—'}</td>
                        <td>{s.InfirmierNom || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
            <div className="text-end mt-2">
              <Button variant="secondary" onClick={onHide}>Fermer</Button>
            </div>
          </>
        )}
      </Modal.Body>
    </Modal>
  );
}
