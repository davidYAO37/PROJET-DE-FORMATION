import React, { useEffect, useState, useRef } from 'react';
import { Modal, Table, Button, Form, Spinner, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FaPencilAlt, FaEye } from 'react-icons/fa';
import RecuConsultationPrint from '@/app/pages/recusacte/RecuConsultationPrint';
import FicheConsultationUpdateCaisse from './FicheConsultationUpdateCaisse';


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

interface ListeConsultationsModalProps {
    show: boolean;
    onHide: () => void;
    patientId: string;
}

export default function ListeConsultationsModalCaisse({ show, onHide, patientId }: ListeConsultationsModalProps) {
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [showRecu, setShowRecu] = useState(false);
    const [showUpdate, setShowUpdate] = useState(false);
    const [selectedConsult, setSelectedConsult] = useState<Consultation | null>(null);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const recuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!show || !patientId) return;
        setLoading(true);

        // Charger les consultations
        fetch(`/api/consultation?patientId=${patientId}`)
            .then(res => res.json())
            .then(data => setConsultations(Array.isArray(data) ? data : []))
            .finally(() => setLoading(false));

        // Charger les informations du patient
        fetch(`/api/patients/${patientId}`)
            .then(res => res.json())
            .then(data => setSelectedPatient(data))
            .catch(err => console.error('Erreur chargement patient:', err));
    }, [show, patientId]);

    const handleModifier = (consultation: Consultation) => {
        if (consultation.StatutC) {

            alert("⚠️ Cette consultation est déjà validée et ne peut plus être modifiée.");
            return;
        }
        setSelectedConsult(consultation);
        setShowUpdate(true);
    };

    const handleCloseUpdate = () => {
        setShowUpdate(false);
        setSelectedConsult(null);
        // Recharger les consultations après modification
        if (patientId) {
            setLoading(true);
            fetch(`/api/consultation?patientId=${patientId}`)
                .then(res => res.json())
                .then(data => setConsultations(Array.isArray(data) ? data : []))
                .finally(() => setLoading(false));
        }
    };

    const filtered = consultations.filter(c =>
        c.designationC?.toLowerCase().includes(search.toLowerCase()) ||
        c.Recupar?.toLowerCase().includes(search.toLowerCase())


    );

    return (
        <>
            <Modal show={show} onHide={onHide} size="lg" centered scrollable>
                <Modal.Header closeButton>
                    <Modal.Title>
                        Consultations / Visites du patient : {selectedPatient ? `${selectedPatient.Nom} ${selectedPatient.Prenoms}` : patientId}
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <Form.Control
                        placeholder="Filtrer par désignation ou utilisateur..."
                        className="mb-3"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    {loading ? (
                        <div className="text-center"><Spinner animation="border" /></div>
                    ) : (
                        <Table bordered hover>
                            <thead className="table-primary">
                                <tr>
                                    <th>N°Prestation</th>
                                    <th>Désignation</th>
                                    <th>Prix</th>
                                    <th>Date</th>
                                    <th>Ajouté par</th>
                                    <th>Médecin</th>
                                    <th>Statut</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr><td colSpan={8} className="text-center">Aucune consultation trouvée.</td></tr>
                                ) : (
                                    filtered.map(c => (

                                        <tr key={c._id} className="text-center align-middle">
                                            <td>{c.CodePrestation}</td>
                                            <td>{c.designationC}</td>
                                            <td>{c.montantapayer ?? c.PrixClinique ?? 0} FCFA</td>
                                            <td>{new Date(c.Date_consulation).toLocaleDateString()}</td>
                                            <td>{c.Recupar}</td>
                                            <td>{c.Medecin || '-'}</td>
                                            <td >

                                                {c.StatutC ? (
                                                    <Badge bg="success">✅ Facturée<em></em></Badge>
                                                ) : (
                                                    <Badge bg="warning" text="dark">⏳ En attente</Badge>
                                                )

                                                }
                                            </td>

                                            <td>
                                                <div className="d-flex gap-1 justify-content-center">
                                                    <Button
                                                        size="sm"
                                                        variant="outline-primary"
                                                        onClick={() => { setSelectedConsult(c); setShowRecu(true); }}
                                                        title="Voir le reçu"
                                                    >
                                                        <FaEye />
                                                    </Button>

                                                    {c.StatutC ? (
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
                                                            onClick={() => handleModifier(c)}
                                                            title="Modifier la consultation"
                                                        >
                                                            <FaPencilAlt />
                                                        </Button>

                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    )}
                </Modal.Body>
            </Modal>

            {/* Modal reçu imprimable */}
            <Modal show={showRecu} onHide={() => setShowRecu(false)} size="lg" centered scrollable>
                <Modal.Header closeButton>
                    <Modal.Title>Reçu consultation</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedConsult && <div ref={recuRef}><RecuConsultationPrint consultation={selectedConsult} /></div>}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={() => {
                        if (recuRef.current) {
                            const printContents = recuRef.current.innerHTML;
                            const printWindow = window.open('', '', 'height=800,width=900');
                            if (printWindow) {
                                printWindow.document.write('<html><head><title>Reçu consultation</title></head><body>' + printContents + '</body></html>');
                                printWindow.document.close();
                                printWindow.focus();
                                printWindow.print();
                                printWindow.close();
                            }
                        }
                    }}>Imprimer</Button>
                </Modal.Footer>
            </Modal>

            {/* Modal de modification de consultation */}
            <Modal show={showUpdate} onHide={handleCloseUpdate} size="xl" centered scrollable>
                <Modal.Header closeButton>
                    <Modal.Title>
                        📝 Modifier la consultation - {selectedConsult?.CodePrestation}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedPatient && (
                        <FicheConsultationUpdateCaisse
                            patient={selectedPatient}
                            consultationId={selectedConsult?._id}
                            onClose={handleCloseUpdate}
                        />
                    )}
                </Modal.Body>
            </Modal>
        </>
    );
}
