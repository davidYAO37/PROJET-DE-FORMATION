"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Table, Form, Button, InputGroup, Row, Col, Alert, Card } from "react-bootstrap";
import MedicamentSelectModal from "./MedicamentSelectModal";

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
  StatuPrescriptionMedecin?: number; // Ajout du champ StatuPrescriptionMedecin
  posologie?: string; // Ajout du champ posologie
}

// Composant de sélection de médicament avec recherche
interface MedicamentSelectProps {
  medicaments: IMedicament[];
  selectedId: string;
  onSelect: (medicament: IMedicament) => void;
  disabled?: boolean; // Ajout de la propriété disabled
}

function MedicamentSelect({ medicaments, selectedId, onSelect, disabled = false }: MedicamentSelectProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  // Filtrer les médicaments selon la recherche
  const filteredMedicaments = searchTerm
    ? medicaments.filter(m =>
        m.Designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.Reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.CodeBarre?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : medicaments;

  // Calculer la position du dropdown
  useEffect(() => {
    if (showDropdown && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 5, // Position en dessous de l'input
        left: rect.left,
        width: rect.width
      });
    }
  }, [showDropdown]);

  // Fermer le dropdown si on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
  };

  const selectedMedicament = medicaments.find(m => m._id === selectedId);

  // Si le composant est désactivé, afficher simplement le médicament sélectionné en lecture seule
  if (disabled) {
    const displayValue = selectedMedicament ? selectedMedicament.Designation || "" : "";
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
    <div style={{ position: 'relative' }}>
      <Form.Control
        ref={inputRef}
        type="text"
        size="sm"
        placeholder="Rechercher un médicament..."
        value={searchTerm || (selectedMedicament?.Designation || "")}
        onChange={handleInputChange}
        onFocus={() => setShowDropdown(true)}
        style={{ fontSize: '13px' }}
        disabled={disabled}
      />
      {showDropdown && (
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            maxHeight: '200px',
            overflow: 'auto',
            backgroundColor: 'white',
            border: '1px solid #dee2e6',
            borderRadius: '0.375rem',
            boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.15)',
            zIndex: 1000
          }}
        >
          {filteredMedicaments.length === 0 ? (
            <div style={{ padding: '8px', color: '#6c757d', fontSize: '13px' }}>
              Aucun médicament trouvé
            </div>
          ) : (
            filteredMedicaments.map((medicament) => (
              <div
                key={medicament._id}
                onClick={() => handleSelect(medicament)}
                style={{
                  padding: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  borderBottom: '1px solid #f8f9fa',
                  backgroundColor: medicament._id === selectedId ? '#e3f2fd' : 'white'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = medicament._id === selectedId ? '#e3f2fd' : 'white';
                }}
              >
                <div>
                  <strong>{medicament.Designation}</strong>
                </div>
                {medicament.Reference && (
                  <div style={{ fontSize: '11px', color: '#6c757d' }}>
                    📋 {medicament.Reference}
                  </div>
                )}
                {medicament.StockDisponible !== undefined && (
                  <div style={{ fontSize: '11px', color: '#007bff' }}>
                    📦 Stock: {medicament.StockDisponible}
                  </div>
                )}
                {medicament.PrixVente && (
                  <div style={{ fontSize: '11px', color: '#28a745' }}>
                    💰 {medicament.PrixVente} FCFA
                  </div>
                )}
              </div>
            ))
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
    StatuPrescriptionMedecin: 0, // Ajouter le champ StatuPrescriptionMedecin
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
  prescriptionData?: { Rclinique?: string }; // Données de prescription
  onRcliniqueChange?: (Rclinique: string) => void; // Callback pour la mise à jour
};

export default function TableMedicamentsPharmAccueilMedecin({ medicaments, onLignesChange, tauxAssurance = 0, onTotauxChange, remise = 0, presetLines, externalResetKey = 0, prescriptionData, onRcliniqueChange }: Props) {
  const [lignes, setLignes] = useState<ILigneMedicament[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentUser] = useState("Utilisateur"); // Simuler gsUtilisateur
  const [medicamentsEnStock, setMedicamentsEnStock] = useState<IMedicament[]>([]);
  const [showMedicamentModal, setShowMedicamentModal] = useState(false);
  const [currentLigneId, setCurrentLigneId] = useState<string | null>(null);
  const [rclinique, setRclinique] = useState(prescriptionData?.Rclinique || "");

  // Synchroniser le Rclinique avec les props de prescription
  useEffect(() => {
    if (prescriptionData?.Rclinique !== undefined) {
      setRclinique(prescriptionData.Rclinique);
    }
  }, [prescriptionData?.Rclinique]);

  // Notifier le parent des changements de Rclinique (stabilisé avec useCallback)
  const handleRcliniqueChange = useCallback((value: string) => {
    setRclinique(value);
    if (onRcliniqueChange) {
      onRcliniqueChange(value);
    }
  }, [onRcliniqueChange]);

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

  // Ajouter des médicaments via le modal
  const addLigne = () => {
    setShowMedicamentModal(true);
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

  // Gérer l'ouverture du modal de sélection de médicament
  const handleOpenMedicamentModal = (ligneId: string) => {
    setCurrentLigneId(ligneId);
    setShowMedicamentModal(true);
  };

  // Gérer la sélection multiple de médicaments depuis le modal
  const handleMedicamentsSelect = (medicaments: IMedicament[]) => {
    if (medicaments.length > 0) {
      // Ajouter chaque médicament sélectionné comme une nouvelle ligne
      const nouvellesLignes = medicaments.map(medicament => {
        if (medicament && medicament._id) {
          return {
            ...emptyLigne(medicament),
            DATE: new Date().toISOString().split('T')[0], // COL_Date=DateSys()
            Exclus: "NON", // COL_Exclus="NON"
            StatuPrescriptionMedecin: 2, // COL_StatuPrescriptionMedecin=2
            partAssurance: 0,
            partAssure: medicament.PrixVente || 0
          };
        }
        return emptyLigne();
      });

      // Ajouter les nouvelles lignes à la liste existante
      setLignes(prev => [...prev, ...nouvellesLignes]);
      
      // Facture_Pharmacie() - Calcul des totaux
      calculerTotaux();
    }
    setCurrentLigneId(null);
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
      {lignes.some(ligne => ligne.StatuPrescriptionMedecin === 3) && (
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
              <th style={{ width: '50px', minWidth: '50px' }}>#</th>
              <th style={{ width: '120px', minWidth: '120px' }}>Date</th>
              <th style={{ minWidth: '300px' }}>Médicament</th>
              <th style={{ width: '80px', minWidth: '80px' }}>Qté</th>
              <th style={{ minWidth: '200px' }}>Posologie</th>
              <th style={{ width: '50px', minWidth: '50px' }}></th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((ligne, index) => {
              // Vérifier si la ligne est verrouillée (StatutPrescriptionMedecin = 3)
              const isLigneLocked = ligne.StatuPrescriptionMedecin === 3;
              
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
                    {ligne.designation ? (
                      <div className="d-flex align-items-center">
                        <div className="flex-grow-1">
                          <div className="fw-semibold text-truncate" title={ligne.designation}>
                            {ligne.designation}
                          </div>
                          {ligne.reference && (
                            <small className="text-muted">
                              Réf: {ligne.reference}
                            </small>
                          )}
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline-primary"
                        className="w-100"
                        onClick={() => handleOpenMedicamentModal(ligne.id)}
                        disabled={isLigneLocked}
                        title="Sélectionner un médicament"
                      >
                        <i className="bi bi-capsule me-2"></i>
                        Sélectionner un médicament
                      </Button>
                    )}
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
                <td colSpan={6} className="text-center text-muted py-3">
                  Aucun médicament ajouté. Cliquez sur "Ajouter un médicament" pour commencer.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {/* Section Renseignement clinique */}
      <div className="mt-4">
        <Card className="shadow-sm">
          <Card.Header className="bg-light">
            <h6 className="mb-0">
              <i className="bi bi-clipboard-pulse me-2"></i>
              Renseignement clinique
            </h6>
          </Card.Header>
          <Card.Body>
            <Form.Group>
              <Form.Label className="fw-semibold">Observations cliniques</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={rclinique}
                onChange={(e) => handleRcliniqueChange(e.target.value)}
                placeholder="Ajoutez ici les observations cliniques, notes du médecin ou informations complémentaires..."
                style={{ fontSize: '14px' }}
              />
            </Form.Group>
          </Card.Body>
        </Card>
      </div>

      {/* Modal de sélection de médicament */}
      <MedicamentSelectModal
        show={showMedicamentModal}
        onHide={() => {
          setShowMedicamentModal(false);
          setCurrentLigneId(null);
        }}
        medicaments={medicamentsEnStock.length > 0 ? medicamentsEnStock : medicaments}
        onMedicamentsSelect={handleMedicamentsSelect}
        selectedMedicamentIds={[]}
      />
    </div>
  );
}
