'use client';

import React, { useEffect, useState } from 'react';
import { Modal, Button, Table, Spinner, Badge, Alert, Nav, Tab, Accordion } from 'react-bootstrap';
import { FaHospital, FaNotesMedical, FaPills, FaClipboardList, FaPrint, FaChevronDown } from 'react-icons/fa';
import { useEntreprise } from '@/hooks/useEntreprise';
import { generatePrintHeader, generatePrintFooter, createPrintWindow } from '@/utils/printRecu';

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
  Frequence?: string;
  SpO2?: string;
}

interface Prescription {
  _id: string;
  nomMedicament?: string;
  posologie?: string;
  QteP?: number;
  DatePres?: string;
  administre?: boolean;
  administrePar?: string;
  administreLe?: string;
}

interface LignePrestation {
  _id: string;
  prestation?: string;
  qte?: number;
  QteP?: number;
  dateLignePrestation?: string;
  lettreCle?: string;
  coefficientActe?: number;
}

interface ActeGroup {
  type: string;
  lignes: LignePrestation[];
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

const formatDateTime = (d?: string) => {
  if (!d) return '—';
  const date = new Date(d);
  return `${date.toLocaleDateString('fr-FR')} ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
};


export default function HospitalisationsPatientModal({
  show,
  onHide,
  patientId,
  patientNom,
  patientPrenoms,
}: HospitalisationsPatientModalProps) {
  const { entreprise } = useEntreprise();
  const [hospits, setHospits] = useState<Hospit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedHospit, setSelectedHospit] = useState<Hospit | null>(null);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [acteGroups, setActeGroups] = useState<ActeGroup[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingActes, setLoadingActes] = useState(false);
  const [activeTab, setActiveTab] = useState<'observations' | 'prescriptions' | 'actes'>('observations');

  useEffect(() => {
    if (!show || !patientId) return;
    setError(null);
    setSelectedHospit(null);
    setHospits([]);
    setObservations([]);
    setPrescriptions([]);
    setActeGroups([]);
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
    setActeGroups([]);
    setError(null);
    try {
      const [obsRes, prescRes] = await Promise.allSettled([
        fetch(`/api/observations?hospitalisationId=${hospit._id}`),
        hospit.CodePrestation ? fetch(`/api/patientprescription?CodePrestation=${hospit.CodePrestation}`) : Promise.resolve({ ok: true, json: async () => [] } as any),
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

      // Charger les actes par type pour le CodePrestation sélectionné
      if (hospit.CodePrestation) {
        chargerActesParType(hospit.CodePrestation);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur chargement détails');
    } finally {
      setLoadingDetails(false);
    }
  };

  const chargerActesParType = async (codePrestation: string) => {
    setLoadingActes(true);
    try {
      // Récupérer TOUS les examenhospit liés à ce CodePrestation (sans filtre Hospitalisation)
      const detailRes = await fetch(`/api/examenhospitalisation/patient/detail?codePrestation=${codePrestation}`);
      const detailData = detailRes.ok ? await detailRes.json() : { data: [] };
      const allHospits: Hospit[] = detailData?.data || [];

      const grouped = new Map<string, LignePrestation[]>();
      await Promise.all(
        allHospits.map(async (h) => {
          try {
            const res = await fetch(`/api/ligneprestation?CodePrestation=${codePrestation}&idHospitalisation=${h._id}`);
            if (res.ok) {
              const data = await res.json();
              const lignes: LignePrestation[] = data?.data || [];
              const type = h.Designationtypeacte || 'Autres';
              const existing = grouped.get(type) || [];
              grouped.set(type, [...existing, ...lignes]);
            }
          } catch {}
        })
      );
      setActeGroups(Array.from(grouped.entries()).map(([type, lignes]) => ({ type, lignes })));
    } catch {
      setActeGroups([]);
    } finally {
      setLoadingActes(false);
    }
  };

  const patientName = `${patientNom || ''} ${patientPrenoms || ''}`.trim() || 'Patient';

  // --- IMPRESSION ---
  const printWithHeader = (title: string, bodyHTML: string) => {
    const header = generatePrintHeader(entreprise);
    const footer = generatePrintFooter(entreprise);
    const patientInfo = `
      <div style="margin-bottom:15px; border-bottom:2px solid #0dcaf0; padding-bottom:10px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div><strong>Patient :</strong> ${patientName}</div>
          <div><strong>Date :</strong> ${new Date().toLocaleDateString('fr-FR')}</div>
        </div>
        ${selectedHospit ? `<div style="margin-top:5px;"><strong>Hospitalisation :</strong> du ${formatDate(selectedHospit.Entrele)} ${selectedHospit.SortieLe ? `au ${formatDate(selectedHospit.SortieLe)}` : '(en cours)'} — Chambre : ${selectedHospit.Chambre || '—'}</div>` : ''}
      </div>
    `;
    const content = `
      <div class="sub-header">${title}</div>
      ${patientInfo}
      ${bodyHTML}
    `;
    createPrintWindow(title, header, content, footer);
  };

  const printObservationDetail = (obs: Observation) => {
    const html = `
      <div style="border:1px solid #ddd; border-radius:8px; padding:20px; margin-bottom:15px;">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:15px;">
          <div><strong>Date :</strong> ${formatDate(obs.Date)}</div>
          <div><strong>Heure :</strong> ${obs.Heure || '—'}</div>
          <div><strong>Intervenant :</strong> ${obs.Intervenant || '—'}</div>
        </div>
        <div style="margin-bottom:15px;">
          <h4 style="color:#0d6efd; font-size:14px; margin-bottom:8px; border-bottom:1px solid #eee; padding-bottom:5px;">Constantes vitales</h4>
          <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px;">
            <div style="background:#f8f9fa; padding:8px; border-radius:4px;"><strong>T° :</strong> ${obs.Temperature || '—'}</div>
            <div style="background:#f8f9fa; padding:8px; border-radius:4px;"><strong>TA :</strong> ${obs.Tension || '—'}</div>
            <div style="background:#f8f9fa; padding:8px; border-radius:4px;"><strong>Poids :</strong> ${obs.Poids || '—'}</div>
            <div style="background:#f8f9fa; padding:8px; border-radius:4px;"><strong>Taille :</strong> ${obs.TailleCons || '—'}</div>
            <div style="background:#f8f9fa; padding:8px; border-radius:4px;"><strong>Glyc :</strong> ${obs.Glycemie || '—'}</div>
            <div style="background:#f8f9fa; padding:8px; border-radius:4px;"><strong>SpO2 :</strong> ${obs.SpO2 || '—'}</div>
          </div>
        </div>
        <div>
          <h4 style="color:#0d6efd; font-size:14px; margin-bottom:8px; border-bottom:1px solid #eee; padding-bottom:5px;">Observation</h4>
          <div style="background:#f8f9fa; padding:12px; border-radius:4px; white-space:pre-wrap;">${obs.ObservationC || 'Aucune observation'}</div>
        </div>
      </div>
    `;
    printWithHeader('Fiche d\'Observation', html);
  };

  const printObservationsTable = () => {
    const rows = observations.map(o => `
      <tr>
        <td>${formatDate(o.Date)}</td>
        <td>${o.Heure || '—'}</td>
        <td>${o.Intervenant || '—'}</td>
        <td>${o.Temperature || '—'}</td>
        <td>${o.Tension || '—'}</td>
        <td>${o.Poids || '—'}</td>
        <td style="text-align:left; max-width:200px;">${o.ObservationC || '—'}</td>
      </tr>
    `).join('');
    const html = `
      <table>
        <thead><tr>
          <th>Date</th><th>Heure</th><th>Intervenant</th><th>T°</th><th>TA</th><th>Poids</th><th>Observation</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
    printWithHeader('Liste des Observations', html);
  };

