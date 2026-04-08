"use client";
import React, { useState, useEffect } from "react";
import { Card, Table, Button, Badge, Form, Row, Col, Alert } from "react-bootstrap";
import { FaPlus, FaEdit, FaTrash, FaCheck, FaArrowUp, FaArrowDown } from "react-icons/fa";
import { ParamLabo } from "@/types/ParamLabo";
import AjouterParamModal from "./AjouterParamModal";
import ModifierParamActe from "./ModifierParamActe";

interface ActeClinique {
  _id: string;
  Designation: string;
  ResultatMultiple: boolean;
  LettreCle: string;
  Interpretation?: string;
}

interface ActeParamLabo {
  _id: string;
  IDACTEP?: string;
  IDPARAM_LABO?: string;
  ValeurMinNormale?: number;
  ValeurMaxNormale?: number;
  ValeurNormale?: string;
  Param_designation?: string;
  ParamAbrege?: string;
  PlageRefMaxNé?: number;
  PlageRefMinNe?: number;
  PlageMinMaxNé?: string;
  PlageMinEnfant?: number;
  PlageMaxEnfant?: number;
  PlageMinMaxEnfant?: string;
  PLageMinFemme?: number;
  PlageMaxFemme?: number;
  PlageMinMaxFemme?: string;
  PlageMinHomme?: number;
  PlageMaxHomme?: number;
  PlageMinMaxHomme?: string;
  UnitéParam?: string;
  TypeTexte?: boolean;
  NUM_PARAM?: number;
  Action?: string;
  ORdonnacementAffichage?: number;
}

