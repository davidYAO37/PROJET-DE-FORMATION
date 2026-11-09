"use client";

import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Table, Alert } from "react-bootstrap";
import { Pharmacie } from "@/types/pharmacie";
import MedicamentSearchSelect, { fetchMedicamentsByIds } from "@/components/MedicamentSearchSelect";

interface Fournisseur {
  _id?: string;
  Nom?: string;
  Telephone?: string;
  Ville?: string;
}

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

type Props = {
  show: boolean;
  onHide: () => void;
  Approvisionnement: any; // L'approvisionnement à modifier
  onSave: (a: any) => void;
};

export default function ModifierAchat({
  show,
  onHide,
  Approvisionnement,
  onSave,
}: Props) {
  const [lignes, setLignes] = useState<LigneAchat[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [observation, setObservation] = useState("");
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [selectedFournisseur, setSelectedFournisseur] = useState("");
  const [numeroFacture, setNumeroFacture] = useState("");

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

  // Charger les fournisseurs
  useEffect(() => {
    fetch("/api/fournisseur?actif=true")
      .then(r => r.json())
      .then(d => setFournisseurs(Array.isArray(d) ? d : []))
      .catch(console.error);
  }, []);

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
        // Seuls les médicaments de l'achat sont chargés (pas tout le catalogue)
        const meds = await fetchMedicamentsByIds(entrees.map((e: any) => String(e.IDMEDICAMENT || "")));
        const lignesChargees = entrees.map((entree: any) => ({
          id: entree._id,
          medicament: meds.find(m => m._id === String(entree.IDMEDICAMENT)) || null,
          quantite: entree.Quantite || 0,
          prixAchat: entree.PrixAchat || 0,
          taxe: entree.TVAEntree || 0,
          reference: entree.Reference || "",
          prixVente: entree.PrixVente || 0,
          stockInfo: null,
          qteMinimum: entree.QteMinimum || 0,
          qteMaximum: entree.QteMaximum || 0,
          datePeremption: entree.DatePeremption ? new Date(entree.DatePeremption).toISOString().slice(0, 10) : "",
          numeroLot: entree.NumeroLot || "",
        }));
        setLignes(lignesChargees);
        setObservation(Approvisionnement.Observations || "");
        setTotalHT(Approvisionnement.PrixHT || 0);
        setTotalTVA(Approvisionnement.tVAApro || 0);
        setMontantTTC(Approvisionnement.MontantTTC || 0);
        setSelectedFournisseur(Approvisionnement.IDFournisseur?.toString() || "");
        setNumeroFacture(Approvisionnement.NumeroFacture || "");
      }
    } catch (err) {
      console.error("Erreur lors du chargement des entrées de stock:", err);
    }
  };

  // Calcul du total général (pour compatibilité)
  const totalGeneral = montantTTC;

  // Gestion de la sélection d'un médicament
  const handleSelectMedicament = async (ligneId: string, medicament: Pharmacie | null) => {
    const medicamentId = medicament?._id;
    if (medicament && medicamentId) {
      if (lignes.some((l) => l.id !== ligneId && l.medicament?._id === medicamentId)) {
        setError(`« ${medicament.Designation} » est déjà dans cet achat : modifiez plutôt la quantité de la ligne existante.`);
        return;
      }
      setError("");
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
      const fournisseur = fournisseurs.find(f => f._id === selectedFournisseur);
      const approvisionnementModifie = {
        DateAppro: dateDuJour,
        PrixHT: totalHT,
        tVAApro: totalTVA,
        MontantTTC: montantTTC,
        SaisiLe: dateDuJour,
        SaisiPar: utilisateur,
        Observations: observation,
        IDFournisseur: selectedFournisseur || null,
        NomFournisseur: fournisseur?.Nom || "",
        NumeroFacture: numeroFacture,
      };

      // 2. LE SERVEUR REMPLACE LES LIGNES ET AJUSTE LE STOCK DE L'ÉCART
      //    (refusé si l'achat a déjà été consommé au-delà des nouvelles quantités)
      const resAppro = await fetch(`/api/approvisionnement/${Approvisionnement._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...approvisionnementModifie,
          lignes: lignesValides.map((ligne) => ({
            DateAppro: dateDuJour,
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
          })),
        }),
      });

      if (!resAppro.ok) {
        const detail = await resAppro.json().catch(() => null);
        throw new Error(detail?.error || "Erreur lors de la modification de l'approvisionnement");
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
      setSelectedFournisseur("");
      setNumeroFacture("");
    }
  }, [show]);

  return (
    <Modal show={show} onHide={onHide} size="xl" backdrop="static" keyboard={false}>
      <Modal.Header closeButton>
        <Modal.Title>Modification de l'approvisionnement</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {/* Fournisseur + N° Facture */}
          <Row className="mb-3 g-2 align-items-end">
            <Col md={5}>
              <Form.Group>
                <Form.Label className="fw-semibold small mb-1">Fournisseur</Form.Label>
                <Form.Select
                  size="sm"
                  value={selectedFournisseur}
                  onChange={e => setSelectedFournisseur(e.target.value)}
                >
                  <option value="">— Sélectionner un fournisseur —</option>
                  {fournisseurs.map(f => (
                    <option key={f._id} value={f._id}>{f.Nom}{f.Ville ? ` — ${f.Ville}` : ""}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-semibold small mb-1">N° Facture fournisseur</Form.Label>
                <Form.Control
                  size="sm"
                  placeholder="Ex: FAC-2025-001"
                  value={numeroFacture}
                  onChange={e => setNumeroFacture(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col className="text-end">
              <Button
                variant="primary"
                onClick={ajouterLigne}
                disabled={loading}
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
                  <th style={{ width: "16%" }}>Médicament</th>
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
                      <MedicamentSearchSelect
                        value={ligne.medicament}
                        onSelect={(medicament) =>
                          handleSelectMedicament(ligne.id, medicament)
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
