"use client";

import { useEffect, useState } from "react";
import { Row, Col } from "react-bootstrap";
import AjouteFamilleActe from "./AjouterFamilleActe";
import ListeFamilleActe from "./ListeFamilleActe";
import ModifierFamilleActe from "./ModifierFamilleActe";
import TablePrestation from "./TablePrestation";

export default function PageTypeActe() {
    const [data, setData] = useState<any[]>([]);
    const [selected, setSelected] = useState<any | null>(null);
    const [selectedFamilleId, setSelectedFamilleId] = useState<string | null>(null);
    const [showEdit, setShowEdit] = useState(false);

    const fetchData = async () => {
        const res = await fetch("/api/familleacte");
        const result = await res.json();
        setData(result);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAdd = async (formData: any) => {
        await fetch("/api/familleacte", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });
        fetchData();
    };

    const handleEdit = async (formData: any) => {
        await fetch(`/api/familleacte/${formData._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });
        fetchData();
    };

    const handleDelete = async (id: string) => {
        // Vérifier si la famille a des actes associés
        try {
            const actesRes = await fetch("/api/actes");
            const actes = await actesRes.json();
            const actesAssocies = actes.filter((a: any) => a.IDFAMILLE_ACTE_BIOLOGIE === id);
            
            if (actesAssocies.length > 0) {
                alert(`Impossible de supprimer cette famille car elle contient ${actesAssocies.length} acte(s) associé(s). Veuillez d'abord retirer les actes de cette famille.`);
                return;
            }

            if (!window.confirm("Voulez-vous vraiment supprimer cette famille d'actes ?")) {
                return;
            }

            await fetch(`/api/familleacte/${id}`, { method: "DELETE" });
            fetchData();
            alert("Famille d'actes supprimée avec succès");
        } catch (err) {
            console.error("Erreur lors de la suppression", err);
            alert("Erreur lors de la suppression de la famille d'actes");
        }
    };

    return (
        <div className="container-fluid mt-4">
            <h3>Gestion des Famille d'actes</h3>
            <Row>
                <Col md={4}>
                    <AjouteFamilleActe onSave={handleAdd} />
                    <ListeFamilleActe
                        data={data}
                        onEdit={(item) => { setSelected(item); setShowEdit(true); }}
                        onDelete={handleDelete}
                        onSelect={(item) => setSelectedFamilleId(item._id)}
                        selectedId={selectedFamilleId}
                    />
                </Col>
                <Col md={8}>
                    <TablePrestation familleId={selectedFamilleId} />
                </Col>
            </Row>
            <ModifierFamilleActe
                show={showEdit}
                onHide={() => setShowEdit(false)}
                data={selected}
                onSave={handleEdit}
            />
        </div>
    );
}
