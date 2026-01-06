import React, { useEffect, useState } from 'react';
import { Modal, Table, Button, Form, Spinner, Badge } from 'react-bootstrap';
import { FaEdit, FaEye, FaFileContract, FaFilePdf, FaList, FaReceipt } from 'react-icons/fa';
import ExamenHospitalisationModalCaisse from './ExamenHospitModalCaisse';
import ListeFactureModal from './ListeFactureModal';

export interface ExamenHospit {
    _id: string;
    designation: string;
    montant: number;
    date: string | Date;
    statut: boolean;
    patientId: string;
    codePrestation: string;
    designationTypeActe: string;
    Entrele?: string | Date;
    SortieLe?: string | Date;
    Rclinique?: string;
}

interface ListeExamenHospitModalProps {
    show: boolean;
    onHide: () => void;
    patientId: string;
}

export default function ListeExamenHospitModalCaisse({ 
    show, 
    onHide, 
    patientId 
}: ListeExamenHospitModalProps) {
    const [examens, setExamens] = useState<ExamenHospit[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [showFactureModal, setShowFactureModal] = useState(false);
    const [showListeFactureModal, setShowListeFactureModal] = useState(false);
    const [selectedExamen, setSelectedExamen] = useState<ExamenHospit | null>(null);

    useEffect(() => {
        if (!show || !patientId) return;
        
        const fetchData = async () => {
            setLoading(true);
            try {
                // Récupérer les examens d'hospitalisation du patient
                const [examRes, patientRes] = await Promise.all([
                    fetch(`/api/ListeAutreActes?patientId=${patientId}`),
                    fetch(`/api/patients/${patientId}`)
                ]);
                
                if (!examRes.ok) throw new Error('Erreur lors du chargement des examens');
                if (!patientRes.ok) throw new Error('Erreur lors du chargement du patient');
                
                const examData = await examRes.json();
                const patientData = await patientRes.json();
                
                // Formater les données des examens pour inclure les champs manquants
                const formattedExams = examData.map((exam: any) => ({
                    ...exam,
                    date: exam.date ? new Date(exam.date) : new Date(),
                    Entrele: exam.Entrele ? new Date(exam.Entrele) : null,
                    SortieLe: exam.SortieLe ? new Date(exam.SortieLe) : null,
                    Rclinique: exam.Rclinique || ''
                }));
                
                setExamens(Array.isArray(formattedExams) ? formattedExams : []);
                setSelectedPatient(patientData);
            } catch (error) {
             
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, [show, patientId]);

    const filteredExamens = examens.filter(examen => 
        examen.designation?.toLowerCase().includes(search.toLowerCase()) ||
        examen.codePrestation?.toLowerCase().includes(search.toLowerCase()) ||
        examen.designationTypeActe?.toLowerCase().includes(search.toLowerCase())
    );

    const handleFacturer = (examen: ExamenHospit) => {
        setSelectedExamen(examen);
        setShowFactureModal(true);
    };

    const handleAfficherFactures = (examen: ExamenHospit) => {
        setSelectedExamen(examen);
        setShowListeFactureModal(true);
    };

    const handleCloseFactureModal = () => {
        setShowFactureModal(false);
        setSelectedExamen(null);
    };

    const handleCloseListeFactureModal = () => {
        setShowListeFactureModal(false);
        setSelectedExamen(null);
    };

    return (
        <Modal     show={show} 
                   onHide={onHide} 
                   size="xl" 
                   centered 
                   dialogClassName="modal-fullscreen-lg-down"
                   style={{ maxWidth: '95vw', margin: 'auto' }}
               >   <Modal.Header closeButton className="bg-primary text-white">
                <Modal.Title>
                    Examens d'hospitalisation du patient : {selectedPatient ? `${selectedPatient.Nom} ${selectedPatient.Prenoms}` : patientId}
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
                        <p>Chargement des actes du patient...</p>
                    </div>
                ) : filteredExamens.length === 0 ? (
                    <div className="text-center my-4">
                        <p>Aucun acte trouvé pour ce patient.</p>
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
                                {filteredExamens.map((examen) => (
                                    <tr key={examen._id}>
                                        <td>{new Date(examen.date).toLocaleDateString()}</td>
                                        <td>{examen.codePrestation}</td>
                                        <td>{examen.designationTypeActe}</td>
                                        <td>{examen.montant?.toLocaleString()} FCFA</td>
                                        <td>
                                            <Badge bg={examen.statut ? 'success' : 'warning'}>
                                                {examen.statut ? 'Validé' : 'En attente'}
                                            </Badge>
                                        </td>
                                        <td className="text-center">
                                            <Button 
                                                variant="outline-warning"                                                
                                                size="sm"
                                                className='me-2'
                                                disabled={examen.statut}
                                                onClick={() => handleFacturer(examen)}
                                                title="Facturer La Prestation"                                           >
                                                <FaFileContract />
                                            </Button>
                                            <Button 
                                                variant="outline-info"                                                
                                                size="sm"
                                                onClick={() => handleAfficherFactures(examen)}
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
            {selectedExamen && (
                <ExamenHospitalisationModalCaisse
                    show={showFactureModal}
                    onHide={handleCloseFactureModal}
                    CodePrestation={selectedExamen.codePrestation}
                    Designationtypeacte={selectedExamen.designationTypeActe}
                    PatientP={selectedPatient ? `${selectedPatient.Nom} ${selectedPatient.Prenoms}` : ''}
                    examenHospitId={selectedExamen._id}
                    dateEntree={selectedExamen.Entrele 
                        ? new Date(selectedExamen.Entrele).toISOString().split('T')[0] 
                        : null}
                    dateSortie={selectedExamen.SortieLe 
                        ? new Date(selectedExamen.SortieLe).toISOString().split('T')[0] 
                        : null}
                    nombreDeJours={selectedExamen.Entrele && selectedExamen.SortieLe 
                        ? Math.ceil((new Date(selectedExamen.SortieLe).getTime() - new Date(selectedExamen.Entrele).getTime()) / (1000 * 60 * 60 * 24))
                        : 1}
                    renseignementclinique={selectedExamen.Rclinique || ''}
                />
            )}
            
            {/* Modal de liste des factures */}
            {selectedExamen && (
                <ListeFactureModal
                    show={showListeFactureModal}
                    onHide={handleCloseListeFactureModal}
                    idHospitalisation={selectedExamen._id}
                />
            )}
        </Modal>
    );
}
