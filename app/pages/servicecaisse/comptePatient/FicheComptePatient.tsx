'use client';

import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, Row, Col, Spinner, InputGroup } from 'react-bootstrap';
import { FaWallet, FaMoneyBillWave, FaUndo, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

interface Patient {
  _id?: string;
  Nom?: string;
  Prenoms?: string;
  Contact?: string;
  Code_dossier?: string;
  ProvisionClient?: number;
}

interface FicheComptePatientProps {
  show: boolean;
  onHide: () => void;
  patient: Patient | null;
  onSaved?: () => void;
}

const modesPaiement = ['ESPECE', 'CARTE', 'CHEQUE', 'MOBILE'];

export default function FicheComptePatient({ show, onHide, patient, onSaved }: FicheComptePatientProps) {
  const [type, setType] = useState<'Paiement' | 'Remboursement'>('Paiement');
  const [montant, setMontant] = useState('');
  const [dateAjout, setDateAjout] = useState(new Date().toISOString().split('T')[0]);
  const [recuDe, setRecuDe] = useState('');
  const [recuPar, setRecuPar] = useState('');
  const [motif, setMotif] = useState('');
  const [modePaiement, setModePaiement] = useState('ESPECE');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show) {
      setType('Paiement');
      setMontant('');
      setDateAjout(new Date().toISOString().split('T')[0]);
      setRecuDe('');
      setRecuPar(typeof window !== 'undefined' ? localStorage.getItem('nom_utilisateur') || '' : '');
      setMotif('');
      setModePaiement('ESPECE');
    }
  }, [show]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient?._id) return;

    if (!montant || Number(montant) <= 0) {
      alert('Ce montant ne peut pas être pris en compte');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/comptePatient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          IDPARTIENT: patient._id,
          MontantClient: Number(montant),
          TypeCompte: type,
          ModePaiement: modePaiement,
          DateAjout: new Date(dateAjout).toISOString(),
          RecuDe: recuDe,
          RecuPar: recuPar,
          MotifCompte: motif,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert('Mouvement enregistré avec succès');
        onSaved?.();
        onHide();
      } else {
        alert(data.error || 'Erreur lors de l\'enregistrement');
      }
    } catch (err) {
      console.error(err);
      alert('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const isPaiement = type === 'Paiement';
  const currentProvision = patient?.ProvisionClient || 0;
  const montantValue = Number(montant) || 0;
  const delta = isPaiement ? montantValue : -montantValue;
  const projectedProvision = currentProvision + delta;
  const isSoldeInsuffisant = !isPaiement && montantValue > currentProvision;

  const labels = isPaiement
    ? {
        title: 'Paiement',
        date: 'Reçu le',
        recuDe: 'Paiement reçu de',
        recuDePlaceholder: 'Nom de la personne ayant payé',
        recuPar: 'Reçu par',
        recuParPlaceholder: 'Caissier / Utilisateur',
        modePaiement: 'Mode de paiement',
        motif: 'Motif du paiement',
        motifPlaceholder: 'Motif du paiement (facultatif)',
        impact: 'augmente',
        impactColor: 'text-success',
        summaryTitle: 'Résumé du paiement',
      }
    : {
        title: 'Remboursement',
        date: 'Remboursé le',
        recuDe: 'Remboursé à',
        recuDePlaceholder: 'Nom de la personne remboursée',
        recuPar: 'Remboursé par',
        recuParPlaceholder: 'Caissier / Utilisateur',
        modePaiement: 'Mode de remboursement',
        motif: 'Motif du remboursement',
        motifPlaceholder: 'Motif du remboursement (facultatif)',
        impact: 'diminue',
        impactColor: 'text-danger',
        summaryTitle: 'Résumé du remboursement',
      };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered backdrop="static">
      <Modal.Header closeButton className={isPaiement ? 'bg-success text-white' : 'bg-danger text-white'}>
        <Modal.Title className="d-flex align-items-center gap-2">
          <FaWallet />
          {labels.title} - {patient?.Nom} {patient?.Prenoms}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {/* Solde actuel + prévisionnel */}
          <div className="card border-0 shadow-sm mb-4" style={{ background: '#f8f9fa' }}>
            <div className="card-body p-3">
              <div className="row g-3 align-items-center">
                <div className="col-md-6">
                  <div className="text-muted small">Solde actuel</div>
                  <div className="fw-bold fs-5 text-primary">{currentProvision.toLocaleString()} F CFA</div>
                </div>
                <div className="col-md-6 text-md-end">
                  <div className="text-muted small">Nouveau solde prévisionnel</div>
                  <div className={`fw-bold fs-5 ${projectedProvision < 0 ? 'text-danger' : 'text-primary'}`}>
                    {projectedProvision.toLocaleString()} F CFA
                  </div>
                </div>
              </div>
              {montantValue > 0 && (
                <div className="mt-2 small">
                  Cette opération <span className={`fw-bold ${labels.impactColor}`}>{labels.impact}</span> le solde de{' '}
                  <span className="fw-bold">{montantValue.toLocaleString()} F CFA</span>
                </div>
              )}
              {isSoldeInsuffisant && (
                <div className="alert alert-warning d-flex align-items-center gap-2 mt-3 mb-0 py-2">
                  <FaExclamationTriangle />
                  <small>Le montant du remboursement dépasse le solde actuel du patient.</small>
                </div>
              )}
            </div>
          </div>

          {/* Sélecteur de type */}
          <div className="mb-4">
            <Form.Label className="fw-semibold">Type d'opération</Form.Label>
            <div className="d-flex gap-3">
              <button
                type="button"
                onClick={() => setType('Paiement')}
                className={`btn flex-fill d-flex align-items-center justify-content-center gap-2 py-2 ${
                  isPaiement ? 'btn-success' : 'btn-outline-success'
                }`}
              >
                <FaMoneyBillWave />
                Paiement
              </button>
              <button
                type="button"
                onClick={() => setType('Remboursement')}
                className={`btn flex-fill d-flex align-items-center justify-content-center gap-2 py-2 ${
                  !isPaiement ? 'btn-danger' : 'btn-outline-danger'
                }`}
              >
                <FaUndo />
                Remboursement
              </button>
            </div>
          </div>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Montant</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="number"
                    min={1}
                    value={montant}
                    onChange={(e) => setMontant(e.target.value)}
                    placeholder="0"
                    required
                    className={isPaiement ? 'border-success' : 'border-danger'}
                  />
                  <InputGroup.Text>F CFA</InputGroup.Text>
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">{labels.date}</Form.Label>
                <Form.Control
                  type="date"
                  value={dateAjout}
                  onChange={(e) => setDateAjout(e.target.value)}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">{labels.recuDe}</Form.Label>
                <Form.Control
                  value={recuDe}
                  onChange={(e) => setRecuDe(e.target.value)}
                  placeholder={labels.recuDePlaceholder}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">{labels.recuPar}</Form.Label>
                <Form.Control
                  value={recuPar}
                  onChange={(e) => setRecuPar(e.target.value)}
                  placeholder={labels.recuParPlaceholder}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">{labels.modePaiement}</Form.Label>
            <Form.Select value={modePaiement} onChange={(e) => setModePaiement(e.target.value)}>
              {modesPaiement.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">{labels.motif}</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder={labels.motifPlaceholder}
            />
          </Form.Group>

          {/* Résumé */}
          {montantValue > 0 && (
            <div className="card border-0 shadow-sm mt-4" style={{ background: isPaiement ? '#f0fff4' : '#fff5f5' }}>
              <div className="card-body p-3">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <FaInfoCircle className={isPaiement ? 'text-success' : 'text-danger'} />
                  <span className="fw-semibold">{labels.summaryTitle}</span>
                </div>
                <div className="row small">
                  <div className="col-6">
                    <span className="text-muted">Type :</span> <span className="fw-semibold">{labels.title}</span>
                  </div>
                  <div className="col-6 text-end">
                    <span className="text-muted">Montant :</span>{' '}
                    <span className={`fw-semibold ${labels.impactColor}`}>{montantValue.toLocaleString()} F CFA</span>
                  </div>
                </div>
                <div className="row small mt-1">
                  <div className="col-6">
                    <span className="text-muted">Date :</span> <span className="fw-semibold">{dateAjout}</span>
                  </div>
                  <div className="col-6 text-end">
                    <span className="text-muted">Nouveau solde :</span>{' '}
                    <span className={`fw-semibold ${projectedProvision < 0 ? 'text-danger' : ''}`}>
                      {projectedProvision.toLocaleString()} F CFA
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Annuler
          </Button>
          <Button
            variant={isPaiement ? 'success' : 'danger'}
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Traitement...
              </>
            ) : (
              <>
                <FaWallet className="me-2" />
                Valider {isPaiement ? 'le paiement' : 'le remboursement'}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
