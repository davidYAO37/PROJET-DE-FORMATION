"use client";
import { useState, useEffect } from "react";
import { Table, Button, Spinner, Alert, Form, Row, Col, Badge } from "react-bootstrap";
import { FaEdit, FaCalendarAlt, FaUser, FaClock, FaCheckCircle, FaSearch, FaFilter, FaPrint, FaTimesCircle } from "react-icons/fa";
import { ILignePrestation } from "@/models/lignePrestation";
import { IPatient } from "@/models/patient";
import PrintCompteRenduUnified from "./MesImpressions/CompteRendu/PrintCompteRenduUnified";

// Interface pour les données WinDev retournées par l'API
interface LignePrestationValide {
  Date_ligne_prestaion: Date | string;
  Nompatient?: string;
  IDHOSPITALISATION?: string;
  IDLIGNE_PRESTATION: string | any;
  Prestation: string;
  MedecinExécutant?: string;
  resultatsaisiepar?: string;
  DatesaisieResultat?: Date | string;
  compterenduValidéLe?: Date | string;
  CompterenduValidépar?: string;
  ActeMedecin?: string;
  lettreCle?: string;
  CodePrestation?: string;
  idActe?: string;
  IdPatient?: string | any;
  statutPrescriptionMedecin?: number;
}

interface Props {
  onLigneSelect: (ligne: ILignePrestation, patient: IPatient) => void;
}

