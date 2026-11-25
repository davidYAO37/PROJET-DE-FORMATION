"use client";

import { useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Col, Form, Row, Spinner, Table } from "react-bootstrap";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { apiIntrant, formatMontant, formatQte } from "./api";
import styles from "./intrants.module.css";

const COULEURS = ["#0d6efd", "#198754", "#dc3545", "#ffc107", "#6f42c1", "#0dcaf0", "#fd7e14", "#20c997"];
const moisDebut = () => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10); };
const aujourdhui = () => new Date().toISOString().slice(0, 10);

export default function IntrantStatistiques() {
  const [data, setData] = useState<any>(null);
  const [debut, setDebut] = useState(moisDebut());
  const [fin, setFin] = useState(aujourdhui());
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");

  const charger = async () => {
    setChargement(true);
    setErreur("");
    try {
      const res = await apiIntrant(`/api/intrants/statistiques?dateDebut=${debut}&dateFin=${fin}`);
      setData(res.data);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => { charger(); }, []);

  if (chargement && !data) return <div className="text-center p-4"><Spinner animation="border" /></div>;

  const t = data?.totaux || {};
  const cartes = [
    { label: "Entrées", value: formatQte(t.entrees), sous: formatMontant(t.coutEntrees), couleur: "success" },
    { label: "Utilisations", value: formatQte(t.utilisations), sous: formatMontant(t.coutUtilisations), couleur: "primary" },
    { label: "Pertes", value: formatQte(t.pertes), sous: formatMontant(t.coutPertes), couleur: "danger" },
    { label: "Valorisation du stock", value: formatMontant(data?.valorisationStock), sous: `${data?.intrantsActifs || 0} intrants actifs`, couleur: "info" },
    { label: "Lots périmés", value: data?.lotsPerimes ?? 0, sous: "à déclarer en perte", couleur: "dark" },
  ];

  return (
    <>
      <Card className={`${styles.panel} mb-3`}>
        <Card.Body className="d-flex flex-wrap gap-2 align-items-end">
          <div><Form.Label className="mb-0 small">Du</Form.Label><Form.Control type="date" value={debut} onChange={(e) => setDebut(e.target.value)} /></div>
          <div><Form.Label className="mb-0 small">Au</Form.Label><Form.Control type="date" value={fin} onChange={(e) => setFin(e.target.value)} /></div>
          <Button variant="primary" onClick={charger} disabled={chargement}><i className="bi bi-arrow-clockwise me-1"></i>Actualiser</Button>
        </Card.Body>
      </Card>

      {erreur && <Alert variant="danger">{erreur}</Alert>}
      {data && (
        <>
          <Row className="g-3 mb-3">
            {cartes.map((c) => (
              <Col key={c.label} md>
                <Card className={`${styles.statCard} shadow-sm h-100`}><Card.Body>
                  <div className={`small text-${c.couleur}`}>{c.label}</div>
                  <div className="fs-5 fw-bold">{c.value}</div>
                  <div className="small text-muted">{c.sous}</div>
                </Card.Body></Card>
              </Col>
            ))}
          </Row>

          <Row className="g-3 mb-3">
            <Col lg={7}>
              <Card className={`${styles.panel} h-100`}>
                <Card.Header className={styles.panelHeader}><h6 className="mb-0">Mouvements par mois</h6></Card.Header>
                <Card.Body style={{ height: 280 }}>
                  <ResponsiveContainer>
                    <LineChart data={data.parMois}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mois" /><YAxis /><Tooltip /><Legend />
                      <Line dataKey="entrees" name="Entrées" stroke="#198754" />
                      <Line dataKey="utilisations" name="Utilisations" stroke="#0d6efd" />
                      <Line dataKey="pertes" name="Pertes" stroke="#dc3545" />
                    </LineChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={5}>
              <Card className={`${styles.panel} h-100`}>
                <Card.Header className={styles.panelHeader}><h6 className="mb-0">Motifs d'utilisation et de perte</h6></Card.Header>
                <Card.Body style={{ height: 280 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={data.parMotif} dataKey="quantite" nameKey="motif" outerRadius={90} label>
                        {data.parMotif.map((_: any, i: number) => <Cell key={i} fill={COULEURS[i % COULEURS.length]} />)}
                      </Pie>
                      <Tooltip /><Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Card className={styles.panel}>
            <Card.Header className={styles.panelHeader}><h6 className="mb-0">Consommation par intrant (utilisé vs perdu)</h6></Card.Header>
            <div className="table-responsive">
              <Table hover size="sm" className="mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Intrant</th><th className="text-end">Utilisé</th><th className="text-end">Perdu</th>
                    <th className="text-end">% perte</th><th className="text-end">Coût utilisé</th><th className="text-end">Coût perdu</th>
                  </tr>
                </thead>
                <tbody>
                  {data.parIntrant.map((i: any) => (
                    <tr key={i.intrantId}>
                      <td>{i.designation} <span className="text-muted small">({i.unite})</span></td>
                      <td className="text-end">{formatQte(i.utilise)}</td>
                      <td className="text-end">{formatQte(i.perdu)}</td>
                      <td className="text-end">{i.tauxPerte > 10 ? <Badge bg="danger">{i.tauxPerte}%</Badge> : `${i.tauxPerte}%`}</td>
                      <td className="text-end">{formatMontant(i.coutUtilise)}</td>
                      <td className="text-end">{formatMontant(i.coutPerdu)}</td>
                    </tr>
                  ))}
                  {!data.parIntrant.length && <tr><td colSpan={6} className="text-center text-muted py-4">Aucun mouvement sur la période.</td></tr>}
                </tbody>
              </Table>
            </div>
          </Card>
        </>
      )}
    </>
  );
}
