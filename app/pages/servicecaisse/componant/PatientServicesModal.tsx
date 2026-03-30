import React, { useEffect, useState } from 'react';
import { Modal, Tabs, Tab, Button, Spinner, Alert, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FaUser, FaStethoscope, FaPills, FaHospital, FaEye, FaPencilAlt, FaFileContract, FaReceipt } from 'react-icons/fa';
import RecuConsultationPrint from '@/app/pages/recusacte/RecuConsultationPrint';
import FicheConsultationUpdateCaisse from './factureAttenteConsult/FicheConsultationUpdateCaisse';
import PharmacieCaisseModal from './PharmacieCaisse/PharmacieCaisseModal';
import ListeFactureModal from './PharmacieCaisse/ListeFacturePescriptionModal';
import ExamenHospitalisationModalCaisse from './FactureExamHospit/ExamenHospitModalCaisse';
import ListeFactureExamenModal from './FactureExamHospit/ListeFactureModal';

interface PatientServicesModalProps {
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
    IdPatient?: string;
}

interface Prescription {
    _id: string;
    designation: string;
    montant: number;
    date: string | Date;
    statut: boolean;
    patientId: string;
    codePrestation: string;
    code: string; // Ajout du champ code pour compatibilité
    designationTypeActe: string;
    dateDebut?: string | Date;
    dateFin?: string | Date;
    remarques?: string;
}

interface Prestation {
    _id: string;
    designation: string;
    montant: number;
    date: string;
    statut: string;
    codePrestation: string;
    Entrele?: string | Date;
    SortieLe?: string | Date;
    Rclinique?: string;
}

