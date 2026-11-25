"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Card, Col, Form, Row, Spinner, Table } from "react-bootstrap";
import { apiIntrant, formatDate, formatQte, Intrant, Lot } from "./api";
import styles from "./intrants.module.css";

type TypeMouvement = "entree" | "utilisation" | "perte" | "ajustement";

interface Ligne {
  intrantId: string;
  lotId: string;
  numeroLot: string;
  datePeremption: string;
  prixUnitaire: number | string;
  emplacement: string;
  quantite: number | string;
}

const CONFIG: Record<TypeMouvement, { titre: string; icone: string; couleur: string; motifs: string[]; description: string }> = {
  entree: {
    titre: "Nouvelle réception",
    icone: "bi-box-arrow-in-down",
    couleur: "success",
    motifs: ["Achat", "Don", "Retour de prêt", "Autre"],
    description: "Chaque ligne crée un lot (numéro de lot et péremption requis si l'intrant est suivi par lot).",
  },
  utilisation: {
    titre: "Enregistrer une utilisation",
    icone: "bi-clipboard2-pulse",
    couleur: "primary",
    motifs: ["Analyses de routine", "Contrôle qualité", "Calibration", "Reprise technique", "Prélèvement", "Nettoyage / maintenance", "Autre"],
    description: "Quantités effectivement utilisées. Les lots sont prélevés automatiquement du plus proche de l'expiration (FEFO) si aucun lot n'est choisi.",
  },
  perte: {
    titre: "Déclarer une perte",
    icone: "bi-trash",
    couleur: "danger",
    motifs: ["Péremption", "Casse / renversement", "Mauvaise conservation", "Reste inutilisable", "Autre"],
    description: "Sortie non consommée (périmé, cassé, altéré). Comptée séparément des utilisations dans les statistiques.",
  },
  ajustement: {
    titre: "Ajustement d'inventaire",
    icone: "bi-sliders",
    couleur: "warning",
    motifs: ["Écart d'inventaire", "Erreur de saisie", "Autre"],
    description: "Correction du stock : quantité positive pour ajouter, négative pour retirer. Motif obligatoire.",
  },
};

const ligneVide = (): Ligne => ({ intrantId: "", lotId: "", numeroLot: "", datePeremption: "", prixUnitaire: "", emplacement: "", quantite: "" });

