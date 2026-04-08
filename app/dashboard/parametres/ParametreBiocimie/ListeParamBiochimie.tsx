"use client";
import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import { Button, Table, Pagination, Dropdown, Form, Spinner, Modal } from "react-bootstrap";
import { FaEdit, FaSync, FaTrash, FaSort, FaSortUp, FaSortDown, FaPlus, FaFileImport } from "react-icons/fa";
import { ParamBiochimie } from "@/types/ParamBiochimie";

type Props = {
    ParamBiochimies: ParamBiochimie[];
    onEdit: (param: ParamBiochimie) => void;
    onDelete: (id: string) => void;
    onAdd: () => void;
};

const PAGE_SIZE_OPTIONS = [10, 50, 75, 100];

const ListeParamBiochimie: React.FC<Props> = ({ ParamBiochimies, onEdit, onDelete, onAdd }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(PAGE_SIZE_OPTIONS[0]);
    const [search, setSearch] = useState("");
    const [sortConfig, setSortConfig] = useState<{ key: keyof ParamBiochimie; direction: "asc" | "desc" } | null>(null);

    // Import states
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importLoading, setImportLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [importError, setImportError] = useState("");
    const [showImportModal, setShowImportModal] = useState(false);
    const [showValidationModal, setShowValidationModal] = useState(false);
    const [importedData, setImportedData] = useState<any[]>([]);

    const handleSort = (key: keyof ParamBiochimie) => {
        setSortConfig((prev) => {
            if (prev && prev.key === key) {
                return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
            }
            return { key, direction: "asc" };
        });
    };

    const renderSortIcon = (key: keyof ParamBiochimie) => {
        if (!sortConfig || sortConfig.key !== key) return <FaSort />;
        return sortConfig.direction === "asc" ? <FaSortUp /> : <FaSortDown />;
    };

    // Filtrage
    let filteredParams = ParamBiochimies.filter(param =>
        param.LibelleB?.toLowerCase().includes(search.toLowerCase()) ||
        param.CodeB?.toLowerCase().includes(search.toLowerCase())
    );

    // Tri
    if (sortConfig) {
        filteredParams = [...filteredParams].sort((a, b) => {
            const valA = (a[sortConfig.key] ?? "").toString().toLowerCase();
            const valB = (b[sortConfig.key] ?? "").toString().toLowerCase();
            if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
            if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
            return 0;
        });
    }

    // Pagination
    const totalPages = Math.ceil(filteredParams.length / itemsPerPage);
    const paginated = filteredParams.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handlePageChange = (page: number) => setCurrentPage(page);
    const handleItemsPerPageChange = (value: number) => {
        setItemsPerPage(value);
        setCurrentPage(1);
    };

    const handleImportClick = () => {
        setShowImportModal(true);
    };

    const confirmImport = () => {
        setShowImportModal(false);
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImportLoading(true);
        setImportError("");

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            setImportedData(jsonData);
            setShowValidationModal(true);
        } catch (error) {
            setImportError("Erreur lors de la lecture du fichier");
        } finally {
            setImportLoading(false);
        }
    };

    const handleImport = async () => {
        setImportLoading(true);
        setImportError("");

        try {
            const response = await axios.post("/api/parambiochimie/import", {
                rows: importedData,
            });

            if (response.data.success) {
                let message = `Import réussi : ${response.data.count} paramètres ajoutés`;
                if (response.data.ignored > 0) {
                    message += `, ${response.data.ignored} ignorés`;
                }
                if (response.data.errors && response.data.errors.length > 0) {
                    message += `\n\nErreurs :\n${response.data.errors.map((e: any) => `Ligne ${e.index}: ${e.message}`).join('\n')}`;
                }
                alert(message);
                window.location.reload(); // Refresh to show new data
            } else {
                let message = response.data.message || "Erreur lors de l'import";
                if (response.data.errors && response.data.errors.length > 0) {
                    message += `\n\nErreurs :\n${response.data.errors.map((e: any) => `Ligne ${e.index}: ${e.message}`).join('\n')}`;
                }
                alert(message);
            }
        } catch (error: any) {
            setImportError(error.response?.data?.error || "Erreur lors de l'import");
        } finally {
            setImportLoading(false);
            setShowValidationModal(false);
            setImportedData([]);
        }
    };

    const handleDelete = async (id: string) => {
        setActionLoading(id);
        try {
            await onDelete(id);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div>
            {/* Barre d'outils */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex gap-2 align-items-center">
                    <Form.Control
                        type="text"
                        placeholder="Rechercher..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ width: "250px" }}
                    />
                    <Button variant="outline-secondary" onClick={() => setSearch("")}>
                        <FaSync />
                    </Button>
                </div>

                <div className="d-flex gap-2">
                    <Button variant="outline-success" onClick={handleImportClick}>
                        <FaFileImport className="me-2" />
                        Importer Excel
                    </Button>
                    <Button variant="success" onClick={onAdd}>
                        <FaPlus className="me-2" />
                        Ajouter
                    </Button>
                </div>
            </div>

            {/* Tableau */}
            <Table striped hover responsive>
                <thead>
                    <tr>
                        <th 
                            style={{ cursor: "pointer" }}
                            onClick={() => handleSort("CodeB")}
                        >
                            Code B {renderSortIcon("CodeB")}
                        </th>
                        <th 
                            style={{ cursor: "pointer" }}
                            onClick={() => handleSort("LibelleB")}
                        >
                            Libellé B {renderSortIcon("LibelleB")}
                        </th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {paginated.map((param) => (
                        <tr key={param._id}>
                            <td>{param.CodeB || "-"}</td>
                            <td>{param.LibelleB}</td>
                            <td>
                                <div className="d-flex gap-1">
                                    <Button
                                        size="sm"
                                        variant="outline-primary"
                                        onClick={() => onEdit(param)}
                                        disabled={actionLoading === param._id}
                                    >
                                        <FaEdit />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline-danger"
                                        onClick={() => handleDelete(param._id)}
                                        disabled={actionLoading === param._id}
                                    >
                                        {actionLoading === param._id ? (
                                            <Spinner size="sm" animation="border" />
                                        ) : (
                                            <FaTrash />
                                        )}
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            {/* Pagination */}
            <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                    <span>Lignes:</span>
                    <Dropdown>
                        <Dropdown.Toggle variant="outline-secondary" size="sm">
                            {itemsPerPage}
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            {PAGE_SIZE_OPTIONS.map((size) => (
                                <Dropdown.Item
                                    key={size}
                                    onClick={() => handleItemsPerPageChange(size)}
                                >
                                    {size}
                                </Dropdown.Item>
                            ))}
                        </Dropdown.Menu>
                    </Dropdown>
                </div>

                <Pagination>
                    <Pagination.First
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                    />
                    <Pagination.Prev
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    />
                    
                    {[...Array(totalPages)].map((_, i) => {
                        const page = i + 1;
                        if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 2 && page <= currentPage + 2)
                        ) {
                            return (
                                <Pagination.Item
                                    key={page}
                                    active={page === currentPage}
                                    onClick={() => handlePageChange(page)}
                                >
                                    {page}
                                </Pagination.Item>
                            );
                        }
                        if (
                            page === currentPage - 3 ||
                            page === currentPage + 3
                        ) {
                            return <Pagination.Ellipsis key={page} />;
                        }
                        return null;
                    })}
                    
                    <Pagination.Next
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    />
                    <Pagination.Last
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                    />
                </Pagination>
            </div>

            {/* Modal d'importation */}
            <Modal show={showImportModal} onHide={() => setShowImportModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Importer des Paramètres Biochimie</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>
                        Sélectionnez un fichier Excel contenant les paramètres à importer.
                        Le fichier doit contenir les colonnes suivantes :
                    </p>
                    <ul>
                        <li><strong>Code B</strong> (optionnel) - Le code du paramètre</li>
                        <li><strong>Libellé B</strong> (obligatoire) - Le libellé du paramètre</li>
                    </ul>
                    <p className="text-muted">
                        Les noms de colonnes acceptés : Code, Code B, Libellé, Libelle, Libellé B, Libelle B
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => setShowImportModal(false)}
                        disabled={importLoading}
                    >
                        Annuler
                    </Button>
                    <Button
                        variant="success"
                        onClick={confirmImport}
                        disabled={importLoading}
                    >
                        {importLoading ? (
                            <>
                                <Spinner size="sm" animation="border" className="me-2" />
                                Importation...
                            </>
                        ) : (
                            "Sélectionner un fichier"
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal de validation */}
            <Modal
                show={showValidationModal}
                onHide={() => setShowValidationModal(false)}
                size="lg"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Valider l'importation</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {importError && (
                        <div className="alert alert-danger">{importError}</div>
                    )}
                    
                    <p>
                        <strong>{importedData.length}</strong> lignes trouvées dans le fichier.
                    </p>
                    
                    <div style={{ maxHeight: "300px", overflow: "auto" }}>
                        <Table striped bordered size="sm">
                            <thead>
                                <tr>
                                    <th>Ligne</th>
                                    <th>Code B</th>
                                    <th>Libellé B</th>
                                </tr>
                            </thead>
                            <tbody>
                                {importedData.slice(0, 10).map((row: any, index) => (
                                    <tr key={index}>
                                        <td>{index + 2}</td>
                                        <td>{row.CodeB || row["Code"] || row["Code B"] || "-"}</td>
                                        <td>{row.LibelleB || row["Libellé"] || row["Libelle"] || row["Libelle B"] || "-"}</td>
                                    </tr>
                                ))}
                                {importedData.length > 10 && (
                                    <tr>
                                        <td colSpan={3} className="text-center">
                                            ... et {importedData.length - 10} autres lignes
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => setShowValidationModal(false)}
                        disabled={importLoading}
                    >
                        Annuler
                    </Button>
                    <Button
                        variant="success"
                        onClick={handleImport}
                        disabled={importLoading}
                    >
                        {importLoading ? (
                            <>
                                <Spinner size="sm" animation="border" className="me-2" />
                                Importation en cours...
                            </>
                        ) : (
                            "Confirmer l'importation"
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Input file caché */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx,.xls"
                style={{ display: "none" }}
            />
        </div>
    );
};

export default ListeParamBiochimie;
