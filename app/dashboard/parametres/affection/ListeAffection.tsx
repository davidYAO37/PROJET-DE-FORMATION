"use client";
import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import { Button, Table, Pagination, Form, Spinner } from "react-bootstrap";

import { FaEdit, FaTrash, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import { Affection } from "@/types/affection";

type Props = {
    affections: Affection[];
    onEdit: (a: Affection) => void;
    onDelete: (id: string) => void;
};

const PAGE_SIZE_OPTIONS = [25, 50, 75, 100];

const ListeAffection: React.FC<Props> = ({ affections, onEdit, onDelete }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(PAGE_SIZE_OPTIONS[0]);
    const [search, setSearch] = useState("");

    const [sortConfig, setSortConfig] = useState<{ key: keyof Affection; direction: "asc" | "desc" } | null>(null);

    const handleSort = (key: keyof Affection) => {
        setSortConfig((prev) => {
            if (prev && prev.key === key) {
                return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
            }
            return { key, direction: "asc" };
        });
    };

    const renderSortIcon = (key: keyof Affection) => {
        if (!sortConfig || sortConfig.key !== key) return <FaSort />;
        return sortConfig.direction === "asc" ? <FaSortUp /> : <FaSortDown />;
    };

    // Filtrage
    let filteredAffections = affections.filter(a =>
        a.designation?.toLowerCase().includes(search.toLowerCase())
    );

    // Tri
    if (sortConfig) {
        filteredAffections = [...filteredAffections].sort((a, b) => {
            const valA = (a[sortConfig.key] ?? "").toString().toLowerCase();
            const valB = (b[sortConfig.key] ?? "").toString().toLowerCase();
            if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
            if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
            return 0;
        });
    }

    // Pagination
    const totalPages = Math.ceil(filteredAffections.length / itemsPerPage);
    const paginated = filteredAffections.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
            
            // Validate that rows have required fields
            if (rows.length === 0) {
                throw new Error("Le fichier Excel ne contient aucune donnée");
            }
            
            const invalidRows = rows.filter((row: any, index: number) => {
                const hasDesignation = row.designation && row.designation.toString().trim() !== '';
                const hasLettreCle = row.lettreCle && row.lettreCle.toString().trim() !== '';
                return !hasDesignation || !hasLettreCle;
            });
            
            if (invalidRows.length > 0) {
                const firstInvalid = invalidRows[0] as any;
                const missingFields: string[] = [];
                if (!firstInvalid.designation || firstInvalid.designation.toString().trim() === '') {
                    missingFields.push('designation');
                }
                if (!firstInvalid.lettreCle || firstInvalid.lettreCle.toString().trim() === '') {
                    missingFields.push('lettreCle');
                }
                throw new Error(`Champs requis manquants: ${missingFields.join(', ')}. Assurez-vous que votre fichier Excel contient les colonnes 'designation' et 'lettreCle'.`);
            }
            console.log('Sending rows to API:', rows);
            const response = await axios.post("/api/affections/import", { rows });
            console.log('API response:', response.data);
            window.location.reload();
        } catch (err: any) {
            console.error('Import error:', err);
            if (err.response?.data) {
                const { error, details } = err.response.data;
                setImportError(`${error}${details ? ` - ${details}` : ''}`);
            } else {
                setImportError(err.message || "Erreur inconnue");
            }
        } finally {
            setImportLoading(false);
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
                    <Form.Select value={itemsPerPage} onChange={e => handleItemsPerPageChange(Number(e.target.value))} size="sm">
                        {PAGE_SIZE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>{opt} par page</option>
                        ))}
                    </Form.Select>
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

            <div className="table-responsive">
                <Table bordered hover className="text-center">
                    <thead className="table-primary">
                        <tr>
                            <th onClick={() => handleSort("designation")} style={{ cursor: "pointer" }}>
                                Désignation {renderSortIcon("designation")}
                            </th>
                            <th onClick={() => handleSort("lettreCle")} style={{ cursor: "pointer" }}>
                                Lettre Clé {renderSortIcon("lettreCle")}
                            </th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginated.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="text-center">
                                    Aucune affection trouvée.
                                </td>
                            </tr>
                        ) : (
                            paginated.map((a, idx) => (
                                <tr key={a._id ? a._id : `row-${(currentPage - 1) * itemsPerPage + idx}`}>
                                    <td>{a.designation}</td>
                                    <td>{a.lettreCle}</td>
                                    <td className="bg-primary bg-opacity-10 d-flex justify-content-center">
                                        <Button 
                                            size="sm" 
                                            variant="outline-primary" 
                                            className="me-2" 
                                            title="Modifier l'affection"
                                            onClick={() => { setActionLoading('edit-' + a._id); onEdit(a); }} 
                                            disabled={actionLoading === 'edit-' + a._id}
                                        >
                                            <FaEdit />
                                        </Button>
                                        {a._id && (
                                            <Button 
                                                size="sm" 
                                                variant="outline-danger" 
                                                title="Supprimer l'affection"
                                                disabled={actionLoading === 'delete-' + a._id} 
                                                onClick={async () => { 
                                                    if (window.confirm(`Supprimer "${a.designation}" ?`)) { 
                                                        setActionLoading('delete-' + a._id); 
                                                        await onDelete(a._id as string); 
                                                        setActionLoading(null); 
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
            </div>

            {totalPages > 1 && (
                <div className="d-flex flex-wrap justify-content-between align-items-center mt-4">
                    <small className="text-muted mb-2 d-none d-md-block">
                        Affichage {Math.min((currentPage - 1) * itemsPerPage + 1, filteredAffections.length)} - {Math.min(currentPage * itemsPerPage, filteredAffections.length)} sur {filteredAffections.length}
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

export default ListeAffection;
