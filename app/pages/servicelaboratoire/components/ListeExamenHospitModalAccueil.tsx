import React, { useEffect, useState, useCallback } from 'react';
import { Modal, Table, Button, Form, Spinner, Badge } from 'react-bootstrap';
import { FaEdit, FaEye, FaFilePdf, FaPencilAlt } from 'react-icons/fa';
import dynamic from 'next/dynamic';
import ExamenHospitalisationModalUpdate from '../../ExamenHospitUpdate/component/ExamenHospitModalUpdate';


export interface ExamenHospit {
    _id: string;
    designation: string;
    montant: number;
    date: string;
    statut: boolean;
    patientId: string;
    codePrestation: string;
    designationTypeActe: string;
    statutPrescriptionMedecin?: number;
}

interface ListeExamenHospitModalProps {
    show: boolean;
    onHide: () => void;
    patientId: string;
}

export default function ListeExamenHospitModalAccueil({ 
    show, 
    onHide, 
    patientId 
}: ListeExamenHospitModalProps) {
    const [examens, setExamens] = useState<ExamenHospit[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [showEditModal, setShowEditModal] = useState(false);
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
                
                setExamens(Array.isArray(examData) ? examData : []);
                setSelectedPatient(patientData);
            } catch (error) {
                console.error('Erreur:', error);
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

    const handleVoirDetails = (examen: ExamenHospit) => {
        // Implémenter la logique pour afficher les détails de l'examen
        console.log('Voir détails de l\'examen:', examen._id);
    };
    
    const handleModifier = (examen: ExamenHospit) => {
        setSelectedExamen(examen);
        setShowEditModal(true);
    };

    const handleEditSuccess = useCallback(() => {
        setShowEditModal(false);
        // Recharger les données après modification
        if (patientId) {
            fetchData(patientId);
        }
    }, [patientId]);

    const fetchData = useCallback(async (id: string) => {
        setLoading(true);
        try {
            // Récupérer les examens d'hospitalisation du patient
            const [examRes, patientRes] = await Promise.all([
                fetch(`/api/ListeAutreActes?patientId=${id}`),
                fetch(`/api/patients/${id}`)
            ]);
            
            if (!examRes.ok) throw new Error('Erreur lors du chargement des examens');
            if (!patientRes.ok) throw new Error('Erreur lors du chargement du patient');
            
            const examData = await examRes.json();
            const patientData = await patientRes.json();
            
            setExamens(Array.isArray(examData) ? examData : []);
            setSelectedPatient(patientData);
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    }, []);
    
    useEffect(() => {
        if (!show || !patientId) return;
        fetchData(patientId);
    }, [show, patientId, fetchData]);

    return (
        <>
            <Modal show={show} onHide={onHide} size="lg" centered scrollable>
                <Modal.Header closeButton className="bg-primary text-white">
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
                            <p>Chargement des examens d'hospitalisation...</p>
                        </div>
                    ) : filteredExamens.length === 0 ? (
                        <div className="text-center my-4">
                            <p>Aucun examen d'hospitalisation trouvé pour ce patient.</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <Table striped bordered hover>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>N°Prestation</th>
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
                                            <td>
                                                <Button 
                                                    variant="outline-primary" 
                                                    size="sm" 
                                                    className="me-2"
                                                    onClick={() => handleVoirDetails(examen)}
                                                    title="Voir les détails"
                                                >
                                                    <FaEye />
                                                </Button>
                                                <Button
                                                    variant="outline-warning"
                                                    size="sm"
                                                    disabled={examen.statut}
                                                    onClick={() => handleModifier(examen)}
                                                    title="Modifier la prestation"
                                                >
                                                    <FaPencilAlt />
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
            </Modal>

            {/* Modal de modification */}
            {selectedExamen && selectedPatient && (
                <ExamenHospitalisationModalUpdate
                    show={showEditModal}
                    onHide={() => setShowEditModal(false)}
                    CodePrestation={selectedExamen.codePrestation || ''}
                    Designationtypeacte={selectedExamen.designationTypeActe || ''}
                    PatientP={`${selectedPatient.Nom || ''} ${selectedPatient.Prenoms || ''}`.trim()}
                    examenHospitId={selectedExamen._id}
                    onSuccess={handleEditSuccess}
                />
            )}
        </>
    );
}
