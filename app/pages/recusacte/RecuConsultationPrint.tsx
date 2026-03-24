import React, { forwardRef, useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import { useEntreprise } from "@/hooks/useEntreprise";
import { generatePrintHeader, generatePrintFooter, createPrintWindow, createPrintWindowWithoutHeader, extractContentWithoutHeaderAndFooter } from "@/utils/printRecu";

interface RecuConsultationPrintProps {
    consultation: any;
}

const styles = {
    container: {
        width: '700px',
        margin: '0 auto',
        fontFamily: 'Arial, sans-serif',
        background: '#fff',
        color: '#000',
        padding: 20,
        border: '1px solid #ccc',
    },
    header: {
        textAlign: 'center' as const,
        color: '#00AEEF',
        fontWeight: 'bold' as const,
        fontSize: 22,
        marginBottom: 10,
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse' as const,
        marginTop: 10,
        marginBottom: 10,
    },
    th: {
        border: '1px solid #000',
        padding: 4,
        background: '#f0f0f0',
        fontSize: 14,
    },
    td: {
        border: '1px solid #000',
        padding: 4,
        fontSize: 14,
        textAlign: 'center' as const,
    },
    info: {
        fontSize: 14,
        marginBottom: 2,
    },
    bold: {
        fontWeight: 'bold' as const,
        fontSize: 18,
    },
    footer: {
        marginTop: 10,
        fontSize: 13,       
        fontStyle: 'italic' as const,
        textAlign: 'center' as const,
    },
};

const RecuConsultationPrint = forwardRef<HTMLDivElement, RecuConsultationPrintProps>(({ consultation }, ref) => {
    const { entreprise } = useEntreprise();

    const handlePrint = () => {
        const printContent = document.getElementById('print-content');
        if (!printContent) return;
        
        const headerHTML = generatePrintHeader(entreprise);
        const footerHTML = generatePrintFooter(entreprise);
        const restContent = extractContentWithoutHeaderAndFooter(printContent.innerHTML);
        
        createPrintWindow('Reçu Consultation', headerHTML, restContent, footerHTML);
    };

    const handlePrintWithoutHeader = () => {
        const printContent = document.getElementById('print-content');
        if (!printContent) return;
        
        // Extraire le contenu sans header ni footer pour l'impression sans entête
        const restContent = extractContentWithoutHeaderAndFooter(printContent.innerHTML);
        
        createPrintWindowWithoutHeader('Reçu Consultation (sans entête)', restContent);
    };

    if (!consultation) return null;
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
            <div id="print-content" ref={ref} style={styles.container}>
            {/* L'en-tête sera généré dynamiquement dans la fonction d'impression */}
            {/* EN-TÊTE STATIQUE (uniquement si pas de données entreprise) */}
            {!entreprise?.LogoE && !entreprise?.EnteteSociete && (
                <div style={styles.header}>
                                   
                </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <div>
                    <div className="d-flex space-between">
                        <div className="me-5" style={styles.bold} >RECU N° {consultation.CodePrestation || ''}</div>
                        <div style={styles.info}> Prescripteur : {consultation.Medecin} &nbsp; Admis(e) le : {consultation.Date_consulation ? new Date(consultation.Date_consulation).toLocaleDateString() : ''}</div>
                    </div>
                    <div  style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <div style={styles.info}>Dossier N° {consultation.Code_dossier}</div>
                        <div style={styles.info}>Patient : <b>{consultation.PatientP}</b></div>
                    </div>
                    <div className="d-flex">
                        <div style={styles.info}>Assurance : {consultation.assurance} &nbsp; N°carte {consultation.numero_carte || ''} &nbsp; Taux(%) {consultation.tauxAssurance || 0}  &nbsp; N°Bon {consultation.NumBon || ''}</div>
                    </div>
                </div>                
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <div style={styles.info}>Mode de paiement : Espèce</div>
                <div style={styles.info}>Facturé(e) par : {consultation.Recupar}</div>
            </div>
            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={styles.th}>Libellé</th>
                        <th style={styles.th}>Total acte</th>
                        <th style={styles.th}>Part patient</th>
                        <th style={styles.th}>Part assurance</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style={styles.td}>{consultation.designationC}</td>
                        <td style={styles.td}>{consultation.PrixClinique?.toLocaleString() || 0}</td>
                        <td style={styles.td}>{consultation.montantapayer?.toLocaleString() || 0}</td>
                        <td style={styles.td}>{consultation.PartAssurance?.toLocaleString() || 0}</td>
                    </tr>
                </tbody>
            </table>
            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <div style={styles.info}>Surplus patient : {consultation.totalsurplus?.toLocaleString() || 0} FCFA</div>
                <div style={styles.info}>Reste à payer : {consultation.resteapayer?.toLocaleString() || 0} FCFA</div>
                <div style={styles.info}>Société patient : {consultation.SOCIETE_PATIENT || 'N/A'}</div>
            </div>
             <div className="text-center mt-4">
          <div>
            <span className="fw-bold fs-6">Merci pour votre confiance</span> <br />
            <small>Imprimé par : {typeof window !== 'undefined' ? localStorage.getItem('nom_utilisateur') || "Utilisateur inconnu" : "Chargement..."} le : {new Date().toLocaleString()}</small>
          </div>
        </div>
            
        </div>
        </>
    );
});

export default RecuConsultationPrint;
