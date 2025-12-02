"use client";

import { useState, useEffect } from "react";
import { Container, Row, Col, Form } from "react-bootstrap";
import { defaultFormData, ExamenHospitalisationForm, } from "@/types/examenHospitalisation";
import PatientInfoCaisse from "./PatientInfoCaisse";
import AssuranceInfoCaisse from "./AssuranceInfoCaisse";
import TablePrestationsCaisse from "./ActesTableCaisse";
import CliniqueInfoCaisse from "./CliniqueInfoCaisse";
import ActionsButtonsCaisse from "./ActionsButtonsCaisse";
import PaiementInfoCaisse from "./PaiementInfoCaisse";

export type HospitalisationPageCaisseProps = {
  Code_Prestation?: string;
  Designationtypeacte?: string;
  PatientP: string;
  examenHospitId?: string;
};

export default function HospitalisationPageCaisse(
  props: HospitalisationPageCaisseProps & Record<string, unknown>
) {
  const {
    Code_Prestation = "",
    Designationtypeacte = "",
    PatientP = "",
    examenHospitId: propExamenHospitId = "",
  } = (props as HospitalisationPageCaisseProps) || {};

  const [formData, setFormData] = useState<ExamenHospitalisationForm>({
    ...defaultFormData,
    Code_Prestation: Code_Prestation || "",
    typeacte: Designationtypeacte || "",
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [typesActe, setTypesActe] = useState<
    { _id: string; Designation: string }[]
  >([]);
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
  const [examenHospitId, setExamenHospitId] = useState<string | undefined>(
    propExamenHospitId || undefined
  );
  const [modePaiement, setModePaiement] = useState<string>("");
  const [montantEncaisse, setMontantEncaisse] = useState<number>(0);
  const [recuPar, setRecuPar] = useState("");
  const [initialPatientP, setInitialPatientP] = useState(PatientP || "");

  useEffect(() => {
    const nom = localStorage.getItem("nom_utilisateur");
    if (nom) setRecuPar(nom);

    setExamenHospitId(propExamenHospitId || undefined);
    setCodePrestation(Code_Prestation || "");
    setModePaiement("");
    setMontantEncaisse(0);
    if (Code_Prestation) {
      loadLignesFromPrestation(Code_Prestation, propExamenHospitId);
    } else {
      setPresetLines(undefined);
      setModeModification(false);
    }
  }, [Code_Prestation, propExamenHospitId]);

  useEffect(() => {
    const reduction = formData.reduction || 0;
    const montantRegle = Math.max(0, (totaux.montantARegler || 0) - reduction);
    let encaisse = Math.max(0, montantEncaisse);

    if (encaisse > montantRegle && montantEncaisse !== montantRegle) {
      setMontantEncaisse(montantRegle);
      encaisse = montantRegle;
    }

    const reste = Math.max(0, montantRegle - encaisse);

    setFormData((prev) => {
      if (
        prev.resteAPayer === reste &&
        prev.TotalapayerPatient === montantRegle
      ) {
        return prev;
      }
      return {
        ...prev,
        resteAPayer: reste,
        TotalapayerPatient: montantRegle,
      };
    });
  }, [totaux.montantARegler, formData.reduction, montantEncaisse]);

  async function loadLignesFromPrestation(
    code: string,
    idHospitalisation?: string
  ) {
    if (!code) {
      setPresetLines(undefined);
      setModeModification(false);
      return;
    }
    try {
      let url = `/api/ligneprestationFacture?codePrestation=${encodeURIComponent(
        code
      )}`;
      if (idHospitalisation) {
        url += `&idHospitalisation=${encodeURIComponent(idHospitalisation)}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error("load lignes failed");
      const payload = await res.json();
      const rawLines = Array.isArray(payload?.data) ? payload.data : [];

      setModeModification(rawLines.length > 0);

      const mappedLines = rawLines.map((l: any) => ({
        DATE: l.dateLignePrestation
          ? new Date(l.dateLignePrestation).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
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
    } catch (_) {
      setPresetLines(undefined);
      setModeModification(false);
      setResetKey((k) => k + 1);
      setModePaiement("");
      setMontantEncaisse(0);
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
        factureTotal: 0,
        partAssurance: 0,
        Partassure: 0,
        surplus: 0,
        resteAPayer: 0,
        TotalapayerPatient: 0,
      }));
    }
  }

  useEffect(() => {
    fetch("/api/typeacte")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setTypesActe(data);
      })
      .catch(() => setTypesActe([]));
  }, []);

  const handleDateChange = (
    field: "dateEntree" | "dateSortie",
    value: string
  ) => {
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
            setErrorMessage(
              "❌ La date de sortie ne peut pas être avant la date d’entrée."
            );
            dateSortie = "";
            nombreDeJours = 0;
          } else {
            nombreDeJours =
              Math.ceil(
                (dSortie.getTime() - dEntree.getTime()) / (1000 * 60 * 60 * 24)
              ) + 1;
          }
        }
      }

      if (field === "dateSortie") {
        dateSortie = value;
        const dEntree = new Date(dateEntree);
        const dSortie = new Date(value);

        if (!isNaN(dEntree.getTime()) && !isNaN(dSortie.getTime())) {
          if (dSortie < dEntree) {
            setErrorMessage(
              "❌ La date de sortie ne peut pas être avant la date d’entrée."
            );
            dateSortie = "";
            nombreDeJours = 0;
          } else {
            nombreDeJours =
              Math.ceil(
                (dSortie.getTime() - dEntree.getTime()) / (1000 * 60 * 60 * 24)
              ) + 1;
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

  // -----------------------------
  // Ici : fonction qui applique la logique WinDev
  // -----------------------------
  const enregistrerFacture = async (): Promise<void> => {
    setErrorMessage(null);

    // Basic validations
    if (!formData.patientId && !formData.IdPatient && !formData.PatientP) {
      throw new Error("Le patient est requis pour enregistrer la facture.");
    }

    // On considère que : examenHospitId (state) indique une prestation existante (modeModification)
    const hospitalisationId = examenHospitId;
    let usedHospitalisationId = hospitalisationId;

    try {
      // DETERMINE SI EXISTE DEJA (modeModification déjà géré par le composant, mais double-check)
      let exists = false;
      if (usedHospitalisationId) {
        exists = true;
      } else {
        // Optionnel: vérifier via API si un examen existe pour ce code prestation + type d'acte
        if (codePrestation) {
          const checkRes = await fetch(
            `/api/examenhospitalisationFacture?codePrestation=${encodeURIComponent(
              codePrestation
            )}&typeActe=${encodeURIComponent(formData.typeacte || "")}`
          );
          if (checkRes.ok) {
            const found = await checkRes.json();
            if (found && found._id) {
              usedHospitalisationId = found._id;
              exists = true;
              setModeModification(true);
              setExamenHospitId(found._id);
            }
          }
        }
      }

      // Préparer payload hospitalisation depuis formData & totaux
      const hospPayload: any = {
        PatientP: formData.PatientP || "",
        IdPatient: formData.patientId || formData.IdPatient || undefined,
        DatePres: formData.dateEntree || new Date().toISOString(),
        Rclinique: formData.renseignementclinique || "",
        Montanttotal: totaux.montantTotal || formData.factureTotal || 0,
        MontantRecu: montantEncaisse || formData.MontantRecu || 0,
        TotalapayerPatient: formData.TotalapayerPatient || totaux.montantARegler || 0,
        PartAssuranceP: totaux.partAssurance || formData.partAssurance || 0,
        Partassure: totaux.partAssure || formData.Partassure || 0,
        Assure: formData.Assure || formData.assurance?.type || "",
        IDASSURANCE: formData.assurance?.assuranceId || formData.IDASSURANCE || undefined,
        IDSOCIETEASSURANCE: formData.assurance?.societe || undefined,
        Souscripteur: formData.assurance?.adherent || formData.Souscripteur || "",
        SOCIETE_PATIENT: formData.societePatient || formData.SOCIETE_PATIENT || "",
        TotalPaye: formData.TotalPaye || montantEncaisse || 0,
        Restapayer: formData.resteAPayer || 0,
        Taux: formData.assurance?.taux || formData.Taux || 0,
        NumBon: formData.numeroBon || formData.NumBon || "",
        NomMed: formData.medecinPrescripteur || formData.NomMed || "",
        Code_Prestation: codePrestation || formData.Code_Prestation || "",
        reduction: formData.reduction || 0,
        TotaleTaxe: totaux.totalTaxe || 0,
        SaisiPar: recuPar || undefined,
        Numcarte: formData.assurance?.matricule || formData.Numcarte || "",
        IDTYPE_ACTE: formData.typeacte || formData.IDTYPE_ACTE || undefined,
        Entrele: formData.dateEntree || undefined,
        SortieLe: formData.dateSortie || undefined,
        DureeE: formData.nombreDeJours || undefined,
        Designationtypeacte: formData.typeacte || formData.Designationtypeacte || "",
        Assurance: formData.assurance?.type || "",
        Payeoupas: formData.Payeoupas ?? true,
        StatutLaboratoire: 1,
        TotalReliquatPatient: totaux.totalSurplus || formData.TotalReliquatPatient || 0,
        StatutPrescriptionMedecin: 3,
        StatutPaiement: formData.StatutPaiement || "Facture Payée",
        MotifRemise: formData.MotifRemise || "",
        tauxreduction: formData.tauxreduction || 0,
        Modepaiement: modePaiement || formData.Modepaiement || "",
        MontantMedecin: totaux.montantExecutant || formData.MontantMedecinExécutant || 0,
        idMedecin: formData.medecinId || undefined,
      };

      // CAS 1 : création si n'existe pas
      if (!exists) {
        const createHospRes = await fetch("/api/examenhospitalisationFacture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(hospPayload),
        });

        const createdHosp = await createHospRes.json();
        if (!createHospRes.ok) {
          throw new Error(
            createdHosp?.message || "Erreur création hospitalisation"
          );
        }
        usedHospitalisationId = createdHosp._id;
        setExamenHospitId(createdHosp._id);
        setModeModification(true);
      } else {
        // CAS 2 : update hospitalisation (si on a un id)
        if (usedHospitalisationId) {
          const updateHospRes = await fetch(
            `/api/examenhospitalisationFacture/${encodeURIComponent(
              usedHospitalisationId
            )}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(hospPayload),
            }
          );
          if (!updateHospRes.ok) {
            const err = await updateHospRes.json().catch(() => ({}));
            throw new Error(
              err?.message || "Erreur mise à jour hospitalisation"
            );
          }
        }
      }

      // Ensuite : créer une FACTURATION (toujours créé selon ton WinDev)
      const facturePayload: any = {
        Code_Prestation: codePrestation || formData.Code_Prestation || "",
        PatientP: formData.PatientP || "",
        DatePres: formData.dateEntree || new Date().toISOString(),
        Montanttotal: totaux.montantTotal || formData.factureTotal || 0,
        MontantRecu: montantEncaisse || 0,
        TotalapayerPatient: formData.TotalapayerPatient || totaux.montantARegler || 0,
        PartAssuranceP: totaux.partAssurance || 0,
        Partassure: totaux.partAssure || 0,
        IDSOCIETEASSURANCE: formData.assurance?.assuranceId || undefined,
        NomMed: formData.medecinPrescripteur || "",
        IDTYPE_ACTE: formData.typeacte || undefined,
        Entrele: formData.dateEntree || undefined,
        SortieLe: formData.dateSortie || undefined,
        DureeE: formData.nombreDeJours || undefined,
        Désignationtypeacte: formData.typeacte || "",
        StatutPaiement: formData.StatutPaiement || "Facture Payée",
        idHospitalisation: usedHospitalisationId,
        MontantMedecinExécutant: totaux.montantExecutant || 0,
        SaisiPar: recuPar || undefined,
        Rclinique: formData.renseignementclinique,
        reduction: formData.reduction || "",
        MotifRemise: formData.MotifRemise || "",
        Restapayer: formData.resteAPayer


      };

      const createFactRes = await fetch("/api/facturation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(facturePayload),
      });

      const createdFact = await createFactRes.json();
      if (!createFactRes.ok) {
        throw new Error(createdFact?.message || "Erreur création facture");
      }

      const factureId = createdFact._id;

      // ----- LIGNES -----
      // currentLignes provient du composant TablePrestationsCaisse (format interne)
      // Pour chaque ligne : si IDLignePrestation => PUT (modifier), sinon POST (créer)
      const promises: Promise<any>[] = [];

      for (const line of currentLignes) {
        // construire payload ligne utilisable par l'API
        const lignePayload: any = {
          codePrestation: codePrestation || formData.Code_Prestation || "",
          prestation: line.Acte || "",
          qte: Number(line.QteP || 1),
          prix: Number(line.Prixunitaire || 0),
          partAssurance: Number(line.PartAssurance || 0),
          partAssure: Number(line.PartAssure || 0),
          IdPatient: formData.patientId || formData.IdPatient || undefined,
          idHospitalisation: usedHospitalisationId,
          prixTotal: Number(
            line.PrixTotal || (line.Prixunitaire || 0) * (line.QteP || 1)
          ),
          coefficientActe: Number(line.Coefficient || 1),
          reliquatCoefAssurance: Number(line.Coef_ASSUR || 0),
          lettreCle: line.Lettre_Cle || "",
          taxe: Number(line.TAXE || 0),
          idTypeActe: line.IDTYPE || undefined,
          idActe: line.IDACTE || undefined,
          reliquatPatient: Number(line.Reliquat || 0),
          totalCoefficient: Number(line.TotalRelicatCoefAssur || 0),
          prixClinique: Number(line.SURPLUS || 0),
          numMedecinExecutant: line.NummedecinExécutant || "",
          montantMedecinExecutant: Number(line.Montant_MedExecutant || 0),
          idMedecin: line.IDMEDECIN || undefined,
          acteMedecin: line.StatutMedecinActe || "NON",
          resultatActe: line.resultatActe || "",
          observationExamen: line.observationExamen || "",
          exclusionActe: line.Exclusion || "",
          tarifAssurance: Number(line.TARIF_ASSURANCE || 0),
          coefficientAssur: Number(line.COEFFICIENT_ASSURANCE || 0),
          montantTotalAPayer: Number(line.MontanttotalApayer || 0),
          totalSurplus: Number(line.SURPLUS || 0),
          statutExecutant: line.statutExecutant || "",
          dateSaisieResultat: line.dateSaisieResultat || undefined,
          sexe: line.Sexe || undefined,
          agePatient: line.agePatient || undefined,
          resultatSaisiePar: line.resultatSaisiePar || undefined,
          medecinPrescripteur: formData.medecinPrescripteur || undefined,
          idFamilleActeBiologie: line.IDFAMILLE || undefined,
          familleActe: line.familleActe || undefined,
          prixAccepte: Number(line.Accepter || 0),
          prixRefuse: Number(line.Refuser || 0),
          biologiste: line.biologiste || undefined,
          validerLe: line.validerLe || undefined,
          provenanceExamen: line.provenanceExamen || undefined,
          externeInterne: line.externeInterne || undefined,
          nIdentificationExamen: line.nIdentificationExamen || undefined,
          acteExecuter: !!line.acteExecuter,
          acteFacture: !!line.acteFacture,
          resultatManuel: line.resultatManuel || undefined,
          statutHonoraireMedecin: line.statutHonoraireMedecin || undefined,
          typeResultat: line.typeResultat || undefined,
          actePayeCaisse: (line.ACTEPAYECAISSE || "").toString(),
          datePaiementCaisse: line.Datepaiementcaisse || undefined,
          heurePaiement: line.HeurePaiement || undefined,
          payePar: line.PayéPar || recuPar || undefined,
          compteRenduValidePar: line.compteRenduValidePar || undefined,
          compteRenduValideA: line.compteRenduValideA || undefined,
          compteRenduValideLe: line.compteRenduValideLe || undefined,
          medecinExecutant: line.medecinExecutant || undefined,
          idFacturation: factureId,
          SOCIETE_PATIENT: formData.societePatient || undefined,
          ordonnancementAffichage: Number(line.ordonnancementAffichage || 0),
          dateLignePrestation: line.DATE || new Date().toISOString(),
        };

        // décider si payé
        const paye =
          (line.ACTEPAYECAISSE || "").toString().toLowerCase() === "payé" ||
          (line.ACTEPAYECAISSE || "").toString().toLowerCase() === "oui";
        lignePayload.paye = paye;

        if (line.IDLignePrestation) {
          // mise à jour
          const url = `/api/ligneprestationFacture/${encodeURIComponent(
            line.IDLignePrestation
          )}`;
          const p = fetch(url, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(lignePayload),
          }).then(async (r) => {
            if (!r.ok) {
              const err = await r.json().catch(() => ({}));
              throw new Error(err?.message || "Erreur mise à jour ligne");
            }
            return r.json();
          });
          promises.push(p);
        } else {
          // création
          const p = fetch(`/api/ligneprestationFacture`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(lignePayload),
          }).then(async (r) => {
            if (!r.ok) {
              const err = await r.json().catch(() => ({}));
              throw new Error(err?.message || "Erreur création ligne");
            }
            return r.json();
          });
          promises.push(p);
        }
      } // fin boucle lignes

      // attendre toutes les promesses lignes
      await Promise.all(promises);

      // Optionnel : recalculer la facture via API si tu as un endpoint
      try {
        await fetch(
          `/api/facturation/${encodeURIComponent(factureId)}/recalculate`,
          { method: "POST" }
        );
      } catch (e) {
        // ignore si non disponible
      }

      // Mise à jour du state pour refléter la sauvegarde
      setModeModification(true);
      setExamenHospitId(usedHospitalisationId);
      setModePaiement(modePaiement || formData.Modepaiement || "");
      setMontantEncaisse(montantEncaisse || formData.MontantRecu || 0);

      // succès : laisser caller (ActionsButtonsCaisse) appeler onSuccess
      return;
    } catch (err: any) {
      console.error("Erreur lors de l'enregistrement :", err);
      // remonter l'erreur pour que ActionsButtonsCaisse l'affiche
      throw new Error(
        err?.message || "Erreur lors de l'enregistrement de la facture."
      );
    }
  };

  return (
    <Container fluid className="p-3">
      <h3
        className={`text-center mb-3 ${modeModification ? "text-warning" : "text-primary"
          }`}
      >
        {modeModification ? "FICHE DE MODIFICATION" : "FICHE DE SAISIE"}{" "}
        {formData.typeacte ? `---> ${formData.typeacte}` : ""}
      </h3>

      <Row>
        <Col md={3}>
          <PatientInfoCaisse
            formData={formData}
            setFormData={setFormData}
            onCodePrestationChange={(code) => {
              setCodePrestation(code);

              const today = new Date().toISOString().split("T")[0];
              setFormData((prev) => ({
                ...prev,
                dateEntree: today,
                dateSortie: today,
                nombreDeJours: 1,
                TotalapayerPatient: 0,
              }));

              setModeModification(false);
              setExamenHospitId(undefined);
              setPresetLines([]);
              setResetKey((k) => k + 1);
              setModePaiement("");
              setMontantEncaisse(0);
            }}
          />
          <AssuranceInfoCaisse
            formData={formData}
            setFormData={setFormData}
            currentLignes={currentLignes}
            onRecalculateLines={() => {
              setTriggerRecalculation((prev) => prev + 1);
            }}
          />
        </Col>

        <Col md={9}>
          <Form>
            <Row className="mb-1">
              <Col xs={12} md={6} lg={4} className="mb-2">
                <Form.Label>Nature Acte</Form.Label>
                <Form.Select
                  value={formData.typeacte || formData.Designationtypeacte}
                  onChange={async (e) => {
                    const value = e.target.value;

                    if (!value) {
                      setFormData((prev) => ({ ...prev, typeacte: "" }));
                      return;
                    }

                    setFormData((prev) => ({ ...prev, typeacte: value }));

                    if (!codePrestation) {
                      return;
                    }

                    try {
                      const res = await fetch(
                        `/api/examenhospitalisationFacture?codePrestation=${encodeURIComponent(
                          codePrestation
                        )}&typeActe=${encodeURIComponent(value)}`
                      );

                      if (res.ok) {
                        const data = await res.json();

                        if (data && data._id) {
                          setModeModification(true);
                          setExamenHospitId(data._id);

                          setFormData((prev) => ({
                            ...prev,
                            typeacte: value,
                            Assure: data.Assure || prev.Assure,
                            assurance: {
                              ...prev.assurance,
                              assuranceId:
                                data.IDASSURANCE || prev.assurance.assuranceId,
                              type: data.Assure || prev.assurance.type,
                              taux: data.Taux || prev.assurance.taux,
                              matricule:
                                data.Numcarte || prev.assurance.matricule,
                              numeroBon:
                                data.NumBon || prev.assurance.numeroBon,
                              societe: data.SocieteP || prev.assurance.societe,
                              adherent:
                                data.Souscripteur || prev.assurance.adherent,
                            },
                            medecinId:
                              data.NummedecinExécutant || prev.medecinId,
                            medecinPrescripteur:
                              data.Medecin || prev.medecinPrescripteur,
                            renseignementclinique:
                              data.Rclinique || prev.renseignementclinique,
                            societePatient:
                              data.SOCIETE_PATIENT || prev.societePatient,
                            dateEntree: data.Entrele
                              ? new Date(data.Entrele)
                                .toISOString()
                                .split("T")[0]
                              : prev.dateEntree,
                            dateSortie: data.SortieLe
                              ? new Date(data.SortieLe)
                                .toISOString()
                                .split("T")[0]
                              : prev.dateSortie,
                            nombreDeJours: data.DureeE || prev.nombreDeJours,
                            factureTotal: data.Montanttotal || 0,
                            partAssurance: data.PartAssuranceP || 0,
                            Partassure: data.Partassure || 0,
                            resteAPayer: data.Restapayer || 0,
                            surplus: data.TotalSurplus || 0,
                            TotalapayerPatient:
                              data.TotalapayerPatient ?? data.Restapayer ?? 0,
                          }));

                          setModePaiement(data.Modepaiement || "");
                          setMontantEncaisse(data.MontantRecu ?? 0);

                          const resLignes = await fetch(
                            `/api/ligneprestationFacture?codePrestation=${encodeURIComponent(
                              codePrestation
                            )}&idHospitalisation=${encodeURIComponent(
                              data._id
                            )}`
                          );
                          if (resLignes.ok) {
                            const payload = await resLignes.json();
                            const rawLines = Array.isArray(payload?.data)
                              ? payload.data
                              : [];

                            const mappedLines = rawLines.map((l: any) => ({
                              DATE: l.dateLignePrestation
                                ? new Date(l.dateLignePrestation)
                                  .toISOString()
                                  .split("T")[0]
                                : new Date().toISOString().split("T")[0],
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
                              TotalRelicatCoefAssur: Number(
                                l.totalCoefficient ?? 0
                              ),
                              Montant_MedExecutant: Number(
                                l.montantMedecinExecutant ?? 0
                              ),
                              StatutMedecinActe:
                                l.acteMedecin === "OUI" ? "OUI" : "NON",
                              IDACTE: String(l.idActe || ""),
                              Exclusion:
                                l.exclusionActe === "Refuser"
                                  ? "Refuser"
                                  : "Accepter",
                              COEFFICIENT_ASSURANCE: Number(
                                l.coefficientAssur ?? 0
                              ),
                              TARIF_ASSURANCE: Number(l.tarifAssurance ?? 0),
                              IDHOSPO: String(l.idHospitalisation || ""),
                              IDFAMILLE: String(l.idFamilleActeBiologie || ""),
                              Refuser: Number(l.prixRefuse ?? 0),
                              Accepter: Number(l.prixAccepte ?? 0),
                              IDLignePrestation: String(l._id || ""),
                              Statutprescription: Number(
                                l.statutPrescriptionMedecin ?? 2
                              ),
                              CoefClinique: Number(
                                l.coefficientClinique ?? l.coefficientActe ?? 1
                              ),
                              forfaitclinique: 0,
                              ordonnancementAffichage: Number(
                                l.ordonnancementAffichage ?? 0
                              ),
                              Action: "",
                            }));

                            setPresetLines(mappedLines);
                            setResetKey((k) => k + 1);
                          }
                        } else {
                          setModeModification(false);
                          setExamenHospitId(undefined);
                          setPresetLines([]);
                          setCurrentLignes([]);
                          setResetKey((k) => k + 1);
                          setModePaiement("");
                          setMontantEncaisse(0);
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
                            Partassure: 0,
                            surplus: 0,
                            resteAPayer: 0,
                            TotalapayerPatient: 0,
                            renseignementclinique: "",
                          }));
                        }
                      } else if (res.status === 404) {
                        setModeModification(false);
                        setExamenHospitId(undefined);
                        setPresetLines([]);
                        setCurrentLignes([]);
                        setResetKey((k) => k + 1);
                        setModePaiement("");
                        setMontantEncaisse(0);
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
                          Partassure: 0,
                          surplus: 0,
                          resteAPayer: 0,
                          TotalapayerPatient: 0,
                          renseignementclinique: "",
                        }));
                      }
                    } catch (error) {
                      console.error(
                        "Erreur lors de la recherche de l'examen:",
                        error
                      );
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
                  onChange={(e) =>
                    handleDateChange("dateEntree", e.target.value)
                  }
                />
              </Col>
              <Col xs={12} sm={6} md={4} lg={3} className="mb-2">
                <Form.Label>Sortie le</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.dateSortie}
                  onChange={(e) =>
                    handleDateChange("dateSortie", e.target.value)
                  }
                />
              </Col>
              <Col xs={12} sm={6} md={4} lg={2} className="mb-2">
                <Form.Label>NB (Jrs)</Form.Label>
                <Form.Control
                  type="number"
                  value={formData.nombreDeJours}
                  onChange={(e) =>
                    handleNombreJoursChange(parseInt(e.target.value))
                  }
                />
              </Col>
            </Row>

            {errorMessage && (
              <div className="alert alert-danger mt-2">{errorMessage}</div>
            )}
          </Form>
          <Row>
            <TablePrestationsCaisse
              key={`actes-${resetKey}-${triggerRecalculation}`}
              assuranceId={
                formData.Assure === "NON ASSURE"
                  ? 1
                  : formData.Assure === "TARIF MUTUALISTE"
                    ? 2
                    : 3
              }
              saiTaux={formData.assurance.taux || 0}
              assuranceDbId={formData.assurance.assuranceId || undefined}
              externalResetKey={resetKey}
              presetLines={presetLines}
              onTotalsChange={(s) => {
                setTotaux(s);
                setFormData((prev) => {
                  return {
                    ...prev,
                    factureTotal: s.montantTotal,
                    partAssurance: s.partAssurance,
                    Partassure: s.partAssure,
                    surplus: s.totalSurplus,
                  };
                });
              }}
              onLinesChange={(lignes) => {
                setCurrentLignes(lignes);
              }}
            />
          </Row>
          <Row>
            <Col>
              <CliniqueInfoCaisse
                formData={formData}
                setFormData={setFormData}
                hasActesMedecin={currentLignes.some(
                  (ligne) => ligne.StatutMedecinActe === "OUI"
                )}
              />
            </Col>
          </Row>
          <Row className="mt-2">
            <Col>
              <PaiementInfoCaisse
                formData={formData}
                setFormData={setFormData}
                modePaiement={modePaiement}
                setModePaiement={setModePaiement}
                montantEncaisse={montantEncaisse}
                setMontantEncaisse={setMontantEncaisse}
              />
            </Col>
          </Row>

          <ActionsButtonsCaisse
            disabled={!!errorMessage}
            formData={formData}
            lignes={currentLignes}
            modeModification={modeModification}
            examenHospitId={examenHospitId}
            onSubmit={enregistrerFacture}
            onSuccess={() => {
              alert("✅ Facture enregistrée avec succès");
              // Optionnel : ici tu peux fermer le modal / réinitialiser le form / recharger la liste
              // Ex : closeModal();
            }}
          />
        </Col>
      </Row>
    </Container>
  );
}
