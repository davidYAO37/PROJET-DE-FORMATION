import React, { forwardRef } from 'react';
import { Button } from 'react-bootstrap';
import { useEntreprise } from "@/hooks/useEntreprise";
import { generatePrintHeader, generatePrintFooter, createPrintWindow, createPrintWindowWithoutHeader, extractContentWithoutHeaderAndFooter } from "@/utils/printRecu";
import { NumberToLetter } from '@mandarvl/convertir-nombre-lettre';

interface Ligne {
    date: string;
    medecin: string;
    designationExamen: string; // Désignation de l'examen pour le titre
    prestation: string; // Prestation de la ligne de prestation
    qte: number;
    coef: number;
    prix: number;
    total: number;
    taux: number;
    partAssurance: number;
    partAssure: number;
}

interface PrintFactureExamenAssuranceProps {
    consultation: any;
}

// Fonction utilitaire pour formater les nombres
const formatNumber = (num: number | undefined | null): string => {
    if (num === undefined || num === null) return '0';
    return Number(num).toLocaleString('fr-FR');
};

// Fonction utilitaire pour calculer la somme d'un champ
const sum = (data: any[], field: string): number => {
    return data.reduce((acc: number, item: any) => acc + (Number(item[field]) || 0), 0);
};

// Composant TableSection
const TableSection = ({ title, data }: { title: string; data: Ligne[] }) => {
    const sousTotalTotal = sum(data, 'total');
    const sousTotalAssurance = sum(data, 'partAssurance');
    const sousTotalAssure = sum(data, 'partAssure');

    return (
        <div className="mt-4">
            <h3 className="font-bold">{title}</h3>
            <table className="w-full border border-black mt-2">
                <thead>
                    <tr className="border">
                        <th>Date</th>
                        <th>Médecin</th>
                        <th>Prestation</th>
                        <th>Qte</th>
                        <th>Coef</th>
                        <th>Prix</th>
                        <th>Total</th>
                        <th>Taux</th>
                        <th>Part Assurance</th>
                        <th>Part Assuré</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((l, i) => (
                        <tr key={i} className="border text-center">
                            <td>{l.date}</td>
                            <td>{l.medecin}</td>
                            <td>{l.prestation}</td>
                            <td>{l.qte}</td>
                            <td>{l.coef}</td>
                            <td>{formatNumber(l.prix)}</td>
                            <td>{formatNumber(l.total)}</td>
                            <td>{l.taux}</td>
                            <td>{formatNumber(l.partAssurance)}</td>
                            <td>{formatNumber(l.partAssure)}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr style={{ fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>
                        <td colSpan={6} style={{ textAlign: 'right', padding: '8px' }}>SOUS TOTAL {title.toUpperCase()}:</td>
                        <td style={{ textAlign: 'right', padding: '8px' }}>{formatNumber(sousTotalTotal)}</td>
                        <td style={{ textAlign: 'right', padding: '8px' }}>{formatNumber(sousTotalAssurance)}</td>
                        <td style={{ textAlign: 'right', padding: '8px' }}>{formatNumber(sousTotalAssure)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
};

const PrintFactureExamenAssurance = forwardRef<HTMLDivElement, PrintFactureExamenAssuranceProps>(
    ({ consultation }, ref) => {
        const { entreprise } = useEntreprise();
        const { patient, consultation: consultationData, examens } = consultation || {};

        const handlePrint = () => {
            const printContent = document.getElementById('print-content');
            if (!printContent) return;
            
            const headerHTML = generatePrintHeader(entreprise);
            const footerHTML = generatePrintFooter(entreprise);
            const restContent = extractContentWithoutHeaderAndFooter(printContent.innerHTML);
            
            createPrintWindow('Facture Examen Assurance', headerHTML, restContent, footerHTML);
        };

        const handlePrintWithoutHeader = () => {
            const printContent = document.getElementById('print-content');
            if (!printContent) return;
            
            const restContent = extractContentWithoutHeaderAndFooter(printContent.innerHTML);
            
            createPrintWindowWithoutHeader('Facture Examen Assurance (sans entête)', restContent);
        };

        if (!consultation) return null;

        // Transformer les données pour le composant TableSection
        const transformExamensToLignes = (examens: any[]): Ligne[] => {
            return examens
                .filter(e => e.CODEcONSULTATION === consultationData?.Code_consultation && e.StatuPrescriptionMedecin_LI === 3)
                .sort((a, b) => (a.Désignationtypeacte || '').localeCompare(b.Désignationtypeacte || ''))
                .map(examen => ({
                    date: examen.Datepaiementcaisse ? 
                        new Date(examen.Datepaiementcaisse).toLocaleDateString('fr-FR', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric' 
                        }) : new Date().toLocaleDateString('fr-FR', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric' 
                        }),
                    medecin: examen.NomMed || 'N/A',
                    designationExamen: examen.Désignationtypeacte || 'N/A', // Désignation de l'examen
                    prestation: examen.Prestation || 'N/A', // Prestation de la ligne de prestation
                    qte: examen.Qte || 1,
                    coef: examen.CoefficientActe || 1,
                    prix: examen.Prix || 0,
                    total: examen.PrixTotal || 0,
                    taux: examen.tauxAssurance || 0,
                    partAssurance: examen.PartAssurance || 0,
                    partAssure: examen.Partassuré || 0
                }));
        };

        // Transformer toutes les données d'abord
        const toutesLesLignes = transformExamensToLignes(examens || []);
        
        // Grouper les lignes par désignation d'examen
        const lignesParExamen = toutesLesLignes.reduce((acc: { [key: string]: Ligne[] }, ligne) => {
            const designation = ligne.designationExamen; // La désignation de l'examen
            if (!acc[designation]) {
                acc[designation] = [];
            }
            acc[designation].push(ligne);
            return acc;
        }, {});

        const totalGeneral = sum(toutesLesLignes, 'total');
        const montantAssurance = sum(toutesLesLignes, 'partAssurance');
        const montantPatient = sum(toutesLesLignes, 'partAssure');

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
                                <div><strong>Nom & Prénoms:</strong> {patient?.Nom ? `${patient.Nom} ${patient.Prenom || ''}` : 'N/A'}</div>
                                <div><strong>Contact:</strong> {patient?.Contact || 'N/A'}</div>
                                <div><strong>N° Dossier:</strong> {consultationData?.Code_consultation || 'N/A'}</div>
                                <div><strong>Date Naissance:</strong> {patient?.DateNaissance ? 
                                    new Date(patient.DateNaissance).toLocaleDateString('fr-FR', { 
                                        day: '2-digit', 
                                        month: '2-digit', 
                                        year: 'numeric' 
                                    }) : 'N/A'
                                }</div>
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
                                <div><strong>Assurance:</strong> {consultationData?.ASSURANCE || 'NON ASSURE'}</div>
                                <div><strong>N° Carte:</strong> {consultationData?.Matricule || 'N/A'}</div>
                                <div><strong>Bon N°:</strong> {consultationData?.NumBon || 'N/A'}
                                <strong>Taux:</strong> {consultationData?.TauxAssurance || 'N/A'}%</div>
                                <div><strong>Souscripteur:</strong> {consultationData?.Souscripteur || 'N/A'}</div>
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
                                <div><strong>Date Consultation:</strong> {consultationData?.DateConsultation ? 
                                    new Date(consultationData.DateConsultation).toLocaleDateString('fr-FR', { 
                                        day: '2-digit', 
                                        month: '2-digit', 
                                        year: 'numeric' 
                                    }) : 'N/A'
                                }</div>
                                <div><strong>Facturé par:</strong>  {consultationData?.Caissiere || 'N/A'}</div>
                                <div><strong>Mode Paiement:</strong>  {consultationData?.ModePaiement || 'N/A'}</div>
                               
                            </div>
                        </div>
                    </div>
                                    
                    {/* Titre des examens */}
                    <div style={{ 
                        textAlign: 'center', 
                        marginBottom: '10px',
                        fontWeight: 'bold',
                        fontSize: '18px',
                        textDecoration: 'underline'
                    }}>
                        DETAIL DES ACTES MEDICAUX N°: {consultationData?.Code_consultation || 'N/A'}
                    </div>

                    {/* Tableau des examens */}
                    <div style={{ marginBottom: '15px' }}>
                        {Object.entries(lignesParExamen).map(([designation, lignes]) => (
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
                                        {lignes.map((l, i) => (
                                            <tr key={i}>
                                                <td style={{ border: '1px solid #000', padding: '3px' }}>{l.date}</td>
                                                <td style={{ border: '1px solid #000', padding: '3px' }}>{l.prestation}</td>
                                                <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center' }}>{l.qte}</td>
                                                <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center' }}>{l.coef}</td>
                                                <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'right' }}>{formatNumber(l.prix)}</td>
                                                <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'right' }}>{formatNumber(l.total)}</td>
                                                <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center' }}>{l.taux}</td>
                                                <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'right' }}>{formatNumber(l.partAssurance)}</td>
                                                <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'right' }}>{formatNumber(l.partAssure)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr style={{ fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>
                                            <td colSpan={5} style={{ textAlign: 'right', padding: '4px' }}>SOUS TOTAL {designation.toUpperCase()}:</td>
                                            <td style={{ textAlign: 'right', padding: '4px' }}>{formatNumber(sum(lignes, 'total'))}</td>
                                            <td></td>
                                            <td style={{ textAlign: 'right', padding: '4px' }}>{formatNumber(sum(lignes, 'partAssurance'))}</td>
                                            <td style={{ textAlign: 'right', padding: '4px' }}>{formatNumber(sum(lignes, 'partAssure'))}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        ))}
                    </div>

                    {/* Récapitulatif financier - Design professionnel */}
                    <div style={{ 
                        marginTop: '20px',
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
                            RÉCAPITULATIF FINANCIER
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-around', padding: '15px', backgroundColor: '#f8f9fa' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '10px', color: '#6c757d', marginBottom: '5px' }}>TOTAL GÉNÉRAL</div>
                                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#2c3e50' }}>
                                    {totalGeneral.toLocaleString('fr-FR')} FCFA
                                </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '10px', color: '#6c757d', marginBottom: '5px' }}>PART ASSURANCE</div>
                                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#28a745' }}>
                                    {montantAssurance.toLocaleString('fr-FR')} FCFA
                                </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '10px', color: '#6c757d', marginBottom: '5px' }}>PART PATIENT</div>
                                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#dc3545' }}>
                                    {montantPatient.toLocaleString('fr-FR')} FCFA
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Arrêté de facture */}
                    <div style={{ 
                        textAlign: 'center', 
                        marginBottom: '15px',
                        marginTop: '15px',
                        padding: '12px',
                        backgroundColor: '#e9ecef',
                        borderRadius: '8px',
                        border: '1px solid #dee2e6'
                    }}>
                        <div style={{ fontSize: '10px', color: '#6c757d', marginBottom: '5px' }}>ARRÊTÉ DE FACTURE ASSURANCE</div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#2c3e50', fontStyle: 'italic' }}>
                            La somme de: {NumberToLetter(montantAssurance)} FRANCS CFA
                        </div>
                    </div>

                    {/* Infos d'impression */}
                    <div style={{ 
                        textAlign: 'center', 
                        fontSize: '12px', 
                        color: '#666666',
                        marginBottom: '5px'
                    }}>
                        Imprimé le: {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })} à {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </div>

                </div>
            </>
        );
    }
);




PrintFactureExamenAssurance.displayName = 'PrintFactureExamenAssurance';

export default PrintFactureExamenAssurance;