
"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { Table, Form, Button, InputGroup, Row, Col, Alert, Dropdown } from "react-bootstrap";

type AssuranceId = number; // 1: Non assuré, 2: Mutualiste, 3: Préférentiel

// Type du document ActeClinique
export interface IActeClinique {
    _id: string;
    Designation?: string;
    LettreCle?: string;
    IDTYPE_ACTE?: string;
    CoefficientActe?: number;
    Prix?: number;
    PrixMutualiste?: number;
    PrixAssure?: number;
    MontantAuMed?: string | number; // "1" ou 1
    IDFAMILLE_ACTE_BIOLOGIE?: string;
    ORdonnacementAffichage?: number;
    // ... autres champs si besoin
   MontantAnesthesiste?: string | number; // "1" ou 1
   MontantAideOperatoire?: string | number; // "1" ou 1
}

// Type TarifAssurance
export interface ITarifAssurance {
    _id?: string;
    Designation: string;
    IDASSURANCE: number;
    PrixMutualiste?: number;
    PrixAssure?: number;
    CoefficientActe?: number;
    Prix?: number;
    // ... autres champs si besoin
}

export interface ILignePrestation {
    AFacturer: "Non Payé" | "Payé";
    DATE: string;
    Acte: string; // affichage (Designation)
    Lettre_Cle: string;
    Coefficient: number;
    QteP: number;
    Coef_ASSUR: number;
    SURPLUS: number;
    Prixunitaire: number;
    TAXE: number;
    PrixTotal: number;
    PartAssurance: number;
    PartAssure: number;
    IDTYPE: string;
    Reliquat: number;
    TotalRelicatCoefAssur: number;
    Montant_MedExecutant: number;
    MontantAnesthesiste: number;
    MontantAideOperatoire: number;
     IDmedecinAideOperatoire?: string;
    IDAnesthesiste?: string;
    numMedecinExecutant?: string;
    medecinExecutant?: string;
    MedecinAffiche: string;
    StatutMedecinActe: string;
    StatutMedecinAnesthesiste: string; // "NON" ou "OUI"
    StatutMedecinAideOperatoire: string; // "NON" ou "OUI"
    IDACTE: string; // _id de l'acte
    Exclusion: "Accepter" | "Refuser";
    COEFFICIENT_ASSURANCE: number;
    TARIF_ASSURANCE: number;
    IDHOSPO: string | number;
    IDFAMILLE: string;
    Refuser: number;
    Accepter: number;
    IDLignePrestation: string;
    Statutprescription: number;
    CoefClinique: number;
    forfaitclinique: number;
    ordonnancementAffichage?: number;
    Action?: string;
    datePaiementCaisse?: string;
    heurePaiement?: string;
    payePar?: string;
}
// utilise Assurance et le taux de assurance info

// Composant de sélection d'acte avec recherche
interface ActeSelectProps {
    actes: IActeClinique[];
    selectedId: string;
    onSelect: (acte: IActeClinique) => void;
}

