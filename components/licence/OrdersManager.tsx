"use client";

import React, { useEffect, useState } from "react";
import { Table, Form, InputGroup, Button, Badge, Row, Col, Spinner, Modal, Card, Tabs, Tab, ListGroup } from "react-bootstrap";
import { FaSearch, FaFilePdf, FaPrint, FaEye, FaCheck, FaTrash, FaDownload } from "react-icons/fa";

interface OrderLight {
    _id: string;
    entrepriseId: string;
    action: string;
    status: string;
    amount: number;
    currency: string;
    durationMonths: number;
    createdAt: string;
    orderFormUrl?: string;
    acquisitionContractUrl?: string;
    maintenanceContractUrl?: string;
    paymentReceiptUrl?: string;
}

export default function OrdersManager({ onUpdated }: { onUpdated?: () => void }) {
    const [orders, setOrders] = useState<OrderLight[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selectedOrder, setSelectedOrder] = useState<OrderLight | null>(null);
    const [orderHistory, setOrderHistory] = useState<any[]>([]);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        fetchOrders();
    }, [statusFilter]);

    async function fetchOrders() {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter) params.set("status", statusFilter);
            const res = await fetch(`/api/licence/orders?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setOrders(data || []);
            }
        } catch (e) {
            // ignore
        } finally {
            setLoading(false);
        }
    }

    function formatDate(d?: string) {
        if (!d) return "-";
        return new Date(d).toLocaleString("fr-FR");
    }

    function statusBadge(s: string) {
        if (s === "pending") return <Badge bg="info">En attente</Badge>;
        if (s === "paid_awaiting_validation") return <Badge bg="warning">Payé (attente validation)</Badge>;
        if (s === "validated") return <Badge bg="success">Validée</Badge>;
        if (s === "failed") return <Badge bg="danger">Échouée</Badge>;
        if (s === "cancelled") return <Badge bg="secondary">Annulée</Badge>;
        return <Badge bg="light" text="dark">{s}</Badge>;
    }

    const filtered = orders.filter((o) => {
        if (search) {
            const s = search.toLowerCase();
            return (
                o._id.toLowerCase().includes(s) ||
                o.action.toLowerCase().includes(s) ||
                String(o.amount).includes(s)
            );
        }
        return true;
    });

    const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

    async function validateOrder(id: string) {
        setActionLoading(id);
        try {
            const res = await fetch(`/api/licence/orders/${id}/validate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });
            if (res.ok) {
                await fetchOrders();
                onUpdated?.();
            }
        } catch (e) { }
        setActionLoading(null);
    }

    async function cancelOrder(id: string) {
        setActionLoading(id);
        try {
            const res = await fetch(`/api/licence/orders/${id}/cancel`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });
            if (res.ok) {
                await fetchOrders();
                onUpdated?.();
            }
        } catch (e) { }
        setActionLoading(null);
    }

    async function loadOrderHistory(order: OrderLight | null) {
        if (!order) return;
        try {
            const res = await fetch(`/api/licence/history/${order.entrepriseId}`);
            if (res.ok) {
                const data = await res.json();
                // filter entries for this order
                const filtered = (data || []).filter((h: any) => h.orderId && String(h.orderId) === String(order._id));
                setOrderHistory(filtered);
            }
        } catch (e) {
            // ignore
        }
    }

    return (
        <div>
            <Card className="mb-3">
                <Card.Body>
                    <Row className="g-2 align-items-center">
                        <Col md={4}>
                            <InputGroup>
                                <Form.Control placeholder="Rechercher par id, action, montant..." value={search} onChange={(e) => setSearch(e.target.value)} />
                                <Button variant="outline-secondary" onClick={() => setSearch("")}><FaSearch /></Button>
                            </InputGroup>
                        </Col>
                        <Col md={3}>
                            <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                <option value="">Tous statuts</option>
                                <option value="pending">En attente</option>
                                <option value="paid_awaiting_validation">Payé (attente validation)</option>
                                <option value="validated">Validée</option>
                                <option value="failed">Échouée</option>
                                <option value="cancelled">Annulée</option>
                            </Form.Select>
                        </Col>
                        <Col md={2}>
                            <Form.Select value={String(pageSize)} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
                                <option value="5">5</option>
                                <option value="10">10</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
                            </Form.Select>
                        </Col>
                        <Col md={3} className="text-end">
                            <Button variant="outline-primary" onClick={() => { const csv = toCsv(filtered); downloadCsv(csv, 'orders.csv'); }}><FaDownload className="me-1" />Export CSV</Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Card>
                <Card.Body>
                    {loading ? (
                        <div className="text-center"><Spinner animation="border" /></div>
                    ) : (
                        <Table hover responsive>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Entreprise</th>
                                    <th>Action</th>
                                    <th>Montant</th>
                                    <th>Durée</th>
                                    <th>Créée</th>
                                    <th>Statut</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map((o) => (
                                    <tr key={o._id}>
                                        <td>{o._id}</td>
                                        <td>{o.entrepriseId}</td>
                                        <td>{o.action === "maintenance" ? "Maintenance" : "Achat licence"}</td>
                                        <td>{o.amount?.toLocaleString?.('fr-FR') || o.amount} {o.currency}</td>
                                        <td>{o.action === "maintenance" ? "12 mois" : "Perpétuelle"}</td>
                                        <td>{formatDate(o.createdAt)}</td>
                                        <td>{statusBadge(o.status)}</td>
                                        <td className="text-end">
                                            <div className="d-flex gap-2 justify-content-end">
                                                <Button size="sm" variant="light" onClick={() => setSelectedOrder(o)} title="Détails"><FaEye /></Button>
                                                {o.orderFormUrl && <Button size="sm" variant="outline-primary" onClick={() => window.open(o.orderFormUrl, '_blank')} title="Bon de commande"><FaFilePdf /></Button>}
                                                {o.paymentReceiptUrl && <Button size="sm" variant="outline-warning" onClick={() => window.open(o.paymentReceiptUrl, '_blank')} title="Reçu"><FaFilePdf /></Button>}
                                                {o.acquisitionContractUrl && <Button size="sm" variant="outline-secondary" onClick={() => window.open(o.acquisitionContractUrl, '_blank')} title="Contrat"><FaFilePdf /></Button>}
                                                {o.status !== 'validated' && (
                                                    <>
                                                        <Button size="sm" variant="success" disabled={actionLoading === o._id} onClick={() => validateOrder(o._id)} title="Valider"><FaCheck /></Button>
                                                        <Button size="sm" variant="danger" disabled={actionLoading === o._id} onClick={() => cancelOrder(o._id)} title="Annuler"><FaTrash /></Button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}

                    <div className="d-flex justify-content-between align-items-center mt-2">
                        <div>Affichage {Math.min(filtered.length, (page - 1) * pageSize + 1)} - {Math.min(filtered.length, page * pageSize)} sur {filtered.length}</div>
                        <div className="d-flex gap-2">
                            <Button variant="outline-secondary" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Préc.</Button>
                            <Button variant="outline-secondary" size="sm" disabled={page * pageSize >= filtered.length} onClick={() => setPage(p => p + 1)}>Suiv.</Button>
                        </div>
                    </div>
                </Card.Body>
            </Card>

            <Modal show={!!selectedOrder} onHide={() => setSelectedOrder(null)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Commande #{selectedOrder?._id}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedOrder && (
                        <Tabs defaultActiveKey="summary" id="order-tabs">
                            <Tab eventKey="summary" title="Résumé">
                                <Row className="mt-3">
                                    <Col md={6}>
                                        <h6>Résumé</h6>
                                        <ListGroup variant="flush">
                                            <ListGroup.Item><strong>Action:</strong> {selectedOrder.action === "maintenance" ? "Maintenance annuelle" : "Achat licence perpétuelle"}</ListGroup.Item>
                                            <ListGroup.Item><strong>Montant:</strong> {selectedOrder.amount?.toLocaleString?.('fr-FR') || selectedOrder.amount} {selectedOrder.currency}</ListGroup.Item>
                                            <ListGroup.Item><strong>Durée:</strong> {selectedOrder.action === "maintenance" ? "12 mois" : "Perpétuelle"}</ListGroup.Item>
                                            <ListGroup.Item><strong>Statut:</strong> {selectedOrder.status}</ListGroup.Item>
                                            <ListGroup.Item><strong>Créée:</strong> {new Date(selectedOrder.createdAt).toLocaleString('fr-FR')}</ListGroup.Item>
                                        </ListGroup>
                                    </Col>
                                    <Col md={6}>
                                        <h6>Entreprise</h6>
                                        <div>{selectedOrder.entrepriseId}</div>
                                    </Col>
                                </Row>
                            </Tab>
                            <Tab eventKey="documents" title="Documents">
                                <div className="mt-3">
                                    <ListGroup>
                                        <ListGroup.Item>
                                            <strong>Bon de commande:</strong>{' '}
                                            {selectedOrder.orderFormUrl ? (<a href={selectedOrder.orderFormUrl} target="_blank">Ouvrir</a>) : <span className="text-muted">—</span>}
                                        </ListGroup.Item>
                                        <ListGroup.Item>
                                            <strong>Contrat d'acquisition:</strong>{' '}
                                            {selectedOrder.acquisitionContractUrl ? (<a href={selectedOrder.acquisitionContractUrl} target="_blank">Ouvrir</a>) : <span className="text-muted">—</span>}
                                        </ListGroup.Item>
                                        <ListGroup.Item>
                                            <strong>Contrat maintenance:</strong>{' '}
                                            {selectedOrder.maintenanceContractUrl ? (<a href={selectedOrder.maintenanceContractUrl} target="_blank">Ouvrir</a>) : <span className="text-muted">—</span>}
                                        </ListGroup.Item>
                                        <ListGroup.Item>
                                            <strong>Reçu paiement:</strong>{' '}
                                            {selectedOrder.paymentReceiptUrl ? (<a href={selectedOrder.paymentReceiptUrl} target="_blank">Ouvrir</a>) : <span className="text-muted">—</span>}
                                        </ListGroup.Item>
                                    </ListGroup>
                                </div>
                            </Tab>
                            <Tab eventKey="timeline" title="Timeline">
                                <div className="mt-3">
                                    <Button size="sm" variant="link" onClick={() => loadOrderHistory(selectedOrder)}>Rafraîchir</Button>
                                    {orderHistory.length === 0 ? (
                                        <div className="text-muted">Aucun événement pour cette commande.</div>
                                    ) : (
                                        <ListGroup className="mt-2">
                                            {orderHistory.map((h) => (
                                                <ListGroup.Item key={h._id}>
                                                    <div className="d-flex justify-content-between">
                                                        <div>
                                                            <strong>{h.action}</strong>
                                                            <div className="small text-muted">{h.notes || ''}</div>
                                                        </div>
                                                        <div className="small text-muted">{new Date(h.createdAt).toLocaleString('fr-FR')}</div>
                                                    </div>
                                                </ListGroup.Item>
                                            ))}
                                        </ListGroup>
                                    )}
                                </div>
                            </Tab>
                            <Tab eventKey="actions" title="Actions">
                                <div className="mt-3 d-flex gap-2">
                                    {selectedOrder.status !== 'validated' && (
                                        <>
                                            <Button variant="success" onClick={() => validateOrder(selectedOrder._id)}><FaCheck /> Valider</Button>
                                            <Button variant="danger" onClick={() => cancelOrder(selectedOrder._id)}><FaTrash /> Annuler</Button>
                                        </>
                                    )}
                                    <Button variant="secondary" onClick={() => { window.open(selectedOrder.orderFormUrl || '#', '_blank'); }}><FaFilePdf /> Ouvrir bon</Button>
                                </div>
                            </Tab>
                        </Tabs>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setSelectedOrder(null)}>Fermer</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

function toCsv(items: any[]) {
    if (!items || items.length === 0) return "";
    const keys = Object.keys(items[0]);
    const lines = [keys.join(",")];
    items.forEach((it) => {
        lines.push(keys.map((k) => JSON.stringify(it[k] ?? "")).join(","));
    });
    return lines.join("\n");
}

function downloadCsv(csv: string, filename: string) {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
