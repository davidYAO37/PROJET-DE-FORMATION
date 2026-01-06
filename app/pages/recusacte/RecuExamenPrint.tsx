"use client";

import React, { useEffect, useState } from "react";
import { Spinner, Table, Button, Row, Col } from "react-bootstrap";

interface LignePrestation {
  _id: string;
  Prestation: string;
  Qte: number;
  Prix: number;
  CoefficientActe: number;
  PrixTotal: number;
  PartAssurance: number;
  Partassure: number;
  totalsurplus: number
}

interface Patient {
  Nom: string;
  Prenoms: string;
  sexe: string;
  Age_partient: number;
  Date_naisse: string;
  Contact?: string;
  Code_dossier: string;
  SOCIETE_PATIENT?: string;
}

interface Facturation {
  CodePrestation?: string;
  DateFacturation?: string;
  Modepaiement?: string;
  TotalapayerPatient?: number;
  PartAssuranceP?: number;
  Partassure?: number;
  Montanttotal?: number;
  reduction?: number;
  DatePres?: string;
  Taux?: number;
  Assurance?: string;
  Entrele?: string;
  SortieLe?: string;
  NumBon?: string;
  Souscripteur?: string;
  TotalReliquatPatient?: number;
  Designationtypeacte?: string;
  SaisiPar?: string;
  Numcarte?: string;
  NomMed?: string;
  nombreDeJours?: number;
  MontantRecu?: number;
  Restapayer?:number;
}

