import React, { forwardRef, useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import { useEntreprise } from "@/hooks/useEntreprise";
import { generatePrintHeader, generatePrintFooter, createPrintWindow, createPrintWindowWithoutHeader, extractContentWithoutHeaderAndFooter } from "@/utils/printRecu";

interface PrintFactureCosultatAssuranceProps {
    consultation: any;
}

const PrintFactureCosultatAssurance = forwardRef<HTMLDivElement, PrintFactureCosultatAssuranceProps>(({ consultation }, ref) => {
    const { entreprise } = useEntreprise();
    
    // Récupérer l'utilisateur connecté
    const Utilisateur = localStorage.getItem("nom_utilisateur");

    const handlePrint = () => {
        const printContent = document.getElementById('print-content');
        if (!printContent) return;
        
        const headerHTML = generatePrintHeader(entreprise);
        const footerHTML = generatePrintFooter(entreprise);
        const restContent = extractContentWithoutHeaderAndFooter(printContent.innerHTML);
        
        createPrintWindow('Facture Consultation Assurance', headerHTML, restContent, footerHTML);
    };

    const handlePrintWithoutHeader = () => {
        const printContent = document.getElementById('print-content');
        if (!printContent) return;
        
        const restContent = extractContentWithoutHeaderAndFooter(printContent.innerHTML);
        
        createPrintWindowWithoutHeader('Facture Consultation Assurance (sans entête)', restContent);
    };

    if (!consultation) return null;

    return (
        <>
            {/* ===== BOUTONS (non imprimés) ===== */}
            <div className="text-end mb-3 no-print">
                <Button variant="primary" onClick={handlePrint} className="me-2">
                    <i className="bi bi-printer me-2"></i>
                    Imprimer avec entête
                </Button>
                <Button variant="secondary" onClick={handlePrintWithoutHeader}>
                    <i className="bi bi-file-earmark me-2"></i>
                    Imprimer sans entête
                </Button>
            </div>

            {/* ===== ZONE IMPRIMABLE ===== */}
            <div id="print-content" ref={ref} style={{ 
                fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
                fontSize: '13px',
                lineHeight: '1.4',
                color: '#000000',
                maxWidth: '800px',
                margin: '0 auto',
                padding: '20px',
                backgroundColor: '#fff'
            }}>
                
              

                {/* INFORMATIONS PATIENT ET ASSURANCE */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '20px', 
                    marginBottom: '25px' 
                }}>
                    {/* COLONNE GAUCHE - INFORMATIONS PATIENT */}
                    <div style={{ 
                        background: '#f5f5f5', 
                        padding: '15px', 
                        borderRadius: '10px',
                        border: '1px solid #cccccc'
                    }}>
                        <h3 style={{ 
                            fontSize: '16px', 
                            fontWeight: '600', 
                            color: '#333333',
                            margin: '0 0 12px 0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <i className="bi bi-person-fill" style={{ color: '#333333' }}></i>
                            Informations Patient
                        </h3>
                        <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                            <div style={{ marginBottom: '6px' }}>
                                <strong>Patient:</strong> {consultation.Nom || '---'}
                            </div>
                            <div style={{ marginBottom: '6px' }}>
                                <strong>N° Dossier:</strong> {consultation.Code_dossier || '---'}
                            </div>
                            <div style={{ marginBottom: '6px' }}>
                                <strong>Contact:</strong> {consultation.Contact || '---'}
                            </div>
                            <div style={{ marginBottom: '6px' }}>
                                <strong>Sexe:</strong> {consultation.Sexe || '---'}
                            </div>
                            <div>
                                <strong>Âge:</strong> {consultation.Age_partient || '---'}
                            </div>
                        </div>
                    </div>

                    {/* COLONNE DROITE - INFORMATIONS ASSURANCE */}
                    <div style={{ 
                        background: '#f5f5f5', 
                        padding: '15px', 
                        borderRadius: '10px',
                        border: '1px solid #cccccc'
                    }}>
                        <h3 style={{ 
                            fontSize: '16px', 
                            fontWeight: '600', 
                            color: '#333333',
                            margin: '0 0 12px 0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <i className="bi bi-shield-fill" style={{ color: '#333333' }}></i>
                            Informations Assurance
                        </h3>
                        <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                            <div style={{ marginBottom: '6px' }}>
                                <strong>Assurance:</strong> {consultation.ASSURANCE || '---'}
                            </div>
                            <div style={{ marginBottom: '6px' }}>
                                <strong>NCC:</strong> {consultation.NCC || '---'}
                            </div>
                            <div style={{ marginBottom: '6px' }}>
                                <strong>N° Carte:</strong> {consultation.numero_carte || '---'}
                            </div>
                            <div style={{ marginBottom: '6px' }}>
                                <strong>Taux:</strong> {consultation.tauxAssurance || 0}%
                            </div>
                            <div style={{ marginBottom: '6px' }}>
                                <strong>Souscripteur:</strong> {consultation.Souscripteur || '---'}
                            </div>
                            <div>
                                <strong>Société:</strong> {consultation.SOCIETE_PATIENT || '---'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* INFORMATIONS MÉDECIN ET FACTURATION */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr 1fr', 
                    gap: '15px', 
                    marginBottom: '25px' 
                }}>
                    <div style={{ 
                        background: '#f0f0f0', 
                        padding: '12px', 
                        borderRadius: '8px',
                        border: '1px solid #999999',
                        fontSize: '13px'
                    }}>
                        <strong style={{ color: '#333333' }}>
                            <i className="bi bi-person-badge me-1"></i>
                            Médecin:
                        </strong> {consultation.Medecin_CO || '---'}
                    </div>
                    <div style={{ 
                        background: '#f0f0f0', 
                        padding: '12px', 
                        borderRadius: '8px',
                        border: '1px solid #999999',
                        fontSize: '13px'
                    }}>
                        <strong style={{ color: '#333333' }}>
                            <i className="bi bi-file-earmark-text me-1"></i>
                            Facturé le:
                        </strong> {consultation.DateFacturation ? new Date(consultation.DateFacturation).toLocaleDateString('fr-FR') : '---'}
                    </div>
                    <div style={{ 
                        background: '#f0f0f0', 
                        padding: '12px', 
                        borderRadius: '8px',
                        border: '1px solid #999999',
                        fontSize: '13px'
                    }}>
                        <strong style={{ color: '#333333' }}>
                            <i className="bi bi-person-check me-1"></i>
                            Facturé par:
                        </strong> {consultation.FacturéPar || '---'}
                    </div>
                </div>

              
                      {/* EN-TÊTE DE FACTURE */}
                <div style={{ 
                    textAlign: 'center', 
                    border: '1px solid #333333',
                    borderRadius: '8px',
                    backgroundColor: '#676565ff'
                }}>
                    <h1 style={{ 
                        fontSize: '28px', 
                        fontWeight: '700', 
                        color: '#000000',
                        margin: '0 auto',
                        textAlign: 'center',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                    }}>
                        Détail Consultation: {consultation.Code_consultation || '---'}
                    </h1>                    
                </div>

                {/* TABLEAU DES DÉTAILS */}
                <div style={{ marginBottom: '25px' }}>
                    <table style={{ 
                        width: '100%', 
                        borderCollapse: 'collapse',
                        fontSize: '13px',
                        border: '1px solid #333333'
                    }}>
                        <thead>
                            <tr style={{ 
                                background: '#666666',
                                color: 'white',
                                fontWeight: '600'
                            }}>
                                <th style={{ 
                                    border: '1px solid #333333', 
                                    padding: '12px 8px',
                                    textAlign: 'left',
                                    fontSize: '12px'
                                }}>
                                    Date Facturation
                                </th>
                                <th style={{ 
                                    border: '1px solid #333333', 
                                    padding: '12px 8px',
                                    textAlign: 'left',
                                    fontSize: '12px'
                                }}>
                                    Désignation
                                </th>
                                <th style={{ 
                                    border: '1px solid #333333', 
                                    padding: '12px 8px',
                                    textAlign: 'right',
                                    fontSize: '12px'
                                }}>
                                    Prix Clinique
                                </th>
                                <th style={{ 
                                    border: '1px solid #333333', 
                                    padding: '12px 8px',
                                    textAlign: 'right',
                                    fontSize: '12px'
                                }}>
                                    Part Assurance
                                </th>
                                <th style={{ 
                                    border: '1px solid #333333', 
                                    padding: '12px 8px',
                                    textAlign: 'right',
                                    fontSize: '12px'
                                }}>
                                    Ticket Modérateur
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ 
                                    border: '1px solid #333333', 
                                    padding: '10px 8px',
                                    fontWeight: '600',
                                    background: '#f5f5f5'
                                }}>
                                    {consultation.DateFacturation ? new Date(consultation.DateFacturation).toLocaleDateString('fr-FR') : '---'}
                                </td>
                                <td style={{ 
                                    border: '1px solid #333333', 
                                    padding: '10px 8px'
                                }}>
                                    {consultation.designationC || '---'}
                                </td>
                                <td style={{ 
                                    border: '1px solid #333333', 
                                    padding: '10px 8px',
                                    textAlign: 'right',
                                    fontWeight: '600'
                                }}>
                                    {(consultation.Prix_consultation || 0).toLocaleString()} FCFA
                                </td>
                                <td style={{ 
                                    border: '1px solid #333333', 
                                    padding: '10px 8px',
                                    textAlign: 'right',
                                    color: '#333333',
                                    fontWeight: '600'
                                }}>
                                    {(consultation.PartAssurance || 0).toLocaleString()} FCFA
                                </td>
                                <td style={{ 
                                    border: '1px solid #333333', 
                                    padding: '10px 8px',
                                    textAlign: 'right',
                                    color: '#333333',
                                    fontWeight: '600'
                                }}>
                                    {(consultation.montantapayer || 0).toLocaleString()} FCFA
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* RÉCAPITULATIF FINANCIER */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '20px', 
                    marginBottom: '25px' 
                }}>
                    <div style={{ 
                        background: '#f5f5f5', 
                        padding: '15px', 
                        borderRadius: '10px',
                        border: '2px solid #333333'
                    }}>
                        <h4 style={{ 
                            fontSize: '16px', 
                            fontWeight: '600', 
                            color: '#333333',
                            margin: '0 0 10px 0'
                        }}>
                            <i className="bi bi-cash-stack me-2"></i>
                            Récapitulatif Clinique
                        </h4>
                        <div style={{ fontSize: '13px', lineHeight: '1.8' }}>
                            <div style={{ marginBottom: '6px' }}>
                                <strong>Prix Clinique:</strong> {(consultation.PrixClinique || 0).toLocaleString()} FCFA
                            </div>
                            <div style={{ marginBottom: '6px' }}>
                                <strong>Montant à Payer:</strong> {(consultation.montantapayer || 0).toLocaleString()} FCFA
                            </div>                            
                        </div>
                    </div>

                    <div style={{ 
                        background: '#f5f5f5', 
                        padding: '15px', 
                        borderRadius: '10px',
                        border: '2px solid #333333'
                    }}>
                        <h4 style={{ 
                            fontSize: '16px', 
                            fontWeight: '600', 
                            color: '#333333',
                            margin: '0 0 10px 0'
                        }}>
                            <i className="bi bi-info-circle me-2"></i>
                            Récapitulatif Assurance
                        </h4>
                        <div style={{ fontSize: '13px', lineHeight: '1.8' }}>
                            <div style={{ marginBottom: '6px' }}>
                                <strong>Part Assurance:</strong> 
                                <span style={{ 
                                    marginLeft: '8px',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    background: '#e0e0e0',
                                    color: '#333333',
                                    fontSize: '11px',
                                    fontWeight: '600'
                                }}>
                                    <strong>{(consultation.PartAssurance || 0).toLocaleString()} FCFA</strong>
                                </span>
                            </div>                            
                        </div>
                    </div>
                </div>

                {/* PIED DE PAGE */}
                <div style={{ 
                    textAlign: 'center', 
                    marginTop: '40px',
                    paddingTop: '20px',
                    borderTop: '2px solid #999999'
                }}>
                    <div style={{ 
                        fontSize: '16px', 
                        fontWeight: '600', 
                        color: '#333333',
                        marginBottom: '8px'
                    }}>
                        <i className="bi bi-heart-fill me-2"></i>
                        Merci pour votre confiance
                    </div>
                    <div style={{ 
                        fontSize: '11px', 
                        color: '#666666',
                        fontStyle: 'italic'
                    }}>
                        Imprimé le: {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })} à {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} par {Utilisateur}
                    </div>
                </div>
            </div>
        </>
    );
});

PrintFactureCosultatAssurance.displayName = 'PrintFactureCosultatAssurance';

export default PrintFactureCosultatAssurance;
