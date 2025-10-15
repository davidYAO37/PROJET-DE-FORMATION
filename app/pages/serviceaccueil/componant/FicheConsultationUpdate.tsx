"use client";
import { useState, useEffect } from "react";
import { Button, Card, Alert, Spinner, Row, Col, Form } from "react-bootstrap";
import type { Patient } from "@/types/patient";
import type { Assurance } from "@/types/assurance";
import type { Medecin } from "@/types/medecin";
import type { ConsultationType } from "@/types/consultation";
import InfosPatientUpdate from "./InfosPatientUpdate";
import BlocAssuranceUpdate from "./BlocAssuranceUpdate";
import ResumeMontantsUpdate from "./ResumeMontantsUpdate";

type FicheConsultationUpdateProps = {
    patient: Patient | null;
    onClose?: () => void;
    consultationId?: string;
};

export default function FicheConsultationUpdate({ patient, onClose, consultationId }: FicheConsultationUpdateProps) {
    const [loading, setLoading] = useState(false);
    const [loadingConsultation, setLoadingConsultation] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [saved, setSaved] = useState(false);
    const [consultationLoaded, setConsultationLoaded] = useState(false);
    const [currentConsultation, setCurrentConsultation] = useState<ConsultationType | null>(null);

    const [assure, setAssure] = useState("non");
    const [actes, setActes] = useState<any[]>([]);
    const [selectedActe, setSelectedActe] = useState("");
    const [assurances, setAssurances] = useState<Assurance[]>([]);
    const [selectedAssurance, setSelectedAssurance] = useState<string>("");
    const [matricule, setMatricule] = useState("");
    const [taux, setTaux] = useState<number | string>("");
    const [medecinPrescripteur, setMedecinPrescripteur] = useState<Medecin[]>([]);
    const [selectedMedecin, setSelectedMedecin] = useState<string>("");

    const [montantClinique, setMontantClinique] = useState<number>(0);
    const [montantAssurance, setMontantAssurance] = useState<number>(0);

    const [souscripteur, setSouscripteur] = useState("");
    const [societePatient, setSocietePatient] = useState("");

    const [surplus, setSurplus] = useState<number>(0);
    const [partAssurance, setPartAssurance] = useState<number>(0);
    const [partPatient, setPartPatient] = useState<number>(0);
    const [totalPatient, setTotalPatient] = useState<number>(0);

    const [numBon, setNumBon] = useState("");
    const [recuPar, setRecuPar] = useState("");
    const [codePrestation, setCodePrestation] = useState("");

    useEffect(() => {
        const nom = localStorage.getItem("nom_utilisateur");
        if (nom) setRecuPar(nom);

        fetch("/api/actes")
            .then((res) => res.json())
            .then((data) => setActes(Array.isArray(data) ? data : []));

        fetch("/api/assurances")
            .then((res) => res.json())
            .then((data) => setAssurances(Array.isArray(data) ? data : []));

        fetch("/api/medecins")
            .then((res) => res.json())
            .then((data) => setMedecinPrescripteur(Array.isArray(data) ? data : []));
    }, []);

    // Charger la consultation si consultationId est fourni
    useEffect(() => {
        if (consultationId) {
            loadConsultationById(consultationId);
        }
    }, [consultationId]);

    // Charger les données de la consultation dans les champs quand elle est chargée
    useEffect(() => {
        if (currentConsultation && consultationLoaded) {
            console.log("Chargement des données de consultation:", currentConsultation);

            // Remplir automatiquement tous les champs avec les données de la consultation
            setCodePrestation(currentConsultation.Code_Prestation || "");

            // Déterminer le type d'assuré depuis la consultation
            if (currentConsultation.Assuré === "NON ASSURE") {
                setAssure("non");
            } else if (currentConsultation.Assuré === "TARIF MUTUALISTE") {
                setAssure("mutualiste");
            } else {
                setAssure("preferentiel");
            }

            // Remplir les champs d'acte - Convertir ObjectId en string
            const idActe = currentConsultation.IDACTE ? String(currentConsultation.IDACTE) : "";
            const idMedecin = currentConsultation.IDMEDECIN ? String(currentConsultation.IDMEDECIN) : "";

            setSelectedActe(idActe);
            setSelectedMedecin(idMedecin);
            setMontantClinique(Math.round(currentConsultation.PrixClinique || 0));
            setMontantAssurance(Math.round(currentConsultation.Prix_Assurance || 0));

            // Remplir les champs d'assurance - Convertir ObjectId en string
            const idAssurance = currentConsultation.IDASSURANCE ? String(currentConsultation.IDASSURANCE) : "";
            setSelectedAssurance(idAssurance);
            setMatricule(currentConsultation.numero_carte || "");
            setTaux(currentConsultation.tauxAssurance || "");
            setNumBon(currentConsultation.NumBon || "");
            setSouscripteur(currentConsultation.Souscripteur || "");
            setSocietePatient(currentConsultation.SOCIETE_PATIENT || "");

            console.log("Données chargées - Acte:", idActe, "Médecin:", idMedecin, "Assurance:", idAssurance);
        }
    }, [currentConsultation, consultationLoaded]);

    // Effet pour vider ou afficher les champs selon le type d'assuré
    useEffect(() => {
        if (assure === "non") {
            setSelectedAssurance("");
            setMatricule("");
            setTaux("");
            setNumBon("");
            setSouscripteur("");
            setSocietePatient("");
        } else {
            // Si une consultation est chargée, garder ses valeurs
            // Sinon, pré-remplir avec les données du patient
            if (!consultationLoaded && patient) {
                setSelectedAssurance(patient.IDASSURANCE || "");
                setMatricule(patient.Matricule || "");
                setTaux(patient.Taux ?? "");
                setSouscripteur(patient.Souscripteur || "");
                setSocietePatient(patient.SOCIETE_PATIENT || "");
            }
        }
    }, [assure, patient, consultationLoaded]);

    useEffect(() => {
        if (!selectedActe) return;
        const acte = actes.find((a) => a._id === selectedActe);
        if (!acte) {
            console.log("Acte non trouvé pour l'ID:", selectedActe);
            return;
        }

        console.log("Recalcul des prix pour l'acte:", acte.designationacte, "Type patient:", assure);

        // Montant clinique selon le type patient
        let montant = 0;
        if (assure === "mutualiste") montant = Math.round(acte.prixMutuel ?? acte.prixClinique ?? 0);
        else if (assure === "preferentiel") montant = Math.round(acte.prixPreferentiel ?? acte.prixClinique ?? 0);
        else montant = Math.round(acte.prixClinique ?? 0);

        //console.log("Montant clinique calculé:", montant);
        setMontantClinique(montant);

        // Si patient mutualiste ou préférentiel, on cherche le tarif dans la collection tarifassurance
        if ((assure === "mutualiste" || assure === "preferentiel") && selectedAssurance) {
            //console.log("Recherche tarif assurance pour:", selectedAssurance);
            fetch(`/api/tarifs/${selectedAssurance}`)
                .then(res => res.json())
                .then((tarifs) => {
                    if (!Array.isArray(tarifs)) {
                        //console.log("Pas de tarifs trouvés");
                        setMontantAssurance(0);
                        return;
                    }
                    const tarif = tarifs.find((t: any) => t.acte === acte.designationacte);
                    if (tarif) {
                        // console.log("Tarif trouvé:", tarif);
                        if (assure === "mutualiste") setMontantAssurance(Math.round(tarif.prixmutuel ?? acte.prixMutuel ?? acte.prixClinique ?? 0));
                        else if (assure === "preferentiel") setMontantAssurance(Math.round(tarif.prixpreferenciel ?? acte.prixPreferentiel ?? acte.prixClinique ?? 0));
                    } else {
                        //console.log("Tarif non trouvé, utilisation prix acte");
                        if (assure === "mutualiste") setMontantAssurance(Math.round(acte.prixMutuel ?? acte.prixClinique ?? 0));
                        else if (assure === "preferentiel") setMontantAssurance(Math.round(acte.prixPreferentiel ?? acte.prixClinique ?? 0));
                    }
                })
                .catch((err) => {
                    //console.log("Erreur récupération tarifs:", err);
                    if (assure === "mutualiste") setMontantAssurance(Math.round(acte.prixMutuel ?? acte.prixClinique ?? 0));
                    else if (assure === "preferentiel") setMontantAssurance(Math.round(acte.prixPreferentiel ?? acte.prixClinique ?? 0));
                });
        } else {
            // console.log("Pas d'assurance ou patient non assuré, montant assurance = montant clinique");
            setMontantAssurance(Math.round(acte.prixClinique ?? 0));
        }
    }, [selectedActe, assure, actes, selectedAssurance]);

    useEffect(() => {
        const tauxNum = Number(taux) || 0;
        let montantAssur = montantAssurance;
        // Si le montant assurance n'est pas paramétré, on prend celui de la clinique
        if (!montantAssur || montantAssur === 0) montantAssur = montantClinique;

        // Calcul de la part de l'assurance (arrondi à l'entier)
        const partAssur = Math.round((montantAssur * tauxNum) / 100);
        const partPat = montantAssur - partAssur;

        // Calcul du surplus
        let surplusCalc = 0;
        if (montantClinique > montantAssur) surplusCalc = montantClinique - montantAssur;

        setSurplus(surplusCalc);
        setPartAssurance(partAssur);
        setPartPatient(partPat);
        setTotalPatient(partPat + surplusCalc);
    }, [montantClinique, montantAssurance, taux]);

    // Fonction pour charger une consultation par son Code_Prestation
    const loadConsultationByCode = async () => {
        if (!codePrestation.trim()) {
            setError("Veuillez entrer un code prestation");
            return;
        }

        setLoadingConsultation(true);
        setError("");
        setSuccess("");

        try {
            const res = await fetch(`/api/consultation/code?Code_Prestation=${encodeURIComponent(codePrestation.trim())}`);
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Consultation introuvable");

            if (data.length === 0) {
                throw new Error("Aucune consultation trouvée avec ce code");
            }

            const consultation = data[0];
            setCurrentConsultation(consultation);
            setConsultationLoaded(true);
            setSuccess(`✅ Consultation ${codePrestation} chargée avec succès`);
        } catch (e: any) {
            setError(e.message || "Erreur lors du chargement de la consultation");
            setConsultationLoaded(false);
            setCurrentConsultation(null);
        } finally {
            setLoadingConsultation(false);
        }
    };

    // Fonction pour charger une consultation par son ID
    const loadConsultationById = async (id: string) => {
        setLoadingConsultation(true);
        setError("");

        try {
            const res = await fetch(`/api/consultation/${id}`);
            const consultation = await res.json();

            if (!res.ok) throw new Error("Consultation introuvable");

            setCurrentConsultation(consultation);
            setConsultationLoaded(true);
        } catch (e: any) {
            setError(e.message || "Erreur lors du chargement");
            setConsultationLoaded(false);
            setCurrentConsultation(null);
        } finally {
            setLoadingConsultation(false);
        }
    };

    const handleSave = async () => {
        if (!currentConsultation?._id) {
            setError("Aucune consultation chargée. Veuillez d'abord charger une consultation.");
            return;
        }

        setError("");
        setSuccess("");
        setLoading(true);

        try {
            if (!recuPar) throw new Error("Utilisateur non reconnu.");

            const selectedActeDesignation =
                actes.find((a) => a._id === selectedActe)?.designationacte || "";

            const res = await fetch(`/api/consultation/${currentConsultation._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    selectedActe,
                    selectedMedecin,
                    assure,
                    taux,
                    matricule,
                    selectedAssurance,
                    montantClinique,
                    montantAssurance,
                    NumBon: numBon,
                    selectedActeDesignation,
                    Souscripteur: souscripteur,
                    SOCIETE_PATIENT: societePatient,
                    Recupar: recuPar,
                    IDPARTIENT: currentConsultation.IDPARTIENT,
                    Code_dossier: currentConsultation.Code_dossier,
                    Code_Prestation: currentConsultation.Code_Prestation,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erreur lors de la modification");

            setSuccess(`✅ Consultation ${codePrestation} modifiée avec succès`);
            setSaved(true);
        } catch (e: any) {
            setError(e.message || "Erreur inconnue");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="p-3 shadow-lg">
            <h3
                className="text-center text-white p-2 mb-3"
                style={{ background: "#FF6B35" }}
            >
                MODIFICATION FICHE CONSULTATION-VISITE
            </h3>

            {loadingConsultation && (
                <Alert variant="info" className="d-flex align-items-center gap-2">
                    <Spinner animation="border" size="sm" />
                    Chargement de la consultation...
                </Alert>
            )}

            <InfosPatientUpdate assure={assure} setAssure={setAssure} />

            {/* Affichage du Code Prestation si consultation chargée */}
            {consultationLoaded && codePrestation && (
                <Card className="mb-3 p-3 bg-info bg-opacity-10 border-info">
                    <Row>
                        <Col md={6}>
                            <Form.Label className="fw-bold">N° Prestation</Form.Label>
                            <Form.Control
                                type="text"
                                value={codePrestation}
                                readOnly
                                className="bg-white fw-bold"
                            />
                        </Col>
                    </Row>
                </Card>
            )}

            <Card className="p-3 mb-3 border-primary">
                <h6 className="text-primary mb-3">
                    <i className="bi bi-clipboard-pulse me-2"></i>
                    Détails de la Prestation
                </h6>
                <Row>
                    <Col md={5}>
                        <Form.Label className="fw-semibold">Choisir la prestation</Form.Label>
                        <Form.Select
                            value={selectedActe}
                            onChange={e => {
                                console.log("Acte sélectionné:", e.target.value);
                                setSelectedActe(e.target.value);
                            }}
                            size="lg"
                            className="border-primary"
                        >
                            <option value="">-- Sélectionner une prestation --</option>
                            {actes.length === 0 ? (
                                <option disabled>Chargement des actes...</option>
                            ) : (
                                actes.map((a) => (
                                    <option key={a._id} value={a._id}>{a.designationacte}</option>
                                ))
                            )}
                        </Form.Select>
                    </Col>
                    <Col md={2}>
                        <Form.Label className="fw-semibold">Montant Clinique</Form.Label>
                        <Form.Control
                            type="number"
                            value={montantClinique}
                            onChange={(e) => {
                                const newValue = Math.round(Number(e.target.value));
                                console.log("Montant clinique modifié manuellement:", newValue);
                                setMontantClinique(newValue);
                            }}
                            size="lg"
                            className="text-end fw-bold border-success"
                        />
                    </Col>
                    <Col md={2}>
                        <Form.Label className="fw-semibold">Montant Assurance</Form.Label>
                        <Form.Control
                            type="number"
                            value={montantAssurance}
                            onChange={(e) => {
                                const newValue = Math.round(Number(e.target.value));
                                console.log("Montant assurance modifié manuellement:", newValue);
                                setMontantAssurance(newValue);
                            }}
                            size="lg"
                            className="text-end fw-bold border-info"
                        />
                    </Col>
                    <Col md={3}>
                        <Form.Label className="fw-semibold">Médecin Prescripteur</Form.Label>
                        <Form.Select
                            value={selectedMedecin}
                            onChange={e => {
                                console.log("Médecin sélectionné:", e.target.value);
                                setSelectedMedecin(e.target.value);
                            }}
                            size="lg"
                        >
                            <option value="">-- Sélectionner --</option>
                            {medecinPrescripteur.map(m => (
                                <option key={m._id} value={m._id}>
                                    {m.nom} {m.prenoms}
                                </option>
                            ))}
                        </Form.Select>
                    </Col>
                </Row>
            </Card>

            <BlocAssuranceUpdate
                assure={assure}
                assurances={assurances}
                selectedAssurance={selectedAssurance}
                setSelectedAssurance={setSelectedAssurance}
                matricule={matricule}
                setMatricule={setMatricule}
                taux={taux}
                setTaux={setTaux}
                numBon={numBon}
                setNumBon={setNumBon}
                souscripteur={souscripteur}
                setSouscripteur={setSouscripteur}
                societePatient={societePatient}
                setSocietePatient={setSocietePatient}
            />

            <ResumeMontantsUpdate
                surplus={surplus}
                partAssurance={partAssurance}
                partPatient={partPatient}
                totalPatient={totalPatient}
            />

            {error && <div className="text-danger mb-2">{error}</div>}
            {success && <div className="text-success mb-2">{success}</div>}

            <div className="d-flex gap-2">
                <Button
                    variant="warning"
                    size="lg"
                    className="w-100 fw-bold"
                    disabled={loading || saved || !consultationLoaded}
                    onClick={handleSave}
                >
                    {loading ? "Modification en cours..." : "💾 Enregistrer les modifications"}
                </Button>

                {onClose && (
                    <Button
                        variant="secondary"
                        size="lg"
                        className="fw-bold"
                        onClick={onClose}
                    >
                        Fermer
                    </Button>
                )}
            </div>
        </Card>
    );
}