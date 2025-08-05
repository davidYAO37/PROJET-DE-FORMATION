"use client";
import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import { Button, Table, Pagination } from "react-bootstrap";
import { ActesClinique } from "@/types/acte";

type Props = {
    actes: ActesClinique[];
    onEdit: (a: ActesClinique) => void;
    onDelete: (id: string) => void;
};

const PAGE_SIZE_OPTIONS = [25, 50, 75, 100];

const ListeActe: React.FC<Props> = ({ actes, onEdit, onDelete }) => {
    const [sortKey, setSortKey] = useState<keyof ActesClinique>("designationacte");
    const [sortAsc, setSortAsc] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(PAGE_SIZE_OPTIONS[0]);

    const sorted = [...actes].sort((a, b) => {
        const valA = a[sortKey] ?? "";
        const valB = b[sortKey] ?? "";

        if (typeof valA === "string" && typeof valB === "string") {
            return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        if (typeof valA === "number" && typeof valB === "number") {
            return sortAsc ? valA - valB : valB - valA;
        }
        return 0;
    });

    const totalPages = Math.ceil(sorted.length / itemsPerPage);
    const paginated = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleSort = (key: keyof ActesClinique) => {
        if (sortKey === key) {
            setSortAsc(!sortAsc);
        } else {
            setSortKey(key);
            setSortAsc(true);
        }
    };

    const handlePageChange = (page: number) => setCurrentPage(page);
    const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    // ✅ Import Excel avec Axios
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
            setImportError(err.message);
        } finally {
            setImportLoading(false);
        }
    };

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-2">
                <div>
                    <label className="me-2">Éléments par page :</label>
                    <select
                        value={itemsPerPage}
                        onChange={handleItemsPerPageChange}
                        className="form-select d-inline-block w-auto"
                    >
                        {PAGE_SIZE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                                {opt}
                            </option>
                        ))}
                    </select>
                </div>
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

            <Table bordered hover responsive>
                <thead className="table-primary">
                    <tr>
                        <th onClick={() => handleSort("designationacte")}>
                            Désignation {sortKey === "designationacte" && (sortAsc ? "▲" : "▼")}
                        </th>
                        <th onClick={() => handleSort("lettreCle")}>
                            Lettre Clé {sortKey === "lettreCle" && (sortAsc ? "▲" : "▼")}
                        </th>
                        <th onClick={() => handleSort("coefficient")}>
                            Coefficient {sortKey === "coefficient" && (sortAsc ? "▲" : "▼")}
                        </th>
                        <th onClick={() => handleSort("prixClinique")}>
                            Prix Clinique {sortKey === "prixClinique" && (sortAsc ? "▲" : "▼")}
                        </th>
                        <th onClick={() => handleSort("prixMutuel")}>
                            Prix Mutuel {sortKey === "prixMutuel" && (sortAsc ? "▲" : "▼")}
                        </th>
                        <th onClick={() => handleSort("prixPreferenciel")}>
                            Prix Préférentiel {sortKey === "prixPreferenciel" && (sortAsc ? "▲" : "▼")}
                        </th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {paginated.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="text-center">
                                Aucun acte trouvé.
                            </td>
                        </tr>
                    ) : (
                        paginated.map((a) => (
                            <tr key={a._id}>
                                <td>{a.designationacte}</td>
                                <td>{a.lettreCle}</td>
                                <td>{a.coefficient}</td>
                                <td>{a.prixClinique}</td>
                                <td>{a.prixMutuel}</td>
                                <td>{a.prixPreferenciel}</td>
                                <td>
                                    <Button size="sm" variant="outline-primary" onClick={() => onEdit(a)} className="me-2">
                                        Modifier
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline-danger"
                                        onClick={() => {
                                            if (window.confirm(`Voulez-vous vraiment supprimer l'acte "${a.designationacte}" ?`)) {
                                                if (a._id) onDelete(a._id);
                                            }
                                        }}
                                    >
                                        Supprimer
                                    </Button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </Table>

            {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-3">
                    <Pagination>
                        <Pagination.Prev
                            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                        />
                        {[...Array(totalPages)].map((_, i) => (
                            <Pagination.Item
                                key={i + 1}
                                active={currentPage === i + 1}
                                onClick={() => handlePageChange(i + 1)}
                            >
                                {i + 1}
                            </Pagination.Item>
                        ))}
                        <Pagination.Next
                            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                        />
                    </Pagination>
                </div>
            )}
        </>
    );
};

export default ListeActe;
