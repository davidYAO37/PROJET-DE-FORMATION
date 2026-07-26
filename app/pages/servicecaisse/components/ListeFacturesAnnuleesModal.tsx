'use client';

import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Modal, Spinner, Table } from 'react-bootstrap';
import { useEntreprise } from '@/hooks/useEntreprise';
import { createPrintWindow, generatePrintFooter, generatePrintHeader } from '@/utils/printRecu';

interface Annulation {
    _id: string;
    Patient?: string;
    ACTE?: string;
    Designation?: string;
    typeAnnulation: 'Facture' | 'Encaissement';
    Montantencaisse?: number;
    Modepaiement?: string;
    AnnulationOrdonneLe?: string;
    annulationOrdonnepar?: string;
    Annulerle?: string;
    AnnulerPar?: string;
    motifAnnulation?: string;
}

interface ListeFacturesAnnuleesModalProps {
    show: boolean;
    onHide: () => void;
}

export default function ListeFacturesAnnuleesModal({ show, onHide }: ListeFacturesAnnuleesModalProps) {
    const [annulations, setAnnulations] = useState<Annulation[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const { entreprise } = useEntreprise();

    const chargerAnnulations = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await fetch('/api/encaissementcaisse/annules', { cache: 'no-store' });
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Erreur lors du chargement des annulations');
            }

            setAnnulations(Array.isArray(data.data) ? data.data : []);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Erreur inconnue');
            setAnnulations([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (show) {
            void chargerAnnulations();
        }
    }, [show]);

    const filteredAnnulations = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return annulations;

        return annulations.filter((annulation) =>
            [annulation.Patient, annulation.ACTE, annulation.Designation, annulation.AnnulerPar, annulation.typeAnnulation]
                .some((value) => String(value || '').toLowerCase().includes(term))
        );
    }, [annulations, search]);

    const handleImprimer = () => {
        const htmlEntities: Record<string, string> = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#039;',
            '"': '&quot;'
        };
        const escapeHtml = (value: unknown) => String(value ?? '-').replace(/[&<>'"]/g, (character) => htmlEntities[character] || character);
        const formatDate = (date?: string) => date ? new Date(date).toLocaleString() : '-';
        const rows = filteredAnnulations.map((annulation, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${escapeHtml(formatDate(annulation.Annulerle))}</td>
                <td>${escapeHtml(annulation.typeAnnulation)}</td>
                <td>${escapeHtml(annulation.Patient)}</td>
                <td>${escapeHtml(annulation.Designation || annulation.ACTE)}</td>
                <td style="text-align:right;">${annulation.Montantencaisse != null ? `${annulation.Montantencaisse.toLocaleString()} FCFA` : '-'}</td>
                <td>${escapeHtml(annulation.Modepaiement)}</td>
                <td>${escapeHtml(formatDate(annulation.AnnulationOrdonneLe))}</td>
                <td>${escapeHtml(annulation.annulationOrdonnepar)}</td>
                <td>${escapeHtml(annulation.AnnulerPar)}</td>
                <td>${escapeHtml(annulation.motifAnnulation)}</td>
            </tr>
        `).join('');
        const utilisateur = localStorage.getItem('nom_utilisateur') || localStorage.getItem('userName') || 'Utilisateur inconnu';
        const content = `
            <div class="print-area" style="font-family:Arial,sans-serif;font-size:10px;">
                <h3 style="text-align:center;color:#00AEEF;margin:0 0 8px;">LISTE DES FACTURES ET ENCAISSEMENTS ANNULÉS</h3>
                <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
                    <span><strong>Nombre :</strong> ${filteredAnnulations.length}</span>
                    <span><strong>Imprimé par :</strong> ${escapeHtml(utilisateur)} le ${escapeHtml(new Date().toLocaleString())}</span>
                </div>
                <table style="width:100%;border-collapse:collapse;table-layout:fixed;">
                    <thead>
                        <tr>
                            <th>#</th><th>Date annulation</th><th>Type</th><th>Patient</th><th>Acte</th><th>Montant</th><th>Mode</th><th>Ordonné le</th><th>Ordonné par</th><th>Annulé par</th><th>Motif</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;

        createPrintWindow(
            'Liste des factures annulées',
            generatePrintHeader(entreprise),
            content,
            generatePrintFooter(entreprise)
        );
    };

    return (
        <Modal show={show} onHide={onHide} size="xl" centered scrollable>
            <Modal.Header closeButton className="border-0 pb-0">
                <div>
                    <Modal.Title className="fs-4 fw-bold">Liste des factures annulées</Modal.Title>
                    <p className="text-muted mb-0">Historique des factures et encaissements annulés.</p>
                </div>
            </Modal.Header>
            <Modal.Body>
                <div className="d-flex flex-column flex-md-row gap-3 mb-4">
                    <input
                        className="form-control form-control-lg rounded-pill"
                        placeholder="Rechercher par patient, acte ou utilisateur"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                    <Button variant="outline-primary" className="rounded-pill px-4" onClick={() => void chargerAnnulations()} disabled={loading}>
                        Actualiser
                    </Button>
                    <Button variant="primary" className="rounded-pill px-4" onClick={handleImprimer} disabled={loading || filteredAnnulations.length === 0}>
                        <i className="bi bi-printer me-2"></i>
                        Imprimer
                    </Button>
                </div>

                {loading && <div className="text-center py-4"><Spinner animation="border" /><div className="mt-2">Chargement des annulations...</div></div>}
                {error && <Alert variant="danger">{error}</Alert>}
                {!loading && !error && filteredAnnulations.length === 0 && <Alert variant="info">Aucune facture ou aucun encaissement annulé.</Alert>}
                {!loading && !error && filteredAnnulations.length > 0 && (
                    <div className="table-responsive rounded-4 overflow-hidden shadow-sm border">
                        <Table hover bordered className="mb-0 bg-white align-middle">
                            <thead className="bg-light">
                                <tr>
                                    <th>Date annulation</th>
                                    <th>Type</th>
                                    <th>Patient</th>
                                    <th>Acte</th>
                                    <th>Montant</th>
                                    <th>Mode</th>
                                    <th>Ordonné le</th>
                                    <th>Ordonné par</th>
                                    <th>Annulé par</th>
                                    <th>Motif</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAnnulations.map((annulation) => (
                                    <tr key={annulation._id}>
                                        <td>{annulation.Annulerle ? new Date(annulation.Annulerle).toLocaleString() : '-'}</td>
                                        <td><span className={`badge ${annulation.typeAnnulation === 'Facture' ? 'bg-danger' : 'bg-warning text-dark'}`}>{annulation.typeAnnulation}</span></td>
                                        <td>{annulation.Patient || '-'}</td>
                                        <td>{annulation.Designation || annulation.ACTE || '-'}</td>
                                        <td>{annulation.Montantencaisse != null ? `${annulation.Montantencaisse.toLocaleString()} FCFA` : '-'}</td>
                                        <td>{annulation.Modepaiement || '-'}</td>
                                        <td>{annulation.AnnulationOrdonneLe ? new Date(annulation.AnnulationOrdonneLe).toLocaleString() : '-'}</td>
                                        <td>{annulation.annulationOrdonnepar || '-'}</td>
                                        <td>{annulation.AnnulerPar || '-'}</td>
                                        <td>{annulation.motifAnnulation || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer className="border-0">
                <Button variant="secondary" className="rounded-pill px-4" onClick={onHide}>Fermer</Button>
            </Modal.Footer>
        </Modal>
    );
}
