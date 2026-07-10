'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Button, Form, Table, Badge, Spinner, Alert } from 'react-bootstrap';

interface BilanLigne {
  date: string;
  typeActe: string;
  patient: string;
  typePatient: string;
  montantTotal: number;
  partPatient: number;
  partAssurance: number;
  montantEncaisse: number;
  resteAPayer: number;
  remise: number;
  modePaiement: string;
  saisirPar: string;
}
interface Totaux { montantTotal: number; partAssurance: number; montantEncaisse: number; resteAPayer: number; remise: number; }

const fmt = (n: number) => (n || 0).toLocaleString('fr-FR');
const today = () => new Date().toISOString().split('T')[0];

export default function BilanPage() {
  const [entrepriseId, setEntrepriseId] = useState('');
  const [dateDebut, setDateDebut] = useState(today());
  const [dateFin, setDateFin] = useState(today());
  const [modePaiement, setModePaiement] = useState('TOUS');
  const [typePatient, setTypePatient] = useState('TOUS');
  const [lignes, setLignes] = useState<BilanLigne[]>([]);
  const [totaux, setTotaux] = useState<Totaux | null>(null);
  const [parTypeActe, setParTypeActe] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [recherche, setRecherche] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => { setEntrepriseId(localStorage.getItem('IdEntreprise') || ''); }, []);

  const charger = useCallback(async () => {
    setLoading(true); setMessage(null);
    try {
      const params = new URLSearchParams({ dateDebut, dateFin, modePaiement, typePatient, entrepriseId });
      const res = await fetch(`/api/comptabilite/bilan?${params}`);
      if (res.ok) {
        const json = await res.json();
        setLignes(json.lignes || []); setTotaux(json.totaux || null); setParTypeActe(json.parTypeActe || {});
      } else setMessage('Erreur lors du chargement');
    } finally { setLoading(false); }
  }, [dateDebut, dateFin, modePaiement, typePatient, entrepriseId]);

  useEffect(() => { if (entrepriseId) charger(); }, [charger, entrepriseId]);

  const lignesFiltrees = lignes.filter(l =>
    !recherche || (l.patient || '').toLowerCase().includes(recherche.toLowerCase()) ||
    (l.typeActe || '').toLowerCase().includes(recherche.toLowerCase())
  );

  const periode = `${dateDebut.split('-').reverse().join('/')} — ${dateFin.split('-').reverse().join('/')}`;

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '8px 10px' }}>

      {/* HEADER */}
      <div style={{ background: 'linear-gradient(135deg,#4527a0 0%,#7b1fa2 50%,#9c27b0 100%)', borderRadius: 8, padding: '8px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(69,39,160,0.3)' }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.68rem', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' }}>Module Comptabilité</div>
          <div style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 800, letterSpacing: 1 }}>Bilan Financier</div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.72rem', marginTop: 1 }}>{periode}</div>
        </div>
        <i className="bi bi-bar-chart-fill" style={{ fontSize: '1.8rem', color: 'rgba(255,255,255,0.25)' }}></i>
      </div>

      {message && <Alert variant="danger" dismissible onClose={() => setMessage(null)} className="py-2 mb-2" style={{ fontSize: '0.8rem' }}>{message}</Alert>}

      {/* KPIs */}
      {totaux && (
        <Row className="g-2 mb-2">
          {[
            { label: 'Total Actes',      value: totaux.montantTotal,    bg: 'linear-gradient(135deg,#4527a0,#9c27b0)', icon: 'bi-cash-coin' },
            { label: 'Part Assurance',   value: totaux.partAssurance,   bg: 'linear-gradient(135deg,#c62828,#f48fb1)', icon: 'bi-shield-fill' },
            { label: 'Encaissé Patients',value: totaux.montantEncaisse, bg: 'linear-gradient(135deg,#2e7d32,#66bb6a)', icon: 'bi-check-circle-fill' },
            { label: 'Reste à Payer',    value: totaux.resteAPayer,     bg: 'linear-gradient(135deg,#e65100,#ffb74d)', icon: 'bi-exclamation-circle-fill' },
            { label: 'Remises',          value: totaux.remise,          bg: 'linear-gradient(135deg,#1565c0,#42a5f5)', icon: 'bi-percent' },
          ].map((kpi, ki) => (
            <Col key={ki} xs={6} md>
              <div style={{ background: kpi.bg, borderRadius: 8, padding: '8px 12px', color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '0.62rem', fontWeight: 600, opacity: 0.85, textTransform: 'uppercase', letterSpacing: 1 }}>{kpi.label}</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, marginTop: 2 }}>{fmt(kpi.value)} F</div>
                  </div>
                  <i className={`bi ${kpi.icon}`} style={{ fontSize: '1.1rem', opacity: 0.35 }}></i>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      )}

      {/* Récap par type acte */}
      {Object.keys(parTypeActe).length > 0 && (
        <Row className="g-2 mb-2">
          {Object.entries(parTypeActe).map(([type, val]: [string, any], i) => (
            <Col key={i} xs={6} md={3}>
              <div style={{ background: '#fff', borderRadius: 8, padding: '6px 10px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', borderLeft: '3px solid #7b1fa2' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#546e7a', textTransform: 'uppercase' }}>{type}</span>
                  <Badge bg="secondary" style={{ fontSize: '0.58rem' }}>{val.count}</Badge>
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#4527a0' }}>{fmt(val.montant)} F</div>
                <div style={{ height: 3, background: '#e0e0e0', borderRadius: 2, marginTop: 4 }}>
                  <div style={{ height: 3, background: '#43a047', borderRadius: 2, width: `${val.montant > 0 ? Math.min(100, Math.round((val.encaisse / val.montant) * 100)) : 0}%` }} />
                </div>
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
            <Col xs="auto">
              <Form.Label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#546e7a', letterSpacing: 1, textTransform: 'uppercase' }}>Mode paiement</Form.Label>
              <Form.Select size="sm" value={modePaiement} onChange={e => setModePaiement(e.target.value)} style={{ borderRadius: 6, borderColor: '#b0bec5', fontSize: '0.76rem', width: 140 }}>
                {['TOUS','ESPECE','CHEQUE','MOBILE MONEY','VIREMENT','CARTE'].map(m => <option key={m}>{m}</option>)}
              </Form.Select>
            </Col>
            <Col xs="auto">
              <Form.Label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#546e7a', letterSpacing: 1, textTransform: 'uppercase' }}>Type patient</Form.Label>
              <Form.Select size="sm" value={typePatient} onChange={e => setTypePatient(e.target.value)} style={{ borderRadius: 6, borderColor: '#b0bec5', fontSize: '0.76rem', width: 130 }}>
                {['TOUS','Assuré','Non assuré'].map(t => <option key={t}>{t}</option>)}
              </Form.Select>
            </Col>
            <Col xs={12} md={2}><Form.Label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#546e7a', letterSpacing: 1, textTransform: 'uppercase' }}>Recherche</Form.Label><Form.Control type="text" size="sm" placeholder="Patient, acte…" value={recherche} onChange={e => setRecherche(e.target.value)} style={{ borderRadius: 6, borderColor: '#b0bec5', fontSize: '0.76rem' }} /></Col>
            <Col xs="auto" className="ms-auto d-flex gap-2">
              <Button onClick={charger} disabled={loading} style={{ background: 'linear-gradient(135deg,#4527a0,#7b1fa2)', border: 'none', fontWeight: 700, fontSize: '0.78rem', padding: '5px 14px', borderRadius: 6 }}>
                {loading ? <><Spinner size="sm" animation="border" className="me-1" />…</> : <><i className="bi bi-search me-1"></i>Rechercher</>}
              </Button>
              <Button variant="outline-secondary" onClick={charger} disabled={loading} style={{ borderRadius: 6, fontSize: '0.78rem', padding: '5px 10px' }}><i className="bi bi-arrow-clockwise"></i></Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* TABLEAU */}
      <Card style={{ borderRadius: 8, border: 'none', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
        <div style={{ background: 'linear-gradient(90deg,#4527a0,#7b1fa2)', color: '#fff', padding: '7px 14px', borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: '0.78rem', letterSpacing: 1 }}><i className="bi bi-table me-2"></i>DÉTAIL BILAN — {periode}</span>
          {lignesFiltrees.length > 0 && <span style={{ fontSize: '0.72rem', opacity: 0.85 }}>{lignesFiltrees.length} ligne(s)</span>}
        </div>
        <Card.Body className="p-0">
          <div style={{ overflowX: 'auto', maxHeight: '52vh', overflowY: 'auto' }}>
            <Table bordered className="mb-0" style={{ fontSize: '0.72rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  {['Date','Type acte','Patient','Type patient','Total','Part pat.','Part ass.','Encaissé','Reste','Mode'].map((h, i) => (
                    <th key={i} style={{ background: '#cfd8dc', color: '#37474f', padding: '6px 8px', fontWeight: 700, whiteSpace: 'nowrap', borderRight: '1px solid #b0bec5' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: '#78909c' }}><Spinner animation="border" size="sm" className="me-2" />Chargement…</td></tr>
                ) : lignesFiltrees.length === 0 ? (
                  <tr><td colSpan={10} style={{ textAlign: 'center', padding: '50px', color: '#90a4ae' }}>
                    <i className="bi bi-inbox" style={{ fontSize: '2.5rem', display: 'block', marginBottom: 8 }}></i>Aucune donnée pour cette période
                  </td></tr>
                ) : lignesFiltrees.map((l, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f7f9fc', borderLeft: `3px solid ${l.resteAPayer > 0 ? '#e53935' : '#43a047'}` }}>
                    <td style={{ padding: '3px 8px', whiteSpace: 'nowrap', borderRight: '1px solid #e0e0e0' }}>{l.date ? new Date(l.date).toLocaleDateString('fr-FR') : '-'}</td>
                    <td style={{ padding: '3px 8px', borderRight: '1px solid #e0e0e0' }}><Badge bg="secondary" style={{ fontSize: '0.62rem' }}>{l.typeActe}</Badge></td>
                    <td style={{ padding: '3px 8px', borderRight: '1px solid #e0e0e0' }}>{l.patient}</td>
                    <td style={{ padding: '3px 8px', borderRight: '1px solid #e0e0e0' }}><Badge bg={l.typePatient === 'Assuré' ? 'info' : 'secondary'} style={{ fontSize: '0.62rem' }}>{l.typePatient}</Badge></td>
                    <td style={{ padding: '3px 8px', textAlign: 'right', fontWeight: 'bold', borderRight: '1px solid #e0e0e0' }}>{fmt(l.montantTotal)}</td>
                    <td style={{ padding: '3px 8px', textAlign: 'right', borderRight: '1px solid #e0e0e0' }}>{fmt(l.partPatient)}</td>
                    <td style={{ padding: '3px 8px', textAlign: 'right', borderRight: '1px solid #e0e0e0' }}>{fmt(l.partAssurance)}</td>
                    <td style={{ padding: '3px 8px', textAlign: 'right', color: '#2e7d32', fontWeight: 'bold', borderRight: '1px solid #e0e0e0' }}>{fmt(l.montantEncaisse)}</td>
                    <td style={{ padding: '3px 8px', textAlign: 'right', color: l.resteAPayer > 0 ? '#b71c1c' : '#2e7d32', fontWeight: 'bold', borderRight: '1px solid #e0e0e0' }}>{fmt(l.resteAPayer)}</td>
                    <td style={{ padding: '3px 8px' }}>{l.modePaiement}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
        <div style={{ background: '#eceff1', borderRadius: '0 0 8px 8px', padding: '6px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #cfd8dc' }}>
          <span style={{ fontSize: '0.72rem', color: '#78909c' }}>{lignesFiltrees.length} ligne(s)</span>
          {totaux && (
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ textAlign: 'right' }}><div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#4527a0', textTransform: 'uppercase' }}>Total Actes</div><div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#4527a0' }}>{fmt(totaux.montantTotal)} F</div></div>
              <div style={{ width: 1, height: 28, background: '#b0bec5' }}></div>
              <div style={{ textAlign: 'right' }}><div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#2e7d32', textTransform: 'uppercase' }}>Encaissé</div><div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#2e7d32' }}>{fmt(totaux.montantEncaisse)} F</div></div>
              <div style={{ width: 1, height: 28, background: '#b0bec5' }}></div>
              <div style={{ textAlign: 'right' }}><div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#b71c1c', textTransform: 'uppercase' }}>Reste</div><div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#b71c1c' }}>{fmt(totaux.resteAPayer)} F</div></div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
