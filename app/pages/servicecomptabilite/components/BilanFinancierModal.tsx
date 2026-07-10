'use client';
import { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Form, Table, Row, Col, Badge, Spinner, Card } from 'react-bootstrap';

interface BilanLigne {
  date: string;
  patient: string;
  assurance: string;
  designation: string;
  typeActe: string;
  montantTotal: number;
  partAssurance: number;
  partPatient: number;
  montantEncaisse: number;
  remise: number;
  resteAPayer: number;
  medecin: string;
  modePaiement: string;
  typePatient: string;
}

interface Totaux {
  montantTotal: number;
  partAssurance: number;
  partPatient: number;
  montantEncaisse: number;
  remise: number;
  resteAPayer: number;
}

interface Props {
  show: boolean;
  onHide: () => void;
}

const fmt = (n: number) =>
  n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const today = () => new Date().toISOString().split('T')[0];

export default function BilanFinancierModal({ show, onHide }: Props) {
  const [dateDebut, setDateDebut] = useState(today());
  const [dateFin, setDateFin] = useState(today());
  const [modePaiement, setModePaiement] = useState('TOUS');
  const [typePatient, setTypePatient] = useState('TOUS');
  const [lignes, setLignes] = useState<BilanLigne[]>([]);
  const [totaux, setTotaux] = useState<Totaux | null>(null);
  const [parTypeActe, setParTypeActe] = useState<Record<string, { count: number; montant: number; encaisse: number }>>({});
  const [loading, setLoading] = useState(false);
  const [recherche, setRecherche] = useState('');
  const [onglet, setOnglet] = useState<'detail' | 'recap'>('detail');
  const [entrepriseId, setEntrepriseId] = useState('');

  useEffect(() => {
    setEntrepriseId(localStorage.getItem('IdEntreprise') || '');
  }, []);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        dateDebut,
        dateFin,
        modePaiement,
        typePatient,
        entrepriseId,
      });
      const res = await fetch(`/api/comptabilite/bilan?${params}`);
      if (res.ok) {
        const json = await res.json();
        setLignes(json.data || []);
        setTotaux(json.totaux || null);
        setParTypeActe(json.parTypeActe || {});
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [dateDebut, dateFin, modePaiement, typePatient]);

  useEffect(() => {
    if (show) charger();
  }, [show, charger]);

  const lignesFiltrees = lignes.filter(l =>
    !recherche ||
    l.patient.toLowerCase().includes(recherche.toLowerCase()) ||
    l.designation.toLowerCase().includes(recherche.toLowerCase()) ||
    l.typeActe.toLowerCase().includes(recherche.toLowerCase())
  );

  const badgeVariant = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('consult')) return 'primary';
    if (t.includes('pharma')) return 'warning';
    if (t.includes('encaiss')) return 'success';
    if (t.includes('hospit')) return 'danger';
    return 'secondary';
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" backdrop="static" keyboard={false}>
      <Modal.Header closeButton className="bg-success text-white">
        <Modal.Title>
          <i className="bi bi-bar-chart-fill me-2"></i>
          Bilan Financier
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* Filtres */}
        <Card className="mb-3 border-0 bg-light">
          <Card.Body className="py-2">
            <Row className="g-2 align-items-end">
              <Col md={2}>
                <Form.Label className="small fw-semibold">Date début</Form.Label>
                <Form.Control
                  type="date"
                  size="sm"
                  value={dateDebut}
                  onChange={e => setDateDebut(e.target.value)}
                />
              </Col>
              <Col md={2}>
                <Form.Label className="small fw-semibold">Date fin</Form.Label>
                <Form.Control
                  type="date"
                  size="sm"
                  value={dateFin}
                  onChange={e => setDateFin(e.target.value)}
                />
              </Col>
              <Col md={2}>
                <Form.Label className="small fw-semibold">Mode paiement</Form.Label>
                <Form.Select size="sm" value={modePaiement} onChange={e => setModePaiement(e.target.value)}>
                  <option value="TOUS">Tous</option>
                  <option value="ESPECE">Espèce</option>
                  <option value="CHEQUE">Chèque</option>
                  <option value="VIREMENT">Virement</option>
                  <option value="CARTE">Carte</option>
                  <option value="MOBILE MONEY">Mobile Money</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Label className="small fw-semibold">Type patient</Form.Label>
                <Form.Select size="sm" value={typePatient} onChange={e => setTypePatient(e.target.value)}>
                  <option value="TOUS">Tous</option>
                  <option value="NON ASSURE">Non assuré</option>
                  <option value="ASSURE">Assuré</option>
                  <option value="MUTUALISTE">Mutualiste</option>
                </Form.Select>
              </Col>
              <Col md={3}>
                <Form.Label className="small fw-semibold">Recherche</Form.Label>
                <Form.Control
                  type="text"
                  size="sm"
                  placeholder="Patient, désignation..."
                  value={recherche}
                  onChange={e => setRecherche(e.target.value)}
                />
              </Col>
              <Col md={1}>
                <Button variant="success" size="sm" className="w-100" onClick={charger} disabled={loading}>
                  {loading ? <Spinner size="sm" animation="border" /> : <i className="bi bi-search"></i>}
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Cartes totaux */}
        {totaux && (
          <Row className="g-2 mb-3">
            {[
              { label: 'Total actes', value: totaux.montantTotal, color: '#667eea', icon: 'bi-cash-coin' },
              { label: 'Part assurance', value: totaux.partAssurance, color: '#f5576c', icon: 'bi-shield-fill' },
              { label: 'Part patient', value: totaux.partPatient, color: '#fa709a', icon: 'bi-person-fill' },
              { label: 'Encaissé', value: totaux.montantEncaisse, color: '#43e97b', icon: 'bi-check-circle-fill' },
              { label: 'Remises', value: totaux.remise, color: '#f093fb', icon: 'bi-percent' },
              { label: 'Reste à payer', value: totaux.resteAPayer, color: '#ff6b6b', icon: 'bi-exclamation-circle-fill' },
            ].map((item, i) => (
              <Col key={i} md={2}>
                <div
                  className="rounded p-2 text-white text-center"
                  style={{ background: item.color, fontSize: '0.8rem' }}
                >
                  <i className={`bi ${item.icon} mb-1 d-block`} style={{ fontSize: '1.2rem' }}></i>
                  <div className="fw-semibold">{item.label}</div>
                  <div className="fw-bold" style={{ fontSize: '0.95rem' }}>{fmt(item.value)}</div>
                </div>
              </Col>
            ))}
          </Row>
        )}

        {/* Onglets */}
        <div className="d-flex gap-2 mb-2">
          <Button
            size="sm"
            variant={onglet === 'detail' ? 'success' : 'outline-success'}
            onClick={() => setOnglet('detail')}
          >
            Détail ({lignesFiltrees.length})
          </Button>
          <Button
            size="sm"
            variant={onglet === 'recap' ? 'success' : 'outline-success'}
            onClick={() => setOnglet('recap')}
          >
            Récapitulatif par type
          </Button>
        </div>

        {/* Tableau détail */}
        {onglet === 'detail' && (
          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            <Table bordered hover size="sm" style={{ fontSize: '0.78rem' }}>
              <thead className="table-dark sticky-top">
                <tr>
                  <th>Date</th>
                  <th>Patient</th>
                  <th>Type acte</th>
                  <th>Désignation</th>
                  <th>Assurance</th>
                  <th className="text-end">Total acte</th>
                  <th className="text-end">Part assur.</th>
                  <th className="text-end">Part patient</th>
                  <th className="text-end">Encaissé</th>
                  <th className="text-end">Remise</th>
                  <th className="text-end">Reste</th>
                  <th>Mode paiement</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={12} className="text-center py-3">
                      <Spinner animation="border" size="sm" /> Chargement...
                    </td>
                  </tr>
                ) : lignesFiltrees.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="text-center text-muted py-3">Aucune donnée</td>
                  </tr>
                ) : (
                  lignesFiltrees.map((l, i) => (
                    <tr key={i} className={l.resteAPayer > 0 ? 'table-warning' : ''}>
                      <td className="text-nowrap">
                        {l.date ? new Date(l.date).toLocaleDateString('fr-FR') : '-'}
                      </td>
                      <td>{l.patient}</td>
                      <td>
                        <Badge bg={badgeVariant(l.typeActe)} style={{ fontSize: '0.7rem' }}>
                          {l.typeActe}
                        </Badge>
                      </td>
                      <td>{l.designation}</td>
                      <td>{l.assurance || '-'}</td>
                      <td className="text-end">{fmt(l.montantTotal)}</td>
                      <td className="text-end">{fmt(l.partAssurance)}</td>
                      <td className="text-end">{fmt(l.partPatient)}</td>
                      <td className="text-end fw-semibold text-success">{fmt(l.montantEncaisse)}</td>
                      <td className="text-end text-muted">{fmt(l.remise)}</td>
                      <td className="text-end text-danger fw-semibold">{fmt(l.resteAPayer)}</td>
                      <td>{l.modePaiement || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {totaux && (
                <tfoot className="table-dark fw-bold">
                  <tr>
                    <td colSpan={5}>TOTAUX</td>
                    <td className="text-end">{fmt(totaux.montantTotal)}</td>
                    <td className="text-end">{fmt(totaux.partAssurance)}</td>
                    <td className="text-end">{fmt(totaux.partPatient)}</td>
                    <td className="text-end text-success">{fmt(totaux.montantEncaisse)}</td>
                    <td className="text-end">{fmt(totaux.remise)}</td>
                    <td className="text-end text-danger">{fmt(totaux.resteAPayer)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </Table>
          </div>
        )}

        {/* Récapitulatif par type */}
        {onglet === 'recap' && (
          <Table bordered size="sm" style={{ fontSize: '0.85rem' }}>
            <thead className="table-dark">
              <tr>
                <th>Type d'acte</th>
                <th className="text-end">Nombre</th>
                <th className="text-end">Montant total</th>
                <th className="text-end">Encaissé</th>
                <th className="text-end">% Encaissé</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(parTypeActe).map(([type, val], i) => (
                <tr key={i}>
                  <td>
                    <Badge bg={badgeVariant(type)} className="me-2" style={{ fontSize: '0.75rem' }}>
                      {type}
                    </Badge>
                  </td>
                  <td className="text-end">{val.count}</td>
                  <td className="text-end">{fmt(val.montant)}</td>
                  <td className="text-end text-success fw-semibold">{fmt(val.encaisse)}</td>
                  <td className="text-end">
                    {val.montant > 0
                      ? `${Math.round((val.encaisse / val.montant) * 100)}%`
                      : '0%'}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Modal.Body>

      <Modal.Footer className="d-flex justify-content-between">
        <small className="text-muted">
          {lignesFiltrees.length} ligne(s) • du {dateDebut} au {dateFin}
        </small>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" size="sm" onClick={onHide}>
            Fermer
          </Button>
          <Button variant="success" size="sm" onClick={charger} disabled={loading}>
            <i className="bi bi-arrow-clockwise me-1"></i>Actualiser
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
