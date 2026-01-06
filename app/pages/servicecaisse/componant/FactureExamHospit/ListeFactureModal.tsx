import React, { useState, useEffect } from 'react';
import { Modal, Table, Button, Spinner } from 'react-bootstrap';
import { FaPrint, FaFilePdf } from 'react-icons/fa';
import dynamic from 'next/dynamic';

// Dynamically import RecuExamenPrint with SSR disabled
const RecuExamenPrint = dynamic(
  () => import('@/app/pages/recusacte/RecuExamenPrint'),
  { ssr: false }
);

export interface Facture {
    _id: string;
    CodePrestation?:string;
    DatePres?: string | Date;
    PatientP?:string;
    Designationtypeacte?:string;
    Montanttotal?: number;
    PartAssuranceP?:number;
    Partassure?:number;
    TotalPaye?: number;
    reduction?:number;
    Restapayer?: number;
    SaisiPar?:string
    // Ajoutez d'autres champs si nécessaire
}  

interface ListeFactureModalProps {
    show: boolean;
    onHide: () => void;
    idHospitalisation: string;
}

export default function ListeFactureModal({ 
    show, 
    onHide, 
    idHospitalisation
}: ListeFactureModalProps) {
    const [factures, setFactures] = useState<Facture[]>([]);
    const [loading, setLoading] = useState(false);
    const [showRecuModal, setShowRecuModal] = useState(false);
    const [selectedFactureId, setSelectedFactureId] = useState<string | null>(null);

    useEffect(() => {
        if (!show || !idHospitalisation) return;
        
        const fetchFactures = async () => {
            setLoading(true);
            try {
                  const response = await fetch(`/api/facturesListe?idHospitalisation=${idHospitalisation}`);
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                     throw new Error(errorData.message || 'Erreur lors du chargement des factures');
                }
                
                const responseData = await response.json();
                 
                // Gérer différents formats de réponse
                const facturesData = Array.isArray(responseData) 
                    ? responseData 
                    : (responseData.data && Array.isArray(responseData.data) 
                        ? responseData.data 
                        : []);
                 setFactures(facturesData);
            } catch (error) {
                 } finally {
                setLoading(false);
            }
        };
        
        fetchFactures();
    }, [show, idHospitalisation]);

    const handlePrintFacture = (factureId: string) => {
        setSelectedFactureId(factureId);
        setShowRecuModal(true);
    };

    const handleCloseRecuModal = () => {
        setShowRecuModal(false);
        setSelectedFactureId(null);
    };

    return (
        <Modal 
            show={show} 
            onHide={onHide} 
            size="xl" 
            centered 
            dialogClassName="modal-fullscreen-lg-down"
            style={{ maxWidth: '95vw', margin: 'auto' }}
        >
            <Modal.Header closeButton className="bg-primary text-white">
                <Modal.Title>Liste des factures</Modal.Title>
            </Modal.Header>
            
            <Modal.Body className="p-0">
                <div className="table-responsive" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {loading ? (
                    <div className="text-center my-4">
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-2">Chargement des factures...</p>
                    </div>
                ) : factures.length === 0 ? (
                    <div className="text-center my-4">
                        <p>Aucune facture trouvée pour cette hospitalisation.</p>
                        <p className="text-muted small">ID d'hospitalisation: {idHospitalisation}</p>
                        <button 
                            className="btn btn-sm btn-outline-secondary mt-2"
                            onClick={() => console.log('État actuel:', { factures, idHospitalisation })}
                        >
                            Afficher les détails de débogage
                        </button>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <Table striped bordered hover className="mb-0">
                            <thead>
                                <tr>
                                    <th>N° Facture</th>
                                    <th>Date</th>
                                    <th>Patient</th>
                                    <th>Designation</th>
                                    <th>Total Facture</th>                                    
                                    <th>Part Assurance</th>
                                    <th>Part Patient</th>
                                    <th>Total Payer</th>
                                    <th>Reduction</th>
                                    <th>Reste a payer</th>
                                    <th>Facturé par</th>
                                    <th style={{ position: 'sticky', right: 0, background: 'white', zIndex: 1 }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                               {factures.map((facture) => (
                <tr key={facture._id}>
                    <td>{facture.CodePrestation || 'N/A'}</td>
                    <td>{facture.DatePres ? new Date(facture.DatePres).toLocaleDateString() : 'N/A'}</td>
                    <td>{facture.PatientP}</td>
                    <td>{facture.Designationtypeacte}</td>
                    <td>{facture.Montanttotal !== undefined ? `${facture.Montanttotal.toLocaleString()} FCFA` : 'N/A'}</td>
                    <td>{facture.PartAssuranceP}</td>
                    <td>{facture.Partassure}</td>
                    <td>{facture.TotalPaye}</td>
                    <td>{facture.reduction}</td>
                    <td>{facture.Restapayer}</td> 
                    <td>{facture.SaisiPar}</td>
                    <td style={{ position: 'sticky', right: 0, background: 'white', zIndex: 1 }}>
                        <Button 
                            variant="outline-primary" 
                            size="sm" 
                            className="me-2"
                            onClick={() => handlePrintFacture(facture._id)}
                        >
                            <FaPrint className="me-1" /> PDF
                        </Button>
                    </td>
                </tr>
            ))}
                            </tbody>
                        </Table>
                    </div>
                )}
                </div>
            </Modal.Body>
            
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Fermer
                </Button>
            </Modal.Footer>
            
            {/* Modal pour l'aperçu du reçu */}
            <Modal 
                show={showRecuModal} 
                onHide={handleCloseRecuModal}
                size="xl"
                centered
                fullscreen="lg-down"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Reçu d'examen</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ minHeight: '80vh' }}>
                    {selectedFactureId && (
                        <RecuExamenPrint params={{ id: selectedFactureId }} />
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseRecuModal}>
                        Fermer
                    </Button>
                </Modal.Footer>
            </Modal>
        </Modal>
    );
}
