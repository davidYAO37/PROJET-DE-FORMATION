'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Button, Form, Table, Spinner, Badge } from 'react-bootstrap';

const fmt = (n: number) => (n || 0).toLocaleString('fr-FR');
const today = () => new Date().toISOString().split('T')[0];

interface Debiteur {
  patient: string;
  typePatient: string;
  assurance: string;
  totalDu: number;
  totalPaye: number;
  resteAPayer: number;
  derniereDate: string;
  nbFactures: number;
}

export default function DebiteursPage() {
  const [entrepriseId, setEntrepriseId] = useState('');
  const [dateDebut, setDateDebut] = useState('2020-01-01');
  const [dateFin, setDateFin] = useState(today());
  const [loading, setLoading] = useState(false);
  const [debiteurs, setDebiteurs] = useState<Debiteur[]>([]);
  const [recherche, setRecherche] = useState('');
  const [filtreType, setFiltreType] = useState('TOUS');

  useEffect(() => {
    setEntrepriseId(localStorage.getItem('IdEntreprise') || '');
  }, []);

  const charger = useCallback(async () => {
    if (!entrepriseId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/comptabilite/bilan?dateDebut=${dateDebut}&dateFin=${dateFin}&entrepriseId=${entrepriseId}`);
      if (!res.ok) return;
      const json = await res.json();
      const lignes = (json.data || []).filter((l: any) => (l.resteAPayer || 0) > 0);

      // Regrouper par patient
      const map: Record<string, Debiteur> = {};
      for (const l of lignes) {
        const key = l.patient || 'Inconnu';
        if (!map[key]) {
          map[key] = {
            patient: key,
            typePatient: l.typePatient || '',
            assurance: l.assurance || '',
            totalDu: 0,
            totalPaye: 0,
            resteAPayer: 0,
            derniereDate: l.date,
            nbFactures: 0,
          };
        }
        map[key].totalDu += l.montantTotal || 0;
        map[key].totalPaye += l.montantEncaisse || 0;
        map[key].resteAPayer += l.resteAPayer || 0;
        map[key].nbFactures++;
        if (new Date(l.date) > new Date(map[key].derniereDate)) {
          map[key].derniereDate = l.date;
        }
      }

      const result = Object.values(map).sort((a, b) => b.resteAPayer - a.resteAPayer);
      setDebiteurs(result);
    } finally {
      setLoading(false);
    }
  }, [entrepriseId, dateDebut, dateFin]);

  useEffect(() => { if (entrepriseId) charger(); }, [charger, entrepriseId]);

  const filtres = debiteurs.filter(d => {
    const matchRecherche = !recherche || d.patient.toLowerCase().includes(recherche.toLowerCase()) || d.assurance.toLowerCase().includes(recherche.toLowerCase());
    const matchType = filtreType === 'TOUS' || (filtreType === 'ASSURE' ? d.typePatient !== '' && d.typePatient !== 'NON ASSURE' : d.typePatient === 'NON ASSURE' || d.typePatient === '');
    return matchRecherche && matchType;
  });

  const totalReste = filtres.reduce((s, d) => s + d.resteAPayer, 0);

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
          { label: 'Nb Débiteurs',        value: filtres.length, bg: 'linear-gradient(135deg,#e65100,#ffb74d)', icon: 'bi-people-fill', isCount: true },
          { label: 'Factures impayées',   value: filtres.reduce((s,d)=>s+d.nbFactures,0), bg: 'linear-gradient(135deg,#880e4f,#f48fb1)', icon: 'bi-receipt', isCount: true },
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
            <Col xs={12} md={3}><Form.Label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#546e7a', letterSpacing: 1, textTransform: 'uppercase' }}>Recherche</Form.Label><Form.Control type="text" size="sm" placeholder="Nom patient, assurance…" value={recherche} onChange={e => setRecherche(e.target.value)} style={{ borderRadius: 6, borderColor: '#b0bec5', fontSize: '0.76rem' }} /></Col>
            <Col xs="auto" className="ms-auto d-flex gap-2">
              <Button onClick={charger} disabled={loading} style={{ background: 'linear-gradient(135deg,#e65100,#f57c00)', border: 'none', fontWeight: 700, fontSize: '0.78rem', padding: '5px 14px', borderRadius: 6 }}>
                {loading ? <><Spinner size="sm" animation="border" className="me-1" />…</> : <><i className="bi bi-search me-1"></i>Rechercher</>}
              </Button>
              <Button variant="outline-secondary" onClick={charger} disabled={loading} style={{ borderRadius: 6, fontSize: '0.78rem', padding: '5px 10px' }}><i className="bi bi-arrow-clockwise"></i></Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* TABLEAU */}
      <Card style={{ borderRadius: 8, border: 'none', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
        <div style={{ background: 'linear-gradient(90deg,#e65100,#f57c00)', color: '#fff', padding: '7px 14px', borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: '0.78rem', letterSpacing: 1 }}><i className="bi bi-table me-2"></i>LISTE DES DÉBITEURS</span>
          {filtres.length > 0 && <span style={{ fontSize: '0.72rem', opacity: 0.85 }}>{filtres.length} débiteur(s)</span>}
        </div>
        <Card.Body className="p-0">
          <div style={{ overflowX: 'auto', maxHeight: '52vh', overflowY: 'auto' }}>
            <Table bordered className="mb-0" style={{ fontSize: '0.73rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  {['Patient','Type','Assurance','Total Dû','Payé','Reste','Nb Fact.','Dernière date','% Payé'].map((h, hi) => (
                    <th key={hi} style={{ background: hi === 5 ? '#ffcdd2' : '#cfd8dc', color: hi === 5 ? '#b71c1c' : '#37474f', padding: '6px 8px', fontWeight: 700, whiteSpace: 'nowrap', textAlign: [3,4,5,6].includes(hi) ? 'right' : 'left', borderRight: '1px solid #b0bec5' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#78909c' }}><Spinner animation="border" size="sm" className="me-2" />Chargement…</td></tr>
                ) : filtres.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '50px', color: '#90a4ae' }}>
                    <i className="bi bi-check-circle" style={{ fontSize: '2.5rem', display: 'block', marginBottom: 8, color: '#43a047' }}></i>Aucun débiteur trouvé
                  </td></tr>
                ) : filtres.map((d, i) => {
                  const pct = d.totalDu > 0 ? Math.round((d.totalPaye / d.totalDu) * 100) : 0;
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fff8f0', borderLeft: `3px solid ${d.resteAPayer > 50000 ? '#b71c1c' : '#f57c00'}` }}>
                      <td style={{ padding: '3px 8px', fontWeight: 700, borderRight: '1px solid #e0e0e0' }}>{d.patient}</td>
                      <td style={{ padding: '3px 8px', borderRight: '1px solid #e0e0e0' }}><Badge bg={d.typePatient && d.typePatient !== 'NON ASSURE' ? 'info' : 'secondary'} style={{ fontSize: '0.6rem' }}>{d.typePatient || 'NON ASSURE'}</Badge></td>
                      <td style={{ padding: '3px 8px', borderRight: '1px solid #e0e0e0' }}>{d.assurance || '-'}</td>
                      <td style={{ padding: '3px 8px', textAlign: 'right', fontWeight: 'bold', borderRight: '1px solid #e0e0e0' }}>{fmt(d.totalDu)}</td>
                      <td style={{ padding: '3px 8px', textAlign: 'right', color: '#2e7d32', borderRight: '1px solid #e0e0e0' }}>{fmt(d.totalPaye)}</td>
                      <td style={{ padding: '3px 8px', textAlign: 'right', fontWeight: 'bold', color: '#b71c1c', borderRight: '1px solid #e0e0e0' }}>{fmt(d.resteAPayer)}</td>
                      <td style={{ padding: '3px 8px', textAlign: 'right', borderRight: '1px solid #e0e0e0' }}>{d.nbFactures}</td>
                      <td style={{ padding: '3px 8px', whiteSpace: 'nowrap', borderRight: '1px solid #e0e0e0' }}>{d.derniereDate ? new Date(d.derniereDate).toLocaleDateString('fr-FR') : '-'}</td>
                      <td style={{ padding: '3px 8px', minWidth: 90 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ flex: 1, height: 5, background: '#e0e0e0', borderRadius: 3 }}>
                            <div style={{ height: 5, borderRadius: 3, width: `${pct}%`, background: pct >= 80 ? '#43a047' : pct >= 50 ? '#f57c00' : '#e53935' }} />
                          </div>
                          <small style={{ fontSize: '0.65rem', fontWeight: 700 }}>{pct}%</small>
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
          <span style={{ fontSize: '0.72rem', color: '#78909c' }}>{filtres.length} débiteur(s)</span>
          <div style={{ textAlign: 'right' }}><div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#b71c1c', textTransform: 'uppercase' }}>Total reste à payer</div><div style={{ fontSize: '1rem', fontWeight: 800, color: '#b71c1c' }}>{fmt(totalReste)} F</div></div>
        </div>
      </Card>
    </div>
  );
}
