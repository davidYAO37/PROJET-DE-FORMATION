"use client";

import { useState, useEffect } from "react";
import { Container, Row, Col, Form } from "react-bootstrap";
import PatientInfo from "./components/PatientInfo";
import AssuranceInfo from "./components/AssuranceInfo";
import ActesTable from "./components/ActesTable";
import CliniqueInfo from "./components/CliniqueInfo";
import PaiementInfo from "./components/PaiementInfo";
import ActionsButtons from "./components/ActionsButtons";
import { defaultFormData, ExamenHospitalisationForm } from "@/types/examenHospitalisation";

export default function HospitalisationPage() {
    const [formData, setFormData] = useState<ExamenHospitalisationForm>(defaultFormData);

    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [typesActe, setTypesActe] = useState<{ _id: string; Designation: string }[]>([]);
    const [totaux, setTotaux] = useState({
        montantTotal: 0,
        partAssurance: 0,
        partAssure: 0,
        totalTaxe: 0,
        totalSurplus: 0,
        montantExecutant: 0,
        montantARegler: 0,
    });
    const [resetKey, setResetKey] = useState(0);
    const [codePrestation, setCodePrestation] = useState("");
    const [presetLines, setPresetLines] = useState<any[] | undefined>(undefined);

    async function loadLignesFromPrestation(code: string) {
        if (!code) {
            setPresetLines(undefined);
            return;
        }
        try {
            const res = await fetch(`/api/ligneprestation?codePrestation=${encodeURIComponent(code)}`);
            if (!res.ok) throw new Error("load lignes failed");
            const payload = await res.json();
            const lines = Array.isArray(payload?.data) ? payload.data : [];
            setPresetLines(lines);
            // Déclenche la réinit dans ActesTable et rechargement des lignes
            setResetKey((k) => k + 1);
        } catch (_) {
            setPresetLines(undefined);
            setResetKey((k) => k + 1);
        }
    }

    // Charger les types actes
    useEffect(() => {
        fetch("/api/typeacte")
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) setTypesActe(data);
            })
            .catch(() => setTypesActe([]));
    }, []);

    // Gestion des dates
    const handleDateChange = (field: "dateEntree" | "dateSortie", value: string) => {
        setFormData((prev) => {
            let nombreDeJours = prev.nombreDeJours;
            let dateEntree = prev.dateEntree;
            let dateSortie = prev.dateSortie;

            setErrorMessage(null);

            if (field === "dateEntree") {
                dateEntree = value;
                const dEntree = new Date(value);
                const dSortie = new Date(dateSortie);

                if (!isNaN(dEntree.getTime()) && !isNaN(dSortie.getTime())) {
                    if (dSortie < dEntree) {
                        setErrorMessage("❌ La date de sortie ne peut pas être avant la date d’entrée.");
                        dateSortie = "";
                        nombreDeJours = 0;
                    } else {
                        nombreDeJours =
                            Math.ceil((dSortie.getTime() - dEntree.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                    }
                }
            }

            if (field === "dateSortie") {
                dateSortie = value;
                const dEntree = new Date(dateEntree);
                const dSortie = new Date(value);

                if (!isNaN(dEntree.getTime()) && !isNaN(dSortie.getTime())) {
                    if (dSortie < dEntree) {
                        setErrorMessage("❌ La date de sortie ne peut pas être avant la date d’entrée.");
                        dateSortie = "";
                        nombreDeJours = 0;
                    } else {
                        nombreDeJours =
                            Math.ceil((dSortie.getTime() - dEntree.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                    }
                }
            }

            return {
                ...prev,
                dateEntree,
                dateSortie,
                nombreDeJours,
            };
        });
    };

    const handleNombreJoursChange = (value: number) => {
        setFormData((prev) => {
            let dateSortie = prev.dateSortie;
            const dEntree = new Date(prev.dateEntree);

            if (!isNaN(dEntree.getTime()) && value > 0) {
                const dSortie = new Date(dEntree);
                dSortie.setDate(dSortie.getDate() + value - 1);
                dateSortie = dSortie.toISOString().split("T")[0];
            }

            return {
                ...prev,
                nombreDeJours: value,
                dateSortie,
            };
        });
    };

    return (
        <Container fluid className="p-3">
            <h3 className="text-center text-primary mb-3">FICHE DE SAISIE {formData.typeacte}</h3>

            <Row>
                <Col md={3}>
                    <PatientInfo
                        formData={formData}
                        setFormData={setFormData}
                        onCodePrestationChange={(code) => {
                            setCodePrestation(code);
                            loadLignesFromPrestation(code);
                        }}
                    />
                    <AssuranceInfo formData={formData} setFormData={setFormData} />
                </Col>

                <Col md={9}>
                    <Form>
                        <Row className="mb-1">
                            <Col className="col-4">
                                <Form.Label>Nature Acte</Form.Label>
                                <Form.Select
                                    value={formData.typeacte || ""}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setFormData((prev) => ({
                                            ...prev,
                                            typeacte: value,
                                        }));
                                        // Réinitialiser la table et les totaux (RafrachirFenetre)
                                        setResetKey((k) => k + 1);
                                        setTotaux({
                                            montantTotal: 0,
                                            partAssurance: 0,
                                            partAssure: 0,
                                            totalTaxe: 0,
                                            totalSurplus: 0,
                                            montantExecutant: 0,
                                            montantARegler: 0,
                                        });
                                        setErrorMessage(null);
                                        setFormData((prev) => ({
                                            ...prev,
                                            factureTotal: 0,
                                            partAssurance: 0,
                                            partPatient: 0,
                                            surplus: 0,
                                            resteAPayer: 0,
                                        }));
                                        // Recharge les lignes si un code prestation est présent
                                        if (codePrestation) {
                                            loadLignesFromPrestation(codePrestation);
                                        }
                                    }}
                                >
                                    <option value="">--- Sélectionner ---</option>
                                    {typesActe.map((type) => (
                                        <option key={type._id} value={type.Designation}>
                                            {type.Designation}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Col>
                            <Col className="col-3">
                                <Form.Label>Entrée le</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={formData.dateEntree}
                                    onChange={(e) => handleDateChange("dateEntree", e.target.value)}
                                />
                            </Col>
                            <Col className="col-3">
                                <Form.Label>Sortie le</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={formData.dateSortie}
                                    onChange={(e) => handleDateChange("dateSortie", e.target.value)}
                                />
                            </Col>
                            <Col className="col-2">
                                <Form.Label>NB (Jrs)</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={formData.nombreDeJours}
                                    onChange={(e) => handleNombreJoursChange(parseInt(e.target.value))}
                                />
                            </Col>
                        </Row>

                        {errorMessage && <div className="alert alert-danger mt-2">{errorMessage}</div>}
                    </Form>
                    <Row>
                        <ActesTable
                            assuranceId={formData.Assure === "NON ASSURE" ? 1 : formData.Assure === "TARIF MUTUALISTE" ? 2 : 3}
                            saiTaux={formData.assurance.taux || 0}
                            assuranceDbId={formData.assurance.assuranceId || undefined}
                            externalResetKey={resetKey}
                            presetLines={presetLines}
                            onTotalsChange={(s) => {
                                setTotaux(s);
                                setFormData((prev) => ({
                                    ...prev,
                                    factureTotal: s.montantTotal,
                                    partAssurance: s.partAssurance,
                                    partPatient: s.partAssure,
                                    surplus: s.totalSurplus,
                                    resteAPayer: s.montantARegler,
                                }));
                            }}
                        />
                    </Row>
                    <Row>
                        <Col md={4}>
                            <CliniqueInfo formData={formData} setFormData={setFormData} />
                        </Col>
                        <Col md={8}>
                            <PaiementInfo formData={formData} setFormData={setFormData} />
                        </Col>
                    </Row>

                    <ActionsButtons
                        disabled={!!errorMessage}
                        onSubmit={async () => {
                            // validations principales
                            if (!formData.typeacte) {
                                alert("Associer la nature de l'acte SVP");
                                return;
                            }
                            if (!formData.dateEntree || !formData.dateSortie) {
                                alert("Veuillez saisir la date d'entrée et de sortie SVP");
                                return;
                            }

                            // Construire le header pour ExamenHospitalisation
                            const header = {
                                _id: undefined,
                                Code_Prestation: codePrestation || formData.patientId, // fallback si besoin
                                Rclinique: formData.renseignementclinique,
                                IDASSURANCE: formData.assurance.assuranceId || undefined,
                                IDSOCIETEASSUANCE: undefined,
                                Souscripteur: formData.assurance.adherent || "",
                                Taux: formData.assurance.taux || 0,
                                IDPARTIENT: formData.patientId || undefined,
                                Numcarte: formData.assurance.matricule || "",
                                NumBon: formData.assurance.numeroBon || "",
                                IDTYPE_ACTE: formData.typeacte || "",
                                Entrele: formData.dateEntree || undefined,
                                SortieLe: formData.dateSortie || undefined,
                                DureeE: formData.nombreDeJours || 0,
                                Designationtypeacte: formData.typeacte || "",
                                Modepaiement: undefined,
                                Assure: formData.Assure,
                                Payeoupas: false,
                                Restapayer: formData.resteAPayer || 0,
                                TotaleTaxe: 0,
                                Montanttotal: formData.factureTotal || 0,
                                Partassure: formData.partPatient || 0,
                                PartAssuranceP: formData.partAssurance || 0,
                            };

                            // Lignes depuis le composant ActesTable (on va recharger depuis l'endpoint si besoin)
                            const res = await fetch(`/api/ligneprestation?codePrestation=${encodeURIComponent(codePrestation)}`);
                            const payload = res.ok ? await res.json() : { data: [] };
                            const lignes = Array.isArray(payload?.data) ? payload.data : [];

                            const resp = await fetch('/api/examenhospitalisation', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ header, lignes }),
                            });
                            const out = await resp.json();
                            if (!resp.ok) {
                                alert(out?.error || 'Echec enregistrement');
                                return;
                            }
                            alert('Facture enregistrée.');
                        }}
                    />
                </Col>
            </Row>
        </Container>
    );
}
