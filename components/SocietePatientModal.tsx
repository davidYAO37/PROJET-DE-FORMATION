"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal, Button, Table, Spinner, Form, Alert, Row, Col } from "react-bootstrap";

interface SocieteAssurance {
    _id: string;
    societe: string;
}

interface SocietePatientModalProps {
    show: boolean;
    onHide: () => void;
    assuranceId: string;
    onSelect: (societe: SocieteAssurance) => void;
}

export default function SocietePatientModal({
    show,
    onHide,
    assuranceId,
    onSelect,
}: SocietePatientModalProps) {
    const router = useRouter();
    const [societes, setSocietes] = useState<SocieteAssurance[]>([]);
    const [loading, setLoading] = useState(false);
    const [newSociete, setNewSociete] = useState("");
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);

    // Charger les sociétés liées à l'assurance
    useEffect(() => {
        if (show && assuranceId) {
            const fetchSocietes = async () => {
                setLoading(true);
                setErrorMsg(null);
                try {
                    const response = await fetch(`/api/ajoutsocietepatient?assuranceId=${assuranceId}`, {
                        cache: 'no-store', // Désactiver le cache pour les données à jour
                        headers: {
                            'Cache-Control': 'no-cache, no-store, must-revalidate',
                            'Pragma': 'no-cache',
                            'Expires': '0'
                        }
                    });
                    
                    if (!response.ok) {
                        throw new Error(`Erreur HTTP: ${response.status}`);
                    }
                    
                    const data = await response.json();
                    if (!Array.isArray(data)) {
                        throw new Error("Format de données invalide");
                    }
                    
                    setSocietes(data);
                    setInitialLoad(false);
                } catch (err) {
                    console.error("Erreur lors du chargement des sociétés:", err);
                    setErrorMsg("Impossible de charger les sociétés. Veuillez réessayer plus tard.");
                } finally {
                    setLoading(false);
                }
            };
            
            fetchSocietes();
        } else {
            // Réinitialiser les états quand le modal est fermé
            setSocietes([]);
            setNewSociete("");
            setErrorMsg(null);
            setSuccessMsg(null);
            setInitialLoad(true);
        }
    }, [show, assuranceId]);

    // Créer une nouvelle société liée à l'assurance
    const handleAddSociete = async () => {
        if (!newSociete.trim()) {
            setErrorMsg("Veuillez entrer le nom de la société.");
            return;
        }
        
        setSaving(true);
        setErrorMsg(null);
        setSuccessMsg(null);
        
        try {
            const response = await fetch("/api/ajoutsocietepatient", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                },
                body: JSON.stringify({ 
                    societe: newSociete.trim(),
                    assuranceId 
                }),
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Erreur lors de l'ajout de la société");
            }

            // Rafraîchir la liste des sociétés
            const updatedSocietes = await response.json();
            if (Array.isArray(updatedSocietes)) {
                setSocietes(updatedSocietes);
                setSuccessMsg("Société ajoutée avec succès ✅");
                setNewSociete("");
            } else {
                throw new Error("Format de réponse inattendu");
            }
        } catch (err: any) {
            console.error("Erreur lors de l'ajout de la société:", err);
            setErrorMsg(err.message || "Une erreur est survenue lors de l'ajout de la société");
            
            // Si l'erreur est liée à l'authentification, rediriger vers la page de connexion
            if (err.message && err.message.includes('401')) {
                router.push('/login');
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Choisir ou créer une société d'assurance</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}
                {successMsg && <Alert variant="success">{successMsg}</Alert>}

                {loading && initialLoad ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" role="status" variant="primary">
                            <span className="visually-hidden">Chargement...</span>
                        </Spinner>
                        <p className="mt-2">Chargement des sociétés...</p>
                    </div>
                ) : errorMsg ? (
                    <Alert variant="danger" className="my-3">
                        <Alert.Heading>Erreur</Alert.Heading>
                        <p>{errorMsg}</p>
                        <div className="d-flex justify-content-end">
                            <Button variant="outline-danger" size="sm" onClick={() => window.location.reload()}>
                                Réessayer
                            </Button>
                        </div>
                    </Alert>
                ) : (
                    <>
                        <Table hover responsive>
                            <thead>
                                <tr>
                                    <th>Nom de la société</th>
                                    <th className="text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {societes.length === 0 && (
                                    <tr>
                                        <td colSpan={2} className="text-center text-muted">
                                            Aucune société trouvée
                                        </td>
                                    </tr>
                                )}
                                {societes.map((soc) => (
                                    <tr key={soc._id}>
                                        <td>{soc.societe}</td>
                                        <td className="text-center">
                                            <Button
                                                size="sm"
                                                variant="primary"
                                                onClick={() => {
                                                    onSelect(soc);
                                                    onHide();
                                                }}
                                            >
                                                Sélectionner
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>

                        {!initialLoad && (
                            <>
                                <hr />
                                <Form>
                                    <Row className="align-items-center">
                                        <Col md={8} className="mb-2 mb-md-0">
                                            <Form.Control
                                                placeholder="Nom de la nouvelle société"
                                                value={newSociete}
                                                onChange={(e) => {
                                                    setNewSociete(e.target.value);
                                                    setErrorMsg(null);
                                                }}
                                                disabled={saving}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleAddSociete();
                                                    }
                                                }}
                                            />
                                        </Col>
                                        <Col md={4} className="d-grid">
                                            <Button
                                                variant="success"
                                                onClick={handleAddSociete}
                                                disabled={saving || !newSociete.trim()}
                                            >
                                                {saving ? (
                                                    <>
                                                        <Spinner
                                                            as="span"
                                                            animation="border"
                                                            size="sm"
                                                            role="status"
                                                            aria-hidden="true"
                                                            className="me-2"
                                                        />
                                                        Ajout...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="bi bi-plus-circle me-2"></i>
                                                        Ajouter
                                                    </>
                                                )}
                                            </Button>
                                        </Col>
                                    </Row>
                                    {successMsg && (
                                        <Alert variant="success" className="mt-3 mb-0">
                                            {successMsg}
                                        </Alert>
                                    )}
                                </Form>
                            </>
                        )}
                    </>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Fermer
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
