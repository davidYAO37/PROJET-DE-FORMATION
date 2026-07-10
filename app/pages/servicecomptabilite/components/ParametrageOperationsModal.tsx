'use client';
import { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Form, Table, Row, Col, Badge, Spinner, Alert } from 'react-bootstrap';

interface IOperation {
  _id: string;
  Libeleo: string;
  TYPEOP: string;
}

interface Props {
  show: boolean;
  onHide: () => void;
}

const TYPE_OPS = ['Entrée de caisse', 'Sortie de caisse'];

const FicheOperation = ({
  initial,
  onValider,
  onAnnuler,
  saving,
  message,
}: {
  initial: Partial<IOperation> | null;
  onValider: (data: { Libeleo: string; TYPEOP: string }) => void;
  onAnnuler: () => void;
  saving: boolean;
  message: { type: 'success' | 'danger'; text: string } | null;
}) => {
  const [libeleo, setLibeleo] = useState('');
  const [typeOp, setTypeOp] = useState('');

  useEffect(() => {
    setLibeleo(initial?.Libeleo || '');
    setTypeOp(initial?.TYPEOP || '');
  }, [initial]);

  const isEntree = typeOp === 'Entrée de caisse';
  const isSortie = typeOp === 'Sortie de caisse';

  const handleSubmit = () => {
    if (!typeOp) {
      alert('Veuillez préciser le type de cette opération');
      return;
    }
    if (!libeleo.trim()) {
      alert('Veuillez remplir la nature de l\'opération');
      return;
    }
    onValider({ Libeleo: libeleo.trim().toUpperCase(), TYPEOP: typeOp });
  };

  return (
    <div
      className="border rounded p-3 mb-3"
      style={{ background: '#fffde7', maxWidth: '420px' }}
    >
      <h6 className="fw-bold mb-3">
        <i className="bi bi-gear-fill me-2 text-warning"></i>
        {initial?._id ? 'Modifier l\'opération' : 'Nouvelle opération'}
      </h6>

      {message && (
        <Alert variant={message.type} className="py-2 small mb-2">
          {message.text}
        </Alert>
      )}

      {/* Libellé */}
      <Form.Group className="mb-3">
        <Form.Label className="fw-semibold small">Libellé</Form.Label>
        <Form.Control
          type="text"
          size="sm"
          value={libeleo}
          onChange={e => setLibeleo(e.target.value.toUpperCase())}
          placeholder="Ex : PAIEMENT HONORAIRE"
          autoFocus
        />
      </Form.Group>

      {/* Type opération */}
      <Form.Group className="mb-3">
        <Form.Label className="fw-semibold small">Type opération</Form.Label>
        <Form.Select
          size="sm"
          value={typeOp}
          onChange={e => setTypeOp(e.target.value)}
          style={{
            background: isEntree ? '#d4edda' : isSortie ? '#f8d7da' : 'white',
            fontWeight: typeOp ? 'bold' : 'normal',
          }}
        >
          <option value="">-- Sélectionner --</option>
          {TYPE_OPS.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Form.Select>
      </Form.Group>

      <div className="d-flex gap-2 justify-content-center">
        <Button
          variant="success"
          size="sm"
          onClick={handleSubmit}
          disabled={saving}
          style={{ minWidth: '100px' }}
        >
          {saving
            ? <Spinner size="sm" animation="border" />
            : <><i className="bi bi-check2 me-1"></i>Valider</>}
        </Button>
        <Button
          variant="outline-danger"
          size="sm"
          onClick={onAnnuler}
          disabled={saving}
          style={{ minWidth: '100px' }}
        >
          <i className="bi bi-x-circle me-1"></i>Annuler
        </Button>
      </div>
    </div>
  );
};

export default function ParametrageOperationsModal({ show, onHide }: Props) {
  const [entrepriseId, setEntrepriseId] = useState('');
  const [operations, setOperations] = useState<IOperation[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
  const [ficheMessage, setFicheMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  const [showFiche, setShowFiche] = useState(false);
  const [enEdition, setEnEdition] = useState<Partial<IOperation> | null>(null);
  const [recherche, setRecherche] = useState('');

  useEffect(() => {
    setEntrepriseId(localStorage.getItem('IdEntreprise') || '');
  }, []);

  const charger = useCallback(async () => {
    if (!entrepriseId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/operations?entrepriseId=${entrepriseId}`);
      if (res.ok) {
        const json = await res.json();
        setOperations(json.data || []);
      }
    } finally {
      setLoading(false);
    }
  }, [entrepriseId]);

  useEffect(() => {
    if (show && entrepriseId) charger();
  }, [show, entrepriseId, charger]);

  const handleValider = async (data: { Libeleo: string; TYPEOP: string }) => {
    setSaving(true);
    setFicheMessage(null);
    try {
      const isModif = !!enEdition?._id;
      const body = isModif
        ? { action: 'modifier', id: enEdition!._id, ...data, entrepriseId }
        : { ...data, entrepriseId };

      const res = await fetch('/api/operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        setFicheMessage({ type: 'success', text: isModif ? 'Opération modifiée.' : 'Opération créée.' });
        setShowFiche(false);
        setEnEdition(null);
        await charger();
        setMessage({ type: 'success', text: isModif ? 'Opération modifiée avec succès.' : 'Opération créée avec succès.' });
      } else {
        setFicheMessage({ type: 'danger', text: json.message || 'Erreur.' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSupprimer = async (op: IOperation) => {
    if (!window.confirm(`Supprimer l'opération "${op.Libeleo}" ?`)) return;
    try {
      const res = await fetch('/api/operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'supprimer', id: op._id, entrepriseId }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: 'Opération supprimée.' });
        await charger();
      } else {
        setMessage({ type: 'danger', text: json.message || 'Erreur.' });
      }
    } catch {
      setMessage({ type: 'danger', text: 'Erreur réseau.' });
    }
  };

  const opsFiltrees = operations.filter(op =>
    !recherche ||
    op.Libeleo.toLowerCase().includes(recherche.toLowerCase()) ||
    op.TYPEOP.toLowerCase().includes(recherche.toLowerCase())
  );

  const nbEntrees = operations.filter(o => o.TYPEOP === 'Entrée de caisse').length;
  const nbSorties = operations.filter(o => o.TYPEOP === 'Sortie de caisse').length;

  return (
    <Modal show={show} onHide={onHide} size="lg" backdrop="static" keyboard={false}>
      <Modal.Header closeButton style={{ background: '#2d3748' }} className="text-white">
        <Modal.Title style={{ fontSize: '1rem' }}>
          <i className="bi bi-gear-fill me-2 text-warning"></i>
          Paramétrage — Opérations de Caisse
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {message && (
          <Alert variant={message.type} dismissible onClose={() => setMessage(null)} className="py-2 small">
            {message.text}
          </Alert>
        )}

        <Row className="g-3">
          {/* Colonne gauche : Fiche */}
          <Col md={5}>
            {showFiche ? (
              <FicheOperation
                initial={enEdition}
                onValider={handleValider}
                onAnnuler={() => { setShowFiche(false); setEnEdition(null); setFicheMessage(null); }}
                saving={saving}
                message={ficheMessage}
              />
            ) : (
              <div className="d-flex flex-column align-items-center justify-content-center h-100 gap-3 py-4"
                style={{ background: '#f8f9fa', borderRadius: '8px', border: '2px dashed #dee2e6' }}>
                <i className="bi bi-plus-circle" style={{ fontSize: '2.5rem', color: '#6c757d' }}></i>
                <Button
                  variant="warning"
                  onClick={() => { setEnEdition(null); setFicheMessage(null); setShowFiche(true); }}
                >
                  <i className="bi bi-plus-circle me-2"></i>Nouvelle opération
                </Button>
                <div className="d-flex gap-3 mt-2">
                  <span className="badge bg-success" style={{ fontSize: '0.8rem' }}>
                    {nbEntrees} Entrée{nbEntrees > 1 ? 's' : ''}
                  </span>
                  <span className="badge bg-danger" style={{ fontSize: '0.8rem' }}>
                    {nbSorties} Sortie{nbSorties > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            )}
          </Col>

          {/* Colonne droite : Liste */}
          <Col md={7}>
            <div className="mb-2 d-flex gap-2">
              <Form.Control
                type="text"
                size="sm"
                placeholder="Rechercher un libellé ou type..."
                value={recherche}
                onChange={e => setRecherche(e.target.value)}
              />
              <Button size="sm" variant="outline-secondary" onClick={charger} disabled={loading}>
                {loading ? <Spinner size="sm" animation="border" /> : <i className="bi bi-arrow-clockwise"></i>}
              </Button>
            </div>

            <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
              <Table bordered hover size="sm" style={{ fontSize: '0.82rem' }}>
                <thead style={{ background: '#2d3748', color: 'white', position: 'sticky', top: 0 }}>
                  <tr>
                    <th style={{ color: 'white', background: '#2d3748' }}>Libellé</th>
                    <th style={{ color: 'white', background: '#2d3748' }}>Type</th>
                    <th style={{ color: 'white', background: '#2d3748', width: '80px' }} className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={3} className="text-center py-3">
                      <Spinner size="sm" animation="border" /> Chargement...
                    </td></tr>
                  ) : opsFiltrees.length === 0 ? (
                    <tr><td colSpan={3} className="text-center text-muted py-3">
                      Aucune opération paramétrée
                    </td></tr>
                  ) : (
                    opsFiltrees.map((op, i) => {
                      const isEntree = op.TYPEOP === 'Entrée de caisse';
                      return (
                        <tr key={i}>
                          <td className="fw-semibold">{op.Libeleo}</td>
                          <td>
                            <Badge
                              bg={isEntree ? 'success' : 'danger'}
                              style={{ fontSize: '0.72rem' }}
                            >
                              {isEntree ? '↑ Entrée' : '↓ Sortie'}
                            </Badge>
                          </td>
                          <td className="text-center">
                            <div className="d-flex gap-1 justify-content-center">
                              <Button
                                size="sm"
                                variant="outline-primary"
                                style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                                title="Modifier"
                                onClick={() => {
                                  setEnEdition(op);
                                  setFicheMessage(null);
                                  setShowFiche(true);
                                }}
                              >
                                <i className="bi bi-pencil-fill"></i>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline-danger"
                                style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                                title="Supprimer"
                                onClick={() => handleSupprimer(op)}
                              >
                                <i className="bi bi-trash-fill"></i>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </Table>
            </div>
          </Col>
        </Row>
      </Modal.Body>

      <Modal.Footer className="d-flex justify-content-between">
        <small className="text-muted">{opsFiltrees.length} opération(s)</small>
        <Button variant="outline-secondary" size="sm" onClick={onHide}>Fermer</Button>
      </Modal.Footer>
    </Modal>
  );
}
