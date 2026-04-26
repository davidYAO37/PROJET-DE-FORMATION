'use client';
import { useState, useEffect } from 'react';
import { Container, Card, Table, Badge, Button, Alert, Spinner } from 'react-bootstrap';
import { useRouter } from 'next/navigation';

interface PatientEnAttente {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  dateConsultation: string;
  heureConsultation: string;
  motif: string;
  statut: 'en_attente' | 'en_cours' | 'termine';
  priorite: 'basse' | 'normale' | 'urgente';
  medecinId: string;
  medecinNom?: string;
  medecinPrenom?: string;
  // État de santé
  temperature?: string;
  poids?: string;
  tension?: string;
  glycemie?: string;
  diagnostic?: string;
  codePrestation?: string;
}

export default function ListePatientAttentes() {
  const [patients, setPatients] = useState<PatientEnAttente[]>([]);
  const [loading, setLoading] = useState(true);
  const [silentLoading, setSilentLoading] = useState(false);
  const [error, setError] = useState('');
  const [medecinConnecte, setMedecinConnecte] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const router = useRouter();

  useEffect(() => {
    chargerPatientsEnAttente();
    
    // Actualiser automatiquement toutes les 30 secondes
    const interval = setInterval(() => {
      chargerPatientsEnAttente(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const chargerPatientsEnAttente = async (isSilent = false) => {
    try {
      if (!isSilent) {
        setLoading(true);
      } else {
        setSilentLoading(true);
      }
      setError('');

      // Récupérer le profil du médecin connecté
      const profilStr = localStorage.getItem('profil');
      if (!profilStr) {
        setError('Aucun profil trouvé. Veuillez vous reconnecter.');
        if (!isSilent) setLoading(false);
        else setSilentLoading(false);
        return;
      }

      const profil = JSON.parse(profilStr);
      
      // Récupérer tous les médecins pour trouver le médecin connecté
      const medecinsResponse = await fetch('/api/medecins');
      if (!medecinsResponse.ok) {
        throw new Error('Erreur lors de la récupération des médecins');
      }
      
      const allMedecins = await medecinsResponse.json();
      const connectedMedecin = allMedecins.find((medecin: any) => 
        medecin._id.toString() === profil._id ||
        (medecin.nom === profil.nom && medecin.prenoms === profil.prenom)
      );

      if (!connectedMedecin) {
        setError('Médecin non trouvé. Veuillez vous reconnecter.');
        if (!isSilent) setLoading(false);
        else setSilentLoading(false);
        return;
      }

      setMedecinConnecte(connectedMedecin);

      // Récupérer les consultations du médecin pour aujourd'hui
      const consultationsResponse = await fetch(`/api/consultations/statistiques?medecinId=${connectedMedecin._id}`);
      if (!consultationsResponse.ok) {
        throw new Error('Erreur lors de la récupération des consultations');
      }

      const consultationsData = await consultationsResponse.json();
      console.log(consultationsData, " - liste des consultations trouvées");
      
      // Les consultations sont déjà filtrées par IDMEDECIN dans l'API
      const consultationsDuMedecin = consultationsData.consultations || [];
      
      // Transformer les données en format PatientEnAttente
      const patientsEnAttente: PatientEnAttente[] = consultationsDuMedecin.map((consultation: any) => ({
        _id: consultation._id,
        nom: consultation.PatientP || 'Non spécifié',
        prenom: consultation.IdPatient?.prenoms || '',
        email: consultation.IdPatient?.email || '',
        telephone: consultation.IdPatient?.telephone || '',
        dateConsultation: consultation.Date_consulation || new Date().toISOString().split('T')[0],
        heureConsultation: consultation.Heure_Consultation || new Date().toTimeString().split(' ')[0].substring(0, 5),
        motif: consultation.designationC || 'Consultation générale',
        statut: consultation.StatutC ? 'termine' : (consultation.attenteMedecin === 1 ? 'en_cours' : 'en_attente'),
        priorite: consultation.PrixClinique > 50000 ? 'urgente' : 'normale', // Basé sur le prix
        medecinId: connectedMedecin._id,
        medecinNom: connectedMedecin.nom,
        medecinPrenom: connectedMedecin.prenoms,
        // État de santé du patient
        temperature: consultation.Temperature || '',
        poids: consultation.Poids || '',
        tension: consultation.Tension || '',
        glycemie: consultation.Glycemie || '',
        diagnostic: consultation.Diagnostic || '',
        codePrestation: consultation.CodePrestation || ''
      }));

      setPatients(patientsEnAttente);
      setLastUpdate(new Date());
      console.log("Patient attente  ",patientsEnAttente)

    } catch (err: any) {
      console.error('Erreur:', err);
      setError(err.message || 'Une erreur est survenue lors du chargement des patients');
    } finally {
      if (!isSilent) setLoading(false);
      else setSilentLoading(false);
    }
  };

  const getPrioriteBadge = (priorite: string) => {
    switch (priorite) {
      case 'urgente':
        return <Badge bg="danger">Urgent</Badge>;
      case 'normale':
        return <Badge bg="primary">Normal</Badge>;
      case 'basse':
        return <Badge bg="secondary">Bas</Badge>;
      default:
        return <Badge bg="secondary">Normal</Badge>;
    }
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'en_attente':
        return <Badge bg="warning">En attente</Badge>;
      case 'en_cours':
        return <Badge bg="info">En cours</Badge>;
      case 'termine':
        return <Badge bg="success">Terminé</Badge>;
      default:
        return <Badge bg="warning">En attente</Badge>;
    }
  };

  const commencerConsultation = async (patient: PatientEnAttente) => {
    try {
      // Mettre à jour le statut de la consultation
      const response = await fetch(`/api/consultations/${patient._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          statut: 'en_cours'
        })
      });

      if (response.ok) {
        // Rediriger vers la page de consultation
        router.push(`/pages/servicemedecin/consultation/${patient._id}`);
      } else {
        setError('Erreur lors du démarrage de la consultation');
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors du démarrage de la consultation');
    }
  };

  if (loading) {
    return (
      <Container fluid className="py-4">
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Chargement...</span>
          </Spinner>
          <p className="mt-2">Chargement des patients en attente...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">
            <i className="bi bi-people-fill me-2"></i>
            Patients en attente de consultation
          </h2>
          <div className="d-flex align-items-center">
            {silentLoading && (
              <Spinner animation="border" size="sm" className="me-2" />
            )}
            <small className="text-muted">
              <i className="bi bi-clock me-1"></i>
              Actualisation automatique toutes les 30 secondes
              {lastUpdate && (
                <span className="ms-2">
                  (Dernière mise à jour: {lastUpdate.toLocaleTimeString('fr-FR')})
                </span>
              )}
            </small>
          </div>
        </div>
        <Button variant="primary" onClick={() => chargerPatientsEnAttente()}>
          <i className="bi bi-arrow-clockwise me-1"></i>
          Actualiser
        </Button>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </Alert>
      )}

      {medecinConnecte && (
        <Alert variant="info" className="mb-4">
          <i className="bi bi-person-badge me-2"></i>
          {medecinConnecte.nom} {medecinConnecte.prenoms} - {patients.length} patient{patients.length > 1 ? 's' : ''} en attente
        </Alert>
      )}

      <Card>
        <Card.Body>
          {patients.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-people text-muted" style={{ fontSize: '3rem' }}></i>
              <h4 className="text-muted mt-3">Aucun patient en attente</h4>
              <p className="text-muted">Tous les patients ont été vus ou aucun n'est programmé pour aujourd'hui.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Patient</th>
                    <th>Date</th>
                    <th>Heure</th>
                    <th>Motif</th>
                    <th>État de santé</th>
                    <th>Priorité</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient, index) => (
                    <tr key={patient._id}>
                      <td>{index + 1}</td>
                      <td>
                        <strong>{patient.nom} {patient.prenom}</strong>
                      </td>
                     
                      <td>
                        <small>{new Date(patient.dateConsultation).toLocaleDateString('fr-FR')}</small>
                      </td>
                      <td>
                        <small>{patient.heureConsultation}</small>
                      </td>
                      <td>
                        <small>{patient.motif}</small>
                      </td>
                      <td>
                        <div className="small">
                          {patient.temperature && (
                            <div><i className="bi bi-thermometer-half text-danger me-1"></i>{patient.temperature}°C</div>
                          )}
                          {patient.tension && (
                            <div><i className="bi bi-heart-pulse text-danger me-1"></i>{patient.tension}</div>
                          )}
                          {patient.poids && (
                            <div><i className="bi bi-speedometer2 text-info me-1"></i>{patient.poids}kg</div>
                          )}
                          {patient.glycemie && (
                            <div><i className="bi bi-droplet text-warning me-1"></i>{patient.glycemie}</div>
                          )}
                          {patient.diagnostic && (
                            <div className="text-muted mt-1"><i className="bi bi-file-text me-1"></i>{patient.diagnostic}</div>
                          )}
                          {!patient.temperature && !patient.tension && !patient.poids && !patient.glycemie && (
                            <span className="text-muted">Non renseigné</span>
                          )}
                        </div>
                      </td>
                      <td>{getPrioriteBadge(patient.priorite)}</td>
                      <td>{getStatutBadge(patient.statut)}</td>
                      <td>
                        <div className="btn-group" role="group">
                          {patient.statut === 'en_attente' && (
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => commencerConsultation(patient)}
                              title="Commencer la consultation"
                            >
                              <i className="bi bi-play-fill"></i>
                            </Button>
                          )}
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => router.push(`/pages/servicemedecin/FichePrescriptionMedecin?consultationId=${patient._id}`)}
                            title="Saisir fiche prescription"
                          >
                            <i className="bi bi-file-earmark-text"></i>
                          </Button>
                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={() => router.push(`/pages/servicemedecin/fiche-patient/${patient._id}`)}
                            title="Voir la fiche patient"
                          >
                            <i className="bi bi-person"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}