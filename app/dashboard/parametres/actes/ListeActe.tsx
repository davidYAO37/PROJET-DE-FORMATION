"use client";
import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import { Button, Table, Pagination, Dropdown, Form } from "react-bootstrap";
import { ActesClinique } from "@/types/acte";
import { FaEdit, FaSync, FaTrash } from "react-icons/fa";

type Props = {
    actes: ActesClinique[];
    onEdit: (a: ActesClinique) => void;
    onDelete: (id: string) => void;
};

const PAGE_SIZE_OPTIONS = [25, 50, 75, 100];

const ListeActe: React.FC<Props> = ({ actes, onEdit, onDelete }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(PAGE_SIZE_OPTIONS[0]);

    const [lettreCleSel, setLettreCleSel] = useState("B");
    const [prixClinique, setPrixClinique] = useState<number | "">("");
    const [prixMutuel, setPrixMutuel] = useState<number | "">("");
    const [prixPref, setPrixPref] = useState<number | "">("");
    const [titre, setTitre] = useState("");

    // Pagination simple
    const totalPages = Math.ceil(actes.length / itemsPerPage);
    const paginated = actes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handlePageChange = (page: number) => setCurrentPage(page);
    const handleItemsPerPageChange = (value: number) => {
        setItemsPerPage(value);
        setCurrentPage(1);
    };

    // Import Excel
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importLoading, setImportLoading] = useState(false);
    const [importError, setImportError] = useState("");

    const handleImportClick = () => fileInputRef.current?.click();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImportLoading(true);
        setImportError("");

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet);
            await axios.post("/api/actes/import", { rows });
            window.location.reload();
        } catch (err: any) {
            setImportError(err.message || "Erreur inconnue");
        } finally {
            setImportLoading(false);
        }
    };

    const handleActualiserPrix = async () => {
        try {
            await axios.post("/api/actes/ModifieParLettreCle", {
                lettreCle: lettreCleSel,
                prixClinique,
                prixMutuel,
                prixPreferenciel: prixPref,
                titre
            });
            alert("Prix mis à jour avec succès !");
            window.location.reload();
        } catch (err) {
            alert("Erreur lors de la mise à jour");
        }
    };

    // Pagination avec ellipses
    const renderPageNumbers = () => {
        const delta = 2;
        let range: number[] = [];
        for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) {
            range.push(i);
        }
        if (range[0] > 1) range.unshift(1, -1);
        if (range[range.length - 1] < totalPages) range.push(-1, totalPages);
        return range;
    };

    return (
        <>
            {/* Top controls */}
            <div className="row g-2 mb-3 align-items-center">
                <div className="col-auto">
                    <Dropdown>
                        <Dropdown.Toggle variant="outline-secondary" size="sm">
                            {itemsPerPage} par page
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            {PAGE_SIZE_OPTIONS.map((opt) => (
                                <Dropdown.Item key={opt} onClick={() => handleItemsPerPageChange(opt)}>
                                    {opt}
                                </Dropdown.Item>
                            ))}
                        </Dropdown.Menu>
                    </Dropdown>
                </div>

                <div className="col-auto">
                    <Button variant="outline-success" size="sm" onClick={handleImportClick} disabled={importLoading}>
                        Importer Excel
                    </Button>
                    <input
                        type="file"
                        accept=".xlsx,.xls"
                        ref={fileInputRef}
                        style={{ display: "none" }}
                        onChange={handleFileChange}
                    />
                    {importLoading && <span className="ms-2 text-info">Importation...</span>}
                    {importError && <span className="ms-2 text-danger">{importError}</span>}
                </div>
            </div>

            {/* Modification par lettre clé */}
            <Form className="row g-2 mb-4">
                <div className="col-12 col-md-2">
                    <Form.Select value={lettreCleSel} onChange={(e) => setLettreCleSel(e.target.value)}>
                        {["B", "D", "K", "KC", "Z"].map((lettre) => (
                            <option key={lettre} value={lettre}>{lettre}</option>
                        ))}
                    </Form.Select>
                </div>
                <div className="col-12 col-sm-4 col-md-2">
                    <Form.Control
                        type="number"
                        placeholder="Prix Clinique"
                        value={prixClinique}
                        onChange={(e) => setPrixClinique(e.target.value ? parseFloat(e.target.value) : "")}
                    />
                </div>
                <div className="col-12 col-sm-4 col-md-2">
                    <Form.Control
                        type="number"
                        placeholder="Prix Mutuel"
                        value={prixMutuel}
                        onChange={(e) => setPrixMutuel(e.target.value ? parseFloat(e.target.value) : "")}
                    />
                </div>
                <div className="col-12 col-sm-4 col-md-2">
                    <Form.Control
                        type="number"
                        placeholder="Prix Préférentiel"
                        value={prixPref}
                        onChange={(e) => setPrixPref(e.target.value ? parseFloat(e.target.value) : "")}
                    />
                </div>
                <div className="col-12 col-md-auto">
                    <Button
                        variant="primary"
                        className="w-100 d-flex align-items-center justify-content-center gap-1"
                        onClick={handleActualiserPrix}
                    >
                        <FaSync /> Actualiser
                    </Button>
                </div>
            </Form>

            {/* Tableau */}
            <Table bordered hover responsive className="table-hover table-striped">
                <thead className="table-primary">
                    <tr>
                        <th>Désignation</th>
                        <th>Lettre Clé</th>
                        <th>Coefficient</th>
                        <th>Prix Clinique</th>
                        <th>Prix Mutuel</th>
                        <th>Prix Préférentiel</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {paginated.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="text-center">Aucun acte trouvé.</td>
                        </tr>
                    ) : (
                        paginated.map((a) => (
                            <tr key={a._id ?? Math.random()} className="animate__animated animate__fadeIn">
                                <td>{a.designationacte}</td>
                                <td>{a.lettreCle}</td>
                                <td>{a.coefficient}</td>
                                <td>{a.prixClinique}</td>
                                <td>{a.prixMutuel}</td>
                                <td>{a.prixPreferenciel}</td>
                                <td className="text-center">
                                    <Button size="sm" variant="outline-primary" onClick={() => onEdit(a)} className="me-2">
                                        <FaEdit />
                                    </Button>
                                    {a._id && (
                                        <Button
                                            size="sm"
                                            variant="outline-danger"
                                            onClick={() => {
                                                if (window.confirm(`Supprimer "${a.designationacte}" ?`)) {
                                                    onDelete(a._id);
                                                }
                                            }}
                                        >
                                            <FaTrash />
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="d-flex flex-wrap justify-content-between align-items-center mt-4">
                    <small className="text-muted mb-2 d-none d-md-block">
                        Affichage {Math.min((currentPage - 1) * itemsPerPage + 1, actes.length)} -{" "}
                        {Math.min(currentPage * itemsPerPage, actes.length)} sur {actes.length}
                    </small>

                    <Pagination className="mb-0 flex-wrap">
                        <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1} />
                        <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />

                        {renderPageNumbers().map((num, idx) =>
                            num === -1 ? (
                                <Pagination.Ellipsis key={`ell-${idx}`} disabled />
                            ) : (
                                <Pagination.Item
                                    key={`page-${num}-${idx}`}
                                    active={currentPage === num}
                                    onClick={() => handlePageChange(num)}
                                >
                                    {num}
                                </Pagination.Item>
                            )
                        )}


                        <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />
                        <Pagination.Last onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} />
                    </Pagination>
                </div>
            )}
        </>
    );
};

export default ListeActe;
