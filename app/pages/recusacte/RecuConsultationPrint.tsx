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
    if (!consultation) return null;
    return (
        <div ref={ref} style={styles.container}>
            <div style={styles.header}>
                <div>CLINIQUE<br />ANDROLOGIE- UROLOGIE<br />SEXOLOGIE</div>                
            </div>
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
            <div style={styles.info}>Surplus Patient {consultation.ReliquatPatient || 0} &nbsp; Reste à payer {consultation.Restapayer || 0} &nbsp; {consultation.assurance}</div>
            <div className="d-flex" style={styles.footer}>
                <div>Imprimé par: {consultation.Recupar} Le {new Date().toLocaleDateString()} A {new Date().toLocaleTimeString()}</div>
               &nbsp;&nbsp;&nbsp; <div><b>Valable pour 15 jours</b></div>  
            </div>
            
        </div>
    );
});

export default RecuConsultationPrint;
