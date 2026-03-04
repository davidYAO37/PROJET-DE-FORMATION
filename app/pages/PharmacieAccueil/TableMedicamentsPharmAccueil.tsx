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
  prixUnitaire: number;
  total: number;
  refuse: boolean;
  partAssurance: number;
  partAssure: number;
  DatePres?: string; // Ajout du champ DatePres
  DATE?: string; // Ajout du champ DATE
  reference?: string; // Ajout du champ reference
  Exclus?: string; // Ajout du champ Exclus
  StatutMedPres?: number; // Ajout du champ StatutMedPres
  posologie?: string; // Ajout du champ posologie
}

// Composant de recherche de médicament avec autocomplétion
interface SearchableMedicamentSelectProps {
  medicaments: IMedicament[];
  selectedId: string;
  onSelect: (medicament: IMedicament) => void;
  disabled?: boolean; // Ajout de la propriété disabled
}

function SearchableMedicamentSelect({ medicaments, selectedId, onSelect, disabled = false }: SearchableMedicamentSelectProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Trouver le médicament sélectionné
  const selectedMedicament = selectedId ? medicaments.find(m => m._id === selectedId) : null;
  const displayValue = selectedMedicament ? (selectedMedicament.Designation || "") : "";

  // Filtrer les médicaments selon la recherche - Si pas de recherche, afficher tous les médicaments
  const filteredMedicaments = searchTerm
    ? medicaments.filter(
      (m) =>
        m.Designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.Reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.CodeBarre?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    : medicaments; // Afficher tous les médicaments si pas de recherche

  // Calculer la position du dropdown
  useEffect(() => {
    if (showDropdown && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.top - 10, // Position au-dessus de l'input
        left: rect.left,
        width: rect.width,
      });
    }
  }, [showDropdown]);

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

  // Si le composant est désactivé, afficher simplement le médicament sélectionné en lecture seule
  if (disabled) {
    return (
      <Form.Control
        value={displayValue}
        readOnly
        disabled
        style={{ fontSize: '13px' }}
        title="Ligne verrouillée - statut prescription = 3"
      />
    );
  }

  return (
    <div ref={inputRef} className="searchable-acte-container">
      <Form.Control
        type="text"
        size="sm"
        placeholder="Rechercher un médicament..."
        value={showDropdown ? (searchTerm || "") : (displayValue || "")}
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
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            transform: "translateY(-100%)",
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
    prixUnitaire: medicament?.PrixVente || 0,
    total: medicament?.PrixVente || 0,
    refuse: false,
    partAssurance: 0,
    partAssure: medicament?.PrixVente || 0,
    DATE: new Date().toISOString().split('T')[0], // Date du jour par défaut
    reference: medicament?.Reference || "", // Ajouter la référence du médicament
    Exclus: "", // Ajouter le champ Exclus
    StatutMedPres: 0, // Ajouter le champ StatutMedPres
    posologie: "" // Ajouter le champ posologie
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
    resteAPayer: number;
  }) => void;
  remise?: number;
  presetLines?: ILigneMedicament[]; // Lignes pré-remplies depuis patientprescription
  externalResetKey?: number; // Clé pour réinitialiser les lignes
};

