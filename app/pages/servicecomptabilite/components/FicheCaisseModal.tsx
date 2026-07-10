'use client';
import { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Form, Row, Col, Alert, Spinner } from 'react-bootstrap';

interface IOperation {
  _id: string;
  Libeleo: string;
  TYPEOP: string;
}

interface ICaisseDoc {
  _id?: string;
  typeC?: string;
  Operation?: string;
  IDOpération?: number;
  MOtif?: string;
  MOntantC?: number;
  dAteC?: string;
  HeureC?: string;
  NomPrenoms?: string;
  Contact?: string;
  serviceC?: string;
  AjouterParC?: string;
  FonctionC?: string;
  MODifieParC?: string;
}

interface Props {
  show: boolean;
  onHide: () => void;
  caisseId?: string | null;
  onSaved?: () => void;
}

const todayISO = () => new Date().toISOString().split('T')[0];
const nowHHMM = () =>
  new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

export default function FicheCaisseModal({ show, onHide, caisseId, onSaved }: Props) {
  const [entrepriseId, setEntrepriseId] = useState('');
  const [utilisateur, setUtilisateur] = useState('');
  const [profil, setProfil] = useState('');

  const [operations, setOperations] = useState<IOperation[]>([]);
  const [selectedOpId, setSelectedOpId] = useState('');
  const [typeC, setTypeC] = useState('');
  const [motif, setMotif] = useState('');
  const [montant, setMontant] = useState<number>(0);
  const [dateC, setDateC] = useState(todayISO());
  const [heureC, setHeureC] = useState(nowHHMM());
  const [nomPrenoms, setNomPrenoms] = useState('');
  const [contact, setContact] = useState('');
  const [serviceC, setServiceC] = useState('');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Opération sélectionnée
  const opSelectionnee = operations.find(o => o._id === selectedOpId) || null;
  const isEntree = typeC === 'Entrée de caisse';
  const isSortie = typeC === 'Sortie de caisse';

  useEffect(() => {
    setEntrepriseId(localStorage.getItem('IdEntreprise') || '');
    setUtilisateur(localStorage.getItem('nom_utilisateur') || '');
    setProfil(localStorage.getItem('profil_utilisateur') || '');
  }, []);

  const chargerOperations = useCallback(async () => {
    if (!entrepriseId) return;
    const res = await fetch(`/api/operations?entrepriseId=${entrepriseId}`);
    if (res.ok) {
      const json = await res.json();
      setOperations(json.data || []);
    }
  }, [entrepriseId]);

  const chargerFiche = useCallback(async () => {
    if (!caisseId) {
      // Nouveau : initialisation comme WinDev
      setDateC(todayISO());
      setHeureC(nowHHMM());
      setMontant(0);
      setMotif('');
      setNomPrenoms('');
      setContact('');
      setServiceC('');
      setSelectedOpId('');
      setTypeC('');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/caisse?id=${caisseId}`);
      if (res.ok) {
        const json = await res.json();
        const d: ICaisseDoc = json.data;
        setMotif(d.MOtif || '');
        setDateC(d.dAteC ? new Date(d.dAteC).toISOString().split('T')[0] : todayISO());
        setHeureC(d.HeureC || '');
        setMontant(d.MOntantC || 0);
        setTypeC(d.typeC || '');
        setContact(d.Contact || '');
        setNomPrenoms(d.NomPrenoms || '');
        setServiceC(d.serviceC || '');
        // Retrouver l'opération par IDOpération ou Operation libellé
        const op = operations.find(
          o => String(o._id) === String(d.IDOpération) || o.Libeleo === d.Operation
        );
        if (op) setSelectedOpId(op._id);
      }
    } finally {
      setLoading(false);
    }
  }, [caisseId, operations]);

  useEffect(() => {
    if (show && entrepriseId) {
      chargerOperations();
    }
  }, [show, entrepriseId, chargerOperations]);

  useEffect(() => {
    if (show && operations.length >= 0) {
      chargerFiche();
    }
  }, [show, caisseId, chargerFiche]);

  // Sélection opération → met à jour typeC comme WinDev
  const handleSelectOperation = (opId: string) => {
    setSelectedOpId(opId);
    setMessage(null);
    const op = operations.find(o => o._id === opId);
    if (!op) {
      setTypeC('');
      return;
    }
    if (op.TYPEOP === 'Entrée de caisse') {
      setTypeC('Entrée de caisse');
    } else if (op.TYPEOP === 'Sortie de caisse') {
      setTypeC('Sortie de caisse');
    } else {
      setTypeC(op.TYPEOP || '');
    }
  };

  const handleValider = async () => {
    if (!selectedOpId) {
      setMessage({ type: 'danger', text: "Veuillez sélectionner une opération." });
      return;
    }
    if (!montant || montant <= 0) {
      setMessage({ type: 'danger', text: "Le montant doit être supérieur à 0." });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const op = operations.find(o => o._id === selectedOpId);
      const body = {
        action: caisseId ? 'modifier' : 'creer',
        id: caisseId,
        typeC,
        Operation: op?.Libeleo || '',
        MOtif: motif,
        MOntantC: montant,
        dAteC: dateC,
        HeureC: heureC,
        NomPrenoms: nomPrenoms,
        Contact: contact,
        serviceC,
        AjouterParC: utilisateur,
        FonctionC: profil,
        MODifieParC: utilisateur,
        entrepriseId,
      };

      const res = await fetch('/api/caisse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: caisseId ? 'Modifié avec succès.' : 'Enregistré avec succès.' });
        onSaved?.();
        setTimeout(() => { onHide(); setMessage(null); }, 800);
      } else {
        setMessage({ type: 'danger', text: json.message || 'Erreur.' });
      }
    } finally {
      setSaving(false);
    }
  };

  const labelBenef =
    isEntree ? 'Émetteur' :
    isSortie ? 'Bénéficiaire' :
    'Émetteur/Bénéficiaire';

  const couleurInfo =
    isEntree ? '#d4edda' :
    isSortie ? '#f8d7da' :
    '#fffde7';

  return (
    <Modal show={show} onHide={onHide} size="lg" backdrop="static" keyboard={false}>
      <Modal.Header closeButton style={{ background: '#fffde7' }}>
        <Modal.Title style={{ fontSize: '1rem' }}>
          <i className="bi bi-cash-register me-2"></i>Fiche Caisse
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ background: '#fffde7' }}>
        {message && (
          <Alert variant={message.type} className="py-2 mb-2" dismissible onClose={() => setMessage(null)}>
            {message.text}
          </Alert>
        )}
        {loading && (
          <div className="text-center py-3"><Spinner animation="border" size="sm" /> Chargement...</div>
        )}

        {!loading && (
          <>
            {/* Ligne Date / Heure / ID */}
            <Row className="g-2 mb-2 align-items-center">
              <Col xs="auto">
                <Form.Label className="mb-0 small fw-semibold">Date</Form.Label>
              </Col>
              <Col md={3}>
                <Form.Control
                  type="date"
                  size="sm"
                  value={dateC}
                  onChange={e => setDateC(e.target.value)}
                />
              </Col>
              <Col xs="auto">
                <Form.Label className="mb-0 small fw-semibold">Heure</Form.Label>
              </Col>
              <Col md={2}>
                <Form.Control
                  type="time"
                  size="sm"
                  value={heureC}
                  onChange={e => setHeureC(e.target.value)}
                />
              </Col>
              <Col xs="auto">
                <Form.Label className="mb-0 small fw-semibold">ID</Form.Label>
              </Col>
              <Col md={2}>
                <Form.Control
                  size="sm"
                  readOnly
                  value={caisseId ? caisseId.slice(-6).toUpperCase() : '0'}
                  style={{ background: '#f0f0f0' }}
                />
              </Col>
            </Row>

            {/* Opération */}
            <Row className="g-2 mb-2 align-items-center">
              <Col xs={2}>
                <Form.Label className="mb-0 small fw-semibold">Opération</Form.Label>
              </Col>
              <Col>
                <Form.Select
                  size="sm"
                  value={selectedOpId}
                  onChange={e => handleSelectOperation(e.target.value)}
                  style={{ background: isEntree ? '#d4edda' : isSortie ? '#f8d7da' : 'white' }}
                >
                  <option value="">-- Sélectionner une opération --</option>
                  {operations.map(op => (
                    <option key={op._id} value={op._id}>
                      {op.Libeleo}
                    </option>
                  ))}
                </Form.Select>
              </Col>
            </Row>

            {/* Montant */}
            <Row className="g-2 mb-2 align-items-center">
              <Col xs={2}>
                <Form.Label className="mb-0 fw-bold">Montant</Form.Label>
              </Col>
              <Col md={5}>
                <Form.Control
                  type="number"
                  size="sm"
                  min={0}
                  value={montant}
                  onChange={e => setMontant(Number(e.target.value))}
                />
              </Col>
              <Col>
                <span className="fw-bold">
                  {montant.toLocaleString('fr-FR')} F CFA
                </span>
              </Col>
            </Row>

            {/* Motif */}
            <Row className="g-2 mb-3 align-items-start">
              <Col xs={2}>
                <Form.Label className="mb-0 small fw-semibold">Motif</Form.Label>
              </Col>
              <Col>
                <Form.Control
                  as="textarea"
                  rows={2}
                  size="sm"
                  value={motif}
                  onChange={e => setMotif(e.target.value)}
                />
              </Col>
            </Row>

            {/* Section Info Emetteur/Bénéficiaire */}
            <div
              className="rounded p-3 mb-2"
              style={{ background: couleurInfo, border: `1px solid ${isEntree ? '#c3e6cb' : isSortie ? '#f5c6cb' : '#ffe082'}` }}
            >
              <h6 className="fw-bold mb-3">
                Info {labelBenef}
              </h6>

              <Row className="g-2 mb-2 align-items-center">
                <Col xs={4}>
                  <Form.Label className="mb-0 small fw-semibold">Nom et Prénom(s)</Form.Label>
                </Col>
                <Col>
                  <Form.Control
                    size="sm"
                    value={nomPrenoms}
                    onChange={e => setNomPrenoms(e.target.value)}
                  />
                </Col>
              </Row>

              <Row className="g-2 mb-2 align-items-center">
                <Col xs={4}>
                  <Form.Label className="mb-0 small fw-semibold">Contact</Form.Label>
                </Col>
                <Col>
                  <Form.Control
                    size="sm"
                    value={contact}
                    onChange={e => setContact(e.target.value)}
                  />
                </Col>
              </Row>

              <Row className="g-2 align-items-center">
                <Col xs={4}>
                  <Form.Label className="mb-0 small fw-semibold">Service</Form.Label>
                </Col>
                <Col>
                  <Form.Control
                    size="sm"
                    value={serviceC}
                    onChange={e => setServiceC(e.target.value)}
                  />
                </Col>
              </Row>
            </div>

            {/* Info saisi par */}
            <Row className="g-2">
              <Col>
                <small className="text-muted">
                  Saisi par : <strong>{utilisateur}</strong> — Fonction : <strong>{profil}</strong>
                </small>
              </Col>
            </Row>
          </>
        )}
      </Modal.Body>

      <Modal.Footer style={{ background: '#fffde7' }}>
        <Button variant="outline-secondary" size="sm" onClick={onHide}>
          Fermer
        </Button>
        <Button
          variant="success"
          size="sm"
          onClick={handleValider}
          disabled={saving || loading}
        >
          {saving
            ? <><Spinner size="sm" animation="border" className="me-1" />Enregistrement...</>
            : <><i className="bi bi-check2 me-1"></i>Valider</>}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
