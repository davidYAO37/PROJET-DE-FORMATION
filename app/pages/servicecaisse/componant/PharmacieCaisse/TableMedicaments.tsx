"use client";

import React, { useState, useEffect, useRef } from "react";
import { Table, Form, Button, InputGroup, Row, Col, Alert } from "react-bootstrap";

// Type pour un médicament
export interface IMedicament {
  _id: string;
  Designation: string;
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
  paye: boolean;
  refuse: boolean;
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Trouver le médicament sélectionné
  const selectedMedicament = medicaments.find(m => m._id === selectedId);
  const displayValue = selectedMedicament ? selectedMedicament.Designation : "";

  // Filtrer les médicaments selon la recherche
  const filteredMedicaments = searchTerm
    ? medicaments.filter(m =>
        m.Designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.CodeBarre?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // Fermer le dropdown si on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
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
    <div className="position-relative">
      <Form.Control
        ref={inputRef}
        type="text"
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
          className="position-absolute bg-white border rounded shadow-lg"
          style={{
            width: '100%',
            maxHeight: '300px',
            overflowY: 'auto',
            zIndex: 1000,
            marginTop: '2px'
          }}
        >
          {filteredMedicaments.length === 0 ? (
            <div className="p-2 text-muted">Aucun médicament trouvé</div>
          ) : (
            <div className="list-group list-group-flush">
              {filteredMedicaments.map((medicament) => (
                <button
                  key={medicament._id}
                  type="button"
                  className={`list-group-item list-group-item-action ${medicament._id === selectedId ? 'active' : ''}`}
                  onClick={() => handleSelect(medicament)}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-bold">{medicament.Designation}</div>
                      {medicament.CodeBarre && (
                        <small className="text-muted">Code: {medicament.CodeBarre}</small>
                      )}
                    </div>
                    {medicament.PrixVente && (
                      <span className="badge bg-primary rounded-pill">
                        {medicament.PrixVente.toLocaleString()} FCFA
                      </span>
                    )}
                  </div>
                </button>
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
    paye: false,
    refuse: false,
  };
}

type Props = {
  medicaments: IMedicament[];
  onLignesChange?: (lignes: ILigneMedicament[]) => void;
};

export default function TableMedicaments({ medicaments, onLignesChange }: Props) {
  const [lignes, setLignes] = useState<ILigneMedicament[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Notifier le parent des changements
  useEffect(() => {
    if (onLignesChange) {
      onLignesChange(lignes);
    }
  }, [lignes, onLignesChange]);

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
    updateLigne(id, {
      medicamentId: medicament._id,
      designation: medicament.Designation,
      prixUnitaire: medicament.PrixVente || 0,
      total: medicament.PrixVente || 0,
      quantite: 1
    });
  };

  // Mettre à jour la quantité et recalculer le total
  const handleQuantiteChange = (id: string, quantite: number) => {
    const ligne = lignes.find(l => l.id === id);
    if (ligne) {
      updateLigne(id, {
        quantite,
        total: quantite * ligne.prixUnitaire
      });
    }
  };

  // Bascher l'état de paiement
  const togglePaye = (id: string) => {
    const ligne = lignes.find(l => l.id === id);
    if (ligne) {
      updateLigne(id, { paye: !ligne.paye });
    }
  };

  // Bascher l'état de refus
  const toggleRefuse = (id: string) => {
    const ligne = lignes.find(l => l.id === id);
    if (ligne) {
      updateLigne(id, { refuse: !ligne.refuse });
    }
  };

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
        <table className="table table-bordered table-sm">
          <thead className="table-dark">
            <tr>
              <th style={{ width: '5%' }}>#</th>
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
                  <SearchableMedicamentSelect
                    medicaments={medicaments}
                    selectedId={ligne.medicamentId}
                    onSelect={(medicament) => handleSelectMedicament(ligne.id, medicament)}
                  />
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
                <td colSpan={8} className="text-center text-muted py-3">
                  Aucun médicament ajouté. Cliquez sur "Ajouter un médicament" pour commencer.
                </td>
              </tr>
            )}
          </tbody>
          {lignes.length > 0 && (
            <tfoot>
              <tr className="table-secondary">
                <td colSpan={4} className="text-end fw-bold">Total général :</td>
                <td className="text-end fw-bold">{totalGeneral.toLocaleString()}</td>
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