export default function TableMedicamentsPharmAccueil({ medicaments, onLignesChange, tauxAssurance = 0, onTotauxChange, remise = 0, presetLines, externalResetKey = 0 }: Props) {
  const [lignes, setLignes] = useState<ILigneMedicament[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentUser] = useState("Utilisateur"); // Simuler gsUtilisateur
  const [medicamentsEnStock, setMedicamentsEnStock] = useState<IMedicament[]>([]);

  // Charger les lignes pré-remplies quand elles changent
  useEffect(() => {
    if (presetLines && presetLines.length > 0) {
      console.log("📋 Chargement des lignes pré-remplies:", presetLines);
      
      // Debug: afficher les dates reçues
      presetLines.forEach((ligne, index: number) => {
        console.log(`📅 Ligne ${index + 1} reçue - DatePres:`, ligne.DatePres, "DATE:", ligne.DATE, "Valeur affichée:", ligne.DatePres || ligne.DATE || "");
      });
      
      setLignes(presetLines);
    } else if (externalResetKey > 0 && presetLines === undefined) {
      // Réinitialiser si externalResetKey change et presetLines est undefined
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

  // PROCÉDURE Facture_Pharmacie()
  // SAI_MontantRendu=""
  // SAI_Montanttotal=""
  // SAI_PartAssuranceP=""
  // SAI_Partassuré=""
  // MONTOTAL est un monétaire=""
  // moToassurance est un monétaire=""
  // moNtoassure est un monétaire=""
  const calculerTotaux = useCallback(() => {
    let MONTOTAL = 0; // MONTOTAL est un monétaire
    let moToassurance = 0; // moToassurance est un monétaire
    let moNtoassure = 0; // moNtoassure est un monétaire

    // POUR TOUTE LIGNE DE TABLE_PARTIENT_PRESCRIPTION
    lignes.forEach(ligne => {
      // TABLE_PARTIENT_PRESCRIPTION.COL_PrixTotal=TABLE_PARTIENT_PRESCRIPTION.COL_QtéP*TABLE_PARTIENT_PRESCRIPTION.COL_Prixunitaire
      const prixTotal = ligne.quantite * ligne.prixUnitaire;
      ligne.total = prixTotal;

      // Accepter ou Refuser
      // SI TABLE_PARTIENT_PRESCRIPTION.COL_Exclus="NON" ALORS
      if (ligne.Exclus === "NON") {
        // TABLE_PARTIENT_PRESCRIPTION.COL_PartAssurance=(TABLE_PARTIENT_PRESCRIPTION.COL_PrixTotal*SAI_Taux_Assurance)/100
        ligne.partAssurance = (prixTotal * tauxAssurance) / 100;
        // TABLE_PARTIENT_PRESCRIPTION.COL_PartAssure=TABLE_PARTIENT_PRESCRIPTION.COL_PrixTotal-TABLE_PARTIENT_PRESCRIPTION.COL_PartAssurance
        ligne.partAssure = prixTotal - ligne.partAssurance;
      } else {
        // SINON
        // TABLE_PARTIENT_PRESCRIPTION.COL_PartAssurance=0
        ligne.partAssurance = 0;
        // TABLE_PARTIENT_PRESCRIPTION.COL_PartAssure=TABLE_PARTIENT_PRESCRIPTION.COL_PrixTotal
        ligne.partAssure = prixTotal;
      }

      // MONTOTAL+=TABLE_PARTIENT_PRESCRIPTION.COL_PrixTotal
      MONTOTAL += prixTotal;
      // moToassurance+=TABLE_PARTIENT_PRESCRIPTION.COL_PartAssurance
      moToassurance += ligne.partAssurance;
      // moNtoassure+=TABLE_PARTIENT_PRESCRIPTION.COL_PartAssure
      moNtoassure += ligne.partAssure;
    });

    // on applique la remise
    let SAI_Montanttotal = 0;
    let SAI_PartAssuranceP = 0;
    let SAI_Partassuré = 0;

    // SI SAI_REMISE="" OU SAI_REMISE=0 ALORS
    if (remise === 0) {
      // SAI_Partassuré=moNtoassure
      SAI_Partassuré = moNtoassure;
      // SAI_PartAssuranceP=moToassurance
      SAI_PartAssuranceP = moToassurance;
      // SAI_Montanttotal=MONTOTAL
      SAI_Montanttotal = MONTOTAL;
    } else {
      // SINON
      // SAI_Montanttotal=MONTOTAL-SAI_REMISE
      SAI_Montanttotal = MONTOTAL - remise;
      // SAI_PartAssuranceP=(SAI_Montanttotal*SAI_Taux_Assurance)/100
      SAI_PartAssuranceP = (SAI_Montanttotal * tauxAssurance) / 100;
      // SAI_Partassuré=SAI_Montanttotal-SAI_PartAssuranceP
      SAI_Partassuré = SAI_Montanttotal - SAI_PartAssuranceP;
    }

    // SAI_MontantRendu=SAI_MontantRecu-SAI_Partassuré
    // Note: SAI_MontantRecu serait géré par un autre composant de paiement

    // Notifier le parent des nouveaux totaux selon la logique WLangage
    if (onTotauxChange) {
      onTotauxChange({
        montantTotal: SAI_Montanttotal,
        partAssurance: SAI_PartAssuranceP,
        partAssure: SAI_Partassuré,
        resteAPayer: SAI_Partassuré // Correspond à SAI_MontantRendu
      });
    }
  }, [lignes, tauxAssurance, remise, onTotauxChange]);

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
    // HLitRecherche(PHARMACIE,Designation,MoiMême..ValeurAffichée)
    // SI HTrouve(PHARMACIE)=Vrai ALORS	
    if (medicament && medicament._id) {
      // TABLE_PARTIENT_PRESCRIPTION.COL_Date=DateSys()
      // TABLE_PARTIENT_PRESCRIPTION.COL_Exclus="NON"
      // TABLE_PARTIENT_PRESCRIPTION.COL_QtéP=1
      // TABLE_PARTIENT_PRESCRIPTION.COL_Prixunitaire=PHARMACIE.PrixVente
      // TABLE_PARTIENT_PRESCRIPTION.COL_MédicamentID=PHARMACIE.IDMEDICAMENT
      // TABLE_PARTIENT_PRESCRIPTION.COL_Reference=PHARMACIE.Reference
      // TABLE_PARTIENT_PRESCRIPTION.COL_StatutMedPres=2

      updateLigne(id, {
        medicamentId: medicament._id, // COL_MédicamentID=PHARMACIE.IDMEDICAMENT
        designation: medicament.Designation,
        prixUnitaire: medicament.PrixVente || 0, // COL_Prixunitaire=PHARMACIE.PrixVente
        quantite: 1, // COL_QtéP=1
        total: medicament.PrixVente || 0,
        DATE: new Date().toISOString().split('T')[0], // COL_Date=DateSys()
        Exclus: "NON", // COL_Exclus="NON"
        StatutMedPres: 2, // COL_StatutMedPres=2
        reference: medicament.Reference || "", // COL_Reference=PHARMACIE.Reference
        partAssurance: 0,
        partAssure: medicament.PrixVente || 0
      });

      // Facture_Pharmacie() - Calcul des totaux
      calculerTotaux();
    }
  };

  // Mettre à jour la quantité et recalculer le total
  const handleQuantiteChange = (id: string, quantite: number) => {
    const ligne = lignes.find(l => l.id === id);
    if (ligne) {
      const newTotal = quantite * ligne.prixUnitaire;
      updateLigne(id, {
        quantite,
        total: newTotal,
        partAssurance: !ligne.refuse ? (newTotal * tauxAssurance) / 100 : 0,
        partAssure: !ligne.refuse ? newTotal - ((newTotal * tauxAssurance) / 100) : newTotal
      });
      // Facture_Pharmacie() - Recalculer les totaux
      calculerTotaux();
    }
  };

  // Mettre à jour la date
  const handleDateChange = (id: string, date: string) => {
    // Vérifier si la ligne a un DatePres (mode modification) ou DATE (mode création)
    const ligne = lignes.find(l => l.id === id);
    if (ligne?.DatePres !== undefined) {
      // Mode modification : mettre à jour DatePres
      updateLigne(id, { DatePres: date });
    } else {
      // Mode création : mettre à jour DATE
      updateLigne(id, { DATE: date });
    }
  };

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

      // Facture_Pharmacie() - Recalculer les totaux
      setTimeout(() => calculerTotaux(), 0);

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

      {/* Message informatif pour les lignes verrouillées */}
      {lignes.some(ligne => ligne.StatutMedPres === 3) && (
        <Alert variant="warning" className="mb-2">
          <small>
            <i className="bi bi-info-circle me-2"></i>
            Les lignes surlignées en jaune avec l'icône 🔒 sont verrouillées (statut prescription = 3) et ne peuvent pas être modifiées ni supprimées.
          </small>
        </Alert>
      )}

      <div className="table-responsive" style={{ maxHeight: "60vh", overflow: "auto" }}>
        <Table bordered hover size="sm" className="mb-0">
          <thead className="table-light" style={{ position: "sticky", top: 0, zIndex: 2 }}>

            <tr>
              <th style={{ width: '5%' }}>#</th>
              <th style={{ width: '15%' }}>Date</th>
              <th style={{ width: '35%' }}>Médicament</th>
              <th style={{ width: '10%' }}>Qté</th>
              <th style={{ width: '15%' }}>P.U (FCFA)</th>
              <th style={{ width: '20%' }}>Posologie</th>
              <th style={{ width: '10%' }}>Exclusion</th>
              <th style={{ width: '5%' }}></th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((ligne, index) => {
              // Vérifier si la ligne est verrouillée (statutPrescriptionMedecin = 3)
              const isLigneLocked = ligne.StatutMedPres === 3;
              
              return (
                <tr key={ligne.id} className={ligne.refuse ? 'table-danger' : (isLigneLocked ? 'table-warning' : '')}>
                  <td>{index + 1}</td>
                  <td>
                    <Form.Control
                      type="date"
                      value={ligne.DatePres || ligne.DATE || ""}
                      onChange={(e) => handleDateChange(ligne.id, e.target.value)}
                      size="sm"
                      style={{ fontSize: '13px' }}
                      disabled={isLigneLocked}
                      title={isLigneLocked ? "Ligne verrouillée - statut prescription = 3" : ""}
                    />
                  </td>
                  <td>
                    <SearchableMedicamentSelect
                      medicaments={medicaments}
                      selectedId={ligne.medicamentId || ""}
                      onSelect={(medicament) => handleSelectMedicament(ligne.id, medicament)}
                      disabled={isLigneLocked}
                    />
                  </td>
                  <td>
                    <Form.Control
                      type="number"
                      min="1"
                      value={ligne.quantite || 1}
                      onChange={(e) => handleQuantiteChange(ligne.id, parseInt(e.target.value) || 1)}
                      size="sm"
                      disabled={isLigneLocked}
                      title={isLigneLocked ? "Ligne verrouillée - statut prescription = 3" : ""}
                    />
                  </td>
                  <td className="text-end">{ligne.prixUnitaire.toLocaleString()}</td>
                  <td>
                    <Form.Control
                      type="text"
                      value={ligne.posologie || ""}
                      onChange={(e) => updateLigne(ligne.id, { posologie: e.target.value })}
                      placeholder="Posologie"
                      size="sm"
                      disabled={isLigneLocked}
                      title={isLigneLocked ? "Ligne verrouillée - statut prescription = 3" : ""}
                    />
                  </td>
                  <td className="text-center">
                    <Form.Select
                      value={ligne.Exclus || "NON"}
                      onChange={(e) => updateLigne(ligne.id, { Exclus: e.target.value })}
                      size="sm"
                      disabled={isLigneLocked}
                      title={isLigneLocked ? "Ligne verrouillée - statut prescription = 3" : ""}
                    >
                      <option value="NON">NON</option>
                      <option value="OUI">OUI</option>
                    </Form.Select>
                  </td>
                  <td className="text-center">
                    {!isLigneLocked ? (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => removeLigne(ligne.id)}
                        title="Supprimer"
                      >
                        ×
                      </Button>
                    ) : (
                      <span 
                        className="text-muted" 
                        title="Ligne verrouillée - statut prescription = 3"
                        style={{ cursor: 'not-allowed', fontSize: '18px' }}
                      >
                        🔒
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {lignes.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-muted py-3">
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
