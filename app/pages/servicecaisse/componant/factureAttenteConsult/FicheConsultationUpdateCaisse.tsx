"use client";
import { useState, useEffect } from "react";
import { Button, Card, Alert, Spinner, Row, Col, Form } from "react-bootstrap";
import type { Patient } from "@/types/patient";
import type { Assurance } from "@/types/assurance";
import type { Medecin } from "@/types/medecin";
import type { ConsultationType } from "@/types/consultation";
import InfosPatientUpdateCaisse from "./InfosPatientUpdateCaisse";
import BlocAssuranceUpdateCaisse from "./BlocAssuranceUpdateCaisse";
import ResumeMontantsUpdateCaisse from "./ResumeMontantsUpdateCaisse";

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

    // Nouveaux champs facturation
    const [montantEncaisse, setMontantEncaisse] = useState<number>(0);
    const [modePaiement, setModePaiement] = useState<string>("Espèce");

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

    useEffect(() => {
        if (consultationId) loadConsultationById(consultationId);
    }, [consultationId]);

    useEffect(() => {
        if (currentConsultation && consultationLoaded) {
            setCodePrestation(currentConsultation.Code_Prestation || "");
            if (currentConsultation.Assuré === "NON ASSURE") setAssure("non");
            else if (currentConsultation.Assuré === "TARIF MUTUALISTE") setAssure("mutualiste");
            else setAssure("preferentiel");

            setSelectedActe(String(currentConsultation.IDACTE || ""));
            setSelectedMedecin(String(currentConsultation.IDMEDECIN || ""));
            setMontantClinique(Math.round(currentConsultation.PrixClinique || 0));
            setMontantAssurance(Math.round(currentConsultation.Prix_Assurance || 0));
            setSelectedAssurance(String(currentConsultation.IDASSURANCE || ""));
            setMatricule(currentConsultation.numero_carte || "");
            setTaux(currentConsultation.tauxAssurance || "");
            setNumBon(currentConsultation.NumBon || "");
            setSouscripteur(currentConsultation.Souscripteur || "");
            setSocietePatient(currentConsultation.SOCIETE_PATIENT || "");
            setMontantEncaisse(currentConsultation.Montantencaisse || 0);
            setModePaiement(currentConsultation.Modepaiement || "Espèce");
        }
    }, [currentConsultation, consultationLoaded]);

    useEffect(() => {
        if (assure === "non") {
            setSelectedAssurance("");
            setMatricule("");
            setTaux("");
            setNumBon("");
            setSouscripteur("");
            setSocietePatient("");
        } else if (!consultationLoaded && patient) {
            setSelectedAssurance(patient.IDASSURANCE || "");
            setMatricule(patient.Matricule || "");
            setTaux(patient.Taux ?? "");
            setSouscripteur(patient.Souscripteur || "");
            setSocietePatient(patient.SOCIETE_PATIENT || "");
        }
    }, [assure, patient, consultationLoaded]);

    useEffect(() => {
        if (!selectedActe) return;
        const acte = actes.find((a) => a._id === selectedActe);
        if (!acte) return;

        let montant = 0;
        if (assure === "mutualiste") montant = Math.round(acte.prixMutuel ?? acte.prixClinique ?? 0);
        else if (assure === "preferentiel") montant = Math.round(acte.prixPreferentiel ?? acte.prixClinique ?? 0);
        else montant = Math.round(acte.prixClinique ?? 0);

        setMontantClinique(montant);

        if ((assure === "mutualiste" || assure === "preferentiel") && selectedAssurance) {
            fetch(`/api/tarifs/${selectedAssurance}`)
                .then(res => res.json())
                .then((tarifs) => {
                    if (!Array.isArray(tarifs)) {
                        setMontantAssurance(0);
                        return;
                    }
                    const tarif = tarifs.find((t: any) => t.acte === acte.designationacte);
                    if (tarif) {
                        if (assure === "mutualiste") setMontantAssurance(Math.round(tarif.prixmutuel ?? acte.prixMutuel ?? acte.prixClinique ?? 0));
                        else setMontantAssurance(Math.round(tarif.prixpreferenciel ?? acte.prixPreferentiel ?? acte.prixClinique ?? 0));
                    } else {
                        if (assure === "mutualiste") setMontantAssurance(Math.round(acte.prixMutuel ?? acte.prixClinique ?? 0));
                        else setMontantAssurance(Math.round(acte.prixPreferentiel ?? acte.prixClinique ?? 0));
                    }
                })
                .catch(() => {
                    if (assure === "mutualiste") setMontantAssurance(Math.round(acte.prixMutuel ?? acte.prixClinique ?? 0));
                    else setMontantAssurance(Math.round(acte.prixPreferentiel ?? acte.prixClinique ?? 0));
                });
        } else setMontantAssurance(Math.round(acte.prixClinique ?? 0));
    }, [selectedActe, assure, actes, selectedAssurance]);

    useEffect(() => {
        const tauxNum = Number(taux) || 0;
        let montantAssur = montantAssurance;
        if (!montantAssur || montantAssur === 0) montantAssur = montantClinique;

        const partAssur = Math.round((montantAssur * tauxNum) / 100);
        const partPat = montantAssur - partAssur;
        let surplusCalc = 0;
        if (montantClinique > montantAssur) surplusCalc = montantClinique - montantAssur;

        setSurplus(surplusCalc);
        setPartAssurance(partAssur);
        setPartPatient(partPat);
        setTotalPatient(partPat + surplusCalc);
    }, [montantClinique, montantAssurance, taux]);

    const loadConsultationByCode = async () => {
        if (!codePrestation.trim()) {
            setError("Veuillez entrer un code prestation");
            return;
        }
        setLoadingConsultation(true);
        setError("");
        setSuccess("");

        try {
            const res = await fetch(`/api/consultationFacture/code?Code_Prestation=${encodeURIComponent(codePrestation.trim())}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Consultation introuvable");
            if (data.length === 0) throw new Error("Aucune consultation trouvée avec ce code");
            setCurrentConsultation(data[0]);
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

    const loadConsultationById = async (id: string) => {
        setLoadingConsultation(true);
        setError("");
        try {
            const res = await fetch(`/api/consultationFacture/${id}`);
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

            // Calcul Toutencaisse
            const resteAPayer = totalPatient - montantEncaisse;
            const toutEncaisse = resteAPayer <= 0;

            const selectedActeDesignation = actes.find((a) => a._id === selectedActe)?.designationacte || "";

            const res = await fetch(`/api/consultationFacture/${currentConsultation._id}`, {
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

                    // Nouveaux champs facturation
                    Toutencaisse: toutEncaisse,
                    StatutPrescriptionMedecin: 3,
                    DateFacturation: new Date(),
                    FacturéPar: recuPar,
                    Modepaiement: modePaiement,
                    Montantencaisse: montantEncaisse,
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
            <h3 className="text-center text-white p-2 mb-3" style={{ background: "#FF6B35" }}>
                MODIFICATION FICHE CONSULTATION-VISITE
            </h3>

            {loadingConsultation && (
                <Alert variant="info" className="d-flex align-items-center gap-2">
                    <Spinner animation="border" size="sm" />
                    Chargement de la consultation...
                </Alert>
            )}

            <InfosPatientUpdateCaisse assure={assure} setAssure={setAssure} />

            {consultationLoaded && codePrestation && (
                <Card className="mb-3 p-3 bg-info bg-opacity-10 border-info">
                    <Row>
                        <Col md={6}>
                            <Form.Label className="fw-bold">N° Prestation</Form.Label>
                            <Form.Control type="text" value={codePrestation} readOnly className="bg-white fw-bold" />
                        </Col>
                    </Row>
                </Card>
            )}

            <Card className="p-3 mb-3 border-primary">
                <h6 className="text-primary mb-3">
                    <i className="bi bi-clipboard-pulse me-2"></i>Détails de la Prestation
                </h6>
                <Row>
                    <Col md={5}>
                        <Form.Label className="fw-semibold">Choisir la prestation</Form.Label>
                        <Form.Select value={selectedActe} onChange={e => setSelectedActe(e.target.value)} size="lg" className="border-primary">
                            <option value="">-- Sélectionner une prestation --</option>
                            {actes.map((a) => (
                                <option key={a._id} value={a._id}>{a.designationacte}</option>
                            ))}
                        </Form.Select>
                    </Col>
                    <Col md={2}>
                        <Form.Label className="fw-semibold">Montant Clinique</Form.Label>
                        <Form.Control type="number" value={montantClinique} onChange={e => setMontantClinique(Math.round(Number(e.target.value)))} size="lg" className="text-end fw-bold border-success" />
                    </Col>
                    <Col md={2}>
                        <Form.Label className="fw-semibold">Montant Assurance</Form.Label>
                        <Form.Control type="number" value={montantAssurance} onChange={e => setMontantAssurance(Math.round(Number(e.target.value)))} size="lg" className="text-end fw-bold border-info" />
                    </Col>
                    <Col md={3}>
                        <Form.Label className="fw-semibold">Médecin Prescripteur</Form.Label>
                        <Form.Select value={selectedMedecin} onChange={e => setSelectedMedecin(e.target.value)} size="lg">
                            <option value="">-- Sélectionner --</option>
                            {medecinPrescripteur.map(m => (
                                <option key={m._id} value={m._id}>{m.nom} {m.prenoms}</option>
                            ))}
                        </Form.Select>
                    </Col>
                </Row>
            </Card>

            <BlocAssuranceUpdateCaisse
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

            <ResumeMontantsUpdateCaisse
                surplus={surplus}
                partAssurance={partAssurance}
                partPatient={partPatient}
                totalPatient={totalPatient}
                montantEncaisse={montantEncaisse}
                setMontantEncaisse={setMontantEncaisse}
                modePaiement={modePaiement}
                setModePaiement={setModePaiement}
            />

            {error && <div className="text-danger mb-2">{error}</div>}
            {success && <div className="text-success mb-2">{success}</div>}

            <div className="d-flex gap-2">
                <Button variant="warning" size="lg" className="w-100 fw-bold" disabled={loading || saved || !consultationLoaded} onClick={handleSave}>
                    {loading ? "Modification en cours..." : "💾 Enregistrer les modifications"}
                </Button>
                {onClose && (
                    <Button variant="secondary" size="lg" className="fw-bold" onClick={onClose}>
                        Fermer
                    </Button>
                )}
            </div>
        </Card>
    );
}
