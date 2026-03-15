import React, { forwardRef, useEffect, useState } from 'react';

interface RecuPharmaciePrintProps {
    facturation: any;
    lignes?: any[];
}

interface EntrepriseInfo {
    LogoE?: string;
    EnteteSociete?: string;
    PiedPageSociete?: string;
}


const styles = {
    container: {
        width: '800px',
        margin: '0 auto',
        fontFamily: 'Arial, sans-serif',
        background: '#fff',
        color: '#000',
        padding: '20px',
        border: '2px solid #000',
        boxShadow: '0 0 10px rgba(0,0,0,0.1)',
    },
    header: {
        textAlign: 'center' as const,
        color: '#007bff',
        fontWeight: 'bold' as const,
        fontSize: 24,
        marginBottom: 15,
        borderBottom: '2px solid #007bff',
        paddingBottom: 10,
    },
    subHeader: {
        textAlign: 'center' as const,
        fontSize: 18,
        fontWeight: 'bold' as const,
        marginBottom: 20,
        color: '#333',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse' as const,
        marginTop: 20,
        marginBottom: 20,
        border: '1px solid #000',
    },
    th: {
        border: '1px solid #000',
        padding: '8px 4px',
        background: '#f8f9fa',
        fontSize: 14,
        fontWeight: 'bold' as const,
        textAlign: 'center' as const,
    },
    td: {
        border: '1px solid #000',
        padding: '6px 4px',
        fontSize: 13,
        textAlign: 'center' as const,
    },
    info: {
        fontSize: 14,
        marginBottom: 5,
        lineHeight: 1.4,
    },
    bold: {
        fontWeight: 'bold' as const,
        fontSize: 16,
    },
    footer: {
        marginTop: 20,
        fontSize: 12,
        textAlign: 'center' as const,
        borderTop: '1px solid #ccc',
        paddingTop: 10,
    },
    totals: {
        marginTop: 20,
        padding: '10px',
        background: '#f8f9fa',
        border: '1px solid #ccc',
        fontSize: 14,
    },
    totalRow: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
};

