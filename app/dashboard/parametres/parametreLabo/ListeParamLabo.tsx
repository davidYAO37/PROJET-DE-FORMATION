"use client";
import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import { Button, Table, Pagination, Dropdown, Form, Spinner, Modal } from "react-bootstrap";
import { FaEdit, FaSync, FaTrash, FaSort, FaSortUp, FaSortDown, FaPlus, FaFileImport } from "react-icons/fa";
import { ParamLabo } from "@/types/ParamLabo";

type Props = {
    ParamLabos: ParamLabo[];
    onEdit: (param: ParamLabo) => void;
    onDelete: (id: string) => void;
    onAdd: () => void;
};

const PAGE_SIZE_OPTIONS = [10, 50, 75, 100];

const ListeParamLabo: React.FC<Props> = ({ ParamLabos, onEdit, onDelete, onAdd }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(PAGE_SIZE_OPTIONS[0]);
    const [search, setSearch] = useState("");
    const [sortConfig, setSortConfig] = useState<{ key: keyof ParamLabo; direction: "asc" | "desc" } | null>(null);

    // Import states
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importLoading, setImportLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [importError, setImportError] = useState("");
    const [showImportModal, setShowImportModal] = useState(false);
    const [showValidationModal, setShowValidationModal] = useState(false);
    const [importedData, setImportedData] = useState<any[]>([]);

    const handleSort = (key: keyof ParamLabo) => {
        setSortConfig((prev) => {
            if (prev && prev.key === key) {
                return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
            }
            return { key, direction: "asc" };
        });
    };

    const renderSortIcon = (key: keyof ParamLabo) => {
        if (!sortConfig || sortConfig.key !== key) return <FaSort />;
        return sortConfig.direction === "asc" ? <FaSortUp /> : <FaSortDown />;
    };

    // Filtrage
    let filteredParams = ParamLabos.filter(param =>
        param.Param_designation?.toLowerCase().includes(search.toLowerCase())
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
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            let rows = XLSX.utils.sheet_to_json(sheet);
            
            // Process rows - only take columns 1 and 2 (index 0 and 1)
            const processedRows: any[] = [];
            rows.forEach((row: any, index: number) => {
                // Get the first two columns
                const values = Object.values(row);
                if (values.length >= 2 && values[0] && values[0].toString().trim() !== "") {
                    processedRows.push({
                        Param_designation: values[0].toString().trim(),
                        ValeurNormale: values[1] ? values[1].toString().trim() : ""
                    });
                }
            });
            
            if (processedRows.length === 0) {
                setImportError("Aucune donnée valide trouvée dans le fichier");
                return;
            }
            
            setImportedData(processedRows);
            setShowValidationModal(true);
            
        } catch (err: any) {
            setImportError(err.message || "Erreur lors de la lecture du fichier Excel. Vérifiez que le fichier n'est pas déjà ouvert.");
        } finally {
            setImportLoading(false);
        }
    };

    const validateImport = async () => {
        setShowValidationModal(false);
        setImportLoading(true);
        
        try {
            await axios.post("/api/paramlabo/import", { rows: importedData });
            window.location.reload();
        } catch (err: any) {
            setImportError(err.message || "Erreur lors de l'importation");
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
                        <FaFileImport className="me-2" />
                        Importer la liste
                    </Button>
                    <input type="file" accept=".xlsx,.xls" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileChange} />
                    {importError && <span className="ms-2 text-danger">{importError}</span>}
                </div>
                <div className="col-auto">
                    <Button variant="primary" size="sm" onClick={onAdd}>
                        <FaPlus className="me-2" />
                        Nouveau paramètre
                    </Button>
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
                            <th onClick={() => handleSort("Param_designation")} style={{ cursor: "pointer" }}>
                                Paramètre {renderSortIcon("Param_designation")}
                            </th>
                            <th onClick={() => handleSort("ValeurNormale")} style={{ cursor: "pointer" }}>
                                Valeur Normale {renderSortIcon("ValeurNormale")}
                            </th>
                            <th onClick={() => handleSort("PlageMinMaxNé")} style={{ cursor: "pointer" }}>
                                Plage Nouveau Né {renderSortIcon("PlageMinMaxNé")}
                            </th>
                            <th onClick={() => handleSort("PlageMinMaxEnfant")} style={{ cursor: "pointer" }}>
                                Plage Enfant {renderSortIcon("PlageMinMaxEnfant")}
                            </th>
                            <th onClick={() => handleSort("PlageMinMaxFemme")} style={{ cursor: "pointer" }}>
                                Plage Femme {renderSortIcon("PlageMinMaxFemme")}
                            </th>
                            <th onClick={() => handleSort("PlageMinMaxHomme")} style={{ cursor: "pointer" }}>
                                Plage Homme {renderSortIcon("PlageMinMaxHomme")}
                            </th>
                            <th onClick={() => handleSort("TypeTexte")} style={{ cursor: "pointer" }}>
                                Texte ? {renderSortIcon("TypeTexte")}
                            </th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginated.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-center">
                                    Aucun paramètre trouvé.
                                </td>
                            </tr>
                        ) : (
                            paginated.map((param, idx) => (
                                <tr key={param._id ? param._id : `row-${(currentPage - 1) * itemsPerPage + idx}`}>
                                    <td 
    className="fw-semibold" 
    dangerouslySetInnerHTML={{ 
      __html: param.Param_designation || '' 
    }}
    onClick={(e) => e.stopPropagation()}
/>
                                    <td>{param.ValeurNormale}</td>
                                    <td>{param.PlageMinMaxNé}</td>
                                    <td>{param.PlageMinMaxEnfant}</td>
                                    <td>{param.PlageMinMaxFemme}</td>
                                    <td>{param.PlageMinMaxHomme}</td>
                                    <td>{param.TypeTexte ? "Oui" : "Non"}</td>
                                    <td className="d-flex bg-primary bg-opacity-10">
                                        <Button 
                                            size="sm" 
                                            variant="outline-primary" 
                                            className="me-2" 
                                            title="Modifier le paramètre"
                                            onClick={() => { setActionLoading('edit-' + param._id); onEdit(param); }} 
                                            disabled={actionLoading === 'edit-' + param._id}
                                        >
                                            <FaEdit />
                                        </Button>
                                        {param._id && (
                                            <Button 
                                                size="sm" 
                                                variant="outline-danger" 
                                                title="Supprimer le paramètre"
                                                disabled={actionLoading === 'delete-' + param._id} 
                                                onClick={async () => { 
                                                    if (window.confirm(`Supprimer "${param.Param_designation}" ?`)) { 
                                                        setActionLoading('delete-' + param._id); 
                                                        await onDelete(param._id as string); 
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
                        Affichage {Math.min((currentPage - 1) * itemsPerPage + 1, filteredParams.length)} - {Math.min(currentPage * itemsPerPage, filteredParams.length)} sur {filteredParams.length}
                    </small>
                    <Pagination className="mb-0 flex-wrap">
                        <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1} />
                        <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
                        {renderPageNumbers().map((num, idx) => num === -1 ? (<Pagination.Ellipsis key={`ell-${idx}`} disabled />) : (
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

            {/* Import Confirmation Modal */}
            <Modal show={showImportModal} onHide={() => setShowImportModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Confirmation d'importation</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Voulez-vous réellement lancer l'importation du fichier?
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowImportModal(false)}>
                        Annuler
                    </Button>
                    <Button variant="primary" onClick={confirmImport}>
                        Confirmer
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Import Validation Modal */}
            <Modal show={showValidationModal} onHide={() => setShowValidationModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Validation de l'importation</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Traitement terminé. {importedData.length} paramètres trouvés.</p>
                    <div className="table-responsive" style={{ maxHeight: '300px' }}>
                        <Table bordered size="sm">
                            <thead>
                                <tr>
                                    <th>Paramètre</th>
                                    <th>Valeur Normale</th>
                                </tr>
                            </thead>
                            <tbody>
                                {importedData.slice(0, 10).map((row, idx) => (
                                    <tr key={idx}>
                                        <td>{row.Param_designation}</td>
                                        <td>{row.ValeurNormale}</td>
                                    </tr>
                                ))}
                                {importedData.length > 10 && (
                                    <tr>
                                        <td colSpan={2} className="text-center">
                                            ... et {importedData.length - 10} autres lignes
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                    <p className="mt-3">Voulez-vous valider l'importation ?</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowValidationModal(false)}>
                        Annuler
                    </Button>
                    <Button variant="primary" onClick={validateImport} disabled={importLoading}>
                        {importLoading && <Spinner as="span" animation="border" size="sm" className="me-2" />}
                        Valider l'importation
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default ListeParamLabo;
