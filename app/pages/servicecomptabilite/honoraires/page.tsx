'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Row, Col, Button, Form, Table, Spinner, Alert, Badge, Modal } from 'react-bootstrap';

interface Medecin { _id: string; nom: string; prenoms?: string; specialite?: string; }

interface Acte {
  idActe: string;
  date: string;
  type: string;
  acte: string;
  totalActe: number;
  totalMedecin: number;
  taxe: number;
  netAPayer: number;
  patient: string;
}

interface HonoraireHistorique {
  _id: string;
  date?: string;
  Heure?: string;
  MontantJour?: number;
  Totalretenue?: number;
  Totalnetapayer?: number;
  MontantPayé?: number;
  Restapayer?: number;
  Medecin?: string | { _id: string; nom?: string; prenoms?: string };
  DEBUTD?: string;
  FIND?: string;
}

const fmt = (n: number) => (n || 0).toLocaleString('fr-FR');
const today = () => new Date().toISOString().split('T')[0];

const typeBadge = (type: string) => {
  if (type.includes('CONSULTATION')) return 'primary';
  if (type.includes('PRESCRIPTION')) return 'success';
  if (type.includes('EXECUTANT')) return 'info';
  if (type.includes('AIDE')) return 'warning';
  if (type.includes('ANESTHESISTE')) return 'danger';
  return 'secondary';
};