  const printPrescriptionDetail = (presc: Prescription) => {
    const html = `
      <div style="border:1px solid #ddd; border-radius:8px; padding:20px;">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div><strong>Médicament :</strong> ${presc.nomMedicament || '—'}</div>
          <div><strong>Posologie :</strong> ${presc.posologie || '—'}</div>
          <div><strong>Quantité :</strong> ${presc.QteP ?? '—'}</div>
          <div><strong>Date prescription :</strong> ${formatDate(presc.DatePres)}</div>
          <div><strong>Administré :</strong> ${presc.administre ? 'Oui' : 'Non'}</div>
          <div><strong>Administré par :</strong> ${presc.administrePar || '—'}</div>
          <div><strong>Date/Heure admin :</strong> ${presc.administreLe ? formatDateTime(presc.administreLe) : '—'}</div>
        </div>
      </div>
    `;
    printWithHeader('Fiche Prescription Médicament', html);
  };

  const printPrescriptionsTable = () => {
    const rows = prescriptions.map(p => `
      <tr>
        <td>${p.nomMedicament || '—'}</td>
        <td>${p.posologie || '—'}</td>
        <td>${p.QteP ?? '—'}</td>
        <td>${formatDate(p.DatePres)}</td>
        <td>${p.administre ? '<span style="color:green; font-weight:bold;">Oui</span>' : '<span style="color:red;">Non</span>'}</td>
        <td>${p.administrePar || '—'}</td>
        <td>${p.administreLe ? formatDateTime(p.administreLe) : '—'}</td>
      </tr>
    `).join('');
    const html = `
      <table>
        <thead><tr>
          <th>Médicament</th><th>Posologie</th><th>Qté</th><th>Date Presc.</th><th>Admin</th><th>Par</th><th>Date/Heure Admin</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
    printWithHeader('Liste des Prescriptions Médicamenteuses', html);
  };

  const printActesTable = () => {
    let html = '';
    acteGroups.forEach(({ type, lignes }) => {
      if (lignes.length === 0) return;
      html += `<h4 style="color:#0d6efd; font-size:14px; margin:15px 0 8px; border-bottom:1px solid #0dcaf0; padding-bottom:4px;">${type} (${lignes.length})</h4>`;
      const rows = lignes.map(l => `
        <tr>
          <td>${l.prestation || '—'}</td>
          <td>${l.lettreCle || '—'}</td>
          <td>${l.qte ?? l.QteP ?? '—'}</td>
          <td>${formatDate(l.dateLignePrestation)}</td>
        </tr>
      `).join('');
      html += `
        <table>
          <thead><tr><th>Acte</th><th>Clé</th><th>Qté</th><th>Date</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      `;
    });
    printWithHeader('Liste des Actes par Type', html);
  };

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
                  Détails de l&apos;hospitalisation du {formatDate(selectedHospit.Entrele)}
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
                        <Nav.Link eventKey="actes"><FaClipboardList className="me-1" />Actes</Nav.Link>
                      </Nav.Item>
                    </Nav>
                    <Tab.Content>
                      {/* === OBSERVATIONS === */}
                      <Tab.Pane eventKey="observations">
                        {observations.length === 0 ? (
                          <p className="text-muted">Aucune observation.</p>
                        ) : (
                          <>
                            <div className="d-flex justify-content-end mb-2">
                              <Button variant="outline-dark" size="sm" onClick={printObservationsTable}>
                                <FaPrint className="me-1" /> Imprimer la liste
                              </Button>
                            </div>
                            <div className="table-responsive">
                              <Table bordered size="sm" className="align-middle">
                                <thead className="table-primary">
                                  <tr>
                                    <th>Date</th>
                                    <th>Heure</th>
                                    <th>Intervenant</th>
                                    <th>T°</th>
                                    <th>TA</th>
                                    <th>Poids</th>
                                    <th>Observation</th>
                                    <th>Action</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {observations.map((o) => (
                                    <tr key={o._id}>
                                      <td>{formatDate(o.Date)}</td>
                                      <td>{o.Heure || '—'}</td>
                                      <td>{o.Intervenant || '—'}</td>
                                      <td>{o.Temperature || '—'}</td>
                                      <td>{o.Tension || '—'}</td>
                                      <td>{o.Poids || '—'}</td>
                                      <td className="text-start" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {o.ObservationC || '—'}
                                      </td>
                                      <td>
                                        <Button variant="outline-info" size="sm" title="Imprimer cette observation" onClick={() => printObservationDetail(o)}>
                                          <FaPrint />
                                        </Button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </Table>
                            </div>
                          </>
                        )}
                      </Tab.Pane>

                      {/* === PRESCRIPTIONS === */}
                      <Tab.Pane eventKey="prescriptions">
                        {prescriptions.length === 0 ? (
                          <p className="text-muted">Aucune prescription.</p>
                        ) : (
                          <>
                            <div className="d-flex justify-content-end mb-2">
                              <Button variant="outline-dark" size="sm" onClick={printPrescriptionsTable}>
                                <FaPrint className="me-1" /> Imprimer la liste
                              </Button>
                            </div>
                            <div className="table-responsive">
                              <Table bordered size="sm" className="align-middle">
                                <thead className="table-success">
                                  <tr>
                                    <th>Médicament</th>
                                    <th>Posologie</th>
                                    <th>Qté</th>
                                    <th>Date Presc.</th>
                                    <th>Admin</th>
                                    <th>Administré par</th>
                                    <th>Date/Heure</th>
                                    <th>Action</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {prescriptions.map((p) => (
                                    <tr key={p._id} className={p.administre ? 'table-light' : ''}>
                                      <td className="fw-semibold">{p.nomMedicament || '—'}</td>
                                      <td>{p.posologie || '—'}</td>
                                      <td>{p.QteP ?? '—'}</td>
                                      <td>{formatDate(p.DatePres)}</td>
                                      <td>
                                        {p.administre
                                          ? <Badge bg="success">Oui</Badge>
                                          : <Badge bg="warning" text="dark">Non</Badge>
                                        }
                                      </td>
                                      <td>{p.administrePar || '—'}</td>
                                      <td>{p.administreLe ? formatDateTime(p.administreLe) : '—'}</td>
                                      <td>
                                        <Button variant="outline-info" size="sm" title="Imprimer cette prescription" onClick={() => printPrescriptionDetail(p)}>
                                          <FaPrint />
                                        </Button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </Table>
                            </div>
                          </>
                        )}
                      </Tab.Pane>

                      {/* === ACTES (groupés par type d'acte) === */}
                      <Tab.Pane eventKey="actes">
                        {loadingActes ? (
                          <div className="text-center py-3"><Spinner animation="border" size="sm" /></div>
                        ) : acteGroups.length === 0 ? (
                          <p className="text-muted">Aucun acte.</p>
                        ) : (
                          <>
                            <div className="d-flex justify-content-end mb-2">
                              <Button variant="outline-dark" size="sm" onClick={printActesTable}>
                                <FaPrint className="me-1" /> Imprimer tous les actes
                              </Button>
                            </div>
                            <Accordion>
                              {acteGroups.map(({ type, lignes }, idx) => (
                                <Accordion.Item eventKey={String(idx)} key={type}>
                                  <Accordion.Header>
                                    <span className="fw-bold text-primary">{type}</span>
                                    <Badge bg="info" className="ms-2">{lignes.length}</Badge>
                                  </Accordion.Header>
                                  <Accordion.Body className="p-0">
                                    {lignes.length === 0 ? (
                                      <p className="text-muted small p-2">Aucune ligne de prestation</p>
                                    ) : (
                                      <Table bordered size="sm" className="mb-0 align-middle">
                                        <thead className="table-warning">
                                          <tr>
                                            <th>Acte</th>
                                            <th>Clé</th>
                                            <th>Qté</th>
                                            <th>Date</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {lignes.map((l) => (
                                            <tr key={l._id}>
                                              <td className="text-start">{l.prestation || '—'}</td>
                                              <td>{l.lettreCle || '—'}</td>
                                              <td>{l.qte ?? l.QteP ?? '—'}</td>
                                              <td>{formatDate(l.dateLignePrestation)}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </Table>
                                    )}
                                  </Accordion.Body>
                                </Accordion.Item>
                              ))}
                            </Accordion>
                          </>
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
