"use client";
import { useEffect, useState } from "react";
import { Button, Spinner, Alert } from "react-bootstrap";
import axios from "axios";
import { Pharmacie } from "@/types/pharmacie";
import AjouterMedicament from "./AjouterMedicament";
import ModifierMedicament from "./ModifieMedicament";
import ListeMedicament from "./ListeMedicament";

export default function ActesPage() {
    const [medicaments, setMedicaments] = useState<Pharmacie[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showAdd, setShowAdd] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [selected, setSelected] = useState<Pharmacie | null>(null);

    useEffect(() => {
        const fetchActes = async () => {
            try {
                const res = await axios.get<Pharmacie[]>("/api/medicaments");
                setMedicaments(res.data);
            } catch (err: any) {
                setError(err.response?.data?.message || err.message || "Erreur inconnue");
            } finally {
                setLoading(false);
            }
        };
        fetchActes();
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
        if (!confirm("Voulez-vous vraiment supprimer ce medicament ?")) return;
        try {
            await axios.delete(`/api/medicaments/${id}`);
            setMedicaments((prev) => prev.filter((medicament) => medicament._id !== id));
        } catch (err: any) {
            alert("Erreur lors de la suppression : " + (err.response?.data?.error || err.message));
        }
    };

    return (
        <div className="container py-4">
            <h2 className="mb-3">Liste et Tarifs medicaments Cliniques</h2>

            {error && <Alert variant="danger">{error}</Alert>}

            {loading ? (
                <div className="text-center my-4">
                    <Spinner animation="border" /> Chargement...
                </div>
            ) : (
                <>
                    <Button variant="success" onClick={() => setShowAdd(true)} className="mb-3">
                        + Ajouter un medicament
                    </Button>

                    {medicaments.length === 0 ? (
                        <p className="text-muted">Aucun medicament disponible.</p>
                    ) : (
                        <ListeMedicament Medicaments={medicaments} onEdit={handleEditClick} onDelete={handleDelete} />
                    )}
                </>
            )}

            {/* Modales */}
            <AjouterMedicament show={showAdd} onHide={() => setShowAdd(false)} onAdd={handleAdd} />
            <ModifierMedicament show={showEdit} onHide={() => setShowEdit(false)} Medicament={selected} onSave={handleEdit} />
        </div>
    );
}