export default function HonorairesPage() {
  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [actes, setActes] = useState<Acte[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dateDebut, setDateDebut] = useState(today());
  const [dateFin, setDateFin] = useState(today());
  const [medecinId, setMedecinId] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
  const [ongletActif, setOngletActif] = useState<'actes' | 'historique'>('actes');
  const [historique, setHistorique] = useState<HonoraireHistorique[]>([]);
  const [loadingHistorique, setLoadingHistorique] = useState(false);

  // Modal de paiement
  const [showModalPaiement, setShowModalPaiement] = useState(false);
  const [honorairePaiement, setHonorairePaiement] = useState<HonoraireHistorique | null>(null);
  const [montantClient, setMontantClient] = useState('');
  const [recuPar, setRecuPar] = useState('');
  const [modePaiement, setModePaiement] = useState('Espèce');
  const [banque, setBanque] = useState('');
  const [nCheque, setNCheque] = useState('');
  const [datePaiement, setDatePaiement] = useState(today());

  useEffect(() => {
    chargerMedecins();
  }, []);

  const chargerMedecins = async () => {
    try {
      const res = await fetch('/api/medecins');
      if (res.ok) {
        const data = await res.json();
        setMedecins(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erreur chargement médecins:', error);
    }
  };

  const charger = useCallback(async () => {
    if (!medecinId) {
      setActes([]);
      setSelected(new Set());
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/comptabilite/bordereau-honoraire?medecinId=${medecinId}&dateDebut=${dateDebut}&dateFin=${dateFin}`);
      if (!res.ok) throw new Error('Erreur chargement');
      const json = await res.json();
      const data = json.data || [];
      setActes(data);
      setSelected(new Set(data.map((a: Acte) => a.idActe + '|' + a.type)));
    } catch (error) {
      console.error('Erreur chargement actes:', error);
      setMessage({ type: 'danger', text: 'Erreur lors du chargement des actes.' });
      setActes([]);
      setSelected(new Set());
    } finally {
      setLoading(false);
    }
  }, [medecinId, dateDebut, dateFin]);

  const chargerHistorique = useCallback(async () => {
    if (!medecinId) {
      setHistorique([]);
      return;
    }
    setLoadingHistorique(true);
    try {
      const res = await fetch(`/api/comptabilite/honoraires?medecinId=${medecinId}&dateDebut=${dateDebut}&dateFin=${dateFin}`);
      if (!res.ok) throw new Error('Erreur chargement historique');
      const json = await res.json();
      setHistorique(Array.isArray(json.data) ? json.data : []);
    } catch (error) {
      console.error('Erreur chargement historique:', error);
      setMessage({ type: 'danger', text: 'Erreur lors du chargement de l\'historique.' });
      setHistorique([]);
    } finally {
      setLoadingHistorique(false);
    }
  }, [medecinId, dateDebut, dateFin]);

  useEffect(() => {
    if (ongletActif === 'historique') {
      chargerHistorique();
    } else if (ongletActif === 'actes' && medecinId) {
      charger();
    }
  }, [ongletActif, medecinId, dateDebut, dateFin, chargerHistorique, charger]);

  const selectedActes = useMemo(() => {
    return actes.filter(a => selected.has(a.idActe + '|' + a.type));
  }, [actes, selected]);

  const totals = useMemo(() => {
    return selectedActes.reduce((s, a) => ({
      totalActe: s.totalActe + a.totalActe,
      totalMedecin: s.totalMedecin + a.totalMedecin,
      totalTaxe: s.totalTaxe + a.taxe,
      netAPayer: s.netAPayer + a.netAPayer,
    }), { totalActe: 0, totalMedecin: 0, totalTaxe: 0, netAPayer: 0 });
  }, [selectedActes]);

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelected(new Set(actes.map(a => a.idActe + '|' + a.type)));
    } else {
      setSelected(new Set());
    }
  };

  const toggleOne = (key: string, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(key);
    else next.delete(key);
    setSelected(next);
  };

  const ouvrirPaiement = (h: HonoraireHistorique) => {
    setHonorairePaiement(h);
    setMontantClient(String(h.Restapayer || 0));
    setRecuPar('');
    setModePaiement('Espèce');
    setBanque('');
    setNCheque('');
    setDatePaiement(today());
    setShowModalPaiement(true);
  };

  const fermerPaiement = () => {
    setShowModalPaiement(false);
    setHonorairePaiement(null);
  };

  const handlePayer = async () => {
    if (!honorairePaiement) return;
    const montant = Number(montantClient);
    if (!montant || montant <= 0) {
      setMessage({ type: 'danger', text: 'Veuillez saisir un montant valide.' });
      return;
    }
    if (montant > (honorairePaiement.Restapayer || 0)) {
      setMessage({ type: 'danger', text: 'Le montant dépasse le reste à payer.' });
      return;
    }
    if (!recuPar.trim()) {
      setMessage({ type: 'danger', text: 'Veuillez indiquer qui reçoit le paiement.' });
      return;
    }
    if (modePaiement === 'Chèque' && (!banque.trim() || !nCheque.trim())) {
      setMessage({ type: 'danger', text: 'Veuillez renseigner la banque et le numéro de chèque.' });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/comptabilite/honoraires/payer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          honoraireId: honorairePaiement._id,
          montantClient: montant,
          recuPar,
          modePaiement,
          banque,
          nCheque,
          datePaiement,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: 'Médecin payé avec succès.' });
        fermerPaiement();
        await chargerHistorique();
      } else {
        setMessage({ type: 'danger', text: json.message || 'Erreur lors du paiement.' });
      }
    } catch (error) {
      console.error('Erreur paiement:', error);
      setMessage({ type: 'danger', text: 'Erreur serveur.' });
    } finally {
      setSaving(false);
    }
  };

  const handleAnnuler = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment annuler ce bordereau ?')) return;
    try {
      const res = await fetch(`/api/comptabilite/honoraires/${id}/annuler`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: 'Bordereau annulé avec succès.' });
        await chargerHistorique();
      } else {
        setMessage({ type: 'danger', text: json.message || 'Erreur lors de l\'annulation.' });
      }
    } catch (error) {
      console.error('Erreur annulation:', error);
      setMessage({ type: 'danger', text: 'Erreur serveur.' });
    }
  };

  const handleCreerBordereau = async () => {
    if (!medecinId) return;
    if (selectedActes.length === 0) {
      setMessage({ type: 'danger', text: 'Veuillez sélectionner au moins un acte.' });
      return;
    }
    const confirm = window.confirm(
      `Voulez-vous valider le bordereau du médecin pour ${selectedActes.length} acte(s) ?\n\nNet à payer : ${fmt(totals.netAPayer)} F`
    );
    if (!confirm) return;
    setSaving(true);
    try {
      const res = await fetch('/api/comptabilite/bordereau-honoraire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medecinId,
          dateDebut,
          dateFin,
          actes: selectedActes,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: 'Bordereau médecin créé avec succès.' });
        await charger();
      } else {
        setMessage({ type: 'danger', text: json.message || 'Erreur lors de la création.' });
      }
    } catch (error) {
      console.error('Erreur création bordereau:', error);
      setMessage({ type: 'danger', text: 'Erreur serveur.' });
    } finally {
      setSaving(false);
    }
  };

  const periode = `${dateDebut.split('-').reverse().join('/')} — ${dateFin.split('-').reverse().join('/')}`;
  const allChecked = actes.length > 0 && selected.size === actes.length;

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '8px 10px' }}>

      {/* HEADER */}
      <div style={{ background: 'linear-gradient(135deg,#e65100 0%,#f9a825 50%,#fdd835 100%)', borderRadius: 8, padding: '8px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(230,81,0,0.3)' }}>
        <div>
          <div style={{ color: 'rgba(0,0,0,0.6)', fontSize: '0.68rem', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' }}>Module Comptabilité</div>
          <div style={{ color: '#000', fontSize: '1.05rem', fontWeight: 800, letterSpacing: 1 }}>Bordereau Honoraire Médecin</div>
          <div style={{ color: 'rgba(0,0,0,0.55)', fontSize: '0.72rem', marginTop: 1 }}>{periode}</div>
        </div>
        <i className="bi bi-person-badge-fill" style={{ fontSize: '1.8rem', color: 'rgba(0,0,0,0.15)' }}></i>
      </div>

      {message && <Alert variant={message.type} dismissible onClose={() => setMessage(null)} className="py-2 mb-2" style={{ fontSize: '0.8rem' }}>{message.text}</Alert>}

      {/* KPIs */}
      <Row className="g-2 mb-2">
        {[
          { label: 'Total Acte', value: totals.totalActe, bg: 'linear-gradient(135deg,#1565c0,#42a5f5)', icon: 'bi-cash-coin' },
          { label: 'Part total Médecin', value: totals.totalMedecin, bg: 'linear-gradient(135deg,#1b5e20,#66bb6a)', icon: 'bi-person-check-fill' },
          { label: 'Total retenu', value: totals.totalTaxe, bg: 'linear-gradient(135deg,#e65100,#ffb74d)', icon: 'bi-percent' },
          { label: 'Net à payer', value: totals.netAPayer, bg: 'linear-gradient(135deg,#006064,#26c6da)', icon: 'bi-wallet2' },
          { label: 'Nb Actes', value: selectedActes.length, bg: 'linear-gradient(135deg,#6a1b9a,#ce93d8)', icon: 'bi-list-check', isCount: true },
        ].map((kpi, ki) => (
          <Col key={ki} xs={6} md={2}>
            <div style={{ background: kpi.bg, borderRadius: 8, padding: '8px 10px', color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.6rem', fontWeight: 600, opacity: 0.85, textTransform: 'uppercase', letterSpacing: 1 }}>{kpi.label}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, marginTop: 2 }}>{(kpi as any).isCount ? kpi.value : `${fmt(kpi.value)} F`}</div>
                </div>
                <i className={`bi ${kpi.icon}`} style={{ fontSize: '1rem', opacity: 0.35 }}></i>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* FILTRES */}
      <Card className="mb-2" style={{ borderRadius: 8, border: 'none', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
        <Card.Body style={{ padding: '8px 14px' }}>
          <Row className="g-2 align-items-end">
            <Col xs="auto">
              <Form.Label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#546e7a', letterSpacing: 1, textTransform: 'uppercase' }}>Début</Form.Label>
              <Form.Control type="date" size="sm" value={dateDebut} onChange={e => setDateDebut(e.target.value)} style={{ borderRadius: 6, borderColor: '#b0bec5', fontSize: '0.76rem', width: 130 }} />
            </Col>
            <Col xs="auto">
              <Form.Label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#546e7a', letterSpacing: 1, textTransform: 'uppercase' }}>Fin</Form.Label>
              <Form.Control type="date" size="sm" value={dateFin} onChange={e => setDateFin(e.target.value)} style={{ borderRadius: 6, borderColor: '#b0bec5', fontSize: '0.76rem', width: 130 }} />
            </Col>
            <Col xs={12} md={4}>
              <Form.Label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#546e7a', letterSpacing: 1, textTransform: 'uppercase' }}>Médecin</Form.Label>
              <Form.Select size="sm" value={medecinId} onChange={e => setMedecinId(e.target.value)} style={{ borderRadius: 6, borderColor: '#b0bec5', fontSize: '0.76rem' }}>
                <option value="">Sélectionner un médecin</option>
                {medecins.map(m => <option key={m._id} value={m._id}>{m.nom} {m.prenoms || ''} — {m.specialite || ''}</option>)}
              </Form.Select>
            </Col>
            <Col xs="auto" className="ms-auto d-flex gap-2">
              <Button onClick={charger} disabled={loading || !medecinId} style={{ background: 'linear-gradient(135deg,#e65100,#f9a825)', border: 'none', color: '#000', fontWeight: 700, fontSize: '0.78rem', padding: '5px 14px', borderRadius: 6 }}>
                {loading ? <><Spinner size="sm" animation="border" className="me-1" />…</> : <><i className="bi bi-search me-1"></i>Afficher</>}
              </Button>
              <Button
                variant="success"
                onClick={handleCreerBordereau}
                disabled={saving || selectedActes.length === 0 || !medecinId}
                style={{ fontWeight: 700, fontSize: '0.78rem', padding: '5px 14px', borderRadius: 6 }}
              >
                {saving ? <><Spinner size="sm" animation="border" className="me-1" />…</> : <><i className="bi bi-check-circle me-1"></i>Créer le Bordereau</>}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ONGLETS */}
      <div className="mb-2" style={{ display: 'flex', gap: 8 }}>
        {[
          { key: 'actes', label: 'Actes à payer', icon: 'bi-list-check' },
          { key: 'historique', label: 'Historique', icon: 'bi-clock-history' },
        ].map(o => (
          <button
            key={o.key}
            onClick={() => setOngletActif(o.key as 'actes' | 'historique')}
            style={{
              border: 'none',
              borderRadius: 6,
              padding: '6px 14px',
              fontSize: '0.78rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: ongletActif === o.key ? 'linear-gradient(135deg,#e65100,#f9a825)' : '#fff',
              color: ongletActif === o.key ? '#000' : '#546e7a',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            }}
          >
            <i className={`bi ${o.icon}`}></i>{o.label}
          </button>
        ))}
      </div>

      {/* TABLEAU ACTES */}
      {ongletActif === 'actes' && (
      <Card style={{ borderRadius: 8, border: 'none', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
        <div style={{ background: 'linear-gradient(90deg,#e65100,#f9a825)', color: '#000', padding: '7px 14px', borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: '0.78rem', letterSpacing: 1 }}><i className="bi bi-table me-2"></i>ACTES DU MÉDECIN — {periode}</span>
          <Form.Check
            type="checkbox"
            label={<span style={{ fontSize: '0.72rem', fontWeight: 600 }}>Cocher tout</span>}
            checked={allChecked}
            onChange={e => toggleAll(e.target.checked)}
            disabled={actes.length === 0}
          />
        </div>
        <Card.Body className="p-0">
          <div style={{ overflowX: 'auto', maxHeight: '52vh', overflowY: 'auto' }}>
            <Table bordered className="mb-0" style={{ fontSize: '0.73rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  {['Date Prestation', 'Type', 'ACTE', 'Total acte', 'Total Médecin', 'Taxe (-7.5%)', 'Net à payer', 'Patient', 'A payer'].map((h, hi) => (
                    <th key={hi} style={{ background: '#cfd8dc', color: '#37474f', padding: '6px 8px', fontWeight: 700, whiteSpace: 'nowrap', textAlign: [3, 4, 5, 6].includes(hi) ? 'right' : 'center', borderRight: '1px solid #b0bec5' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#78909c' }}><Spinner animation="border" size="sm" className="me-2" />Chargement…</td></tr>
                ) : actes.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '50px', color: '#90a4ae' }}>
                    <i className="bi bi-inbox" style={{ fontSize: '2.5rem', display: 'block', marginBottom: 8 }}></i>Aucun acte à payer pour ce médecin
                  </td></tr>
                ) : actes.map((a, i) => {
                  const key = a.idActe + '|' + a.type;
                  const checked = selected.has(key);
                  return (
                    <tr key={key} style={{ background: i % 2 === 0 ? '#fff' : '#fffde7', borderLeft: `3px solid ${checked ? '#2e7d32' : '#f57c00'}` }}>
                      <td style={{ padding: '3px 8px', whiteSpace: 'nowrap', borderRight: '1px solid #e0e0e0' }}>{a.date ? new Date(a.date).toLocaleDateString('fr-FR') : '-'}</td>
                      <td style={{ padding: '3px 8px', borderRight: '1px solid #e0e0e0' }}><Badge bg={typeBadge(a.type)} style={{ fontSize: '0.6rem' }}>{a.type.replace('HONORAIRE ', '')}</Badge></td>
                      <td style={{ padding: '3px 8px', borderRight: '1px solid #e0e0e0' }}>{a.acte}</td>
                      <td style={{ padding: '3px 8px', textAlign: 'right', fontWeight: 'bold', borderRight: '1px solid #e0e0e0' }}>{fmt(a.totalActe)}</td>
                      <td style={{ padding: '3px 8px', textAlign: 'right', borderRight: '1px solid #e0e0e0' }}>{fmt(a.totalMedecin)}</td>
                      <td style={{ padding: '3px 8px', textAlign: 'right', borderRight: '1px solid #e0e0e0' }}>{fmt(a.taxe)}</td>
                      <td style={{ padding: '3px 8px', textAlign: 'right', fontWeight: 'bold', color: '#006064', borderRight: '1px solid #e0e0e0' }}>{fmt(a.netAPayer)}</td>
                      <td style={{ padding: '3px 8px', borderRight: '1px solid #e0e0e0' }}>{a.patient}</td>
                      <td style={{ padding: '3px 8px', textAlign: 'center' }}>
                        <Form.Check type="checkbox" checked={checked} onChange={e => toggleOne(key, e.target.checked)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        </Card.Body>
        <div style={{ background: '#eceff1', borderRadius: '0 0 8px 8px', padding: '6px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #cfd8dc' }}>
          <span style={{ fontSize: '0.72rem', color: '#78909c' }}>{actes.length} acte(s) trouvé(s) | {selectedActes.length} sélectionné(s)</span>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}><div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#1565c0', textTransform: 'uppercase' }}>Total Acte</div><div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1565c0' }}>{fmt(totals.totalActe)} F</div></div>
            <div style={{ width: 1, height: 28, background: '#b0bec5' }}></div>
            <div style={{ textAlign: 'right' }}><div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#e65100', textTransform: 'uppercase' }}>Total retenu</div><div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#e65100' }}>{fmt(totals.totalTaxe)} F</div></div>
            <div style={{ width: 1, height: 28, background: '#b0bec5' }}></div>
            <div style={{ textAlign: 'right' }}><div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#006064', textTransform: 'uppercase' }}>Net à payer</div><div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#006064' }}>{fmt(totals.netAPayer)} F</div></div>
          </div>
        </div>
      </Card>
      )}

      {/* TABLEAU HISTORIQUE */}
      {ongletActif === 'historique' && (
      <Card style={{ borderRadius: 8, border: 'none', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
        <div style={{ background: 'linear-gradient(90deg,#1565c0,#42a5f5)', color: '#fff', padding: '7px 14px', borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: '0.78rem', letterSpacing: 1 }}><i className="bi bi-clock-history me-2"></i>HISTORIQUE DES HONORAIRES — {periode}</span>
        </div>
        <Card.Body className="p-0">
          <div style={{ overflowX: 'auto', maxHeight: '52vh', overflowY: 'auto' }}>
            <Table bordered className="mb-0" style={{ fontSize: '0.73rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  {['N°', 'Date', 'Heure', 'Honoraires Médecin', 'Taxe', 'Net à payer', 'Montant Reçu', 'Reste à payer', 'Début', 'Fin', 'Actions'].map((h, hi) => (
                    <th key={hi} style={{ background: '#cfd8dc', color: '#37474f', padding: '6px 8px', fontWeight: 700, whiteSpace: 'nowrap', textAlign: [3, 4, 5, 6, 7].includes(hi) ? 'right' : 'center', borderRight: '1px solid #b0bec5' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loadingHistorique ? (
                  <tr><td colSpan={11} style={{ textAlign: 'center', padding: '40px', color: '#78909c' }}><Spinner animation="border" size="sm" className="me-2" />Chargement…</td></tr>
                ) : historique.length === 0 ? (
                  <tr><td colSpan={11} style={{ textAlign: 'center', padding: '50px', color: '#90a4ae' }}>
                    <i className="bi bi-inbox" style={{ fontSize: '2.5rem', display: 'block', marginBottom: 8 }}></i>Aucun honoraire trouvé pour ce médecin
                  </td></tr>
                ) : historique.map((h, i) => (
                  <tr key={h._id} style={{ background: i % 2 === 0 ? '#fff' : '#e3f2fd' }}>
                    <td style={{ padding: '3px 8px', whiteSpace: 'nowrap', borderRight: '1px solid #e0e0e0', textAlign: 'center' }}>{i + 1}</td>
                    <td style={{ padding: '3px 8px', whiteSpace: 'nowrap', borderRight: '1px solid #e0e0e0' }}>{h.date ? new Date(h.date).toLocaleDateString('fr-FR') : '-'}</td>
                    <td style={{ padding: '3px 8px', whiteSpace: 'nowrap', borderRight: '1px solid #e0e0e0', textAlign: 'center' }}>{h.Heure || '-'}</td>
                    <td style={{ padding: '3px 8px', textAlign: 'right', fontWeight: 'bold', borderRight: '1px solid #e0e0e0' }}>{fmt(h.MontantJour || 0)}</td>
                    <td style={{ padding: '3px 8px', textAlign: 'right', borderRight: '1px solid #e0e0e0' }}>{fmt(h.Totalretenue || 0)}</td>
                    <td style={{ padding: '3px 8px', textAlign: 'right', fontWeight: 'bold', color: '#006064', borderRight: '1px solid #e0e0e0' }}>{fmt(h.Totalnetapayer || 0)}</td>
                    <td style={{ padding: '3px 8px', textAlign: 'right', borderRight: '1px solid #e0e0e0' }}>{fmt(h.MontantPayé || 0)}</td>
                    <td style={{ padding: '3px 8px', textAlign: 'right', fontWeight: 'bold', color: '#c62828', borderRight: '1px solid #e0e0e0' }}>{fmt(h.Restapayer || 0)}</td>
                    <td style={{ padding: '3px 8px', whiteSpace: 'nowrap', borderRight: '1px solid #e0e0e0', textAlign: 'center' }}>{h.DEBUTD ? new Date(h.DEBUTD).toLocaleDateString('fr-FR') : '-'}</td>
                    <td style={{ padding: '3px 8px', whiteSpace: 'nowrap', borderRight: '1px solid #e0e0e0', textAlign: 'center' }}>{h.FIND ? new Date(h.FIND).toLocaleDateString('fr-FR') : '-'}</td>
                    <td style={{ padding: '3px 6px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                      <Button variant="success" size="sm" className="me-1 py-0 px-1" style={{ fontSize: '0.65rem' }} onClick={() => ouvrirPaiement(h)} title="Payer"><i className="bi bi-cash-coin"></i></Button>
                      <Button variant="info" size="sm" className="me-1 py-0 px-1" style={{ fontSize: '0.65rem' }} onClick={() => window.open(`/pages/servicecomptabilite/honoraires/imprimer/liste/${h._id}`, '_blank')} title="Liste détaillée"><i className="bi bi-list-ul"></i></Button>
                      <Button variant="primary" size="sm" className="me-1 py-0 px-1" style={{ fontSize: '0.65rem' }} onClick={() => window.open(`/pages/servicecomptabilite/honoraires/imprimer/bordereau/${h._id}`, '_blank')} title="Bordereau"><i className="bi bi-file-earmark-text"></i></Button>
                      <Button variant="danger" size="sm" className="py-0 px-1" style={{ fontSize: '0.65rem' }} onClick={() => handleAnnuler(h._id)} title="Annuler"><i className="bi bi-trash"></i></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
        <div style={{ background: '#eceff1', borderRadius: '0 0 8px 8px', padding: '6px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #cfd8dc' }}>
          <span style={{ fontSize: '0.72rem', color: '#78909c' }}>{historique.length} honoraire(s) trouvé(s)</span>
        </div>
      </Card>
      )}

      {/* MODAL DE PAIEMENT */}
      <Modal show={showModalPaiement} onHide={fermerPaiement} centered size="lg">
        <Modal.Header closeButton style={{ background: 'linear-gradient(90deg,#2e7d32,#66bb6a)', color: '#fff' }}>
          <Modal.Title style={{ fontSize: '0.95rem' }}><i className="bi bi-cash-coin me-2"></i>Recouvrement médecin</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ fontSize: '0.8rem' }}>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Reste à payer</Form.Label>
                <Form.Control type="text" readOnly value={`${fmt(honorairePaiement?.Restapayer || 0)} F`} style={{ fontWeight: 'bold', color: '#c62828', background: '#ffebee' }} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Montant à payer</Form.Label>
                <Form.Control type="number" value={montantClient} onChange={e => setMontantClient(e.target.value)} min={1} style={{ fontWeight: 'bold', color: '#2e7d32' }} />
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Reçu par</Form.Label>
                <Form.Control type="text" value={recuPar} onChange={e => setRecuPar(e.target.value)} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Date de paiement</Form.Label>
                <Form.Control type="date" value={datePaiement} onChange={e => setDatePaiement(e.target.value)} />
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Mode de paiement</Form.Label>
                <Form.Select value={modePaiement} onChange={e => setModePaiement(e.target.value)}>
                  <option value="Espèce">Espèce</option>
                  <option value="Chèque">Chèque</option>
                  <option value="Virement">Virement</option>
                  <option value="Mobile Money">Mobile Money</option>
                </Form.Select>
              </Form.Group>
            </Col>
            {modePaiement === 'Chèque' && (
              <>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Banque</Form.Label>
                    <Form.Control type="text" value={banque} onChange={e => setBanque(e.target.value)} />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>N° chèque</Form.Label>
                    <Form.Control type="text" value={nCheque} onChange={e => setNCheque(e.target.value)} />
                  </Form.Group>
                </Col>
              </>
            )}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={fermerPaiement}>Annuler</Button>
          <Button variant="success" size="sm" onClick={handlePayer} disabled={saving}>
            {saving ? <Spinner animation="border" size="sm" className="me-1" /> : null}
            Valider le paiement
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
