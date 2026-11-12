"use client";

import React, { useEffect, useRef, useState } from "react";
import { Form } from "react-bootstrap";

export interface LitSelection {
    litId: string;
    chambreId: string;
    litNumero?: string;
    chambreNumero?: string;
}

interface LitSelectorProps {
    /** Identifiant de l'acte clinique sélectionné sur la ligne */
    acteId?: string;
    /** Lit actuellement enregistré sur le séjour (mode modification) */
    litId?: string;
    /** Inclure le lit occupé même s'il n'est pas libre */
    includeLitId?: string;
    onChange: (selection: LitSelection | null) => void;
}

interface ChambreInfo {
    _id: string;
    numero: string;
    type?: string;
}

interface LitInfo {
    _id: string;
    numero: string;
}

/**
 * Quand l'acte sélectionné correspond à une chambre (lien Chambre.acteCliniqueId),
 * propose directement ses lits libres. Le lit déjà attribué est réinjecté dans la liste.
 */
export default function LitSelector({ acteId, litId, includeLitId, onChange }: LitSelectorProps) {
    const [chambre, setChambre] = useState<ChambreInfo | null>(null);
    const [lits, setLits] = useState<LitInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const lastActeId = useRef<string | undefined>(undefined);

    useEffect(() => {
        if (lastActeId.current === acteId) return;
        lastActeId.current = acteId;
        setChambre(null);
        setLits([]);
        if (!acteId) {
            onChange(null);
            return;
        }
        let cancelled = false;
        setLoading(true);
        (async () => {
            try {
                const res = await fetch(`/api/chambres/par-acte?acteId=${acteId}`);
                const data = res.ok ? await res.json() : null;
                if (cancelled) return;
                if (!data?.chambre) {
                    setChambre(null);
                    setLits([]);
                    onChange(null);
                    return;
                }
                const ch: ChambreInfo = data.chambre;
                let listeLits: LitInfo[] = Array.isArray(data.lits) ? [...data.lits] : [];
                const litARestaurer = litId || includeLitId;
                // Le lit déjà occupé par ce patient n'est pas "libre" : le réinjecter
                if (litARestaurer && !listeLits.some((l) => l._id === litARestaurer)) {
                    try {
                        const resLits = await fetch(`/api/lits?chambreId=${ch._id}`);
                        const tous = resLits.ok ? await resLits.json() : [];
                        const litCourant = Array.isArray(tous) ? tous.find((l: any) => l._id === litARestaurer) : null;
                        if (!cancelled && litCourant) listeLits = [litCourant, ...listeLits];
                    } catch { }
                }
                if (cancelled) return;
                setChambre(ch);
                setLits(listeLits);
            } catch {
                if (!cancelled) {
                    setChambre(null);
                    setLits([]);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [acteId]);

    if (!acteId) return null;
    if (loading) {
        return <div className="mt-1 text-muted" style={{ fontSize: "12px" }}>Recherche de la chambre…</div>;
    }
    if (!chambre) return null;
    if (lits.length === 0) {
        return (
            <div className="mt-1 text-danger" style={{ fontSize: "12px" }}>
                Chambre {chambre.numero} : aucun lit libre
            </div>
        );
    }

    return (
        <Form.Select
            size="sm"
            className="mt-1"
            style={{ fontSize: "13px", borderColor: "#0dcaf0" }}
            value={litId || ""}
            onChange={(e) => {
                const value = e.target.value;
                if (!value) {
                    onChange(null);
                    return;
                }
                const lit = lits.find((l) => l._id === value);
                onChange({
                    litId: value,
                    chambreId: String(chambre._id),
                    litNumero: lit?.numero,
                    chambreNumero: chambre.numero,
                });
            }}
        >
            <option value="">— Choisir le lit · Chambre {chambre.numero} —</option>
            {lits.map((lit) => (
                <option key={lit._id} value={lit._id}>Lit {lit.numero}</option>
            ))}
        </Form.Select>
    );
}
