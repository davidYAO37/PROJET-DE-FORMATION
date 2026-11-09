"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Modal, Button, Form, Row, Col, Table, Alert, Spinner, Badge, Pagination } from "react-bootstrap";
import { Pharmacie } from "@/types/pharmacie";
import { fetchMedicamentsByIds, searchMedicaments } from "@/components/MedicamentSearchSelect";
import { matchesSearch } from "@/lib/searchText";

export interface StockRow {
  _id: string;
  IDMEDICAMENT?: string;
  Reference?: string;
  Medicament?: string;
  QteEnStock?: number;
  QteMinimum?: number;
  QteMaximum?: number;
  QteStockVirtuel?: number;
}

export interface MedicamentImporte {
  medicament: Pharmacie;
  stock: StockRow | null;
  quantiteProposee: number;
}

type Filtre = "suivis" | "rupture" | "sousSeuil" | "tous";

type Props = {
  show: boolean;
  onHide: () => void;
  dejaAjoutes: string[];
  onImport: (items: MedicamentImporte[]) => void;
};

const PAGE_SIZE = 50;
const MAX_SELECTION = 300;

const estEnRupture = (s?: StockRow | null) => !!s && (s.QteEnStock ?? 0) <= 0;
const estSousSeuil = (s?: StockRow | null) =>
  !!s && (s.QteMinimum ?? 0) > 0 && (s.QteEnStock ?? 0) <= (s.QteMinimum ?? 0);

// Quantité à commander : jusqu'au seuil max si défini, sinon de quoi revenir au seuil min, sinon 1.
// Un stock négatif (quantité due aux patients) est inclus : max - (-7) = max + 7.
const quantiteProposee = (s?: StockRow | null) => {
  const qte = s?.QteEnStock ?? 0;
  if (s && (s.QteMaximum ?? 0) > qte) return (s.QteMaximum ?? 0) - qte;
  if (s && (s.QteMinimum ?? 0) > qte) return (s.QteMinimum ?? 0) - qte;
  return qte < 0 ? -qte + 1 : 1;
};

