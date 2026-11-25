"use client";

import { useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Form, Modal, Spinner, Table } from "react-bootstrap";
import { apiIntrant, formatDate, formatQte } from "./api";
import styles from "./intrants.module.css";

const TYPE_BADGE: Record<string, { bg: string; label: string }> = {
  entree: { bg: "success", label: "Réception" },
  utilisation: { bg: "primary", label: "Utilisation" },
  perte: { bg: "danger", label: "Perte" },
  ajustement: { bg: "warning", label: "Ajustement" },
};

export default function IntrantMouvementsListe({ refreshKey }: { refreshKey?: number }) {
  const [mouvements, setMouvements] = useState<any[]>([]);
  const [type, setType] = useState("");
  const [debut, setDebut] = useState("");
  const [fin, setFin] = useState("");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [annulation, setAnnulation] = useState<any | null>(null);
  const [motifAnnulation, setMotifAnnulation] = useState("");
  const [detail, setDetail] = useState<any | null>(null);

  const charger = async () => {
    setChargement(true);
    setErreur("");
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (type) params.set("type", type);
      if (debut) params.set("dateDebut", debut);
      if (fin) params.set("dateFin", fin);
      const d = await apiIntrant(`/api/intrants/mouvements?${params}`);
      setMouvements(d.data || []);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => { charger(); }, [type, refreshKey]);

  const confirmerAnnulation = async () => {
    if (!annulation) return;
    try {
      await apiIntrant(`/api/intrants/mouvements/${annulation._id}`, {
        method: "PUT",
        body: JSON.stringify({ action: "annuler", motifAnnulation }),
      });
      setAnnulation(null);
      setMotifAnnulation("");
      charger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur d'annulation");
      setAnnulation(null);
    }
  };

  return (
    <Card className={styles.panel}>
      <Card.Header className={`${styles.panelHeader} d-flex flex-wrap gap-2 align-items-center`}>
        <h6 className="mb-0 me-auto"><i className="bi bi-journal-text me-2 text-primary"></i>Bons de mouvements</h6>
        <Form.Select size="sm" style={{ maxWidth: 180 }} value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Tous les types</option>
          <option value="entree">Réceptions</option>
          <option value="utilisation">Utilisations</option>
          <option value="perte">Pertes</option>
          <option value="ajustement">Ajustements</option>
        </Form.Select>
        <Form.Control size="sm" type="date" style={{ maxWidth: 150 }} value={debut} onChange={(e) => setDebut(e.target.value)} />
        <Form.Control size="sm" type="date" style={{ maxWidth: 150 }} value={fin} onChange={(e) => setFin(e.target.value)} />
        <Button size="sm" variant="outline-primary" onClick={charger}><i className="bi bi-search"></i></Button>
      </Card.Header>
      <div className="table-responsive">
        {erreur && <Alert variant="danger" className="m-3 py-2">{erreur}</Alert>}
        {chargement ? <div className="text-center p-4"><Spinner animation="border" /></div> : (
          <Table hover size="sm" className="mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th>Numéro</th><th>Date</th><th>Type</th><th>Motif</th>
                <th className="text-end">Lignes</th><th>Saisi par</th><th>Statut</th><th></th>
              </tr>
            </thead>
            <tbody>
              {mouvements.map((m) => (
                <tr key={m._id}>
                  <td><code>{m.numero}</code></td>
                  <td>{formatDate(m.date)}</td>
                  <td><Badge bg={TYPE_BADGE[m.type]?.bg || "secondary"}>{TYPE_BADGE[m.type]?.label || m.type}</Badge></td>
                  <td>{m.motif || "-"}</td>
                  <td className="text-end">{m.lignes?.length || 0}</td>
                  <td>{m.saisiPar || "-"}</td>
                  <td>
                    {m.statut === "valide" && <Badge bg="success">Validé</Badge>}
                    {m.statut === "brouillon" && <Badge bg="secondary">Brouillon</Badge>}
                    {m.statut === "annule" && <Badge bg="dark" title={m.motifAnnulation}>Annulé</Badge>}
                  </td>
                  <td className="text-end">
                    <Button size="sm" variant="outline-info" className="me-1" onClick={() => setDetail(m)}><i className="bi bi-eye"></i></Button>
                    {m.statut === "valide" && (
                      <Button size="sm" variant="outline-danger" onClick={() => setAnnulation(m)}><i className="bi bi-arrow-counterclockwise"></i></Button>
                    )}
                    {m.statut === "brouillon" && (
                      <Button size="sm" variant="outline-success" onClick={async () => {
                        try { await apiIntrant(`/api/intrants/mouvements/${m._id}`, { method: "PUT", body: JSON.stringify({ action: "valider" }) }); charger(); }
                        catch (e) { setErreur(e instanceof Error ? e.message : "Erreur"); }
                      }}><i className="bi bi-check-lg"></i></Button>
                    )}
                  </td>
                </tr>
              ))}
              {!mouvements.length && <tr><td colSpan={8} className="text-center text-muted py-4">Aucun mouvement.</td></tr>}
            </tbody>
          </Table>
        )}
      </div>

      <Modal show={!!detail} onHide={() => setDetail(null)} size="lg" centered>
        <Modal.Header closeButton><Modal.Title>Bon {detail?.numero}</Modal.Title></Modal.Header>
        <Modal.Body>
          {detail && (
            <>
              <p className="mb-2">
                <Badge bg={TYPE_BADGE[detail.type]?.bg}>{TYPE_BADGE[detail.type]?.label}</Badge>{" "}
                du {formatDate(detail.date)} — {detail.motif || "sans motif"}
                {detail.observation && <span className="text-muted"> ({detail.observation})</span>}
              </p>
              <Table size="sm">
                <thead><tr><th>Intrant</th><th>Lot</th><th className="text-end">Quantité</th><th className="text-end">Prix unit.</th></tr></thead>
                <tbody>
                  {detail.lignes.map((l: any, i: number) => (
                    <tr key={i}>
                      <td>{l.designation}</td>
                      <td>{l.numeroLot || "-"}</td>
                      <td className="text-end">{formatQte(l.quantite)} {l.unite}</td>
                      <td className="text-end">{l.prixUnitaire ? `${formatQte(l.prixUnitaire)}` : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </>
          )}
        </Modal.Body>
      </Modal>

      <Modal show={!!annulation} onHide={() => setAnnulation(null)} centered>
        <Modal.Header closeButton><Modal.Title>Annuler le bon {annulation?.numero}</Modal.Title></Modal.Header>
        <Modal.Body>
          <p className="text-muted small">Le stock sera recrédité et le bon conservé dans l'historique (traçabilité).</p>
          <Form.Label>Motif d'annulation *</Form.Label>
          <Form.Control as="textarea" rows={2} value={motifAnnulation} onChange={(e) => setMotifAnnulation(e.target.value)} />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setAnnulation(null)}>Fermer</Button>
          <Button variant="danger" disabled={!motifAnnulation.trim()} onClick={confirmerAnnulation}>Confirmer l'annulation</Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
}
