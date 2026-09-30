"use client";

import React, { useState, useEffect } from "react";
import { Form, Button, Card, Row, Col, Modal } from "react-bootstrap";

interface ConstanteData {
    temperature: string;
    tension: string;
    taille: string;
    poids: string;
    pouls: string;
    medecin: string;
    prisePar: string;
}


interface SalleConstanteModalProps {
    show: boolean;
    onHide: () => void;
    user: string;
    consultation?: any;
}


const SalleConstante: React.FC<SalleConstanteModalProps> = ({ show, onHide, user, consultation }) => {
    const [formData, setFormData] = useState<ConstanteData>({
        temperature: "",
        tension: "",
        taille: "",
        poids: "",
        pouls: "",
        medecin: consultation?.Medecin || "",
        prisePar: user,
    });

    const [medecins, setMedecins] = useState<any[]>([]);
    const [CodePrestation, setCodePrestation] = useState<string>("");
    const [consultationTrouvee, setConsultationTrouvee] = useState<any>(null);
    const [constantesChargees, setConstantesChargees] = useState(false);
    const [searchError, setSearchError] = useState<string>("");
    const [searchSuccess, setSearchSuccess] = useState<string>("");
    const [imc, setImc] = useState<string>("");
    const [imcInterpretation, setImcInterpretation] = useState<string>("");
    const [poulsInterpretation, setPoulsInterpretation] = useState<string>("");

    useEffect(() => {
        // Charger les médecins depuis l'API
        const fetchMedecins = async () => {
            try {
                const res = await fetch("/api/medecins");
                const data = await res.json();
                setMedecins(data);
            } catch (error) {
                console.error("Erreur lors du chargement des médecins:", error);
            }
        };

        fetchMedecins();
    }, []);

    useEffect(() => {
        // Charger l'utilisateur connecté depuis le localStorage
        const storedUser = localStorage.getItem('nom_utilisateur');
        if (storedUser) {
            setFormData((prev) => ({ ...prev, prisePar: storedUser }));
        }
    }, []);

    // Réinitialisation à l'ouverture du modal
    useEffect(() => {
        if (show) {
            // Si aucune consultation n'est passée, réinitialiser les champs
            if (!consultation) {
                setCodePrestation("");
                setConsultationTrouvee(null);
                setConstantesChargees(false);
                setSearchError("");
                setSearchSuccess("");
                setFormData({
                    temperature: "",
                    tension: "",
                    taille: "",
                    poids: "",
                    pouls: "",
                    medecin: "",
                    prisePar: user,
                });
            }
        }
    }, [show, consultation, user]);

    // Initialisation et gestion de la consultation
    useEffect(() => {
        // Si aucune consultation n'est passée, rien à faire
        if (!consultation) return;

        // Si la consultation a un CodePrestation, l'afficher
        if (consultation.CodePrestation && CodePrestation === "") {
            setCodePrestation(consultation.CodePrestation);
        }

        // Deux cas possibles:
        // 1. Consultation complète avec ID (depuis SalleAttenteModal)
        // 2. Consultation avec seulement CodePrestation (nécessite recherche)

        const consultationId = consultation._id || consultation.IDCONSULTATION;

        // Cas 1: Consultation complète avec ID
        if (consultationId) {
            // Charger directement les constantes
            (async () => {
                try {
                    const res = await fetch(`/api/consultation/constantes/${consultationId}`);
                    if (res.ok) {
                        const data = await res.json();
                        setFormData((prev) => ({
                            ...prev,
                            temperature: data.Temperature || "",
                            tension: data.Tension || "",
                            taille: data.TailleCons || "",
                            poids: data.Poids || "",
                            pouls: data.Pouls || "",
                            medecin: data.IDMEDECIN || "",
                        }));
                        setConstantesChargees(true);
                    } else {
                        setConstantesChargees(false);
                    }
                } catch (error) {
                    console.error("Erreur lors du chargement des constantes:", error);
                    setConstantesChargees(false);
                }
            })();
        }
        // Cas 2: Consultation avec seulement CodePrestation
        else if (consultation.CodePrestation && !consultationTrouvee) {
            // Rechercher la consultation par CodePrestation
            (async () => {
                try {
                    const res = await fetch(`/api/consultation/code?CodePrestation=${encodeURIComponent(consultation.CodePrestation)}`);
                    if (res.ok) {
                        const data = await res.json();
                        setConsultationTrouvee(data);

                        // Charger les constantes si consultation trouvée
                        const foundId = data._id || data.IDCONSULTATION;
                        if (foundId) {
                            const resConst = await fetch(`/api/consultation/constantes/${foundId}`);
                            if (resConst.ok) {
                                const constData = await resConst.json();
                                setFormData((prev) => ({
                                    ...prev,
                                    temperature: constData.Temperature || "",
                                    tension: constData.Tension || "",
                                    taille: constData.TailleCons || "",
                                    poids: constData.Poids || "",
                                    pouls: constData.Pouls || "",
                                    medecin: constData.IDMEDECIN || "",
                                }));
                                setConstantesChargees(true);
                            } else {
                                setConstantesChargees(false);
                            }
                        }
                    } else {
                        setConsultationTrouvee(null);
                        setConstantesChargees(false);
                    }
                } catch (error) {
                    console.error("Erreur lors de la recherche de consultation:", error);
                    setConsultationTrouvee(null);
                    setConstantesChargees(false);
                }
            })();
        }
    }, [consultation, CodePrestation, consultationTrouvee]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Calcul automatique de l'IMC
    useEffect(() => {
        if (formData.poids && formData.taille) {
            const poidsNum = parseFloat(formData.poids);
            const tailleNum = parseFloat(formData.taille) / 100; // Convertir cm en m

            if (poidsNum > 0 && tailleNum > 0) {
                const imcCalcule = poidsNum / (tailleNum * tailleNum);
                setImc(imcCalcule.toFixed(2));

                // Interprétation de l'IMC
                if (imcCalcule < 18.5) {
                    setImcInterpretation("Insuffisance pondérale");
                } else if (imcCalcule >= 18.5 && imcCalcule < 25) {
                    setImcInterpretation("Poids normal");
                } else if (imcCalcule >= 25 && imcCalcule < 30) {
                    setImcInterpretation("Surpoids");
                } else {
                    setImcInterpretation("Obésité");
                }
            } else {
                setImc("");
                setImcInterpretation("");
            }
        } else {
            setImc("");
            setImcInterpretation("");
        }
    }, [formData.poids, formData.taille]);

    // Interprétation automatique du pouls
    useEffect(() => {
        if (formData.pouls) {
            const poulsNum = parseFloat(formData.pouls);

            if (poulsNum > 0) {
                if (poulsNum < 60) {
                    setPoulsInterpretation("Bradycardie (trop bas)");
                } else if (poulsNum >= 60 && poulsNum <= 100) {
                    setPoulsInterpretation("Pouls normal");
                } else {
                    setPoulsInterpretation("Tachycardie (trop élevé)");
                }
            } else {
                setPoulsInterpretation("");
            }
        } else {
            setPoulsInterpretation("");
        }
    }, [formData.pouls]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation des champs requis
        if (!formData.temperature || !formData.tension || !formData.taille || !formData.poids || !formData.medecin) {
            alert("Veuillez remplir tous les champs obligatoires (Température, Tension, Taille, Poids, Médecin)");
            return;
        }

        try {
            console.log('consultation prop:', consultation);
            console.log('consultationTrouvee:', consultationTrouvee);

            // Correction : accepter aussi IDCONSULTATION comme identifiant si _id absent
            // Vérifier d'abord consultationTrouvee, puis consultation
            let consultationId = undefined;

            if (consultationTrouvee) {
                consultationId = consultationTrouvee._id || consultationTrouvee.IDCONSULTATION;
            } else if (consultation) {
                consultationId = consultation._id || consultation.IDCONSULTATION;
            }

            if (!consultationId) {
                alert("Aucune consultation sélectionnée ! Veuillez rechercher une consultation par N° prestation.");
                return;
            }
            console.log('ID utilisé pour l\'API:', consultationId);

            const payload = {
                temperature: formData.temperature,
                tension: formData.tension,
                taille: formData.taille,
                poids: formData.poids,
                pouls: formData.pouls,
                medecin: formData.medecin,
                prisePar: formData.prisePar,
                attenteAccueil: 1,
                attenteMedecin: 1,
            };

            console.log('Payload envoyé:', payload);

            const res = await fetch(`/api/consultation/constantes/${consultationId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const responseData = await res.json();
            console.log('Réponse API:', responseData);

            if (!res.ok) {
                throw new Error(responseData.error || "Erreur lors de l'enregistrement des constantes");
            }

            alert("✅ Constantes enregistrées avec succès !");
            onHide(); // Fermer le modal après succès
        } catch (error: any) {
            console.error("Erreur lors de l'enregistrement des constantes:", error);
            alert(`❌ Erreur: ${error.message || "Une erreur est survenue. Veuillez réessayer."}`);
        }
    };

    // Recherche consultation par code prestation
    const handleCodePrestationSearch = async () => {
        if (!CodePrestation.trim()) {
            setSearchError("Veuillez saisir un code prestation");
            return;
        }

        setSearchError("");
        setSearchSuccess("");

        try {
            const res = await fetch(`/api/consultation/code?CodePrestation=${encodeURIComponent(CodePrestation)}`);
            if (res.ok) {
                const data = await res.json();
                setConsultationTrouvee(data);
                setSearchSuccess("Consultation trouvée avec succès !");

                // Charger les constantes si consultation trouvée
                const consultationId = data._id || data.IDCONSULTATION;
                if (consultationId) {
                    const resConst = await fetch(`/api/consultation/constantes/${consultationId}`);
                    if (resConst.ok) {
                        const constData = await resConst.json();
                        setFormData((prev) => ({
                            ...prev,
                            temperature: constData.Temperature || "",
                            tension: constData.Tension || "",
                            taille: constData.TailleCons || "",
                            poids: constData.Poids || "",
                            pouls: constData.Pouls || "",
                            medecin: constData.IDMEDECIN || "",
                        }));
                        setConstantesChargees(true);
                    } else {
                        setConstantesChargees(false);
                    }
                }
            } else {
                setConsultationTrouvee(null);
                setConstantesChargees(false);
                setSearchError("Code non trouvé. Veuillez saisir le bon code prestation.");
                setFormData((prev) => ({ ...prev, temperature: "", tension: "", taille: "", poids: "", pouls: "", medecin: "" }));
            }
        } catch (error) {
            console.error("Erreur lors de la recherche:", error);
            setConsultationTrouvee(null);
            setConstantesChargees(false);
            setSearchError("Erreur lors de la recherche. Veuillez réessayer.");
            setFormData((prev) => ({ ...prev, temperature: "", tension: "", taille: "", poids: "", pouls: "", medecin: "" }));
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>Prise de constantes</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="container mt-4">
                    <h5 className="text-warning fw-bold mb-3">Zone de prise de constante</h5>
                    <Card className="shadow p-4 border-2">
                        <Card.Title className="text-center mb-3">
                            <h4 className="fw-bold fst-italic text-secondary">
                                {consultation ? 'Consultation sélectionnée' : 'Recherche de consultation'}
                            </h4>
                        </Card.Title>
                        {/* Afficher le champ de code prestation (en lecture seule si consultation est passée) */}
                        <Form.Group className="mb-3">
                            <Form.Label>N° prestation</Form.Label>
                            <div className="d-flex gap-2">
                                <Form.Control
                                    type="text"
                                    value={CodePrestation}
                                    onChange={e => {
                                        setCodePrestation(e.target.value);
                                        setSearchError("");
                                        setSearchSuccess("");
                                    }}
                                    placeholder="Entrer le code prestation"
                                    readOnly={!!consultation}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !consultation) {
                                            e.preventDefault();
                                            handleCodePrestationSearch();
                                        }
                                    }}
                                />
                                {!consultation && (
                                    <Button variant="secondary" onClick={handleCodePrestationSearch}>Rechercher</Button>
                                )}
                            </div>
                            {searchError && (
                                <div className="alert alert-warning mt-2 p-2 mb-0">
                                    <small>⚠️ {searchError}</small>
                                </div>
                            )}
                            {searchSuccess && (
                                <div className="alert alert-success mt-2 p-2 mb-0">
                                    <small>✅ {searchSuccess}</small>
                                </div>
                            )}
                        </Form.Group>
                        {/* Si consultation sélectionnée (ou trouvée), afficher le formulaire de constantes */}
                        {(consultation || consultationTrouvee) && (
                            <Form onSubmit={handleSubmit}>
                                {/* Ligne 1 : Température / Taille */}
                                <Row className="mb-3">
                                    <Col md={6}>
                                        <Form.Label>Température (°C)</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="temperature"
                                            value={formData.temperature}
                                            onChange={handleChange}
                                            placeholder="Ex: 37.2"
                                            required
                                        />
                                    </Col>
                                    <Col md={6}>
                                        <Form.Label>Taille (cm)</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="taille"
                                            value={formData.taille}
                                            onChange={handleChange}
                                            placeholder="Ex: 170"
                                            required
                                        />
                                    </Col>
                                </Row>
                                {/* Ligne 2 : Tension / Poids */}
                                <Row className="mb-3">
                                    <Col md={6}>
                                        <Form.Label>Tension (mmHg)</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="tension"
                                            value={formData.tension}
                                            onChange={handleChange}
                                            placeholder="Ex: 12/8"
                                            required
                                        />
                                    </Col>
                                    <Col md={6}>
                                        <Form.Label>Poids (Kg)</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="poids"
                                            value={formData.poids}
                                            onChange={handleChange}
                                            placeholder="Ex: 70"
                                            required
                                        />
                                    </Col>
                                </Row>
                                {/* Ligne 3 : Pouls avec interprétation */}
                                <Form.Group className="mb-3">
                                    <Form.Label>Pouls (bpm)</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="pouls"
                                        value={formData.pouls}
                                        onChange={handleChange}
                                        placeholder="Ex: 75"
                                    />
                                    {poulsInterpretation && (
                                        <Form.Text className={`d-block mt-1 ${poulsInterpretation.includes("normale") ? "text-success" :
                                            poulsInterpretation.includes("élevée") ? "text-warning" :
                                                "text-danger"
                                            }`}>
                                            {poulsInterpretation.includes("normale") ? "✅" :
                                                poulsInterpretation.includes("élevée") ? "⚠️" : "❌"} {poulsInterpretation}
                                        </Form.Text>
                                    )}
                                </Form.Group>
                                {/* Affichage IMC calculé automatiquement */}
                                {imc && (
                                    <div className="alert alert-info p-2 mb-3">
                                        <small>
                                            <strong>📊 IMC calculé :</strong> {imc} kg/m²
                                            <span className={`ms-2 ${imcInterpretation === "Poids normal" ? "text-success" :
                                                imcInterpretation === "Surpoids" ? "text-warning" :
                                                    "text-danger"
                                                }`}>
                                                ({imcInterpretation})
                                            </span>
                                        </small>
                                    </div>
                                )}
                                {/* Ligne 4 : Médecin */}
                                <Form.Group className="mb-3">
                                    <Form.Label>Médecin</Form.Label>
                                    <Form.Select
                                        name="medecin"
                                        value={formData.medecin}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">-- Sélectionnez le médecin --</option>
                                        {medecins.map((medecin: any) => (
                                            <option key={medecin._id} value={medecin._id}>
                                                {medecin.nom} {medecin.prenoms} - {medecin.specialite}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                                {/* Ligne 5 : Prise par */}
                                <Form.Group className="mb-4">
                                    <Form.Label>Constante prise par</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="prisePar"
                                        value={formData.prisePar}
                                        readOnly
                                    />
                                </Form.Group>
                                {/* Affichage consultation trouvée via recherche */}
                                {consultationTrouvee && (
                                    <div className="mb-3">
                                        <div className="alert alert-info p-2 mb-2">
                                            <strong>📋 Consultation trouvée</strong>
                                            <br />
                                            <small>Code prestation : <b>{CodePrestation}</b></small>
                                            {consultationTrouvee.PatientNom && (
                                                <>
                                                    <br />
                                                    <small>Patient : <b>{consultationTrouvee.PatientNom}</b></small>
                                                </>
                                            )}
                                        </div>
                                        {constantesChargees ? (
                                            <div className="alert alert-success p-2 mb-0">
                                                <small>✅ Constantes déjà saisies. Vous pouvez les modifier ci-dessous.</small>
                                            </div>
                                        ) : (
                                            <div className="alert alert-primary p-2 mb-0">
                                                <small>➕ Nouvelle saisie de constantes. Veuillez remplir le formulaire ci-dessous.</small>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {/* Affichage pour consultation depuis SalleAttente (toujours nouvelle saisie) */}
                                {consultation && !consultationTrouvee && (
                                    <div className="mb-3">
                                        <div className="alert alert-primary p-2 mb-0">
                                            <small>➕ Nouvelle saisie de constantes pour cette consultation</small>
                                        </div>
                                    </div>
                                )}
                                {/* Bouton */}
                                <div className="text-center">
                                    <Button variant="primary" type="submit" className="px-5 rounded-pill">
                                        Valider
                                    </Button>
                                </div>
                            </Form>
                        )}
                    </Card>
                </div>
            </Modal.Body>
        </Modal>
    );
};

export default SalleConstante;