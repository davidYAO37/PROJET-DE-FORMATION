"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import { Button,
    Table,
    Pagination,
    Dropdown,
    Form,
    Spinner
} from "react-bootstrap";
import { FaEdit, FaTrash, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import { Approvisionnement } from "@/types/Approvisionnement";

type Props = {
    Approvisionnements: Approvisionnement[];
    onEdit: (a: Approvisionnement) => void;
    onDelete: (id: string) => Promise<void>;
};

const PAGE_SIZE_OPTIONS = [25, 50, 75, 100];

const ListeApprovisionnement: React.FC<Props> = ({
    Approvisionnements,
    onEdit,
    onDelete
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(PAGE_SIZE_OPTIONS[0]);
    const [searchDate, setSearchDate] = useState("");

    const [sortConfig, setSortConfig] = useState<{
        key: keyof Approvisionnement;
        direction: "asc" | "desc";
    } | null>(null);

    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [importLoading, setImportLoading] = useState(false);
    const [importError, setImportError] = useState("");

    const fileInputRef = useRef<HTMLInputElement>(null);

    /* ===================== TRI ===================== */
    const handleSort = (key: keyof Approvisionnement) => {
        setSortConfig(prev =>
            prev && prev.key === key
                ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
                : { key, direction: "asc" }
        );
    };

    const renderSortIcon = (key: keyof Approvisionnement) => {
        if (!sortConfig || sortConfig.key !== key) return <FaSort />;
        return sortConfig.direction === "asc" ? <FaSortUp /> : <FaSortDown />;
    };

    /* ===================== FILTRAGE DATE ===================== */
    let filtered = Approvisionnements.filter(a => {
        if (!searchDate) return true;
        if (!a.DateAppro) return false;

        const dateA = new Date(a.DateAppro).toISOString().slice(0, 10);
        return dateA === searchDate;
    });

    /* ===================== TRI ===================== */
    if (sortConfig) {
        filtered = [...filtered].sort((a, b) => {
            const valA = a[sortConfig.key];
            const valB = b[sortConfig.key];
            if (!valA || !valB) return 0;

            if (sortConfig.key.toLowerCase().includes("date")) {
                return sortConfig.direction === "asc"
                    ? new Date(valA as string).getTime() -
                          new Date(valB as string).getTime()
                    : new Date(valB as string).getTime() -
                          new Date(valA as string).getTime();
            }

            return sortConfig.direction === "asc"
                ? Number(valA) - Number(valB)
                : Number(valB) - Number(valA);
        });
    }

    /* ===================== PAGINATION ===================== */
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginated = filtered.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const renderPageNumbers = () => {
        const delta = 2;
        const range: number[] = [];
        for (
            let i = Math.max(1, currentPage - delta);
            i <= Math.min(totalPages, currentPage + delta);
            i++
        ) {
            range.push(i);
        }
        if (range[0] > 1) range.unshift(1, -1);
        if (range[range.length - 1] < totalPages)
            range.push(-1, totalPages);
        return range;
    };

    /* ===================== IMPORT EXCEL ===================== */
    const handleImportClick = () => fileInputRef.current?.click();

    const handleFileChange = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImportLoading(true);
        setImportError("");

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet);
            await axios.post("/api/approvisionnement", rows);
            window.location.reload();
        } catch (err: any) {
            setImportError(err.message || "Erreur import");
        } finally {
            setImportLoading(false);
        }
    };

    /* ===================== RENDER ===================== */
    return (
        <>
            {/* BARRE OUTILS */}
            <div className="row g-2 mb-3 align-items-center">
                <div className="col-auto">
                    <Dropdown>
                        <Dropdown.Toggle size="sm" variant="outline-secondary">
                            {itemsPerPage} / page
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            {PAGE_SIZE_OPTIONS.map(opt => (
                                <Dropdown.Item
                                    key={opt}
                                    onClick={() => {
                                        setItemsPerPage(opt);
                                        setCurrentPage(1);
                                    }}
                                >
                                    {opt}
                                </Dropdown.Item>
                            ))}
                        </Dropdown.Menu>
                    </Dropdown>
                </div>

                <div className="col-auto">
                    <Form.Control
                        type="date"
                        size="sm"
                        value={searchDate}
                        onChange={e => {
                            setSearchDate(e.target.value);
                            setCurrentPage(1);
                        }}
                    />
                </div>
            </div>

            {/* TABLE */}
            <div className="table-responsive">
                <Table bordered hover className="text-center align-middle">
                    <thead className="table-primary">
                        <tr>
                            <th onClick={() => handleSort("DateAppro")}>
                                Date {renderSortIcon("DateAppro")}
                            </th>
                            <th onClick={() => handleSort("PrixHT")}>
                                Prix HT {renderSortIcon("PrixHT")}
                            </th>
                            <th onClick={() => handleSort("tVAApro")}>
                                TVA {renderSortIcon("tVAApro")}
                            </th>
                           
                            <th onClick={() => handleSort("MontantTTC")}>
                                TTC {renderSortIcon("MontantTTC")}
                            </th>
                            <th>Observations</th>
                            <th>Saisi par</th>
                            <th>Saisi le</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {paginated.length === 0 ? (
                            <tr>
                                <td colSpan={9}>Aucun approvisionnement</td>
                            </tr>
                        ) : (
                            paginated.map(a => (
                                <tr key={a._id}>
                                    <td>
                                        {a.DateAppro
                                            ? new Date(
                                                  a.DateAppro
                                              ).toLocaleDateString()
                                            : ""}
                                    </td>
                                    <td>{a.PrixHT}</td>
                                    <td>{a.tVAApro}</td>
                                    <td>{a.MontantTTC}</td>
                                    <td>{a.Observations}</td>
                                    <td>{a.SaisiPar}</td>
                                    <td>
                                        {a.SaisiLe
                                            ? new Date(
                                                  a.SaisiLe
                                              ).toLocaleDateString()
                                            : ""}
                                    </td>
                                    <td>
                                        <Button
                                            size="sm"
                                            variant="outline-primary"
                                            className="me-2"
                                            onClick={() => onEdit(a)}
                                        >
                                            <FaEdit />
                                        </Button>
                                        {a._id && (
                                            <Button
                                                size="sm"
                                                variant="outline-danger"
                                                onClick={() =>
                                                    onDelete(a._id!)
                                                }
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

            {/* PAGINATION */}
            {totalPages > 1 && (
                <Pagination className="justify-content-end">
                    {renderPageNumbers().map((num, idx) =>
                        num === -1 ? (
                            <Pagination.Ellipsis key={idx} />
                        ) : (
                            <Pagination.Item
                                key={idx}
                                active={num === currentPage}
                                onClick={() => setCurrentPage(num)}
                            >
                                {num}
                            </Pagination.Item>
                        )
                    )}
                </Pagination>
            )}
        </>
    );
};

export default ListeApprovisionnement;