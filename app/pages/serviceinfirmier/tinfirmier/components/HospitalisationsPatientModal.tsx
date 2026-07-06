'use client';

import React, { useEffect, useState } from 'react';
import { Modal, Button, Table, Spinner, Badge, Alert, Nav, Tab } from 'react-bootstrap';
import { FaHospital, FaNotesMedical, FaPills, FaClipboardList } from 'react-icons/fa';

interface Hospit {
  _id: string;
  CodePrestation?: string;
  PatientP?: string;
  Designationtypeacte?: string;
  Chambre?: string;
  Entrele?: string;
  SortieLe?: string;
  ObservationHospitalisation?: string;
}

interface Observation {
  _id: string;
  Date?: string;
  Heure?: string;
  Intervenant?: string;
  ObservationC?: string;
  Temperature?: string;
  Tension?: string;
  Poids?: string;
  Glycemie?: string;
  TailleCons?: string;
}

interface Prescription {
  _id: string;
  nomMedicament?: string;
  posologie?: string;
  QteP?: number;
  DatePres?: string;
  administre?: boolean;
}

interface Acte {
  _id: string;
  prestation?: string;
  QteP?: number;
  prix?: number;
  prixTotal?: number;
  dateLignePrestation?: string;
}

interface HospitalisationsPatientModalProps {
  show: boolean;
  onHide: () => void;
  patientId: string;
  patientNom?: string;
  patientPrenoms?: string;
}

const formatDate = (d?: string) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR');
};

