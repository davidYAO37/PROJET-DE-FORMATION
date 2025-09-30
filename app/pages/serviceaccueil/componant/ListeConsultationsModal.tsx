import React, { useEffect, useState, useRef } from 'react';
import { Modal, Table, Button, Form, Spinner } from 'react-bootstrap';
import RecuConsultationPrint from './RecuConsultationPrint';

interface Consultation {
    _id: string;
    designationC: string;
    montantapayer?: number;
    PrixClinique?: number;
    Date_consulation: string;
    Recupar: string;
    Code_Prestation: string;
    Medecin?: string;
}

interface ListeConsultationsModalProps {
    show: boolean;
    onHide: () => void;
    patientId: string;
}

export default function ListeConsultationsModal({ show, onHide, patientId }: ListeConsultationsModalProps) {
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [showRecu, setShowRecu] = useState(false);
    const [selectedConsult, setSelectedConsult] = useState<Consultation | null>(null);
    const recuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!show || !patientId) return;
        setLoading(true);
        fetch(`/api/consultation?patientId=${patientId}`)
            .then(res => res.json())
            .then(data => setConsultations(Array.isArray(data) ? data : []))
            .finally(() => setLoading(false));
    }, [show, patientId]);

    const filtered = consultations.filter(c =>
        c.designationC?.toLowerCase().includes(search.toLowerCase()) ||
        c.Recupar?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <Modal show={show} onHide={onHide} size="lg" centered scrollable>
                <Modal.Header closeButton>
                    <Modal.Title>Consultations/Visites du patient</Modal.Title>
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
                            <thead>
                                <tr>
                                    <th>N°Prestation</th>
                                    <th>Désignation</th>
                                    <th>Prix</th>
                                    <th>Date</th>
                                    <th>Ajouté par</th>
                                    <th>Medecin Prescripteur</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center">Aucune consultation trouvée.</td></tr>
                                ) : (
                                    filtered.map(c => (

                                        <tr key={c._id} className="text-center align-middle">
                                            <td>{c.Code_Prestation}</td>
                                            <td>{c.designationC}</td>
                                            <td>{c.montantapayer ?? c.PrixClinique ?? 0} FCFA</td>
                                            <td>{new Date(c.Date_consulation).toLocaleDateString()}</td>
                                            <td>{c.Recupar}</td>
                                            <td>{c.Medecin}</td>
                                            <td>
                                                <Button size="sm" variant="outline-primary" onClick={() => { setSelectedConsult(c); setShowRecu(true); }}>Voir</Button>
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
        </>
    );
}