const ListesValides: React.FC<Props> = ({ onLigneSelect }) => {
  const [lignePrestations, setLignePrestations] = useState<ILignePrestation[]>([]);
  const [patients, setPatients] = useState<IPatient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [lettreCleFilter, setLettreCleFilter] = useState("");
  const [lettreClesDisponibles, setLettreClesDisponibles] = useState<string[]>([]);
  
  // États pour les actions d'impression et d'annulation
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [annulatingId, setAnnulatingId] = useState<string | null>(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printData, setPrintData] = useState<any>(null);

  // Charger les lignes de prestations validées
  const loadLignesValides = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (dateDebut) params.append("dateDebut", dateDebut);
      if (dateFin) params.append("dateFin", dateFin);
      if (lettreCleFilter) params.append("lettreCle", lettreCleFilter);

      const response = await fetch(`/api/compteRenduRadio/CompteRenduValides?${params}`);
      if (!response.ok) throw new Error("Erreur lors du chargement des prestations validées");
      
      const data = await response.json();
      setLignePrestations(data.lignePrestations || []);
      setPatients(data.patients || []);
      
      // Extraire les lettres clés uniques (utiliser le champ WinDev)
      const lettresCles = [...new Set(data.lignePrestations.map((ligne: any) => ligne.lettreCle) as string[])];
      setLettreClesDisponibles(lettresCles);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLignesValides();
  }, [dateDebut, dateFin, lettreCleFilter]);

  // Obtenir les informations du patient pour une ligne de prestation
  const getPatientInfo = (ligne: any) => {
    return patients.find(p => p._id.toString() === ligne.IdPatient?.toString());
  };

  // Formater la date
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR');
  };

  // Formater la date et heure
  const formatDateTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString('fr-FR');
  };

  // Gérer l'impression du compte rendu validé avec design unifié
  const handlePrint = async (ligne: any) => {
    // Pour les comptes rendus validés, vérifier qu'il y a un résultat saisi
    if (!ligne.resultatsaisiepar || ligne.resultatsaisiepar.trim() === "") {
      alert("Aucun résultat à imprimer");
      return;
    }

    setPrintingId(ligne.IDLIGNE_PRESTATION);
    setError("");

    try {
      const response = await fetch(`/api/compteRenduRadio/imprimer/${ligne.IDLIGNE_PRESTATION}`);
      
      if (!response.ok) {
        const result = await response.json();
        if (result.code === 'NO_RESULTAT_A_IMPRIMER') {
          alert("Aucun résultat à imprimer");
        } else {
          throw new Error(result.error || "Erreur lors de la préparation de l'impression");
        }
        return;
      }

      const result = await response.json();
      
      if (result.success && result.donnees) {
        // Préparer les données pour l'impression
        const printData = {
          Nompatient: result.donnees.Nompatient,
          Sexe: result.donnees.Sexe,
          Age_partient: result.donnees.Age_partient,
          Situationgeo: result.donnees.Situationgeo,
          Code_Prestation: result.donnees.Code_Prestation,
          Prestation: result.donnees.Prestation,
          DatesaisieResultat: result.donnees.DatesaisieResultat,
          MedecinPrescripteur: result.donnees.MedecinPrescripteur,
          Docteursaisieresultat: result.donnees.Docteursaisieresultat,
          resultatacte: result.donnees.resultatacte,
          ObservationExame: result.donnees.ObservationExame
        };

        const validationInfo = {
          validePar: ligne.CompterenduValidépar,
          valideLe: ligne.compterenduValidéLe
        };

        // Ouvrir le modal d'impression avec le nouveau design
        setPrintData({ donnees: printData, validationInfo });
        setPrintModalOpen(true);
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de la préparation de l'impression");
    } finally {
      setPrintingId(null);
    }
  };

  // Gérer l'impression sans entête du compte rendu validé avec design unifié
  const handlePrintWithoutHeader = async (ligne: any) => {
    // Pour les comptes rendus validés, vérifier qu'il y a un résultat saisi
    if (!ligne.resultatsaisiepar || ligne.resultatsaisiepar.trim() === "") {
      alert("Aucun résultat à imprimer");
      return;
    }

    setPrintingId(ligne.IDLIGNE_PRESTATION);
    setError("");

    try {
      const response = await fetch(`/api/compteRenduRadio/imprimer/${ligne.IDLIGNE_PRESTATION}`);
      
      if (!response.ok) {
        const result = await response.json();
        if (result.code === 'NO_RESULTAT_A_IMPRIMER') {
          alert("Aucun résultat à imprimer");
        } else {
          throw new Error(result.error || "Erreur lors de la préparation de l'impression");
        }
        return;
      }

      const result = await response.json();
      
      if (result.success && result.donnees) {
        // Préparer les données pour l'impression
        const printData = {
          Nompatient: result.donnees.Nompatient,
          Sexe: result.donnees.Sexe,
          Age_partient: result.donnees.Age_partient,
          Situationgeo: result.donnees.Situationgeo,
          Code_Prestation: result.donnees.Code_Prestation,
          Prestation: result.donnees.Prestation,
          DatesaisieResultat: result.donnees.DatesaisieResultat,
          MedecinPrescripteur: result.donnees.MedecinPrescripteur,
          Docteursaisieresultat: result.donnees.Docteursaisieresultat,
          resultatacte: result.donnees.resultatacte,
          ObservationExame: result.donnees.ObservationExame
        };

        const validationInfo = {
          validePar: ligne.CompterenduValidépar,
          valideLe: ligne.compterenduValidéLe
        };

        // Ouvrir le modal d'impression sans entête
        setPrintData({ donnees: printData, validationInfo, withoutHeader: true });
        setPrintModalOpen(true);
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de la préparation de l'impression");
    } finally {
      setPrintingId(null);
    }
  };

  // Gérer l'annulation de la validation
  const handleAnnulerValidation = async (ligne: any) => {
    // Logique WinDev : HLitRecherche(LIGNE_PRESTATION,IDLIGNE_PRESTATION,TABLE_LIGNE_PRESTATION_VALIDE.COL_IDLIGNE_PRESTATION)
    const utilisateurConnecte = localStorage.getItem("nom_utilisateur") || "";
    
    // Vérifier que l'utilisateur connecté est celui qui a validé
    if (ligne.CompterenduValidépar !== utilisateurConnecte) {
      alert("Pour la reprise veuillez voir " + (ligne.CompterenduValidépar || "l'utilisateur qui a validé"));
      return;
    }

    // Logique WinDev : nMONjour=DateDifférence(LIGNE_PRESTATION.compterenduValidéLe,DateSys())
    const dateValidation = new Date(ligne.compterenduValidéLe);
    const dateActuelle = new Date();
    const differenceJours = Math.floor((dateActuelle.getTime() - dateValidation.getTime()) / (1000 * 60 * 60 * 24));
    
    // Logique WinDev : SI nMONjour < 15 ALORS
    if (differenceJours >= 15) {
      alert("Désolé, nous ne pouvons donner suite à votre requête. Délai de 15 jours dépassé.");
      return;
    }

    // Logique WinDev : SI OuiNon(0,"Voulez-vous reprendre la saisie du compte rendu ?")=Vrai ALORS
    if (!window.confirm("Voulez-vous reprendre la saisie du compte rendu ?")) {
      return;
    }

    // Logique WinDev : SI OKAnnuler(0,"Vous allez a nouveau valider après la saisie")=Vrai ALORS
    if (!window.confirm("Vous allez à nouveau valider après la saisie")) {
      return;
    }

    setAnnulatingId(ligne.IDLIGNE_PRESTATION);
    setError("");

    try {
      // Logique WinDev : HModifie(LIGNE_PRESTATION) - Annuler la validation
      const response = await fetch(`/api/compteRenduRadio/annulerValidation/${ligne.IDLIGNE_PRESTATION}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ utilisateur: utilisateurConnecte }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de l'annulation de la validation");
      }

      alert("Validation annulée avec succès. Vous pouvez maintenant modifier le compte rendu.");
      loadLignesValides(); // Recharger les données

    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de l'annulation de la validation");
    } finally {
      setAnnulatingId(null);
    }
  };

  // Obtenir le statut de la ligne
  const getStatutBadge = (ligne: any) => {
    if (ligne.CompterenduValidépar) {
      return <Badge bg="success"><FaCheckCircle className="me-1" />Validé</Badge>;
    } else if (ligne.resultatsaisiepar) {
      return <Badge bg="warning"><FaClock className="me-1" />En attente de validation</Badge>;
    } else {
      return <Badge bg="danger"><FaEdit className="me-1" />À saisir</Badge>;
    }
  };

  return (
    <div>
      {/* Filtres */}
      <div className="mb-4">
        <h5><FaFilter className="me-2" />Rechercher les comptes rendus validés</h5>
        <Row>
          <Col md={3}>
            <Form.Group>
              <Form.Label><FaCalendarAlt className="me-2" />Date début</Form.Label>
              <Form.Control
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group>
              <Form.Label><FaCalendarAlt className="me-2" />Date fin</Form.Label>
              <Form.Control
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group>
              <Form.Label>Lettre clé</Form.Label>
              <Form.Select
                value={lettreCleFilter}
                onChange={(e) => setLettreCleFilter(e.target.value)}
              >
                <option value="">Toutes les lettres clés</option>
                {lettreClesDisponibles.map((lettre: string) => (
                  <option key={lettre} value={lettre}>{lettre}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group className="d-flex align-items-end">
              <Button variant="primary" onClick={loadLignesValides} disabled={loading}>
                {loading ? <Spinner size="sm" /> : <FaSearch />}
              </Button>
            </Form.Group>
          </Col>
        </Row>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Tableau des lignes de prestations validées */}
      <div>
        <h5><FaCheckCircle className="me-2" />Compte Rendus Validés</h5>
        <Table striped bordered hover responsive>
          <thead className="table-warning">
            <tr>
              <th>Date prestation</th>
              <th>Patient</th>
              <th>Prestation</th>
              <th>Lettre clé</th>
              <th>Médecin exécutant</th>
              <th>Saisie par</th>
              <th>Saisie le</th>
              <th>Validé par</th>
              <th>Validé le</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={11} className="text-center">
                  <Spinner animation="border" />
                </td>
              </tr>
            ) : lignePrestations.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center">
                  Aucun compte rendu validé trouvé
                </td>
              </tr>
            ) : (
              lignePrestations
                .sort((a: any, b: any) => new Date(a.Date_ligne_prestaion).getTime() - new Date(b.Date_ligne_prestaion).getTime())
                .map((ligne: any) => {
                  const patient = getPatientInfo(ligne);
                  return (
                    <tr key={ligne.IDLIGNE_PRESTATION?.toString()}>
                      <td>{formatDate(ligne.Date_ligne_prestaion)}</td>
                      <td>
                        {patient ? (
                          <strong>{patient.Nom} {patient.Prenoms}</strong>
                        ) : (
                          <span className="text-muted">{ligne.Nompatient || "Patient non trouvé"}</span>
                        )}
                      </td>
                      <td>
                        <strong>{ligne.Prestation}</strong>                        
                      </td>
                      <td>
                        <Badge bg="info">{ligne.lettreCle}</Badge>
                      </td>
                      <td>{ligne.MedecinExécutant || "N/A"}</td>
                      <td>{ligne.resultatsaisiepar || "N/A"}</td>
                      <td>
                        {ligne.DatesaisieResultat ? formatDateTime(ligne.DatesaisieResultat) : "N/A"}
                      </td>
                      <td>{ligne.CompterenduValidépar || "N/A"}</td>
                      <td>
                        {ligne.compterenduValidéLe ? formatDateTime(ligne.compterenduValidéLe) : "N/A"}
                      </td>
                      <td>{getStatutBadge(ligne)}</td>
                      <td>
                        <div className="d-flex gap-1">                                                  
                          {/* Boutons Imprimer */}
                          <div className="d-flex gap-1">
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => handlePrint(ligne)}
                              disabled={printingId === ligne.IDLIGNE_PRESTATION}
                              title="Imprimer avec entête"
                            >
                              {printingId === ligne.IDLIGNE_PRESTATION ? <Spinner size="sm" /> : <FaPrint />}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-secondary"
                              onClick={() => handlePrintWithoutHeader(ligne)}
                              disabled={printingId === ligne.IDLIGNE_PRESTATION}
                              title="Imprimer sans entête"
                            >
                              {printingId === ligne.IDLIGNE_PRESTATION ? <Spinner size="sm" /> : <FaPrint />}
                            </Button>
                          </div>
                          
                          {/* Bouton Annuler validation */}
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => handleAnnulerValidation(ligne)}
                            disabled={annulatingId === ligne.IDLIGNE_PRESTATION}
                            title="Annuler la validation"
                          >
                            {annulatingId === ligne.IDLIGNE_PRESTATION ? <Spinner size="sm" /> : <FaTimesCircle />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
            )}
          </tbody>
        </Table>
      </div>

      {/* Statistiques - Comptes rendus validés */}
      <div className="mt-4">
        <Row>
          <Col md={6}>
            <div className="card border-success">
              <div className="card-body text-center">
                <h6 className="card-title text-success">
                  <FaCheckCircle className="me-2" />
                  Comptes rendus validés
                </h6>
                <h3 className="text-success">
                  {lignePrestations.filter((l: any) => l.CompterenduValidépar).length}
                </h3>
              </div>
            </div>
          </Col>
          <Col md={6}>
            <div className="card border-info">
              <div className="card-body text-center">
                <h6 className="card-title text-info">
                  <FaCalendarAlt className="me-2" />
                  Période sélectionnée
                </h6>
                <h3 className="text-info">
                  {lignePrestations.length}
                </h3>
              </div>
            </div>
          </Col>
        </Row>
      </div>

      {/* Modal d'impression avec design unifié */}
      {printModalOpen && (
        <div 
          className="modal fade show d-block" 
          style={{ 
            display: 'block', 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            zIndex: 1050, 
            width: '100%', 
            height: '100%', 
            backgroundColor: 'rgba(0,0,0,0.5)' 
          }}
          onClick={() => setPrintModalOpen(false)}
        >
          <div 
            className="modal-dialog modal-lg" 
            onClick={(e) => e.stopPropagation()}
            style={{ 
              margin: '50px auto', 
              maxWidth: '900px', 
              backgroundColor: 'white', 
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div className="modal-content">
              <div className="modal-header border-bottom">
                <h5 className="modal-title">
                  <FaPrint className="me-2" />
                  Aperçu de l'impression
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setPrintModalOpen(false)}
                >
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                {printData && (
                  <PrintCompteRenduUnified 
                    donnees={printData.donnees}
                    validationInfo={printData.validationInfo}
                    titre="COMPTE RENDU RADIOLOGIQUE VALIDÉ"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListesValides;