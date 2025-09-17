import React, { useEffect, useState } from "react";
import { Modal, Button, Table, Spinner } from "react-bootstrap";

interface SocieteAssurance {
    _id: string;
    societe: string;
}

interface SocietePatientModalProps {
    show: boolean;
    onHide: () => void;
    assuranceId: string;
    onSelect: (societe: SocieteAssurance) => void;
}

export default function SocietePatientModal({ show, onHide, assuranceId, onSelect }: SocietePatientModalProps) {
    const [societes, setSocietes] = useState<SocieteAssurance[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (show && assuranceId) {
            setLoading(true);
            fetch(`/api/societeassurance?assuranceId=${assuranceId}`)
                .then(res => res.json())
                .then(data => setSocietes(Array.isArray(data) ? data : []))
                .finally(() => setLoading(false));
        }
    }, [show, assuranceId]);

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>Choisir une société d'assurance</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {loading ? (
                    <div className="text-center"><Spinner animation="border" /></div>
                ) : (
                    <Table hover>
                        <thead>
                            <tr>
                                <th>Nom de la société</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {societes.map(soc => (
                                <tr key={soc._id}>
                                    <td>{soc.societe}</td>
                                    <td>
                                        <Button size="sm" variant="primary" onClick={() => { onSelect(soc); onHide(); }}>
                                            Sélectionner
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {societes.length === 0 && (
                                <tr><td colSpan={2} className="text-center text-muted">Aucune société trouvée</td></tr>
                            )}
                        </tbody>
                    </Table>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>Fermer</Button>
            </Modal.Footer>
        </Modal>
    );
}
