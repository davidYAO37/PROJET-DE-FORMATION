'use client';
import { useState, useEffect } from 'react';
import { Modal, Button, Table, Spinner, Alert } from 'react-bootstrap';

interface ListeEncaissementModalProps {
    show: boolean;
    onHide: () => void;
}

export default function ListeEncaissementModal({ show, onHide }: ListeEncaissementModalProps) {
    const [encaissements, setEncaissements] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchPatient, setSearchPatient] = useState('');
    const [searchMode, setSearchMode] = useState('');
    const [searchCaissiere, setSearchCaissiere] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    const chargerEncaissements = async () => {
        try {
            setLoading(true);
            setError('');

            const res = await fetch('/api/encaissementcaisse?all=1', { cache: 'no-store' });
            if (!res.ok) {
                throw new Error('Échec du chargement des encaissements');
            }

            const data = await res.json();
            if (!data.success) {
                throw new Error(data.message || 'Erreur API');
            }

            setEncaissements(Array.isArray(data.data) ? data.data : []);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Erreur inconnue');
            setEncaissements([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAnnuler = async (encaissement: any) => {
        // Récupérer l'utilisateur connecté
        const currentUser = localStorage.getItem('nom_utilisateur') || localStorage.getItem('userName') || 'Utilisateur';
        
        // Vérifier si l'utilisateur connecté est celui qui a encaissé
        if (encaissement.Utilisateur !== currentUser) {
            alert(`Seul ${encaissement.Utilisateur} peut ordonner cette annulation`);
            return;
        }

        // Première confirmation : "Voulez-vous ordonner l'annulation de ce encaissement"
        const confirmation1 = window.confirm(`Voulez-vous ordonner l'annulation de cet encaissement ?`);
        if (!confirmation1) return;

        // Deuxième confirmation : "Voulez-vous confirmer cette annulation"
        const confirmation2 = window.confirm(`Voulez-vous confirmer cette annulation ?`);
        if (!confirmation2) return;

        try {
            setLoading(true);
            
            const res = await fetch(`/api/encaissementcaisse?id=${encaissement._id || encaissement.id}`, {
                method: 'PATCH', // Utiliser PATCH pour la mise à jour (équivalent de HModifie)
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    utilisateur: currentUser
                })
            });

            if (!res.ok) {
                throw new Error('Impossible d\'annuler l\'encaissement');
            }

            const data = await res.json();
            if (!data.success) throw new Error(data.message || 'Erreur d\'annulation');

            // Afficher le message de succès
            alert('Annulation ordonnée avec succès');
            
            // Recharger la liste
            await chargerEncaissements();
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Erreur inconnue');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (show) {
            void chargerEncaissements();
        }
    }, [show]);

    const filteredEncaissements = encaissements.filter((encaissement) => {
        const patient = String(encaissement.Patient || '').toLowerCase();
        const modePaiement = String(encaissement.Modepaiement || '').toLowerCase();
        const caissiere = String(encaissement.Utilisateur || '').toLowerCase();

        const matchesPatient = !searchPatient || patient.includes(searchPatient.toLowerCase());
        const matchesMode = !searchMode || modePaiement.includes(searchMode.toLowerCase());
        const matchesCaissiere = !searchCaissiere || caissiere.includes(searchCaissiere.toLowerCase());

        let matchesDate = true;
        const dateStr = encaissement.DateEncaissement || encaissement.DatePrest;
        const dateVal = dateStr ? new Date(dateStr) : null;

        if (dateVal && !isNaN(dateVal.getTime())) {
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                if (dateVal < start) matchesDate = false;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                if (dateVal > end) matchesDate = false;
            }
        } else if (startDate || endDate) {
            // Si on a demandé une plage et date invalide, on exclut
            matchesDate = false;
        }

        return matchesPatient && matchesMode && matchesCaissiere && matchesDate;
    });

    const totalPages = Math.max(1, Math.ceil(filteredEncaissements.length / pageSize));
    const paginatedEncaissements = filteredEncaissements.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const handlePageChange = (newPage: number) => {
        const page = Math.min(totalPages, Math.max(1, newPage));
        setCurrentPage(page);
    };

    const panelStyle = {
        background: '#f8fafc',
        borderRadius: '1rem',
        border: '1px solid #e2e8f0',
        padding: '1.5rem',
    };

    return (
        <Modal show={show} onHide={onHide} size="xl" centered dialogClassName="modal-dialog-centered modal-xl">
            <Modal.Header closeButton className="border-0 pb-0">
                <div>
                    <Modal.Title className="fs-4 fw-bold">Liste des encaissements</Modal.Title>
                    <p className="text-muted mb-0">Filtrez, visualisez et annulez les encaissements récents.</p>
                </div>
            </Modal.Header>

            <Modal.Body>
                <div style={panelStyle} className="mb-4">
                    <div className="row g-3">
                        <div className="col-lg-4 col-md-6">
                            <label className="form-label text-secondary">Patient</label>
                            <input
                                type="text"
                                className="form-control form-control-lg rounded-pill border-0 shadow-sm"
                                placeholder="Recherche par patient"
                                value={searchPatient}
                                onChange={(e) => { setSearchPatient(e.target.value); setCurrentPage(1); }}
                            />
                        </div>
                        <div className="col-lg-4 col-md-6">
                            <label className="form-label text-secondary">Mode de paiement</label>
                            <input
                                type="text"
                                className="form-control form-control-lg rounded-pill border-0 shadow-sm"
                                placeholder="Recherche par mode"
                                value={searchMode}
                                onChange={(e) => { setSearchMode(e.target.value); setCurrentPage(1); }}
                            />
                        </div>
                        <div className="col-lg-4 col-md-6">
                            <label className="form-label text-secondary">Caissière</label>
                            <input
                                type="text"
                                className="form-control form-control-lg rounded-pill border-0 shadow-sm"
                                placeholder="Recherche par caissière"
                                value={searchCaissiere}
                                onChange={(e) => { setSearchCaissiere(e.target.value); setCurrentPage(1); }}
                            />
                        </div>
                    </div>

                    <div className="row g-3 mt-3">
                        <div className="col-lg-6">
                            <label className="form-label text-secondary">Date début</label>
                            <input
                                type="date"
                                className="form-control form-control-lg rounded-pill border-0 shadow-sm"
                                value={startDate}
                                onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                            />
                        </div>
                        <div className="col-lg-6">
                            <label className="form-label text-secondary">Date fin</label>
                            <input
                                type="date"
                                className="form-control form-control-lg rounded-pill border-0 shadow-sm"
                                value={endDate}
                                onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                            />
                        </div>
                    </div>

                    <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mt-4">
                        <div className="text-muted">{filteredEncaissements.length} encaissements trouvés</div>
                        <div className="d-flex align-items-center gap-2">
                            <label className="mb-0 text-secondary">Lignes par page</label>
                            <select
                                className="form-select form-select-sm rounded-pill"
                                value={pageSize}
                                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                                style={{ width: '100px' }}
                            >
                                {[5, 10, 20, 50].map((size) => (
                                    <option key={size} value={size}>{size}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {loading && (
                    <div className="text-center py-4">
                        <Spinner animation="border" variant="primary" />
                        <div className="mt-2 text-secondary">Chargement des encaissements...</div>
                    </div>
                )}

                {error && <Alert variant="danger" className="shadow-sm">{error}</Alert>}

                {!loading && !error && filteredEncaissements.length === 0 && (
                    <Alert variant="info" className="shadow-sm">Aucun encaissement trouvé.</Alert>
                )}

                {!loading && !error && filteredEncaissements.length > 0 && (
                    <>
                        <div className="table-responsive rounded-4 overflow-hidden shadow-sm border">
                            <Table hover bordered responsive className="mb-0 bg-white">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="text-uppercase text-secondary small">Date</th>
                                        <th className="text-uppercase text-secondary small">Patient</th>
                                        <th className="text-uppercase text-secondary small">Caissière</th>
                                        <th className="text-uppercase text-secondary small">Montant</th>
                                        <th className="text-uppercase text-secondary small">Mode</th>
                                        <th className="text-uppercase text-secondary small">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedEncaissements.map((encaissement) => {
                                        const hasAnnulationDemande = encaissement.annulationOrdonnepar && encaissement.AnnulationOrdonneLe;
                                        const isAnnulationRefusee = encaissement.StatutOrdonner === 1 && !encaissement.annulationOrdonnepar && !encaissement.AnnulationOrdonneLe;
                                        return (
                                            <tr 
                                                key={encaissement._id || encaissement.id} 
                                                className={`align-middle ${
                                                    hasAnnulationDemande ? 'table-warning' : 
                                                    isAnnulationRefusee ? 'table-secondary' : ''
                                                }`}
                                            >
                                                <td>
                                                    <div className="d-flex align-items-center flex-wrap">
                                                        <span>{new Date(encaissement.DateEncaissement || encaissement.DatePrest || Date.now()).toLocaleString()}</span>
                                                        {hasAnnulationDemande && (
                                                            <span className="ms-2  bg-warning text-dark" title="Demande d'annulation effectuée">
                                                                <i className="bi bi-clock-history me-1"></i>
                                                                En attente
                                                            </span>
                                                        )}
                                                        {isAnnulationRefusee && (
                                                            <span className="ms-2  bg-secondary text-white" title="Annulation refusée">
                                                                <i className="bi bi-x-circle me-1"></i>
                                                                Refusée
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>{encaissement.Patient || 'N/A'}</td>
                                                <td>{encaissement.Utilisateur || 'N/A'}</td>
                                                <td>{encaissement.Montantencaisse != null ? encaissement.Montantencaisse : '-'}</td>
                                                <td>{encaissement.Modepaiement || '-'}</td>
                                                <td>
                                                    {hasAnnulationDemande ? (
                                                        <div className="d-flex align-items-center">
                                                            <span className="text-muted small me-2">
                                                                Demandé par {encaissement.annulationOrdonnepar}
                                                            </span>
                                                            <span className="text-muted small">
                                                                le {new Date(encaissement.AnnulationOrdonneLe).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    ) : isAnnulationRefusee ? (
                                                        <div className="d-flex align-items-center">
                                                            <span className="text-muted small me-2">
                                                                <i className="bi bi-x-circle text-secondary me-1"></i>
                                                                Annulation refusée
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            variant="outline-danger"
                                                            className="rounded-pill"
                                                            onClick={() => void handleAnnuler(encaissement)}
                                                            title={`Annuler cet encaissement (encaissé par: ${encaissement.Utilisateur || 'N/A'})`}
                                                        >
                                                            Annuler
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        </div>

                        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3 mt-3">
                            <div className="text-secondary">Page {currentPage} / {totalPages}</div>
                            <div className="btn-group" role="group">
                                <Button
                                    size="sm"
                                    variant="outline-primary"
                                    disabled={currentPage <= 1}
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    className="rounded-pill"
                                >
                                    Précédent
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline-primary"
                                    disabled={currentPage >= totalPages}
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    className="rounded-pill"
                                >
                                    Suivant
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </Modal.Body>

            <Modal.Footer className="border-0">
                <Button variant="secondary" className="rounded-pill px-4" onClick={onHide}>
                    Fermer
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
