'use client';
import { useState, useEffect } from 'react';
import { Modal, Form, Button, Table, Row, Col } from 'react-bootstrap';
import { IMedecin } from '@/models/medecin';
import styles from './PlanningModal.module.css';

interface PlanningModalProps {
  show: boolean;
  onHide: () => void;
}

interface PlanningRow {
  jour: string;
  date: string;
  debut: string;
  fin: string;
  observation: string;
}

interface RdvRow {
  Heurerdv: string;
}

export default function PlanningModal({ show, onHide }: PlanningModalProps) {
  const [medecins, setMedecins] = useState<IMedecin[]>([]);
  const [selectedMedecin, setSelectedMedecin] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [heureDebut, setHeureDebut] = useState('');
  const [heureFin, setHeureFin] = useState('');
  const [duree, setDuree] = useState('10');
  const [jours, setJours] = useState({
    lundi: false,
    mardi: false,
    mercredi: false,
    jeudi: false,
    vendredi: false,
    samedi: false,
    dimanche: false
  });
  const [planningTable, setPlanningTable] = useState<PlanningRow[]>([]);
  const [rdvTable, setRdvTable] = useState<RdvRow[]>([]);
  const [nbRdvParJour, setNbRdvParJour] = useState(0);
  const [medecinsLoaded, setMedecinsLoaded] = useState(false);

  // Fonction pour réinitialiser tous les états
  const resetForm = () => {
    setSelectedMedecin('');
    setDateDebut('');
    setDateFin('');
    setHeureDebut('');
    setHeureFin('');
    setDuree('10');
    setJours({
      lundi: false,
      mardi: false,
      mercredi: false,
      jeudi: false,
      vendredi: false,
      samedi: false,
      dimanche: false
    });
    setPlanningTable([]);
    setRdvTable([]);
    setNbRdvParJour(0);
  };

  // Réinitialiser les états à chaque ouverture du modal
  useEffect(() => {
    if (show) {
      resetForm();
    }
  }, [show]);

  // Charger les médecins une seule fois
  useEffect(() => {
    const fetchMedecins = async () => {
      try {
        // Pour le moment, on charge tous les médecins sans filtrage
        const url = '/api/medecins';
        
        console.log('Chargement des médecins depuis:', url);
        
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          console.log('Médecins reçus:', data);
          setMedecins(data);
          setMedecinsLoaded(true);
        } else {
          console.error('Erreur API médecins:', response.status);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des médecins:', error);
      }
    };
    
    // Ne charger les médecins que s'ils ne sont pas déjà chargés
    if (!medecinsLoaded) {
      fetchMedecins();
    }
  }, [medecinsLoaded]);

  // Effet après saisie des dates
  useEffect(() => {
    if (dateDebut && dateFin && heureDebut && heureFin) {
      if (heureFin > heureDebut) {
        generateTimeSlots();
      }
    }
  }, [dateDebut, dateFin, heureDebut, heureFin]);

  // Effet lors du changement de la durée
  useEffect(() => {
    if (dateDebut && dateFin && heureDebut && heureFin && duree) {
      if (heureFin > heureDebut) {
        generateTimeSlots();
      }
    }
  }, [duree]);

  // Générer les créneaux horaires
  const generateTimeSlots = () => {
    if (!heureDebut || !heureFin || !duree) return;

    const debutHour = parseInt(heureDebut.split(':')[0]);
    const debutMinute = parseInt(heureDebut.split(':')[1]);
    const finHour = parseInt(heureFin.split(':')[0]);
    const finMinute = parseInt(heureFin.split(':')[1]);
    const intervalle = parseInt(duree);

    // Validation comme dans le code WLanguage
    if (debutHour >= finHour) {
      alert("Merci de saisir l'heure Début et Fin de travail svp");
      setDuree('');
      return;
    }

    const slots: RdvRow[] = [];
    
    // Heure de début
    let HeureActuelle = debutHour;
    let MinuteActuelle = debutMinute;
    
    // Heure de fin (HeureFin1-1 dans le code WLanguage)
    const HeureFin = finHour - 1;

    // Boucle principale comme dans le code WLanguage
    for (HeureActuelle = debutHour; HeureActuelle <= HeureFin; HeureActuelle++) {
      // Vérifier si l'heure actuelle est égale à l'heure de début
      if (HeureActuelle === debutHour) {
        MinuteActuelle = debutMinute;
      } else {
        // Logique de calcul des minutes comme dans WLanguage
        const moninit = MinuteActuelle + intervalle;
        if (moninit === 60) {
          MinuteActuelle = 0;
        }
        if (moninit > 60) {
          MinuteActuelle = MinuteActuelle - 60;
        }
      }
      
      // Boucle POUR pour les minutes
      for (let nMinuteActuelle = MinuteActuelle; nMinuteActuelle < 60; nMinuteActuelle += intervalle) {
        // Afficher l'heure actuelle
        slots.push({
          Heurerdv: `${HeureActuelle} H ${nMinuteActuelle} Min`
        });
        MinuteActuelle = nMinuteActuelle + intervalle;
      }
    }

    setRdvTable(slots);
    setNbRdvParJour(slots.length);
    generatePlanning();
  };

  // Générer le planning
  const generatePlanning = () => {
    if (!dateDebut || !dateFin) return;

    const planning: PlanningRow[] = [];
    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);

    for (let d = new Date(debut); d <= fin; d.setDate(d.getDate() + 1)) {
      const jourSemaine = d.getDay(); // 0 = Dimanche, 1 = Lundi, ..., 6 = Samedi
      const jourNom = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][jourSemaine];
      
      let shouldAdd = false;
      switch (jourSemaine) {
        case 1: shouldAdd = jours.lundi; break;
        case 2: shouldAdd = jours.mardi; break;
        case 3: shouldAdd = jours.mercredi; break;
        case 4: shouldAdd = jours.jeudi; break;
        case 5: shouldAdd = jours.vendredi; break;
        case 6: shouldAdd = jours.samedi; break;
        case 0: shouldAdd = jours.dimanche; break;
      }

      if (shouldAdd) {
        planning.push({
          jour: jourNom,
          date: d.toISOString().split('T')[0],
          debut: heureDebut,
          fin: heureFin,
          observation: ''
        });
      }
    }

    setPlanningTable(planning);
  };

  // Effet lors du changement des jours
  useEffect(() => {
    generatePlanning();
  }, [jours, dateDebut, dateFin, heureDebut, heureFin]);

  // Gérer le changement des jours
  const handleJourChange = (jour: keyof typeof jours) => {
    setJours(prev => ({ ...prev, [jour]: !prev[jour] }));
  };

  // Valider le planning
  const handleValider = async () => {
    if (planningTable.length === 0 || rdvTable.length === 0) {
      alert("Le planning ou les heures du rendez-vous ne sont pas correctement définis");
      return;
    }

    if (!selectedMedecin) {
      alert("Veuillez indiquer le médecin avant de continuer cette opération");
      return;
    }

    // Récupérer l'IdEntreprise et l'utilisateur depuis le localStorage
    const idEntreprise = typeof window !== 'undefined' ? localStorage.getItem('IdEntreprise') : null;
    const utilisateur = typeof window !== 'undefined' ? localStorage.getItem('nom_utilisateur') || localStorage.getItem('userName') || 'utilisateur' : 'utilisateur';

    try {
      const response = await fetch('/api/planning-medecin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          medecinId: selectedMedecin,
          dateDebut,
          dateFin,
          heureDebut,
          heureFin,
          duree: parseInt(duree),
          jours,
          planningTable,
          rdvTable,
          entrepriseId: idEntreprise,
          utilisateur: utilisateur
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Afficher un message détaillé des actions effectuées
        let message = "✅ Planning traité avec succès!\n\n";
        
        if (result.details) {
          message += `📊 **Actions effectuées :**\n`;
          message += `• Plannings créés : ${result.details.planningsCrees}\n`;
          message += `• Plannings modifiés : ${result.details.planningsModifies}\n\n`;
          
          message += `👥 **Rendez-vous :**\n`;
          message += `• RDV avec patient conservés : ${result.details.rdvConserve}\n`;
          message += `• RDV disponibles supprimés : ${result.details.rdvSupprime}\n`;
          message += `• Nouveaux RDV créés : ${result.details.nouveauxRdv}\n\n`;
          
          if (result.details.rdvConserve > 0) {
            message += `⚠️ **Important :** ${result.details.rdvConserve} rendez-vous avec patient ont été conservés et ne peuvent pas être modifiés.`;
          }
        } else {
          message += result.message || "Opération terminée";
        }

        // Afficher dans une alerte améliorée
        if (typeof window !== 'undefined' && window.confirm !== undefined) {
          // Utiliser confirm pour un meilleur affichage
          const confirmation = confirm(message + "\n\nVoulez-vous continuer ?");
          if (confirmation) {
            resetForm(); // Réinitialiser avant de fermer
            onHide();
          }
        } else {
          alert(message);
          resetForm(); // Réinitialiser avant de fermer
          onHide();
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Erreur lors de la création du planning: ${errorData.error || 'Erreur inconnue'}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert("Erreur lors de la création du planning");
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" className={styles.planningModal}>
      <Modal.Header closeButton className={styles.modalHeader}>
        <Modal.Title className={styles.modalTitle}>
          <i className="bi bi-calendar-week me-2"></i>
          FICHE DE SAISIE PLANNING MED
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className={styles.modalBody}>
        <Form>
          <Row className="mb-4">
            {/* Colonne de gauche - Paramètres */}
            <Col md={6}>
              <h5 className="mb-3 text-primary">
                <i className="bi bi-gear-fill me-2"></i>
                Paramètres du Planning
              </h5>
              
              <Row className="mb-3">
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="fw-bold">Médecin</Form.Label>
                    <Form.Select
                      value={selectedMedecin}
                      onChange={(e) => setSelectedMedecin(e.target.value)}
                      className="shadow-sm"
                    >
                      <option value="">Sélectionner un médecin</option>
                      {medecins.map((medecin) => (
                        <option key={medecin._id.toString()} value={medecin._id.toString()}>
                          PR {medecin.nom} {medecin.prenoms}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold">Date Début</Form.Label>
                    <Form.Control
                      type="date"
                      value={dateDebut}
                      onChange={(e) => setDateDebut(e.target.value)}
                      className="shadow-sm"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold">Date Fin</Form.Label>
                    <Form.Control
                      type="date"
                      value={dateFin}
                      onChange={(e) => setDateFin(e.target.value)}
                      className="shadow-sm"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold">Heure Début</Form.Label>
                    <Form.Control
                      type="time"
                      value={heureDebut}
                      onChange={(e) => setHeureDebut(e.target.value)}
                      className="shadow-sm"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold">Heure Fin</Form.Label>
                    <Form.Control
                      type="time"
                      value={heureFin}
                      onChange={(e) => setHeureFin(e.target.value)}
                      className="shadow-sm"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold">Durée (Min)</Form.Label>
                    <Form.Select
                      value={duree}
                      onChange={(e) => setDuree(e.target.value)}
                      className="shadow-sm"
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="15">15</option>
                      <option value="20">20</option>
                      <option value="30">30</option>
                      <option value="45">45</option>
                      <option value="60">60</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold text-success">RDV par jour</Form.Label>
                    <Form.Control
                      type="text"
                      value={nbRdvParJour}
                      readOnly
                      className="bg-light border-success shadow-sm fw-bold text-center"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={12}>
                  <Form.Label className="fw-bold">Jours de travail</Form.Label>
                  <div className="d-flex flex-wrap gap-3 p-3 bg-light rounded">
                    {Object.entries(jours).map(([jour, checked]) => (
                      <div key={jour} className={`form-check ${styles.formCheck}`}>
                        <Form.Check
                          type="checkbox"
                          label={jour.charAt(0).toUpperCase() + jour.slice(1)}
                          checked={checked}
                          onChange={() => handleJourChange(jour as keyof typeof jours)}
                          className={styles.formCheckInputCustom}
                        />
                      </div>
                    ))}
                  </div>
                </Col>
              </Row>
            </Col>

            {/* Colonne de droite - Planning */}
            <Col md={6}>
              <h5 className="mb-3 text-success">
                <i className="bi bi-calendar-check-fill me-2"></i>
                Planning Médecin
              </h5>
              
              <div className={`table-responsive ${styles.tableResponsive}`} style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <Table striped bordered hover className={`shadow-sm ${styles.tableResponsive}`}>
                  <thead className={`table-dark sticky-top ${styles.tableDark}`}>
                    <tr>
                      <th className="text-center">Jour</th>
                      <th className="text-center">Date</th>
                      <th className="text-center">Début</th>
                      <th className="text-center">Fin</th>
                      <th className="text-center">Obs.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {planningTable.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center text-muted py-4">
                          <i className="bi bi-calendar-x fs-3 d-block mb-2"></i>
                          Aucun planning généré
                        </td>
                      </tr>
                    ) : (
                      planningTable.map((row, index) => (
                        <tr key={index} className={styles.hoverRow}>
                          <td className="text-center fw-bold">{row.jour}</td>
                          <td className="text-center">{row.date}</td>
                          <td className="text-center">
                            <span className={`badge bg-primary ${styles.badge}`}>{row.debut}</span>
                          </td>
                          <td className="text-center">
                            <span className={`badge bg-danger ${styles.badge}`}>{row.fin}</span>
                          </td>
                          <td className="text-center">
                            <Form.Control
                              type="text"
                              placeholder="..."
                              size="sm"
                              className="border-0 bg-transparent text-center"
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>

              {planningTable.length > 0 && (
                <div className="mt-3 p-2 bg-info bg-opacity-10 rounded text-center">
                  <small className="text-info fw-bold">
                    <i className="bi bi-info-circle me-1"></i>
                    {planningTable.length} jour(s) de planning généré(s)
                  </small>
                </div>
              )}
            </Col>
          </Row>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Annuler
        </Button>
        <Button variant="primary" onClick={handleValider}>
          Valider Planning
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
