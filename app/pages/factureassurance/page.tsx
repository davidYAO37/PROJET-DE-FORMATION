'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Row, Col, Button, Form, Table, Spinner, Alert, Badge } from 'react-bootstrap';

interface Assurance {
  _id: string;
  designationassurance: string;
}

interface SocieteOption {
  _id: string;
  societe: string;
}

interface EditForm {
  assuranceId: string;
  nomAssurance: string;
  societePatient: string;
  idSocieteAssurance: string;
  matricule: string;
  numBon: string;
}

interface LigneBordereau {
  id: string;
  idConsultation?: string;
  idPrescription?: string;
  idHospitalisation?: string;
  idFacturation?: string;
  date: string;
  numBon: string;
  matricule: string;
  taux: string;
  patient: string;
  prestation: string;
  montantTotal: number;
  partAssurance: number;
  partAssure: number;
  societePatient: string;
  typeActe: string;
  aHospitalisation: number;
}

interface FactureAssurHistorique {
  _id: string;
  Reference: string;
  Assurance: string;
  Date: string;
  DebutF: string;
  FinF: string;
  MontantTotalFacture: number;
  PartAssurance: number;
  Partassure: number;
  etat_facture: boolean;
  totalPaye: number;
  resteAPayer: number;
  DepotPar?: string;
}

const fmt = (n: number) => (n || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 });
const today = () => new Date().toISOString().split('T')[0];

