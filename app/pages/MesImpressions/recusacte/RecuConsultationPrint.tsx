import React, { forwardRef } from 'react';
import { Button } from 'react-bootstrap';
import { useEntreprise } from "@/hooks/useEntreprise";
import { generatePrintHeader, generatePrintFooter, createPrintWindow80mm, createPrintWindowA4, createPrintWindowA4WithoutHeader } from "@/utils/printRecu";

interface RecuConsultationPrintProps {
    consultation: any;
}

const renderDottedRow = (items: { label?: string; value?: string; boldValue?: boolean }[]) => (
    <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 3, fontSize: 11, flexWrap: 'wrap' }}>
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: '1 1 22%', minWidth: 140, marginBottom: 4 }}>
        <strong style={{ whiteSpace: 'nowrap', fontSize: 11 }}>{label}</strong>
        <span style={{
            border: '1px solid #000',
            borderRadius: 6,
            padding: '2px 6px',
            flex: 1,
            textAlign: 'center',
            fontWeight: bold ? 'bold' : 'normal',
            fontSize: 11,
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
    const totalPatientAvantRemise = Number(consultation.montantapayer ?? consultation.totalPatient ?? 0);
    const remise = Number(consultation.reduction ?? 0);
    const totalAPayer = Math.max(0, totalPatientAvantRemise - remise);
    const motifRemise = (consultation.MotifRemise || "").trim() || "Aucun motif";
    const totalPaye = Number(consultation.Montantencaisse ?? consultation.montantEncaisse ?? consultation.MontantRecu ?? 0);
    const resteAPayer = Number(consultation.Restapayer ?? consultation.resteAPayer ?? consultation.restapayer ?? Math.max(0, totalAPayer - totalPaye));

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

    const handleThermalPrint = () => {
        const thermalContent = document.getElementById('thermal-print-content');
        if (!thermalContent) return;
        createPrintWindow80mm(
            'Reçu Consultation - Ticket 80 mm',
            generatePrintHeader(entreprise),
            thermalContent.innerHTML,
            getFooterHTML()
        );
    };

    const renderReceiptCopy = (copyLabel: 'Patient' | 'Caisse') => (
        <section className="receipt-copy" style={{ padding: '8px 12px' }}>
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
                padding: '6px 10px',
                textAlign: 'center',
                marginBottom: 8,
                marginTop: 7
            }}>
                <strong style={{ fontSize: 15, textTransform: 'uppercase' }}>
                    {consultation.designationC || 'CONSULTATION'} N° {consultation.CodePrestation || ''}
                </strong>
            </div>

            {/* TABLE CONSULTATION */}
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', margin: '6px 0' }}>
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
            <div style={{ border: '1px solid #000', borderRadius: 8, padding: 8, marginTop: 8 }}>
                <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 'bold', marginBottom: 7, textDecoration: 'underline' }}>
                    INFO RECU
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {renderInfoBox('Part Patient', totalPatientAvantRemise)}
                    {renderInfoBox('Total surplus', Number(consultation.ReliquatPatient || consultation.totalsurplus || 0))}
                    {renderInfoBox('Remise', remise)}
                    {renderInfoBox('Total a payer', totalAPayer, true)}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {renderInfoBox('Part Assurance', Number(consultation.PartAssurance || 0))}
                    {renderInfoBox('Total Payé', totalPaye)}
                    {renderInfoBox('Reste a payer', resteAPayer)}
                </div>
                {remise > 0 && (
                    <div style={{ marginTop: 6, padding: '4px 8px', border: '1px solid #000', borderRadius: 6, background: '#f8f9fa' }}>
                        <strong>Motif de la remise :</strong> {motifRemise}
                    </div>
                )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 5 }}>
                <span style={{ border: '1px solid #000', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 'bold' }}>
                    Exemplaire {copyLabel}
                </span>
            </div>
        </section>
    );

    const renderThermalCopy = (copyLabel: 'Patient' | 'Caisse') => (
        <section className="thermal-copy">
            <div className="thermal-title">REÇU DE CONSULTATION</div>
            <div className="thermal-label">Exemplaire {copyLabel}</div>
            <div className="thermal-separator"></div>
            <div className="thermal-row"><span>Patient</span><span>{patientName}</span></div>
            <div className="thermal-row"><span>Dossier N°</span><span>{codeDossier}</span></div>
            <div className="thermal-row"><span>Date</span><span>{formatDate(consultation.Date_consulation || consultation.DateFacturation)}</span></div>
            <div className="thermal-row"><span>Sexe / Âge</span><span>{sexe} / {age}</span></div>
            <div className="thermal-row"><span>Contact</span><span>{contact}</span></div>
            <div className="thermal-row"><span>Médecin</span><span>{consultation.Medecin || '-'}</span></div>
            <div className="thermal-row"><span>Assurance</span><span>{assurance}</span></div>
            <div className="thermal-row"><span>Matricule</span><span>{matricule}</span></div>
            <div className="thermal-separator"></div>
            <div className="thermal-row"><span>Acte</span><span>{consultation.designationC || 'CONSULTATION'}</span></div>
            <div className="thermal-row"><span>Total acte</span><span>{Number(consultation.PrixClinique || 0).toLocaleString()}</span></div>
            <div className="thermal-row"><span>Part assurance</span><span>{Number(consultation.PartAssurance || 0).toLocaleString()}</span></div>
            <div className="thermal-row"><span>Part patient</span><span>{totalPatientAvantRemise.toLocaleString()}</span></div>
            <div className="thermal-row"><span>Surplus</span><span>{Number(consultation.ReliquatPatient || consultation.totalsurplus || 0).toLocaleString()}</span></div>
            <div className="thermal-row"><span>Remise</span><span>{remise.toLocaleString()}</span></div>
            <div className="thermal-total">
                <div className="thermal-row"><span>Total à payer</span><span>{totalAPayer.toLocaleString()}</span></div>
                <div className="thermal-row"><span>Total payé</span><span>{totalPaye.toLocaleString()}</span></div>
                <div className="thermal-row"><span>Reste à payer</span><span>{resteAPayer.toLocaleString()}</span></div>
            </div>
            <div className="thermal-row"><span>Paiement</span><span>{consultation.Modepaiement || 'Espèce'}</span></div>
            <div className="thermal-row"><span>Caissier(ère)</span><span>{consultation.Recupar || consultation.Caissiere || '-'}</span></div>
            {remise > 0 && <div className="thermal-row"><span>Motif remise</span><span>{motifRemise}</span></div>}
        </section>
    );

    return (
        <>
            {/* ===== BOUTONS (non imprimés) ===== */}
            <div className="text-end mb-3 no-print">
                <Button variant="primary" onClick={handlePrint} className="me-2">
                    🖨️ Imprimer le reçu avec entête
                </Button>
                <Button variant="secondary" onClick={handlePrintWithoutHeader} className="me-2">
                    📄 Imprimer le reçu sans entête
                </Button>
                <Button variant="success" onClick={handleThermalPrint}>
                    Imprimer ticket 80 mm
                </Button>
            </div>

            {/* ===== ZONE IMPRIMABLE ===== */}
            <div id="print-content" ref={ref} className="print-area p-4 text-dark" style={{ fontSize: "13px" }}>
                <style>{`
                    .receipt-copy table { margin: 6px 0 !important; }
                    .receipt-copy th, .receipt-copy td { padding: 3px 4px !important; font-size: 10px !important; }
                    .receipt-copy { break-inside: avoid; page-break-inside: avoid; }
                `}</style>
                {renderReceiptCopy('Patient')}
                <div style={{ borderTop: '1px dashed #000', margin: '5px 0', textAlign: 'center', fontSize: 9 }}>
                    <span style={{ background: '#fff', padding: '0 8px', position: 'relative', top: -7 }}>À découper</span>
                </div>
                {renderReceiptCopy('Caisse')}
            </div>

            <div id="thermal-print-content" style={{ display: 'none' }}>
                {renderThermalCopy('Patient')}
                <div className="thermal-cut"><span>À découper</span></div>
                {renderThermalCopy('Caisse')}
            </div>
        </>
    );
});

export default RecuConsultationPrint;
