"use client";

import { useEffect, useState } from "react";
import { Button, Spinner, Alert } from "react-bootstrap";
import { FaPlus } from "react-icons/fa";
import axios from "axios";
import { Pharmacie } from "@/types/pharmacie";
import AjouterMedicament from "@/app/dashboard/parametres/medicaments/AjouterMedicament";
import ModifierMedicament from "@/app/dashboard/parametres/medicaments/ModifieMedicament";
import ListeMedicament from "@/app/dashboard/parametres/medicaments/ListeMedicament";

export default function GestionMedicaments() {
    const [medicaments, setMedicaments] = useState<Pharmacie[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showAdd, setShowAdd] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [selected, setSelected] = useState<Pharmacie | null>(null);

    const chargerMedicaments = async () => {
        setLoading(true);
        try {
            const res = await axios.get<Pharmacie[]>("/api/medicaments");
            setMedicaments(res.data);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Erreur inconnue");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        chargerMedicaments();
    }, []);

    const handleAdd = (a: Pharmacie) => {
        setMedicaments((prev) => [...prev, a]);
        setShowAdd(false);
    };

    const handleEdit = (a: Pharmacie) => {
        setMedicaments((prev) => prev.map((x) => (x._id === a._id ? a : x)));
        setShowEdit(false);
    };

    const handleEditClick = (a: Pharmacie) => {
        setSelected(a);
        setShowEdit(true);
    };

    const handleDelete = async (id: string) => {
        try {
            await axios.delete(`/api/medicaments/${id}`);
            setMedicaments((prev) => prev.filter((medicament) => medicament._id !== id));
        } catch (err: any) {
            alert("Erreur lors de la suppression : " + (err.response?.data?.error || err.message));
        }
    };

    return (
        <>
            <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
                <h5 className="mb-0 fw-bold">Liste des médicaments</h5>
                <Button variant="success" size="sm" onClick={() => setShowAdd(true)}>
                    <FaPlus className="me-1" /> Ajouter un médicament
                </Button>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            {loading ? (
                <div className="text-center my-4">
                    <Spinner animation="border" /> Chargement...
                </div>
            ) : medicaments.length === 0 ? (
                <p className="text-muted">Aucun médicament disponible.</p>
            ) : (
                <ListeMedicament Medicaments={medicaments} onEdit={handleEditClick} onDelete={handleDelete} />
            )}

            <AjouterMedicament show={showAdd} onHide={() => setShowAdd(false)} onAdd={handleAdd} />
            <ModifierMedicament show={showEdit} onHide={() => setShowEdit(false)} Medicament={selected} onSave={handleEdit} />
        </>
    );
}
