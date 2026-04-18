import React, { useState, useRef } from 'react';
import { Modal, Form } from 'react-bootstrap';
import { createPrintWindow, generatePrintHeader, generatePrintFooter } from '@/utils/printRecu';
import styles from './MenuImpressionFactureModal.module.css';
import PrintFactureCosultatAssurance from '../../MesImpressions/FactureActePrint/printFactureCosultatAssurance';
import PrintFactureConsultationPatient from '../../MesImpressions/FactureActePrint/printFactureConsultationPatient';

interface MenuImpressionFactureModalProps {
    show: boolean;
    onHide: () => void;
}

const MenuImpressionFactureModal: React.FC<MenuImpressionFactureModalProps> = ({ show, onHide }) => {
    const [codeVisiteur, setCodeVisiteur] = useState('');
    const [consultationData, setConsultationData] = useState<any>(null);
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [showPrintAssuranceModal, setShowPrintAssuranceModal] = useState(false);
    const [showPrintPatientModal, setShowPrintPatientModal] = useState(false);
    const [consultationAssuranceData, setConsultationAssuranceData] = useState<any>(null);
    const [consultationPatientData, setConsultationPatientData] = useState<any>(null);
    const printRef = useRef<HTMLDivElement>(null);
    const printAssuranceRef = useRef<HTMLDivElement>(null);
    const printPatientRef = useRef<HTMLDivElement>(null);

    const printFactureRecapAssurance = () => {
        const headerHTML = generatePrintHeader(null);
        const footerHTML = generatePrintFooter(null);
        const contentHTML = `
            <div class="print-area">
                <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:14px; margin-bottom:20px; font-size:13px;">
                    <div style="flex:1; min-width:220px; line-height:1.6;">
                        <div><strong>Patient</strong> ZIEHI EPSE SIAN MESSIEKOI</div>
                        <div><strong>Assurance</strong> NON ASSURE</div>
                        <div><strong>NCC</strong></div>
                        <div><strong>Médecin Prescripteur</strong> DR BROUH YAPO LYDIE KORE</div>
                        <div><strong>Facturée par</strong> YAO</div>
                        <div><strong>Code Visiteur</strong> ${codeVisiteur || 'N/A'}</div>
                    </div>
                    <div style="flex:1; min-width:220px; line-height:1.6; font-size:13px; text-align:right;">
                        <div><strong>Contact</strong> 0747262289</div>
                        <div><strong>N° Dossier</strong> 28973</div>
                        <div><strong>N° Bon</strong></div>
                        <div><strong>Matricule</strong></div>
                        <div><strong>Souscripteur</strong></div>
                        <div><strong>Admis(e) le</strong> 10/12/2025</div>
                    </div>
                </div>
                <div style="display:flex; justify-content:center; align-items:center; gap:12px; margin:24px 0;">
                    <div style="background:#e2e8f0; padding:12px 20px; border-radius:12px; font-size:0.95rem; font-weight:700; letter-spacing:1px;">FACTURE N°</div>
                    <div style="font-size:2rem; font-weight:800; text-decoration:underline;">CAD1910</div>
                </div>
                <table style="width:100%; border-collapse:collapse; margin-top:16px; font-size:13px;">
                    <thead>
                        <tr>
                            <th style="border:1px solid #000; padding:10px; background:#f1f5f9; text-align:left;">Actes</th>
                            <th style="border:1px solid #000; padding:10px; background:#f1f5f9;">Montant Total</th>
                            <th style="border:1px solid #000; padding:10px; background:#f1f5f9;">Part assurance</th>
                            <th style="border:1px solid #000; padding:10px; background:#f1f5f9;">Part Patient</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="border:1px solid #000; padding:10px; text-align:left;">Consultation</td>
                            <td style="border:1px solid #000; padding:10px; text-align:right;">17 500</td>
                            <td style="border:1px solid #000; padding:10px; text-align:right;">0</td>
                            <td style="border:1px solid #000; padding:10px; text-align:right;">17 500</td>
                        </tr>
                        <tr>
                            <td style="border:1px solid #000; padding:10px; text-align:left;">Pharmacie</td>
                            <td style="border:1px solid #000; padding:10px; text-align:right;">25 100</td>
                            <td style="border:1px solid #000; padding:10px; text-align:right;">0</td>
                            <td style="border:1px solid #000; padding:10px; text-align:right;">25 100</td>
                        </tr>
                        <tr>
                            <td style="border:1px solid #000; padding:10px; text-align:left;">ACTE DE RADIOLOGIE</td>
                            <td style="border:1px solid #000; padding:10px; text-align:right;">70 000</td>
                            <td style="border:1px solid #000; padding:10px; text-align:right;">0</td>
                            <td style="border:1px solid #000; padding:10px; text-align:right;">70 000</td>
                        </tr>
                        <tr>
                            <td style="border:1px solid #000; padding:10px; text-align:left;">EXAMEN BIOLOGIQUE</td>
                            <td style="border:1px solid #000; padding:10px; text-align:right;">61 250</td>
                            <td style="border:1px solid #000; padding:10px; text-align:right;">0</td>
                            <td style="border:1px solid #000; padding:10px; text-align:right;">61 250</td>
                        </tr>
                        <tr>
                            <td style="border:1px solid #000; padding:10px; text-align:left; font-weight:700;">Total</td>
                            <td style="border:1px solid #000; padding:10px; text-align:right; font-weight:700;">173 850</td>
                            <td style="border:1px solid #000; padding:10px; text-align:right; font-weight:700;">0</td>
                            <td style="border:1px solid #000; padding:10px; text-align:right; font-weight:700;">173 850</td>
                        </tr>
                    </tbody>
                </table>
                <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:12px; margin-top:18px; font-size:13px;">
                    <div><strong>Total Général</strong> 173 850</div>
                    <div style="display:flex; gap:16px; align-items:center; font-size:13px;">
                        <div><strong>Total Remise</strong> 0</div>
                        <div style="background:#f1f5f9; padding:10px 16px; border-radius:10px; font-weight:700;">173 850</div>
                    </div>
                </div>
                <div style="margin-top:18px; font-size:14px; line-height:1.6;">
                    <strong>Arrêté la facture à la somme de :</strong> Cent soixante-treize mille huit cent cinquante FRANCS CFA
                </div>
                <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-top:28px; font-size:12px; color:#4a5568;">
                    <div>Imprimé par YAO</div>
                    <div>Le 04/04/2026 à 08:31</div>
                </div>
            </div>
        `;
        createPrintWindow('Facture Recap Assurance', headerHTML, contentHTML, footerHTML);
    };

    const printFactureCosultatAssurance = async () => {
        if (!codeVisiteur || codeVisiteur.trim() === '') {
            alert('Veuillez saisir le code visiteur à imprimer svp');
            return;
        }

        try {
            // Appeler l'API pour récupérer les données de consultation
            const response = await fetch(`/api/consultationFacture/factureCosultatAssurance?ParamCode_consultation=${codeVisiteur}`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    alert('Consultation non trouvée pour ce code visiteur');
                } else {
                    alert('Erreur lors de la récupération des données');
                }
                return;
            }

            const consultationData = await response.json();
            setConsultationAssuranceData(consultationData);
            setShowPrintAssuranceModal(true);
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de la récupération des données');
        }
    };

    const printFactureConsultationPatient = async () => {
        if (!codeVisiteur || codeVisiteur.trim() === '') {
            alert('Veuillez saisir le code visiteur à imprimer svp');
            return;
        }

        try {
            // Appeler l'API pour récupérer les données de consultation
            const response = await fetch(`/api/consultationFacture/factureCosultatAssurance?ParamCode_consultation=${codeVisiteur}`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    alert('Consultation non trouvée pour ce code visiteur');
                } else {
                    alert('Erreur lors de la récupération des données');
                }
                return;
            }

            const consultationData = await response.json();
            setConsultationPatientData(consultationData);
            setShowPrintPatientModal(true);
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de la récupération des données');
        }
    };

    const handlePrint = (type: string, by: string) => {
        if (type === 'recap' && by === 'assurance') {
            printFactureRecapAssurance();
        } else if (type === 'consultation' && by === 'assurance') {
            printFactureCosultatAssurance();
        } else if (type === 'consultation' && by === 'patient') {
            printFactureConsultationPatient();
        } else {
            console.log(`Printing ${type} by ${by}`);
            return;
        }
    };

    return (
        <>
            <Modal show={show} onHide={onHide} size="lg" centered className={styles.professionalModal}>
                <Modal.Header closeButton className={styles.modalHeader}>
                    <div className={styles.headerContent}>
                        <i className="bi bi-printer-fill" style={{ fontSize: '1.75rem', marginRight: '12px' }}></i>
                        <Modal.Title className={styles.modalTitle}>Menu Impression Facture</Modal.Title>
                    </div>
                </Modal.Header>
                <Modal.Body className={styles.modalBody}>
                    <Form.Group className={styles.formGroup}>
                        <Form.Label className={styles.formLabel}>
                            <i className="bi bi-key-fill me-2"></i> Code Visiteur
                        </Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Insérez le code visiteur ici"
                            value={codeVisiteur}
                            onChange={(e) => setCodeVisiteur(e.target.value)}
                            className={styles.formControl}
                        />
                    </Form.Group>

                    <div className={styles.separator}></div>

                    <div className={styles.menuContainer}>
                        {/* Éditer la Facture Détaillée */}
                        <div className={styles.menuSection}>
                            <div className="btn-group dropend w-100" role="group">
                                <button
                                    type="button"
                                    className={`btn btn-outline-primary ${styles.menuButton}`}
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                >
                                    <i className="bi bi-file-earmark-text"></i>
                                    <span className={styles.buttonLabel}>Éditer Facture Détaillée</span>
                                    <i className="bi bi-chevron-right ms-auto"></i>
                                </button>
                                <ul className={`dropdown-menu dropdown-menu-end ${styles.dropdownMenu}`}>
                                    <li>
                                        <a
                                            className={`dropdown-item ${styles.dropdownItem}`}
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handlePrint('detailed', 'patient');
                                            }}
                                        >
                                            <i className="bi bi-person-circle"></i>
                                            <span>Par patient</span>
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            className={`dropdown-item ${styles.dropdownItem}`}
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handlePrint('detailed', 'assurance');
                                            }}
                                        >
                                            <i className="bi bi-shield-check"></i>
                                            <span>Par Assurance</span>
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Éditer la Facture Recap */}
                        <div className={styles.menuSection}>
                            <div className="btn-group dropend w-100" role="group">
                                <button
                                    type="button"
                                    className={`btn btn-outline-primary ${styles.menuButton}`}
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                >
                                    <i className="bi bi-file-earmark-pdf"></i>
                                    <span className={styles.buttonLabel}>Facture Recap</span>
                                    <i className="bi bi-chevron-right ms-auto"></i>
                                </button>
                                <ul className={`dropdown-menu dropdown-menu-end ${styles.dropdownMenu}`}>
                                    <li>
                                        <a
                                            className={`dropdown-item ${styles.dropdownItem}`}
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handlePrint('recap', 'patient');
                                            }}
                                        >
                                            <i className="bi bi-person-circle"></i>
                                            <span>Par patient</span>
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            className={`dropdown-item ${styles.dropdownItem}`}
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handlePrint('recap', 'assurance');
                                            }}
                                        >
                                            <i className="bi bi-shield-check"></i>
                                            <span>Par Assurance</span>
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Détail Consultation */}
                        <div className={styles.menuSection}>
                            <div className="btn-group dropend w-100" role="group">
                                <button
                                    type="button"
                                    className={`btn btn-outline-primary ${styles.menuButton}`}
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                >
                                    <i className="bi bi-chat-dots"></i>
                                    <span className={styles.buttonLabel}>Détail Consultation</span>
                                    <i className="bi bi-chevron-right ms-auto"></i>
                                </button>
                                <ul className={`dropdown-menu dropdown-menu-end ${styles.dropdownMenu}`}>
                                    <li>
                                        <a
                                            className={`dropdown-item ${styles.dropdownItem}`}
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handlePrint('consultation', 'patient');
                                            }}
                                        >
                                            <i className="bi bi-person-circle"></i>
                                            <span>Par patient</span>
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            className={`dropdown-item ${styles.dropdownItem}`}
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handlePrint('consultation', 'assurance');
                                            }}
                                        >
                                            <i className="bi bi-shield-check"></i>
                                            <span>Par Assurance</span>
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Détail Examen et Autres Actes */}
                        <div className={styles.menuSection}>
                            <div className="btn-group dropend w-100" role="group">
                                <button
                                    type="button"
                                    className={`btn btn-outline-primary ${styles.menuButton}`}
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                >
                                    <i className="bi bi-microscope"></i>
                                    <span className={styles.buttonLabel}>Examen et Autres Actes</span>
                                    <i className="bi bi-chevron-right ms-auto"></i>
                                </button>
                                <ul className={`dropdown-menu dropdown-menu-end ${styles.dropdownMenu}`}>
                                    <li>
                                        <a
                                            className={`dropdown-item ${styles.dropdownItem}`}
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handlePrint('exam', 'patient');
                                            }}
                                        >
                                            <i className="bi bi-person-circle"></i>
                                            <span>Par patient</span>
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            className={`dropdown-item ${styles.dropdownItem}`}
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handlePrint('exam', 'assurance');
                                            }}
                                        >
                                            <i className="bi bi-shield-check"></i>
                                            <span>Par Assurance</span>
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Détail Pharmacie */}
                        <div className={styles.menuSection}>
                            <div className="btn-group dropend w-100" role="group">
                                <button
                                    type="button"
                                    className={`btn btn-outline-primary ${styles.menuButton}`}
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                >
                                    <i className="bi bi-capsule"></i>
                                    <span className={styles.buttonLabel}>Détail Pharmacie</span>
                                    <i className="bi bi-chevron-right ms-auto"></i>
                                </button>
                                <ul className={`dropdown-menu dropdown-menu-end ${styles.dropdownMenu}`}>
                                    <li>
                                        <a
                                            className={`dropdown-item ${styles.dropdownItem}`}
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handlePrint('pharmacy', 'patient');
                                            }}
                                        >
                                            <i className="bi bi-person-circle"></i>
                                            <span>Par patient</span>
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            className={`dropdown-item ${styles.dropdownItem}`}
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handlePrint('pharmacy', 'assurance');
                                            }}
                                        >
                                            <i className="bi bi-shield-check"></i>
                                            <span>Par Assurance</span>
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>

            {/* Modal pour l'impression de FactureCosultatAssurance */}
            <Modal 
                show={showPrintModal} 
                onHide={() => setShowPrintModal(false)} 
                size="xl" 
                centered 
                className={styles.professionalModal}
            >
                <Modal.Header closeButton className={styles.modalHeader}>
                    <div className={styles.headerContent}>
                        <i className="bi bi-printer-fill" style={{ fontSize: '1.75rem', marginRight: '12px' }}></i>
                        <Modal.Title className={styles.modalTitle}>Facture Consultation Assurance</Modal.Title>
                    </div>
                </Modal.Header>
                <Modal.Body className={styles.modalBody}>
                    {consultationData && (
                        <div style={{ display: 'none' }}>
                            <PrintFactureCosultatAssurance
                                ref={printRef} 
                                consultation={consultationData} 
                            />
                        </div>
                    )}
                    <div className="text-center">
                        <p>Voulez-vous imprimer cette facture consultation assurance ?</p>
                        <div className="d-flex justify-content-center gap-3">
                            <button 
                                className="btn btn-primary"
                                onClick={() => {
                                    if (printRef.current) {
                                        const printContent = printRef.current.innerHTML;
                                        const printWindow = window.open('', '_blank');
                                        if (printWindow) {
                                            printWindow.document.write(`
                                                <html>
                                                    <head>
                                                        <title>Facture Consultation Assurance</title>
                                                        <style>
                                                            body { font-family: Arial, sans-serif; margin: 20px; }
                                                            @media print { body { margin: 0; } }
                                                        </style>
                                                    </head>
                                                    <body>
                                                        ${printContent}
                                                    </body>
                                                </html>
                                            `);
                                            printWindow.document.close();
                                            printWindow.print();
                                        }
                                    }
                                    setShowPrintModal(false);
                                }}
                            >
                                <i className="bi bi-printer me-2"></i>
                                Imprimer
                            </button>
                            <button 
                                className="btn btn-secondary"
                                onClick={() => setShowPrintModal(false)}
                            >
                                <i className="bi bi-x-circle me-2"></i>
                                Annuler
                            </button>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>

            {/* Modal pour l'impression de FactureCosultatAssurance */}
            <Modal 
                show={showPrintAssuranceModal} 
                onHide={() => setShowPrintAssuranceModal(false)} 
                size="xl" 
                centered 
                className={styles.professionalModal}
            >
                <Modal.Header closeButton className={styles.modalHeader}>
                    <div className={styles.headerContent}>
                        <i className="bi bi-printer-fill" style={{ fontSize: '1.75rem', marginRight: '12px' }}></i>
                        <Modal.Title className={styles.modalTitle}>Facture Consultation Assurance</Modal.Title>
                    </div>
                </Modal.Header>
                <Modal.Body className={styles.modalBody}>
                    {consultationAssuranceData && (
                        <PrintFactureCosultatAssurance
                            ref={printAssuranceRef} 
                            consultation={consultationAssuranceData} 
                        />
                    )}
                    <div className="text-center mt-3">
                        <button 
                            className="btn btn-primary me-2"
                            onClick={() => {
                                if (printAssuranceRef.current) {
                                    const printContent = printAssuranceRef.current.querySelector('#print-content');
                                    if (printContent) {
                                        const printWindow = window.open('', '_blank');
                                        if (printWindow) {
                                            printWindow.document.write(`
                                                <html>
                                                    <head>
                                                        <title>Facture Consultation Assurance</title>
                                                        <style>
                                                            body { font-family: Arial, sans-serif; margin: 20px; }
                                                            @media print { body { margin: 0; } }
                                                        </style>
                                                    </head>
                                                    <body>
                                                        ${printContent.innerHTML}
                                                    </body>
                                                </html>
                                            `);
                                            printWindow.document.close();
                                            printWindow.print();
                                        }
                                    }
                                    }
                                    setShowPrintAssuranceModal(false);
                                }}
                            >
                                <i className="bi bi-printer me-2"></i>
                                Imprimer
                            </button>
                            <button 
                                className="btn btn-secondary"
                                onClick={() => setShowPrintAssuranceModal(false)}
                            >
                                <i className="bi bi-x-circle me-2"></i>
                                Fermer
                            </button>
                        </div>
                </Modal.Body>
            </Modal>

            {/* Modal pour l'impression de FactureConsultationPatient */}
            <Modal 
                show={showPrintPatientModal} 
                onHide={() => setShowPrintPatientModal(false)} 
                size="xl" 
                centered 
                className={styles.professionalModal}
            >
                <Modal.Header closeButton className={styles.modalHeader}>
                    <div className={styles.headerContent}>
                        <i className="bi bi-printer-fill" style={{ fontSize: '1.75rem', marginRight: '12px' }}></i>
                        <Modal.Title className={styles.modalTitle}>Facture Consultation Patient</Modal.Title>
                    </div>
                </Modal.Header>
                <Modal.Body className={styles.modalBody}>
                    {consultationPatientData && (
                        <PrintFactureConsultationPatient
                            ref={printPatientRef} 
                            consultation={consultationPatientData} 
                        />
                    )}
                    <div className="text-center mt-3">
                        <button 
                            className="btn btn-primary me-2"
                            onClick={() => {
                                if (printPatientRef.current) {
                                    const printContent = printPatientRef.current.querySelector('#print-content');
                                    if (printContent) {
                                        const printWindow = window.open('', '_blank');
                                        if (printWindow) {
                                            printWindow.document.write(`
                                                <html>
                                                    <head>
                                                        <title>Facture Consultation Patient</title>
                                                        <style>
                                                            body { font-family: Arial, sans-serif; margin: 20px; }
                                                            @media print { body { margin: 0; } }
                                                        </style>
                                                    </head>
                                                    <body>
                                                        ${printContent.innerHTML}
                                                    </body>
                                                </html>
                                            `);
                                            printWindow.document.close();
                                            printWindow.print();
                                        }
                                    }
                                    }
                                    setShowPrintPatientModal(false);
                                }}
                            >
                                <i className="bi bi-printer me-2"></i>
                                Imprimer
                            </button>
                            <button 
                                className="btn btn-secondary"
                                onClick={() => setShowPrintPatientModal(false)}
                            >
                                <i className="bi bi-x-circle me-2"></i>
                                Fermer
                            </button>
                        </div>
                </Modal.Body>
            </Modal>
        </>
    );
};

export default MenuImpressionFactureModal;