interface Props {
  facturationId: string;
}
export default function RecuExamenPrint({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [facturation, setFacturation] = useState<Facturation | null>(null);
  const [lignes, setLignes] = useState<LignePrestation[]>([]);

  useEffect(() => {
    const fetchData = async () => {
  try {
    const res = await fetch(`/api/recu-examen/${params.id}`);

    if (!res.ok) {
      const err = await res.text();
      console.error("API ERROR:", err);
      throw new Error("Erreur chargement reçu");
    }

    const data = await res.json();
    console.log("REÇU API:", data);

    setPatient(data.header.Patient);
    setFacturation(data.header);
    setLignes(data.lignes || []);
  } catch (e) {
    console.error("FETCH ERROR:", e);
  } finally {
    setLoading(false);
  }
};

if (params.id) {
      fetchData();
    }
  }, [params.id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" />
      </div>
    );
  }

  if (!patient || !facturation) return null;

 

  const totalPrix = lignes.reduce(
    (s, l) => s + (l.PrixTotal || 0),
    0
  );

  return (
    <>
      {/* ===== BOUTON (non imprimé) ===== */}
      <div className="text-end mb-3 no-print">
        <Button variant="primary" onClick={handlePrint}>
          🖨️ Imprimer le reçu
        </Button>
      </div>

      {/* ===== ZONE IMPRIMABLE ===== */}
      <div className="print-area p-4 text-dark" style={{ fontSize: "13px" }}>
        {/* EN-TÊTE */}
        <div className="text-center mb-3">
          <h5 className="fw-bold">CENTRE MÉDICAL</h5>
          <div className="fw-bold">REÇU D’EXAMENS</div>
        </div>      

        {/* INFOS PATIENT */}
        <div className="p-1 mb-2">
          <div className="d-flex flex-wrap justify-content-between text-nowrap">
            <div className="me-3">
              <strong>Patient :</strong> {patient.Nom} {patient.Prenoms}
            </div>
            <div className="me-3">
              <strong>Sexe :</strong> {patient.sexe}
            </div>
            <div className="me-3">
              <strong>Âge :</strong> {patient.Age_partient} ans
            </div>
            <div className="me-3">
              <strong>Dossier :</strong> {patient.Code_dossier}
            </div>
            <div className="me-3">
              <strong>Contact :</strong> {patient.Contact || "-"}
            </div>
            <div>
              <strong>Société :</strong> {patient.SOCIETE_PATIENT || "-"}
            </div>
            
            <div>
              <strong>Souscripteur :</strong> {facturation.Souscripteur || "-"}
            </div>
          </div>
        </div>

        {/* INFOS ASSURANCE */}
        <div className="p-1 mb-2">
          <div className="d-flex flex-wrap justify-content-between text-nowrap">
            <div className="me-3">
              <strong>Assurance :</strong> {facturation.Assurance || "-"}
            </div>
            <div className="me-3">
              <strong>Taux :</strong> {facturation.Taux || "-"}
            </div>
            <div className="me-3">
              <strong>N°Bon :</strong> {facturation.NumBon || "-"}
            </div>
            <div className="me-3">
              <strong>N°Matricule :</strong> {facturation.Numcarte || "-"}
            </div>
          </div>
        </div>

         {/* INFOS FACTURE */}
         <div className="p-1 mb-3">
          <div className="row g-2">
            <div className="col-md-6">
              <div className="d-flex flex-wrap justify-content-between">
                <div className="me-2 mb-1">
                  <strong>Facturée le :</strong> {facturation.DateFacturation ? new Date(facturation.DateFacturation).toLocaleDateString() : "-"}
                </div>
                <div className="me-2 mb-1">
                  <strong>Prescrit le :</strong> {facturation.DatePres ? new Date(facturation.DatePres).toLocaleDateString() : "-"}
                </div>
                <div className="me-2 mb-1">
                  <strong>Entré(e) le :</strong> {facturation.Entrele ? new Date(facturation.Entrele).toLocaleDateString() : "-"}
                </div>
                <div className="mb-1">
                  <strong>Sortie le :</strong> {facturation.SortieLe ? new Date(facturation.SortieLe).toLocaleDateString() : "-"}
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="d-flex flex-wrap justify-content-between">
                <div className="me-1 mb-1">
                  <strong>Mode de paiement :</strong> {facturation.Modepaiement || "-"}
                </div>
                <div className="me-1 mb-1">
                  <strong>Facturé(e) par :</strong> {facturation.SaisiPar || "-"}
                </div>
                <div className="mb-1">
                  <strong>Prescripteur :</strong> {facturation.NomMed || "-"}
                </div>
              </div>
            </div>
          </div>
         </div>

         {/* INFOS TYPE ACTE + CODE FACTURE */}

        <div className="border rounded-3 p-2 mb-2 text-center fw-bold fs-5 bg-succes">
         <strong>{facturation.Designationtypeacte}</strong>{"-"} <strong>{facturation.CodePrestation}</strong>          
        </div>
        {/* TABLE ACTES */}
        <Table bordered size="sm">
          <thead className="text-center">
            <tr>
              <th>#</th>
              <th>Désignation</th>
              <th>Coef</th>
              <th>Qté</th>
              <th>PU</th>
              <th>Total</th>
              <th>Part Assurance</th>
              <th>Part Patient</th>
              <th>Surplus Patient</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((l, i) => (
              <tr key={l._id}>
                <td className="text-center">{i + 1}</td>
                <td>{l.Prestation}</td>
                <td className="text-center">{l.CoefficientActe}</td>
                <td className="text-center">{l.Qte}</td>
                <td className="text-center">{l.Prix.toLocaleString()}</td>
                <td className="text-center">{l.PrixTotal.toLocaleString()}</td>
                <td className="text-center">{l.PartAssurance.toLocaleString()}</td>
                <td className="text-center">{l.Partassure.toLocaleString()}</td>
                <td className="text-center">{l.totalsurplus.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </Table>

        {/* TOTAUX */}
         <Row>
            <Col md={4}>
              <div className="d-flex justify-content-between">
                <span>Total Brut</span>
                <strong>{totalPrix.toLocaleString()} FCFA</strong>
              </div>
              <div className="d-flex justify-content-between">
                <span>Part Assurance</span>
                <strong>
                  {facturation.PartAssuranceP?.toLocaleString() || 0} FCFA
                </strong>
              </div>
              <div className="d-flex justify-content-between">
                <span>Part Patient</span>
                <strong>
                  {facturation.Partassure?.toLocaleString() || 0} FCFA
                </strong>
              </div>
            </Col>
            <Col md={4}>
            <div className="d-flex justify-content-between">
            <span>Total Surplus</span>
            <strong>
              {facturation.TotalReliquatPatient?.toLocaleString() || 0} FCFA
            </strong>
          </div>
            <div className="d-flex justify-content-between">
            <span>reduction</span>
            <strong>{facturation.reduction?.toLocaleString()} FCFA</strong>
          </div>
          
          <div className="d-flex justify-content-between fs-6">
            <strong>NET À PAYER</strong>
            <strong>
              {facturation.TotalapayerPatient?.toLocaleString()} FCFA
            </strong>
          </div>
            </Col >
            <Col md={4}>
            <div className="d-flex justify-content-between fs-6">
            <strong>Montant Payé</strong>
            <strong>{facturation.MontantRecu?.toLocaleString()} FCFA</strong>
          </div>
          <div className="d-flex justify-content-between">
            <span>Reste a payer</span>
            <strong>{facturation.Restapayer?.toLocaleString()} FCFA</strong>
          </div>
            
            </Col>

          </Row>

        <div className="mt-3">
          

            
        </div>
          <hr />

          

        {/* FOOTER */}
        <div className="text-center mt-4">
          <div>
            <span className="fw-bold fs-6">Merci pour votre confiance</span> <br /><small>Imprimé par : {typeof window !== 'undefined' ? localStorage.getItem('nom_utilisateur') || "Utilisateur inconnu" : "Chargement..."} le : {new Date().toLocaleString()}</small>
         </div>
        </div>
      </div>

      {/* ===== STYLE IMPRESSION ===== */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area,
          .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
