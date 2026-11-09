"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Table, Form, Button, InputGroup, Row, Col, Alert } from "react-bootstrap";
import { matchesSearch } from "@/lib/searchText";
import { fetchMedicamentsEnStock } from "@/components/MedicamentSearchSelect";

// Type pour un médicament
export interface IMedicament {
  _id: string;
  Designation: string;
  Reference?: string;
  CodeBarre?: string;
  PrixVente?: number;
  PrixVenteConditionnement?: number;
  PrixVenteUnite?: number;
  QteParConditionnement?: number;
  ConditionnementAchat?: string;
  UniteVente?: string;
  VenteParDetail?: boolean;
  StockDisponible?: number;
  SeuilAlert?: number; // Seuil d'alerte de stock (optionnel)
  SeuilCritique?: number; // Seuil critique de stock (optionnel)
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
  modeVente?: "DETAIL" | "BOITE";
  /** Ligne intégrée malgré un stock insuffisant : le stock deviendra négatif à l'encaissement. */
  stockInsuffisant?: boolean;
}

// Fonction pour déterminer le statut du stock
function getStockStatus(medicament: IMedicament): {
  status: 'normal' | 'alert' | 'critical' | 'out';
  color: string;
  icon: string;
  label: string;
} {
  const stock = medicament.StockDisponible || 0;
  const seuilAlert = medicament.SeuilAlert || 10; // Valeur par défaut
  const seuilCritique = medicament.SeuilCritique || 5; // Valeur par défaut

  if (stock === 0) {
    return { status: 'out', color: 'danger', icon: '🚫', label: 'Rupture' };
  } else if (stock <= seuilCritique) {
    return { status: 'critical', color: 'danger', icon: '⚠️', label: 'Critique' };
  } else if (stock <= seuilAlert) {
    return { status: 'alert', color: 'warning', icon: '⚡', label: 'Alerte' };
  } else {
    return { status: 'normal', color: 'success', icon: '✅', label: 'Normal' };
  }
}

// Composant de sélection de médicament avec recherche
interface MedicamentSelectProps {
  medicaments: IMedicament[];
  selectedId: string;
  selectedLabel?: string;
  onSelect: (medicament: IMedicament) => void;
}

