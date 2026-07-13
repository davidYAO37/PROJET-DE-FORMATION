'use client';
import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Button, Form, Spinner, Alert, Badge, Table, Modal } from 'react-bootstrap';
import { useParams, useRouter } from 'next/navigation';
import { useEntreprise } from '@/hooks/useEntreprise';
import { generatePrintHeader, generatePrintFooter, createPrintWindow } from '@/utils/printRecu';

interface Facture {
    _id: string;
    CodePrestation: string;
    PatientP: string;
    NomMed: string;
    DatePres?: string;
    DateFacturation?: string;
    Designationtypeacte: string;
    typefacture: string;
    Montanttotal: number;
    PartAssuranceP: number;
    Partassure: number;
    TotalapayerPatient: number;
    TotalPaye: number;
    Restapayer: number;
    reduction: number;
    tauxreduction: number;
    MotifRemise?: string;
    Assurance: string;
    Taux: string;
    Numfacture: string;
    NumBon: string;
    Numcarte: string;
    Modepaiement: string;
    BanqueC?: string;
    NumCheque?: string;
    StatutFacture: boolean;
    factureannule: boolean;
    Ordonnerlannulation: boolean;
    StatutPaiement: string;
    FacturePar: string;
    SaisiPar: string;
    SOCIETE_PATIENT: string;
    Souscripteur: string;
    Heure_Facturation?: string;
    MontantRecu: number;
    MotifAnnulationFacture?: string;
    AnnulerPar?: string;
    Annulerle?: string;
    Entrele?: string;
    SortieLe?: string;
    Chambre?: string;
    nombreDeJours?: number;
    CONCLUSIONGENE?: string;
    ObservationC?: string;
    Code_dossier?: string;
}

const fmt = (n: number) => (n || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 });

