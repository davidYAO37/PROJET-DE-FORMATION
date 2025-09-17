import React, { forwardRef } from 'react';

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
    },
    footer: {
        marginTop: 10,
        fontSize: 13,
        textAlign: 'right' as const,
        fontStyle: 'italic' as const,
    },
};

const RecuConsultationPrint = forwardRef<HTMLDivElement, RecuConsultationPrintProps>(({ consultation }, ref) => {
    if (!consultation) return null;
    return (
        <div ref={ref} style={styles.container}>
            <div style={styles.header}>
                <div>CLINIQUE<br />ANDROLOGIE- UROLOGIE<br />SEXOLOGIE</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <div>
                    <div style={styles.bold}>RECU N° {consultation.Code_Prestation || ''}</div>
                    <div style={styles.info}>Dossier N° {consultation.Code_dossier} &nbsp; Patient : <b>{consultation.PatientP}</b></div>
                    <div style={styles.info}>N°carte {consultation.numero_carte || ''} &nbsp; Taux(%) {consultation.tauxAssurance || 0}</div>
                    <div style={styles.info}>Assurance : {consultation.assurance} &nbsp; N°Bon {consultation.NumBon || ''}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div>Imprimé par<br /><b>{consultation.Recupar}</b></div>
                    <div>Le {new Date().toLocaleDateString()} &nbsp; A {new Date().toLocaleTimeString()}</div>
                </div>
            </div>
            <div style={styles.info}>Prescripteur : {consultation.Medecin}</div>
            <div style={styles.info}>Facturé(e) par : {consultation.Recupar}</div>
            <div style={styles.info}>Admis(e) le : {consultation.Date_consulation ? new Date(consultation.Date_consulation).toLocaleDateString() : ''}</div>
            <div style={styles.info}>Mode de paiement : Espèce</div>
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
            <div style={styles.info}>Surplus Patient {consultation.ReliquatPatient || 0} &nbsp; Reste à payer {consultation.Restapayer || 0} &nbsp; {consultation.assurance}</div>
            <div style={styles.footer}><b>Valable pour 15 jours</b></div>
        </div>
    );
});

export default RecuConsultationPrint;
