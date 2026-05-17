"use client";

import { useState, useEffect, useRef } from "react";
import { Form, Card, Alert } from "react-bootstrap";

// Types pour les données
interface Patient {
    _id?: string;
    Nom?: string;
    Prenoms?: string;
    sexe?: string;
    Age_partient?: string;
    Date_naisse?: string;
    Situationgeo?: string;
}

interface Consultation {
    _id?: string;
    CodePrestation?: string;
    Code_dossier?: string;
    StatutC?: boolean;
    StatutPrescriptionMedecin?: number;
    ticket_moderateur?: number;
    Temperature?: string;
    Tension?: string;
    TailleCons?: string;
    Glycemie?: string;
    Poids?: string;
    DatePres?: string;
    IDMEDECIN?: string;
    tauxAssurance?: number;
    assurance?: string;
    IDASSURANCE?: string;
    Medecin?: string;
    Date_consulation?: Date;
}

interface Prescription {
    _id?: string;
    Modepaiement?: string;
    Partassuré?: number;
}

interface Props {
    onPatientChange?: (patient: Patient) => void;
    onConsultationChange?: (consultation: Consultation) => void;
    onPrescriptionChange?: (prescription: Prescription) => void;
    onCodePrestationChange?: (code: string) => void;
    onPatientPrescriptionsChange?: (prescriptions: any[]) => void; // Nouveau callback pour les patientprescriptions
    initialCodePrestation?: string;
}

