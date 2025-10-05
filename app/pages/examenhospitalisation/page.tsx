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
    const [currentLignes, setCurrentLignes] = useState<any[]>([]);
    const [triggerRecalculation, setTriggerRecalculation] = useState(0);
    const [modeModification, setModeModification] = useState(false);
    const [examenHospitId, setExamenHospitId] = useState<string | undefined>(undefined);

    async function loadLignesFromPrestation(code: string) {
        if (!code) {
            setPresetLines(undefined);
            setModeModification(false);
            return;
        }
        try {
            const res = await fetch(`/api/ligneprestation?codePrestation=${encodeURIComponent(code)}`);
            if (!res.ok) throw new Error("load lignes failed");
            const payload = await res.json();
            const rawLines = Array.isArray(payload?.data) ? payload.data : [];
            
            // Si des lignes existent, on est en mode modification
            setModeModification(rawLines.length > 0);
            
            // Mapper les données de l'API vers le format attendu par ActesTable
            const mappedLines = rawLines.map((l: any) => ({
                DATE: l.dateLignePrestation ? new Date(l.dateLignePrestation).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
                Acte: l.prestation || "",
                Lettre_Cle: l.lettreCle || "",
                Coefficient: Number(l.coefficientActe ?? 1),
                QteP: Number(l.qte ?? 1),
                Coef_ASSUR: Number(l.reliquatCoefAssurance ?? 0),
                SURPLUS: Number(l.totalSurplus ?? 0),
                Prixunitaire: Number(l.prix ?? 0),
                TAXE: Number(l.taxe ?? 0),
                PrixTotal: Number(l.prixTotal ?? 0),
                PartAssurance: Number(l.partAssurance ?? 0),
                PartAssure: Number(l.partAssure ?? 0),
                IDTYPE: String(l.idTypeActe || ""),
                Reliquat: Number(l.reliquatPatient ?? 0),
                TotalRelicatCoefAssur: Number(l.totalCoefficient ?? 0),
                Montant_MedExecutant: Number(l.montantMedecinExecutant ?? 0),
                StatutMedecinActe: l.acteMedecin === "OUI" ? "OUI" : "NON",
                IDACTE: String(l.idActe || ""),
                Exclusion: l.exclusionActe === "Refuser" ? "Refuser" : "Accepter",
                COEFFICIENT_ASSURANCE: Number(l.coefficientAssur ?? 0),
                TARIF_ASSURANCE: Number(l.tarifAssurance ?? 0),
                IDHOSPO: String(l.idHospitalisation || ""),
                IDFAMILLE: String(l.idFamilleActeBiologie || ""),
                Refuser: Number(l.prixRefuse ?? 0),
                Accepter: Number(l.prixAccepte ?? 0),
                IDLignePrestation: String(l._id || ""),
                Statutprescription: Number(l.statutPrescriptionMedecin ?? 2),
                CoefClinique: Number(l.coefficientClinique ?? l.coefficientActe ?? 1),
                forfaitclinique: 0,
                ordonnancementAffichage: Number(l.ordonnancementAffichage ?? 0),
                Action: "",
            }));
            
            setPresetLines(mappedLines);
            // Déclenche la réinit dans ActesTable et rechargement des lignes
            setResetKey((k) => k + 1);
        } catch (_) {
            setPresetLines(undefined);
            setModeModification(false);
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
            <h3 className={`text-center mb-3 ${modeModification ? 'text-warning' : 'text-primary'}`}>
                {modeModification ? 'FICHE DE MODIFICATION' : 'FICHE DE SAISIE'} {formData.typeacte ? `---> ${formData.typeacte}` : ''}
            </h3>

            <Row>
                <Col md={3}>
                    <PatientInfo
                        formData={formData}
                        setFormData={setFormData}
                        onCodePrestationChange={(code) => {
                            setCodePrestation(code);
                            
                            // 1. Initialiser les dates à aujourd'hui
                            const today = new Date().toISOString().split('T')[0];
                            setFormData((prev) => ({
                                ...prev,
                                dateEntree: today,
                                dateSortie: today,
                                nombreDeJours: 1,
                            }));
                            
                            // Réinitialiser le mode modification
                            setModeModification(false);
                            setExamenHospitId(undefined);
                            setPresetLines([]);
                            setResetKey((k) => k + 1);
                        }}
                    />
                    <AssuranceInfo 
                        formData={formData} 
                        setFormData={setFormData}
                        currentLignes={currentLignes}
                        onRecalculateLines={() => {
                            // Déclencher le recalcul en changeant la clé
                            setTriggerRecalculation(prev => prev + 1);
                        }}
                    />
                </Col>

                <Col md={9}>
                    <Form>
                        <Row className="mb-1">
                            <Col xs={12} md={6} lg={4} className="mb-2">
                                <Form.Label>Nature Acte</Form.Label>
                                <Form.Select
                                    value={formData.typeacte || ""}
                                    onChange={async (e) => {
                                        const value = e.target.value;
                                        
                                        if (!value) {
                                            setFormData((prev) => ({ ...prev, typeacte: "" }));
                                            return;
                                        }
                                        
                                        // Mettre à jour le type d'acte
                                        setFormData((prev) => ({ ...prev, typeacte: value }));
                                        
                                        // 2. Rechercher l'examen avec Code_Prestation ET Designationtypeacte
                                        if (!codePrestation) {
                                            return;
                                        }
                                        
                                        try {
                                            const res = await fetch(`/api/examenhospitalisation?codePrestation=${encodeURIComponent(codePrestation)}&typeActe=${encodeURIComponent(value)}`);
                                            
                                            if (res.ok) {
                                                const data = await res.json();
                                                
                                                // 2.1 - SI TROUVÉ: Mode modification
                                                if (data && data._id) {
                                                    console.log("✅ Examen trouvé - Mode MODIFICATION", data._id);
                                                    setModeModification(true);
                                                    setExamenHospitId(data._id);
                                                    
                                                    // Charger les infos AssuranceInfo depuis examenHospit
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        typeacte: value,
                                                        // Assurance
                                                        Assure: data.Assure || prev.Assure,
                                                        assurance: {
                                                            ...prev.assurance,
                                                            assuranceId: data.IDASSURANCE || prev.assurance.assuranceId,
                                                            type: data.Assure || prev.assurance.type,
                                                            taux: data.Taux || prev.assurance.taux,
                                                            matricule: data.Numcarte || prev.assurance.matricule,
                                                            numeroBon: data.NumBon || prev.assurance.numeroBon,
                                                            societe: data.SocieteP || prev.assurance.societe,
                                                            numero: data.IDSOCIETEASSUANCE || prev.assurance.numero,
                                                            adherent: data.Souscripteur || prev.assurance.adherent,
                                                        },
                                                        // Médecin
                                                        medecinPrescripteur: data.Medecin || prev.medecinPrescripteur,
                                                        // Renseignement clinique
                                                        renseignementclinique: data.Rclinique || prev.renseignementclinique,
                                                        // Société patient
                                                        societePatient: data.SOCIETE_PATIENT || prev.societePatient,
                                                        // Dates
                                                        dateEntree: data.Entrele ? new Date(data.Entrele).toISOString().split('T')[0] : prev.dateEntree,
                                                        dateSortie: data.SortieLe ? new Date(data.SortieLe).toISOString().split('T')[0] : prev.dateSortie,
                                                        nombreDeJours: data.DureeE || prev.nombreDeJours,
                                                        // Montants
                                                        factureTotal: data.Montanttotal || 0,
                                                        partAssurance: data.PartAssuranceP || 0,
                                                        partPatient: data.Partassure || 0,
                                                        resteAPayer: data.Restapayer || 0,
                                                        surplus: data.TotalSurplus || 0,
                                                    }));
                                                    
                                                    // Charger les lignes prestation liées à cet examen
                                                    const resLignes = await fetch(`/api/ligneprestation?codePrestation=${encodeURIComponent(codePrestation)}&idHospitalisation=${encodeURIComponent(data._id)}`);
                                                    if (resLignes.ok) {
                                                        const payload = await resLignes.json();
                                                        const rawLines = Array.isArray(payload?.data) ? payload.data : [];
                                                        
                                                        // Mapper les lignes
                                                        const mappedLines = rawLines.map((l: any) => ({
                                                            DATE: l.dateLignePrestation ? new Date(l.dateLignePrestation).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
                                                            Acte: l.prestation || "",
                                                            Lettre_Cle: l.lettreCle || "",
                                                            Coefficient: Number(l.coefficientActe ?? 1),
                                                            QteP: Number(l.qte ?? 1),
                                                            Coef_ASSUR: Number(l.reliquatCoefAssurance ?? 0),
                                                            SURPLUS: Number(l.totalSurplus ?? 0),
                                                            Prixunitaire: Number(l.prix ?? 0),
                                                            TAXE: Number(l.taxe ?? 0),
                                                            PrixTotal: Number(l.prixTotal ?? 0),
                                                            PartAssurance: Number(l.partAssurance ?? 0),
                                                            PartAssure: Number(l.partAssure ?? 0),
                                                            IDTYPE: String(l.idTypeActe || ""),
                                                            Reliquat: Number(l.reliquatPatient ?? 0),
                                                            TotalRelicatCoefAssur: Number(l.totalCoefficient ?? 0),
                                                            Montant_MedExecutant: Number(l.montantMedecinExecutant ?? 0),
                                                            StatutMedecinActe: l.acteMedecin === "OUI" ? "OUI" : "NON",
                                                            IDACTE: String(l.idActe || ""),
                                                            Exclusion: l.exclusionActe === "Refuser" ? "Refuser" : "Accepter",
                                                            COEFFICIENT_ASSURANCE: Number(l.coefficientAssur ?? 0),
                                                            TARIF_ASSURANCE: Number(l.tarifAssurance ?? 0),
                                                            IDHOSPO: String(l.idHospitalisation || ""),
                                                            IDFAMILLE: String(l.idFamilleActeBiologie || ""),
                                                            Refuser: Number(l.prixRefuse ?? 0),
                                                            Accepter: Number(l.prixAccepte ?? 0),
                                                            IDLignePrestation: String(l._id || ""),
                                                            Statutprescription: Number(l.statutPrescriptionMedecin ?? 2),
                                                            CoefClinique: Number(l.coefficientClinique ?? l.coefficientActe ?? 1),
                                                            forfaitclinique: 0,
                                                            ordonnancementAffichage: Number(l.ordonnancementAffichage ?? 0),
                                                            Action: "",
                                                        }));
                                                        
                                                        setPresetLines(mappedLines);
                                                        setResetKey((k) => k + 1);
                                                    }
                                                } else {
                                                    // 2.2 - SI NON TROUVÉ: Mode création - Vider ActesTable, PaiementInfo, CliniqueInfo
                                                    console.log("ℹ️ Examen non trouvé - Mode CRÉATION");
                                                    setModeModification(false);
                                                    setExamenHospitId(undefined);
                                                    
                                                    // Vider uniquement les champs spécifiés
                                                    setPresetLines([]);
                                                    setCurrentLignes([]);
                                                    setResetKey((k) => k + 1);
                                                    
                                                    // Réinitialiser les totaux
                                                    setTotaux({
                                                        montantTotal: 0,
                                                        partAssurance: 0,
                                                        partAssure: 0,
                                                        totalTaxe: 0,
                                                        totalSurplus: 0,
                                                        montantExecutant: 0,
                                                        montantARegler: 0,
                                                    });
                                                    
                                                    // Réinitialiser les montants et infos cliniques/paiement
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        typeacte: value,
                                                        factureTotal: 0,
                                                        partAssurance: 0,
                                                        partPatient: 0,
                                                        surplus: 0,
                                                        resteAPayer: 0,
                                                        // Garder AssuranceInfo (déjà chargé depuis la consultation)
                                                        // Garder dateEntree et dateSortie (déjà initialisés à aujourd'hui)
                                                    }));
                                                }
                                            } else if (res.status === 404) {
                                                // 2.2 - Examen non trouvé: Mode création
                                                console.log("ℹ️ Examen non trouvé (404) - Mode CRÉATION");
                                                setModeModification(false);
                                                setExamenHospitId(undefined);
                                                
                                                // Vider ActesTable, PaiementInfo, CliniqueInfo
                                                setPresetLines([]);
                                                setCurrentLignes([]);
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
                                                
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    typeacte: value,
                                                    factureTotal: 0,
                                                    partAssurance: 0,
                                                    partPatient: 0,
                                                    surplus: 0,
                                                    resteAPayer: 0,
                                                }));
                                            }
                                        } catch (error) {
                                            console.error("Erreur lors de la recherche de l'examen:", error);
                                            // En cas d'erreur, mode création par défaut
                                            setModeModification(false);
                                            setExamenHospitId(undefined);
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
                            <Col xs={12} sm={6} md={4} lg={3} className="mb-2">
                                <Form.Label>Entrée le</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={formData.dateEntree}
                                    onChange={(e) => handleDateChange("dateEntree", e.target.value)}
                                />
                            </Col>
                            <Col xs={12} sm={6} md={4} lg={3} className="mb-2">
                                <Form.Label>Sortie le</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={formData.dateSortie}
                                    onChange={(e) => handleDateChange("dateSortie", e.target.value)}
                                />
                            </Col>
                            <Col xs={12} sm={6} md={4} lg={2} className="mb-2">
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
                            key={`actes-${resetKey}-${triggerRecalculation}`}
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
                            onLinesChange={(lignes) => {
                                setCurrentLignes(lignes);
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
                            if (!codePrestation) {
                                alert("Code prestation manquant. Veuillez vérifier la consultation.");
                                return;
                            }
                            if (!formData.typeacte) {
                                alert("Associer la nature de l'acte SVP");
                                return;
                            }
                            if (!formData.dateEntree || !formData.dateSortie) {
                                alert("Veuillez saisir la date d'entrée et de sortie SVP");
                                return;
                            }

                            // Vérifier qu'il y a des lignes
                            if (!currentLignes || currentLignes.length === 0) {
                                alert("Veuillez ajouter au moins une ligne de prestation");
                                return;
                            }

                            // Filtrer les lignes vides (celles qui n'ont pas d'acte sélectionné)
                            const lignesValides = currentLignes.filter(l => {
                                // Une ligne est valide si elle a un IDACTE (acte sélectionné)
                                return l.IDACTE && l.IDACTE.trim() !== "";
                            });
                            
                            if (lignesValides.length === 0) {
                                alert("Aucune ligne de prestation valide. Veuillez sélectionner des actes dans le tableau");
                                return;
                            }

                            // Construire le header pour ExamenHospitalisation
                            console.log("🔍 formData.patientId:", formData.patientId);
                            console.log("🔍 codePrestation:", codePrestation);
                            console.log("🔍 Mode modification:", modeModification);
                            console.log("🔍 examenHospitId:", examenHospitId);
                            
                            const header = {
                                _id: modeModification ? examenHospitId : undefined,
                                Code_Prestation: codePrestation || formData.patientId, // fallback si besoin
                                Rclinique: formData.renseignementclinique,
                                IDASSURANCE: formData.assurance.assuranceId || undefined,
                                IDSOCIETEASSUANCE: undefined,
                                Souscripteur: formData.assurance.adherent || "",
                                Taux: formData.assurance.taux || 0,
                                IDPARTIENT: formData.patientId,
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
                                SOCIETE_PATIENT: formData.societePatient || "",
                            };

                            // Utiliser les lignes actuelles du composant ActesTable
                            console.log("📤 Envoi des données:", { header, lignesCount: lignesValides.length });
                            
                            const resp = await fetch('/api/examenhospitalisation', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ header, lignes: lignesValides }),
                            });
                            const out = await resp.json();
                            
                            if (!resp.ok) {
                                console.error("❌ Erreur d'enregistrement:", out);
                                console.error("📊 Détails complets:", JSON.stringify(out, null, 2));
                                
                                // Afficher les détails des erreurs si disponibles
                                if (out.details && Array.isArray(out.details)) {
                                    console.error("🔍 Détails des erreurs:", out.details);
                                    const errorMsg = `${out.message}\n\nDétails:\n${out.details.map((d: any) => 
                                        `- Ligne ${d.ligne}: ${d.message}`
                                    ).join('\n')}\n\nSuccès: ${out.successCount}/${out.totalCount}`;
                                    alert(errorMsg);
                                } else {
                                    alert(out?.message || out?.error || 'Échec de l\'enregistrement');
                                }
                                return;
                            }
                            
                            console.log("✅ Enregistrement réussi:", out);
                            alert(out?.message || 'Facture enregistrée avec succès');
                        }}
                    />
                </Col>
            </Row>
        </Container>
    );
}
