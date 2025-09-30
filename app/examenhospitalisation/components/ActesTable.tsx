
"use client";

import React, { useEffect, useState } from "react";
import { Table, Form, Button, InputGroup, Row, Col, Alert } from "react-bootstrap";

type AssuranceId = number; // 1: Non assuré, 2: Mutualiste, 3: Préférentiel

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
    Action?: string;
}
// utilise Assurance et le taux de assurance info


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
        if (Array.isArray(presetLines)) {
            setLignes(presetLines);
        } else {
            setLignes([]);
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

        // selon SEL_Assuré (selAssure)
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

        // Case 3 (Assuré)
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

        // Case 3 (Assuré)
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

    function removeLigne(id: string) {
        setLignes((prev) => prev.filter((p) => p.IDLignePrestation !== id));
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
                copy.Lettre_Cle = acte.LettreCle || "";
                copy.DATE = new Date().toISOString().split("T")[0];
                copy.IDACTE = acte._id;
                copy.Exclusion = "Accepter";
                copy.Coefficient = acte.CoefficientActe && acte.CoefficientActe !== 0 ? acte.CoefficientActe : 1;
                if (!copy.QteP || copy.QteP === 0) copy.QteP = 1;
                copy.Statutprescription = 2;
                copy.Refuser = acte.Prix || 0;

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
                <Col>
                    <h5>Table Prestations (édition)</h5>
                </Col>
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
                            {/* Affiche les 30 colonnes demandées */}
                            <th>Date</th>
                            <th>Acte</th>
                            <th>Lettre Clé</th>
                            <th>Coefficient</th>
                            <th>QtéP</th>
                            <th>Coef_ASSUR</th>
                            <th>SURPLUS</th>
                            <th>Prixunitaire</th>
                            <th>TAXE</th>
                            <th>PrixTotal</th>
                            <th>PartAssurance</th>
                            <th>PartAssure</th>
                            <th>IDTYPE</th>
                            <th>Reliquat</th>
                            <th>TotalRelicatCoefAssur</th>
                            <th>Montant_MedExécutant</th>
                            <th>StatutMedecinActe</th>
                            <th>IDACTE</th>
                            <th>Exclusion</th>
                            <th>COEFFICIENT_ASSURANCE</th>
                            <th>TARIF_ASSURANCE</th>
                            <th>IDHOSPO</th>
                            <th>IDFAMILLE</th>
                            <th>Refuser</th>
                            <th>Accepter</th>
                            <th>IDLignePrestation</th>
                            <th>Statutprescription</th>
                            <th>CoefClinique</th>
                            <th>forfaitclinique</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lignes.map((l) => (
                            <tr key={l.IDLignePrestation}>
                                <td>
                                    <Form.Control
                                        size="sm"
                                        type="date"
                                        value={l.DATE}
                                        onChange={(e) => onChangeField(l.IDLignePrestation, "DATE", e.target.value)}
                                    />
                                </td>

                                <td style={{ minWidth: 220 }}>
                                    <Form.Select
                                        size="sm"
                                        value={l.IDACTE || ""}
                                        onChange={(e) => onSelectActe(l.IDLignePrestation, e.target.value)}
                                    >
                                        <option value="">-- sélectionner acte --</option>
                                        {actes.map((a) => (
                                            <option key={a._id} value={a._id}>
                                                {a.Designation}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </td>

                                <td>
                                    <Form.Control
                                        size="sm"
                                        type="text"
                                        value={l.Lettre_Cle || ""}
                                        onChange={(e) => onFieldChangeAndRecalc(l.IDLignePrestation, "Lettre_Cle", e.target.value)}
                                    />
                                </td>

                                <td>
                                    <Form.Control
                                        size="sm"
                                        type="number"
                                        step="0.01"
                                        value={l.Coefficient}
                                        onChange={(e) =>
                                            onFieldChangeAndRecalc(l.IDLignePrestation, "Coefficient", Number(e.target.value))
                                        }
                                    />
                                </td>

                                <td>
                                    <Form.Control
                                        size="sm"
                                        type="number"
                                        value={l.QteP}
                                        onChange={(e) =>
                                            onFieldChangeAndRecalc(l.IDLignePrestation, "QteP", Number(e.target.value))
                                        }
                                    />
                                </td>

                                <td>
                                    <Form.Control
                                        size="sm"
                                        type="number"
                                        value={l.Coef_ASSUR}
                                        onChange={(e) =>
                                            onFieldChangeAndRecalc(l.IDLignePrestation, "Coef_ASSUR", Number(e.target.value))
                                        }
                                    />
                                </td>

                                <td>
                                    <Form.Control
                                        size="sm"
                                        type="number"
                                        value={l.SURPLUS}
                                        onChange={(e) => onFieldChangeAndRecalc(l.IDLignePrestation, "SURPLUS", Number(e.target.value))}
                                    />
                                </td>

                                <td>
                                    <InputGroup size="sm">
                                        <Form.Control
                                            type="number"
                                            value={l.Prixunitaire}
                                            onChange={(e) =>
                                                onFieldChangeAndRecalc(l.IDLignePrestation, "Prixunitaire", Number(e.target.value))
                                            }
                                        />
                                    </InputGroup>
                                </td>

                                <td>
                                    <Form.Control
                                        size="sm"
                                        type="number"
                                        value={l.TAXE}
                                        onChange={(e) => onFieldChangeAndRecalc(l.IDLignePrestation, "TAXE", Number(e.target.value))}
                                    />
                                </td>

                                <td>{Number(l.PrixTotal || 0).toFixed(2)}</td>

                                <td>{Number(l.PartAssurance || 0).toFixed(2)}</td>
                                <td>{Number(l.PartAssure || 0).toFixed(2)}</td>

                                <td>
                                    <Form.Control
                                        size="sm"
                                        type="text"
                                        value={l.IDTYPE}
                                        onChange={(e) => onFieldChangeAndRecalc(l.IDLignePrestation, "IDTYPE", e.target.value)}
                                    />
                                </td>

                                <td>{Number(l.Reliquat || 0).toFixed(2)}</td>
                                <td>{Number(l.TotalRelicatCoefAssur || 0).toFixed(2)}</td>
                                <td>{Number(l.Montant_MedExecutant || 0).toFixed(2)}</td>
                                <td>{l.StatutMedecinActe}</td>

                                <td>{l.IDACTE}</td>

                                <td>
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
                                    >
                                        <option value="Accepter">Accepter</option>
                                        <option value="Refuser">Refuser</option>
                                    </Form.Select>
                                </td>

                                <td>{Number(l.COEFFICIENT_ASSURANCE || 0).toFixed(2)}</td>
                                <td>{Number(l.TARIF_ASSURANCE || 0).toFixed(2)}</td>

                                <td>
                                    <Form.Control
                                        size="sm"
                                        type="text"
                                        value={String(l.IDHOSPO)}
                                        onChange={(e) => onFieldChangeAndRecalc(l.IDLignePrestation, "IDHOSPO", e.target.value)}
                                    />
                                </td>

                                <td>
                                    <Form.Control
                                        size="sm"
                                        type="text"
                                        value={l.IDFAMILLE}
                                        onChange={(e) => onFieldChangeAndRecalc(l.IDLignePrestation, "IDFAMILLE", e.target.value)}
                                    />
                                </td>

                                <td>
                                    <Form.Control
                                        size="sm"
                                        type="number"
                                        value={l.Refuser}
                                        onChange={(e) => onFieldChangeAndRecalc(l.IDLignePrestation, "Refuser", Number(e.target.value))}
                                    />
                                </td>

                                <td>
                                    <Form.Control
                                        size="sm"
                                        type="number"
                                        value={l.Accepter}
                                        onChange={(e) => onFieldChangeAndRecalc(l.IDLignePrestation, "Accepter", Number(e.target.value))}
                                    />
                                </td>

                                <td>{l.IDLignePrestation}</td>

                                <td>{l.Statutprescription}</td>
                                <td>{Number(l.CoefClinique || 0).toFixed(2)}</td>
                                <td>{l.forfaitclinique}</td>

                                <td>
                                    <Button variant="danger" size="sm" onClick={() => removeLigne(l.IDLignePrestation)}>
                                        Supprimer
                                    </Button>
                                </td>
                            </tr>
                        ))}
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
                        <strong>Part assuré:</strong> {totaux.partAssure.toFixed(2)}
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
