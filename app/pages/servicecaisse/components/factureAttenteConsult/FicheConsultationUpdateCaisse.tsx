"use client";
import { useState, useEffect, useRef } from "react";
import { Button, Card, Alert, Spinner, Row, Col, Form, Modal } from "react-bootstrap";

import type { Patient } from "@/types/patient";
import type { Assurance } from "@/types/assurance";
import type { Medecin } from "@/types/medecin";
import type { ConsultationType } from "@/types/consultation";
import InfosPatientUpdateCaisse from "./InfosPatientUpdateCaisse";
import BlocAssuranceUpdateCaisse from "./BlocAssuranceUpdateCaisse";
import ResumeMontantsUpdateCaisse from "./ResumeMontantsUpdateCaisse";
import RecuConsultationPrint from "@/app/pages/MesImpressions/recusacte/RecuConsultationPrint";

type FicheConsultationUpdateProps = {
    patient: Patient | null;
    onClose?: () => void;
    consultationId?: string;
};

export default function FicheConsultationUpdateCaisse({ patient, onClose, consultationId }: FicheConsultationUpdateProps) {
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

    // État pour la modale d'impression
    const [showPrintModal, setShowPrintModal] = useState(false);
    const recuRef = useRef<HTMLDivElement>(null);

    const [surplus, setSurplus] = useState<number>(0);
    const [partAssurance, setPartAssurance] = useState<number>(0);
    const [Partassure, setPartassure] = useState<number>(0);
    const [totalPatient, setTotalPatient] = useState<number>(0);
    const [accepteSurplus, setAccepteSurplus] = useState<boolean>(true);
    const [idSocieteAssurance, setIdSocieteAssurance] = useState<string>("");

    const [numBon, setNumBon] = useState("");
    const [recuPar, setRecuPar] = useState("");
    const [CodePrestation, setCodePrestation] = useState("");

    // Nouveaux champs facturation
    const [montantEncaisse, setMontantEncaisse] = useState<number>(0);
    const [modePaiement, setModePaiement] = useState<string>("Espèce");
    const [reduction, setReduction] = useState<number>(0);
    const [motifRemise, setMotifRemise] = useState<string>("");

    // Fonction pour gérer le changement du montant encaissé avec la formule de calcul
    const handleMontantEncaisseChange = (value: number) => {
        const montantRegle = Math.max(0, (totalPatient || 0) - reduction);

        let encaisse = Math.max(0, value);

        if (encaisse > montantRegle && value !== montantRegle) {
            setMontantEncaisse(montantRegle);
            encaisse = montantRegle;
        } else {
            setMontantEncaisse(encaisse);
        }

        const reste = Math.max(0, montantRegle - encaisse);
        return reste;
    };

    useEffect(() => {
        const nom = localStorage.getItem("nom_utilisateur");
        if (nom) setRecuPar(nom);

        /* fetch("/api/actes") */
        fetch("/api/actes?consultationviste=true")
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
        if (currentConsultation) {
            setCodePrestation(currentConsultation.CodePrestation || "");

            // Mettre à jour l'état assure en fonction de la valeur de Assuré
            const nouvelAssure = currentConsultation.Assure === "NON ASSURE"
                ? "non"
                : currentConsultation.Assure === "TARIF MUTUALISTE"
                    ? "mutualiste"
                    : "preferentiel";

            setAssure(nouvelAssure);

            // Mettre à jour les autres états
            setSelectedActe(String(currentConsultation.IDACTE || ""));
            setSelectedMedecin(String(currentConsultation.IDMEDECIN || ""));
            setMontantClinique(Math.round(currentConsultation.PrixClinique || 0));
            setMontantAssurance(Math.round(currentConsultation.Prix_Assurance || 0));

            // Mettre à jour les champs d'assurance en fonction de l'état assure
            if (nouvelAssure !== "non") {
                setSelectedAssurance(String(currentConsultation.IDASSURANCE || ""));
                setMatricule(currentConsultation.numero_carte || "");
                setTaux(currentConsultation.tauxAssurance || "");
                setNumBon(currentConsultation.NumBon || "");
                setSouscripteur(currentConsultation.Souscripteur || "");
                setSocietePatient(currentConsultation.SOCIETE_PATIENT || "");
            } else {
                setSelectedAssurance("");
                setMatricule("");
                setTaux("");
                setNumBon("");
                setSouscripteur("");
                setSocietePatient("");
            }

            setAccepteSurplus((currentConsultation as any).accepteSurplus ?? true);
            setIdSocieteAssurance(currentConsultation.IDSOCIETEASSURANCE || "");
            setReduction(Number(currentConsultation.reduction ?? 0));
            setMotifRemise(currentConsultation.MotifRemise || "");

            // Appliquer la formule de calcul au montant encaisse chargé
            handleMontantEncaisseChange(currentConsultation.Montantencaisse || 0);
            setModePaiement(currentConsultation.Modepaiement || "Espèce");

            // Marquer comme chargé après avoir tout mis à jour
            setConsultationLoaded(true);
        }
    }, [currentConsultation, consultationLoaded]);

    useEffect(() => {
        if (consultationLoaded) return; // Ne pas écraser les données chargées

        if (assure === "non") {
            setSelectedAssurance("");
            setMatricule("");
            setTaux("");
            setNumBon("");
            setSouscripteur("");
            setSocietePatient("");
        } else if (patient) {
            setSelectedAssurance(patient.IDASSURANCE || "");
            setMatricule(patient.Matricule || "");
            setTaux(patient.Taux ?? "");
            setSouscripteur(patient.Souscripteur || "");
            setSocietePatient(patient.SOCIETE_PATIENT || "");
        }
    }, [assure, patient, consultationLoaded]);

    // Résoudre la politique de surplus selon la société ou l'assurance
    useEffect(() => {
        let cancelled = false;
        const resolveSurplus = async () => {
            if (assure === "non" || !selectedAssurance) {
                if (!cancelled) {
                    setAccepteSurplus(true);
                    setIdSocieteAssurance("");
                }
                return;
            }

            const consultationSocieteId = currentConsultation?.IDSOCIETEASSURANCE
                ? String(currentConsultation.IDSOCIETEASSURANCE)
                : "";
            const patientSocieteId = patient?.IDSOCIETEASSURANCE
                ? String(patient.IDSOCIETEASSURANCE)
                : "";
            const societeId = consultationSocieteId || patientSocieteId;

            if (societeId) {
                if (!cancelled) setIdSocieteAssurance(societeId);
                try {
                    const res = await fetch(`/api/societeassurance?societeId=${encodeURIComponent(societeId)}`);
                    if (res.ok) {
                        const societe = await res.json();
                        if (societe?.accepteSurplus !== null && societe?.accepteSurplus !== undefined) {
                            if (!cancelled) setAccepteSurplus(Boolean(societe.accepteSurplus));
                            return;
                        }
                    }
                } catch {
                }
            } else if (!cancelled) {
                setIdSocieteAssurance("");
            }

            const assurance = assurances.find(a => a._id === selectedAssurance);
            if (!cancelled) setAccepteSurplus(assurance?.accepteSurplus ?? true);
        };
        resolveSurplus();
        return () => {
            cancelled = true;
        };
    }, [assure, selectedAssurance, patient?.IDSOCIETEASSURANCE, currentConsultation?.IDSOCIETEASSURANCE, assurances]);

    useEffect(() => {
        let cancelled = false;
        const recalculateTarifs = async () => {
            if (!selectedActe) return;
            const acte = actes.find((a) => a._id === selectedActe);
            if (!acte) return;

            const prixActe = assure === "mutualiste"
                ? Math.round(acte.prixMutuel ?? acte.prixClinique ?? 0)
                : assure === "preferentiel"
                    ? Math.round(acte.prixPreferentiel ?? acte.prixClinique ?? 0)
                    : Math.round(acte.prixClinique ?? 0);

            let montantTarif = prixActe;
            if ((assure === "mutualiste" || assure === "preferentiel") && selectedAssurance) {
                const urls = [
                    ...(idSocieteAssurance
                        ? [`/api/tarifs-societe-assurance?societeAssuranceId=${encodeURIComponent(idSocieteAssurance)}`]
                        : []),
                    `/api/tarifs/${selectedAssurance}`,
                ];

                for (const url of urls) {
                    try {
                        const res = await fetch(url);
                        if (!res.ok) continue;
                        const tarifs = await res.json();
                        if (!Array.isArray(tarifs)) continue;
                        const tarif = tarifs.find((item: any) => item.acte === acte.designationacte);
                        if (!tarif) continue;
                        montantTarif = assure === "mutualiste"
                            ? Math.round(tarif.prixmutuel ?? prixActe)
                            : Math.round(tarif.prixpreferenciel ?? prixActe);
                        break;
                    } catch {
                    }
                }
            }

            if (cancelled) return;
            setMontantAssurance(montantTarif);
            setMontantClinique(accepteSurplus ? prixActe : montantTarif);
        };

        recalculateTarifs();
        return () => {
            cancelled = true;
        };
    }, [selectedActe, assure, actes, selectedAssurance, idSocieteAssurance, accepteSurplus]);

    useEffect(() => {
        const tauxNum = Number(taux) || 0;
        const estAssure = assure !== "non";
        // Pour un patient non assuré, la totalité du tarif clinique est à sa charge.
        // Pour une assurance/société, montantAssurance représente le tarif couvert.
        const montantAssur = estAssure
            ? (montantAssurance || montantClinique)
            : montantClinique;

        // Si le surplus n'est pas accepté, le montant clinique affiché/sauvegardé correspond au tarif assurance/société.
        // Sinon, on restaure le vrai montant clinique depuis l'acte.
        let effectiveMontantClinique = montantClinique;
        if (!accepteSurplus) {
            effectiveMontantClinique = montantAssur;
            if (montantClinique !== montantAssur) setMontantClinique(montantAssur);
        } else {
            const acte = actes.find((a) => a._id === selectedActe);
            if (acte) {
                if (assure === "mutualiste") effectiveMontantClinique = Math.round(acte.prixMutuel ?? acte.prixClinique ?? 0);
                else if (assure === "preferentiel") effectiveMontantClinique = Math.round(acte.prixPreferentiel ?? acte.prixClinique ?? 0);
                else effectiveMontantClinique = Math.round(acte.prixClinique ?? 0);
                if (montantClinique !== effectiveMontantClinique) setMontantClinique(effectiveMontantClinique);
            }
        }

        const montantCouvert = montantAssur;

        // Un patient non assuré ne bénéficie d'aucune part assurance.
        const partAssur = estAssure ? Math.round((montantCouvert * tauxNum) / 100) : 0;
        const partPat = montantCouvert - partAssur;

        // Calcul du surplus uniquement si accepté
        let surplusCalc = 0;
        if (accepteSurplus && effectiveMontantClinique > montantAssur) {
            surplusCalc = effectiveMontantClinique - montantAssur;
        }

        const baseTotalPatient = Math.max(0, partPat + surplusCalc);
        setSurplus(surplusCalc);
        setPartAssurance(partAssur);
        setPartassure(partPat);
        setTotalPatient(baseTotalPatient);
    }, [montantClinique, montantAssurance, taux, selectedAssurance, assurances, accepteSurplus, actes, selectedActe, assure]);

    useEffect(() => {
        const montantRegle = Math.max(0, totalPatient - reduction);
        if (montantEncaisse > montantRegle) {
            setMontantEncaisse(montantRegle);
        }
    }, [totalPatient, reduction, montantEncaisse]);

    const loadConsultationByCode = async () => {
        if (!CodePrestation.trim()) {
            setError("Veuillez entrer un code prestation");
            return;
        }
        setLoadingConsultation(true);
        setError("");
        setSuccess("");

        try {
            const res = await fetch(`/api/consultationFacture/code?CodePrestation=${encodeURIComponent(CodePrestation.trim())}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Consultation introuvable");
            if (data.length === 0) throw new Error("Aucune consultation trouvée avec ce code");
            setCurrentConsultation(data[0]);
            setConsultationLoaded(true);
            setSuccess(`✅ Consultation ${CodePrestation} chargée avec succès`);
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
            if (reduction !== 0 && !(motifRemise || "").trim()) {
                throw new Error("Veuillez saisir le motif de la remise SVP");
            }

            const montantRegle = Math.max(0, totalPatient - reduction);
            const resteAPayer = Math.max(0, montantRegle - montantEncaisse);
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
                    accepteSurplus,
                    idSocieteAssurance,
                    NumBon: numBon,
                    selectedActeDesignation,
                    Souscripteur: souscripteur,
                    SOCIETE_PATIENT: societePatient,
                    Recupar: recuPar,
                    IdPatient: currentConsultation.IdPatient,
                    Code_dossier: currentConsultation.Code_dossier,
                    CodePrestation: currentConsultation.CodePrestation,
                    reduction,
                    MotifRemise: motifRemise,

                    // Nouveaux champs facturation
                    Toutencaisse: toutEncaisse,
                    statutPrescriptionMedecin: 3,
                    DateFacturation: new Date(),
                    Caissiere: recuPar,
                    Modepaiement: modePaiement,
                    Montantencaisse: montantEncaisse,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erreur lors de la Facturation");

            setSuccess(`✅ Reçu ${currentConsultation.CodePrestation} enregistré avec succès`);
            setSaved(true);

            // Afficher la modale d'impression après un court délai
            setTimeout(() => {
                setShowPrintModal(true);
            }, 500);
        } catch (e: any) {
            setError(e.message || "Erreur inconnue");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="p-3 shadow-lg">
            <h3 className="text-center text-white p-2 mb-3" style={{ background: "#FF6B35" }}>
                FICHE  FACTURATION CONSULTATION-VISITE
            </h3>

            {loadingConsultation && (
                <Alert variant="info" className="d-flex align-items-center gap-2">
                    <Spinner animation="border" size="sm" />
                    Chargement de la consultation...
                </Alert>
            )}

            <InfosPatientUpdateCaisse assure={assure} setAssure={setAssure} />

            {consultationLoaded && CodePrestation && (
                <Card className="mb-3 p-3 bg-info bg-opacity-10 border-info">
                    <Row>
                        <Col md={6}>
                            <Form.Label className="fw-bold">N° Prestation</Form.Label>
                            <Form.Control type="text" value={CodePrestation} readOnly className="bg-white fw-bold" />
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

            <Card className="p-3 mb-3 border-warning">
                <Row className="g-3 align-items-end">
                    <Col md={3}>
                        <Form.Label className="fw-semibold">Reduction (FCFA)</Form.Label>
                        <Form.Control
                            type="number"
                            min={0}
                            value={reduction}
                            onChange={(e) => setReduction(Math.max(0, Number(e.target.value) || 0))}
                            size="lg"
                            className="text-end border-warning"
                        />
                    </Col>
                    <Col md={9}>
                        <Form.Label className="fw-semibold">Motif de Reduction</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={1}
                            value={motifRemise}
                            onChange={(e) => setMotifRemise(e.target.value)}
                            className="border-warning"
                        />
                    </Col>
                </Row>
            </Card>

            <ResumeMontantsUpdateCaisse
                surplus={surplus}
                partAssurance={partAssurance}
                Partassure={Partassure}
                totalPatient={totalPatient}
                reduction={reduction}
                montantEncaisse={montantEncaisse}
                setMontantEncaisse={setMontantEncaisse}
                modePaiement={modePaiement}
                setModePaiement={setModePaiement}
                patientId={patient?._id || currentConsultation?.IdPatient || ""}
            />

            {error && <div className="text-danger mb-2">{error}</div>}
            {success && <div className="text-success mb-2">{success}</div>}

            <div className="d-flex gap-2">
                <Button variant="warning" size="lg" className="w-100 fw-bold" disabled={loading || saved || !consultationLoaded} onClick={handleSave}>
                    {loading ? "Facturation en cours..." : "💾 Valider la Facture"}
                </Button>
                {onClose && (
                    <Button variant="secondary" size="lg" className="fw-bold" onClick={onClose}>
                        Fermer
                    </Button>
                )}
            </div>

            {/* Modal d'impression du reçu */}
            <Modal
                show={showPrintModal}
                onHide={() => setShowPrintModal(false)}
                size="lg"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>Reçu de consultation</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    {/* Zone imprimable */}
                    <div ref={recuRef} className="print-area">
                        {currentConsultation && (
                            <RecuConsultationPrint
                                consultation={{
                                    ...currentConsultation,
                                    designationC:
                                        actes.find(a => a._id === selectedActe)?.designationacte || "",
                                    Medecin:
                                        medecinPrescripteur.find(m => m._id === selectedMedecin)?.nom || "",
                                    Recupar: recuPar,
                                    CodePrestation: currentConsultation.CodePrestation || "",
                                    Code_dossier: currentConsultation.Code_dossier || "",
                                    PatientP: currentConsultation.PatientP || "",
                                    assurance: selectedAssurance
                                        ? assurances.find(a => a._id === selectedAssurance)
                                            ?.designationassurance || "NON ASSURE"
                                        : "NON ASSURE",
                                    tauxAssurance: Number(taux) || 0,
                                    numero_carte: matricule,
                                    PrixClinique: montantClinique,
                                    montantapayer: totalPatient,
                                    reduction,
                                    MotifRemise: motifRemise,
                                    PartAssurance: partAssurance,
                                    Date_consulation:
                                        currentConsultation.Date_consulation || new Date(),
                                    Restapayer: Math.max(0, totalPatient - reduction - montantEncaisse),
                                    Montantencaisse: montantEncaisse,
                                    NumBon: numBon,
                                    Modepaiement: modePaiement,
                                }}
                            />
                        )}
                    </div>
                </Modal.Body>

                <Modal.Footer>
                    {/* <Button variant="primary" onClick={() => {
                        if (recuRef.current) {
                            const printContents = recuRef.current.innerHTML;
                            const printWindow = window.open('', '', 'height=800,width=900');
                            if (printWindow) {
                                printWindow.document.write('<html><head><title>Reçu consultation</title></head><body>' + printContents + '</body></html>');
                                printWindow.document.close();
                                printWindow.focus();
                                printWindow.print();
                                printWindow.close();           
                            }
                        }
                    }}>Imprimer</Button> */}
                    <Button variant="secondary" onClick={() => setShowPrintModal(false)}>
                        Fermer
                    </Button>
                </Modal.Footer>

            </Modal>

        </Card>
    );
}
