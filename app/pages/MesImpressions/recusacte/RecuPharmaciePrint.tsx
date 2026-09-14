import React, { forwardRef } from "react";
import { Button } from "react-bootstrap";
import { useEntreprise } from "@/hooks/useEntreprise";
import { generatePrintHeader, generatePrintFooter, createPrintWindowA4, createPrintWindowA4WithoutHeader } from "@/utils/printRecu";

interface RecuPharmaciePrintProps {
  facturation: any;
  lignes?: any[];
}

const RecuPharmaciePrint = forwardRef<HTMLDivElement, RecuPharmaciePrintProps>(
  ({ facturation, lignes = [] }, ref) => {
    const { entreprise } = useEntreprise();

    if (!facturation) return null;

    const lignesPayees = lignes || [];
    const totalPrix = lignesPayees.reduce((s: number, l: any) => s + Number(l?.prixTotal || 0), 0);

    const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '-';

    const getAge = (dob?: string | Date) => {
      if (!dob) return null;
      const birth = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
      return age;
    };

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

    const getContent = () => {
      const printContent = document.getElementById('print-content');
      if (!printContent) return "";
      return printContent.innerHTML;
    };

    const getFooterHTML = () => {
      const saisiPar = facturation?.SaisiPar || facturation?.FacturéPar || "";
      const societeFooter = generatePrintFooter(entreprise);
      return `
        <div>
          <div style="margin-bottom:10px;">
            <strong>Imprimé par:</strong> ${saisiPar} &nbsp;&nbsp;&nbsp;
            <strong>Le:</strong> ${new Date().toLocaleDateString("fr-FR")} &nbsp;&nbsp;&nbsp;
            <strong>À:</strong> ${new Date().toLocaleTimeString("fr-FR")}
          </div>
          ${societeFooter}
        </div>
      `;
    };

    const handlePrint = () => {
      const restContent = getContent();
      if (!restContent) return;
      const headerHTML = generatePrintHeader(entreprise);
      const footerHTML = getFooterHTML();
      createPrintWindowA4('Reçu Pharmacie', headerHTML, restContent, footerHTML);
    };

    const handlePrintWithoutHeader = () => {
      const restContent = getContent();
      if (!restContent) return;
      const footerHTML = getFooterHTML();
      createPrintWindowA4WithoutHeader('Reçu Pharmacie (sans entête)', restContent, footerHTML);
    };

    return (
      <div ref={ref} style={{ fontFamily: 'Arial, sans-serif', background: '#fff', color: '#000', padding: 20 }}>
        <div className="no-print" style={{ textAlign: 'center', marginBottom: 20 }}>
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

        <div id="print-content" className="print-area p-4 text-dark" style={{ fontSize: '13px' }}>
          {/* INFOS PATIENT - LIGNE 1 */}
          {renderDottedRow([
            { label: 'Patient', value: facturation?.PatientP || '-', boldValue: true },
            { label: 'Dossier N°', value: facturation?.Code_dossier || '-', boldValue: true },
            { label: 'Editée:', value: formatDate(facturation?.DatePres) }
          ])}

          {/* INFOS PATIENT - LIGNE 2 */}
          {renderDottedRow([
            { label: 'Sexe', value: facturation?.sexe || '-' },
            { label: 'Age', value: facturation?.Age_partient ? `${facturation.Age_partient} ans` : (getAge(facturation?.Date_naisse) !== null ? `${getAge(facturation?.Date_naisse)} ans` : '-') },
            { label: 'Contact', value: facturation?.Contact || '-' },
            { label: 'Médecin Traitant:', value: facturation?.NomMed || '-' }
          ])}

          {/* INFOS ASSURANCE */}
          {renderDottedRow([
            { label: 'Assurance', value: facturation?.Assurance || '-' },
            { label: 'Matricule:', value: facturation?.Numcarte || '-' },
            { label: 'Taux', value: facturation?.Taux ? `${facturation.Taux}` : '-' }
          ])}

          {renderDottedRow([
            { label: 'Souscripteur', value: facturation?.Souscripteur || '-' },
            { label: 'Assurance/Société patient', value: facturation?.SOCIETE_PATIENT || facturation?.Assurance || '-' }
          ])}

          {renderDottedRow([
            { label: 'Facturé(e) Par', value: facturation?.SaisiPar || facturation?.FacturéPar || '-' },
            { label: 'Mode de paiement', value: facturation?.Modepaiement || 'Espèce' }
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
              REÇU DE PHARMACIE N° {facturation?.CodePrestation || ''}
            </strong>
          </div>

          {/* TABLE MEDICAMENTS */}
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', margin: '15px 0' }}>
            <thead className="text-center">
              <tr>
                <th>Médicament</th>
                <th>Qté</th>
                <th>PU (FCFA)</th>
                <th>Total (FCFA)</th>
                <th>Part Assurance</th>
                <th>Part Patient</th>
              </tr>
            </thead>
            <tbody>
              {lignesPayees.length > 0 ? (
                lignesPayees.map((l, i) => (
                  <tr key={String(l?._id || `ligne-${i}`)}>
                    <td style={{ textAlign: 'left' }}>{l?.nomMedicament || '-'}</td>
                    <td className="text-center">{Number(l?.QteP || 0)}</td>
                    <td className="text-center">{Number(l?.prixUnitaire || 0).toLocaleString('fr-FR')}</td>
                    <td className="text-center">{Number(l?.prixTotal || 0).toLocaleString('fr-FR')}</td>
                    <td className="text-center">{Number(l?.partAssurance || 0).toLocaleString('fr-FR')}</td>
                    <td className="text-center">{Number(l?.partAssure || 0).toLocaleString('fr-FR')}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center" style={{ fontStyle: 'italic' }}>
                    Aucune ligne payée
                  </td>
                </tr>
              )}
              <tr style={{ fontWeight: 'bold', background: '#f0f0f0' }}>
                <td colSpan={3} className="text-center">Totaux</td>
                <td className="text-center">{totalPrix.toLocaleString('fr-FR')}</td>
                <td className="text-center">{Number(facturation?.PartAssuranceP || 0).toLocaleString('fr-FR')}</td>
                <td className="text-center">{Number(facturation?.Partassure || 0).toLocaleString('fr-FR')}</td>
              </tr>
            </tbody>
          </table>

          {/* INFO RECU */}
          <div style={{ border: '1px solid #000', borderRadius: 8, padding: 15, marginTop: 20 }}>
            <div style={{ textAlign: 'center', fontSize: 16, fontWeight: 'bold', marginBottom: 15, textDecoration: 'underline' }}>
              INFO RECU
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 15 }}>
              {renderInfoBox('Part Patient', Number(facturation?.Partassure || 0))}
              {renderInfoBox('Remise', Number(facturation?.reduction || 0))}
              {renderInfoBox('Total a payer', Number(facturation?.TotalapayerPatient || facturation?.Partassure || 0), true)}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 15 }}>
              {renderInfoBox('Part Assurance', Number(facturation?.PartAssuranceP || 0))}
              {renderInfoBox('Total Payé', Number(facturation?.MontantRecu || 0))}
              {renderInfoBox('Reste a payer', Number(facturation?.Restapayer || 0))}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

RecuPharmaciePrint.displayName = "RecuPharmaciePrint";

export default RecuPharmaciePrint;
