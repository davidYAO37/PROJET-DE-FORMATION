"use client";
import { error } from "console";
import React, { useEffect, useMemo, useState } from "react";
import { Card, Row, Col, Table, Spinner, Button, Form, Nav, Tab, Badge, Modal } from "react-bootstrap";

// Import des composants de modales
import FicheConsultationUpdateCaisse from "../componant/factureAttenteConsult/FicheConsultationUpdateCaisse";
import ExamenHospitalisationModalCaisse from "../componant/FactureExamHospit/ExamenHospitModalCaisse";
import { FaRegWindowClose } from "react-icons/fa";

/**
 * PageListeApayer.tsx
 *
 * - Affiche 2 vues :
 *    A) Vue fusionnée (tout dans un tableau)
 *    B) Vue en onglets (Consultations | Prestations | Prescriptions)
 *
 * - Utilise 3 fetch séparés:
 *    /api/consultations/en-attente
 *    /api/prestations/en-attente
 *    /api/prescriptions/en-attente
 *
 * - Chaque endpoint doit retourner un tableau d'objets minimal:
 *    {
 *      id,
 *      code,
 *      patient,
 *      designation,
 *      montant,       // number
 *      medecin,
 *      assure,
 *      typeSpecific...
 *    }
 *
 * - Stubs: actions (facturer, voir) sont implémentés comme callbacks à compléter.
 */

/* -------------------- Types locales -------------------- */
type RowItemBase = {
    id: string;
    code: string;
    patient: string;
    designation: string;
    montant: number;
    medecin?: string;
    assure?: string;
    type: "CONSULTATION" | "PRESTATION" | "PRESCRIPTION";
    raw?: any;
    // Ajoutez ces champs optionnels
    dateEntree?: string | Date;
    dateSortie?: string | Date;
    nombreDeJours?: number;
    renseignementclinique?: string;
};

