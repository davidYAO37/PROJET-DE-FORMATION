"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Modal, Button, Form, Row, Col, Alert, Spinner, Badge, InputGroup } from "react-bootstrap";
import { IMedicament } from "./TableMedicamentsPharmAccueilMedecin";
import { matchesSearch } from "@/lib/searchText";
import { fetchMedicamentsEnStock, searchMedicaments } from "@/components/MedicamentSearchSelect";

interface MedicamentSelectModalProps {
  show: boolean;
  onHide: () => void;
  /** Conservé pour compatibilité : le catalogue est désormais recherché côté serveur. */
  medicaments?: IMedicament[];
  onMedicamentsSelect: (medicaments: IMedicament[]) => void;
  selectedMedicamentIds?: string[];
}

const PAGE_SIZE = 20;

export default function MedicamentSelectModal({
  show,
  onHide,
  onMedicamentsSelect,
}: MedicamentSelectModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterInStock, setFilterInStock] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  // Sélection conservée d'une page / d'une recherche à l'autre
  const [selection, setSelection] = useState<Map<string, IMedicament>>(new Map());
  // Médicaments en stock (quelques dizaines) : chargés une fois à l'ouverture
  const [enStock, setEnStock] = useState<IMedicament[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);
  // Catalogue complet : recherche paginée côté serveur
  const [resultats, setResultats] = useState<{ items: IMedicament[]; total: number }>({ items: [], total: 0 });
  const [loadingRecherche, setLoadingRecherche] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  // Prix de vente saisi par le médecin pour chaque médicament coché (FCFA, entier)
  const [prixSaisis, setPrixSaisis] = useState<Map<string, string>>(new Map());
  const [enregistrement, setEnregistrement] = useState(false);

  const stockParId = useMemo(
    () => new Map(enStock.map((m) => [String(m._id), m.StockDisponible || 0])),
    [enStock]
  );

  // Ouverture : stock disponible ; fermeture : réinitialisation
  useEffect(() => {
    if (!show) {
      setSearchTerm("");
      setFilterInStock(false);
      setSelection(new Map());
      setPrixSaisis(new Map());
      setCurrentPage(1);
      return;
    }
    setErreur(null);
    setLoadingStock(true);
    fetchMedicamentsEnStock<IMedicament>()
      .then(setEnStock)
      .catch(() => setErreur("Impossible de charger le stock"))
      .finally(() => setLoadingStock(false));
  }, [show]);

  // Recherche serveur (insensible aux accents) quand on parcourt tout le catalogue
  useEffect(() => {
    if (!show || filterInStock) return;
    let annule = false;
    setLoadingRecherche(true);
    const timer = setTimeout(async () => {
      try {
        const r = await searchMedicaments(searchTerm, PAGE_SIZE, (currentPage - 1) * PAGE_SIZE);
        if (!annule) setResultats({ items: r.items as unknown as IMedicament[], total: r.total });
      } catch {
        if (!annule) setErreur("Recherche de médicaments impossible");
      } finally {
        if (!annule) setLoadingRecherche(false);
      }
    }, 250);
    return () => { annule = true; clearTimeout(timer); };
  }, [show, filterInStock, searchTerm, currentPage]);

  const enStockFiltres = useMemo(
    () => enStock.filter((m) => matchesSearch(searchTerm, m.Designation, m.Reference, m.CodeBarre)),
    [enStock, searchTerm]
  );

  const total = filterInStock ? enStockFiltres.length : resultats.total;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageMedicaments: IMedicament[] = (filterInStock
    ? enStockFiltres.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
    : resultats.items
  ).map((m) => ({ ...m, StockDisponible: stockParId.get(String(m._id)) ?? 0 }));
  const loading = loadingStock || (!filterInStock && loadingRecherche);

  const prixCatalogue = (m: IMedicament) => Math.round(Number(m.PrixVente) || 0);

  // Coche / décoche ; à la sélection, le prix est pré-rempli avec celui du catalogue
  const basculer = (medicaments: IMedicament[], cocher: boolean) => {
    setSelection((prev) => {
      const next = new Map(prev);
      for (const m of medicaments) {
        if (cocher) next.set(m._id, m);
        else next.delete(m._id);
      }
      return next;
    });
    setPrixSaisis((prev) => {
      const next = new Map(prev);
      for (const m of medicaments) {
        if (!cocher) next.delete(m._id);
        else if (!next.has(m._id)) next.set(m._id, prixCatalogue(m) > 0 ? String(prixCatalogue(m)) : "");
      }
      return next;
    });
  };

  const handleMedicamentToggle = (medicament: IMedicament) => basculer([medicament], !selection.has(medicament._id));

  // « Tout sélectionner » porte sur la page affichée (le catalogue complet compte des milliers de lignes)
  const allPageSelected = pageMedicaments.length > 0 && pageMedicaments.every((m) => selection.has(m._id));
  const togglePage = () => basculer(pageMedicaments, !allPageSelected);

  // Saisie : chiffres uniquement (montant entier en FCFA)
  const changerPrix = (id: string, valeur: string) => {
    setPrixSaisis((prev) => new Map(prev).set(id, valeur.replace(/\D/g, "")));
  };
  const prixDe = (id: string) => Number(prixSaisis.get(id) || 0);

  const sansPrix = Array.from(selection.values()).filter((m) => prixDe(m._id) <= 0);

  const handleValidateSelection = async () => {
    const choisis = Array.from(selection.values()).map((m) => ({ ...m, PrixVente: prixDe(m._id) }));

    // Le prix saisi devient le prix de vente du catalogue s'il est > 0 et différent de l'actuel
    const aMettreAJour = choisis.filter((m) => m.PrixVente > 0 && m.PrixVente !== prixCatalogue(selection.get(m._id)!));
    if (aMettreAJour.length > 0) {
      setEnregistrement(true);
      const resultats = await Promise.allSettled(
        aMettreAJour.map(async (m) => {
          const res = await fetch(`/api/medicaments/${m._id}/prix-vente`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ PrixVente: m.PrixVente }),
          });
          if (!res.ok) throw new Error(m.Designation);
        })
      );
      setEnregistrement(false);
      const echecs = resultats
        .map((r, i) => (r.status === "rejected" ? aMettreAJour[i].Designation : null))
        .filter(Boolean);
      if (echecs.length > 0) {
        alert(
          `Le prix n'a pas pu être enregistré dans le catalogue pour : ${echecs.join(", ")}.\n` +
          `Il est quand même appliqué à cette prescription.`
        );
      }
    }

    onMedicamentsSelect(choisis);
    onHide();
  };

  const changerRecherche = (valeur: string) => {
    setSearchTerm(valeur);
    setCurrentPage(1);
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" scrollable backdrop="static" keyboard={false}>
      <Modal.Header closeButton className="bg-primary text-white py-2">
        <Modal.Title className="fs-6 fw-bold">
          <i className="bi bi-capsule me-2"></i>
          Sélectionner des médicaments
          {selection.size > 0 && (
            <Badge bg="warning" text="dark" className="ms-2">
              {selection.size} sélectionné(s)
            </Badge>
          )}
        </Modal.Title>
      </Modal.Header>

      {/* Barre de recherche et filtres — fixe au-dessus du body scrollable */}
      <div className="px-3 pt-3 pb-2 border-bottom bg-light">
        <Row className="g-2 align-items-center">
          <Col md={6}>
            <Form.Control
              type="text"
              value={searchTerm}
              onChange={(e) => changerRecherche(e.target.value)}
              placeholder="Rechercher par nom ou référence (accents non obligatoires)..."
              autoFocus
              size="sm"
            />
          </Col>
          <Col md={3} className="d-flex align-items-center">
            <Form.Check
              type="checkbox"
              id="filter-in-stock"
              label={<span className="small"><i className="bi bi-box-seam me-1 text-success"></i>En stock seulement</span>}
              checked={filterInStock}
              onChange={(e) => { setFilterInStock(e.target.checked); setCurrentPage(1); }}
            />
          </Col>
          <Col md={3} className="text-end">
            <span className="text-muted small me-2">
              {total} résultat(s)
              {!filterInStock && (
                <> · <span className="text-success fw-semibold">{enStock.length} en stock</span></>
              )}
            </span>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={togglePage}
              disabled={pageMedicaments.length === 0}
            >
              {allPageSelected ? "Désélectionner la page" : "Sélectionner la page"}
            </Button>
          </Col>
        </Row>
      </div>

      <Modal.Body className="p-0">
        {erreur && <Alert variant="danger" className="m-3">{erreur}</Alert>}
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" className="me-2" />
            <span>Chargement des médicaments...</span>
          </div>
        ) : pageMedicaments.length === 0 ? (
          <Alert variant="info" className="m-3">
            <i className="bi bi-search me-2"></i>
            {searchTerm ? `Aucun médicament trouvé pour "${searchTerm}"` : "Aucun médicament disponible"}
          </Alert>
        ) : (
          <table className="table table-hover table-sm mb-0">
            <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <tr>
                <th style={{ width: 40 }} className="text-center">
                  <Form.Check
                    checked={allPageSelected}
                    onChange={togglePage}
                  />
                </th>
                <th>Désignation</th>
                <th>Référence</th>
                <th className="text-end">Prix de vente</th>
                <th className="text-center">Stock</th>
              </tr>
            </thead>
            <tbody>
              {pageMedicaments.map((medicament) => {
                const isSelected = selection.has(medicament._id);
                const inStock = (medicament.StockDisponible || 0) > 0;
                return (
                  <tr
                    key={medicament._id}
                    onClick={() => handleMedicamentToggle(medicament)}
                    style={{ cursor: 'pointer' }}
                    className={isSelected ? 'table-primary' : ''}
                  >
                    <td className="text-center" onClick={e => e.stopPropagation()}>
                      <Form.Check
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleMedicamentToggle(medicament)}
                      />
                    </td>
                    <td className="fw-semibold">{medicament.Designation}</td>
                    <td className="text-muted small">{medicament.Reference || '-'}</td>
                    <td className="text-end small" onClick={e => isSelected && e.stopPropagation()} style={{ width: 160 }}>
                      {isSelected ? (
                        <InputGroup size="sm">
                          <Form.Control
                            type="text"
                            inputMode="numeric"
                            className={`text-end ${prixDe(medicament._id) <= 0 ? 'border-warning' : ''}`}
                            value={prixSaisis.get(medicament._id) ?? ""}
                            onChange={(e) => changerPrix(medicament._id, e.target.value)}
                            placeholder="Prix"
                            aria-label={`Prix de vente de ${medicament.Designation}`}
                          />
                          <InputGroup.Text>FCFA</InputGroup.Text>
                        </InputGroup>
                      ) : (
                        medicament.PrixVente ? `${medicament.PrixVente.toLocaleString()} FCFA` : <span className="text-muted">Aucun prix</span>
                      )}
                    </td>
                    <td className="text-center">
                      <Badge bg={inStock ? 'success' : 'danger'} className="small">
                        {medicament.StockDisponible ?? '-'}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center px-3 py-2 border-top bg-light">
          <span className="text-muted small">
            Page {currentPage} / {totalPages} &nbsp;·&nbsp; {total} médicament(s)
          </span>
          <div className="d-flex gap-1">
            <Button size="sm" variant="outline-secondary" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>«</Button>
            <Button size="sm" variant="outline-secondary" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>‹</Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
              const page = start + i;
              return page <= totalPages ? (
                <Button
                  key={page}
                  size="sm"
                  variant={page === currentPage ? 'primary' : 'outline-secondary'}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ) : null;
            })}
            <Button size="sm" variant="outline-secondary" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>›</Button>
            <Button size="sm" variant="outline-secondary" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>»</Button>
          </div>
        </div>
      )}
      </Modal.Body>

      <Modal.Footer className="justify-content-between py-2">
        <div className="flex-grow-1 me-2">
          {selection.size > 0 && (
            <span className="text-muted small">
              <i className="bi bi-check2-square me-1 text-primary"></i>
              {selection.size} médicament(s) sélectionné(s)
            </span>
          )}
          {sansPrix.length > 0 && (
            <div className="text-warning-emphasis small mt-1">
              <i className="bi bi-exclamation-triangle me-1"></i>
              Prix de vente à 0 pour : {sansPrix.map((m) => m.Designation).join(", ")}. Vous pouvez valider, mais ces lignes seront facturées 0 FCFA.
            </div>
          )}
        </div>
        <div className="d-flex gap-2">
          <Button variant="secondary" size="sm" onClick={onHide}>
            <i className="bi bi-x-circle me-1"></i>Annuler
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleValidateSelection}
            disabled={selection.size === 0 || enregistrement}
          >
            <i className="bi bi-check-circle me-1"></i>
            {enregistrement ? "Enregistrement des prix..." : `Valider (${selection.size})`}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
