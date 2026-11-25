"use client";

import { useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Col, Form, Modal, Row, Spinner, Table } from "react-bootstrap";
import { apiIntrant, formatQte, Intrant } from "./api";
import styles from "./intrants.module.css";

const moisDebut = () => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10); };
const aujourdhui = () => new Date().toISOString().slice(0, 10);

export default function IntrantComparaison() {
  const [data, setData] = useState<any>(null);
  const [regles, setRegles] = useState<any[]>([]);
  const [intrants, setIntrants] = useState<Intrant[]>([]);
  const [debut, setDebut] = useState(moisDebut());
  const [fin, setFin] = useState(aujourdhui());
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [showRegle, setShowRegle] = useState(false);
  const [form, setForm] = useState({ intrantId: "", prestation: "", familleActe: "", consommationTheorique: "" });
  const [saving, setSaving] = useState(false);

  const charger = async () => {
    setChargement(true);
    setErreur("");
    try {
      const [comp, reg, cat] = await Promise.all([
        apiIntrant(`/api/intrants/comparaison?dateDebut=${debut}&dateFin=${fin}`),
        apiIntrant("/api/intrants/regles"),
        apiIntrant("/api/intrants?actif=true"),
      ]);
      setData(comp.data);
      setRegles(reg.data || []);
      setIntrants(cat.data || []);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => { charger(); }, []);

  const enregistrerRegle = async () => {
    setSaving(true);
    try {
      await apiIntrant("/api/intrants/regles", {
        method: "POST",
        body: JSON.stringify({
          intrantId: form.intrantId,
          prestation: form.prestation || undefined,
          familleActe: form.familleActe || undefined,
          consommationTheorique: Number(form.consommationTheorique),
        }),
      });
      setShowRegle(false);
      setForm({ intrantId: "", prestation: "", familleActe: "", consommationTheorique: "" });
      charger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const supprimerRegle = async (id: string) => {
    try { await apiIntrant(`/api/intrants/regles/${id}`, { method: "DELETE" }); charger(); }
    catch (e) { setErreur(e instanceof Error ? e.message : "Erreur"); }
  };

  const badgeEcart = (l: any) => {
    if (l.theorique <= 0 && l.utilise <= 0) return <Badge bg="secondary">—</Badge>;
    if (l.ecartPct === null) return <Badge bg="warning">théorique nul</Badge>;
    const abs = Math.abs(l.ecartPct);
    const bg = abs <= 10 ? "success" : abs <= 25 ? "warning" : "danger";
    return <Badge bg={bg}>{l.ecart > 0 ? "+" : ""}{l.ecartPct}%</Badge>;
  };

  return (
    <>
      <Card className={`${styles.panel} mb-3`}>
        <Card.Body className="d-flex flex-wrap gap-2 align-items-end">
          <div><Form.Label className="mb-0 small">Du</Form.Label><Form.Control type="date" value={debut} onChange={(e) => setDebut(e.target.value)} /></div>
          <div><Form.Label className="mb-0 small">Au</Form.Label><Form.Control type="date" value={fin} onChange={(e) => setFin(e.target.value)} /></div>
          <Button variant="primary" onClick={charger} disabled={chargement}><i className="bi bi-arrow-clockwise me-1"></i>Actualiser</Button>
          <Button variant="outline-success" className="ms-auto" onClick={async () => {
            try {
              const r = await apiIntrant("/api/intrants/init-regles", { method: "POST", body: "{}" });
              alert(r.message);
              charger();
            } catch (e) { setErreur(e instanceof Error ? e.message : "Erreur"); }
          }}><i className="bi bi-magic me-1"></i>Règles par défaut</Button>
          <Button variant="outline-primary" onClick={() => setShowRegle(true)}>
            <i className="bi bi-plus-lg me-1"></i>Règle de correspondance
          </Button>
        </Card.Body>
      </Card>

      {erreur && <Alert variant="danger">{erreur}</Alert>}
      {chargement && !data ? <div className="text-center p-4"><Spinner animation="border" /></div> : data && (
        <>
          <Alert variant="info" className="py-2 small">
            <i className="bi bi-info-circle me-1"></i>
            Lecture seule : l'activité provient des lignes de prestation biologiques ({data.base}), la consommation des bons d'utilisation validés.
            L'écart inclut contrôles, calibrations, reprises et quantités déclarées à tort comme utilisations.
          </Alert>

          <Card className={`${styles.panel} mb-3`}>
            <Card.Header className={styles.panelHeader}><h6 className="mb-0"><i className="bi bi-bar-chart me-2 text-primary"></i>Consommation réelle vs théorique</h6></Card.Header>
            <div className="table-responsive">
              <Table hover size="sm" className="mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Intrant</th><th>Analyse ciblée</th><th className="text-end">Analyses</th>
                    <th className="text-end">Conso / analyse</th><th className="text-end">Théorique</th>
                    <th className="text-end">Utilisé</th><th className="text-end">Écart</th><th className="text-end">Écart %</th>
                  </tr>
                </thead>
                <tbody>
                  {data.lignes.map((l: any) => (
                    <tr key={l.regleId}>
                      <td>{l.designation} <span className="text-muted small">({l.unite})</span></td>
                      <td>{l.cible}</td>
                      <td className="text-end">{formatQte(l.nbAnalyses)}</td>
                      <td className="text-end">{formatQte(l.consommationTheorique)}</td>
                      <td className="text-end">{formatQte(l.theorique)}</td>
                      <td className="text-end fw-semibold">{formatQte(l.utilise)}</td>
                      <td className={`text-end fw-semibold ${l.ecart > 0 ? "text-danger" : "text-success"}`}>{l.ecart > 0 ? "+" : ""}{formatQte(l.ecart)}</td>
                      <td className="text-end">{badgeEcart(l)}</td>
                    </tr>
                  ))}
                  {!data.lignes.length && <tr><td colSpan={8} className="text-center text-muted py-4">Aucune règle de correspondance active. Créez-en une pour comparer.</td></tr>}
                </tbody>
              </Table>
            </div>
          </Card>

          {data.intrantsSansRegle?.length > 0 && (
            <Card className={`${styles.panel} mb-3`}>
              <Card.Header className={styles.panelHeader}><h6 className="mb-0 text-muted">Intrants utilisés sans correspondance</h6></Card.Header>
              <div className="table-responsive">
                <Table size="sm" className="mb-0">
                  <tbody>
                    {data.intrantsSansRegle.map((i: any) => (
                      <tr key={i.intrantId}><td>{i.designation}</td><td className="text-end">{formatQte(i.utilise)} {i.unite}</td></tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card>
          )}

          <Card className={styles.panel}>
            <Card.Header className={styles.panelHeader}><h6 className="mb-0"><i className="bi bi-gear me-2"></i>Règles de correspondance</h6></Card.Header>
            <div className="table-responsive">
              <Table hover size="sm" className="mb-0 align-middle">
                <thead className="table-light"><tr><th>Intrant</th><th>Analyse</th><th className="text-end">Conso théorique</th><th>Statut</th><th></th></tr></thead>
                <tbody>
                  {regles.map((r) => (
                    <tr key={r._id} className={r.actif ? "" : "text-muted"}>
                      <td>{r.intrant?.designation || "-"}</td>
                      <td>{r.prestation || r.familleActe || "Acte ciblé"}</td>
                      <td className="text-end">{formatQte(r.consommationTheorique)} {r.intrant?.uniteStock || ""}</td>
                      <td>{r.actif ? <Badge bg="success">Active</Badge> : <Badge bg="secondary">Inactive</Badge>}</td>
                      <td className="text-end">
                        <Button size="sm" variant="outline-secondary" className="me-1" onClick={async () => {
                          try { await apiIntrant(`/api/intrants/regles/${r._id}`, { method: "PUT", body: JSON.stringify({ actif: !r.actif }) }); charger(); } catch {}
                        }}><i className={`bi ${r.actif ? "bi-pause" : "bi-play"}`}></i></Button>
                        <Button size="sm" variant="outline-danger" onClick={() => supprimerRegle(r._id)}><i className="bi bi-trash"></i></Button>
                      </td>
                    </tr>
                  ))}
                  {!regles.length && <tr><td colSpan={5} className="text-center text-muted py-3">Aucune règle définie.</td></tr>}
                </tbody>
              </Table>
            </div>
          </Card>
        </>
      )}

      <Modal show={showRegle} onHide={() => setShowRegle(false)} centered>
        <Modal.Header closeButton><Modal.Title>Règle de correspondance</Modal.Title></Modal.Header>
        <Modal.Body>
          <p className="small text-muted">Associe un intrant à une analyse pour la comparaison statistique. N'affecte jamais le stock.</p>
          <Form.Label>Intrant *</Form.Label>
          <Form.Select className="mb-3" value={form.intrantId} onChange={(e) => setForm({ ...form, intrantId: e.target.value })}>
            <option value="">— Choisir —</option>
            {intrants.map((i) => <option key={i._id} value={i._id}>{i.designation} ({i.uniteStock})</option>)}
          </Form.Select>
          <Form.Label>Prestation (nom exact de l'analyse)</Form.Label>
          <Form.Control className="mb-3" placeholder="Ex. GLYCEMIE" value={form.prestation} onChange={(e) => setForm({ ...form, prestation: e.target.value })} />
          <Form.Label>ou famille d'actes biologiques</Form.Label>
          <Form.Control className="mb-3" placeholder="Ex. Biochimie" value={form.familleActe} onChange={(e) => setForm({ ...form, familleActe: e.target.value })} />
          <Form.Label>Consommation théorique par analyse *</Form.Label>
          <Form.Control type="number" min={0} step="any" value={form.consommationTheorique} onChange={(e) => setForm({ ...form, consommationTheorique: e.target.value })} />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRegle(false)}>Annuler</Button>
          <Button variant="primary" disabled={saving || !form.intrantId || !form.consommationTheorique || (!form.prestation && !form.familleActe)} onClick={enregistrerRegle}>
            Enregistrer
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
