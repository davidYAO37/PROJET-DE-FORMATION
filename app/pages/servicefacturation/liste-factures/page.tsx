'use client';
import React, { useState, useCallback } from 'react';
import { Card, Row, Col, Button, Form, Table, Spinner, Alert, Badge } from 'react-bootstrap';
import { useRouter } from 'next/navigation';

interface Facture {
    _id: string;
    CodePrestation: string;
    PatientP: string;
    NomMed: string;
    DateFacturation?: string;
    DatePres?: string;
    Designationtypeacte: string;
    typefacture: string;
    Montanttotal: number;
    PartAssuranceP: number;
    TotalapayerPatient: number;
    TotalPaye: number;
    Restapayer: number;
    Assurance: string;
    Taux: string;
    Numfacture: string;
    Modepaiement: string;
    StatutFacture: boolean;
    factureannule: boolean;
    Ordonnerlannulation: boolean;
    StatutPaiement: string;
    FacturePar: string;
    SOCIETE_PATIENT: string;
}

const fmt = (n: number) => (n || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 });
const today = () => new Date().toISOString().split('T')[0];
const firstOfMonth = () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
};

const TYPE_FACTURE_OPTIONS = [
    { value: '', label: 'Tous les types' },
    { value: 'CONSULTATION', label: 'Consultation' },
    { value: 'HOSPITALISATION', label: 'Hospitalisation' },
    { value: 'PHARMACIE', label: 'Pharmacie' },
    { value: 'EXAMEN', label: 'Examen' },
    { value: 'ACTE CLINIQUE', label: 'Acte clinique' },
];

const STATUT_OPTIONS = [
    { value: '', label: 'Tous les statuts' },
    { value: 'payee', label: 'Payée' },
    { value: 'nonpayee', label: 'Non payée' },
    { value: 'annulee', label: 'Annulée' },
];

