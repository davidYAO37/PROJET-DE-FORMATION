"use client";

import React, { useEffect, useState } from "react";
import { Modal, Table, Button, Spinner, Form, Pagination } from "react-bootstrap";
import { Assurance } from "@/types/assurance";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

type TarifAssurance = {
    _id: string;
    acte: string;
    lettreCle: string;
    coefficient: number;
    prixmutuel: number;
    prixpreferenciel: number;
};

type Props = {
    show: boolean;
    onHide: () => void;
    assurance: Assurance | null;
};

export default function TarifAssuranceModal({ show, onHide, assurance }: Props) {
    const [loading, setLoading] = useState(false);
    const [tarifs, setTarifs] = useState<TarifAssurance[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!assurance) return;

        const fetchTarifs = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/tarifs/${assurance._id}`);
                const data = await res.json();
                setTarifs(data);
            } catch (error) {
                console.error("Erreur chargement tarifs:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTarifs();
    }, [assurance]);

    const handleChange = (id: string, field: keyof TarifAssurance, value: string) => {
        setTarifs((prev) =>
            prev.map((t) =>
                t._id === id ? { ...t, [field]: Number(value) } : t
            )
        );
    };

    const handleSave = async () => {
        if (!assurance) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/tarifs/${assurance._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(tarifs),
            });
            if (!res.ok) throw new Error("Erreur de sauvegarde");
            alert("Tarifs enregistrés avec succès ✅");
        } catch (err) {
            console.error(err);
            alert("Erreur lors de l'enregistrement ❌");
        } finally {
            setSaving(false);
        }
    };

    // ✅ Filtrage + Pagination
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);

    const filteredTarifs = tarifs.filter((t) =>
        t.acte.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.lettreCle.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredTarifs.length / itemsPerPage);
    const paginatedTarifs = filteredTarifs.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>
                    Tarif Assurance – {assurance?.desiganationassurance}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {loading ? (
                    <div className="text-center p-3">
                        <Spinner animation="border" />
                    </div>
                ) : (
                    <>
                        {/* ✅ Filtre */}
                        <Form.Control
                            className="mb-3"
                            placeholder="Filtrer par acte ou lettre clé..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />

                        {/* ✅ Choix d'affichage par page */}
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <Form.Group className="mb-0 d-flex align-items-center">
                                <Form.Label className="me-2 mb-0">Afficher</Form.Label>
                                <Form.Select
                                    size="sm"
                                    style={{ width: 80 }}
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                        setItemsPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                >
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                    <option value={75}>75</option>
                                    <option value={100}>100</option>
                                </Form.Select>
                                <span className="ms-2">par page</span>
                            </Form.Group>
                        </div>

                        {/* ✅ Table des tarifs */}
                        <Table bordered hover responsive>
                            <thead className="table-success">
                                <tr>
                                    <th>#</th>
                                    <th>Acte</th>
                                    <th>Lettre Clé</th>
                                    <th>Coefficient</th>
                                    <th>Prix Mutuel</th>
                                    <th>Prix Préférentiel</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedTarifs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center">
                                            Aucun tarif disponible.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedTarifs.map((t, i) => (
                                        <tr key={t._id}>
                                            <td>{i + 1 + (currentPage - 1) * itemsPerPage}</td>
                                            <td>{t.acte}</td>
                                            <td>{t.lettreCle}</td>
                                            <td>
                                                <Form.Control
                                                    type="number"
                                                    value={t.coefficient}
                                                    onChange={(e) =>
                                                        handleChange(t._id, "coefficient", e.target.value)
                                                    }
                                                />
                                            </td>
                                            <td>
                                                <Form.Control
                                                    type="number"
                                                    value={t.prixmutuel}
                                                    onChange={(e) =>
                                                        handleChange(t._id, "prixmutuel", e.target.value)
                                                    }
                                                />
                                            </td>
                                            <td>
                                                <Form.Control
                                                    type="number"
                                                    value={t.prixpreferenciel}
                                                    onChange={(e) =>
                                                        handleChange(t._id, "prixpreferenciel", e.target.value)
                                                    }
                                                />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>


                        {/* ✅ Pagination moderne */}
                        {totalPages > 1 && (
                            <div className="d-flex justify-content-center mt-3">
                                <Pagination>
                                    <Pagination.Prev
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(currentPage - 1)}
                                    >
                                        <FaChevronLeft />
                                    </Pagination.Prev>

                                    {totalPages <= 6 ? (
                                        [...Array(totalPages)].map((_, idx) => (
                                            <Pagination.Item
                                                key={idx}
                                                active={currentPage === idx + 1}
                                                onClick={() => setCurrentPage(idx + 1)}
                                            >
                                                {idx + 1}
                                            </Pagination.Item>
                                        ))
                                    ) : (
                                        <>
                                            <Pagination.Item
                                                active={currentPage === 1}
                                                onClick={() => setCurrentPage(1)}
                                            >
                                                1
                                            </Pagination.Item>

                                            {currentPage > 3 && <Pagination.Ellipsis disabled />}

                                            {[currentPage - 1, currentPage, currentPage + 1]
                                                .filter((p) => p > 1 && p < totalPages)
                                                .map((page, idx) => (
                                                    <Pagination.Item
                                                        key={idx}
                                                        active={currentPage === page}
                                                        onClick={() => setCurrentPage(page)}
                                                    >
                                                        {page}
                                                    </Pagination.Item>
                                                ))}

                                            {currentPage < totalPages - 2 && <Pagination.Ellipsis disabled />}

                                            <Pagination.Item
                                                active={currentPage === totalPages}
                                                onClick={() => setCurrentPage(totalPages)}
                                            >
                                                {totalPages}
                                            </Pagination.Item>
                                        </>
                                    )}

                                    <Pagination.Next
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(currentPage + 1)}
                                    >
                                        <FaChevronRight />
                                    </Pagination.Next>
                                </Pagination>
                            </div>
                        )}
                    </>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Fermer
                </Button>
                <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={saving || tarifs.length === 0}
                >
                    {saving ? "Enregistrement..." : "Enregistrer"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
