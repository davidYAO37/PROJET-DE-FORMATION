'use client';
import { useState, useEffect } from 'react';
import { Card, Form, Badge, Button, Row, Col, Alert } from 'react-bootstrap';
import { IMedecin } from '@/models/medecin';
import styles from './PlanningField.module.css';

interface PlanningFieldProps {
  medecinId?: string;
  onPlanningSelect?: (planning: any) => void;
  showActions?: boolean;
  showPeriodFilter?: boolean;
  onRefresh?: () => void;
}

interface PlanningItem {
  _id: string;
  IDMEDECIN: string;
  DateDebut: Date;
  DateFin: Date;
  heureDebut: string;
  HeureFin: string;
  Dureconsul: number;
  TotalRDV: number;
  ResteRDV: number;
  DESCRIPTION?: string;
  SaisiLe: Date;
  Modifiele: Date;
  medecin?: IMedecin;
}

export default function PlanningField({ medecinId, onPlanningSelect, showActions = true, showPeriodFilter = true, onRefresh }: PlanningFieldProps) {
  const [plannings, setPlannings] = useState<PlanningItem[]>([]);
  const [medecins, setMedecins] = useState<IMedecin[]>([]);
  const [selectedMedecin, setSelectedMedecin] = useState(medecinId || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [filteredPlannings, setFilteredPlannings] = useState<PlanningItem[]>([]);
  const [deletingPlanning, setDeletingPlanning] = useState<string | null>(null);
  const [deletingPeriod, setDeletingPeriod] = useState(false);

  // Charger les médecins
  useEffect(() => {
    const fetchMedecins = async () => {
      try {
        const response = await fetch('/api/medecins');
        if (response.ok) {
          const data = await response.json();
          setMedecins(data);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des médecins:', error);
      }
    };
    fetchMedecins();
  }, []);

  // Charger les plannings
  useEffect(() => {
    if (selectedMedecin) {
      fetchPlannings(selectedMedecin);
    } else {
      setPlannings([]);
      setFilteredPlannings([]);
    }
  }, [selectedMedecin]);

  // Filtrer les plannings par période
  useEffect(() => {
    if (plannings.length > 0) {
      let filtered = [...plannings];
      
      if (dateDebut) {
        filtered = filtered.filter(planning => {
          const planningDate = new Date(planning.DateDebut);
          const startDate = new Date(dateDebut);
          return planningDate >= startDate;
        });
      }
      
      if (dateFin) {
        filtered = filtered.filter(planning => {
          const planningDate = new Date(planning.DateDebut);
          const endDate = new Date(dateFin);
          return planningDate <= endDate;
        });
      }
      
      setFilteredPlannings(filtered);
    } else {
      setFilteredPlannings([]);
    }
  }, [plannings, dateDebut, dateFin]);

  const fetchPlannings = async (medecinId: string) => {
    setLoading(true);
    setError('');
    try {
      // Récupérer l'entrepriseId depuis le localStorage
      const entrepriseId = typeof window !== 'undefined' ? localStorage.getItem('IdEntreprise') : null;
      const url = entrepriseId 
        ? `/api/planning-medecin/liste?medecinId=${medecinId}&entrepriseId=${entrepriseId}`
        : `/api/planning-medecin/liste?medecinId=${medecinId}`;
      
      console.log('📅 Chargement des plannings depuis:', url);
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Plannings reçus:', data);
        setPlannings(data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || 'Erreur lors du chargement des plannings');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleMedecinChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMedecin(e.target.value);
    // Réinitialiser les filtres de période
    setDateDebut('');
    setDateFin('');
  };

  const handleDateDebutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateDebut(e.target.value);
  };

  const handleDateFinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateFin(e.target.value);
  };

  const clearFilters = () => {
    setDateDebut('');
    setDateFin('');
  };

  const handleDeletePlanning = async (planningId: string) => {
    // Vérifier si le planning est passé
    const planning = filteredPlannings.find(p => p._id === planningId);
    if (planning && isPlanningPast(planning)) {
      alert('⚠️ Impossible de supprimer un planning passé.\n\nSeuls les plannings futurs ou en cours peuvent être supprimés.');
      return;
    }

    // Confirmation de suppression
    const confirmMessage = `⚠️ Êtes-vous sûr de vouloir supprimer ce planning ?\n\nCette action supprimera :\n- Le planning sélectionné\n- TOUS ses rendez-vous associés\n\nCette action est IRREVERSIBLE !`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setDeletingPlanning(planningId);
    try {
      // Récupérer l'entrepriseId depuis le localStorage
      const entrepriseId = typeof window !== 'undefined' ? localStorage.getItem('IdEntreprise') : null;
      const url = entrepriseId 
        ? `/api/planning-medecin/delete?planningId=${planningId}&entrepriseId=${entrepriseId}`
        : `/api/planning-medecin/delete?planningId=${planningId}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ ${result.message}`);
        
        // Rafraîchir la liste
        if (selectedMedecin) {
          await fetchPlannings(selectedMedecin);
        }
        
        // Notifier le parent
        if (onRefresh) {
          onRefresh();
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`❌ Erreur lors de la suppression: ${errorData.error || 'Erreur inconnue'}`);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du planning:', error);
      alert('❌ Erreur de connexion lors de la suppression');
    } finally {
      setDeletingPlanning(null);
    }
  };

  const handleDeletePeriodPlannings = async () => {
    if (!selectedMedecin) {
      alert('⚠️ Veuillez sélectionner un médecin');
      return;
    }

    if (!dateDebut || !dateFin) {
      alert('⚠️ Veuillez spécifier une période de début et de fin');
      return;
    }

    // Confirmation de suppression de période
    const medecin = medecins.find(m => m._id.toString() === selectedMedecin);
    const confirmMessage = `⚠️ Êtes-vous sûr de vouloir supprimer TOUS les plannings ?\n\nCette action supprimera :\n- TOUS les plannings du Dr ${medecin?.nom} ${medecin?.prenoms}\n- Du ${new Date(dateDebut).toLocaleDateString('fr-FR')} au ${new Date(dateFin).toLocaleDateString('fr-FR')}\n- TOUS les rendez-vous associés à ces plannings\n\nCette action est IRREVERSIBLE !`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setDeletingPeriod(true);
    try {
      // Récupérer l'entrepriseId depuis le localStorage
      const entrepriseId = typeof window !== 'undefined' ? localStorage.getItem('IdEntreprise') : null;
      const url = entrepriseId 
        ? `/api/planning-medecin/delete-period?medecinId=${selectedMedecin}&dateDebut=${dateDebut}&dateFin=${dateFin}&entrepriseId=${entrepriseId}`
        : `/api/planning-medecin/delete-period?medecinId=${selectedMedecin}&dateDebut=${dateDebut}&dateFin=${dateFin}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ ${result.message}`);
        
        // Rafraîchir la liste
        await fetchPlannings(selectedMedecin);
        
        // Notifier le parent
        if (onRefresh) {
          onRefresh();
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`❌ Erreur lors de la suppression: ${errorData.error || 'Erreur inconnue'}`);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression des plannings de période:', error);
      alert('❌ Erreur de connexion lors de la suppression');
    } finally {
      setDeletingPeriod(false);
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (planning: PlanningItem) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const planningDate = new Date(planning.DateDebut);
    planningDate.setHours(0, 0, 0, 0);
    
    if (planningDate < today) {
      return <Badge bg="secondary">Passé</Badge>;
    } else if (planning.ResteRDV === 0) {
      return <Badge bg="success">Complet</Badge>;
    } else if (planning.ResteRDV < planning.TotalRDV * 0.3) {
      return <Badge bg="warning">Presque complet</Badge>;
    } else {
      return <Badge bg="primary">Disponible</Badge>;
    }
  };

  const isPlanningPast = (planning: PlanningItem) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const planningDate = new Date(planning.DateDebut);
    planningDate.setHours(0, 0, 0, 0);
    
    return planningDate < today;
  };

  return (
    <div className={styles.planningField}>
      {/* Sélection du médecin et filtres */}
      <Card className={styles.selectionCard}>
        <Card.Body>
          <Row className="align-items-end">
            <Col md={4}>
              <Form.Group>
                <Form.Label className="fw-bold">
                  <i className="bi bi-person-badge me-2"></i>
                  Sélectionner un médecin
                </Form.Label>
                <Form.Select
                  value={selectedMedecin}
                  onChange={handleMedecinChange}
                  className="shadow-sm"
                >
                  <option value="">Choisir un médecin...</option>
                  {medecins.map((medecin) => (
                    <option key={medecin._id.toString()} value={medecin._id.toString()}>
                      PR {medecin.nom} {medecin.prenoms}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            
            {showPeriodFilter && selectedMedecin && (
              <>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="fw-bold">
                      <i className="bi bi-calendar-range me-2"></i>
                      Date début
                    </Form.Label>
                    <Form.Control
                      type="date"
                      value={dateDebut}
                      onChange={handleDateDebutChange}
                      className="shadow-sm"
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="fw-bold">
                      <i className="bi bi-calendar-range me-2"></i>
                      Date fin
                    </Form.Label>
                    <Form.Control
                      type="date"
                      value={dateFin}
                      onChange={handleDateFinChange}
                      min={dateDebut}
                      className="shadow-sm"
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label className="fw-bold invisible">Actions</Form.Label>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={clearFilters}
                      className="w-100"
                      disabled={!dateDebut && !dateFin}
                    >
                      <i className="bi bi-arrow-clockwise me-1"></i>
                      Réinitialiser
                    </Button>
                  </Form.Group>
                </Col>
              </>
            )}
            
            <Col md={selectedMedecin && showPeriodFilter ? 12 : 8}>
              {selectedMedecin && (
                <div className={styles.statsContainer}>
                  <Badge bg="info" className={styles.statsBadge}>
                    {filteredPlannings.length} planning{filteredPlannings.length > 1 ? 's' : ''} trouvé{filteredPlannings.length > 1 ? 's' : ''}
                    {dateDebut || dateFin ? ' (filtré)' : ''}
                  </Badge>
                  {(dateDebut || dateFin) && (
                    <Badge bg="warning" className={`ms-2 ${styles.statsBadge}`}>
                      {dateDebut && `Du ${new Date(dateDebut).toLocaleDateString('fr-FR')}`}
                      {dateDebut && dateFin && ' - '}
                      {dateFin && `Au ${new Date(dateFin).toLocaleDateString('fr-FR')}`}
                    </Badge>
                  )}
                </div>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Loading */}
      {loading && (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <Alert variant="danger" className={styles.errorAlert}>
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}

      {/* Liste des plannings */}
      {!loading && !error && filteredPlannings.length > 0 && (
        <div className={styles.planningsList}>
          {filteredPlannings.map((planning) => (
            <Card key={planning._id} className={`${styles.planningCard} mb-1`}>
              <Card.Header className={styles.cardHeader}>
                <Row className="align-items-center">
                  <Col>
                    <h5 className="mb-0">
                      <i className="bi bi-calendar-event me-2"></i>
                      {formatDate(planning.DateDebut)}
                    </h5>
                  </Col>
                  <Col className="text-end">
                    {getStatusBadge(planning)}
                  </Col>
                </Row>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={5}>
                    <div className={styles.infoGroup}>
                      <span className={styles.label}>
                        <i className="bi bi-clock me-1"></i>
                        Horaires :
                      </span>
                      <span className={styles.value}>
                        {planning.heureDebut} - {planning.HeureFin}
                      </span>
                    </div>
                    <div className={styles.infoGroup}>
                      <span className={styles.label}>
                        <i className="bi bi-hourglass-split me-1"></i>
                        Durée consultation :
                      </span>
                      <span className={styles.value}>{planning.Dureconsul} min</span>
                    </div>
                  </Col>
                  <Col md={5}>
                    <div className={styles.infoGroup}>
                      <span className={styles.label}>
                        <i className="bi bi-people me-1"></i>
                        Total RDV :
                      </span>
                      <span className={styles.value}>{planning.TotalRDV}</span>
                    </div>
                    <div className={styles.infoGroup}>
                      <span className={styles.label}>
                        <i className="bi bi-check-circle me-1"></i>
                        Reste disponible :
                      </span>
                      <span className={styles.value}>{planning.ResteRDV}</span>
                    </div>
                  </Col>
                  <Col md={2}>
                   {planning.DESCRIPTION && (
                  <div className={`mt-3 ${styles.description}`}>
                    <small className="text-muted">
                      <i className="bi bi-chat-text me-1"></i>
                      {planning.DESCRIPTION}
                    </small>
                  </div>
                )}

                {showActions && (
                  <div className={`mt-3 ${styles.actionsContainer}`}>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDeletePlanning(planning._id)}
                      disabled={deletingPlanning === planning._id || isPlanningPast(planning)}
                      title={isPlanningPast(planning) ? "Les plannings passés ne peuvent pas être supprimés" : "Supprimer ce planning"}
                    >
                      {deletingPlanning === planning._id ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1"></span>
                          Suppression...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-trash me-1"></i>
                          {isPlanningPast(planning) ? 'Non supprimable' : 'Supprimer'}
                        </>
                      )}
                    </Button>
                  </div>
                )}
                  
                  </Col>
                </Row>
                
               
              </Card.Body>
              <Card.Footer className={styles.cardFooter}>
                <small className="text-muted">
                  <i className="bi bi-calendar-plus me-1"></i>
                  Créé le {formatDate(planning.SaisiLe)}
                  {planning.Modifiele && planning.Modifiele !== planning.SaisiLe && (
                    <>
                      <span className="mx-2">•</span>
                      <i className="bi bi-pencil me-1"></i>
                      Modifié le {formatDate(planning.Modifiele)}
                    </>
                  )}
                </small>
              </Card.Footer>
            </Card>
          ))}
        </div>
      )}

      {/* Message vide */}
      {!loading && !error && selectedMedecin && filteredPlannings.length === 0 && (
        <div className={styles.emptyState}>
          <Card className={styles.emptyCard}>
            <Card.Body className="text-center py-5">
              <i className={`bi bi-calendar-x ${styles.emptyIcon}`}></i>
              <h5 className="mt-3">
                {dateDebut || dateFin ? 'Aucun planning trouvé pour cette période' : 'Aucun planning trouvé'}
              </h5>
              <p className="text-muted">
                {dateDebut || dateFin 
                  ? 'Essayez de modifier les dates de filtrage.' 
                  : 'Ce médecin n\'a pas encore de planning configuré.'
                }
              </p>
              {(dateDebut || dateFin) && (
                <Button variant="outline-primary" onClick={clearFilters}>
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Afficher tous les plannings
                </Button>
              )}
            </Card.Body>
          </Card>
        </div>
      )}

      {/* Bouton d'action pour supprimer les plannings de la période */}
      {showPeriodFilter && selectedMedecin && (dateDebut || dateFin) && (
        <Card className={`${styles.actionCard} mt-4`}>
          <Card.Body>
            <Row className="align-items-center">
              <Col>
                <h5 className="mb-0 text-danger">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Suppression par période
                </h5>
                <p className="text-muted mb-0">
                  Supprimez TOUS les plannings et rendez-vous pour la période sélectionnée
                </p>
              </Col>
              <Col className="text-end">
                <Button
                  variant="danger"
                  onClick={handleDeletePeriodPlannings}
                  disabled={deletingPeriod || !dateDebut || !dateFin}
                >
                  {deletingPeriod ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Suppression en cours...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-trash3 me-2"></i>
                      Supprimer les plannings de la période
                    </>
                  )}
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Message de sélection */}
      {!selectedMedecin && (
        <div className={styles.selectionMessage}>
          <Card className={styles.selectionMessageCard}>
            <Card.Body className="text-center py-4">
              <i className={`bi bi-person-search ${styles.selectionIcon}`}></i>
              <h5 className="mt-3">Sélectionnez un médecin</h5>
              <p className="text-muted">
                Choisissez un médecin pour voir ses plannings.
              </p>
            </Card.Body>
          </Card>
        </div>
      )}
    </div>
  );
}
