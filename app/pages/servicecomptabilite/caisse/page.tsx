'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Button, Form, Table, Badge, Spinner, Alert } from 'react-bootstrap';
import FicheCaisseModal from '../components/FicheCaisseModal';
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
}

const fmt = (n: number) => (n || 0).toLocaleString('fr-FR');
const today = () => new Date().toISOString().split('T')[0];

function nombreEnLettres(n: number): string {
  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
    'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];
  if (n === 0) return 'zéro';
  if (n < 0) return 'moins ' + nombreEnLettres(-n);
  let result = '';
  if (n >= 1000000) { result += nombreEnLettres(Math.floor(n / 1000000)) + ' million' + (Math.floor(n / 1000000) > 1 ? 's' : '') + ' '; n %= 1000000; }
  if (n >= 1000) { const mil = Math.floor(n / 1000); result += (mil === 1 ? '' : nombreEnLettres(mil) + ' ') + 'mille '; n %= 1000; }
  if (n >= 100) { const cent = Math.floor(n / 100); result += (cent === 1 ? '' : units[cent] + ' ') + 'cent' + (cent > 1 && n % 100 === 0 ? 's' : '') + ' '; n %= 100; }
  if (n >= 20) {
    const t = Math.floor(n / 10); const u = n % 10;
    if (t === 7 || t === 9) { result += tens[t] + (u === 1 && t === 7 ? '-et' : '') + '-' + units[10 + u] + ' '; }
    else { result += tens[t] + (u === 1 && t < 8 ? '-et-' : u > 0 ? '-' : '') + (u > 0 ? units[u] : '') + ' '; }
  } else if (n > 0) { result += units[n] + ' '; }
  return result.trim();
}

