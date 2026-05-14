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
  const [selectedMedicaments, setSelectedMedicaments] = useState<string[]>(selectedMedicamentIds);
  const [allMedicaments, setAllMedicaments] = useState<IMedicament[]>([]);
  const [filterInStock, setFilterInStock] = useState(false);
  const [medicamentsWithStock, setMedicamentsWithStock] = useState<(IMedicament & { stockInfo?: any })[]>([]);

  // Charger tous les médicaments de la pharmacie quand le modal s'ouvre
  useEffect(() => {
    if (show) {
      loadAllMedicaments();
      setSelectedMedicaments(selectedMedicamentIds);
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
    if (show && medicamentsWithStock.length > 0) {
      setLoading(true);
      
      // Simuler un chargement si nécessaire
      setTimeout(() => {
        let filtered = medicamentsWithStock;
        
        // Filtrer par terme de recherche
        if (searchTerm) {
          filtered = filtered.filter(m =>
            m.Designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.Reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.CodeBarre?.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        
        // Filtrer par stock (utiliser les données de l'API stock)
        if (filterInStock) {
          filtered = filtered.filter(m => 
            (m.StockDisponible || 0) > 0
          );
        }
        
        setFilteredMedicaments(filtered);
        setLoading(false);
      }, 300);
    }
  }, [searchTerm, medicamentsWithStock, show, filterInStock]);

  // Réinitialiser les états à la fermeture du modal
  useEffect(() => {
    if (!show) {
      setSearchTerm("");
      setFilterInStock(false);
      setSelectedMedicaments([]);
    }
  }, [show]);

  const handleMedicamentToggle = (medicamentId: string) => {
    setSelectedMedicaments(prev => {
      const wasSelected = prev.includes(medicamentId);
      const newSelection = wasSelected 
        ? prev.filter(id => id !== medicamentId)
        : [...prev, medicamentId];
      
      return newSelection;
    });
  };

  const handleValidateSelection = () => {
    const selectedMeds = medicamentsWithStock.filter(m => selectedMedicaments.includes(m._id));
    
    onMedicamentsSelect(selectedMeds);
    onHide();
    setSearchTerm("");
    setFilterInStock(false); // Réinitialiser le filtre de stock
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-capsule me-2"></i>
          Sélectionner un médicament
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Champ de recherche et filtres */}
        <div className="sticky-top bg-white pb-3 mb-3" style={{ zIndex: 10 }}>
          <Form.Group className="mb-3">
            <Form.Label>Rechercher un médicament</Form.Label>
            <Form.Control
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Rechercher par nom, référence ou code barre..."
              className="shadow-sm"
              autoFocus
            />
          </Form.Group>
          
          {/* Filtre de stock */}
          <Form.Check
            type="checkbox"
            id="filter-in-stock"
            label={
              <span>
                <i className="bi bi-box-seam me-2 text-success"></i>
                Afficher uniquement les médicaments en stock
              </span>
            }
            checked={filterInStock}
            onChange={(e) => setFilterInStock(e.target.checked)}
            className="form-check-inline"
          />
        </div>
        
        <div className="mb-3">
          <h6 className="mb-3">
            <i className="bi bi-list-ul me-2"></i>
            Liste des médicaments disponibles:
            {filteredMedicaments.length > 0 && (
              <Badge bg="primary" className="ms-2">
                {filteredMedicaments.length} médicament(s)
              </Badge>
            )}
            {!filterInStock && (
              <Badge bg="success" className="ms-2">
                <i className="bi bi-box me-1"></i>
                {medicamentsWithStock.filter(m => (m.StockDisponible || 0) > 0).length} en stock
              </Badge>
            )}
          </h6>

          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" className="me-2" />
              Chargement des médicaments...
            </div>
          ) : filteredMedicaments.length > 0 ? (
            <Row className="g-2">
              {filteredMedicaments.map((medicament, index) => (
                <Col key={medicament._id} md={6} lg={4}>
                  <Card 
                    className={`medicament-card ${selectedMedicaments.includes(medicament._id) ? 'border-primary bg-primary bg-opacity-10' : ''}`}
                    onClick={() => handleMedicamentToggle(medicament._id)}
                    style={{ cursor: 'pointer', minHeight: '140px' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <Card.Body className="p-3">
                      <div className="d-flex align-items-start mb-2">
                        <div className="rounded-circle bg-success bg-opacity-10 p-2 me-2">
                          <i className="bi bi-capsule text-success"></i>
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="mb-1" style={{ fontSize: '14px', lineHeight: '1.3' }}>
                            {medicament.Designation}
                          </h6>
                          {medicament.Reference && (
                            <small className="text-muted">
                              Réf: {medicament.Reference}
                            </small>
                          )}
                        </div>
                        <Form.Check
                          type="checkbox"
                          checked={selectedMedicaments.includes(medicament._id)}
                          onChange={() => {}} // Géré par le onClick de la carte
                          className="mt-1"
                        />
                      </div>
                      
                      <div className="d-flex justify-content-between align-items-center">
                        {medicament.PrixVente && (
                          <Badge bg="light" text="dark" className="small">
                            <i className="bi bi-currency-euro me-1"></i>
                            {medicament.PrixVente.toLocaleString()} FCFA
                          </Badge>
                        )}
                        {medicament.StockDisponible !== undefined && (
                          <Badge 
                            bg={medicament.StockDisponible > 0 ? "success" : "danger"} 
                            className="small"
                          >
                            <i className="bi bi-box me-1"></i>
                            Stock: {medicament.StockDisponible}
                          </Badge>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <Alert variant="info">
              <i className="bi bi-search me-2"></i>
              Aucun médicament trouvé pour "{searchTerm}"
              {searchTerm && (
                <div className="mt-2">
                  <small>
                    Essayez avec une autre recherche ou vérifiez l'orthographe.
                  </small>
                </div>
              )}
            </Alert>
          )}
        </div>
        {selectedMedicaments.length > 0 && (
          <div className="alert alert-info sticky-bottom">
            <strong>Médicaments sélectionnés ({selectedMedicaments.length}):</strong>
            <div className="mt-2">
              {medicamentsWithStock
                .filter(m => selectedMedicaments.includes(m._id))
                .map((medicament, index) => (
                  <Badge key={index} bg="primary" className="me-1 mb-1">
                    {medicament.Designation}
                  </Badge>
                ))}
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          <i className="bi bi-x-circle me-1"></i>
          Annuler
        </Button>
        <Button 
          variant="primary" 
          onClick={handleValidateSelection}
          disabled={selectedMedicaments.length === 0}
        >
          <i className="bi bi-check-circle me-1"></i>
          Valider la sélection ({selectedMedicaments.length})
        </Button>
      </Modal.Footer>
      
      <style jsx>{`
        .medicament-card {
          transition: all 0.2s ease-in-out;
          border: 1px solid #dee2e6;
        }
        .medicament-card:hover {
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          border-color: #007bff;
        }
        .cursor-pointer {
          cursor: pointer !important;
        }
      `}</style>
    </Modal>
  );
}
