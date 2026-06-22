// components/SaisieResultat.tsx
"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Table,
  Card,
  Form,
  Button,
  Spinner,
} from "react-bootstrap";
import { ArrowRepeat } from "react-bootstrap-icons";

interface SaisieResultatProps {
  idHospitalisation: string;
  ProvenanceExamen?: string;
  NIdentificationExamen?: string;
  Externe_Interne?: string;
  CONCLUSIONGENE?: string;
  idMedecin?: string;
}

interface PatientData {
  _id: string;
  Nom: string;
  Prenoms: string;
  sexe: string;
  Age_partient: number;
}

interface MedecinData {
  _id: string;
  nom: string;
  prenoms: string;
}

interface LignePrestationData {
  _id: string;
  prestation: string;
  dateLignePrestation: string;
  idActe: string;
  idFamilleActeBiologie?: string;
  observationExamen?: string;
  medecinPrescripteur?: string;
  resultatSaisiePar?: string;
  ordonnancementAffichage?: number;
}

interface ParametreResultat {
  _id?: string;
  IDACTEP?: string;
  Param_designation?: string;
  ChampResultat?: string;
  ValeurNormale?: string;
  ValeurMaxNormale?: number;
  ValeurMinNormale?: number;
  IDLIGNE_PRESTATION?: string;
  IDResultat?: string;
  IDFAMILLE_ACTE_BIOLOGIE?: string;
  TypeTexte?: boolean;
  ORdonnacementAffichage?: number;
  UnitéParam?: string;
  unite?: string;
  Interpretation?: string;
}