export default function InfoPatient({ 
    onPatientChange, 
    onConsultationChange, 
    onPrescriptionChange,
    onCodePrestationChange,
    onPatientPrescriptionsChange, // Nouveau callback
    initialCodePrestation = ""
}: Props) {
    const [codePrestation, setCodePrestation] = useState(initialCodePrestation);
    const [patient, setPatient] = useState<Patient>({});
    const [consultation, setConsultation] = useState<Consultation>({});
    const [prescription, setPrescription] = useState<Prescription>({});
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [infoMessage, setInfoMessage] = useState<string | null>(null);
    
    // Ref pour le focus du champ code prestation
    const codeInputRef = useRef<HTMLInputElement>(null);

    // Effet principal : recherche immédiate lors de la saisie du code prestation,
    // comme dans PatientInfoCaisse (FactureExamHospit)
    useEffect(() => {
        if (codePrestation.trim() === "") {
            resetForm();
            return;
        }

        loadConsultationData(codePrestation);
    }, [codePrestation]);

    // Effet pour maintenir le focus après la recherche
    useEffect(() => {
        // Si le champ existe et qu'on n'est pas en train de charger
        if (codeInputRef.current && !loading) {
            // Remettre le focus si le champ perd le focus pendant la recherche
            const currentFocus = document.activeElement;
            if (currentFocus !== codeInputRef.current) {
                // Ne pas forcer le focus si l'utilisateur a cliqué ailleurs
                // mais le faire si le champ était précédemment focusé
                if (codePrestation && codePrestation.length > 0) {
                    setTimeout(() => {
                        if (codeInputRef.current) {
                            codeInputRef.current.focus();
                        }
                    }, 100);
                }
            }
        }
    }, [loading, codePrestation]);

    // Effet pour notifier le parent des changements
    useEffect(() => {
        if (onPatientChange) {
            onPatientChange(patient);
        }
    }, [patient]); // Retirer onPatientChange des dépendances

    useEffect(() => {
        if (onConsultationChange) {
            onConsultationChange(consultation);
        }
    }, [consultation]); // Retirer onConsultationChange des dépendances

    useEffect(() => {
        if (onPrescriptionChange) {
            onPrescriptionChange(prescription);
        }
    }, [prescription]); // Retirer onPrescriptionChange des dépendances

    useEffect(() => {
        if (onCodePrestationChange && codePrestation !== initialCodePrestation) {
            onCodePrestationChange(codePrestation);
        }
    }, [codePrestation, onCodePrestationChange, initialCodePrestation]);

    const resetForm = () => {
        setPatient({});
        setConsultation({});
        setPrescription({});
        setErrorMessage(null);
        setInfoMessage(null);
    };

    const loadConsultationData = async (code: string) => {
        console.log("🔍 Début recherche pour le code:", code);
        setLoading(true);
        setErrorMessage(null);
        setInfoMessage(null);

        try {
            // 1. Récupérer une consultation à partir du CodePrestation saisi
            const consultationUrl = `/api/codeconsultation?CodePrestation=${encodeURIComponent(code)}`;
            console.log("📡 Appel API consultation:", consultationUrl);
            const consultationRes = await fetch(consultationUrl);
            
            console.log("📡 Réponse consultation:", consultationRes.status, consultationRes.ok);
            
            if (!consultationRes.ok) {
                // On ne logue plus en erreur pour éviter le stack Next bruyant,
                // on se contente de remettre le formulaire à zéro et d'afficher un message utilisateur.
                let errorData: any = null;
                try {
                    errorData = await consultationRes.json();
                } catch {
                    // corps vide ou non JSON, on ignore
                }
                resetForm();
                setErrorMessage(errorData?.error || "Code prestation invalide");
                setLoading(false);
                return;
            }

            const consultationData = await consultationRes.json();
            console.log("✅ Données consultation reçues:", consultationData);
            console.log("📋 Champs disponibles dans consultation:", Object.keys(consultationData));

            // 2. Vérifier si la consultation existe
            if (!consultationData) {
                resetForm();
                setErrorMessage("Code prestation invalide");
                setLoading(false);
                return;
            }

            // 3. Vérifier que la consultation n'est pas payée (StatutPrescriptionMedecin <3 et ticket_moderateur>0)
            if (consultationData.StatutPrescriptionMedecin < 3 && consultationData.ticket_moderateur > 0) {
               setInfoMessage("⚠️ ATTENTION: La consultation n'est pas encore payée à la caisse");

                setTimeout(() => {
                    setInfoMessage(null);
                }, 5000);

            }

            // 4. Rechercher le patient lié à la consultation via Code_dossier
            let patientData = {};
            if (consultationData.Code_dossier) {
                try {
                    // Appel API patient
                    const patientUrl = `/api/patients?Code_dossier=${encodeURIComponent(consultationData.Code_dossier)}`;
                    console.log("📡 Appel API patient:", patientUrl);
                    //Réponse patient
                    const patientRes = await fetch(patientUrl);
                    console.log("📡 Réponse patient:", patientRes.status, patientRes.ok);
                    
                    if (patientRes.ok) {
                        const patientArray = await patientRes.json();
                        if (patientArray && patientArray.length > 0) {
                            patientData = patientArray[0];
                            console.log("✅ Données patient reçues:", patientData);
                        } else {
                            console.log("ℹ️ Aucun patient trouvé pour ce code dossier");
                        }
                    } else {
                        console.log("ℹ️ Erreur lors de la recherche du patient");
                    }
                } catch (error) {
                    console.error("❌ Erreur lors du chargement du patient:", error);
                }
            } else {
                console.log("ℹ️ Aucun code dossier associé à la consultation");
            }

            // 5. Charger les informations de prescription liée à la consultation
            let prescriptionData = {};
            let patientPrescriptionsData = [];
            try {
                const prescriptionUrl = `/api/prescription?CodePrestation=${encodeURIComponent(code)}`;
                console.log("📡 Appel API prescription:", prescriptionUrl);
                const prescriptionRes = await fetch(prescriptionUrl);
                console.log("📡 Réponse prescription:", prescriptionRes.status, prescriptionRes.ok);
                
                if (prescriptionRes.ok) {
                    const presData = await prescriptionRes.json();
                    console.log("✅ Données prescription reçues:", presData);
                    if (presData && presData._id) {
                        prescriptionData = presData;
                        console.log("✅ Prescription trouvée:", presData);
                        
                        // 5.1. Rechercher les patientprescriptions liées à la consultation
                        try {
                            const patientPrescriptionsUrl = `/api/patientprescriptionFacture?CodePrestation=${encodeURIComponent(code)}`;
                            console.log("📡 Appel API patientprescriptions:", patientPrescriptionsUrl);
                            const patientPrescriptionsRes = await fetch(patientPrescriptionsUrl);
                            
                            if (patientPrescriptionsRes.ok) {
                                const patientPrescriptions = await patientPrescriptionsRes.json();
                                console.log("✅ Patientprescriptions reçues:", patientPrescriptions);
                                
                                if (Array.isArray(patientPrescriptions) && patientPrescriptions.length > 0) {
                                    patientPrescriptionsData = patientPrescriptions;
                                    console.log(`📋 ${patientPrescriptions.length} patientprescriptions trouvées pour cette consultation`);
                                    
                                    // Transmettre les patientprescriptions au parent pour traitement
                                    if (onPatientPrescriptionsChange) {
                                        onPatientPrescriptionsChange(patientPrescriptions);
                                    }
                                } else {
                                    console.log("ℹ️ Aucune patientprescription trouvée pour cette consultation");
                                    // Transmettre un tableau vide au parent
                                    if (onPatientPrescriptionsChange) {
                                        onPatientPrescriptionsChange([]);
                                    }
                                }
                            } else {
                                console.log("⚠️ Erreur lors du chargement des patientprescriptions");
                            }
                        } catch (error) {
                            console.error("❌ Erreur lors du chargement des patientprescriptions:", error);
                        }
                        
                        // La prescription est trouvée, le parent (PharmacieCaisseModal) chargera les patientprescription
                        // via handlePrescriptionChange
                    } else {
                        console.log("ℹ️ Aucune prescription trouvée pour ce code");
                    }
                } else {
                    console.log("ℹ️ Erreur lors de la recherche de la prescription");
                }
            } catch (error) {
                console.error("❌ Erreur lors du chargement de la prescription:", error);
            }

            // 6. Mettre à jour les états avec toutes les informations
            console.log("🔄 Mise à jour des états:", {
                patient: patientData,
                consultation: consultationData,
                prescription: prescriptionData
            });
            
            setPatient(patientData);
            setConsultation({
                ...consultationData,
                DatePres: new Date().toISOString().split('T')[0] // Date système
            });
            setPrescription(prescriptionData);

        } catch (error: any) {
            console.error("❌ Erreur générale loadConsultationData:", error);
            resetForm();
            setErrorMessage("Une erreur est survenue lors de la recherche. Veuillez réessayer.");
        } finally {
            setLoading(false);
        }
    };

    const handleCodePrestationChange = (value: string) => {
        // Mettre à jour l'état
        setCodePrestation(value);
        
        // Maintenir le focus sur le champ pendant la saisie
        // Le focus sera automatiquement maintenu par React
        // Pas besoin de manipuler manuellement le focus ici
    };

    return (
        <Card className="mb-2 shadow-sm">
            <Card.Header className="bg-light">Information Patient</Card.Header>
            <Card.Body>
                {/* N° Prestation */}
                <Form.Group className="mb-3">
                    <Form.Label>N° Prestation</Form.Label>
                    <Form.Control
                        ref={codeInputRef}
                        value={codePrestation}
                        onChange={(e) => handleCodePrestationChange(e.target.value)}
                        placeholder="Saisir le code prestation"
                        isInvalid={!!errorMessage}
                        disabled={loading}
                        className={codePrestation && !loading && !errorMessage ? "border-success" : ""}
                        autoFocus={true}
                    />
                    {errorMessage && (
                        <Form.Control.Feedback type="invalid">
                            {errorMessage}
                        </Form.Control.Feedback>
                    )}
                    {loading && (
                        <div className="text-muted mt-1">
                            <small>Recherche en cours...</small>
                        </div>
                    )}
                    
                    {/* Indicateur de saisie en cours */}
                    {codePrestation && !loading && !errorMessage && (!patient || Object.keys(patient).length === 0) && (
                        <div className="text-info mt-1">
                            <small>🔍 Recherche automatique en cours...</small>
                        </div>
                    )}
                </Form.Group>

                {/* Message info */}
                {infoMessage && (
                    <Alert variant="info" className="mt-2 mb-3">
                        {infoMessage}
                    </Alert>
                )}

                {/* Informations du patient */}
                {patient && Object.keys(patient).length > 0 && (
                    <>
                        <div className="mb-2">
                            <Form.Label>Patient</Form.Label>
                            <Form.Control value={patient.Nom + " " + patient.Prenoms || ""} readOnly />
                        </div>

                        <div className="row">
                            <div className="col">
                                <Form.Label>Age</Form.Label>
                                <Form.Control value={patient.Age_partient || ""} readOnly />
                            </div>
                            <div className="col">
                                <Form.Label>Sexe</Form.Label>
                                <Form.Control value={patient.sexe || ""} readOnly />
                            </div>
                        </div>

                        {/* Informations cliniques */}
                        {consultation && Object.keys(consultation).length > 0 && (
                            <div className="mt-3">
                                <h6 className="text-muted">Constantes médicales</h6>
                                <div className="row">
                                    <div className="col-md-3">
                                        <Form.Label>Température</Form.Label>
                                        <Form.Control value={consultation.Temperature || ""} readOnly />
                                    </div>
                                    <div className="col-md-3">
                                        <Form.Label>Tension</Form.Label>
                                        <Form.Control value={consultation.Tension || ""} readOnly />
                                    </div>
                                    <div className="col-md-3">
                                        <Form.Label>Taille</Form.Label>
                                        <Form.Control value={consultation.TailleCons || ""} readOnly />
                                    </div>
                                    <div className="col-md-3">
                                        <Form.Label>Poids</Form.Label>
                                        <Form.Control value={consultation.Poids || ""} readOnly />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Informations de la consultation */}
                        {consultation && (
                            <div className="mt-3">
                                <h6 className="text-muted">Informations consultation</h6>
                                <div className="row">
                                   
                                    <div className="col-md-8">
                                        <Form.Label>Assurance</Form.Label>
                                        <Form.Control value={consultation.assurance || ""} readOnly />
                                    </div>
                                    <div className="col-md-4">
                                        <Form.Label>Taux(%)</Form.Label>
                                        <Form.Control value={consultation.tauxAssurance ? `${consultation.tauxAssurance}%` : ""} readOnly />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-md-12">
                                        <Form.Label>Médecin Prescripteur</Form.Label>
                                        <Form.Control value={consultation.Medecin || ""} readOnly />
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </Card.Body>
        </Card>
    );
}
