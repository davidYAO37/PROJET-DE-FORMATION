'use client';

import React, { useEffect, useState } from 'react';
import { Modal, Button, Table, Spinner, Badge } from 'react-bootstrap';
import { FaMoneyBillWave, FaUndo, FaPrint, FaArrowDown } from 'react-icons/fa';
import { generateRecuComptePatientHTML } from './RecuComptePatient';
import { useEntreprise } from '@/hooks/useEntreprise';
import { createPrintWindow, generatePrintHeader, generatePrintFooter } from '@/utils/printRecu';

interface Patient {
  _id?: string;
  Nom?: string;
  Prenoms?: string;
  Contact?: string;
  Code_dossier?: string;
  ProvisionClient?: number;
}

interface ComptePatient {
  _id?: string;
  DateAjout?: string | Date;
  MontantClient?: number;
  TypeCompte?: 'Paiement' | 'Remboursement';
  ModePaiement?: string;
  RecuDe?: string;
  RecuPar?: string;
  MotifCompte?: string;
}

interface DetailComptePatientModalProps {
  show: boolean;
  onHide: () => void;
  patient: Patient | null;
}

export default function DetailComptePatientModal({ show, onHide, patient }: DetailComptePatientModalProps) {
  const [comptes, setComptes] = useState<ComptePatient[]>([]);
  const [loading, setLoading] = useState(false);
  const { entreprise } = useEntreprise();

  useEffect(() => {
    if (show && patient?._id) {
      loadComptes();
    }
  }, [show, patient]);

  const loadComptes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/comptePatient?IDPARTIENT=${patient?._id}`);
      const data = await res.json();
      setComptes(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintRecu = (compte: ComptePatient) => {
    const content = generateRecuComptePatientHTML(compte as any);
    createPrintWindow(
      'Reçu compte patient',
      generatePrintHeader(entreprise),
      content,
      generatePrintFooter(entreprise)
    );
  };

  const handlePrintListe = () => {
    const rows = comptes.map((c, i) => `
      <tr>
        <td style="border:1px solid #000;padding:6px;text-align:center;">${i + 1}</td>
        <td style="border:1px solid #000;padding:6px;">${new Date(c.DateAjout || '').toLocaleDateString()}</td>
        <td style="border:1px solid #000;padding:6px;">${c.TypeCompte}</td>
        <td style="border:1px solid #000;padding:6px;text-align:right;">${Math.abs(c.MontantClient || 0).toLocaleString()} FCFA</td>
        <td style="border:1px solid #000;padding:6px;">${c.RecuDe || '-'}</td>
        <td style="border:1px solid #000;padding:6px;">${c.MotifCompte || '-'}</td>
      </tr>
    `).join('');

    const content = `
      <div class="print-area" style="font-family:Arial,sans-serif;font-size:13px;">
        <h3 style="text-align:center;color:#00AEEF;">DÉTAIL DES PAIEMENTS ET REMBOURSEMENTS</h3>
        <div style="margin-bottom:15px;">
          <strong>Patient :</strong> ${patient?.Nom} ${patient?.Prenoms}<br>
          <strong>N° Dossier :</strong> ${patient?.Code_dossier || '-'}<br>
          <strong>Contact :</strong> ${patient?.Contact || '-'}<br>
          <strong>Montant en cours :</strong> ${(patient?.ProvisionClient || 0).toLocaleString()} FCFA
        </div>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr>
              <th style="border:1px solid #000;padding:6px;background:#f0f0f0;">#</th>
              <th style="border:1px solid #000;padding:6px;background:#f0f0f0;">Date</th>
              <th style="border:1px solid #000;padding:6px;background:#f0f0f0;">Type</th>
              <th style="border:1px solid #000;padding:6px;background:#f0f0f0;">Montant</th>
              <th style="border:1px solid #000;padding:6px;background:#f0f0f0;">Reçu de</th>
              <th style="border:1px solid #000;padding:6px;background:#f0f0f0;">Motif</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;

    createPrintWindow(
      'Détail compte patient',
      generatePrintHeader(entreprise),
      content,
      generatePrintFooter(entreprise)
    );
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered scrollable>
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title className="d-flex align-items-center gap-2">
          <FaArrowDown />
          Détail du compte - {patient?.Nom} {patient?.Prenoms}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="alert alert-light border mb-3 d-flex justify-content-between align-items-center">
          <div>
            <strong>Montant en cours :</strong>{' '}
            <span className="fw-bold text-primary">{(patient?.ProvisionClient || 0).toLocaleString()} F CFA</span>
          </div>
          <Button variant="outline-primary" size="sm" onClick={handlePrintListe}>
            <FaPrint className="me-1" /> Imprimer la liste
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : comptes.length === 0 ? (
          <div className="text-center text-muted py-4">
            Aucun mouvement enregistré.
          </div>
        ) : (
          <div className="table-responsive">
            <Table bordered hover size="sm">
              <thead className="table-light">
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Montant</th>
                  <th>Reçu de</th>
                  <th>Reçu par</th>
                  <th>Mode</th>
                  <th>Motif</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {comptes.map((compte) => (
                  <tr key={compte._id}>
                    <td>{compte.DateAjout ? new Date(compte.DateAjout).toLocaleDateString() : '-'}</td>
                    <td>
                      <Badge bg={compte.TypeCompte === 'Paiement' ? 'success' : 'danger'}>
                        {compte.TypeCompte === 'Paiement' ? <FaMoneyBillWave className="me-1" /> : <FaUndo className="me-1" />}
                        {compte.TypeCompte}
                      </Badge>
                    </td>
                    <td className="text-end fw-bold">
                      {Math.abs(compte.MontantClient || 0).toLocaleString()} FCFA
                    </td>
                    <td>{compte.RecuDe || '-'}</td>
                    <td>{compte.RecuPar || '-'}</td>
                    <td>{compte.ModePaiement || '-'}</td>
                    <td>{compte.MotifCompte || '-'}</td>
                    <td className="text-center">
                      <Button
                        variant={compte.TypeCompte === 'Paiement' ? 'outline-success' : 'outline-danger'}
                        size="sm"
                        onClick={() => handlePrintRecu(compte)}
                      >
                        <FaPrint className="me-1" /> Reçu
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Fermer
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
