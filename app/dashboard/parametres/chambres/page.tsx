"use client";

import { useEffect, useState } from "react";
import { Button, Spinner, Alert } from "react-bootstrap";
import axios from "axios";
import ListeChambre from "./ListeChambre";
import AjouterChambre from "./AjouterChambre";
import ModifierChambre from "./ModifierChambre";

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

export default function ChambresPage() {
    const [chambres, setChambres] = useState<ChambreItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showAdd, setShowAdd] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [selected, setSelected] = useState<ChambreItem | null>(null);

    useEffect(() => {
        const fetchChambres = async () => {
            try {
                const res = await axios.get<ChambreItem[]>("/api/chambres");
                setChambres(res.data);
            } catch (err: any) {
                setError(err.response?.data?.message || err.message || "Erreur inconnue");
            } finally {
                setLoading(false);
            }
        };
        fetchChambres();
    }, []);

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
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-center">
                <h2 className="mb-3">Gestion des Chambres</h2>
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
        </div>
    );
}
