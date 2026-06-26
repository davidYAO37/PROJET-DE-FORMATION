"use client";

import React, { useState, useEffect } from "react";
import { Modal, Form, Button, Col, Row, Badge, Alert } from "react-bootstrap";
import { IActeClinique } from "./ActesTableMedecin";

interface ActeSelectModalProps {
  show: boolean;
  onHide: () => void;
  actes: IActeClinique[];
  onActesSelect: (actes: IActeClinique[]) => void;
  selectedActeIds?: string[];
}

const PAGE_SIZE = 20;

export default function ActeSelectModal({
  show,
  onHide,
  actes,
  onActesSelect,
  selectedActeIds = []
}: ActeSelectModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredActes, setFilteredActes] = useState<IActeClinique[]>([]);
  const [selectedActes, setSelectedActes] = useState<Set<string>>(new Set(selectedActeIds));
  const [currentPage, setCurrentPage] = useState(1);

  // Réinitialiser la sélection quand le modal s'ouvre
  useEffect(() => {
    if (show) {
      setSelectedActes(new Set(selectedActeIds));
      setSearchTerm("");
      setCurrentPage(1);
    }
  }, [show]);

  // Réinitialiser à la fermeture
  useEffect(() => {
    if (!show) {
      setSearchTerm("");
      setCurrentPage(1);
      setSelectedActes(new Set());
    }
  }, [show]);

  // Filtrer les actes selon la recherche
  useEffect(() => {
    const filtered = searchTerm
      ? actes.filter(a =>
          a.Designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.LettreCle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.IDTYPE_ACTE?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : actes;
    setFilteredActes(filtered);
    setCurrentPage(1);
  }, [searchTerm, actes]);

  const handleActeToggle = (acteId: string) => {
    setSelectedActes(prev => {
      const next = new Set(prev);
      if (next.has(acteId)) {
        next.delete(acteId);
      } else {
        next.add(acteId);
      }
      return next;
    });
  };

  const allFilteredSelected =
    filteredActes.length > 0 &&
    filteredActes.every(a => selectedActes.has(a._id));

  const toggleAllFiltered = () => {
    const filteredIds = filteredActes.map(a => a._id);
    if (allFilteredSelected) {
      setSelectedActes(prev => {
        const next = new Set(prev);
        filteredIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelectedActes(prev => {
        const next = new Set(prev);
        filteredIds.forEach(id => next.add(id));
        return next;
      });
    }
  };

  const handleValidateSelection = () => {
    const selectedActs = actes.filter(a => selectedActes.has(a._id));
    onActesSelect(selectedActs);
    onHide();
  };

  const totalPages = Math.ceil(filteredActes.length / PAGE_SIZE);
  const pageActes = filteredActes.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <Modal show={show} onHide={onHide} size="xl" scrollable>
      <Modal.Header closeButton className="bg-primary text-white py-2">
        <Modal.Title className="fs-6 fw-bold">
          <i className="bi bi-clipboard-check me-2"></i>
          Sélectionner des actes
          {selectedActes.size > 0 && (
            <Badge bg="warning" text="dark" className="ms-2">
              {selectedActes.size} sélectionné(s)
            </Badge>
          )}
        </Modal.Title>
      </Modal.Header>

      {/* Barre de recherche et outils — fixe au-dessus du body scrollable */}
      <div className="px-3 pt-3 pb-2 border-bottom bg-light">
        <Row className="g-2 align-items-center">
          <Col md={7}>
            <Form.Control
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Rechercher par nom, lettre clé ou type d'acte..."
              autoFocus
              size="sm"
            />
          </Col>
          <Col md={5} className="d-flex justify-content-end align-items-center gap-2">
            <span className="text-muted small">{filteredActes.length} acte(s)</span>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={toggleAllFiltered}
              disabled={filteredActes.length === 0}
            >
              {allFilteredSelected ? "Tout désélectionner" : "Tout sélectionner"}
            </Button>
          </Col>
        </Row>
      </div>

      <Modal.Body className="p-0">
        {filteredActes.length === 0 ? (
          <Alert variant="info" className="m-3">
            <i className="bi bi-search me-2"></i>
            {searchTerm ? `Aucun acte trouvé pour "${searchTerm}"` : "Aucun acte disponible"}
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
                <th>Lettre clé</th>
                <th className="text-end">Prix</th>
                <th className="text-center">Coef.</th>
              </tr>
            </thead>
            <tbody>
              {pageActes.map(acte => {
                const isSelected = selectedActes.has(acte._id);
                return (
                  <tr
                    key={acte._id}
                    onClick={() => handleActeToggle(acte._id)}
                    style={{ cursor: 'pointer' }}
                    className={isSelected ? 'table-primary' : ''}
                  >
                    <td className="text-center" onClick={e => e.stopPropagation()}>
                      <Form.Check
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleActeToggle(acte._id)}
                      />
                    </td>
                    <td className="fw-semibold">{acte.Designation}</td>
                    <td className="text-muted small">{acte.LettreCle || '-'}</td>
                    <td className="text-end small">
                      {acte.Prix ? `${acte.Prix.toLocaleString()} FCFA` : '-'}
                    </td>
                    <td className="text-center">
                      {acte.CoefficientActe ? (
                        <Badge bg="info" className="small">{acte.CoefficientActe}</Badge>
                      ) : '-'}
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
              Page {currentPage} / {totalPages} &nbsp;·&nbsp; {filteredActes.length} acte(s)
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
          {selectedActes.size > 0 && (
            <span className="text-muted small">
              <i className="bi bi-check2-square me-1 text-primary"></i>
              {selectedActes.size} acte(s) sélectionné(s)
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
            disabled={selectedActes.size === 0}
          >
            <i className="bi bi-check-circle me-1"></i>
            Valider ({selectedActes.size})
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
