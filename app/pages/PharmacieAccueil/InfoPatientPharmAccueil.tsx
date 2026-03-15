"use client";

import { useState, useEffect, useRef } from "react";
import { Form, Card, Alert, InputGroup, Button } from "react-bootstrap";

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
    Rclinique?: string;
}

interface PatientPrescription {
    DatePres?: string;
    nomMedicament?: string;
    QteP?: number; // Corrigé: QteP au lieu de QtéP
    prixUnitaire?: number; // Corrigé: prixUnitaire au lieu de prixunitaire
    Posologie?: string;
    PrixTotal?: number; // Corrigé: PrixTotal au lieu de PrixTotal
    PartAssurance?: number;
    PartAssure?: number;
    IDMEDICAMENT?: string;
    Reference?: string;
    ExclusionActae?: string;
    _id?: string;
    StatuPrescriptionMedecin?: number;
}

interface Props {
    onPatientChange?: (patient: Patient) => void;
    onConsultationChange?: (consultation: Consultation) => void;
    onPrescriptionChange?: (prescription: Prescription) => void;
    onMedicamentsPrescritsChange?: (medicaments: PatientPrescription[]) => void;
    onCodePrestationChange?: (code: string) => void;
    initialCodePrestation?: string;
}

export default function InfoPatientPharmAccueil({ 
    onPatientChange, 
    onConsultationChange, 
    onPrescriptionChange,
    onMedicamentsPrescritsChange,
    onCodePrestationChange,
    initialCodePrestation = ""
}: Props) {
    const [codePrestation, setCodePrestation] = useState(initialCodePrestation);
    const [patient, setPatient] = useState<Patient>({});
    const [consultation, setConsultation] = useState<Consultation>({});
    const [prescription, setPrescription] = useState<Prescription>({});
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [infoMessage, setInfoMessage] = useState<string | null>(null);
    
    // Ref pour le debounce
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Effet pour réinitialiser quand le code est vide
    useEffect(() => {
        if (codePrestation.trim() === "") {
            resetForm();
            return;
        }
    }, [codePrestation]);

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

    // PROCÉDURE Med_Modif()
    // TABLE_PARTIENT_PRESCRIPTION.SupprimeTout()
    // POUR TOUT PARTIENT_PRESCRIPTION AVEC CodePrestation=gsCodeconsulte
    // TableAjouteLigne(TABLE_PARTIENT_PRESCRIPTION,PARTIENT_PRESCRIPTION.DatePres,PARTIENT_PRESCRIPTION.nomMedicament,PARTIENT_PRESCRIPTION.QtéP,PARTIENT_PRESCRIPTION.prixunitaire,PARTIENT_PRESCRIPTION.Posologie,PARTIENT_PRESCRIPTION.PrixTotal,PARTIENT_PRESCRIPTION.PartAssurance,PARTIENT_PRESCRIPTION.Partassuré,PARTIENT_PRESCRIPTION.IDMEDICAMENT,PARTIENT_PRESCRIPTION.Reference,PARTIENT_PRESCRIPTION.ExclusionActae,PARTIENT_PRESCRIPTION.IDPATIENTPRESCRIT,PARTIENT_PRESCRIPTION.StatuPrescriptionMedecin)
    const loadMedicamentsPrescrits = async (codePrestation: string) => {
        try {
            // TABLE_PARTIENT_PRESCRIPTION.SupprimeTout() - Vider la liste existante
            console.log("🔄 Med_Modif() - Suppression de la table existante");
            
            // POUR TOUT PARTIENT_PRESCRIPTION AVEC CodePrestation=gsCodeconsulte
            const medicamentsUrl = `/api/patientprescription?CodePrestation=${encodeURIComponent(codePrestation)}`;
            console.log("📡 Appel API médicaments prescrits:", medicamentsUrl);
            const medicamentsRes = await fetch(medicamentsUrl);
            
            if (medicamentsRes.ok) {
                const medicamentsArray: PatientPrescription[] = await medicamentsRes.json();
                console.log("✅ Médicaments prescrits reçus:", medicamentsArray);
                
                // TableAjouteLigne(TABLE_PARTIENT_PRESCRIPTION, ...) - Ajouter chaque ligne à la table
                if (onMedicamentsPrescritsChange) {
                    onMedicamentsPrescritsChange(medicamentsArray);
                    console.log(`📋 Med_Modif() - ${medicamentsArray.length} médicaments ajoutés à la table`);
                }
                
                return medicamentsArray;
            }
        } catch (error) {
            console.error("❌ Erreur lors du chargement des médicaments prescrits:", error);
        }
        
        return [];
    };

    const loadConsultationData = async (code: string) => {
        console.log("🔍 Début recherche pour le code:", code);
        setLoading(true);
        setErrorMessage(null);
        setInfoMessage(null);

        try {
            // 1. gsCodeconsulte=SAI_N_Prestation
            // HLitRecherchePremier(CONSULTATION,CodePrestation,MoiMême)
            const consultationUrl = `/api/codeconsultation?CodePrestation=${encodeURIComponent(code)}`;
            console.log("📡 Appel API consultation:", consultationUrl);
            const consultationRes = await fetch(consultationUrl);
            
            if (!consultationRes.ok) {
                console.error("❌ Code non valide - aucune consultation trouvée");
                setErrorMessage("Code non valide");
                resetForm();
                return;
            }

            const consultationData = await consultationRes.json();
            console.log("✅ Données consultation reçues:", consultationData);

            // SI HTrouve(CONSULTATION)=Vrai ALORS
            if (!consultationData) {
                console.error("❌ Code non valide");
                setErrorMessage("Code non valide");
                resetForm();
                return;
            }

            // HLitRecherchePremier(PARTIENT,Code_dossier,CONSULTATION.Code_dossier)
            let patientData: Patient = {};
            if (consultationData.Code_dossier) {
                try {
                    const patientUrl = `/api/patients?Code_dossier=${encodeURIComponent(consultationData.Code_dossier)}`;
                    console.log("📡 Appel API patient:", patientUrl);
                    const patientRes = await fetch(patientUrl);
                    
                    if (patientRes.ok) {
                        const patientArray = await patientRes.json();
                        if (patientArray && patientArray.length > 0) {
                            patientData = patientArray[0];
                            console.log("✅ Données patient reçues:", patientData);
                        }
                    }
                } catch (error) {
                    console.error("❌ Erreur lors du chargement du patient:", error);
                }
            }

            // SI HTrouve(PARTIENT) ALORS
            if (!patientData || Object.keys(patientData).length === 0) {
                setErrorMessage("Ce patient n'est pas connu");
                // Vider tous les champs selon la logique WLangage
                setPatient({
                    Nom: "",
                    sexe: "",
                    Age_partient: "",
                    Date_naisse: "",
                    Situationgeo: ""
                });
                setConsultation({
                    Temperature: "",
                    Tension: "",
                    TailleCons: "",
                    Glycemie: "",
                    Poids: ""
                });
                setPrescription({});
                return;
            }

            // SI CONSULTATION.StatutC=Vrai ALORS (vérifier si la consultation est payée)
            // Dans votre code WLangage: SI CONSULTATION.StatutC=Vrai ALORS
            // Mais selon votre logique, on vérifie si StatutPrescriptionMedecin >= 3 OU ticket_moderateur = 0
            if (consultationData.StatutPrescriptionMedecin < 3 && (consultationData.ticket_moderateur || 0) > 0) {
                setErrorMessage("Consultation pas encore payée à la caisse");
                resetForm();
                return;
            }

            // on revoie les informations du patient
            const updatedPatient = {
                ...patientData,
                // SAI_Patient=PARTIENT.Nom
                Nom: patientData.Nom || "",
                // SAI_Sexe=PARTIENT.Sexe
                sexe: patientData.sexe || "",
                // SAI_Age=PARTIENT.Age_partient
                Age_partient: patientData.Age_partient || "",
                // SAI_Né_le=PARTIENT.Date_naisse
                Date_naisse: patientData.Date_naisse || "",
                // SAI_Situationgeo=PARTIENT.SituationGéo
                Situationgeo: patientData.Situationgeo || "",
                // SAI_IDPARTIENT=PARTIENT.IDPARTIENT
                _id: patientData._id || ""
            };

            // renvoyer toutes les autres informations de l'historique
            const updatedConsultation = {
                ...consultationData,
                // SAI_Température=CONSULTATION.Température
                Temperature: consultationData.Temperature || "",
                // SAI_Tension=CONSULTATION.Tension
                Tension: consultationData.Tension || "",
                // SAI_TailleCons=CONSULTATION.TailleCons
                TailleCons: consultationData.TailleCons || "",
                // SAI_Glycemie=CONSULTATION.Glycemie
                Glycemie: consultationData.Glycemie || "",
                // SAI_Poids=CONSULTATION.Poids
                Poids: consultationData.Poids || "",
                // SAI_DatePres=DateSys()
                DatePres: new Date().toISOString().split('T')[0],
                // SAI_IDMedecin=CONSULTATION.IDMEDECIN
                IDMEDECIN: consultationData.IDMEDECIN || "",
                // SAI_IDASSURANCE=CONSULTATION.IDASSURANCE
                IDASSURANCE: consultationData.IDASSURANCE || ""
            };

            // HLitRecherchePremier(PRESCRIPTION,CodePrestation,SAI_N_Prestation)
            let prescriptionData: Prescription & { Rclinique?: string } = {};
            try {
                const prescriptionUrl = `/api/prescription?CodePrestation=${encodeURIComponent(code)}`;
                const prescriptionRes = await fetch(prescriptionUrl);
                
                if (prescriptionRes.ok) {
                    const presData = await prescriptionRes.json();
                    if (presData && presData._id) {
                        prescriptionData = presData;
                        console.log("✅ Données prescription reçues:", presData);
                        
                        // SAI_Renseignement_clinique=PRESCRIPTION.Rclinique
                        prescriptionData.Rclinique = presData.Rclinique || "";
                        
                        // On vas ajouté l'historique des prescription de médicament (Med_Modif())
                        await loadMedicamentsPrescrits(code);
                    }
                }
            } catch (error) {
                console.error("❌ Erreur lors du chargement de la prescription:", error);
            }

            // Mettre à jour les états
            setPatient(updatedPatient);
            setConsultation(updatedConsultation);
            setPrescription(prescriptionData);

        } catch (error: any) {
            setErrorMessage("Une erreur est survenue lors de la recherche. Veuillez réessayer.");
            resetForm();
        } finally {
            setLoading(false);
        }
    };

    const handleCodePrestationChange = (value: string) => {
        const oldValue = codePrestation;
        setCodePrestation(value);
        
        // Si le code change et qu'il y avait déjà un patient trouvé,
        // on réinitialise pour permettre une nouvelle recherche
        if (value !== oldValue && patient && Object.keys(patient).length > 0) {
            console.log("🔄 Code modifié, réinitialisation pour nouvelle recherche");
            resetForm();
        }
        
        // Réinitialiser seulement si le champ est complètement vide
        if (value.trim() === "") {
            resetForm();
        }
    };

    return (
        <Card className="mb-2 shadow-sm">
            <Card.Header className="bg-light">Information Patient</Card.Header>
            <Card.Body>
                {/* N° Prestation */}
                <Form.Group className="mb-3">
                    <Form.Label>N° Prestation</Form.Label>
                    <InputGroup>
                        <Form.Control
                            value={codePrestation}
                            onChange={(e) => handleCodePrestationChange(e.target.value)}
                            placeholder="Saisir le code prestation"
                            isInvalid={!!errorMessage}
                            disabled={loading}
                            className={codePrestation && !loading && !errorMessage ? "border-success" : ""}
                        />
                        <Button 
                            variant={patient && Object.keys(patient).length > 0 ? "success" : "outline-primary"}
                            onClick={() => {                             
                                    if (codePrestation.trim() === "") {    
                                    setErrorMessage("Veuillez saisir un code prestation");
                                } else {
                                    loadConsultationData(codePrestation);
                                }
                            }}
                            disabled={loading || !codePrestation.trim() || (patient && Object.keys(patient).length > 0)}
                            title={patient && Object.keys(patient).length > 0 ? "Code trouvé" : "Rechercher le code prestation"}
                        >
                            {loading ? (
                                <span className="spinner-border spinner-border-sm" role="status">
                                    <span className="visually-hidden">Recherche...</span>
                                </span>
                            ) : patient && Object.keys(patient).length > 0 ? (
                                <i className="bi bi-check-circle"></i>
                            ) : (
                                <i className="bi bi-search"></i>
                            )}
                        </Button>
                    </InputGroup>
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
                            <small>🔍 Code saisi, cliquez sur le bouton recherche</small>
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
                            <div className="col">
                                <Form.Label>Date de naissance</Form.Label>
                                <Form.Control value={patient.Date_naisse || ""} readOnly />
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