export default function ListeFacturesPage() {
    const router = useRouter();
    const [patient, setPatient] = useState('');
    const [codePrestation, setCodePrestation] = useState('');
    const [dateDebut, setDateDebut] = useState(firstOfMonth());
    const [dateFin, setDateFin] = useState(today());
    const [typefacture, setTypefacture] = useState('');
    const [statut, setStatut] = useState('');
    const [factures, setFactures] = useState<Facture[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

    const handleSearch = useCallback(async (p = 1) => {
        setLoading(true);
        setMessage(null);
        try {
            const params = new URLSearchParams({
                patient,
                codePrestation,
                dateDebut,
                dateFin,
                typefacture,
                statut,
                page: String(p),
                limit: '50',
            });
            const res = await fetch(`/api/facturation/search?${params}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Erreur serveur');
            setFactures(data.data || []);
            setTotal(data.total || 0);
            setPage(data.page || 1);
            setTotalPages(data.totalPages || 1);
            setSearched(true);
        } catch (e: any) {
            setMessage({ type: 'danger', text: e.message });
        } finally {
            setLoading(false);
        }
    }, [patient, codePrestation, dateDebut, dateFin, typefacture, statut]);

    const handleReset = () => {
        setPatient('');
        setCodePrestation('');
        setDateDebut(firstOfMonth());
        setDateFin(today());
        setTypefacture('');
        setStatut('');
        setFactures([]);
        setSearched(false);
        setTotal(0);
    };

    const statutBadge = (f: Facture) => {
        if (f.factureannule) return <Badge bg="dark">Annulée</Badge>;
        if (f.Ordonnerlannulation) return <Badge bg="warning" text="dark">Annulation ordonnée</Badge>;
        if (f.StatutFacture) return <Badge bg="success">Payée</Badge>;
        if (f.Restapayer > 0) return <Badge bg="danger">Non soldée</Badge>;
        return <Badge bg="secondary">{f.StatutPaiement || 'En cours'}</Badge>;
    };

    const typeBadge = (type: string) => {
        const colors: Record<string, string> = {
            CONSULTATION: 'primary',
            HOSPITALISATION: 'info',
            PHARMACIE: 'success',
            EXAMEN: 'warning',
            'ACTE CLINIQUE': 'secondary',
        };
        return <Badge bg={colors[type] || 'light'} text={colors[type] ? undefined : 'dark'}>{type || '—'}</Badge>;
    };

    const totalMontant = factures.reduce((s, f) => s + (f.Montanttotal || 0), 0);
    const totalAssurance = factures.reduce((s, f) => s + (f.PartAssuranceP || 0), 0);
    const totalPatient = factures.reduce((s, f) => s + (f.TotalapayerPatient || 0), 0);
    const totalPaye = factures.reduce((s, f) => s + (f.TotalPaye || 0), 0);
    const totalReste = factures.reduce((s, f) => s + (f.Restapayer || 0), 0);

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
                    <div style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 800 }}>Liste des Factures</div>
                </div>
                <i className="bi bi-receipt-cutoff" style={{ fontSize: '2rem', color: 'rgba(255,255,255,0.2)' }}></i>
            </div>

            {message && <Alert variant={message.type} dismissible onClose={() => setMessage(null)}>{message.text}</Alert>}

            {/* Filtres */}
            <Card className="mb-3 shadow-sm">
                <Card.Header className="bg-white fw-bold py-2">
                    <i className="bi bi-search me-2 text-primary"></i>Recherche
                </Card.Header>
                <Card.Body className="pb-2">
                    <Row className="g-2">
                        <Col md={3}>
                            <Form.Label className="small fw-semibold mb-1">Patient</Form.Label>
                            <Form.Control size="sm" placeholder="Nom du patient..." value={patient} onChange={e => setPatient(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSearch(1)} />
                        </Col>
                        <Col md={2}>
                            <Form.Label className="small fw-semibold mb-1">Code prestation</Form.Label>
                            <Form.Control size="sm" placeholder="Ex: AB001" value={codePrestation} onChange={e => setCodePrestation(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSearch(1)} />
                        </Col>
                        <Col md={2}>
                            <Form.Label className="small fw-semibold mb-1">Date début</Form.Label>
                            <Form.Control size="sm" type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} />
                        </Col>
                        <Col md={2}>
                            <Form.Label className="small fw-semibold mb-1">Date fin</Form.Label>
                            <Form.Control size="sm" type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} />
                        </Col>
                        <Col md={2}>
                            <Form.Label className="small fw-semibold mb-1">Type</Form.Label>
                            <Form.Select size="sm" value={typefacture} onChange={e => setTypefacture(e.target.value)}>
                                {TYPE_FACTURE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </Form.Select>
                        </Col>
                        <Col md={1}>
                            <Form.Label className="small fw-semibold mb-1">Statut</Form.Label>
                            <Form.Select size="sm" value={statut} onChange={e => setStatut(e.target.value)}>
                                {STATUT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </Form.Select>
                        </Col>
                    </Row>
                    <div className="d-flex gap-2 mt-2">
                        <Button size="sm" variant="primary" onClick={() => handleSearch(1)} disabled={loading}>
                            {loading ? <Spinner size="sm" className="me-1" /> : <i className="bi bi-search me-1"></i>}
                            Rechercher
                        </Button>
                        <Button size="sm" variant="outline-secondary" onClick={handleReset}>
                            <i className="bi bi-x-circle me-1"></i>Réinitialiser
                        </Button>
                    </div>
                </Card.Body>
            </Card>

            {/* Résultats */}
            {searched && (
                <>
                    {/* Totaux */}
                    {factures.length > 0 && (
                        <Row className="g-2 mb-3">
                            {[
                                { label: 'Total factures', value: total, color: '#1976d2', icon: 'bi-receipt' },
                                { label: 'Montant total', value: fmt(totalMontant) + ' FCFA', color: '#388e3c', icon: 'bi-currency-exchange' },
                                { label: 'Part assurance', value: fmt(totalAssurance) + ' FCFA', color: '#f57c00', icon: 'bi-shield-fill-check' },
                                { label: 'Part patient', value: fmt(totalPatient) + ' FCFA', color: '#7b1fa2', icon: 'bi-person-fill' },
                                { label: 'Total payé', value: fmt(totalPaye) + ' FCFA', color: '#00796b', icon: 'bi-cash-stack' },
                                { label: 'Reste à payer', value: fmt(totalReste) + ' FCFA', color: '#c62828', icon: 'bi-exclamation-triangle-fill' },
                            ].map((stat) => (
                                <Col key={stat.label} xs={6} md={2}>
                                    <div style={{ background: '#fff', borderRadius: 8, padding: '10px 14px', borderLeft: `4px solid ${stat.color}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#78909c', textTransform: 'uppercase' }}>{stat.label}</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                                    </div>
                                </Col>
                            ))}
                        </Row>
                    )}

                    <Card className="shadow-sm">
                        <Card.Header className="bg-white d-flex justify-content-between align-items-center py-2">
                            <span className="fw-bold small">
                                <i className="bi bi-list-ul me-2 text-primary"></i>
                                {total} facture(s) trouvée(s)
                            </span>
                            {totalPages > 1 && (
                                <div className="d-flex gap-1 align-items-center">
                                    <Button size="sm" variant="outline-primary" disabled={page <= 1} onClick={() => handleSearch(page - 1)}>
                                        <i className="bi bi-chevron-left"></i>
                                    </Button>
                                    <span className="small mx-1">Page {page}/{totalPages}</span>
                                    <Button size="sm" variant="outline-primary" disabled={page >= totalPages} onClick={() => handleSearch(page + 1)}>
                                        <i className="bi bi-chevron-right"></i>
                                    </Button>
                                </div>
                            )}
                        </Card.Header>
                        <Card.Body className="p-0">
                            {factures.length === 0 ? (
                                <div className="text-center text-muted py-5">
                                    <i className="bi bi-inbox" style={{ fontSize: '2rem' }}></i>
                                    <div className="mt-2">Aucune facture trouvée</div>
                                </div>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <Table hover size="sm" className="mb-0" style={{ fontSize: '0.78rem' }}>
                                        <thead className="table-light">
                                            <tr>
                                                <th>N° Facture</th>
                                                <th>Code</th>
                                                <th>Date</th>
                                                <th>Patient</th>
                                                <th>Type</th>
                                                <th>Acte</th>
                                                <th>Assurance</th>
                                                <th className="text-end">Montant</th>
                                                <th className="text-end">Part Ass.</th>
                                                <th className="text-end">Part Pat.</th>
                                                <th className="text-end">Payé</th>
                                                <th className="text-end">Reste</th>
                                                <th>Statut</th>
                                                <th>Saisi par</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {factures.map((f) => (
                                                <tr key={f._id} style={{ cursor: 'pointer' }}>
                                                    <td><span className="fw-semibold text-primary">{f.Numfacture || '—'}</span></td>
                                                    <td><code style={{ fontSize: '0.75rem' }}>{f.CodePrestation}</code></td>
                                                    <td>{f.DateFacturation ? new Date(f.DateFacturation).toLocaleDateString('fr-FR') : (f.DatePres ? new Date(f.DatePres).toLocaleDateString('fr-FR') : '—')}</td>
                                                    <td style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.PatientP || '—'}</td>
                                                    <td>{typeBadge(f.typefacture)}</td>
                                                    <td style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.Designationtypeacte || '—'}</td>
                                                    <td style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {f.Assurance || '—'}
                                                        {f.Taux ? <span className="text-muted ms-1">({f.Taux}%)</span> : null}
                                                    </td>
                                                    <td className="text-end fw-semibold">{fmt(f.Montanttotal)}</td>
                                                    <td className="text-end">{fmt(f.PartAssuranceP)}</td>
                                                    <td className="text-end">{fmt(f.TotalapayerPatient)}</td>
                                                    <td className="text-end text-success fw-semibold">{fmt(f.TotalPaye)}</td>
                                                    <td className="text-end" style={{ color: f.Restapayer > 0 ? '#c62828' : '#388e3c', fontWeight: 600 }}>{fmt(f.Restapayer)}</td>
                                                    <td>{statutBadge(f)}</td>
                                                    <td style={{ maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.7rem', color: '#78909c' }}>{f.FacturePar || '—'}</td>
                                                    <td>
                                                        <Button
                                                            size="sm"
                                                            variant="outline-primary"
                                                            style={{ padding: '1px 6px', fontSize: '0.7rem' }}
                                                            onClick={() => router.push(`/pages/servicefacturation/detail-facture/${f._id}`)}
                                                            title="Voir le détail"
                                                        >
                                                            <i className="bi bi-eye"></i>
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </>
            )}
        </div>
    );
}
