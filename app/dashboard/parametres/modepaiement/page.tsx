"use client";

import { useEffect, useState } from "react";
import { Row, Col } from "react-bootstrap";
import AjouteModePaiement from "./AjouterModePaiement";
import ListeModePaiement from "./ListeModePaiement";
import ModifierModePaiement from "./ModifierModePaiement";

export default function PageTypeActe() {
    const [data, setData] = useState<any[]>([]);
    const [selected, setSelected] = useState<any | null>(null);
    const [selectedFamilleId, setSelectedFamilleId] = useState<string | null>(null);
    const [showEdit, setShowEdit] = useState(false);

    const fetchData = async () => {
        const res = await fetch("/api/modepaiement");
        const result = await res.json();
        setData(result.data || []);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAdd = async (formData: any) => {
        await fetch("/api/modepaiement", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });
        fetchData();
    };

    const handleEdit = async (formData: any) => {
        await fetch(`/api/modepaiement/${formData._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });
        fetchData();
    };

    const handleDelete = async (id: string) => {

        try {
            if (!window.confirm("Voulez-vous vraiment supprimer ce mode de paiement ?")) {
                return;
            }

            await fetch(`/api/modepaiement/${id}`, { method: "DELETE" });
            fetchData();
            alert("Mode de paiement supprimé avec succès");
        } catch (err) {
            console.error("Erreur lors de la suppression", err);
            alert("Erreur lors de la suppression du mode de paiement");
        }
    };

    return (
        <div className="container-fluid mt-4">
            <h3>Gestion des modes de paiement</h3>
            <Row>
                <Col md={4}>
                    <AjouteModePaiement onSave={handleAdd} />
                    <ListeModePaiement
                        data={data}
                        onEdit={(item) => { setSelected(item); setShowEdit(true); }}
                        onDelete={handleDelete}
                        onSelect={(item) => setSelectedFamilleId(item._id)}
                        selectedId={selectedFamilleId}
                    />
                </Col>
            </Row>
            <ModifierModePaiement
                show={showEdit}
                onHide={() => setShowEdit(false)}
                data={selected}
                onSave={handleEdit}
            />
        </div>
    );
}
