"use client";

import { useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Form, InputGroup, Modal, Spinner, Table } from "react-bootstrap";
import { apiIntrant, formatQte, Intrant } from "./api";
import styles from "./intrants.module.css";

const CATEGORIES = [
  "Réactif d'analyse", "Kit / test unitaire", "Prélèvement", "Recueil et transport",
  "Consommable technique", "Microscopie", "Microbiologie", "Biologie moléculaire",
  "Contrôle qualité / calibration", "Produit pour automate", "Hygiène et protection",
  "Gestion des déchets", "Produit auxiliaire", "Identification et édition", "Autre",
];

const vide = {
  reference: "", designation: "", categorie: "Réactif d'analyse", sousCategorie: "",
  uniteStock: "pièce", conditionnement: "", qteParConditionnement: 1,
  seuilMinimum: 0, seuilMaximum: 0, suiviLot: true,
  delaiApresOuvertureJours: "", conservation: "", fournisseur: "", prixAchat: 0,
};

export default function IntrantCatalogue() {
  const [intrants, setIntrants] = useState<Intrant[]>([]);
  const [recherche, setRecherche] = useState("");
  const [filtreCategorie, setFiltreCategorie] = useState("");
  const [voirInactifs, setVoirInactifs] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [edition, setEdition] = useState<Intrant | null>(null);
  const [form, setForm] = useState<any>(vide);
  const [saving, setSaving] = useState(false);

  const charger = async () => {
    setChargement(true);
    setErreur("");
    try {
      const params = new URLSearchParams();
      if (recherche) params.set("q", recherche);
      if (filtreCategorie) params.set("categorie", filtreCategorie);
      if (!voirInactifs) params.set("actif", "true");
      const data = await apiIntrant(`/api/intrants?${params}`);
      setIntrants(data.data || []);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => { charger(); }, [voirInactifs, filtreCategorie]);

  const ouvrirCreation = () => { setEdition(null); setForm(vide); setShowModal(true); };
  const ouvrirEdition = (i: Intrant) => {
    setEdition(i);
    setForm({ ...vide, ...i, delaiApresOuvertureJours: i.delaiApresOuvertureJours ?? "" });
    setShowModal(true);
  };

  const enregistrer = async () => {
    setSaving(true);
    setErreur("");
    try {
      const payload = {
        ...form,
        qteParConditionnement: Number(form.qteParConditionnement) || 1,
        seuilMinimum: Number(form.seuilMinimum) || 0,
        seuilMaximum: Number(form.seuilMaximum) || 0,
        prixAchat: Number(form.prixAchat) || 0,
        delaiApresOuvertureJours: form.delaiApresOuvertureJours === "" ? undefined : Number(form.delaiApresOuvertureJours),
      };
      if (edition) await apiIntrant(`/api/intrants/${edition._id}`, { method: "PUT", body: JSON.stringify(payload) });
      else await apiIntrant("/api/intrants", { method: "POST", body: JSON.stringify(payload) });
      setShowModal(false);
      charger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur d'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const basculerActif = async (i: Intrant) => {
    try {
      await apiIntrant(`/api/intrants/${i._id}`, { method: "PUT", body: JSON.stringify({ actif: !i.actif }) });
      charger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur");
    }
  };

  const champ = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  return (
    <Card className={styles.panel}>
      <Card.Header className={`${styles.panelHeader} d-flex flex-wrap gap-2 align-items-center`}>
        <h5 className="mb-0 me-auto"><i className="bi bi-boxes me-2 text-primary"></i>Catalogue des intrants</h5>
        <InputGroup style={{ maxWidth: 280 }}>
          <Form.Control placeholder="Référence ou désignation..." value={recherche} onChange={(e) => setRecherche(e.target.value)} onKeyDown={(e) => e.key === "Enter" && charger()} />
          <Button variant="outline-primary" onClick={charger}><i className="bi bi-search"></i></Button>
        </InputGroup>
        <Form.Select style={{ maxWidth: 220 }} value={filtreCategorie} onChange={(e) => setFiltreCategorie(e.target.value)}>
          <option value="">Toutes catégories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Form.Select>
        <Form.Check label="Inactifs inclus" checked={voirInactifs} onChange={(e) => setVoirInactifs(e.target.checked)} />
        <Button variant="outline-success" onClick={async () => {
          try {
            const r = await apiIntrant("/api/intrants/init", { method: "POST", body: "{}" });
            setErreur("");
            alert(r.message);
            charger();
          } catch (e) { setErreur(e instanceof Error ? e.message : "Erreur"); }
        }}><i className="bi bi-magic me-1"></i>Catalogue par défaut</Button>
        <Button variant="primary" onClick={ouvrirCreation}><i className="bi bi-plus-lg me-1"></i>Nouvel intrant</Button>
      </Card.Header>
      <Card.Body className="p-0">
        {erreur && <Alert variant="danger" className="m-3">{erreur}</Alert>}
        {chargement ? <div className="text-center p-4"><Spinner animation="border" /></div> : (
          <div className="table-responsive">
            <Table hover size="sm" className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Référence</th><th>Désignation</th><th>Catégorie</th><th>Unité</th>
                  <th className="text-end">Stock</th><th className="text-end">Seuil</th>
                  <th>Lot</th><th>Statut</th><th></th>
                </tr>
              </thead>
              <tbody>
                {intrants.map((i) => (
                  <tr key={i._id} className={i.actif ? "" : "text-muted"}>
                    <td><code>{i.reference}</code></td>
                    <td>{i.designation}{i.sousCategorie ? <div className="small text-muted">{i.sousCategorie}</div> : null}</td>
                    <td>{i.categorie}</td>
                    <td>{i.uniteStock}</td>
                    <td className={`text-end fw-semibold ${i.seuilMinimum > 0 && i.qteEnStock < i.seuilMinimum ? "text-danger" : ""}`}>{formatQte(i.qteEnStock)}</td>
                    <td className="text-end">{formatQte(i.seuilMinimum)}</td>
                    <td>{i.suiviLot ? <Badge bg="info">Lot</Badge> : <Badge bg="secondary">Global</Badge>}</td>
                    <td>{i.actif ? <Badge bg="success">Actif</Badge> : <Badge bg="secondary">Inactif</Badge>}</td>
                    <td className="text-end">
                      <Button size="sm" variant="outline-primary" className="me-1" onClick={() => ouvrirEdition(i)}><i className="bi bi-pencil"></i></Button>
                      <Button size="sm" variant={i.actif ? "outline-danger" : "outline-success"} onClick={() => basculerActif(i)}>
                        <i className={`bi ${i.actif ? "bi-archive" : "bi-arrow-counterclockwise"}`}></i>
                      </Button>
                    </td>
                  </tr>
                ))}
                {!intrants.length && <tr><td colSpan={9} className="text-center text-muted py-4">Aucun intrant au catalogue.</td></tr>}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton><Modal.Title>{edition ? "Modifier l'intrant" : "Nouvel intrant"}</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="row g-3">
            <div className="col-md-4"><Form.Label>Référence *</Form.Label><Form.Control value={form.reference} onChange={champ("reference")} /></div>
            <div className="col-md-8"><Form.Label>Désignation *</Form.Label><Form.Control value={form.designation} onChange={champ("designation")} /></div>
            <div className="col-md-6"><Form.Label>Catégorie *</Form.Label>
              <Form.Select value={form.categorie} onChange={champ("categorie")}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Form.Select></div>
            <div className="col-md-6"><Form.Label>Sous-catégorie</Form.Label><Form.Control value={form.sousCategorie} onChange={champ("sousCategorie")} /></div>
            <div className="col-md-4"><Form.Label>Unité de stock *</Form.Label><Form.Control placeholder="pièce, mL, g, test..." value={form.uniteStock} onChange={champ("uniteStock")} /></div>
            <div className="col-md-4"><Form.Label>Conditionnement achat</Form.Label><Form.Control placeholder="boîte, flacon..." value={form.conditionnement} onChange={champ("conditionnement")} /></div>
            <div className="col-md-4"><Form.Label>Unités / conditionnement</Form.Label><Form.Control type="number" min={0} step="any" value={form.qteParConditionnement} onChange={champ("qteParConditionnement")} /></div>
            <div className="col-md-4"><Form.Label>Seuil minimum</Form.Label><Form.Control type="number" min={0} step="any" value={form.seuilMinimum} onChange={champ("seuilMinimum")} /></div>
            <div className="col-md-4"><Form.Label>Seuil maximum</Form.Label><Form.Control type="number" min={0} step="any" value={form.seuilMaximum} onChange={champ("seuilMaximum")} /></div>
            <div className="col-md-4"><Form.Label>Prix d'achat</Form.Label><Form.Control type="number" min={0} step="any" value={form.prixAchat} onChange={champ("prixAchat")} /></div>
            <div className="col-md-6"><Form.Label>Fournisseur</Form.Label><Form.Control value={form.fournisseur} onChange={champ("fournisseur")} /></div>
            <div className="col-md-6"><Form.Label>Conservation</Form.Label><Form.Control placeholder="2-8°C, à l'abri de la lumière..." value={form.conservation} onChange={champ("conservation")} /></div>
            <div className="col-md-6">
              <Form.Check className="mt-4" label="Suivi par lot / péremption" checked={form.suiviLot} onChange={champ("suiviLot")} />
            </div>
            <div className="col-md-6"><Form.Label>Stabilité après ouverture (jours)</Form.Label><Form.Control type="number" min={0} value={form.delaiApresOuvertureJours} onChange={champ("delaiApresOuvertureJours")} /></div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Annuler</Button>
          <Button variant="primary" disabled={saving} onClick={enregistrer}>{saving ? "Enregistrement..." : "Enregistrer"}</Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
}
