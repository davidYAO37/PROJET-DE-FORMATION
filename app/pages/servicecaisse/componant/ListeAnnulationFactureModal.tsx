'use client';
import { useState, useEffect } from 'react';
import { Modal, Button, Table, Spinner, Alert } from 'react-bootstrap';

interface Facture {
    _id: string;
    CodePrestation?: string;
    DatePres?: string | Date;
    PatientP?: string;
    Designationtypeacte?: string;
    Montanttotal?: number;
    StatutFacture?: boolean;
    Ordonnerlannulation?: boolean | number;
    AnnulOrdonnerPar?: string;
    AnnulationOrdonneLe?: Date;
    typefacture?: string;
    SaisiPar?: string;
}

interface ListeAnnulationFactureModalProps {
    show: boolean;
    onHide: () => void;
}

export default function ListeAnnulationFactureModal({ show, onHide }: ListeAnnulationFactureModalProps) {
    const [factures, setFactures] = useState<Facture[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchPatient, setSearchPatient] = useState('');
    const [searchType, setSearchType] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [motifAnnulation, setMotifAnnulation] = useState('');

    const chargerFacturesAnnulation = async () => {
        try {
            setLoading(true);
            setError('');

            // Récupérer les consultations et facturations avec demandes d'annulation
            const [consultRes, factRes] = await Promise.all([
                fetch('/api/consultationFacture/consultationsAnnulation'),
                fetch('/api/facturation/facturationsAnnulation')
            ]);

            const consultations = consultRes.ok ? await consultRes.json() : [];
            const facturations = factRes.ok ? await factRes.json() : [];

            let allFactures: Facture[] = [];

            // Traiter les consultations
            if (Array.isArray(consultations)) {
                const consultWithType = consultations
                    .filter((c: any) => c.Ordonnerlannulation === 1)
                    .map((c: any) => ({
                        _id: c._id,
                        CodePrestation: c.CodePrestation,
                        DatePres: c.Date_consulation,
                        PatientP: c.PatientP,
                        Designationtypeacte: c.designationC,
                        Montanttotal: c.Prix_Assurance,
                        StatutFacture: c.StatutC,
                        Ordonnerlannulation: c.Ordonnerlannulation,
                        AnnulOrdonnerPar: c.AnnulOrdonnerPar,
                        AnnulationOrdonneLe: c.AnnulationOrdonneLe,
                        typefacture: 'Consultation',
                        SaisiPar: c.SaisiPar
                    } as Facture));
                allFactures = [...allFactures, ...consultWithType];
            }

            // Traiter les facturations
            if (Array.isArray(facturations)) {
                const factWithType = facturations
                    .filter((f: any) => f.Ordonnerlannulation === true)
                    .map((f: any) => ({
                        _id: f._id,
                        CodePrestation: f.CodePrestation,
                        DatePres: f.DatePres,
                        PatientP: f.PatientP,
                        Designationtypeacte: f.Designationtypeacte,
                        Montanttotal: f.Montanttotal,
                        StatutFacture: f.StatutFacture,
                        Ordonnerlannulation: f.Ordonnerlannulation,
                        AnnulOrdonnerPar: f.AnnulOrdonnerPar,
                        AnnulationOrdonneLe: f.AnnulationOrdonneLe,
                        typefacture: 'Facturation',
                        SaisiPar: f.SaisiPar
                    } as Facture));
                allFactures = [...allFactures, ...factWithType];
            }

            setFactures(allFactures);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Erreur inconnue');
            setFactures([]);
        } finally {
            setLoading(false);
        }
    };

    const handleValiderAnnulation = async (facture: Facture) => {
        // Vérifier si le motif est saisi
        if (!motifAnnulation.trim()) {
            alert("Veuillez saisir le motif de l'annulation de cette facture");
            return;
        }

        const confirmation = window.confirm(
            `Valider l'annulation de la facture ${facture._id.slice(-4)}?\n\nPatient: ${facture.PatientP}`
        );
        if (!confirmation) return;

        try {
            setProcessingId(facture._id);
            const utilisateur = localStorage.getItem('nom_utilisateur') || localStorage.getItem('userName') || 'Utilisateur';

            // Appeler l'API de validation d'annulation
            const response = await fetch('/api/annulation/valider', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    factureId: facture._id,
                    typeFacture: facture.typefacture,
                    motifAnnulation: motifAnnulation.trim(),
                    utilisateur: utilisateur,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Erreur lors de la validation de l'annulation");
            }

            alert("Facture annulée avec succès");
            setMotifAnnulation(''); // Réinitialiser le motif
            await chargerFacturesAnnulation();
        } catch (err) {
            console.error(err);
            alert(err instanceof Error ? err.message : 'Erreur inconnue');
        } finally {
            setProcessingId(null);
        }
    };

    const handleRefuserAnnulation = async (facture: Facture) => {
        const confirmation = window.confirm(
            `Refuser l'annulation de la facture ${facture._id.slice(-4)}?\n\nPatient: ${facture.PatientP}`
        );
        if (!confirmation) return;

        try {
            setProcessingId(facture._id);

            // Déterminer l'API à utiliser selon le type de facture
            const apiEndpoint = facture.typefacture === 'Consultation'
                ? `/api/consultation/${facture._id}`
                : `/api/facturation/${facture._id}`;

            const response = await fetch(apiEndpoint, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    Ordonnerlannulation: false,
                    AnnulOrdonnerPar: "",
                    AnnulationOrdonneLe: "",
                }),
            });

            if (!response.ok) {
                throw new Error("Erreur lors du refus de l'annulation");
            }

            alert("Annulation refusée");
            await chargerFacturesAnnulation();
        } catch (err) {
            console.error(err);
            alert(err instanceof Error ? err.message : 'Erreur inconnue');
        } finally {
            setProcessingId(null);
        }
    };

    const handleActualiser = async () => {
        setSearchPatient('');
        setSearchType('');
        setStartDate('');
        setEndDate('');
        setMotifAnnulation('');
        setCurrentPage(1);
        setPageSize(10);
        await chargerFacturesAnnulation();
    };

    useEffect(() => {
        if (show) {
            void chargerFacturesAnnulation();
        }
    }, [show]);

    const filteredFactures = factures.filter((facture) => {
        const patient = String(facture.PatientP || '').toLowerCase();
        const type = String(facture.typefacture || '').toLowerCase();

        const matchesPatient = !searchPatient || patient.includes(searchPatient.toLowerCase());
        const matchesType = !searchType || type.includes(searchType.toLowerCase());

        let matchesDate = true;
        const dateVal = facture.AnnulationOrdonneLe ? new Date(facture.AnnulationOrdonneLe) : null;

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
            matchesDate = false;
        }

        return matchesPatient && matchesType && matchesDate;
    });

    const totalPages = Math.max(1, Math.ceil(filteredFactures.length / pageSize));
    const paginatedFactures = filteredFactures.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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

    const formatFactureId = (id?: string) => {
        if (!id) return '';
        try {
            const lastChars = id.slice(-6);
            const num = parseInt(lastChars, 16);
            return (num % 10000).toString();
        } catch (error) {
            return id.slice(-4);
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="xl" centered dialogClassName="modal-dialog-centered modal-xl">
            <Modal.Header closeButton className="border-0 pb-0">
                <div>
                    <Modal.Title className="fs-4 fw-bold">Demandes d'annulation</Modal.Title>
                    <p className="text-muted mb-0">Validez ou refusez les demandes d'annulation de consultations et factures en attente.</p>
                </div>
            </Modal.Header>

            <Modal.Body>
                <div style={panelStyle} className="mb-4">
                    <div className="row g-3">
                        <div className="col-lg-6 col-md-6">
                            <label className="form-label text-secondary">Patient</label>
                            <input
                                type="text"
                                className="form-control form-control-lg rounded-pill border-0 shadow-sm"
                                placeholder="Recherche par patient"
                                value={searchPatient}
                                onChange={(e) => { setSearchPatient(e.target.value); setCurrentPage(1); }}
                            />
                        </div>
                        <div className="col-lg-6 col-md-6">
                            <label className="form-label text-secondary">Type</label>
                            <select
                                className="form-control form-control-lg rounded-pill border-0 shadow-sm"
                                value={searchType}
                                onChange={(e) => { setSearchType(e.target.value); setCurrentPage(1); }}
                            >
                                <option value="">Tous les types</option>
                                <option value="Consultation">Consultation</option>
                                <option value="Facturation">Facturation</option>
                            </select>
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

                    <div className="row g-3 mt-3">
                        <div className="col-12">
                            <label className="form-label text-secondary">Motif d'annulation</label>
                            <textarea
                                className="form-control rounded-4 border-0 shadow-sm"
                                rows={3}
                                placeholder="Saisissez le motif de l'annulation..."
                                value={motifAnnulation}
                                onChange={(e) => setMotifAnnulation(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mt-4">
                        <div className="text-muted">{filteredFactures.length} demandes trouvées</div>
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
                        <div className="mt-2 text-secondary">Chargement des demandes...</div>
                    </div>
                )}

                {error && <Alert variant="danger" className="shadow-sm">{error}</Alert>}

                {!loading && !error && filteredFactures.length === 0 && (
                    <Alert variant="info" className="shadow-sm">Aucune demande d'annulation trouvée.</Alert>
                )}

                {!loading && !error && filteredFactures.length > 0 && (
                    <>
                        <div className="table-responsive rounded-4 overflow-hidden shadow-sm border">
                            <Table hover bordered responsive className="mb-0 bg-white">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="text-uppercase text-secondary small">N° Facture</th>
                                        <th className="text-uppercase text-secondary small">Date</th>
                                        <th className="text-uppercase text-secondary small">Patient</th>
                                        <th className="text-uppercase text-secondary small">Type</th>
                                        <th className="text-uppercase text-secondary small">Montant</th>
                                        <th className="text-uppercase text-secondary small">Demandée par</th>
                                        <th className="text-uppercase text-secondary small">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedFactures.map((facture) => (
                                        <tr key={facture._id} className="align-middle">
                                            <td className="fw-bold">{formatFactureId(facture._id)}</td>
                                            <td>{facture.DatePres ? new Date(facture.DatePres).toLocaleDateString() : 'N/A'}</td>
                                            <td>{facture.PatientP || 'N/A'}</td>
                                            <td>
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    padding: '0.25rem 0.5rem',
                                                    backgroundColor: '#1ab0b8',
                                                    color: 'white',
                                                    borderRadius: '0.375rem',
                                                    display: 'inline-block',
                                                    fontWeight: 500
                                                }}>
                                                    {facture.typefacture || 'N/A'}
                                                </span>
                                            </td>
                                            <td>{facture.Montanttotal !== undefined ? `${facture.Montanttotal.toLocaleString()} FCFA` : 'N/A'}</td>
                                            <td>{facture.AnnulOrdonnerPar || 'N/A'}</td>
                                            <td>
                                                <div className="d-flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline-success"
                                                        className="rounded-pill"
                                                        onClick={() => handleValiderAnnulation(facture)}
                                                        disabled={processingId === facture._id}
                                                    >
                                                        {processingId === facture._id ? (
                                                            <>
                                                                <Spinner size="sm" animation="border" className="me-1" />
                                                                ...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <i className="bi bi-check-circle me-1"></i>
                                                                Valider
                                                            </>
                                                        )}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline-danger"
                                                        className="rounded-pill"
                                                        onClick={() => handleRefuserAnnulation(facture)}
                                                        disabled={processingId === facture._id}
                                                    >
                                                        {processingId === facture._id ? (
                                                            <>
                                                                <Spinner size="sm" animation="border" className="me-1" />
                                                                ...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <i className="bi bi-x-circle me-1"></i>
                                                                Refuser
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
                <Button
                    variant="outline-primary"
                    className="rounded-pill px-4"
                    onClick={handleActualiser}
                    disabled={loading}
                >
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Actualiser
                </Button>
                <Button variant="secondary" className="rounded-pill px-4" onClick={onHide}>
                    Fermer
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
