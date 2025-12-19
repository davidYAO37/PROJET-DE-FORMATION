'use client';
import { useEffect, useState } from 'react';
import { Modal, Table, Button, Spinner, Alert } from 'react-bootstrap';
import SalleConstante from './SalleConstante';

interface SalleAttenteModalProps {
    show: boolean;
    onHide: () => void;
}

interface Consultation {
    IDCONSULTATION: string;
    Date_consulation: string;
    Heure_Consultation: string;
    MedecinNom: string;
    PatientNom: string;
    CodePrestation: string;
    designationC: string;
}

export default function SalleAttenteModal({ show, onHide }: SalleAttenteModalProps) {
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showConstanteModal, setShowConstanteModal] = useState(false);
    const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
    const [user, setUser] = useState<string>('');

    // Charger les consultations du jour à l'ouverture du modal et configurer le rafraîchissement automatique
    useEffect(() => {
        if (show) {
            fetchConsultations();
            const userData = localStorage.getItem('profil');
            if (userData) {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser.nom_utilisateur);
            }
            
            // Configurer le rafraîchissement automatique toutes les 30 secondes
            const intervalId = setInterval(fetchConsultations, 30000);
            
            // Nettoyer l'intervalle lors de la fermeture du modal
            return () => clearInterval(intervalId);
        }
    }, [show]);

    useEffect(() => {
        // Charger l'utilisateur connecté depuis le localStorage
        const storedUser = localStorage.getItem('userName');
        if (storedUser) {
            setUser(storedUser);
        }
    }, []);

    const fetchConsultations = async () => {
        try {
            setLoading(true);
            setError(null);

            const res = await fetch('/api/consultation/date', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!res.ok) {
                throw new Error('Erreur lors du chargement des consultations');
            }

            const data = await res.json();
            setConsultations(data);
        } catch (err: any) {
            console.error('Erreur chargement consultations:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleShowConstanteModal = (consultation: Consultation) => {
        setSelectedConsultation(consultation);
        setShowConstanteModal(true);
    };

    const handleCloseConstanteModal = () => {
        setShowConstanteModal(false);
    };

    return (
        <>
            <Modal show={show} onHide={onHide} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>👥 Salle d’attente du jour</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    {loading && (
                        <div className="text-center py-4">
                            <Spinner animation="border" /> <span className="ms-2">Chargement...</span>
                        </div>
                    )}

                    {error && (
                        <Alert variant="danger" className="text-center">
                            {error}
                        </Alert>
                    )}

                    {!loading && !error && consultations.length === 0 && (
                        <p className="text-center text-muted">Aucune consultation prévue aujourd’hui.</p>
                    )}

                    {!loading && consultations.length > 0 && (
                        <Table striped bordered hover responsive>
                            <thead className="table-primary">
                                <tr>
                                    <th>Heure</th>
                                    <th>Patient</th>
                                    <th>Médecin</th>
                                    <th>Code prestation</th>
                                    <th>Désignation</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {consultations.map((c) => (
                                    <tr key={c.IDCONSULTATION}>
                                        <td>{c.Heure_Consultation || '--:--'}</td>
                                        <td>{c.PatientNom}</td>
                                        <td>{c.MedecinNom}</td>
                                        <td>{c.CodePrestation}</td>
                                        <td>{c.designationC}</td>
                                        <td>
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={() => handleShowConstanteModal(c)}
                                            >
                                                Ajouter Constante
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide}>
                        Fermer
                    </Button>
                    <Button variant="primary" onClick={fetchConsultations}>
                        🔄 Actualiser
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal pour SalleConstante - sans imbrication de modals */}
            <SalleConstante
                show={showConstanteModal}
                onHide={handleCloseConstanteModal}
                consultation={selectedConsultation}
                user={user}
            />
        </>
    );
}
