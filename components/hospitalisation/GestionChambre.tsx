"use client";

import { useEffect, useState } from "react";
import { Button, Spinner, Alert, Modal } from "react-bootstrap";
import axios from "axios";
import ListeChambre from "@/app/dashboard/parametres/chambres/ListeChambre";
import AjouterChambre from "@/app/dashboard/parametres/chambres/AjouterChambre";
import ModifierChambre from "@/app/dashboard/parametres/chambres/ModifierChambre";

interface ChambreItem {
    _id: string;
    numero: string;
    type: string;
    service: string;
    tarifJournalier: number;
    prixClinique: number;
    prixMutuel: number;
    prixPreferentiel: number;
    nombreLits: number;
    etat: string;
    observation?: string;
}

type Props = {
    show: boolean;
    onHide: () => void;
};

export default function GestionChambre({ show, onHide }: Props) {
    const [chambres, setChambres] = useState<ChambreItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showAdd, setShowAdd] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [selected, setSelected] = useState<ChambreItem | null>(null);

    const fetchChambres = async () => {
        setLoading(true);
        try {
            const res = await axios.get<ChambreItem[]>("/api/chambres");
            setChambres(res.data);
            setError("");
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Erreur inconnue");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (show) {
            fetchChambres();
        }
    }, [show]);

    const handleAdd = (chambre: ChambreItem) => {
        setChambres((prev) => [...prev, chambre]);
        setShowAdd(false);
    };

    const handleEdit = (chambre: ChambreItem) => {
        setChambres((prev) => prev.map((x) => (x._id === chambre._id ? chambre : x)));
        setShowEdit(false);
    };

    const handleEditClick = (chambre: ChambreItem) => {
        setSelected(chambre);
        setShowEdit(true);
    };

    const handleDelete = async (id: string) => {
        try {
            await axios.delete(`/api/chambres/${id}`);
            setChambres((prev) => prev.filter((c) => c._id !== id));
        } catch (err: any) {
            alert("Erreur lors de la suppression : " + (err.response?.data?.message || err.message));
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="xl" fullscreen="lg-down">
            <Modal.Header closeButton>
                <Modal.Title>Gestion des Chambres</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="d-flex justify-content-end mb-3">
                    <Button variant="success" onClick={() => setShowAdd(true)}>
                        + Ajouter une chambre
                    </Button>
                </div>

                {error && <Alert variant="danger">{error}</Alert>}

                {loading ? (
                    <div className="text-center my-4">
                        <Spinner animation="border" /> Chargement...
                    </div>
                ) : (
                    <ListeChambre chambres={chambres} onEdit={handleEditClick} onDelete={handleDelete} />
                )}

                <AjouterChambre show={showAdd} onHide={() => setShowAdd(false)} onAdd={handleAdd} chambres={chambres} />
                <ModifierChambre show={showEdit} onHide={() => setShowEdit(false)} chambre={selected} onSave={handleEdit} chambres={chambres} />
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>Fermer</Button>
            </Modal.Footer>
        </Modal>
    );
}
