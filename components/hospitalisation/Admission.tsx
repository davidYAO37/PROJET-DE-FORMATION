'use client';

import { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Col, Form, Modal, Row } from 'react-bootstrap';
import { FaBed, FaCalendarAlt, FaCheckCircle, FaClock, FaDoorOpen, FaHospitalUser, FaReceipt, FaStethoscope, FaUserInjured } from 'react-icons/fa';

export interface PatientReference {
  _id?: string;
  Nom?: string;
  Prenoms?: string;
  Code_dossier?: string;
  TarifPatient?: string;
  Taux?: number;
}

export interface AvisHospit {
  _id: string;
  Patient?: string;
  serviceHospit?: string;
  etatPatient?: string;
  Diagnostic?: string;
  DateIntervention?: string;
  HeureHospit?: string;
  codePrestation?: string;
  DureHospit?: string | number;
  IDPARTIENT?: PatientReference | string;
}

interface Chambre {
  _id: string;
  numero: string;
  type?: string;
  etat?: string;
  tarifJournalier?: number;
  prixClinique?: number;
  prixMutuel?: number;
  prixPreferentiel?: number;
}

interface Lit {
  _id: string;
  numero: string;
  chambreId: { _id?: string } | string;
  etat: string;
}

interface Patient {
  _id: string;
  Nom?: string;
  Prenoms?: string;
  Code_dossier?: string;
  TarifPatient?: string;
}

interface TypeActe {
  _id: string;
  Designation: string;
}

interface AdmissionProps {
  avis: AvisHospit | null;
  show: boolean;
  onHide: () => void;
  onSuccess: () => Promise<void> | void;
}

const today = () => new Date().toISOString().slice(0, 10);

const getDateSortie = (dateEntree: string, nombreDeJours: number) => {
  const entree = new Date(`${dateEntree}T00:00:00`);
  if (Number.isNaN(entree.getTime())) return '';
  entree.setDate(entree.getDate() + Math.max(1, nombreDeJours) - 1);
  return entree.toISOString().slice(0, 10);
};

const getNombreDeJours = (dateEntree: string, dateSortie: string) => {
  const entree = new Date(`${dateEntree}T00:00:00`);
  const sortie = new Date(`${dateSortie}T00:00:00`);
  if (Number.isNaN(entree.getTime()) || Number.isNaN(sortie.getTime()) || sortie < entree) return 1;
  return Math.ceil((sortie.getTime() - entree.getTime()) / 86400000) + 1;
};

const getId = (value: { _id?: string } | string | undefined) =>
  typeof value === 'string' ? value : value?._id || '';