export default function FactureAssurancePage() {
  const [assurances, setAssurances] = useState<Assurance[]>([]);
  const [assuranceId, setAssuranceId] = useState('');
  const [dateDebut, setDateDebut] = useState(today());
  const [dateFin, setDateFin] = useState(today());
  const [lignes, setLignes] = useState<LigneBordereau[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
  const [ongletActif, setOngletActif] = useState<'bordereau' | 'historique'>('bordereau');
  const [historique, setHistorique] = useState<FactureAssurHistorique[]>([]);
  const [loadingHistorique, setLoadingHistorique] = useState(false);
  const [utilisateur, setUtilisateur] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ assuranceId: '', nomAssurance: '', societePatient: '', idSocieteAssurance: '', matricule: '', numBon: '' });
  const [societes, setSocietes] = useState<SocieteOption[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [optionImpression, setOptionImpression] = useState<1 | 2>(1);
  const [choixImpression, setChoixImpression] = useState<number>(1);
  const [selectedFacture, setSelectedFacture] = useState<FactureAssurHistorique | null>(null);

  useEffect(() => {
    setUtilisateur(localStorage.getItem('nom_utilisateur') || '');
    chargerAssurances();
  }, []);

  const chargerSocietes = async (aid: string) => {
    if (!aid) { setSocietes([]); return; }
    try {
      const res = await fetch(`/api/societeassurance?assuranceId=${aid}`);
      if (res.ok) setSocietes(await res.json());
      else setSocietes([]);
    } catch { setSocietes([]); }
  };

  const handleOpenEdit = (l: LigneBordereau) => {
    if (expandedRow === l.id) { setExpandedRow(null); return; }
    setExpandedRow(l.id);
    const aid = assuranceId;
    setEditForm({
      assuranceId: aid,
      nomAssurance: assurances.find(a => a._id === aid)?.designationassurance || '',
      societePatient: l.societePatient || '',
      idSocieteAssurance: '',
      matricule: l.matricule || '',
      numBon: l.numBon || '',
    });
    chargerSocietes(aid);
  };

  const handleSaveEdit = async (l: LigneBordereau) => {
    setSavingEdit(true);
    try {
      const res = await fetch('/api/comptabilite/bordereau-assurance/modifier', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idConsultation: l.idConsultation || null,
          idFacturation: l.idFacturation || null,
          idPrescription: l.idPrescription || null,
          idHospitalisation: l.idHospitalisation || null,
          assuranceId: editForm.assuranceId || null,
          nomAssurance: editForm.nomAssurance || null,
          societePatient: editForm.societePatient || null,
          idSocieteAssurance: editForm.idSocieteAssurance || null,
          matricule: editForm.matricule || null,
          numBon: editForm.numBon || null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: 'Ligne modifiée avec succès.' });
        setExpandedRow(null);
        await chargerLignes();
      } else {
        setMessage({ type: 'danger', text: json.message || 'Erreur lors de la modification.' });
      }
    } catch {
      setMessage({ type: 'danger', text: 'Erreur serveur.' });
    } finally {
      setSavingEdit(false);
    }
  };

  const chargerAssurances = async () => {
    try {
      const res = await fetch('/api/assurances');
      if (res.ok) {
        const data = await res.json();
        setAssurances(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erreur chargement assurances:', error);
    }
  };

  const chargerLignes = useCallback(async () => {
    if (!assuranceId || !dateDebut || !dateFin) {
      setLignes([]);
      setSelected(new Set());
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/comptabilite/bordereau-assurance?assuranceId=${assuranceId}&dateDebut=${dateDebut}&dateFin=${dateFin}`);
      if (!res.ok) throw new Error('Erreur chargement');
      const json = await res.json();
      const data = json.data || [];
      setLignes(data);
      setSelected(new Set(data.map((l: LigneBordereau) => l.id)));
    } catch (error) {
      console.error('Erreur chargement lignes:', error);
      setMessage({ type: 'danger', text: 'Erreur lors du chargement des actes.' });
      setLignes([]);
      setSelected(new Set());
    } finally {
      setLoading(false);
    }
  }, [assuranceId, dateDebut, dateFin]);

  const chargerHistorique = useCallback(async () => {
    setLoadingHistorique(true);
    try {
      const res = await fetch('/api/comptabilite/factureAssurance');
      if (!res.ok) throw new Error('Erreur chargement historique');
      const json = await res.json();
      setHistorique(Array.isArray(json.data) ? json.data : []);
    } catch (error) {
      console.error('Erreur chargement historique:', error);
      setHistorique([]);
    } finally {
      setLoadingHistorique(false);
    }
  }, []);

  useEffect(() => {
    if (ongletActif === 'bordereau') {
      chargerLignes();
    } else {
      chargerHistorique();
    }
  }, [ongletActif, chargerLignes, chargerHistorique]);

  const selectedLignes = useMemo(() => {
    return lignes.filter(l => selected.has(l.id));
  }, [lignes, selected]);

  const totaux = useMemo(() => {
    return selectedLignes.reduce((s, l) => ({
      montantTotal: s.montantTotal + (l.montantTotal || 0),
      partAssurance: s.partAssurance + (l.partAssurance || 0),
      partAssure: s.partAssure + (l.partAssure || 0),
    }), { montantTotal: 0, partAssurance: 0, partAssure: 0 });
  }, [selectedLignes]);

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelected(new Set(lignes.map(l => l.id)));
    } else {
      setSelected(new Set());
    }
  };

  const toggleOne = (id: string, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(id);
    else next.delete(id);
    setSelected(next);
  };

  const handleCreerBordereau = async () => {
    if (!assuranceId) {
      setMessage({ type: 'danger', text: 'Veuillez sélectionner une assurance.' });
      return;
    }
    if (selectedLignes.length === 0) {
      setMessage({ type: 'danger', text: 'Veuillez sélectionner au moins une ligne.' });
      return;
    }
    const confirm = window.confirm(
      `Voulez-vous créer le bordereau pour ${selectedLignes.length} ligne(s) ?\n\nTotal : ${fmt(totaux.montantTotal)} F\nPart assurance : ${fmt(totaux.partAssurance)} F\nPart assuré : ${fmt(totaux.partAssure)} F`
    );
    if (!confirm) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/comptabilite/bordereau-assurance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assuranceId,
          dateDebut,
          dateFin,
          lignes: selectedLignes,
          saisirpar: utilisateur,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: 'Bordereau assurance créé avec succès.' });
        setSelected(new Set());
        await chargerLignes();
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

  const allChecked = lignes.length > 0 && selected.size === lignes.length;
  const periode = `${dateDebut.split('-').reverse().join('/')} — ${dateFin.split('-').reverse().join('/')}`;

  const typeBadge = (type: string) => {
    if (type === 'CONSULTATION') return 'primary';
    if (type === 'PHARMACIE') return 'success';
    if (type === 'HOSPITALISATION') return 'danger';
    return 'secondary';
  };

  const handleImprimerFacture = (f: FactureAssurHistorique) => {
    const ref = encodeURIComponent(f.Reference);
    const debut = encodeURIComponent(f.DebutF || '');
    const fin = encodeURIComponent(f.FinF || '');
    const assur = encodeURIComponent(f.Assurance || '');
    const garant = optionImpression === 2 ? '1' : '0';
    const id = encodeURIComponent(f._id);
    let url = '';
    switch (choixImpression) {
      case 1:
        url = `/pages/MesImpressions/impression-bordereau/consultation?numfacture=${ref}&debutF=${debut}&finF=${fin}&assurance=${assur}&parGarant=${garant}`;
        break;
      case 2:
        url = `/pages/MesImpressions/impression-bordereau/soins-examens?idFactureAssur=${id}&parGarant=${garant}`;
        break;
      case 3:
        url = `/pages/MesImpressions/impression-bordereau/pharmacies?numfacture=${ref}&debutF=${debut}&finF=${fin}&assurance=${assur}&parGarant=${garant}`;
        break;
      case 4:
        url = `/pages/MesImpressions/impression-bordereau/consultations-soins-examens?idFactureAssur=${id}&parGarant=${garant}`;
        break;
      case 5:
        url = `/pages/MesImpressions/impression-bordereau/consultations-pharmacies?idFactureAssur=${id}&parGarant=${garant}`;
        break;
      case 6:
        url = `/pages/MesImpressions/impression-bordereau/soins-examens-pharmacies?idFactureAssur=${id}&parGarant=${garant}`;
        break;
      case 7:
        url = `/pages/MesImpressions/impression-bordereau/tout-sauf-hospitalisation?idFactureAssur=${id}&parGarant=${garant}`;
        break;
      case 8:
        url = `/pages/MesImpressions/impression-bordereau/hospitalisation?idFactureAssur=${id}&parGarant=${garant}`;
        break;
      default:
        alert(`CAS ${choixImpression} — à implémenter`);
        return;
    }
    window.open(url, '_blank');
  };

  const handleRecapFacture = (f: FactureAssurHistorique) => {
    const id = encodeURIComponent(f._id);
    window.open(`/pages/MesImpressions/impression-bordereau/facture-recap?idFactureAssur=${id}`, '_blank');
  };

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '8px 10px' }}>
      {/* HEADER */}
      <div style={{ background: 'linear-gradient(135deg,#006064 0%,#00838f 50%,#26c6da 100%)', borderRadius: 8, padding: '8px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(0,96,100,0.3)' }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.68rem', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' }}>Module Comptabilité</div>
          <div style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 800, letterSpacing: 1 }}>Création Bordereau Assurance</div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.72rem', marginTop: 1 }}>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
        <i className="bi bi-shield-fill-check" style={{ fontSize: '1.8rem', color: 'rgba(255,255,255,0.25)' }}></i>
      </div>

      {message && (
        <Alert variant={message.type} dismissible onClose={() => setMessage(null)} className="py-2 mb-2" style={{ fontSize: '0.8rem' }}>
          {message.text}
        </Alert>
      )}

      {/* FILTRES */}
      <Card className="mb-2" style={{ borderRadius: 8, border: 'none', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
        <Card.Body style={{ padding: '8px 14px' }}>
          <Row className="g-2 align-items-end">
            <Col xs={12} md={3}>
              <Form.Label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#546e7a', letterSpacing: 1, textTransform: 'uppercase' }}>Assurance / Partenaire</Form.Label>
              <Form.Select size="sm" value={assuranceId} onChange={e => setAssuranceId(e.target.value)} style={{ borderRadius: 6, borderColor: '#b0bec5', fontSize: '0.76rem' }}>
                <option value="">Sélectionner...</option>
                {assurances.map(a => <option key={a._id} value={a._id}>{a.designationassurance}</option>)}
              </Form.Select>
            </Col>
            <Col xs={6} md={2}>
              <Form.Label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#546e7a', letterSpacing: 1, textTransform: 'uppercase' }}>Début</Form.Label>
              <Form.Control type="date" size="sm" value={dateDebut} onChange={e => setDateDebut(e.target.value)} style={{ borderRadius: 6, borderColor: '#b0bec5', fontSize: '0.76rem' }} />
            </Col>
            <Col xs={6} md={2}>
              <Form.Label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#546e7a', letterSpacing: 1, textTransform: 'uppercase' }}>Fin</Form.Label>
              <Form.Control type="date" size="sm" value={dateFin} onChange={e => setDateFin(e.target.value)} style={{ borderRadius: 6, borderColor: '#b0bec5', fontSize: '0.76rem' }} />
            </Col>
            <Col xs={12} md={5} className="d-flex gap-2 justify-content-md-end">
              <Button onClick={chargerLignes} disabled={loading || !assuranceId} style={{ background: 'linear-gradient(135deg,#006064,#26c6da)', border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.78rem', padding: '5px 14px', borderRadius: 6 }}>
                {loading ? <><Spinner size="sm" animation="border" className="me-1" />…</> : <><i className="bi bi-search me-1"></i>Afficher</>}
              </Button>
              <Button
                variant="success"
                onClick={handleCreerBordereau}
                disabled={saving || selectedLignes.length === 0 || !assuranceId}
                style={{ fontWeight: 700, fontSize: '0.78rem', padding: '5px 14px', borderRadius: 6 }}
              >
                {saving ? <><Spinner size="sm" animation="border" className="me-1" />…</> : <><i className="bi bi-check-circle me-1"></i>Créer le Bordereau</>}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* KPIs */}
      <Row className="g-2 mb-2">
        {[
          { label: 'Total Bordereau', value: totaux.montantTotal, bg: 'linear-gradient(135deg,#1565c0,#42a5f5)', icon: 'bi-file-earmark-text-fill' },
          { label: 'Part Assurance', value: totaux.partAssurance, bg: 'linear-gradient(135deg,#006064,#26c6da)', icon: 'bi-shield-fill' },
          { label: 'Part Assuré', value: totaux.partAssure, bg: 'linear-gradient(135deg,#1b5e20,#66bb6a)', icon: 'bi-person-fill' },
          { label: 'Lignes sélectionnées', value: selectedLignes.length, bg: 'linear-gradient(135deg,#6a1b9a,#ce93d8)', icon: 'bi-list-check', isCount: true },
        ].map((kpi, ki) => (
          <Col key={ki} xs={6} md={3}>
            <div style={{ background: kpi.bg as string, borderRadius: 8, padding: '8px 10px', color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.6rem', fontWeight: 600, opacity: 0.85, textTransform: 'uppercase', letterSpacing: 1 }}>{kpi.label}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, marginTop: 2 }}>{(kpi as any).isCount ? kpi.value : `${fmt(kpi.value as number)} F`}</div>
                </div>
                <i className={`bi ${kpi.icon}`} style={{ fontSize: '1rem', opacity: 0.35 }}></i>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* ONGLETS */}
      <div className="mb-2" style={{ display: 'flex', gap: 8 }}>
        {[
          { key: 'bordereau', label: 'Bordereau', icon: 'bi-list-check' },
          { key: 'historique', label: 'Historique', icon: 'bi-clock-history' },
        ].map(o => (
          <button
            key={o.key}
            onClick={() => setOngletActif(o.key as 'bordereau' | 'historique')}
            style={{
              border: 'none',
              borderRadius: 6,
              padding: '6px 14px',
              fontSize: '0.78rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: ongletActif === o.key ? 'linear-gradient(135deg,#006064,#26c6da)' : '#fff',
              color: ongletActif === o.key ? '#fff' : '#546e7a',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            }}
          >
            <i className={`bi ${o.icon}`}></i>{o.label}
          </button>
        ))}
      </div>

      {/* TABLEAU BORDEREAU */}
      {ongletActif === 'bordereau' && (
        <Card style={{ borderRadius: 8, border: 'none', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
          <div style={{ background: 'linear-gradient(90deg,#006064,#26c6da)', color: '#fff', padding: '7px 14px', borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: '0.78rem', letterSpacing: 1 }}><i className="bi bi-table me-2"></i>ACTES DE L'ASSURANCE — {periode}</span>
            <Form.Check
              type="checkbox"
              label={<span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#fff' }}>Cocher tout</span>}
              checked={allChecked}
              onChange={e => toggleAll(e.target.checked)}
              disabled={lignes.length === 0}
            />
          </div>
          <Card.Body className="p-0">
            <div style={{ overflowX: 'auto', maxHeight: '52vh', overflowY: 'auto' }}>
              <Table bordered className="mb-0" style={{ fontSize: '0.73rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                    {['Date facture', 'N° Bon', 'Matricule', 'Taux', 'Patient', 'Prestation', 'Montant Total', 'Part Assurance', 'Part assuré', 'Société', 'Choix', ''].map((h, hi) => (
                      <th key={hi} style={{ background: '#cfd8dc', color: '#37474f', padding: '6px 8px', fontWeight: 700, whiteSpace: 'nowrap', textAlign: [6, 7, 8].includes(hi) ? 'right' : 'center', borderRight: '1px solid #b0bec5', width: hi === 11 ? 32 : undefined }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={12} style={{ textAlign: 'center', padding: '40px', color: '#78909c' }}><Spinner animation="border" size="sm" className="me-2" />Chargement…</td></tr>
                  ) : lignes.length === 0 ? (
                    <tr><td colSpan={12} style={{ textAlign: 'center', padding: '50px', color: '#90a4ae' }}>
                      <i className="bi bi-inbox" style={{ fontSize: '2.5rem', display: 'block', marginBottom: 8 }}></i>Aucun acte trouvé pour cette assurance
                    </td></tr>
                  ) : (
                    lignes.map((l, i) => {
                      const checked = selected.has(l.id);
                      const isExpanded = expandedRow === l.id;
                      const rowBg = i % 2 === 0 ? '#fff' : '#e0f7fa';
                      return (
                        <React.Fragment key={l.id}>
                          <tr style={{ background: rowBg, borderLeft: `3px solid ${checked ? '#2e7d32' : '#f57c00'}` }}>
                            <td style={{ padding: '3px 8px', whiteSpace: 'nowrap', borderRight: '1px solid #e0e0e0' }}>{l.date ? new Date(l.date).toLocaleDateString('fr-FR') : '-'}</td>
                            <td style={{ padding: '3px 8px', borderRight: '1px solid #e0e0e0' }}>{l.numBon || '-'}</td>
                            <td style={{ padding: '3px 8px', borderRight: '1px solid #e0e0e0' }}>{l.matricule || '-'}</td>
                            <td style={{ padding: '3px 8px', textAlign: 'center', borderRight: '1px solid #e0e0e0' }}>{l.taux || '-'}</td>
                            <td style={{ padding: '3px 8px', borderRight: '1px solid #e0e0e0' }}>{l.patient || '-'}</td>
                            <td style={{ padding: '3px 8px', borderRight: '1px solid #e0e0e0' }}>
                              <Badge bg={typeBadge(l.typeActe)} style={{ fontSize: '0.6rem' }}>{l.prestation}</Badge>
                            </td>
                            <td style={{ padding: '3px 8px', textAlign: 'right', fontWeight: 'bold', borderRight: '1px solid #e0e0e0' }}>{fmt(l.montantTotal)}</td>
                            <td style={{ padding: '3px 8px', textAlign: 'right', borderRight: '1px solid #e0e0e0' }}>{fmt(l.partAssurance)}</td>
                            <td style={{ padding: '3px 8px', textAlign: 'right', borderRight: '1px solid #e0e0e0' }}>{fmt(l.partAssure)}</td>
                            <td style={{ padding: '3px 8px', borderRight: '1px solid #e0e0e0' }}>{l.societePatient || '-'}</td>
                            <td style={{ padding: '3px 8px', textAlign: 'center', borderRight: '1px solid #e0e0e0' }}>
                              <Form.Check type="checkbox" checked={checked} onChange={e => toggleOne(l.id, e.target.checked)} />
                            </td>
                            <td style={{ padding: '2px 4px', textAlign: 'center' }}>
                              <button
                                onClick={() => handleOpenEdit(l)}
                                title="Modifier la ligne"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: '#546e7a', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                              >
                                <i className="bi bi-chevron-down" style={{ fontSize: '0.85rem' }}></i>
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr style={{ background: '#fffde7' }}>
                              <td colSpan={12} style={{ padding: '10px 16px', borderTop: '2px solid #f9a825' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
                                  <div style={{ flex: '0 0 200px' }}>
                                    <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#e65100', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Assurance Patient</div>
                                    <Form.Select
                                      size="sm"
                                      value={editForm.assuranceId}
                                      onChange={e => {
                                        const aid = e.target.value;
                                        const nom = assurances.find(a => a._id === aid)?.designationassurance || '';
                                        setEditForm(f => ({ ...f, assuranceId: aid, nomAssurance: nom, idSocieteAssurance: '', societePatient: '' }));
                                        chargerSocietes(aid);
                                      }}
                                      style={{ borderRadius: 4, borderColor: '#f9a825', fontSize: '0.76rem' }}
                                    >
                                      <option value="">-- Sélectionner --</option>
                                      {assurances.map(a => <option key={a._id} value={a._id}>{a.designationassurance}</option>)}
                                    </Form.Select>
                                  </div>
                                  <div style={{ flex: '0 0 160px' }}>
                                    <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#e65100', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Matricule</div>
                                    <Form.Control
                                      size="sm"
                                      value={editForm.matricule}
                                      onChange={e => setEditForm(f => ({ ...f, matricule: e.target.value }))}
                                      style={{ borderRadius: 4, borderColor: '#f9a825', fontSize: '0.76rem' }}
                                    />
                                  </div>
                                  <div style={{ flex: '0 0 200px' }}>
                                    <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#e65100', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Société Patient</div>
                                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                      <Form.Select
                                        size="sm"
                                        value={editForm.idSocieteAssurance}
                                        onChange={e => {
                                          const sid = e.target.value;
                                          const soc = societes.find(s => s._id === sid);
                                          setEditForm(f => ({ ...f, idSocieteAssurance: sid, societePatient: soc?.societe || '' }));
                                        }}
                                        style={{ borderRadius: 4, borderColor: '#f9a825', fontSize: '0.76rem', flex: 1 }}
                                      >
                                        <option value="">{editForm.societePatient || 'NON ASSURE'}</option>
                                        {societes.map(s => <option key={s._id} value={s._id}>{s.societe}</option>)}
                                      </Form.Select>
                                      <span style={{ color: '#2e7d32', fontWeight: 900, fontSize: '1.1rem', cursor: 'default', lineHeight: 1 }}>+</span>
                                    </div>
                                  </div>
                                  <div style={{ flex: '0 0 140px' }}>
                                    <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#e65100', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>N° Bon</div>
                                    <Form.Control
                                      size="sm"
                                      value={editForm.numBon}
                                      onChange={e => setEditForm(f => ({ ...f, numBon: e.target.value }))}
                                      style={{ borderRadius: 4, borderColor: '#f9a825', fontSize: '0.76rem' }}
                                    />
                                  </div>
                                  <div style={{ display: 'flex', gap: 6 }}>
                                    <Button
                                      size="sm"
                                      onClick={() => handleSaveEdit(l)}
                                      disabled={savingEdit}
                                      style={{ background: 'linear-gradient(135deg,#e65100,#ff9800)', border: 'none', fontWeight: 700, fontSize: '0.74rem', padding: '4px 12px', borderRadius: 4 }}
                                    >
                                      {savingEdit ? <Spinner size="sm" animation="border" /> : <><i className="bi bi-pencil-fill me-1"></i>Modifier</>}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={() => setExpandedRow(null)}
                                      style={{ fontSize: '0.74rem', padding: '4px 10px', borderRadius: 4 }}
                                    >
                                      Annuler
                                    </Button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </Table>
            </div>
          </Card.Body>
          <div style={{ background: '#eceff1', borderRadius: '0 0 8px 8px', padding: '6px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #cfd8dc' }}>
            <span style={{ fontSize: '0.72rem', color: '#78909c' }}>{lignes.length} ligne(s) trouvée(s) | {selectedLignes.length} sélectionnée(s)</span>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ textAlign: 'right' }}><div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#1565c0', textTransform: 'uppercase' }}>Total</div><div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1565c0' }}>{fmt(totaux.montantTotal)} F</div></div>
              <div style={{ width: 1, height: 28, background: '#b0bec5' }}></div>
              <div style={{ textAlign: 'right' }}><div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#006064', textTransform: 'uppercase' }}>Assurance</div><div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#006064' }}>{fmt(totaux.partAssurance)} F</div></div>
              <div style={{ width: 1, height: 28, background: '#b0bec5' }}></div>
              <div style={{ textAlign: 'right' }}><div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#1b5e20', textTransform: 'uppercase' }}>Patient</div><div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1b5e20' }}>{fmt(totaux.partAssure)} F</div></div>
            </div>
          </div>
        </Card>
      )}

      {/* TABLEAU HISTORIQUE */}
      {ongletActif === 'historique' && (
        <Card style={{ borderRadius: 8, border: 'none', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
          <div style={{ background: 'linear-gradient(90deg,#1565c0,#42a5f5)', color: '#fff', padding: '7px 14px', borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: '0.78rem', letterSpacing: 1 }}><i className="bi bi-clock-history me-2"></i>HISTORIQUE DES BORDEREAUX ASSURANCE</span>
          </div>

          {/* BARRE OPTION + CHOIX + BOUTONS */}
          <div style={{ background: '#f5f5f5', borderBottom: '1px solid #ddd', padding: '6px 12px', display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>

            {/* 1. OPTION D'IMPRESSION */}
            <div style={{ border: '1px solid #e65100', borderRadius: 4, padding: '4px 10px', minWidth: 130 }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#e65100', textDecoration: 'underline', marginBottom: 4, textTransform: 'uppercase' }}>Option d&apos;impression</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <label style={{ fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                  <input type="radio" name="optionImpression" checked={optionImpression === 1} onChange={() => setOptionImpression(1)} style={{ accentColor: '#e65100' }} />
                  SANS GARANT
                </label>
                <label style={{ fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                  <input type="radio" name="optionImpression" checked={optionImpression === 2} onChange={() => setOptionImpression(2)} style={{ accentColor: '#e65100' }} />
                  PAR GARANT
                </label>
              </div>
            </div>

            {/* 2. CHOIX IMPRESSION BORDEREAU */}
            <div style={{ border: '1px solid #1565c0', borderRadius: 4, padding: '4px 10px', flex: 1, minWidth: 320 }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#1565c0', textDecoration: 'underline', marginBottom: 4, textTransform: 'uppercase' }}>Choix impression bordereau</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2px 8px' }}>
                {[
                  { val: 1, label: 'Consultations/visite' },
                  { val: 4, label: 'Consultations+Soins+Examens' },
                  { val: 7, label: 'Consultation+Soins+Examens+Pharmacies' },
                  { val: 2, label: 'Soins+Examens' },
                  { val: 5, label: 'Consultations+Pharmacies' },
                  { val: 8, label: 'Hospitalisation' },
                  { val: 3, label: 'Pharmacies' },
                  { val: 6, label: 'Soins+Examens+Pharmacies' },
                ].map(opt => (
                  <label key={opt.val} style={{ fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: 3, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    <input type="radio" name="choixImpression" checked={choixImpression === opt.val} onChange={() => setChoixImpression(opt.val)} style={{ accentColor: '#1565c0' }} />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            {/* 3. BOUTON IMPRIMER FACTURE */}
            <button
              onClick={() => {
                if (!selectedFacture) { alert('Sélectionnez une ligne dans le tableau'); return; }
                handleImprimerFacture(selectedFacture);
              }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#e3f2fd', border: '2px solid #1565c0', borderRadius: 6, padding: '4px 14px', cursor: 'pointer', minWidth: 90, gap: 2 }}
            >
              <i className="bi bi-printer-fill" style={{ fontSize: '1.4rem', color: '#1565c0' }}></i>
              <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#1565c0', textAlign: 'center', lineHeight: 1.1 }}>Imprimer<br />Facture</span>
            </button>

            {/* 4. BOUTON FACTURE RECAP */}
            <button
              onClick={() => {
                if (!selectedFacture) { alert('Sélectionnez une ligne dans le tableau'); return; }
                handleRecapFacture(selectedFacture);
              }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#ede7f6', border: '2px solid #6a1b9a', borderRadius: 6, padding: '4px 14px', cursor: 'pointer', minWidth: 90, gap: 2 }}
            >
              <i className="bi bi-person-badge-fill" style={{ fontSize: '1.4rem', color: '#6a1b9a' }}></i>
              <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#6a1b9a', textAlign: 'center', lineHeight: 1.1 }}>FACTURE<br />RECAP</span>
            </button>
          </div>

          <Card.Body className="p-0">
            <div style={{ overflowX: 'auto', maxHeight: '55vh', overflowY: 'auto' }}>
              <Table bordered className="mb-0" style={{ fontSize: '0.73rem', borderCollapse: 'collapse', minWidth: 900 }}>
                <thead>
                  <tr style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                    <th style={{ background: '#1565c0', color: '#fff', padding: '6px 8px', fontWeight: 700, whiteSpace: 'nowrap', textAlign: 'center', borderRight: '1px solid #0d47a1', width: 80 }}>ACTION</th>
                    <th style={{ background: '#1565c0', color: '#fff', padding: '6px 8px', fontWeight: 700, whiteSpace: 'nowrap', textAlign: 'center', borderRight: '1px solid #0d47a1' }}>Référence</th>
                    <th style={{ background: '#1565c0', color: '#fff', padding: '6px 8px', fontWeight: 700, whiteSpace: 'nowrap', textAlign: 'center', borderRight: '1px solid #0d47a1' }}>Date</th>
                    <th style={{ background: '#1565c0', color: '#fff', padding: '6px 8px', fontWeight: 700, whiteSpace: 'nowrap', textAlign: 'center', borderRight: '1px solid #0d47a1' }}>Assurance</th>
                    <th style={{ background: '#1565c0', color: '#fff', padding: '6px 8px', fontWeight: 700, whiteSpace: 'nowrap', textAlign: 'center', borderRight: '1px solid #0d47a1' }}>Dépôt Par</th>
                    <th style={{ background: '#1565c0', color: '#fff', padding: '6px 8px', fontWeight: 700, whiteSpace: 'nowrap', textAlign: 'right', borderRight: '1px solid #0d47a1' }}>Part Assurance</th>
                    <th style={{ background: '#1565c0', color: '#fff', padding: '6px 8px', fontWeight: 700, whiteSpace: 'nowrap', textAlign: 'center', borderRight: '1px solid #0d47a1' }}>Début</th>
                    <th style={{ background: '#1565c0', color: '#fff', padding: '6px 8px', fontWeight: 700, whiteSpace: 'nowrap', textAlign: 'center', borderRight: '1px solid #0d47a1' }}>Fin</th>
                    <th style={{ background: '#1565c0', color: '#fff', padding: '6px 8px', fontWeight: 700, whiteSpace: 'nowrap', textAlign: 'right', borderRight: '1px solid #0d47a1' }}>Total Payé</th>
                    <th style={{ background: '#1565c0', color: '#fff', padding: '6px 8px', fontWeight: 700, whiteSpace: 'nowrap', textAlign: 'right' }}>Reste à payer</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingHistorique ? (
                    <tr><td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: '#78909c' }}><Spinner animation="border" size="sm" className="me-2" />Chargement…</td></tr>
                  ) : historique.length === 0 ? (
                    <tr><td colSpan={10} style={{ textAlign: 'center', padding: '50px', color: '#90a4ae' }}>
                      <i className="bi bi-inbox" style={{ fontSize: '2.5rem', display: 'block', marginBottom: 8 }}></i>Aucun bordereau trouvé
                    </td></tr>
                  ) : (
                    historique.map((f, i) => (
                      <tr key={f._id}
                        onClick={() => setSelectedFacture(f)}
                        style={{ background: selectedFacture?._id === f._id ? '#fff9c4' : (i % 2 === 0 ? '#fff' : '#e3f2fd'), borderLeft: `3px solid ${f.etat_facture ? '#2e7d32' : '#1565c0'}`, cursor: 'pointer' }}>
                        <td style={{ padding: '3px 6px', textAlign: 'center', borderRight: '1px solid #e0e0e0' }}>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'center', alignItems: 'center' }}>
                            <button title="Imprimer facture" onClick={e => { e.stopPropagation(); handleImprimerFacture(f); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                              <i className="bi bi-printer-fill" style={{ fontSize: '0.9rem', color: '#1565c0' }}></i>
                            </button>
                            <button title="Facture récap" onClick={e => { e.stopPropagation(); handleRecapFacture(f); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                              <i className="bi bi-file-earmark-bar-graph-fill" style={{ fontSize: '0.9rem', color: '#6a1b9a' }}></i>
                            </button>
                            <button title="Supprimer" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                              <i className="bi bi-trash-fill" style={{ fontSize: '0.9rem', color: '#b71c1c' }}></i>
                            </button>
                          </div>
                        </td>
                        <td style={{ padding: '3px 8px', fontWeight: 700, whiteSpace: 'nowrap', borderRight: '1px solid #e0e0e0' }}>{f.Reference}</td>
                        <td style={{ padding: '3px 8px', whiteSpace: 'nowrap', textAlign: 'center', borderRight: '1px solid #e0e0e0' }}>
                          {f.Date ? new Date(f.Date).toLocaleDateString('fr-FR') : '-'}
                        </td>
                        <td style={{ padding: '3px 8px', fontWeight: 700, borderRight: '1px solid #e0e0e0' }}>{f.Assurance}</td>
                        <td style={{ padding: '3px 8px', borderRight: '1px solid #e0e0e0', color: '#546e7a' }}>{f.DepotPar || ''}</td>
                        <td style={{ padding: '3px 8px', textAlign: 'right', fontWeight: 700, borderRight: '1px solid #e0e0e0', color: '#1565c0' }}>
                          {fmt(f.PartAssurance)} F CFA
                        </td>
                        <td style={{ padding: '3px 8px', whiteSpace: 'nowrap', textAlign: 'center', borderRight: '1px solid #e0e0e0' }}>
                          {f.DebutF ? new Date(f.DebutF).toLocaleDateString('fr-FR') : '-'}
                        </td>
                        <td style={{ padding: '3px 8px', whiteSpace: 'nowrap', textAlign: 'center', borderRight: '1px solid #e0e0e0' }}>
                          {f.FinF ? new Date(f.FinF).toLocaleDateString('fr-FR') : '-'}
                        </td>
                        <td style={{ padding: '3px 8px', textAlign: 'right', fontWeight: 700, color: '#2e7d32', borderRight: '1px solid #e0e0e0' }}>
                          {fmt(f.totalPaye)} F CFA
                        </td>
                        <td style={{ padding: '3px 8px', textAlign: 'right', fontWeight: 700, color: f.resteAPayer > 0 ? '#b71c1c' : '#2e7d32' }}>
                          {fmt(f.resteAPayer)} F CFA
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          </Card.Body>
          <div style={{ background: '#eceff1', borderRadius: '0 0 8px 8px', padding: '6px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #1565c0' }}>
            <span style={{ fontSize: '0.72rem', color: '#78909c' }}>{historique.length} bordereau(x) trouvé(s)</span>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ textAlign: 'right' }}><div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#1565c0', textTransform: 'uppercase' }}>Total Part Assurance</div><div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1565c0' }}>{fmt(historique.reduce((s, f) => s + (f.PartAssurance || 0), 0))} F CFA</div></div>
              <div style={{ width: 1, height: 28, background: '#b0bec5' }}></div>
              <div style={{ textAlign: 'right' }}><div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#2e7d32', textTransform: 'uppercase' }}>Total Payé</div><div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#2e7d32' }}>{fmt(historique.reduce((s, f) => s + (f.totalPaye || 0), 0))} F CFA</div></div>
              <div style={{ width: 1, height: 28, background: '#b0bec5' }}></div>
              <div style={{ textAlign: 'right' }}><div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#b71c1c', textTransform: 'uppercase' }}>Reste à payer</div><div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#b71c1c' }}>{fmt(historique.reduce((s, f) => s + (f.resteAPayer || 0), 0))} F CFA</div></div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
