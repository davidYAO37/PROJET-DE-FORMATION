'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Button, Form, Table, Spinner, Badge } from 'react-bootstrap';

const fmt = (n: number) => (n || 0).toLocaleString('fr-FR');
const today = () => new Date().toISOString().split('T')[0];

interface ICaisseDoc {
  _id: string;
  typeC?: string;
  Operation?: string;
  MOtif?: string;
  MOntantC?: number;
  dAteC?: string;
  HeureC?: string;
  NomPrenoms?: string;
  serviceC?: string;
  AjouterParC?: string;
}

export default function EtatEntreesPage() {
  const [entrepriseId, setEntrepriseId] = useState('');
  const [dateDebut, setDateDebut] = useState(today());
  const [dateFin, setDateFin] = useState(today());
  const [loading, setLoading] = useState(false);
  const [docs, setDocs] = useState<ICaisseDoc[]>([]);
  const [recherche, setRecherche] = useState('');

  useEffect(() => {
    setEntrepriseId(localStorage.getItem('IdEntreprise') || '');
  }, []);

  const charger = useCallback(async () => {
    if (!entrepriseId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ entrepriseId, dateDebut, dateFin, typeC: 'Entrée de caisse' });
      const res = await fetch(`/api/caisse?${params}`);
      if (res.ok) {
        const json = await res.json();
        setDocs(json.data || []);
      }
    } finally {
      setLoading(false);
    }
  }, [entrepriseId, dateDebut, dateFin]);

  useEffect(() => { if (entrepriseId) charger(); }, [charger, entrepriseId]);

  const filtres = docs.filter(d =>
    !recherche ||
    (d.Operation || '').toLowerCase().includes(recherche.toLowerCase()) ||
    (d.MOtif || '').toLowerCase().includes(recherche.toLowerCase()) ||
    (d.NomPrenoms || '').toLowerCase().includes(recherche.toLowerCase()) ||
    (d.AjouterParC || '').toLowerCase().includes(recherche.toLowerCase())
  );

  const total = filtres.reduce((s, d) => s + (d.MOntantC || 0), 0);

  // Regrouper par opération
  const parOperation: Record<string, { count: number; total: number }> = {};
  for (const d of filtres) {
    const op = d.Operation || 'Autre';
    if (!parOperation[op]) parOperation[op] = { count: 0, total: 0 };
    parOperation[op].count++;
    parOperation[op].total += d.MOntantC || 0;
  }

  const periode = `${dateDebut.split('-').reverse().join('/')} — ${dateFin.split('-').reverse().join('/')}`;

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '8px 10px' }}>

      {/* HEADER */}
      <div style={{ background: 'linear-gradient(135deg,#1b5e20 0%,#2e7d32 50%,#43a047 100%)', borderRadius: 8, padding: '8px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(27,94,32,0.3)' }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.68rem', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' }}>Module Comptabilité</div>
          <div style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 800, letterSpacing: 1 }}>État des Entrées de Caisse</div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.72rem', marginTop: 1 }}>{periode}</div>
        </div>
        <i className="bi bi-arrow-down-circle-fill" style={{ fontSize: '1.8rem', color: 'rgba(255,255,255,0.25)' }}></i>
      </div>

      {/* KPIs */}
      <Row className="g-2 mb-2">
        {[
          { label: 'Total Entrées',       value: total,                        bg: 'linear-gradient(135deg,#1b5e20,#66bb6a)', icon: 'bi-cash-coin' },
          { label: 'Nb Opérations',       value: filtres.length,               bg: 'linear-gradient(135deg,#1565c0,#42a5f5)', icon: 'bi-list-check', isCount: true },
          { label: "Types d'opérations",  value: Object.keys(parOperation).length, bg: 'linear-gradient(135deg,#006064,#26c6da)', icon: 'bi-bar-chart-fill', isCount: true },
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

      {/* Récap par opération */}
      {Object.keys(parOperation).length > 0 && (
        <Row className="g-2 mb-2">
          {Object.entries(parOperation).map(([op, val], i) => (
            <Col key={i} xs={6} md={3}>
              <div style={{ background: '#fff', borderRadius: 8, padding: '6px 10px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', borderLeft: '3px solid #2e7d32' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#546e7a', textTransform: 'uppercase' }}>{op}</span>
                  <Badge bg="success" style={{ fontSize: '0.58rem' }}>{val.count}</Badge>
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#2e7d32' }}>{fmt(val.total)} F</div>
              </div>
            </Col>
          ))}
        </Row>
      )}

      {/* FILTRES */}
      <Card className="mb-2" style={{ borderRadius: 8, border: 'none', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
        <Card.Body style={{ padding: '8px 14px' }}>
          <Row className="g-2 align-items-end">
            <Col xs="auto"><Form.Label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#546e7a', letterSpacing: 1, textTransform: 'uppercase' }}>Début</Form.Label><Form.Control type="date" size="sm" value={dateDebut} onChange={e => setDateDebut(e.target.value)} style={{ borderRadius: 6, borderColor: '#b0bec5', fontSize: '0.76rem', width: 130 }} /></Col>
            <Col xs="auto"><Form.Label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#546e7a', letterSpacing: 1, textTransform: 'uppercase' }}>Fin</Form.Label><Form.Control type="date" size="sm" value={dateFin} onChange={e => setDateFin(e.target.value)} style={{ borderRadius: 6, borderColor: '#b0bec5', fontSize: '0.76rem', width: 130 }} /></Col>
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
          <span style={{ fontWeight: 700, fontSize: '0.78rem', letterSpacing: 1 }}><i className="bi bi-table me-2"></i>ENTRÉES DE CAISSE — {periode}</span>
          {filtres.length > 0 && <span style={{ fontSize: '0.72rem', opacity: 0.85 }}>{filtres.length} ligne(s)</span>}
        </div>
        <Card.Body className="p-0">
          <div style={{ overflowX: 'auto', maxHeight: '48vh', overflowY: 'auto' }}>
            <Table bordered className="mb-0" style={{ fontSize: '0.73rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  {['Date','Opération','Motif','Service','Personne','Saisi par','Montant'].map((h, hi) => (
                    <th key={hi} style={{ background: hi === 6 ? '#c8e6c9' : '#cfd8dc', color: hi === 6 ? '#1b5e20' : '#37474f', padding: '6px 8px', fontWeight: 700, whiteSpace: 'nowrap', textAlign: hi === 6 ? 'right' : 'left', borderRight: '1px solid #b0bec5' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#78909c' }}><Spinner animation="border" size="sm" className="me-2" />Chargement…</td></tr>
                ) : filtres.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '50px', color: '#90a4ae' }}>
                    <i className="bi bi-inbox" style={{ fontSize: '2.5rem', display: 'block', marginBottom: 8 }}></i>Aucune entrée pour cette période
                  </td></tr>
                ) : filtres.map((d, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f1f8f1', borderLeft: '3px solid #2e7d32' }}>
                    <td style={{ padding: '3px 8px', whiteSpace: 'nowrap', borderRight: '1px solid #e0e0e0' }}>
                      {d.dAteC ? new Date(d.dAteC).toLocaleDateString('fr-FR') : '-'}
                      {d.HeureC && <small style={{ color: '#90a4ae', marginLeft: 4 }}>{d.HeureC}</small>}
                    </td>
                    <td style={{ padding: '3px 8px', fontWeight: 700, borderRight: '1px solid #e0e0e0' }}>{d.Operation || '-'}</td>
                    <td style={{ padding: '3px 8px', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderRight: '1px solid #e0e0e0' }}>{d.MOtif || '-'}</td>
                    <td style={{ padding: '3px 8px', borderRight: '1px solid #e0e0e0' }}>{d.serviceC || '-'}</td>
                    <td style={{ padding: '3px 8px', borderRight: '1px solid #e0e0e0' }}>{d.NomPrenoms || '-'}</td>
                    <td style={{ padding: '3px 8px', borderRight: '1px solid #e0e0e0' }}>{d.AjouterParC || '-'}</td>
                    <td style={{ padding: '3px 8px', textAlign: 'right', fontWeight: 'bold', color: '#2e7d32' }}>+{fmt(d.MOntantC || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
        <div style={{ background: '#eceff1', borderRadius: '0 0 8px 8px', padding: '6px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #cfd8dc' }}>
          <span style={{ fontSize: '0.72rem', color: '#78909c' }}>{filtres.length} enregistrement(s)</span>
          <div style={{ textAlign: 'right' }}><div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#2e7d32', textTransform: 'uppercase' }}>Total Entrées</div><div style={{ fontSize: '1rem', fontWeight: 800, color: '#2e7d32' }}>+{fmt(total)} F</div></div>
        </div>
      </Card>
    </div>
  );
}
