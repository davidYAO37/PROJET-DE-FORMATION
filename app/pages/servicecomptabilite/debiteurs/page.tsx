'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Button, Form, Table, Spinner, Badge, Tabs, Tab } from 'react-bootstrap';
import { useEntreprise } from '@/hooks/useEntreprise';
import { generatePrintHeader, generatePrintFooter, createPrintWindow } from '@/utils/printRecu';

const fmt = (n: number) => (n || 0).toLocaleString('fr-FR');
const today = () => new Date().toISOString().split('T')[0];

interface FactureNonSoldée {
  id: string;
  type: 'CONSULTATION' | 'FACTURATION';
  date: string | Date;
  codePrestation?: string;
  designation?: string;
  patient: string;
  typePatient: string;
  assurance: string;
  montantTotal: number;
  montantEncaisse: number;
  resteAPayer: number;
  derniereDatePaiement?: string | Date;
  pourcentagePaye: number;
}

const typeAssure = (tp: string) => {
  const v = (tp || '').toUpperCase().trim();
  if (!v || v.includes('NON')) return false;
  return v.includes('ASSURE') || v.includes('ASSURÉ') || v.includes('MUTUALISTE') || v === 'OUI';
};

export default function DebiteursPage() {
  const { entreprise } = useEntreprise();
  const [dateDebut, setDateDebut] = useState('2020-01-01');
  const [dateFin, setDateFin] = useState(today());
  const [loading, setLoading] = useState(false);
  const [facturesNonSoldées, setFacturesNonSoldées] = useState<FactureNonSoldée[]>([]);
  const [recherche, setRecherche] = useState('');
  const [filtreType, setFiltreType] = useState('TOUS');
  const [onglet, setOnglet] = useState<'factures' | 'historique'>('factures');

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = onglet === 'historique'
        ? `/api/comptabilite/historique-non-solde?dateDebut=${dateDebut}&dateFin=${dateFin}`
        : `/api/comptabilite/factures-non-soldees?dateDebut=${dateDebut}&dateFin=${dateFin}`;
      const res = await fetch(endpoint);
      if (!res.ok) return;
      const json = await res.json();
      setFacturesNonSoldées(json.data || []);
    } catch (error) {
      console.error('Erreur chargement factures non soldées:', error);
      setFacturesNonSoldées([]);
    } finally {
      setLoading(false);
    }
  }, [dateDebut, dateFin, onglet]);

  useEffect(() => { charger(); }, [charger]);

  const recharger = useCallback(() => {
    charger();
  }, [charger]);

  const filtres = facturesNonSoldées.filter(f => {
    const matchRecherche = !recherche || 
      f.patient.toLowerCase().includes(recherche.toLowerCase()) ||
      f.designation?.toLowerCase().includes(recherche.toLowerCase()) ||
      f.typePatient.toLowerCase().includes(recherche.toLowerCase()) ||
      f.assurance.toLowerCase().includes(recherche.toLowerCase());
    const matchType = filtreType === 'TOUS' || (filtreType === 'ASSURE' ? typeAssure(f.typePatient) : !typeAssure(f.typePatient));
    return matchRecherche && matchType;
  });

  const totalReste = filtres.reduce((s, f) => s + f.resteAPayer, 0);
  const montantTotal = filtres.reduce((s, f) => s + f.montantTotal, 0);

  const imprimer = useCallback(() => {
    const titre = onglet === 'historique' ? 'HISTORIQUE FACTURES NON SOLDÉES' : 'FACTURES NON SOLDÉES';
    const headers = onglet === 'historique'
      ? ['Date Facturation', 'Type', 'Code', 'Désignation', 'Patient', 'Type', 'Assurance', 'Total', 'Payé', 'Reste', '% Payé']
      : ['Date Facturation', 'Type', 'Code', 'Désignation', 'Patient', 'Type', 'Assurance', 'Total', 'Payé', 'Reste', 'Dernier Paiement', '% Payé'];

    const lignes = filtres.map(f => {
      const dernierPaiement = f.derniereDatePaiement ? new Date(f.derniereDatePaiement).toLocaleDateString('fr-FR') : '-';
      const values = [
        f.date ? new Date(f.date).toLocaleDateString('fr-FR') : '-',
        f.type,
        f.codePrestation || '-',
        f.designation || '-',
        f.patient,
        f.typePatient || 'NON ASSURE',
        f.assurance || '-',
        fmt(f.montantTotal),
        fmt(f.montantEncaisse),
        fmt(f.resteAPayer)
      ];
      if (onglet !== 'historique') values.push(dernierPaiement);
      values.push(`${f.pourcentagePaye}%`);

      const rightIndices = onglet === 'historique'
        ? [7, 8, 9, 10]
        : [7, 8, 9, 11];

      return values.map((v, i) => {
        const align = rightIndices.includes(i) ? 'right' : 'left';
        return `<td style="text-align: ${align}">${v}</td>`;
      }).join('');
    });

    const contentHTML = `
      <div class="print-area">
        <div class="sub-header">${titre}</div>
        <div style="text-align: center; font-size: 12px; margin-bottom: 15px; color: #555;">
          Période : ${dateDebut.split('-').reverse().join('/')} — ${dateFin.split('-').reverse().join('/')}
        </div>
        <table class="table">
          <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
          <tbody>${lignes.map(l => `<tr>${l}</tr>`).join('')}</tbody>
        </table>
        <div style="margin-top: 15px; font-weight: bold; text-align: right; font-size: 12px;">
          Total reste : ${fmt(totalReste)} F | Nombre de factures : ${filtres.length}
        </div>
      </div>
    `;

    createPrintWindow(
      titre,
      generatePrintHeader(entreprise),
      contentHTML,
      generatePrintFooter(entreprise)
    );
  }, [filtres, onglet, dateDebut, dateFin, totalReste, entreprise]);

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '8px 10px' }}>

      {/* HEADER */}
      <div style={{ background: 'linear-gradient(135deg,#e65100 0%,#f57c00 50%,#ff9800 100%)', borderRadius: 8, padding: '8px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(230,81,0,0.3)' }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.68rem', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' }}>Module Comptabilité</div>
          <div style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 800, letterSpacing: 1 }}>Les Débiteurs</div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.72rem', marginTop: 1 }}>{dateDebut.split('-').reverse().join('/')} — {dateFin.split('-').reverse().join('/')}</div>
        </div>
        <i className="bi bi-people-fill" style={{ fontSize: '1.8rem', color: 'rgba(255,255,255,0.25)' }}></i>
      </div>

      {/* KPIs */}
      <Row className="g-2 mb-2">
        {[
          { label: 'Total Reste à Payer', value: totalReste, bg: 'linear-gradient(135deg,#b71c1c,#ef9a9a)', icon: 'bi-exclamation-triangle-fill' },
          { label: 'Nb Factures', value: filtres.length, bg: 'linear-gradient(135deg,#e65100,#ffb74d)', icon: 'bi-receipt', isCount: true },
          { label: 'Montant total', value: montantTotal, bg: 'linear-gradient(135deg,#880e4f,#f48fb1)', icon: 'bi-cash-coin' },
        ].map((kpi, ki) => (
          <Col key={ki} xs={12} md={4}>
            <div style={{ background: kpi.bg, borderRadius: 8, padding: '8px 12px', color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 600, opacity: 0.85, textTransform: 'uppercase', letterSpacing: 1 }}>{kpi.label}</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, marginTop: 2 }}>{(kpi as any).isCount ? kpi.value : `${fmt(kpi.value)} F`}</div>
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
                <option value="TOUS">Tous</option>
                <option value="ASSURE">Assurés</option>
                <option value="NON ASSURE">Non assurés</option>
              </Form.Select>
            </Col>
            <Col xs={12} md={3}><Form.Label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#546e7a', letterSpacing: 1, textTransform: 'uppercase' }}>Recherche</Form.Label><Form.Control type="text" size="sm" placeholder="Patient, désignation, assurance…" value={recherche} onChange={e => setRecherche(e.target.value)} style={{ borderRadius: 6, borderColor: '#b0bec5', fontSize: '0.76rem' }} /></Col>
            <Col xs="auto" className="ms-auto d-flex gap-2">
              <Button onClick={recharger} disabled={loading} style={{ background: 'linear-gradient(135deg,#e65100,#f57c00)', border: 'none', fontWeight: 700, fontSize: '0.78rem', padding: '5px 14px', borderRadius: 6 }}>
                {loading ? <><Spinner size="sm" animation="border" className="me-1" />…</> : <><i className="bi bi-search me-1"></i>Rechercher</>}
              </Button>
              <Button variant="outline-secondary" onClick={recharger} disabled={loading} style={{ borderRadius: 6, fontSize: '0.78rem', padding: '5px 10px' }}><i className="bi bi-arrow-clockwise"></i></Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* TABLEAU */}
      <Card style={{ borderRadius: 8, border: 'none', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
        <div style={{ background: 'linear-gradient(90deg,#e65100,#f57c00)', color: '#fff', padding: '7px 14px', borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: '0.78rem', letterSpacing: 1 }}><i className="bi bi-table me-2"></i>{onglet === 'historique' ? 'HISTORIQUE FACTURES NON SOLDÉES' : 'FACTURES NON SOLDÉES'}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Button onClick={imprimer} variant="light" size="sm" style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 4, fontWeight: 700, color: '#e65100' }}>
              <i className="bi bi-printer me-1"></i>Imprimer
            </Button>
            <span style={{ fontSize: '0.72rem', opacity: 0.85 }}>{`${filtres.length} facture(s)`}</span>
          </div>
        </div>
        <Card.Body className="p-0">
          <Tabs activeKey={onglet} onSelect={(k) => setOnglet((k as 'factures' | 'historique') || 'factures')} style={{ fontSize: '0.75rem', background: '#fff3e0', padding: '6px 14px 0' }}>
            <Tab eventKey="factures" title={<span><i className="bi bi-receipt me-1"></i>Factures non soldées</span>} />
            <Tab eventKey="historique" title={<span><i className="bi bi-clock-history me-1"></i>Historique</span>} />
          </Tabs>
          <div style={{ overflowX: 'auto', maxHeight: '52vh', overflowY: 'auto' }}>
            <Table bordered className="mb-0" style={{ fontSize: '0.73rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  {(onglet === 'historique'
                    ? ['Date Facturation','Type','Code','Désignation','Patient','Type','Assurance','Total','Payé','Reste','% Payé']
                    : ['Date Facturation','Type','Code','Désignation','Patient','Type','Assurance','Total','Payé','Reste','Dernier Paiement','% Payé']
                  ).map((h, hi) => (
                    <th key={hi} style={{ background: h === 'Reste' ? '#ffcdd2' : '#cfd8dc', color: h === 'Reste' ? '#b71c1c' : '#37474f', padding: '6px 8px', fontWeight: 700, whiteSpace: 'nowrap', textAlign: ['Total','Payé','Reste','% Payé'].includes(h) ? 'right' : 'left', borderRight: '1px solid #b0bec5' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={onglet === 'historique' ? 11 : 12} style={{ textAlign: 'center', padding: '40px', color: '#78909c' }}><Spinner animation="border" size="sm" className="me-2" />Chargement…</td></tr>
                ) : filtres.length === 0 ? (
                  <tr><td colSpan={onglet === 'historique' ? 11 : 12} style={{ textAlign: 'center', padding: '50px', color: '#90a4ae' }}>
                    <i className="bi bi-check-circle" style={{ fontSize: '2.5rem', display: 'block', marginBottom: 8, color: '#43a047' }}></i>{onglet === 'historique' ? 'Aucune facture dans l\'historique' : 'Aucune facture non soldée'}
                  </td></tr>
                ) : filtres.map((f, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fff8f0', borderLeft: `3px solid ${f.resteAPayer > 50000 ? '#b71c1c' : '#f57c00'}` }}>
                    <td style={{ padding: '3px 8px', whiteSpace: 'nowrap', borderRight: '1px solid #e0e0e0' }}>{f.date ? new Date(f.date).toLocaleDateString('fr-FR') : '-'}</td>
                    <td style={{ padding: '3px 8px', borderRight: '1px solid #e0e0e0' }}><Badge bg={f.type === 'CONSULTATION' ? 'primary' : 'warning'} style={{ fontSize: '0.6rem' }}>{f.type}</Badge></td>
                    <td style={{ padding: '3px 8px', borderRight: '1px solid #e0e0e0' }}>{f.codePrestation || '-'}</td>
                    <td style={{ padding: '3px 8px', borderRight: '1px solid #e0e0e0' }}>{f.designation || '-'}</td>
                    <td style={{ padding: '3px 8px', fontWeight: 700, borderRight: '1px solid #e0e0e0' }}>{f.patient}</td>
                    <td style={{ padding: '3px 8px', borderRight: '1px solid #e0e0e0' }}><Badge bg={typeAssure(f.typePatient) ? 'info' : 'secondary'} style={{ fontSize: '0.6rem' }}>{f.typePatient || 'NON ASSURE'}</Badge></td>
                    <td style={{ padding: '3px 8px', borderRight: '1px solid #e0e0e0' }}>{f.assurance || '-'}</td>
                    <td style={{ padding: '3px 8px', textAlign: 'right', fontWeight: 'bold', borderRight: '1px solid #e0e0e0' }}>{fmt(f.montantTotal)}</td>
                    <td style={{ padding: '3px 8px', textAlign: 'right', color: '#2e7d32', borderRight: '1px solid #e0e0e0' }}>{fmt(f.montantEncaisse)}</td>
                    <td style={{ padding: '3px 8px', textAlign: 'right', fontWeight: 'bold', color: '#b71c1c', borderRight: '1px solid #e0e0e0' }}>{fmt(f.resteAPayer)}</td>
                    {onglet !== 'historique' && (
                      <td style={{ padding: '3px 8px', whiteSpace: 'nowrap', borderRight: '1px solid #e0e0e0' }}>{f.derniereDatePaiement ? new Date(f.derniereDatePaiement).toLocaleDateString('fr-FR') : '-'}</td>
                    )}
                    <td style={{ padding: '3px 8px', minWidth: 90 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ flex: 1, height: 5, background: '#e0e0e0', borderRadius: 3 }}>
                          <div style={{ height: 5, borderRadius: 3, width: `${f.pourcentagePaye}%`, background: f.pourcentagePaye >= 80 ? '#43a047' : f.pourcentagePaye >= 50 ? '#f57c00' : '#e53935' }} />
                        </div>
                        <small style={{ fontSize: '0.65rem', fontWeight: 700 }}>{f.pourcentagePaye}%</small>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
        <div style={{ background: '#eceff1', borderRadius: '0 0 8px 8px', padding: '6px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #cfd8dc' }}>
          <span style={{ fontSize: '0.72rem', color: '#78909c' }}>{`${filtres.length} facture(s)`}</span>
          <div style={{ textAlign: 'right' }}><div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#b71c1c', textTransform: 'uppercase' }}>Total reste factures</div><div style={{ fontSize: '1rem', fontWeight: 800, color: '#b71c1c' }}>{fmt(totalReste)} F</div></div>
        </div>
      </Card>
    </div>
  );
}