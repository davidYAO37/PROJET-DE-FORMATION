"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Container, Button, Table, Spinner, Form, InputGroup } from "react-bootstrap";
import {
    FaWarehouse, FaTachometerAlt, FaCapsules, FaHistory,
    FaShoppingCart, FaPlus, FaPencilAlt, FaArrowUp,
    FaClipboardList, FaPrint, FaSearch,
} from "react-icons/fa";
import TableauBordStock from "./TableauBordStock";
import HistoriqueMouvements from "./HistoriqueMouvements";
import MouvementsStock from "./MouvementsStock";
import Impression from "./Impression";
import GestionStockMedicaments from "./GestionStockMedicaments";
import AjouterAchat from "@/app/dashboard/medicamentachat/AjouterAchat";
import ModifierAchat from "@/app/dashboard/medicamentachat/ModifierAchat";
import { usePagination } from "@/components/usePagination";
import Pagination from "@/components/Pagination";
import { Pharmacie } from "@/types/pharmacie";
import { Approvisionnement } from "@/types/Approvisionnement";
import Inventaire from "./Inventaire";

const VUES: Record<string, { titre: string; icon: React.ReactNode }> = {
    dashboard:         { titre: "Tableau de bord",          icon: <FaTachometerAlt className="text-primary" /> },
    stock:             { titre: "Gestion du stock",          icon: <FaCapsules className="text-success" /> },
    approvisionnement: { titre: "Approvisionnements",        icon: <FaShoppingCart className="text-warning" /> },
    historique:        { titre: "Historique des mouvements", icon: <FaHistory className="text-info" /> },
    mouvements:        { titre: "Mouvements manuels",        icon: <FaArrowUp className="text-danger" /> },
    inventaire:        { titre: "Inventaire complet",        icon: <FaClipboardList className="text-secondary" /> },
    impression:        { titre: "Impression / Rapports",     icon: <FaPrint className="text-dark" /> },
};