function printBon(doc: ICaisseDoc, entreprise: any) {
  const dateFormatee = doc.dAteC
    ? new Date(doc.dAteC).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : '';
  const montant = doc.MOntantC || 0;
  const enLettres = nombreEnLettres(Math.round(montant));
  const isEntree = (doc.typeC || '').toLowerCase().includes('entrée');
  const titreBon = isEntree ? "BON D'ENTRÉE DE CAISSE" : 'BON DE SORTIE DE CAISSE';

  const now = new Date();
  const printedBy = localStorage.getItem('nom_utilisateur') || '';
  const printDateTime = now.toLocaleDateString('fr-FR') + ' ' + now.toLocaleTimeString('fr-FR');

  const logoHTML = entreprise?.LogoE
    ? `<img src="${entreprise.LogoE}" alt="Logo" style="max-height:80px;max-width:80px;">`
    : '';

  const bonHTML = (exemplaire: string) => `
    <div style="font-family:Arial,sans-serif;font-size:12px;max-width:700px;margin:0 auto;padding:8px 0;">
      <table style="width:100%;border:none;margin-bottom:4px;"><tr>
        <td style="border:none;padding:0;font-size:11px;">Imprimé par &nbsp;<strong>${printedBy}</strong>&nbsp; à &nbsp;${printDateTime}</td>
        <td style="border:none;padding:0;text-align:right;font-size:11px;font-weight:bold;">${exemplaire}</td>
      </tr></table>

      <table style="width:100%;border:none;margin-bottom:6px;"><tr>
        <td style="border:none;padding:0;width:90px;vertical-align:middle;">${logoHTML}</td>
        <td style="border:none;padding:0;text-align:center;vertical-align:middle;">
          <div style="font-size:17px;font-weight:bold;text-decoration:underline;">${titreBon}</div>
          <div style="font-size:12px;margin-top:4px;">Bon Saisie par:&nbsp;&nbsp;<strong>${doc.AjouterParC || ''}</strong></div>
        </td>
        <td style="border:none;padding:0;text-align:right;vertical-align:middle;white-space:nowrap;">
          <div style="font-size:12px;">Montant (FCFA)&nbsp;&nbsp;<strong>${fmt(montant)}</strong></div>
          <div style="font-size:12px;">Abidjan, le &nbsp;&nbsp;${dateFormatee}</div>
        </td>
      </tr></table>

      <div style="border-bottom:1px dotted #000;padding-bottom:6px;margin-bottom:8px;">
        <span style="font-size:12px;"><strong>La somme de (en lettre) :</strong>&nbsp;&nbsp;<em>${enLettres} Francs CFA</em></span>
        <span style="display:inline-block;width:100%;border-bottom:1px dotted #000;margin-top:4px;"></span>
      </div>

      <div style="margin-bottom:6px;">
        <span style="font-size:12px;"><strong>Opération :</strong>&nbsp;&nbsp;<strong style="font-size:13px;">${doc.Operation || ''}</strong></span>
        <div style="border-bottom:1px dotted #000;margin-top:3px;"></div>
      </div>
      <div style="margin-bottom:6px;">
        <span style="font-size:12px;"><strong>Motif de l'opération :</strong>&nbsp;&nbsp;<strong style="font-size:12px;">${(doc.MOtif || '').toUpperCase()}</strong></span>
        <div style="border-bottom:1px dotted #000;margin-top:3px;"></div>
      </div>
      <div style="margin-bottom:6px;">
        <span style="font-size:12px;"><strong>Service :</strong>&nbsp;&nbsp;<strong style="font-size:13px;">${(doc.serviceC || '').toUpperCase()}</strong></span>
        <div style="border-bottom:1px dotted #000;margin-top:3px;"></div>
      </div>
      <div style="margin-bottom:8px;">
        <span style="font-size:12px;"><strong>Nom et Prénoms du bénéficiaire :</strong>&nbsp;&nbsp;<strong style="font-size:12px;">${(doc.NomPrenoms || '').toUpperCase()}</strong></span>
        <div style="border-bottom:1px dotted #000;margin-top:3px;"></div>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-top:10px;">
        <thead><tr>
          <th style="border:1px solid #000;padding:8px 4px;text-align:center;background:#f5f5f5;font-size:12px;">Visa Directeur</th>
          <th style="border:1px solid #000;padding:8px 4px;text-align:center;background:#f5f5f5;font-size:12px;">Visa DAF</th>
          <th style="border:1px solid #000;padding:8px 4px;text-align:center;background:#f5f5f5;font-size:12px;">Visa comptable</th>
          <th style="border:1px solid #000;padding:8px 4px;text-align:center;background:#f5f5f5;font-size:12px;">Visa Bénéficiaire</th>
        </tr></thead>
        <tbody><tr>
          <td style="border:1px solid #000;height:50px;"></td>
          <td style="border:1px solid #000;height:50px;"></td>
          <td style="border:1px solid #000;height:50px;"></td>
          <td style="border:1px solid #000;height:50px;"></td>
        </tr></tbody>
      </table>
    </div>`;

  const cutLine = `
    <div style="text-align:center;margin:10px 0;border-top:1px dashed #000;padding-top:6px;font-size:14px;color:#555;">
      ✂ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
    </div>`;

  const contentHTML = `
    <div style="max-width:700px;margin:0 auto;">
      ${bonHTML('Exemplaire Comptabilité')}
      ${cutLine}
      ${bonHTML('Exemplaire Bénéficiaire')}
    </div>`;

  const printWindow = window.open('', '', 'width=800,height=900');
  if (!printWindow) return;
  printWindow.document.write(`<!DOCTYPE html><html><head><title>Bon de Caisse</title>
    <style>
      @media print { body { margin:0;padding:10mm; } @page { margin:8mm; size:A4; } }
      body { font-family:Arial,sans-serif;background:#fff;color:#000;padding:15px; }
      table { border-collapse:collapse; }
      * { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
    </style>
  </head><body>${contentHTML}</body></html>`);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.onafterprint = () => printWindow.close();
  }, 400);
}