export default function ImporterMedicamentsModal({ show, onHide, dejaAjoutes, onImport }: Props) {
  const [stocks, setStocks] = useState<Record<string, StockRow>>({});
  const [suivis, setSuivis] = useState<Pharmacie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filtre, setFiltre] = useState<Filtre>("suivis");
  const [recherche, setRecherche] = useState("");
  const [page, setPage] = useState(1);
  const [selection, setSelection] = useState<Map<string, Pharmacie>>(new Map());
  // Catalogue complet : recherche paginée côté serveur
  const [catalogue, setCatalogue] = useState<{ items: Pharmacie[]; total: number }>({ items: [], total: 0 });
  const [loadingCatalogue, setLoadingCatalogue] = useState(false);

  // Chargement du stock et des médicaments qui y sont suivis
  useEffect(() => {
    if (!show) return;
    setSelection(new Map());
    setRecherche("");
    setPage(1);
    setFiltre("suivis");
    setError("");
    setLoading(true);
    (async () => {
      try {
        const res = await fetch("/api/stock");
        if (!res.ok) throw new Error("Impossible de charger le stock");
        const data: StockRow[] = await res.json();
        const map: Record<string, StockRow> = {};
        (Array.isArray(data) ? data : []).forEach((s) => {
          if (s.IDMEDICAMENT) map[String(s.IDMEDICAMENT)] = s;
        });
        setStocks(map);
        setSuivis(await fetchMedicamentsByIds(Object.keys(map)));
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [show]);

  useEffect(() => {
    if (!show || filtre !== "tous") return;
    let annule = false;
    setLoadingCatalogue(true);
    const timer = setTimeout(async () => {
      try {
        const r = await searchMedicaments(recherche, PAGE_SIZE, (page - 1) * PAGE_SIZE);
        if (!annule) setCatalogue(r);
      } catch (e: any) {
        if (!annule) setError(e.message);
      } finally {
        if (!annule) setLoadingCatalogue(false);
      }
    }, 250);
    return () => { annule = true; clearTimeout(timer); };
  }, [show, filtre, recherche, page]);

  const dejaSet = useMemo(() => new Set(dejaAjoutes), [dejaAjoutes]);

  const compteurs = useMemo(() => ({
    suivis: suivis.length,
    rupture: suivis.filter((m) => estEnRupture(stocks[m._id!])).length,
    sousSeuil: suivis.filter((m) => estSousSeuil(stocks[m._id!])).length,
  }), [suivis, stocks]);

  const filtresLocaux = useMemo(() => {
    if (filtre === "tous") return [];
    return suivis
      .filter((m) => {
        const s = stocks[m._id!];
        if (filtre === "rupture" && !estEnRupture(s)) return false;
        if (filtre === "sousSeuil" && !estSousSeuil(s)) return false;
        return matchesSearch(recherche, m.Designation, m.Reference);
      })
      .sort((a, b) => (a.Designation || "").localeCompare(b.Designation || ""));
  }, [suivis, stocks, filtre, recherche]);

  const total = filtre === "tous" ? catalogue.total : filtresLocaux.length;
  const nbPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageCourante = Math.min(page, nbPages);
  const visibles = filtre === "tous"
    ? catalogue.items
    : filtresLocaux.slice((pageCourante - 1) * PAGE_SIZE, pageCourante * PAGE_SIZE);
  const pageSelectionnable = visibles.filter((m) => !dejaSet.has(m._id!));
  const pageToutCoche = pageSelectionnable.length > 0 && pageSelectionnable.every((m) => selection.has(m._id!));

  const basculer = (meds: Pharmacie[], cocher: boolean) => {
    setSelection((prev) => {
      const next = new Map(prev);
      for (const m of meds) {
        if (cocher) {
          if (next.size >= MAX_SELECTION) break;
          next.set(m._id!, m);
        } else next.delete(m._id!);
      }
      return next;
    });
  };

  const toutSelectionner = async () => {
    if (filtre !== "tous") return basculer(filtresLocaux.filter((m) => !dejaSet.has(m._id!)), true);
    try {
      const r = await searchMedicaments(recherche, MAX_SELECTION, 0);
      basculer(r.items.filter((m) => !dejaSet.has(m._id!)), true);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleImport = () => {
    const items = Array.from(selection.values()).map((m) => {
      const stock = stocks[m._id!] || null;
      return { medicament: m, stock, quantiteProposee: quantiteProposee(stock) };
    });
    onImport(items);
    onHide();
  };

  const badgeStock = (s?: StockRow) => {
    if (!s) return <span className="text-muted">—</span>;
    const bg = estEnRupture(s) ? "danger" : estSousSeuil(s) ? "warning" : "success";
    return <Badge bg={bg} text={bg === "warning" ? "dark" : undefined}>{s.QteEnStock ?? 0}</Badge>;
  };

  const chargement = loading || (filtre === "tous" && loadingCatalogue);

  return (
    <Modal show={show} onHide={onHide} size="xl" backdrop="static" keyboard={false} centered>
      <Modal.Header closeButton>
        <Modal.Title>Importer des médicaments du catalogue</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}

        <Row className="g-2 mb-3 align-items-end">
          <Col md={6}>
            <Form.Label className="fw-semibold small mb-1">Afficher</Form.Label>
            <div className="d-flex flex-wrap gap-1">
              {([
                ["suivis", "Suivis en stock", "primary", compteurs.suivis],
                ["rupture", "En rupture", "danger", compteurs.rupture],
                ["sousSeuil", "Sous le seuil min", "warning", compteurs.sousSeuil],
                ["tous", "Tout le catalogue", "secondary", null],
              ] as [Filtre, string, string, number | null][]).map(([key, label, variant, nb]) => (
                <Button
                  key={key}
                  size="sm"
                  variant={filtre === key ? variant : `outline-${variant}`}
                  onClick={() => { setFiltre(key); setPage(1); }}
                >
                  {label}{nb !== null ? ` (${nb})` : ""}
                </Button>
              ))}
            </div>
          </Col>
          <Col md={6}>
            <Form.Label className="fw-semibold small mb-1">Rechercher</Form.Label>
            <Form.Control
              size="sm"
              placeholder="Désignation ou référence (accents non obligatoires)..."
              value={recherche}
              onChange={(e) => { setRecherche(e.target.value); setPage(1); }}
            />
          </Col>
        </Row>

        <div className="d-flex justify-content-between align-items-center mb-2 small">
          <span className="text-muted">
            {total} médicament{total > 1 ? "s" : ""} — <strong>{selection.size}</strong> sélectionné{selection.size > 1 ? "s" : ""}
            {selection.size >= MAX_SELECTION && <span className="text-danger ms-2">(limite de {MAX_SELECTION} atteinte)</span>}
          </span>
          <div className="d-flex gap-1">
            <Button
              size="sm"
              variant="outline-primary"
              disabled={total === 0 || total > MAX_SELECTION}
              title={total > MAX_SELECTION ? `Affinez la recherche (max ${MAX_SELECTION})` : ""}
              onClick={toutSelectionner}
            >
              Tout sélectionner ({total})
            </Button>
            <Button size="sm" variant="outline-secondary" disabled={selection.size === 0} onClick={() => setSelection(new Map())}>
              Vider la sélection
            </Button>
          </div>
        </div>

        {chargement ? (
          <div className="text-center py-4"><Spinner animation="border" size="sm" /> Chargement...</div>
        ) : (
          <div className="table-responsive" style={{ maxHeight: "55vh", overflow: "auto" }}>
            <Table bordered hover size="sm" className="mb-0">
              <thead className="table-light" style={{ position: "sticky", top: 0, zIndex: 2 }}>
                <tr className="text-center">
                  <th style={{ width: 36 }}>
                    <Form.Check
                      checked={pageToutCoche}
                      disabled={pageSelectionnable.length === 0}
                      onChange={(e) => basculer(pageSelectionnable, e.target.checked)}
                      title="Sélectionner la page"
                    />
                  </th>
                  <th>Désignation</th>
                  <th>Référence</th>
                  <th>Prix achat</th>
                  <th>Prix vente</th>
                  <th>Stock</th>
                  <th>Seuil min</th>
                  <th>Seuil max</th>
                  <th>Qté proposée</th>
                </tr>
              </thead>
              <tbody>
                {visibles.length === 0 ? (
                  <tr><td colSpan={9} className="text-center text-muted py-3">Aucun médicament</td></tr>
                ) : visibles.map((m) => {
                  const s = stocks[m._id!];
                  const deja = dejaSet.has(m._id!);
                  const coche = selection.has(m._id!);
                  return (
                    <tr
                      key={m._id}
                      className={deja ? "table-secondary" : coche ? "table-primary" : ""}
                      style={{ cursor: deja ? "default" : "pointer", fontSize: 13 }}
                      onClick={() => !deja && basculer([m], !coche)}
                    >
                      <td className="text-center" onClick={(e) => e.stopPropagation()}>
                        <Form.Check
                          checked={deja || coche}
                          disabled={deja}
                          onChange={(e) => basculer([m], e.target.checked)}
                        />
                      </td>
                      <td>
                        {m.Designation}
                        {deja && <Badge bg="secondary" className="ms-2">déjà ajouté</Badge>}
                      </td>
                      <td>{m.Reference}</td>
                      <td className="text-end">{m.PrixAchat ?? 0}</td>
                      <td className="text-end">{m.PrixVente ?? 0}</td>
                      <td className="text-center">{badgeStock(s)}</td>
                      <td className="text-center">{s?.QteMinimum ?? "—"}</td>
                      <td className="text-center">{s?.QteMaximum ?? "—"}</td>
                      <td className="text-center fw-bold">{quantiteProposee(s)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        )}

        {nbPages > 1 && (
          <Pagination size="sm" className="justify-content-center mt-2 mb-0">
            <Pagination.Prev disabled={pageCourante === 1} onClick={() => setPage(pageCourante - 1)} />
            <Pagination.Item active>{pageCourante} / {nbPages}</Pagination.Item>
            <Pagination.Next disabled={pageCourante === nbPages} onClick={() => setPage(pageCourante + 1)} />
          </Pagination>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Fermer</Button>
        <Button variant="success" disabled={selection.size === 0} onClick={handleImport}>
          Importer {selection.size > 0 ? `(${selection.size})` : ""}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