function ActeSelect({ actes, selectedId, onSelect }: ActeSelectProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

    // Filtrer les actes selon la recherche (limiter à 50 résultats pour la performance INP)
    const filteredActes = (searchTerm
        ? actes.filter(a =>
            a.Designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.LettreCle?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : actes).slice(0, 50);

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

    const handleSelect = (acte: IActeClinique) => {
        onSelect(acte);
        setSearchTerm("");
        setShowDropdown(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setShowDropdown(true);
    };

    const selectedActe = actes.find(a => a._id === selectedId);

    return (
        <div style={{ position: 'relative' }}>
            <Form.Control
                ref={inputRef}
                type="text"
                size="sm"
                placeholder="Rechercher un acte..."
                value={searchTerm || (selectedActe?.Designation || "")}
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
                    {filteredActes.length === 0 ? (
                        <div style={{ padding: '8px', color: '#6c757d', fontSize: '13px' }}>
                            Aucun acte trouvé
                        </div>
                    ) : (
                        filteredActes.map((acte) => (
                            <div
                                key={acte._id}
                                onClick={() => handleSelect(acte)}
                                style={{
                                    padding: '8px',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    borderBottom: '1px solid #f8f9fa',
                                    backgroundColor: acte._id === selectedId ? '#e3f2fd' : 'white'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = acte._id === selectedId ? '#e3f2fd' : 'white';
                                }}
                            >
                                <div>
                                    <strong>{acte.Designation}</strong>
                                </div>
                                {acte.LettreCle && (
                                    <div style={{ fontSize: '11px', color: '#6c757d' }}>
                                        🔑 {acte.LettreCle}
                                    </div>
                                )}
                                {acte.Prix && (
                                    <div style={{ fontSize: '11px', color: '#28a745' }}>
                                        💰 {acte.Prix} FCFA
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

interface Props {
    assuranceId?: AssuranceId; // Sélection (1=Sans,2=Mutualiste,3=Préférentiel)
    saiTaux?: number; // Taux (%)
    assuranceDbId?: string; // ObjectId de l'assurance en base pour charger les tarifs
    onTotalsChange?: (totaux: {
        montantTotal: number;
        partAssurance: number;
        partAssure: number;
        totalTaxe: number;
        totalSurplus: number;
        montantExecutant: number;
        montantARegler: number;
    }) => void;
    externalResetKey?: number; // modifie pour réinitialiser la table depuis l'extérieur
    presetLines?: ILignePrestation[]; // lignes à charger (optionnel)
    onLinesChange?: (lignes: ILignePrestation[]) => void;
}

function generateLineId(): string {
    try {
        // @ts-ignore - crypto dispo côté client
        if (typeof crypto !== "undefined" && crypto.randomUUID) {
            // @ts-ignore
            return crypto.randomUUID();
        }
    } catch { }
    return `lp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const emptyLigne = (): ILignePrestation => ({
    AFacturer: "Non Payé",
    DATE: new Date().toISOString().split("T")[0],
    Acte: "",
    Lettre_Cle: "",
    Coefficient: 1,
    QteP: 1,
    Coef_ASSUR: 0,
    SURPLUS: 0,
    Prixunitaire: 0,
    TAXE: 0,
    PrixTotal: 0,
    PartAssurance: 0,
    PartAssure: 0,
    IDTYPE: "",
    Reliquat: 0,
    TotalRelicatCoefAssur: 0,
    Montant_MedExecutant: 0,
    MontantAnesthesiste: 0,
    MontantAideOperatoire: 0,
    IDmedecinAideOperatoire: "",
    IDAnesthesiste: "",
    numMedecinExecutant: "",
    medecinExecutant: "",
    MedecinAffiche: "",
    StatutMedecinActe: "NON",
    StatutMedecinAnesthesiste: "NON", // "NON" par défaut
    StatutMedecinAideOperatoire: "NON", // "NON" par défaut
    IDACTE: "",
    Exclusion: "Accepter",
    COEFFICIENT_ASSURANCE: 0,
    TARIF_ASSURANCE: 0,
    IDHOSPO: 0,
    IDFAMILLE: "",
    Refuser: 0,
    Accepter: 0,
    IDLignePrestation: generateLineId(),
    Statutprescription: 2,
    CoefClinique: 1,
    forfaitclinique: 0,
    ordonnancementAffichage: 0,
    Action: "",
    datePaiementCaisse: "",
    heurePaiement: "",
    payePar: ""
});

export default function TablePrestationsCaisseManuelle({ assuranceId = 1, saiTaux = 0, assuranceDbId, onTotalsChange, externalResetKey, presetLines, onLinesChange }: Props) {
    const [actes, setActes] = useState<IActeClinique[]>([]);
    const [tarifsAssurance, setTarifsAssurance] = useState<ITarifAssurance[]>([]);
    const [medecins, setMedecins] = useState<any[]>([]);
    const [lignes, setLignes] = useState<ILignePrestation[]>([emptyLigne()]);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [nomUtilisateur, setNomUtilisateur] = useState<string>("");
    const [totaux, setTotaux] = useState({
        montantTotal: 0,
        partAssurance: 0,
        partAssure: 0,
        totalTaxe: 0,
        totalSurplus: 0,
        montantExecutant: 0,
        montantAnesthesiste: 0,
        montantAideOperatoire: 0,
        montantARegler: 0
    });

    useEffect(() => {
        const nom = localStorage.getItem("nom_utilisateur");
        if (nom) setNomUtilisateur(nom);
    }, []);

    useEffect(() => {
        // Charger actes cliniques depuis /api/actesclinique (paginé)
        fetch("/api/actesclinique?limit=1000")
            .then((r) => r.json())
            .then((payload) => {
                const list = Array.isArray(payload?.data) ? payload.data : [];
                // map backend -> modèle interne
                const mapped: IActeClinique[] = list.map((a: any) => ({
                    _id: a._id,
                    Designation: a.designationacte,
                    LettreCle: a.lettreCle,
                    IDTYPE_ACTE: a.IDTYPE_ACTE,
                    CoefficientActe: a.coefficient,
                    Prix: a.prixClinique,
                    PrixMutualiste: a.prixMutuel,
                    PrixAssure: a.prixPreferentiel,
                    MontantAuMed: a.MontantAuMed,
                    IDFAMILLE_ACTE_BIOLOGIE: a.IDFAMILLE_ACTE_BIOLOGIE,
                    ORdonnacementAffichage: a.ORdonnacementAffichage,
                    MontantAnesthesiste: a.MontantAnesthesiste,
                    MontantAideOperatoire: a.MontantAideOperatoire,
                }));
                setActes(mapped);
            })
            .catch(() => setActes([]));
    }, []);

    useEffect(() => {
        // Charger tarifs de l'assurance sélectionnée si disponible
        if (!assuranceDbId) {
            setTarifsAssurance([]);
            return;
        }
        fetch(`/api/tarifs/${assuranceDbId}`)
            .then((r) => {
                if (!r.ok) throw new Error("no tarifs for assurance");
                return r.json();
            })
            .then((list) => {
                // map backend -> modèle interne des tarifs utilisés localement
                const mapped: ITarifAssurance[] = (Array.isArray(list) ? list : []).map((t: any) => ({
                    _id: String(t._id),
                    Designation: t.acte,
                    IDASSURANCE: 0, // non utilisé car déjà filtré par assurance
                    PrixMutualiste: t.prixmutuel,
                    PrixAssure: t.prixpreferenciel,
                    CoefficientActe: t.coefficient,
                    Prix: undefined,
                }));
                setTarifsAssurance(mapped);
            })
            .catch(() => setTarifsAssurance([]));
    }, [assuranceDbId]);

    useEffect(() => {
        // Charger la liste des médecins pour l'aide opératoire
        fetch("/api/medecins")
            .then((r) => r.json())
            .then((data) => {
                setMedecins(Array.isArray(data) ? data : []);
            })
            .catch(() => {
                setMedecins([]);
            });
    }, []);

    useEffect(() => {
        // recalculer totaux à chaque modification de lignes
        facturePharmacie();
        if (onLinesChange) onLinesChange(lignes);
    }, [lignes]);

    // Fonction pour nettoyer les lignes chargées depuis la base de données
    const cleanLoadedLines = useCallback((lines: any[]): ILignePrestation[] => {
        return lines.map(line => ({
            ...line,
            // Assurer que les statuts sont correctement initialisés
            StatutMedecinAnesthesiste: line.StatutMedecinAnesthesiste ?? "NON",
            StatutMedecinAideOperatoire: line.StatutMedecinAideOperatoire ?? "NON",
            // Autres champs avec valeurs par défaut si nécessaire
            StatutMedecinActe: line.StatutMedecinActe || "NON",
            Montant_MedExecutant: line.Montant_MedExecutant || 0,
            MontantAnesthesiste: line.MontantAnesthesiste || 0,
            MontantAideOperatoire: line.MontantAideOperatoire || 0,
            IDmedecinAideOperatoire: line.IDmedecinAideOperatoire || "",
            IDAnesthesiste: line.IDAnesthesiste || "",
            numMedecinExecutant: line.numMedecinExecutant || "",
            medecinExecutant: line.medecinExecutant || "",
            MedecinAffiche: line.MedecinAffiche || "",
        }));
    }, []);

    // Réinitialisation/chargement externe des lignes
    useEffect(() => {
        if (externalResetKey === undefined) return;
        if (Array.isArray(presetLines) && presetLines.length > 0) {
            const cleanedLines = cleanLoadedLines(presetLines);
            setLignes(cleanedLines);
        } else {
            // Toujours garder au moins une ligne vide pour permettre l'ajout
            setLignes([emptyLigne()]);
        }
        // Effacer message d'erreur éventuel
        setErrorMsg(null);
    }, [externalResetKey, presetLines, cleanLoadedLines]);

    // ---------- Helpers pour rechercher objets -------------
    function findActeById(id: string) {
        return actes.find((a) => a._id === id);
    }
    function findTarifByActeDesignationAndAssurance(designation: string, _assurance: AssuranceId) {
        // Les tarifs sont déjà filtrés par assurance via l'endpoint /api/tarifs/{assuranceDbId}
        return tarifsAssurance.find((t) => t.Designation === designation);
    }

    function prixActe(ligne: ILignePrestation, acte?: IActeClinique) {
        // Coefficient, QteP, Prixunitaire, PrixTotal, PartAssurance et PartAssure sont désormais
        // saisis manuellement par l'utilisateur : aucun recalcul automatique n'est appliqué ici.
        // On détermine uniquement à qui revient le montant (médecin exécutant / anesthésiste /
        // aide opératoire) à partir du montant total déjà saisi.

        // On cherche le cas ou le montant est pour le médecin
        if (acte && (acte.MontantAuMed === 1 || acte.MontantAuMed === "1")) {
            ligne.StatutMedecinActe = "OUI";
            ligne.Montant_MedExecutant = ligne.PrixTotal;
        } else {
            ligne.StatutMedecinActe = "NON";
            ligne.Montant_MedExecutant = 0;
        }

        // On cherche le cas ou le montant est pour l'anesthésiste
        if (acte && (acte.MontantAnesthesiste === 1 || acte.MontantAnesthesiste === "1")) {
            ligne.MontantAnesthesiste = ligne.PrixTotal;
        } else {
            ligne.MontantAnesthesiste = 0;
        }

        // On cherche le cas ou le montant est pour l'aide opératoire
        if (acte && (acte.MontantAideOperatoire === 1 || acte.MontantAideOperatoire === "1")) {
            ligne.MontantAideOperatoire = ligne.PrixTotal;
        } else {
            ligne.MontantAideOperatoire = 0;
        }
    }

    // Fonction pour mettre à jour MedecinAffiche selon les statuts
    function updateMedecinAffiche(ligne: ILignePrestation, medecins: any[]) {
        // Par défaut, MedecinAffiche est vide
        ligne.MedecinAffiche = "";

        // Priorité : Médecin exécutant > Anesthésiste > Aide opératoire
        if (ligne.StatutMedecinActe === "OUI") {
            // Essayer d'abord avec numMedecinExecutant (ID)
            if (ligne.numMedecinExecutant) {
                const medecin = medecins.find(m => m._id === ligne.numMedecinExecutant);
                if (medecin) {
                    ligne.MedecinAffiche = `${medecin.nom} ${medecin.prenoms}`;
                }
            }
            // Si numMedecinExecutant est vide, essayer avec medecinExecutant (nom direct)
            else if (ligne.medecinExecutant) {
                ligne.MedecinAffiche = ligne.medecinExecutant;
            }
        } else if (ligne.StatutMedecinAnesthesiste === "OUI" && ligne.IDAnesthesiste) {
            const medecin = medecins.find(m => m._id === ligne.IDAnesthesiste);
            if (medecin) {
                ligne.MedecinAffiche = `${medecin.nom} ${medecin.prenoms}`;
            }
        } else if (ligne.StatutMedecinAideOperatoire === "OUI" && ligne.IDmedecinAideOperatoire) {
            const medecin = medecins.find(m => m._id === ligne.IDmedecinAideOperatoire);
            if (medecin) {
                ligne.MedecinAffiche = `${medecin.nom} ${medecin.prenoms}`;
            }
        }
    }

    function facturePharmacie() {
        // calcule les totaux
        const s = {
            montantTotal: 0,
            partAssurance: 0,
            partAssure: 0,
            totalTaxe: 0,
            totalSurplus: 0,
            montantExecutant: 0,
            montantAnesthesiste: 0,
            montantAideOperatoire: 0,
            montantARegler: 0
        };

        for (const l of lignes) {
            if (l.AFacturer !== "Payé") {
                continue;
            }
            s.montantTotal += Number(l.PrixTotal || 0);
            s.partAssurance += Number(l.PartAssurance || 0);
            s.partAssure += Number(l.PartAssure || 0);
            s.totalTaxe += Number(l.TAXE || 0);
            s.totalSurplus += Number((l.Reliquat || 0) + (l.TotalRelicatCoefAssur || 0));
            s.montantExecutant += Number(l.Montant_MedExecutant || 0);
            s.montantAnesthesiste += Number(l.MontantAnesthesiste || 0);
            s.montantAideOperatoire += Number(l.MontantAideOperatoire || 0);
        }

        s.montantARegler = s.totalSurplus + s.partAssure;
        // SAI_Reste_à_payer = SAI_Montant_a_régler
        setTotaux(s);
        if (onTotalsChange) onTotalsChange(s);
    }

    // ---------- Actions utilisateur ----------
    function addLigne() {
        setLignes((prev) => [...prev, emptyLigne()]);
    }

    async function removeLigne(id: string) {
        // SI OuiNon(0,"voulez-vous retirer cet acte ?")=Vrai ALORS
        const confirmation = window.confirm("Voulez-vous retirer cet acte ?");
        if (!confirmation) {
            return;
        }

        // Retirer_Ligne_Prestation()
        // Trouver la ligne dans l'état local
        const ligne = lignes.find(l => l.IDLignePrestation === id);
        if (!ligne) {
            return;
        }

        // Vérifier si c'est un ObjectId MongoDB valide (24 caractères hexadécimaux)
        const isValidObjectId = id && id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id);

        // HLitRecherche(LIGNE_PRESTATION,IDLIGNE_PRESTATION,TABLE_PRESTATION.COL_IDLignePrestation)
        // SI HTrouve(LIGNE_PRESTATION)=Vrai ALORS
        if (isValidObjectId) {
            try {
                // Vérifier si la ligne existe en base de données
                const checkRes = await fetch(`/api/ligneprestationFacture?id=${encodeURIComponent(id)}`);

                if (checkRes.ok) {
                    const data = await checkRes.json();
                    const ligneDB = data.data;

                    // SI LIGNE_PRESTATION.statutPrescriptionMedecin=3 ALORS
                    if (ligneDB && ligneDB.statutPrescriptionMedecin === 3) {
                        alert("Acte déjà facturé");
                        return;
                    }

                    // SINON HSupprime(LIGNE_PRESTATION)
                    const deleteRes = await fetch(`/api/ligneprestationFacture?id=${encodeURIComponent(id)}`, {
                        method: 'DELETE'
                    });

                    if (!deleteRes.ok) {
                        const error = await deleteRes.json();
                        alert(`Erreur lors de la suppression: ${error.message || 'Erreur inconnue'}`);
                        return;
                    }

                    // TableSupprime(TABLE_PRESTATION)
                    setLignes((prev) => prev.filter((p) => p.IDLignePrestation !== id));
                    alert("Acte retiré avec succès");
                } else {
                    // Ligne non trouvée en base, supprimer uniquement de la table locale
                    setLignes((prev) => prev.filter((p) => p.IDLignePrestation !== id));
                    alert("Acte retiré avec succès");
                }
            } catch (error) {
                console.error("Erreur lors de la suppression:", error);
                alert("Erreur lors de la suppression de l'acte");
                return;
            }
        } else {
            // SINON (pas d'ID valide en base)
            // HSupprime(LIGNE_PRESTATION) - pas nécessaire car pas en base
            // TableSupprime(TABLE_PRESTATION)
            setLignes((prev) => prev.filter((p) => p.IDLignePrestation !== id));
            alert("Acte retiré avec succès");
        }

        // Facture_Pharmacie() - Recalculer les totaux après suppression
        // Le useEffect se chargera du recalcul automatiquement
    }

    function onChangeField(lineId: string, field: keyof ILignePrestation, value: any) {
        setErrorMsg(null);
        setLignes((prev) =>
            prev.map((l) => {
                if (l.IDLignePrestation !== lineId) return l;
                const copy = { ...l, [field]: value };
                return copy;
            })
        );
    }

    // Quand on sélectionne un acte
    async function onSelectActe(lineId: string, acteId: string) {
        setErrorMsg(null);
        const acte = findActeById(acteId);
        if (!acte) return;

        setLignes((prev) =>
            prev.map((l) => {
                if (l.IDLignePrestation !== lineId) return l;
                const copy = { ...l };

                // Remplissages d'après ton WLangage
                copy.AFacturer = "Non Payé";
                copy.Acte = acte.Designation || ""; // ✅ Remplir le nom de l'acte
                copy.Lettre_Cle = acte.LettreCle || "";
                copy.DATE = new Date().toISOString().split("T")[0];
                copy.IDACTE = acte._id;
                copy.IDTYPE = acte.IDTYPE_ACTE || ""; // ✅ Remplir le type d'acte
                copy.IDFAMILLE = acte.IDFAMILLE_ACTE_BIOLOGIE || ""; // ✅ Remplir la famille d'acte
                copy.Exclusion = "Accepter";
                copy.Coefficient = acte.CoefficientActe && acte.CoefficientActe !== 0 ? acte.CoefficientActe : 1;
                if (!copy.QteP || copy.QteP === 0) copy.QteP = 1;
                copy.Statutprescription = 2;
                copy.Refuser = acte.Prix || 0;
                copy.ordonnancementAffichage = acte.ORdonnacementAffichage || 0;
                // Initialiser les champs de paiement
                copy.datePaiementCaisse = '';
                copy.heurePaiement = '';
                copy.payePar = '';

                // Préremplir le prix unitaire selon le type d'assurance, puis calculer
                // Montant Total / Part Assurance / Part Assuré à partir des valeurs préremplies
                const prixUnitaire = assuranceId === 3
                    ? (acte.PrixAssure || acte.Prix || 0)
                    : assuranceId === 2
                        ? (acte.PrixMutualiste || acte.Prix || 0)
                        : (acte.Prix || 0);
                copy.Prixunitaire = prixUnitaire;
                const prixTotal = Math.round(prixUnitaire * copy.Coefficient * copy.QteP);
                copy.PrixTotal = prixTotal;
                if (assuranceId === 1) {
                    copy.PartAssurance = 0;
                    copy.PartAssure = prixTotal;
                } else {
                    const partAssurance = Math.round(prixTotal * ((saiTaux || 0) / 100));
                    copy.PartAssurance = partAssurance;
                    copy.PartAssure = prixTotal - partAssurance;
                }

              // Si le montant total de l'acte est pour le médecin exécutant
                if (acte.MontantAuMed === 1 || acte.MontantAuMed === "1") {
                    copy.StatutMedecinActe = "OUI";
                    // sera recalculé après prixActe carPrixTotal est recalculé ensuite
                } else {
                    copy.StatutMedecinActe = "NON";
                    copy.Montant_MedExecutant = 0;
                }

                // Logique pour MontantAnesthesiste - statut
                if (acte.MontantAnesthesiste === 1 || acte.MontantAnesthesiste === "1") {
                    copy.StatutMedecinAnesthesiste = "OUI"; // "OUI" pour anesthésiste
                } else {
                    copy.StatutMedecinAnesthesiste = "NON"; // "NON" pour anesthésiste
                }

                // Logique pour MontantAideOperatoire - statut
                if (acte.MontantAideOperatoire === 1 || acte.MontantAideOperatoire === "1") {
                    copy.StatutMedecinAideOperatoire = "OUI"; // "OUI" pour aide opératoire
                } else {
                    copy.StatutMedecinAideOperatoire = "NON"; // "NON" pour aide opératoire
                }

                // Initialiser les montants pour anesthésiste et aide opératoire
                copy.MontantAnesthesiste = 0;
                copy.MontantAideOperatoire = 0;

                // Calcul du prix
                prixActe(copy, acte);

                // si MontantAuMed=1, on change la valeur
                if (acte.MontantAuMed === 1 || acte.MontantAuMed === "1") {
                    copy.Montant_MedExecutant = copy.PrixTotal;
                }

                // si MontantAnesthesiste=1, on change la valeur
                if (acte.MontantAnesthesiste === 1 || acte.MontantAnesthesiste === "1") {
                    copy.MontantAnesthesiste = copy.PrixTotal;
                }

                // si MontantAideOperatoire=1, on change la valeur
                if (acte.MontantAideOperatoire === 1 || acte.MontantAideOperatoire === "1") {
                    copy.MontantAideOperatoire = copy.PrixTotal;
                }

                // Mettre à jour MedecinAffiche selon les statuts
                updateMedecinAffiche(copy, medecins);

                return copy;
            })
        );
    }

    // Quand un champ clé change et nécessité recalcul
    function onFieldChangeAndRecalc(lineId: string, field: keyof ILignePrestation, value: any) {
        setErrorMsg(null);
        setLignes((prev) =>
            prev.map((l) => {
                if (l.IDLignePrestation !== lineId) return l;
                const copy = { ...l, [field]: value };

                // Gestion du statut de paiement
                if (field === 'AFacturer') {
                    const now = new Date();
                    if (value === 'Payé') {
                        // Mettre à jour les informations de paiement
                        copy.datePaiementCaisse = now.toISOString().split('T')[0];
                        copy.heurePaiement = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                        copy.payePar = nomUtilisateur || 'Utilisateur';
                    } else {
                        // Réinitialiser les informations de paiement
                        copy.datePaiementCaisse = '';
                        copy.heurePaiement = '';
                        copy.payePar = '';
                    }
                }

                // PrixTotal, PartAssurance et PartAssure restent modifiables manuellement, mais un
                // changement de Coefficient, QteP ou Prixunitaire déclenche leur recalcul automatique.
                const triggerRecalcFields: (keyof ILignePrestation)[] = ['Coefficient', 'QteP', 'Prixunitaire'];
                if (triggerRecalcFields.includes(field)) {
                    const prixTotal = Math.round((copy.Prixunitaire || 0) * (copy.Coefficient || 0) * (copy.QteP || 0));
                    copy.PrixTotal = prixTotal;
                    if (assuranceId === 1) {
                        // Non assuré : le patient règle la totalité
                        copy.PartAssurance = 0;
                        copy.PartAssure = prixTotal;
                    } else {
                        const partAssurance = Math.round(prixTotal * ((saiTaux || 0) / 100));
                        copy.PartAssurance = partAssurance;
                        copy.PartAssure = prixTotal - partAssurance;
                    }
                }

                const montantFields: (keyof ILignePrestation)[] = [
                    'Coefficient', 'QteP', 'Prixunitaire', 'PrixTotal', 'PartAssurance', 'PartAssure',
                ];
                if (!montantFields.includes(field)) {
                    const acte = findActeById(copy.IDACTE);
                    // si acte existe, on met seulement à jour l'affectation médecin/anesthésiste/aide opératoire
                    if (acte) {
                        prixActe(copy, acte);
                    }
                } else if (triggerRecalcFields.includes(field)) {
                    // Le PrixTotal vient d'être recalculé : mettre à jour l'affectation médecin/anesthésiste/aide opératoire
                    const acte = findActeById(copy.IDACTE);
                    if (acte) {
                        prixActe(copy, acte);
                    }
                }

                // Mettre à jour MedecinAffiche si un champ de médecin a changé
                if (field === 'numMedecinExecutant' || field === 'IDAnesthesiste' || field === 'IDmedecinAideOperatoire') {
                    updateMedecinAffiche(copy, medecins);
                }

                return copy;
            })
        );
    }

    // Fonctions toggle pour les checkboxes
    const togglePaye = useCallback((lineId: string) => {
        setLignes(prev => {
            // Trouver la ligne spécifique et modifier son état sans affecter les autres
            return prev.map(ligne => {
                if (ligne.IDLignePrestation === lineId) {
                    const newValue = ligne.AFacturer === 'Payé' ? 'Non Payé' : 'Payé';
                    return { ...ligne, AFacturer: newValue };
                }
                return ligne;
            });
        });
    }, []);

    // Sélectionner/désélectionner "Payé" pour toutes les lignes modifiables
    const toggleAllPaye = useCallback(() => {
        setLignes(prev => {
            const editableLignes = prev.filter(l => (l.Statutprescription ?? 2) < 3);
            const toutesPayees = editableLignes.length > 0 && editableLignes.every(l => l.AFacturer === 'Payé');
            const newValue: 'Payé' | 'Non Payé' = toutesPayees ? 'Non Payé' : 'Payé';
            return prev.map(ligne => {
                if ((ligne.Statutprescription ?? 2) < 3) {
                    return { ...ligne, AFacturer: newValue };
                }
                return ligne;
            });
        });
    }, []);

    const toggleExclusion = useCallback((lineId: string) => {
        setLignes(prev => {
            const ligne = prev.find(l => l.IDLignePrestation === lineId);
            if (!ligne) return prev;
            
                    const newValue = ligne.Exclusion === 'Accepter' ? 'Refuser' : 'Accepter';
            
            // Utiliser la même logique que onFieldChangeAndRecalc
            onFieldChangeAndRecalc(lineId, 'Exclusion', newValue);
            return prev;
        });
    }, [onFieldChangeAndRecalc]);

    // ---------- UI ----------
    return (
        <div>
            <Row className="mb-2">

                <Col className="text-end">
                    <Button variant="primary" size="sm" onClick={addLigne}>
                        + Ajouter Ligne
                    </Button>
                </Col>
            </Row>

            {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}

            <div className="table-responsive" style={{ maxHeight: "70vh", overflow: "auto" }}>
                <Table bordered hover size="sm" className="mb-0" style={{ tableLayout: 'fixed', minWidth: '1650px' }}>
                    <thead className="table-light" style={{ position: "sticky", top: 0, zIndex: 2 }}>
                        <tr>
                            {/* Colonnes visibles */}
                            <th style={{ width: '80px', textAlign: 'center' }}>
                                <div className="d-flex flex-column align-items-center">
                                    <span>Payé</span>
                                    <Form.Check
                                        type="checkbox"
                                        checked={lignes.length > 0 && lignes.filter(l => (l.Statutprescription ?? 2) < 3).length > 0 && lignes.filter(l => (l.Statutprescription ?? 2) < 3).every(l => l.AFacturer === 'Payé')}
                                        onChange={toggleAllPaye}
                                        title="Tout sélectionner / désélectionner"
                                    />
                                </div>
                            </th>
                            <th style={{ width: '110px' }}>Date</th>
                            <th style={{ width: '220px' }}>Acte</th>
                            <th style={{ width: '90px' }}>Coeffi</th>
                            <th style={{ width: '90px' }}>Qtité</th>
                            <th style={{ width: '150px' }}>Prix unitaire</th>
                            <th style={{ width: '160px' }}>Montant Total</th>
                            <th style={{ width: '170px' }}>Part Assurance</th>
                            <th style={{ width: '170px' }}>Part Assuré</th>
                            <th style={{ width: '150px' }}>Médecin Anesthésiste</th>
                            <th style={{ width: '150px' }}>Aide opératoire</th>
                            <th style={{ width: '60px', textAlign: 'center' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lignes.map((l) => {
                            // Vérifier si la ligne est modifiable (statutPrescriptionMedecin < 3)
                            const isEditable = (l.Statutprescription ?? 2) < 3;
                            const rowStyle = !isEditable ? { backgroundColor: '#f8f9fa', opacity: 0.7 } : {};

                            return (

                                <tr key={l.IDLignePrestation} style={rowStyle}>
                                    {/* Mentionner payé ou pas */}


                                    <td className="text-center">
                                        <Form.Check
                                            type="checkbox"
                                            checked={l.AFacturer === 'Payé'}
                                            onChange={() => togglePaye(l.IDLignePrestation)}
                                            disabled={!isEditable}
                                            title={!isEditable ? "Acte déjà facturé - modification impossible" : ""}
                                        />
                                       
                                    </td>
                                    {/* Date */}
                                    <td style={{ padding: '4px' }}>
                                        <Form.Control
                                            size="sm"
                                            type="date"
                                            value={l.DATE}
                                            onChange={(e) => onChangeField(l.IDLignePrestation, "DATE", e.target.value)}
                                            style={{ fontSize: '13px' }}
                                            disabled={!isEditable}
                                            title={!isEditable ? "Acte déjà facturé - modification impossible" : ""}
                                        />
                                    </td>

                                    {/* Acte */}
                                    <td style={{ minWidth: 220, padding: '4px', whiteSpace: 'normal', wordWrap: 'break-word' }}>
                                        {isEditable ? (
                                            <ActeSelect
                                                actes={actes}
                                                selectedId={l.IDACTE || ""}
                                                onSelect={(acte: IActeClinique) => onSelectActe(l.IDLignePrestation, acte._id)}
                                            />
                                        ) : (
                                            <div style={{ fontSize: '13px', padding: '6px', color: '#6c757d' }} title="Acte déjà facturé - modification impossible">
                                                {l.Acte}
                                            </div>
                                        )}
                                    </td>

                                    {/* Coefficient - saisi manuellement, prérempli à la sélection de l'acte */}
                                    <td style={{ padding: '4px' }}>
                                        <Form.Control
                                            size="sm"
                                            type="number"
                                            step="1"
                                            value={l.Coefficient}
                                            onChange={(e) =>
                                                onChangeField(l.IDLignePrestation, "Coefficient", parseInt(e.target.value) || 0)
                                            }
                                            style={{ fontSize: '13px', textAlign: 'center' }}
                                            disabled={!isEditable}
                                            title={!isEditable ? "Acte déjà facturé - modification impossible" : ""}
                                        />
                                    </td>

                                    {/* QtéP - saisi manuellement, préremplie à la sélection de l'acte */}
                                    <td style={{ padding: '4px' }}>
                                        <Form.Control
                                            size="sm"
                                            type="number"
                                            step="1"
                                            value={l.QteP}
                                            onChange={(e) =>
                                                onChangeField(l.IDLignePrestation, "QteP", parseInt(e.target.value) || 0)
                                            }
                                            style={{ fontSize: '13px', textAlign: 'center' }}
                                            disabled={!isEditable}
                                            title={!isEditable ? "Acte déjà facturé - modification impossible" : ""}
                                        />
                                    </td>

                                    {/* Prixunitaire - saisi manuellement */}
                                    <td style={{ padding: '4px' }}>
                                        <InputGroup size="sm">
                                            <Form.Control
                                                type="number"
                                                step="1"
                                                value={l.Prixunitaire}
                                                onChange={(e) =>
                                                    onChangeField(l.IDLignePrestation, "Prixunitaire", parseInt(e.target.value) || 0)
                                                }
                                                style={{ fontSize: '13px', textAlign: 'right' }}
                                                disabled={!isEditable}
                                                title={!isEditable ? "Acte déjà facturé - modification impossible" : ""}
                                            />
                                        </InputGroup>
                                    </td>

                                    {/* PrixTotal - saisi manuellement */}
                                    <td style={{ padding: '4px' }}>
                                        <Form.Control
                                            size="sm"
                                            type="number"
                                            step="1"
                                            value={l.PrixTotal}
                                            onChange={(e) =>
                                                onChangeField(l.IDLignePrestation, "PrixTotal", parseInt(e.target.value) || 0)
                                            }
                                            style={{ fontSize: '13px', textAlign: 'right', fontWeight: 'bold' }}
                                            disabled={!isEditable}
                                            title={!isEditable ? "Acte déjà facturé - modification impossible" : ""}
                                        />
                                    </td>

                                    {/* PartAssurance - saisi manuellement */}
                                    <td style={{ padding: '4px' }}>
                                        <Form.Control
                                            size="sm"
                                            type="number"
                                            step="1"
                                            value={l.PartAssurance}
                                            onChange={(e) =>
                                                onChangeField(l.IDLignePrestation, "PartAssurance", parseInt(e.target.value) || 0)
                                            }
                                            style={{ fontSize: '13px', textAlign: 'right' }}
                                            disabled={!isEditable}
                                            title={!isEditable ? "Acte déjà facturé - modification impossible" : ""}
                                        />
                                    </td>

                                    {/* PartAssure - saisi manuellement */}
                                    <td style={{ padding: '4px' }}>
                                        <Form.Control
                                            size="sm"
                                            type="number"
                                            step="1"
                                            value={l.PartAssure}
                                            onChange={(e) =>
                                                onChangeField(l.IDLignePrestation, "PartAssure", parseInt(e.target.value) || 0)
                                            }
                                            style={{ fontSize: '13px', textAlign: 'right' }}
                                            disabled={!isEditable}
                                            title={!isEditable ? "Acte déjà facturé - modification impossible" : ""}
                                        />
                                    </td>

                                    {/* Médecin Anesthésiste - conditionnel si StatutMedecinAnesthesiste="OUI" */}
                                    <td style={{ padding: '4px' }}>
                                        {l.StatutMedecinAnesthesiste === "OUI" ? (
                                            <Form.Select
                                                size="sm"
                                                value={l.IDAnesthesiste || ""}
                                                onChange={(e) => onFieldChangeAndRecalc(l.IDLignePrestation, 'IDAnesthesiste', e.target.value)}
                                                disabled={!isEditable}
                                                style={{ fontSize: '12px' }}
                                            >
                                                <option value="">Sélectionner...</option>
                                                {medecins.map((medecin: any) => (
                                                    <option key={medecin._id} value={medecin._id}>
                                                        {medecin.nom} {medecin.prenoms}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        ) : (
                                            <span style={{ color: '#999', fontSize: '12px' }}>
                                                {l.IDAnesthesiste ? 
                                                    medecins.find((m: any) => m._id === l.IDAnesthesiste)?.nom + ' ' + 
                                                    medecins.find((m: any) => m._id === l.IDAnesthesiste)?.prenoms || 
                                                    'Médecin supprimé' : 
                                                    '-'
                                                }
                                            </span>
                                        )}
                                    </td>

                                    {/* Aide opératoire - conditionnel si StatutMedecinAideOperatoire="OUI" */}
                                    <td style={{ padding: '4px' }}>
                                        {l.StatutMedecinAideOperatoire === "OUI" ? (
                                            <Form.Select
                                                size="sm"
                                                value={l.IDmedecinAideOperatoire || ""}
                                                onChange={(e) => onFieldChangeAndRecalc(l.IDLignePrestation, 'IDmedecinAideOperatoire', e.target.value)}
                                                disabled={!isEditable}
                                                style={{ fontSize: '12px' }}
                                            >
                                                <option value="">Sélectionner...</option>
                                                {medecins.map((medecin: any) => (
                                                    <option key={medecin._id} value={medecin._id}>
                                                        {medecin.nom} {medecin.prenoms}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        ) : (
                                            <span style={{ color: '#999', fontSize: '12px' }}>
                                                {l.IDmedecinAideOperatoire ? 
                                                    medecins.find((m: any) => m._id === l.IDmedecinAideOperatoire)?.nom + ' ' + 
                                                    medecins.find((m: any) => m._id === l.IDmedecinAideOperatoire)?.prenoms || 
                                                    'Médecin supprimé' : 
                                                    '-'
                                                }
                                            </span>
                                        )}
                                    </td>

                                    {/* Action */}
                                    <td style={{ textAlign: 'center', padding: '4px' }}>
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => removeLigne(l.IDLignePrestation)}
                                            style={{ padding: '4px 8px', border: 'none' }}
                                            title={!isEditable ? "Acte déjà facturé - suppression impossible" : "Supprimer cette ligne"}
                                            disabled={!isEditable}
                                        >
                                            🗑️
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            </div>
        </div>
    );
}