export default function CaissePage() {
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
      if (res.ok) { const json = await res.json(); setDocs(json.data || []); }
    } finally { setLoading(false); }
  }, [entrepriseId, dateDebut, dateFin, filtreType]);

  useEffect(() => { if (entrepriseId) charger(); }, [charger, entrepriseId]);

  const handleSupprimer = async (doc: ICaisseDoc) => {
    if (doc.AjouterParC !== utilisateur) { setMessage({ type: 'danger', text: 'Vous ne pouvez supprimer que vos propres enregistrements.' }); return; }
    if (!window.confirm(`Supprimer cet enregistrement ?`)) return;
    const res = await fetch('/api/caisse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'supprimer', id: doc._id }) });
    const json = await res.json();
    if (json.success) { setMessage({ type: 'success', text: 'Supprimé.' }); charger(); }
    else setMessage({ type: 'danger', text: json.message || 'Erreur.' });
  };

  const docsFiltres = docs.filter(d =>
    !recherche || (d.Operation || '').toLowerCase().includes(recherche.toLowerCase()) ||
    (d.MOtif || '').toLowerCase().includes(recherche.toLowerCase()) ||
    (d.NomPrenoms || '').toLowerCase().includes(recherche.toLowerCase()) ||
    (d.AjouterParC || '').toLowerCase().includes(recherche.toLowerCase())
  );

  const totalEntrees = docsFiltres.filter(d => (d.typeC || '').includes('Entrée')).reduce((s, d) => s + (d.MOntantC || 0), 0);
  const totalSorties = docsFiltres.filter(d => (d.typeC || '').includes('Sortie')).reduce((s, d) => s + (d.MOntantC || 0), 0);
  const solde = totalEntrees - totalSorties;

  const periode = `${dateDebut.split('-').reverse().join('/')} — ${dateFin.split('-').reverse().join('/')}`;

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '8px 10px' }}>

      {/* HEADER */}
      <div style={{ background: 'linear-gradient(135deg,#1b5e20 0%,#2e7d32 50%,#388e3c 100%)', borderRadius: 8, padding: '8px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(27,94,32,0.3)' }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.68rem', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' }}>Module Comptabilité</div>
          <div style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 800, letterSpacing: 1 }}>Caisse — Entrées & Sorties</div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.72rem', marginTop: 1 }}>{periode}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Button onClick={() => { setCaisseIdEdition(null); setShowFiche(true); }} style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', fontWeight: 700, fontSize: '0.78rem', borderRadius: 6, padding: '5px 14px' }}>
            <i className="bi bi-plus-circle me-1"></i>Nouveau
          </Button>
          <i className="bi bi-cash-register" style={{ fontSize: '1.8rem', color: 'rgba(255,255,255,0.25)' }}></i>
        </div>
      </div>

      {message && <Alert variant={message.type} dismissible onClose={() => setMessage(null)} className="py-2 mb-2" style={{ fontSize: '0.8rem' }}>{message.text}</Alert>}

      {/* KPIs */}
      <Row className="g-2 mb-2">
        {[
          { label: 'Total Entrées', value: totalEntrees, bg: 'linear-gradient(135deg,#1b5e20,#66bb6a)', icon: 'bi-arrow-down-circle-fill' },
          { label: 'Total Sorties', value: totalSorties, bg: 'linear-gradient(135deg,#b71c1c,#ef9a9a)', icon: 'bi-arrow-up-circle-fill' },
          { label: 'Solde Caisse',  value: solde, bg: solde >= 0 ? 'linear-gradient(135deg,#006064,#26c6da)' : 'linear-gradient(135deg,#880e4f,#f48fb1)', icon: 'bi-wallet2' },
          { label: 'Nb opérations', value: docsFiltres.length, bg: 'linear-gradient(135deg,#1565c0,#42a5f5)', icon: 'bi-list-ol', isCount: true },
        ].map((kpi, ki) => (
          <Col key={ki} xs={6} md={3}>
            <div style={{ background: kpi.bg, borderRadius: 8, padding: '8px 12px', color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 600, opacity: 0.85, textTransform: 'uppercase', letterSpacing: 1 }}>{kpi.label}</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, marginTop: 2 }}>
                    {(kpi as any).isCount ? kpi.value : `${loading ? '…' : fmt(kpi.value)} F`}
                  </div>
                </div>
                <i className={`bi ${kpi.icon}`} style={{ fontSize: '1.2rem', opacity: 0.35 }}></i>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* FILTRES */}
      <Card className="mb-2" style={{ borderRadius: 8, border: 'none', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
        <Card.Body style={{ padding: '8px 14px' }}>
          <Row className="g-2 align-items-end">
            <Col xs="auto"><Form.Label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#546e7a', letterSpacing: 1, textTransform: 'uppercase' }}>Début</Form.Label><Form.Control type="date" size="sm" value={dateDebut} onChange={e => setDateDebut(e.target.value)} style={{ borderRadius: 6, borderColor: '#b0bec5', fontSize: '0.76rem', width: 130 }} /></Col>
            <Col xs="auto"><Form.Label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#546e7a', letterSpacing: 1, textTransform: 'uppercase' }}>Fin</Form.Label><Form.Control type="date" size="sm" value={dateFin} onChange={e => setDateFin(e.target.value)} style={{ borderRadius: 6, borderColor: '#b0bec5', fontSize: '0.76rem', width: 130 }} /></Col>
            <Col xs="auto">
              <Form.Label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#546e7a', letterSpacing: 1, textTransform: 'uppercase' }}>Type</Form.Label>
              <Form.Select size="sm" value={filtreType} onChange={e => setFiltreType(e.target.value)} style={{ borderRadius: 6, borderColor: '#b0bec5', fontSize: '0.76rem', width: 130 }}>
                <option value="">Tous</option>
                <option value="Entrée de caisse">Entrées</option>
                <option value="Sortie de caisse">Sorties</option>
              </Form.Select>
            </Col>
            <Col xs={12} md={3}><Form.Label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#546e7a', letterSpacing: 1, textTransform: 'uppercase' }}>Recherche</Form.Label><Form.Control type="text" size="sm" placeholder="Opération, motif, personne…" value={recherche} onChange={e => setRecherche(e.target.value)} style={{ borderRadius: 6, borderColor: '#b0bec5', fontSize: '0.76rem' }} /></Col>
            <Col xs="auto" className="ms-auto d-flex gap-2">
              <Button onClick={charger} disabled={loading} style={{ background: 'linear-gradient(135deg,#1b5e20,#2e7d32)', border: 'none', fontWeight: 700, fontSize: '0.78rem', padding: '5px 14px', borderRadius: 6 }}>
                {loading ? <><Spinner size="sm" animation="border" className="me-1" />…</> : <><i className="bi bi-search me-1"></i>Rechercher</>}
              </Button>
              <Button variant="outline-secondary" onClick={charger} disabled={loading} style={{ borderRadius: 6, fontSize: '0.78rem', padding: '5px 10px' }}><i className="bi bi-arrow-clockwise"></i></Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* TABLEAU */}
      <Card style={{ borderRadius: 8, border: 'none', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
        <div style={{ background: 'linear-gradient(90deg,#1b5e20,#2e7d32)', color: '#fff', padding: '7px 14px', borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: '0.78rem', letterSpacing: 1 }}><i className="bi bi-table me-2"></i>MOUVEMENTS DE CAISSE — {periode}</span>
          {docsFiltres.length > 0 && <span style={{ fontSize: '0.72rem', opacity: 0.85 }}>{docsFiltres.length} ligne(s)</span>}
        </div>
        <Card.Body className="p-0">
          <div style={{ overflowX: 'auto', maxHeight: '52vh', overflowY: 'auto' }}>
            <Table bordered className="mb-0" style={{ fontSize: '0.73rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  {['Date','Opération','Motif','Montant','Personne','Saisi par','Actions'].map((h, hi) => (
                    <th key={hi} style={{ background: '#cfd8dc', color: '#37474f', padding: '6px 8px', fontWeight: 700, whiteSpace: 'nowrap', borderRight: '1px solid #b0bec5', textAlign: hi === 3 ? 'right' : hi === 6 ? 'center' : 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#78909c' }}><Spinner animation="border" size="sm" className="me-2" />Chargement…</td></tr>
                ) : docsFiltres.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '50px', color: '#90a4ae' }}>
                    <i className="bi bi-inbox" style={{ fontSize: '2.5rem', display: 'block', marginBottom: 8 }}></i>Aucun enregistrement trouvé
                  </td></tr>
                ) : docsFiltres.map((d, i) => {
                  const isEntree = (d.typeC || '').includes('Entrée');
                  const estMien = d.AjouterParC === utilisateur;
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f7f9fc', borderLeft: `3px solid ${isEntree ? '#2e7d32' : '#b71c1c'}` }}>
                      <td style={{ padding: '3px 8px', whiteSpace: 'nowrap', borderRight: '1px solid #e0e0e0' }}>
                        {d.dAteC ? new Date(d.dAteC).toLocaleDateString('fr-FR') : '-'}
                        {d.HeureC && <small style={{ color: '#90a4ae', marginLeft: 4 }}>{d.HeureC}</small>}
                      </td>
                      <td style={{ padding: '3px 8px', borderRight: '1px solid #e0e0e0' }}>
                        <Badge bg={isEntree ? 'success' : 'danger'} className="me-1" style={{ fontSize: '0.6rem' }}>{isEntree ? '↑' : '↓'}</Badge>
                        <span style={{ fontWeight: 600 }}>{d.Operation}</span>
                      </td>
                      <td style={{ padding: '3px 8px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderRight: '1px solid #e0e0e0' }}>{d.MOtif}</td>
                      <td style={{ padding: '3px 8px', textAlign: 'right', fontWeight: 'bold', color: isEntree ? '#2e7d32' : '#b71c1c', borderRight: '1px solid #e0e0e0' }}>
                        {isEntree ? '+' : '-'}{fmt(d.MOntantC || 0)}
                      </td>
                      <td style={{ padding: '3px 8px', borderRight: '1px solid #e0e0e0' }}>{d.NomPrenoms || '-'}</td>
                      <td style={{ padding: '3px 8px', borderRight: '1px solid #e0e0e0', color: estMien ? '#1565c0' : '#546e7a', fontWeight: estMien ? 700 : 400 }}>{d.AjouterParC}</td>
                      <td style={{ padding: '3px 8px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
                          <Button size="sm" variant={estMien ? 'outline-primary' : 'outline-secondary'} style={{ padding: '2px 6px' }} title={estMien ? 'Modifier' : 'Non autorisé'}
                            onClick={() => { if (!estMien) { setMessage({ type: 'danger', text: 'Vous ne pouvez modifier que vos propres enregistrements.' }); return; } setCaisseIdEdition(d._id); setShowFiche(true); }}>
                            <i className="bi bi-pencil-fill" style={{ fontSize: '0.7rem' }}></i>
                          </Button>
                          <Button size="sm" variant="outline-dark" style={{ padding: '2px 6px' }} title="Imprimer" onClick={() => printBon(d, entreprise)}>
                            <i className="bi bi-printer-fill" style={{ fontSize: '0.7rem' }}></i>
                          </Button>
                          <Button size="sm" variant={estMien ? 'outline-danger' : 'outline-secondary'} style={{ padding: '2px 6px' }} title={estMien ? 'Supprimer' : 'Non autorisé'} onClick={() => handleSupprimer(d)}>
                            <i className="bi bi-trash-fill" style={{ fontSize: '0.7rem' }}></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        </Card.Body>
        <div style={{ background: '#eceff1', borderRadius: '0 0 8px 8px', padding: '6px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #cfd8dc' }}>
          <span style={{ fontSize: '0.72rem', color: '#78909c' }}>{docsFiltres.length} enregistrement(s)</span>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}><div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#2e7d32', textTransform: 'uppercase' }}>Entrées</div><div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#2e7d32' }}>{fmt(totalEntrees)} F</div></div>
            <div style={{ width: 1, height: 28, background: '#b0bec5' }}></div>
            <div style={{ textAlign: 'right' }}><div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#b71c1c', textTransform: 'uppercase' }}>Sorties</div><div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#b71c1c' }}>{fmt(totalSorties)} F</div></div>
            <div style={{ width: 1, height: 28, background: '#b0bec5' }}></div>
            <div style={{ textAlign: 'right' }}><div style={{ fontSize: '0.62rem', fontWeight: 700, color: solde >= 0 ? '#006064' : '#880e4f', textTransform: 'uppercase' }}>Solde</div><div style={{ fontSize: '1rem', fontWeight: 800, color: solde >= 0 ? '#006064' : '#880e4f' }}>{fmt(solde)} F</div></div>
          </div>
        </div>
      </Card>

      <FicheCaisseModal show={showFiche} onHide={() => { setShowFiche(false); setCaisseIdEdition(null); }} caisseId={caisseIdEdition} onSaved={charger} />
    </div>
  );
}
