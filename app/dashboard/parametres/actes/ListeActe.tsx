"use client";
import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import { Button, Table, Pagination, Dropdown, Form, Spinner } from "react-bootstrap";

import { FaEdit, FaSync, FaTrash, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import { ActeClinique } from "@/types/acteclinique";

type Props = {
    actes: ActeClinique[];
    onEdit: (a: ActeClinique) => void;
    onDelete: (id: string) => void;
};

const PAGE_SIZE_OPTIONS = [25, 50, 75, 100];

const ListeActe: React.FC<Props> = ({ actes, onEdit, onDelete }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(PAGE_SIZE_OPTIONS[0]);
    const [search, setSearch] = useState("");

    const [lettreCleSel, setLettreCleSel] = useState("B");
    const [prixClinique, setPrixClinique] = useState<number | "">("");
    const [prixMutuel, setPrixMutuel] = useState<number | "">("");
    const [prixPref, setPrixPref] = useState<number | "">("");
    const [titre, setTitre] = useState("");

    const [sortConfig, setSortConfig] = useState<{ key: keyof ActeClinique; direction: "asc" | "desc" } | null>(null);

    const handleSort = (key: keyof ActeClinique) => {
        setSortConfig((prev) => {
            if (prev && prev.key === key) {
                return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
            }
            return { key, direction: "asc" };
        });
    };

    const renderSortIcon = (key: keyof ActeClinique) => {
        if (!sortConfig || sortConfig.key !== key) return <FaSort />;
        return sortConfig.direction === "asc" ? <FaSortUp /> : <FaSortDown />;
    };

    // Filtrage
    let filteredActes = actes.filter(a =>
        a.designationacte?.toLowerCase().includes(search.toLowerCase())
    );

    // Tri
    if (sortConfig) {
        filteredActes = [...filteredActes].sort((a, b) => {
            const valA = (a[sortConfig.key] ?? "").toString().toLowerCase();
            const valB = (b[sortConfig.key] ?? "").toString().toLowerCase();
            if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
            if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
            return 0;
        });
    }

    // Pagination
    const totalPages = Math.ceil(filteredActes.length / itemsPerPage);
    const paginated = filteredActes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handlePageChange = (page: number) => setCurrentPage(page);
    const handleItemsPerPageChange = (value: number) => {
        setItemsPerPage(value);
        setCurrentPage(1);
    };

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importLoading, setImportLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
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
            let rows = XLSX.utils.sheet_to_json(sheet);
            rows = rows.map((row: any) => {
                const cleaned: any = {};
                for (const key in row) {
                    const val = row[key];
                    cleaned[key] = typeof val === "string" ? val.trim() : val;
                }
                return cleaned;
            });
            await axios.post("/api/actes/import", { rows });
            window.location.reload();
        } catch (err: any) {
            setImportError(err.message || "Erreur inconnue");
        } finally {
            setImportLoading(false);
        }
    };

    const handleActualiserPrix = async () => {
        setActionLoading("actualiser");
        try {
            await axios.post("/api/actes/ModifieParLettreCle", {
                lettreCle: lettreCleSel,
                prixClinique,
                prixMutuel,
                prixPreferenciel: prixPref,
                titre,
            });
            alert("Prix mis à jour avec succès !");
            window.location.reload();
        } catch {
            alert("Erreur lors de la mise à jour");
        } finally {
            setActionLoading(null);
        }
    };

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
            <div className="row g-2 mb-3 align-items-center">
                <div className="col-auto">
                    <Dropdown>
                        <Dropdown.Toggle variant="outline-secondary" size="sm">{itemsPerPage} par page</Dropdown.Toggle>
                        <Dropdown.Menu>
                            {PAGE_SIZE_OPTIONS.map((opt) => (
                                <Dropdown.Item key={opt} onClick={() => handleItemsPerPageChange(opt)}>{opt}</Dropdown.Item>
                            ))}
                        </Dropdown.Menu>
                    </Dropdown>
                </div>
                <div className="col-auto">
                    <Button variant="outline-success" size="sm" onClick={handleImportClick} disabled={importLoading}>
                        {importLoading && <Spinner as="span" animation="border" size="sm" className="me-2" />}
                        Importer Excel
                    </Button>
                    <input type="file" accept=".xlsx,.xls" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileChange} />
                    {importError && <span className="ms-2 text-danger">{importError}</span>}
                </div>
                <div className="col-auto">
                    <Form.Control
                        type="text"
                        size="sm"
                        placeholder="Filtrer par désignation..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                        style={{ minWidth: 220 }}
                    />
                </div>
            </div>

            <Form className="row g-2 mb-4">
                <div className="col-12 col-md-2">
                    <Form.Select value={lettreCleSel} onChange={e => setLettreCleSel(e.target.value)}>
                        {["B", "D", "K", "KC", "Z"].map(l => <option key={l} value={l}>{l}</option>)}
                    </Form.Select>
                </div>
                <div className="col-12 col-sm-4 col-md-2">
                    <Form.Control type="number" placeholder="Prix Clinique" value={prixClinique} onChange={e => setPrixClinique(e.target.value ? parseFloat(e.target.value) : "")} />
                </div>
                <div className="col-12 col-sm-4 col-md-2">
                    <Form.Control type="number" placeholder="Prix Mutuel" value={prixMutuel} onChange={e => setPrixMutuel(e.target.value ? parseFloat(e.target.value) : "")} />
                </div>
                <div className="col-12 col-sm-4 col-md-2">
                    <Form.Control type="number" placeholder="Prix Préférentiel" value={prixPref} onChange={e => setPrixPref(e.target.value ? parseFloat(e.target.value) : "")} />
                </div>
                <div className="col-12 col-md-auto">
                    <Button variant="primary" className="w-100 d-flex align-items-center justify-content-center gap-1" onClick={handleActualiserPrix} disabled={actionLoading === "actualiser"}>
                        {actionLoading === "actualiser" && <Spinner as="span" animation="border" size="sm" className="me-2" />}
                        <FaSync /> Actualiser
                    </Button>
                </div>
            </Form>

            <Table bordered hover responsive className="table-hover table-striped">
                <thead className="table-primary">
                    <tr>
                        <th onClick={() => handleSort("designationacte")} style={{ cursor: "pointer" }}>
                            Désignation {renderSortIcon("designationacte")}
                        </th>
                        <th onClick={() => handleSort("lettreCle")} style={{ cursor: "pointer" }}>
                            Lettre Clé {renderSortIcon("lettreCle")}
                        </th>
                        <th>Coefficient</th>
                        <th>Prix Clinique</th>
                        <th>Prix Mutuel</th>
                        <th>Prix Préférentiel</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {paginated.length === 0 ? (
                        <tr><td colSpan={7} className="text-center">Aucun acte trouvé.</td></tr>
                    ) : (
                        paginated.map((a, idx) => (
                            <tr key={a._id ? a._id : `row-${(currentPage - 1) * itemsPerPage + idx}`}>
                                <td>{a.designationacte}</td>
                                <td>{a.lettreCle}</td>
                                <td>{a.coefficient}</td>
                                <td>{a.prixClinique}</td>
                                <td>{a.prixMutuel}</td>
                                <td>{a.prixPreferenciel}</td>
                                <td className="text-center">
                                    <Button size="sm" variant="outline-primary" className="me-2" onClick={() => { setActionLoading('edit-' + a._id); onEdit(a); }} disabled={actionLoading === 'edit-' + a._id}><FaEdit /></Button>
                                    {a._id && <Button size="sm" variant="outline-danger" disabled={actionLoading === 'delete-' + a._id} onClick={async () => { if (window.confirm(`Supprimer "${a.designationacte}" ?`)) { setActionLoading('delete-' + a._id); await onDelete(a._id as string); setActionLoading(null); } }}><FaTrash /></Button>}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </Table>

            {totalPages > 1 && (
                <div className="d-flex flex-wrap justify-content-between align-items-center mt-4">
                    <small className="text-muted mb-2 d-none d-md-block">
                        Affichage {Math.min((currentPage - 1) * itemsPerPage + 1, filteredActes.length)} - {Math.min(currentPage * itemsPerPage, filteredActes.length)} sur {filteredActes.length}
                    </small>
                    <Pagination className="mb-0 flex-wrap">
                        <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1} />
                        <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
                        {renderPageNumbers().map((num, idx) => num === -1 ? (<Pagination.Ellipsis key={`ell-${idx}`} disabled />) : (
                            <Pagination.Item
                                key={`page-${num}-${idx}`} // clé unique
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
