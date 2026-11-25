"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Card, Col, Row, Spinner, Table } from "react-bootstrap";
import { apiIntrant, formatDate, formatQte } from "./api";
import styles from "./intrants.module.css";

interface StockData {
  intrants: any[];
  alertes: { sousSeuil: any[]; perimes: any[]; prochesPeremption: any[]; alerteJours: number };
}

const joursRestants = (d?: string | null) =>
  d ? Math.ceil((new Date(d).getTime() - Date.now()) / 86400000) : null;

export default function IntrantAlertes({ onAction }: { onAction?: (onglet: string) => void }) {
  const [data, setData] = useState<StockData | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  const charger = async () => {
    setChargement(true);
    try {
      const res = await apiIntrant("/api/intrants/stock");
      setData(res.data);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => { charger(); }, []);

  if (chargement) return <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>;
  if (erreur) return <div className="alert alert-danger">{erreur} <Button size="sm" variant="outline-danger" onClick={charger}>Réessayer</Button></div>;
  if (!data) return null;

  const { sousSeuil, perimes, prochesPeremption } = data.alertes;
  const totalAlertes = sousSeuil.length + perimes.length + prochesPeremption.length;

  const cartes = [
    { label: "Stocks sous le seuil", value: sousSeuil.length, icone: "bi-exclamation-triangle-fill", couleur: "#dc3545", fond: "rgba(220,53,69,.12)" },
    { label: "Lots périmés", value: perimes.length, icone: "bi-x-octagon-fill", couleur: "#343a40", fond: "rgba(52,58,64,.12)" },
    { label: `Péremption < ${data.alertes.alerteJours} jours`, value: prochesPeremption.length, icone: "bi-hourglass-split", couleur: "#e0a800", fond: "rgba(255,193,7,.15)" },
    { label: "Total des alertes", value: totalAlertes, icone: "bi-bell-fill", couleur: "#1565d8", fond: "rgba(21,101,216,.12)" },
  ];

  return (
    <>
      <Row className="g-3 mb-3">
        {cartes.map((c) => (
          <Col key={c.label} md={6} lg={3}>
            <Card className={`${styles.statCard} shadow-sm h-100`}>
              <Card.Body className="d-flex align-items-center gap-3">
                <div className={styles.statIcon} style={{ background: c.fond, color: c.couleur }}>
                  <i className={`bi ${c.icone}`}></i>
                </div>
                <div>
                  <div className="text-muted small">{c.label}</div>
                  <div className="fs-4 fw-bold" style={{ color: c.couleur }}>{c.value}</div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {totalAlertes === 0 && (
        <Card className={`${styles.panel} text-center py-5`}>
          <Card.Body>
            <i className="bi bi-shield-check fs-1 text-success d-block mb-2"></i>
            <h5>Aucune alerte</h5>
            <p className="text-muted mb-0">Tous les stocks sont au-dessus des seuils et aucun lot n'est en alerte de péremption.</p>
          </Card.Body>
        </Card>
      )}

      {sousSeuil.length > 0 && (
        <Card className={`${styles.panel} ${styles.alertSection} ${styles.alertDanger} mb-3`}>
          <Card.Header className={styles.panelHeader}>
            <i className="bi bi-exclamation-triangle-fill text-danger me-2"></i>
            <strong>Stocks sous le seuil</strong>
            <Badge bg="danger" className="ms-2">{sousSeuil.length}</Badge>
          </Card.Header>
          <div className="table-responsive">
            <Table hover size="sm" className="mb-0 align-middle">
              <thead className="table-light">
                <tr><th>Référence</th><th>Intrant</th><th className="text-end">Stock</th><th className="text-end">Seuil min</th><th className="text-end">Manquant</th><th></th></tr>
              </thead>
              <tbody>
                {sousSeuil.map((i) => (
                  <tr key={i._id}>
                    <td><code>{i.reference}</code></td>
                    <td>{i.designation} <span className="text-muted small">({i.uniteStock})</span></td>
                    <td className="text-end fw-semibold text-danger">{formatQte(i.qteEnStock)}</td>
                    <td className="text-end">{formatQte(i.seuilMinimum)}</td>
                    <td className="text-end"><Badge bg="danger">{formatQte(i.seuilMinimum - i.qteEnStock)}</Badge></td>
                    <td className="text-end">
                      <Button size="sm" variant="outline-success" onClick={() => onAction?.("reception")}>
                        <i className="bi bi-box-arrow-in-down me-1"></i>Réceptionner
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card>
      )}

      {perimes.length > 0 && (
        <Card className={`${styles.panel} ${styles.alertSection} ${styles.alertDark} mb-3`}>
          <Card.Header className={styles.panelHeader}>
            <i className="bi bi-x-octagon-fill text-dark me-2"></i>
            <strong>Lots périmés</strong>
            <Badge bg="dark" className="ms-2">{perimes.length}</Badge>
            <span className="text-muted small ms-2">à déclarer en perte pour sortir du stock</span>
          </Card.Header>
          <div className="table-responsive">
            <Table hover size="sm" className="mb-0 align-middle">
              <thead className="table-light">
                <tr><th>Intrant</th><th>Lot</th><th className="text-end">Quantité</th><th>Limite</th><th className="text-center">Retard</th><th></th></tr>
              </thead>
              <tbody>
                {perimes.map((l) => (
                  <tr key={l._id}>
                    <td>{l.designation}</td>
                    <td><code>{l.numeroLot}</code></td>
                    <td className="text-end">{formatQte(l.qteRestante)}</td>
                    <td>{formatDate(l.dateLimite)}</td>
                    <td className="text-center"><Badge bg="dark" className={styles.joursBadge}>{Math.abs(joursRestants(l.dateLimite) || 0)} j</Badge></td>
                    <td className="text-end">
                      <Button size="sm" variant="outline-danger" onClick={() => onAction?.("perte")}>
                        <i className="bi bi-trash me-1"></i>Déclarer en perte
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card>
      )}

      {prochesPeremption.length > 0 && (
        <Card className={`${styles.panel} ${styles.alertSection} ${styles.alertWarning} mb-3`}>
          <Card.Header className={styles.panelHeader}>
            <i className="bi bi-hourglass-split text-warning me-2"></i>
            <strong>Péremption proche (&lt; {data.alertes.alerteJours} jours)</strong>
            <Badge bg="warning" text="dark" className="ms-2">{prochesPeremption.length}</Badge>
            <span className="text-muted small ms-2">à utiliser en priorité (FEFO)</span>
          </Card.Header>
          <div className="table-responsive">
            <Table hover size="sm" className="mb-0 align-middle">
              <thead className="table-light">
                <tr><th>Intrant</th><th>Lot</th><th className="text-end">Quantité</th><th>Limite</th><th className="text-center">Reste</th><th></th></tr>
              </thead>
              <tbody>
                {prochesPeremption.map((l) => {
                  const j = joursRestants(l.dateLimite) ?? 0;
                  return (
                    <tr key={l._id}>
                      <td>{l.designation}</td>
                      <td><code>{l.numeroLot}</code></td>
                      <td className="text-end">{formatQte(l.qteRestante)}</td>
                      <td>{formatDate(l.dateLimite)}</td>
                      <td className="text-center"><Badge bg={j <= 7 ? "danger" : "warning"} text={j <= 7 ? undefined : "dark"} className={styles.joursBadge}>{j} j</Badge></td>
                      <td className="text-end">
                        <Button size="sm" variant="outline-primary" onClick={() => onAction?.("utilisation")}>
                          <i className="bi bi-clipboard2-pulse me-1"></i>Utiliser
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        </Card>
      )}
    </>
  );
}
