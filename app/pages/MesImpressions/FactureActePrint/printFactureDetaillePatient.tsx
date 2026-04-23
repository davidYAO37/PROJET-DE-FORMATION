import React, { forwardRef, useState, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import { useEntreprise } from "@/hooks/useEntreprise";
import { generatePrintHeader, generatePrintFooter, createPrintWindow, createPrintWindowWithoutHeader, extractContentWithoutHeaderAndFooter } from "@/utils/printRecu";
import { NumberToLetter } from '@mandarvl/convertir-nombre-lettre';

interface PrintFactureDetaillePatientProps {
    consultation: any;
}

// Récupérer l'utilisateur connecté
const Utilisateur = typeof window !== 'undefined' ? localStorage.getItem("nom_utilisateur") : "";

const PrintFactureDetaillePatient = forwardRef<HTMLDivElement, PrintFactureDetaillePatientProps>(
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
            
            createPrintWindow('Facture Détaillée Patient', headerHTML, restContent, footerHTML);
        };

        const handlePrintWithoutHeader = () => {
            const printContent = document.getElementById('print-content');
            if (!printContent) return;
            
            const restContent = extractContentWithoutHeaderAndFooter(printContent.innerHTML);
            
            createPrintWindowWithoutHeader('Facture Détaillée Patient (sans entête)', restContent);
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
                        FACTURE DÉTAILLÉE PATIENT
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

                    {/* Sections conditionnelles selon les données disponibles */}
                    {consultation.consultation && (
                        <div style={{ marginBottom: '30px' }}>
                            <div style={{ 
                                fontWeight: 'bold', 
                                fontSize: '14px', 
                                marginBottom: '10px',
                                color: '#2c3e50',
                                borderBottom: '1px solid #000000',
                                paddingBottom: '5px'
                            }}>
                                1. CONSULTATION
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
                                            <th style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'left', fontSize: '11px' }}>Désignation</th>
                                            <th style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'right', fontSize: '11px' }}>Prix</th>
                                            <th style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'right', fontSize: '11px' }}>Taux(%)</th>
                                            <th style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'right', fontSize: '11px' }}>Part Assurance</th>
                                            <th style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'right', fontSize: '11px' }}>Part Patient</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td style={{ border: '1px solid #dee2e6', padding: '8px', fontSize: '10px' }}>
                                                {consultation.consultation?.designationC || 'Consultation générale'}
                                            </td>
                                            <td style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'right', fontSize: '10px' }}>
                                                {consultation.consultation?.Prix_consultation || '0'}
                                            </td>
                                            <td style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'right', fontSize: '10px' }}>
                                                {consultation.consultation?.tauxAssurance || '0'}%
                                            </td>
                                            <td style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'right', fontSize: '10px' }}>
                                                {consultation.consultation?.PartAssurance || '0'}
                                            </td>
                                            <td style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'right', fontSize: '10px' }}>
                                                {consultation.consultation?.montantapayer || '0'}
                                            </td>
                                        </tr>
                                    </tbody>
                                    <tfoot>
                                        <tr style={{ backgroundColor: '#f8f9fa', fontWeight: 'bold' }}>
                                            <td colSpan={4} style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'right', fontSize: '11px' }}>Total:</td>
                                            <td style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'right', fontSize: '11px' }}>
                                                {consultation.consultation?.Prix_consultation || '0'} FCFA
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}

                    {consultation.examens && consultation.examens.length > 0 && (
                        <div style={{ marginBottom: '30px' }}>
                            <div style={{ 
                                fontWeight: 'bold', 
                                fontSize: '14px', 
                                marginBottom: '10px',
                                color: '#2c3e50',
                                borderBottom: '1px solid #000000',
                                paddingBottom: '5px'
                            }}>
                                {consultation.consultation ? '2. EXAMENS' : '1. EXAMENS'}
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                {Object.entries(
                                    consultation.examens.reduce((acc: any, examen: any) => {
                                        const designation = examen.Désignationtypeacte || 'AUTRE';
                                        if (!acc[designation]) acc[designation] = [];
                                        acc[designation].push(examen);
                                        return acc;
                                    }, {})
                                ).map(([designation, lignes]) => (
                                    <div key={designation} style={{ marginBottom: '15px' }}>
                                        <div style={{ 
                                            fontWeight: 'bold',
                                            fontSize: '11px',
                                            marginBottom: '5px',
                                            borderBottom: '1px solid #000000',
                                            paddingBottom: '2px'
                                        }}>
                                            {designation.toUpperCase()}
                                        </div>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                                            <thead>
                                                <tr style={{ backgroundColor: '#f0f0f0' }}>
                                                    <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'left' }}>Date</th>
                                                    <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'left' }}>Prestation</th>
                                                    <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>Qte</th>
                                                    <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>Coef</th>
                                                    <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>Prix</th>
                                                    <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>Total</th>
                                                    <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>Taux</th>
                                                    <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>Part Ass.</th>
                                                    <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>Part Assuré</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(lignes as any[]).map((l: any, i: number) => (
                                                    <tr key={i}>
                                                        <td style={{ border: '1px solid #000', padding: '3px' }}>
                                                            {l.Datepaiementcaisse ? new Date(l.Datepaiementcaisse).toLocaleDateString('fr-FR') : 
                                                             l.DateConsultation ? new Date(l.DateConsultation).toLocaleDateString('fr-FR') : 'N/A'}
                                                        </td>
                                                        <td style={{ border: '1px solid #000', padding: '3px' }}>{l.Prestation}</td>
                                                        <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center' }}>{l.Qte}</td>
                                                        <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center' }}>{l.CoefficientActe}</td>
                                                        <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'right' }}>{Number(l.Prix || 0).toLocaleString('fr-FR')}</td>
                                                        <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'right' }}>{Number(l.PrixTotal || 0).toLocaleString('fr-FR')}</td>
                                                        <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center' }}>{l.Taux || 0}%</td>
                                                        <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'right' }}>{Number(l.PartAssurance || 0).toLocaleString('fr-FR')}</td>
                                                        <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'right' }}>{Number(l.Partassuré || 0).toLocaleString('fr-FR')}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr style={{ fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>
                                                    <td colSpan={5} style={{ textAlign: 'right', padding: '4px' }}>SOUS TOTAL {designation.toUpperCase()}:</td>
                                                    <td style={{ textAlign: 'right', padding: '4px' }}>
                                                        {(lignes as any[]).reduce((sum: number, l: any) => sum + (Number(l.PrixTotal) || 0), 0).toLocaleString('fr-FR')}
                                                    </td>
                                                    <td></td>
                                                    <td style={{ textAlign: 'right', padding: '4px' }}>
                                                        {(lignes as any[]).reduce((sum: number, l: any) => sum + (Number(l.PartAssurance) || 0), 0).toLocaleString('fr-FR')}
                                                    </td>
                                                    <td style={{ textAlign: 'right', padding: '4px' }}>
                                                        {(lignes as any[]).reduce((sum: number, l: any) => sum + (Number(l.Partassuré) || 0), 0).toLocaleString('fr-FR')}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {consultation.medicaments && consultation.medicaments.length > 0 && (
                        <div style={{ marginBottom: '30px' }}>
                            <div style={{ 
                                fontWeight: 'bold', 
                                fontSize: '14px', 
                                marginBottom: '10px',
                                color: '#2c3e50',
                                borderBottom: '1px solid #000000',
                                paddingBottom: '5px'
                            }}>
                                {consultation.consultation && consultation.examens && consultation.examens.length > 0 ? '3. PHARMACIE' : 
                                 consultation.consultation || (consultation.examens && consultation.examens.length > 0) ? '2. PHARMACIE' : '1. PHARMACIE'}
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                {Object.entries(
                                    consultation.medicaments.reduce((acc: any, medicament: any) => {
                                        const designation = medicament.Designation || 'AUTRE';
                                        if (!acc[designation]) acc[designation] = [];
                                        acc[designation].push(medicament);
                                        return acc;
                                    }, {})
                                ).map(([designation, lignes]) => (
                                    <div key={designation} style={{ marginBottom: '15px' }}>
                                        <div style={{ 
                                            fontWeight: 'bold',
                                            fontSize: '11px',
                                            marginBottom: '5px',
                                            borderBottom: '1px solid #000000',
                                            paddingBottom: '2px'
                                        }}>
                                            {designation.toUpperCase()}
                                        </div>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                                            <thead>
                                                <tr style={{ backgroundColor: '#f0f0f0' }}>
                                                    <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'left' }}>Date facturation</th>
                                                    <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'left' }}>Médicament</th>
                                                    <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>Qté</th>
                                                    <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>Prix unitaire</th>
                                                    <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>Montant Total</th>
                                                    <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>Taux(%)</th>
                                                    <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>Part Assurance</th>
                                                    <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>Part Patient</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(lignes as any[]).map((l: any, i: number) => (
                                                    <tr key={i}>
                                                        <td style={{ border: '1px solid #000', padding: '3px' }}>
                                                            {l.DateFacturation ? new Date(l.DateFacturation).toLocaleDateString('fr-FR') : 'N/A'}
                                                        </td>
                                                        <td style={{ border: '1px solid #000', padding: '3px' }}>{l.nomMedicament}</td>
                                                        <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center' }}>{l.QtéP}</td>
                                                        <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'right' }}>{Number(l.prixunitaire || 0).toLocaleString('fr-FR')}</td>
                                                        <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'right' }}>{Number(l.PrixTotal || 0).toLocaleString('fr-FR')}</td>
                                                        <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'right' }}>{Number(l.Taux || 0).toLocaleString('fr-FR')}</td>
                                                        <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'right' }}>{Number(l.PartAssurance || 0).toLocaleString('fr-FR')}</td>
                                                        <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'right' }}>{Number(l.Partassuré || 0).toLocaleString('fr-FR')}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr style={{ fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>
                                                    <td colSpan={4} style={{ textAlign: 'right', padding: '4px' }}>SOUS TOTAL {designation.toUpperCase()}:</td>
                                                    <td style={{ textAlign: 'right', padding: '4px' }}>
                                                        {(lignes as any[]).reduce((sum: number, l: any) => sum + (Number(l.PrixTotal) || 0), 0).toLocaleString('fr-FR')}
                                                    </td>
                                                    <td style={{ textAlign: 'right', padding: '4px' }}>-</td>
                                                    <td style={{ textAlign: 'right', padding: '4px' }}>
                                                        {(lignes as any[]).reduce((sum: number, l: any) => sum + (Number(l.PartAssurance) || 0), 0).toLocaleString('fr-FR')}
                                                    </td>
                                                    <td style={{ textAlign: 'right', padding: '4px' }}>
                                                        {(lignes as any[]).reduce((sum: number, l: any) => sum + (Number(l.Partassuré) || 0), 0).toLocaleString('fr-FR')}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

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
                        <div style={{ fontSize: '10px', color: '#6c757d', marginBottom: '5px' }}>ARRÊTÉ DE FACTURE DÉTAILLÉE PATIENT</div>
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

PrintFactureDetaillePatient.displayName = 'PrintFactureDetaillePatient';

export default PrintFactureDetaillePatient;
