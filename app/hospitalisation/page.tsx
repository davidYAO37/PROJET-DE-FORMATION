'use client';

import { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Form, Row, Spinner, Table } from 'react-bootstrap';

interface ChambreItem {
    _id: string;
    numero: string;
    type: string;
    service: string;
    tarifJournalier: number;
    prixClinique?: number;
    prixMutuel?: number;
    prixPreferentiel?: number;
    nombreLits: number;
    etat: string;
}

interface LitItem {
    _id: string;
    numero: string;
    chambreId: string;
    service: string;
    tarifJournalier?: number;
    prixClinique?: number;
    prixMutuel?: number;
    prixPreferentiel?: number;
    etat: string;
    patientId?: string;
}

interface PatientItem {
    _id: string;
    Nom?: string;
    Prenoms?: string;
    Code_dossier?: string;
}

interface AvisHospitItem {
    _id: string;
    Patient?: string;
    serviceHospit?: string;
    etatPatient?: string;
    Diagnostic?: string;
    DureHospit?: string;
    DateIntervention?: string;
    DatePrevue?: string;
    IDPARTIENT?: { _id?: string; Nom?: string; Prenoms?: string; Code_dossier?: string } | string;
}

interface HospitalisationItem {
    _id: string;
    patientId: string;
    avisHospitId?: string;
    chambreId?: string;
    litId?: string;
    diagnosticInitial?: string;
    motifHospitalisation?: string;
    service?: string;
    statut: string;
    dateEntree: string;
    dateSortie?: string;
    montantChambre?: number;
    montantActes?: number;
    montantExamens?: number;
    montantMedicaments?: number;
    montantSoins?: number;
    montantHonoraires?: number;
    remise?: number;
    partAssurance?: number;
    partPatient?: number;
    resteAPayer?: number;
}

