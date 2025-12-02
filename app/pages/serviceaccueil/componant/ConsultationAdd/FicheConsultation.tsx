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

    const [souscripteur, setSouscripteur] = useState("");
    const [societePatient, setSocietePatient] = useState("");

    const [surplus, setSurplus] = useState<number>(0);
    const [partAssurance, setPartAssurance] = useState<number>(0);
    const [Partassure, setPartassure] = useState<number>(0);
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
        if (patient.TarifPatient === "Non Assuré") setAssure("non");
        else if (patient.TarifPatient === "Mutualiste") setAssure("mutualiste");
        else setAssure("preferentiel");

        setSelectedAssurance(patient.assurance || "");
        setMatricule(patient.Matricule || "");
        setTaux(patient.Taux ?? "");
        setSouscripteur(patient.Souscripteur || "");
        setSocietePatient(patient.SOCIETE_PATIENT || "");
    }, [patient]);

    // Effet pour vider ou afficher les champs selon le type d'assuré
    useEffect(() => {
        if (assure === "non") {
            setSelectedAssurance("");
            setMatricule("");
            setTaux("");
            setNumBon("");
            // Si vous avez souscripteur et sociétépatient, ajoutez ici :
            setSouscripteur("");
            setSocietePatient("");
        } else {
            // On peut pré-remplir si patient existe
            if (patient) {
                setSelectedAssurance(patient.IDASSURANCE || "");
                setMatricule(patient.Matricule || "");
                setTaux(patient.Taux ?? "");
                setSouscripteur(patient.Souscripteur || "");
                setSocietePatient(patient.SOCIETE_PATIENT || "");
            }
        }
    }, [assure, patient]);

    useEffect(() => {
        if (!selectedActe) return;
        const acte = actes.find((a) => a._id === selectedActe);
        if (!acte) return;

        // Montant clinique selon le type patient
        let montant = 0;
        if (assure === "mutualiste") montant = Math.round(acte.prixMutuel ?? acte.prixClinique ?? 0);
        else if (assure === "preferentiel") montant = Math.round(acte.prixPreferentiel ?? acte.prixClinique ?? 0);
        else montant = Math.round(acte.prixClinique ?? 0);
        setMontantClinique(montant);

        // Si patient mutualiste ou préférentiel, on cherche le tarif dans la collection tarifassurance
        if ((assure === "mutualiste" || assure === "preferentiel") && selectedAssurance) {
            fetch(`/api/tarifs/${selectedAssurance}`)
                .then(res => res.json())
                .then((tarifs) => {
                    if (!Array.isArray(tarifs)) { setMontantAssurance(0); return; }
                    const tarif = tarifs.find((t: any) => t.acte === acte.designationacte);
                    if (tarif) {
                        if (assure === "mutualiste") setMontantAssurance(Math.round(tarif.prixmutuel ?? acte.prixMutuel ?? acte.prixClinique ?? 0));
                        else if (assure === "preferentiel") setMontantAssurance(Math.round(tarif.prixpreferenciel ?? acte.prixPreferentiel ?? acte.prixClinique ?? 0));
                    } else {
                        if (assure === "mutualiste") setMontantAssurance(Math.round(acte.prixMutuel ?? acte.prixClinique ?? 0));
                        else if (assure === "preferentiel") setMontantAssurance(Math.round(acte.prixPreferentiel ?? acte.prixClinique ?? 0));
                    }
                })
                .catch(() => {
                    if (assure === "mutualiste") setMontantAssurance(Math.round(acte.prixMutuel ?? acte.prixClinique ?? 0));
                    else if (assure === "preferentiel") setMontantAssurance(Math.round(acte.prixPreferentiel ?? acte.prixClinique ?? 0));
                });
        } else {
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
        setPartassure(partPat);
        setTotalPatient(partPat + surplusCalc);
    }, [montantClinique, montantAssurance, taux]);

    const handleSave = async () => {
        setError("");
        setSuccess("");
        setLoading(true);
        try {
            if (!recuPar) throw new Error("Utilisateur non reconnu.");
            if (!patient?.Code_dossier) throw new Error("Patient invalide (code dossier manquant).");

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
                    Code_dossier: patient.Code_dossier,
                    NumBon: numBon,
                    Recupar: recuPar,
                    IdPatient: patient._id || "",
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
                NOUVELLE FICHE CONSULTATION-VISITE
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
                assure={assure}
            />

            <BlocAssurance
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

            <ResumeMontants
                surplus={surplus}
                partAssurance={partAssurance}
                Partassure={Partassure}
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
