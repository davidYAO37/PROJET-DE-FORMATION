'use client';
import { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Form, Table, Row, Col, Badge, Spinner, Card, Alert, Tabs, Tab } from 'react-bootstrap';

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

interface Props {
  show: boolean;
  onHide: () => void;
}

const fmt = (n: number) => (n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const today = () => new Date().toISOString().split('T')[0];

export default function FactureAssuranceModal({ show, onHide }: Props) {
  const [onglet, setOnglet] = useState<string>('liste');
  const [assurances, setAssurances] = useState<string[]>([]);
  const [factures, setFactures] = useState<FactureAssur[]>([]);
  const [totaux, setTotaux] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Filtres liste
  const [filtreAssurance, setFiltreAssurance] = useState('');
  const [filtreEtat, setFiltreEtat] = useState('');
  const [filtreDateDebut, setFiltreDateDebut] = useState('');
  const [filtreDateFin, setFiltreDateFin] = useState('');

  // Création
  const [creerAssurance, setCreerAssurance] = useState('');
  const [creerTypeActe, setCreerTypeActe] = useState('');
  const [creerDebutF, setCreerDebutF] = useState(today());
  const [creerFinF, setCreerFinF] = useState(today());
  const [creerReference, setCreerReference] = useState('');
  const [savingCreer, setSavingCreer] = useState(false);

  // Paiement
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
  }, [filtreAssurance, filtreEtat, filtreDateDebut, filtreDateFin]);

  useEffect(() => {
    if (show) {
      chargerAssurances();
      charger();
    }
  }, [show, charger, chargerAssurances]);

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
    <Modal show={show} onHide={onHide} size="xl" backdrop="static" keyboard={false}>
      <Modal.Header closeButton className="bg-warning">
        <Modal.Title>
          <i className="bi bi-shield-fill-check me-2"></i>
          Facturation Assurances / Partenaires
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {message && (
          <Alert variant={message.type} dismissible onClose={() => setMessage(null)} className="py-2">
            {message.text}
          </Alert>
        )}

        <Tabs activeKey={onglet} onSelect={k => setOnglet(k || 'liste')} className="mb-3">
          {/* LISTE */}
          <Tab eventKey="liste" title={<><i className="bi bi-list-ul me-1"></i>Liste des factures</>}>
            {/* Filtres */}
            <Card className="mb-3 border-0 bg-light">
              <Card.Body className="py-2">
                <Row className="g-2 align-items-end">
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
              </Card.Body>
            </Card>

            {/* Totaux */}
            {totaux && (
              <Row className="g-2 mb-3">
                {[
                  { label: 'Total facturé', value: totaux.totalFacture, color: '#667eea' },
                  { label: 'Part assurance', value: totaux.totalPartAssurance, color: '#f5576c' },
                  { label: 'Part assuré', value: totaux.totalPartAssure, color: '#fa709a' },
                  { label: 'Total payé', value: totaux.totalPaye, color: '#43e97b' },
                  { label: 'Total reste', value: totaux.totalReste, color: '#ff6b6b' },
                ].map((c, i) => (
                  <Col key={i} md={2}>
                    <div className="rounded p-2 text-white text-center" style={{ background: c.color, fontSize: '0.8rem' }}>
                      <div className="fw-semibold">{c.label}</div>
                      <div className="fw-bold">{fmt(c.value)}</div>
                    </div>
                  </Col>
                ))}
              </Row>
            )}

            <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
              <Table bordered hover size="sm" style={{ fontSize: '0.75rem' }}>
                <thead className="table-dark sticky-top">
                  <tr>
                    <th>Référence</th>
                    <th>Assurance</th>
                    <th>Type acte</th>
                    <th>Période</th>
                    <th className="text-end">Total</th>
                    <th className="text-end">Part Assur.</th>
                    <th className="text-end">Part Assuré</th>
                    <th className="text-end">Payé</th>
                    <th className="text-end">Reste</th>
                    <th>État</th>
                    <th>Dépôt</th>
                    <th>Retrait</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={13} className="text-center py-3"><Spinner size="sm" animation="border" /> Chargement...</td></tr>
                  ) : factures.length === 0 ? (
                    <tr><td colSpan={13} className="text-center text-muted py-3">Aucune facture trouvée</td></tr>
                  ) : (
                    factures.map((f, i) => (
                      <tr key={i} className={!f.etat_facture ? 'table-warning' : ''}>
                        <td>{f.Reference}</td>
                        <td className="fw-semibold">{f.Assurance}</td>
                        <td>{f.TYPEACTE || '-'}</td>
                        <td className="text-nowrap">
                          {f.DebutF ? new Date(f.DebutF).toLocaleDateString('fr-FR') : '-'} → {f.FinF ? new Date(f.FinF).toLocaleDateString('fr-FR') : '-'}
                        </td>
                        <td className="text-end">{fmt(f.MontantTotalFacture)}</td>
                        <td className="text-end">{fmt(f.PartAssurance)}</td>
                        <td className="text-end">{fmt(f.Partassure)}</td>
                        <td className="text-end text-success fw-semibold">{fmt(f.totalPaye)}</td>
                        <td className="text-end text-danger fw-semibold">{fmt(f.resteAPayer)}</td>
                        <td>
                          <Badge bg={f.etat_facture ? 'success' : 'danger'} style={{ fontSize: '0.65rem' }}>
                            {f.etat_facture ? 'Soldée' : 'En cours'}
                          </Badge>
                        </td>
                        <td className="text-nowrap">
                          {f.DateDepot
                            ? <><Badge bg="info" style={{ fontSize: '0.6rem' }}>Déposé</Badge><br /><span>{new Date(f.DateDepot).toLocaleDateString('fr-FR')}</span></>
                            : <Button size="sm" variant="outline-secondary" style={{ fontSize: '0.65rem', padding: '1px 4px' }}
                                onClick={() => handleAction('depot', f._id)}>Déposer</Button>}
                        </td>
                        <td className="text-nowrap">
                          {f.DateRetrait
                            ? <><Badge bg="success" style={{ fontSize: '0.6rem' }}>Retiré</Badge><br /><span>{new Date(f.DateRetrait).toLocaleDateString('fr-FR')}</span></>
                            : f.DateDepot
                              ? <Button size="sm" variant="outline-secondary" style={{ fontSize: '0.65rem', padding: '1px 4px' }}
                                  onClick={() => handleAction('retrait', f._id)}>Retirer</Button>
                              : '-'}
                        </td>
                        <td>
                          {!f.etat_facture && (
                            <Button
                              size="sm"
                              variant="outline-warning"
                              style={{ fontSize: '0.65rem', padding: '2px 5px' }}
                              onClick={() => {
                                setSelectedFacture(f);
                                setMontantPaiement(String(f.resteAPayer));
                                setShowPaiement(true);
                              }}
                            >
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

            {/* Formulaire paiement */}
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
          </Tab>

          {/* CRÉER */}
          <Tab eventKey="creer" title={<><i className="bi bi-plus-circle me-1"></i>Créer une facture</>}>
            <Card className="border-0">
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
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Tab>
        </Tabs>
      </Modal.Body>

      <Modal.Footer className="d-flex justify-content-between">
        <small className="text-muted">{factures.length} facture(s)</small>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" size="sm" onClick={onHide}>Fermer</Button>
          <Button variant="warning" size="sm" onClick={charger} disabled={loading}>
            <i className="bi bi-arrow-clockwise me-1"></i>Actualiser
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
