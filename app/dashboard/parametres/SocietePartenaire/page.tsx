"use client";

import { useEffect, useState } from "react";
import { Row, Col } from "react-bootstrap";
import AjouterSociete from "./AjouterSociete";
import ListeSocietePartenaire from "./ListeSocietePartenaire";
import ModifierSociete from "./ModifierSociete";
import TableActeSociete from "./TableActeSociete";
import { SocietePartenaire } from "@/types/SocietePartenaire";

export default function PageSocietePartenaire() {
    const [data, setData] = useState<SocietePartenaire[]>([]);
    const [selected, setSelected] = useState<SocietePartenaire | null>(null);
    const [selectedSocieteId, setSelectedSocieteId] = useState<string | null>(null);
    const [showEdit, setShowEdit] = useState(false);

    const fetchData = async () => {
        const res = await fetch("/api/societePartenaire");
        const result = await res.json();
        setData(Array.isArray(result) ? result : []);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAdd = async (formData: Pick<SocietePartenaire, "Designation">) => {
        await fetch("/api/societePartenaire", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });
        fetchData();
    };

    const handleEdit = async (formData: SocietePartenaire) => {
        await fetch(`/api/societePartenaire/${formData._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ Designation: formData.Designation }),
        });
        fetchData();
    };

    const handleDelete = async (id: string) => {
        try {
            const actesRes = await fetch(`/api/ActeSocietePartenaire?societeId=${encodeURIComponent(id)}`);
            const actes = await actesRes.json();
            const actesAssocies = Array.isArray(actes) ? actes : [];

            if (actesAssocies.length > 0) {
                alert(`Impossible de supprimer cette société partenaire car elle contient ${actesAssocies.length} acte(s) associé(s). Veuillez d'abord retirer les actes.`);
                return;
            }

            if (!window.confirm("Voulez-vous vraiment supprimer cette société partenaire ?")) {
                return;
            }

            await fetch(`/api/societePartenaire/${id}`, { method: "DELETE" });
            if (selectedSocieteId === id) {
                setSelectedSocieteId(null);
            }
            fetchData();
            alert("Société partenaire supprimée avec succès");
        } catch (err) {
            console.error("Erreur lors de la suppression", err);
            alert("Erreur lors de la suppression de la société partenaire");
        }
    };

    return (
        <div className="container-fluid mt-4">
            <h3>Gestion des Sociétés Partenaires</h3>
            <Row>
                <Col md={3}>
                    <AjouterSociete onSave={handleAdd} />
                    <ListeSocietePartenaire
                        data={data}
                        onEdit={(item) => { setSelected(item); setShowEdit(true); }}
                        onDelete={handleDelete}
                        onSelect={(item) => setSelectedSocieteId(item._id)}
                        selectedId={selectedSocieteId}
                    />
                </Col>
                <Col md={9}>
                    <TableActeSociete societeId={selectedSocieteId} />
                </Col>
            </Row>
            <ModifierSociete
                show={showEdit}
                onHide={() => setShowEdit(false)}
                data={selected}
                onSave={handleEdit}
            />
        </div>
    );
}
