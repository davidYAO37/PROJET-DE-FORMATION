'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Button, Form, Table, Badge, Spinner, Alert } from 'react-bootstrap';

interface IOperation {
  _id: string;
  Libeleo: string;
  TYPEOP: string;
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

export default function ParametrageOperationsPage() {
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
    if (entrepriseId) charger();
  }, [entrepriseId, charger]);

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
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '8px 10px' }}>

      {/* HEADER */}
      <div style={{ background: 'linear-gradient(135deg,#263238 0%,#37474f 50%,#546e7a 100%)', borderRadius: 8, padding: '8px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(38,50,56,0.3)' }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.68rem', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' }}>Module Comptabilité</div>
          <div style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 800, letterSpacing: 1 }}>Paramétrage — Opérations de Caisse</div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.72rem', marginTop: 1 }}>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
        <i className="bi bi-gear-fill" style={{ fontSize: '1.8rem', color: 'rgba(255,255,255,0.2)' }}></i>
      </div>

      {message && (
        <Alert variant={message.type} dismissible onClose={() => setMessage(null)} className="py-2 mb-2" style={{ fontSize: '0.8rem' }}>
          {message.text}
        </Alert>
      )}

      {/* KPIs */}
      <Row className="g-2 mb-2">
        {[
          { label: 'Total Opérations', value: operations.length,                     bg: 'linear-gradient(135deg,#263238,#546e7a)', icon: 'bi-list-ul', isCount: true },
          { label: 'Entrées paramétrées', value: nbEntrees,                           bg: 'linear-gradient(135deg,#1b5e20,#66bb6a)', icon: 'bi-arrow-down-circle-fill', isCount: true },
          { label: 'Sorties paramétrées', value: nbSorties,                           bg: 'linear-gradient(135deg,#b71c1c,#ef9a9a)', icon: 'bi-arrow-up-circle-fill', isCount: true },
        ].map((kpi, ki) => (
          <Col key={ki} xs={12} md={4}>
            <div style={{ background: kpi.bg, borderRadius: 8, padding: '8px 12px', color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 600, opacity: 0.85, textTransform: 'uppercase', letterSpacing: 1 }}>{kpi.label}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: 2 }}>{kpi.value}</div>
                </div>
                <i className={`bi ${kpi.icon}`} style={{ fontSize: '1.2rem', opacity: 0.35 }}></i>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      <Row className="g-2">
        {/* Panneau formulaire */}
        <Col md={5}>
          <Card style={{ borderRadius: 8, border: 'none', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', height: '100%' }}>
            <div style={{ background: 'linear-gradient(90deg,#263238,#37474f)', color: '#fff', padding: '7px 14px', borderRadius: '8px 8px 0 0' }}>
              <span style={{ fontWeight: 700, fontSize: '0.78rem', letterSpacing: 1 }}>
                <i className="bi bi-pencil-square me-2"></i>{showFiche && enEdition ? 'MODIFIER OPÉRATION' : 'NOUVELLE OPÉRATION'}
              </span>
            </div>
            <Card.Body className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: 260 }}>
              {showFiche ? (
                <FicheOperation
                  initial={enEdition}
                  onValider={handleValider}
                  onAnnuler={() => { setShowFiche(false); setEnEdition(null); setFicheMessage(null); }}
                  saving={saving}
                  message={ficheMessage}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '24px 16px', background: '#f7f9fc', borderRadius: 8, border: '2px dashed #b0bec5', width: '100%' }}>
                  <i className="bi bi-plus-circle" style={{ fontSize: '2.5rem', color: '#90a4ae' }}></i>
                  <Button
                    onClick={() => { setEnEdition(null); setFicheMessage(null); setShowFiche(true); }}
                    style={{ background: 'linear-gradient(135deg,#263238,#37474f)', border: 'none', fontWeight: 700, fontSize: '0.82rem', padding: '7px 18px', borderRadius: 6 }}
                  >
                    <i className="bi bi-plus-circle me-2"></i>Nouvelle opération
                  </Button>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <span style={{ background: '#2e7d32', color: '#fff', borderRadius: 12, padding: '2px 10px', fontSize: '0.75rem', fontWeight: 700 }}>{nbEntrees} Entrée{nbEntrees > 1 ? 's' : ''}</span>
                    <span style={{ background: '#b71c1c', color: '#fff', borderRadius: 12, padding: '2px 10px', fontSize: '0.75rem', fontWeight: 700 }}>{nbSorties} Sortie{nbSorties > 1 ? 's' : ''}</span>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Tableau des opérations */}
        <Col md={7}>
          <Card style={{ borderRadius: 8, border: 'none', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
            <div style={{ background: 'linear-gradient(90deg,#263238,#37474f)', color: '#fff', padding: '7px 14px', borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: '0.78rem', letterSpacing: 1 }}><i className="bi bi-table me-2"></i>OPÉRATIONS PARAMÉTRÉES</span>
              <span style={{ fontSize: '0.72rem', opacity: 0.8 }}>{opsFiltrees.length} opération(s)</span>
            </div>
            <Card.Body style={{ padding: '8px 12px 0 12px' }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <Form.Control
                  type="text"
                  size="sm"
                  placeholder="Rechercher un libellé ou type…"
                  value={recherche}
                  onChange={e => setRecherche(e.target.value)}
                  style={{ borderRadius: 6, borderColor: '#b0bec5', fontSize: '0.76rem' }}
                />
                <Button variant="outline-secondary" size="sm" onClick={charger} disabled={loading} style={{ borderRadius: 6, padding: '4px 9px' }}>
                  {loading ? <Spinner size="sm" animation="border" /> : <i className="bi bi-arrow-clockwise"></i>}
                </Button>
              </div>
            </Card.Body>
            <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
              <Table bordered className="mb-0" style={{ fontSize: '0.73rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                    <th style={{ background: '#cfd8dc', color: '#37474f', padding: '6px 10px', fontWeight: 700, borderRight: '1px solid #b0bec5' }}>Libellé</th>
                    <th style={{ background: '#cfd8dc', color: '#37474f', padding: '6px 10px', fontWeight: 700, borderRight: '1px solid #b0bec5' }}>Type</th>
                    <th style={{ background: '#cfd8dc', color: '#37474f', padding: '6px 10px', fontWeight: 700, textAlign: 'center', width: 80 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={3} style={{ textAlign: 'center', padding: '40px', color: '#78909c' }}><Spinner animation="border" size="sm" className="me-2" />Chargement…</td></tr>
                  ) : opsFiltrees.length === 0 ? (
                    <tr><td colSpan={3} style={{ textAlign: 'center', padding: '40px', color: '#90a4ae' }}>
                      <i className="bi bi-inbox" style={{ fontSize: '2rem', display: 'block', marginBottom: 8 }}></i>Aucune opération paramétrée
                    </td></tr>
                  ) : opsFiltrees.map((op, i) => {
                    const isEntree = op.TYPEOP === 'Entrée de caisse';
                    return (
                      <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f7f9fc', borderLeft: `3px solid ${isEntree ? '#2e7d32' : '#b71c1c'}` }}>
                        <td style={{ padding: '4px 10px', fontWeight: 700, borderRight: '1px solid #e0e0e0' }}>{op.Libeleo}</td>
                        <td style={{ padding: '4px 10px', borderRight: '1px solid #e0e0e0' }}>
                          <Badge bg={isEntree ? 'success' : 'danger'} style={{ fontSize: '0.65rem' }}>
                            {isEntree ? '↑ Entrée' : '↓ Sortie'}
                          </Badge>
                        </td>
                        <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
                            <Button size="sm" variant="outline-primary" style={{ padding: '2px 6px' }} title="Modifier"
                              onClick={() => { setEnEdition(op); setFicheMessage(null); setShowFiche(true); }}>
                              <i className="bi bi-pencil-fill" style={{ fontSize: '0.7rem' }}></i>
                            </Button>
                            <Button size="sm" variant="outline-danger" style={{ padding: '2px 6px' }} title="Supprimer"
                              onClick={() => handleSupprimer(op)}>
                              <i className="bi bi-trash-fill" style={{ fontSize: '0.7rem' }}></i>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
            <div style={{ background: '#eceff1', borderRadius: '0 0 8px 8px', padding: '5px 14px', borderTop: '2px solid #cfd8dc' }}>
              <span style={{ fontSize: '0.72rem', color: '#78909c' }}>{opsFiltrees.length} opération(s) affichée(s) sur {operations.length}</span>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
