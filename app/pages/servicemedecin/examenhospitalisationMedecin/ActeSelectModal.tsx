"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Modal, Form, Button, Card, Col, Row, Badge, Spinner, Alert } from "react-bootstrap";
import { IActeClinique } from "./ActesTableMedecin";

interface ActeSelectModalProps {
  show: boolean;
  onHide: () => void;
  actes: IActeClinique[];
  onActesSelect: (actes: IActeClinique[]) => void;
  selectedActeIds?: string[];
}

export default function ActeSelectModal({
  show,
  onHide,
  actes,
  onActesSelect,
  selectedActeIds = []
}: ActeSelectModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [filteredActes, setFilteredActes] = useState<IActeClinique[]>([]);
  const [selectedActes, setSelectedActes] = useState<string[]>(selectedActeIds);

  // Réinitialiser la sélection quand le modal s'ouvre
  useEffect(() => {
    if (show) {
      setSelectedActes(selectedActeIds);
    }
  }, [show, selectedActeIds]);

  // Filtrer les actes selon la recherche
  useEffect(() => {
    if (show && actes.length > 0) {
      setLoading(true);
      
      setTimeout(() => {
        const filtered = searchTerm
          ? actes.filter(a =>
              a.Designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              a.LettreCle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              a.IDTYPE_ACTE?.toLowerCase().includes(searchTerm.toLowerCase())
            )
          : actes;
        
        setFilteredActes(filtered);
        setLoading(false);
      }, 300);
    }
  }, [searchTerm, actes, show]);

  const handleActeToggle = (acteId: string) => {
    setSelectedActes(prev => {
      if (prev.includes(acteId)) {
        return prev.filter(id => id !== acteId);
      } else {
        return [...prev, acteId];
      }
    });
  };

  const handleValidateSelection = () => {
    const selectedActs = filteredActes.filter(a => selectedActes.includes(a._id));
    onActesSelect(selectedActs);
    onHide();
    setSearchTerm("");
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-clipboard-check me-2"></i>
          Sélectionner des actes
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '60vh', overflowY: 'auto' }}>
        {/* Champ de recherche */}
        <div className="sticky-top bg-white pb-3 mb-3" style={{ zIndex: 10 }}>
          <Form.Group>
            <Form.Label>Rechercher un acte</Form.Label>
            <Form.Control
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Rechercher par nom, lettre clé ou type d'acte..."
              className="shadow-sm"
              autoFocus
            />
          </Form.Group>
        </div>
        
        <div className="mb-3">
          <h6 className="mb-3">
            <i className="bi bi-list-ul me-2"></i>
            Liste des actes disponibles:
            {filteredActes.length > 0 && (
              <Badge bg="primary" className="ms-2">
                {filteredActes.length} acte(s)
              </Badge>
            )}
          </h6>

          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" className="me-2" />
              Chargement des actes...
            </div>
          ) : filteredActes.length > 0 ? (
            <Row className="g-2">
              {filteredActes.map((acte, index) => (
                <Col key={acte._id} xs={12} sm={6} md={6} lg={4}>
                  <Card 
                    className={`acte-card ${selectedActes.includes(acte._id) ? 'border-primary bg-primary bg-opacity-10' : ''}`}
                    onClick={() => handleActeToggle(acte._id)}
                    style={{ cursor: 'pointer', minHeight: '120px' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <Card.Body className="p-3">
                      <div className="d-flex align-items-start mb-2">
                        <div className="rounded-circle bg-info bg-opacity-10 p-2 me-2">
                          <i className="bi bi-clipboard-check text-info"></i>
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="mb-1" style={{ fontSize: '14px', lineHeight: '1.3' }}>
                            {acte.Designation}
                          </h6>
                          {acte.LettreCle && (
                            <small className="text-muted">
                              Code: {acte.LettreCle}
                            </small>
                          )}
                        </div>
                        <Form.Check
                          type="checkbox"
                          checked={selectedActes.includes(acte._id)}
                          onChange={() => {}} // Géré par le onClick de la carte
                          className="mt-1"
                        />
                      </div>
                      
                      <div className="d-flex flex-wrap gap-1 mt-2">
                        {acte.Prix && (
                          <Badge bg="secondary" className="small">
                            <i className="bi bi-currency-euro me-1"></i>
                            {acte.Prix.toLocaleString()} FCFA
                          </Badge>
                        )}
                        {acte.CoefficientActe && (
                          <Badge bg="info" className="small">
                            <i className="bi bi-calculator me-1"></i>
                            Coef: {acte.CoefficientActe}
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
              Aucun acte trouvé pour "{searchTerm}"
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
        
        {selectedActes.length > 0 && (
          <div className="alert alert-info" style={{ marginBottom: '70px' }}>
            <strong>Actes sélectionnés ({selectedActes.length}):</strong>
            <div className="mt-2">
              {filteredActes
                .filter(a => selectedActes.includes(a._id))
                .map((acte, index) => (
                  <Badge key={index} bg="primary" className="me-1 mb-1">
                    {acte.Designation}
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
          disabled={selectedActes.length === 0}
        >
          <i className="bi bi-check-circle me-1"></i>
          Valider la sélection ({selectedActes.length})
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
