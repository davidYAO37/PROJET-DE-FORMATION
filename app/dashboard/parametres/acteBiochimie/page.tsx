"use client";
import React, { useState, useEffect } from "react";
import { Card, Table, Button, Badge, Form, Row, Col, Alert } from "react-bootstrap";
import { FaPlus, FaEdit, FaTrash, FaCheck, FaArrowUp, FaArrowDown } from "react-icons/fa";
import { ParamBiochimie } from "@/types/ParamBiochimie";
import AjouterParamBiochimieModal from "./AjouterParamBiochimieModal";
import ModifierParamActeBiochimie from "./ModifierParamActeBiochimie";


interface ActeClinique {
  _id: string;
  Designation: string;
  ResultatMultiple: boolean;
  LettreCle: string;
  Interpretation?: string;
}

interface ActeParamBiochimie {
  _id: string;
  IDACTEP?: string;
  IDPARAM_BIOCHIME?: string;
  param_designb?: string;
  ORdonnacementAffichage?: number;
  IDACTE_PARAMBIOCHIMIE?: string;
}

export default function ActeBiochimie() {
  const [actesCliniques, setActesCliniques] = useState<ActeClinique[]>([]);
  const [acteSelectionne, setActeSelectionne] = useState<ActeClinique | null>(null);
  const [actesParamBiochimie, setActesParamBiochimie] = useState<ActeParamBiochimie[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showAjoutModal, setShowAjoutModal] = useState(false);
  const [showModifierParamActeModal, setShowModifierParamActeModal] = useState(false);
  const [paramToModify, setParamToModify] = useState<ActeParamBiochimie | null>(null);
  const [actesMultiParametres, setActesMultiParametres] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [interpretation, setInterpretation] = useState("");
  const [acteCibleSelectionne, setActeCibleSelectionne] = useState<string>("");

  // Charger les actes cliniques avec lettreCle="B"
  useEffect(() => {
    chargerActesCliniques();
  }, []);

  const chargerActesCliniques = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/acteclinique?lettreCle=B");
      const data = await response.json();
      setActesCliniques(data);
    } catch (error) {
      console.error("Erreur lors du chargement des actes cliniques:", error);
      setMessage("Erreur lors du chargement des actes cliniques");
    } finally {
      setLoading(false);
    }
  };

  // Procédure Actualiser_ParametreActe()
  const actualiserParametreActe = async (acte: ActeClinique) => {
    try {
      setLoading(true);
      setActeSelectionne(acte);
      
      // Initialiser le tableau des paramètres à vide à chaque recherche
      setActesParamBiochimie([]);
      setInterpretation("");
      
      // Charger les paramètres associés à l'acte sélectionné
      const response = await fetch(`/api/acteparambiochimie?idactep=${acte._id}`);
      const data = await response.json();
      
      // SI TABLE_ACTE_PARAM_LABO.Occurrence()>1 ALORS
      if (data.length > 1) {
        // Ajouter les lignes dans le tableau
        const parametresOrganises = data.sort((a: ActeParamBiochimie, b: ActeParamBiochimie) => 
          (a.ORdonnacementAffichage || 0) - (b.ORdonnacementAffichage || 0)
        );
        
        setActesParamBiochimie(parametresOrganises);
        
        // Marquer comme acte multi-paramètres
        setActesMultiParametres(prev => new Set(prev).add(acte._id));
        
        // Charger l'interprétation si elle existe
        if (acte.Interpretation) {
          setInterpretation(acte.Interpretation);
        }
      } else if (data.length === 1) {
        // SI TABLE_ACTE_PARAM_LABO.Occurrence()=1 ALORS
        setActesParamBiochimie(data);
        setInterpretation(acte.Interpretation || "");
      } else {
        // SI TABLE_ACTE_PARAM_LABO.Occurrence()=0 ALORS
        setInterpretation(acte.Interpretation || "");
      }
      
      setMessage("");
    } catch (error) {
      console.error("Erreur lors de l'actualisation des paramètres:", error);
      setMessage("Erreur lors de l'actualisation des paramètres");
    } finally {
      setLoading(false);
    }
  };

  const validerParametres = async () => {
    if (!acteSelectionne || actesParamBiochimie.length === 0) {
      setMessage("Aucun paramètre à valider");
      return;
    }

    try {
      setLoading(true);
      
      // Supprimer les anciens paramètres
      await fetch(`/api/acteparambiochimie?idactep=${acteSelectionne._id}`, {
        method: "DELETE"
      });

      // Ajouter les nouveaux paramètres avec ORdonnacementAffichage
      for (let i = 0; i < actesParamBiochimie.length; i++) {
        const param = actesParamBiochimie[i];
        const paramData = {
          IDACTEP: acteSelectionne._id,
          IDPARAM_BIOCHIME: param.IDPARAM_BIOCHIME,
          param_designb: param.param_designb,
          ORdonnacementAffichage: i + 1
        };
        
        await fetch("/api/acteparambiochimie", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(paramData)
        });
      }

      // Mettre à jour l'interprétation
      await fetch(`/api/acteclinique/${acteSelectionne._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Interpretation: interpretation })
      });

      setMessage("Paramètres enregistrés avec succès");
      setTimeout(() => setMessage(""), 3000);
      
      // Recharger les paramètres
      await actualiserParametreActe(acteSelectionne);
    } catch (error) {
      console.error("Erreur lors de la validation des paramètres:", error);
      setMessage("Erreur lors de la validation des paramètres");
    } finally {
      setLoading(false);
    }
  };

  const supprimerParametre = async (id: string) => {
    // Une ligne est-elle sélectionnée ?
    if (!id) {
      return;
    }

    // SI OuiNon(0,"Êtes-vous sûr de vouloir supprimer l'enregistrement ?")=Vrai ALORS
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer l'enregistrement ?")) {
      return;
    }

    try {
      setLoading(true);

      // HLitRecherchePremier(ACTE_PARAM_LABO,IDACTE_PARAMLABO,TABLE_ACTE_PARAM_LABO.COL_IDACTE_PARAMLABO)
      // HSupprime(ACTE_PARAM_LABO)
      await fetch(`/api/acteparambiochimie?id=${id}`, {
        method: "DELETE"
      });

      // Actualiser_ParametreActe()
      if (acteSelectionne) {
        await actualiserParametreActe(acteSelectionne);
      }

      setMessage("Paramètre supprimé avec succès");
      
      // Masquer le message après 3 secondes
      setTimeout(() => {
        setMessage("");
      }, 3000);

    } catch (error) {
      console.error("Erreur lors de la suppression du paramètre:", error);
      setMessage("Erreur lors de la suppression du paramètre");
    } finally {
      setLoading(false);
    }
  };

  const modifierParametre = (param: ActeParamBiochimie) => {
    setParamToModify(param);
    setShowModifierParamActeModal(true);
  };

  const handleSaveParams = async (newParams: ActeParamBiochimie[]) => {
    try {
      setLoading(true);
      
      // Ajouter les nouveaux paramètres avec ORdonnacementAffichage
      for (let i = 0; i < newParams.length; i++) {
        const param = newParams[i];
        const paramData = {
          IDACTEP: acteSelectionne?._id,
          IDPARAM_BIOCHIME: param.IDPARAM_BIOCHIME,
          param_designb: param.param_designb,
          ORdonnacementAffichage: (actesParamBiochimie.length + i + 1)
        };
        
        await fetch("/api/acteparambiochimie", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(paramData)
        });
      }

      // Recharger les paramètres
      if (acteSelectionne) {
        await actualiserParametreActe(acteSelectionne);
      }
      
      setMessage("Paramètres ajoutés avec succès");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Erreur lors de l'ajout des paramètres:", error);
      setMessage("Erreur lors de l'ajout des paramètres");
    } finally {
      setLoading(false);
    }
  };

  const deplacerLigneVersHaut = (index: number) => {
    if (index === 0) return;
    
    const newActesParamBiochimie = [...actesParamBiochimie];
    [newActesParamBiochimie[index - 1], newActesParamBiochimie[index]] = 
      [newActesParamBiochimie[index], newActesParamBiochimie[index - 1]];
    
    // Mettre à jour ORdonnacementAffichage
    newActesParamBiochimie.forEach((param, i) => {
      param.ORdonnacementAffichage = i + 1;
    });
    
    setActesParamBiochimie(newActesParamBiochimie);
  };

  const deplacerLigneVersBas = (index: number) => {
    if (index === actesParamBiochimie.length - 1) return;
    
    const newActesParamBiochimie = [...actesParamBiochimie];
    [newActesParamBiochimie[index], newActesParamBiochimie[index + 1]] = 
      [newActesParamBiochimie[index + 1], newActesParamBiochimie[index]];
    
    // Mettre à jour ORdonnacementAffichage
    newActesParamBiochimie.forEach((param, i) => {
      param.ORdonnacementAffichage = i + 1;
    });
    
    setActesParamBiochimie(newActesParamBiochimie);
  };

  const associerParametres = async () => {
    // SI TABLE_ACTE_PARAM_LABO.Occurrence()<1 OU COMBO_Sélectionner="" ALORS RETOUR
    if (actesParamBiochimie.length < 1 || !acteCibleSelectionne) {
      return;
    }

    const acteCible = actesCliniques.find(a => a._id === acteCibleSelectionne);
    if (!acteCible) return;

    // SI OuiNon(0,"Voulez-vous utiliser les paramètres de"+" "+TABLE_ACTE_EXAMEN.COL_Designation+" "+ "pour"+RC+COMBO_Sélectionner..ValeurAffichée)=Vrai ALORS
    const confirmation = `Voulez-vous utiliser les paramètres de ${acteSelectionne?.Designation} pour ${acteCible.Designation}`;
    if (!window.confirm(confirmation)) {
      return;
    }

    try {
      setLoading(true);

      // On restaure tous les autres paramètres
      // POUR TOUT ACTE_PARAM_LABO AVEC IDACTEP=COMBO_Sélectionner..ValeurMémorisée
      await fetch(`/api/acteparambiochimie?idactep=${acteCibleSelectionne}`, {
        method: "DELETE"
      });

      // on ajoute les nouveaux paramètres
      // POUR TOUTE LIGNE DE TABLE_ACTE_PARAM_LABO
      for (let i = 0; i < actesParamBiochimie.length; i++) {
        const param = actesParamBiochimie[i];
        const nouveauParam = {
          IDACTEP: acteCibleSelectionne,
          IDPARAM_BIOCHIME: param.IDPARAM_BIOCHIME,
          param_designb: param.param_designb,
          ORdonnacementAffichage: i + 1
        };
        
        await fetch("/api/acteparambiochimie", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nouveauParam)
        });
      }

      setMessage("Paramètres associés avec succès");
      setActeCibleSelectionne("");
      
      // Masquer le message après 3 secondes
      setTimeout(() => {
        setMessage("");
      }, 3000);

    } catch (error) {
      console.error("Erreur lors de l'association des paramètres:", error);
      setMessage("Erreur lors de l'association des paramètres");
    } finally {
      setLoading(false);
    }
  };

  const actesFiltres = actesCliniques.filter(acte =>
    acte.Designation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container p-2">
      <h2 className="mb-4">Acte Biochimie</h2>
      
      {message && (
        <Alert variant={message.includes("succès") ? "success" : "danger"}>
          {message}
        </Alert>
      )}

      <Row>
        <Col md={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Liste des Actes</h5>
            </Card.Header>
            <Card.Body style={{ maxHeight: "600px", overflowY: "auto" }}>
              <Form.Group className="mb-3">
                <Form.Control
                  type="text"
                  placeholder="Rechercher un acte..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Form.Group>
              
              {loading && actesCliniques.length === 0 ? (
                <div className="text-center">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Chargement...</span>
                  </div>
                </div>
              ) : (
                <div className="list-group">
                  {actesFiltres.map((acte) => (
                    <button
                      key={acte._id}
                      className={`list-group-item list-group-item-action ${
                        acteSelectionne?._id === acte._id ? "active" : ""
                      }`}
                      onClick={() => actualiserParametreActe(acte)}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <span>{acte.Designation}</span>
                      {actesMultiParametres.has(acte._id) && (
                        <Badge bg="info">Multi</Badge>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          {acteSelectionne ? (
            <Card>
              <Card.Header>
                <h5 className="mb-0">
                  Paramètres pour {acteSelectionne.Designation}
                </h5>
              </Card.Header>
              <Card.Body>
                {actesParamBiochimie.length > 0 ? (
                  <>
                    <Table striped hover responsive>
                      <thead>
                        <tr>
                          <th>Ordre</th>
                          <th>Paramètre Biochimie</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {actesParamBiochimie.map((param, index) => (
                          <tr key={param._id}>
                            <td>{param.ORdonnacementAffichage || index + 1}</td>
                            <td>{param.param_designb}</td>
                            <td>
                              <div className="d-flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline-secondary"
                                  onClick={() => deplacerLigneVersHaut(index)}
                                  disabled={index === 0}
                                >
                                  <FaArrowUp />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline-secondary"
                                  onClick={() => deplacerLigneVersBas(index)}
                                  disabled={index === actesParamBiochimie.length - 1}
                                >
                                  <FaArrowDown />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline-primary"
                                  onClick={() => modifierParametre(param)}
                                >
                                  <FaEdit />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline-danger"
                                  onClick={() => supprimerParametre(param._id)}
                                >
                                  <FaTrash />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>

                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <div>
                        <Button
                          variant="success"
                          onClick={() => setShowAjoutModal(true)}
                          disabled={loading}
                        >
                          <FaPlus className="me-2" />
                          Ajouter Paramètre
                        </Button>
                      </div>
                      
                      <div className="d-flex gap-2 align-items-center">
                        <Form.Select
                          value={acteCibleSelectionne}
                          onChange={(e) => setActeCibleSelectionne(e.target.value)}
                          style={{ width: "200px" }}
                        >
                          <option value="">Sélectionner un acte</option>
                          {actesCliniques
                            .filter(a => a._id !== acteSelectionne?._id)
                            .map(acte => (
                              <option key={acte._id} value={acte._id}>
                                {acte.Designation}
                              </option>
                            ))}
                        </Form.Select>
                        <Button
                          variant="primary"
                          onClick={associerParametres}
                          disabled={loading || !acteCibleSelectionne}
                        >
                          <FaPlus className="me-2" />
                          Associer Paramètre
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3">
                      <Form.Group>
                        <Form.Label>Interprétation</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={interpretation}
                          onChange={(e) => setInterpretation(e.target.value)}
                          placeholder="Ajouter une interprétation..."
                        />
                      </Form.Group>
                    </div>

                    <div className="d-flex justify-content-end gap-2 mt-3">
                      <Button
                        variant="primary"
                        onClick={validerParametres}
                        disabled={loading}
                      >
                        <FaCheck className="me-2" />
                        Valider les Paramètres
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted">
                      Aucun paramètre associé à cet acte.
                    </p>
                    <Button
                      variant="success"
                      onClick={() => setShowAjoutModal(true)}
                      disabled={loading}
                    >
                      <FaPlus className="me-2" />
                      Ajouter un Paramètre
                    </Button>
                    
                    <div className="mt-3">
                      <Form.Group>
                        <Form.Label>Interprétation</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={interpretation}
                          onChange={(e) => setInterpretation(e.target.value)}
                          placeholder="Ajouter une interprétation..."
                        />
                      </Form.Group>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          ) : (
            <Card>
              <Card.Body className="text-center py-5">
                <p className="text-muted">
                  Sélectionnez un acte pour voir ses paramètres.
                </p>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {/* Modales */}
      <AjouterParamBiochimieModal
        show={showAjoutModal}
        onHide={() => setShowAjoutModal(false)}
        onAdd={handleSaveParams}
      />
      
      <ModifierParamActeBiochimie
        show={showModifierParamActeModal}
        onHide={() => setShowModifierParamActeModal(false)}
        param={paramToModify}
        onSave={async (updatedParam) => {
          if (paramToModify && acteSelectionne) {
            try {
              await fetch(`/api/acteparambiochimie?id=${paramToModify._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedParam)
              });
              
              await actualiserParametreActe(acteSelectionne);
              setMessage("Paramètre modifié avec succès");
              setTimeout(() => setMessage(""), 3000);
            } catch (error) {
              setMessage("Erreur lors de la modification du paramètre");
            }
          }
        }}
      />
    </div>
  );
}
