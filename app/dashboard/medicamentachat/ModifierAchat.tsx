"use client";

import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, Form, Row, Col, Table, Alert } from "react-bootstrap";
import { Pharmacie } from "@/types/pharmacie";

// Type pour une ligne d'achat
interface LigneAchat {
  id: string;
  medicament: Pharmacie | null;
  quantite: number;
  prixAchat: number;
  taxe: number;
  reference: string;
  prixVente: number;
}

// Composant de recherche de médicament avec autocomplétion (même style que SearchableActeSelect)
interface SearchableMedicamentSelectProps {
  medicaments: Pharmacie[];
  selectedId: string;
  onSelect: (medicamentId: string) => void;
}

function SearchableMedicamentSelect({
  medicaments,
  selectedId,
  onSelect,
}: SearchableMedicamentSelectProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  // Trouver le médicament sélectionné
  const selectedMedicament = medicaments.find((m) => m._id === selectedId);
  const displayValue = selectedMedicament
    ? selectedMedicament.Designation || ""
    : "";

  // Filtrer les médicaments selon la recherche - Si pas de recherche, afficher tous les médicaments
  const allFilteredMedicaments = searchTerm
    ? medicaments.filter(
        (m) =>
          m.Designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.Reference?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : medicaments; // Afficher tous les médicaments si pas de recherche

  const filteredMedicaments = allFilteredMedicaments.slice(0, 50);

  // Calculer la position du dropdown
  useEffect(() => {
    if (showDropdown && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 5, // Position en dessous de l'input
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

  const handleSelect = (medicamentId: string) => {
    onSelect(medicamentId);
    setSearchTerm("");
    setShowDropdown(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <Form.Control
        ref={inputRef}
        type="text"
        size="sm"
        placeholder="Rechercher un médicament..."
        value={showDropdown ? searchTerm : displayValue}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        style={{
          fontSize: "13px",
        }}
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
          {searchTerm && (
            <div style={{ padding: '4px 8px', fontSize: '11px', color: '#6c757d', borderBottom: '1px solid #f8f9fa', backgroundColor: '#f8f9fa' }}>
              {allFilteredMedicaments.length} résultat
              {allFilteredMedicaments.length > 1 ? "s" : ""} trouvé
              {allFilteredMedicaments.length > 1 ? "s" : ""}
            </div>
          )}
          {filteredMedicaments.length === 0 ? (
            <div style={{ padding: '8px', color: '#6c757d', fontSize: '13px', textAlign: 'center' }}>
              Aucun médicament trouvé
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredMedicaments.map((medicament) => (
                <div
                  key={medicament._id || `medicament-${medicament.Reference}`}
                  onClick={() => handleSelect(medicament._id || "")}
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
                  <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                    {medicament.Designation}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '11px' }}>
                    {medicament.Reference && (
                      <span style={{ color: '#6c757d' }}>
                        � {medicament.Reference}
                      </span>
                    )}
                    {medicament.PrixAchat && (
                      <span style={{ color: '#0d6efd' }}>
                        💰 Achat: {medicament.PrixAchat} FCFA
                      </span>
                    )}
                    {medicament.PrixVente && (
                      <span style={{ color: '#198754' }}>
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

type Props = {
  show: boolean;
  onHide: () => void;
  Approvisionnement: any; // L'approvisionnement à modifier
  onSave: (a: any) => void;
  medicaments: Pharmacie[]; // Liste des médicaments disponibles
};

export default function ModifierAchat({
  show,
  onHide,
  Approvisionnement,
  onSave,
  medicaments,
}: Props) {
  const [lignes, setLignes] = useState<LigneAchat[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [observation, setObservation] = useState("");
  
  // États pour les totaux (selon la logique WinDev)
  const [totalHT, setTotalHT] = useState(0);
  const [totalTVA, setTotalTVA] = useState(0);
  const [montantTTC, setMontantTTC] = useState(0);

  // Fonction pour ajouter une nouvelle ligne
  const ajouterLigne = () => {
    setLignes((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        medicament: null,
        quantite: 1,
        prixAchat: 0,
        taxe: 0,
        reference: "",
        prixVente: 0,
      },
    ]);
  };

  // Fonction pour supprimer une ligne
  const supprimerLigne = (id: string) => {
    setLignes((prev) => prev.filter((l) => l.id !== id));
  };

  // Fonction pour mettre à jour une ligne
  const updateLigne = (id: string, updates: Partial<LigneAchat>) => {
    setLignes((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    );
  };

  // Calcul du total pour une ligne
  const calculerTotalLigne = (ligne: LigneAchat) => {
    return ligne.quantite * ligne.prixAchat + ligne.taxe;
  };

  // PROCÉDURE CalculeTotal() - Implémentation de la logique WinDev
  const CalculeTotal = () => {
    // RAZ des totaux
    let newTotalHT = 0;
    let newTotalTVA = 0;
    let newMontantTTC = 0;

    // Parcours des lignes de la commande
    lignes.forEach((ligne) => {
      // Ajoute la taxe de la ligne au total TVA
      newTotalTVA += ligne.taxe;
      
      // Ajoute le total de la ligne au montant TTC
      newMontantTTC += calculerTotalLigne(ligne);
    });
    
    // Calcule le total HT = TTC - TVA
    newTotalHT = newMontantTTC - newTotalTVA;

    // Met à jour les états
    setTotalHT(newTotalHT);
    setTotalTVA(newTotalTVA);
    setMontantTTC(newMontantTTC);
  };

  // Recalculer les totaux à chaque modification des lignes
  useEffect(() => {
    CalculeTotal();
  }, [lignes]);

  // Charger les entrées de stock existantes quand l'approvisionnement change
  useEffect(() => {
    if (Approvisionnement && show) {
      chargerEntreesStock();
    }
  }, [Approvisionnement, show]);

  // Fonction pour charger les entrées de stock de l'approvisionnement
  const chargerEntreesStock = async () => {
    if (!Approvisionnement?._id) return;
    
    try {
      const res = await fetch(`/api/gestionstock/entrestock?idappro=${Approvisionnement._id}`);
      if (res.ok) {
        const entrees = await res.json();
        const lignesChargees = entrees.map((entree: any) => ({
          id: entree._id,
          medicament: medicaments.find(m => m._id === entree.IDMEDICAMENT) || null,
          quantite: entree.Quantite || 0,
          prixAchat: entree.PrixAchat || 0,
          taxe: entree.TVAEntree || 0,
          reference: entree.Reference || "",
          prixVente: entree.PrixVente || 0,
        }));
        setLignes(lignesChargees);
        setObservation(Approvisionnement.Observations || "");
        setTotalHT(Approvisionnement.PrixHT || 0);
        setTotalTVA(Approvisionnement.tVAApro || 0);
        setMontantTTC(Approvisionnement.MontantTTC || 0);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des entrées de stock:", err);
    }
  };

  // Calcul du total général (pour compatibilité)
  const totalGeneral = montantTTC;

  // Gestion de la sélection d'un médicament
  const handleSelectMedicament = (ligneId: string, medicamentId: string) => {
    const medicament = medicaments.find((m) => m._id === medicamentId);
    if (medicament) {
      updateLigne(ligneId, {
        medicament,
        reference: medicament.Reference || "",
        prixAchat: medicament.PrixAchat || 0,
        prixVente: medicament.PrixVente || 0,
      });
    }
  };

  // Soumission du formulaire - Implémentation logique WinDev de modification
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Vérifier qu'il y a au moins une ligne valide
      const lignesValides = lignes.filter(
        (l) => l.medicament && l.quantite > 0,
      );

      if (lignesValides.length === 0) {
        throw new Error("Veuillez ajouter au moins un médicament");
      }

      const utilisateur = localStorage.getItem("nom_utilisateur") || "Utilisateur";
      const dateDuJour = new Date().toISOString();

      // 1. MODIFIER L'APPROVISIONNEMENT
      const approvisionnementModifie = {
        DateAppro: dateDuJour,
        PrixHT: totalHT,
        tVAApro: totalTVA,
        MontantTTC: montantTTC,
        SaisiLe: dateDuJour,
        SaisiPar: utilisateur,
        Observations: observation,
      };

      const resAppro = await fetch(`/api/approvisionnement/${Approvisionnement._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(approvisionnementModifie),
      });

      if (!resAppro.ok) throw new Error("Erreur lors de la modification de l'approvisionnement");

      // 2. SUPPRIMER TOUTES LES ANCIENNES ENTRÉES EN STOCK ET RESTAURER LES QUANTITÉS
      const resAnciennesEntrees = await fetch(`/api/gestionstock/entrestock?idappro=${Approvisionnement._id}`);
      if (resAnciennesEntrees.ok) {
        const anciennesEntrees = await resAnciennesEntrees.json();
        
        for (const ancienneEntree of anciennesEntrees) {
          // Rechercher dans le stock le même article
          const resStock = await fetch(`/api/gestionstock/stock/reference?reference=${encodeURIComponent(ancienneEntree.Reference)}`);
          if (resStock.ok) {
            const stock = await resStock.json();
            if (stock && stock._id) {
              // Restaurer les quantités en stock (retirer les anciennes quantités)
              const nouvelleQte = (stock.QteEnStock || 0) - (ancienneEntree.Quantite || 0);
              const resUpdateStock = await fetch(`/api/gestionstock/stock/${stock._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  QteEnStock: Math.abs(nouvelleQte), // Valeur absolue comme dans WinDev
                  AuteurModif: utilisateur,
                  DateModif: dateDuJour,
                }),
              });

              if (!resUpdateStock.ok) {
                console.warn("Erreur lors de la restauration du stock:", ancienneEntree.Reference);
              }
            }
          }

          // Supprimer l'ancienne entrée
          const resDeleteEntree = await fetch(`/api/gestionstock/entrestock/${ancienneEntree._id}`, {
            method: "DELETE",
          });

          if (!resDeleteEntree.ok) {
            console.warn("Erreur lors de la suppression de l'ancienne entrée:", ancienneEntree.Reference);
          }
        }
      }

      // 3. AJOUTER LES NOUVELLES LIGNES D'ENTRÉE EN STOCK
      for (const ligne of lignesValides) {
        const entreeStock = {
          DateAppro: dateDuJour,
          IDAppro: Approvisionnement._id,
          Reference: ligne.reference,
          IDMEDICAMENT: ligne.medicament?._id,
          Medicament: ligne.medicament?.Designation,
          Quantite: ligne.quantite,
          PrixAchat: ligne.prixAchat,
          PrixVente: ligne.prixVente,
          PRIXTHT: ligne.quantite * ligne.prixAchat,
          TVAEntree: ligne.taxe,
          MontantTTCE: calculerTotalLigne(ligne),
          Observations: observation,
          SaisiLe: dateDuJour,
          SaisiPar: utilisateur,
        };

        // Ajouter la nouvelle entrée en stock
        const resEntree = await fetch("/api/gestionstock/entrestock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(entreeStock),
        });

        if (!resEntree.ok) throw new Error("Erreur lors de l'ajout de la nouvelle entrée en stock");
      }

      // 4. MODIFICATION DE L'ARTICLE EN STOCK
      for (const ligne of lignesValides) {
        // Vérifier si le médicament existe déjà en stock
        const resStock = await fetch(`/api/gestionstock/stock/reference?reference=${encodeURIComponent(ligne.reference)}`);
        let stockExistant = null;
        
        if (resStock.ok) {
          stockExistant = await resStock.json();
        }

        if (stockExistant && stockExistant._id) {
          // Produit en plus en stock
          const resUpdateStock = await fetch(`/api/gestionstock/stock/${stockExistant._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              QteEnStock: (stockExistant.QteEnStock || 0) + ligne.quantite,
              AuteurModif: utilisateur,
              DateModif: dateDuJour,
            }),
          });

          if (!resUpdateStock.ok) {
            console.warn("Erreur lors de la mise à jour du stock:", ligne.reference);
          }
        } else {
          // Ajout immédiat de l'article en stock
          const nouveauStock = {
            AuteurModif: utilisateur,
            DateModif: dateDuJour,
            QteEnStock: ligne.quantite,
            Reference: ligne.reference,
            Medicament: ligne.medicament?.Designation,
            IDMEDICAMENT: ligne.medicament?._id,
          };

          const resAddStock = await fetch("/api/gestionstock/stock", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nouveauStock),
          });

          if (!resAddStock.ok) {
            console.warn("Erreur lors de l'ajout au stock:", ligne.reference);
          }
        }
      }

      // 5. MODIFICATION DE L'ARTICLE DE CRÉATION (PHARMACIE)
      for (const ligne of lignesValides) {
        if (ligne.medicament?._id) {
          const resUpdatePharmacie = await fetch(`/api/medicaments/${ligne.medicament._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              PrixAchat: ligne.prixAchat,
              PrixVente: ligne.prixVente,
            }),
          });

          if (!resUpdatePharmacie.ok) {
            console.warn("Erreur lors de la mise à jour du médicament:", ligne.medicament.Designation);
          }
        }
      }

      // Succès
      onSave(approvisionnementModifie);
      onHide();
      setLignes([]); // Réinitialiser les lignes après la modification
      
      // Message de succès (équivalent de Info())
      alert("Approvisionnement Modifié avec succès");
      
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  // Réinitialiser le formulaire à la fermeture
  useEffect(() => {
    if (!show) {
      setLignes([]);
      setError("");
      setObservation("");
      setTotalHT(0);
      setTotalTVA(0);
      setMontantTTC(0);
    }
  }, [show]);

  return (
    <Modal show={show} onHide={onHide} size="xl">
      <Modal.Header closeButton>
        <Modal.Title>Modification de l'approvisionnement</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Row className="mb-2">
            <Col className="text-end">
              <Button
                variant="primary"
                onClick={ajouterLigne}
                disabled={loading}
                className="mt-2"
              >
                + Ajouter une ligne
              </Button>
            </Col>
          </Row>

          {error && <Alert variant="danger">{error}</Alert>}

          <div className="table-responsive"style={{ maxHeight: "60vh", overflow: "auto" }}>
            <Table bordered hover size="sm" className="mb-0">
              <thead
                className="table-light"
                style={{ position: "sticky", top: 0, zIndex: 2 }}
              >
                <tr className="text-center">
                  <th style={{ width: "35%" }}>Médicament</th>
                  <th style={{ width: "15%" }}>Référence</th>
                  <th style={{ width: "12%" }}>Prix de vente</th>
                  <th style={{ width: "12%" }}>Prix d'achat</th>
                  <th style={{ width: "10%" }}>Qyé Achetée</th>
                  <th style={{ width: "12%" }}>Taxe</th>
                  <th style={{ width: "12%" }}>Total</th>
                  <th style={{ width: "4%" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((ligne) => (
                  <tr key={ligne.id}>
                    <td>
                      <SearchableMedicamentSelect
                        medicaments={medicaments}
                        selectedId={ligne.medicament?._id || ""}
                        onSelect={(medicamentId) =>
                          handleSelectMedicament(ligne.id, medicamentId)
                        }
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="text"
                        value={ligne.reference}
                        onChange={(e) =>
                          updateLigne(ligne.id, { reference: e.target.value })
                        }
                        size="sm"
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="number"
                        value={ligne.prixVente}
                        onChange={(e) =>
                          updateLigne(ligne.id, {
                            prixVente: Number(e.target.value) || 0,
                          })
                        }
                        size="sm"
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="number"
                        value={ligne.prixAchat}
                        onChange={(e) =>
                          updateLigne(ligne.id, {
                            prixAchat: Number(e.target.value) || 0,
                          })
                        }
                        size="sm"
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="number"
                        min="1"
                        value={ligne.quantite}
                        onChange={(e) =>
                          updateLigne(ligne.id, {
                            quantite: Number(e.target.value) || 1,
                          })
                        }
                        size="sm"
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="number"
                        value={ligne.taxe}
                        onChange={(e) =>
                          updateLigne(ligne.id, {
                            taxe: Number(e.target.value) || 0,
                          })
                        }
                        size="sm"
                      />
                    </td>
                    <td className="text-end fw-bold">
                      {calculerTotalLigne(ligne).toFixed(2)}
                    </td>
                    <td className="text-center">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => supprimerLigne(ligne.id)}
                        disabled={loading}
                        title="Supprimer cette ligne"
                      >
                        ×
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="table-secondary">
                  <td colSpan={5} className="text-end fw-bold">
                    Total général :
                  </td>
                  <td colSpan={2} className="fw-bold">
                    {totalGeneral.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </Table>
          </div>

          {lignes.length === 0 && (
            <div className="text-center text-muted py-3">
              Aucun médicament ajouté. Cliquez sur "+ Ajouter une ligne" pour
              commencer.
            </div>
          )}
          {/* TOTAL / RENSEIGNEMENT CLINIQUE*/}
          <Row>
            <Col md={7}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className=" p-0 me-1">
                  <Form.Group>
                    <Form.Label>Total TVA</Form.Label>
                    <Form.Control 
                      type="number" 
                      value={totalTVA.toFixed(2)} 
                      readOnly 
                      className="bg-light"
                    />
                  </Form.Group>
                </div>

                <div className=" p-0 me-1">
                  <Form.Group>
                    <Form.Label>Total HT</Form.Label>
                    <Form.Control 
                      type="number" 
                      value={totalHT.toFixed(2)} 
                      readOnly 
                      className="bg-light"
                    />
                  </Form.Group>
                </div>

                <div className=" p-0 me-1">
                  <Form.Group>
                    <Form.Label>Total TTC</Form.Label>
                    <Form.Control 
                      type="number" 
                      value={montantTTC.toFixed(2)} 
                      readOnly 
                      className="bg-light"
                    />
                  </Form.Group>
                </div>
              </div>
            </Col>
            <Col md={5}>
              <Form.Group >
                <Form.Label>Observation</Form.Label>
                <Form.Control
                className=" bg-info-subtle"
                  as="textarea"
                  rows={2}
                  placeholder="Ajouter une observation liée à cet achat"
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Annuler
          </Button>
          <Button
            variant="success"
            type="submit"
            disabled={loading || lignes.length === 0}
          >
            {loading ? "Enregistrement..." : "Enregistrer l'achat"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