/* -------------------- Composant -------------------- */
const PageListeApayer = () => {
    const [consultations, setConsultations] = useState<RowItemBase[]>([]);
    const [prestations, setPrestations] = useState<RowItemBase[]>([]);
    const [prescriptions, setPrescriptions] = useState<RowItemBase[]>([]);

    const [loadingConsult, setLoadingConsult] = useState(false);
    const [loadingPrest, setLoadingPrest] = useState(false);
    const [loadingPresc, setLoadingPresc] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState<string>("");

    // État pour la gestion des modales
    const [showModal, setShowModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<RowItemBase | null>(null);
    const [selectedRow, setSelectedRow] = useState<any>(null);

    const hospitalisationId =
        selectedRow?.IDHOSPITALISATION ||
        selectedRow?.IdHospitalisation ||
        selectedRow?.idHospitalisation ||
        selectedRow?.id ||
        selectedRow?._id ||
        null;

    // Fonction pour gérer l'ouverture de la modale appropriée

    const handleOpenModal = (r: RowItemBase, row: any) => {
        console.log("Selected Row Data:", {
            ...row,
            dateEntree: row.dateEntree,
            dateSortie: row.dateSortie,
            renseignementclinique: row.renseignementclinique || row.Rclinique
        });
        setSelectedItem(r);
        setSelectedRow(row);
        setShowModal(true);
    };
    const handleMarkAsNotBilled = async (row: any) => {
        console.log('handleMarkAsNotBilled appelé avec:', row);

        // Récupérer l'ID MongoDB (vérifier d'abord row.id puis row._id)
        const examenId = row.id || row._id;
        console.log('ID extrait:', { id: row.id, _id: row._id, examenId });

        if (!examenId) {
            console.error('ID non trouvé dans row:', row);
            alert("Erreur : Impossible d'identifier l'acte.");
            return;
        }

        const isConfirmed = window.confirm(
            'Voulez-vous retirer cet acte de la liste de paiement ?'
        );
        if (!isConfirmed) return;

        try {
            let endpoint = '';
            let typeActe = '';
            let method = 'PUT';

            console.log("Type de l'acte:", row.type);
            console.log("ID Mongo:", examenId);

            // Déterminer l'endpoint en fonction du type d'acte
            switch (row.type) {
                case 'CONSULTATION':
                    endpoint = `/api/consnonFacture/${examenId}`;
                    typeActe = 'la consultation';
                    break;

                case 'PRESTATION':
                    endpoint = `/api/examenhospitalisationFacture/${examenId}`;
                    typeActe = "l'examen";
                    break;

                case 'PRESCRIPTION':
                    endpoint = `/api/patientPrescription/${examenId}`;
                    typeActe = 'la prescription';
                    break;

                default:
                    throw new Error(`Type d'acte non pris en charge : ${row.type}`);
            }

            console.log('Endpoint:', endpoint);

            // Effectuer la requête
            const response = await fetch(endpoint, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ statutPrescriptionMedecin: 1 })
            });

            // Gérer la réponse en différenciant JSON et HTML (page d'erreur)
            let data: any = null;
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                try {
                    data = await response.json();
                } catch (err) {
                    console.error('Erreur parsing JSON:', err);
                    const text = await response.text();
                    console.error('Réponse serveur (text):', text);
                    throw new Error('Réponse serveur invalide (JSON attendu)');
                }
            } else {
                // Si ce n'est pas du JSON, lire le texte (probablement une page d'erreur HTML)
                const text = await response.text();
                console.error('Réponse non-JSON du serveur:', text);
                throw new Error('Réponse serveur invalide (HTML reçu). Voir la console serveur pour plus de détails.');
            }

            // Vérifier la réponse
            if (!response.ok) {
                let errorMessage = `Échec de la mise à jour de ${typeActe}`;

                if (data && data.error === 'INVALID_ID') {
                    errorMessage = "ID d'acte invalide";
                } else if (data && data.error === 'NOT_FOUND') {
                    errorMessage = `${typeActe} introuvable`;
                } else if (data && data.error === 'DATABASE_CONNECTION_ERROR') {
                    errorMessage = 'Erreur de connexion à la base de données';
                } else if (data && data.message) {
                    errorMessage = data.message;
                }

                throw new Error(errorMessage);
            }

            if (!data || !data.success) {
                throw new Error((data && data.message) || `Échec de la mise à jour de ${typeActe}`);
            }

            // Mise à jour réussie
            alert(`${typeActe.charAt(0).toUpperCase() + typeActe.slice(1)} retirée de la liste de paiement avec succès`);

            // Rafraîchir les données
            await refetchData();

        } catch (error) {
            console.error('Erreur lors de la mise à jour:', error);

            // Afficher un message d'erreur approprié
            if (error instanceof Error) {
                if (error.message.includes('fetch failed')) {
                    alert('Erreur de connexion au serveur. Veuillez vérifier votre connexion internet.');
                } else {
                    alert(`Erreur : ${error.message}`);
                }
            } else {
                alert('Une erreur inattendue est survenue');
            }
        }
    };

    // Fonction pour fermer la modale et rafraîchir la liste
    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedItem(null);
        // Rafraîchir les données après fermeture de la modale
        refetchData();
    };

    // Fonction pour rafraîchir toutes les données
    const refetchData = async () => {
        try {
            setError(null);

            // Recharger Consultations
            const consultRes = await fetch("/api/consultationFacture/consultAttentePaiement");
            const consultData = await consultRes.json();
            const consultItems: RowItemBase[] = Array.isArray(consultData)
                ? consultData.map((d: any) => ({
                    id: d.id ?? d._id,
                    code: d.code ?? d.CodePrestation ?? "",
                    patient: d.patient ?? d.PatientP ?? d.nom ?? "Inconnu",
                    designation: d.designation ?? d.designationC ?? "Consultation",
                    montant: Number((d.montant ?? 0)),
                    medecin: d.medecin ?? d.Medecin ?? "",
                    assure: d.assure ?? d.Assure ?? "",
                    type: "CONSULTATION",
                    raw: d,
                }))
                : [];
            setConsultations(consultItems);

            // Recharger Prestations
            const prestRes = await fetch("/api/consultationFacture/prestationAttentePaiement");
            const prestData = await prestRes.json();
            const prestItems: RowItemBase[] = Array.isArray(prestData)
                ? prestData.map((d: any) => ({
                    id: d.id ?? d._id,
                    code: d.code ?? d.CodePrestation ?? "",
                    patient: d.patient ?? d.PatientP ?? "Inconnu",
                    designation: d.designation ?? d.Designationtypeacte ?? "Prestation",
                    montant: Number(d.montant ?? 0),
                    medecin: d.medecin ?? d.NomMed ?? "",
                    assure: d.assure ?? d.Assure ?? "",
                    type: "PRESTATION",
                    // Ajoutez ces champs
                    dateEntree: d.Entrele ?? null,
                    dateSortie: d.SortieLe ?? null,
                    nombreDeJours: d.nombreDeJours ?? 1,
                    renseignementclinique: d.Rclinique ?? "",
                    raw: d,
                }))
                : [];
            setPrestations(prestItems);

            // Recharger Prescriptions
            const prescRes = await fetch("/api/consultationFacture/prescriptionAttentePaiement");
            const prescData = await prescRes.json();
            const prescItems: RowItemBase[] = Array.isArray(prescData)
                ? prescData.map((d: any) => ({
                    id: d.id ?? d._id,
                    code: d.code ?? d.CodePrestation ?? "",
                    patient: d.patient ?? d.PatientP ?? "Inconnu",
                    designation: d.designation ?? "PHARMACIE",
                    montant: Number(d.montant ?? 0),
                    medecin: d.medecin ?? d.NomMed ?? d.PayéPar ?? "",
                    assure: d.assure ?? "",
                    type: "PRESCRIPTION",
                    raw: d,
                }))
                : [];
            setPrescriptions(prescItems);
        } catch (e: any) {
            console.error("Erreur lors du rafraîchissement des données", e);
            setError("Erreur lors du rafraîchissement des données");
        }
    };

    // UI state
    const [showMerged, setShowMerged] = useState<boolean>(true); // default show merged (A). User can switch B via tabs below.

    /* --------- Fetch helper (3 fetches) --------- */
    useEffect(() => {
        let mounted = true;
        setError(null);

        // Consultations
        (async () => {
            try {
                setLoadingConsult(true);
                const res = await fetch("/api/consultationFacture/consultAttentePaiement");
                const data = await res.json();
                if (!mounted) return;
                // normalize items to RowItemBase
                const items: RowItemBase[] = Array.isArray(data)
                    ? data.map((d: any) => ({
                        id: d.id ?? d._id,
                        code: d.code ?? d.CodePrestation ?? "",
                        patient: d.patient ?? d.PatientP ?? d.nom ?? "Inconnu",
                        designation: d.designation ?? d.designationC ?? "Consultation",
                        montant: Number((d.montant ?? 0)),
                        medecin: d.medecin ?? d.Medecin ?? "",
                        assure: d.assure ?? d.Assure ?? "",
                        type: "CONSULTATION",
                        raw: d,
                    }))
                    : [];
                setConsultations(items);
            } catch (e: any) {
                console.error("Err consult fetch", e);
                setError("Erreur chargement consultations");
            } finally {
                setLoadingConsult(false);
            }
        })();

        // Prestations (ExamensHospitalisation)
        (async () => {
            try {
                setLoadingPrest(true);
                const res = await fetch("/api/consultationFacture/prestationAttentePaiement");
                const data = await res.json();
                if (!mounted) return;
                const items: RowItemBase[] = Array.isArray(data)
                    ? data.map((d: any) => ({
                        id: d.id ?? d._id,
                        code: d.code ?? d.CodePrestation ?? "",
                        patient: d.patient ?? d.PatientP ?? "Inconnu",
                        designation: d.designation ?? d.Designationtypeacte ?? "Prestation",
                        montant: Number(d.montant ?? 0),
                        medecin: d.medecin ?? d.NomMed ?? "",
                        assure: d.assure ?? d.Assure ?? "",
                        type: "PRESTATION",
                        raw: d,
                    }))
                    : [];
                setPrestations(items);
            } catch (e: any) {
                console.error("Err prestations fetch", e);
                setError("Erreur chargement prestations");
            } finally {
                setLoadingPrest(false);
            }
        })();

        // Prescriptions (Pharmacie)
        (async () => {
            try {
                setLoadingPresc(true);
                const res = await fetch("/api/consultationFacture/prescriptionAttentePaiement");
                const data = await res.json();
                if (!mounted) return;
                const items: RowItemBase[] = Array.isArray(data)
                    ? data.map((d: any) => ({
                        id: d.id ?? d._id,
                        code: d.code ?? d.CodePrestation ?? "",
                        patient: d.patient ?? d.PatientP ?? "Inconnu",
                        designation: d.designation ?? "PHARMACIE",
                        montant: Number(d.montant ?? 0),
                        medecin: d.medecin ?? d.NomMed ?? d.PayéPar ?? "",
                        assure: d.assure ?? "",
                        type: "PRESCRIPTION",
                        raw: d,
                    }))
                    : [];
                setPrescriptions(items);
            } catch (e: any) {
                console.error("Err prescriptions fetch", e);
                setError("Erreur chargement prescriptions");
            } finally {
                setLoadingPresc(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, []);

    /* --------- Derived merged list and counters --------- */
    const merged = useMemo(() => {
        return [...consultations, ...prestations, ...prescriptions];
    }, [consultations, prestations, prescriptions]);

    const countConsult = consultations.length;
    const countPrest = prestations.length;
    const countPresc = prescriptions.length;
    const totalCount = merged.length;

    /* --------- Search filter --------- */
    const filteredMerged = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return merged;
        return merged.filter((r) =>
            [r.code, r.patient, r.designation, r.medecin, r.assure]
                .map((v) => (v ?? "").toString().toLowerCase())
                .some((s) => s.includes(q))
        );
    }, [merged, search]);

    const filteredConsult = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return consultations;
        return consultations.filter((r) =>
            [r.code, r.patient, r.designation, r.medecin, r.assure]
                .map((v) => (v ?? "").toString().toLowerCase())
                .some((s) => s.includes(q))
        );
    }, [consultations, search]);

    const filteredPrest = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return prestations;
        return prestations.filter((r) =>
            [r.code, r.patient, r.designation, r.medecin, r.assure]
                .map((v) => (v ?? "").toString().toLowerCase())
                .some((s) => s.includes(q))
        );
    }, [prestations, search]);

    const filteredPresc = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return prescriptions;
        return prescriptions.filter((r) =>
            [r.code, r.patient, r.designation, r.medecin, r.assure]
                .map((v) => (v ?? "").toString().toLowerCase())
                .some((s) => s.includes(q))
        );
    }, [prescriptions, search]);

    /* --------- Render table helper --------- */
    const renderTable = (rows: RowItemBase[]) => {
        return (
            <Table bordered hover responsive>
                <thead className="table-light text-center align-middle">
                    <tr>
                        <th>Type</th>
                        <th>N° Prestation</th>
                        <th>Patient</th>
                        <th>Désignation</th>
                        <th className="text-end">Montant (FCFA)</th>
                        <th>Médecin</th>
                        <th>Assuré</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.length === 0 ? (
                        <tr>
                            <td colSpan={8} className="text-center py-4">
                                Aucun enregistrement.
                            </td>
                        </tr>
                    ) : (
                        rows.map((r) => (
                            <tr key={`${r.type}-${r.id}`} className="align-middle text-center">
                                <td>
                                    <Badge bg={r.type === "CONSULTATION" ? "info" : r.type === "PRESTATION" ? "primary" : "secondary"}>
                                        {r.type}
                                    </Badge>
                                </td>
                                <td>{r.code}</td>
                                <td className="text-start">{r.patient}</td>
                                <td className="text-start">{r.designation}</td>
                                <td className="text-end fw-bold">{Number.isFinite(r.montant) ? r.montant.toLocaleString() : "0"}</td>
                                <td>{r.medecin ?? "-"}</td>
                                <td>{r.assure ?? "-"}</td>
                                <td>
                                    <div className="d-flex gap-1 justify-content-center">
                                        <Button
                                            variant="outline-warning"
                                            size="sm"
                                            onClick={() => handleOpenModal(r, r.raw)}                                         >
                                            Facturer
                                        </Button>
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            title="Ne pas Facturer"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                console.log('Bouton cliqué, données de la ligne:', {
                                                    id: r.id,
                                                    type: r.type,
                                                    patient: r.patient,
                                                    montant: r.montant
                                                });
                                                handleMarkAsNotBilled(r);
                                            }}
                                            className="ms-1"
                                        >
                                            <FaRegWindowClose />
                                        </Button>

                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </Table>
        );
    };

    /* --------- Indicateur de chargement lors de l'exécution d'une récupération --------- */
    const anyLoading = loadingConsult || loadingPrest || loadingPresc;

    return (
        <Card className="p-3">
            <Row className="mb-3 align-items-center">
                <Col md={6}>
                    <h5>Liste des Prestations à Payer</h5>
                </Col>
                <Col md={6} className="d-flex justify-content-end align-items-center gap-2">
                    <div className="text-end me-2">
                        <div>Total : <strong>{totalCount}</strong></div>
                        <div className="small text-muted">Cons: {countConsult} • Prest: {countPrest} • Pharm: {countPresc}</div>
                    </div>
                </Col>
            </Row>

            <Row className="mb-3">
                <Col md={8}>
                    <Form.Control placeholder="Rechercher par code / patient / medecin ..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </Col>
            </Row>

            {anyLoading && (
                <div className="text-center py-3">
                    <Spinner animation="border" /> Chargement...
                </div>
            )}

            {/* ----------Tableau fusionné ---------- */}
            {showMerged && !anyLoading && (
                <Card className="p-2 mb-3">
                    {renderTable(filteredMerged)}
                </Card>
            )}


            {error && <div className="text-danger mt-2">{error}</div>}

            {/* Modal pour les consultations */}
            {selectedItem?.type === "CONSULTATION" && (
                <Modal
                    show={showModal}
                    onHide={handleCloseModal}
                    size="xl"
                    backdrop="static"
                >
                    <Modal.Body className="p-0">
                        <FicheConsultationUpdateCaisse
                            patient={selectedItem.raw?.patient || null}
                            onClose={handleCloseModal}
                            consultationId={selectedItem.id}
                        />
                    </Modal.Body>
                </Modal>
            )}

            {/* Modal pour les prestations */}
            {selectedItem?.type === "PRESTATION" && (
                <ExamenHospitalisationModalCaisse
                    show={showModal && selectedItem?.type === "PRESTATION"}
                    onHide={handleCloseModal}
                    CodePrestation={selectedRow?.CodePrestation || selectedRow?.code || ""}
                    Designationtypeacte={selectedRow?.Designationtypeacte || selectedRow?.designation || ""}
                    PatientP={selectedRow?.PatientP || selectedRow?.patient || ""}
                    examenHospitId={selectedRow?._id || selectedRow?.id || ""}
                    dateEntree={selectedRow?.dateEntree || selectedRow?.Entrele || null}
                    dateSortie={selectedRow?.dateSortie || selectedRow?.SortieLe || null}
                    nombreDeJours={selectedRow?.nombreDeJours || 1}
                    renseignementclinique={selectedRow?.renseignementclinique || selectedRow?.Rclinique || ""}
                />
            )}

            {/* Modal pour les prescriptions */}
            {selectedItem?.type === "PRESCRIPTION" && (
                <Modal
                    show={showModal}
                    onHide={handleCloseModal}
                    size="lg"
                >
                    <Modal.Header closeButton>
                        <Modal.Title>Facturation Prescription</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="p-3">
                            <h5>Facturation pour la prescription #{selectedItem.code}</h5>
                            <p>Patient: {selectedItem.patient}</p>
                            <p>Montant: {selectedItem.montant.toLocaleString()} FCFA</p>

                            <div className="mt-3">
                                <h6>Options de facturation</h6>
                                <Form>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Mode de paiement</Form.Label>
                                        <Form.Select>
                                            <option>Espèces</option>
                                            <option>Carte bancaire</option>
                                            <option>Virement</option>
                                            <option>Chèque</option>
                                        </Form.Select>
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Montant reçu</Form.Label>
                                        <Form.Control
                                            type="number"
                                            placeholder="Entrez le montant reçu"
                                            min={0}
                                            max={selectedItem.montant}
                                            defaultValue={selectedItem.montant}
                                        />
                                    </Form.Group>

                                    <div className="d-flex justify-content-end gap-2">
                                        <Button variant="secondary" onClick={handleCloseModal}>
                                            Annuler
                                        </Button>
                                        <Button variant="primary">
                                            Enregistrer le paiement
                                        </Button>
                                    </div>
                                </Form>
                            </div>
                        </div>
                    </Modal.Body>
                </Modal>
            )}
        </Card >
    );
};

export default PageListeApayer;