export default function DetailFacturePage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { entreprise } = useEntreprise();

    const [facture, setFacture] = useState<Facture | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [showAnnulModal, setShowAnnulModal] = useState(false);
    const [motifAnnul, setMotifAnnul] = useState('');
    const [annulPar, setAnnulPar] = useState('');

    // Champs éditables
    const [modepaiement, setModepaiement] = useState('');
    const [reduction, setReduction] = useState(0);
    const [tauxreduction, setTauxreduction] = useState(0);
    const [motifRemise, setMotifRemise] = useState('');
    const [montantRecu, setMontantRecu] = useState(0);
    const [observation, setObservation] = useState('');

    useEffect(() => {
        if (!id) return;
        loadFacture();
        const user = localStorage.getItem('nom_utilisateur') || localStorage.getItem('userName') || '';
        setAnnulPar(user);
    }, [id]);

    const loadFacture = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/facturation/${id}`);
            if (!res.ok) throw new Error('Facture introuvable');
            const data = await res.json();
            setFacture(data);
            setModepaiement(data.Modepaiement || '');
            setReduction(data.reduction || 0);
            setTauxreduction(data.tauxreduction || 0);
            setMotifRemise(data.MotifRemise || '');
            setMontantRecu(data.MontantRecu || 0);
            setObservation(data.ObservationC || '');
        } catch (e: any) {
            setMessage({ type: 'danger', text: e.message });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!facture) return;
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch(`/api/facturation/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    Modepaiement: modepaiement,
                    reduction,
                    tauxreduction,
                    MotifRemise: motifRemise,
                    MontantRecu: montantRecu,
                    ObservationC: observation,
                }),
            });
            if (!res.ok) throw new Error('Échec de la mise à jour');
            const updated = await res.json();
            setFacture(updated.facturation);
            setEditMode(false);
            setMessage({ type: 'success', text: 'Facture mise à jour avec succès.' });
        } catch (e: any) {
            setMessage({ type: 'danger', text: e.message });
        } finally {
            setSaving(false);
        }
    };

    const handleAnnuler = async () => {
        if (!motifAnnul.trim()) {
            setMessage({ type: 'danger', text: 'Veuillez saisir un motif d\'annulation.' });
            return;
        }
        setSaving(true);
        try {
            const res = await fetch(`/api/facturation/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    factureannule: true,
                    MotifAnnulationFacture: motifAnnul,
                    AnnulerPar: annulPar,
                    Annulerle: new Date().toISOString(),
                }),
            });
            if (!res.ok) throw new Error('Échec de l\'annulation');
            await loadFacture();
            setShowAnnulModal(false);
            setMotifAnnul('');
            setMessage({ type: 'success', text: 'Facture annulée avec succès.' });
        } catch (e: any) {
            setMessage({ type: 'danger', text: e.message });
        } finally {
            setSaving(false);
        }
    };

    const handlePrint = () => {
        if (!facture) return;
        const header = generatePrintHeader(entreprise);
        const footer = generatePrintFooter(entreprise);

        const dateFacture = facture.DateFacturation
            ? new Date(facture.DateFacturation).toLocaleDateString('fr-FR')
            : (facture.DatePres ? new Date(facture.DatePres).toLocaleDateString('fr-FR') : '—');

        const html = `
            <html><head><title>Facture ${facture.Numfacture || facture.CodePrestation}</title>
            <style>
                body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; color: #222; }
                .header { display: flex; align-items: center; margin-bottom: 10px; }
                .header img { max-height: 80px; max-width: 80px; margin-right: 15px; }
                h2 { text-align: center; font-size: 16px; text-transform: uppercase; margin: 10px 0 4px; }
                .ref { text-align: center; color: #555; font-size: 11px; margin-bottom: 12px; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 20px; border: 1px solid #ddd; padding: 10px; border-radius: 4px; margin-bottom: 12px; }
                .info-row { display: flex; gap: 4px; }
                .info-label { font-weight: bold; min-width: 120px; color: #555; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th { background: #1565c0; color: #fff; padding: 5px 8px; font-size: 11px; text-align: left; }
                td { padding: 5px 8px; border-bottom: 1px solid #eee; font-size: 11px; }
                .text-right { text-align: right; }
                .total-row { font-weight: bold; background: #f5f5f5; }
                .badge-payee { background: #388e3c; color: #fff; padding: 2px 8px; border-radius: 10px; font-size: 10px; }
                .badge-nonpayee { background: #c62828; color: #fff; padding: 2px 8px; border-radius: 10px; font-size: 10px; }
                @media print { body { margin: 10px; } }
            </style></head><body>
            ${header}
            <h2>Facture Médicale</h2>
            <div class="ref">N° ${facture.Numfacture || '—'} &nbsp;|&nbsp; Code: ${facture.CodePrestation}</div>
            <div class="info-grid">
                <div class="info-row"><span class="info-label">Patient :</span>${facture.PatientP || '—'}</div>
                <div class="info-row"><span class="info-label">Date :</span>${dateFacture}</div>
                <div class="info-row"><span class="info-label">Type acte :</span>${facture.Designationtypeacte || facture.typefacture || '—'}</div>
                <div class="info-row"><span class="info-label">Médecin :</span>${facture.NomMed || '—'}</div>
                <div class="info-row"><span class="info-label">Assurance :</span>${facture.Assurance || 'NON ASSURÉ'}</div>
                <div class="info-row"><span class="info-label">Taux :</span>${facture.Taux ? facture.Taux + '%' : '—'}</div>
                <div class="info-row"><span class="info-label">N° Carte :</span>${facture.Numcarte || '—'}</div>
                <div class="info-row"><span class="info-label">N° Bon :</span>${facture.NumBon || '—'}</div>
                <div class="info-row"><span class="info-label">Société :</span>${facture.SOCIETE_PATIENT || '—'}</div>
                <div class="info-row"><span class="info-label">Mode paiement :</span>${facture.Modepaiement || '—'}</div>
            </div>
            <table>
                <thead><tr>
                    <th>Désignation</th>
                    <th class="text-right">Montant total</th>
                    <th class="text-right">Part assurance</th>
                    <th class="text-right">Part patient</th>
                    <th class="text-right">Réduction</th>
                    <th class="text-right">Montant reçu</th>
                    <th class="text-right">Reste à payer</th>
                </tr></thead>
                <tbody>
                    <tr>
                        <td>${facture.Designationtypeacte || facture.typefacture || '—'}</td>
                        <td class="text-right">${fmt(facture.Montanttotal)}</td>
                        <td class="text-right">${fmt(facture.PartAssuranceP)}</td>
                        <td class="text-right">${fmt(facture.TotalapayerPatient)}</td>
                        <td class="text-right">${fmt(facture.reduction)}</td>
                        <td class="text-right">${fmt(facture.MontantRecu)}</td>
                        <td class="text-right">${fmt(facture.Restapayer)}</td>
                    </tr>
                    <tr class="total-row">
                        <td colspan="1"><strong>Total payé :</strong></td>
                        <td class="text-right" colspan="6"><strong>${fmt(facture.TotalPaye)} FCFA</strong></td>
                    </tr>
                </tbody>
            </table>
            <div style="margin-top:16px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    Statut : <span class="${facture.StatutFacture ? 'badge-payee' : 'badge-nonpayee'}">${facture.StatutFacture ? 'PAYÉE' : 'NON SOLDÉE'}</span>
                    ${facture.factureannule ? '<span class="badge-nonpayee" style="margin-left:6px;">ANNULÉE</span>' : ''}
                </div>
                <div style="font-size:11px;color:#555;">Saisi par : ${facture.FacturePar || facture.SaisiPar || '—'} &nbsp;|&nbsp; Heure : ${facture.Heure_Facturation || '—'}</div>
            </div>
            ${footer}
            </body></html>`;

        const win = window.open('', '_blank');
        if (win) {
            win.document.write(html);
            win.document.close();
            win.focus();
            setTimeout(() => win.print(), 400);
        }
    };

    if (loading) return <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}><Spinner /></div>;

    if (!facture) return (
        <div className="p-4">
            <Alert variant="danger">Facture introuvable.</Alert>
            <Button variant="outline-primary" onClick={() => router.back()}><i className="bi bi-arrow-left me-1"></i>Retour</Button>
        </div>
    );

    const dateFacture = facture.DateFacturation
        ? new Date(facture.DateFacturation).toLocaleDateString('fr-FR')
        : (facture.DatePres ? new Date(facture.DatePres).toLocaleDateString('fr-FR') : '—');

    return (
        <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '20px' }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg,#1565c0 0%,#1976d2 50%,#42a5f5 100%)',
                borderRadius: 10, padding: '14px 24px', marginBottom: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                boxShadow: '0 4px 20px rgba(21,101,192,0.3)',
            }}>
                <div>
                    <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>Service Facturation</div>
                    <div style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 800 }}>Détail Facture</div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>
                        {facture.Numfacture || facture.CodePrestation} — {facture.PatientP}
                    </div>
                </div>
                <div className="d-flex gap-2">
                    <Button size="sm" variant="light" onClick={() => router.back()}>
                        <i className="bi bi-arrow-left me-1"></i>Retour
                    </Button>
                    <Button size="sm" variant="warning" onClick={handlePrint}>
                        <i className="bi bi-printer me-1"></i>Imprimer
                    </Button>
                </div>
            </div>

            {message && <Alert variant={message.type} dismissible onClose={() => setMessage(null)}>{message.text}</Alert>}

            {/* Statut annulation */}
            {facture.factureannule && (
                <Alert variant="dark" className="mb-3">
                    <i className="bi bi-x-octagon-fill me-2"></i>
                    <strong>Facture annulée</strong> par <strong>{facture.AnnulerPar}</strong>
                    {facture.Annulerle && <> le {new Date(facture.Annulerle).toLocaleDateString('fr-FR')}</>}
                    {facture.MotifAnnulationFacture && <> — Motif : {facture.MotifAnnulationFacture}</>}
                </Alert>
            )}

            <Row className="g-3">
                {/* Infos patient & facture */}
                <Col md={6}>
                    <Card className="shadow-sm h-100">
                        <Card.Header className="bg-white fw-bold py-2 small">
                            <i className="bi bi-person-fill me-2 text-primary"></i>Informations patient
                        </Card.Header>
                        <Card.Body>
                            <Table borderless size="sm" style={{ fontSize: '0.82rem' }}>
                                <tbody>
                                    <tr><td className="text-muted" style={{ width: 130 }}>Patient</td><td className="fw-semibold">{facture.PatientP || '—'}</td></tr>
                                    <tr><td className="text-muted">Code dossier</td><td>{facture.Code_dossier || '—'}</td></tr>
                                    <tr><td className="text-muted">Assurance</td><td>{facture.Assurance || 'NON ASSURÉ'}{facture.Taux ? <Badge bg="info" className="ms-1">{facture.Taux}%</Badge> : null}</td></tr>
                                    <tr><td className="text-muted">Société</td><td>{facture.SOCIETE_PATIENT || '—'}</td></tr>
                                    <tr><td className="text-muted">Souscripteur</td><td>{facture.Souscripteur || '—'}</td></tr>
                                    <tr><td className="text-muted">N° Carte</td><td>{facture.Numcarte || '—'}</td></tr>
                                    <tr><td className="text-muted">N° Bon</td><td>{facture.NumBon || '—'}</td></tr>
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={6}>
                    <Card className="shadow-sm h-100">
                        <Card.Header className="bg-white fw-bold py-2 small">
                            <i className="bi bi-receipt me-2 text-success"></i>Informations facture
                        </Card.Header>
                        <Card.Body>
                            <Table borderless size="sm" style={{ fontSize: '0.82rem' }}>
                                <tbody>
                                    <tr><td className="text-muted" style={{ width: 130 }}>N° Facture</td><td className="fw-bold text-primary">{facture.Numfacture || '—'}</td></tr>
                                    <tr><td className="text-muted">Code prestation</td><td><code>{facture.CodePrestation}</code></td></tr>
                                    <tr><td className="text-muted">Date</td><td>{dateFacture}{facture.Heure_Facturation ? ` — ${facture.Heure_Facturation}` : ''}</td></tr>
                                    <tr><td className="text-muted">Type</td><td>{facture.typefacture || '—'}</td></tr>
                                    <tr><td className="text-muted">Acte</td><td>{facture.Designationtypeacte || '—'}</td></tr>
                                    <tr><td className="text-muted">Médecin</td><td>{facture.NomMed || '—'}</td></tr>
                                    <tr><td className="text-muted">Saisi par</td><td>{facture.FacturePar || facture.SaisiPar || '—'}</td></tr>
                                    <tr><td className="text-muted">Statut</td>
                                        <td>
                                            {facture.factureannule
                                                ? <Badge bg="dark">Annulée</Badge>
                                                : facture.StatutFacture
                                                    ? <Badge bg="success">Payée</Badge>
                                                    : <Badge bg="danger">Non soldée</Badge>}
                                        </td>
                                    </tr>
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Montants */}
                <Col xs={12}>
                    <Card className="shadow-sm">
                        <Card.Header className="bg-white fw-bold py-2 small">
                            <i className="bi bi-cash-stack me-2 text-warning"></i>Détail financier
                        </Card.Header>
                        <Card.Body className="p-0">
                            <Table size="sm" className="mb-0" style={{ fontSize: '0.82rem' }}>
                                <thead className="table-light">
                                    <tr>
                                        <th>Montant total</th>
                                        <th>Part assurance</th>
                                        <th>Part patient</th>
                                        <th>Réduction</th>
                                        <th>Taux remise</th>
                                        <th>Montant reçu</th>
                                        <th>Total payé</th>
                                        <th>Reste à payer</th>
                                        <th>Mode paiement</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="fw-bold">{fmt(facture.Montanttotal)} FCFA</td>
                                        <td className="text-warning fw-semibold">{fmt(facture.PartAssuranceP)} FCFA</td>
                                        <td>{fmt(facture.TotalapayerPatient)} FCFA</td>
                                        <td>{fmt(facture.reduction)} FCFA</td>
                                        <td>{facture.tauxreduction ? facture.tauxreduction + '%' : '—'}</td>
                                        <td>{fmt(facture.MontantRecu)} FCFA</td>
                                        <td className="text-success fw-bold">{fmt(facture.TotalPaye)} FCFA</td>
                                        <td style={{ color: facture.Restapayer > 0 ? '#c62828' : '#388e3c', fontWeight: 700 }}>{fmt(facture.Restapayer)} FCFA</td>
                                        <td>{facture.Modepaiement || '—'}</td>
                                    </tr>
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Édition */}
                {!facture.factureannule && (
                    <Col xs={12}>
                        <Card className="shadow-sm">
                            <Card.Header className="bg-white d-flex justify-content-between align-items-center py-2">
                                <span className="fw-bold small"><i className="bi bi-pencil-fill me-2 text-primary"></i>Modification</span>
                                {!editMode && (
                                    <Button size="sm" variant="outline-primary" onClick={() => setEditMode(true)}>
                                        <i className="bi bi-pencil me-1"></i>Modifier
                                    </Button>
                                )}
                            </Card.Header>
                            {editMode && (
                                <Card.Body>
                                    <Row className="g-2">
                                        <Col md={3}>
                                            <Form.Label className="small fw-semibold mb-1">Mode de paiement</Form.Label>
                                            <Form.Select size="sm" value={modepaiement} onChange={e => setModepaiement(e.target.value)}>
                                                <option value="">—</option>
                                                <option value="ESPECES">Espèces</option>
                                                <option value="CHEQUE">Chèque</option>
                                                <option value="VIREMENT">Virement</option>
                                                <option value="MOBILE MONEY">Mobile Money</option>
                                                <option value="CARTE VISA">Carte Visa</option>
                                            </Form.Select>
                                        </Col>
                                        <Col md={2}>
                                            <Form.Label className="small fw-semibold mb-1">Réduction (FCFA)</Form.Label>
                                            <Form.Control size="sm" type="number" min={0} value={reduction} onChange={e => setReduction(Number(e.target.value))} />
                                        </Col>
                                        <Col md={2}>
                                            <Form.Label className="small fw-semibold mb-1">Taux remise (%)</Form.Label>
                                            <Form.Control size="sm" type="number" min={0} max={100} value={tauxreduction} onChange={e => setTauxreduction(Number(e.target.value))} />
                                        </Col>
                                        <Col md={3}>
                                            <Form.Label className="small fw-semibold mb-1">Motif remise</Form.Label>
                                            <Form.Control size="sm" value={motifRemise} onChange={e => setMotifRemise(e.target.value)} />
                                        </Col>
                                        <Col md={2}>
                                            <Form.Label className="small fw-semibold mb-1">Montant reçu (FCFA)</Form.Label>
                                            <Form.Control size="sm" type="number" min={0} value={montantRecu} onChange={e => setMontantRecu(Number(e.target.value))} />
                                        </Col>
                                        <Col xs={12}>
                                            <Form.Label className="small fw-semibold mb-1">Observation</Form.Label>
                                            <Form.Control size="sm" as="textarea" rows={2} value={observation} onChange={e => setObservation(e.target.value)} />
                                        </Col>
                                    </Row>
                                    <div className="d-flex gap-2 mt-3">
                                        <Button size="sm" variant="success" onClick={handleSave} disabled={saving}>
                                            {saving ? <Spinner size="sm" className="me-1" /> : <i className="bi bi-check-circle me-1"></i>}
                                            Enregistrer
                                        </Button>
                                        <Button size="sm" variant="outline-secondary" onClick={() => setEditMode(false)}>
                                            <i className="bi bi-x me-1"></i>Annuler
                                        </Button>
                                    </div>
                                </Card.Body>
                            )}
                        </Card>
                    </Col>
                )}

                {/* Actions */}
                {!facture.factureannule && (
                    <Col xs={12}>
                        <div className="d-flex gap-2">
                            <Button variant="danger" size="sm" onClick={() => setShowAnnulModal(true)}>
                                <i className="bi bi-x-octagon me-1"></i>Annuler la facture
                            </Button>
                        </div>
                    </Col>
                )}
            </Row>

            {/* Modal annulation */}
            <Modal show={showAnnulModal} onHide={() => setShowAnnulModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="fs-6">Annuler la facture</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Alert variant="warning" className="small">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        Cette action est irréversible. La facture sera marquée comme annulée.
                    </Alert>
                    <Form.Label className="small fw-semibold">Motif d'annulation <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={3}
                        value={motifAnnul}
                        onChange={e => setMotifAnnul(e.target.value)}
                        placeholder="Précisez le motif..."
                    />
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" size="sm" onClick={() => setShowAnnulModal(false)}>Fermer</Button>
                    <Button variant="danger" size="sm" onClick={handleAnnuler} disabled={saving || !motifAnnul.trim()}>
                        {saving ? <Spinner size="sm" className="me-1" /> : <i className="bi bi-x-octagon me-1"></i>}
                        Confirmer l'annulation
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
