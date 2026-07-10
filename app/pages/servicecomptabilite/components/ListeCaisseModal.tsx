'use client';
import { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Form, Table, Row, Col, Badge, Spinner, Alert } from 'react-bootstrap';
import FicheCaisseModal from './FicheCaisseModal';
import { useEntreprise } from '@/hooks/useEntreprise';
import { generatePrintHeader, generatePrintFooter, createPrintWindow } from '@/utils/printRecu';

interface ICaisseDoc {
  _id: string;
  typeC?: string;
  Operation?: string;
  MOtif?: string;
  MOntantC?: number;
  dAteC?: string;
  HeureC?: string;
  NomPrenoms?: string;
  Contact?: string;
  serviceC?: string;
  AjouterParC?: string;
  FonctionC?: string;
}

interface Props {
  show: boolean;
  onHide: () => void;
}

const fmt = (n: number) => (n || 0).toLocaleString('fr-FR');
const today = () => new Date().toISOString().split('T')[0];

// Convertir nombre en lettres (français)
function nombreEnLettres(n: number): string {
  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
    'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];

  if (n === 0) return 'zéro';
  if (n < 0) return 'moins ' + nombreEnLettres(-n);

  let result = '';

  if (n >= 1000000) {
    result += nombreEnLettres(Math.floor(n / 1000000)) + ' million' + (Math.floor(n / 1000000) > 1 ? 's' : '') + ' ';
    n %= 1000000;
  }
  if (n >= 1000) {
    const mil = Math.floor(n / 1000);
    result += (mil === 1 ? '' : nombreEnLettres(mil) + ' ') + 'mille ';
    n %= 1000;
  }
  if (n >= 100) {
    const cent = Math.floor(n / 100);
    result += (cent === 1 ? '' : units[cent] + ' ') + 'cent' + (cent > 1 && n % 100 === 0 ? 's' : '') + ' ';
    n %= 100;
  }
  if (n >= 20) {
    const t = Math.floor(n / 10);
    const u = n % 10;
    if (t === 7 || t === 9) {
      result += tens[t] + (u === 1 && t === 7 ? '-et' : '') + '-' + units[10 + u] + ' ';
    } else {
      result += tens[t] + (u === 1 && t < 8 ? '-et-' : u > 0 ? '-' : '') + (u > 0 ? units[u] : '') + ' ';
    }
  } else if (n > 0) {
    result += units[n] + ' ';
  }

  return result.trim();
}

