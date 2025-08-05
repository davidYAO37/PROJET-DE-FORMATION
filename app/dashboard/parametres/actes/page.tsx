"use client";
import { useEffect, useState } from "react";
import { Button, Spinner, Alert } from "react-bootstrap";
import axios from "axios";
import ListeActe from "./ListeActe";
import AjouterActe from "./AjouterActe";
import ModifierActe from "./ModifierActe";
import { ActesClinique } from "@/types/acte";

export default function ActesPage() {
    const [actes, setActes] = useState<ActesClinique[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showAdd, setShowAdd] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [selected, setSelected] = useState<ActesClinique | null>(null);

    useEffect(() => {
        const fetchActes = async () => {
            try {
                const res = await axios.get<ActesClinique[]>("/api/actes");
                setActes(res.data);
            } catch (err: any) {
                setError(err.response?.data?.message || err.message || "Erreur inconnue");
            } finally {
                setLoading(false);
            }
        };
        fetchActes();
    }, []);

    const handleAdd = (a: ActesClinique) => {
        setActes((prev) => [...prev, a]);
        setShowAdd(false);
    };

    const handleEdit = (a: ActesClinique) => {
        setActes((prev) => prev.map((x) => (x._id === a._id ? a : x)));
        setShowEdit(false);
    };

    const handleEditClick = (a: ActesClinique) => {
        setSelected(a);
        setShowEdit(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Voulez-vous vraiment supprimer cet acte ?")) return;
        try {
            await axios.delete(`/api/actes/${id}`);
            setActes((prev) => prev.filter((acte) => acte._id !== id));
        } catch (err: any) {
            alert("Erreur lors de la suppression : " + (err.response?.data?.error || err.message));
        }
    };

    return (
        <div className="container py-4">
            <h2 className="mb-3">Liste des Actes Cliniques</h2>

            {error && <Alert variant="danger">{error}</Alert>}

            {loading ? (
                <div className="text-center my-4">
                    <Spinner animation="border" /> Chargement...
                </div>
            ) : (
                <>
                    <Button variant="success" onClick={() => setShowAdd(true)} className="mb-3">
                        + Ajouter un acte
                    </Button>

                    {actes.length === 0 ? (
                        <p className="text-muted">Aucun acte disponible.</p>
                    ) : (
                        <ListeActe actes={actes} onEdit={handleEditClick} onDelete={handleDelete} />
                    )}
                </>
            )}

            {/* Modales */}
            <AjouterActe show={showAdd} onHide={() => setShowAdd(false)} onAdd={handleAdd} />
            <ModifierActe show={showEdit} onHide={() => setShowEdit(false)} acte={selected} onSave={handleEdit} />
        </div>
    );
}
