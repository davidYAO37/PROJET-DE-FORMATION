"use client";
import { useEffect, useState } from "react";
import { Button, Spinner, Alert } from "react-bootstrap";
import axios from "axios";
import { Approvisionnement } from "@/types/Approvisionnement";
import ListeApprovisionnement from "./ListeApprovisionnement";
import AjouterAchat from "./AjouterAchat";
import { Pharmacie } from "@/types/pharmacie";
import ModifierAchat from "./ModifierAchat";

export default function ActesPage() {
    const [achat, setAchat] = useState<Approvisionnement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showAjouterAchat, setShowAjouterAchat] = useState(false);
    const [medicaments,setMedicaments] = useState<Pharmacie[]>([]);
    const [showEdit, setShowEdit] = useState(false);
    const [selected, setSelected] = useState<Approvisionnement | null>(null);

    useEffect(() => {
        const fetchActes = async () => {
            try {
                const res = await axios.get<Approvisionnement[]>("/api/approvisionnement");
                setAchat(res.data);
            } catch (err: any) {
                setError(err.response?.data?.message || err.message || "Erreur inconnue");
            } finally {
                setLoading(false);
            }
        };
        fetchActes();
    }, []);

    const handleAdd = (a: Approvisionnement) => {
        setAchat((prev) => [...prev, a]);
        setShowAjouterAchat(false);
    };
    // Charger les médicaments
useEffect(() => {
  const chargerMedicaments = async () => {
    try {
      const res = await fetch("/api/medicaments");
      const data = await res.json();
      setMedicaments(data);
    } catch (err) {
      console.error("Erreur lors du chargement des médicaments", err);
    }
  };
  chargerMedicaments();
}, []);

    const handleEdit = (a: Approvisionnement) => {
        setAchat((prev) => prev.map((x) => (x._id === a._id ? a : x)));
        setShowEdit(false);
    };

    const handleEditClick = (a: Approvisionnement) => {
        setSelected(a);
        setShowEdit(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Voulez-vous vraiment supprimer ce Approvisionnements ?")) return;
        try {
            await axios.delete(`/api/approvisionnement/${id}`);
            setAchat((prev) => prev.filter((Approvisionnements) => Approvisionnements._id !== id));
        } catch (err: any) {
            alert("Erreur lors de la suppression : " + (err.response?.data?.error || err.message));
        }
    };

    return (
        <div className="container py-4">
            <h2 className="mb-3">Liste des achats</h2>

            {error && <Alert variant="danger">{error}</Alert>}

            {loading ? (
                <div className="text-center my-4">
                    <Spinner animation="border" /> Chargement...
                </div>
            ) : (
                <>
                    <Button variant="success" onClick={() => setShowAjouterAchat(true)} className="mb-3">
                        + Ajouter un Achat
                    </Button>

                    {achat.length === 0 ? (
                        <p className="text-muted">Aucun Achat disponible.</p>
                    ) : (
                        <ListeApprovisionnement Approvisionnements={achat} onEdit={handleEditClick} onDelete={handleDelete} />
                    )}
                </>
            )}

            {/* Modales */}
            <AjouterAchat  show={showAjouterAchat} onHide={() => setShowAjouterAchat(false)} onAdd={handleAdd} medicaments={medicaments}/>
            <ModifierAchat show={showEdit} onHide={() => setShowEdit(false)} Approvisionnement={selected} onSave={handleEdit} medicaments={medicaments} />
        </div>
    );
}
