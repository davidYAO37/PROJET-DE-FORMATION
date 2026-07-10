'use client';
import { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Form, Table, Row, Col, Badge, Spinner, Card, Alert } from 'react-bootstrap';

interface Honoraire {
  _id: string;
  date: string;
  Medecin: { _id: string; nom: string; prenoms: string; specialite?: string } | null;
  NBHONRAIRE: number;
  montanttotalhono: number;
  parthonoraire: number;
  NBPRESCRIPTION: number;
  montanttaotalPrescrip: number;
  partpres: number;
  NBEXECUTANT: number;
  MontanttotalExeut: number;
  partexcu: number;
  Totalretenue: number;
  Totalnetapayer: number;
  MontantPayé: number;
  Restapayer: number;
  totalPaye: number;
  resteAPayer: number;
  DEBUTD: string;
  FIND: string;
  paiements: any[];
}

interface Medecin {
  _id: string;
  nom: string;
  prenoms: string;
  specialite?: string;
}

interface Props {
  show: boolean;
  onHide: () => void;
}

const fmt = (n: number) => (n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const today = () => new Date().toISOString().split('T')[0];

export default function HonorairesModal({ show, onHide }: Props) {
  const [dateDebut, setDateDebut] = useState(today());
  const [dateFin, setDateFin] = useState(today());
  const [medecinId, setMedecinId] = useState('');
  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [honoraires, setHonoraires] = useState<Honoraire[]>([]);
  const [totaux, setTotaux] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedHonoraire, setSelectedHonoraire] = useState<Honoraire | null>(null);
  const [showPaiementForm, setShowPaiementForm] = useState(false);
  const [montantPaiement, setMontantPaiement] = useState('');
  const [modePaiement, setModePaiement] = useState('ESPECE');
  const [banque, setBanque] = useState('');
  const [numeroCheque, setNumeroCheque] = useState('');
  const [savingPaiement, setSavingPaiement] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
  const [entrepriseId, setEntrepriseId] = useState('');
  const [utilisateur, setUtilisateur] = useState('');

  useEffect(() => {
    setEntrepriseId(localStorage.getItem('IdEntreprise') || '');
    setUtilisateur(localStorage.getItem('nom_utilisateur') || '');
  }, []);

  const chargerMedecins = useCallback(async () => {
    const res = await fetch(`/api/comptabilite/honoraires?action=medecins&entrepriseId=${entrepriseId}`);
    if (res.ok) {
      const json = await res.json();
      setMedecins(json.data || []);
    }
  }, [entrepriseId]);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ dateDebut, dateFin, entrepriseId });
      if (medecinId) params.set('medecinId', medecinId);
      const res = await fetch(`/api/comptabilite/honoraires?${params}`);
      if (res.ok) {
        const json = await res.json();
        setHonoraires(json.data || []);
        setTotaux(json.totaux || null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [dateDebut, dateFin, medecinId]);

  useEffect(() => {
    if (show) {
      chargerMedecins();
      charger();
    }
  }, [show, charger, chargerMedecins]);

  const handlePayer = async () => {
    if (!selectedHonoraire || !montantPaiement) return;
    setSavingPaiement(true);
    setMessage(null);
    try {
      const res = await fetch('/api/comptabilite/honoraires', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'payer',
          honoraireId: selectedHonoraire._id,
          montant: Number(montantPaiement),
          modePaiement,
          banque,
          numeroCheque,
          payePar: utilisateur,
          entrepriseId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: 'Paiement enregistré avec succès' });
        setShowPaiementForm(false);
        setMontantPaiement('');
        setBanque('');
        setNumeroCheque('');
        setSelectedHonoraire(null);
        await charger();
      } else {
        setMessage({ type: 'danger', text: json.message || 'Erreur lors du paiement' });
      }
    } catch (e) {
      setMessage({ type: 'danger', text: 'Erreur réseau' });
    } finally {
      setSavingPaiement(false);
    }
  };

  const nomMedecin = (h: Honoraire) =>
    h.Medecin ? `${h.Medecin.nom} ${h.Medecin.prenoms}` : '-';

  return (
    <Modal show={show} onHide={onHide} size="xl" backdrop="static" keyboard={false}>
      <Modal.Header closeButton className="bg-info text-white">
        <Modal.Title>
          <i className="bi bi-person-badge-fill me-2"></i>
          Honoraires Médecins
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {message && (
          <Alert variant={message.type} dismissible onClose={() => setMessage(null)} className="py-2">
            {message.text}
          </Alert>
        )}

        {/* Filtres */}
        <Card className="mb-3 border-0 bg-light">
          <Card.Body className="py-2">
            <Row className="g-2 align-items-end">
              <Col md={3}>
                <Form.Label className="small fw-semibold">Date début</Form.Label>
                <Form.Control type="date" size="sm" value={dateDebut} onChange={e => setDateDebut(e.target.value)} />
              </Col>
              <Col md={3}>
                <Form.Label className="small fw-semibold">Date fin</Form.Label>
                <Form.Control type="date" size="sm" value={dateFin} onChange={e => setDateFin(e.target.value)} />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-semibold">Médecin</Form.Label>
                <Form.Select size="sm" value={medecinId} onChange={e => setMedecinId(e.target.value)}>
                  <option value="">Tous les médecins</option>
                  {medecins.map(m => (
                    <option key={m._id} value={m._id}>
                      {m.nom} {m.prenoms} {m.specialite ? `(${m.specialite})` : ''}
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={2}>
                <Button variant="info" size="sm" className="w-100 text-white" onClick={charger} disabled={loading}>
                  {loading ? <Spinner size="sm" animation="border" /> : <><i className="bi bi-search me-1"></i>Filtrer</>}
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Cartes totaux */}
        {totaux && (
          <Row className="g-2 mb-3">
            {[
              { label: 'Total honoraires', value: totaux.totalHonoraires, color: '#667eea' },
              { label: 'Total prescriptions', value: totaux.totalPrescription, color: '#f5576c' },
              { label: 'Total exécutants', value: totaux.totalExecutant, color: '#fa709a' },
              { label: 'Total net à payer', value: totaux.totalNetAPayer, color: '#43e97b' },
              { label: 'Total payé', value: totaux.totalPaye, color: '#38b2ac' },
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

        {/* Tableau */}
        <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
          <Table bordered hover size="sm" style={{ fontSize: '0.78rem' }}>
            <thead className="table-dark sticky-top">
              <tr>
                <th>Période</th>
                <th>Médecin</th>
                <th>Spécialité</th>
                <th className="text-end">Nb Hono.</th>
                <th className="text-end">Montant Hono.</th>
                <th className="text-end">Nb Prescr.</th>
                <th className="text-end">Montant Prescr.</th>
                <th className="text-end">Nb Exéc.</th>
                <th className="text-end">Montant Exéc.</th>
                <th className="text-end">Retenue</th>
                <th className="text-end">Net à payer</th>
                <th className="text-end">Payé</th>
                <th className="text-end">Reste</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={14} className="text-center py-3">
                    <Spinner size="sm" animation="border" /> Chargement...
                  </td>
                </tr>
              ) : honoraires.length === 0 ? (
                <tr>
                  <td colSpan={14} className="text-center text-muted py-3">Aucun honoraire trouvé</td>
                </tr>
              ) : (
                honoraires.map((h, i) => (
                  <tr key={i} className={h.resteAPayer > 0 ? 'table-warning' : ''}>
                    <td className="text-nowrap">
                      {h.DEBUTD ? new Date(h.DEBUTD).toLocaleDateString('fr-FR') : '-'}
                      {' → '}
                      {h.FIND ? new Date(h.FIND).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="fw-semibold">{nomMedecin(h)}</td>
                    <td className="text-muted">{h.Medecin?.specialite || '-'}</td>
                    <td className="text-end">{h.NBHONRAIRE || 0}</td>
                    <td className="text-end">{fmt(h.montanttotalhono)}</td>
                    <td className="text-end">{h.NBPRESCRIPTION || 0}</td>
                    <td className="text-end">{fmt(h.montanttaotalPrescrip)}</td>
                    <td className="text-end">{h.NBEXECUTANT || 0}</td>
                    <td className="text-end">{fmt(h.MontanttotalExeut)}</td>
                    <td className="text-end text-danger">{fmt(h.Totalretenue)}</td>
                    <td className="text-end fw-bold">{fmt(h.Totalnetapayer)}</td>
                    <td className="text-end text-success fw-semibold">{fmt(h.totalPaye)}</td>
                    <td className="text-end text-danger fw-semibold">{fmt(h.resteAPayer)}</td>
                    <td>
                      {h.resteAPayer > 0 && (
                        <Button
                          size="sm"
                          variant="outline-info"
                          style={{ fontSize: '0.7rem', padding: '2px 6px' }}
                          onClick={() => {
                            setSelectedHonoraire(h);
                            setMontantPaiement(String(h.resteAPayer));
                            setShowPaiementForm(true);
                          }}
                        >
                          <i className="bi bi-cash me-1"></i>Payer
                        </Button>
                      )}
                      {h.resteAPayer === 0 && (
                        <Badge bg="success" style={{ fontSize: '0.65rem' }}>Soldé</Badge>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>

        {/* Formulaire paiement */}
        {showPaiementForm && selectedHonoraire && (
          <Card className="mt-3 border-info">
            <Card.Header className="bg-info text-white py-2">
              <i className="bi bi-cash-coin me-2"></i>
              Paiement honoraires — {nomMedecin(selectedHonoraire)} — Reste : {fmt(selectedHonoraire.resteAPayer)}
            </Card.Header>
            <Card.Body>
              <Row className="g-2">
                <Col md={3}>
                  <Form.Label className="small fw-semibold">Montant à payer</Form.Label>
                  <Form.Control
                    type="number"
                    size="sm"
                    value={montantPaiement}
                    onChange={e => setMontantPaiement(e.target.value)}
                    min={0}
                    max={selectedHonoraire.resteAPayer}
                  />
                </Col>
                <Col md={2}>
                  <Form.Label className="small fw-semibold">Mode paiement</Form.Label>
                  <Form.Select size="sm" value={modePaiement} onChange={e => setModePaiement(e.target.value)}>
                    <option value="ESPECE">Espèce</option>
                    <option value="CHEQUE">Chèque</option>
                    <option value="VIREMENT">Virement</option>
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
                <Col md={3} className="d-flex align-items-end gap-2">
                  <Button
                    variant="info"
                    size="sm"
                    className="text-white"
                    onClick={handlePayer}
                    disabled={savingPaiement || !montantPaiement}
                  >
                    {savingPaiement ? <Spinner size="sm" animation="border" /> : <><i className="bi bi-check-lg me-1"></i>Enregistrer</>}
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => { setShowPaiementForm(false); setSelectedHonoraire(null); }}
                  >
                    Annuler
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        )}
      </Modal.Body>

      <Modal.Footer className="d-flex justify-content-between">
        <small className="text-muted">{honoraires.length} honoraire(s)</small>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" size="sm" onClick={onHide}>Fermer</Button>
          <Button variant="info" size="sm" className="text-white" onClick={charger} disabled={loading}>
            <i className="bi bi-arrow-clockwise me-1"></i>Actualiser
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