function MedicamentSelect({ medicaments, selectedId, selectedLabel = "", onSelect }: MedicamentSelectProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  // Filtrer les médicaments selon la recherche (limiter à 50 résultats pour la performance INP)
  const filteredMedicaments = (searchTerm
    ? medicaments.filter(m =>
      matchesSearch(searchTerm, m.Designation, m.Reference, m.CodeBarre)
    )
    : medicaments).slice(0, 50);

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

  return (
    <div style={{ position: 'relative' }}>
      <Form.Control
        ref={inputRef}
        type="text"
        size="sm"
        placeholder="Rechercher un médicament..."
        value={searchTerm || (selectedMedicament?.Designation || (selectedId ? selectedLabel : ""))}
        onChange={handleInputChange}
        onFocus={() => setShowDropdown(true)}
        style={{ fontSize: '13px' }}
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
            filteredMedicaments.map((medicament) => {
              const stockStatus = getStockStatus(medicament);
              return (
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
                    <strong>{stockStatus.icon} {medicament.Designation}</strong>
                  </div>
                  {medicament.Reference && (
                    <div style={{ fontSize: '11px', color: '#6c757d' }}>
                      {stockStatus.icon} {medicament.Reference}
                    </div>
                  )}
                  {medicament.StockDisponible !== undefined && (
                    <div style={{ fontSize: '11px', color: stockStatus.color === 'danger' ? '#dc3545' : stockStatus.color === 'warning' ? '#ffc107' : stockStatus.color === 'success' ? '#28a745' : '#6c757d' }}>
                      {stockStatus.icon} {stockStatus.label}: {medicament.StockDisponible}
                    </div>
                  )}
                </div>
              );
            })
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

// Tous les montants doivent être des entiers
const toInt = (n: number) => Math.round(n || 0);

// Fonction utilitaire pour obtenir le prix unitaire selon le mode de vente
function getPrixUnitaire(medicament: IMedicament | undefined, mode: "DETAIL" | "BOITE"): number {
  if (!medicament) return 0;
  if (mode === "BOITE") return toInt(medicament.PrixVenteConditionnement || medicament.PrixVente || 0);
  return toInt(medicament.PrixVenteUnite || medicament.PrixVente || 0);
}

// Fonction pour créer une nouvelle ligne vide
function emptyLigne(medicament?: IMedicament): ILigneMedicament {
  const mode = medicament?.VenteParDetail === false ? "BOITE" : "DETAIL";
  const prix = getPrixUnitaire(medicament, mode);
  return {
    id: generateLineId(),
    medicamentId: medicament?._id || "",
    designation: medicament?.Designation || "",
    quantite: 1,
    posologie: "",
    prixUnitaire: prix,
    total: prix,
    paye: false,
    refuse: false,
    partAssurance: 0,
    partAssure: prix,
    payePar: "",
    payeLe: "",
    payeA: "",
    DATE: new Date().toISOString().split('T')[0], // Date du jour par défaut
    reference: medicament?.Reference || "", // Ajouter la référence du médicament
    modeVente: mode,
  };
}

type Props = {
  medicaments?: IMedicament[];
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

export default function TableMedicaments({ onLignesChange, tauxAssurance = 0, onTotauxChange, remise = 0, presetLines, externalResetKey = 0 }: Props) {
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

  // Charger les médicaments en stock au montage du composant (uniquement ceux qui ont du stock)
  useEffect(() => {
    fetchMedicamentsEnStock<IMedicament>()
      .then(setMedicamentsEnStock)
      .catch((error) => console.error("Erreur lors du chargement des médicaments en stock:", error));
  }, []);

  // Fonction de calcul des totaux selon la logique WLangage
  const calculerTotaux = useCallback(() => {
    let montantTotal = 0;
    let partAssurance = 0;
    let partAssure = 0;
    let montantRecu = 0;

    lignes.forEach(ligne => {
      const prixTotal = toInt(ligne.quantite * ligne.prixUnitaire);
      ligne.total = prixTotal;

      // SI COL_Refusé="" ALORS
      if (!ligne.refuse) {
        // COL_PartAssurance = (COL_PrixTotal * SAI_Taux_Assur) / 100
        ligne.partAssurance = toInt((prixTotal * tauxAssurance) / 100);
        // COL_PartAssure = COL_PrixTotal - COL_PartAssurance
        ligne.partAssure = toInt(prixTotal - ligne.partAssurance);
      } else {
        // SINON
        ligne.partAssurance = 0;
        ligne.partAssure = toInt(prixTotal);
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
      totalAPayerPatient = toInt(partAssure);
      // SAI_Reste_a_payer = SAI_Total_a_payer_Patient
      resteAPayer = totalAPayerPatient;
    } else {
      // SINON
      // SAI_Total_a_payer_Patient = SAI_Partassuré - SAI_REMISE
      totalAPayerPatient = toInt(Math.max(0, partAssure - remise));
      // SAI_Reste_a_payer = SAI_Total_a_payer_Patient
      resteAPayer = totalAPayerPatient;
    }

    // Notifier le parent des nouveaux totaux
    if (onTotauxChange) {
      onTotauxChange({
        montantTotal: toInt(montantTotal),
        partAssurance: toInt(partAssurance),
        partAssure: toInt(partAssure),
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
    const qteParCond = medicament.QteParConditionnement || 1;
    const mode = medicament.VenteParDetail === false ? "BOITE" : "DETAIL";
    const prixUnitaire = getPrixUnitaire(medicament, mode);
    const quantite = 1;
    const total = prixUnitaire * quantite;

    updateLigne(id, {
      medicamentId: medicament._id,
      designation: medicament.Designation,
      prixUnitaire: prixUnitaire,
      quantite: quantite,
      total: toInt(total),
      reference: medicament.Reference || medicament.CodeBarre || "", // Utiliser la référence du médicament (ex: RIV-3)
      modeVente: mode,
      // Médicament choisi dans la liste « en stock » : la ligne n'est plus marquée stock insuffisant
      stockInsuffisant: false,
      // Calculer les parts assurance/patient selon le taux
      partAssurance: toInt((total * tauxAssurance) / 100),
      partAssure: toInt(total - ((total * tauxAssurance) / 100))
    });

    // Recalculer les totaux généraux
    setTimeout(() => calculerTotaux(), 0);
  };

  // Mettre à jour la quantité et recalculer le total
  const handleQuantiteChange = (id: string, quantite: number) => {
    const ligne = lignes.find(l => l.id === id);
    if (ligne) {
      // Plafond au stock disponible (hors lignes déjà payées, dont la quantité est déjà sortie du stock)
      const medicament = medicamentsEnStock.find(m => m._id === ligne.medicamentId);
      if (medicament && !ligne.payeLe && !ligne.stockInsuffisant) {
        const qteParCond = ligne.modeVente === "BOITE" ? (medicament.QteParConditionnement || 1) : 1;
        const maxSaisissable = Math.floor((medicament.StockDisponible || 0) / qteParCond);
        if (quantite > maxSaisissable) {
          setErrorMsg(`Stock insuffisant pour ${medicament.Designation} : ${maxSaisissable} ${ligne.modeVente === "BOITE" ? "boîte(s)" : "unité(s)"} disponible(s).`);
          quantite = Math.max(1, maxSaisissable);
        } else {
          setErrorMsg(null);
        }
      }
      const newTotal = toInt(quantite * ligne.prixUnitaire);
      updateLigne(id, {
        quantite,
        total: newTotal,
        // Recalculer les parts assurance/patient
        partAssurance: !ligne.refuse ? toInt((newTotal * tauxAssurance) / 100) : 0,
        partAssure: !ligne.refuse ? toInt(newTotal - ((newTotal * tauxAssurance) / 100)) : newTotal
      });
      // Recalculer les totaux généraux
      setTimeout(() => calculerTotaux(), 0);
    }
  };

  // Changer le mode de vente (détail / boîte) et recalculer le prix
  const handleModeVenteChange = (id: string, mode: "DETAIL" | "BOITE") => {
    const ligne = lignes.find(l => l.id === id);
    const medicament = medicamentsEnStock.find(m => m._id === ligne?.medicamentId);
    if (ligne && medicament) {
      const prix = getPrixUnitaire(medicament, mode);
      const qteParCond = medicament.QteParConditionnement || 1;
      const newQuantite = mode === "BOITE" && ligne.modeVente === "DETAIL" && qteParCond > 1
        ? Math.max(1, Math.ceil(ligne.quantite / qteParCond))
        : (mode === "DETAIL" && ligne.modeVente === "BOITE" ? Math.max(1, ligne.quantite * qteParCond) : ligne.quantite);
      const newTotal = toInt(newQuantite * prix);
      updateLigne(id, {
        modeVente: mode,
        prixUnitaire: prix,
        quantite: newQuantite,
        total: newTotal,
        partAssurance: !ligne.refuse ? toInt((newTotal * tauxAssurance) / 100) : 0,
        partAssure: !ligne.refuse ? toInt(newTotal - ((newTotal * tauxAssurance) / 100)) : newTotal
      });
      setTimeout(() => calculerTotaux(), 0);
    }
  };

  // Lignes dont le prix a été modifié à la main (le catalogue n'est mis à jour que pour celles-ci)
  const [prixModifies, setPrixModifies] = useState<Set<string>>(new Set());

  // Saisie du prix unitaire : chiffres uniquement, total et parts recalculés comme pour la quantité
  const handlePrixChange = (id: string, valeur: string) => {
    const ligne = lignes.find(l => l.id === id);
    if (!ligne) return;
    const prixUnitaire = toInt(Number(valeur.replace(/\D/g, "")) || 0);
    const newTotal = toInt(ligne.quantite * prixUnitaire);
    updateLigne(id, {
      prixUnitaire,
      total: newTotal,
      partAssurance: !ligne.refuse ? toInt((newTotal * tauxAssurance) / 100) : 0,
      partAssure: !ligne.refuse ? toInt(newTotal - ((newTotal * tauxAssurance) / 100)) : newTotal
    });
    setPrixModifies(prev => new Set(prev).add(id));
    setTimeout(() => calculerTotaux(), 0);
  };

  // En quittant le champ : le prix modifié (> 0) devient le prix de vente du catalogue.
  // Uniquement en mode Détail : en mode Boîte le prix saisi est un prix de conditionnement.
  const handlePrixBlur = async (id: string) => {
    if (!prixModifies.has(id)) return;
    setPrixModifies(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    const ligne = lignes.find(l => l.id === id);
    if (!ligne?.medicamentId || !(ligne.prixUnitaire > 0) || ligne.modeVente === "BOITE") return;
    try {
      const res = await fetch(`/api/medicaments/${ligne.medicamentId}/prix-vente`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ PrixVente: toInt(ligne.prixUnitaire) }),
      });
      if (!res.ok) throw new Error();
      // Le prix connu localement suit le catalogue (utile si on rebascule en mode Détail)
      setMedicamentsEnStock(prev => prev.map(m => m._id === ligne.medicamentId ? { ...m, PrixVente: toInt(ligne.prixUnitaire) } : m));
    } catch {
      setErrorMsg(`Le prix de « ${ligne.designation} » n'a pas pu être enregistré dans le catalogue. Il reste appliqué à cette vente.`);
    }
  };

  // Lignes avec un médicament mais sans prix (hors lignes refusées)
  const lignesSansPrix = lignes.filter(l => l.medicamentId && !l.refuse && !(l.prixUnitaire > 0));

  // Mettre à jour la date
  const handleDateChange = (id: string, date: string) => {
    updateLigne(id, { DATE: date });
  };

  // Bascher l'état de paiement
  const togglePaye = useCallback((id: string) => {
    setLignes(prev => {
      const newLignes = prev.map(ligne => {
        if (ligne.id === id) {
          const nextPaye = !ligne.paye;
          const updatedLigne = { ...ligne, paye: nextPaye, refuse: nextPaye ? false : ligne.refuse };

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

  // Sélectionner/désélectionner "Payé" pour toutes les lignes
  const toggleAllPaye = useCallback(() => {
    setLignes(prev => {
      const toutesPayees = prev.length > 0 && prev.every(l => l.paye);
      const newPaye = !toutesPayees;
      return prev.map(ligne => {
        const updatedLigne = { ...ligne, paye: newPaye, refuse: newPaye ? false : ligne.refuse };
        if (newPaye && !updatedLigne.payePar) {
          updatedLigne.payePar = currentUser;
          updatedLigne.payeLe = new Date().toLocaleDateString();
          updatedLigne.payeA = new Date().toLocaleTimeString();
        } else if (!newPaye) {
          updatedLigne.payePar = "";
          updatedLigne.payeLe = "";
          updatedLigne.payeA = "";
        }
        return updatedLigne;
      });
    });
  }, [currentUser]);

  // Bascher l'état de refus
  const toggleRefuse = useCallback((id: string) => {
    setLignes(prev => {
      const newLignes = prev.map(ligne => {
        if (ligne.id === id) {
          const nextRefuse = !ligne.refuse;
          const updatedLigne = { ...ligne, refuse: nextRefuse, paye: nextRefuse ? false : ligne.paye };

          // Recalculer les parts assurance/patient immédiatement
          const prixTotal = toInt(updatedLigne.quantite * updatedLigne.prixUnitaire);
          if (!updatedLigne.refuse) {
            updatedLigne.partAssurance = toInt((prixTotal * tauxAssurance) / 100);
            updatedLigne.partAssure = toInt(prixTotal - updatedLigne.partAssurance);
          } else {
            updatedLigne.partAssurance = 0;
            updatedLigne.partAssure = toInt(prixTotal);
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

      {lignesSansPrix.length > 0 && (
        <Alert variant="warning" className="mb-2 py-2">
          <small>
            <i className="bi bi-exclamation-triangle me-2"></i>
            Prix unitaire à 0 pour : {lignesSansPrix.map(l => l.designation).join(", ")}. Ces lignes seront encaissées 0 FCFA si le prix n'est pas saisi.
          </small>
        </Alert>
      )}

      <div className="table-responsive" style={{ maxHeight: "60vh", overflow: "auto" }}>
        <Table bordered hover size="sm" className="mb-0">
          <thead className="table-light" style={{ position: "sticky", top: 0, zIndex: 2 }}>

            <tr>
              <th style={{ width: '5%' }}>#</th>
              <th style={{ width: '120px' }}>Date</th>
              <th style={{ width: '30%' }}>Médicament</th>
              <th style={{ width: '12%' }}>Mode</th>
              <th style={{ width: '10%' }}>Qté</th>
              <th style={{ width: '13%' }}>P.U (FCFA)</th>
              <th style={{ width: '15%' }}>Total (FCFA)</th>
              <th style={{ width: '10%', textAlign: 'center' }}>
                <div className="d-flex flex-column align-items-center">
                  <span>Payé</span>
                  <Form.Check
                    type="checkbox"
                    checked={lignes.length > 0 && lignes.every(l => l.paye)}
                    onChange={toggleAllPaye}
                    title="Tout sélectionner / désélectionner"
                  />
                </div>
              </th>
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
                  <MedicamentSelect
                    medicaments={medicamentsEnStock}
                    selectedId={ligne.medicamentId}
                    selectedLabel={ligne.designation}
                    onSelect={(medicament: IMedicament) => handleSelectMedicament(ligne.id, medicament)}
                  />
                  {ligne.stockInsuffisant && (
                    <span
                      className="badge bg-warning text-dark mt-1"
                      title="Intégrée malgré un stock insuffisant : la quantité manquante sera due au patient"
                    >
                      Stock insuffisant
                    </span>
                  )}
                </td>
                <td>
                  <Form.Select
                    size="sm"
                    value={ligne.modeVente || "DETAIL"}
                    onChange={(e) => handleModeVenteChange(ligne.id, e.target.value as "DETAIL" | "BOITE")}
                    disabled={!ligne.medicamentId}
                  >
                    <option value="DETAIL">Détail</option>
                    <option value="BOITE">Boîte</option>
                  </Form.Select>
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
                <td>
                  <Form.Control
                    type="text"
                    inputMode="numeric"
                    value={ligne.prixUnitaire ? String(toInt(ligne.prixUnitaire)) : ""}
                    onChange={(e) => handlePrixChange(ligne.id, e.target.value)}
                    onBlur={() => handlePrixBlur(ligne.id)}
                    placeholder="0"
                    size="sm"
                    className={`text-end ${ligne.medicamentId && !ligne.refuse && !(ligne.prixUnitaire > 0) ? 'border-warning' : ''}`}
                    disabled={!ligne.medicamentId}
                    title={!ligne.medicamentId ? "Sélectionnez d'abord un médicament" : ligne.modeVente === "BOITE" ? "Prix de la boîte (FCFA) — appliqué à cette vente uniquement" : "Prix de vente unitaire (FCFA)"}
                    aria-label={`Prix unitaire de ${ligne.designation || "la ligne"}`}
                  />
                </td>
                <td className="text-end fw-bold">{toInt(ligne.total).toLocaleString()}</td>
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
