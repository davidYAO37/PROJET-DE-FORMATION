
"use client";

import React, { useEffect, useState, useRef } from "react";
import { Table, Form, Button, InputGroup, Row, Col, Alert, Dropdown } from "react-bootstrap";

type AssuranceId = number; // 1: Non Assure, 2: Mutualiste, 3: Préférentiel

// Type du document ActeClinique (adapté depuis ton modèle mongoose)
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
}

// Type TarifAssurance (approximation basée sur tes procédures)
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
    StatutMedecinActe: string;
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
}
// utilise Assurance et le taux de assurance info

// Composant de recherche d'acte avec autocomplétion
interface SearchableActeSelectProps {
    actes: IActeClinique[];
    selectedId: string;
    onSelect: (acteId: string) => void;
}

function SearchableActeSelect({ actes, selectedId, onSelect }: SearchableActeSelectProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLDivElement>(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

    // Trouver l'acte sélectionné
    const selectedActe = actes.find(a => a._id === selectedId);
    const displayValue = selectedActe ? selectedActe.Designation || "" : "";

    // Filtrer les actes selon la recherche - Si pas de recherche, afficher tous les actes
    const filteredActes = searchTerm 
        ? actes.filter(a => 
            a.Designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.LettreCle?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : actes; // Afficher tous les actes si pas de recherche

    // Calculer la position du dropdown
    useEffect(() => {
        if (showDropdown && inputRef.current) {
            const rect = inputRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.top - 10, // Position au-dessus de l'input
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
                setSearchTerm("");
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (acteId: string) => {
        onSelect(acteId);
        setSearchTerm("");
        setShowDropdown(false);
    };

    return (
        <div ref={inputRef} className="searchable-acte-container">
            <Form.Control
                as="textarea"
                rows={2}
                size="sm"
                placeholder="Rechercher un acte..."
                value={showDropdown ? searchTerm : displayValue}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                style={{ 
                    resize: 'none', 
                    overflow: 'hidden',
                    fontSize: '13px',
                    lineHeight: '1.3'
                }}
            />
            {showDropdown && (
                <div 
                    ref={dropdownRef}
                    className="searchable-acte-dropdown"
                    style={{
                        top: `${dropdownPosition.top}px`,
                        left: `${dropdownPosition.left}px`,
                        width: `${dropdownPosition.width}px`,
                        transform: 'translateY(-100%)'
                    }}
                >
                    {searchTerm && (
                        <div className="searchable-acte-counter">
                            {filteredActes.length} résultat{filteredActes.length > 1 ? 's' : ''} trouvé{filteredActes.length > 1 ? 's' : ''}
                        </div>
                    )}
                    {filteredActes.length === 0 ? (
                        <div className="searchable-acte-empty">
                            <div className="searchable-acte-empty-icon">🔍</div>
                            <div>Aucun acte trouvé</div>
                            <div className="searchable-acte-empty-hint">
                                Essayez un autre terme de recherche
                            </div>
                        </div>
                    ) : (
                        <div className="searchable-acte-list">
                            {filteredActes.map((acte) => (
                                <div
                                    key={acte._id}
                                    onClick={() => handleSelect(acte._id)}
                                    className={`searchable-acte-item ${acte._id === selectedId ? 'selected' : ''}`}
                                >
                                    <div className="searchable-acte-title">
                                        {acte.Designation}
                                    </div>
                                    <div className="searchable-acte-badges">
                                        {acte.LettreCle && (
                                            <span className="searchable-acte-badge-key">
                                                🔑 {acte.LettreCle}
                                            </span>
                                        )}
                                        {acte.Prix && (
                                            <span className="searchable-acte-badge-price">
                                                💰 {acte.Prix} FCFA
                                            </span>
                                        )}
                                        {acte.PrixMutualiste && (
                                            <span className="searchable-acte-badge-mutuel">
                                                🏥 Mutuel: {acte.PrixMutualiste} FCFA
                                            </span>
                                        )}
                                        {acte.PrixAssure && (
                                            <span className="searchable-acte-badge-assure">
                                                🛡️ Assure: {acte.PrixAssure} FCFA
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
    StatutMedecinActe: "NON",
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
    Action: ""
});

export default function TablePrestations({ assuranceId = 1, saiTaux = 0, assuranceDbId, onTotalsChange, externalResetKey, presetLines, onLinesChange }: Props) {
    const [actes, setActes] = useState<IActeClinique[]>([]);
    const [tarifsAssurance, setTarifsAssurance] = useState<ITarifAssurance[]>([]);
    const [lignes, setLignes] = useState<ILignePrestation[]>([emptyLigne()]);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [totaux, setTotaux] = useState({
        montantTotal: 0,
        partAssurance: 0,
        partAssure: 0,
        totalTaxe: 0,
        totalSurplus: 0,
        montantExecutant: 0,
        montantARegler: 0
    });

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
        // recalculer totaux à chaque modification de lignes
        facturePharmacie();
        if (onLinesChange) onLinesChange(lignes);
    }, [lignes]);

    // Réinitialisation/chargement externe des lignes
    useEffect(() => {
        if (externalResetKey === undefined) return;
        if (Array.isArray(presetLines) && presetLines.length > 0) {
            setLignes(presetLines);
        } else {
            // Toujours garder au moins une ligne vide pour permettre l'ajout
            setLignes([emptyLigne()]);
        }
        // Effacer message d'erreur éventuel
        setErrorMsg(null);
    }, [externalResetKey]);

    // ---------- Helpers pour rechercher objets -------------
    function findActeById(id: string) {
        return actes.find((a) => a._id === id);
    }
    function findTarifByActeDesignationAndAssurance(designation: string, _assurance: AssuranceId) {
        // Les tarifs sont déjà filtrés par assurance via l'endpoint /api/tarifs/{assuranceDbId}
        return tarifsAssurance.find((t) => t.Designation === designation);
    }

    // ---------- Traduction des procédures WLangage ----------
    function tarifActeClinique(ligne: ILignePrestation, acte: IActeClinique, selAssure: number) {
        // SI ACTE.CoefficientActe=0 ALORS => coefficient = 1 sinon acte.CoefficientActe
        ligne.Coefficient = acte.CoefficientActe && acte.CoefficientActe !== 0 ? acte.CoefficientActe : 1;

        switch (selAssure) {
            case 1: // NON ASSURE
                ligne.Accepter = acte.Prix || 0;
                ligne.SURPLUS = 0;
                break;
            case 2: // Tarif Mutualiste
                ligne.Accepter = acte.PrixMutualiste || acte.Prix || 0;
                ligne.SURPLUS = 0;
                break;
            case 3: // Tarif Preferentiel
                ligne.Accepter = acte.PrixAssure || acte.Prix || 0;
                ligne.SURPLUS = 0;
                break;
            default:
                ligne.Accepter = acte.Prix || 0;
                ligne.SURPLUS = 0;
        }
    }

    function tarifActeAssurance(ligne: ILignePrestation, acte: IActeClinique, selAssure: number) {
        // Vérifier si tarif assurance existe pour cet acte (déjà filtré par assurance en amont)
        const tarifMatchedList = tarifsAssurance.filter((t) => t.Designation === (acte.Designation || ""));
        if (tarifMatchedList.length === 0) {
            // équivalent Erreur(...) et suppression tableau => on déclenche une erreur visible
            setErrorMsg(
                `Merci d'ajouter cet acte (${acte.Designation}) à la liste des actes de l'assurance avant cette opération.`
            );
            // on vide les lignes (comme TableSupprime)
            setLignes([]);
            return;
        }
        // sinon on parcourt les tarifs correspondants (tous pour cette assurance)
        for (const tarif of tarifMatchedList) {
            if (tarif.CoefficientActe === 1 && acte.CoefficientActe !== 1) {
                montantForfaitAssurance(ligne, acte, tarif, selAssure);
            } else if (tarif.CoefficientActe !== 1 && acte.CoefficientActe === 1) {
                montantForfaitClinique(ligne, acte, tarif, selAssure);
            } else {
                montantSansForfait(ligne, acte, tarif, selAssure);
            }
        }
    }

    function montantForfaitAssurance(
        ligne: ILignePrestation,
        acte: IActeClinique,
        tarif: ITarifAssurance,
        selAssure: number
    ) {
        // CAS OU COEF ASSURANCE EST UN FORFAIT  ON PREND LE COEFFICIENT DE L'ASSURANCE
        ligne.Coefficient = acte.CoefficientActe || 1;
        ligne.Coef_ASSUR = 0;
        ligne.CoefClinique = ligne.Coefficient;

        // selon SEL_Assure (selAssure)
        if (selAssure === 1) {
            tarifActeClinique(ligne, acte, selAssure);
            return;
        }

        // Case 2 (Mutualiste)
        if (selAssure === 2) {
            // plusieurs cas comparant TARIF_ASSURANCE.PrixMutualiste et ACTE.PrixMutualiste*ACTE.CoefficientActe
            const tPrix = tarif.PrixMutualiste ?? 0;
            const aPrix = acte.PrixMutualiste ?? 0;
            const aCoef = acte.CoefficientActe ?? 1;
            if (tPrix < aPrix * aCoef) {
                ligne.Prixunitaire = aPrix;
                ligne.Accepter = aPrix;
                ligne.SURPLUS = aPrix * aCoef - tPrix;
                ligne.TotalRelicatCoefAssur = ligne.Coef_ASSUR * aPrix * ligne.QteP;
                ligne.Reliquat = ligne.SURPLUS * ligne.QteP;
                ligne.COEFFICIENT_ASSURANCE = tarif.CoefficientActe || 0;
                ligne.TARIF_ASSURANCE = tPrix;
            } else if (tPrix === aPrix * aCoef) {
                ligne.Prixunitaire = aPrix;
                ligne.Accepter = aPrix;
                ligne.SURPLUS = 0;
                ligne.PrixTotal = ligne.Prixunitaire * ligne.Coefficient * ligne.QteP;
                ligne.COEFFICIENT_ASSURANCE = tarif.CoefficientActe || 0;
                ligne.TARIF_ASSURANCE = tPrix;
            } else {
                // tPrix > aPrix * coef
                ligne.CoefClinique = tarif.CoefficientActe || ligne.CoefClinique;
                ligne.Accepter = tarif.PrixMutualiste || tPrix;
                ligne.SURPLUS = 0;
                ligne.Prixunitaire = tarif.PrixMutualiste || tPrix;
                ligne.PrixTotal = ligne.Prixunitaire * ligne.Coefficient * ligne.QteP;
                ligne.COEFFICIENT_ASSURANCE = tarif.CoefficientActe || 0;
                ligne.TARIF_ASSURANCE = tPrix;
            }
            return;
        }

        // Case 3 (Assure)
        if (selAssure === 3) {
            const tPrix = tarif.PrixAssure ?? 0;
            const aPrix = acte.PrixAssure ?? 0;
            const aCoef = acte.CoefficientActe ?? 1;
            if (tPrix < aPrix * aCoef) {
                ligne.Prixunitaire = aPrix;
                ligne.Accepter = aPrix;
                ligne.SURPLUS = aPrix * aCoef - tPrix;
                ligne.TotalRelicatCoefAssur = ligne.Coef_ASSUR * aPrix * ligne.QteP;
                ligne.Reliquat = ligne.SURPLUS * ligne.QteP;
                ligne.COEFFICIENT_ASSURANCE = tarif.CoefficientActe || 0;
                ligne.TARIF_ASSURANCE = tPrix;
            } else if (tPrix === aPrix * aCoef) {
                ligne.Prixunitaire = aPrix;
                ligne.Accepter = aPrix;
                ligne.SURPLUS = 0;
                ligne.PrixTotal = ligne.Prixunitaire * ligne.Coefficient * ligne.QteP;
                ligne.COEFFICIENT_ASSURANCE = tarif.CoefficientActe || 0;
                ligne.TARIF_ASSURANCE = tPrix;
            } else {
                // tPrix > aPrix * coef
                ligne.CoefClinique = tarif.CoefficientActe || ligne.CoefClinique;
                ligne.Accepter = tarif.PrixAssure || tPrix;
                ligne.SURPLUS = 0;
                ligne.Prixunitaire = tarif.PrixAssure || tPrix;
                ligne.PrixTotal = ligne.Prixunitaire * ligne.Coefficient * ligne.QteP;
                ligne.COEFFICIENT_ASSURANCE = tarif.CoefficientActe || 0;
                ligne.TARIF_ASSURANCE = tPrix;
            }
            return;
        }
    }

    function montantForfaitClinique(
        ligne: ILignePrestation,
        acte: IActeClinique,
        tarif: ITarifAssurance,
        selAssure: number
    ) {
        // CAS OU COEF ASSURANCE EST UN FORFAIT  ON PREND LE COEFFICIENT DE L'ASSURANCE
        ligne.Coefficient = acte.CoefficientActe || 1;
        ligne.Coef_ASSUR = 0;
        ligne.CoefClinique = ligne.Coefficient;
        ligne.forfaitclinique = 0;

        if (selAssure === 1) {
            tarifActeClinique(ligne, acte, selAssure);
            return;
        }

        // Case 2 (Mutualiste)
        if (selAssure === 2) {
            const tPrix = tarif.PrixMutualiste ?? 0;
            const aPrix = acte.PrixMutualiste ?? 0;
            const tCoef = tarif.CoefficientActe ?? 1;
            if (tPrix * tCoef < aPrix) {
                ligne.forfaitclinique = 1;
                ligne.Prixunitaire = aPrix;
                ligne.Accepter = aPrix;
                ligne.SURPLUS = aPrix - tPrix * tCoef;
                ligne.TotalRelicatCoefAssur = 0;
                ligne.Reliquat = ligne.SURPLUS * ligne.QteP;
                ligne.COEFFICIENT_ASSURANCE = tarif.CoefficientActe || 0;
                ligne.TARIF_ASSURANCE = tPrix;
            } else if (tPrix * tCoef === aPrix) {
                ligne.Prixunitaire = aPrix;
                ligne.Accepter = aPrix;
                ligne.SURPLUS = 0;
                ligne.PrixTotal = ligne.Prixunitaire * ligne.Coefficient * ligne.QteP;
                ligne.COEFFICIENT_ASSURANCE = tarif.CoefficientActe || 0;
                ligne.TARIF_ASSURANCE = tPrix;
            } else {
                ligne.CoefClinique = tarif.CoefficientActe || ligne.CoefClinique;
                ligne.Accepter = tarif.PrixMutualiste || tPrix;
                ligne.SURPLUS = 0;
                ligne.Prixunitaire = tarif.PrixMutualiste || tPrix;
                ligne.PrixTotal = ligne.Prixunitaire * ligne.Coefficient * ligne.QteP;
                ligne.COEFFICIENT_ASSURANCE = tarif.CoefficientActe || 0;
                ligne.TARIF_ASSURANCE = tPrix;
            }
            return;
        }

        // Case 3 (Assure)
        if (selAssure === 3) {
            const tPrix = tarif.PrixAssure ?? 0;
            const aPrix = acte.PrixAssure ?? 0;
            const tCoef = tarif.CoefficientActe ?? 1;
            if (tPrix * tCoef < aPrix) {
                ligne.forfaitclinique = 1;
                ligne.Prixunitaire = aPrix;
                ligne.Accepter = aPrix;
                ligne.SURPLUS = aPrix - tPrix * tCoef;
                ligne.TotalRelicatCoefAssur = 0;
                ligne.Reliquat = ligne.SURPLUS * ligne.QteP;
                ligne.COEFFICIENT_ASSURANCE = tarif.CoefficientActe || 0;
                ligne.TARIF_ASSURANCE = tPrix;
            } else if (tPrix * tCoef === aPrix) {
                ligne.Prixunitaire = aPrix;
                ligne.Accepter = aPrix;
                ligne.SURPLUS = 0;
                ligne.PrixTotal = ligne.Prixunitaire * ligne.Coefficient * ligne.QteP;
                ligne.COEFFICIENT_ASSURANCE = tarif.CoefficientActe || 0;
                ligne.TARIF_ASSURANCE = tPrix;
            } else {
                ligne.CoefClinique = tarif.CoefficientActe || ligne.CoefClinique;
                ligne.Accepter = tarif.PrixAssure || tPrix;
                ligne.SURPLUS = 0;
                ligne.Prixunitaire = tarif.PrixAssure || tPrix;
                ligne.PrixTotal = ligne.Prixunitaire * ligne.Coefficient * ligne.QteP;
                ligne.COEFFICIENT_ASSURANCE = tarif.CoefficientActe || 0;
                ligne.TARIF_ASSURANCE = tPrix;
            }
            return;
        }
    }

    function montantSansForfait(
        ligne: ILignePrestation,
        acte: IActeClinique,
        tarif: ITarifAssurance,
        selAssure: number
    ) {
        // CAS OU COEF ASSURANCE < COEF CLINIQUE
        const tCoef = tarif.CoefficientActe ?? 0;
        const aCoef = acte.CoefficientActe ?? 0;
        if (tCoef < aCoef) {
            ligne.Coef_ASSUR = aCoef - tCoef;
        } else if (tCoef === aCoef) {
            ligne.Coef_ASSUR = 0;
        } else {
            // tCoef > aCoef
            ligne.Coefficient = tCoef;
            ligne.Coef_ASSUR = 0;
        }

        ligne.CoefClinique = ligne.Coefficient;

        // selon selAssure
        if (selAssure === 1) {
            tarifActeClinique(ligne, acte, selAssure);
            return;
        }

        if (selAssure === 2) {
            const tPrix = tarif.PrixMutualiste ?? 0;
            const aPrix = acte.PrixMutualiste ?? 0;
            if (tPrix < aPrix) {
                ligne.Prixunitaire = aPrix;
                ligne.Accepter = aPrix;
                ligne.SURPLUS = aPrix - tPrix;
                ligne.TotalRelicatCoefAssur = ligne.Coef_ASSUR * aPrix * ligne.QteP;
                ligne.Reliquat = ligne.SURPLUS * (tarif.CoefficientActe ?? 0) * ligne.QteP;
                ligne.COEFFICIENT_ASSURANCE = tarif.CoefficientActe || 0;
                ligne.TARIF_ASSURANCE = tPrix;
            } else if (tPrix === aPrix) {
                ligne.Prixunitaire = aPrix;
                ligne.Accepter = aPrix;
                ligne.SURPLUS = 0;
                ligne.PrixTotal = ligne.Prixunitaire * ligne.Coefficient * ligne.QteP;
                ligne.COEFFICIENT_ASSURANCE = tarif.CoefficientActe || 0;
                ligne.TARIF_ASSURANCE = tPrix;
            } else {
                ligne.Accepter = tarif.PrixMutualiste || tPrix;
                ligne.SURPLUS = 0;
                ligne.Prixunitaire = tarif.PrixMutualiste || tPrix;
                ligne.PrixTotal = ligne.Prixunitaire * ligne.Coefficient * ligne.QteP;
                ligne.COEFFICIENT_ASSURANCE = tarif.CoefficientActe || 0;
                ligne.TARIF_ASSURANCE = tPrix;
            }
            return;
        }

        // selAssure === 3
        if (selAssure === 3) {
            const tPrix = tarif.PrixAssure ?? 0;
            const aPrix = acte.PrixAssure ?? 0;
            if (tPrix < aPrix) {
                ligne.Prixunitaire = aPrix;
                ligne.Accepter = aPrix;
                ligne.SURPLUS = aPrix - tPrix;
                ligne.TotalRelicatCoefAssur = ligne.Coef_ASSUR * aPrix * ligne.QteP;
                ligne.Reliquat = ligne.SURPLUS * (tarif.CoefficientActe ?? 0) * ligne.QteP;
                ligne.COEFFICIENT_ASSURANCE = tarif.CoefficientActe || 0;
                ligne.TARIF_ASSURANCE = tPrix;
            } else if (tPrix === aPrix) {
                ligne.Prixunitaire = aPrix;
                ligne.Accepter = aPrix;
                ligne.SURPLUS = 0;
                ligne.PrixTotal = ligne.Prixunitaire * ligne.Coefficient * ligne.QteP;
                ligne.COEFFICIENT_ASSURANCE = tarif.CoefficientActe || 0;
                ligne.TARIF_ASSURANCE = tPrix;
            } else {
                ligne.SURPLUS = 0;
                ligne.Prixunitaire = tarif.PrixAssure || tPrix;
                ligne.Accepter = tarif.PrixAssure || tPrix;
                ligne.PrixTotal = ligne.Prixunitaire * ligne.Coefficient * ligne.QteP;
                ligne.COEFFICIENT_ASSURANCE = tarif.CoefficientActe || 0;
                ligne.TARIF_ASSURANCE = tPrix;
            }
            return;
        }
    }

    function prixActe(ligne: ILignePrestation, acte?: IActeClinique) {
        // TABLE_PRESTATION.Prixunitaire = TABLE_PRESTATION.Accepter
        ligne.Prixunitaire = ligne.Accepter || ligne.Prixunitaire || 0;
        // initial PrixTotal
        ligne.PrixTotal = ligne.Prixunitaire * ligne.Coefficient * ligne.QteP; // + taxe si besoin

        if (assuranceId !== 1) {
            // Avec assurance
            if (ligne.Exclusion === "Accepter") {
                //On actualise le coefficient acte
                ligne.Coefficient = ligne.CoefClinique || ligne.Coefficient;
                ligne.PrixTotal = ligne.Coefficient * ligne.Prixunitaire * ligne.QteP;

                if (ligne.TARIF_ASSURANCE === 0) {
                    // TARIF_ASSURANCE non paramétré
                    ligne.PartAssurance = (saiTaux * ligne.Prixunitaire * ligne.Coefficient * ligne.QteP) / 100;
                    ligne.PartAssure = ligne.PrixTotal - ligne.PartAssurance;
                    ligne.Reliquat = 0;
                    ligne.Coef_ASSUR = 0;
                    ligne.SURPLUS = 0;
                    ligne.TotalRelicatCoefAssur = 0;
                } else {
                    ligne.PartAssurance =
                        (saiTaux * ligne.TARIF_ASSURANCE * ligne.COEFFICIENT_ASSURANCE * ligne.QteP) / 100;
                    ligne.PartAssure =
                        ligne.TARIF_ASSURANCE * ligne.COEFFICIENT_ASSURANCE * ligne.QteP - ligne.PartAssurance;
                    ligne.Reliquat = ligne.SURPLUS * ligne.COEFFICIENT_ASSURANCE * ligne.QteP;
                    ligne.TotalRelicatCoefAssur =
                        ligne.Coef_ASSUR * ligne.Prixunitaire * ligne.QteP;
                }
            } else {
                // Exclusion = Refuser
                ligne.Coefficient = acte?.CoefficientActe ?? ligne.Coefficient;
                ligne.PartAssurance = 0;
                ligne.TotalRelicatCoefAssur = 0;
                ligne.Reliquat = 0;
                ligne.Prixunitaire = ligne.Refuser || ligne.Prixunitaire;
                ligne.PrixTotal = ligne.Coefficient * ligne.Prixunitaire * ligne.QteP;
                ligne.PartAssure = ligne.PrixTotal;
            }
        } else {
            // Sans assurance
            ligne.PartAssurance = 0;
            ligne.TotalRelicatCoefAssur = 0;
            ligne.COEFFICIENT_ASSURANCE = 0;
            ligne.TARIF_ASSURANCE = 0;
            ligne.Reliquat = 0;
            ligne.Coef_ASSUR = 0;
            ligne.SURPLUS = 0;
            ligne.PartAssure = ligne.PrixTotal;
        }

        // On cherche le cas ou le montant est pour le médecin
        if (acte && (acte.MontantAuMed === 1 || acte.MontantAuMed === "1")) {
            ligne.StatutMedecinActe = "OUI";
            ligne.Montant_MedExecutant = ligne.PrixTotal;
        } else {
            ligne.StatutMedecinActe = "NON";
            ligne.Montant_MedExecutant = 0;
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
            montantARegler: 0
        };

        for (const l of lignes) {
            s.montantTotal += Number(l.PrixTotal || 0);
            s.partAssurance += Number(l.PartAssurance || 0);
            s.partAssure += Number(l.PartAssure || 0);
            s.totalTaxe += Number(l.TAXE || 0);
            s.totalSurplus += Number((l.Reliquat || 0) + (l.TotalRelicatCoefAssur || 0));
            s.montantExecutant += Number(l.Montant_MedExecutant || 0);
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
                const checkRes = await fetch(`/api/ligneprestation?id=${encodeURIComponent(id)}`);
                
                if (checkRes.ok) {
                    const data = await checkRes.json();
                    const ligneDB = data.data;

                    // SI LIGNE_PRESTATION.StatutPrescriptionMedecin=3 ALORS
                    if (ligneDB && ligneDB.statutPrescriptionMedecin === 3) {
                        alert("Acte déjà facturé");
                        return;
                    }

                    // SINON HSupprime(LIGNE_PRESTATION)
                    const deleteRes = await fetch(`/api/ligneprestation?id=${encodeURIComponent(id)}`, {
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

                // Selon COMBO_Assurance (prop assuranceId)
                if (assuranceId === 1) {
                    // sans assurance -> tarif acte clinique
                    tarifActeClinique(copy, acte, 1);
                } else {
                    // il y a une assurance -> tarif acte assurance
                    tarifActeAssurance(copy, acte, assuranceId);
                }

                // Si le montant total de l'acte est pour le médecin exécutant
                if (acte.MontantAuMed === 1 || acte.MontantAuMed === "1") {
                    copy.StatutMedecinActe = "OUI";
                    // sera recalculé après prixActe carPrixTotal est recalculé ensuite
                } else {
                    copy.StatutMedecinActe = "NON";
                    copy.Montant_MedExecutant = 0;
                }

                // Calcul du prix
                prixActe(copy, acte);

                // si MontantAuMed=1, on chante la valeur
                if (acte.MontantAuMed === 1 || acte.MontantAuMed === "1") {
                    copy.Montant_MedExecutant = copy.PrixTotal;
                }

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

                // Recalculs importants si changement sur quantité, exclusion, accepter/refuser, prix unitaire
                const acte = findActeById(copy.IDACTE);
                // si acte existe, appliquer prixActe (en fonction de assuranceId et tarifs)
                if (acte) {
                    // si assurance active, on peut rechopper le tarif correspondant
                    if (assuranceId === 1) {
                        tarifActeClinique(copy, acte, 1);
                    } else {
                        // chercher tarif correspondant - si absent, tarifActeAssurance gère l'erreur
                        tarifActeAssurance(copy, acte, assuranceId);
                    }
                    prixActe(copy, acte);
                } else {
                    // pas d'acte sélectionné -> recalcul simple
                    copy.PrixTotal = (copy.Prixunitaire || 0) * (copy.Coefficient || 1) * (copy.QteP || 1);
                }
                return copy;
            })
        );
    }

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

            <div className="table-responsive" style={{ maxHeight: "60vh", overflow: "auto" }}>
                <Table bordered hover size="sm" className="mb-0">
                    <thead className="table-light" style={{ position: "sticky", top: 0, zIndex: 2 }}>
                        <tr>
                            {/* Colonnes visibles */}
                            <th style={{ width: '120px' }}>Date</th>
                            <th style={{ minWidth: '220px' }}>Acte</th>
                            <th style={{ width: '80px' }}>Coef</th>
                            <th style={{ width: '70px' }}>Qté</th>
                            <th style={{ width: '120px' }}>Prix unitaire</th>
                            <th style={{ width: '120px' }}>Prix Total</th>
                            <th style={{ width: '120px' }}>Exclusion</th>
                            <th style={{ width: '60px', textAlign: 'center' }}>🗑️</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lignes.map((l) => {
                            // Vérifier si la ligne est modifiable (statutPrescriptionMedecin < 3)
                            const isEditable = (l.Statutprescription ?? 2) < 3;
                            const rowStyle = !isEditable ? { backgroundColor: '#f8f9fa', opacity: 0.7 } : {};
                            
                            return (
                            <tr key={l.IDLignePrestation} style={rowStyle}>
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
                                        <SearchableActeSelect
                                            actes={actes}
                                            selectedId={l.IDACTE || ""}
                                            onSelect={(acteId: string) => onSelectActe(l.IDLignePrestation, acteId)}
                                        />
                                    ) : (
                                        <div style={{ fontSize: '13px', padding: '6px', color: '#6c757d' }} title="Acte déjà facturé - modification impossible">
                                            {l.Acte}
                                        </div>
                                    )}
                                </td>

                                {/* Coefficient */}
                                <td style={{ padding: '4px' }}>
                                    <Form.Control
                                        size="sm"
                                        type="number"
                                        step="1"
                                        value={l.Coefficient}
                                        onChange={(e) =>
                                            onFieldChangeAndRecalc(l.IDLignePrestation, "Coefficient", parseInt(e.target.value) || 0)
                                        }
                                        style={{ fontSize: '13px', textAlign: 'center' }}
                                        disabled={!isEditable}
                                        title={!isEditable ? "Acte déjà facturé - modification impossible" : ""}
                                    />
                                </td>

                                {/* QtéP */}
                                <td style={{ padding: '4px' }}>
                                    <Form.Control
                                        size="sm"
                                        type="number"
                                        step="1"
                                        value={l.QteP}
                                        onChange={(e) =>
                                            onFieldChangeAndRecalc(l.IDLignePrestation, "QteP", parseInt(e.target.value) || 0)
                                        }
                                        style={{ fontSize: '13px', textAlign: 'center' }}
                                        disabled={!isEditable}
                                        title={!isEditable ? "Acte déjà facturé - modification impossible" : ""}
                                    />
                                </td>

                                {/* Prixunitaire */}
                                <td style={{ padding: '4px' }}>
                                    <InputGroup size="sm">
                                        <Form.Control
                                            type="number"
                                            step="1"
                                            value={l.Prixunitaire}
                                            onChange={(e) =>
                                                onFieldChangeAndRecalc(l.IDLignePrestation, "Prixunitaire", parseInt(e.target.value) || 0)
                                            }
                                            style={{ fontSize: '13px', textAlign: 'right' }}
                                            disabled={!isEditable}
                                            title={!isEditable ? "Acte déjà facturé - modification impossible" : ""}
                                        />
                                    </InputGroup>
                                </td>

                                {/* PrixTotal */}
                                <td style={{ textAlign: 'right', fontWeight: 'bold', padding: '8px', fontSize: '13px' }}>
                                    {Math.round(Number(l.PrixTotal || 0)).toLocaleString('fr-FR')}
                                </td>

                                {/* Exclusion */}
                                <td style={{ padding: '4px' }}>
                                    <Form.Select
                                        size="sm"
                                        value={l.Exclusion}
                                        onChange={(e) =>
                                            onFieldChangeAndRecalc(
                                                l.IDLignePrestation,
                                                "Exclusion",
                                                e.target.value === "Accepter" ? "Accepter" : "Refuser"
                                            )
                                        }
                                        style={{ fontSize: '13px' }}
                                        disabled={!isEditable}
                                        title={!isEditable ? "Acte déjà facturé - modification impossible" : ""}
                                    >
                                        <option value="Accepter">✓Accepter</option>
                                        <option value="Refuser">✗Refuser</option>
                                    </Form.Select>
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

            {/*  <div className="mt-3">
                <Row>
                    <Col>
                        <strong>Montant total:</strong> {totaux.montantTotal.toFixed(2)}
                    </Col>
                    <Col>
                        <strong>Part assurance:</strong> {totaux.partAssurance.toFixed(2)}
                    </Col>
                    <Col>
                        <strong>Part Assure:</strong> {totaux.partAssure.toFixed(2)}
                    </Col>
                    <Col>
                        <strong>Montant exécutant:</strong> {totaux.montantExecutant.toFixed(2)}
                    </Col>
                    <Col className="text-end">
                        <Button
                            size="sm"
                            variant="success"
                            onClick={() => {
                                // action sauvegarde ou print — ici on renvoit l'état console
                                console.log("Lignes:", lignes);
                                console.log("Totaux:", totaux);
                                alert("Données prêtes (voir console).");
                            }}
                        >
                            Enregistrer / Vérifier (console)
                        </Button>
                    </Col>
                </Row>
            </div> */}
        </div>
    );
}
