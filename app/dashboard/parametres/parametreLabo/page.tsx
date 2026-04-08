"use client";
import { useEffect, useState } from "react";
import { Button, Spinner, Alert } from "react-bootstrap";
import axios from "axios";
import { ParamLabo } from "@/types/ParamLabo";
import AjouterParam from "./AjouterParam";
import ModifierParam from "./ModifierParam";
import ListeParamLabo from "./ListeParamLabo";

export default function ParametreLaboPage() {
    const [paramLabos, setParamLabos] = useState<ParamLabo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showAdd, setShowAdd] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [selected, setSelected] = useState<ParamLabo | null>(null);

    useEffect(() => {
        const fetchParamLabos = async () => {
            try {
                const res = await axios.get<ParamLabo[]>("/api/paramlabo");
                setParamLabos(res.data);
            } catch (err: any) {
                setError(err.response?.data?.message || err.message || "Erreur inconnue");
            } finally {
                setLoading(false);
            }
        };
        fetchParamLabos();
    }, []);

    const handleAdd = (param: ParamLabo) => {
        setParamLabos((prev) => [...prev, param]);
        setShowAdd(false);
    };

    const handleEdit = (param: ParamLabo) => {
        setParamLabos((prev) => prev.map((x) => (x._id === param._id ? param : x)));
        setShowEdit(false);
    };

    const handleEditClick = (param: ParamLabo) => {
        setSelected(param);
        setShowEdit(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Voulez-vous vraiment supprimer ce paramètre ?")) return;
        try {
            await axios.delete(`/api/paramlabo/${id}`);
            setParamLabos((prev) => prev.filter((param) => param._id !== id));
        } catch (err: any) {
            alert("Erreur lors de la suppression : " + (err.response?.data?.error || err.message));
        }
    };

    return (
        <div className="container py-4">
            <h2 className="mb-3">Liste des Paramètres Laboratoire</h2>

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

                    {paramLabos.length === 0 ? (
                        <p className="text-muted">Aucun paramètre disponible.</p>
                    ) : (
                        <ListeParamLabo 
                            ParamLabos={paramLabos} 
                            onEdit={handleEditClick} 
                            onDelete={handleDelete}
                            onAdd={() => setShowAdd(true)}
                        />
                    )}
                </>
            )}

            {/* Modales */}
            <AjouterParam show={showAdd} onHide={() => setShowAdd(false)} onAdd={handleAdd} />
            <ModifierParam show={showEdit} onHide={() => setShowEdit(false)} ParamLabo={selected} onSave={handleEdit} />
        </div>
    );
}
