'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Alert, Button, Form, Modal, Table } from 'react-bootstrap';
import { useEntreprise } from '@/hooks/useEntreprise';
import { createPrintWindow, createPrintWindowWithoutHeader, generatePrintHeader, generatePrintFooter } from '@/utils/printRecu';

const emptyForm = { dateDeces: '', heureDeces: '', lieuDeces: '', medecin: '', numeroOrdre: '', lieuEtablissement: '', observations: '' };
type Fields = typeof emptyForm;
type Certificate = Fields & {
  _id: string; statut: 'brouillon' | 'valide'; patientNom: string; patientPrenoms?: string;
  patientNumeroDossier?: string; patientDateNaissance?: string; patientSexe?: string; dateValidation?: string;
};
const labels: Record<keyof Fields, string> = {
  dateDeces: 'Date du décès', heureDeces: 'Heure du décès', lieuDeces: 'Lieu du décès',
  medecin: 'Médecin certificateur', numeroOrdre: 'Numéro d’inscription à l’Ordre',
  lieuEtablissement: 'Lieu d’établissement du certificat', observations: 'Observations (facultatives, sans cause médicale confidentielle)',
};
const escapeHtml = (value?: string) => (value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
const formatDate = (value?: string) => value ? new Date(value).toLocaleDateString('fr-FR') : '—';

export default function CertificatDecesModal({ show, onHide, patientId, patientNom, patientPrenoms }: {
  show: boolean; onHide: () => void; patientId: string; patientNom?: string; patientPrenoms?: string;
}) {
  const { entreprise } = useEntreprise();
  const [certificats, setCertificats] = useState<Certificate[]>([]);
  const [form, setForm] = useState<Fields>(emptyForm);
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const response = await fetch(`/api/certificatDeces?patientId=${encodeURIComponent(patientId)}`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Chargement impossible');
    setCertificats(result.data);
  }

  useEffect(() => {
    if (!show) return;
    setForm({ ...emptyForm, medecin: localStorage.getItem('nom_utilisateur') || '' });
    setEditing(null);
    setError('');
    setCertificats([]);
    load().catch(error => setError(error.message));
  }, [show, patientId]);

  async function save(event: FormEvent, statut: 'brouillon' | 'valide') {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/certificatDeces', {
        method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, patientId, _id: editing, statut }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Enregistrement impossible');
      setEditing(null);
      setForm(emptyForm);
      await load();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Enregistrement impossible');
    } finally { setBusy(false); }
  }

  function print(certificat: Certificate, header: boolean) {
    const content = `<h1 style="text-align:center">CERTIFICAT DE DÉCÈS</h1>
      <p>Référence : ${escapeHtml(certificat._id)}</p>
      ${certificat.statut !== 'valide' ? '<h2 style="text-align:center">BROUILLON — NON VALIDÉ</h2>' : ''}
      <p>Je soussigné(e), Docteur ${escapeHtml(certificat.medecin)}, ${certificat.numeroOrdre ? `inscrit(e) à l’Ordre sous le numéro ${escapeHtml(certificat.numeroOrdre)},` : ''} certifie avoir personnellement constaté le décès de :</p>
      <p><strong>${escapeHtml(certificat.patientNom)} ${escapeHtml(certificat.patientPrenoms)}</strong></p>
      <p>Né(e) le : ${formatDate(certificat.patientDateNaissance)} — Sexe : ${escapeHtml(certificat.patientSexe) || '—'}</p>
      <p>Numéro de dossier : ${escapeHtml(certificat.patientNumeroDossier) || '—'}</p>
      <p>Décès survenu le <strong>${formatDate(certificat.dateDeces)}</strong> à <strong>${escapeHtml(certificat.heureDeces)}</strong>, à <strong>${escapeHtml(certificat.lieuDeces)}</strong>.</p>
      ${certificat.observations ? `<p>Observations : ${escapeHtml(certificat.observations).replace(/\n/g, '<br>')}</p>` : ''}
      <p>Certificat établi à ${escapeHtml(certificat.lieuEtablissement)}${certificat.dateValidation ? `, le ${formatDate(certificat.dateValidation)}` : ''}.</p>
      <p style="margin-top:50px;text-align:right">Signature et cachet du médecin</p>`;
    if (header) createPrintWindow('Certificat de décès', generatePrintHeader(entreprise), content, generatePrintFooter(entreprise));
    else createPrintWindowWithoutHeader('Certificat de décès', content);
  }

  return <Modal show={show} onHide={onHide} size="lg" centered>
    <Modal.Header closeButton><Modal.Title>Certificats de décès — {patientNom} {patientPrenoms}</Modal.Title></Modal.Header>
    <Modal.Body>
      {error && <Alert variant="danger">{error}</Alert>}
      <Alert variant="info">À compléter et valider par le médecin ayant constaté le décès. Un certificat validé n’est plus modifiable. L’impression doit être signée et cachetée par le médecin.</Alert>
      <Table responsive>
        <thead><tr><th>Date du décès</th><th>Médecin</th><th>Statut</th><th>Actions</th></tr></thead>
        <tbody>{certificats.map(certificat => <tr key={certificat._id}>
          <td>{formatDate(certificat.dateDeces)} {certificat.heureDeces}</td><td>{certificat.medecin}</td><td>{certificat.statut === 'valide' ? 'Validé' : 'Brouillon'}</td>
          <td className="d-flex flex-wrap gap-2">
            {certificat.statut === 'brouillon' && <Button size="sm" onClick={() => { setForm(Object.fromEntries(Object.keys(emptyForm).map(key => [key, certificat[key as keyof Fields] || ''])) as Fields); setEditing(certificat._id); }}>Modifier</Button>}
            <Button size="sm" variant="outline-success" onClick={() => print(certificat, true)}>Imprimer avec en-tête</Button>
            <Button size="sm" variant="outline-secondary" onClick={() => print(certificat, false)}>Sans en-tête</Button>
          </td>
        </tr>)}{!certificats.length && <tr><td colSpan={4}>Aucun certificat enregistré.</td></tr>}</tbody>
      </Table>
      <h5>{editing ? 'Modifier le brouillon' : 'Nouveau certificat'}</h5>
      <Form onSubmit={event => save(event, 'brouillon')}>
        {(Object.keys(emptyForm) as (keyof Fields)[]).map(key => <Form.Group className="mb-3" key={key} controlId={`deces-${key}`}>
          <Form.Label>{labels[key]}</Form.Label>
          <Form.Control as={key === 'observations' ? 'textarea' : 'input'} type={key === 'dateDeces' ? 'date' : key === 'heureDeces' ? 'time' : 'text'} required={!['observations', 'numeroOrdre'].includes(key)} maxLength={5000} value={form[key]} onChange={event => setForm({ ...form, [key]: event.target.value })} />
        </Form.Group>)}
        <div className="d-flex gap-2">
          <Button type="submit" disabled={busy}>Enregistrer le brouillon</Button>
          <Button variant="success" disabled={busy} onClick={event => {
            const form = event.currentTarget.closest('form');
            if (form?.reportValidity() && confirm('Confirmez-vous avoir constaté le décès et vouloir valider définitivement ce certificat ?')) void save(event, 'valide');
          }}>Enregistrer et valider</Button>
          {editing && <Button variant="secondary" onClick={() => { setEditing(null); setForm(emptyForm); }}>Nouveau</Button>}
        </div>
      </Form>
    </Modal.Body>
  </Modal>;
}
