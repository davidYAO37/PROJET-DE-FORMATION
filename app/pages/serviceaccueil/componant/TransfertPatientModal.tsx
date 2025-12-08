import React, { useState, useEffect } from 'react';
import { Col, Form, Modal, Row, Button, Alert, Spinner } from 'react-bootstrap';
import { Medecin } from '@/types/medecin';

interface TransfertPatientModalProps {
    show: boolean;
    onHide: () => void;
}

interface ConsultationData {
    _id: string;
    CodePrestation: string;
    PatientP: string;
    Medecin: string;
    IDMEDECIN: string;
}

export default function TransfertPatientModal({ show, onHide }: TransfertPatientModalProps) {
    const [CodePrestation, setCodePrestation] = useState('');
    const [consultation, setConsultation] = useState<ConsultationData | null>(null);
    const [medecins, setMedecins] = useState<Medecin[]>([]);
    const [selectedMedecinId, setSelectedMedecinId] = useState('');
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (show) fetchMedecins();
    }, [show]);

    const fetchMedecins = async () => {
        try {
            const response = await fetch('/api/medecins');
            if (response.ok) {
                const data = await response.json();
                setMedecins(data);
            }
        } catch (err) {
            console.error('Erreur chargement médecins:', err);
        }
    };

    const handleSearchConsultation = async () => {
        if (!CodePrestation.trim()) {
            setError('Veuillez saisir un code prestation');
            return;
        }

        setSearching(true);
        setError('');
        setConsultation(null);
        setSelectedMedecinId('');

        try {
            const response = await fetch(`/api/consultation/code?CodePrestation=${encodeURIComponent(CodePrestation)}`);
            const data = await response.json();

            if (response.ok && data && data._id) {
                setConsultation(data);
                setSelectedMedecinId(data.IDMEDECIN || '');
            } else {
                setError(data.error || 'Consultation non trouvée');
            }
        } catch (err) {
            setError('Erreur lors de la recherche de la consultation');
        } finally {
            setSearching(false);
        }
    };

    const handleTransfert = async () => {
        if (!consultation) return setError('Aucune consultation sélectionnée');
        if (!selectedMedecinId) return setError('Veuillez sélectionner un médecin');
        if (selectedMedecinId === consultation.IDMEDECIN) return setError('Le médecin sélectionné est déjà assigné');

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const utilisateur = localStorage.getItem('userName') || 'Utilisateur';

            const response = await fetch('/api/consultation/transfert', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    CodePrestation: consultation.CodePrestation,
                    nouveauMedecinId: selectedMedecinId,
                    transfererPar: utilisateur,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Transfert effectué avec succès');
                setTimeout(() => handleClose(), 2000);
            } else {
                setError(data.error || 'Erreur lors du transfert');
            }
        } catch {
            setError('Erreur lors du transfert du patient');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setCodePrestation('');
        setConsultation(null);
        setSelectedMedecinId('');
        setError('');
        setSuccess('');
        onHide();
    };

    return (
        <Modal show={show} onHide={handleClose} size="lg" centered>
            <Modal.Header closeButton className="bg-primary text-white">
                <Modal.Title>Transférer un patient</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}

                <Row className="mb-3">
                    <Col md={8}>
                        <Form.Group controlId="CodePrestation">
                            <Form.Label>Code Prestation</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Saisir le code prestation"
                                value={CodePrestation}
                                onChange={(e) => setCodePrestation(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearchConsultation()}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={4} className="d-flex align-items-end">
                        <Button variant="primary" onClick={handleSearchConsultation} disabled={searching} className="w-100">
                            {searching ? <Spinner animation="border" size="sm" /> : 'Rechercher'}
                        </Button>
                    </Col>
                </Row>

                {consultation && (
                    <>
                        <Row className="mb-3">
                            <Col>
                                <Form.Group controlId="patientNom">
                                    <Form.Label>Patient à transférer</Form.Label>
                                    <Form.Control type="text" value={consultation.PatientP} readOnly className="bg-light" />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Col>
                                <Form.Group controlId="medecinSelect">
                                    <Form.Label>Médecin</Form.Label>
                                    <Form.Select value={selectedMedecinId} onChange={(e) => setSelectedMedecinId(e.target.value)}>
                                        <option value="">Sélectionner un médecin</option>
                                        {medecins.map((medecin) => (
                                            <option key={medecin._id} value={medecin._id}>
                                                {medecin.nom} {medecin.prenoms} - {medecin.specialite}
                                            </option>
                                        ))}
                                    </Form.Select>
                                    {consultation.Medecin && (
                                        <Form.Text className="text-muted">
                                            Médecin actuel: {consultation.Medecin}
                                        </Form.Text>
                                    )}
                                </Form.Group>
                            </Col>
                        </Row>
                    </>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>Annuler</Button>
                {consultation && (
                    <Button variant="primary" onClick={handleTransfert} disabled={loading || !selectedMedecinId}>
                        {loading ? <Spinner animation="border" size="sm" /> : 'Modifier'}
                    </Button>
                )}
            </Modal.Footer>
        </Modal>
    );
}
