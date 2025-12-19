"use client";

import { useState, useEffect } from "react";
import { Modal, Table, Button, Form, Row, Col } from "react-bootstrap";
import { Acte } from "@/types/examenHospitalisation";

type Props = {
    show: boolean;
    onClose: () => void;
    onSelect: (selectedActes: Acte[]) => void;
};

type ActeCliniqueAPI = {
    _id: string;
    designationacte: string;
    lettreCle: string;
    coefficient: number;
    prixClinique: number;
    prixMutuel: number;
    prixPreferentiel: number;
};

export default function ListeAutreActeModalUpdate({ show, onClose, onSelect }: Props) {
    const [actes, setActes] = useState<ActeCliniqueAPI[]>([]);
    const [selectedActes, setSelectedActes] = useState<ActeCliniqueAPI[]>([]);

    // Pagination + recherche
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);
    const [search, setSearch] = useState("");
    const [totalPages, setTotalPages] = useState(1);

    const fetchActes = async () => {
        try {
            const res = await fetch(
                `/api/actesclinique?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`
            );
            const data = await res.json();
            setActes(data.data || []);
            setTotalPages(data.totalPages || 1);
        } catch (err) {
            console.error("Erreur API ActesClinique :", err);
        }
    };

    useEffect(() => {
        if (show) fetchActes();
    }, [show, page, limit, search]);

    // Ajouter un acte sélectionné
    const handleSelectActe = (acte: ActeCliniqueAPI) => {
        setSelectedActes((prev) => {
            if (prev.find((a) => a._id === acte._id)) return prev; // éviter doublons
            return [...prev, acte];
        });
    };

    // Supprimer un acte de la sélection
    const handleRemoveActe = (id: string) => {
        setSelectedActes((prev) => prev.filter((a) => a._id !== id));
    };

    // Confirmer et envoyer les actes sélectionnés
    const handleConfirm = () => {
        const mapped: Acte[] = selectedActes.map((a) => ({
            _id: a._id,
            date: new Date().toISOString().split("T")[0],
            designation: a.designationacte,
            lettreCle: a.lettreCle,
            coef: a.coefficient,
            quantite: 1,
            coefAssur: 0,
            surplus: 0,
            prixUnitaire: a.prixClinique,
            taxe: 0,
            prixTotal: a.coefficient * a.prixClinique,
            partAssurance: 0,
            partAssure: 0,
            idType: a._id,
            reliquat: 0,
            totalRelicatCoefAssur: 0,
            montantMedExecutant: 0,
            montantMedecin: 0


        }));

        onSelect(mapped);
        setSelectedActes([]); // vider la sélection
        onClose();
    };

    return (
        <Modal show={show} onHide={onClose} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Liste des actes cliniques</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {/* Barre recherche + choix limite */}
                <Row className="mb-3">
                    <Col md={6}>
                        <Form.Control
                            type="text"
                            placeholder="Rechercher par désignation..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                        />
                    </Col>
                    <Col md={6} className="text-end">
                        <Form.Select
                            size="sm"
                            value={limit}
                            onChange={(e) => {
                                setLimit(Number(e.target.value));
                                setPage(1);
                            }}
                            style={{ width: "auto", display: "inline-block" }}
                        >
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </Form.Select>{" "}
                        <span>par page</span>
                    </Col>
                </Row>

                {/* Table principale */}
                <Table bordered hover size="sm" responsive>
                    <thead>
                        <tr>
                            <th>Acte</th>
                            <th>Lettre Clé</th>
                            <th>Coef</th>
                            <th>Prix Clinique</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {actes.map((acte) => (
                            <tr key={acte._id}>
                                <td>{acte.designationacte}</td>
                                <td>{acte.lettreCle}</td>
                                <td>{acte.coefficient}</td>
                                <td>{acte.prixClinique.toLocaleString()} CFA</td>
                                <td>
                                    <Button
                                        size="sm"
                                        variant="success"
                                        onClick={() => handleSelectActe(acte)}
                                        disabled={selectedActes.some((a) => a._id === acte._id)}
                                    >
                                        Ajouter
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        {actes.length === 0 && (
                            <tr>
                                <td colSpan={5} className="text-center text-muted">
                                    Aucun acte trouvé
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>

                {/* Pagination */}
                <div className="d-flex justify-content-between align-items-center mt-2 mb-4">
                    <Button
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage((prev) => prev - 1)}
                    >
                        ← Précédent
                    </Button>
                    <span>
                        Page {page} sur {totalPages || 1}
                    </span>
                    <Button
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() => setPage((prev) => prev + 1)}
                    >
                        Suivant →
                    </Button>
                </div>

                {/* Table des actes sélectionnés */}
                {selectedActes.length > 0 && (
                    <>
                        <h6>✅ Actes sélectionnés</h6>
                        <Table bordered size="sm" responsive>
                            <thead>
                                <tr>
                                    <th>Acte</th>
                                    <th>Lettre Clé</th>
                                    <th>Coef</th>
                                    <th>Prix Clinique</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedActes.map((acte) => (
                                    <tr key={acte._id}>
                                        <td>{acte.designationacte}</td>
                                        <td>{acte.lettreCle}</td>
                                        <td>{acte.coefficient}</td>
                                        <td>{acte.prixClinique.toLocaleString()} CFA</td>
                                        <td>
                                            <Button
                                                size="sm"
                                                variant="danger"
                                                onClick={() => handleRemoveActe(acte._id)}
                                            >
                                                Retirer
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>
                    Annuler
                </Button>
                <Button
                    variant="primary"
                    onClick={handleConfirm}
                    disabled={selectedActes.length === 0}
                >
                    Ajouter sélection ({selectedActes.length})
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
