"use client";

import { FormEvent, useEffect, useState } from "react";
import { Alert, Button, Form, Table } from "react-bootstrap";
import { useEntreprise } from "@/hooks/useEntreprise";
import { useRouter } from "next/navigation";

type Apporteur = { _id: string; nom: string; telephone?: string; taux: number; actif: boolean };
const initialForm = { nom: "", telephone: "", taux: 0, actif: true };

export default function ApporteursPage() {
    const { entreprise, loading: loadingEntreprise } = useEntreprise();
    const apporteurActif = !!entreprise?.travailleAvecApporteur;
    const router = useRouter();
    const [apporteurs, setApporteurs] = useState<Apporteur[]>([]);
    const [form, setForm] = useState(initialForm);
    const [editId, setEditId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const charger = async () => {
        if (!apporteurActif) return;
        setApporteurs(await fetch("/api/apporteurs").then(r => r.json()));
    };
    useEffect(() => { charger(); }, [apporteurActif]);

    const enregistrer = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const res = await fetch("/api/apporteurs", {
            method: editId ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...form, id: editId }),
        });
        if (res.ok) {
            setForm(initialForm);
            setEditId(null);
            await charger();
        } else alert((await res.json()).error || "Erreur lors de l'enregistrement");
        setLoading(false);
    };

    if (loadingEntreprise) return <div className="container py-4"><p>Chargement...</p></div>;
    if (!apporteurActif) return <div className="container py-4">
        <h2 className="mb-4">Gestion des apporteurs</h2>
        <Alert variant="warning">
            Cette entreprise ne travaille pas avec des apporteurs. Activez l'option dans les paramètres de l'entreprise.
        </Alert>
        <Button variant="link" onClick={() => router.push('/dashboard/parametres/entreprise')}>Modifier les paramètres de l'entreprise</Button>
    </div>;

    return <div className="container py-4">
        <h2 className="mb-4">Gestion des apporteurs</h2>
        <Form onSubmit={enregistrer} className="card card-body mb-4">
            <div className="row g-3 align-items-end">
                <Form.Group className="col-md-4"><Form.Label>Nom</Form.Label><Form.Control required value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} /></Form.Group>
                <Form.Group className="col-md-3"><Form.Label>Téléphone</Form.Label><Form.Control value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} /></Form.Group>
                <Form.Group className="col-md-2"><Form.Label>Taux (%)</Form.Label><Form.Control required type="number" min={0} max={100} step="0.01" value={form.taux} onChange={e => setForm({ ...form, taux: Number(e.target.value) })} /></Form.Group>
                <Form.Group className="col-md-1"><Form.Check label="Actif" checked={form.actif} onChange={e => setForm({ ...form, actif: e.target.checked })} /></Form.Group>
                <div className="col-md-2"><Button type="submit" disabled={loading}>{editId ? "Modifier" : "Ajouter"}</Button></div>
            </div>
        </Form>
        <Table bordered hover responsive><thead><tr><th>Nom</th><th>Téléphone</th><th>Taux</th><th>Statut</th><th>Action</th></tr></thead><tbody>
            {apporteurs.map(a => <tr key={a._id}><td>{a.nom}</td><td>{a.telephone}</td><td>{a.taux}%</td><td>{a.actif ? "Actif" : "Inactif"}</td><td><Button size="sm" variant="outline-primary" onClick={() => { setEditId(a._id); setForm({ nom: a.nom, telephone: a.telephone || "", taux: a.taux, actif: a.actif }); }}>Modifier</Button></td></tr>)}
        </tbody></Table>
    </div>;
}
