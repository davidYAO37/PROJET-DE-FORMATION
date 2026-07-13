'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Button, Form, Spinner, Alert, Table, InputGroup } from 'react-bootstrap';
import { useRouter } from 'next/navigation';

interface Patient {
    _id: string;
    Nom: string;
    Prenoms: string;
    Code_dossier: string;
    SOCIETE_PATIENT?: string;
    Assurance?: string;
    Taux?: number;
    IDASSURANCE?: string;
    Numcarte?: string;
}

interface Assurance {
    _id: string;
    designationassurance: string;
}

interface Medecin {
    _id: string;
    nom: string;
    prenoms: string;
    specialite?: string;
}

const TYPE_FACTURE = ['CONSULTATION', 'HOSPITALISATION', 'PHARMACIE', 'EXAMEN', 'ACTE CLINIQUE'];
const MODE_PAIEMENT = ['ESPECES', 'CHEQUE', 'VIREMENT', 'MOBILE MONEY', 'CARTE VISA'];
const fmt = (n: number) => (n || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 });

export default function SaisieFacturePage() {
    const router = useRouter();

    // Patient
    const [searchPatient, setSearchPatient] = useState('');
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [loadingPatients, setLoadingPatients] = useState(false);

    // Référentiels
    const [assurances, setAssurances] = useState<Assurance[]>([]);
    const [medecins, setMedecins] = useState<Medecin[]>([]);

    // Formulaire facture
    const [typefacture, setTypefacture] = useState('CONSULTATION');
    const [designationActe, setDesignationActe] = useState('');
    const [montantTotal, setMontantTotal] = useState(0);
    const [idAssurance, setIdAssurance] = useState('');
    const [nomAssurance, setNomAssurance] = useState('');
    const [taux, setTaux] = useState(0);
    const [numcarte, setNumcarte] = useState('');
    const [numBon, setNumBon] = useState('');
    const [societePatient, setSocietePatient] = useState('');
    const [idMedecin, setIdMedecin] = useState('');
    const [nomMedecin, setNomMedecin] = useState('');
    const [modepaiement, setModepaiement] = useState('ESPECES');
    const [reduction, setReduction] = useState(0);
    const [tauxreduction, setTauxreduction] = useState(0);
    const [motifRemise, setMotifRemise] = useState('');
    const [montantRecu, setMontantRecu] = useState(0);
    const [observation, setObservation] = useState('');
    const [dateFacturation, setDateFacturation] = useState(new Date().toISOString().split('T')[0]);

    // Calculs
    const partAssurance = Math.round((montantTotal * taux) / 100);
    const montantApresRemise = Math.max(0, montantTotal - reduction - Math.round((montantTotal * tauxreduction) / 100));
    const partPatient = montantApresRemise - partAssurance;
    const restapayer = Math.max(0, partPatient - montantRecu);

    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
    const [utilisateur, setUtilisateur] = useState('');

    useEffect(() => {
        setUtilisateur(localStorage.getItem('nom_utilisateur') || localStorage.getItem('userName') || '');
        loadAssurances();
        loadMedecins();
    }, []);

    const loadAssurances = async () => {
        try {
            const res = await fetch('/api/assurances');
            if (res.ok) setAssurances(await res.json());
        } catch { }
    };

    const loadMedecins = async () => {
        try {
            const res = await fetch('/api/medecins');
            if (res.ok) setMedecins(await res.json());
        } catch { }
    };

    const handleSearchPatient = useCallback(async () => {
        if (!searchPatient.trim()) return;
        setLoadingPatients(true);
        try {
            const res = await fetch(`/api/patients?search=${encodeURIComponent(searchPatient.trim())}`);
            if (res.ok) setPatients(await res.json());
        } catch { } finally {
            setLoadingPatients(false);
        }
    }, [searchPatient]);

    const handleSelectPatient = (p: Patient) => {
        setSelectedPatient(p);
        setPatients([]);
        setSearchPatient('');
        // Pré-remplir assurance/société du patient
        if (p.IDASSURANCE) setIdAssurance(p.IDASSURANCE);
        if (p.Assurance) setNomAssurance(p.Assurance);
        if (p.Taux) setTaux(p.Taux);
        if (p.SOCIETE_PATIENT) setSocietePatient(p.SOCIETE_PATIENT);
        if (p.Numcarte) setNumcarte(p.Numcarte);
    };

    const handleAssuranceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const sel = assurances.find(a => a._id === e.target.value);
        setIdAssurance(e.target.value);
        setNomAssurance(sel?.designationassurance || '');
    };

    const handleMedecinChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const sel = medecins.find(m => m._id === e.target.value);
        setIdMedecin(e.target.value);
        setNomMedecin(sel ? `${sel.nom} ${sel.prenoms}` : '');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPatient) {
            setMessage({ type: 'danger', text: 'Veuillez sélectionner un patient.' });
            return;
        }
        if (!designationActe.trim()) {
            setMessage({ type: 'danger', text: 'Veuillez saisir la désignation de l\'acte.' });
            return;
        }
        if (montantTotal <= 0) {
            setMessage({ type: 'danger', text: 'Le montant total doit être supérieur à 0.' });
            return;
        }

        setSaving(true);
        setMessage(null);
        try {
            const payload: any = {
                PatientP: `${selectedPatient.Nom} ${selectedPatient.Prenoms}`,
                Code_dossier: selectedPatient.Code_dossier,
                IdPatient: selectedPatient._id,
                typefacture,
                Designationtypeacte: designationActe,
                Montanttotal: montantTotal,
                PartAssuranceP: partAssurance,
                Partassure: partPatient,
                TotalapayerPatient: partPatient,
                TotalPaye: montantRecu,
                Restapayer: restapayer,
                reduction,
                tauxreduction,
                MotifRemise: motifRemise,
                MontantRecu: montantRecu,
                Assurance: nomAssurance || 'NON ASSURÉ',
                Taux: taux ? String(taux) : '',
                Numcarte: numcarte,
                NumBon: numBon,
                SOCIETE_PATIENT: societePatient,
                Souscripteur: selectedPatient.Nom + ' ' + selectedPatient.Prenoms,
                NomMed: nomMedecin,
                Modepaiement: modepaiement,
                ObservationC: observation,
                DateFacturation: new Date(dateFacturation).toISOString(),
                DatePres: new Date(dateFacturation).toISOString(),
                Heure_Facturation: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                FacturePar: utilisateur,
                SaisiPar: utilisateur,
                StatutFacture: restapayer === 0,
                StatutPaiement: restapayer === 0 ? 'Payée' : 'En cours de Paiement',
            };

            if (idAssurance) payload.IDASSURANCE = idAssurance;
            if (idMedecin) payload.IDMEDECIN = idMedecin;

            const res = await fetch('/api/facturation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Erreur lors de la création');

            setMessage({ type: 'success', text: `Facture créée avec succès — N° ${data.data?.Numfacture || data.data?.CodePrestation || ''}` });
            // Reset
            setSelectedPatient(null);
            setDesignationActe('');
            setMontantTotal(0);
            setIdAssurance('');
            setNomAssurance('');
            setTaux(0);
            setNumcarte('');
            setNumBon('');
            setSocietePatient('');
            setIdMedecin('');
            setNomMedecin('');
            setReduction(0);
            setTauxreduction(0);
            setMotifRemise('');
            setMontantRecu(0);
            setObservation('');

            if (data.data?._id) {
                setTimeout(() => router.push(`/pages/servicefacturation/detail-facture/${data.data._id}`), 1200);
            }
        } catch (e: any) {
            setMessage({ type: 'danger', text: e.message });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '20px' }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg,#2e7d32 0%,#388e3c 50%,#66bb6a 100%)',
                borderRadius: 10, padding: '14px 24px', marginBottom: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                boxShadow: '0 4px 20px rgba(46,125,50,0.3)',
            }}>
                <div>
                    <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>Service Facturation</div>
                    <div style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 800 }}>Nouvelle Facture</div>
                </div>
                <div className="d-flex gap-2">
                    <Button size="sm" variant="light" onClick={() => router.push('/pages/servicefacturation/liste-factures')}>
                        <i className="bi bi-list-ul me-1"></i>Liste des factures
                    </Button>
                </div>
            </div>

            {message && <Alert variant={message.type} dismissible onClose={() => setMessage(null)}>{message.text}</Alert>}

            <Form onSubmit={handleSubmit}>
                <Row className="g-3">
                    {/* Recherche patient */}
                    <Col xs={12}>
                        <Card className="shadow-sm">
                            <Card.Header className="bg-white fw-bold py-2 small">
                                <i className="bi bi-person-search me-2 text-primary"></i>Sélection du patient
                            </Card.Header>
                            <Card.Body>
                                {selectedPatient ? (
                                    <div className="d-flex align-items-center gap-3">
                                        <div style={{ background: '#e3f2fd', borderRadius: 8, padding: '10px 16px', flex: 1 }}>
                                            <div className="fw-bold">{selectedPatient.Nom} {selectedPatient.Prenoms}</div>
                                            <div className="text-muted small">Dossier : <code>{selectedPatient.Code_dossier}</code>
                                                {selectedPatient.SOCIETE_PATIENT && <> — {selectedPatient.SOCIETE_PATIENT}</>}
                                            </div>
                                        </div>
                                        <Button size="sm" variant="outline-secondary" onClick={() => setSelectedPatient(null)}>
                                            <i className="bi bi-x me-1"></i>Changer
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <InputGroup>
                                            <Form.Control
                                                placeholder="Rechercher un patient par nom..."
                                                value={searchPatient}
                                                onChange={e => setSearchPatient(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleSearchPatient())}
                                            />
                                            <Button variant="primary" onClick={handleSearchPatient} disabled={loadingPatients}>
                                                {loadingPatients ? <Spinner size="sm" /> : <i className="bi bi-search"></i>}
                                            </Button>
                                        </InputGroup>
                                        {patients.length > 0 && (
                                            <div style={{ border: '1px solid #dee2e6', borderRadius: 6, marginTop: 4, maxHeight: 200, overflowY: 'auto' }}>
                                                {patients.map(p => (
                                                    <div
                                                        key={p._id}
                                                        style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}
                                                        className="hover-bg"
                                                        onClick={() => handleSelectPatient(p)}
                                                        onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
                                                        onMouseLeave={e => (e.currentTarget.style.background = '')}
                                                    >
                                                        <span className="fw-semibold">{p.Nom} {p.Prenoms}</span>
                                                        <span className="text-muted ms-2 small">({p.Code_dossier})</span>
                                                        {p.SOCIETE_PATIENT && <span className="text-muted ms-2 small">— {p.SOCIETE_PATIENT}</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Acte */}
                    <Col xs={12}>
                        <Card className="shadow-sm">
                            <Card.Header className="bg-white fw-bold py-2 small">
                                <i className="bi bi-clipboard-pulse me-2 text-success"></i>Acte facturé
                            </Card.Header>
                            <Card.Body>
                                <Row className="g-2">
                                    <Col md={3}>
                                        <Form.Label className="small fw-semibold mb-1">Type de facture <span className="text-danger">*</span></Form.Label>
                                        <Form.Select size="sm" value={typefacture} onChange={e => setTypefacture(e.target.value)}>
                                            {TYPE_FACTURE.map(t => <option key={t} value={t}>{t}</option>)}
                                        </Form.Select>
                                    </Col>
                                    <Col md={5}>
                                        <Form.Label className="small fw-semibold mb-1">Désignation de l'acte <span className="text-danger">*</span></Form.Label>
                                        <Form.Control size="sm" value={designationActe} onChange={e => setDesignationActe(e.target.value)} placeholder="Ex: Consultation générale..." required />
                                    </Col>
                                    <Col md={2}>
                                        <Form.Label className="small fw-semibold mb-1">Montant (FCFA) <span className="text-danger">*</span></Form.Label>
                                        <Form.Control size="sm" type="number" min={0} value={montantTotal || ''} onChange={e => setMontantTotal(Number(e.target.value))} required />
                                    </Col>
                                    <Col md={2}>
                                        <Form.Label className="small fw-semibold mb-1">Date facturation</Form.Label>
                                        <Form.Control size="sm" type="date" value={dateFacturation} onChange={e => setDateFacturation(e.target.value)} />
                                    </Col>
                                    <Col md={4}>
                                        <Form.Label className="small fw-semibold mb-1">Médecin</Form.Label>
                                        <Form.Select size="sm" value={idMedecin} onChange={handleMedecinChange}>
                                            <option value="">— Sélectionner —</option>
                                            {medecins.map(m => <option key={m._id} value={m._id}>{m.nom} {m.prenoms}</option>)}
                                        </Form.Select>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Assurance */}
                    <Col md={6}>
                        <Card className="shadow-sm">
                            <Card.Header className="bg-white fw-bold py-2 small">
                                <i className="bi bi-shield-fill-check me-2 text-warning"></i>Assurance
                            </Card.Header>
                            <Card.Body>
                                <Row className="g-2">
                                    <Col xs={12}>
                                        <Form.Label className="small fw-semibold mb-1">Assurance</Form.Label>
                                        <Form.Select size="sm" value={idAssurance} onChange={handleAssuranceChange}>
                                            <option value="">NON ASSURÉ</option>
                                            {assurances.map(a => <option key={a._id} value={a._id}>{a.designationassurance}</option>)}
                                        </Form.Select>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Label className="small fw-semibold mb-1">Taux (%)</Form.Label>
                                        <Form.Control size="sm" type="number" min={0} max={100} value={taux || ''} onChange={e => setTaux(Number(e.target.value))} />
                                    </Col>
                                    <Col md={4}>
                                        <Form.Label className="small fw-semibold mb-1">N° Carte</Form.Label>
                                        <Form.Control size="sm" value={numcarte} onChange={e => setNumcarte(e.target.value)} />
                                    </Col>
                                    <Col md={4}>
                                        <Form.Label className="small fw-semibold mb-1">N° Bon</Form.Label>
                                        <Form.Control size="sm" value={numBon} onChange={e => setNumBon(e.target.value)} />
                                    </Col>
                                    <Col xs={12}>
                                        <Form.Label className="small fw-semibold mb-1">Société patient</Form.Label>
                                        <Form.Control size="sm" value={societePatient} onChange={e => setSocietePatient(e.target.value)} />
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Paiement */}
                    <Col md={6}>
                        <Card className="shadow-sm">
                            <Card.Header className="bg-white fw-bold py-2 small">
                                <i className="bi bi-cash-stack me-2 text-primary"></i>Paiement & remise
                            </Card.Header>
                            <Card.Body>
                                <Row className="g-2">
                                    <Col md={6}>
                                        <Form.Label className="small fw-semibold mb-1">Mode de paiement</Form.Label>
                                        <Form.Select size="sm" value={modepaiement} onChange={e => setModepaiement(e.target.value)}>
                                            {MODE_PAIEMENT.map(m => <option key={m} value={m}>{m}</option>)}
                                        </Form.Select>
                                    </Col>
                                    <Col md={3}>
                                        <Form.Label className="small fw-semibold mb-1">Réduction (FCFA)</Form.Label>
                                        <Form.Control size="sm" type="number" min={0} value={reduction || ''} onChange={e => setReduction(Number(e.target.value))} />
                                    </Col>
                                    <Col md={3}>
                                        <Form.Label className="small fw-semibold mb-1">Taux remise (%)</Form.Label>
                                        <Form.Control size="sm" type="number" min={0} max={100} value={tauxreduction || ''} onChange={e => setTauxreduction(Number(e.target.value))} />
                                    </Col>
                                    <Col xs={12}>
                                        <Form.Label className="small fw-semibold mb-1">Motif remise</Form.Label>
                                        <Form.Control size="sm" value={motifRemise} onChange={e => setMotifRemise(e.target.value)} />
                                    </Col>
                                    <Col md={6}>
                                        <Form.Label className="small fw-semibold mb-1">Montant reçu (FCFA)</Form.Label>
                                        <Form.Control size="sm" type="number" min={0} value={montantRecu || ''} onChange={e => setMontantRecu(Number(e.target.value))} />
                                    </Col>
                                    <Col xs={12}>
                                        <Form.Label className="small fw-semibold mb-1">Observation</Form.Label>
                                        <Form.Control size="sm" as="textarea" rows={2} value={observation} onChange={e => setObservation(e.target.value)} />
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Récapitulatif */}
                    <Col xs={12}>
                        <Card className="shadow-sm" style={{ borderLeft: '4px solid #1565c0' }}>
                            <Card.Body>
                                <div className="fw-bold mb-2 small text-primary"><i className="bi bi-calculator me-2"></i>Récapitulatif</div>
                                <Table size="sm" borderless style={{ fontSize: '0.82rem', marginBottom: 0 }}>
                                    <tbody>
                                        <tr>
                                            <td className="text-muted">Montant total</td>
                                            <td className="fw-bold">{fmt(montantTotal)} FCFA</td>
                                            <td className="text-muted">Part assurance ({taux}%)</td>
                                            <td className="text-warning fw-semibold">{fmt(partAssurance)} FCFA</td>
                                            <td className="text-muted">Part patient</td>
                                            <td className="fw-semibold">{fmt(partPatient)} FCFA</td>
                                        </tr>
                                        <tr>
                                            <td className="text-muted">Montant reçu</td>
                                            <td className="text-success fw-semibold">{fmt(montantRecu)} FCFA</td>
                                            <td className="text-muted">Reste à payer</td>
                                            <td colSpan={3} style={{ color: restapayer > 0 ? '#c62828' : '#388e3c', fontWeight: 700, fontSize: '1rem' }}>
                                                {fmt(restapayer)} FCFA
                                                {restapayer === 0 && montantTotal > 0 && <span className="ms-2 badge bg-success">Soldé</span>}
                                            </td>
                                        </tr>
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Boutons */}
                    <Col xs={12}>
                        <div className="d-flex gap-2">
                            <Button type="submit" variant="success" disabled={saving || !selectedPatient}>
                                {saving ? <Spinner size="sm" className="me-1" /> : <i className="bi bi-save me-1"></i>}
                                Enregistrer la facture
                            </Button>
                            <Button type="button" variant="outline-secondary" onClick={() => router.push('/pages/servicefacturation/liste-factures')}>
                                <i className="bi bi-x me-1"></i>Annuler
                            </Button>
                        </div>
                    </Col>
                </Row>
            </Form>
        </div>
    );
}
