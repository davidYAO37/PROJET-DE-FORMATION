"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, Row, Col, Table, Badge, Spinner, Button, Form } from "react-bootstrap";
import { FaExclamationTriangle, FaBoxOpen, FaCalendarTimes, FaSync, FaCubes } from "react-icons/fa";
import PharmacieModalPharmAccueil from "../PharmacieAccueil/PharmacieModalPharmAccueil";

interface AlertesStock {
    ruptures: number;
    rupturesListe: any[];
    sousSeuilMin: number;
    sousSeuilMinListe: any[];
    lotsProchesPeremption: number;
    lotsProchesPeremptionListe: any[];
    lotsPerimes: number;
    lotsPerimesListe: any[];
    totalMedicamentsEnStock: number;
}

export default function TableauBordStock() {
    const [alertes, setAlertes] = useState<AlertesStock | null>(null);
    const [loading, setLoading] = useState(true);
    const [onglet, setOnglet] = useState<"ruptures" | "seuil" | "peremption" | "perimes">("ruptures");
    const [joursPeremption, setJoursPeremption] = useState(30);
    const [showPharmacieModalPharmAccueil, setShowPharmacieModalPharmAccueil] = useState(false);

    const chargerAlertes = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/stock/alertes?joursPeremption=${joursPeremption}`);
            const data = await res.json();
            setAlertes(data);
        } catch (err) {
            console.error("Erreur chargement alertes:", err);
        } finally {
            setLoading(false);
        }
    }, [joursPeremption]);

    useEffect(() => {
        chargerAlertes();
    }, [chargerAlertes]);

    const getBadgeVariant = (count: number) =>
        count === 0 ? "success" : count < 5 ? "warning" : "danger";

    const formatDate = (d: any) =>
        d ? new Date(d).toLocaleDateString("fr-FR") : "—";

    const joursRestants = (d: any) => {
        if (!d) return null;
        const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
        return diff;
    };

    const lignesOnglet = () => {
        if (!alertes) return [];
        if (onglet === "ruptures") return alertes.rupturesListe;
        if (onglet === "seuil") return alertes.sousSeuilMinListe;
        if (onglet === "peremption") return alertes.lotsProchesPeremptionListe;
        if (onglet === "perimes") return alertes.lotsPerimesListe;
        return [];
    };

    return (
        <div>
            {/* ===== KPI CARDS ===== */}
            <Row className="g-3 mb-4">
                <Col xs={6} md={3}>
                    <Card
                        className={`border-0 shadow-sm text-white h-100 ${(alertes?.ruptures ?? 0) > 0 ? "bg-danger" : "bg-success"}`}
                        style={{ cursor: "pointer" }}
                        onClick={() => setOnglet("ruptures")}
                    >
                        <Card.Body className="d-flex align-items-center gap-3">
                            <FaBoxOpen size={36} />
                            <div>
                                <div className="fs-2 fw-bold">
                                    {loading ? <Spinner size="sm" animation="border" /> : alertes?.ruptures ?? 0}
                                </div>
                                <div className="small">Ruptures de stock</div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={6} md={3}>
                    <Card
                        className={`border-0 shadow-sm text-white h-100 ${(alertes?.sousSeuilMin ?? 0) > 0 ? "bg-warning text-dark" : "bg-success"}`}
                        style={{ cursor: "pointer" }}
                        onClick={() => setOnglet("seuil")}
                    >
                        <Card.Body className="d-flex align-items-center gap-3">
                            <FaExclamationTriangle size={36} />
                            <div>
                                <div className="fs-2 fw-bold">
                                    {loading ? <Spinner size="sm" animation="border" /> : alertes?.sousSeuilMin ?? 0}
                                </div>
                                <div className="small">Sous seuil minimum</div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={6} md={3}>
                    <Card
                        className={`border-0 shadow-sm text-white h-100 ${(alertes?.lotsProchesPeremption ?? 0) > 0 ? "bg-warning text-dark" : "bg-success"}`}
                        style={{ cursor: "pointer" }}
                        onClick={() => setOnglet("peremption")}
                    >
                        <Card.Body className="d-flex align-items-center gap-3">
                            <FaCalendarTimes size={36} />
                            <div>
                                <div className="fs-2 fw-bold">
                                    {loading ? <Spinner size="sm" animation="border" /> : alertes?.lotsProchesPeremption ?? 0}
                                </div>
                                <div className="small">Bientôt périmés</div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={6} md={3}>
                    <Card
                        className={`border-0 shadow-sm text-white h-100 ${(alertes?.lotsPerimes ?? 0) > 0 ? "bg-danger" : "bg-success"}`}
                        style={{ cursor: "pointer" }}
                        onClick={() => setOnglet("perimes")}
                    >
                        <Card.Body className="d-flex align-items-center gap-3">
                            <FaCubes size={36} />
                            <div>
                                <div className="fs-2 fw-bold">
                                    {loading ? <Spinner size="sm" animation="border" /> : alertes?.lotsPerimes ?? 0}
                                </div>
                                <div className="small">Lots périmés</div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* ===== CONTROLS ===== */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex gap-2">
                    <Button size="sm" variant={onglet === "ruptures" ? "danger" : "outline-danger"} onClick={() => setOnglet("ruptures")}>
                        Ruptures <Badge bg="light" text="dark">{alertes?.ruptures ?? 0}</Badge>
                    </Button>
                    <Button size="sm" variant={onglet === "seuil" ? "warning" : "outline-warning"} onClick={() => setOnglet("seuil")}>
                        Seuil min <Badge bg="light" text="dark">{alertes?.sousSeuilMin ?? 0}</Badge>
                    </Button>
                    <Button size="sm" variant={onglet === "peremption" ? "info" : "outline-info"} onClick={() => setOnglet("peremption")}>
                        Péremption <Badge bg="light" text="dark">{alertes?.lotsProchesPeremption ?? 0}</Badge>
                    </Button>
                    <Button size="sm" variant={onglet === "perimes" ? "dark" : "outline-dark"} onClick={() => setOnglet("perimes")}>
                        Périmés <Badge bg="light" text="dark">{alertes?.lotsPerimes ?? 0}</Badge>
                    </Button>
                     <Button
                                variant="outline-warning"
                                title="Ajouter une ordonnance"
                                size="sm"
                                onClick={() => setShowPharmacieModalPharmAccueil(true)}
                              >
                                Ajouter une ordonnance
                              </Button>
                              {/* Modal ajouter examens*hospit ... */}
                              <PharmacieModalPharmAccueil
                                show={showPharmacieModalPharmAccueil}
                                onHide={() => setShowPharmacieModalPharmAccueil(false)}
                              />
                </div>
                <div className="d-flex align-items-center gap-2">
                    <Form.Label className="mb-0 small text-muted">Alerte péremption (jours) :</Form.Label>
                    <Form.Control
                        type="number"
                        size="sm"
                        style={{ width: 80 }}
                        value={joursPeremption}
                        min={1}
                        onChange={e => setJoursPeremption(Number(e.target.value))}
                    />
                    <Button size="sm" variant="outline-secondary" onClick={chargerAlertes}>
                        <FaSync /> Actualiser
                    </Button>
                </div>
            </div>

            {/* ===== TABLE DES ALERTES ===== */}
            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" /> Chargement...
                </div>
            ) : (
                <div className="table-responsive">
                    <Table bordered hover size="sm" className="text-center align-middle">
                        <thead className="table-dark">
                            {(onglet === "ruptures" || onglet === "seuil") && (
                                <tr>
                                    <th>Référence</th>
                                    <th>Médicament</th>
                                    <th>Qté en stock</th>
                                    <th>Seuil minimum</th>
                                    <th>Statut</th>
                                </tr>
                            )}
                            {(onglet === "peremption" || onglet === "perimes") && (
                                <tr>
                                    <th>Référence</th>
                                    <th>Médicament</th>
                                    <th>N° Lot</th>
                                    <th>Quantité</th>
                                    <th>Date péremption</th>
                                    <th>Jours restants</th>
                                </tr>
                            )}
                        </thead>
                        <tbody>
                            {lignesOnglet().length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-muted py-4">
                                        ✅ Aucune alerte dans cette catégorie.
                                    </td>
                                </tr>
                            ) : (
                                lignesOnglet().map((item: any, idx: number) => (
                                    <tr key={item._id ?? idx}>
                                        {(onglet === "ruptures" || onglet === "seuil") && (
                                            <>
                                                <td>{item.Reference || "—"}</td>
                                                <td className="text-start">{item.Medicament || "—"}</td>
                                                <td>
                                                    <Badge bg={(item.QteEnStock ?? 0) <= 0 ? "danger" : "warning"}>
                                                        {item.QteEnStock ?? 0}
                                                    </Badge>
                                                </td>
                                                <td>{item.QteMinimum ?? 0}</td>
                                                <td>
                                                    {(item.QteEnStock ?? 0) <= 0
                                                        ? <Badge bg="danger">RUPTURE</Badge>
                                                        : <Badge bg="warning" text="dark">CRITIQUE</Badge>}
                                                </td>
                                            </>
                                        )}
                                        {(onglet === "peremption" || onglet === "perimes") && (
                                            <>
                                                <td>{item.Reference || "—"}</td>
                                                <td className="text-start">{item.Medicament || "—"}</td>
                                                <td>{item.NumeroLot || "—"}</td>
                                                <td>{item.Quantite ?? 0}</td>
                                                <td>{formatDate(item.DatePeremption)}</td>
                                                <td>
                                                    {(() => {
                                                        const j = joursRestants(item.DatePeremption);
                                                        if (j === null) return "—";
                                                        if (j < 0) return <Badge bg="danger">Périmé ({Math.abs(j)}j)</Badge>;
                                                        if (j <= 7) return <Badge bg="danger">{j}j</Badge>;
                                                        if (j <= 30) return <Badge bg="warning" text="dark">{j}j</Badge>;
                                                        return <Badge bg="info">{j}j</Badge>;
                                                    })()}
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </Table>
                </div>
            )}
        </div>
    );
}