const RecuPharmaciePrint = forwardRef<HTMLDivElement, RecuPharmaciePrintProps>(({ facturation, lignes = [] }, ref) => {
    const [entreprise, setEntreprise] = useState<EntrepriseInfo | null>(null);


    useEffect(() => {
        let cancelled = false;

        const loadEntreprise = async () => {
            try {
                const res = await fetch('/api/entreprise');
                if (!res.ok) return;
                const data = await res.json();
                if (!cancelled && Array.isArray(data) && data.length > 0) {
                    setEntreprise(data[0]);
                }
            } catch {
                // ignore
            }
        };

        loadEntreprise();
        return () => {
            cancelled = true;
        };
    }, []);

    if (!facturation) return null;

    const lignesPayees = (lignes || []).filter((l) => (l?.actePayeCaisse || "").toString() === "Payé");
    const montantTotal = Number(facturation?.Montanttotal || facturation?.montantTotal || 0);
    const partAssurance = Number(facturation?.PartAssuranceP || facturation?.partAssurance || 0);
    const partAssure = Number(facturation?.Partassuré || facturation?.Partassure || facturation?.partAssure || 0);
    const remise = Number(facturation?.reduction || facturation?.Remise || 0);
    const montantRecu = Number(facturation?.MontantRecu || facturation?.montantRecu || 0);
    const reste = Number(facturation?.Restapayer || facturation?.resteAPayer || 0);

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
            <div className="no-print" style={{ textAlign: 'center', marginBottom: 20 }}>
                <button
                    onClick={() => window.print()}
                    style={{
                        padding: '12px 24px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 16,
                        fontWeight: 'bold',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    }}
                >
                    🖨️ Imprimer le Reçu
                </button>
            </div>
            <div className="print-container">
                <div className='d-flex' style={styles.header}>
                    {entreprise?.LogoE && (
                        <div style={{ textAlign: 'center', marginBottom: 10 }}>
                            <img
                                src={entreprise.LogoE}
                                alt="Logo"
                                style={{ maxHeight: 80, maxWidth: '100%', objectFit: 'contain' }}
                            />
                        </div>
                    )}
                    {entreprise?.EnteteSociete && (
                        <div
                            style={{ textAlign: 'center', marginBottom: 10, fontSize: 12, color: '#666' }}
                            dangerouslySetInnerHTML={{ __html: entreprise.EnteteSociete }}
                        />
                    )}
                </div>
                <div style={styles.subHeader}>
                    REÇU DE PHARMACIE
                </div>
                <div style={{ marginBottom: 20, borderBottom: '1px solid #ccc', paddingBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div style={styles.bold}>N° {facturation?.CodePrestation || ''}</div>
                        <div style={styles.info}>Date : {facturation?.DateFacturation ? new Date(facturation.DateFacturation).toLocaleDateString('fr-FR') : ''}</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div style={styles.info}><strong>Patient :</strong> {facturation?.PatientP || ''}</div>
                        <div style={styles.info}><strong>Dossier N° :</strong> {facturation?.NumBon || ''}</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div style={styles.info}><strong>Prescripteur :</strong> {facturation?.NomMed || ''}</div>
                        <div style={styles.info}><strong>Assurance :</strong> {facturation?.Assurance || ''} ({facturation?.Taux || 0}%)</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div style={styles.info}><strong>Mode de paiement :</strong> {facturation?.Modepaiement || 'Espèce'}</div>
                        <div style={styles.info}><strong>Facturé par :</strong> {facturation?.SaisiPar || facturation?.FacturéPar || ''}</div>
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
                                    <td style={{ ...styles.td, textAlign: 'left' }}>{l?.nomMedicament || ''}</td>
                                    <td style={styles.td}>{Number(l?.QteP || 0)}</td>
                                    <td style={styles.td}>{Number(l?.prixUnitaire || 0).toLocaleString('fr-FR')}</td>
                                    <td style={styles.td}>{Number(l?.prixTotal || 0).toLocaleString('fr-FR')}</td>
                                    <td style={styles.td}>{Number(l?.PartAssurance || 0).toLocaleString('fr-FR')}</td>
                                    <td style={styles.td}>{Number(l?.Partassuré_PA || l?.partAssure || 0).toLocaleString('fr-FR')}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} style={{ ...styles.td, textAlign: 'center', fontStyle: 'italic' }}>
                                    Aucune ligne payée
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                <div style={styles.totals}>
                    <div style={styles.totalRow}>
                        <span><strong>Total acte :</strong></span>
                        <span>{montantTotal.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                    <div style={styles.totalRow}>
                        <span><strong>Part assurance :</strong></span>
                        <span>{partAssurance.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                    <div style={styles.totalRow}>
                        <span><strong>Part patient :</strong></span>
                        <span>{partAssure.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                    {remise > 0 && (
                        <div style={styles.totalRow}>
                            <span><strong>Remise :</strong></span>
                            <span>{remise.toLocaleString('fr-FR')} FCFA</span>
                        </div>
                    )}
                    <div style={styles.totalRow}>
                        <span><strong>Montant reçu :</strong></span>
                        <span>{montantRecu.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                    <div style={styles.totalRow}>
                        <span><strong>Reste à payer :</strong></span>
                        <span>{reste.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                </div>
                <div style={styles.footer}>
                    <div style={{ marginBottom: 10 }}>
                        <strong>Imprimé par:</strong> {facturation?.SaisiPar || facturation?.FacturéPar || ''}
                        &nbsp;&nbsp;&nbsp;
                        <strong>Le:</strong> {new Date().toLocaleDateString('fr-FR')}
                        &nbsp;&nbsp;&nbsp;
                        <strong>À:</strong> {new Date().toLocaleTimeString('fr-FR')}
                    </div>
                    <div style={{ fontStyle: 'italic', color: '#666' }}>
                        <strong>Valable pour 15 jours</strong>
                    </div>
                </div>
                {entreprise?.PiedPageSociete && (
                    <div
                        style={{ ...styles.footer, marginTop: 10, fontSize: 11, borderTop: 'none', paddingTop: 0 }}
                        dangerouslySetInnerHTML={{ __html: entreprise.PiedPageSociete }}
                    />
                )}
            </div>
        </div>
    );
});

RecuPharmaciePrint.displayName = 'RecuPharmaciePrint';

export default RecuPharmaciePrint;
