"use client";

import React from "react";

export default function RecuExamenPage({ params }: any) {
  const { id } = params;

  // ICI tu vas récupérer les données depuis ton API Next.js
  const [data, setData] = React.useState<any>(null);

  React.useEffect(() => {
    fetch(`/api/recu-examen?id=${id}`)
      .then(res => res.json())
      .then(setData);
  }, [id]);

  if (!data) return <div>Chargement...</div>;

  const { patient, facture, lignes } = data;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ padding: 20 }}>

      {/* Bouton imprimer */}
      <div style={{ textAlign: "right", marginBottom: 20 }}>
        <button
          onClick={handlePrint}
          style={{
            backgroundColor: "#28a745",
            color: "white",
            padding: "8px 14px",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Imprimer
        </button>
      </div>

      {/* CONTENU DU RECU */}
      <div id="recu" style={{ width: "800px", margin: "auto" }}>

        {/* TITRE */}
        <h2 style={{ textAlign: "center", margin: 0 }}>
          CLINIQUE<br />
          ANDROLOGIE - UROLOGIE<br />
          SEXOLOGIE
        </h2>

        <hr />

        {/* INFO PATIENT */}
        <div style={{ fontSize: 14 }}>
          <p><strong>Patient :</strong> {patient.Nom}</p>
          <p><strong>Dossier N° :</strong> {patient.Code_dossier}</p>
          <p><strong>Sexe :</strong> {patient.Sexe} — <strong>Age :</strong> {patient.Age_partient}</p>
          <p><strong>Contact :</strong> {patient.Contact}</p>
          <p><strong>Assurance :</strong> {facture.Assuance}</p>
          <p><strong>Mode Paiement :</strong> {facture.Modepaiement_FA}</p>
        </div>

        <hr />

        <h3 style={{ textAlign: "center" }}>
          REÇU EXAMEN BIOLOGIQUE N° {facture.Code_Prestation_FA}
        </h3>

        {/* TABLEAU */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 13,
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f0f0f0" }}>
              <th style={th}>Prestation</th>
              <th style={th}>Coef</th>
              <th style={th}>Qte</th>
              <th style={th}>Prix</th>
              <th style={th}>Total</th>
              <th style={th}>Part Patient</th>
              <th style={th}>Surplus</th>
            </tr>
          </thead>

          <tbody>
            {lignes.map((l: any, i: number) => (
              <tr key={i}>
                <td style={td}>{l.Prestation}</td>
                <td style={td}>{l.CoefficientActe}</td>
                <td style={td}>{l.Qte}</td>
                <td style={td}>{l.Prix}</td>
                <td style={td}>{l.PrixTotal}</td>
                <td style={td}>{l.PartAssure_LI}</td>
                <td style={td}>{l.totalsurplus}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* TOTALS */}
        <div style={{ marginTop: 20, fontSize: 14 }}>
          <p><strong>Total à payer :</strong> {facture.TotalapayerPatient}</p>
          <p><strong>Total Payé :</strong> {facture.TotalPaye}</p>
          <p><strong>Reste :</strong> {facture.Restapayer}</p>
        </div>

      </div>

      {/* STYLE IMPRESSION : supprime le bouton */}
      <style>{`
        @media print {
          button {
            display: none;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}

const th = {
  border: "1px solid #333",
  padding: "6px",
  textAlign: "center" as const,
};

const td = {
  border: "1px solid #333",
  padding: "4px",
};
