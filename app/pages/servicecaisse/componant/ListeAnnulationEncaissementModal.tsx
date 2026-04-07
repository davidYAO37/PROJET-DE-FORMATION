import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Table, Alert, Spinner } from 'react-bootstrap';
import { EncaissementCaisse, IEncaissementCaisse } from '@/models/EncaissementCaisse';

interface ListeAnnulationEncaissementModalProps {
    show: boolean;
    onHide: () => void;
}

interface EncaissementWithId extends IEncaissementCaisse {
    _id: string;
    ACTE?: string; // Ajout pour compatibilité avec les données existantes
}

export default function ListeAnnulationEncaissementModal({ show, onHide }: ListeAnnulationEncaissementModalProps) {
    const [searchPatient, setSearchPatient] = useState('');
    const [encaissements, setEncaissements] = useState<EncaissementWithId[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [motif, setMotif] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Rechercher les encaissements par patient
    const handleRecherche = async () => {
        if (!searchPatient.trim()) {
            setError('Veuillez saisir le nom du patient');
            return;
        }

        try {
            setLoading(true);
            setError('');

            const response = await fetch(`/api/encaissementcaisse?patient=${encodeURIComponent(searchPatient.trim())}`, {
                cache: 'no-store'
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la recherche des encaissements');
            }

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.message || 'Erreur API');
            }

            // Filtrer les encaissements avec demande d'annulation (annulationOrdonnepar <> "")
            const encaissementsAvecDemande = (data.data || []).filter((encaissement: any) => 
                encaissement.annulationOrdonnepar && encaissement.annulationOrdonnepar.trim() !== ''
            );

            setEncaissements(encaissementsAvecDemande);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Erreur inconnue');
            setEncaissements([]);
        } finally {
            setLoading(false);
        }
    };

    // Refuser l'annulation d'un encaissement
    const handleRefuserAnnulation = async (encaissement: EncaissementWithId) => {
        const confirmation = window.confirm(
            `Refuser l'annulation de l'encaissement ?\n\nPatient: ${encaissement.Patient}\nMontant: ${encaissement.Montantencaisse}\nDemandé par: ${encaissement.annulationOrdonnepar}`
        );
        if (!confirmation) return;

        try {
            setProcessingId(encaissement._id);

            const response = await fetch(`/api/encaissementcaisse?id=${encaissement._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    Ordonnerlannulation: false,
                    annulationOrdonnepar: "",
                    AnnulationOrdonneLe: "",
                    utilisateur: localStorage.getItem('nom_utilisateur') || localStorage.getItem('userName') || 'Utilisateur'
                })
            });

            if (!response.ok) {
                throw new Error('Impossible de refuser l\'annulation');
            }

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.message || 'Erreur lors du refus');
            }

            alert('Annulation refusée avec succès');
            
            // Recharger la liste
            await handleRecherche();
        } catch (err) {
            console.error(err);
            alert(err instanceof Error ? err.message : 'Erreur inconnue');
        } finally {
            setProcessingId(null);
        }
    };

    // Annuler un encaissement
    const handleAnnuler = async (encaissement: EncaissementWithId) => {
        // Vérifier le motif
        if (!motif.trim()) {
            alert('Veuillez saisir le motif de l\'annulation de cet encaissement');
            return;
        }

        // Confirmation
        const confirmation = window.confirm(`Voulez-vous annuler cet encaissement ?\n\nPatient: ${encaissement.Patient}\nMontant: ${encaissement.Montantencaisse}`);
        if (!confirmation) return;

        try {
            setProcessingId(encaissement._id);

            const response = await fetch(`/api/encaissementcaisse?id=${encaissement._id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    utilisateur: localStorage.getItem('nom_utilisateur') || localStorage.getItem('userName') || 'Utilisateur',
                    motifAnnulation: motif.trim()
                })
            });

            if (!response.ok) {
                throw new Error('Impossible d\'annuler l\'encaissement');
            }

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.message || 'Erreur d\'annulation');
            }

            alert('Encaissement annulé avec succès');
            
            // Recharger la liste
            await handleRecherche();
            setMotif('');
        } catch (err) {
            console.error(err);
            alert(err instanceof Error ? err.message : 'Erreur inconnue');
        } finally {
            setProcessingId(null);
        }
    };

    // Réinitialiser à la fermeture
    useEffect(() => {
        if (!show) {
            setSearchPatient('');
            setEncaissements([]);
            setError('');
            setMotif('');
            setProcessingId(null);
        }
    }, [show]);

    return (
        <Modal show={show} onHide={onHide} size="xl" centered backdrop="static" keyboard={false}>
            <Modal.Header closeButton className="bg-danger text-white">
                <Modal.Title className="fs-4 fw-bold">
                    <i className="bi bi-trash me-2"></i>
                    Annulation d'Encaissements
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {/* Section de recherche */}
                <div className="bg-light p-3 rounded mb-4">
                    <div className="row g-3 align-items-end">
                        <div className="col-md-6">
                            <Form.Label className="fw-semibold">Nom et Prénom du Patient</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Saisir le nom et prénom du patient..."
                                value={searchPatient}
                                onChange={(e) => setSearchPatient(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleRecherche()}
                            />
                        </div>
                        <div className="col-md-3">
                            <Button 
                                variant="primary" 
                                onClick={handleRecherche}
                                disabled={loading}
                                className="w-100"
                            >
                                <i className="bi bi-search me-2"></i>
                                {loading ? 'Recherche...' : 'Rechercher'}
                            </Button>
                        </div>
                        <div className="col-md-3">
                            <Form.Label className="fw-semibold">Motif d'Annulation</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Motif de l'annulation..."
                                value={motif}
                                onChange={(e) => setMotif(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {error && <Alert variant="danger" className="shadow-sm">{error}</Alert>}

                {loading && (
                    <div className="text-center py-4">
                        <Spinner animation="border" variant="primary" />
                        <div className="mt-2 text-secondary">Recherche des encaissements...</div>
                    </div>
                )}

                {!loading && !error && encaissements.length === 0 && searchPatient && (
                    <Alert variant="info" className="shadow-sm">
                        Aucun encaissement avec demande d'annulation trouvé pour ce patient.
                    </Alert>
                )}

                {!loading && !error && encaissements.length > 0 && (
                    <>
                        <div className="mb-3">
                            <h5 className="text-primary">
                                <i className="bi bi-clock-history me-2"></i>
                                Encaissements avec demande d'annulation
                            </h5>
                            <p className="text-muted mb-0">
                                {encaissements.length} encaissement(s) trouvé(s) pour <strong>{searchPatient}</strong>
                            </p>
                        </div>

                        <div className="table-responsive rounded-4 overflow-hidden shadow-sm border">
                            <Table hover bordered responsive className="mb-0 bg-white">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="text-uppercase text-secondary small">Date Encaissement</th>
                                        <th className="text-uppercase text-secondary small">Patient</th>
                                        <th className="text-uppercase text-secondary small">Acte</th>
                                        <th className="text-uppercase text-secondary small">Montant</th>
                                        <th className="text-uppercase text-secondary small">Caissier</th>
                                        <th className="text-uppercase text-secondary small">Demandé par</th>
                                        <th className="text-uppercase text-secondary small">Date Demande</th>
                                        <th className="text-uppercase text-secondary small">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {encaissements.map((encaissement) => (
                                        <tr key={encaissement._id} className="align-middle">
                                            <td>
                                                {encaissement.DateEncaissement 
                                                    ? new Date(encaissement.DateEncaissement).toLocaleString() 
                                                    : 'N/A'
                                                }
                                            </td>
                                            <td className="fw-semibold">{encaissement.Patient || 'N/A'}</td>
                                            <td>{encaissement.Designation || encaissement.ACTE || 'N/A'}</td>
                                            <td className="text-end fw-bold">
                                                {encaissement.Montantencaisse != null 
                                                    ? `${encaissement.Montantencaisse.toLocaleString()} FCFA` 
                                                    : '-'
                                                }
                                            </td>
                                            <td>{encaissement.Utilisateur || 'N/A'}</td>
                                            <td>
                                                <span className="badge bg-warning text-dark">
                                                    {encaissement.annulationOrdonnepar || 'N/A'}
                                                </span>
                                            </td>
                                            <td>
                                                {encaissement.AnnulationOrdonneLe 
                                                    ? new Date(encaissement.AnnulationOrdonneLe).toLocaleDateString() 
                                                    : 'N/A'
                                                }
                                            </td>
                                            <td>
                                                <div className="d-flex gap-2">
                                                    <Button
                                                        variant="warning"
                                                        size="sm"
                                                        className="rounded-pill"
                                                        onClick={() => handleRefuserAnnulation(encaissement)}
                                                        disabled={processingId === encaissement._id}
                                                        title="Refuser l'annulation"
                                                    >
                                                        {processingId === encaissement._id ? (
                                                            <>
                                                                <Spinner as="span" animation="border" size="sm" className="me-1" />
                                                                Traitement...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <i className="bi bi-x-circle me-1"></i>
                                                                Refuser
                                                            </>
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        className="rounded-pill"
                                                        onClick={() => handleAnnuler(encaissement)}
                                                        disabled={processingId === encaissement._id || !motif.trim()}
                                                        title="Annuler cet encaissement"
                                                    >
                                                        {processingId === encaissement._id ? (
                                                            <>
                                                                <Spinner as="span" animation="border" size="sm" className="me-1" />
                                                                Traitement...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <i className="bi bi-trash me-1"></i>
                                                                Annuler
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    </>
                )}
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    <i className="bi bi-x-circle me-2"></i>
                    Fermer
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