function PageContent() {
    const searchParams = useSearchParams();
    const vue = searchParams.get("vue") || "dashboard";

    const [medicaments, setMedicaments]           = useState<Pharmacie[]>([]);
    const [approvisionnements, setApprovisionnements] = useState<Approvisionnement[]>([]);
    const [loadingAppro, setLoadingAppro]         = useState(false);
    const [showAjouter, setShowAjouter]           = useState(false);
    const [showModifier, setShowModifier]         = useState(false);
    const [selectedAppro, setSelectedAppro]       = useState<Approvisionnement | null>(null);

    // Filtres approvisionnements
    const [searchAppro, setSearchAppro]   = useState("");
    const [dateDebut, setDateDebut]       = useState("");
    const [dateFin, setDateFin]           = useState("");
    const [approPageSize, setApproPageSize] = useState(15);

    useEffect(() => {
        fetch("/api/medicaments")
            .then(r => r.json())
            .then(d => setMedicaments(Array.isArray(d) ? d : []))
            .catch(console.error);
    }, []);

    useEffect(() => {
        if (vue === "approvisionnement") chargerApprovisionnements();
    }, [vue]);

    const chargerApprovisionnements = () => {
        setLoadingAppro(true);
        fetch("/api/approvisionnement")
            .then(r => r.json())
            .then(d => setApprovisionnements(Array.isArray(d) ? d : []))
            .catch(console.error)
            .finally(() => setLoadingAppro(false));
    };

    const handleAdd       = () => { setShowAjouter(false); chargerApprovisionnements(); };
    const handleEdit      = () => { setShowModifier(false); chargerApprovisionnements(); };
    const handleEditClick = (a: Approvisionnement) => { setSelectedAppro(a); setShowModifier(true); };
    const formatDate      = (d: any) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

    const filteredAppro = useMemo(() => {
        const debut = dateDebut ? new Date(dateDebut).getTime() : 0;
        const fin   = dateFin   ? new Date(dateFin + "T23:59:59").getTime() : Infinity;
        return approvisionnements.filter(a => {
            const txt = (a.SaisiPar || "").toLowerCase().includes(searchAppro.toLowerCase()) ||
                        (a.Observations || "").toLowerCase().includes(searchAppro.toLowerCase());
            const d   = a.DateAppro ? new Date(a.DateAppro).getTime() : 0;
            return txt && d >= debut && d <= fin;
        });
    }, [approvisionnements, searchAppro, dateDebut, dateFin]);

    const { slice: approSlice, page: approPage, totalPages: approTotalPages,
            setPage: setApproPage, reset: resetApproPage } = usePagination(filteredAppro, approPageSize);

    const info = VUES[vue] ?? VUES["dashboard"];

    return (
        <Container fluid className="py-3">
            {/* En-tête */}
            <div className="d-flex align-items-center gap-3 mb-4">
                <FaWarehouse size={32} className="text-primary" />
                <div>
                    <h3 className="mb-0 fw-bold">Service Pharmacie</h3>
                    <small className="text-muted d-flex align-items-center gap-2">
                        <span>{info.icon}</span> {info.titre}
                    </small>
                </div>
            </div>

            {vue === "dashboard" && <TableauBordStock />}

            {vue === "stock" && <GestionStockMedicaments />}

            {vue === "approvisionnement" && (
                <>
                    {/* Barre outils */}
                    <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
                        <h5 className="mb-0 fw-bold">Liste des approvisionnements</h5>
                        <Button variant="success" size="sm" onClick={() => setShowAjouter(true)}>
                            <FaPlus className="me-1" /> Nouvel approvisionnement
                        </Button>
                    </div>

                    {/* Filtres */}
                    <div className="d-flex flex-wrap gap-2 mb-3 align-items-end">
                        <InputGroup size="sm" style={{ maxWidth: 260 }}>
                            <InputGroup.Text><FaSearch /></InputGroup.Text>
                            <Form.Control
                                placeholder="Saisi par, observations..."
                                value={searchAppro}
                                onChange={e => { setSearchAppro(e.target.value); resetApproPage(); }}
                            />
                        </InputGroup>
                        <div className="d-flex gap-1 align-items-center">
                            <Form.Control size="sm" type="date" value={dateDebut}
                                onChange={e => { setDateDebut(e.target.value); resetApproPage(); }}
                                style={{ maxWidth: 150 }} />
                            <span className="text-muted small">→</span>
                            <Form.Control size="sm" type="date" value={dateFin}
                                onChange={e => { setDateFin(e.target.value); resetApproPage(); }}
                                style={{ maxWidth: 150 }} />
                        </div>
                        {(searchAppro || dateDebut || dateFin) && (
                            <Button size="sm" variant="outline-secondary"
                                onClick={() => { setSearchAppro(""); setDateDebut(""); setDateFin(""); resetApproPage(); }}>
                                Réinitialiser
                            </Button>
                        )}
                        <span className="text-muted small ms-auto">{filteredAppro.length} résultat(s)</span>
                    </div>

                    {loadingAppro ? (
                        <div className="text-center py-4"><Spinner animation="border" /> Chargement...</div>
                    ) : filteredAppro.length === 0 ? (
                        <div className="text-center text-muted py-4">Aucun approvisionnement trouvé.</div>
                    ) : (
                        <div className="table-responsive">
                            <Table bordered hover size="sm" className="align-middle">
                                <thead className="table-dark text-center">
                                    <tr>
                                        <th>Date</th>
                                        <th>Total HT</th>
                                        <th>TVA</th>
                                        <th>Total TTC</th>
                                        <th>Saisi par</th>
                                        <th>Observations</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {approSlice.map((a, idx) => (
                                        <tr key={a._id ?? idx} className="text-center">
                                            <td>{formatDate(a.DateAppro)}</td>
                                            <td>{(a.PrixHT ?? 0).toLocaleString("fr-FR")}</td>
                                            <td>{(a.tVAApro ?? 0).toLocaleString("fr-FR")}</td>
                                            <td className="fw-bold">{(a.MontantTTC ?? 0).toLocaleString("fr-FR")}</td>
                                            <td>{a.SaisiPar || "—"}</td>
                                            <td className="text-start">{a.Observations || "—"}</td>
                                            <td>
                                                <Button size="sm" variant="outline-primary"
                                                    onClick={() => handleEditClick(a)} title="Modifier">
                                                    <FaPencilAlt />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                            <Pagination
                                page={approPage} totalPages={approTotalPages}
                                total={filteredAppro.length} pageSize={approPageSize}
                                onPage={setApproPage}
                                onPageSize={n => { setApproPageSize(n); resetApproPage(); }}
                            />
                        </div>
                    )}
                </>
            )}

            {vue === "historique" && <HistoriqueMouvements />}
            {vue === "mouvements" && <MouvementsStock />}
            {vue === "inventaire" && <Inventaire />}
            {vue === "impression" && <Impression />}

            <AjouterAchat
                show={showAjouter}
                onHide={() => setShowAjouter(false)}
                onAdd={handleAdd}
                medicaments={medicaments}
            />
            <ModifierAchat
                show={showModifier}
                onHide={() => setShowModifier(false)}
                Approvisionnement={selectedAppro}
                onSave={handleEdit}
                medicaments={medicaments}
            />
        </Container>
    );
}

export default function ServicePharmaciePage() {
    return (
        <Suspense fallback={<div className="text-center py-5"><Spinner animation="border" /></div>}>
            <PageContent />
        </Suspense>
    );
}
