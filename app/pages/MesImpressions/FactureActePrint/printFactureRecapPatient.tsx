import React, { forwardRef, useState, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import { useEntreprise } from "@/hooks/useEntreprise";
import { generatePrintHeader, generatePrintFooter, createPrintWindow, createPrintWindowWithoutHeader, extractContentWithoutHeaderAndFooter } from "@/utils/printRecu";
import { NumberToLetter } from '@mandarvl/convertir-nombre-lettre';

interface PrintFactureRecapPatientProps {
    consultation: any;
}

// Récupérer l'utilisateur connecté
const Utilisateur = typeof window !== 'undefined' ? localStorage.getItem("nom_utilisateur") : "";

const PrintFactureRecapPatient = forwardRef<HTMLDivElement, PrintFactureRecapPatientProps>(
    ({ consultation }, ref) => {
        const { entreprise } = useEntreprise();
        const [remises, setRemises] = useState<any[]>([]);

        // Récupérer les remises de facturation
        useEffect(() => {
            const fetchRemises = async () => {
                try {
                    const response = await fetch(`/api/EtatFactureCaisse/reductionFacture?codeVisiteur=${consultation.consultation?.Code_consultation}`);
                    const data = await response.json();
                    
                    if (data && Array.isArray(data)) {
                        setRemises(data);
                    }
                } catch (error) {
                    console.error('Erreur lors de la récupération des remises:', error);
                }
            };

            if (consultation.consultation?.Code_consultation) {
                fetchRemises();
            }
        }, [consultation.consultation?.Code_consultation]);

        const handlePrint = () => {
            const printContent = document.getElementById('print-content');
            if (!printContent) return;
            
            const headerHTML = generatePrintHeader(entreprise);
            const footerHTML = generatePrintFooter(entreprise);
            const restContent = extractContentWithoutHeaderAndFooter(printContent.innerHTML);
            
            createPrintWindow('Facture Recap Patient', headerHTML, restContent, footerHTML);
        };

        const handlePrintWithoutHeader = () => {
            const printContent = document.getElementById('print-content');
            if (!printContent) return;
            
            const restContent = extractContentWithoutHeaderAndFooter(printContent.innerHTML);
            
            createPrintWindowWithoutHeader('Facture Recap Patient (sans entête)', restContent);
        };

        if (!consultation) return null;

        // Calculer les totaux généraux
        const consultationTotal = consultation.consultation?.Prix_consultation || 0;
        const examensTotal = consultation.examens?.reduce((total: number, examen: any) => total + (Number(examen.PrixTotal) || 0), 0) || 0;
        const medicamentsTotal = consultation.medicaments?.reduce((total: number, medicament: any) => total + (Number(medicament.PrixTotal) || 0), 0) || 0;

        // Calculer le total general part assurance
        const TotalconsultationAssurance = consultation.consultation?.PartAssurance || 0;
        const TotalExamensAssurance = consultation.examens?.reduce((total: number, examen: any) => total + (Number(examen.PartAssurance) || 0), 0) || 0;
        const TotalMedicamentsAssurance = consultation.medicaments?.reduce((total: number, medicament: any) => total + (Number(medicament.PartAssurance) || 0), 0) || 0;
        // Calculer le total general part patient
        const TotalconsultationPatient = consultation.consultation?.montantapayer || 0;
        const TotalExamensPatient = consultation.examens?.reduce((total: number, examen: any) => total + (Number(examen.Partassuré) || 0), 0) || 0;
        const TotalMedicamentsPatient = consultation.medicaments?.reduce((total: number, medicament: any) => total + (Number(medicament.Partassuré) || 0), 0) || 0;
        
        // Calculer le total des remises
        const totalRemises = remises.reduce((total: number, remise: any) => total + remise.reduction, 0);
        
        const totalGeneral = consultationTotal + examensTotal + medicamentsTotal;
        const TotalPartAssurance = TotalconsultationAssurance + TotalExamensAssurance + TotalMedicamentsAssurance;
        const TotalPartPatient = TotalconsultationPatient + TotalExamensPatient + TotalMedicamentsPatient;
        
        // Calculer le montant payé après remise (remise appliquée sur la part patient)
        const montantPaye = Math.max(0, TotalPartPatient - totalRemises);

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
                        FACTURE RECAP PATIENT
                    </div>

                    {/* Informations patient et facture */}
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr 1fr', 
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
                                <div><strong>Nom & Prénoms:</strong> {consultation.patient?.Nom + ' ' + consultation.patient?.Prenoms || 'N/A'}</div>
                                <div><strong>Contact:</strong> {consultation.patient?.Contact || 'N/A'}</div>
                                <div><strong>N° Dossier:</strong> {consultation.consultation?.Code_consultation || 'N/A'}</div>
                                <div><strong>Age:</strong> {consultation.patient?.Age_partient || 'N/A'} ans</div>
                            </div>
                        </div>

                        {/* Colonnes centre - Assurance */}
                        <div>
                            <div style={{ 
                                fontWeight: 'bold', 
                                marginBottom: '8px', 
                                color: '#495057', 
                                fontSize: '11px',
                                borderBottom: '1px solid #dee2e6',
                                paddingBottom: '4px'
                            }}>
                                INFORMATIONS ASSURANCE
                            </div>
                            <div style={{ display: 'grid', gap: '4px', fontSize: '10px' }}>
                                <div><strong>Assurance:</strong> {consultation.consultation?.assurance || 'NON ASSURE'}</div>
                                <div><strong>N° Carte:</strong> {consultation.consultation?.numero_carte || 'N/A'}</div>
                                <div><strong>Bon N°:</strong> {consultation.consultation?.NumBon || 'N/A'}
                                <strong>Taux:</strong> {consultation.consultation?.tauxAssurance || 'N/A'}%</div>
                                <div><strong>Souscripteur:</strong> {consultation.consultation?.SOCIETE_PATIENT || 'N/A'}</div>
                            </div>
                        </div>
                        {/* Colonnes droite - Facturation */}
                        <div>
                            <div style={{ 
                                fontWeight: 'bold', 
                                marginBottom: '8px', 
                                color: '#495057', 
                                fontSize: '11px',
                                borderBottom: '1px solid #dee2e6',
                                paddingBottom: '4px'
                            }}>
                                INFORMATIONS FACTURATION
                            </div>
                            <div style={{ display: 'grid', gap: '4px', fontSize: '10px' }}>
                                <div><strong>Date Consultation:</strong> {consultation.consultation?.DateFacturation ? 
                                    new Date(consultation.consultation.DateFacturation).toLocaleDateString('fr-FR', { 
                                        day: '2-digit', 
                                        month: '2-digit', 
                                        year: 'numeric' 
                                    }) : 'N/A'
                                }</div>
                                <div><strong>Facturé par:</strong>  {consultation.consultation?.Caissiere || 'N/A'}</div>
                                <div><strong>Mode Paiement:</strong>  {consultation.consultation?.Modepaiement || 'N/A'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Séparateur */}
                    <div style={{ 
                        borderBottom: '2px solid #000000', 
                        margin: '20px 0',
                        marginBottom: '30px'
                    }}></div>

                    {/* Tableau récapitulatif compact */}
                    <div style={{ marginBottom: '30px' }}>
                        <div style={{ 
                            fontWeight: 'bold', 
                            fontSize: '14px', 
                            marginBottom: '15px',
                            color: '#2c3e50',
                            borderBottom: '2px solid #000000',
                            paddingBottom: '8px',
                            textAlign: 'center'
                        }}>
                            RÉCAPITULATIF DES ACTES
                        </div>
                        <div style={{ 
                            border: '2px solid #000000', 
                            borderRadius: '8px',
                            overflow: 'hidden',
                            backgroundColor: '#ffffff'
                        }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', margin: '0' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#2c3e50', color: '#ffffff' }}>
                                        <th style={{ border: '1px solid #000000', padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold' }}>ACTE</th>
                                        <th style={{ border: '1px solid #000000', padding: '10px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold' }}>MONTANT TOTAL</th>
                                        <th style={{ border: '1px solid #000000', padding: '10px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold' }}>PART ASSURANCE</th>
                                        <th style={{ border: '1px solid #000000', padding: '10px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold' }}>PART PATIENT</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Consultation */}
                                    {consultation.consultation && (
                                        <tr style={{ backgroundColor: '#f8f9fa' }}>
                                            <td style={{ border: '1px solid #000000', padding: '8px', fontSize: '11px', fontWeight: 'bold' }}>
                                                CONSULTATION
                                            </td>
                                            <td style={{ border: '1px solid #000000', padding: '8px', textAlign: 'right', fontSize: '11px' }}>
                                                {Number(consultation.consultation?.Prix_consultation || 0).toLocaleString('fr-FR')} FCFA
                                            </td>
                                            <td style={{ border: '1px solid #000000', padding: '8px', textAlign: 'right', fontSize: '11px' }}>
                                                {Number(consultation.consultation?.PartAssurance || 0).toLocaleString('fr-FR')} FCFA
                                            </td>
                                            <td style={{ border: '1px solid #000000', padding: '8px', textAlign: 'right', fontSize: '11px' }}>
                                                {Number(consultation.consultation?.montantapayer || 0).toLocaleString('fr-FR')} FCFA
                                            </td>
                                        </tr>
                                    )}
                                    
                                    {/* Examens groupés par Désignationtypeacte */}
                                    {consultation.examens && consultation.examens.length > 0 && 
                                        Object.entries(
                                            consultation.examens.reduce((acc: any, examen: any) => {
                                                const designation = examen.Désignationtypeacte || 'AUTRE';
                                                if (!acc[designation]) acc[designation] = { total: 0, assurance: 0, patient: 0, count: 0 };
                                                acc[designation].total += Number(examen.PrixTotal) || 0;
                                                acc[designation].assurance += Number(examen.PartAssurance) || 0;
                                                acc[designation].patient += Number(examen.Partassuré) || 0;
                                                acc[designation].count += 1;
                                                return acc;
                                            }, {})
                                        ).map(([designation, totals]: [string, any]) => (
                                            <tr key={designation}>
                                                <td style={{ border: '1px solid #000000', padding: '8px', fontSize: '11px', fontWeight: 'bold' }}>
                                                    {designation.toUpperCase()}
                                                </td>
                                                <td style={{ border: '1px solid #000000', padding: '8px', textAlign: 'right', fontSize: '11px' }}>
                                                    {totals.total.toLocaleString('fr-FR')} FCFA
                                                </td>
                                                <td style={{ border: '1px solid #000000', padding: '8px', textAlign: 'right', fontSize: '11px' }}>
                                                    {totals.assurance.toLocaleString('fr-FR')} FCFA
                                                </td>
                                                <td style={{ border: '1px solid #000000', padding: '8px', textAlign: 'right', fontSize: '11px' }}>
                                                    {totals.patient.toLocaleString('fr-FR')} FCFA
                                                </td>
                                            </tr>
                                        ))
                                    }
                                    
                                    {/* Pharmacie groupée */}
                                    {consultation.medicaments && consultation.medicaments.length > 0 && (
                                        <tr style={{ backgroundColor: '#f8f9fa' }}>
                                            <td style={{ border: '1px solid #000000', padding: '8px', fontSize: '11px', fontWeight: 'bold' }}>
                                                PHARMACIE
                                            </td>
                                            <td style={{ border: '1px solid #000000', padding: '8px', textAlign: 'right', fontSize: '11px' }}>
                                                {medicamentsTotal.toLocaleString('fr-FR')} FCFA
                                            </td>
                                            <td style={{ border: '1px solid #000000', padding: '8px', textAlign: 'right', fontSize: '11px' }}>
                                                {TotalMedicamentsAssurance.toLocaleString('fr-FR')} FCFA
                                            </td>
                                            <td style={{ border: '1px solid #000000', padding: '8px', textAlign: 'right', fontSize: '11px' }}>
                                                {TotalMedicamentsPatient.toLocaleString('fr-FR')} FCFA
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot>
                                    <tr style={{ backgroundColor: '#2c3e50', color: '#ffffff', fontWeight: 'bold', fontSize: '13px' }}>
                                        <td style={{ border: '1px solid #000000', padding: '10px', textAlign: 'right' }}>TOTAL GÉNÉRAL:</td>
                                        <td style={{ border: '1px solid #000000', padding: '10px', textAlign: 'right' }}>
                                            {totalGeneral.toLocaleString('fr-FR')} FCFA
                                        </td>
                                        <td style={{ border: '1px solid #000000', padding: '10px', textAlign: 'right' }}>
                                            {TotalPartAssurance.toLocaleString('fr-FR')} FCFA
                                        </td>
                                        <td style={{ border: '1px solid #000000', padding: '10px', textAlign: 'right' }}>
                                            {TotalPartPatient.toLocaleString('fr-FR')} FCFA
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Récapitulatif financier global */}
                    <div style={{ 
                        marginTop: '30px',
                        border: '2px solid #000000',
                        borderRadius: '8px',
                        overflow: 'hidden'
                    }}>
                        <div style={{ 
                            backgroundColor: '#2c3e50',
                            color: '#ffffff',
                            padding: '10px',
                            textAlign: 'center',
                            fontWeight: 'bold',
                            fontSize: '12px'
                        }}>
                            RÉCAPITULATIF FINANCIER GLOBAL
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-around', padding: '15px', backgroundColor: '#f8f9fa', flexWrap: 'wrap' }}>
                            <div style={{ textAlign: 'center', minWidth: '120px' }}>
                                <div style={{ fontSize: '10px', color: '#6c757d', marginBottom: '5px' }}>TOTAL GÉNÉRAL</div>
                                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#2c3e50' }}>
                                    {totalGeneral.toLocaleString('fr-FR')} FCFA
                                </div>
                            </div>
                            <div style={{ textAlign: 'center', minWidth: '120px' }}>
                                <div style={{ fontSize: '10px', color: '#6c757d', marginBottom: '5px' }}>Part Assurance</div>
                                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#007bff' }}>
                                    {TotalPartAssurance.toLocaleString('fr-FR')} FCFA
                                </div>
                            </div>
                            <div style={{ textAlign: 'center', minWidth: '120px' }}>
                                <div style={{ fontSize: '10px', color: '#6c757d', marginBottom: '5px' }}>Part Patient</div>
                                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#28a745' }}>
                                    {TotalPartPatient.toLocaleString('fr-FR')} FCFA
                                </div>
                            </div>
                            <div style={{ textAlign: 'center', minWidth: '120px' }}>
                                <div style={{ fontSize: '10px', color: '#6c757d', marginBottom: '5px' }}>REMISES</div>
                                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#dc3545' }}>
                                    {totalRemises.toLocaleString('fr-FR')} FCFA
                                </div>
                            </div>
                            <div style={{ textAlign: 'center', minWidth: '120px' }}>
                                <div style={{ fontSize: '10px', color: '#6c757d', marginBottom: '5px' }}>Montant Payé</div>
                                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#6f42c1' }}>
                                    {montantPaye.toLocaleString('fr-FR')} FCFA
                                </div>
                            </div>
                        </div>
                        
                        {/* Détail des remises */}
                        {remises.length > 0 && (
                            <div style={{ 
                                borderTop: '1px solid #dee2e6', 
                                padding: '10px', 
                                backgroundColor: '#ffffff'
                            }}>
                                <div style={{ 
                                    fontSize: '11px', 
                                    fontWeight: 'bold', 
                                    marginBottom: '8px', 
                                    color: '#495057',
                                    textAlign: 'center'
                                }}>
                                    DÉTAIL DES REMISES
                                </div>
                                <div style={{ fontSize: '9px', color: '#6c757d' }}>
                                    {remises.map((remise, index) => (
                                        <div key={index} style={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            marginBottom: '2px',
                                            padding: '2px 0'
                                        }}>
                                            <span>{remise.motif}</span>
                                            <span style={{ color: '#dc3545', fontWeight: 'bold' }}>
                                                -{remise.reduction.toLocaleString('fr-FR')} FCFA
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Arrêté de facture */}
                    <div style={{ 
                        textAlign: 'center', 
                        marginBottom: '15px',
                        marginTop: '20px',
                        padding: '12px',
                        backgroundColor: '#e9ecef',
                        borderRadius: '8px',
                        border: '1px solid #dee2e6'
                    }}>
                        <div style={{ fontSize: '10px', color: '#6c757d', marginBottom: '5px' }}>ARRÊTÉ DE FACTURE PATIENT</div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#2c3e50', fontStyle: 'italic' }}>
                            La somme de: {NumberToLetter(montantPaye)} FRANCS CFA
                        </div>
                    </div>

                    {/* Infos d'impression */}
                    <div style={{ 
                        textAlign: 'center', 
                        fontSize: '12px', 
                        color: '#666666',
                        marginBottom: '5px'
                    }}>
                        Imprimé le: {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })} à {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} par {Utilisateur}
                    </div>
                </div>
            </>
        );
    }
);

PrintFactureRecapPatient.displayName = 'PrintFactureRecapPatient';

export default PrintFactureRecapPatient;