export default function IntrantMouvementForm({ type, onEnregistre }: { type: TypeMouvement; onEnregistre?: () => void }) {
  const cfg = CONFIG[type];
  const estSortie = type === "utilisation" || type === "perte";
  const [intrants, setIntrants] = useState<Intrant[]>([]);
  const [lignes, setLignes] = useState<Ligne[]>([ligneVide()]);
  const [lotsParIntrant, setLotsParIntrant] = useState<Record<number, Lot[]>>({});
  const [motif, setMotif] = useState(cfg.motifs[0]);
  const [observation, setObservation] = useState("");
  const [fournisseur, setFournisseur] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [chargement, setChargement] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);

  useEffect(() => {
    apiIntrant("/api/intrants?actif=true").then((d) => setIntrants(d.data || [])).catch(() => {});
  }, []);

  const intrantDe = (l: Ligne) => intrants.find((i) => i._id === l.intrantId);

  const chargerLots = async (index: number, intrantId: string) => {
    if (!intrantId) return;
    try {
      const d = await apiIntrant(`/api/intrants/lots?intrantId=${intrantId}&disponibles=true`);
      setLotsParIntrant((s) => ({ ...s, [index]: d.data || [] }));
    } catch { /* lots optionnels */ }
  };

  const majLigne = (index: number, patch: Partial<Ligne>) => {
    setLignes((ls) => ls.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  };

  const choisirIntrant = (index: number, intrantId: string) => {
    const i = intrants.find((x) => x._id === intrantId);
    majLigne(index, { intrantId, lotId: "", numeroLot: "", prixUnitaire: i?.prixAchat || "" });
    if (i?.suiviLot) chargerLots(index, intrantId);
  };

  const soumettre = async () => {
    setMessage(null);
    const lignesValides = lignes.filter((l) => l.intrantId && Number(l.quantite) !== 0 && l.quantite !== "");
    if (!lignesValides.length) {
      setMessage({ ok: false, texte: "Ajoutez au moins une ligne avec un intrant et une quantité." });
      return;
    }
    if (type === "ajustement" && !motif) {
      setMessage({ ok: false, texte: "Le motif est obligatoire pour un ajustement." });
      return;
    }
    setChargement(true);
    try {
      await apiIntrant("/api/intrants/mouvements", {
        method: "POST",
        body: JSON.stringify({
          type,
          statut: "valide",
          date,
          motif,
          observation: observation || undefined,
          fournisseur: type === "entree" ? fournisseur || undefined : undefined,
          lignes: lignesValides.map((l) => ({
            intrantId: l.intrantId,
            lotId: estSortie && l.lotId ? l.lotId : undefined,
            numeroLot: l.numeroLot || undefined,
            datePeremption: l.datePeremption || undefined,
            prixUnitaire: Number(l.prixUnitaire) || 0,
            emplacement: l.emplacement || undefined,
            quantite: Number(l.quantite),
          })),
        }),
      });
      setMessage({ ok: true, texte: `${cfg.titre} enregistré(e) avec succès.` });
      setLignes([ligneVide()]);
      setObservation("");
      onEnregistre?.();
    } catch (e) {
      setMessage({ ok: false, texte: e instanceof Error ? e.message : "Erreur d'enregistrement" });
    } finally {
      setChargement(false);
    }
  };

  return (
    <Card className={styles.panel}>
      <Card.Header className={styles.panelHeader}>
        <h6 className="mb-0"><i className={`bi ${cfg.icone} me-2 text-${cfg.couleur}`}></i>{cfg.titre}</h6>
        <small className="text-muted">{cfg.description}</small>
      </Card.Header>
      <Card.Body>
        {message && <Alert variant={message.ok ? "success" : "danger"} className="py-2">{message.texte}</Alert>}
        <Row className="g-2 mb-3">
          <Col md={2}><Form.Label>Date</Form.Label><Form.Control type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Col>
          <Col md={3}><Form.Label>Motif *</Form.Label>
            <Form.Select value={motif} onChange={(e) => setMotif(e.target.value)}>
              {cfg.motifs.map((m) => <option key={m}>{m}</option>)}
            </Form.Select></Col>
          {type === "entree" && (
            <Col md={3}><Form.Label>Fournisseur</Form.Label><Form.Control value={fournisseur} onChange={(e) => setFournisseur(e.target.value)} /></Col>
          )}
          <Col md={type === "entree" ? 4 : 7}><Form.Label>Observation</Form.Label><Form.Control value={observation} onChange={(e) => setObservation(e.target.value)} /></Col>
        </Row>

        <Table size="sm" className="align-middle">
          <thead className="table-light">
            <tr>
              <th style={{ minWidth: 240 }}>Intrant *</th>
              {estSortie && <th style={{ minWidth: 200 }}>Lot (auto FEFO si vide)</th>}
              {type === "entree" && <><th>N° lot *</th><th>Péremption</th><th>Prix unit.</th></>}
              {type === "ajustement" && <th>N° lot (opt.)</th>}
              <th style={{ width: 130 }}>Quantité {type === "ajustement" && "(±)"} *</th>
              <th style={{ width: 50 }}></th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((l, idx) => {
              const intrant = intrantDe(l);
              const lots = lotsParIntrant[idx] || [];
              return (
                <tr key={idx}>
                  <td>
                    <Form.Select value={l.intrantId} onChange={(e) => choisirIntrant(idx, e.target.value)}>
                      <option value="">— Choisir —</option>
                      {intrants.map((i) => <option key={i._id} value={i._id}>{i.designation} ({formatQte(i.qteEnStock)} {i.uniteStock})</option>)}
                    </Form.Select>
                  </td>
                  {estSortie && (
                    <td>
                      {intrant?.suiviLot ? (
                        <Form.Select value={l.lotId} onChange={(e) => majLigne(idx, { lotId: e.target.value })}>
                          <option value="">Auto (FEFO)</option>
                          {lots.map((lot) => (
                            <option key={lot._id} value={lot._id}>
                              {lot.numeroLot} — {formatQte(lot.qteRestante)} ({formatDate(lot.datePeremption)})
                            </option>
                          ))}
                        </Form.Select>
                      ) : <span className="text-muted small">Sans suivi de lot</span>}
                    </td>
                  )}
                  {type === "entree" && (
                    <>
                      <td><Form.Control placeholder={intrant?.suiviLot ? "N° lot" : "—"} disabled={!intrant?.suiviLot} value={l.numeroLot} onChange={(e) => majLigne(idx, { numeroLot: e.target.value })} /></td>
                      <td><Form.Control type="date" value={l.datePeremption} onChange={(e) => majLigne(idx, { datePeremption: e.target.value })} /></td>
                      <td><Form.Control type="number" min={0} step="any" value={l.prixUnitaire} onChange={(e) => majLigne(idx, { prixUnitaire: e.target.value })} /></td>
                    </>
                  )}
                  {type === "ajustement" && (
                    <td><Form.Control placeholder="AJUST-auto" value={l.numeroLot} onChange={(e) => majLigne(idx, { numeroLot: e.target.value })} /></td>
                  )}
                  <td><Form.Control type="number" step="any" value={l.quantite} onChange={(e) => majLigne(idx, { quantite: e.target.value })} /></td>
                  <td><Button size="sm" variant="outline-danger" disabled={lignes.length === 1} onClick={() => setLignes(lignes.filter((_, i) => i !== idx))}><i className="bi bi-x"></i></Button></td>
                </tr>
              );
            })}
          </tbody>
        </Table>

        <div className="d-flex gap-2">
          <Button variant="outline-secondary" size="sm" onClick={() => setLignes([...lignes, ligneVide()])}>
            <i className="bi bi-plus-lg me-1"></i>Ligne
          </Button>
          <Button variant={cfg.couleur} disabled={chargement} onClick={soumettre}>
            {chargement ? <Spinner size="sm" animation="border" /> : <><i className="bi bi-check-lg me-1"></i>Valider le bon</>}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}
