"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Table, Form, Button, InputGroup, Row, Col, Alert } from "react-bootstrap";

// Type pour un médicament
export interface IMedicament {
  _id: string;
  Designation: string;
  Reference?: string;
  CodeBarre?: string;
  PrixVente?: number;
  StockDisponible?: number;
  // ... autres champs si nécessaire
}

// Type pour une ligne de médicament
export interface ILigneMedicament {
  id: string;
  medicamentId: string;
  designation: string;
  quantite: number;
  posologie?: string;
  prixUnitaire: number;
  total: number;
  paye: boolean;
  refuse: boolean;
  partAssurance: number;
  partAssure: number;
  payePar?: string;
  payeLe?: string;
  payeA?: string;
  DATE?: string; // Ajout du champ DATE
  reference?: string; // Ajout du champ reference
}

// Composant de recherche de médicament avec autocomplétion
interface SearchableMedicamentSelectProps {
  medicaments: IMedicament[];
  selectedId: string;
  onSelect: (medicament: IMedicament) => void;
}

function SearchableMedicamentSelect({ medicaments, selectedId, onSelect }: SearchableMedicamentSelectProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Trouver le médicament sélectionné
  const selectedMedicament = medicaments.find(m => m._id === selectedId);
  const displayValue = selectedMedicament ? selectedMedicament.Designation : "";

  // Filtrer les médicaments selon la recherche - Si pas de recherche, afficher tous les médicaments en stock
  const filteredMedicaments = searchTerm
    ? medicaments.filter(
      (m) =>
        m.Designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.Reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.CodeBarre?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    : medicaments; // Afficher tous les médicaments en stock si pas de recherche

  // Calculer la position du dropdown
  useEffect(() => {
    if (showDropdown && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      
      setDropdownPosition({
        top: rect.top + scrollTop - 10, // Position au-dessus de l'input avec scroll
        left: rect.left + scrollLeft,
        width: rect.width,
      });
    }
  }, [showDropdown, searchTerm]); // Ajout de searchTerm pour éviter les recalculs intempestifs

  // Fermer le dropdown si on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (medicament: IMedicament) => {
    onSelect(medicament);
    setSearchTerm("");
    setShowDropdown(false);
  };

  return (
    <div ref={inputRef} className="searchable-acte-container">
      <Form.Control
        type="text"
        size="sm"
        placeholder="Rechercher un médicament..."
        value={showDropdown ? searchTerm : displayValue}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
      />
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="searchable-acte-dropdown"
          style={{
            position: 'fixed',
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            zIndex: 1000,
          }}
        >
          {searchTerm && (
            <div className="searchable-acte-counter">
              {filteredMedicaments.length} résultat
              {filteredMedicaments.length > 1 ? "s" : ""} trouvé
              {filteredMedicaments.length > 1 ? "s" : ""}
            </div>
          )}
          {filteredMedicaments.length === 0 ? (
            <div className="searchable-acte-empty">
              <div className="searchable-acte-empty-icon">🔍</div>
              <div>Aucun médicament trouvé</div>
              <div className="searchable-acte-empty-hint">
                Essayez un autre terme de recherche
              </div>
            </div>
          ) : (
            <div className="searchable-acte-list">
              {filteredMedicaments.map((medicament) => (
                <div
                  key={medicament._id}
                  onClick={() => handleSelect(medicament)}
                  className={`searchable-acte-item ${medicament._id === selectedId ? "selected" : ""}`}
                >
                  <div className="searchable-acte-title">
                    {medicament.Designation}
                  </div>
                  <div className="searchable-acte-badges">
                    {medicament.StockDisponible !== undefined && (
                      <span className="searchable-acte-badge-stock">
                        📦 Stock: {medicament.StockDisponible}
                      </span>
                    )}
                    {medicament.Reference && (
                      <span className="searchable-acte-badge-ref">
                        📋 {medicament.Reference}
                      </span>
                    )}
                    {medicament.CodeBarre && (
                      <span className="searchable-acte-badge-key">
                        🔑 {medicament.CodeBarre}
                      </span>
                    )}
                    {medicament.PrixVente && (
                      <span className="searchable-acte-badge-mutuel">
                        🏥 Vente: {medicament.PrixVente} FCFA
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Fonction utilitaire pour générer un ID unique
function generateLineId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// Fonction pour créer une nouvelle ligne vide
function emptyLigne(medicament?: IMedicament): ILigneMedicament {
  return {
    id: generateLineId(),
    medicamentId: medicament?._id || "",
    designation: medicament?.Designation || "",
    quantite: 1,
    posologie: "",
    prixUnitaire: medicament?.PrixVente || 0,
    total: medicament?.PrixVente || 0,
    paye: false,
    refuse: false,
    partAssurance: 0,
    partAssure: medicament?.PrixVente || 0,
    payePar: "",
    payeLe: "",
    payeA: "",
    DATE: new Date().toISOString().split('T')[0], // Date du jour par défaut
    reference: medicament?.Reference || "" // Ajouter la référence du médicament
  };
}

type Props = {
  medicaments: IMedicament[];
  onLignesChange?: (lignes: ILigneMedicament[]) => void;
  tauxAssurance?: number;
  onTotauxChange?: (totaux: {
    montantTotal: number;
    partAssurance: number;
    partAssure: number;
    montantRecu: number;
    resteAPayer: number;
  }) => void;
  presetLines?: ILigneMedicament[]; // Lignes pré-remplies depuis patientprescription
  externalResetKey?: number; // Clé pour réinitialiser les lignes
  remise?: number;
};

export default function TableMedicaments({ medicaments, onLignesChange, tauxAssurance = 0, onTotauxChange, remise = 0, presetLines, externalResetKey = 0 }: Props) {
  const [lignes, setLignes] = useState<ILigneMedicament[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentUser] = useState(""); // dans le localStorage
  const [medicamentsEnStock, setMedicamentsEnStock] = useState<IMedicament[]>([]);

  // Charger les lignes pré-remplies quand elles changent
  useEffect(() => {
    // Si le parent fournit explicitement des lignes (même un tableau vide),
    // on synchronise toujours l'état local avec ces lignes.
    if (presetLines !== undefined) {
      console.log("📋 Synchronisation des lignes pré-remplies:", presetLines);
      setLignes(presetLines);
    } else if (externalResetKey > 0) {
      // Réinitialiser si externalResetKey change et qu'aucune ligne pré-remplie n'est fournie
      setLignes([]);
    }
  }, [presetLines, externalResetKey]);

  // Charger les médicaments en stock au montage du composant
  useEffect(() => {
    const chargerMedicamentsEnStock = async () => {
      try {
        const response = await fetch('/api/stock');
        const stocks = await response.json();

        // Filtrer les médicaments qui ont une quantité en stock > 0
        const medicamentsDisponibles = stocks
          .filter((stock: any) => stock.QteEnStock > 0 && stock.IDMEDICAMENT)
          .map((stock: any) => {
            // Trouver le médicament correspondant dans la liste des médicaments
            const medicament = medicaments.find(m => m._id === stock.IDMEDICAMENT.toString());
            if (medicament) {
              return {
                ...medicament,
                StockDisponible: stock.QteEnStock
              };
            }
            return null;
          })
          .filter(Boolean); // Supprimer les valeurs null

        setMedicamentsEnStock(medicamentsDisponibles);
      } catch (error) {
        console.error("Erreur lors du chargement des médicaments en stock:", error);
      }
    };

    chargerMedicamentsEnStock();
  }, [medicaments]);

  // Fonction de calcul des totaux selon la logique WLangage
  const calculerTotaux = useCallback(() => {
    let montantTotal = 0;
    let partAssurance = 0;
    let partAssure = 0;
    let montantRecu = 0;

    lignes.forEach(ligne => {
      const prixTotal = ligne.quantite * ligne.prixUnitaire;
      ligne.total = prixTotal;

      // SI COL_Refusé="" ALORS
      if (!ligne.refuse) {
        // COL_PartAssurance = (COL_PrixTotal * SAI_Taux_Assur) / 100
        ligne.partAssurance = (prixTotal * tauxAssurance) / 100;
        // COL_PartAssure = COL_PrixTotal - COL_PartAssurance
        ligne.partAssure = prixTotal - ligne.partAssurance;
      } else {
        // SINON
        ligne.partAssurance = 0;
        ligne.partAssure = prixTotal;
      }

      // SI COL_FActuré="Payé" ALORS
      if (ligne.paye) {
        // SAI_Montanttotal += COL_PrixTotal
        montantTotal += prixTotal;
        // SAI_Partassuré += COL_PartAssure
        partAssure += ligne.partAssure;
        // SAI_PartAssuranceP += COL_PartAssurance
        partAssurance += ligne.partAssurance;

        // Info sur qui a payé (COL_PayéPar=gsUtilisateur, COL_PayéLe=DateSys(), COL_PayéA=HeureSys())
        if (!ligne.payePar) {
          ligne.payePar = currentUser;
          ligne.payeLe = new Date().toLocaleDateString();
          ligne.payeA = new Date().toLocaleTimeString();
        }
      } else {
        // SINON - vider les infos de paiement
        ligne.payePar = "";
        ligne.payeLe = "";
        ligne.payeA = "";
      }
    });

    // Calcul du total à payer selon la remise
    let totalAPayerPatient = 0;
    let resteAPayer = 0;

    // SI SAI_REMISE=0 ALORS
    if (remise === 0) {
      // SAI_Total_a_payer_Patient = SAI_Partassuré
      totalAPayerPatient = partAssure;
      // SAI_Reste_a_payer = SAI_Total_a_payer_Patient
      resteAPayer = totalAPayerPatient;
    } else {
      // SINON
      // SAI_Total_a_payer_Patient = SAI_Partassuré - SAI_REMISE
      totalAPayerPatient = Math.max(0, partAssure - remise);
      // SAI_Reste_a_payer = SAI_Total_a_payer_Patient
      resteAPayer = totalAPayerPatient;
    }

    // Notifier le parent des nouveaux totaux
    if (onTotauxChange) {
      onTotauxChange({
        montantTotal,
        partAssurance,
        partAssure,
        montantRecu,
        resteAPayer
      });
    }
  }, [lignes, tauxAssurance, remise, onTotauxChange, currentUser]);

  // Recalculer les totaux quand les lignes, le taux d'assurance ou la remise changent
  useEffect(() => {
    calculerTotaux();
  }, [lignes, tauxAssurance, remise, calculerTotaux]);

  // Notifier le parent des changements
  useEffect(() => {
    if (onLignesChange) {
      onLignesChange(lignes);
    }
  }, [lignes]); // Retirer onLignesChange des dépendances

  // Ajouter une nouvelle ligne
  const addLigne = () => {
    setLignes(prev => [...prev, emptyLigne()]);
  };

  // Mettre à jour une ligne
  const updateLigne = (id: string, updates: Partial<ILigneMedicament>) => {
    setLignes(prev =>
      prev.map(ligne =>
        ligne.id === id ? { ...ligne, ...updates } : ligne
      )
    );
  };

  // Supprimer une ligne
  const removeLigne = (id: string) => {
    setLignes(prev => prev.filter(l => l.id !== id));
  };

  // Gérer la sélection d'un médicament
  const handleSelectMedicament = (id: string, medicament: IMedicament) => {
    const prixUnitaire = medicament.PrixVente || 0;
    const quantite = 1;
    const total = prixUnitaire * quantite;

    updateLigne(id, {
      medicamentId: medicament._id,
      designation: medicament.Designation,
      prixUnitaire: prixUnitaire,
      quantite: quantite,
      total: total,
      reference: medicament.Reference || medicament.CodeBarre || "", // Utiliser la référence du médicament (ex: RIV-3)
      // Calculer les parts assurance/patient selon le taux
      partAssurance: (total * tauxAssurance) / 100,
      partAssure: total - ((total * tauxAssurance) / 100)
    });

    // Recalculer les totaux généraux
    setTimeout(() => calculerTotaux(), 0);
  };

  // Mettre à jour la quantité et recalculer le total
  const handleQuantiteChange = (id: string, quantite: number) => {
    const ligne = lignes.find(l => l.id === id);
    if (ligne) {
      const newTotal = quantite * ligne.prixUnitaire;
      updateLigne(id, {
        quantite,
        total: newTotal,
        // Recalculer les parts assurance/patient
        partAssurance: !ligne.refuse ? (newTotal * tauxAssurance) / 100 : 0,
        partAssure: !ligne.refuse ? newTotal - ((newTotal * tauxAssurance) / 100) : newTotal
      });
      // Recalculer les totaux généraux
      setTimeout(() => calculerTotaux(), 0);
    }
  };

  // Mettre à jour la date
  const handleDateChange = (id: string, date: string) => {
    updateLigne(id, { DATE: date });
  };

  // Bascher l'état de paiement
  const togglePaye = useCallback((id: string) => {
    setLignes(prev => {
      const newLignes = prev.map(ligne => {
        if (ligne.id === id) {
          const updatedLigne = { ...ligne, paye: !ligne.paye };

          // Mettre à jour les infos de paiement immédiatement
          if (updatedLigne.paye && !updatedLigne.payePar) {
            updatedLigne.payePar = currentUser;
            updatedLigne.payeLe = new Date().toLocaleDateString();
            updatedLigne.payeA = new Date().toLocaleTimeString();
          } else if (!updatedLigne.paye) {
            updatedLigne.payePar = "";
            updatedLigne.payeLe = "";
            updatedLigne.payeA = "";
          }

          return updatedLigne;
        }
        return ligne;
      });

      return newLignes;
    });
  }, [currentUser]);

  // Bascher l'état de refus
  const toggleRefuse = useCallback((id: string) => {
    setLignes(prev => {
      const newLignes = prev.map(ligne => {
        if (ligne.id === id) {
          const updatedLigne = { ...ligne, refuse: !ligne.refuse };

          // Recalculer les parts assurance/patient immédiatement
          const prixTotal = updatedLigne.quantite * updatedLigne.prixUnitaire;
          if (!updatedLigne.refuse) {
            updatedLigne.partAssurance = (prixTotal * tauxAssurance) / 100;
            updatedLigne.partAssure = prixTotal - updatedLigne.partAssurance;
          } else {
            updatedLigne.partAssurance = 0;
            updatedLigne.partAssure = prixTotal;
          }

          return updatedLigne;
        }
        return ligne;
      });

      return newLignes;
    });
  }, [tauxAssurance]);

  // Calculer le total général
  const totalGeneral = lignes.reduce((sum, ligne) => sum + ligne.total, 0);

  return (
    <div>
      <Row className="mb-2">
        <Col className="text-end">
          <Button variant="primary" size="sm" onClick={addLigne}>
            + Ajouter un médicament
          </Button>
        </Col>
      </Row>

      {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}

      <div className="table-responsive" style={{ maxHeight: "60vh", overflow: "auto" }}>
        <Table bordered hover size="sm" className="mb-0">
          <thead className="table-light" style={{ position: "sticky", top: 0, zIndex: 2 }}>

            <tr>
              <th style={{ width: '5%' }}>#</th>
              <th style={{ width: '120px' }}>Date</th>
              <th style={{ width: '40%' }}>Médicament</th>
              <th style={{ width: '10%' }}>Qté</th>
              <th style={{ width: '15%' }}>P.U (FCFA)</th>
              <th style={{ width: '15%' }}>Total (FCFA)</th>
              <th style={{ width: '10%' }}>Payé</th>
              <th style={{ width: '10%' }}>Refusé</th>
              <th style={{ width: '5%' }}></th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((ligne, index) => (
              <tr key={ligne.id} className={ligne.refuse ? 'table-danger' : ''}>
                <td>{index + 1}</td>
                <td>
                  <Form.Control
                    type="date"
                    value={ligne.DATE || ""}
                    onChange={(e) => handleDateChange(ligne.id, e.target.value)}
                    size="sm"
                    style={{ fontSize: '13px' }}
                  />
                </td>
                <td>
                  <SearchableMedicamentSelect
                    medicaments={medicamentsEnStock}
                    selectedId={ligne.medicamentId}
                    onSelect={(medicament) => handleSelectMedicament(ligne.id, medicament)}
                  />
                  {/* {ligne.payePar && (
                    <small className="text-muted d-block">
                      Par: {ligne.payePar} le {ligne.payeLe} à {ligne.payeA}
                    </small>
                  )} */}
                </td>
                <td>
                  <Form.Control
                    type="number"
                    min="1"
                    value={ligne.quantite}
                    onChange={(e) => handleQuantiteChange(ligne.id, parseInt(e.target.value) || 1)}
                    size="sm"
                  />
                </td>
                <td className="text-end">{ligne.prixUnitaire.toLocaleString()}</td>
                <td className="text-end fw-bold">{ligne.total.toLocaleString()}</td>
                <td className="text-center">
                  <Form.Check
                    type="checkbox"
                    checked={ligne.paye}
                    onChange={() => togglePaye(ligne.id)}
                  />
                </td>
                <td className="text-center">
                  <Form.Check
                    type="checkbox"
                    checked={ligne.refuse}
                    onChange={() => toggleRefuse(ligne.id)}
                  />
                </td>
                <td className="text-center">
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => removeLigne(ligne.id)}
                    title="Supprimer"
                  >
                    ×
                  </Button>
                </td>
              </tr>
            ))}
            {lignes.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center text-muted py-3">
                  Aucun médicament ajouté. Cliquez sur "Ajouter un médicament" pour commencer.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
