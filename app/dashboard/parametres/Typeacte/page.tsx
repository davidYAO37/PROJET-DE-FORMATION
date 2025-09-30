"use client";

import { useEffect, useState } from "react";
import ModifieTypeActe from "./ModifieTypeActe";
import ListeTypeActe from "./ListeTypeActe";
import AjoutTypeActe from "./AjouteTypeActe";
export default function PageTypeActe() {
    const [data, setData] = useState<any[]>([]);
    const [selected, setSelected] = useState<any | null>(null);
    const [showEdit, setShowEdit] = useState(false);

    const fetchData = async () => {
        const res = await fetch("/api/typeacte");
        const result = await res.json();
        setData(result);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAdd = async (formData: any) => {
        await fetch("/api/typeacte", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });
        fetchData();
    };

    const handleEdit = async (formData: any) => {
        await fetch(`/api/typeacte/${formData._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });
        fetchData();
    };

    const handleDelete = async (id: string) => {
        await fetch(`/api/typeacte/${id}`, { method: "DELETE" });
        fetchData();
    };

    return (
        <div className="container mt-4">
            <h3>Gestion des Types d’actes</h3>
            <AjoutTypeActe onSave={handleAdd} />
            <ListeTypeActe
                data={data}
                onEdit={(item) => { setSelected(item); setShowEdit(true); }}
                onDelete={handleDelete}
            />
            <ModifieTypeActe
                show={showEdit}
                onHide={() => setShowEdit(false)}
                data={selected}
                onSave={handleEdit}
            />
        </div>
    );
}
