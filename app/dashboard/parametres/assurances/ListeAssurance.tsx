"use client";

import React, { useState } from "react";
import { Button, Table } from "react-bootstrap";
import { Assurance } from "@/types/assurance";
import TarifAssuranceModal from "../tarifacteassurance/tarifassurances";
import SocieteAssuranceModal from "./SocieteAssuranceModal";

type Props = {
    assurances: Assurance[];
    onEdit: (a: Assurance) => void;
};

export default function ListeAssurance({ assurances, onEdit }: Props) {
    const [showTarifs, setShowTarifs] = useState(false);
    const [selectedAssurance, setSelectedAssurance] = useState<Assurance | null>(null);
    // Filtrage + Pagination
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    const [showSocieteModal, setShowSocieteModal] = useState(false);
    const [selectedSocieteAssurance, setSelectedSocieteAssurance] = useState<Assurance | null>(null);
    const filteredAssurances = assurances.filter((a) =>
        a.desiganationassurance?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const totalPages = Math.ceil(filteredAssurances.length / itemsPerPage);
    const paginatedAssurances = filteredAssurances.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-2">
                <input
                    type="text"
                    className="form-control w-auto"
                    placeholder="Filtrer par nom assurance..."
                    value={searchTerm}
                    onChange={e => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                    }}
                    style={{ minWidth: 220 }}
                />
                <div className="d-flex align-items-center">
                    <span className="me-2">Afficher</span>
                    <select
                        className="form-select form-select-sm"
                        style={{ width: 80 }}
                        value={itemsPerPage}
                        onChange={e => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                        }}
                    >
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={75}>75</option>
                        <option value={100}>100</option>
                    </select>
                    <span className="ms-2">par page</span>
                </div>
            </div>
            <Table bordered hover responsive>
                <thead className="table-primary">
                    <tr>
                        <th>#</th>
                        <th>Désignation</th>
                        <th>Code</th>
                        <th>Téléphone</th>
                        <th>Email</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {paginatedAssurances.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="text-center">
                                Aucune assurance trouvée.
                            </td>
                        </tr>
                    ) : (
                        paginatedAssurances.map((a, i) => (
                            <tr key={a._id}>
                                <td>{i + 1 + (currentPage - 1) * itemsPerPage}</td>
                                <td>{a.desiganationassurance}</td>
                                <td>{a.codeassurance}</td>
                                <td>{a.telephone}</td>
                                <td>{a.email}</td>
                                <td>
                                    <Button
                                        size="sm"
                                        className="me-3"
                                        variant="outline-primary"
                                        title="Modifier l'assurance"
                                        onClick={() => onEdit(a)}
                                    >
                                        Modifier
                                    </Button>
                                    <Button
                                        className="me-3"
                                        size="sm"
                                        variant="outline-success"
                                        title="Voir le tarif assurance"
                                        onClick={async () => {
                                            setSelectedAssurance(a);
                                            // Synchroniser les actes cliniques dans les tarifs de cette assurance
                                            await fetch("/api/tarifassurance/sync-actes", {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ assuranceId: a._id }),
                                            });
                                            setShowTarifs(true);
                                        }}
                                    >
                                        Tarif Assurance
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline-secondary"
                                        title="Voir les sociétés assurance"
                                        onClick={() => {
                                            setSelectedSocieteAssurance(a);
                                            setShowSocieteModal(true);
                                        }}
                                    >
                                        Societe Assurance
                                    </Button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </Table>
            {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-2">
                    <nav>
                        <ul className="pagination">
                            <li className={`page-item${currentPage === 1 ? ' disabled' : ''}`}>
                                <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
                                    Précédent
                                </button>
                            </li>
                            {[...Array(totalPages)].map((_, idx) => (
                                <li key={idx} className={`page-item${currentPage === idx + 1 ? ' active' : ''}`}>
                                    <button className="page-link" onClick={() => setCurrentPage(idx + 1)}>{idx + 1}</button>
                                </li>
                            ))}
                            <li className={`page-item${currentPage === totalPages ? ' disabled' : ''}`}>
                                <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>
                                    Suivant
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>
            )}
            {/* ⚠️ On sort le modal du tableau, sinon il se répète dans chaque ligne */}
            <TarifAssuranceModal
                show={showTarifs}
                onHide={() => setShowTarifs(false)}
                assurance={selectedAssurance}
            />
            <SocieteAssuranceModal
                show={showSocieteModal}
                onHide={() => setShowSocieteModal(false)}
                assurance={selectedSocieteAssurance}
            />
        </>
    );
}
