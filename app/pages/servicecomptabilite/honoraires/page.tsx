'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Button, Form, Table, Badge, Spinner, Alert, Modal } from 'react-bootstrap';

interface Honoraire {
  _id: string;
  Medecin?: any;
  dateDebut?: string;
  dateFin?: string;
  montantTotal?: number;
  montantPaye?: number;
  montantReste?: number;
  statut?: string;
  entrepriseId?: string;
}
interface Medecin { _id: string; nom: string; prenoms?: string; specialite?: string; }

const fmt = (n: number) => (n || 0).toLocaleString('fr-FR');
const today = () => new Date().toISOString().split('T')[0];

export default function HonorairesPage() {
  const [entrepriseId, setEntrepriseId] = useState('');
  const [utilisateur, setUtilisateur] = useState('');
  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [honoraires, setHonoraires] = useState<Honoraire[]>([]);
  const [totaux, setTotaux] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dateDebut, setDateDebut] = useState(today());
  const [dateFin, setDateFin] = useState(today());
  const [medecinId, setMedecinId] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  const [showPaiement, setShowPaiement] = useState(false);
  const [selectedHonoraire, setSelectedHonoraire] = useState<Honoraire | null>(null);
  const [montantPaiement, setMontantPaiement] = useState('');
  const [modePaiement, setModePaiement] = useState('ESPECE');
  const [banque, setBanque] = useState('');
  const [numeroCheque, setNumeroCheque] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEntrepriseId(localStorage.getItem('IdEntreprise') || '');
    setUtilisateur(localStorage.getItem('nom_utilisateur') || '');
  }, []);

  const chargerMedecins = useCallback(async () => {
    if (!entrepriseId) return;
    const res = await fetch(`/api/comptabilite/honoraires?action=medecins&entrepriseId=${entrepriseId}`);
    if (res.ok) { const json = await res.json(); setMedecins(json.data || []); }
  }, [entrepriseId]);

  const charger = useCallback(async () => {
    if (!entrepriseId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ dateDebut, dateFin, entrepriseId });
      if (medecinId) params.set('medecinId', medecinId);
      const res = await fetch(`/api/comptabilite/honoraires?${params}`);
      if (res.ok) { const json = await res.json(); setHonoraires(json.data || []); setTotaux(json.totaux || null); }
    } finally { setLoading(false); }
  }, [dateDebut, dateFin, medecinId, entrepriseId]);

  useEffect(() => { if (entrepriseId) { chargerMedecins(); charger(); } }, [entrepriseId, chargerMedecins, charger]);

  const handlePayer = async () => {
    if (!selectedHonoraire || !montantPaiement) return;
    setSaving(true);
    try {
      const res = await fetch('/api/comptabilite/honoraires', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'payer', honoraireId: selectedHonoraire._id, montant: Number(montantPaiement), modePaiement, banque, numeroCheque, payePar: utilisateur, entrepriseId }),
      });
      const json = await res.json();
      if (json.success) { setMessage({ type: 'success', text: 'Paiement enregistré.' }); setShowPaiement(false); setSelectedHonoraire(null); setMontantPaiement(''); charger(); }
      else setMessage({ type: 'danger', text: json.message || 'Erreur.' });
    } finally { setSaving(false); }
  };

  const totalTotal = honoraires.reduce((s, h) => s + (h.montantTotal || 0), 0);
  const totalPaye = honoraires.reduce((s, h) => s + (h.montantPaye || 0), 0);
  const totalReste = honoraires.reduce((s, h) => s + (h.montantReste || 0), 0);

  const periode = `${dateDebut.split('-').reverse().join('/')} — ${dateFin.split('-').reverse().join('/')}`;

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '8px 10px' }}>

      {/* HEADER */}
      <div style={{ background: 'linear-gradient(135deg,#e65100 0%,#f9a825 50%,#fdd835 100%)', borderRadius: 8, padding: '8px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(230,81,0,0.3)' }}>
        <div>
          <div style={{ color: 'rgba(0,0,0,0.6)', fontSize: '0.68rem', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' }}>Module Comptabilité</div>
          <div style={{ color: '#000', fontSize: '1.05rem', fontWeight: 800, letterSpacing: 1 }}>Honoraires Médecins</div>
          <div style={{ color: 'rgba(0,0,0,0.55)', fontSize: '0.72rem', marginTop: 1 }}>{periode}</div>
        </div>
        <i className="bi bi-person-badge-fill" style={{ fontSize: '1.8rem', color: 'rgba(0,0,0,0.15)' }}></i>
      </div>

      {message && <Alert variant={message.type} dismissible onClose={() => setMessage(null)} className="py-2 mb-2" style={{ fontSize: '0.8rem' }}>{message.text}</Alert>}

      {/* KPIs */}
      <Row className="g-2 mb-2">
        {[
          { label: 'Total Honoraires', value: totalTotal, bg: 'linear-gradient(135deg,#1565c0,#42a5f5)', icon: 'bi-cash-coin' },
          { label: 'Total Payé',       value: totalPaye,  bg: 'linear-gradient(135deg,#1b5e20,#66bb6a)', icon: 'bi-check-circle-fill' },
          { label: 'Reste à Payer',    value: totalReste, bg: totalReste > 0 ? 'linear-gradient(135deg,#b71c1c,#ef9a9a)' : 'linear-gradient(135deg,#006064,#26c6da)', icon: 'bi-exclamation-circle-fill' },
          { label: 'Nb Fiches',        value: honoraires.length, bg: 'linear-gradient(135deg,#e65100,#ffb74d)', icon: 'bi-file-text', isCount: true },
        ].map((kpi, ki) => (
          <Col key={ki} xs={6} md={3}>
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
            <Col xs={12} md={4}>
              <Form.Label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#546e7a', letterSpacing: 1, textTransform: 'uppercase' }}>Médecin</Form.Label>
              <Form.Select size="sm" value={medecinId} onChange={e => setMedecinId(e.target.value)} style={{ borderRadius: 6, borderColor: '#b0bec5', fontSize: '0.76rem' }}>
                <option value="">Tous les médecins</option>
                {medecins.map(m => <option key={m._id} value={m._id}>{m.nom} {m.prenoms || ''} — {m.specialite || ''}</option>)}
              </Form.Select>
            </Col>
            <Col xs="auto" className="ms-auto d-flex gap-2">
              <Button onClick={charger} disabled={loading} style={{ background: 'linear-gradient(135deg,#e65100,#f9a825)', border: 'none', color: '#000', fontWeight: 700, fontSize: '0.78rem', padding: '5px 14px', borderRadius: 6 }}>
                {loading ? <><Spinner size="sm" animation="border" className="me-1" />…</> : <><i className="bi bi-search me-1"></i>Rechercher</>}
              </Button>
              <Button variant="outline-secondary" onClick={charger} disabled={loading} style={{ borderRadius: 6, fontSize: '0.78rem', padding: '5px 10px' }}><i className="bi bi-arrow-clockwise"></i></Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* TABLEAU */}
      <Card style={{ borderRadius: 8, border: 'none', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
        <div style={{ background: 'linear-gradient(90deg,#e65100,#f9a825)', color: '#000', padding: '7px 14px', borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: '0.78rem', letterSpacing: 1 }}><i className="bi bi-table me-2"></i>HONORAIRES — {periode}</span>
          {honoraires.length > 0 && <span style={{ fontSize: '0.72rem', opacity: 0.7 }}>{honoraires.length} fiche(s)</span>}
        </div>
        <Card.Body className="p-0">
          <div style={{ overflowX: 'auto', maxHeight: '52vh', overflowY: 'auto' }}>
            <Table bordered className="mb-0" style={{ fontSize: '0.73rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  {['Médecin','Spécialité','Période','Total','Payé','Reste','Statut','Action'].map((h, hi) => (
                    <th key={hi} style={{ background: '#cfd8dc', color: '#37474f', padding: '6px 8px', fontWeight: 700, whiteSpace: 'nowrap', textAlign: [3,4,5].includes(hi) ? 'right' : 'left', borderRight: '1px solid #b0bec5' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#78909c' }}><Spinner animation="border" size="sm" className="me-2" />Chargement…</td></tr>
                ) : honoraires.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '50px', color: '#90a4ae' }}>
                    <i className="bi bi-inbox" style={{ fontSize: '2.5rem', display: 'block', marginBottom: 8 }}></i>Aucun honoraire trouvé
                  </td></tr>
                ) : honoraires.map((h, i) => {
                  const solde = h.montantReste || 0;
                  const statut = solde <= 0 ? 'Soldé' : (h.montantPaye || 0) > 0 ? 'Partiel' : 'Non payé';
                  const badgeColor = statut === 'Soldé' ? 'success' : statut === 'Partiel' ? 'warning' : 'danger';
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fffde7', borderLeft: `3px solid ${solde > 0 ? '#f57c00' : '#2e7d32'}` }}>
                      <td style={{ padding: '3px 8px', fontWeight: 700, borderRight: '1px solid #e0e0e0' }}>{h.Medecin?.nom || '-'} {h.Medecin?.prenoms || ''}</td>
                      <td style={{ padding: '3px 8px', borderRight: '1px solid #e0e0e0' }}><Badge bg="secondary" style={{ fontSize: '0.6rem' }}>{h.Medecin?.specialite || '-'}</Badge></td>
                      <td style={{ padding: '3px 8px', whiteSpace: 'nowrap', borderRight: '1px solid #e0e0e0' }}>
                        {h.dateDebut ? new Date(h.dateDebut).toLocaleDateString('fr-FR') : '-'} → {h.dateFin ? new Date(h.dateFin).toLocaleDateString('fr-FR') : '-'}
                      </td>
                      <td style={{ padding: '3px 8px', textAlign: 'right', fontWeight: 'bold', borderRight: '1px solid #e0e0e0' }}>{fmt(h.montantTotal || 0)}</td>
                      <td style={{ padding: '3px 8px', textAlign: 'right', color: '#2e7d32', borderRight: '1px solid #e0e0e0' }}>{fmt(h.montantPaye || 0)}</td>
                      <td style={{ padding: '3px 8px', textAlign: 'right', color: solde > 0 ? '#b71c1c' : '#2e7d32', fontWeight: 'bold', borderRight: '1px solid #e0e0e0' }}>{fmt(solde)}</td>
                      <td style={{ padding: '3px 8px', borderRight: '1px solid #e0e0e0' }}><Badge bg={badgeColor} style={{ fontSize: '0.6rem' }}>{statut}</Badge></td>
                      <td style={{ padding: '3px 8px' }}>
                        {solde > 0 && (
                          <Button size="sm" variant="outline-success" style={{ padding: '2px 7px', fontSize: '0.7rem' }}
                            onClick={() => { setSelectedHonoraire(h); setMontantPaiement(String(solde)); setShowPaiement(true); }}>
                            <i className="bi bi-cash me-1"></i>Payer
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        </Card.Body>
        <div style={{ background: '#eceff1', borderRadius: '0 0 8px 8px', padding: '6px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #cfd8dc' }}>
          <span style={{ fontSize: '0.72rem', color: '#78909c' }}>{honoraires.length} fiche(s)</span>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}><div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#2e7d32', textTransform: 'uppercase' }}>Payé</div><div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#2e7d32' }}>{fmt(totalPaye)} F</div></div>
            <div style={{ width: 1, height: 28, background: '#b0bec5' }}></div>
            <div style={{ textAlign: 'right' }}><div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#b71c1c', textTransform: 'uppercase' }}>Reste</div><div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#b71c1c' }}>{fmt(totalReste)} F</div></div>
          </div>
        </div>
      </Card>

      {/* Modal Paiement */}
      <Modal show={showPaiement} onHide={() => setShowPaiement(false)} centered>
        <Modal.Header closeButton><Modal.Title style={{ fontSize: '1rem' }}><i className="bi bi-cash me-2"></i>Paiement Honoraire</Modal.Title></Modal.Header>
        <Modal.Body>
          {selectedHonoraire && (
            <div className="mb-3 p-2 rounded" style={{ background: '#f8f9fa' }}>
              <strong>{selectedHonoraire.Medecin?.nom} {selectedHonoraire.Medecin?.prenoms}</strong><br />
              <small className="text-muted">Reste à payer : <strong>{fmt(selectedHonoraire.montantReste || 0)} FCFA</strong></small>
            </div>
          )}
          <Form.Group className="mb-3"><Form.Label className="small fw-semibold">Montant</Form.Label><Form.Control type="number" size="sm" value={montantPaiement} onChange={e => setMontantPaiement(e.target.value)} /></Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-semibold">Mode de paiement</Form.Label>
            <Form.Select size="sm" value={modePaiement} onChange={e => setModePaiement(e.target.value)}>
              {['ESPECE','CHEQUE','MOBILE MONEY','VIREMENT'].map(m => <option key={m}>{m}</option>)}
            </Form.Select>
          </Form.Group>
          {modePaiement === 'CHEQUE' && <>
            <Form.Group className="mb-3"><Form.Label className="small fw-semibold">Banque</Form.Label><Form.Control size="sm" value={banque} onChange={e => setBanque(e.target.value)} /></Form.Group>
            <Form.Group className="mb-3"><Form.Label className="small fw-semibold">N° Chèque</Form.Label><Form.Control size="sm" value={numeroCheque} onChange={e => setNumeroCheque(e.target.value)} /></Form.Group>
          </>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" size="sm" onClick={() => setShowPaiement(false)}>Annuler</Button>
          <Button variant="success" size="sm" onClick={handlePayer} disabled={saving}>
            {saving ? <Spinner size="sm" animation="border" /> : <><i className="bi bi-check2 me-1"></i>Valider</>}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
