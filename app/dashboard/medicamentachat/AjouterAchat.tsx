"use client";

import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, Form, Row, Col, Table, Alert } from "react-bootstrap";
import { Pharmacie } from "@/types/pharmacie";

// Type pour une ligne d'achat
interface StockInfo {
  QteEnStock: number;
  QteMinimum: number;
  QteMaximum: number;
  QteStockVirtuel: number;
}

interface LigneAchat {
  id: string;
  medicament: Pharmacie | null;
  quantite: number;
  prixAchat: number;
  taxe: number;
  reference: string;
  prixVente: number;
  stockInfo: StockInfo | null;
  qteMinimum: number;
  qteMaximum: number;
  datePeremption: string;
  numeroLot: string;
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
  onAdd: (achat: any) => void;
  medicaments: Pharmacie[]; // Liste des médicaments disponibles
};

export default function AjouterAchat({
  show,
  onHide,
  onAdd,
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
        stockInfo: null,
        qteMinimum: 0,
        qteMaximum: 0,
        datePeremption: "",
        numeroLot: "",
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

  // Calcul du total général (pour compatibilité)
  const totalGeneral = montantTTC;

  // Gestion de la sélection d'un médicament
  const handleSelectMedicament = async (ligneId: string, medicamentId: string) => {
    const medicament = medicaments.find((m) => m._id === medicamentId);
    if (medicament) {
      updateLigne(ligneId, {
        medicament,
        reference: medicament.Reference || "",
        prixAchat: medicament.PrixAchat || 0,
        prixVente: medicament.PrixVente || 0,
        stockInfo: null,
        qteMinimum: 0,
        qteMaximum: 0,
        datePeremption: "",
        numeroLot: "",
      });
      // Charger le stock actuel du médicament
      try {
        const res = await fetch(`/api/stock?IDMEDICAMENT=${medicamentId}`);
        if (res.ok) {
          const data = await res.json();
          const stock = Array.isArray(data) && data.length > 0 ? data[0] : null;
          updateLigne(ligneId, {
            stockInfo: stock
              ? {
                  QteEnStock: stock.QteEnStock ?? 0,
                  QteMinimum: stock.QteMinimum ?? 0,
                  QteMaximum: stock.QteMaximum ?? 0,
                  QteStockVirtuel: stock.QteStockVirtuel ?? 0,
                }
              : null,
            qteMinimum: stock?.QteMinimum ?? 0,
            qteMaximum: stock?.QteMaximum ?? 0,
          });
        }
      } catch (err) {
        console.error("Erreur chargement stock médicament:", err);
      }
    }
  };

  // Soumission du formulaire - Implémentation logique WinDev
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

      // 1. AJOUTER UNE NOUVELLE COMMANDE (APPROVISIONNEMENT)
      const approvisionnement = {
        DateAppro: dateDuJour,
        PrixHT: totalHT,
        tVAApro: totalTVA,
        MontantTTC: montantTTC,
        SaisiLe: dateDuJour,
        SaisiPar: utilisateur,
        Observations: observation,
      };

      // Créer l'approvisionnement
      const resAppro = await fetch("/api/approvisionnement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(approvisionnement),
      });

      if (!resAppro.ok) throw new Error("Erreur lors de la création de l'approvisionnement");
      const approvisionnementCree = await resAppro.json();
      const idAppro = approvisionnementCree._id;

      // 2. AJOUTE LES LIGNES DE L'ENTRÉE EN STOCK
      for (const ligne of lignesValides) {
        const entreeStock = {
          DateAppro: dateDuJour,
          IDAppro: idAppro,
          Reference: ligne.reference,
          IDMEDICAMENT: ligne.medicament?._id,
          Medicament: ligne.medicament?.Designation,
          Quantite: ligne.quantite,
          PrixAchat: ligne.prixAchat,
          PrixVente: ligne.prixVente,
          PRIXTHT: ligne.quantite * ligne.prixAchat,
          TVAEntree: ligne.taxe,
          MontantTTCE: calculerTotalLigne(ligne),
          QteMinimum: ligne.qteMinimum,
          QteMaximum: ligne.qteMaximum,
          DatePeremption: ligne.datePeremption || null,
          NumeroLot: ligne.numeroLot || "",
          Observations: observation,
          SaisiLe: dateDuJour,
          SaisiPar: utilisateur,
        };

        // Ajouter l'entrée en stock
        const resEntree = await fetch("/api/gestionstock/entrestock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(entreeStock),
        });

        if (!resEntree.ok) throw new Error("Erreur lors de l'ajout de l'entrée en stock");

        // 3. MODIFICATION DE L'ARTICLE DE CRÉATION (PHARMACIE)
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

        // 4. MODIFICATION DE L'ARTICLE EN STOCK OU AJOUT AU STOCK
        // Vérifier si le médicament existe déjà en stock
        const resStock = await fetch(`/api/gestionstock/stock/reference?reference=${encodeURIComponent(ligne.reference)}`);
        let stockExistant = null;
        
        if (resStock.ok) {
          stockExistant = await resStock.json();
        }

        if (stockExistant && stockExistant._id) {
          // XX produit en plus en stock
          const resUpdateStock = await fetch(`/api/gestionstock/stock/${stockExistant._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              QteEnStock: (stockExistant.QteEnStock || 0) + ligne.quantite,
              QteMinimum: ligne.qteMinimum,
              QteMaximum: ligne.qteMaximum,
              AuteurModif: utilisateur,
              DateModif: dateDuJour,
            }),
          });

          if (!resUpdateStock.ok) {
            console.warn("Erreur lors de la mise à jour du stock:", ligne.reference);
          }
        } else {
          // Ajoute immédiat de l'article en stock
          const nouveauStock = {
            AuteurModif: utilisateur,
            DateModif: dateDuJour,
            QteEnStock: ligne.quantite,
            QteMinimum: ligne.qteMinimum,
            QteMaximum: ligne.qteMaximum,
            Reference: ligne.reference,
            Medicament: ligne.medicament?.Designation,
            IDMEDICAMENT:ligne.medicament?._id,
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

      // Succès
      onAdd(approvisionnementCree);
      onHide();
      setLignes([]); // Réinitialiser les lignes après l'ajout
      
      // Message de succès (équivalent de Info())
      alert("Approvisionnement terminé avec succès");
      
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
        <Modal.Title>Nouvel achat de médicaments</Modal.Title>
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
                  <th style={{ width: "18%" }}>Médicament</th>
                  <th style={{ width: "7%" }}>Référence</th>
                  <th style={{ width: "7%" }}>Prix vente</th>
                  <th style={{ width: "7%" }}>Prix achat</th>
                  <th style={{ width: "5%" }}>Qté</th>
                  <th style={{ width: "5%" }}>Taxe</th>
                  <th style={{ width: "6%" }}>Total</th>
                  <th style={{ width: "6%" }}>Stock actuel</th>
                  <th style={{ width: "5%" }}>Seuil min</th>
                  <th style={{ width: "5%" }}>Seuil max</th>
                  <th style={{ width: "8%" }}>N° Lot</th>
                  <th style={{ width: "9%" }}>Date péremption</th>
                  <th style={{ width: "3%" }}></th>
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
                    <td className="text-center" style={{ fontSize: "11px", verticalAlign: "middle" }}>
                      {ligne.stockInfo ? (
                        <span
                          className={`badge ${
                            ligne.stockInfo.QteEnStock <= 0
                              ? "bg-danger"
                              : ligne.stockInfo.QteMinimum > 0 && ligne.stockInfo.QteEnStock <= ligne.stockInfo.QteMinimum
                              ? "bg-warning text-dark"
                              : "bg-success"
                          }`}
                          title="Stock physique actuel"
                        >
                          {ligne.stockInfo.QteEnStock}
                        </span>
                      ) : ligne.medicament ? (
                        <span className="text-muted" style={{ fontSize: "10px" }}>...</span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      <Form.Control
                        type="number"
                        min={0}
                        value={ligne.qteMinimum}
                        onChange={(e) =>
                          updateLigne(ligne.id, { qteMinimum: Number(e.target.value) || 0 })
                        }
                        size="sm"
                        title="Quantité minimum de réapprovisionnement"
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="number"
                        min={0}
                        value={ligne.qteMaximum}
                        onChange={(e) =>
                          updateLigne(ligne.id, { qteMaximum: Number(e.target.value) || 0 })
                        }
                        size="sm"
                        title="Quantité maximum en stock"
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="text"
                        value={ligne.numeroLot}
                        onChange={(e) =>
                          updateLigne(ligne.id, { numeroLot: e.target.value })
                        }
                        size="sm"
                        placeholder="Ex: LOT-001"
                        title="Numéro de lot fournisseur"
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="date"
                        value={ligne.datePeremption}
                        onChange={(e) =>
                          updateLigne(ligne.id, { datePeremption: e.target.value })
                        }
                        size="sm"
                        title="Date de péremption du lot"
                      />
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
