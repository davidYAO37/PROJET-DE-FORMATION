"use client";
import React, { useState, useEffect } from "react";
import { Modal, Button, Table, Form, Badge, Alert } from "react-bootstrap";
import { FaCheck, FaTimes, FaPlus, FaEdit } from "react-icons/fa";
import { ParamBiochimie } from "@/types/ParamBiochimie";
import AjouterParamBiochimie from "../ParametreBiocimie/AjouterParamBiochimie";
import ModifierParamBiochimie from "../ParametreBiocimie/ModifierParamBiochimie";

interface AjouterParamBiochimieModalProps {
  show: boolean;
  onHide: () => void;
  onSave?: (params: any[]) => void;
  onAdd?: (newParams: any[]) => Promise<void>;
}

export default function AjouterParamBiochimieModal({ show, onHide, onSave, onAdd }: AjouterParamBiochimieModalProps) {
  const [paramBiochimies, setParamBiochimies] = useState<ParamBiochimie[]>([]);
  const [selectedParams, setSelectedParams] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAjoutParamModal, setShowAjoutParamModal] = useState(false);
  const [showModifierParamModal, setShowModifierParamModal] = useState(false);
  const [paramToModify, setParamToModify] = useState<ParamBiochimie | null>(null);

  // Charger tous les paramètres biochimie
  useEffect(() => {
    if (show) {
      chargerParamBiochimies();
      setSelectedParams(new Set());
      setMessage("");
    }
  }, [show]);

  const chargerParamBiochimies = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/parambiochimie");
      const data = await response.json();
      setParamBiochimies(data);
    } catch (error) {
      console.error("Erreur lors du chargement des paramètres biochimie:", error);
      setMessage("Erreur lors du chargement des paramètres biochimie");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string | undefined) => {
    if (!id) return;
    
    const newSelection = new Set(selectedParams);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedParams(newSelection);
  };

  const handleSave = () => {
    if (selectedParams.size === 0) {
      setMessage("Veuillez sélectionner au moins un paramètre");
      return;
    }

    const paramsToAdd = Array.from(selectedParams).map(id => {
      const param = paramBiochimies.find(p => p._id === id);
      return {
        IDPARAM_BIOCHIME: param?._id,
        param_designb: param?.LibelleB || ""
      };
    });

    if (onAdd) {
      onAdd(paramsToAdd);
    } else if (onSave) {
      onSave(paramsToAdd);
    } else {
      setMessage("Erreur : aucune fonction de sauvegarde définie");
      return;
    }
    onHide();
  };

  const handleAddNewParam = (newParam: ParamBiochimie) => {
    setParamBiochimies(prev => [...prev, newParam]);
    setShowAjoutParamModal(false);
  };

  const handleModifyParam = (updatedParam: ParamBiochimie) => {
    setParamBiochimies(prev => 
      prev.map(p => p._id === updatedParam._id ? updatedParam : p)
    );
    setShowModifierParamModal(false);
    setParamToModify(null);
  };

  const filteredParams = paramBiochimies.filter(param =>
    param.LibelleB?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    param.CodeB?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Modal show={show} onHide={onHide} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Ajouter des Paramètres Biochimie</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {message && <Alert variant="danger">{message}</Alert>}
          
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Form.Control
              type="text"
              placeholder="Rechercher un paramètre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "300px" }}
            />
            <Button variant="success" onClick={() => setShowAjoutParamModal(true)}>
              <FaPlus className="me-2" />
              Nouveau Paramètre
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
            </div>
          ) : (
            <Table striped hover responsive>
              <thead>
                <tr>
                  <th style={{ width: "50px" }}>Sélection</th>
                  <th>Code B</th>
                  <th>Libellé B</th>
                  <th style={{ width: "80px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredParams.map((param) => (
                  <tr key={param._id}>
                    <td className="text-center">
                      <Form.Check
                        type="checkbox"
                        checked={selectedParams.has(param._id)}
                        onChange={() => toggleSelection(param._id)}
                      />
                    </td>
                    <td>{param.CodeB || "-"}</td>
                    <td>{param.LibelleB}</td>
                    <td>
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() => {
                          setParamToModify(param);
                          setShowModifierParamModal(true);
                        }}
                      >
                        <FaEdit />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}

          <div className="mt-3">
            <Badge bg="info">
              {selectedParams.size} paramètre(s) sélectionné(s)
            </Badge>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Annuler
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSave}
            disabled={selectedParams.size === 0}
          >
            <FaCheck className="me-2" />
            Ajouter les paramètres
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modale pour ajouter un nouveau paramètre */}
      <AjouterParamBiochimie
        show={showAjoutParamModal}
        onHide={() => setShowAjoutParamModal(false)}
        onAdd={handleAddNewParam}
      />

      {/* Modale pour modifier un paramètre */}
      <ModifierParamBiochimie
        show={showModifierParamModal}
        onHide={() => setShowModifierParamModal(false)}
        ParamBiochimie={paramToModify}
        onSave={handleModifyParam}
      />
    </>
  );
}