export default function ActeBiologie() {
  const [actesCliniques, setActesCliniques] = useState<ActeClinique[]>([]);
  const [acteSelectionne, setActeSelectionne] = useState<ActeClinique | null>(null);
  const [actesParamLabo, setActesParamLabo] = useState<ActeParamLabo[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showAjoutModal, setShowAjoutModal] = useState(false);
  const [showModifierParamActeModal, setShowModifierParamActeModal] = useState(false);
  const [paramToModify, setParamToModify] = useState<ActeParamLabo | null>(null);
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
      setActesParamLabo([]);
      setInterpretation("");
      
      // Charger les paramètres associés à l'acte sélectionné
      const response = await fetch(`/api/acteparamlabo?idactep=${acte._id}`);
      const data = await response.json();
      
      // SI TABLE_ACTE_PARAM_LABO.Occurrence()>1 ALORS
      if (data.length > 1) {
        // Ajouter les lignes dans le tableau
        const parametresOrganises = data.sort((a: ActeParamLabo, b: ActeParamLabo) => 
          (a.ORdonnacementAffichage || 0) - (b.ORdonnacementAffichage || 0)
        );
        
        setActesParamLabo(parametresOrganises);
        
        // Activer l'interrupteur car il y a plusieurs paramètres
        const newActesMultiParametres = new Set(actesMultiParametres);
        newActesMultiParametres.add(acte._id);
        setActesMultiParametres(newActesMultiParametres);
        
        setMessage("Paramètres chargés avec succès");
        
        // Masquer le message après 3 secondes
        setTimeout(() => {
          setMessage("");
        }, 3000);
      } 
      // SINON SI TABLE_ACTE_PARAM_LABO.Occurrence()=1
      else if (data.length === 1) {
        setActesParamLabo(data);
        
        // Désactiver l'interrupteur car il n'y a qu'un seul paramètre
        const newActesMultiParametres = new Set(actesMultiParametres);
        newActesMultiParametres.delete(acte._id);
        setActesMultiParametres(newActesMultiParametres);
        
        setMessage("Il semble cet acte a un paramètre");
        
        // Masquer le message après 3 secondes
        setTimeout(() => {
          setMessage("");
        }, 3000);
      }
      // SINON
      else {
        setActesParamLabo([]);
        
        // Désactiver l'interrupteur car il n'y a pas de paramètre
        const newActesMultiParametres = new Set(actesMultiParametres);
        newActesMultiParametres.delete(acte._id);
        setActesMultiParametres(newActesMultiParametres);
        
        setMessage("Pas de paramètre saisie pour cet acte");
        
        // Masquer le message après 3 secondes
        setTimeout(() => {
          setMessage("");
        }, 3000);
      }
      
      // Récupérer l'interprétation
      if (acte._id) {
        try {
          const acteResponse = await fetch(`/api/acteclinique?id=${acte._id}`);
          const acteData = await acteResponse.json();
          setInterpretation(acteData.Interpretation || "");
        } catch (error) {
          console.error("Erreur lors de la récupération de l'interprétation:", error);
          setInterpretation("");
        }
      }
    } catch (error) {
      console.error("Erreur lors de l'actualisation des paramètres:", error);
      setMessage("Erreur lors du chargement des paramètres");
    } finally {
      setLoading(false);
    }
  };

  // Code du bouton valider
  const validerParametres = async () => {
    if (actesParamLabo.length === 0) {
      setMessage("Aucun paramètre à enregistrer");
      return;
    }

    if (!acteSelectionne) {
      setMessage("Veuillez sélectionner un acte clinique");
      return;
    }

    if (!window.confirm("Voulez-vous enregistrer les paramètres ?")) {
      return;
    }

    try {
      setLoading(true);
      
      // Supprimer tous les paramètres déjà saisis pour cet acte
      await fetch(`/api/acteparamlabo?idactep=${acteSelectionne._id}`, {
        method: "DELETE"
      });
      
      // Réinsérer tous les paramètres dans l'ordre
      for (const param of actesParamLabo) {
        await fetch("/api/acteparamlabo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...param,
            IDACTEP: acteSelectionne._id,
            ORdonnacementAffichage: param.ORdonnacementAffichage || actesParamLabo.indexOf(param) + 1
          })
        });
      }
      
      setMessage("Paramètres réorganisés avec succès");
      
      // Masquer le message après 3 secondes
      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error);
      setMessage("Erreur lors de l'enregistrement des paramètres");
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour valider l'interprétation
  const validerInterpretation = async () => {
    if (!acteSelectionne) {
      setMessage("Veuillez sélectionner un acte clinique");
      return;
    }

    try {
      setLoading(true);
      
      // Mettre à jour l'interprétation de l'acte
      await fetch(`/api/acteclinique?id=${acteSelectionne._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Interpretation: interpretation
        })
      });
      
      // Mettre à jour l'acte dans la liste
      setActesCliniques(prev => 
        prev.map(acte => 
          acte._id === acteSelectionne._id 
            ? { ...acte, Interpretation: interpretation }
            : acte
        )
      );
      
      // Mettre à jour l'acte sélectionné
      setActeSelectionne(prev => 
        prev ? { ...prev, Interpretation: interpretation } : null
      );
      
      setMessage("Interprétation enregistrée avec succès");
      
      // Masquer le message après 3 secondes
      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de l'interprétation:", error);
      setMessage("Erreur lors de l'enregistrement de l'interprétation");
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour restaurer l'interprétation
  const restaurerInterpretation = async () => {
    if (!acteSelectionne) {
      setMessage("Veuillez sélectionner un acte clinique");
      return;
    }

    if (!window.confirm("Voulez-vous effacer l'interprétation ?")) {
      return;
    }

    try {
      setLoading(true);
      
      // Effacer l'interprétation de l'acte
      await fetch(`/api/acteclinique?id=${acteSelectionne._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Interpretation: ""
        })
      });
      
      // Mettre à jour l'acte dans la liste
      setActesCliniques(prev => 
        prev.map(acte => 
          acte._id === acteSelectionne._id 
            ? { ...acte, Interpretation: "" }
            : acte
        )
      );
      
      // Mettre à jour l'acte sélectionné
      setActeSelectionne(prev => 
        prev ? { ...prev, Interpretation: "" } : null
      );
      
      // Effacer le champ d'interprétation
      setInterpretation("");
      
      setMessage("Interprétation effacée avec succès");
      
      // Masquer le message après 3 secondes
      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (error) {
      console.error("Erreur lors de l'effacement de l'interprétation:", error);
      setMessage("Erreur lors de l'effacement de l'interprétation");
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
      await fetch(`/api/acteparamlabo?id=${id}`, {
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

  const modifierParametre = (param: ActeParamLabo) => {
    setParamToModify(param);
    setShowModifierParamActeModal(true);
  };

  const handleTypeTexteToggle = async (param: ActeParamLabo) => {
    try {
      setLoading(true);
      
      // Mettre à jour le TypeTexte du paramètre
      await fetch(`/api/acteparamlabo?id=${param._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          TypeTexte: !param.TypeTexte
        })
      });
      
      // Mettre à jour le paramètre dans la liste locale
      setActesParamLabo(prev => 
        prev.map(p => 
          p._id === param._id 
            ? { ...p, TypeTexte: !p.TypeTexte }
            : p
        )
      );
      
      setMessage(`Type de texte ${!param.TypeTexte ? 'activé' : 'désactivé'} pour le paramètre`);
      
      // Masquer le message après 2 secondes
      setTimeout(() => {
        setMessage("");
      }, 2000);
    } catch (error) {
      console.error("Erreur lors de la modification du type de texte:", error);
      setMessage("Erreur lors de la modification du type de texte");
    } finally {
      setLoading(false);
    }
  };

  const handleParametreModifie = (paramModifie: ActeParamLabo) => {
    // Mettre à jour le paramètre dans la liste
    setActesParamLabo(prev => 
      prev.map(param => 
        param._id === paramModifie._id ? paramModifie : param
      )
    );
    setShowModifierParamActeModal(false);
    setParamToModify(null);
    setMessage("Paramètre modifié avec succès");
    
    // Auto-cacher le message après 3 secondes
    setTimeout(() => {
      setMessage("");
    }, 3000);
  };

  const ajouterParametres = () => {
    if (!acteSelectionne) {
      setMessage("Veuillez d'abord sélectionner un acte clinique");
      return;
    }
    setShowAjoutModal(true);
  };

  const handleSaveParams = (nouveauxParams: any[]) => {
    // Ajouter les nouveaux paramètres à la liste existante
    const paramsAvecOrdre = nouveauxParams.map((param, index) => ({
      ...param,
      ORdonnacementAffichage: actesParamLabo.length + index + 1
    }));
    
    setActesParamLabo(prev => [...prev, ...paramsAvecOrdre]);
    setMessage(`${nouveauxParams.length} paramètre(s) ajouté(s) avec succès`);
    
    // Masquer le message après 3 secondes
    setTimeout(() => {
      setMessage("");
    }, 3000);
    
    // Recharger la liste pour avoir les IDs générés
    if (acteSelectionne) {
      actualiserParametreActe(acteSelectionne);
    }
  };

  // Déplacer une ligne vers le haut
  const deplacerLigneVersHaut = (index: number) => {
    if (index === 0) return;
    
    const newActesParamLabo = [...actesParamLabo];
    [newActesParamLabo[index - 1], newActesParamLabo[index]] = [newActesParamLabo[index], newActesParamLabo[index - 1]];
    
    // Réorganiser les numéros d'ordre
    newActesParamLabo.forEach((param, i) => {
      param.ORdonnacementAffichage = i + 1;
    });
    
    setActesParamLabo(newActesParamLabo);
  };

  // Déplacer une ligne vers le bas
  const deplacerLigneVersBas = (index: number) => {
    if (index === actesParamLabo.length - 1) return;
    
    const newActesParamLabo = [...actesParamLabo];
    [newActesParamLabo[index], newActesParamLabo[index + 1]] = [newActesParamLabo[index + 1], newActesParamLabo[index]];
    
    // Réorganiser les numéros d'ordre
    newActesParamLabo.forEach((param, i) => {
      param.ORdonnacementAffichage = i + 1;
    });
    
    setActesParamLabo(newActesParamLabo);
  };

  // Fonction pour associer les paramètres à un autre acte clinique
  const associerParametres = async () => {
    // SI TABLE_ACTE_PARAM_LABO.Occurrence()<1 OU COMBO_Sélectionner="" ALORS RETOUR
    if (actesParamLabo.length < 1 || !acteCibleSelectionne) {
      return;
    }

    const acteCible = actesCliniques.find(acte => acte._id === acteCibleSelectionne);
    if (!acteCible) {
      return;
    }

    // SI OuiNon(0,"Voulez-vous utiliser les paramètres de"+" "+TABLE_ACTE_EXAMEN.COL_Designation+" "+ "pour"+RC+COMBO_Sélectionner..ValeurAffichée)=Vrai ALORS
    const confirmationMessage = `Voulez-vous utiliser les paramètres de ${acteSelectionne?.Designation} pour ${acteCible.Designation}`;
    if (!window.confirm(confirmationMessage)) {
      return;
    }

    try {
      setLoading(true);

      // On restaure tous les autres paramètres
      // POUR TOUT ACTE_PARAM_LABO AVEC IDACTEP=COMBO_Sélectionner..ValeurMémorisée
      await fetch(`/api/acteparamlabo?idactep=${acteCibleSelectionne}`, {
        method: "DELETE"
      });

      // on ajoute les nouveaux paramètres
      // POUR TOUTE LIGNE DE TABLE_ACTE_PARAM_LABO
      for (const param of actesParamLabo) {
        // Créer une copie du paramètre avec le nouvel IDACTEP
        const nouveauParam = {
          ValeurMaxNormale: param.ValeurMaxNormale,
          ValeurMinNormale: param.ValeurMinNormale,
          ValeurNormale: param.ValeurNormale,
          IDPARAM_LABO: param.IDPARAM_LABO,
          IDACTEP: acteCibleSelectionne,
          PlageMaxEnfant: param.PlageMaxEnfant,
          PlageMinEnfant: param.PlageMinEnfant,
          PlageMinMaxEnfant: param.PlageMinMaxEnfant,
          PLageMinFemme: param.PLageMinFemme,
          PlageMaxFemme: param.PlageMaxFemme,
          PlageMinMaxFemme: param.PlageMinMaxFemme,
          PlageMinHomme: param.PlageMinHomme,
          PlageMaxHomme: param.PlageMaxHomme,
          PlageMinMaxHomme: param.PlageMinMaxHomme,
          PlageMinMaxNé: param.PlageMinMaxNé,
          PlageRefMinNe: param.PlageRefMinNe,
          PlageRefMaxNé: param.PlageRefMaxNé,
          NUM_PARAM: param.NUM_PARAM,
          Param_designation: param.Param_designation,
          ParamAbrege: param.ParamAbrege,
          UnitéParam: param.UnitéParam,
          ORdonnacementAffichage: param.ORdonnacementAffichage || actesParamLabo.indexOf(param) + 1
        };

        await fetch("/api/acteparamlabo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nouveauParam)
        });
      }

      // Info("Paramètres associés avec succès")
      setMessage("Paramètres associés avec succès");
      
      // COMBO_Sélectionner=""
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

  const handleActeToggle = (e: React.ChangeEvent<HTMLInputElement>, acte: ActeClinique) => {
    const isChecked = e.target.checked;
    
    // Vérifier combien de paramètres l'acte a actuellement
    const currentParams = acteSelectionne?._id === acte._id ? actesParamLabo.length : 0;
    
    if (isChecked) {
      // Ne permettre l'activation que s'il y a plusieurs paramètres
      if (currentParams > 1) {
        const newActesMultiParametres = new Set(actesMultiParametres);
        newActesMultiParametres.add(acte._id);
        setActesMultiParametres(newActesMultiParametres);
        setMessage(`L'acte "${acte.Designation}" est configuré pour plusieurs paramètres`);
      } else {
        // Empêcher l'activation et remettre l'interrupteur à false
        e.target.checked = false;
        setMessage(`L'acte "${acte.Designation}" doit avoir plusieurs paramètres pour être activé`);
      }
    } else {
      // Toujours permettre la désactivation
      const newActesMultiParametres = new Set(actesMultiParametres);
      newActesMultiParametres.delete(acte._id);
      setActesMultiParametres(newActesMultiParametres);
      setMessage(`L'acte "${acte.Designation}" est configuré pour un seul paramètre`);
    }
    
    // Masquer le message après 2 secondes
    setTimeout(() => {
      setMessage("");
    }, 2000);
  };

  // Fonction pour réinitialiser la recherche
  const resetSearch = () => {
    setSearchTerm("");
    setActeSelectionne(null);
    setActesParamLabo([]);
    setInterpretation("");
    setMessage("");
  };

  // Filtrer les actes selon le terme de recherche
  const actesFiltres = actesCliniques.filter(acte =>
    acte.Designation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container-fluid p-2">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          <i className="bi bi-clipboard-data me-2"></i>
          Acte Biologie
        </h2>
        <div className="d-flex gap-2">
          <Button 
            variant="outline-primary" 
            onClick={ajouterParametres}
            disabled={loading || !acteSelectionne}
            className="px-3"
          >
            <FaPlus className="me-2" />
            Ajouter Paramètre
          </Button>
          <Button variant="primary" onClick={chargerActesCliniques} disabled={loading}>
            <i className="bi bi-arrow-clockwise me-2"></i>
            Actualiser
          </Button>
        </div>
      </div>

      {message && (
        <Alert variant={message.includes("succès") ? "success" : "danger"} className="mb-4">
          {message}
        </Alert>
      )}

      <Row>
        {/* Tableau 1: Liste des actes cliniques */}
        <Col md={4}>
          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">
                <i className="bi bi-list-ul me-2"></i>
                Actes Cliniques (Lettre Clé: B)
              </h5>
            </Card.Header>
            <Card.Body className="p-0">
              {/* Champ de recherche */}
              <div className="p-3 border-bottom">
                <div className="d-flex gap-2">
                  <Form.Control
                    type="text"
                    placeholder="Rechercher un acte..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-grow-1"
                  />
                  <Button
                    variant="outline-secondary"
                    onClick={resetSearch}
                    title="Réinitialiser la recherche"
                  >
                    <i className="bi bi-arrow-clockwise"></i>
                  </Button>
                </div>
              </div>
              <div className="table-responsive" style={{ maxHeight: "450px", overflowY: "auto" }}>
                <Table striped hover className="mb-0">
                  <thead className="table-light sticky-top">
                    <tr>
                      <th>Désignation</th>
                      <th className="text-center">Résultat Multiple</th>
                    </tr>
                  </thead>
                  <tbody>
                    {actesFiltres.length > 0 ? (
                      actesFiltres.map((acte) => (
                        <tr 
                          key={acte._id}
                          className={acteSelectionne?._id === acte._id ? "table-primary" : ""}
                        >
                          <td 
                            style={{ cursor: "pointer" }}
                            onClick={() => actualiserParametreActe(acte)}
                          >
                            {acte.Designation}
                          </td>
                          <td className="text-center">
                            <Form.Check
                              type="switch"
                              checked={actesMultiParametres.has(acte._id)}
                              onChange={(e) => handleActeToggle(e, acte)}
                              disabled={loading}
                            />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2} className="text-center py-4 text-muted">
                          {searchTerm ? "Aucun acte trouvé pour cette recherche" : "Aucun acte disponible"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Tableau 2: Liste des actes param labo de l'acte sélectionné */}
        <Col md={8}>
          <Card className="shadow-sm">
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">
                <i className="bi bi-gear-fill me-2"></i>
                Paramètres de l'Acte Sélectionné
                {acteSelectionne && (
                  <Badge bg="white" text="success" className="ms-2">
                    {acteSelectionne.Designation}
                  </Badge>
                )}
              </h5>
            </Card.Header>
            <Card.Body className="p-0">
              {/* Champ d'interprétation */}
              {acteSelectionne && (
                <div className="p-3 border-bottom bg-light">
                  <Row className="g-3">
                    <Col md={8}>
                      <Form.Group>
                        <Form.Label className="fw-semibold text-muted small">
                          Interprétation de l'Acte
                        </Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          value={interpretation}
                          onChange={(e) => setInterpretation(e.target.value)}
                          placeholder="Saisir l'interprétation de l'acte..."
                          className="border-0 bg-white"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="fw-semibold text-muted small invisible">
                          Actions
                        </Form.Label>
                        <div className="d-flex gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={validerInterpretation}
                            disabled={loading}
                            className="flex-grow-1"
                          >
                            {loading ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-1"></span>
                                Validation...
                              </>
                            ) : (
                              <>
                                <FaCheck className="me-1" />
                                Valider
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={restaurerInterpretation}
                            disabled={loading}
                            className="flex-grow-1"
                          >
                            <i className="bi bi-arrow-counterclockwise me-1"></i>
                            Restaurer
                          </Button>
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              )}
              <div className="table-responsive" style={{ maxHeight: "400px", overflowY: "auto" }}>
                <Table striped hover className="mb-0">
                  <thead className="table-light sticky-top">
                    <tr>
                      <th>Ordre</th>
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
                    {actesParamLabo.map((param, index) => (
                      <tr key={param._id}>
                        <td className="text-center fw-semibold">
                          {param.ORdonnacementAffichage || index + 1}
                        </td>
                        <td 
                          className="fw-semibold" 
                          dangerouslySetInnerHTML={{ 
                            __html: param.Param_designation || '' 
                          }}
                          onClick={() => modifierParametre(param)}
                          style={{ cursor: "pointer" }}
                        />
                        <td className="fw-semibold text-primary">{param.ValeurNormale}</td>
                        <td>{param.PlageMinMaxNé}</td>
                        <td>{param.PlageMinMaxEnfant}</td>
                        <td>{param.PlageMinMaxFemme}</td>
                        <td>{param.PlageMinMaxHomme}</td>
                        <td>{param.UnitéParam}</td>
                        <td className="text-center">
                          <Form.Check
                            type="switch"
                            checked={param.TypeTexte || false}
                            onChange={() => handleTypeTexteToggle(param)}
                            disabled={loading}
                            title="Type de texte"
                          />
                        </td>
                        <td className="text-center">
                          <div className="d-flex gap-1 justify-content-center">
                            <Button
                              size="sm"
                              variant="outline-secondary"
                              title="Déplacer vers le haut"
                              onClick={() => deplacerLigneVersHaut(index)}
                              disabled={loading || index === 0}
                            >
                              <FaArrowUp />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-secondary"
                              title="Déplacer vers le bas"
                              onClick={() => deplacerLigneVersBas(index)}
                              disabled={loading || index === actesParamLabo.length - 1}
                            >
                              <FaArrowDown />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-primary"
                              title="Modifier"
                              onClick={() => modifierParametre(param)}
                              disabled={loading}
                            >
                              <FaEdit />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              title="Supprimer"
                              onClick={() => supprimerParametre(param._id)}
                              disabled={loading}
                            >
                              <FaTrash />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>

          {/* Boutons d'action */}
          {acteSelectionne && actesParamLabo.length > 0 && (
            <div className="mt-3">
              <div className="d-flex justify-content-between align-items-center">
                {/* Combo et bouton à gauche */}
                <div className="d-flex gap-3 align-items-center">
                  <div className="d-flex flex-column">
                    <Form.Label className="fw-semibold text-secondary small mb-1">
                      Associer à un autre acte
                    </Form.Label>
                    <div className="d-flex gap-2">
                      <Form.Select
                        value={acteCibleSelectionne}
                        onChange={(e) => setActeCibleSelectionne(e.target.value)}
                        style={{ 
                          width: "280px",
                          borderRadius: "8px",
                          border: "2px solid #e0e0e0",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                        }}
                        className="bg-white"
                        disabled={loading}
                      >
                        <option value="">Choisir un acte clinique...</option>
                        {actesCliniques
                          .filter(acte => acte._id !== acteSelectionne?._id) // Exclure l'acte actuel
                          .map((acte) => (
                            <option key={acte._id} value={acte._id}>
                              {acte.Designation}
                            </option>
                          ))}
                      </Form.Select>
                      <Button
                        variant="outline-primary"
                        onClick={associerParametres}
                        disabled={loading || !acteCibleSelectionne}
                        style={{
                          borderRadius: "8px",
                          border: "2px solid #0d6efd",
                          boxShadow: "0 2px 4px rgba(13, 110, 253, 0.1)",
                          fontWeight: "500",
                          minWidth: "160px"
                        }}
                        className="d-flex align-items-center justify-content-center"
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Association...
                          </>
                        ) : (
                          <>
                            <FaPlus className="me-2" />
                            Associer Paramètre
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Bouton valider à droite */}
                <Button
                  variant="success"
                  size="lg"
                  onClick={validerParametres}
                  disabled={loading}
                  className="px-4"
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
              </div>
            </div>
          )}
        </Col>
      </Row>

      {/* Modal d'ajout de paramètres */}
      <AjouterParamModal
        show={showAjoutModal}
        onHide={() => setShowAjoutModal(false)}
        acteSelectionne={acteSelectionne}
        onSave={handleSaveParams}
      />

      {/* Modal de modification de paramètre d'acte */}
      {paramToModify && (
        <ModifierParamActe
          show={showModifierParamActeModal}
          onHide={() => setShowModifierParamActeModal(false)}
          ActeParamLabo={paramToModify}
          onSave={handleParametreModifie}
        />
      )}
    </div>
  );
}
