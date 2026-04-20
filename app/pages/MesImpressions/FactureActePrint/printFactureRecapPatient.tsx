import React, { forwardRef } from 'react';

interface PrintFactureRecapPatientProps {
    consultation: any;
}

const PrintFactureRecapPatient = forwardRef<HTMLDivElement, PrintFactureRecapPatientProps>(
    ({ consultation }, ref) => {
        return (
            <div ref={ref} id="print-content" style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <h2>Facture Recap - Patient</h2>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div>
                        <p><strong>Patient:</strong> {consultation?.Nom || 'N/A'}</p>
                        <p><strong>Contact:</strong> {consultation?.Contact || 'N/A'}</p>
                        <p><strong>Assurance:</strong> {consultation?.ASSURANCE || 'NON ASSURE'}</p>
                    </div>
                    <div>
                        <p><strong>Code:</strong> {consultation?.Code_consultation || 'N/A'}</p>
                        <p><strong>Date:</strong> {new Date().toLocaleDateString('fr-FR')}</p>
                    </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f8f9fa' }}>
                            <th style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'left' }}>Désignation</th>
                            <th style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'right' }}>Quantité</th>
                            <th style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'right' }}>Prix Unit.</th>
                            <th style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'right' }}>Montant</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ border: '1px solid #dee2e6', padding: '8px' }}>Récapitulatif des services</td>
                            <td style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'right' }}>1</td>
                            <td style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'right' }}>
                                {consultation?.montantapayer || '0'}
                            </td>
                            <td style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'right' }}>
                                {consultation?.montantapayer || '0'}
                            </td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr style={{ backgroundColor: '#f8f9fa', fontWeight: 'bold' }}>
                            <td colSpan={3} style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'right' }}>Total:</td>
                            <td style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'right' }}>
                                {consultation?.montantapayer || '0'} FCFA
                            </td>
                        </tr>
                    </tfoot>
                </table>

                <div style={{ marginTop: '30px', textAlign: 'center' }}>
                    <p>Merci pour votre confiance</p>
                </div>
            </div>
        );
    }
);

PrintFactureRecapPatient.displayName = 'PrintFactureRecapPatient';

export default PrintFactureRecapPatient;