export default function HospitalisationsPatientModal({
  show,
  onHide,
  patientId,
  patientNom,
  patientPrenoms,
}: HospitalisationsPatientModalProps) {
  const [hospits, setHospits] = useState<Hospit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedHospit, setSelectedHospit] = useState<Hospit | null>(null);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [actes, setActes] = useState<Acte[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<'observations' | 'prescriptions' | 'actes'>('observations');

  useEffect(() => {
    if (!show || !patientId) return;
    setError(null);
    setSelectedHospit(null);
    setHospits([]);
    setObservations([]);
    setPrescriptions([]);
    setActes([]);
    chargerHospitalisations();
  }, [show, patientId]);

  const chargerHospitalisations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/examenhospitalisation/patient?patientId=${patientId}`);
      if (!res.ok) throw new Error('Erreur chargement hospitalisations');
      const data = await res.json();
      setHospits(data?.data || []);
    } catch (err: any) {
      setError(err.message || 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  const chargerDetails = async (hospit: Hospit) => {
    setSelectedHospit(hospit);
    setLoadingDetails(true);
    setError(null);
    try {
      const [obsRes, prescRes, actesRes] = await Promise.allSettled([
        fetch(`/api/observations?hospitalisationId=${hospit._id}`),
        hospit.CodePrestation ? fetch(`/api/patientprescription?CodePrestation=${hospit.CodePrestation}`) : Promise.resolve({ ok: true, json: async () => [] } as any),
        hospit.CodePrestation ? fetch(`/api/ligneprestation?CodePrestation=${hospit.CodePrestation}&idHospitalisation=${hospit._id}`) : Promise.resolve({ ok: true, json: async () => ({ data: [] }) } as any),
      ]);

      if (obsRes.status === 'fulfilled' && obsRes.value.ok) {
        setObservations(await obsRes.value.json() || []);
      } else {
        setObservations([]);
      }

      if (prescRes.status === 'fulfilled' && prescRes.value.ok) {
        setPrescriptions(await prescRes.value.json() || []);
      } else {
        setPrescriptions([]);
      }

      if (actesRes.status === 'fulfilled' && actesRes.value.ok) {
        const actesData = await actesRes.value.json();
        setActes(actesData?.data || []);
      } else {
        setActes([]);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur chargement détails');
    } finally {
      setLoadingDetails(false);
    }
  };

  const patientName = `${patientNom || ''} ${patientPrenoms || ''}`.trim() || 'Patient';

  return (
    <Modal show={show} onHide={onHide} size="xl" centered scrollable>
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          <FaHospital className="me-2" />
          Hospitalisations — {patientName}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}

        {loading ? (
          <div className="text-center py-4"><Spinner animation="border" /></div>
        ) : hospits.length === 0 ? (
          <p className="text-center text-muted py-4">Aucune hospitalisation trouvée pour ce patient.</p>
        ) : (
          <>
            <div className="table-responsive mb-3">
              <Table bordered hover size="sm" className="text-center">
                <thead className="table-info">
                  <tr>
                    <th>Date entrée</th>
                    <th>Date sortie</th>
                    <th>Type</th>
                    <th>Chambre</th>
                    <th>Code prestation</th>
                    <th>Observation</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {hospits.map((h) => (
                    <tr
                      key={h._id}
                      className={selectedHospit?._id === h._id ? 'table-active' : ''}
                      style={{ cursor: 'pointer' }}
                      onClick={() => chargerDetails(h)}
                    >
                      <td>{formatDate(h.Entrele)}</td>
                      <td>{h.SortieLe ? formatDate(h.SortieLe) : <Badge bg="success">En cours</Badge>}</td>
                      <td>{h.Designationtypeacte || '—'}</td>
                      <td>{h.Chambre || '—'}</td>
                      <td>{h.CodePrestation || '—'}</td>
                      <td className="text-start" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {h.ObservationHospitalisation || '—'}
                      </td>
                      <td>
                        <Button variant="outline-primary" size="sm" onClick={(e) => { e.stopPropagation(); chargerDetails(h); }}>
                          <FaClipboardList className="me-1" /> Détails
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            {selectedHospit && (
              <div className="border rounded p-3 bg-light">
                <h6 className="fw-bold mb-3">
                  Détails de l'hospitalisation du {formatDate(selectedHospit.Entrele)}
                  {selectedHospit.SortieLe && ` au ${formatDate(selectedHospit.SortieLe)}`}
                </h6>

                {loadingDetails ? (
                  <div className="text-center py-3"><Spinner animation="border" size="sm" /></div>
                ) : (
                  <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k as any)}>
                    <Nav variant="tabs" className="mb-3">
                      <Nav.Item>
                        <Nav.Link eventKey="observations"><FaNotesMedical className="me-1" />Observations ({observations.length})</Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link eventKey="prescriptions"><FaPills className="me-1" />Prescriptions ({prescriptions.length})</Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link eventKey="actes"><FaClipboardList className="me-1" />Actes ({actes.length})</Nav.Link>
                      </Nav.Item>
                    </Nav>
                    <Tab.Content>
                      <Tab.Pane eventKey="observations">
                        {observations.length === 0 ? (
                          <p className="text-muted">Aucune observation.</p>
                        ) : (
                          <div className="table-responsive">
                            <Table bordered size="sm">
                              <thead className="table-primary">
                                <tr><th>Date</th><th>Heure</th><th>Intervenant</th><th>Observation</th></tr>
                              </thead>
                              <tbody>
                                {observations.map((o) => (
                                  <tr key={o._id}>
                                    <td>{formatDate(o.Date || o._id)}</td>
                                    <td>{o.Heure || '—'}</td>
                                    <td>{o.Intervenant || '—'}</td>
                                    <td>{o.ObservationC || '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          </div>
                        )}
                      </Tab.Pane>
                      <Tab.Pane eventKey="prescriptions">
                        {prescriptions.length === 0 ? (
                          <p className="text-muted">Aucune prescription.</p>
                        ) : (
                          <div className="table-responsive">
                            <Table bordered size="sm">
                              <thead className="table-success">
                                <tr><th>Médicament</th><th>Posologie</th><th>Qté</th><th>Date</th><th>Admin</th></tr>
                              </thead>
                              <tbody>
                                {prescriptions.map((p) => (
                                  <tr key={p._id}>
                                    <td>{p.nomMedicament || '—'}</td>
                                    <td>{p.posologie || '—'}</td>
                                    <td>{p.QteP ?? '—'}</td>
                                    <td>{formatDate(p.DatePres)}</td>
                                    <td>{p.administre ? 'Oui' : 'Non'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          </div>
                        )}
                      </Tab.Pane>
                      <Tab.Pane eventKey="actes">
                        {actes.length === 0 ? (
                          <p className="text-muted">Aucun acte.</p>
                        ) : (
                          <div className="table-responsive">
                            <Table bordered size="sm">
                              <thead className="table-warning">
                                <tr><th>Acte</th><th>Qté</th><th>Prix</th><th>Total</th><th>Date</th></tr>
                              </thead>
                              <tbody>
                                {actes.map((a) => (
                                  <tr key={a._id}>
                                    <td>{a.prestation || '—'}</td>
                                    <td>{a.QteP ?? '—'}</td>
                                    <td>{a.prix ?? '—'}</td>
                                    <td>{a.prixTotal ?? '—'}</td>
                                    <td>{formatDate(a.dateLignePrestation)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          </div>
                        )}
                      </Tab.Pane>
                    </Tab.Content>
                  </Tab.Container>
                )}
              </div>
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Fermer</Button>
      </Modal.Footer>
    </Modal>
  );
}
