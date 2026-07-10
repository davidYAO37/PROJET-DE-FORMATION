'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Button, Form, Table, Spinner } from 'react-bootstrap';
import { useEntreprise } from '@/hooks/useEntreprise';
import { generatePrintHeader, generatePrintFooter, getPrintCSS } from '@/utils/printRecu';

const fmt = (n: number) => (n || 0).toLocaleString('fr-FR');

const MOIS_FULL = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

interface LigneBudget {
  libelle: string;
  mois: number[];
  total: number;
  isTotalRow?: boolean;
  isReportRow?: boolean;
  isClotureRow?: boolean;
  isDecaissRow?: boolean;
  isTotalDecaissRow?: boolean;
}

const MOIS_LABELS = MOIS_FULL;

export default function BudgetTresoreriePage() {
  const { entreprise } = useEntreprise();
  const anneeActuelle = new Date().getFullYear();
  const [annee, setAnnee] = useState(anneeActuelle);
  const [optionPart, setOptionPart] = useState(1); // 1=TOUS, 2=ASSURANCE, 3=PART PATIENT, 4=ENCAISSEMENT
  const [avecReport, setAvecReport] = useState(false);
  const [modePaiement, setModePaiement] = useState('TOUS LES PAIEMENTS');
  const [assurance, setAssurance] = useState('TOUTES LES ASSURANCES');
  const [loading, setLoading] = useState(false);
  const [lignes, setLignes] = useState<LigneBudget[]>([]);
  const [nbDossiers, setNbDossiers] = useState(0);
  const [assurances, setAssurances] = useState<string[]>([]);
  const [modesPaiement, setModesPaiement] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/assurances').then(r => r.json()).then(json => {
      const noms = (json.data || json || []).map((a: any) => a.designationassurance || a.NomAssurance || a.nom || '').filter(Boolean);
      setAssurances(noms);
    }).catch(() => {});
    fetch('/api/modepaiement').then(r => r.json()).then(json => {
      const modes = (json.data || json || []).map((m: any) => m.Modepaiement || '').filter(Boolean);
      setModesPaiement(modes);
    }).catch(() => {});
  }, []);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        annee: String(annee),
        optionPart: String(optionPart),
        avecReport: String(avecReport),
        modePaiement,
        assurance,
      });
      const res = await fetch(`/api/comptabilite/budgettresorerie?${params}`);
      if (res.ok) {
        const json = await res.json();
        setLignes(json.lignes || []);
        const total = (json.lignes || []).find((l: LigneBudget) => l.isTotalRow);
        setNbDossiers(total ? total.mois.filter((v: number) => v > 0).length : 0);
      }
    } finally {
      setLoading(false);
    }
  }, [annee, optionPart, avecReport, modePaiement, assurance]);

  const handleOptionPart = (val: number) => {
    setOptionPart(val);
    setModePaiement('TOUS LES PAIEMENTS');
    setAssurance('TOUTES LES ASSURANCES');
  };

  const afficherVisible = optionPart === 1 || optionPart === 3 || optionPart === 4;
  const modePaiementVisible = optionPart === 4;
  const assuranceVisible = optionPart === 2;

  const totalLigne = lignes.find(l => l.isTotalRow);
  const grandTotal = totalLigne?.total || 0;

  const imprimer = () => {
    const now = new Date();
    const dateStr  = now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const heureStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const nomUtilisateur = (typeof window !== 'undefined'
      ? localStorage.getItem('nom_utilisateur') || localStorage.getItem('userName') || 'Utilisateur'
      : 'Utilisateur');

    const optionLabelMap: Record<number, string> = {
      1: 'TOUS (ASSURANCE + PATIENT)', 2: 'PART ASSURANCE',
      3: 'PART PATIENT', 4: 'ENCAISSEMENT PATIENT',
    };
    const modeAffichage = avecReport ? 'AVEC REPORT' : 'SANS REPORT';
    const typeLabel    = optionLabelMap[optionPart] || '';
    const assuranceLabel = assuranceVisible ? assurance : '';
    const modeLabel    = modePaiementVisible ? modePaiement : '';
    const badges = [typeLabel, modeLabel, assuranceLabel].filter(s => s && s !== 'TOUS LES PAIEMENTS' && s !== 'TOUTES LES ASSURANCES');
    const nbLignes = lignes.filter(l => l.libelle && !l.isTotalRow && !l.isClotureRow && !l.isReportRow && !l.isTotalDecaissRow).length;

    const colorMap = (l: LigneBudget) => {
      if (l.isReportRow)       return { bg: '#fffde7', color: '#e65100', fw: 'bold',   border: '#f9a825' };
      if (l.isTotalRow)        return { bg: '#ffcdd2', color: '#b71c1c', fw: 'bold',   border: '#e57373' };
      if (l.isTotalDecaissRow) return { bg: '#fce4ec', color: '#880e4f', fw: 'bold',   border: '#f48fb1' };
      if (l.isClotureRow)      return { bg: '#e8f5e9', color: '#1b5e20', fw: 'bold',   border: '#66bb6a' };
      if (l.isDecaissRow)      return { bg: '#fff8f9', color: '#880e4f', fw: 'normal', border: '#e0e0e0' };
      return                          { bg: '#ffffff', color: '#212121', fw: 'normal', border: '#e0e0e0' };
    };

    const rows = lignes.map((l, idx) => {
      if (!l.libelle && l.mois.every(v => v === 0))
        return `<tr><td colspan="14" style="height:6px;background:#f5f5f5;border:none"></td></tr>`;
      const { bg, color, fw, border } = colorMap(l);
      const isSpec = l.isTotalRow || l.isTotalDecaissRow || l.isClotureRow || l.isReportRow;
      const rowBg  = !isSpec && idx % 2 === 1 ? '#f7f9fc' : bg;
      const cells  = l.mois.map(v =>
        `<td style="text-align:right;padding:3px 6px;border:1px solid ${border};color:${color}">${v !== 0 ? fmt(v) : '<span style="color:#bbb">0</span>'}</td>`
      ).join('');
      return `<tr style="background:${rowBg};font-weight:${fw}">
        <td style="padding:4px 8px;border:1px solid ${border};color:${color};white-space:normal;max-width:140px">${l.libelle}</td>
        ${cells}
        <td style="text-align:right;padding:4px 8px;border:1px solid ${border};font-weight:bold;color:${color};background:${isSpec ? bg : '#eef2ff'}">${fmt(l.total)}</td>
      </tr>`;
    }).join('');

    const thMois = MOIS_FULL.map(m =>
      `<th style="text-align:center;padding:5px 3px;border:1px solid #b0bec5;font-size:0.68rem;white-space:nowrap">${m.substring(0,4)}</th>`
    ).join('');

    const badgesHtml = badges.map(b =>
      `<span style="display:inline-block;background:#e3f2fd;color:#1565c0;border:1px solid #90caf9;border-radius:4px;padding:1px 8px;font-size:0.65rem;font-weight:700;margin:0 3px">${b}</span>`
    ).join('');

    const headerHTML  = generatePrintHeader(entreprise);
    const footerHTML  = generatePrintFooter(entreprise);
    const baseCss     = getPrintCSS();

    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">
<title>Budget de Trésorerie ${annee}</title>
<style>
${baseCss}
@page { margin: 1cm 0.8cm; size: A4 landscape; }
body { font-family: Arial, sans-serif; font-size: 0.72rem; color: #212121; margin: 0; padding: 0; }
.header { display:flex; align-items:center; gap:16px; border-bottom:2px solid #1565c0; padding-bottom:8px; margin-bottom:10px; }
.header img { max-height:80px; max-width:90px; object-fit:contain; }
.header-text { flex:1; }
.doc-meta { display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; }
.titre-principal { font-size:1rem; font-weight:900; letter-spacing:1px; color:#1565c0; text-transform:uppercase; }
.sous-titre-block { display:flex; align-items:center; gap:8px; margin-top:3px; flex-wrap:wrap; }
.badge-mode { display:inline-block; background:#1565c0; color:#fff; border-radius:4px; padding:2px 10px; font-size:0.7rem; font-weight:800; letter-spacing:1px; }
.date-top { font-size:0.65rem; color:#777; text-align:right; }
table { width:100%; border-collapse:collapse; margin-top:8px; font-size:0.68rem; }
thead tr { background:linear-gradient(135deg,#1565c0,#0288d1); color:#fff; }
thead th { padding:5px 3px; border:1px solid #0d47a1; font-weight:700; }
thead th.col-libelle { text-align:left; padding-left:8px; min-width:130px; }
thead th.col-total { background:#0d47a1; }
tbody tr:nth-child(even) td { background-color:inherit; }
.nb-lignes { font-size:0.68rem; color:#546e7a; margin-top:8px; padding:4px 0; border-top:1px solid #e0e0e0; }
.print-footer { display:flex; justify-content:space-between; font-size:0.62rem; color:#666; margin-top:10px; border-top:1px solid #cfd8dc; padding-top:5px; }
* { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
</style></head><body>

${headerHTML}

<div class="doc-meta">
  <div>
    <div class="titre-principal">&#128200; BUDGET DE TRÉSORERIE &mdash; <span style="color:#e65100">${annee}</span></div>
    <div class="sous-titre-block">
      <span class="badge-mode">${modeAffichage}</span>
      ${badgesHtml}
    </div>
  </div>
  <div class="date-top">Édité le ${dateStr} à ${heureStr}</div>
</div>

<table>
  <thead><tr>
    <th class="col-libelle">Désignation</th>
    ${thMois}
    <th class="col-total" style="text-align:center;min-width:80px">TOTAL</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>

<div class="nb-lignes">Nombre de lignes&nbsp;: <strong>${nbLignes}</strong></div>

${footerHTML}

<div class="print-footer">
  <span>Imprimé par&nbsp;<strong>${nomUtilisateur}</strong></span>
  <span>Le&nbsp;<strong>${dateStr}</strong>&nbsp;&agrave;&nbsp;<strong>${heureStr}</strong></span>
  <span>1 / 1</span>
</div>
</body></html>`;

    const win = window.open('', '_blank', 'width=1200,height=800');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  const totalDecaissLigne = lignes.find(l => l.isTotalDecaissRow);
  const clotureRow = lignes.find(l => l.isClotureRow);
  const ouvertureRow = lignes.find(l => l.isReportRow);

  const optionLabel = [
    '', 'Tous (Assurance + Patient)', 'Part Assurance', 'Part Patient', 'Encaissement Patient'
  ][optionPart];

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '8px 10px' }}>

      {/* ══ HEADER ══════════════════════════════════════════════════════ */}
      <div style={{
        background: 'linear-gradient(135deg, #1565c0 0%, #0288d1 50%, #26c6da 100%)',
        borderRadius: 8, padding: '8px 16px', marginBottom: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 20px rgba(2,136,209,0.3)'
      }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.68rem', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' }}>
            Module Comptabilité
          </div>
          <div style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 800, letterSpacing: 1 }}>
            Budget de Trésorerie
          </div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.72rem', marginTop: 1 }}>
            {optionLabel} — Exercice {annee}{avecReport ? ' · Avec Report' : ''}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <i className="bi bi-bar-chart-line-fill" style={{ fontSize: '1.8rem', color: 'rgba(255,255,255,0.25)' }}></i>
        </div>
      </div>

      {/* ══ KPIs ════════════════════════════════════════════════════════ */}
      {lignes.length > 0 && (
        <Row className="g-2 mb-2">
          {[
            { label: 'Total Encaissement', value: grandTotal, bg: 'linear-gradient(135deg,#e53935,#ef9a9a)', icon: 'bi-arrow-down-circle-fill', color: '#fff' },
            { label: 'Total Décaissement', value: totalDecaissLigne?.total || 0, bg: 'linear-gradient(135deg,#8e24aa,#f48fb1)', icon: 'bi-arrow-up-circle-fill', color: '#fff' },
            { label: 'Solde de Clôture', value: clotureRow ? clotureRow.mois.reduce((s, v) => s + v, 0) : grandTotal - (totalDecaissLigne?.total || 0), bg: 'linear-gradient(135deg,#2e7d32,#a5d6a7)', icon: 'bi-wallet2', color: '#fff' },
            ...(ouvertureRow ? [{ label: "Solde d'Ouverture", value: ouvertureRow.mois[0], bg: 'linear-gradient(135deg,#e65100,#ffe0b2)', icon: 'bi-calendar-check', color: '#fff' }] : []),
          ].map((kpi, ki) => (
            <Col key={ki} xs={6} md={3}>
              <div style={{ background: kpi.bg, borderRadius: 8, padding: '8px 12px', color: kpi.color, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 600, opacity: 0.85, textTransform: 'uppercase', letterSpacing: 1 }}>{kpi.label}</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, marginTop: 2 }}>{fmt(kpi.value)} F</div>
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
          <Row className="g-3 align-items-end">

            {/* Options Part — 4 choix en grille 2×2 */}
            <Col xs={12} md="auto">
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#546e7a', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
                Type d&apos;analyse
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 10px' }}>
                {[
                  { val: 1, label: 'Tous (Assurance + Patient)', icon: 'bi-grid-3x3-gap' },
                  { val: 3, label: 'Part Patient', icon: 'bi-person' },
                  { val: 2, label: 'Part Assurance', icon: 'bi-shield-check' },
                  { val: 4, label: 'Encaissement Patient', icon: 'bi-cash-coin' },
                ].map(opt => (
                  <label key={opt.val} style={{
                    display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                    padding: '3px 8px', borderRadius: 5, fontSize: '0.72rem', fontWeight: 500,
                    background: optionPart === opt.val ? '#e3f2fd' : 'transparent',
                    border: optionPart === opt.val ? '1.5px solid #1565c0' : '1.5px solid transparent',
                    color: optionPart === opt.val ? '#1565c0' : '#455a64',
                    transition: 'all 0.15s',
                  }}>
                    <input type="radio" name="optionPart" checked={optionPart === opt.val}
                      onChange={() => handleOptionPart(opt.val)} style={{ accentColor: '#1565c0' }} />
                    <i className={`bi ${opt.icon}`}></i> {opt.label}
                  </label>
                ))}
              </div>
            </Col>

            {/* Option AVEC/SANS REPORT */}
            {afficherVisible && (
              <Col xs="auto">
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#546e7a', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
                  Mode rapport
                </div>
                {[{ label: 'Sans report', val: false }, { label: 'Avec report', val: true }].map(r => (
                  <label key={String(r.val)} style={{
                    display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer',
                    padding: '3px 8px', borderRadius: 5, fontSize: '0.72rem', fontWeight: 500, marginBottom: 2,
                    background: avecReport === r.val ? '#e8f5e9' : 'transparent',
                    border: avecReport === r.val ? '1.5px solid #2e7d32' : '1.5px solid transparent',
                    color: avecReport === r.val ? '#2e7d32' : '#455a64',
                  }}>
                    <input type="radio" name="report" checked={avecReport === r.val}
                      onChange={() => setAvecReport(r.val)} style={{ accentColor: '#2e7d32' }} />
                    {r.label}
                  </label>
                ))}
              </Col>
            )}

            {/* Mode paiement */}
            {modePaiementVisible && (
              <Col xs="auto">
                <Form.Label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#546e7a', letterSpacing: 1, textTransform: 'uppercase' }}>
                  Mode de paiement
                </Form.Label>
                <Form.Select size="sm" value={modePaiement} onChange={e => setModePaiement(e.target.value)}
                  style={{ minWidth: 150, borderRadius: 6, borderColor: '#b0bec5', fontSize: '0.76rem' }}>
                  <option value="TOUS LES PAIEMENTS">TOUS LES PAIEMENTS</option>
                  {modesPaiement.map(m => <option key={m} value={m}>{m}</option>)}
                </Form.Select>
              </Col>
            )}

            {/* Assurance */}
            {assuranceVisible && (
              <Col xs="auto">
                <Form.Label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#546e7a', letterSpacing: 1, textTransform: 'uppercase' }}>
                  Assurance
                </Form.Label>
                <Form.Select size="sm" value={assurance} onChange={e => setAssurance(e.target.value)}
                  style={{ minWidth: 170, borderRadius: 6, borderColor: '#b0bec5', fontSize: '0.76rem' }}>
                  <option value="TOUTES LES ASSURANCES">Toutes les assurances</option>
                  {assurances.map(nom => <option key={nom} value={nom}>{nom}</option>)}
                </Form.Select>
              </Col>
            )}

            {/* Année */}
            <Col xs="auto">
              <Form.Label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#546e7a', letterSpacing: 1, textTransform: 'uppercase' }}>
                Exercice
              </Form.Label>
              <Form.Select size="sm" value={annee} onChange={e => setAnnee(Number(e.target.value))}
                style={{ width: 88, borderRadius: 6, borderColor: '#b0bec5', fontSize: '0.76rem' }}>
                {[anneeActuelle - 2, anneeActuelle - 1, anneeActuelle, anneeActuelle + 1].map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </Form.Select>
            </Col>

            {/* Boutons action */}
            <Col xs="auto" className="ms-auto d-flex gap-2">
              <Button onClick={charger} disabled={loading} style={{
                background: 'linear-gradient(135deg,#1565c0,#0288d1)', border: 'none',
                fontWeight: 700, fontSize: '0.78rem', padding: '5px 14px', borderRadius: 6,
                boxShadow: '0 2px 6px rgba(2,136,209,0.3)',
              }}>
                {loading
                  ? <><Spinner size="sm" animation="border" className="me-1" />Chargement…</>
                  : <><i className="bi bi-search me-1"></i>Afficher</>}
              </Button>
              <Button variant="outline-secondary" disabled={loading || lignes.length === 0}
                onClick={imprimer}
                style={{ borderRadius: 6, fontWeight: 600, fontSize: '0.78rem', padding: '5px 10px' }}>
                <i className="bi bi-printer-fill me-1"></i>Imprimer
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ══ TABLEAU ══════════════════════════════════════════════════════ */}
      <Card style={{ borderRadius: 8, border: 'none', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
        {/* Titre bande */}
        <div style={{
          background: 'linear-gradient(90deg,#1565c0,#0288d1)', color: '#fff',
          padding: '7px 14px', borderRadius: '8px 8px 0 0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontWeight: 700, fontSize: '0.78rem', letterSpacing: 1 }}>
            <i className="bi bi-table me-2"></i>
            ÉTAT MENSUEL — {optionLabel.toUpperCase()} — {annee}
          </span>
          {lignes.length > 0 && (
            <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>
              {lignes.filter(l => l.libelle && !l.isTotalRow && !l.isClotureRow && !l.isReportRow && !l.isTotalDecaissRow).length} ligne(s)
            </span>
          )}
        </div>
        <Card.Body className="p-0">
          <div style={{ overflowX: 'auto' }}>
            <Table bordered className="mb-0" style={{ fontSize: '0.73rem', minWidth: 1100, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#eceff1', position: 'sticky', top: 0, zIndex: 1 }}>
                  <th style={{ minWidth: 150, padding: '6px 10px', borderRight: '2px solid #b0bec5', fontWeight: 700, color: '#37474f', background: '#cfd8dc' }}>
                    Libellé / Opération
                  </th>
                  {MOIS_LABELS.map((m, mi) => (
                    <th key={m} style={{
                      textAlign: 'center', padding: '6px 3px', minWidth: 72, fontWeight: 700,
                      color: '#37474f', borderRight: '1px solid #cfd8dc',
                      background: mi % 2 === 0 ? '#eceff1' : '#e3e8ed',
                    }}>{m.slice(0, 4)}</th>
                  ))}
                  <th style={{
                    textAlign: 'center', padding: '6px 6px', minWidth: 95, fontWeight: 800,
                    background: '#1565c0', color: '#fff', borderLeft: '3px solid #0d47a1',
                  }}>TOTAL ANNUEL</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={14} style={{ textAlign: 'center', padding: '40px', color: '#78909c' }}>
                    <Spinner animation="border" size="sm" className="me-2" />Calcul en cours…
                  </td></tr>
                ) : lignes.length === 0 ? (
                  <tr>
                    <td colSpan={14} style={{ textAlign: 'center', padding: '50px', color: '#90a4ae' }}>
                      <i className="bi bi-bar-chart" style={{ fontSize: '2.5rem', display: 'block', marginBottom: 8 }}></i>
                      Sélectionnez les filtres et cliquez sur <strong>Afficher</strong>
                    </td>
                  </tr>
                ) : lignes.map((l, i) => {
                  const isTot = l.isTotalRow;
                  const isTotD = l.isTotalDecaissRow;
                  const isRep = l.isReportRow;
                  const isClo = l.isClotureRow;
                  const isDec = l.isDecaissRow;
                  const isEmpty = !l.libelle && l.mois.every(v => v === 0);
                  // Couleurs exactes WinDev
                  let bg = i % 2 === 0 ? '#fff' : '#fafafa';
                  let color = '#212121';
                  let fw: 'normal' | 'bold' = 'normal';
                  // totalBg = null → hérite de bg (toute la ligne uniformément colorée)
                  let totalBg: string | undefined = undefined;
                  let totalColor = color;

                  if (isEmpty) bg = '#f5f5f5';                                                    // GrisClair
                  else if (isRep)  { bg = '#fffde7'; color = '#f57f17'; totalColor = '#f57f17'; } // JauneClair
                  else if (isTot)  { bg = '#ffcdd2'; color = '#b71c1c'; fw = 'bold'; totalBg = '#ef9a9a'; totalColor = '#b71c1c'; } // RougeClair
                  else if (isTotD) { bg = '#fce4ec'; color = '#880e4f'; fw = 'bold'; totalBg = '#f48fb1'; totalColor = '#880e4f'; } // RoseClair
                  else if (isClo)  { bg = '#e8f5e9'; color = '#1b5e20'; fw = 'bold'; totalBg = '#a5d6a7'; totalColor = '#1b5e20'; } // VertClair
                  else if (isDec)  { bg = '#fce4ec'; color = '#880e4f'; totalColor = '#880e4f'; } // RoseClair lignes décaiss
                  // lignes encaissement normales : bg alternant blanc/gris, totalBg = bg

                  if (isEmpty) return <tr key={i} style={{ height: 6, background: bg }}><td colSpan={14} style={{ border: 'none', padding: 0 }} /></tr>;
                  return (
                    <tr key={i} style={{ background: bg, color, fontWeight: fw }}>
                      <td style={{ padding: '3px 8px', borderRight: '1px solid #ddd', whiteSpace: 'normal', lineHeight: 1.2 }}>{l.libelle}</td>
                      {l.mois.map((v, mi) => (
                        <td key={mi} style={{ textAlign: 'right', padding: '3px 4px', borderRight: '1px solid #ddd' }}>
                          {v !== 0 ? fmt(v) : '0'}
                        </td>
                      ))}
                      <td style={{ textAlign: 'right', padding: '3px 6px', fontWeight: 'bold', borderLeft: '2px solid #ccc', background: totalBg ?? bg, color: totalColor }}>
                        {fmt(l.total)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
