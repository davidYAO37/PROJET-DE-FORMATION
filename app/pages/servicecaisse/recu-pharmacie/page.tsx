"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type FacturationResponse =
  | { success: true; data: any }
  | { success?: false; error?: string; message?: string };

export default function RecuPharmaciePage() {
  const searchParams = useSearchParams();
  const facturationId = searchParams.get("facturationId") || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [facture, setFacture] = useState<any>(null);
  const [lignes, setLignes] = useState<any[]>([]);

  const lignesPayees = useMemo(
    () => (lignes || []).filter((l) => (l?.actePayeCaisse || "").toString() === "Payé"),
    [lignes],
  );

  useEffect(() => {
    const run = async () => {
      if (!facturationId) {
        setError("Facturation manquante");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/facturation?id=${encodeURIComponent(facturationId)}`);
        const payload = (await res.json().catch(() => null)) as FacturationResponse | null;

        if (!res.ok || !payload || (payload as any).success !== true) {
          throw new Error((payload as any)?.error || (payload as any)?.message || "Impossible de charger la facturation");
        }

        const data = (payload as any).data;
        setFacture(data);

        const idPrescription = data?.IDPRESCRIPTION || data?.idPrescription || "";
        const codePrest = data?.CodePrestation || data?.Code_Prestation || "";

        if (idPrescription) {
          const url =
            `/api/patientprescriptionFacture?IDPRESCRIPTION=${encodeURIComponent(idPrescription)}` +
            (codePrest ? `&Code_Prestation=${encodeURIComponent(codePrest)}` : "");
          const lignesRes = await fetch(url);
          const lignesData = await lignesRes.json().catch(() => []);
          setLignes(Array.isArray(lignesData) ? lignesData : []);
        } else {
          setLignes([]);
        }
      } catch (e: any) {
        setError(e?.message || "Erreur lors du chargement du reçu");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [facturationId]);

  useEffect(() => {
    // Auto-impression et fermeture (comportement attendu type iImprimeEtat)
    if (!loading && !error && facture) {
      const t = window.setTimeout(() => {
        window.print();
        window.setTimeout(() => window.close(), 300);
      }, 300);
      return () => window.clearTimeout(t);
    }
  }, [loading, error, facture]);

  if (loading) return <div style={{ padding: 24 }}>Chargement du reçu...</div>;
  if (error) return <div style={{ padding: 24, color: "crimson" }}>{error}</div>;

  const montantTotal = Number(facture?.Montanttotal || facture?.montantTotal || 0);
  const partAssurance = Number(facture?.PartAssuranceP || facture?.partAssurance || 0);
  const partAssure = Number(facture?.Partassuré || facture?.Partassure || facture?.partAssure || 0);
  const remise = Number(facture?.reduction || facture?.Remise || 0);
  const montantRecu = Number(facture?.MontantRecu || facture?.montantRecu || 0);
  const reste = Number(facture?.Restapayer || facture?.resteAPayer || 0);

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial" }}>
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .ticket { box-shadow: none !important; border: none !important; }
        }
      `}</style>

      <div className="no-print" style={{ marginBottom: 16 }}>
        <button onClick={() => window.print()} style={{ padding: "8px 12px" }}>
          Imprimer
        </button>
      </div>

      <div className="ticket" style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, maxWidth: 720 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>REÇU PHARMACIE</div>
            <div style={{ color: "#555" }}>Facturation: {facturationId}</div>
            <div style={{ color: "#555" }}>Code prestation: {facture?.CodePrestation || facture?.Code_Prestation || ""}</div>
          </div>
          <div style={{ textAlign: "right", color: "#555" }}>
            <div>Date: {(facture?.DateFacturation || facture?.DateModif || "").toString().slice(0, 10)}</div>
            <div>Mode paiement: {facture?.Modepaiement || ""}</div>
          </div>
        </div>

        <hr style={{ margin: "12px 0" }} />

        <div style={{ marginBottom: 8 }}>
          <div style={{ fontWeight: 600 }}>Patient</div>
          <div>{facture?.PatientP || ""}</div>
          <div style={{ color: "#555" }}>
            Num bon: {facture?.NumBon || ""} {facture?.SOCIETE_PATIENT ? `- Société: ${facture?.SOCIETE_PATIENT}` : ""}
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Détails</div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1px solid #eee", padding: "6px 4px" }}>Médicament</th>
                <th style={{ textAlign: "right", borderBottom: "1px solid #eee", padding: "6px 4px" }}>Qté</th>
                <th style={{ textAlign: "right", borderBottom: "1px solid #eee", padding: "6px 4px" }}>PU</th>
                <th style={{ textAlign: "right", borderBottom: "1px solid #eee", padding: "6px 4px" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {lignesPayees.map((l) => (
                <tr key={String(l?._id || Math.random())}>
                  <td style={{ padding: "6px 4px", borderBottom: "1px solid #fafafa" }}>{l?.nomMedicament || ""}</td>
                  <td style={{ padding: "6px 4px", borderBottom: "1px solid #fafafa", textAlign: "right" }}>{Number(l?.QteP || 0)}</td>
                  <td style={{ padding: "6px 4px", borderBottom: "1px solid #fafafa", textAlign: "right" }}>{Number(l?.prixUnitaire || 0).toLocaleString()}</td>
                  <td style={{ padding: "6px 4px", borderBottom: "1px solid #fafafa", textAlign: "right" }}>{Number(l?.prixTotal || 0).toLocaleString()}</td>
                </tr>
              ))}
              {lignesPayees.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: "10px 4px", color: "#777" }}>
                    Aucune ligne payée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <hr style={{ margin: "12px 0" }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ color: "#555" }}>
            <div>Total: {montantTotal.toLocaleString()} FCFA</div>
            <div>Part assurance: {partAssurance.toLocaleString()} FCFA</div>
            <div>Part patient: {partAssure.toLocaleString()} FCFA</div>
          </div>
          <div style={{ textAlign: "right", color: "#555" }}>
            <div>Remise: {remise.toLocaleString()} FCFA</div>
            <div>Reçu: {montantRecu.toLocaleString()} FCFA</div>
            <div>Reste: {reste.toLocaleString()} FCFA</div>
          </div>
        </div>

        <div style={{ marginTop: 12, color: "#777", fontSize: 12 }}>
          Merci pour votre visite.
        </div>
      </div>
    </div>
  );
}

