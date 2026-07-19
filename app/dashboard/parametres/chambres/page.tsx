"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Card, Col, Form, Row, Spinner, Table } from "react-bootstrap";

interface ChambreItem {
    _id: string;
    numero: string;
    type: string;
    service: string;
    tarifJournalier: number;
    prixClinique?: number;
    prixMutuel?: number;
    prixPreferentiel?: number;
    nombreLits: number;
    etat: string;
}

interface LitItem {
    _id: string;
    numero: string;
    chambreId: string;
    service: string;
    tarifJournalier?: number;
    prixClinique?: number;
    prixMutuel?: number;
    prixPreferentiel?: number;
    etat: string;
    patientId?: string;
}

export default function ChambreEtLitPage() {
    const [chambres, setChambres] = useState<ChambreItem[]>([]);
    const [lits, setLits] = useState<LitItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [roomForm, setRoomForm] = useState({
        numero: "",
        type: "standard",
        service: "Hospitalisation",
        tarifJournalier: "0",
        prixClinique: "0",
        prixMutuel: "0",
        prixPreferentiel: "0",
        nombreLits: "1",
    });
    const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
    const [bedForm, setBedForm] = useState({
        numero: "",
        chambreId: "",
        service: "Hospitalisation",
        tarifJournalier: "0",
        prixClinique: "0",
        prixMutuel: "0",
        prixPreferentiel: "0",
    });
    const [editingBedId, setEditingBedId] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resChambres, resLits] = await Promise.all([fetch("/api/chambres"), fetch("/api/lits")]);
            const [dataChambres, dataLits] = await Promise.all([
                resChambres.ok ? resChambres.json() : [],
                resLits.ok ? resLits.json() : [],
            ]);
            setChambres(Array.isArray(dataChambres) ? dataChambres : []);
            setLits(Array.isArray(dataLits) ? dataLits : []);
        } catch (error) {
            console.error(error);
            setMessage("Erreur lors du chargement des chambres et lits");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchData();
    }, []);

    const resetRoomForm = () => {
        setRoomForm({
            numero: "",
            type: "standard",
            service: "Hospitalisation",
            tarifJournalier: "0",
            prixClinique: "0",
            prixMutuel: "0",
            prixPreferentiel: "0",
            nombreLits: "1",
        });
        setEditingRoomId(null);
    };

    const resetBedForm = () => {
        setBedForm({
            numero: "",
            chambreId: "",
            service: "Hospitalisation",
            tarifJournalier: "0",
            prixClinique: "0",
            prixMutuel: "0",
            prixPreferentiel: "0",
        });
        setEditingBedId(null);
    };

    const handleCreateRoom = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setMessage(editingRoomId ? "Mise à jour de la chambre en cours..." : "Création de la chambre en cours...");
        try {
            const payload = {
                numero: roomForm.numero,
                type: roomForm.type,
                service: roomForm.service,
                tarifJournalier: Number(roomForm.tarifJournalier || 0),
                prixClinique: Number(roomForm.prixClinique || 0),
                prixMutuel: Number(roomForm.prixMutuel || 0),
                prixPreferentiel: Number(roomForm.prixPreferentiel || 0),
                nombreLits: Number(roomForm.nombreLits || 1),
                etat: "libre",
            };

            const response = await fetch(editingRoomId ? `/api/chambres/${editingRoomId}` : "/api/chambres", {
                method: editingRoomId ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error(editingRoomId ? "Échec de la mise à jour" : "Échec de la création");
            resetRoomForm();
            await fetchData();
            setMessage(editingRoomId ? "Chambre mise à jour avec succès" : "Chambre créée avec succès");
        } catch (error) {
            console.error(error);
            setMessage(editingRoomId ? "Erreur lors de la mise à jour de la chambre" : "Erreur lors de la création de la chambre");
        }
    };

    const handleEditRoom = (chambre: ChambreItem) => {
        setEditingRoomId(chambre._id);
        setRoomForm({
            numero: chambre.numero,
            type: chambre.type,
            service: chambre.service,
            tarifJournalier: String(chambre.tarifJournalier || 0),
            prixClinique: String(chambre.prixClinique || 0),
            prixMutuel: String(chambre.prixMutuel || 0),
            prixPreferentiel: String(chambre.prixPreferentiel || 0),
            nombreLits: String(chambre.nombreLits || 1),
        });
    };

    const handleDeleteRoom = async (chambreId: string) => {
        if (!window.confirm("Supprimer cette chambre et ses lits associés ?")) return;
        try {
            const response = await fetch(`/api/chambres/${chambreId}`, { method: "DELETE" });
            if (!response.ok) throw new Error("Échec de suppression");
            await fetchData();
            setMessage("Chambre supprimée");
        } catch (error) {
            console.error(error);
            setMessage("Erreur lors de la suppression de la chambre");
        }
    };

    const handleCreateBed = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setMessage(editingBedId ? "Mise à jour du lit en cours..." : "Création du lit en cours...");
        try {
            const payload = {
                numero: bedForm.numero,
                chambreId: bedForm.chambreId,
                service: bedForm.service,
                tarifJournalier: Number(bedForm.tarifJournalier || 0),
                prixClinique: Number(bedForm.prixClinique || 0),
                prixMutuel: Number(bedForm.prixMutuel || 0),
                prixPreferentiel: Number(bedForm.prixPreferentiel || 0),
                etat: "libre",
            };

            const response = await fetch(editingBedId ? `/api/lits/${editingBedId}` : "/api/lits", {
                method: editingBedId ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error(editingBedId ? "Échec de la mise à jour" : "Échec de la création");
            resetBedForm();
            await fetchData();
            setMessage(editingBedId ? "Lit mis à jour avec succès" : "Lit créé avec succès");
        } catch (error) {
            console.error(error);
            setMessage(editingBedId ? "Erreur lors de la mise à jour du lit" : "Erreur lors de la création du lit");
        }
    };

    const handleEditBed = (lit: LitItem) => {
        setEditingBedId(lit._id);
        setBedForm({
            numero: lit.numero,
            chambreId: lit.chambreId,
            service: lit.service,
            tarifJournalier: String(lit.tarifJournalier || 0),
            prixClinique: String(lit.prixClinique || 0),
            prixMutuel: String(lit.prixMutuel || 0),
            prixPreferentiel: String(lit.prixPreferentiel || 0),
        });
    };

    const handleDeleteBed = async (litId: string) => {
        if (!window.confirm("Supprimer ce lit ?")) return;
        try {
            const response = await fetch(`/api/lits/${litId}`, { method: "DELETE" });
            if (!response.ok) throw new Error("Échec de suppression");
            await fetchData();
            setMessage("Lit supprimé");
        } catch (error) {
            console.error(error);
            setMessage("Erreur lors de la suppression du lit");
        }
    };

    const roomStats = useMemo(() => ({
        chambres: chambres.length,
        lits: lits.length,
        libres: lits.filter((lit) => lit.etat === "libre").length,
        occupes: lits.filter((lit) => lit.etat === "occupe").length,
    }), [chambres, lits]);

    return (
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1">Gestion des chambres et lits</h2>
                    <p className="text-muted mb-0">Configuration des unités d’hospitalisation et de leurs tarifs.</p>
                </div>
            </div>

            {message ? <Alert variant="info">{message}</Alert> : null}

            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" />
                </div>
            ) : (
                <>
                    <Row className="g-3 mb-4">
                        <Col md={3}>
                            <Card className="border-primary">
                                <Card.Body>
                                    <div className="text-muted">Chambres</div>
                                    <h3>{roomStats.chambres}</h3>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={3}>
                            <Card className="border-success">
                                <Card.Body>
                                    <div className="text-muted">Lits</div>
                                    <h3>{roomStats.lits}</h3>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={3}>
                            <Card className="border-secondary">
                                <Card.Body>
                                    <div className="text-muted">Lits libres</div>
                                    <h3>{roomStats.libres}</h3>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={3}>
                            <Card className="border-danger">
                                <Card.Body>
                                    <div className="text-muted">Lits occupés</div>
                                    <h3>{roomStats.occupes}</h3>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    <Row className="g-4">
                        <Col lg={6}>
                            <Card className="mb-4">
                                <Card.Header className="fw-bold">Ajouter / modifier une chambre</Card.Header>
                                <Card.Body>
                                    <Form onSubmit={handleCreateRoom}>
                                        <Row className="g-2">
                                            <Col md={6}>
                                                <Form.Control placeholder="Numéro" value={roomForm.numero} onChange={(e) => setRoomForm({ ...roomForm, numero: e.target.value })} required />
                                            </Col>
                                            <Col md={6}>
                                                <Form.Control placeholder="Type" value={roomForm.type} onChange={(e) => setRoomForm({ ...roomForm, type: e.target.value })} />
                                            </Col>
                                            <Col md={6}>
                                                <Form.Control placeholder="Service" value={roomForm.service} onChange={(e) => setRoomForm({ ...roomForm, service: e.target.value })} />
                                            </Col>
                                            <Col md={3}>
                                                <Form.Control type="number" placeholder="Tarif" value={roomForm.tarifJournalier} onChange={(e) => setRoomForm({ ...roomForm, tarifJournalier: e.target.value })} />
                                            </Col>
                                            <Col md={3}>
                                                <Form.Control type="number" placeholder="Lits" value={roomForm.nombreLits} onChange={(e) => setRoomForm({ ...roomForm, nombreLits: e.target.value })} />
                                            </Col>
                                            <Col md={4}>
                                                <Form.Control type="number" placeholder="Prix clinique" value={roomForm.prixClinique} onChange={(e) => setRoomForm({ ...roomForm, prixClinique: e.target.value })} />
                                            </Col>
                                            <Col md={4}>
                                                <Form.Control type="number" placeholder="Prix mutuel" value={roomForm.prixMutuel} onChange={(e) => setRoomForm({ ...roomForm, prixMutuel: e.target.value })} />
                                            </Col>
                                            <Col md={4}>
                                                <Form.Control type="number" placeholder="Prix préférentiel" value={roomForm.prixPreferentiel} onChange={(e) => setRoomForm({ ...roomForm, prixPreferentiel: e.target.value })} />
                                            </Col>
                                            <Col xs={12} className="d-flex gap-2">
                                                <Button type="submit" variant="outline-primary" size="sm">{editingRoomId ? "Enregistrer" : "Ajouter"}</Button>
                                                {editingRoomId ? (
                                                    <Button type="button" variant="outline-secondary" size="sm" onClick={resetRoomForm}>Annuler</Button>
                                                ) : null}
                                            </Col>
                                        </Row>
                                    </Form>
                                </Card.Body>
                            </Card>

                            <Card>
                                <Card.Header className="fw-bold">Liste des chambres</Card.Header>
                                <Card.Body className="p-0">
                                    <Table responsive hover className="mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Chambre</th>
                                                <th>Type</th>
                                                <th>État</th>
                                                <th>Tarifs</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {chambres.map((chambre) => (
                                                <tr key={chambre._id}>
                                                    <td>{chambre.numero}</td>
                                                    <td>{chambre.type}</td>
                                                    <td><Badge bg={chambre.etat === "libre" ? "success" : "danger"}>{chambre.etat}</Badge></td>
                                                    <td>
                                                        <div className="small">Clinique: {chambre.prixClinique ?? chambre.tarifJournalier ?? 0} FCFA</div>
                                                        <div className="small">Mutuel: {chambre.prixMutuel ?? 0} FCFA</div>
                                                        <div className="small">Préférentiel: {chambre.prixPreferentiel ?? 0} FCFA</div>
                                                    </td>
                                                    <td>
                                                        <Button size="sm" variant="outline-secondary" className="me-2" onClick={() => handleEditRoom(chambre)}>Éditer</Button>
                                                        <Button size="sm" variant="outline-danger" onClick={() => handleDeleteRoom(chambre._id)}>Supprimer</Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col lg={6}>
                            <Card className="mb-4">
                                <Card.Header className="fw-bold">Ajouter / modifier un lit</Card.Header>
                                <Card.Body>
                                    <Form onSubmit={handleCreateBed}>
                                        <Row className="g-2">
                                            <Col md={6}>
                                                <Form.Control placeholder="Numéro du lit" value={bedForm.numero} onChange={(e) => setBedForm({ ...bedForm, numero: e.target.value })} required />
                                            </Col>
                                            <Col md={6}>
                                                <Form.Select value={bedForm.chambreId} onChange={(e) => setBedForm({ ...bedForm, chambreId: e.target.value })} required>
                                                    <option value="">Choisir chambre</option>
                                                    {chambres.map((chambre) => (
                                                        <option key={chambre._id} value={chambre._id}>{chambre.numero}</option>
                                                    ))}
                                                </Form.Select>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Control placeholder="Service" value={bedForm.service} onChange={(e) => setBedForm({ ...bedForm, service: e.target.value })} />
                                            </Col>
                                            <Col md={6}>
                                                <Form.Control type="number" placeholder="Tarif" value={bedForm.tarifJournalier} onChange={(e) => setBedForm({ ...bedForm, tarifJournalier: e.target.value })} />
                                            </Col>
                                            <Col md={4}>
                                                <Form.Control type="number" placeholder="Prix clinique" value={bedForm.prixClinique} onChange={(e) => setBedForm({ ...bedForm, prixClinique: e.target.value })} />
                                            </Col>
                                            <Col md={4}>
                                                <Form.Control type="number" placeholder="Prix mutuel" value={bedForm.prixMutuel} onChange={(e) => setBedForm({ ...bedForm, prixMutuel: e.target.value })} />
                                            </Col>
                                            <Col md={4}>
                                                <Form.Control type="number" placeholder="Prix préférentiel" value={bedForm.prixPreferentiel} onChange={(e) => setBedForm({ ...bedForm, prixPreferentiel: e.target.value })} />
                                            </Col>
                                            <Col xs={12} className="d-flex gap-2">
                                                <Button type="submit" variant="outline-success" size="sm">{editingBedId ? "Enregistrer" : "Ajouter"}</Button>
                                                {editingBedId ? (
                                                    <Button type="button" variant="outline-secondary" size="sm" onClick={resetBedForm}>Annuler</Button>
                                                ) : null}
                                            </Col>
                                        </Row>
                                    </Form>
                                </Card.Body>
                            </Card>

                            <Card>
                                <Card.Header className="fw-bold">Liste des lits</Card.Header>
                                <Card.Body className="p-0">
                                    <Table responsive hover className="mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Lit</th>
                                                <th>Chambre</th>
                                                <th>État</th>
                                                <th>Tarifs</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {lits.map((lit) => (
                                                <tr key={lit._id}>
                                                    <td>{lit.numero}</td>
                                                    <td>{chambres.find((ch) => ch._id === lit.chambreId)?.numero || "—"}</td>
                                                    <td><Badge bg={lit.etat === "libre" ? "success" : "danger"}>{lit.etat}</Badge></td>
                                                    <td>
                                                        <div className="small">Tarif: {lit.tarifJournalier ?? 0} FCFA</div>
                                                        <div className="small">Clinique: {lit.prixClinique ?? 0} FCFA</div>
                                                    </td>
                                                    <td>
                                                        <Button size="sm" variant="outline-secondary" className="me-2" onClick={() => handleEditBed(lit)}>Éditer</Button>
                                                        <Button size="sm" variant="outline-danger" onClick={() => handleDeleteBed(lit._id)}>Supprimer</Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </>
            )}
        </div>
    );
}