export default function Admission({ avis, show, onHide, onSuccess }: AdmissionProps) {
  const [chambres, setChambres] = useState<Chambre[]>([]);
  const [lits, setLits] = useState<Lit[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [typeActes, setTypeActes] = useState<TypeActe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [codePrestationError, setCodePrestationError] = useState('');
  const [checkingCodePrestation, setCheckingCodePrestation] = useState(false);
  const [natureActeError, setNatureActeError] = useState('');
  const [checkingNatureActe, setCheckingNatureActe] = useState(false);
  const [admission, setAdmission] = useState({
    patientId: '',
    chambreId: '',
    litId: '',
    dateEntree: today(),
    dateSortie: today(),
    heureEntree: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    codePrestation: '',
    natureActeId: '',
    typePatient: 'non',
    quantite: 1,
    prixChambre: 0
  });

  const availableBeds = useMemo(
    () => lits.filter((lit) => lit.etat === 'libre' && getId(lit.chambreId) === admission.chambreId),
    [admission.chambreId, lits]
  );

  const selectedChambre = useMemo(
    () => chambres.find((chambre) => chambre._id === admission.chambreId),
    [admission.chambreId, chambres]
  );

  const totalAdmission = admission.quantite * admission.prixChambre;

  useEffect(() => {
    if (!selectedChambre) {
      setAdmission((prev) => ({ ...prev, prixChambre: 0 }));
      return;
    }

    let prix = 0;
    if (admission.typePatient === 'mutualiste') {
      prix = selectedChambre.prixMutuel || selectedChambre.prixClinique || selectedChambre.tarifJournalier || 0;
    } else if (admission.typePatient === 'preferentiel') {
      prix = selectedChambre.prixPreferentiel || selectedChambre.prixClinique || selectedChambre.tarifJournalier || 0;
    } else {
      prix = selectedChambre.prixClinique || selectedChambre.tarifJournalier || 0;
    }

    setAdmission((prev) => ({ ...prev, prixChambre: Math.round(prix) }));
  }, [selectedChambre, admission.typePatient]);

  useEffect(() => {
    if (!show) return;

    const tarif = typeof avis?.IDPARTIENT === 'object'
      ? avis.IDPARTIENT?.TarifPatient?.toLowerCase() || ''
      : '';
    const typePatient = tarif.includes('mutualiste')
      ? 'mutualiste'
      : tarif.includes('pref')
        ? 'preferentiel'
        : 'non';

    setAdmission({
      patientId: '',
      chambreId: '',
      litId: '',
      dateEntree: today(),
      dateSortie: getDateSortie(today(), Number(avis?.DureHospit) || 1),
      heureEntree: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      codePrestation: avis?.codePrestation || '',
      natureActeId: '',
      typePatient,
      quantite: Number(avis?.DureHospit) || 1,
      prixChambre: 0
    });
    setError('');

    const loadResources = async () => {
      try {
        const [chambresResponse, litsResponse, patientsResponse, typeActesResponse] = await Promise.all([
          fetch('/api/chambres'),
          fetch('/api/lits'),
          fetch('/api/patients'),
          fetch('/api/typeacte/hospitalisation')
        ]);
        if (!chambresResponse.ok || !litsResponse.ok || !patientsResponse.ok || !typeActesResponse.ok) {
          throw new Error('Impossible de charger les données d’admission');
        }

        const [chambresData, litsData, patientsData, typeActesData] = await Promise.all([
          chambresResponse.json(),
          litsResponse.json(),
          patientsResponse.json(),
          typeActesResponse.json()
        ]);
        setChambres(Array.isArray(chambresData) ? chambresData : chambresData.data || []);
        setLits(Array.isArray(litsData) ? litsData : litsData.data || []);
        setPatients(Array.isArray(patientsData) ? patientsData : patientsData.data || []);
        setTypeActes(Array.isArray(typeActesData) ? typeActesData : typeActesData.data || []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Impossible de charger les ressources d’admission');
      }
    };

    loadResources();
  }, [show, avis]);

  useEffect(() => {
    if (avis || !admission.patientId) return;
    const patient = patients.find((item) => item._id === admission.patientId);
    const tarif = patient?.TarifPatient?.toLowerCase() || '';
    const typePatient = tarif.includes('mutualiste')
      ? 'mutualiste'
      : tarif.includes('pref')
        ? 'preferentiel'
        : 'non';
    setAdmission((prev) => ({ ...prev, typePatient }));
  }, [admission.patientId, avis, patients]);

  const verifyNatureActeAdmission = async (natureActeId: string, codePrestation: string) => {
    if (!natureActeId || !codePrestation.trim()) {
      setNatureActeError('');
      return;
    }
    const selectedType = typeActes.find((t) => t._id === natureActeId);
    if (!selectedType) return;

    setCheckingNatureActe(true);
    setNatureActeError('');
    try {
      const res = await fetch(
        `/api/examenhospitalisationMedecin?CodePrestation=${encodeURIComponent(codePrestation.trim())}&typeActe=${encodeURIComponent(selectedType.Designation)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data._id && data.statutHospitalisation) {
          setNatureActeError(
            `Une admission de type "${selectedType.Designation}" existe déjà pour le code prestation "${codePrestation.trim()}". Vous ne pouvez pas admettre le même type d'acte pour le même code prestation deux fois.`
          );
        }
      }
    } catch {
      // silently ignore network errors for this check
    } finally {
      setCheckingNatureActe(false);
    }
  };

  const resetAdmissionForCodePrestation = (codePrestation: string) => {
    setError('');
    setCodePrestationError('');
    setNatureActeError('');
    setAdmission({
      patientId: '',
      chambreId: '',
      litId: '',
      dateEntree: today(),
      dateSortie: today(),
      heureEntree: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      codePrestation,
      natureActeId: '',
      typePatient: 'non',
      quantite: 1,
      prixChambre: 0
    });
  };

  const verifyCodePrestation = async () => {
    const codePrestation = admission.codePrestation.trim();
    if (!codePrestation || avis) return;

    setCheckingCodePrestation(true);
    setCodePrestationError('');
    try {
      const response = await fetch(`/api/codeconsultation?CodePrestation=${encodeURIComponent(codePrestation)}`);
      const consultation = await response.json();
      if (!response.ok || !consultation.patientId) {
        throw new Error(consultation.error || 'Aucune consultation liée à ce code prestation');
      }
      setAdmission((prev) => ({ ...prev, patientId: String(consultation.patientId) }));
    } catch (verificationError) {
      setCodePrestationError(verificationError instanceof Error ? verificationError.message : 'Impossible de vérifier le code prestation');
    } finally {
      setCheckingCodePrestation(false);
    }
  };

  const submitAdmission = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!avis && !admission.patientId) return;
    if (!avis && codePrestationError) return;
    if (natureActeError) return;

    setLoading(true);
    setError('');

    try {
      const saisiPar = typeof window !== 'undefined' ? localStorage.getItem('nom_utilisateur') || '' : '';
      const response = await fetch('/api/hospitalisations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avisHospitId: avis?._id,
          patientId: avis ? undefined : admission.patientId,
          chambreId: admission.chambreId,
          litId: admission.litId,
          dateEntree: admission.dateEntree,
          dateSortie: admission.dateSortie,
          heureEntree: admission.heureEntree,
          codePrestation: admission.codePrestation,
          natureActeId: admission.natureActeId || undefined,
          natureActeDesignation: avis?.serviceHospit || typeActes.find((typeActe) => typeActe._id === admission.natureActeId)?.Designation,
          typePatient: admission.typePatient,
          quantite: Number(admission.quantite),
          prixChambre: Number(admission.prixChambre),
          saisiPar
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Échec de l’admission');

      await onSuccess();
      onHide();
    } catch (admissionError) {
      setError(admissionError instanceof Error ? admissionError.message : 'Échec de l’admission');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg" contentClassName="border-0 shadow-lg overflow-hidden" dialogClassName="modal-dialog-scrollable">
      <Form onSubmit={submitAdmission} className="d-flex flex-column overflow-hidden">
        <Modal.Header closeButton className="border-0 text-white" style={{ background: 'linear-gradient(135deg, #0f766e 0%, #0f4c5c 100%)' }}>
          <Modal.Title className="d-flex align-items-center gap-3">
            <span className="d-inline-flex align-items-center justify-content-center rounded-circle bg-white text-success" style={{ width: 44, height: 44 }}>
              <FaHospitalUser />
            </span>
            <span>
              <span className="d-block fs-5 fw-bold">Admission du patient</span>
              <small className="fw-normal opacity-75">Enregistrement d’une hospitalisation</small>
            </span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4 overflow-auto" style={{ backgroundColor: '#f8fafc', maxHeight: 'calc(100vh - 190px)' }}>
          {error && <Alert variant="danger" className="border-0 shadow-sm">{error}</Alert>}

          {avis && (
            <div className="rounded-3 border border-info-subtle bg-info-subtle p-3 mb-4 d-flex align-items-start gap-3">
              <FaStethoscope className="text-info fs-4 mt-1" />
              <div>
                <div className="fw-semibold text-dark">Admission provenant d’un avis médical</div>
                <div className="text-muted small">{avis.serviceHospit || 'Service non précisé'} · {avis.Diagnostic || 'Diagnostic non précisé'}</div>
              </div>
            </div>
          )}

          <div className="bg-white border rounded-3 p-3 p-md-4 mb-3 shadow-sm">
            <div className="d-flex align-items-center gap-2 mb-3">
              <span className="rounded-circle text-primary bg-primary-subtle d-inline-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}><FaUserInjured /></span>
              <div>
                <div className="fw-bold">Informations patient</div>
                <small className="text-muted">Identification et nature de l’admission</small>
              </div>
            </div>
            {!avis && (
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Patient</Form.Label>
                <Form.Select value={admission.patientId} onChange={(event) => setAdmission((prev) => ({ ...prev, patientId: event.target.value }))} required>
                  <option value="">Sélectionner un patient</option>
                  {patients.map((patient) => (
                    <option key={patient._id} value={patient._id}>
                      {[patient.Nom, patient.Prenoms].filter(Boolean).join(' ') || patient.Code_dossier || 'Patient'}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Code prestation</Form.Label>
                  <Form.Control type="text" value={admission.codePrestation} onChange={(event) => resetAdmissionForCodePrestation(event.target.value)} onBlur={verifyCodePrestation} placeholder="Saisir le code prestation" isInvalid={Boolean(codePrestationError)} disabled={checkingCodePrestation} required />
                  {checkingCodePrestation && <Form.Text className="text-muted">Vérification de la consultation liée...</Form.Text>}
                  {codePrestationError && <Form.Control.Feedback type="invalid">{codePrestationError}</Form.Control.Feedback>}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Nature de l’admission</Form.Label>
                  {avis ? (
                    <Form.Select value={avis.serviceHospit || ''} disabled>
                      <option value={avis.serviceHospit || ''}>{avis.serviceHospit || 'Service d’hospitalisation non précisé'}</option>
                    </Form.Select>
                  ) : (
                    <>
                      <Form.Select
                        value={admission.natureActeId}
                        onChange={(event) => {
                          const value = event.target.value;
                          setAdmission((prev) => ({ ...prev, natureActeId: value }));
                          verifyNatureActeAdmission(value, admission.codePrestation);
                        }}
                        isInvalid={Boolean(natureActeError)}
                        required
                      >
                        <option value="">Sélectionner la nature</option>
                        {typeActes.map((typeActe) => (
                          <option key={typeActe._id} value={typeActe._id}>{typeActe.Designation}</option>
                        ))}
                      </Form.Select>
                      {checkingNatureActe && <Form.Text className="text-muted">Vérification en cours...</Form.Text>}
                      {natureActeError && <Form.Control.Feedback type="invalid">{natureActeError}</Form.Control.Feedback>}
                    </>
                  )}
                </Form.Group>
              </Col>
            </Row>
          </div>

          <Row className="g-3 mb-3">
            <Col lg={6}>
              <div className="bg-white border rounded-3 p-3 p-md-4 h-100 shadow-sm">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <span className="rounded-circle text-success bg-success-subtle d-inline-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}><FaReceipt /></span>
              <div>
                <div className="fw-bold">Tarification</div>
                <small className="text-muted">Type patient et coût prévisionnel du séjour</small>
              </div>
            </div>
            <Form.Label className="fw-semibold d-block">Type de patient</Form.Label>
            <div className="d-flex flex-wrap gap-2 mb-3">
              {[
                { value: 'non', label: 'Non Assuré', variant: 'secondary' },
                { value: 'mutualiste', label: 'Mutualiste', variant: 'primary' },
                { value: 'preferentiel', label: 'Préférentiel', variant: 'success' }
              ].map((type) => (
                <Button key={type.value} type="button" size="sm" variant={admission.typePatient === type.value ? type.variant : 'outline-secondary'} onClick={() => setAdmission((prev) => ({ ...prev, typePatient: type.value }))}>
                  {admission.typePatient === type.value && <FaCheckCircle className="me-1" />}{type.label}
                </Button>
              ))}
            </div>
            <Row className="g-3 align-items-end">
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Durée (jours)</Form.Label>
                  <Form.Control type="number" min={1} value={admission.quantite} onChange={(event) => {
                    const quantite = Math.max(1, Number(event.target.value) || 1);
                    setAdmission((prev) => ({ ...prev, quantite, dateSortie: getDateSortie(prev.dateEntree, quantite) }));
                  }} required />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Prix journalier</Form.Label>
                  <Form.Control type="number" min={0} value={admission.prixChambre} onChange={(event) => setAdmission((prev) => ({ ...prev, prixChambre: Number(event.target.value) }))} required />
                </Form.Group>
              </Col>
              <Col md={4}>
                <div className="rounded-3 p-3 text-white" style={{ background: 'linear-gradient(135deg, #0f766e 0%, #0f4c5c 100%)' }}>
                  <small className="d-block opacity-75">Total prévisionnel</small>
                  <strong className="fs-5">{new Intl.NumberFormat('fr-FR').format(totalAdmission)} FCFA</strong>
                </div>
              </Col>
                </Row>
              </div>
            </Col>
            <Col lg={6}>
              <div className="bg-white border rounded-3 p-3 p-md-4 h-100 shadow-sm">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <span className="rounded-circle text-warning bg-warning-subtle d-inline-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}><FaBed /></span>
              <div>
                <div className="fw-bold">Hébergement</div>
                <small className="text-muted">Choisissez une chambre et un lit disponible</small>
              </div>
              {admission.chambreId && <Badge bg="success" className="ms-auto">{availableBeds.length} lit(s) libre(s)</Badge>}
            </div>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold"><FaDoorOpen className="me-1 text-muted" /> Chambre</Form.Label>
                  <Form.Select value={admission.chambreId} onChange={(event) => setAdmission((prev) => ({ ...prev, chambreId: event.target.value, litId: '' }))} required>
                    <option value="">Sélectionner une chambre</option>
                    {chambres.filter((chambre) => chambre.etat !== 'maintenance' && chambre.etat !== 'fermee').map((chambre) => (
                      <option key={chambre._id} value={chambre._id}>{chambre.numero}{chambre.type ? ` — ${chambre.type}` : ''}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold"><FaBed className="me-1 text-muted" /> Lit disponible</Form.Label>
                  <Form.Select value={admission.litId} onChange={(event) => setAdmission((prev) => ({ ...prev, litId: event.target.value }))} disabled={!admission.chambreId || availableBeds.length === 0} required>
                    <option value="">{admission.chambreId && availableBeds.length === 0 ? 'Aucun lit disponible' : 'Sélectionner un lit'}</option>
                    {availableBeds.map((lit) => <option key={lit._id} value={lit._id}>{lit.numero}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
                {admission.chambreId && availableBeds.length === 0 && (
                  <Alert variant="warning" className="mb-0 mt-3 py-2 border-0">Cette chambre ne dispose d’aucun lit libre. Veuillez choisir une autre chambre ou libérer un lit.</Alert>
                )}
              </div>
            </Col>
          </Row>

          <div className="bg-white border rounded-3 p-3 p-md-4 shadow-sm">
            <div className="d-flex align-items-center gap-2 mb-3">
              <span className="rounded-circle text-danger bg-danger-subtle d-inline-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}><FaCalendarAlt /></span>
              <div>
                <div className="fw-bold">Période d’hospitalisation</div>
                <small className="text-muted">La durée est calculée de façon inclusive, comme pour l’examen hospitalisation</small>
              </div>
            </div>
            <Row className="g-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Date d’entrée</Form.Label>
                  <Form.Control type="date" value={admission.dateEntree} onChange={(event) => {
                    const dateEntree = event.target.value;
                    setAdmission((prev) => ({ ...prev, dateEntree, dateSortie: getDateSortie(dateEntree, prev.quantite) }));
                  }} required />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Date de sortie</Form.Label>
                  <Form.Control type="date" min={admission.dateEntree} value={admission.dateSortie} onChange={(event) => {
                    const dateSortie = event.target.value;
                    setAdmission((prev) => ({ ...prev, dateSortie, quantite: getNombreDeJours(prev.dateEntree, dateSortie) }));
                  }} required />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold"><FaClock className="me-1 text-muted" /> Heure d’entrée</Form.Label>
                  <Form.Control type="time" value={admission.heureEntree} onChange={(event) => setAdmission((prev) => ({ ...prev, heureEntree: event.target.value }))} required />
                </Form.Group>
              </Col>
            </Row>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 bg-white px-4 py-3">
          <Button variant="light" className="border" onClick={onHide} disabled={loading}>Annuler</Button>
          <Button type="submit" variant="success" className="px-4" disabled={loading || Boolean(natureActeError) || (Boolean(admission.chambreId) && availableBeds.length === 0)}>
            <FaCheckCircle className="me-2" />{loading ? 'Admission en cours...' : 'Confirmer l’admission'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