function printBonCaisse(doc: ICaisseDoc, entreprise: any) {
  const dateFormatee = doc.dAteC
    ? new Date(doc.dAteC).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : '';
  const montant = doc.MOntantC || 0;
  const enLettres = nombreEnLettres(Math.round(montant));
  const isEntree = (doc.typeC || '').toLowerCase().includes('entrée');
  const headerHTML = generatePrintHeader(entreprise);
  const footerHTML = generatePrintFooter(entreprise);

  const contentHTML = `
    <div style="max-width:700px; margin:0 auto; font-family:Arial,sans-serif; font-size:13px;">
      <div style="text-align:right; font-weight:bold; font-size:13px; margin-bottom:8px;">
        Exemplaire Comptabilité
      </div>
      <table style="width:100%; border:none; margin-bottom:10px;">
        <tr>
          <td style="width:60%; border:none; padding:0;"></td>
          <td style="border:none; padding:4px 0;">
            <div><strong>Bon Saisi par :</strong> &nbsp; ${doc.AjouterParC || ''}</div>
            <div><strong>Montant (FCFA)</strong> &nbsp; ${fmt(montant)}</div>
            <div>Abidjan, le &nbsp; ${dateFormatee}</div>
          </td>
        </tr>
      </table>

      <div style="border-bottom:1px dotted #000; margin:8px 0; padding-bottom:4px;">
        <strong>La somme de (en lettre) :</strong>
        <span style="margin-left:8px;">${enLettres.toUpperCase()} FRANCS CFA</span>
        <span style="display:block; border-bottom:1px dotted #aaa; margin-top:4px;"></span>
      </div>

      <div style="margin: 10px 0;">
        <div style="margin-bottom:6px;">
          <strong>Opération :</strong>
          <span style="font-size:16px; font-weight:bold; margin-left:8px; color:#000;">${doc.Operation || ''}</span>
          <span style="display:block; border-bottom:1px dotted #aaa; margin-top:4px;"></span>
        </div>
        <div style="margin-bottom:6px;">
          <strong>Motif de l'opération</strong>
          <span style="font-size:15px; font-weight:bold; margin-left:8px; color:#000;">${(doc.MOtif || '').toUpperCase()}</span>
          <span style="display:block; border-bottom:1px dotted #aaa; margin-top:4px;"></span>
        </div>
        <div style="margin-bottom:6px;">
          <strong>Service :</strong>
          <span style="font-size:15px; font-weight:bold; margin-left:8px;">${(doc.serviceC || '').toUpperCase()}</span>
          <span style="display:block; border-bottom:1px dotted #aaa; margin-top:4px;"></span>
        </div>
        <div style="margin-bottom:6px;">
          <strong>Nom et Prénoms du ${isEntree ? 'bénéficiaire' : 'émetteur'} :</strong>
          <span style="font-size:15px; font-weight:bold; margin-left:8px;">${(doc.NomPrenoms || '').toUpperCase()}</span>
          <span style="display:block; border-bottom:1px dotted #aaa; margin-top:4px;"></span>
        </div>
      </div>

      <table style="width:100%; border-collapse:collapse; margin-top:16px;">
        <thead>
          <tr>
            <th style="border:1px solid #000; padding:10px; text-align:center;">Visa Directeur</th>
            <th style="border:1px solid #000; padding:10px; text-align:center;">Visa DAF</th>
            <th style="border:1px solid #000; padding:10px; text-align:center;">Visa comptable</th>
            <th style="border:1px solid #000; padding:10px; text-align:center;">Visa Bénéficiaire</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border:1px solid #000; padding:40px; text-align:center;"></td>
            <td style="border:1px solid #000; padding:40px; text-align:center;"></td>
            <td style="border:1px solid #000; padding:40px; text-align:center;"></td>
            <td style="border:1px solid #000; padding:40px; text-align:center;"></td>
          </tr>
        </tbody>
      </table>

      <div style="text-align:center; margin-top:16px; font-size:12px; font-style:italic; border-top:1px dotted #000; padding-top:6px;">
        Imprimé par : ${typeof window !== 'undefined' ? localStorage.getItem('nom_utilisateur') || '' : ''} 
        le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  `;

  createPrintWindow('Bon de Caisse', headerHTML, contentHTML, footerHTML);
}

