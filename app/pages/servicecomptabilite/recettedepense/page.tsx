'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Button, Form, Table, Spinner, Badge } from 'react-bootstrap';
import { useEntreprise } from '@/hooks/useEntreprise';
import { generatePrintHeader, getPrintCSS } from '@/utils/printRecu';

const fmt = (n: number) => (n || 0).toLocaleString('fr-FR');
const today = () => new Date().toISOString().split('T')[0];

function getFirstDayOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
}

interface LigneRD {
  date: string;
  libelle: string;
  motif: string;
  nomPrenoms: string;
  recette: number;
  depense: number;
  source: string;
}

const SOURCE_COLORS: Record<string, string> = {
  'CAISSE ENTRÉE':  'success',
  'CAISSE SORTIE':  'danger',
  'CONSULTATION':   'primary',
  'FACTURATION':    'info',
  'ENCAISSEMENT':   'secondary',
};


export default function RecetteDepensePage() {
  const { entreprise } = useEntreprise();
  const [entrepriseId, setEntrepriseId] = useState('');
  const [dateDebut, setDateDebut] = useState(getFirstDayOfMonth());
  const [dateFin, setDateFin] = useState(today());
  const [loading, setLoading] = useState(false);
  const [lignes, setLignes] = useState<LigneRD[]>([]);
  const [totaux, setTotaux] = useState({ totalRecette: 0, totalDepense: 0, solde: 0 });
  const [recherche, setRecherche] = useState('');
  const [utilisateur, setUtilisateur] = useState('');

  useEffect(() => {
    setEntrepriseId(localStorage.getItem('IdEntreprise') || '');
    setUtilisateur(localStorage.getItem('nom_utilisateur') || '');
  }, []);

  const charger = useCallback(async () => {
    if (!entrepriseId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ dateDebut, dateFin });
      const res = await fetch(`/api/comptabilite/recettedepense?${params}`);
      if (res.ok) {
        const json = await res.json();
        setLignes(json.data || []);
        setTotaux(json.totaux || { totalRecette: 0, totalDepense: 0, solde: 0 });
      }
    } finally {
      setLoading(false);
    }
  }, [entrepriseId, dateDebut, dateFin]);

  useEffect(() => { if (entrepriseId) charger(); }, [charger, entrepriseId]);

  const printRecetteDepense = () => {
    const headerHTML = generatePrintHeader(entreprise);
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR');
    const heureStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const rows = filtrees.map((l, i) => `
      <tr style="background:${i % 2 === 0 ? '#fffde7' : '#fff'}">
        <td style="text-align:center;padding:5px 4px;border:1px solid #ccc">${l.date ? new Date(l.date).toLocaleDateString('fr-FR') : '-'}</td>
        <td style="text-align:left;padding:5px 8px;border:1px solid #ccc">${l.libelle || '-'}</td>
        <td style="text-align:left;padding:5px 8px;border:1px solid #ccc">${l.nomPrenoms || '-'}</td>
        <td style="text-align:right;padding:5px 8px;border:1px solid #ccc;font-weight:bold;color:${l.recette > 0 ? '#000' : '#999'}">${l.recette > 0 ? fmt(l.recette) : '0'}</td>
        <td style="text-align:right;padding:5px 8px;border:1px solid #ccc;font-weight:bold;color:${l.depense > 0 ? '#000' : '#999'}">${l.depense > 0 ? fmt(l.depense) : '0'}</td>
      </tr>
    `).join('');

    const contentHTML = `
      <div style="font-family:Arial,sans-serif;font-size:12px;color:#000">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
          <div style="flex:1">${headerHTML}</div>
        </div>
      <div style="text-align:center;flex:1">
            <h2 style="font-size:20px;font-weight:bold;color:#2d3748;margin:8px 0">CAHIER RECETTE DEPENSE</h2>
          </div>
          <div style="text-align:right;flex:1;color:#dc3545;font-size:11px;padding-top:4px;line-height:1.6">
            Imprimé par : <strong>${utilisateur}</strong><br/>
            Le ${dateStr} à ${heureStr}
          </div>
        <div style="margin:16px 0 10px 0;font-size:13px;font-weight:bold">
          <span>Bilan Du &nbsp;&nbsp;&nbsp; ${dateDebut.split('-').reverse().join('/')} &nbsp;&nbsp;&nbsp;&nbsp; Au &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${dateFin.split('-').reverse().join('/')}</span>
        </div>

        <table style="width:100%;border-collapse:collapse;font-size:11px">
          <thead>
            <tr style="background:#f9a825;color:#000">
              <th style="padding:8px 4px;border:1px solid #ccc;text-align:center;width:90px">DATE</th>
              <th style="padding:8px 4px;border:1px solid #ccc;text-align:center">LIBELLE</th>
              <th style="padding:8px 4px;border:1px solid #ccc;text-align:center">NOM_PRENOMS</th>
              <th style="padding:8px 4px;border:1px solid #ccc;text-align:right;width:110px">RECETTE</th>
              <th style="padding:8px 4px;border:1px solid #ccc;text-align:right;width:110px">DEPENSE</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
            <tr style="background:#fff;font-weight:bold">
              <td colspan="3" style="border:none;padding:6px 4px"></td>
              <td style="border:1px dashed #333;padding:6px 8px;text-align:right;font-weight:bold">${fmt(totalRec)}</td>
              <td style="border:1px dashed #333;padding:6px 8px;text-align:right;font-weight:bold">${fmt(totalDep)}</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top:20px;display:flex;align-items:center;gap:20px">
          <div style="border:2px solid #333;padding:8px 24px;font-weight:bold;font-size:13px">SOLDE CAISSE</div>
          <div style="background:#d0d0d0;padding:8px 32px;font-weight:bold;font-size:15px;color:#006064">${fmt(solde)} F CFA</div>
        </div>
      </div>
    `;

    const printWindow = window.open('', '', 'width=900,height=700');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html><html><head><title>Cahier Recette Dépense</title>
      <style>
        ${getPrintCSS()}
        @media print { @page { margin: 10mm; size: A4; } body { padding: 10px; } }
        table { page-break-inside: auto; }
        tr { page-break-inside: avoid; page-break-after: auto; }
        thead { display: table-header-group; }
      </style>
      </head><body>${contentHTML}</body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.onafterprint = () => printWindow.close(); }, 400);
  };

  const filtrees = lignes.filter(l =>
    !recherche ||
    (l.libelle || '').toLowerCase().includes(recherche.toLowerCase()) ||
    (l.nomPrenoms || '').toLowerCase().includes(recherche.toLowerCase()) ||
    (l.source || '').toLowerCase().includes(recherche.toLowerCase())
  );

  const totalRec = filtrees.reduce((s, l) => s + l.recette, 0);
  const totalDep = filtrees.reduce((s, l) => s + l.depense, 0);
  const solde = totalRec - totalDep;

  const periode = `${dateDebut.split('-').reverse().join('/')} — ${dateFin.split('-').reverse().join('/')}`;

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '8px 10px' }}>

      {/* ══ HEADER ══════════════════════════════════════════════════════ */}
      <div style={{
        background: 'linear-gradient(135deg,#00695c 0%,#00897b 50%,#26a69a 100%)',
        borderRadius: 8, padding: '8px 16px', marginBottom: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 20px rgba(0,105,92,0.3)',
      }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.68rem', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' }}>
            Module Comptabilité
          </div>
          <div style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 800, letterSpacing: 1 }}>
            Cahier Recette / Dépense
          </div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.72rem', marginTop: 1 }}>
            {periode}
          </div>
        </div>
        <i className="bi bi-journal-text" style={{ fontSize: '1.8rem', color: 'rgba(255,255,255,0.25)' }}></i>
      </div>

      {/* ══ KPIs ════════════════════════════════════════════════════════ */}
      {filtrees.length > 0 && (
        <Row className="g-2 mb-2">
          {[
            { label: 'Total Recette',  value: totalRec, bg: 'linear-gradient(135deg,#2e7d32,#66bb6a)', icon: 'bi-arrow-down-circle-fill' },
            { label: 'Total Dépense',  value: totalDep, bg: 'linear-gradient(135deg,#b71c1c,#ef9a9a)', icon: 'bi-arrow-up-circle-fill' },
            { label: 'Solde Caisse',   value: solde,    bg: solde >= 0 ? 'linear-gradient(135deg,#006064,#26c6da)' : 'linear-gradient(135deg,#880e4f,#f48fb1)', icon: 'bi-wallet2' },
            { label: 'Nb Opérations', value: filtrees.length, bg: 'linear-gradient(135deg,#1565c0,#42a5f5)', icon: 'bi-list-ol', isCount: true },
          ].map((kpi, ki) => (
            <Col key={ki} xs={6} md={3}>
              <div style={{ background: kpi.bg, borderRadius: 8, padding: '8px 12px', color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 600, opacity: 0.85, textTransform: 'uppercase', letterSpacing: 1 }}>{kpi.label}</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, marginTop: 2 }}>
                      {(kpi as any).isCount ? kpi.value : `${fmt(kpi.value)} F`}
                    </div>
                  </div>
                  <i className={`bi ${kpi.icon}`} style={{ fontSize: '1.2rem', opacity: 0.35 }}></i>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      )}

      {/* ══ PANNEAU FILTRES ══════════════════════════════════════════════ */}
      <Card className="mb-2" style={{ borderRadius: 8, border: 'none', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
        <Card.Body style={{ padding: '8px 14px' }}>
          <Row className="g-2 align-items-end">
            <Col xs="auto">
              <Form.Label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#546e7a', letterSpacing: 1, textTransform: 'uppercase' }}>Début</Form.Label>
              <Form.Control type="date" size="sm" value={dateDebut} onChange={e => setDateDebut(e.target.value)}
                style={{ borderRadius: 6, borderColor: '#b0bec5', fontSize: '0.76rem', width: 130 }} />
            </Col>
            <Col xs="auto">
              <Form.Label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#546e7a', letterSpacing: 1, textTransform: 'uppercase' }}>Fin</Form.Label>
              <Form.Control type="date" size="sm" value={dateFin} onChange={e => setDateFin(e.target.value)}
                style={{ borderRadius: 6, borderColor: '#b0bec5', fontSize: '0.76rem', width: 130 }} />
            </Col>
            <Col xs={12} md={3}>
              <Form.Label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#546e7a', letterSpacing: 1, textTransform: 'uppercase' }}>Recherche</Form.Label>
              <Form.Control type="text" size="sm" placeholder="Libellé, nom, source…" value={recherche}
                onChange={e => setRecherche(e.target.value)}
                style={{ borderRadius: 6, borderColor: '#b0bec5', fontSize: '0.76rem' }} />
            </Col>
            <Col xs="auto" className="ms-auto d-flex gap-2">
              <Button onClick={charger} disabled={loading} style={{
                background: 'linear-gradient(135deg,#00695c,#00897b)', border: 'none',
                fontWeight: 700, fontSize: '0.78rem', padding: '5px 14px', borderRadius: 6,
                boxShadow: '0 2px 6px rgba(0,105,92,0.3)',
              }}>
                {loading ? <><Spinner size="sm" animation="border" className="me-1" />Chargement…</> : <><i className="bi bi-search me-1"></i>Rechercher</>}
              </Button>
              <Button variant="outline-secondary" onClick={charger} disabled={loading}
                style={{ borderRadius: 6, fontWeight: 600, fontSize: '0.78rem', padding: '5px 10px' }}>
                <i className="bi bi-arrow-clockwise"></i>
              </Button>
              <Button variant="outline-secondary" onClick={printRecetteDepense} disabled={loading || filtrees.length === 0}
                style={{ borderRadius: 6, fontWeight: 600, fontSize: '0.78rem', padding: '5px 10px' }}>
                <i className="bi bi-printer-fill me-1"></i>Imprimer
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ══ TABLEAU ══════════════════════════════════════════════════════ */}
      <Card style={{ borderRadius: 8, border: 'none', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
        <div style={{
          background: 'linear-gradient(90deg,#00695c,#00897b)', color: '#fff',
          padding: '7px 14px', borderRadius: '8px 8px 0 0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontWeight: 700, fontSize: '0.78rem', letterSpacing: 1 }}>
            <i className="bi bi-table me-2"></i>OPÉRATIONS — {periode}
          </span>
          {filtrees.length > 0 && (
            <span style={{ fontSize: '0.72rem', opacity: 0.85 }}>{filtrees.length} ligne(s)</span>
          )}
        </div>
        <Card.Body className="p-0">
          <div style={{ overflowX: 'auto', maxHeight: '52vh', overflowY: 'auto' }}>
            <Table bordered className="mb-0" style={{ fontSize: '0.73rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  <th style={{ background: '#cfd8dc', color: '#37474f', padding: '6px 8px', fontWeight: 700, whiteSpace: 'nowrap', borderRight: '1px solid #b0bec5' }}>DATE</th>
                  <th style={{ background: '#cfd8dc', color: '#37474f', padding: '6px 8px', fontWeight: 700, borderRight: '1px solid #b0bec5' }}>LIBELLÉ</th>
                  <th style={{ background: '#cfd8dc', color: '#37474f', padding: '6px 8px', fontWeight: 700, borderRight: '1px solid #b0bec5' }}>NOM / PRÉNOMS</th>
                  <th style={{ background: '#c8e6c9', color: '#1b5e20', padding: '6px 8px', fontWeight: 700, textAlign: 'right', borderRight: '1px solid #b0bec5' }}>RECETTE</th>
                  <th style={{ background: '#ffcdd2', color: '#b71c1c', padding: '6px 8px', fontWeight: 700, textAlign: 'right', borderRight: '1px solid #b0bec5' }}>DÉPENSE</th>
                  <th style={{ background: '#cfd8dc', color: '#37474f', padding: '6px 8px', fontWeight: 700 }}>SOURCE</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#78909c' }}>
                    <Spinner animation="border" size="sm" className="me-2" />Chargement…
                  </td></tr>
                ) : filtrees.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '50px', color: '#90a4ae' }}>
                    <i className="bi bi-journal-x" style={{ fontSize: '2.5rem', display: 'block', marginBottom: 8 }}></i>
                    Aucune donnée pour cette période
                  </td></tr>
                ) : filtrees.map((l, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f7f9fc', borderLeft: `3px solid ${l.recette > 0 ? '#2e7d32' : '#b71c1c'}` }}>
                    <td style={{ padding: '3px 8px', whiteSpace: 'nowrap', borderRight: '1px solid #e0e0e0' }}>
                      {l.date ? new Date(l.date).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td style={{ padding: '3px 8px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderRight: '1px solid #e0e0e0' }}>
                      {l.libelle || '-'}
                    </td>
                    <td style={{ padding: '3px 8px', borderRight: '1px solid #e0e0e0' }}>{l.nomPrenoms || '-'}</td>
                    <td style={{ padding: '3px 8px', textAlign: 'right', fontWeight: 'bold', color: l.recette > 0 ? '#2e7d32' : '#ccc', borderRight: '1px solid #e0e0e0' }}>
                      {l.recette > 0 ? fmt(l.recette) : ''}
                    </td>
                    <td style={{ padding: '3px 8px', textAlign: 'right', fontWeight: 'bold', color: l.depense > 0 ? '#b71c1c' : '#ccc', borderRight: '1px solid #e0e0e0' }}>
                      {l.depense > 0 ? fmt(l.depense) : ''}
                    </td>
                    <td style={{ padding: '3px 8px' }}>
                      <Badge bg={SOURCE_COLORS[l.source] || 'secondary'} style={{ fontSize: '0.62rem' }}>{l.source}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>

        {/* ══ FOOTER TOTAUX ══ */}
        <div style={{
          background: '#eceff1', borderRadius: '0 0 8px 8px',
          padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderTop: '2px solid #cfd8dc',
        }}>
          <span style={{ fontSize: '0.72rem', color: '#78909c' }}>{filtrees.length} ligne(s)</span>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#2e7d32', textTransform: 'uppercase', letterSpacing: 1 }}>Total Recette</div>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#2e7d32' }}>{fmt(totalRec)} F</div>
            </div>
            <div style={{ width: 1, height: 32, background: '#b0bec5' }}></div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#b71c1c', textTransform: 'uppercase', letterSpacing: 1 }}>Total Dépense</div>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#b71c1c' }}>{fmt(totalDep)} F</div>
            </div>
            <div style={{ width: 1, height: 32, background: '#b0bec5' }}></div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 700, color: solde >= 0 ? '#006064' : '#880e4f', textTransform: 'uppercase', letterSpacing: 1 }}>Solde Caisse</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: solde >= 0 ? '#006064' : '#880e4f' }}>{fmt(solde)} F</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
