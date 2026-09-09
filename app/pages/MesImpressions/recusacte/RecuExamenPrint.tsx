"use client";

import React, { useEffect, useState } from "react";
import { Spinner, Table, Button } from "react-bootstrap";
import { useEntreprise } from "@/hooks/useEntreprise";
import { generatePrintHeader, generatePrintFooter, createPrintWindowA4, createPrintWindowA4WithoutHeader } from "@/utils/printRecu";

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

interface PatientPrescription {
  _id: string;
  IDPRESCRIPTION: string;
  PatientP: string;
  QteP: number;
  posologie: string;
  DatePres: Date;
  prixUnitaire: number;
  prixTotal: number;
  nomMedicament: string;
  partAssurance: number;
  partAssure: number;
  StatutPrescriptionMedecin?: number;
  actePayeCaisse?: string;
  payeLe?: Date;
  payePar?: string;
  reference?: string;
  exclusionActe?: string;
  medicament?: {
    _id: string;
    Designation: string;
  };
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
  _id?: string;
  idFacturation?: string;
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

export default function RecuExamenPrint({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [facturation, setFacturation] = useState<Facturation | null>(null);
  const [lignes, setLignes] = useState<LignePrestation[]>([]);
  const [patientPrescriptions, setPatientPrescriptions] = useState<PatientPrescription[]>([]);
  const { entreprise } = useEntreprise();

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
    setPatientPrescriptions(data.patientPrescriptions || []);
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

  const getContent = () => {
    const printContent = document.getElementById('print-content');
    if (!printContent) return "";
    return printContent.innerHTML;
  };

  const getFooterHTML = () => {
    const user = typeof window !== 'undefined'
      ? localStorage.getItem('nom_utilisateur') || "Utilisateur inconnu"
      : "Utilisateur inconnu";
    const societeFooter = generatePrintFooter(entreprise);
    return `
      <div>
        <div class="fw-bold fs-6" style="margin-bottom:5px;">Merci pour votre confiance</div>
        <small>Imprimé par : ${user} le : ${new Date().toLocaleString()}</small>
        ${societeFooter}
      </div>
    `;
  };

  const handlePrint = () => {
    const restContent = getContent();
    if (!restContent) return;
    const headerHTML = generatePrintHeader(entreprise);
    const footerHTML = getFooterHTML();
    createPrintWindowA4('Reçu Examens', headerHTML, restContent, footerHTML);
  };

  const handlePrintWithoutHeader = () => {
    const restContent = getContent();
    if (!restContent) return;
    const footerHTML = getFooterHTML();
    createPrintWindowA4WithoutHeader('Reçu Examens (sans entête)', restContent, footerHTML);
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" />
      </div>
    );
  }

  if (!patient || !facturation) return null;

  const totalPrix = lignes.reduce((s, l) => s + (l.PrixTotal || 0), 0);
  const totalSurplus = lignes.reduce((s, l) => s + (l.totalsurplus || 0), 0);

  const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '-';

  const renderDottedRow = (items: { label?: string; value?: string; boldValue?: boolean }[]) => (
    <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 6, fontSize: 13, flexWrap: 'wrap' }}>
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && (
            <span style={{ flex: '1 0 20px', minWidth: 20, borderBottom: '1px dotted #000', margin: '0 8px' }}></span>
          )}
          <span style={{ whiteSpace: 'nowrap' }}>
            {item.label && <strong>{item.label} </strong>}
            {item.boldValue ? <strong>{item.value || '-'}</strong> : (item.value || '-')}
          </span>
        </React.Fragment>
      ))}
    </div>
  );

  const renderInfoBox = (label: string, value?: number, bold?: boolean) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 22%', minWidth: 150, marginBottom: 10 }}>
      <strong style={{ whiteSpace: 'nowrap', fontSize: 13 }}>{label}</strong>
      <span style={{
        border: '1px solid #000',
        borderRadius: 6,
        padding: '4px 10px',
        flex: 1,
        textAlign: 'center',
        fontWeight: bold ? 'bold' : 'normal',
        fontSize: 14,
        fontStyle: bold ? 'italic' : 'normal'
      }}>
        {(value ?? 0).toLocaleString()}
      </span>
    </div>
  );

  return (
    <>
      {/* ===== BOUTONS (non imprimés) ===== */}
      <div className="text-end mb-3 no-print">
        <Button variant="primary" onClick={handlePrint} className="me-2">
          🖨️ Imprimer le reçu avec entête
        </Button>
        <Button variant="secondary" onClick={handlePrintWithoutHeader}>
          📄 Imprimer le reçu sans entête
        </Button>
      </div>

      {/* ===== ZONE IMPRIMABLE ===== */}
      <div id="print-content" className="print-area p-4 text-dark" style={{ fontSize: "13px" }}>
        {/* INFOS PATIENT - LIGNE 1 */}
        {renderDottedRow([
          { label: 'Patient', value: `${patient.Nom} ${patient.Prenoms}`, boldValue: true },
          { label: 'Dossier N°', value: patient.Code_dossier, boldValue: true },
          { label: 'Editée:', value: formatDate(facturation.DateFacturation) }
        ])}

        {/* INFOS PATIENT - LIGNE 2 */}
        {renderDottedRow([
          { label: 'Sexe', value: patient.sexe },
          { label: 'Age', value: `${patient.Age_partient} ans` },
          { label: 'Contact', value: patient.Contact || '-' },
          { label: 'Médecin Traitant:', value: facturation.NomMed || '-' }
        ])}

        {/* INFOS ASSURANCE */}
        {renderDottedRow([
          { label: 'Assurance', value: facturation.Assurance || '-' },
          { label: 'Matricule:', value: facturation.Numcarte || '-' },
          { label: 'Taux', value: facturation.Taux ? `${facturation.Taux}` : '-' }
        ])}

        {renderDottedRow([
          { label: 'Souscripteur', value: facturation.Souscripteur || '-' },
          { label: 'Assurance/Société patient', value: patient.SOCIETE_PATIENT || facturation.Assurance || '-' }
        ])}

        {renderDottedRow([
          { label: 'Facturé(e) Par', value: facturation.SaisiPar || '-' },
          { label: 'Entré(e) le', value: formatDate(facturation.Entrele) },
          { label: 'Sortie le:', value: formatDate(facturation.SortieLe) },
          { label: 'Durée:', value: `${facturation.nombreDeJours || 0} Jour(s)` }
        ])}

        {renderDottedRow([
          { label: 'Mode de paiement', value: facturation.Modepaiement || 'Espèce' }
        ])}

        {/* TITRE ENCADRE */}
        <div style={{
          border: '2px dotted #000',
          borderRadius: 8,
          padding: '12px 15px',
          textAlign: 'center',
          marginBottom: 20,
          marginTop: 15
        }}>
          <strong style={{ fontSize: 18, textTransform: 'uppercase' }}>
            {facturation.Designationtypeacte || 'REÇU'} N° {facturation.CodePrestation || ''}
          </strong>
        </div>

        {/* TABLE ACTES */}
        {patientPrescriptions.length > 0 ? (
          <Table bordered size="sm">
            <thead className="text-center">
              <tr>
                <th>#</th>
                <th>Médicament</th>
                <th>Qté</th>
                <th>Posologie</th>
                <th>PU</th>
                <th>Total</th>
                <th>Part Assurance</th>
                <th>Part Patient</th>
              </tr>
            </thead>
            <tbody>
              {patientPrescriptions.map((pp, i) => (
                <tr key={pp._id}>
                  <td className="text-center">{i + 1}</td>
                  <td>{pp.nomMedicament || (pp.medicament?.Designation) || '-'}</td>
                  <td className="text-center">{pp.QteP}</td>
                  <td className="text-center">{pp.posologie || '-'}</td>
                  <td className="text-center">{pp.prixUnitaire.toLocaleString()}</td>
                  <td className="text-center">{pp.prixTotal.toLocaleString()}</td>
                  <td className="text-center">{pp.partAssurance.toLocaleString()}</td>
                  <td className="text-center">{pp.partAssure.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <Table bordered size="sm">
            <thead className="text-center">
              <tr>
                <th>#</th>
                <th>Prestation</th>
                <th>Coef</th>
                <th>Qté</th>
                <th>Prix Unitaire</th>
                <th>Montant total</th>
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
              <tr style={{ fontWeight: 'bold', background: '#f0f0f0' }}>
                <td colSpan={5} className="text-center">Totaux</td>
                <td className="text-center">{totalPrix.toLocaleString()}</td>
                <td className="text-center">{facturation.PartAssuranceP?.toLocaleString() || 0}</td>
                <td className="text-center">{facturation.Partassure?.toLocaleString() || 0}</td>
                <td className="text-center">{totalSurplus.toLocaleString()}</td>
              </tr>
            </tbody>
          </Table>
        )}

        {/* INFO RECU */}
        <div style={{ border: '1px solid #000', borderRadius: 8, padding: 15, marginTop: 20 }}>
          <div style={{ textAlign: 'center', fontSize: 16, fontWeight: 'bold', marginBottom: 15, textDecoration: 'underline' }}>
            INFO RECU
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 15 }}>
            {renderInfoBox('Part Patient', facturation.Partassure)}
            {renderInfoBox('Total surplus', facturation.TotalReliquatPatient)}
            {renderInfoBox('Remise', facturation.reduction)}
            {renderInfoBox('Total a payer', facturation.TotalapayerPatient, true)}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 15 }}>
            {renderInfoBox('Part Assurance', facturation.PartAssuranceP)}
            {renderInfoBox('Total Payé', facturation.MontantRecu)}
            {renderInfoBox('Reste a payer', facturation.Restapayer)}
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
