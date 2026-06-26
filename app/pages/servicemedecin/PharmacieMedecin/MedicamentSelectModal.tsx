"use client";

import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Card, Alert, Spinner, Badge } from "react-bootstrap";
import { IMedicament } from "./TableMedicamentsPharmAccueilMedecin";

interface MedicamentSelectModalProps {
  show: boolean;
  onHide: () => void;
  medicaments: IMedicament[];
  onMedicamentsSelect: (medicaments: IMedicament[]) => void;
  selectedMedicamentIds?: string[];
}

export default function MedicamentSelectModal({
  show,
  onHide,
  medicaments,
  onMedicamentsSelect,
  selectedMedicamentIds = []
}: MedicamentSelectModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [filteredMedicaments, setFilteredMedicaments] = useState<IMedicament[]>([]);
  const [selectedMedicaments, setSelectedMedicaments] = useState<Set<string>>(new Set(selectedMedicamentIds));
  const [allMedicaments, setAllMedicaments] = useState<IMedicament[]>([]);
  const [filterInStock, setFilterInStock] = useState(false);
  const [medicamentsWithStock, setMedicamentsWithStock] = useState<(IMedicament & { stockInfo?: any })[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  // Charger tous les médicaments de la pharmacie quand le modal s'ouvre
  useEffect(() => {
    if (show) {
      loadAllMedicaments();
      setSelectedMedicaments(new Set(selectedMedicamentIds));
    }
  }, [show, selectedMedicamentIds]);

  // Fonction pour charger tous les médicaments avec leurs informations de stock
  const loadAllMedicaments = async () => {
    setLoading(true);
    try {
      // Charger les médicaments
      const medicamentsResponse = await fetch('/api/medicaments');
      let medicamentsList: IMedicament[] = [];
      
      if (medicamentsResponse.ok) {
        const data = await medicamentsResponse.json();
        medicamentsList = data.data || data || [];
      } else {
        console.error("❌ Erreur lors du chargement des médicaments");
        medicamentsList = medicaments;
      }

      // Charger les informations de stock
      try {
        const stockResponse = await fetch('/api/stock');
        if (stockResponse.ok) {
          const stockData = await stockResponse.json();
          const stocks = Array.isArray(stockData) ? stockData : [];
          
          console.log("� Chargement des données:", {medicaments: medicamentsList.length, stocks: stocks.length});
          
          // Fusionner les informations de stock avec les médicaments
          const medicamentsWithStockInfo = medicamentsList.map(medicament => {
            // Essayer différentes correspondances possibles
            let stockInfo = null;
            
            // 1. Correspondance par IDMEDICAMENT (string)
            stockInfo = stocks.find(stock => stock.IDMEDICAMENT === medicament._id);
            
            // 2. Correspondance par IDMEDICAMENT (ObjectId string)
            if (!stockInfo) {
              stockInfo = stocks.find(stock => stock.IDMEDICAMENT?.toString() === medicament._id);
            }
            
            // 3. Correspondance par Référence
            if (!stockInfo && medicament.Reference) {
              stockInfo = stocks.find(stock => stock.Reference === medicament.Reference);
            }
            
            // 4. Correspondance par CodeBarre
            if (!stockInfo && medicament.CodeBarre) {
              stockInfo = stocks.find(stock => stock.CodeBarre === medicament.CodeBarre);
            }
            
            // 5. Correspondance par designation/nom (insensible à la casse)
            if (!stockInfo && medicament.Designation) {
              stockInfo = stocks.find(stock => 
                (stock.Designation && stock.Designation.toLowerCase() === medicament.Designation.toLowerCase()) ||
                (stock.NomMedicament && stock.NomMedicament.toLowerCase() === medicament.Designation.toLowerCase()) ||
                (stock.Nom && stock.Nom.toLowerCase() === medicament.Designation.toLowerCase())
              );
            }
            
            // Extraire la quantité du champ correct (QteEnStock)
            const stockQuantity = stockInfo ? (
              stockInfo.QteEnStock || 
              stockInfo.Quantite || 
              stockInfo.quantite || 
              stockInfo.Qte || 
              stockInfo.quantité ||
              stockInfo.stock ||
              stockInfo.Stock ||
              0
            ) : 0;
            
                        
            return {
              ...medicament,
              stockInfo: stockInfo || null,
              StockDisponible: stockQuantity
            };
          });
          
          const medicamentsEnStock = medicamentsWithStockInfo.filter(m => m.StockDisponible > 0);
          console.log("📦 Médicaments avec stock > 0:", medicamentsEnStock.length, medicamentsEnStock.map(m => ({nom: m.Designation, stock: m.StockDisponible})));
          
          setMedicamentsWithStock(medicamentsWithStockInfo);
          setAllMedicaments(medicamentsWithStockInfo);
          console.log("📦 Total médicaments avec stock chargés:", medicamentsWithStockInfo.length);
        } else {
          console.error("❌ API stock a retourné une erreur");
          setMedicamentsWithStock(medicamentsList);
          setAllMedicaments(medicamentsList);
        }
      } catch (stockError) {
        console.error("❌ Erreur lors du chargement du stock:", stockError);
        setMedicamentsWithStock(medicamentsList);
        setAllMedicaments(medicamentsList);
      }
      
    } catch (error) {
      console.error("❌ Erreur lors du chargement des médicaments:", error);
      // Utiliser les medicaments en props en cas d'erreur
      setAllMedicaments(medicaments);
      setMedicamentsWithStock(medicaments);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les médicaments selon la recherche et le stock
  useEffect(() => {
    let filtered = medicamentsWithStock;

    if (searchTerm) {
      filtered = filtered.filter(m =>
        m.Designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.Reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.CodeBarre?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterInStock) {
      filtered = filtered.filter(m => (m.StockDisponible || 0) > 0);
    }

    setFilteredMedicaments(filtered);
    setCurrentPage(1);
  }, [searchTerm, medicamentsWithStock, filterInStock]);

  // Réinitialiser les états à la fermeture du modal
  useEffect(() => {
    if (!show) {
      setSearchTerm("");
      setFilterInStock(false);
      setSelectedMedicaments(new Set());
    }
  }, [show]);

  const handleMedicamentToggle = (medicamentId: string) => {
    setSelectedMedicaments(prev => {
      const next = new Set(prev);
      if (next.has(medicamentId)) {
        next.delete(medicamentId);
      } else {
        next.add(medicamentId);
      }
      return next;
    });
  };

  const handleValidateSelection = () => {
    const selectedMeds = medicamentsWithStock.filter(m => selectedMedicaments.has(m._id));
    
    onMedicamentsSelect(selectedMeds);
    onHide();
    setSearchTerm("");
    setFilterInStock(false); // Réinitialiser le filtre de stock
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const totalPages = Math.ceil(filteredMedicaments.length / PAGE_SIZE);
  const pageMedicaments = filteredMedicaments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const allFilteredSelected =
    filteredMedicaments.length > 0 &&
    filteredMedicaments.every(m => selectedMedicaments.has(m._id));

  const toggleAllFiltered = () => {
    const filteredIds = filteredMedicaments.map(m => m._id);
    if (allFilteredSelected) {
      setSelectedMedicaments(prev => {
        const next = new Set(prev);
        filteredIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelectedMedicaments(prev => {
        const next = new Set(prev);
        filteredIds.forEach(id => next.add(id));
        return next;
      });
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" scrollable>
      <Modal.Header closeButton className="bg-primary text-white py-2">
        <Modal.Title className="fs-6 fw-bold">
          <i className="bi bi-capsule me-2"></i>
          Sélectionner des médicaments
          {selectedMedicaments.size > 0 && (
            <Badge bg="warning" text="dark" className="ms-2">
              {selectedMedicaments.size} sélectionné(s)
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
              onChange={handleSearchChange}
              placeholder="Rechercher par nom, référence ou code barre..."
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
              onChange={(e) => setFilterInStock(e.target.checked)}
            />
          </Col>
          <Col md={3} className="text-end">
            <span className="text-muted small me-2">
              {filteredMedicaments.length} résultat(s)
              {!filterInStock && (
                <> · <span className="text-success fw-semibold">{medicamentsWithStock.filter(m => (m.StockDisponible || 0) > 0).length} en stock</span></>
              )}
            </span>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={toggleAllFiltered}
              disabled={filteredMedicaments.length === 0}
            >
              {allFilteredSelected ? "Tout désélectionner" : "Tout sélectionner"}
            </Button>
          </Col>
        </Row>
      </div>

      <Modal.Body className="p-0">
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" className="me-2" />
            <span>Chargement des médicaments...</span>
          </div>
        ) : filteredMedicaments.length === 0 ? (
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
                    checked={allFilteredSelected}
                    onChange={toggleAllFiltered}
                  />
                </th>
                <th>Désignation</th>
                <th>Référence</th>
                <th className="text-end">Prix vente</th>
                <th className="text-center">Stock</th>
              </tr>
            </thead>
            <tbody>
              {pageMedicaments.map((medicament) => {
                const isSelected = selectedMedicaments.has(medicament._id);
                const inStock = (medicament.StockDisponible || 0) > 0;
                return (
                  <tr
                    key={medicament._id}
                    onClick={() => handleMedicamentToggle(medicament._id)}
                    style={{ cursor: 'pointer' }}
                    className={isSelected ? 'table-primary' : ''}
                  >
                    <td className="text-center" onClick={e => e.stopPropagation()}>
                      <Form.Check
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleMedicamentToggle(medicament._id)}
                      />
                    </td>
                    <td className="fw-semibold">{medicament.Designation}</td>
                    <td className="text-muted small">{medicament.Reference || '-'}</td>
                    <td className="text-end small">
                      {medicament.PrixVente ? `${medicament.PrixVente.toLocaleString()} FCFA` : '-'}
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
            Page {currentPage} / {totalPages} &nbsp;·&nbsp; {filteredMedicaments.length} médicament(s)
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
        <div>
          {selectedMedicaments.size > 0 && (
            <span className="text-muted small">
              <i className="bi bi-check2-square me-1 text-primary"></i>
              {selectedMedicaments.size} médicament(s) sélectionné(s)
            </span>
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
            disabled={selectedMedicaments.size === 0}
          >
            <i className="bi bi-check-circle me-1"></i>
            Valider ({selectedMedicaments.size})
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
