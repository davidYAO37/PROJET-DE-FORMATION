"use client";
import React, { forwardRef } from 'react';
import { Button } from 'react-bootstrap';
import { useEntreprise } from "@/hooks/useEntreprise";
import { generatePrintHeader, generatePrintFooter, createPrintWindow, createPrintWindowWithoutHeader, extractContentWithoutHeaderAndFooter } from "@/utils/printRecu";

interface PrintCompteRenduUnifiedProps {
    donnees: {
        Nompatient: string;
        Sexe?: string;
        Age_partient?: string;
        Situationgeo?: string;
        Code_Prestation?: string;
        Prestation: string;
        DatesaisieResultat: string;
        MedecinPrescripteur?: string;
        Docteursaisieresultat?: string;
        resultatacte: string;
        ObservationExame?: string;
    };
    validationInfo?: {
        validePar?: string;
        valideLe?: string;
    };
    titre?: string;
    autoPrint?: boolean;
}

// Récupérer l'utilisateur connecté
const Utilisateur = typeof window !== 'undefined' ? localStorage.getItem("nom_utilisateur") : "";

const PrintCompteRenduUnified = forwardRef<HTMLDivElement, PrintCompteRenduUnifiedProps>(
    ({ donnees, validationInfo, titre = "COMPTE RENDU RADIOLOGIQUE", autoPrint = false }, ref) => {
        const { entreprise } = useEntreprise();
        const dateImpression = new Date().toLocaleDateString('fr-FR');
        const datePrestation = new Date(donnees.DatesaisieResultat).toLocaleDateString('fr-FR');

        const handlePrint = () => {
            const printContent = document.getElementById('print-content');
            if (!printContent) {
                console.error('Contenu d\'impression non trouvé');
                return;
            }
            
            try {
                const headerHTML = generatePrintHeader(entreprise);
                const footerHTML = generatePrintFooter(entreprise);
                const restContent = extractContentWithoutHeaderAndFooter(printContent.innerHTML);
                
                console.log('Impression avec entête - Header:', headerHTML.length, 'Footer:', footerHTML.length, 'Content:', restContent.length);
                createPrintWindow('Compte Rendu Radio', headerHTML, restContent, footerHTML);
            } catch (error) {
                console.error('Erreur lors de l\'impression avec entête:', error);
                alert('Erreur lors de l\'impression avec entête');
            }
        };

        const handlePrintWithoutHeader = () => {
            const printContent = document.getElementById('print-content');
            if (!printContent) {
                console.error('Contenu d\'impression non trouvé');
                return;
            }
            
            try {
                const restContent = extractContentWithoutHeaderAndFooter(printContent.innerHTML);
                
                console.log('Impression sans entête - Content:', restContent.length);
                createPrintWindowWithoutHeader('Compte Rendu Radio (sans entête)', restContent);
            } catch (error) {
                console.error('Erreur lors de l\'impression sans entête:', error);
                alert('Erreur lors de l\'impression sans entête');
            }
        };

        if (!donnees) return null;

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
                <div ref={ref} id="print-content" style={{ 
                    padding: '10px', 
                    fontFamily: 'Arial, sans-serif', 
                    fontSize: '12px',
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    lineHeight: '1.2'
                }}>
                    {/* Titre principal */}
                    <div style={{ 
                        textAlign: 'center', 
                        marginBottom: '20px',
                        fontWeight: 'bold',
                        fontSize: '20px',
                        textDecoration: 'underline'
                    }}>
                        {titre}
                    </div>

                    {/* Informations patient et prestation - Style comme PrintFactureDetailleAssurance */}
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr', 
                        gap: '15px', 
                        marginBottom: '20px',
                        padding: '15px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px',
                        border: '1px solid #dee2e6'
                    }}>
                        {/* Colonnes gauche - Patient */}
                        <div>
                            <div style={{ 
                                fontWeight: 'bold', 
                                marginBottom: '8px', 
                                color: '#495057', 
                                fontSize: '11px',
                                borderBottom: '1px solid #dee2e6',
                                paddingBottom: '4px'
                            }}>
                                INFORMATIONS PATIENT
                            </div>
                            <div style={{ display: 'grid', gap: '4px', fontSize: '10px' }}>
                                <div><strong>Nom & Prénoms:</strong> {donnees.Nompatient || 'N/A'}</div>
                                <div><strong>Sexe:</strong> {donnees.Sexe || 'N/A'}</div>
                                <div><strong>Âge:</strong> {donnees.Age_partient ? donnees.Age_partient + ' ans' : 'N/A'}</div>
                                <div><strong>Situation géographique:</strong> {donnees.Situationgeo || 'N/A'}</div>
                                <div><strong>Dossier N°:</strong> {donnees.Code_Prestation || 'N/A'}</div>
                            </div>
                        </div>

                        {/* Colonnes droite - Prestation */}
                        <div>
                            <div style={{ 
                                fontWeight: 'bold', 
                                marginBottom: '8px', 
                                color: '#495057', 
                                fontSize: '11px',
                                borderBottom: '1px solid #dee2e6',
                                paddingBottom: '4px'
                            }}>
                                INFORMATIONS PRESTATION
                            </div>
                            <div style={{ display: 'grid', gap: '4px', fontSize: '10px' }}>
                                <div><strong>Prestation:</strong> {donnees.Prestation || 'N/A'}</div>
                                <div><strong>Date prestation:</strong> {datePrestation || 'N/A'}</div>
                                <div><strong>Médecin prescripteur:</strong> {donnees.MedecinPrescripteur || 'N/A'}</div>
                                <div><strong>Docteur saisie:</strong> {donnees.Docteursaisieresultat || 'N/A'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Séparateur */}
                    <div style={{ 
                        borderBottom: '2px solid #000000', 
                        margin: '20px 0',
                        marginBottom: '30px'
                    }}></div>

                    {/* Section validation si présente */}
                    {validationInfo && (
                        <div style={{ marginBottom: '30px' }}>
                            <div style={{ 
                                fontWeight: 'bold', 
                                fontSize: '14px', 
                                marginBottom: '10px',
                                color: '#2c3e50',
                                borderBottom: '1px solid #000000',
                                paddingBottom: '5px'
                            }}>
                                VALIDATION
                            </div>
                            <div style={{ 
                                border: '1px solid #dee2e6', 
                                borderRadius: '8px',
                                overflow: 'hidden',
                                backgroundColor: '#ffffff'
                            }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', margin: '0' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f8f9fa' }}>
                                            <th style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'left', fontSize: '11px' }}>Champ</th>
                                            <th style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'left', fontSize: '11px' }}>Valeur</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td style={{ border: '1px solid #dee2e6', padding: '8px', fontSize: '10px', fontWeight: 'bold' }}>
                                                Validé par
                                            </td>
                                            <td style={{ border: '1px solid #dee2e6', padding: '8px', fontSize: '10px' }}>
                                                {validationInfo.validePar || 'N/A'}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ border: '1px solid #dee2e6', padding: '8px', fontSize: '10px', fontWeight: 'bold' }}>
                                                Date de validation
                                            </td>
                                            <td style={{ border: '1px solid #dee2e6', padding: '8px', fontSize: '10px' }}>
                                                {validationInfo.valideLe ? new Date(validationInfo.valideLe).toLocaleString('fr-FR') : 'N/A'}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Section résultat */}
                    <div style={{ marginBottom: '30px' }}>
                        <div style={{ 
                            fontWeight: 'bold', 
                            fontSize: '14px', 
                            marginBottom: '10px',
                            color: '#2c3e50',
                            borderBottom: '1px solid #000000',
                            paddingBottom: '5px'
                        }}>
                            RÉSULTAT DE L'EXAMEN
                        </div>
                        <div style={{ 
                            border: '1px solid #dee2e6', 
                            borderRadius: '8px',
                            overflow: 'hidden',
                            backgroundColor: '#ffffff'
                        }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', margin: '0' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                                        <th style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'left', fontSize: '11px' }}>
                                            Contenu du résultat
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style={{ 
                                            border: '1px solid #dee2e6', 
                                            padding: '12px', 
                                            fontSize: '11px',
                                            textAlign: 'justify',
                                            lineHeight: '1.6',
                                            wordWrap: 'break-word'
                                        }}>
                                            <div 
                                                dangerouslySetInnerHTML={{ __html: donnees.resultatacte }}
                                                style={{ 
                                                    whiteSpace: 'pre-wrap',
                                                    minHeight: '100px'
                                                }}
                                            />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Section observation si présente */}
                    {donnees.ObservationExame && (
                        <div style={{ marginBottom: '30px' }}>
                            <div style={{ 
                                fontWeight: 'bold', 
                                fontSize: '14px', 
                                marginBottom: '10px',
                                color: '#2c3e50',
                                borderBottom: '1px solid #000000',
                                paddingBottom: '5px'
                            }}>
                                OBSERVATION
                            </div>
                            <div style={{ 
                                border: '1px solid #dee2e6', 
                                borderRadius: '8px',
                                overflow: 'hidden',
                                backgroundColor: '#ffffff'
                            }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', margin: '0' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f8f9fa' }}>
                                            <th style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'left', fontSize: '11px' }}>
                                                Contenu de l'observation
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td style={{ 
                                                border: '1px solid #dee2e6', 
                                                padding: '12px', 
                                                fontSize: '10px',
                                                fontStyle: 'italic',
                                                color: '#555',
                                                textAlign: 'justify',
                                                lineHeight: '1.6',
                                                wordWrap: 'break-word'
                                            }}>
                                                <div 
                                                    dangerouslySetInnerHTML={{ __html: donnees.ObservationExame }}
                                                    style={{ 
                                                        whiteSpace: 'pre-wrap',
                                                        minHeight: '50px'
                                                    }}
                                                />
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Infos d'impression */}
                    <div style={{ 
                        textAlign: 'center', 
                        fontSize: '10px', 
                        color: '#666666',
                        marginBottom: '5px',
                        marginTop: '20px'
                    }}>
                        Imprimé le: {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })} à {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} par {Utilisateur}
                    </div>
                    
                    <div style={{ 
                        textAlign: 'center', 
                        fontSize: '9px', 
                        color: '#999999',
                        marginBottom: '5px'
                    }}>
                        Document généré par le système EasyMedical - Service de Radiologie
                    </div>
                </div>
            </>
        );
    }
);

PrintCompteRenduUnified.displayName = 'PrintCompteRenduUnified';

export default PrintCompteRenduUnified;
