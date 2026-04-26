"use client";
import { useEffect, useState } from "react";
import { Button, Spinner, Alert } from "react-bootstrap";
import axios from "axios";
import ListeAffection from "./ListeAffection";
import AjouterAffection from "./AjouterAffection";
import ModifierAffection from "./ModifierAffection";
import { Affection } from "@/types/affection";

export default function AffectionPage() {
    const [affections, setAffections] = useState<Affection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showAdd, setShowAdd] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [selected, setSelected] = useState<Affection | null>(null);

    useEffect(() => {
        const fetchAffections = async () => {
            try {
                const res = await axios.get<Affection[]>("/api/affections");
                setAffections(res.data);
            } catch (err: any) {
                setError(err.response?.data?.message || err.message || "Erreur inconnue");
            } finally {
                setLoading(false);
            }
        };
        fetchAffections();
    }, []);

    const handleAdd = (a: Affection) => {
        setAffections((prev) => [...prev, a]);
        setShowAdd(false);
    };

    const handleEdit = (a: Affection) => {
        setAffections((prev) => prev.map((x) => (x._id === a._id ? a : x)));
        setShowEdit(false);
    };

    const handleEditClick = (a: Affection) => {
        setSelected(a);
        setShowEdit(true);
    };

    const handleDelete = async (id: string) => {
        console.log('Tentative de suppression - ID:', id, 'Type:', typeof id);
        
        if (!confirm("Voulez-vous vraiment supprimer cette affection ?")) return;
        
        try {
            const response = await axios.delete(`/api/affections/${id}`);
            console.log('Suppression réussie:', response.data);
            
            // Mettre à jour la liste localement
            setAffections((prev) => prev.filter((affection) => affection._id !== id));
            
            // Afficher un message de succès
            alert("Affection supprimée avec succès");
        } catch (err: any) {
            console.error('Erreur lors de la suppression:', err);
            console.error('Réponse d\'erreur:', err.response?.data);
            
            const errorMessage = err.response?.data?.error || err.message || "Erreur inconnue";
            alert("Erreur lors de la suppression : " + errorMessage);
        }
    };

    return (
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-center">
                <h2 className="mb-3">Liste des Affections</h2>
                <Button variant="success" onClick={() => setShowAdd(true)}>
                    + Ajouter une affection
                </Button>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            {loading ? (
                <div className="text-center my-4">
                    <Spinner animation="border" /> Chargement...
                </div>
            ) : (
                <>
                    {affections.length === 0 ? (
                        <p className="text-muted">Aucune affection disponible.</p>
                    ) : (
                        <ListeAffection affections={affections} onEdit={handleEditClick} onDelete={handleDelete} />
                    )}
                </>
            )}

            {/* Modales */}
            <AjouterAffection show={showAdd} onHide={() => setShowAdd(false)} onAdd={handleAdd} />
            <ModifierAffection show={showEdit} onHide={() => setShowEdit(false)} affection={selected} onSave={handleEdit} />
        </div>
    );
}