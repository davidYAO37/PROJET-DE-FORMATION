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
    autoPrint?: boolean;
}

// Récupérer l'utilisateur connecté
const Utilisateur = typeof window !== 'undefined' ? localStorage.getItem("nom_utilisateur") : "";

const PrintCompteRenduUnified = forwardRef<HTMLDivElement, PrintCompteRenduUnifiedProps>(
    ({ donnees }, ref) => {
        const { entreprise } = useEntreprise();
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
                    {/* Titre principal - Bandeau gris comme sur l'image */}
                    <div style={{ 
                        backgroundColor: '#d3d3d3',
                        padding: '10px',
                        textAlign: 'center',
                        marginBottom: '20px',
                        fontWeight: 'bold',
                        fontSize: '18px',
                        color: '#000000',
                        WebkitPrintColorAdjust: 'exact',
                        printColorAdjust: 'exact'
                    }}>
                        COMPTE RENDU N° {donnees.Code_Prestation || 'N/A'}
                    </div>

                    {/* Informations patient */}
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'flex-start',
                            marginBottom: '10px'
                        }}>
                            <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#000000' }}>
                                {donnees.Nompatient || 'N/A'}
                            </div>
                           
                            <div style={{ display: 'flex', gap: '30px', fontSize: '12px', marginBottom: '5px' }}>
                            <div><strong>sexe :</strong> {donnees.Sexe || 'N/A'}</div>
                            <div><strong>Age:</strong> {donnees.Age_partient ? donnees.Age_partient + ' An(s)' : 'N/A'}</div>
                            <div><strong>Prescripteur:</strong> {donnees.MedecinPrescripteur || 'N/A'}</div>
                        </div>
                        <div style={{ fontSize: '12px', marginBottom: '15px' }}>
                            <strong>Abidjan le:</strong> {datePrestation || 'N/A'}
                        </div>
                        </div>
                        
                        <div style={{ fontSize: '12px', marginBottom: '5px' }}>
                            RENSEIGNEMENT CLINIQUE: {donnees.ObservationExame || ""}
                        </div>
                    </div>

                    {/* Titre de l'examen - Bandeau gris */}
                    <div style={{ 
                        backgroundColor: '#d3d3d3',
                        padding: '8px',
                        textAlign: 'center',
                        marginBottom: '20px',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        color: '#000000',
                        WebkitPrintColorAdjust: 'exact',
                        printColorAdjust: 'exact'
                    }}>
                        {donnees.Prestation || 'N/A'}
                    </div>

                    {/* Section résultat */}
                    <div style={{ marginBottom: '10px' }}>
                        <div style={{ 
                            overflow: 'hidden',
                            backgroundColor: '#ffffff'
                        }}>
                            <div 
                                dangerouslySetInnerHTML={{ __html: donnees.resultatacte }}
                                style={{ whiteSpace: 'pre-wrap' }}
                            />
                        </div>
                    </div>

                   {/* Info biologiste*/}
                   <div style={{ 
                        textAlign: 'right', 
                        fontSize: '12px', 
                        color: '#000000',
                        marginBottom: '10px'
                    }}>
                        Coordialement: {donnees.Docteursaisieresultat || 'N/A'}
                    </div>

                    {/* Infos d'impression */}
                    <div style={{ 
                        textAlign: 'center', 
                        fontSize: '10px', 
                        color: '#666666',
                        marginBottom: '0px',
                        marginTop: '20px'
                    }}>
                        Imprimé le: {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })} à {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} par {Utilisateur}
                    </div>
                </div>
            </>
        );
    }
);

PrintCompteRenduUnified.displayName = 'PrintCompteRenduUnified';

export default PrintCompteRenduUnified;
