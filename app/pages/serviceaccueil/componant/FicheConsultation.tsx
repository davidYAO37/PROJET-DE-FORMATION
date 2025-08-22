"use client";
import { useState, useEffect } from "react";
import { Button, Card } from "react-bootstrap";
import { Patient } from "@/types/patient";
import { Assurance } from "@/types/assurance";
import { Medecin } from "@/types/medecin";
import InfosPatient from "./InfosPatient";
import BlocActe from "./BlocActe";
import BlocAssurance from "./BlocAssurance";
import ResumeMontants from "./ResumeMontants";

type FicheConsultationProps = {
    patient: Patient | null;
    onClose?: () => void; // callback pour fermer le modal
};

export default function FicheConsultation({ patient, onClose }: FicheConsultationProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [saved, setSaved] = useState(false); // ✅ nouvel état

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

    const [surplus, setSurplus] = useState<number>(0);
    const [partAssurance, setPartAssurance] = useState<number>(0);
    const [partPatient, setPartPatient] = useState<number>(0);
    const [totalPatient, setTotalPatient] = useState<number>(0);

    const [numBon, setNumBon] = useState("");
    const [recuPar, setRecuPar] = useState("");

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
        if (!patient) return;
        if (patient.typevisiteur === "Non Assuré") setAssure("non");
        else if (patient.typevisiteur === "Mutualiste") setAssure("mutualiste");
        else setAssure("assure");

        setSelectedAssurance(patient.assurance || "");
        setMatricule(patient.matriculepatient || "");
        setTaux(patient.tauxassurance ?? "");
    }, [patient]);

    useEffect(() => {
        if (!selectedActe) return;
        const acte = actes.find((a) => a._id === selectedActe);
        if (!acte) return;

        setMontantClinique(acte.prixClinique ?? 0);
        if (assure === "mutualiste") setMontantAssurance(acte.prixMutuel ?? acte.prixClinique ?? 0);
        else if (assure === "assure") setMontantAssurance(acte.prixPreferentiel ?? acte.prixClinique ?? 0);
        else setMontantAssurance(acte.prixClinique ?? 0);
    }, [selectedActe, assure, actes]);

    useEffect(() => {
        const tauxNum = Number(taux) || 0;
        const surplusCalc = Math.max(0, montantClinique - montantAssurance);
        const partAssur = (tauxNum * montantAssurance) / 100;
        const partPat = montantAssurance - partAssur;

        setSurplus(surplusCalc);
        setPartAssurance(partAssur);
        setPartPatient(partPat);
        setTotalPatient(partPat + surplusCalc);
    }, [montantClinique, montantAssurance, taux]);

    const handleSave = async () => {
        setError("");
        setSuccess("");
        setLoading(true);
        try {
            if (!recuPar) throw new Error("Utilisateur non reconnu.");
            if (!patient?.codeDossier) throw new Error("Patient invalide (code dossier manquant).");

            const selectedActeDesignation =
                actes.find((a) => a._id === selectedActe)?.designationacte || "";

            const res = await fetch("/api/consultation", {
                method: "POST",
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
                    Code_dossier: patient.codeDossier,
                    NumBon: numBon,
                    Recupar: recuPar,
                    IDPARTIENT: patient._id || "",
                    selectedActeDesignation,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erreur enregistrement");

            const codePrestation = data.consultation?.Code_Prestation;
            setSuccess(
                codePrestation
                    ? `Consultation enregistrée avec succès ✅\nCode Prestation : ${codePrestation}`
                    : "Consultation enregistrée avec succès ✅"
            );
            setSaved(true); // ✅ consultation validée
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
                style={{ background: "#00AEEF" }}
            >
                NOUVELLE FICHE CONSULTATION
            </h3>

            <InfosPatient assure={assure} setAssure={setAssure} />

            <BlocActe
                actes={actes}
                selectedActe={selectedActe}
                setSelectedActe={setSelectedActe}
                montantClinique={montantClinique}
                setMontantClinique={setMontantClinique}
                montantAssurance={montantAssurance}
                setMontantAssurance={setMontantAssurance}
                medecinPrescripteur={medecinPrescripteur}
                selectedMedecin={selectedMedecin}
                setSelectedMedecin={setSelectedMedecin}
            />

            <BlocAssurance
                assure={assure}
                assurances={assurances}
                selectedAssurance={selectedAssurance}
                setSelectedAssurance={setSelectedAssurance}
                matricule={matricule}
                taux={taux}
                numBon={numBon}
                setNumBon={setNumBon}
            />

            <ResumeMontants
                surplus={surplus}
                partAssurance={partAssurance}
                partPatient={partPatient}
                totalPatient={totalPatient}
            />

            {error && <div className="text-danger mb-2">{error}</div>}
            {success && <div className="text-success mb-2">{success}</div>}

            <div className="d-flex gap-2">
                <Button
                    variant="primary"
                    size="lg"
                    className="w-100 fw-bold"
                    disabled={loading || saved} // ✅ désactiver si déjà sauvegardé
                    onClick={handleSave}
                >
                    {loading ? "Enregistrement..." : "Va à la caisse"}
                </Button>

                {saved && onClose && (
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
