'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Button, Form, Table, Badge, Spinner, Alert, Tabs, Tab } from 'react-bootstrap';

interface FactureAssur {
  _id: string;
  Reference: string;
  Assurance: string;
  TYPEACTE: string;
  Date: string;
  DebutF: string;
  FinF: string;
  MontantTotalFacture: number;
  PartAssurance: number;
  Partassure: number;
  etat_facture: boolean;
  DateDepot?: string;
  DepotPar?: string;
  DateRetrait?: string;
  RetirePar?: string;
  TotalPaye: number;
  Restapayer: number;
  totalPaye: number;
  resteAPayer: number;
  paiements: any[];
}

const fmt = (n: number) => (n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const today = () => new Date().toISOString().split('T')[0];

export default function FactureAssurancePage() {
  const [onglet, setOnglet] = useState<string>('liste');
  const [assurances, setAssurances] = useState<string[]>([]);
  const [factures, setFactures] = useState<FactureAssur[]>([]);
  const [totaux, setTotaux] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  const [filtreAssurance, setFiltreAssurance] = useState('');
  const [filtreEtat, setFiltreEtat] = useState('');
  const [filtreDateDebut, setFiltreDateDebut] = useState('');
  const [filtreDateFin, setFiltreDateFin] = useState('');

  const [creerAssurance, setCreerAssurance] = useState('');
  const [creerTypeActe, setCreerTypeActe] = useState('');
  const [creerDebutF, setCreerDebutF] = useState(today());
  const [creerFinF, setCreerFinF] = useState(today());
  const [creerReference, setCreerReference] = useState('');
  const [savingCreer, setSavingCreer] = useState(false);

  const [selectedFacture, setSelectedFacture] = useState<FactureAssur | null>(null);
  const [showPaiement, setShowPaiement] = useState(false);
  const [montantPaiement, setMontantPaiement] = useState('');
  const [modePaiement, setModePaiement] = useState('CHEQUE');
  const [banque, setBanque] = useState('');
  const [numeroCheque, setNumeroCheque] = useState('');
  const [datePaiement, setDatePaiement] = useState(today());
  const [savingPaiement, setSavingPaiement] = useState(false);
  const [entrepriseId, setEntrepriseId] = useState('');
  const [utilisateur, setUtilisateur] = useState('');

  useEffect(() => {
    setEntrepriseId(localStorage.getItem('IdEntreprise') || '');
    setUtilisateur(localStorage.getItem('nom_utilisateur') || '');
  }, []);

  const chargerAssurances = useCallback(async () => {
    const res = await fetch(`/api/comptabilite/factureAssurance?action=assurances&entrepriseId=${entrepriseId}`);
    if (res.ok) {
      const json = await res.json();
      setAssurances(json.data || []);
    }
  }, [entrepriseId]);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ entrepriseId });
      if (filtreAssurance) params.set('assurance', filtreAssurance);
      if (filtreEtat) params.set('etat', filtreEtat);
      if (filtreDateDebut) params.set('dateDebut', filtreDateDebut);
      if (filtreDateFin) params.set('dateFin', filtreDateFin);
      const res = await fetch(`/api/comptabilite/factureAssurance?${params}`);
      if (res.ok) {
        const json = await res.json();
        setFactures(json.data || []);
        setTotaux(json.totaux || null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [entrepriseId, filtreAssurance, filtreEtat, filtreDateDebut, filtreDateFin]);

  useEffect(() => {
    if (entrepriseId) {
      chargerAssurances();
      charger();
    }
  }, [entrepriseId, charger, chargerAssurances]);

  const handleCreer = async () => {
    if (!creerAssurance) {
      setMessage({ type: 'danger', text: 'Veuillez sélectionner une assurance' });
      return;
    }
    setSavingCreer(true);
    setMessage(null);
    try {
      const res = await fetch('/api/comptabilite/factureAssurance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'creer',
          assurance: creerAssurance,
          typeActe: creerTypeActe,
          debutF: creerDebutF,
          finF: creerFinF,
          reference: creerReference,
          saisirpar: utilisateur,
          entrepriseId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: 'Facture assurance créée avec succès' });
        setCreerAssurance('');
        setCreerTypeActe('');
        setCreerReference('');
        await charger();
        setOnglet('liste');
      } else {
        setMessage({ type: 'danger', text: json.message || 'Erreur' });
      }
    } catch (e) {
      setMessage({ type: 'danger', text: 'Erreur réseau' });
    } finally {
      setSavingCreer(false);
    }
  };

  const handleAction = async (action: 'depot' | 'retrait', factureId: string) => {
    const nom = utilisateur;
    const res = await fetch('/api/comptabilite/factureAssurance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, factureAssurId: factureId, depotPar: nom, retirePar: nom }),
    });
    const json = await res.json();
    if (json.success) {
      setMessage({ type: 'success', text: action === 'depot' ? 'Dépôt enregistré' : 'Retrait enregistré' });
      await charger();
    } else {
      setMessage({ type: 'danger', text: json.message || 'Erreur' });
    }
  };

  const handlePayer = async () => {
    if (!selectedFacture || !montantPaiement) return;
    setSavingPaiement(true);
    setMessage(null);
    try {
      const recuPar = utilisateur;
      const res = await fetch('/api/comptabilite/factureAssurance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'payer',
          factureAssurId: selectedFacture._id,
          montant: Number(montantPaiement),
          modePaiement,
          banque,
          numeroCheque,
          recuPar,
          datePaiement,
          entrepriseId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: 'Paiement enregistré avec succès' });
        setShowPaiement(false);
        setSelectedFacture(null);
        setMontantPaiement('');
        await charger();
      } else {
        setMessage({ type: 'danger', text: json.message || 'Erreur' });
      }
    } catch (e) {
      setMessage({ type: 'danger', text: 'Erreur réseau' });
    } finally {
      setSavingPaiement(false);
    }
  };

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '8px 10px' }}>

      {/* HEADER */}
      <div style={{ background: 'linear-gradient(135deg,#880e4f 0%,#ad1457 50%,#e91e63 100%)', borderRadius: 8, padding: '8px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(136,14,79,0.3)' }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.68rem', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' }}>Module Comptabilité</div>
          <div style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 800, letterSpacing: 1 }}>Facturation Assurances / Partenaires</div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.72rem', marginTop: 1 }}>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Button onClick={charger} disabled={loading} style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', fontWeight: 700, fontSize: '0.78rem', borderRadius: 6, padding: '5px 12px' }}>
            {loading ? <Spinner size="sm" animation="border" /> : <><i className="bi bi-arrow-clockwise me-1"></i>Actualiser</>}
          </Button>
          <i className="bi bi-shield-fill-check" style={{ fontSize: '1.8rem', color: 'rgba(255,255,255,0.25)' }}></i>
        </div>
      </div>

      {message && (
        <Alert variant={message.type} dismissible onClose={() => setMessage(null)} className="py-2 mb-2" style={{ fontSize: '0.8rem' }}>
          {message.text}
        </Alert>
      )}

      <Tabs activeKey={onglet} onSelect={k => setOnglet(k || 'liste')} className="mb-3">
        <Tab eventKey="liste" title={<><i className="bi bi-list-ul me-1"></i>Liste des factures</>}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Row className="g-2 align-items-end mb-3">
                <Col md={3}>
                  <Form.Label className="small fw-semibold">Assurance</Form.Label>
                  <Form.Select size="sm" value={filtreAssurance} onChange={e => setFiltreAssurance(e.target.value)}>
                    <option value="">Toutes</option>
                    {assurances.map((a, i) => <option key={i} value={a}>{a}</option>)}
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Label className="small fw-semibold">État</Form.Label>
                  <Form.Select size="sm" value={filtreEtat} onChange={e => setFiltreEtat(e.target.value)}>
                    <option value="">Tous</option>
                    <option value="nonpayee">Non soldée</option>
                    <option value="payee">Soldée</option>
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Label className="small fw-semibold">Du</Form.Label>
                  <Form.Control type="date" size="sm" value={filtreDateDebut} onChange={e => setFiltreDateDebut(e.target.value)} />
                </Col>
                <Col md={2}>
                  <Form.Label className="small fw-semibold">Au</Form.Label>
                  <Form.Control type="date" size="sm" value={filtreDateFin} onChange={e => setFiltreDateFin(e.target.value)} />
                </Col>
                <Col md={3}>
                  <Button variant="warning" size="sm" className="w-100" onClick={charger} disabled={loading}>
                    {loading ? <Spinner size="sm" animation="border" /> : <><i className="bi bi-search me-1"></i>Filtrer</>}
                  </Button>
                </Col>
              </Row>

              {totaux && (
                <Row className="g-2 mb-2">
                  {[
                    { label: 'Total facturé',    value: totaux.totalFacture,       bg: 'linear-gradient(135deg,#880e4f,#e91e63)', icon: 'bi-file-earmark-text-fill' },
                    { label: 'Part assurance',   value: totaux.totalPartAssurance, bg: 'linear-gradient(135deg,#b71c1c,#ef9a9a)', icon: 'bi-shield-fill' },
                    { label: 'Part assuré',      value: totaux.totalPartAssure,    bg: 'linear-gradient(135deg,#1565c0,#42a5f5)', icon: 'bi-person-fill' },
                    { label: 'Total payé',       value: totaux.totalPaye,          bg: 'linear-gradient(135deg,#1b5e20,#66bb6a)', icon: 'bi-check-circle-fill' },
                    { label: 'Total reste',      value: totaux.totalReste,         bg: totaux.totalReste > 0 ? 'linear-gradient(135deg,#e65100,#ffb74d)' : 'linear-gradient(135deg,#006064,#26c6da)', icon: 'bi-exclamation-circle-fill' },
                  ].map((kpi, ki) => (
                    <Col key={ki} xs={6} md>
                      <div style={{ background: kpi.bg, borderRadius: 8, padding: '6px 10px', color: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontSize: '0.6rem', fontWeight: 600, opacity: 0.85, textTransform: 'uppercase', letterSpacing: 1 }}>{kpi.label}</div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 800, marginTop: 1 }}>{fmt(kpi.value)} F</div>
                          </div>
                          <i className={`bi ${kpi.icon}`} style={{ fontSize: '1rem', opacity: 0.3 }}></i>
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>
              )}

              <div style={{ borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginTop: 4 }}>
                <div style={{ background: 'linear-gradient(90deg,#880e4f,#ad1457)', color: '#fff', padding: '6px 12px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: 1 }}>
                  <i className="bi bi-table me-2"></i>LISTE DES FACTURES ASSURANCE — {factures.length} facture(s)
                </div>
                <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                <Table bordered size="sm" style={{ fontSize: '0.71rem', marginBottom: 0 }}>
                  <thead>
                    <tr style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                      {['Référence','Assurance','Type acte','Période','Total','Part Assur.','Part Assuré','Payé','Reste','État','Dépôt','Retrait','Actions'].map((h,hi)=>(
                        <th key={hi} style={{ background: '#cfd8dc', color: '#37474f', padding: '5px 7px', fontWeight: 700, whiteSpace: 'nowrap', textAlign: [4,5,6,7,8].includes(hi) ? 'right' : 'left', borderRight: '1px solid #b0bec5' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={13} style={{ textAlign: 'center', padding: '30px', color: '#78909c' }}><Spinner size="sm" animation="border" className="me-2" />Chargement…</td></tr>
                    ) : factures.length === 0 ? (
                      <tr><td colSpan={13} style={{ textAlign: 'center', padding: '30px', color: '#90a4ae' }}>Aucune facture trouvée</td></tr>
                    ) : (
                      factures.map((f, i) => (
                        <tr key={i} style={{ background: !f.etat_facture ? (i%2===0?'#fff8e1':'#fff3cd') : (i%2===0?'#fff':'#f7f9fc'), borderLeft: `3px solid ${f.etat_facture ? '#2e7d32' : '#f57c00'}` }}>
                          <td style={{ padding: '3px 7px', borderRight: '1px solid #e0e0e0' }}>{f.Reference}</td>
                          <td style={{ padding: '3px 7px', fontWeight: 700, borderRight: '1px solid #e0e0e0' }}>{f.Assurance}</td>
                          <td style={{ padding: '3px 7px', borderRight: '1px solid #e0e0e0' }}>{f.TYPEACTE || '-'}</td>
                          <td style={{ padding: '3px 7px', whiteSpace: 'nowrap', borderRight: '1px solid #e0e0e0' }}>
                            {f.DebutF ? new Date(f.DebutF).toLocaleDateString('fr-FR') : '-'} → {f.FinF ? new Date(f.FinF).toLocaleDateString('fr-FR') : '-'}
                          </td>
                          <td style={{ padding: '3px 7px', textAlign: 'right', fontWeight: 'bold', borderRight: '1px solid #e0e0e0' }}>{fmt(f.MontantTotalFacture)}</td>
                          <td style={{ padding: '3px 7px', textAlign: 'right', borderRight: '1px solid #e0e0e0' }}>{fmt(f.PartAssurance)}</td>
                          <td style={{ padding: '3px 7px', textAlign: 'right', borderRight: '1px solid #e0e0e0' }}>{fmt(f.Partassure)}</td>
                          <td style={{ padding: '3px 7px', textAlign: 'right', color: '#2e7d32', fontWeight: 700, borderRight: '1px solid #e0e0e0' }}>{fmt(f.totalPaye)}</td>
                          <td style={{ padding: '3px 7px', textAlign: 'right', color: f.resteAPayer > 0 ? '#b71c1c' : '#2e7d32', fontWeight: 700, borderRight: '1px solid #e0e0e0' }}>{fmt(f.resteAPayer)}</td>
                          <td style={{ padding: '3px 7px', borderRight: '1px solid #e0e0e0' }}>
                            <Badge bg={f.etat_facture ? 'success' : 'warning'} style={{ fontSize: '0.6rem' }}>
                              {f.etat_facture ? 'Soldée' : 'En cours'}
                            </Badge>
                          </td>
                          <td style={{ padding: '3px 7px', whiteSpace: 'nowrap', borderRight: '1px solid #e0e0e0' }}>
                            {f.DateDepot
                              ? <><Badge bg="info" style={{ fontSize: '0.58rem' }}>Déposé</Badge><br /><span style={{ fontSize: '0.65rem' }}>{new Date(f.DateDepot).toLocaleDateString('fr-FR')}</span></>
                              : <Button size="sm" variant="outline-secondary" style={{ fontSize: '0.62rem', padding: '1px 4px' }}
                                  onClick={() => handleAction('depot', f._id)}>Déposer</Button>}
                          </td>
                          <td style={{ padding: '3px 7px', whiteSpace: 'nowrap', borderRight: '1px solid #e0e0e0' }}>
                            {f.DateRetrait
                              ? <><Badge bg="success" style={{ fontSize: '0.58rem' }}>Retiré</Badge><br /><span style={{ fontSize: '0.65rem' }}>{new Date(f.DateRetrait).toLocaleDateString('fr-FR')}</span></>
                              : f.DateDepot
                                ? <Button size="sm" variant="outline-secondary" style={{ fontSize: '0.62rem', padding: '1px 4px' }}
                                    onClick={() => handleAction('retrait', f._id)}>Retirer</Button>
                                : '-'}
                          </td>
                          <td style={{ padding: '3px 7px' }}>
                            {!f.etat_facture && (
                              <Button size="sm" variant="outline-warning" style={{ fontSize: '0.62rem', padding: '2px 5px' }}
                                onClick={() => { setSelectedFacture(f); setMontantPaiement(String(f.resteAPayer)); setShowPaiement(true); }}>
                                <i className="bi bi-cash me-1"></i>Encaisser
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
                </div>
              </div>

              {showPaiement && selectedFacture && (
                <Card className="mt-3 border-warning">
                  <Card.Header className="bg-warning py-2">
                    <i className="bi bi-cash-coin me-2"></i>
                    Encaissement — {selectedFacture.Assurance} — Reste : {fmt(selectedFacture.resteAPayer)}
                  </Card.Header>
                  <Card.Body>
                    <Row className="g-2">
                      <Col md={2}>
                        <Form.Label className="small fw-semibold">Date</Form.Label>
                        <Form.Control type="date" size="sm" value={datePaiement} onChange={e => setDatePaiement(e.target.value)} />
                      </Col>
                      <Col md={2}>
                        <Form.Label className="small fw-semibold">Montant reçu</Form.Label>
                        <Form.Control type="number" size="sm" value={montantPaiement}
                          onChange={e => setMontantPaiement(e.target.value)} min={0} max={selectedFacture.resteAPayer} />
                      </Col>
                      <Col md={2}>
                        <Form.Label className="small fw-semibold">Mode paiement</Form.Label>
                        <Form.Select size="sm" value={modePaiement} onChange={e => setModePaiement(e.target.value)}>
                          <option value="CHEQUE">Chèque</option>
                          <option value="VIREMENT">Virement</option>
                          <option value="ESPECE">Espèce</option>
                          <option value="MOBILE MONEY">Mobile Money</option>
                        </Form.Select>
                      </Col>
                      {(modePaiement === 'CHEQUE' || modePaiement === 'VIREMENT') && (
                        <>
                          <Col md={2}>
                            <Form.Label className="small fw-semibold">Banque</Form.Label>
                            <Form.Control size="sm" value={banque} onChange={e => setBanque(e.target.value)} />
                          </Col>
                          <Col md={2}>
                            <Form.Label className="small fw-semibold">N° Chèque</Form.Label>
                            <Form.Control size="sm" value={numeroCheque} onChange={e => setNumeroCheque(e.target.value)} />
                          </Col>
                        </>
                      )}
                      <Col md={2} className="d-flex align-items-end gap-2">
                        <Button variant="warning" size="sm" onClick={handlePayer} disabled={savingPaiement || !montantPaiement}>
                          {savingPaiement ? <Spinner size="sm" animation="border" /> : <><i className="bi bi-check-lg me-1"></i>Valider</>}
                        </Button>
                        <Button variant="outline-secondary" size="sm" onClick={() => { setShowPaiement(false); setSelectedFacture(null); }}>
                          Annuler
                        </Button>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              )}
            </Card.Body>
            <div style={{ background: '#eceff1', borderRadius: '0 0 8px 8px', padding: '6px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #cfd8dc' }}>
              <span style={{ fontSize: '0.72rem', color: '#78909c' }}>{factures.length} facture(s)</span>
              <Button onClick={() => setOnglet('creer')} style={{ background: 'linear-gradient(135deg,#880e4f,#ad1457)', border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.78rem', padding: '4px 12px', borderRadius: 6 }}>
                <i className="bi bi-plus-circle me-1"></i>Nouvelle facture
              </Button>
            </div>
          </Card>
        </Tab>

        <Tab eventKey="creer" title={<><i className="bi bi-plus-circle me-1"></i>Créer une facture</>}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Row className="g-3">
                <Col md={4}>
                  <Form.Label className="fw-semibold">Assurance / Partenaire *</Form.Label>
                  <Form.Select value={creerAssurance} onChange={e => setCreerAssurance(e.target.value)}>
                    <option value="">Sélectionner...</option>
                    {assurances.map((a, i) => <option key={i} value={a}>{a}</option>)}
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Label className="fw-semibold">Type d'acte</Form.Label>
                  <Form.Select value={creerTypeActe} onChange={e => setCreerTypeActe(e.target.value)}>
                    <option value="">Tous les actes</option>
                    <option value="CONSULTATION">Consultation</option>
                    <option value="PRESTATION">Prestation</option>
                    <option value="PHARMACIE">Pharmacie</option>
                    <option value="HOSPITALISATION">Hospitalisation</option>
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Label className="fw-semibold">Référence</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Référence (optionnel)"
                    value={creerReference}
                    onChange={e => setCreerReference(e.target.value)}
                  />
                </Col>
                <Col md={3}>
                  <Form.Label className="fw-semibold">Période début</Form.Label>
                  <Form.Control type="date" value={creerDebutF} onChange={e => setCreerDebutF(e.target.value)} />
                </Col>
                <Col md={3}>
                  <Form.Label className="fw-semibold">Période fin</Form.Label>
                  <Form.Control type="date" value={creerFinF} onChange={e => setCreerFinF(e.target.value)} />
                </Col>
                <Col md={12}>
                  <Alert variant="info" className="py-2 small mb-0">
                    <i className="bi bi-info-circle me-1"></i>
                    La facture sera créée en agrégeant toutes les facturations de l'assurance sélectionnée sur la période choisie.
                  </Alert>
                </Col>
                <Col md={12}>
                  <Button
                    variant="warning"
                    onClick={handleCreer}
                    disabled={savingCreer || !creerAssurance}
                  >
                    {savingCreer
                      ? <><Spinner size="sm" animation="border" className="me-2" />Création...</>
                      : <><i className="bi bi-plus-circle me-2"></i>Créer la facture assurance</>}
                  </Button>
                  <Button variant="outline-secondary" className="ms-2" onClick={() => setOnglet('liste')}>
                    <i className="bi bi-arrow-left me-1"></i>Retour à la liste
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
}
