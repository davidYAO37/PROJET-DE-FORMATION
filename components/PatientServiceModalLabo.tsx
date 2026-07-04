import React, { useEffect, useState } from 'react';
import { Modal, Tabs, Tab, Button, Spinner, Alert, Table, Badge, ButtonGroup, Pagination, Form } from 'react-bootstrap';
import { FaPrint } from 'react-icons/fa';

interface PatientServiceModalLaboProps {
    show: boolean;
    onHide: () => void;
    patientId: string;
}

interface Consultation {
    _id: string;
    designationC: string;
    montantapayer?: number;
    PrixClinique?: number;
    Date_consulation: string;
    Recupar: string;
    CodePrestation: string;
    Medecin?: string;
    StatutC?: boolean;
}

interface Prescription {
    _id: string;
    designation: string;
    montant: number;
    date: string | Date;
    statut: boolean;
    codePrestation: string;
    Numfacture?: string;
    NomMed?: string;
}

interface Examen {
    _id: string;
    designationTypeActe: string;
    montant: number;
    date: string;
    statut: string;
    StatutLaboratoire: number;
    codePrestation: string;
    NomMed?: string;
}

export default function PatientServiceModalLabo({ show, onHide, patientId }: PatientServiceModalLaboProps) {
    const [activeTab, setActiveTab] = useState('consultations');
    const [patientName, setPatientName] = useState('');

    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [consultationsLoading, setConsultationsLoading] = useState(false);
    const [consultationsError, setConsultationsError] = useState('');


    const [examens, setExamens] = useState<Examen[]>([]);
    const [examensLoading, setExamensLoading] = useState(false);
    const [examensError, setExamensError] = useState('');

    // Pagination
    const ITEMS_PER_PAGE = 10;
    const [consultPage, setConsultPage] = useState(1);
    const [examenPage, setExamenPage] = useState(1);

    useEffect(() => {
        if (!show || !patientId) return;

        const loadPatientInfo = async () => {
            try {
                const response = await fetch(`/api/patients/${patientId}`);
                if (!response.ok) throw new Error('Erreur patient');
                const data = await response.json();
                setPatientName(`${data.Nom || ''} ${data.Prenoms || ''}`.trim());
            } catch (error) {
                console.error('Erreur chargement patient:', error);
                setPatientName('Patient');
            }
        };

        loadPatientInfo();
    }, [show, patientId]);

    const loadConsultations = async () => {
        if (!patientId) return;
        setConsultationsLoading(true);
        setConsultationsError('');

        try {
            const response = await fetch(`/api/consultation?patientId=${patientId}`);
            if (!response.ok) throw new Error('Erreur lors du chargement des consultations');
            const data = await response.json();
            setConsultations(Array.isArray(data) ? data : []);
            setConsultPage(1);
        } catch (error) {
            console.error('Erreur consultations:', error);
            setConsultationsError('Impossible de charger les consultations.');
            setConsultations([]);
        } finally {
            setConsultationsLoading(false);
        }
    };

  

    const loadExamens = async () => {
        if (!patientId) return;
        setExamensLoading(true);
        setExamensError('');

        try {
            const response = await fetch(`/api/ListeAutreActes?patientId=${patientId}&typeActe=EXAMEN BIOLOGIQUE`);
            if (!response.ok) throw new Error('Erreur lors du chargement des examens');
            const data = await response.json();
            setExamens(Array.isArray(data) ? data : []);
            setExamenPage(1);
        } catch (error) {
            console.error('Erreur examens:', error);
            setExamensError('Impossible de charger les examens.');
            setExamens([]);
        } finally {
            setExamensLoading(false);
        }
    };

    useEffect(() => {
        if (!show || !patientId) return;
        switch (activeTab) {
            case 'consultations':
                loadConsultations();
                break;
            case 'examens':
                loadExamens();
                break;
        }
    }, [activeTab, show, patientId]);

    const handleTabSelect = (tab: string | null) => {
        if (tab) setActiveTab(tab);
    };

    return (
        <Modal show={show} onHide={onHide} size="xl" centered scrollable>
            <Modal.Header closeButton className="bg-primary text-white">
                <Modal.Title>Service Patient : {patientName || 'Chargement...'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Tabs activeKey={activeTab} onSelect={handleTabSelect} className="mb-4">
                    <Tab eventKey="consultations" title="Consultations">
                        {consultationsLoading ? (
                            <div className="text-center py-4">
                                <Spinner animation="border" /> Chargement des consultations...
                            </div>
                        ) : consultationsError ? (
                            <Alert variant="danger">{consultationsError}</Alert>
                        ) : consultations.length === 0 ? (
                            <Alert variant="info">Aucune consultation trouvée pour ce patient.</Alert>
                        ) : (() => {
                            const totalConsultPages = Math.ceil(consultations.length / ITEMS_PER_PAGE);
                            const paginatedConsults = consultations.slice((consultPage - 1) * ITEMS_PER_PAGE, consultPage * ITEMS_PER_PAGE);
                            return (
                            <>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <small className="text-muted">{consultations.length} consultation(s) &mdash; Page {consultPage}/{totalConsultPages || 1}</small>
                            </div>
                            <div className="table-responsive">
                                <Table striped bordered hover size="sm">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Code</th>
                                            <th>Désignation</th>
                                            <th>Montant</th>
                                            <th>Médecin</th>
                                            <th>Statut</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedConsults.map((consult) => (
                                            <tr key={consult._id}>
                                                <td>{new Date(consult.Date_consulation).toLocaleDateString()}</td>
                                                <td><code>{consult.CodePrestation}</code></td>
                                                <td>{consult.designationC}</td>
                                                <td>{(consult.montantapayer ?? consult.PrixClinique ?? 0).toLocaleString()} FCFA</td>
                                                <td>{consult.Medecin || '-'}</td>
                                                <td>
                                                    <Badge bg={consult.StatutC ? 'success' : 'warning'}>
                                                        {consult.StatutC ? 'Facturée' : 'En attente'}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                            {totalConsultPages > 1 && (
                                <div className="d-flex justify-content-center">
                                    <Pagination size="sm" className="mb-0">
                                        <Pagination.First onClick={() => setConsultPage(1)} disabled={consultPage === 1} />
                                        <Pagination.Prev onClick={() => setConsultPage(p => Math.max(1, p - 1))} disabled={consultPage === 1} />
                                        {Array.from({ length: totalConsultPages }, (_, i) => i + 1)
                                            .filter(p => p === 1 || p === totalConsultPages || Math.abs(p - consultPage) <= 2)
                                            .map((p, idx, arr) => (
                                                <React.Fragment key={p}>
                                                    {idx > 0 && arr[idx - 1] !== p - 1 && <Pagination.Ellipsis disabled />}
                                                    <Pagination.Item active={p === consultPage} onClick={() => setConsultPage(p)}>{p}</Pagination.Item>
                                                </React.Fragment>
                                            ))}
                                        <Pagination.Next onClick={() => setConsultPage(p => Math.min(totalConsultPages, p + 1))} disabled={consultPage === totalConsultPages} />
                                        <Pagination.Last onClick={() => setConsultPage(totalConsultPages)} disabled={consultPage === totalConsultPages} />
                                    </Pagination>
                                </div>
                            )}
                            </>
                            );
                        })()}
                    </Tab>
                    
                    <Tab eventKey="examens" title="Examens Biologiques">
                        {examensLoading ? (
                            <div className="text-center py-4">
                                <Spinner animation="border" /> Chargement des examens...
                            </div>
                        ) : examensError ? (
                            <Alert variant="danger">{examensError}</Alert>
                        ) : examens.length === 0 ? (
                            <Alert variant="info">Aucun examen biologique trouvé pour ce patient.</Alert>
                        ) : (() => {
                            const totalExamenPages = Math.ceil(examens.length / ITEMS_PER_PAGE);
                            const paginatedExamens = examens.slice((examenPage - 1) * ITEMS_PER_PAGE, examenPage * ITEMS_PER_PAGE);
                            return (
                            <>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <small className="text-muted">{examens.length} examen(s) &mdash; Page {examenPage}/{totalExamenPages || 1}</small>
                            </div>
                            <div className="table-responsive">
                                <Table striped bordered hover size="sm">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Code</th>
                                            <th>Désignation</th>
                                            <th>Montant</th>
                                            <th>Prescripteur</th>
                                            <th>Statut Labo</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedExamens.map((examen) => (
                                            <tr key={examen._id}>
                                                <td>{new Date(examen.date).toLocaleDateString()}</td>
                                                <td><code>{examen.codePrestation}</code></td>
                                                <td>{examen.designationTypeActe}</td>
                                                <td>{examen.montant.toLocaleString()} FCFA</td>
                                                <td>{examen.NomMed || '-'}</td>
                                                <td>
                                                    <Badge bg={
                                                        examen.StatutLaboratoire === 5 ? 'info' :
                                                        examen.StatutLaboratoire === 4 ? 'success' :
                                                        examen.StatutLaboratoire === 3 ? 'primary' :
                                                        examen.StatutLaboratoire >= 1 ? 'warning' : 'secondary'
                                                    }>
                                                        {examen.StatutLaboratoire === 5 ? 'Retourné' :
                                                         examen.StatutLaboratoire === 4 ? 'Validé' :
                                                         examen.StatutLaboratoire === 3 ? 'En Saisie' :
                                                         examen.StatutLaboratoire === 2 ? 'Réceptionné' :
                                                         examen.StatutLaboratoire === 1 ? 'En cours de reception' : 'En attente de reception'}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    {examen.StatutLaboratoire >= 3 ? (
                                                        <ButtonGroup size="sm">
                                                            <Button
                                                                variant="outline-primary"
                                                                title="Imprimer avec entête"
                                                                onClick={() => window.open(`/api/laboratoire/resultat/${examen._id}/pdf?avecEntete=true`, '_blank')}
                                                            >
                                                                <FaPrint /> <small>Entête</small>
                                                            </Button>
                                                            <Button
                                                                variant="outline-secondary"
                                                                title="Imprimer sans entête"
                                                                onClick={() => window.open(`/api/laboratoire/resultat/${examen._id}/pdf?avecEntete=false`, '_blank')}
                                                            >
                                                                <FaPrint /> <small>Sans</small>
                                                            </Button>
                                                        </ButtonGroup>
                                                    ) : (
                                                        <span className="text-muted small">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                            {totalExamenPages > 1 && (
                                <div className="d-flex justify-content-center">
                                    <Pagination size="sm" className="mb-0">
                                        <Pagination.First onClick={() => setExamenPage(1)} disabled={examenPage === 1} />
                                        <Pagination.Prev onClick={() => setExamenPage(p => Math.max(1, p - 1))} disabled={examenPage === 1} />
                                        {Array.from({ length: totalExamenPages }, (_, i) => i + 1)
                                            .filter(p => p === 1 || p === totalExamenPages || Math.abs(p - examenPage) <= 2)
                                            .map((p, idx, arr) => (
                                                <React.Fragment key={p}>
                                                    {idx > 0 && arr[idx - 1] !== p - 1 && <Pagination.Ellipsis disabled />}
                                                    <Pagination.Item active={p === examenPage} onClick={() => setExamenPage(p)}>{p}</Pagination.Item>
                                                </React.Fragment>
                                            ))}
                                        <Pagination.Next onClick={() => setExamenPage(p => Math.min(totalExamenPages, p + 1))} disabled={examenPage === totalExamenPages} />
                                        <Pagination.Last onClick={() => setExamenPage(totalExamenPages)} disabled={examenPage === totalExamenPages} />
                                    </Pagination>
                                </div>
                            )}
                            </>
                            );
                        })()}
                    </Tab>
                </Tabs>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>Fermer</Button>
                <Button variant="primary" onClick={() => {
                    switch (activeTab) {
                        case 'consultations':
                            loadConsultations();
                            break;
                        case 'examens':
                            loadExamens();
                            break;
                    }
                }}>
                    Actualiser
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
