"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Modal, Button } from "react-bootstrap";
import RecuPharmaciePrint from "../../recusacte/RecuPharmaciePrint";

export default function RecuPharmaciePage() {
  const searchParams = useSearchParams();
  const facturationId = searchParams.get("facturationId") || "";
  const recuRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [facture, setFacture] = useState<any>(null);
  const [lignes, setLignes] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(true);

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

        const res = await fetch(`/api/recu-pharmacie/${encodeURIComponent(facturationId)}`);
        const payload = await res.json().catch(() => null);

        if (!res.ok || !payload) {
          throw new Error(payload?.error || payload?.details || "Impossible de charger le reçu pharmacie");
        }

        const { facturation, lignes } = payload;
        setFacture(facturation);
        setLignes(Array.isArray(lignes) ? lignes : []);
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
    if (!loading && !error && facture && showModal) {
      const t = window.setTimeout(() => {
        handlePrint();
      }, 500);
      return () => window.clearTimeout(t);
    }
  }, [loading, error, facture, showModal]);

  const handlePrint = () => {
    if (recuRef.current) {
      const printContents = recuRef.current.innerHTML;
      const printWindow = window.open('', '', 'height=800,width=900');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Reçu Pharmacie</title><style>@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }</style></head><body>' + printContents + '</body></html>');
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        setTimeout(() => {
          printWindow.close();
          setShowModal(false);
        }, 300);
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  if (loading) return <div style={{ padding: 24 }}>Chargement du reçu...</div>;
  if (error) return <div style={{ padding: 24, color: "crimson" }}>{error}</div>;

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial" }}>
      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered scrollable>
        <Modal.Header closeButton>
          <Modal.Title>Reçu Pharmacie</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {facture && <RecuPharmaciePrint ref={recuRef} facturation={facture} lignes={lignes} />}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Fermer
          </Button>
          <Button variant="primary" onClick={handlePrint}>
            Imprimer
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

