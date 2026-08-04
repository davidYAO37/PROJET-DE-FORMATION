import React, { useEffect, useState } from 'react';
import { Modal, Tabs, Tab, Button, Spinner, Alert, Table, Badge } from 'react-bootstrap';
import { FaEdit } from 'react-icons/fa';
import type { Patient } from '@/types/patient';
import FicheConsultationUpdate from './ConsultationUpdate/FicheConsultationUpdate';

interface PatientServiceModalAccueilProps {
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
    statutPrescriptionMedecin?: number;
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
    statut: boolean;
    codePrestation: string;
    NomMed?: string;
}

export default function PatientServiceModalAccueil({ show, onHide, patientId }: PatientServiceModalAccueilProps) {
    const [activeTab, setActiveTab] = useState('consultations');
    const [patientName, setPatientName] = useState('');

    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [consultationsLoading, setConsultationsLoading] = useState(false);
    const [consultationsError, setConsultationsError] = useState('');

    const [patientData, setPatientData] = useState<Patient | null>(null);
    const [showUpdateConsultation, setShowUpdateConsultation] = useState(false);
    const [selectedConsult, setSelectedConsult] = useState<Consultation | null>(null);

    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);
    const [prescriptionsError, setPrescriptionsError] = useState('');

    const [examens, setExamens] = useState<Examen[]>([]);
    const [examensLoading, setExamensLoading] = useState(false);
    const [examensError, setExamensError] = useState('');

    useEffect(() => {
        if (!show || !patientId) return;

        const loadPatientInfo = async () => {
            try {
                const response = await fetch(`/api/patients/${patientId}`);
                if (!response.ok) throw new Error('Erreur patient');
                const data = await response.json();
                setPatientName(`${data.Nom || ''} ${data.Prenoms || ''}`.trim());
                setPatientData(data);
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
        } catch (error) {
            console.error('Erreur consultations:', error);
            setConsultationsError('Impossible de charger les consultations.');
            setConsultations([]);
        } finally {
            setConsultationsLoading(false);
        }
    };

    const loadPrescriptions = async () => {
        if (!patientId) return;
        setPrescriptionsLoading(true);
        setPrescriptionsError('');

        try {
            const response = await fetch(`/api/ListePrescription?patientId=${patientId}`);
            if (!response.ok) throw new Error('Erreur lors du chargement des prescriptions');
            const data = await response.json();
            setPrescriptions(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Erreur prescriptions:', error);
            setPrescriptionsError('Impossible de charger les prescriptions.');
            setPrescriptions([]);
        } finally {
            setPrescriptionsLoading(false);
        }
    };

    const loadExamens = async () => {
        if (!patientId) return;
        setExamensLoading(true);
        setExamensError('');

        try {
            const response = await fetch(`/api/ListeAutreActes?patientId=${patientId}`);
            if (!response.ok) throw new Error('Erreur lors du chargement des examens');
            const data = await response.json();
            setExamens(Array.isArray(data) ? data : []);
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
            case 'prescriptions':
                loadPrescriptions();
                break;
            case 'examens':
                loadExamens();
                break;
        }
    }, [activeTab, show, patientId]);

    const handleTabSelect = (tab: string | null) => {
        if (tab) setActiveTab(tab);
    };

    const handleModifierConsultation = (consultation: Consultation) => {
        if ((consultation.statutPrescriptionMedecin ?? 2) >= 3) {
            alert("⚠️ Cette consultation est déjà facturée et ne peut plus être modifiée.");
            return;
        }
        setSelectedConsult(consultation);
        setShowUpdateConsultation(true);
    };

    const handleCloseUpdateConsultation = () => {
        setShowUpdateConsultation(false);
        setSelectedConsult(null);
        loadConsultations();
    };

    return (
        <>
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
                        ) : (
                            <div className="table-responsive">
                                <Table striped bordered hover>
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Code</th>
                                            <th>Désignation</th>
                                            <th>Montant</th>
                                            <th>Médecin</th>
                                            <th>Statut</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {consultations.map((consult) => (
                                            <tr key={consult._id}>
                                                <td>{new Date(consult.Date_consulation).toLocaleDateString()}</td>
                                                <td><code>{consult.CodePrestation}</code></td>
                                                <td>{consult.designationC}</td>
                                                <td>{(consult.montantapayer ?? consult.PrixClinique ?? 0).toLocaleString()} FCFA</td>
                                                <td>{consult.Medecin || '-'}</td>
                                                <td>
                                                    {(() => {
                                                        const statut = consult.statutPrescriptionMedecin ?? 1;
                                                        if (statut >= 3) {
                                                            return <Badge bg="success">Facturé</Badge>;
                                                        }
                                                        if (statut === 2) {
                                                            return consult.StatutC
                                                                ? <Badge bg="secondary">Pas Facturé</Badge>
                                                                : <Badge bg="warning">En attente</Badge>;
                                                        }
                                                        return <Badge bg="secondary">Pas Facturé</Badge>;
                                                    })()}
                                                </td>
                                                <td>
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        disabled={(consult.statutPrescriptionMedecin ?? 2) >= 3}
                                                        onClick={() => handleModifierConsultation(consult)}
                                                        title={(consult.statutPrescriptionMedecin ?? 2) >= 3 ? "Consultation déjà facturée" : "Modifier la consultation"}
                                                    >
                                                        <span>Modifier</span> <FaEdit />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        )}
                    </Tab>
                    <Tab eventKey="prescriptions" title="Prescriptions">
                        {prescriptionsLoading ? (
                            <div className="text-center py-4">
                                <Spinner animation="border" /> Chargement des prescriptions...
                            </div>
                        ) : prescriptionsError ? (
                            <Alert variant="danger">{prescriptionsError}</Alert>
                        ) : prescriptions.length === 0 ? (
                            <Alert variant="info">Aucune prescription trouvée pour ce patient.</Alert>
                        ) : (
                            <div className="table-responsive">
                                <Table striped bordered hover>
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Code</th>
                                            <th>Désignation</th>
                                            <th>Montant</th>
                                            <th>Medecin Prescripteur</th>
                                            <th>Statut</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {prescriptions.map((presc) => (
                                            <tr key={presc._id}>
                                                <td>{new Date(presc.date).toLocaleDateString()}</td>
                                                <td><code>{presc.codePrestation}</code></td>
                                                <td>{presc.designation}</td>
                                                <td>{presc.montant.toLocaleString()} FCFA</td>
                                                <td>{presc.NomMed || '-'}</td>
                                                <td>
                                                    <Badge bg={presc.statut ? 'success' : 'warning'}>
                                                        {presc.statut ? 'Validée' : 'En attente'}
                                                    </Badge>
                                                </td>
                                                
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        )}
                    </Tab>
                    <Tab eventKey="examens" title="Examens / Hospitalisations">
                        {examensLoading ? (
                            <div className="text-center py-4">
                                <Spinner animation="border" /> Chargement des examens...
                            </div>
                        ) : examensError ? (
                            <Alert variant="danger">{examensError}</Alert>
                        ) : examens.length === 0 ? (
                            <Alert variant="info">Aucun examen d'hospitalisation trouvé pour ce patient.</Alert>
                        ) : (
                            <div className="table-responsive">
                                <Table striped bordered hover>
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Code</th>
                                            <th>Désignation</th>
                                            <th>Montant</th>
                                            <th>Medecin Prescripteur</th>
                                            <th>Statut</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {examens.map((examen) => (
                                            <tr key={examen._id}>
                                                <td>{new Date(examen.date).toLocaleDateString()}</td>
                                                <td><code>{examen.codePrestation}</code></td>
                                                <td>{examen.designationTypeActe}</td>
                                                <td>{examen.montant.toLocaleString()} FCFA</td>
                                                <td>{examen.NomMed || '-'}</td>
                                                <td>
                                                    <Badge bg={examen.statut ? 'success' : 'warning'}>
                                                        {examen.statut ? 'Validé' : 'En attente'}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        )}
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
                        case 'prescriptions':
                            loadPrescriptions();
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

        {/* Modal de modification de consultation */}
        <Modal show={showUpdateConsultation} onHide={handleCloseUpdateConsultation} size="xl" centered scrollable>
            <Modal.Header closeButton>
                <Modal.Title>
                    Modifier la consultation - {selectedConsult?.CodePrestation}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {patientData && (
                    <FicheConsultationUpdate
                        patient={patientData}
                        consultationId={selectedConsult?._id}
                        onClose={handleCloseUpdateConsultation}
                    />
                )}
            </Modal.Body>
        </Modal>
        </>
    );
}
