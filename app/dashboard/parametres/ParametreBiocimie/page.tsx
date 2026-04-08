"use client";
import { useEffect, useState } from "react";
import { Button, Spinner, Alert } from "react-bootstrap";
import axios from "axios";
import { ParamBiochimie } from "@/types/ParamBiochimie";
import AjouterParamBiochimie from "./AjouterParamBiochimie";
import ModifierParamBiochimie from "./ModifierParamBiochimie";
import ListeParamBiochimie from "./ListeParamBiochimie";

export default function ParametreBiocimiePage() {
    const [paramBiochimies, setParamBiochimies] = useState<ParamBiochimie[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showAdd, setShowAdd] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [selected, setSelected] = useState<ParamBiochimie | null>(null);

    useEffect(() => {
        const fetchParamBiochimies = async () => {
            try {
                const res = await axios.get<ParamBiochimie[]>("/api/parambiochimie");
                setParamBiochimies(res.data);
            } catch (err: any) {
                setError(err.response?.data?.message || err.message || "Erreur inconnue");
            } finally {
                setLoading(false);
            }
        };
        fetchParamBiochimies();
    }, []);

    const handleAdd = (param: ParamBiochimie) => {
        setParamBiochimies((prev) => [...prev, param]);
        setShowAdd(false);
    };

    const handleEdit = (param: ParamBiochimie) => {
        setParamBiochimies((prev) => prev.map((x) => (x._id === param._id ? param : x)));
        setShowEdit(false);
    };

    const handleEditClick = (param: ParamBiochimie) => {
        setSelected(param);
        setShowEdit(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Voulez-vous vraiment supprimer ce paramètre biochimie ?")) return;
        try {
            await axios.delete(`/api/parambiochimie/${id}`);
            setParamBiochimies((prev) => prev.filter((param) => param._id !== id));
        } catch (err: any) {
            alert("Erreur lors de la suppression : " + (err.response?.data?.error || err.message));
        }
    };

    return (
        <div className="container py-4">
            <h2 className="mb-3">Liste des Paramètres Biochimie</h2>

            {error && <Alert variant="danger">{error}</Alert>}

            {loading ? (
                <div className="text-center my-4">
                    <Spinner animation="border" /> Chargement...
                </div>
            ) : (
                <>
                    <div className="mb-3 d-flex gap-2">
                        <Button variant="success" onClick={() => setShowAdd(true)}>
                            + Ajouter un paramètre
                        </Button>
                    </div>

                    {paramBiochimies.length === 0 ? (
                        <p className="text-muted">Aucun paramètre biochimie disponible.</p>
                    ) : (
                        <ListeParamBiochimie 
                            ParamBiochimies={paramBiochimies} 
                            onEdit={handleEditClick} 
                            onDelete={handleDelete}
                            onAdd={() => setShowAdd(true)}
                        />
                    )}
                </>
            )}

            {/* Modales */}
            <AjouterParamBiochimie show={showAdd} onHide={() => setShowAdd(false)} onAdd={handleAdd} />
            <ModifierParamBiochimie show={showEdit} onHide={() => setShowEdit(false)} ParamBiochimie={selected} onSave={handleEdit} />
        </div>
    );
}
