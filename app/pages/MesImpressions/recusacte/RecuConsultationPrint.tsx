import React, { forwardRef } from 'react';
import { Button } from 'react-bootstrap';
import { useEntreprise } from "@/hooks/useEntreprise";
import { generatePrintHeader, generatePrintFooter, createPrintWindowA4, createPrintWindowA4WithoutHeader } from "@/utils/printRecu";

interface RecuConsultationPrintProps {
    consultation: any;
}

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

const RecuConsultationPrint = forwardRef<HTMLDivElement, RecuConsultationPrintProps>(({ consultation }, ref) => {
    const { entreprise } = useEntreprise();

    if (!consultation) return null;

    // Récupération du patient peuplé ou fallback sur les champs de la consultation
    const patient = consultation.IdPatient && typeof consultation.IdPatient === 'object'
        ? consultation.IdPatient
        : null;

    const formatDate = (d?: string | Date) => d ? new Date(d).toLocaleDateString('fr-FR') : '-';

    const getAge = (dob?: string | Date) => {
        if (!dob) return null;
        const birth = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        return age;
    };

    // Valeurs avec fallback patient > consultation
    const sexe = consultation.Sexe || patient?.sexe || '-';
    const age = consultation.Age_partient
        ? `${consultation.Age_partient} ans`
        : (getAge(patient?.Date_naisse) !== null ? `${getAge(patient?.Date_naisse)} ans` : '-');
    const contact = patient?.Contact || consultation.Contact || '-';
    const codeDossier = patient?.Code_dossier || consultation.Code_dossier || '-';
    const patientName = consultation.PatientP || (patient ? `${patient.Nom || ''} ${patient.Prenoms || ''}`.trim() : '-');
    const assurance = consultation.assurance || (consultation.IDASSURANCE?.designationassurance) || patient?.Assurance || '-';
    const matricule = consultation.numero_carte || consultation.Matricule || patient?.Matricule || '-';
    const societePatient = consultation.SOCIETE_PATIENT || patient?.SOCIETE_PATIENT || assurance;
    const taux = consultation.tauxAssurance ? `${consultation.tauxAssurance}` : '-';

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
        createPrintWindowA4('Reçu Consultation', headerHTML, restContent, footerHTML);
    };

    const handlePrintWithoutHeader = () => {
        const restContent = getContent();
        if (!restContent) return;
        const footerHTML = getFooterHTML();
        createPrintWindowA4WithoutHeader('Reçu Consultation (sans entête)', restContent, footerHTML);
    };

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
            <div id="print-content" ref={ref} className="print-area p-4 text-dark" style={{ fontSize: "13px" }}>
                {/* INFOS PATIENT - LIGNE 1 */}
                {renderDottedRow([
                    { label: 'Patient', value: patientName, boldValue: true },
                    { label: 'Dossier N°', value: codeDossier, boldValue: true },
                    { label: 'Editée:', value: formatDate(consultation.Date_consulation || consultation.DateFacturation) }
                ])}

                {/* INFOS PATIENT - LIGNE 2 */}
                {renderDottedRow([
                    { label: 'Sexe', value: sexe },
                    { label: 'Age', value: age },
                    { label: 'Contact', value: contact },
                    { label: 'Médecin Traitant:', value: consultation.Medecin || '-' }
                ])}

                {/* INFOS ASSURANCE */}
                {renderDottedRow([
                    { label: 'Assurance', value: assurance },
                    { label: 'Matricule:', value: matricule },
                    { label: 'Taux', value: taux }
                ])}

                {renderDottedRow([
                    { label: 'Souscripteur', value: consultation.Souscripteur || '-' },
                    { label: 'Assurance/Société patient', value: societePatient || '-' }
                ])}

                {renderDottedRow([
                    { label: 'Facturé(e) Par', value: consultation.Recupar || consultation.Caissiere || '-' },
                    { label: 'Mode de paiement', value: consultation.Modepaiement || 'Espèce' }
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
                        {consultation.designationC || 'CONSULTATION'} N° {consultation.CodePrestation || ''}
                    </strong>
                </div>

                {/* TABLE CONSULTATION */}
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse', margin: '15px 0' }}>
                    <thead className="text-center">
                        <tr>
                            <th>Libellé</th>
                            <th>Total acte</th>
                            <th>Part patient</th>
                            <th>Part assurance</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>{consultation.designationC || '-'}</td>
                            <td className="text-center">{(consultation.PrixClinique || 0).toLocaleString()}</td>
                            <td className="text-center">{(consultation.montantapayer || 0).toLocaleString()}</td>
                            <td className="text-center">{(consultation.PartAssurance || 0).toLocaleString()}</td>
                        </tr>
                        <tr style={{ fontWeight: 'bold', background: '#f0f0f0' }}>
                            <td className="text-center">Totaux</td>
                            <td className="text-center">{(consultation.PrixClinique || 0).toLocaleString()}</td>
                            <td className="text-center">{(consultation.montantapayer || 0).toLocaleString()}</td>
                            <td className="text-center">{(consultation.PartAssurance || 0).toLocaleString()}</td>
                        </tr>
                    </tbody>
                </table>

                {/* INFO RECU */}
                <div style={{ border: '1px solid #000', borderRadius: 8, padding: 15, marginTop: 20 }}>
                    <div style={{ textAlign: 'center', fontSize: 16, fontWeight: 'bold', marginBottom: 15, textDecoration: 'underline' }}>
                        INFO RECU
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 15 }}>
                        {renderInfoBox('Part Patient', Number(consultation.montantapayer || 0))}
                        {renderInfoBox('Total surplus', Number(consultation.ReliquatPatient || consultation.totalsurplus || 0))}
                        {renderInfoBox('Remise', Number(consultation.reduction || 0))}
                        {renderInfoBox('Total a payer', Number(consultation.montantapayer || 0), true)}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 15 }}>
                        {renderInfoBox('Part Assurance', Number(consultation.PartAssurance || 0))}
                        {renderInfoBox('Total Payé', Number(consultation.Montantencaisse || 0))}
                        {renderInfoBox('Reste a payer', Number(consultation.Restapayer || 0))}
                    </div>
                </div>
            </div>
        </>
    );
});

export default RecuConsultationPrint;
