"use client";

import { useEffect, useState } from "react";
import { Badge, Nav } from "react-bootstrap";
import { apiIntrant } from "./api";
import styles from "./intrants.module.css";
import IntrantAlertes from "./IntrantAlertes";
import IntrantCatalogue from "./IntrantCatalogue";
import IntrantStock from "./IntrantStock";
import IntrantMouvementForm from "./IntrantMouvementForm";
import IntrantMouvementsListe from "./IntrantMouvementsListe";
import IntrantStatistiques from "./IntrantStatistiques";
import IntrantComparaison from "./IntrantComparaison";

const onglets = [
  { key: "alertes", label: "Alertes", icone: "bi-bell" },
  { key: "stock", label: "Stock", icone: "bi-clipboard-data" },
  { key: "catalogue", label: "Catalogue", icone: "bi-boxes" },
  { key: "reception", label: "Réception", icone: "bi-box-arrow-in-down" },
  { key: "utilisation", label: "Utilisation", icone: "bi-clipboard2-pulse" },
  { key: "perte", label: "Pertes", icone: "bi-trash" },
  { key: "ajustement", label: "Ajustement", icone: "bi-sliders" },
  { key: "mouvements", label: "Mouvements", icone: "bi-journal-text" },
  { key: "statistiques", label: "Statistiques", icone: "bi-bar-chart" },
  { key: "comparaison", label: "Comparaison labo", icone: "bi-diagram-3" },
];

/**
 * Module intrants laboratoire — entièrement autonome : aucun examen ni résultat
 * ne déclenche de mouvement. La comparaison avec l'activité labo est en
 * lecture seule, dans l'onglet "Comparaison labo".
 */
export default function GestionIntrant() {
  const [onglet, setOnglet] = useState("alertes");
  const [refreshKey, setRefreshKey] = useState(0);
  const [nbAlertes, setNbAlertes] = useState(0);

  const rafraichir = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    apiIntrant("/api/intrants/stock")
      .then((d) => {
        const a = d.data?.alertes;
        setNbAlertes((a?.sousSeuil?.length || 0) + (a?.perimes?.length || 0) + (a?.prochesPeremption?.length || 0));
      })
      .catch(() => setNbAlertes(0));
  }, [refreshKey]);

  return (
    <div className="container-fluid py-3">
      <div className={`${styles.hero} d-flex align-items-center mb-4`}>
        <div className={styles.heroIcon}><i className="bi bi-eyedropper"></i></div>
        <div className="ms-3">
          <h4 className="mb-0">Intrants du laboratoire</h4>
          <small className="opacity-75">
            Réactifs, kits et consommables — stock autonome, sorties = quantités effectivement utilisées
          </small>
        </div>
        {nbAlertes > 0 && (
          <div className="ms-auto text-end">
            <div className="fs-4 fw-bold">{nbAlertes}</div>
            <small className="opacity-75">alerte{nbAlertes > 1 ? "s" : ""} active{nbAlertes > 1 ? "s" : ""}</small>
          </div>
        )}
      </div>

      <Nav variant="pills" className="mb-4 flex-nowrap overflow-auto gap-1" activeKey={onglet} onSelect={(k) => setOnglet(k || "alertes")}>
        {onglets.map((o) => (
          <Nav.Item key={o.key}>
            <Nav.Link eventKey={o.key} className="text-nowrap">
              <i className={`bi ${o.icone} me-1`}></i>{o.label}
              {o.key === "alertes" && nbAlertes > 0 && <Badge bg="danger" pill className={styles.tabBadge}>{nbAlertes}</Badge>}
            </Nav.Link>
          </Nav.Item>
        ))}
      </Nav>

      {onglet === "alertes" && <IntrantAlertes key={refreshKey} onAction={setOnglet} />}
      {onglet === "stock" && <IntrantStock key={refreshKey} />}
      {onglet === "catalogue" && <IntrantCatalogue />}
      {onglet === "reception" && <IntrantMouvementForm type="entree" onEnregistre={rafraichir} />}
      {onglet === "utilisation" && <IntrantMouvementForm type="utilisation" onEnregistre={rafraichir} />}
      {onglet === "perte" && <IntrantMouvementForm type="perte" onEnregistre={rafraichir} />}
      {onglet === "ajustement" && <IntrantMouvementForm type="ajustement" onEnregistre={rafraichir} />}
      {onglet === "mouvements" && <IntrantMouvementsListe refreshKey={refreshKey} />}
      {onglet === "statistiques" && <IntrantStatistiques />}
      {onglet === "comparaison" && <IntrantComparaison />}
    </div>
  );
}