export default function PatientServicesModal({ show, onHide, patientId }: PatientServicesModalProps) {
    const [activeTab, setActiveTab] = useState('consultations');
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    
    // États pour les consultations
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [consultationsLoading, setConsultationsLoading] = useState(false);
    const [consultationsError, setConsultationsError] = useState('');
    const [selectedConsult, setSelectedConsult] = useState<Consultation | null>(null);
    const [showRecuModal, setShowRecuModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    
    // États pour les prescriptions
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);
    const [prescriptionsError, setPrescriptionsError] = useState('');
    const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
    const [showFactureModal, setShowFactureModal] = useState(false);
    const [showListeFactureModal, setShowListeFactureModal] = useState(false);
    const [prescriptionModalKey, setPrescriptionModalKey] = useState(0);
    
    // États pour les prestations
    const [prestations, setPrestations] = useState<Prestation[]>([]);
    const [prestationsLoading, setPrestationsLoading] = useState(false);
    const [prestationsError, setPrestationsError] = useState('');
    const [selectedPrestation, setSelectedPrestation] = useState<Prestation | null>(null);
    const [showPrestationFactureModal, setShowPrestationFactureModal] = useState(false);
    const [showPrestationListeFactureModal, setShowPrestationListeFactureModal] = useState(false);
    const [prestationModalKey, setPrestationModalKey] = useState(0);

    // Charger les informations du patient
    useEffect(() => {
        if (!show || !patientId) {
            setSelectedPatient(null);
            return;
        }

        const loadPatient = async () => {
            try {
                const response = await fetch(`/api/patients/${patientId}`);
                if (response.ok) {
                    const data = await response.json();
                    setSelectedPatient(data);
                }
            } catch (error) {
                console.error('Erreur chargement patient:', error);
            }
        };

        loadPatient();
    }, [show, patientId]);

    // Charger les consultations
    const loadConsultations = async () => {
        if (!patientId) return;
        
        setConsultationsLoading(true);
        setConsultationsError('');
        
        try {
            const response = await fetch(`/api/consultation?patientId=${patientId}`);
            if (!response.ok) {
                throw new Error('Erreur lors du chargement des consultations');
            }
            
            const data = await response.json();
            setConsultations(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Erreur consultations:', error);
            setConsultationsError('Impossible de charger les consultations');
            setConsultations([]);
        } finally {
            setConsultationsLoading(false);
        }
    };

    // Charger les prescriptions
    const loadPrescriptions = async () => {
        if (!patientId) return;
        
        setPrescriptionsLoading(true);
        setPrescriptionsError('');
        
        try {
            const response = await fetch(`/api/ListePrescription?patientId=${patientId}`);
            if (!response.ok) {
                throw new Error('Erreur lors du chargement des prescriptions');
            }
            
            const data = await response.json();
            const formattedPrescriptions = Array.isArray(data) 
                ? data.map((p: any) => ({
                    ...p,
                    code: p.codePrestation || p.CodePrestation || "", // Ajout du champ code pour compatibilité
                    date: p.date ? new Date(p.date) : new Date(),
                    dateDebut: p.dateDebut ? new Date(p.dateDebut) : null,
                    dateFin: p.dateFin ? new Date(p.dateFin) : null,
                    remarques: p.remarques || ''
                }))
                : [];
            setPrescriptions(formattedPrescriptions);
        } catch (error) {
            console.error('Erreur prescriptions:', error);
            setPrescriptionsError('Impossible de charger les prescriptions');
            setPrescriptions([]);
        } finally {
            setPrescriptionsLoading(false);
        }
    };

    // Charger les prestations
    const loadPrestations = async () => {
        if (!patientId) return;
        
        setPrestationsLoading(true);
        setPrestationsError('');
        
        try {
            const response = await fetch(`/api/ListeAutreActes?patientId=${patientId}`);
            if (!response.ok) {
                throw new Error('Erreur lors du chargement des prestations');
            }
            
            const data = await response.json();
            const formattedPrestations = Array.isArray(data) 
                ? data.map((p: any) => ({
                    ...p,
                    date: p.date ? new Date(p.date) : new Date(),
                    Entrele: p.Entrele ? new Date(p.Entrele) : null,
                    SortieLe: p.SortieLe ? new Date(p.SortieLe) : null,
                    Rclinique: p.Rclinique || ''
                }))
                : [];
            setPrestations(formattedPrestations);
        } catch (error) {
            console.error('Erreur prestations:', error);
            setPrestationsError('Impossible de charger les prestations');
            setPrestations([]);
        } finally {
            setPrestationsLoading(false);
        }
    };

    // Fonctions de gestion des actions pour les consultations
    const handleVoirRecu = (consultation: Consultation) => {
        setSelectedConsult(consultation);
        setShowRecuModal(true);
    };

    const handleModifierConsultation = (consult: Consultation) => {
        if (consult.StatutC) {
            alert("⚠️ Cette consultation est déjà validée et ne peut plus être facturée.");
            return;
        }
        
        // Debug pour vérifier les données
        console.log("Consultation sélectionnée:", consult);
        console.log("CodePrestation:", consult.CodePrestation);
        
        setSelectedConsult(consult);
        setShowUpdateModal(true);
    };

    const handleCloseUpdateModal = () => {
        setShowUpdateModal(false);
        setSelectedConsult(null);
        // Recharger les consultations après modification
        if (patientId) {
            loadConsultations();
        }
    };

    // Fonctions de gestion des actions pour les prescriptions
    const handleFacturerPrescription = (prescription: Prescription) => {
        if (prescription.statut) {
            alert("⚠️ Cette prescription est déjà validée et ne peut plus être facturée.");
            return;
        }
        
        // Debug pour vérifier les données
        console.log("Prescription sélectionnée:", prescription);
        console.log("CodePrestation:", prescription.codePrestation);
        
        setSelectedPrescription(prescription);
        setShowFactureModal(true);
    };

    const handleAfficherFactures = (prescription: Prescription) => {
        setSelectedPrescription(prescription);
        setShowListeFactureModal(true);
    };

    const handleFactureSuccess = () => {
        // Recharger les prescriptions après facturation réussie
        if (patientId) {
            loadPrescriptions();
        }
        setShowFactureModal(false);
        setPrescriptionModalKey(prev => prev + 1); // Forcer le rechargement du modal
    };

    // Fonctions de gestion des actions pour les prestations
    const handleFacturerPrestation = (prestation: Prestation) => {
        if (prestation.statut === 'Validé') {
            alert("⚠️ Cette prestation est déjà validée et ne peut plus être facturée.");
            return;
        }
        setSelectedPrestation(prestation);
        setShowPrestationFactureModal(true);
    };

    const handleAfficherFacturesPrestation = (prestation: Prestation) => {
        setSelectedPrestation(prestation);
        setShowPrestationListeFactureModal(true);
    };

    const handlePrestationFactureSuccess = () => {
        // Recharger les prestations après facturation réussie
        if (patientId) {
            loadPrestations();
        }
        setShowPrestationFactureModal(false);
        setPrestationModalKey(prev => prev + 1); // Forcer le rechargement du modal
    };

    // Charger les données quand on change d'onglet
    useEffect(() => {
        if (!show || !patientId) return;

        switch (activeTab) {
            case 'consultations':
                if (consultations.length === 0) loadConsultations();
                break;
            case 'prescriptions':
                if (prescriptions.length === 0) loadPrescriptions();
                break;
            case 'prestations':
                if (prestations.length === 0) loadPrestations();
                break;
        }
    }, [activeTab, show, patientId]);

    const handleTabSelect = (tab: string | null) => {
        if (tab) setActiveTab(tab);
    };

    return (
        <Modal show={show} onHide={onHide} size="xl" centered scrollable>
            <Modal.Header closeButton className="bg-primary text-white">
                <Modal.Title className="d-flex align-items-center gap-2">
                    <FaUser />
                    Services du patient : {selectedPatient ? `${selectedPatient.Nom} ${selectedPatient.Prenoms}` : 'Chargement...'}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <Tabs
                    activeKey={activeTab}
                    onSelect={handleTabSelect}
                    className="mb-4"
                >
                    <Tab 
                        eventKey="consultations" 
                        title={
                            <span className="d-flex align-items-center gap-2">
                                <FaStethoscope />
                                Consultations
                            </span>
                        }
                    >
                        {consultationsLoading ? (
                            <div className="text-center py-4">
                                <Spinner animation="border" className="me-2" />
                                Chargement des consultations...
                            </div>
                        ) : consultationsError ? (
                            <Alert variant="danger">{consultationsError}</Alert>
                        ) : consultations.length === 0 ? (
                            <Alert variant="info">Aucune consultation trouvée pour ce patient.</Alert>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Code</th>
                                            <th>Désignation</th>
                                            <th>Montant</th>
                                            <th>Date</th>
                                            <th>Ajouté par</th>
                                            <th>Médecin</th>
                                            <th>Statut</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {consultations.map((consult) => (
                                            <tr key={consult._id}>
                                                <td><code>{consult.CodePrestation}</code></td>
                                                <td>{consult.designationC}</td>
                                                <td>{consult.montantapayer || consult.PrixClinique || 0} FCFA</td>
                                                <td>{new Date(consult.Date_consulation).toLocaleDateString()}</td>
                                                <td>{consult.Recupar || '-'}</td>
                                                <td>{consult.Medecin || '-'}</td>
                                                <td>
                                                    <span 
                                                        style={{ 
                                                            fontSize: '0.75rem', 
                                                            padding: '0.25rem 0.5rem',
                                                            backgroundColor: consult.StatutC ? '#198754' : '#ffc107',
                                                            color: 'white',
                                                            borderRadius: '0.375rem',
                                                            display: 'inline-block',
                                                            fontWeight: 500
                                                        }}
                                                    >
                                                        {consult.StatutC ? (
                                                            <>
                                                                <i className="bi bi-check-circle-fill me-1"></i>
                                                                Facturée
                                                            </>
                                                        ) : (
                                                            <>
                                                                <i className="bi bi-clock-fill me-1"></i>
                                                                En attente
                                                            </>
                                                        )}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="d-flex gap-1 justify-content-center">
                                                        <Button
                                                            size="sm"
                                                            variant="outline-primary"
                                                            onClick={() => handleVoirRecu(consult)}
                                                            title="Voir le reçu"
                                                        >
                                                            <FaEye />
                                                        </Button>
                                                        {consult.StatutC ? (
                                                            <OverlayTrigger
                                                                placement="top"
                                                                overlay={<Tooltip>Cette consultation est validée et ne peut plus être modifiée</Tooltip>}
                                                            >
                                                                <span className="d-inline-block">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline-secondary"
                                                                        disabled
                                                                        style={{ pointerEvents: 'none' }}
                                                                    >
                                                                        <FaPencilAlt />
                                                                    </Button>
                                                                </span>
                                                            </OverlayTrigger>
                                                        ) : (
                                                            <Button
                                                                size="sm"
                                                                variant="outline-warning"
                                                                onClick={() => handleModifierConsultation(consult)}
                                                                title="Facturer la consultation"
                                                            >
                                                                <FaPencilAlt />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Tab>

                    <Tab 
                        eventKey="prescriptions" 
                        title={
                            <span className="d-flex align-items-center gap-2">
                                <FaPills />
                                Prescriptions
                            </span>
                        }
                    >
                        {prescriptionsLoading ? (
                            <div className="text-center py-4">
                                <Spinner animation="border" className="me-2" />
                                Chargement des prescriptions...
                            </div>
                        ) : prescriptionsError ? (
                            <Alert variant="danger">{prescriptionsError}</Alert>
                        ) : prescriptions.length === 0 ? (
                            <Alert variant="info">Aucune prescription trouvée pour ce patient.</Alert>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Date</th>
                                            <th>Code</th>
                                            <th>Désignation</th>
                                            <th>Montant</th>
                                            <th>Statut</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {prescriptions.map((presc) => (
                                            <tr key={presc._id}>
                                                <td>{new Date(presc.date).toLocaleDateString()}</td>
                                                <td><code>{presc.codePrestation}</code></td>
                                                <td>{presc.designation}</td>
                                                <td>{presc.montant.toLocaleString()} FCFA</td>
                                                <td>
                                                    <span 
                                                        style={{ 
                                                            fontSize: '0.75rem', 
                                                            padding: '0.25rem 0.5rem',
                                                            backgroundColor: presc.statut ? '#198754' : '#ffc107',
                                                            color: 'white',
                                                            borderRadius: '0.375rem',
                                                            display: 'inline-block',
                                                            fontWeight: 500
                                                        }}
                                                    >
                                                        {presc.statut ? (
                                                            <>
                                                                <i className="bi bi-check-circle-fill me-1"></i>
                                                                Validé
                                                            </>
                                                        ) : (
                                                            <>
                                                                <i className="bi bi-clock-fill me-1"></i>
                                                                En attente
                                                            </>
                                                        )}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="d-flex gap-1 justify-content-center">
                                                        <Button
                                                            variant="outline-warning"
                                                            size="sm"
                                                            disabled={presc.statut}
                                                            onClick={() => handleFacturerPrescription(presc)}
                                                            title="Facturer La Prescription"
                                                        >
                                                            <FaFileContract />
                                                        </Button>
                                                        <Button
                                                            variant="outline-info"
                                                            size="sm"
                                                            onClick={() => handleAfficherFactures(presc)}
                                                            title="Liste des factures"
                                                        >
                                                            <FaReceipt />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Tab>

                    <Tab 
                        eventKey="prestations" 
                        title={
                            <span className="d-flex align-items-center gap-2">
                                <FaHospital />
                                Prestations
                            </span>
                        }
                    >
                        {prestationsLoading ? (
                            <div className="text-center py-4">
                                <Spinner animation="border" className="me-2" />
                                Chargement des prestations...
                            </div>
                        ) : prestationsError ? (
                            <Alert variant="danger">{prestationsError}</Alert>
                        ) : prestations.length === 0 ? (
                            <Alert variant="info">Aucune prestation trouvée pour ce patient.</Alert>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Date</th>
                                            <th>Code</th>
                                            <th>Désignation</th>
                                            <th>Montant</th>
                                            <th>Statut</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {prestations.map((prest) => (
                                            <tr key={prest._id}>
                                                <td>{new Date(prest.date).toLocaleDateString()}</td>
                                                <td><code>{prest.codePrestation}</code></td>
                                                <td>{prest.designation}</td>
                                                <td>{prest.montant.toLocaleString()} FCFA</td>
                                                <td>
                                                    <span 
                                                        style={{ 
                                                            fontSize: '0.75rem', 
                                                            padding: '0.25rem 0.5rem',
                                                            backgroundColor: prest.statut === 'Validé' ? '#198754' : '#ffc107',
                                                            color: 'white',
                                                            borderRadius: '0.375rem',
                                                            display: 'inline-block',
                                                            fontWeight: 500
                                                        }}
                                                    >
                                                        {prest.statut === 'Validé' ? (
                                                            <>
                                                                <i className="bi bi-check-circle-fill me-1"></i>
                                                                Validé
                                                            </>
                                                        ) : (
                                                            <>
                                                                <i className="bi bi-clock-fill me-1"></i>
                                                                En attente
                                                            </>
                                                        )}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="d-flex gap-1 justify-content-center">
                                                        <Button
                                                            variant="outline-warning"
                                                            size="sm"
                                                            disabled={prest.statut === 'Validé'}
                                                            onClick={() => handleFacturerPrestation(prest)}
                                                            title="Facturer La Prestation"
                                                        >
                                                            <FaFileContract />
                                                        </Button>
                                                        <Button
                                                            variant="outline-info"
                                                            size="sm"
                                                            onClick={() => handleAfficherFacturesPrestation(prest)}
                                                            title="Liste des factures"
                                                        >
                                                            <FaReceipt />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Tab>
                </Tabs>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Fermer
                </Button>
                <Button variant="primary" onClick={() => {
                    // Recharger l'onglet actif
                    switch (activeTab) {
                        case 'consultations':
                            loadConsultations();
                            break;
                        case 'prescriptions':
                            loadPrescriptions();
                            break;
                        case 'prestations':
                            loadPrestations();
                            break;
                    }
                }}>
                    Actualiser
                </Button>
            </Modal.Footer>

            {/* Modal pour voir le reçu de consultation - VRAI COMPOSANT */}
            <Modal show={showRecuModal} onHide={() => setShowRecuModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Reçu de consultation</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedConsult && (
                        <RecuConsultationPrint consultation={selectedConsult} />
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowRecuModal(false)}>
                        Fermer
                    </Button>                    
                </Modal.Footer>
            </Modal>

            {/* Modal pour facturer la consultation - VRAI COMPOSANT (comme dans listefactures) */}
            <Modal
                show={showUpdateModal}
                onHide={handleCloseUpdateModal}
                size="xl"
                backdrop="static"
            >
                <Modal.Body className="p-0">
                    <FicheConsultationUpdateCaisse
                        patient={selectedPatient || null}
                        onClose={handleCloseUpdateModal}
                        consultationId={selectedConsult?._id || ''}
                    />
                </Modal.Body>
            </Modal>

            {/* Modal pour facturer la prescription - VRAI COMPOSANT */}
            <PharmacieCaisseModal
                show={showFactureModal}
                onHide={() => {
                    setShowFactureModal(false);
                    handleFactureSuccess();
                }}
                codePrestation={selectedPrescription?.codePrestation || selectedPrescription?.code || ""}
                key={prescriptionModalKey}
            />

            {/* Modal pour voir les factures de prescription - VRAI COMPOSANT */}
            <ListeFactureModal
                show={showListeFactureModal}
                onHide={() => setShowListeFactureModal(false)}
                IDPRESCRIPTION={selectedPrescription?._id || ''}
                key={`liste-facture-prescription-${selectedPrescription?._id || 'none'}`}
            />

            {/* Modal pour facturer la prestation - VRAI COMPOSANT */}
            <ExamenHospitalisationModalCaisse
                show={showPrestationFactureModal}
                onHide={() => setShowPrestationFactureModal(false)}
                onSuccess={handlePrestationFactureSuccess}
                CodePrestation={selectedPrestation?.codePrestation}
                Designationtypeacte={selectedPrestation?.designation}
                PatientP={selectedPatient ? `${selectedPatient.Nom} ${selectedPatient.Prenoms}` : ''}
                examenHospitId={selectedPrestation?._id}
                dateEntree={selectedPrestation?.Entrele ? new Date(selectedPrestation.Entrele).toISOString() : null}
                dateSortie={selectedPrestation?.SortieLe ? new Date(selectedPrestation.SortieLe).toISOString() : null}
                renseignementclinique={selectedPrestation?.Rclinique}
                key={`prestation-${prestationModalKey}`}
            />

            {/* Modal pour voir les factures de prestation - VRAI COMPOSANT */}
            <ListeFactureExamenModal
                show={showPrestationListeFactureModal}
                onHide={() => setShowPrestationListeFactureModal(false)}
                idHospitalisation={selectedPrestation?._id || ''}
                key={`liste-facture-prestation-${selectedPrestation?._id || 'none'}`}
            />
        </Modal>
    );
}
