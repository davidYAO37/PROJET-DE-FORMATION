"use client";
import React, { useState, useEffect } from "react";
import { Modal, Button, Table, Form, Badge, Alert } from "react-bootstrap";
import { FaCheck, FaTimes, FaPlus, FaEdit } from "react-icons/fa";
import { ParamLabo } from "@/types/ParamLabo";
import AjouterParam from "../parametreLabo/AjouterParam";
import ModifierParam from "../parametreLabo/ModifierParam";
import RTFEditor from "@/components/RTFEditor";

interface AjouterParamModalProps {
  show: boolean;
  onHide: () => void;
  acteSelectionne: any;
  onSave: (params: any[]) => void;
}

export default function AjouterParamModal({ show, onHide, acteSelectionne, onSave }: AjouterParamModalProps) {
  const [paramLabos, setParamLabos] = useState<ParamLabo[]>([]);
  const [selectedParams, setSelectedParams] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAjoutParamModal, setShowAjoutParamModal] = useState(false);
  const [showModifierParamModal, setShowModifierParamModal] = useState(false);
  const [paramToModify, setParamToModify] = useState<ParamLabo | null>(null);

  // Charger tous les paramètres de laboratoire
  useEffect(() => {
    if (show) {
      chargerParamLabos();
      setSelectedParams(new Set());
      setMessage("");
    }
  }, [show]);

  const chargerParamLabos = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/paramlabo");
      const data = await response.json();
      setParamLabos(data);
    } catch (error) {
      console.error("Erreur lors du chargement des paramètres:", error);
      setMessage("Erreur lors du chargement des paramètres");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string | undefined) => {
    if (!id) return;
    const newSelected = new Set(selectedParams);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedParams(newSelected);
  };

  const toggleAllSelection = () => {
    if (selectedParams.size === paramLabos.length) {
      setSelectedParams(new Set());
    } else {
      setSelectedParams(new Set(paramLabos.map(p => p._id).filter((id): id is string => id !== undefined)));
    }
  };

  // Filtrer les paramètres selon le terme de recherche
  const paramLabosFiltres = paramLabos.filter(param =>
    (param.Param_designation?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (param.NUM_PARAM?.toString().toLowerCase().includes(searchTerm.toLowerCase()) || '')
  );

  const handleNouveauParametre = () => {
    setShowAjoutParamModal(true);
  };

  const handleModifierParametre = (param: ParamLabo) => {
    setParamToModify(param);
    setShowModifierParamModal(true);
  };

  const handleParametreAjoute = () => {
    setShowAjoutParamModal(false);
    chargerParamLabos(); // Recharger la liste des paramètres
  };

  const handleParametreModifie = () => {
    setShowModifierParamModal(false);
    setParamToModify(null);
    chargerParamLabos(); // Recharger la liste des paramètres
  };

  const validerParametres = async () => {
    if (selectedParams.size === 0) {
      setMessage("Veuillez sélectionner au moins un paramètre");
      return;
    }

    if (!acteSelectionne) {
      setMessage("Aucun acte sélectionné");
      return;
    }

    if (!window.confirm("Voulez-vous enregistrer le paramètre ?")) {
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      // Préparer les paramètres sélectionnés
      const nouveauxActesParams = paramLabosFiltres
        .filter(param => param._id && selectedParams.has(param._id))
        .map(param => ({
          ...param,
          IDACTEP: acteSelectionne._id,
          IDACTE_PARAMLABO: param.NUM_PARAM,
          ValeurMaxNormale: param.ValeurMaxNormale,
          ValeurMinNormale: param.ValeurMinNormale,
          ValeurNormale: param.ValeurNormale,
          IDPARAM_LABO: param._id,
          Param_designation: param.Param_designation,
          ParamAbrege: param.ParamAbrege,
          PlageMaxEnfant: param.PlageMaxEnfant,
          PlageMinEnfant: param.PlageMinEnfant,
          PlageMaxFemme: param.PlageMaxFemme,
          PLageMinFemme: param.PLageMinFemme,
          PlageMaxHomme: param.PlageMaxHomme,
          PlageMinHomme: param.PlageMinHomme,
          PlageRefMaxNé: param.PlageRefMaxNé,
          PlageRefMinNe: param.PlageRefMinNe,
          PlageMinMaxEnfant: param.PlageMinMaxEnfant,
          PlageMinMaxFemme: param.PlageMinMaxFemme,
          PlageMinMaxHomme: param.PlageMinMaxHomme,
          PlageMinMaxNé: param.PlageMinMaxNé,
          UnitéParam: param.UnitéParam,
          TypeTexte: param.TypeTexte
        }));

      // Envoyer chaque paramètre à l'API
      for (const acteParam of nouveauxActesParams) {
        const response = await fetch("/api/acteparamlabo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(acteParam)
        });

        if (!response.ok) {
          throw new Error(`Erreur lors de l'enregistrement du paramètre: ${acteParam.Param_designation}`);
        }
      }

      setMessage(`${nouveauxActesParams.length} paramètre(s) enregistré(s) avec succès`);
      onSave(nouveauxActesParams);
      
      setTimeout(() => {
        onHide();
      }, 1500);

    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error);
      setMessage("Erreur lors de l'enregistrement des paramètres");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Modal principal pour ajouter des paramètres à un acte */}
      <Modal show={show} onHide={onHide} size="xl">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <FaPlus className="me-2" />
            Ajouter des Paramètres à l'Acte: {acteSelectionne?.Designation || ""}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {message && (
            <Alert variant={message.includes("succès") ? "success" : "danger"} className="mb-3">
              {message}
            </Alert>
          )}

          {/* Champ de recherche */}
          <div className="mb-3">
            <Form.Control
              type="text"
              placeholder="Rechercher un paramètre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-100"
            />
          </div>

          <div className="mb-3">
            <Button 
              variant="outline-primary" 
              size="sm"
              onClick={handleNouveauParametre}
              className="me-2"
            >
              <FaPlus className="me-1" />
              Nouveau Paramètre
            </Button>
            <Badge bg="primary" className="me-2">
              {selectedParams.size} paramètre(s) sélectionné(s)
            </Badge>
            <Button 
              variant="outline-secondary" 
              size="sm"
              onClick={toggleAllSelection}
              disabled={loading}
            >
              {selectedParams.size === paramLabos.length && paramLabos.length > 0 
                ? "Désélectionner tout" 
                : "Sélectionner tout"
              }
            </Button>
          </div>

          <div className="table-responsive" style={{ maxHeight: "500px", overflowY: "auto" }}>
            <Table striped hover className="mb-0">
              <thead className="table-light sticky-top">
                <tr>
                  <th className="text-center" style={{ width: "60px" }}>
                    <Form.Check
                      checked={selectedParams.size === paramLabos.length && paramLabos.length > 0}
                      onChange={toggleAllSelection}
                    />
                  </th>
                  <th>Paramètre</th>
                  <th>Valeur Normale</th>
                  <th>Nouveau Né</th>
                  <th>Enfant</th>
                  <th>Femme</th>
                  <th>Homme</th>
                  <th>Unité</th>
                  <th>Texte</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {paramLabos.filter(param =>
                  (param.Param_designation?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
                  (param.NUM_PARAM?.toString().toLowerCase().includes(searchTerm.toLowerCase()) || '')
                ).length > 0 ? (
                  paramLabos.filter(param =>
                    (param.Param_designation?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
                    (param.NUM_PARAM?.toString().toLowerCase().includes(searchTerm.toLowerCase()) || '')
                  ).map((param) => (
                    <tr 
                      key={param._id}
                      className={selectedParams.has(param._id || "") ? "table-primary" : ""}
                      style={{ cursor: "pointer" }}
                      onClick={() => param._id && toggleSelection(param._id)}
                    >
                      <td className="text-center" onClick={(e) => e.stopPropagation()}>
                        <Form.Check
                          checked={!!param._id && selectedParams.has(param._id)}
                          onChange={() => param._id && toggleSelection(param._id)}
                        />
                      </td>
                      <td className="fw-semibold" 
    dangerouslySetInnerHTML={{ 
      __html: param.Param_designation || '' 
    }}
    onClick={(e) => e.stopPropagation()}
/>
                      <td className="text-primary fw-semibold">{param.ValeurNormale}</td>
                      <td>{param.PlageMinMaxNé}</td>
                      <td>{param.PlageMinMaxEnfant}</td>
                      <td>{param.PlageMinMaxFemme}</td>
                      <td>{param.PlageMinMaxHomme}</td>
                      <td>{param.UnitéParam}</td>
                      <td className="text-center">
                        <Badge bg={param.TypeTexte ? "warning" : "info"}>
                          {param.TypeTexte ? "Oui" : "Non"}
                        </Badge>
                      </td>
                      <td className="text-center">
                        <Button
                          size="sm"
                          variant="outline-primary"
                          title="Modifier"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleModifierParametre(param);
                          }}
                          disabled={loading}
                        >
                          <FaEdit />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="text-center py-4 text-muted">
                      {searchTerm ? "Aucun paramètre trouvé pour cette recherche" : "Aucun paramètre disponible"}
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            <FaTimes className="me-2" />
            Annuler
          </Button>
          <Button 
            variant="success" 
            onClick={validerParametres} 
            disabled={loading || selectedParams.size === 0}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Enregistrement...
              </>
            ) : (
              <>
                <FaCheck className="me-2" />
                Valider les Paramètres
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal pour ajouter un nouveau paramètre */}
      <AjouterParam
        show={showAjoutParamModal}
        onHide={() => setShowAjoutParamModal(false)}
        onAdd={handleParametreAjoute}
      />

      {/* Modal pour modifier un paramètre existant */}
      {paramToModify && (
        <ModifierParam
          show={showModifierParamModal}
          onHide={() => setShowModifierParamModal(false)}
          onSave={handleParametreModifie}
          ParamLabo={paramToModify}
        />
      )}
    </>
  );
}
