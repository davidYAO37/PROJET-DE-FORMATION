"use client";

import { useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Col, Row, Spinner, Table } from "react-bootstrap";
import { apiIntrant, formatDate, formatMontant, formatQte } from "./api";
import styles from "./intrants.module.css";

interface StockData {
  intrants: any[];
  valorisationTotale: number;
  alertes: { sousSeuil: any[]; perimes: any[]; prochesPeremption: any[]; alerteJours: number };
}

export default function IntrantStock() {
  const [data, setData] = useState<StockData | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [filtreSeuil, setFiltreSeuil] = useState<"tous" | "sousSeuil">("tous");

  useEffect(() => {
    (async () => {
      try {
        const res = await apiIntrant("/api/intrants/stock");
        setData(res.data);
      } catch (e) {
        setErreur(e instanceof Error ? e.message : "Erreur de chargement");
      } finally {
        setChargement(false);
      }
    })();
  }, []);

  if (chargement) return <div className="text-center p-4"><Spinner animation="border" /></div>;
  if (erreur) return <Alert variant="danger">{erreur}</Alert>;
  if (!data) return null;

  const { alertes } = data;
  const cartes = [
    { label: "Intrants au catalogue", value: data.intrants.length, icon: "bi-boxes", couleur: "#1565d8", fond: "rgba(21,101,216,.12)" },
    { label: "Valorisation du stock", value: formatMontant(data.valorisationTotale), icon: "bi-cash-stack", couleur: "#198754", fond: "rgba(25,135,84,.12)" },
    { label: "Sous le seuil", value: alertes.sousSeuil.length, icon: "bi-exclamation-triangle-fill", couleur: "#dc3545", fond: "rgba(220,53,69,.12)" },
    { label: "Lots périmés", value: alertes.perimes.length, icon: "bi-x-octagon-fill", couleur: "#343a40", fond: "rgba(52,58,64,.12)" },
    { label: `Péremption < ${alertes.alerteJours} j`, value: alertes.prochesPeremption.length, icon: "bi-hourglass-split", couleur: "#e0a800", fond: "rgba(255,193,7,.15)" },
  ];

  return (
    <>
      <Row className="g-3 mb-3">
        {cartes.map((c) => (
          <Col key={c.label} md>
            <Card className={`${styles.statCard} shadow-sm h-100`}>
              <Card.Body className="d-flex align-items-center gap-3">
                <div className={styles.statIcon} style={{ background: c.fond, color: c.couleur }}>
                  <i className={`bi ${c.icon}`}></i>
                </div>
                <div><div className="text-muted small">{c.label}</div><div className="fs-5 fw-bold" style={{ color: c.couleur }}>{c.value}</div></div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {(alertes.sousSeuil.length > 0 || alertes.perimes.length > 0 || alertes.prochesPeremption.length > 0) && (
        <Card className={`${styles.panel} mb-3`}>
          <Card.Header className={styles.panelHeader}><h6 className="mb-0"><i className="bi bi-bell me-2 text-warning"></i>Alertes</h6></Card.Header>
          <Card.Body>
            {alertes.sousSeuil.length > 0 && (
              <Alert variant="danger" className="py-2">
                <strong>Sous le seuil :</strong>{" "}
                {alertes.sousSeuil.map((i) => `${i.designation} (${formatQte(i.qteEnStock)} / ${formatQte(i.seuilMinimum)} ${i.uniteStock})`).join(" — ")}
              </Alert>
            )}
            {alertes.perimes.length > 0 && (
              <Alert variant="dark" className="py-2">
                <strong>Lots périmés :</strong>{" "}
                {alertes.perimes.map((l) => `${l.designation} lot ${l.numeroLot} (${formatQte(l.qteRestante)}, ${formatDate(l.dateLimite)})`).join(" — ")}
              </Alert>
            )}
            {alertes.prochesPeremption.length > 0 && (
              <Alert variant="warning" className="py-2 mb-0">
                <strong>Péremption proche :</strong>{" "}
                {alertes.prochesPeremption.map((l) => `${l.designation} lot ${l.numeroLot} (${formatDate(l.dateLimite)})`).join(" — ")}
              </Alert>
            )}
          </Card.Body>
        </Card>
      )}

      <Card className={styles.panel}>
        <Card.Header className={`${styles.panelHeader} d-flex align-items-center gap-2`}>
          <h6 className="mb-0 me-auto"><i className="bi bi-clipboard-data me-2 text-primary"></i>Stock disponible</h6>
          <Button
            size="sm"
            variant={filtreSeuil === "sousSeuil" ? "danger" : "outline-danger"}
            onClick={() => setFiltreSeuil(filtreSeuil === "sousSeuil" ? "tous" : "sousSeuil")}
          >
            <i className="bi bi-exclamation-triangle me-1"></i>Sous le seuil ({alertes.sousSeuil.length})
          </Button>
        </Card.Header>
        <div className="table-responsive">
          <Table hover size="sm" className="mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th>Référence</th><th>Désignation</th><th>Catégorie</th>
                <th className="text-end">Stock</th><th>Unité</th><th className="text-end">Seuil min</th>
                <th className="text-end">Manquant</th><th className="text-end">Lots</th><th className="text-end">Valeur</th><th>État</th>
              </tr>
            </thead>
            <tbody>
              {(filtreSeuil === "sousSeuil" ? data.intrants.filter((i) => i.sousSeuil) : data.intrants).map((i) => (
                <tr key={i._id}>
                  <td><code>{i.reference}</code></td>
                  <td>{i.designation}</td>
                  <td>{i.categorie}</td>
                  <td className="text-end fw-semibold">{formatQte(i.qteEnStock)}</td>
                  <td>{i.uniteStock}</td>
                  <td className="text-end">{formatQte(i.seuilMinimum)}</td>
                  <td className="text-end">
                    {i.sousSeuil ? <Badge bg="danger">{formatQte(i.seuilMinimum - i.qteEnStock)}</Badge> : "-"}
                  </td>
                  <td className="text-end">{i.nbLots}</td>
                  <td className="text-end">{formatMontant(i.valeurStock)}</td>
                  <td>{i.sousSeuil ? <Badge bg="danger">Sous seuil</Badge> : <Badge bg="success">OK</Badge>}</td>
                </tr>
              ))}
              {!(filtreSeuil === "sousSeuil" ? alertes.sousSeuil : data.intrants).length && (
                <tr><td colSpan={10} className="text-center text-muted py-4">
                  {filtreSeuil === "sousSeuil" ? "Aucun intrant sous le seuil." : "Aucun intrant actif."}
                </td></tr>
              )}
            </tbody>
          </Table>
        </div>
      </Card>
    </>
  );
}