export default function SaisieResultat({
  idHospitalisation,
  ProvenanceExamen,
  NIdentificationExamen,
  Externe_Interne,
  CONCLUSIONGENE,
  idMedecin,
}: SaisieResultatProps) {
  const [loading, setLoading] = useState(true);

  const [patient, setPatient] = useState<PatientData | null>(null);
  const [medecins, setMedecins] = useState<MedecinData[]>([]);
  const [prestations, setPrestations] = useState<LignePrestationData[]>([]);
  const [selectedPrestation, setSelectedPrestation] =
    useState<LignePrestationData | null>(null);
  const [parametres, setParametres] = useState<ParametreResultat[]>([]);
  const [modeSaisie, setModeSaisie] = useState<"Manuel" | "Automate">("Manuel");
  const [conclusionGenerale, setConclusionGenerale] = useState(
    CONCLUSIONGENE || "",
  );
  const [interpretation, setInterpretation] = useState("");
  const [provenance, setProvenance] = useState(ProvenanceExamen || "");
  const [identificationExamen, setIdentificationExamen] = useState(
    NIdentificationExamen || "",
  );
  const [lieu, setLieu] = useState<"INTERNE" | "EXTERNE">(
    Externe_Interne === "EXTERNE" ? "EXTERNE" : "INTERNE",
  );
  const [medecinId, setMedecinId] = useState(idMedecin || "");

  useEffect(() => {
    chargerDonnees();
  }, [idHospitalisation]);

  async function chargerDonnees() {
    try {
      setLoading(true);

      const examenRes = await fetch(
        `/api/laboratoire/examens/${idHospitalisation}`,
      );

      const examen = await examenRes.json();

      setConclusionGenerale(examen.CONCLUSIONGENE ?? CONCLUSIONGENE ?? "");

      setProvenance(examen.ProvenanceExamen ?? ProvenanceExamen ?? "");

      setIdentificationExamen(
        examen.NIdentificationExamen ?? NIdentificationExamen ?? "",
      );

      setLieu(
        (examen.Externe_Interne ?? Externe_Interne) === "EXTERNE"
          ? "EXTERNE"
          : "INTERNE",
      );

      const medecinIdExamen = examen.idMedecin ?? idMedecin;

      if (medecinIdExamen) {
        setMedecinId(String(medecinIdExamen));
      }

      setPatient(examen.IdPatient || examen.patient || null);

      const medRes = await fetch("/api/laboratoire/medecins");

      const medData = await medRes.json();

      setMedecins(medData);

      const prestationRes = await fetch(
        `/api/laboratoire/prestations/${idHospitalisation}`,
      );

      const prestationData = await prestationRes.json();

      setPrestations(prestationData);
    } finally {
      setLoading(false);
    }
  }

  async function chargerParametres(prestation: LignePrestationData) {
    setSelectedPrestation(prestation);

    // 1. Vérifier d'abord si les résultats existent déjà
    try {
      const resultatsResponse = await fetch(
        `/api/laboratoire/resultats/ligne/${prestation._id}`,
      );
      const resultatsData = await resultatsResponse.json();

      if (resultatsData.hasResultats && resultatsData.resultats.length > 0) {
        // Les résultats existent déjà, les charger
        const parametresExistants = resultatsData.resultats.map((r: any) => ({
          IDACTEP: r.IDACTEP,
          Param_designation: r.Param_designation,
          ChampResultat: r.ChampResultat || "",
          ValeurNormale: r.ValeurNormale,
          ValeurMaxNormale: r.ValeurMaxNormale,
          ValeurMinNormale: r.ValeurMinNormale,
          IDLIGNE_PRESTATION: r.IDLIGNE_PRESTATION,
          IDFAMILLE_ACTE_BIOLOGIE: r.IDFAMILLE_ACTE_BIOLOGIE,
          unite: r.unite,
          TypeTexte: r.TypeTexte,
          ORdonnacementAffichage: r.ORdonnacementAffichage,
          UnitéParam: r.unite,
          IDResultat: r._id,
          Interpretation: r.Interpretation,
        }));

        setParametres(parametresExistants);

        // Charger l'interprétation
        if (prestation.observationExamen) {
          setInterpretation(prestation.observationExamen);
        }
        return;
      }
    } catch (error) {
      console.error("Erreur lors de la vérification des résultats:", error);
    }

    // 2. Si pas de résultats, charger selon le mode de saisie
    if (modeSaisie === "Manuel") {
      // Mode Manuel : charger les paramètres depuis l'API actuelle
      const params = new URLSearchParams();
      if (patient?.Age_partient) {
        params.append("age", patient.Age_partient.toString());
      }
      if (patient?.sexe) {
        params.append("sexe", patient.sexe);
      }

      const response = await fetch(
        `/api/laboratoire/parametres/${prestation._id}?${params.toString()}`,
      );

      const data = await response.json();

      // Utiliser l'interprétation renvoyée par l'API si disponible
      if (data.length > 0 && data[0].Interpretation) {
        setInterpretation(data[0].Interpretation);
      } else {
        // Si pas d'interprétation dans les résultats, chercher dans ActeClinique
        if (prestation.idActe) {
          try {
            const acteRes = await fetch(
              `/api/acteclinique?id=${prestation.idActe}`,
            );
            if (acteRes.ok) {
              const acte = await acteRes.json();
              if (acte.Interpretation) {
                setInterpretation(acte.Interpretation);
              } else {
                setInterpretation(prestation.observationExamen || "");
              }
            } else {
              setInterpretation(prestation.observationExamen || "");
            }
          } catch (error) {
            setInterpretation(prestation.observationExamen || "");
          }
        } else {
          setInterpretation(prestation.observationExamen || "");
        }
      }

      setParametres(data);
    } else {
      // Mode Automate : charger les résultats depuis l'API Automate
      try {
        const automateResponse = await fetch("/api/laboratoire/automate/resultats", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lignePrestationId: prestation._id,
            prestation: prestation.prestation,
            idActe: prestation.idActe,
            idHospitalisation: idHospitalisation,
            age: patient?.Age_partient,
            sexe: patient?.sexe,
          }),
        });

        const automateData = await automateResponse.json();

        if (automateData.success) {
          const parametresAutomates = automateData.parametres.map((p: any) => ({
            IDACTEP: p.IDACTEP,
            Param_designation: p.Param_designation,
            ChampResultat: p.ChampResultat || "",
            ValeurNormale: p.ValeurNormale,
            ValeurMaxNormale: p.ValeurMaxNormale,
            ValeurMinNormale: p.ValeurMinNormale,
            IDLIGNE_PRESTATION: p.IDLIGNE_PRESTATION,
            IDFAMILLE_ACTE_BIOLOGIE: p.IDFAMILLE_ACTE_BIOLOGIE,
            unite: p.unite,
            TypeTexte: p.TypeTexte,
            ORdonnacementAffichage: p.ORdonnacementAffichage,
            UnitéParam: p.unite,
          }));

          setParametres(parametresAutomates);

          // Charger l'interprétation depuis ActeClinique
          if (prestation.idActe) {
            try {
              const acteRes = await fetch(
                `/api/acteclinique?id=${prestation.idActe}`,
              );
              if (acteRes.ok) {
                const acte = await acteRes.json();
                if (acte.Interpretation) {
                  setInterpretation(acte.Interpretation);
                } else {
                  setInterpretation(prestation.observationExamen || "");
                }
              } else {
                setInterpretation(prestation.observationExamen || "");
              }
            } catch (error) {
              setInterpretation(prestation.observationExamen || "");
            }
          } else {
            setInterpretation(prestation.observationExamen || "");
          }
        } else {
          alert(automateData.message || "Aucun paramètre automate trouvé pour cette prestation");
          setParametres([]);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des résultats Automate:", error);
        alert("Erreur lors du chargement des résultats Automate");
      }
    }
  }

  function modifierResultat(index: number, valeur: string) {
    setParametres((prev) => {
      const copie = [...prev];

      copie[index].ChampResultat = valeur;

      return copie;
    });
  }
  //Fonction pour annuler un resultat saisie
  async function annulerResultat(IDLIGNE_PRESTATION: string) {
    const ok = window.confirm("Voulez-vous initialiser le résultat ?");
    if (!ok) return;

    const confirmOk = window.confirm("Confirmez-vous cette opération ?");
    if (!confirmOk) return;

    try {
      const response = await fetch(
        `/api/laboratoire/resultats/ligne/${IDLIGNE_PRESTATION}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        const result = await response.json();
        alert("Résultats annulés avec succès");

        // Réinitialiser l'interprétation
        setInterpretation("");

        // Recharger les données pour mettre à jour le surlignage
        await chargerDonnees();

        // Recharger les paramètres pour la prestation sélectionnée
        if (selectedPrestation) {
          await chargerParametres(selectedPrestation);
        }
      } else {
        alert("Erreur lors de l'annulation des résultats");
      }
    } catch (error) {
      alert("Erreur serveur lors de l'annulation");
    }
  }

// fonction pour supprimer un parametre
  async function supprimerParametre(index: number) {
    const parametre = parametres[index];
    const ok = window.confirm("Voulez-vous retirer ce Paramètre ?");
    if (!ok) return;
    if (!parametre.IDResultat) {
      // supprime la ligne du tableau
      setParametres((prev) => {
        const copie = [...prev];
        copie.splice(index, 1);
        return copie;
      });
      alert("Paramètre retiré avec succès");
      return;
    }

    try {
      const response = await fetch(
        `/api/laboratoire/resultat/${parametre.IDResultat}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        setParametres((prev) => {
          const copie = [...prev];
          copie.splice(index, 1);
          return copie;
        });
        alert("Paramètre retiré avec succès");
      } else {
        alert("Erreur lors de la suppression du paramètre");
      }
    } catch (error) {
      alert("Erreur serveur lors de la suppression");
    }
  }

  function estHorsNormes(parametre: ParametreResultat): boolean {
    // Si le paramètre est de type texte, pas de vérification des bornes
    if (parametre.TypeTexte) {
      return false;
    }

    if (!parametre.ChampResultat || parametre.ChampResultat.trim() === "") {
      return false;
    }

    const valeur = parseFloat(parametre.ChampResultat);
    if (isNaN(valeur)) {
      return false;
    }

    const min = parametre.ValeurMinNormale;
    const max = parametre.ValeurMaxNormale;

    // Si aucune borne n'est définie, pas de coloration
    if (
      (min === undefined || min === null) &&
      (max === undefined || max === null)
    ) {
      return false;
    }

    // Cas 1: min=0 et max=0 -> pas de coloration
    if (min === 0 && max === 0) {
      return false;
    }

    // Cas 2: min=0 et max≠0 -> intervalle 0 à max
    if (min === 0 && max !== 0 && max !== undefined && max !== null) {
      return valeur > max;
    }

    // Cas 3: min≠0 et max=0 -> intervalle min à infini
    if (
      min !== 0 &&
      min !== undefined &&
      min !== null &&
      (max === 0 || max === undefined || max === null)
    ) {
      return valeur < min;
    }

    // Cas 4: min≠0 et max≠0 -> intervalle min à max
    if (
      min !== 0 &&
      min !== undefined &&
      min !== null &&
      max !== 0 &&
      max !== undefined &&
      max !== null
    ) {
      return valeur < min || valeur > max;
    }

    // Cas avec seulement min défini
    if (
      min !== undefined &&
      min !== null &&
      min !== 0 &&
      (max === undefined || max === null)
    ) {
      return valeur < min;
    }

    // Cas avec seulement max défini
    if (
      max !== undefined &&
      max !== null &&
      max !== 0 &&
      (min === undefined || min === null)
    ) {
      return valeur > max;
    }

    return false;
  }

  async function enregistrer() {
    if (parametres.length === 0) {
      alert("Merci de paramétrer le résultat avant cette opération");

      return;
    }

    if (!selectedPrestation) {
      return;
    }
    // charger les donnees apres enregistrement
    const ok = window.confirm(
      `Voulez-vous enregistrer le résultat de ${selectedPrestation.prestation} ?`,
    );

    if (!ok) return;

    const medecin = medecins.find((m) => m._id === medecinId);
    const Utilisateur =
      typeof window !== "undefined"
        ? (localStorage.getItem("nom_utilisateur") ?? "")
        : "";

    const payload = {
      idHospitalisation,
      lignePrestationId: selectedPrestation._id,
      conclusionGenerale,
      interpretation,
      provenance,
      identificationExamen,
      externeInterne: lieu,
      medecinId,
      medecinNom: medecin ? `${medecin.nom} ${medecin.prenoms}` : "",
      resultatSaisiePar: Utilisateur,
      parametres,
    };

    const response = await fetch("/api/laboratoire/enregistrer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const resultat = await response.json();

    if (!response.ok) {
      alert(resultat.message);

      return;
    }

    alert("Résultat enregistré avec succès");

    // On garde la prestation courante avant le rechargement
    const prestationCourante = selectedPrestation;

    // Rafraîchit l'en-tête (provenance, identification,
    // médecin, conclusion), le patient et la liste des prestations
    await chargerDonnees();

    // Recharge les paramètres/résultats persistés de la prestation
    // courante (avec leurs IDResultat) pour refléter la base
    if (prestationCourante) {
      const parametresRes = await fetch(
        `/api/laboratoire/parametres/${prestationCourante._id}`,
      );
      const parametresData = await parametresRes.json();
      setParametres(parametresData);
    }
  }

  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner />
      </div>
    );
  }

  return (
    <Container fluid>
      <Row>
        {/* Panneau gauche */}

        <Col md={4}>
          <Card>
            <Card.Header className="bg-primary text-white fw-bold">
              GESTION DES RESULTATS ACTES
            </Card.Header>
            <Table bordered hover size="sm">
              <thead>
                <tr>
                  <th className="text-center">Date</th>
                  <th className="text-center">Prestation</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {prestations.map((prestation) => {
                  const date = prestation.dateLignePrestation
                    ? new Date(
                        prestation.dateLignePrestation,
                      ).toLocaleDateString("fr-FR")
                    : "-";
                  const aResultat = prestation.resultatSaisiePar && prestation.resultatSaisiePar !== "";
                  const cellStyle = aResultat ? { backgroundColor: "#90EE90" } : {};
                  return (
                    <tr
                      key={prestation._id}
                      onClick={() => chargerParametres(prestation)}
                      style={{ cursor: "pointer" }}
                    >
                      <td style={cellStyle}>{date}</td>
                      <td style={cellStyle}>{prestation.prestation}</td>
                      <td style={cellStyle}>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            annulerResultat(prestation._id);
                          }}
                        >
                          <ArrowRepeat size={28} color="red" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </Card>
        </Col>

        {/* Panneau droit */}

        <Col md={8}>
          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white fw-bold">
              SAISIE DES RESULTATS
              {patient && ` - PATIENT ${patient.Nom} ${patient.Prenoms}`}
            </Card.Header>
            <Card.Body>
              <Row className="mb-3 align-items-center">
                <Col md={4}>
                  <Form.Label className="fw-bold mb-0">Mode de saisie du résultat</Form.Label>
                  <div className="d-flex align-items-center mb-3 bg-secondary p-2 rounded text-white fw-bold">
                    <Form.Check
                      type="radio"
                      label="Manuel"
                      name="radioManuel"
                      id="radioManuel"
                      value="Manuel"
                      checked={modeSaisie === "Manuel"}
                      onChange={(e) => setModeSaisie(e.target.value as "Manuel" | "Automate")}
                      className="me-2"
                    />
                    <Form.Check
                      type="radio"
                      label="Automate"
                      name="radioManuel"
                      id="radioAutomatique"
                      value="Automate"
                      checked={modeSaisie === "Automate"}
                      onChange={(e) => setModeSaisie(e.target.value as "Manuel" | "Automate")}
                      className="me-2"
                    />
                  </div>
                </Col>
                <Col md={4}>
                  <Form.Label className="fw-bold mb-0">Provenance</Form.Label>
                  <Form.Control
                    size="sm"
                    value={provenance}
                    onChange={(e) => setProvenance(e.target.value)}
                  />
                </Col>
                <Col md={4}>
                  <Form.Label className="fw-bold mb-0">
                    Identification
                  </Form.Label>
                  <Form.Control
                    size="sm"
                    value={identificationExamen}
                    onChange={(e) => setIdentificationExamen(e.target.value)}
                  />
                </Col>
              </Row>

              <Row className="mb-3 align-items-center">
                <Col md={6}>
                  <Form.Label className="fw-bold mb-0">Médecin</Form.Label>
                  <Form.Select
                    size="sm"
                    value={medecinId}
                    onChange={(e) => setMedecinId(e.target.value)}
                  >
                    <option>Choisir médecin</option>
                    {medecins.map((med) => (
                      <option key={med._id} value={med._id}>
                        {med.nom} {med.prenoms}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={6}>
                  <Form.Label className="fw-bold mb-0">Type</Form.Label>
                  <div className="d-flex align-items-center bg-secondary p-2 rounded text-white fw-bold">
                    <Form.Check
                      type="radio"
                      label="Interne"
                      name="radioType"
                      id="radioInterne"
                      value="INTERNE"
                      checked={lieu === "INTERNE"}
                      onChange={(e) =>
                        setLieu(e.target.value as "INTERNE" | "EXTERNE")
                      }
                      className="me-3"
                    />
                    <Form.Check
                      type="radio"
                      label="Externe"
                      name="radioType"
                      id="radioExterne"
                      value="EXTERNE"
                      checked={lieu === "EXTERNE"}
                      onChange={(e) =>
                        setLieu(e.target.value as "INTERNE" | "EXTERNE")
                      }
                    />
                  </div>
                </Col>
              </Row>

              <Table bordered>
                <thead>
                  <tr>
                    <th>Paramètre</th>
                    <th>Résultat</th>
                    <th>Valeur Normale</th>
                    <th>Unité</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {parametres.map((ligne, index) => (
                    <tr key={index}>
                      <td
                        dangerouslySetInnerHTML={{
                          __html: ligne.Param_designation || "",
                        }}
                      />
                      <td>
                        <div className="d-flex align-items-center">
                          {ligne.TypeTexte ? (
                            <Form.Control
                              as="textarea"
                              rows={2}
                              value={ligne.ChampResultat || ""}
                              readOnly
                              style={{
                                backgroundColor: "#f8f9fa",
                                fontWeight: "normal",
                                resize: "vertical",
                              }}
                            />
                          ) : (
                            <Form.Control
                              type="number"
                              step="any"
                              value={ligne.ChampResultat || ""}
                              onChange={(e) =>
                                modifierResultat(index, e.target.value)
                              }
                              style={{
                                backgroundColor: estHorsNormes(ligne)
                                  ? "#FFB6C1"
                                  : "white",
                                fontWeight: estHorsNormes(ligne)
                                  ? "bold"
                                  : "normal",
                              }}
                            />
                          )}
                          {ligne.UnitéParam && (
                            <span className="ms-2 text-muted small">
                              {ligne.UnitéParam}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <small className="text-muted">
                          {ligne.ValeurNormale || "-"}
                          {ligne.ValeurMinNormale !== undefined &&
                            ligne.ValeurMaxNormale !== undefined && (
                              <span className="d-block">
                                ({ligne.ValeurMinNormale} -{" "}
                                {ligne.ValeurMaxNormale})
                              </span>
                            )}
                        </small>
                      </td>
                      <td>{ligne.UnitéParam || "-"}</td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => supprimerParametre(index)}
                        >
                          <Trash2 />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <Row>
                <Col md={6}>
                  <Form.Label>Interprétation</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={6}
                    value={interpretation}
                    onChange={(e) => setInterpretation(e.target.value)}
                  />
                </Col>

                <Col md={6}>
                  <Form.Label>Conclusion générale</Form.Label>

                  <Form.Control
                    as="textarea"
                    rows={6}
                    value={conclusionGenerale}
                    onChange={(e) => setConclusionGenerale(e.target.value)}
                  />
                </Col>
              </Row>

              <div className="text-end mt-3">
                <Button size="lg" onClick={enregistrer}>
                  Enregistrer
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
