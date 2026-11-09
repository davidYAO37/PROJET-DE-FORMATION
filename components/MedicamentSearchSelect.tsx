"use client";

import React, { useEffect, useRef, useState } from "react";
import { Form, Spinner } from "react-bootstrap";
import { Pharmacie } from "@/types/pharmacie";

const PAGE = 30;

/** Recherche serveur paginée dans le catalogue (insensible aux accents). */
export async function searchMedicaments(q: string, limit = PAGE, skip = 0): Promise<{ items: Pharmacie[]; total: number }> {
  const params = new URLSearchParams({ q, limit: String(limit), skip: String(skip) });
  const res = await fetch(`/api/medicaments?${params}`);
  if (!res.ok) throw new Error("Recherche de médicaments impossible");
  const items = await res.json();
  return { items: Array.isArray(items) ? items : [], total: Number(res.headers.get("X-Total-Count")) || 0 };
}

/** Charge des médicaments précis par leur ID. */
export async function fetchMedicamentsByIds(ids: string[]): Promise<Pharmacie[]> {
  const uniques = Array.from(new Set(ids.filter(Boolean)));
  if (!uniques.length) return [];
  const res = await fetch(`/api/medicaments?ids=${uniques.join(",")}`);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

/** Stock par ID de médicament (QteEnStock, seuils...). */
export async function fetchStocksParMedicament(): Promise<Map<string, any>> {
  const res = await fetch("/api/stock");
  const data = res.ok ? await res.json() : [];
  const map = new Map<string, any>();
  for (const s of Array.isArray(data) ? data : []) if (s?.IDMEDICAMENT) map.set(String(s.IDMEDICAMENT), s);
  return map;
}

/** Médicaments ayant du stock (> 0), enrichis de StockDisponible — sans charger tout le catalogue. */
export async function fetchMedicamentsEnStock<T = Pharmacie>(): Promise<(T & { StockDisponible: number })[]> {
  const res = await fetch("/api/stock?inStock=true");
  const stocks = res.ok ? await res.json() : [];
  const qte = new Map<string, number>();
  for (const s of Array.isArray(stocks) ? stocks : []) {
    if (s?.IDMEDICAMENT && Number(s.QteEnStock) > 0) qte.set(String(s.IDMEDICAMENT), Number(s.QteEnStock));
  }
  const meds = await fetchMedicamentsByIds(Array.from(qte.keys()));
  return meds.map((m) => ({ ...(m as unknown as T), StockDisponible: qte.get(String(m._id)) || 0 }));
}

type Props = {
  value: Pharmacie | null;
  onSelect: (medicament: Pharmacie | null) => void;
  placeholder?: string;
  size?: "sm" | "lg";
  disabled?: boolean;
  required?: boolean;
};

export default function MedicamentSearchSelect({ value, onSelect, placeholder = "Rechercher un médicament...", size = "sm", disabled, required }: Props) {
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Pharmacie[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const requete = useRef(0);

  // Recherche serveur avec anti-rebond
  useEffect(() => {
    if (!open) return;
    const id = ++requete.current;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await searchMedicaments(term);
        if (id === requete.current) { setItems(r.items); setTotal(r.total); }
      } catch {
        if (id === requete.current) { setItems([]); setTotal(0); }
      } finally {
        if (id === requete.current) setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [term, open]);

  useEffect(() => {
    if (open && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setPosition({ top: rect.bottom + 4, left: rect.left, width: Math.max(rect.width, 320) });
    }
  }, [open]);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node) && !inputRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setTerm("");
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const choisir = (m: Pharmacie) => {
    onSelect(m);
    setOpen(false);
    setTerm("");
  };

  return (
    <div style={{ position: "relative" }}>
      <Form.Control
        ref={inputRef}
        size={size}
        type="text"
        placeholder={placeholder}
        disabled={disabled}
        required={required && !value}
        value={open ? term : value ? `${value.Reference ? `[${value.Reference}] ` : ""}${value.Designation}` : ""}
        onChange={(e) => { setTerm(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        style={{ fontSize: 13 }}
      />
      {open && (
        <div
          ref={dropdownRef}
          style={{
            position: "fixed", top: position.top, left: position.left, width: position.width,
            maxHeight: 260, overflow: "auto", background: "white", border: "1px solid #dee2e6",
            borderRadius: 6, boxShadow: "0 .5rem 1rem rgba(0,0,0,.15)", zIndex: 2000,
          }}
        >
          <div style={{ padding: "4px 8px", fontSize: 11, color: "#6c757d", background: "#f8f9fa", borderBottom: "1px solid #eee" }}>
            {loading ? <><Spinner animation="border" size="sm" /> Recherche...</> : `${total} résultat${total > 1 ? "s" : ""}${total > items.length ? ` — ${items.length} affichés, précisez la recherche` : ""}`}
          </div>
          {!loading && items.length === 0 && (
            <div style={{ padding: 8, fontSize: 13, color: "#6c757d", textAlign: "center" }}>Aucun médicament trouvé</div>
          )}
          {items.map((m) => (
            <div
              key={m._id}
              onClick={() => choisir(m)}
              style={{ padding: 8, cursor: "pointer", fontSize: 13, borderBottom: "1px solid #f8f9fa", background: m._id === value?._id ? "#e3f2fd" : "white" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f8f9fa")}
              onMouseLeave={(e) => (e.currentTarget.style.background = m._id === value?._id ? "#e3f2fd" : "white")}
            >
              <div className="fw-bold">{m.Designation}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: 11 }}>
                {m.Reference && <span className="text-muted">Réf. {m.Reference}</span>}
                {!!m.PrixAchat && <span className="text-primary">Achat : {m.PrixAchat} FCFA</span>}
                {!!m.PrixVente && <span className="text-success">Vente : {m.PrixVente} FCFA</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
