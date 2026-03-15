import React, { useEffect, useState } from 'react';
import { Modal, Table, Button, Form, Spinner, Badge } from 'react-bootstrap';
import { FaEdit, FaEye, FaFileContract, FaFilePdf, FaList, FaReceipt } from 'react-icons/fa';
import PrescriptionModalCaisse from './PrescriptionModalCaisse';
import ListeFacturePescriptionModal from './ListeFacturePescriptionModal';


export interface Prescription {
    _id: string;
    designation: string;
    montant: number;
    date: string | Date;
    statut: boolean;
    patientId: string;
    codePrestation: string;
    designationTypeActe: string;
    dateDebut?: string | Date;
    dateFin?: string | Date;
    remarques?: string;
}

interface ListePrescriptionModalProps {
    show: boolean;
    onHide: () => void;
    patientId: string;
}

export default function ListePrescriptionModalCaisse({
    show,
    onHide,
    patientId
}: ListePrescriptionModalProps) {
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [showFactureModal, setShowFactureModal] = useState(false);
    const [showListeFactureModal, setShowListeFactureModal] = useState(false);
    const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);

    useEffect(() => {
        if (!show || !patientId) return;

        const fetchData = async () => {
            setLoading(true);
            setFetchError(null);
            try {
                // Récupérer les prescriptions du patient
                const [prescRes, patientRes] = await Promise.all([
                    fetch(`/api/ListePrescription?patientId=${patientId}`),
                    fetch(`/api/patients/${patientId}`)
                ]);

                if (!prescRes.ok) throw new Error('Erreur lors du chargement des prescriptions');
                if (!patientRes.ok) throw new Error('Erreur lors du chargement du patient');

                const prescData = await prescRes.json();
                const patientData = await patientRes.json();

                // Formater les données des prescriptions pour inclure les champs manquants
                const formattedPrescriptions = prescData.map((presc: any) => ({
                    ...presc,
                    date: presc.date ? new Date(presc.date) : new Date(),
                    dateDebut: presc.dateDebut ? new Date(presc.dateDebut) : null,
                    dateFin: presc.dateFin ? new Date(presc.dateFin) : null,
                    remarques: presc.remarques || ''
                }));

                setPrescriptions(Array.isArray(formattedPrescriptions) ? formattedPrescriptions : []);
                setSelectedPatient(patientData);
            } catch (error: any) {
                console.error('Erreur chargement prescriptions:', error);
                setFetchError(error?.message || 'Erreur inconnue');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [show, patientId]);

    const filteredPrescriptions = prescriptions.filter(prescription =>
        prescription.designation?.toLowerCase().includes(search.toLowerCase()) ||
        prescription.codePrestation?.toLowerCase().includes(search.toLowerCase()) ||
        prescription.designationTypeActe?.toLowerCase().includes(search.toLowerCase())
    );

    const handleFacturer = (prescription: Prescription) => {
        setSelectedPrescription(prescription);
        setShowFactureModal(true);
    };

    const handleAfficherFactures = (prescription: Prescription) => {
        setSelectedPrescription(prescription);
        setShowListeFactureModal(true);
    };

    const handleCloseFactureModal = () => {
        setShowFactureModal(false);
        setSelectedPrescription(null);
    };

    const handleCloseListeFactureModal = () => {
        setShowListeFactureModal(false);
        setSelectedPrescription(null);
    };

    return (
        <Modal show={show}
            onHide={onHide}
            size="xl"
            centered
            dialogClassName="modal-fullscreen-lg-down"
            style={{ maxWidth: '95vw', margin: 'auto' }}
        >   <Modal.Header closeButton className="bg-primary text-white">
                <Modal.Title>
                    Prescriptions du patient : {selectedPatient ? `${selectedPatient.Nom} ${selectedPatient.Prenoms}` : patientId}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <Form.Control
                    type="text"
                    placeholder="Rechercher par désignation, code ou type d'acte..."
                    className="mb-3"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                {loading ? (
                    <div className="text-center my-4">
                        <Spinner animation="border" variant="primary" />
                        <p>Chargement des prescriptions du patient...</p>
                    </div>
                ) : fetchError ? (
                    <div className="text-center my-4 text-danger">
                        <p>Erreur lors du chargement des prescriptions : {fetchError}</p>
                    </div>
                ) : filteredPrescriptions.length === 0 ? (
                    <div className="text-center my-4">
                        <p>Aucune prescription trouvée pour ce patient.</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <Table striped bordered hover>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Code Prestation</th>
                                    <th>Désignation</th>
                                    <th>Montant</th>
                                    <th>Statut</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPrescriptions.map((prescription) => (
                                    <tr key={prescription._id}>
                                        <td>{new Date(prescription.date).toLocaleDateString()}</td>
                                        <td>{prescription.codePrestation}</td>
                                        <td>{prescription.designationTypeActe}</td>
                                        <td>{prescription.montant?.toLocaleString()} FCFA</td>
                                        <td>
                                            <Badge bg={prescription.statut ? 'success' : 'warning'}>
                                                {prescription.statut ? 'Validé' : 'En attente'}
                                            </Badge>
                                        </td>
                                        <td className="text-center">
                                            <Button
                                                variant="outline-warning"
                                                size="sm"
                                                className='me-2'
                                                disabled={prescription.statut}
                                                onClick={() => handleFacturer(prescription)}
                                                title="Facturer La Prestation"                                           >
                                                <FaFileContract />
                                            </Button>
                                            <Button
                                                variant="outline-info"
                                                size="sm"
                                                onClick={() => handleAfficherFactures(prescription)}
                                                title="Liste des factures"
                                                className="ms-2"
                                            >
                                                <FaReceipt />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                )}
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Fermer
                </Button>
            </Modal.Footer>

            {/* Modal de facturation */}
            {selectedPrescription && (
                <PrescriptionModalCaisse
                    show={showFactureModal}
                    onHide={handleCloseFactureModal}
                    CodePrestation={selectedPrescription.codePrestation}
                    Designationtypeacte={selectedPrescription.designationTypeActe}
                    PatientP={selectedPatient ? `${selectedPatient.Nom} ${selectedPatient.Prenoms}` : ''}
                    prescriptionId={selectedPrescription._id}
                    dateDebut={selectedPrescription.dateDebut
                        ? new Date(selectedPrescription.dateDebut).toISOString().split('T')[0]
                        : null}
                    dateFin={selectedPrescription.dateFin
                        ? new Date(selectedPrescription.dateFin).toISOString().split('T')[0]
                        : null}
                    remarques={selectedPrescription.remarques || ''}
                />
            )}

            {/* Modal de liste des factures */}
            {selectedPrescription && (
                <ListeFacturePescriptionModal
                    show={showListeFactureModal}
                    onHide={handleCloseListeFactureModal}
                    IDPRESCRIPTION={selectedPrescription._id}
                />
            )}
        </Modal>
    );
}
