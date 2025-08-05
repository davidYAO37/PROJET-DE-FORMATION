"use client";
import React, { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import ListeAssurance from "./ListeAssurance";
import AjouterAssurance from "./AjouterAssurance";
import ModifierAssurance from "./ModifierAssurance";
import { Assurance } from "@/types/assurance";
import Sidebar from "@/components/Sidebar";

export default function AssurancePage() {
    const [assurances, setAssurances] = useState<Assurance[]>([]);
    const [showAdd, setShowAdd] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [selected, setSelected] = useState<Assurance | null>(null);

    useEffect(() => {
        fetch("/api/assurances")
            .then((res) => res.json())
            .then(setAssurances);
    }, []);

    const handleAdd = (a: Assurance) => {
        setAssurances((prev) => [...prev, a]);
        setShowAdd(false);
    };
    const handleEdit = (a: Assurance) => {
        setAssurances((prev) => prev.map((x) => (x._id === a._id ? a : x)));
        setShowEdit(false);
    };
    const handleEditClick = (a: Assurance) => {
        setSelected(a);
        setShowEdit(true);
    };

    return (

        <div className="container py-4">
            <h2>Liste des Assurances</h2>
            <Button variant="success" onClick={() => setShowAdd(true)} className="mb-3">
                Ajouter une assurance
            </Button>
            <ListeAssurance assurances={assurances} onEdit={handleEditClick} />
            <AjouterAssurance show={showAdd} onHide={() => setShowAdd(false)} onAdd={handleAdd} />
            <ModifierAssurance show={showEdit} onHide={() => setShowEdit(false)} assurance={selected} onSave={handleEdit} />
        </div>
    );
}