export default function ListeCaisseModal({ show, onHide }: Props) {
  const { entreprise } = useEntreprise();
  const [entrepriseId, setEntrepriseId] = useState('');
  const [utilisateur, setUtilisateur] = useState('');

  const [docs, setDocs] = useState<ICaisseDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  const [dateDebut, setDateDebut] = useState(today());
  const [dateFin, setDateFin] = useState(today());
  const [filtreType, setFiltreType] = useState('');
  const [recherche, setRecherche] = useState('');

  const [showFiche, setShowFiche] = useState(false);
  const [caisseIdEdition, setCaisseIdEdition] = useState<string | null>(null);

  useEffect(() => {
    setEntrepriseId(localStorage.getItem('IdEntreprise') || '');
    setUtilisateur(localStorage.getItem('nom_utilisateur') || '');
  }, []);

  const charger = useCallback(async () => {
    if (!entrepriseId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ entrepriseId, dateDebut, dateFin });
      if (filtreType) params.set('typeC', filtreType);
      const res = await fetch(`/api/caisse?${params}`);
      if (res.ok) {
        const json = await res.json();
        setDocs(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [entrepriseId, dateDebut, dateFin, filtreType]);

  useEffect(() => {
    if (show && entrepriseId) charger();
  }, [show, charger, entrepriseId]);

  const handleSupprimer = async (doc: ICaisseDoc) => {
    if (doc.AjouterParC !== utilisateur) {
      setMessage({ type: 'danger', text: 'Vous ne pouvez supprimer que vos propres enregistrements.' });
      return;
    }
    if (!window.confirm(`Supprimer cet enregistrement (${doc.Operation} — ${fmt(doc.MOntantC || 0)} FCFA) ?`)) return;
    try {
      const res = await fetch('/api/caisse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'supprimer', id: doc._id }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: 'Supprimé avec succès.' });
        await charger();
      } else {
        setMessage({ type: 'danger', text: json.message || 'Erreur.' });
      }
    } catch {
      setMessage({ type: 'danger', text: 'Erreur réseau.' });
    }
  };

  const handleModifier = (doc: ICaisseDoc) => {
    if (doc.AjouterParC !== utilisateur) {
      setMessage({ type: 'danger', text: 'Vous ne pouvez modifier que vos propres enregistrements.' });
      return;
    }
    setCaisseIdEdition(doc._id);
    setShowFiche(true);
  };

  const handleNouvel = () => {
    setCaisseIdEdition(null);
    setShowFiche(true);
  };

  const docsFiltres = docs.filter(d =>
    !recherche ||
    (d.Operation || '').toLowerCase().includes(recherche.toLowerCase()) ||
    (d.MOtif || '').toLowerCase().includes(recherche.toLowerCase()) ||
    (d.NomPrenoms || '').toLowerCase().includes(recherche.toLowerCase()) ||
    (d.AjouterParC || '').toLowerCase().includes(recherche.toLowerCase())
  );

  const totalEntrees = docsFiltres.filter(d => (d.typeC || '').includes('Entrée')).reduce((s, d) => s + (d.MOntantC || 0), 0);
  const totalSorties = docsFiltres.filter(d => (d.typeC || '').includes('Sortie')).reduce((s, d) => s + (d.MOntantC || 0), 0);
  const solde = totalEntrees - totalSorties;

  return (
    <>
      <Modal show={show && !showFiche} onHide={onHide} size="xl" backdrop="static" keyboard={false}>
        <Modal.Header closeButton style={{ background: '#2d3748' }} className="text-white">
          <Modal.Title style={{ fontSize: '1rem' }}>
            <i className="bi bi-cash-register me-2"></i>Caisse — Entrées & Sorties
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {message && (
            <Alert variant={message.type} dismissible onClose={() => setMessage(null)} className="py-2">
              {message.text}
            </Alert>
          )}

          {/* Filtres */}
          <div className="p-2 rounded mb-3" style={{ background: '#f8f9fa' }}>
            <Row className="g-2 align-items-end">
              <Col md={2}>
                <Form.Label className="small fw-semibold mb-1">Date début</Form.Label>
                <Form.Control type="date" size="sm" value={dateDebut} onChange={e => setDateDebut(e.target.value)} />
              </Col>
              <Col md={2}>
                <Form.Label className="small fw-semibold mb-1">Date fin</Form.Label>
                <Form.Control type="date" size="sm" value={dateFin} onChange={e => setDateFin(e.target.value)} />
              </Col>
              <Col md={2}>
                <Form.Label className="small fw-semibold mb-1">Type</Form.Label>
                <Form.Select size="sm" value={filtreType} onChange={e => setFiltreType(e.target.value)}>
                  <option value="">Tous</option>
                  <option value="Entrée de caisse">Entrées</option>
                  <option value="Sortie de caisse">Sorties</option>
                </Form.Select>
              </Col>
              <Col md={3}>
                <Form.Label className="small fw-semibold mb-1">Recherche</Form.Label>
                <Form.Control
                  type="text"
                  size="sm"
                  placeholder="Opération, motif, personne..."
                  value={recherche}
                  onChange={e => setRecherche(e.target.value)}
                />
              </Col>
              <Col md={1}>
                <Button size="sm" variant="dark" className="w-100" onClick={charger} disabled={loading}>
                  {loading ? <Spinner size="sm" animation="border" /> : <i className="bi bi-search"></i>}
                </Button>
              </Col>
              <Col md={2} className="text-end">
                <Button size="sm" variant="success" onClick={handleNouvel}>
                  <i className="bi bi-plus-circle me-1"></i>Nouveau
                </Button>
              </Col>
            </Row>
          </div>

          {/* Totaux */}
          <Row className="g-2 mb-3">
            <Col md={4}>
              <div className="rounded p-2 text-white text-center" style={{ background: 'linear-gradient(135deg, #43e97b, #38f9d7)', fontSize: '0.85rem' }}>
                <div className="fw-semibold">Total Entrées</div>
                <div className="fw-bold">{fmt(totalEntrees)} FCFA</div>
              </div>
            </Col>
            <Col md={4}>
              <div className="rounded p-2 text-white text-center" style={{ background: 'linear-gradient(135deg, #ff6b6b, #feca57)', fontSize: '0.85rem' }}>
                <div className="fw-semibold">Total Sorties</div>
                <div className="fw-bold">{fmt(totalSorties)} FCFA</div>
              </div>
            </Col>
            <Col md={4}>
              <div className="rounded p-2 text-white text-center"
                style={{ background: solde >= 0 ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'linear-gradient(135deg, #f5576c, #f093fb)', fontSize: '0.85rem' }}>
                <div className="fw-semibold">Solde</div>
                <div className="fw-bold">{fmt(solde)} FCFA</div>
              </div>
            </Col>
          </Row>

          {/* Tableau */}
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <Table bordered hover size="sm" style={{ fontSize: '0.8rem' }}>
              <thead style={{ background: '#2d3748', color: 'white', position: 'sticky', top: 0 }}>
                <tr>
                  <th style={{ color: 'white', background: '#2d3748' }}>Date</th>
                  <th style={{ color: 'white', background: '#2d3748' }}>Opération</th>
                  <th style={{ color: 'white', background: '#2d3748' }}>Motif</th>
                  <th style={{ color: 'white', background: '#2d3748' }} className="text-end">Montant</th>
                  <th style={{ color: 'white', background: '#2d3748' }}>Personne</th>
                  <th style={{ color: 'white', background: '#2d3748' }}>Saisir Par</th>
                  <th style={{ color: 'white', background: '#2d3748' }} className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-3"><Spinner size="sm" animation="border" /> Chargement...</td></tr>
                ) : docsFiltres.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-muted py-3">Aucun enregistrement</td></tr>
                ) : (
                  docsFiltres.map((d, i) => {
                    const isEntree = (d.typeC || '').includes('Entrée');
                    const estMien = d.AjouterParC === utilisateur;
                    return (
                      <tr key={i} className={isEntree ? 'table-success' : 'table-danger'} style={{ opacity: 1 }}>
                        <td className="text-nowrap">
                          {d.dAteC ? new Date(d.dAteC).toLocaleDateString('fr-FR') : '-'}
                          {d.HeureC && <small className="text-muted ms-1">{d.HeureC}</small>}
                        </td>
                        <td>
                          <Badge
                            bg={isEntree ? 'success' : 'danger'}
                            style={{ fontSize: '0.7rem' }}
                          >
                            {isEntree ? '↑' : '↓'}
                          </Badge>
                          <span className="ms-1 fw-semibold">{d.Operation}</span>
                        </td>
                        <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {d.MOtif}
                        </td>
                        <td className="text-end fw-bold">
                          <span style={{ color: isEntree ? '#198754' : '#dc3545' }}>
                            {isEntree ? '+' : '-'}{fmt(d.MOntantC || 0)}
                          </span>
                        </td>
                        <td>{d.NomPrenoms || '-'}</td>
                        <td>
                          <span style={{ color: estMien ? '#0d6efd' : '#6c757d', fontWeight: estMien ? 'bold' : 'normal' }}>
                            {d.AjouterParC}
                          </span>
                        </td>
                        <td className="text-center">
                          <div className="d-flex gap-1 justify-content-center">
                            {/* Modifier — seulement si c'est le saisisseur */}
                            <Button
                              size="sm"
                              variant={estMien ? 'outline-primary' : 'outline-secondary'}
                              style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                              onClick={() => handleModifier(d)}
                              title={estMien ? 'Modifier' : 'Vous ne pouvez modifier que vos saisies'}
                            >
                              <i className="bi bi-pencil-fill"></i>
                            </Button>
                            {/* Imprimer */}
                            <Button
                              size="sm"
                              variant="outline-dark"
                              style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                              onClick={() => printBonCaisse(d, entreprise)}
                              title="Imprimer le bon"
                            >
                              <i className="bi bi-printer-fill"></i>
                            </Button>
                            {/* Supprimer — seulement si c'est le saisisseur */}
                            <Button
                              size="sm"
                              variant={estMien ? 'outline-danger' : 'outline-secondary'}
                              style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                              onClick={() => handleSupprimer(d)}
                              title={estMien ? 'Supprimer' : 'Vous ne pouvez supprimer que vos saisies'}
                            >
                              <i className="bi bi-trash-fill"></i>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </Table>
          </div>
        </Modal.Body>

        <Modal.Footer className="d-flex justify-content-between">
          <small className="text-muted">
            {docsFiltres.length} enregistrement(s) • du {dateDebut} au {dateFin}
          </small>
          <div className="d-flex gap-2">
            <Button variant="outline-secondary" size="sm" onClick={onHide}>Fermer</Button>
            <Button variant="dark" size="sm" onClick={charger} disabled={loading}>
              <i className="bi bi-arrow-clockwise me-1"></i>Actualiser
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      {/* Fiche caisse (création / édition) */}
      <FicheCaisseModal
        show={showFiche}
        onHide={() => { setShowFiche(false); setCaisseIdEdition(null); }}
        caisseId={caisseIdEdition}
        onSaved={() => { charger(); }}
      />
    </>
  );
}
