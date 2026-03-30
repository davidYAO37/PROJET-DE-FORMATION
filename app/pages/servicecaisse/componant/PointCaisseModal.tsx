'use client';

import { useState, useEffect } from 'react';
import { Modal, Form, Button, Table, Card, Tabs, Tab } from 'react-bootstrap';
import { FaCalendarAlt, FaFilter, FaPrint, FaUser, FaCreditCard, FaLayerGroup, FaCalendarDay, FaCalendarCheck, FaEye, FaUserTie } from 'react-icons/fa';

interface PointCaisseModalProps {
  show: boolean;
  onHide: () => void;
}

interface Encaissement {
  _id: string;
  DateEncaissement: string;
  Type: string;
  Patient: string;
  Assurance: string;
  Designation: string;
  Totalacte: number;
  Taux: number;
  PartAssurance: number;
  PartPatient: number;
  Montantencaisse: number;
  REMISE: number;
  Restapayer: number;
  Medecin: string;
  Caissiere: string;
}

const PointCaisseModal: React.FC<PointCaisseModalProps> = ({ show, onHide }) => {
  const [encaissements, setEncaissements] = useState<Encaissement[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [modeAffichage, setModeAffichage] = useState<'famille' | 'detail'>('famille');
  const [ongletActif, setOngletActif] = useState<'parCaissiere' | 'statutPatient'>('parCaissiere');
  const [modePaiement, setModePaiement] = useState('TOUS LES PAIEMENTS');
  const [typePatient, setTypePatient] = useState('');
  const [caissiere, setCaissiere] = useState('');
  const [modesPaiement, setModesPaiement] = useState<string[]>([]);
  const [caissieres, setCaissieres] = useState<any[]>([]);

  // Initialiser les dates avec le mois actuel
  useEffect(() => {
    const now = new Date();
    const premierJour = new Date(now.getFullYear(), now.getMonth(), 1);
    const dernierJour = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setDateDebut(premierJour.toISOString().split('T')[0]);
    setDateFin(dernierJour.toISOString().split('T')[0]);
  }, []);

  // Charger les modes de paiement depuis le modèle
  useEffect(() => {
    const chargerModesPaiement = async () => {
      try {
        const response = await fetch('/api/modepaiement');
        if (response.ok) {
          const data = await response.json();
          setModesPaiement(data.data || []);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des modes de paiement:', error);
      }
    };

    chargerModesPaiement();
  }, []);

  // Charger les caissières de la même société
  useEffect(() => {
    const chargerCaissieres = async () => {
      try {
        // Récupérer l'ID entreprise depuis localStorage
        const idEntreprise = localStorage.getItem('IdEntreprise');
        const uidUtilisateur = localStorage.getItem('uid');
        
        if (idEntreprise) {
          const response = await fetch(`/api/utilisateurs?entrepriseId=${idEntreprise}`);
          if (response.ok) {
            const data = await response.json();
            setCaissieres(data.data || []);
            
            // Sélectionner l'utilisateur actuel par défaut
            if (uidUtilisateur) {
              const utilisateurActuel = data.data?.find((user: any) => 
                user.uid === uidUtilisateur
              );
              if (utilisateurActuel) {
                setCaissiere(`${utilisateurActuel.prenom} ${utilisateurActuel.nom}`);
              }
            }
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des caissières:', error);
      }
    };

    chargerCaissieres();
  }, []);

  // Charger les encaissements selon les filtres
  const chargerEncaissements = async () => {
    if (!dateDebut || !dateFin) {
      alert('Veuillez sélectionner une période');
      return;
    }

    setLoading(true);
    try {
      // Construire l'URL avec les paramètres de filtre
      const params = new URLSearchParams({
        dateDebut,
        dateFin,
        modeAffichage,
        ongletActif,
        modePaiement,
        typePatient,
        caissiere
      });

      const response = await fetch(`/api/pointcaisse?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          setEncaissements(data.data || []);
        } else {
          console.error('Erreur API:', data.message);
          setEncaissements([]);
        }
      } else {
        console.error('Erreur HTTP:', response.status);
        setEncaissements([]);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de chargement des données');
      setEncaissements([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculer les totaux
  const calculerTotaux = () => {
    const totalActe = encaissements.reduce((sum, enc) => sum + (enc.Totalacte || 0), 0);
    const totalAssurance = encaissements.reduce((sum, enc) => sum + (enc.PartAssurance || 0), 0);
    const totalPatient = encaissements.reduce((sum, enc) => sum + (enc.PartPatient || 0), 0);
    const totalRemise = encaissements.reduce((sum, enc) => sum + (enc.REMISE || 0), 0);
    const totalEncaisse = encaissements.reduce((sum, enc) => sum + (enc.Montantencaisse || 0), 0);
    const totalReste = encaissements.reduce((sum, enc) => sum + (enc.Restapayer || 0), 0);

    return {
      totalActe,
      totalAssurance,
      totalPatient,
      totalRemise,
      totalEncaisse,
      totalReste
    };
  };

  const totaux = calculerTotaux();

  // Obtenir le titre selon les filtres
  const getTitre = () => {
    let titre = 'LISTE DES ENCAISSEMENTS';
    
    // Logique WinDev pour l'onglet "Recherche Caissiere" (avec caissière et mode de paiement)
    if (ongletActif === 'parCaissiere') {
      // SI COMBO_Choisir_la_caissière..ValeurAffichée="" ALORS
      //   TABLE_ESPECE..Libellé="LISTE DES ENCAISSEMENTS"+" "+Majuscule(COMBO_Choisir_le_mode_de_paiement..ValeurAffichée)
      // SINON
      //   TABLE_ESPECE..Libellé="LISTE DES ENCAISSEMENTS"+" "+Majuscule(COMBO_Choisir_le_mode_de_paiement..ValeurAffichée)+" "+" DE"+" "+Majuscule(COMBO_Choisir_la_caissière..ValeurAffichée)
      // FIN
      if (modePaiement !== 'TOUS LES PAIEMENTS' && modePaiement !== '') {
        titre += ` ${modePaiement.toUpperCase()}`;
      }
      
      if (caissiere !== '') {
        titre += ` DE ${caissiere.toUpperCase()}`;
      }
    } else {
      // Logique WinDev pour l'onglet "Par Statut Patient" (type de patient)
      // TABLE_ESPECE..Libellé="LISTE DES ENCAISSEMENTS"+" "+Majuscule(COMBO_Choisir_le_type_patient..ValeurAffichée)
      if (typePatient !== '') {
        titre += ` ${typePatient.toUpperCase()}`;
      }
    }

    return titre;
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      size="xl"
      backdrop="static"
    >
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title className="d-flex align-items-center">
          <FaCalendarAlt className="me-2" />
          Point de Caisse
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* Formulaire de filtrage professionnel */}
        <Card className="border-0 shadow-sm mb-4">
          <Card.Header className="bg-gradient-primary text-white py-3">
            <div className="d-flex align-items-center">
              <FaFilter className="me-2" />
              <h6 className="mb-0 fw-bold">Filtres de Recherche</h6>
            </div>
          </Card.Header>
          <Card.Body>
            {/* Première ligne de filtres */}
            <div className="row g-3 mb-3">
              <div className="col-md-4">
                <Form.Label className="fw-semibold text-muted small">
                  <FaCalendarDay className="me-1" />
                  Date Début
                </Form.Label>
                <Form.Control 
                  type="date" 
                  value={dateDebut} 
                  onChange={(e) => setDateDebut(e.target.value)}
                  className="border-primary-subtle"
                />
              </div>

              <div className="col-md-4">
                <Form.Label className="fw-semibold text-muted small">
                  <FaCalendarCheck className="me-1" />
                  Date Fin
                </Form.Label>
                <Form.Control 
                  type="date" 
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                  className="border-primary-subtle"
                />
              </div>

              <div className="col-md-4">
                <Form.Label className="fw-semibold text-muted small">
                  <FaEye className="me-1" />
                  Mode Affichage
                </Form.Label>
                <Form.Select 
                  value={modeAffichage} 
                  onChange={(e) => {
                    const newModeAffichage = e.target.value;
                    
                    // Logique WinDev : TABLE_ESPECE.SupprimeTout()
                    setEncaissements([]);
                    setModeAffichage(newModeAffichage as 'famille' | 'detail');
                    
                    // Recharger les données avec le nouveau mode d'affichage
                    setTimeout(() => {
                      chargerEncaissements();
                    }, 100);
                  }}
                  className="border-primary-subtle"
                >
                  <option value="famille">PAR FAMILLE</option>
                  <option value="detail">PAR DETAIL</option>
                </Form.Select>
              </div>
            </div>

            {/* Tabs pour les différents modes de recherche */}
            <div className="mt-4">
              <Tabs
                activeKey={ongletActif}
                onSelect={(k) => {
                  // Logique WinDev : TABLE_ESPECE.SupprimeTout() au changement d'onglet
                  setEncaissements([]);
                  setOngletActif(k as 'parCaissiere' | 'statutPatient');
                }}
                className="mb-4"
              >
                <Tab eventKey="parCaissiere" title={
                  <span>
                    <FaUserTie className="me-2" />
                    Recherche par Caissière
                  </span>
                }>
                  <Card className="border-0 bg-light">
                    <Card.Body className="p-4">
                      <div className="row g-4">
                        <div className="col-md-6">
                          <Form.Label className="fw-semibold text-muted small">
                            <FaCreditCard className="me-1" />
                            Choisir le mode de paiement
                          </Form.Label>
                          <Form.Select 
                            value={modePaiement} 
                            onChange={(e) => {
                              const newModePaiement = e.target.value;
                              
                              // Logique WinDev : gsModepaiement=MoiMême..ValeurAffichée
                              // ExécuteTraitement(BTN_Affiche_tous,trtClic)
                              setModePaiement(newModePaiement);
                              chargerEncaissements();
                            }}
                            className="border-primary-subtle shadow-sm"
                          >
                            <option value="TOUS LES PAIEMENTS">TOUS LES PAIEMENTS</option>
                            {modesPaiement.map((mode: any, index) => (
                              <option key={index} value={mode.Modepaiement}>
                                {mode.Modepaiement}
                              </option>
                            ))}
                          </Form.Select>
                        </div>

                        <div className="col-md-6">
                          <Form.Label className="fw-semibold text-muted small">
                            <FaUserTie className="me-1" />
                            Choisir la caissière
                          </Form.Label>
                          <Form.Select 
                            value={caissiere} 
                            onChange={(e) => {
                              const newCaissiere = e.target.value;
                              
                              // Logique WinDev : SI MoiMême..ValeurAffichée="" ALORS
                              if (!newCaissiere) {
                                // ExécuteTraitement(BTN_Affiche_tous,trtClic) -> Charger tous les encaissements
                                setCaissiere("");
                                setModePaiement("TOUS LES PAIEMENTS");
                                chargerEncaissements();
                                return;
                              }
                              
                              // SINON SI COMBO_Choisir_le_mode_de_paiement..ValeurAffichée="" ALORS
                              if (!modePaiement || modePaiement === "") {
                                alert("Veuillez sélectionner le mode de paiement");
                                return;
                              }
                              
                              setCaissiere(newCaissiere);
                              chargerEncaissements();
                            }}
                            className="border-primary-subtle shadow-sm"
                          >
                            <option value="">Toutes les caissières</option>
                            {caissieres.map((caiss, index) => (
                              <option key={index} value={`${caiss.nom} ${caiss.prenom}`}>
                                {caiss.nom} {caiss.prenom}
                              </option>
                            ))}
                          </Form.Select>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Tab>

                <Tab eventKey="statutPatient" title={
                  <span>
                    <FaUser className="me-2" />
                    Recherche par Statut Patient
                  </span>
                }>
                  <Card className="border-0 bg-light">
                    <Card.Body className="p-4">
                      <div className="row g-4">
                        <div className="col-md-6">
                          <Form.Label className="fw-semibold text-muted small">
                            <FaUser className="me-1" />
                            Choisir le type de patient
                          </Form.Label>
                          <Form.Select 
                            value={typePatient} 
                            onChange={(e) => {
                              const newTypePatient = e.target.value;
                              
                              // Logique WinDev : SI MoiMême..ValeurAffichée="" ALORS
                              if (!newTypePatient) {
                                // ExécuteTraitement(BTN_Affiche_tous,trtClic) -> Charger tous les encaissements
                                setTypePatient("");
                                chargerEncaissements();
                                return;
                              }
                              
                              setTypePatient(newTypePatient);
                              chargerEncaissements();
                            }}
                            className="border-primary-subtle shadow-sm"
                          >
                            <option value="">Tous</option>
                            <option value="NON ASSURE">NON ASSURE</option>
                            <option value="TARIF MUTUALISTE">TARIF MUTUALISTE</option>
                            <option value="TARIF ASSURE">TARIF ASSURE</option>
                          </Form.Select>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Tab>
              </Tabs>
            </div>

            {/* Boutons d'action */}
            <div className="row mt-4">
              <div className="col-md-12">
                <Card className="border-0 bg-gradient-light">
                  <Card.Body className="p-3">
                    <div className="d-flex gap-3">
                      <Button 
                        variant="outline-primary" 
                        className="flex-fill py-2 px-4"
                        onClick={() => {
                          // Logique WinDev : ExécuteTraitement(BTN_Affiche_tous,trtClic)
                          // Réinitialiser tous les filtres
                          setModePaiement("TOUS LES PAIEMENTS");
                          setTypePatient("");
                          setCaissiere("");
                          setOngletActif("parCaissiere");
                          setModeAffichage("famille");
                          chargerEncaissements();
                        }}
                      >
                        <FaFilter className="me-2" />
                        Afficher tous
                      </Button>
                      <Button 
                        variant="primary" 
                        className="flex-fill py-2 px-4"
                        onClick={chargerEncaissements} 
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            Chargement...
                          </>
                        ) : (
                          <>
                            <FaFilter className="me-2" />
                            Filtrer par critères
                          </>
                        )}
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Titre dynamique */}
        <div className="row mb-4">
          <div className="col-md-12">
            <Card className="border-0 bg-primary text-white">
              <Card.Body className="text-center py-3">
                <h5 className="mb-0 fw-bold">
                  <FaCalendarAlt className="me-2" />
                  {getTitre()}
                </h5>
              </Card.Body>
            </Card>
          </div>
        </div>

        {/* Tableau des encaissements */}
        <Card className="border-0 shadow-sm">
          <Card.Header className="bg-dark text-white">
            <h6 className="mb-0">
              <FaCalendarAlt className="me-2" />
              Détail des Encaissements
            </h6>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table striped bordered hover className="mb-0">
                <thead className="table-primary">
                  <tr>
                    <th className="text-center">Date</th>
                    <th className="text-center">Type</th>
                    <th>Patient</th>
                    <th>Assurance</th>
                    <th>Désignation</th>
                    <th className="text-end">Total Acte</th>
                    <th className="text-center">Taux</th>
                    <th className="text-end">Part Assurance</th>
                    <th className="text-end">Part Patient</th>
                    <th className="text-end">Montant Encaissé</th>
                    <th className="text-end">Remise</th>
                    <th className="text-end">Reste à Payer</th>
                    <th>Médecin</th>
                    <th>Caissière</th>
                  </tr>
                </thead>
                <tbody>
                  {encaissements.map((encaissement, index) => (
                    <tr key={encaissement._id || index}>
                      <td className="text-center">{encaissement.DateEncaissement?.split('T')[0] || ''}</td>
                      <td className="text-center">{encaissement.Type}</td>
                      <td>{encaissement.Patient}</td>
                      <td>{encaissement.Assurance}</td>
                      <td>{encaissement.Designation}</td>
                      <td className="text-end fw-semibold">{encaissement.Totalacte?.toLocaleString()}</td>
                      <td className="text-center">{encaissement.Taux}%</td>
                      <td className="text-end">{encaissement.PartAssurance?.toLocaleString()}</td>
                      <td className="text-end">{encaissement.PartPatient?.toLocaleString()}</td>
                      <td className="text-end fw-bold text-success">{encaissement.Montantencaisse?.toLocaleString()}</td>
                      <td className="text-end">{encaissement.REMISE?.toLocaleString()}</td>
                      <td className="text-end text-danger">{encaissement.Restapayer?.toLocaleString()}</td>
                      <td>{encaissement.Medecin}</td>
                      <td>{encaissement.Caissiere}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="table-secondary fw-bold">
                  <tr>
                    <td colSpan={5} className="text-end">TOTAUX :</td>
                    <td className="text-end">{totaux.totalActe?.toLocaleString()}</td>
                    <td></td>
                    <td className="text-end">{totaux.totalAssurance?.toLocaleString()}</td>
                    <td className="text-end">{totaux.totalPatient?.toLocaleString()}</td>
                    <td className="text-end">{totaux.totalEncaisse?.toLocaleString()}</td>
                    <td className="text-end">{totaux.totalRemise?.toLocaleString()}</td>
                    <td className="text-end">{totaux.totalReste?.toLocaleString()}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </Table>
            </div>
          </Card.Body>
        </Card>

        {/* Boutons d'action */}
        <div className="row mt-4">
          <div className="col-md-12 text-center">
            <Card className="border-0 bg-light">
              <Card.Body className="p-3">
                <div className="d-flex gap-3 justify-content-center">
                  <Button variant="outline-secondary" onClick={onHide} className="px-4 py-2">
                    Fermer
                  </Button>
                  <Button variant="primary" className="px-4 py-2">
                    <FaPrint className="me-2" />
                    Imprimer
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default PointCaisseModal;
