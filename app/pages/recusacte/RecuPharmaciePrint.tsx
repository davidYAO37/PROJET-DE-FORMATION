import React, { forwardRef, useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import { useEntreprise } from "@/hooks/useEntreprise";
import { generatePrintHeader, generatePrintFooter, createPrintWindow, createPrintWindowWithoutHeader, extractContentWithoutHeaderAndFooter } from "@/utils/printRecu";

interface RecuPharmaciePrintProps {
  facturation: any;
  lignes?: any[];
}

const styles = {
  container: {
    width: "800px",
    margin: "0 auto",
    fontFamily: "Arial, sans-serif",
    background: "#fff",
    color: "#000",
    padding: "20px",
    border: "2px solid #000",
    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
  },
  header: {
    textAlign: "center" as const,
    color: "#007bff",
    fontWeight: "bold" as const,
    fontSize: 24,
    marginBottom: 15,
    borderBottom: "2px solid #007bff",
    paddingBottom: 10,
  },
  subHeader: {
    textAlign: "center" as const,
    fontSize: 18,
    fontWeight: "bold" as const,
    marginBottom: 20,
    color: "#333",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    marginTop: 20,
    marginBottom: 20,
    border: "1px solid #000",
  },
  th: {
    border: "1px solid #000",
    padding: "8px 4px",
    background: "#f8f9fa",
    fontSize: 14,
    fontWeight: "bold" as const,
    textAlign: "center" as const,
  },
  td: {
    border: "1px solid #000",
    padding: "6px 4px",
    fontSize: 13,
    textAlign: "center" as const,
  },
  info: {
    fontSize: 14,
    marginBottom: 5,
    lineHeight: 1.4,
  },
  bold: {
    fontWeight: "bold" as const,
    fontSize: 16,
  },
  footer: {
    marginTop: 20,
    fontSize: 12,
    textAlign: "center" as const,
    borderTop: "1px solid #ccc",
    paddingTop: 10,
  },
  totals: {
    marginTop: 20,
    padding: "10px",
    background: "#f8f9fa",
    border: "1px solid #ccc",
    fontSize: 14,
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 5,
  },
};

const RecuPharmaciePrint = forwardRef<HTMLDivElement, RecuPharmaciePrintProps>(
  ({ facturation, lignes = [] }, ref) => {
    const { entreprise } = useEntreprise();

    if (!facturation) return null;

    const lignesPayees = lignes || [];

    // Utiliser directement les champs du modèle Facturation
    const montantTotal = Number(facturation?.Montanttotal || 0);
    const partAssurance = Number(facturation?.PartAssuranceP || 0);
    const partAssure = Number(facturation?.Partassure || 0);
    const remise = Number(facturation?.reduction || 0);
    const montantRecu = Number(facturation?.MontantRecu || 0);
    const reste = Number(facturation?.Restapayer || 0);

    // Fonction pour convertir l'ID MongoDB en format court
    const formatFactureId = (id?: string) => {
      if (!id) return '';
      // Prendre les 6 derniers caractères de l'ID et convertir en nombre
      const lastChars = id.slice(-6);
      const num = parseInt(lastChars, 16); // Convertir hexadécimal en décimal
      return (num % 10000).toString(); // Limiter à 4 chiffres max
    };

    const handlePrint = () => {
      const printContent = document.getElementById('print-content');
      if (!printContent) return;
      
      const headerHTML = generatePrintHeader(entreprise);
      const footerHTML = generatePrintFooter(entreprise);
      const restContent = extractContentWithoutHeaderAndFooter(printContent.innerHTML);
      
      createPrintWindow('Reçu Pharmacie', headerHTML, restContent, footerHTML);
    };

    const handlePrintWithoutHeader = () => {
      const printContent = document.getElementById('print-content');
      if (!printContent) return;
      
      // Extraire le contenu sans header ni footer pour l'impression sans entête
      const restContent = extractContentWithoutHeaderAndFooter(printContent.innerHTML);
      
      createPrintWindowWithoutHeader('Reçu Pharmacie (sans entête)', restContent);
    };
    return (
      <div ref={ref} style={styles.container}>
        <style>
          {`
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                    }
                    .print-container {
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 10px !important;
                        border: none !important;
                        box-shadow: none !important;
                        font-size: 12px !important;
                    }
                    .print-container * {
                        font-size: inherit !important;
                    }
                    .print-container table {
                        font-size: 11px !important;
                    }
                    .print-container th, .print-container td {
                        padding: 4px 2px !important;
                    }
                }
                `}
        </style>
        <div
          className="no-print"
          style={{ textAlign: "center", marginBottom: 20 }}
        >
          {/* ===== BOUTONS (non imprimés) ===== */}
          <div className="text-end mb-3 no-print">
            <Button variant="primary" onClick={handlePrint} className="me-2">
              🖨️ Imprimer le reçu avec entête
            </Button>
            <Button variant="secondary" onClick={handlePrintWithoutHeader}>
              📄 Imprimer le reçu sans entête
            </Button>
          </div>
        </div>
        <div id="print-content" className="print-container">
          {/* L'en-tête sera généré dynamiquement dans la fonction d'impression */}
          <div style={styles.subHeader}>
            REÇU DE PHARMACIE - {formatFactureId(facturation?._id)}
          </div>
          <div
            style={{
              marginBottom: 20,
              borderBottom: "1px solid #ccc",
              paddingBottom: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <div style={styles.bold}>
                N° {facturation?.CodePrestation || ""}
              </div>
              <div style={styles.info}>
                Date :{" "}
                {facturation?.DatePres
                  ? new Date(facturation.DatePres).toLocaleDateString("fr-FR")
                  : ""}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <div style={styles.info}>
                <strong>Patient :</strong> {facturation?.PatientP || ""}
              </div>
              <div style={styles.info}>
                <strong>Dossier N° :</strong> {facturation?.NumBon || ""}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <div style={styles.info}>
                <strong>Prescripteur :</strong> {facturation?.NomMed || ""}
              </div>
              <div style={styles.info}>
                <strong>Assurance :</strong> {facturation?.Assurance || ""} (
                {facturation?.Taux || 0}%)
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={styles.info}>
                <strong>Mode de paiement :</strong>{" "}
                {facturation?.Modepaiement || "Espèce"}
              </div>
              <div style={styles.info}>
                <strong>Facturé par :</strong>{" "}
                {facturation?.SaisiPar || facturation?.FacturePar || ""}
              </div>
            </div>
          </div>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Médicament</th>
                <th style={styles.th}>Qté</th>
                <th style={styles.th}>PU (FCFA)</th>
                <th style={styles.th}>Total (FCFA)</th>
                <th style={styles.th}>Part Assurance (FCFA)</th>
                <th style={styles.th}>Part Patient (FCFA)</th>
              </tr>
            </thead>
            <tbody>
              {lignesPayees.length > 0 ? (
                lignesPayees.map((l) => (
                  <tr key={String(l?._id || Math.random())}>
                    <td style={{ ...styles.td, textAlign: "left" }}>
                      {l?.nomMedicament || ""}
                    </td>
                    <td style={styles.td}>{Number(l?.QteP || 0)}</td>
                    <td style={styles.td}>
                      {Number(l?.prixUnitaire || 0).toLocaleString("fr-FR")}
                    </td>
                    <td style={styles.td}>
                      {Number(l?.prixTotal || 0).toLocaleString("fr-FR")}
                    </td>
                    <td style={styles.td}>
                      {Number(l?.partAssurance || 0).toLocaleString("fr-FR")}
                    </td>
                    <td style={styles.td}>
                      {Number(l?.partAssure || 0).toLocaleString("fr-FR")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      ...styles.td,
                      textAlign: "center",
                      fontStyle: "italic",
                    }}
                  >
                    Aucune ligne payée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div style={styles.totals}>
            <div style={styles.totalRow}>
              <span>
                <strong>Total acte :</strong>
              </span>
              <span>{montantTotal.toLocaleString("fr-FR")} FCFA</span>
            </div>
            <div style={styles.totalRow}>
              <span>
                <strong>Part assurance :</strong>
              </span>
              <span>{partAssurance.toLocaleString("fr-FR")} FCFA</span>
            </div>
            <div style={styles.totalRow}>
              <span>
                <strong>Part patient :</strong>
              </span>
              <span>{partAssure.toLocaleString("fr-FR")} FCFA</span>
            </div>
            {remise > 0 && (
              <div style={styles.totalRow}>
                <span>
                  <strong>Remise :</strong>
                </span>
                <span>{remise.toLocaleString("fr-FR")} FCFA</span>
              </div>
            )}
            <div style={styles.totalRow}>
              <span>
                <strong>Montant reçu :</strong>
              </span>
              <span>{montantRecu.toLocaleString("fr-FR")} FCFA</span>
            </div>
            <div style={styles.totalRow}>
              <span>
                <strong>Reste à payer :</strong>
              </span>
              <span>{reste.toLocaleString("fr-FR")} FCFA</span>
            </div>
          </div>
          <div style={styles.footer}>
            <div style={{ marginBottom: 10 }}>
              <strong>Imprimé par:</strong>{" "}
              {facturation?.SaisiPar || facturation?.FacturéPar || ""}
              &nbsp;&nbsp;&nbsp;
              <strong>Le:</strong> {new Date().toLocaleDateString("fr-FR")}
              &nbsp;&nbsp;&nbsp;
              <strong>À:</strong> {new Date().toLocaleTimeString("fr-FR")}
            </div>
            <div style={{ fontStyle: "italic", color: "#666" }}>
              <strong>Valable pour 15 jours</strong>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

RecuPharmaciePrint.displayName = "RecuPharmaciePrint";

export default RecuPharmaciePrint;