export default function HospitalisationPage() {
    const [chambres, setChambres] = useState<ChambreItem[]>([]);
    const [lits, setLits] = useState<LitItem[]>([]);
    const [patients, setPatients] = useState<PatientItem[]>([]);
    const [avisHospit, setAvisHospit] = useState<AvisHospitItem[]>([]);
    const [hospitalisations, setHospitalisations] = useState<HospitalisationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [searchPatient, setSearchPatient] = useState('');
    const [searchAvis, setSearchAvis] = useState('');
    const [transferHospitalisationId, setTransferHospitalisationId] = useState('');
    const [transferChambreId, setTransferChambreId] = useState('');
    const [transferLitId, setTransferLitId] = useState('');
    const [form, setForm] = useState({
        patientId: '',
        avisHospitId: '',
        diagnosticInitial: '',
        motifHospitalisation: '',
        service: 'Hospitalisation',
        chambreId: '',
        litId: '',
        montantChambre: '0',
    });
    const [roomForm, setRoomForm] = useState({
        numero: '',
        type: 'standard',
        service: 'Hospitalisation',
        tarifJournalier: '0',
        prixClinique: '0',
        prixMutuel: '0',
        prixPreferentiel: '0',
        nombreLits: '1',
    });
    const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
    const [bedForm, setBedForm] = useState({
        numero: '',
        chambreId: '',
        service: 'Hospitalisation',
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resChambres, resLits, resHosp, resPatients, resAvis] = await Promise.all([
                fetch('/api/chambres'),
                fetch('/api/lits'),
                fetch('/api/hospitalisations'),
                fetch('/api/patients'),
                fetch('/api/avishospit'),
            ]);

            const [dataChambres, dataLits, dataHosp, dataPatients, dataAvis] = await Promise.all([
                resChambres.ok ? resChambres.json() : [],
                resLits.ok ? resLits.json() : [],
                resHosp.ok ? resHosp.json() : [],
                resPatients.ok ? resPatients.json() : [],
                resAvis.ok ? resAvis.json() : { data: [] },
            ]);

            setChambres(dataChambres);
            setLits(dataLits);
            setHospitalisations(dataHosp);
            setPatients(Array.isArray(dataPatients) ? dataPatients : []);
            setAvisHospit(Array.isArray(dataAvis?.data) ? dataAvis.data : []);
        } catch (error) {
            console.error(error);
            setMessage('Erreur lors du chargement du module hospitalisation');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const stats = useMemo(() => ({
        chambres: chambres.length,
        lits: lits.length,
        enCours: hospitalisations.filter((item) => item.statut === 'en_cours').length,
        sorties: hospitalisations.filter((item) => item.statut === 'sortie').length,
        libres: lits.filter((item) => item.etat === 'libre').length,
        occupes: lits.filter((item) => item.etat === 'occupe').length,
    }), [chambres, lits, hospitalisations]);

    const currentAdmissions = useMemo(() => hospitalisations.filter((item) => item.statut === 'en_cours'), [hospitalisations]);
    const historyAdmissions = useMemo(() => hospitalisations.filter((item) => item.statut !== 'en_cours'), [hospitalisations]);
    const roomOverview = useMemo(() => chambres.map((chambre) => {
        const roomLits = lits.filter((lit) => lit.chambreId === chambre._id);
        const occupiedBeds = roomLits.filter((lit) => lit.etat === 'occupe').length;
        const freeBeds = roomLits.length - occupiedBeds;
        const activeAdmission = hospitalisations.find((item) => item.chambreId === chambre._id && item.statut === 'en_cours');

        return {
            ...chambre,
            roomLits,
            occupiedBeds,
            freeBeds,
            activeAdmission,
        };
    }), [chambres, lits, hospitalisations]);

    const selectedAvis = useMemo(() => avisHospit.find((item) => item._id === form.avisHospitId), [avisHospit, form.avisHospitId]);

    useEffect(() => {
        if (!selectedAvis) return;
        const patientId = typeof selectedAvis.IDPARTIENT === 'object' && selectedAvis.IDPARTIENT ? selectedAvis.IDPARTIENT._id : selectedAvis.IDPARTIENT;
        setForm((prev) => ({
            ...prev,
            patientId: patientId || prev.patientId,
            diagnosticInitial: prev.diagnosticInitial || selectedAvis.Diagnostic || '',
            motifHospitalisation: prev.motifHospitalisation || selectedAvis.DureHospit || '',
            service: prev.service === 'Hospitalisation' && selectedAvis.serviceHospit ? selectedAvis.serviceHospit : prev.service,
        }));
    }, [selectedAvis]);

    const getPatientLabel = (patientId: string) => {
        const patient = patients.find((item) => item._id === patientId);
        if (!patient) return patientId;
        const fullName = [patient.Nom, patient.Prenoms].filter(Boolean).join(' ').trim();
        return fullName || patient.Code_dossier || patientId;
    };

    const getChambreLabel = (chambreId?: string) => {
        const chambre = chambres.find((item) => item._id === chambreId);
        return chambre ? `${chambre.numero} (${chambre.type})` : '—';
    };

    const getLitLabel = (litId?: string) => {
        const lit = lits.find((item) => item._id === litId);
        return lit ? `${lit.numero}` : '—';
    };

    const getAvisPatientLabel = (avis: AvisHospitItem) => {
        if (typeof avis.IDPARTIENT === 'object' && avis.IDPARTIENT) {
            const fullName = [avis.IDPARTIENT.Nom, avis.IDPARTIENT.Prenoms].filter(Boolean).join(' ').trim();
            return fullName || avis.IDPARTIENT.Code_dossier || avis.Patient || 'Patient';
        }
        return avis.Patient || 'Patient';
    };

    const filteredPatients = useMemo(() => {
        const query = searchPatient.trim().toLowerCase();
        if (!query) return patients;
        return patients.filter((patient) => {
            const label = `${patient.Nom || ''} ${patient.Prenoms || ''} ${patient.Code_dossier || ''}`.toLowerCase();
            return label.includes(query);
        });
    }, [patients, searchPatient]);

    const filteredAvis = useMemo(() => {
        const query = searchAvis.trim().toLowerCase();
        if (!query) return avisHospit;
        return avisHospit.filter((avis) => {
            const label = `${getAvisPatientLabel(avis)} ${avis.Diagnostic || ''} ${avis.serviceHospit || ''}`.toLowerCase();
            return label.includes(query);
        });
    }, [avisHospit, searchAvis]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setMessage('Admission en cours...');

        try {
            const response = await fetch('/api/hospitalisations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    avisHospitId: form.avisHospitId || undefined,
                    montantChambre: Number(form.montantChambre || 0),
                    montantActes: 0,
                    montantExamens: 0,
                    montantMedicaments: 0,
                    montantSoins: 0,
                    montantHonoraires: 0,
                    remise: 0,
                    partAssurance: 0,
                    partPatient: 0,
                    resteAPayer: Number(form.montantChambre || 0),
                }),
            });

            if (!response.ok) throw new Error('Échec de l’admission');
            setMessage('Admission enregistrée avec succès');
            setForm({
                patientId: '',
                avisHospitId: '',
                diagnosticInitial: '',
                motifHospitalisation: '',
                service: 'Hospitalisation',
                chambreId: '',
                litId: '',
                montantChambre: '0',
            });
            await fetchData();
        } catch (error) {
            console.error(error);
            setMessage('Erreur lors de l’admission du patient');
        }
    };

    const resetRoomForm = () => {
        setRoomForm({
            numero: '',
            type: 'standard',
            service: 'Hospitalisation',
            tarifJournalier: '0',
            prixClinique: '0',
            prixMutuel: '0',
            prixPreferentiel: '0',
            nombreLits: '1',
        });
        setEditingRoomId(null);
    };

    const handleCreateRoom = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setMessage(editingRoomId ? 'Mise à jour de chambre en cours...' : 'Création de chambre en cours...');
        try {
            const payload = {
                numero: roomForm.numero,
                type: roomForm.type,
                service: roomForm.service,
                tarifJournalier: Number(roomForm.tarifJournalier || 0),
                prixClinique: Number(roomForm.prixClinique || 0),
                prixMutuel: Number(roomForm.prixMutuel || 0),
                prixPreferentiel: Number(roomForm.prixPreferentiel || 0),
                nombreLits: Number(roomForm.nombreLits || 1),
                etat: 'libre',
            };

            const response = await fetch(editingRoomId ? `/api/chambres/${editingRoomId}` : '/api/chambres', {
                method: editingRoomId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) throw new Error(editingRoomId ? 'Échec de la mise à jour de chambre' : 'Échec de création de chambre');
            resetRoomForm();
            await fetchData();
            setMessage(editingRoomId ? 'Chambre mise à jour avec succès' : 'Chambre créée avec succès');
        } catch (error) {
            console.error(error);
            setMessage(editingRoomId ? 'Erreur lors de la mise à jour de la chambre' : 'Erreur lors de la création de la chambre');
        }
    };

    const handleEditRoom = (chambre: ChambreItem) => {
        setEditingRoomId(chambre._id);
        setRoomForm({
            numero: chambre.numero,
            type: chambre.type,
            service: chambre.service,
            tarifJournalier: String(chambre.tarifJournalier || 0),
            prixClinique: String(chambre.prixClinique || 0),
            prixMutuel: String(chambre.prixMutuel || 0),
            prixPreferentiel: String(chambre.prixPreferentiel || 0),
            nombreLits: String(chambre.nombreLits || 1),
        });
    };

    const handleDeleteRoom = async (chambreId: string) => {
        if (!window.confirm('Supprimer cette chambre ?')) return;
        try {
            const response = await fetch(`/api/chambres/${chambreId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Échec de suppression');
            await fetchData();
            setMessage('Chambre supprimée');
        } catch (error) {
            console.error(error);
            setMessage('Erreur lors de la suppression de la chambre');
        }
    };

    const handleCreateBed = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setMessage('Création de lit en cours...');
        try {
            const response = await fetch('/api/lits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    numero: bedForm.numero,
                    chambreId: bedForm.chambreId,
                    service: bedForm.service,
                    etat: 'libre',
                }),
            });
            if (!response.ok) throw new Error('Échec de création de lit');
            setBedForm({ numero: '', chambreId: '', service: 'Hospitalisation' });
            await fetchData();
            setMessage('Lit créé avec succès');
        } catch (error) {
            console.error(error);
            setMessage('Erreur lors de la création du lit');
        }
    };

    const handleDischarge = async (hospitalisationId: string) => {
        setMessage('Sortie en cours...');
        try {
            const response = await fetch(`/api/hospitalisations/${hospitalisationId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ statut: 'sortie', dateSortie: new Date().toISOString() }),
            });
            if (!response.ok) throw new Error('Échec de la sortie');
            setMessage('Sortie enregistrée');
            await fetchData();
        } catch (error) {
            console.error(error);
            setMessage('Erreur lors de la sortie du patient');
        }
    };

    const handleTransfer = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!transferHospitalisationId) {
            setMessage('Sélectionnez une admission à transférer');
            return;
        }

        setMessage('Transfert en cours...');
        try {
            const response = await fetch(`/api/hospitalisations/${transferHospitalisationId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chambreId: transferChambreId || undefined,
                    litId: transferLitId || undefined,
                    statut: 'en_cours',
                }),
            });

            if (!response.ok) throw new Error('Échec du transfert');
            setMessage('Transfert enregistré');
            setTransferHospitalisationId('');
            setTransferChambreId('');
            setTransferLitId('');
            await fetchData();
        } catch (error) {
            console.error(error);
            setMessage('Erreur lors du transfert');
        }
    };

    return (
        <Container className="py-4">
            <h2 className="mb-4">Module Hospitalisation</h2>
            {message && <Alert variant="info">{message}</Alert>}

            {loading ? (
                <div className="text-center py-5"><Spinner animation="border" /></div>
            ) : (
                <>
                    <Row className="g-3 mb-4">
                        <Col md={3}><Card className="border-primary"><Card.Body><div className="text-muted">Chambres</div><h3>{stats.chambres}</h3></Card.Body></Card></Col>
                        <Col md={3}><Card className="border-success"><Card.Body><div className="text-muted">Lits</div><h3>{stats.lits}</h3></Card.Body></Card></Col>
                        <Col md={3}><Card className="border-warning"><Card.Body><div className="text-muted">Admissions en cours</div><h3>{stats.enCours}</h3></Card.Body></Card></Col>
                        <Col md={3}><Card className="border-secondary"><Card.Body><div className="text-muted">Lits libres</div><h3>{stats.libres}</h3></Card.Body></Card></Col>
                    </Row>

                    <Row className="g-4">
                        <Col lg={5}>
                            <Card className="mb-4">
                                <Card.Header className="fw-bold">Admission du patient</Card.Header>
                                <Card.Body>
                                    <Form onSubmit={handleSubmit}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Avis d’hospitalisation du médecin</Form.Label>
                                            <Form.Select value={form.avisHospitId} onChange={(e) => setForm({ ...form, avisHospitId: e.target.value })}>
                                                <option value="">Créer une admission manuelle</option>
                                                {avisHospit.map((avis) => (
                                                    <option key={avis._id} value={avis._id}>{getAvisPatientLabel(avis)} • {avis.serviceHospit || 'Service'}</option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Patient</Form.Label>
                                            <Form.Control
                                                className="mb-2"
                                                placeholder="Rechercher un patient par nom ou dossier"
                                                value={searchPatient}
                                                onChange={(e) => setSearchPatient(e.target.value)}
                                            />
                                            <Form.Select value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })} required>
                                                <option value="">Sélectionner</option>
                                                {filteredPatients.map((patient) => (
                                                    <option key={patient._id} value={patient._id}>{getPatientLabel(patient._id)}</option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Diagnostic initial</Form.Label>
                                            <Form.Control as="textarea" rows={3} value={form.diagnosticInitial} onChange={(e) => setForm({ ...form, diagnosticInitial: e.target.value })} />
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Motif d’hospitalisation</Form.Label>
                                            <Form.Control as="textarea" rows={3} value={form.motifHospitalisation} onChange={(e) => setForm({ ...form, motifHospitalisation: e.target.value })} />
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Service</Form.Label>
                                            <Form.Control value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} />
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Chambre</Form.Label>
                                            <Form.Select value={form.chambreId} onChange={(e) => setForm({ ...form, chambreId: e.target.value })}>
                                                <option value="">Sélectionner</option>
                                                {chambres.map((chambre) => <option key={chambre._id} value={chambre._id}>{chambre.numero} - {chambre.type}</option>)}
                                            </Form.Select>
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Lit</Form.Label>
                                            <Form.Select value={form.litId} onChange={(e) => setForm({ ...form, litId: e.target.value })}>
                                                <option value="">Sélectionner</option>
                                                {lits.filter((lit) => !form.chambreId || lit.chambreId === form.chambreId).map((lit) => <option key={lit._id} value={lit._id}>{lit.numero} - {lit.etat}</option>)}
                                            </Form.Select>
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Montant chambre</Form.Label>
                                            <Form.Control type="number" value={form.montantChambre} onChange={(e) => setForm({ ...form, montantChambre: e.target.value })} />
                                        </Form.Group>
                                        <Button type="submit" variant="primary">Créer l’admission</Button>
                                    </Form>
                                </Card.Body>
                            </Card>

                            <Card className="mb-4">
                                <Card.Header className="fw-bold">Transfert d’admission</Card.Header>
                                <Card.Body>
                                    <Form onSubmit={handleTransfer}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Admission</Form.Label>
                                            <Form.Select value={transferHospitalisationId} onChange={(e) => setTransferHospitalisationId(e.target.value)}>
                                                <option value="">Sélectionner</option>
                                                {hospitalisations.filter((item) => item.statut === 'en_cours').map((item) => (
                                                    <option key={item._id} value={item._id}>{getPatientLabel(item.patientId)} • {item.service || 'Service'}</option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Chambre cible</Form.Label>
                                            <Form.Select value={transferChambreId} onChange={(e) => setTransferChambreId(e.target.value)}>
                                                <option value="">Conserver la chambre</option>
                                                {chambres.map((chambre) => <option key={chambre._id} value={chambre._id}>{chambre.numero} - {chambre.type}</option>)}
                                            </Form.Select>
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Lit cible</Form.Label>
                                            <Form.Select value={transferLitId} onChange={(e) => setTransferLitId(e.target.value)}>
                                                <option value="">Conserver le lit</option>
                                                {lits.filter((lit) => !transferChambreId || lit.chambreId === transferChambreId).map((lit) => <option key={lit._id} value={lit._id}>{lit.numero} - {lit.etat}</option>)}
                                            </Form.Select>
                                        </Form.Group>
                                        <Button type="submit" variant="outline-secondary">Transférer</Button>
                                    </Form>
                                </Card.Body>
                            </Card>

                            <Card className="mb-4">
                                <Card.Header className="fw-bold">Gestion des chambres</Card.Header>
                                <Card.Body>
                                    <Form onSubmit={handleCreateRoom} className="mb-3">
                                        <Row className="g-2">
                                            <Col md={6}><Form.Control placeholder="Numéro" value={roomForm.numero} onChange={(e) => setRoomForm({ ...roomForm, numero: e.target.value })} required /></Col>
                                            <Col md={6}><Form.Control placeholder="Type" value={roomForm.type} onChange={(e) => setRoomForm({ ...roomForm, type: e.target.value })} /></Col>
                                            <Col md={6}><Form.Control placeholder="Service" value={roomForm.service} onChange={(e) => setRoomForm({ ...roomForm, service: e.target.value })} /></Col>
                                            <Col md={3}><Form.Control type="number" placeholder="Tarif" value={roomForm.tarifJournalier} onChange={(e) => setRoomForm({ ...roomForm, tarifJournalier: e.target.value })} /></Col>
                                            <Col md={3}><Form.Control type="number" placeholder="Lits" value={roomForm.nombreLits} onChange={(e) => setRoomForm({ ...roomForm, nombreLits: e.target.value })} /></Col>
                                            <Col md={4}><Form.Control type="number" placeholder="Prix clinique" value={roomForm.prixClinique} onChange={(e) => setRoomForm({ ...roomForm, prixClinique: e.target.value })} /></Col>
                                            <Col md={4}><Form.Control type="number" placeholder="Prix mutuel" value={roomForm.prixMutuel} onChange={(e) => setRoomForm({ ...roomForm, prixMutuel: e.target.value })} /></Col>
                                            <Col md={4}><Form.Control type="number" placeholder="Prix préférentiel" value={roomForm.prixPreferentiel} onChange={(e) => setRoomForm({ ...roomForm, prixPreferentiel: e.target.value })} /></Col>
                                            <Col xs={12} className="d-flex gap-2">
                                                <Button type="submit" variant="outline-primary" size="sm">{editingRoomId ? 'Enregistrer' : 'Ajouter la chambre'}</Button>
                                                {editingRoomId ? <Button type="button" variant="outline-secondary" size="sm" onClick={resetRoomForm}>Annuler</Button> : null}
                                            </Col>
                                        </Row>
                                    </Form>
                                    <Table size="sm" responsive>
                                        <thead><tr><th>Chambre</th><th>Type</th><th>État</th><th>Tarifs</th><th>Actions</th></tr></thead>
                                        <tbody>
                                            {chambres.map((chambre) => (
                                                <tr key={chambre._id}>
                                                    <td>{chambre.numero}</td>
                                                    <td>{chambre.type}</td>
                                                    <td>{chambre.etat}</td>
                                                    <td>
                                                        <div className="small">Clinique: {chambre.prixClinique ?? chambre.tarifJournalier ?? 0} FCFA</div>
                                                        <div className="small">Mutuel: {chambre.prixMutuel ?? 0} FCFA</div>
                                                        <div className="small">Préférentiel: {chambre.prixPreferentiel ?? 0} FCFA</div>
                                                    </td>
                                                    <td>
                                                        <Button size="sm" variant="outline-secondary" className="me-2" onClick={() => handleEditRoom(chambre)}>Éditer</Button>
                                                        <Button size="sm" variant="outline-danger" onClick={() => handleDeleteRoom(chambre._id)}>Supprimer</Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </Card.Body>
                            </Card>

                            <Card>
                                <Card.Header className="fw-bold">Gestion des lits</Card.Header>
                                <Card.Body>
                                    <Form onSubmit={handleCreateBed} className="mb-3">
                                        <Row className="g-2">
                                            <Col md={6}><Form.Control placeholder="Numéro du lit" value={bedForm.numero} onChange={(e) => setBedForm({ ...bedForm, numero: e.target.value })} required /></Col>
                                            <Col md={6}><Form.Select value={bedForm.chambreId} onChange={(e) => setBedForm({ ...bedForm, chambreId: e.target.value })} required>
                                                <option value="">Choisir chambre</option>
                                                {chambres.map((chambre) => <option key={chambre._id} value={chambre._id}>{chambre.numero}</option>)}
                                            </Form.Select></Col>
                                            <Col xs={12}><Button type="submit" variant="outline-success" size="sm">Ajouter le lit</Button></Col>
                                        </Row>
                                    </Form>
                                    <Table size="sm" responsive>
                                        <thead><tr><th>Lit</th><th>Chambre</th><th>État</th><th>Tarifs</th></tr></thead>
                                        <tbody>
                                            {lits.map((lit) => (
                                                <tr key={lit._id}>
                                                    <td>{lit.numero}</td>
                                                    <td>{chambres.find((ch) => ch._id === lit.chambreId)?.numero || '—'}</td>
                                                    <td>{lit.etat}</td>
                                                    <td>
                                                        <div className="small">{lit.tarifJournalier ?? 0} FCFA</div>
                                                        <div className="small">Clinique: {lit.prixClinique ?? 0} FCFA</div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col lg={7}>
                            <Card className="mb-4">
                                <Card.Header className="fw-bold">Avis d’hospitalisation du médecin</Card.Header>
                                <Card.Body className="p-0">
                                    <Form.Control
                                        className="m-3 w-auto"
                                        placeholder="Rechercher un avis"
                                        value={searchAvis}
                                        onChange={(e) => setSearchAvis(e.target.value)}
                                    />
                                    <Table responsive hover className="mb-0">
                                        <thead className="table-light"><tr><th>Patient</th><th>Service</th><th>Diagnostic</th><th>État</th></tr></thead>
                                        <tbody>
                                            {filteredAvis.map((avis) => (
                                                <tr key={avis._id}>
                                                    <td>{getAvisPatientLabel(avis)}</td>
                                                    <td>{avis.serviceHospit || '—'}</td>
                                                    <td>{avis.Diagnostic || '—'}</td>
                                                    <td><Button size="sm" variant="outline-primary" onClick={() => setForm((prev) => ({ ...prev, avisHospitId: avis._id }))}>Admettre</Button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </Card.Body>
                            </Card>

                            <Card className="mb-4">
                                <Card.Header className="fw-bold">Vue par chambre</Card.Header>
                                <Card.Body>
                                    <Row className="g-3">
                                        {roomOverview.map((chambre) => (
                                            <Col md={6} key={chambre._id}>
                                                <Card className={`h-100 border-${chambre.etat === 'occupee' ? 'danger' : 'success'}`}>
                                                    <Card.Body>
                                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                                            <div>
                                                                <h6 className="mb-1">Chambre {chambre.numero}</h6>
                                                                <div className="text-muted small">{chambre.type} • {chambre.service}</div>
                                                            </div>
                                                            <Badge bg={chambre.etat === 'occupee' ? 'danger' : 'success'}>{chambre.etat}</Badge>
                                                        </div>
                                                        <div className="mb-2">
                                                            <strong>{chambre.occupiedBeds}</strong> lit(s) occupé(s) • <strong>{chambre.freeBeds}</strong> libre(s)
                                                        </div>
                                                        <div className="small">
                                                            {chambre.roomLits.length > 0 ? chambre.roomLits.map((lit) => (
                                                                <Badge key={lit._id} bg={lit.etat === 'occupe' ? 'danger' : 'success'} className="me-2 mb-2">
                                                                    {lit.numero} {lit.etat}
                                                                </Badge>
                                                            )) : <span className="text-muted">Aucun lit enregistré</span>}
                                                        </div>
                                                        {chambre.activeAdmission && (
                                                            <div className="mt-2 small text-muted">
                                                                Patient : {getPatientLabel(chambre.activeAdmission.patientId)}
                                                            </div>
                                                        )}
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        ))}
                                    </Row>
                                </Card.Body>
                            </Card>

                            <Card className="mb-4">
                                <Card.Header className="fw-bold">Admissions en cours</Card.Header>
                                <Card.Body className="p-0">
                                    <Table responsive hover className="mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Patient</th>
                                                <th>Chambre / lit</th>
                                                <th>Service</th>
                                                <th>Entrée</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentAdmissions.map((item) => (
                                                <tr key={item._id}>
                                                    <td>{getPatientLabel(item.patientId)}{item.avisHospitId ? <><br /><Badge bg="info">Avis médecin</Badge></> : null}</td>
                                                    <td>{getChambreLabel(item.chambreId)} / {getLitLabel(item.litId)}</td>
                                                    <td>{item.service || '—'}</td>
                                                    <td>{new Date(item.dateEntree).toLocaleDateString('fr-FR')}</td>
                                                    <td><Button size="sm" variant="outline-danger" onClick={() => handleDischarge(item._id)}>Sortie</Button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </Card.Body>
                            </Card>

                            <Card>
                                <Card.Header className="fw-bold">Historique complet des admissions</Card.Header>
                                <Card.Body className="p-0">
                                    <Table responsive hover className="mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Patient</th>
                                                <th>Chambre / lit</th>
                                                <th>Statut</th>
                                                <th>Entrée</th>
                                                <th>Sortie</th>
                                                <th>Reste à payer</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {historyAdmissions.map((item) => (
                                                <tr key={item._id}>
                                                    <td>{getPatientLabel(item.patientId)}</td>
                                                    <td>{getChambreLabel(item.chambreId)} / {getLitLabel(item.litId)}</td>
                                                    <td><Badge bg={item.statut === 'sortie' ? 'secondary' : item.statut === 'transfere' ? 'warning' : 'dark'}>{item.statut}</Badge></td>
                                                    <td>{new Date(item.dateEntree).toLocaleDateString('fr-FR')}</td>
                                                    <td>{item.dateSortie ? new Date(item.dateSortie).toLocaleDateString('fr-FR') : '—'}</td>
                                                    <td>{(item.resteAPayer || 0).toFixed(0)} FCFA</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </>
            )}
        </Container>
    );
}
