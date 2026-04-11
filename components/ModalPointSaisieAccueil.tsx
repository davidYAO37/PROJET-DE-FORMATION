'use client';
import { useState, useEffect } from 'react';
import { Modal, Form, Button, Table, Row, Col } from 'react-bootstrap';
import { useEntreprise } from "@/hooks/useEntreprise";
import { generatePrintHeader, generatePrintFooter, createPrintWindow, createPrintWindowWithoutHeader, extractContentWithoutHeaderAndFooter } from "@/utils/printRecu";

interface PointSaisieData {
  id: string;
  date: string;
  patientPrestation: string;
  designation: string;
  prixClinique: string;
  ticketModerateur: string;
  partAssurance: string;
  statutPaiement: string;
  saisiPar?: string;
  type?: string; // Type de donnée (CONSULTATION, EXAMEN_HOSPITALISATION, etc.)
}

interface ModalPointSaisieAccueilProps {
  show: boolean;
  onHide: () => void;
  user?: string;
}

export default function ModalPointSaisieAccueil({ show, onHide, user }: ModalPointSaisieAccueilProps) {
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [donnees, setDonnees] = useState<PointSaisieData[]>([]);
  const [loading, setLoading] = useState(false);
  const { entreprise } = useEntreprise();

  // Fonction d'impression améliorée avec en-tête entreprise
  const handlePrint = () => {
    const totalPrix = donnees.reduce((sum, item) => sum + parseFloat(item.prixClinique || '0'), 0);
    const totalTicket = donnees.reduce((sum, item) => sum + parseFloat(item.ticketModerateur || '0'), 0);
    const totalAssurance = donnees.reduce((sum, item) => sum + parseFloat(item.partAssurance || '0'), 0);
    const totalGeneral = totalPrix + totalTicket + totalAssurance;

    const printContent = `
      <div class="sub-header text-center mb-4">
        <strong>POINT DE SAISIE ACCUEIL</strong>
      </div>
      <div class="info mb-3">
        <div class="d-flex justify-content-between mb-2">
          <span><strong>Période:</strong> ${new Date(dateDebut).toLocaleDateString('fr-FR')} au ${new Date(dateFin).toLocaleDateString('fr-FR')}</span>
          <span><strong>Date d'impression:</strong> ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</span>
        </div>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Patient => Prestation</th>
            <th>Désignation</th>
            <th>Prix Clinique</th>
            <th>Ticket Mod.</th>
            <th>Part Ass.</th>
            <th>Statut</th>
            <th>Saisi par</th>
          </tr>
        </thead>
        <tbody>
          ${donnees.map(item => `
            <tr>
              <td>${new Date(item.date).toLocaleDateString('fr-FR')}</td>
              <td>${item.patientPrestation}</td>
              <td>${item.designation}</td>
              <td>${parseFloat(item.prixClinique || '0').toFixed(2)} FCFA</td>
              <td>${parseFloat(item.ticketModerateur || '0').toFixed(2)} FCFA</td>
              <td>${parseFloat(item.partAssurance || '0').toFixed(2)} FCFA</td>
              <td>
                <span class="badge ${
                  item.statutPaiement?.toLowerCase().includes('pas facturé') || item.statutPaiement === 'Pas Facturé' ? 'bg-secondary' : 
                  item.statutPaiement?.toLowerCase().includes('facturé') || item.statutPaiement === 'Facturé' ? 'bg-success' : 
                  item.statutPaiement?.toLowerCase().includes('en cours') || item.statutPaiement === 'En cours' ? 'bg-warning' : 
                  item.statutPaiement?.toLowerCase().includes('payé') || item.statutPaiement === 'Payé' ? 'bg-success' :
                  item.statutPaiement?.toLowerCase().includes('non payé') || item.statutPaiement === 'Non payé' ? 'bg-danger' :
                  item.statutPaiement === '' || !item.statutPaiement ? 'bg-secondary' : 'bg-info'
                }">
                  ${item.statutPaiement || ''}
                </span>
              </td>
              <td>${item.saisiPar || ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="mt-4">
        <div class="d-flex justify-content-between mb-2">
          <span><strong>Total Prix Clinique:</strong></span>
          <span><strong>${totalPrix.toFixed(2)} FCFA</strong></span>
        </div>
        <div class="d-flex justify-content-between mb-2">
          <span><strong>Total Ticket Modérateur:</strong></span>
          <span><strong>${totalTicket.toFixed(2)} FCFA</strong></span>
        </div>
        <div class="d-flex justify-content-between mb-2">
          <span><strong>Total Part Assurance:</strong></span>
          <span><strong>${totalAssurance.toFixed(2)} FCFA</strong></span>
        </div>
        <div class="d-flex justify-content-between fw-bold" style="border-top: 1px solid #000; padding-top: 5px;">
          <span><strong>TOTAL GÉNÉRAL:</strong></span>
          <span><strong>${totalGeneral.toFixed(2)} FCFA</strong></span>
        </div>
      </div>

      <div class="info mt-3">
        <div class="d-flex justify-content-between">
          <div>
            <strong>Imprimé par:</strong> ${user || 'Utilisateur'}<br/>
            <strong>Système:</strong> Easy Medical<br/>
            <strong>Total enregistrements:</strong> ${donnees.length}
          </div>
          <div class="text-end">
            <strong>Généré le:</strong> ${new Date().toLocaleString('fr-FR')}
          </div>
        </div>
      </div>
    `;

    const headerHTML = generatePrintHeader(entreprise);
    const footerHTML = generatePrintFooter(entreprise);
    
    createPrintWindow('Point de Saisie Accueil', headerHTML, printContent, footerHTML);
  };

  // Fonction d'impression sans en-tête
  const handlePrintWithoutHeader = () => {
    const totalPrix = donnees.reduce((sum, item) => sum + parseFloat(item.prixClinique || '0'), 0);
    const totalTicket = donnees.reduce((sum, item) => sum + parseFloat(item.ticketModerateur || '0'), 0);
    const totalAssurance = donnees.reduce((sum, item) => sum + parseFloat(item.partAssurance || '0'), 0);
    const totalGeneral = totalPrix + totalTicket + totalAssurance;

    const printContent = `
      <div class="sub-header text-center mb-4">
        <strong>POINT DE SAISIE ACCUEIL</strong>
      </div>
      <div class="info mb-3">
        <div class="d-flex justify-content-between mb-2">
          <span><strong>Période:</strong> ${new Date(dateDebut).toLocaleDateString('fr-FR')} au ${new Date(dateFin).toLocaleDateString('fr-FR')}</span>
          <span><strong>Date d'impression:</strong> ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</span>
        </div>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Patient => Prestation</th>
            <th>Désignation</th>
            <th>Prix Clinique</th>
            <th>Ticket Mod.</th>
            <th>Part Ass.</th>
            <th>Statut</th>
            <th>Saisi par</th>
          </tr>
        </thead>
        <tbody>
          ${donnees.map(item => `
            <tr>
              <td>${new Date(item.date).toLocaleDateString('fr-FR')}</td>
              <td>${item.patientPrestation}</td>
              <td>${item.designation}</td>
              <td>${parseFloat(item.prixClinique || '0').toFixed(2)} FCFA</td>
              <td>${parseFloat(item.ticketModerateur || '0').toFixed(2)} FCFA</td>
              <td>${parseFloat(item.partAssurance || '0').toFixed(2)} FCFA</td>
              <td>
                <span class="badge ${
                  item.statutPaiement?.toLowerCase().includes('pas facturé') || item.statutPaiement === 'Pas Facturé' ? 'bg-secondary' : 
                  item.statutPaiement?.toLowerCase().includes('facturé') || item.statutPaiement === 'Facturé' ? 'bg-success' : 
                  item.statutPaiement?.toLowerCase().includes('en cours') || item.statutPaiement === 'En cours' ? 'bg-warning' : 
                  item.statutPaiement?.toLowerCase().includes('payé') || item.statutPaiement === 'Payé' ? 'bg-success' :
                  item.statutPaiement?.toLowerCase().includes('non payé') || item.statutPaiement === 'Non payé' ? 'bg-danger' :
                  item.statutPaiement === '' || !item.statutPaiement ? 'bg-secondary' : 'bg-info'
                }">
                  ${item.statutPaiement || ''}
                </span>
              </td>
              <td>${item.saisiPar || ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="mt-4">
        <div class="d-flex justify-content-between mb-2">
          <span><strong>Total Prix Clinique:</strong></span>
          <span><strong>${totalPrix.toFixed(2)} FCFA</strong></span>
        </div>
        <div class="d-flex justify-content-between mb-2">
          <span><strong>Total Ticket Modérateur:</strong></span>
          <span><strong>${totalTicket.toFixed(2)} FCFA</strong></span>
        </div>
        <div class="d-flex justify-content-between mb-2">
          <span><strong>Total Part Assurance:</strong></span>
          <span><strong>${totalAssurance.toFixed(2)} FCFA</strong></span>
        </div>
        <div class="d-flex justify-content-between fw-bold" style="border-top: 1px solid #000; padding-top: 5px;">
          <span><strong>TOTAL GÉNÉRAL:</strong></span>
          <span><strong>${totalGeneral.toFixed(2)} FCFA</strong></span>
        </div>
      </div>

      <div class="info mt-3">
        <div class="d-flex justify-content-between">
          <div>
            <strong>Imprimé par:</strong> ${user || 'Utilisateur'}<br/>
            <strong>Système:</strong> Easy Medical<br/>
            <strong>Total enregistrements:</strong> ${donnees.length}
          </div>
          <div class="text-end">
            <strong>Généré le:</strong> ${new Date().toLocaleString('fr-FR')}
          </div>
        </div>
      </div>
    `;

    createPrintWindowWithoutHeader('Point de Saisie Accueil (sans entête)', printContent);
  };

  // Initialiser les dates avec la date du jour et réinitialiser à l'ouverture du modal
  useEffect(() => {
    if (show) {
      const today = new Date().toISOString().split('T')[0];
      setDateDebut(today);
      setDateFin(today);
      setDonnees([]);
    }
  }, [show]);


  const handleRechercher = async () => {
    // Validation des dates
    if (!dateDebut || !dateFin) {
      alert('Veuillez saisir votre période de recherche');
      return;
    }

    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);

    if (debut > fin) {
      alert('Mauvaise période\nMerci de saisir la bonne période de recherche avant cette opération');
      return;
    }

    setLoading(true);
    setDonnees([]);

    try {
      // Appel API pour la recherche
      await rechercherDonneesAPI(debut, fin);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      alert('Erreur lors de la recherche des données');
    } finally {
      setLoading(false);
    }
  };

  const rechercherDonneesAPI = async (debut: Date, fin: Date) => {
    try {
      const response = await fetch('/api/point-saisie', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateDebut: debut.toISOString().split('T')[0],
          dateFin: fin.toISOString().split('T')[0],
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la recherche');
      }

      // Transformer les données de l'API pour correspondre à l'interface
      const transformedData: PointSaisieData[] = result.data.map((item: any) => ({
        id: item.id,
        date: item.date,
        patientPrestation: item.patientPrestation,
        designation: item.designation,
        prixClinique: item.prixClinique,
        ticketModerateur: item.ticketModerateur,
        partAssurance: item.partAssurance,
        statutPaiement: item.statutPaiement,
        saisiPar: item.saisiPar,
        type: item.type,
      }));

      setDonnees(transformedData);

    } catch (error) {
      console.error('Erreur lors de l\'appel API:', error);
      throw error;
    }
  };

  const handleSupprimerTout = () => {
    setDonnees([]);
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Point de Saisie - Recherche</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Row className="mb-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Date de début</Form.Label>
                <Form.Control
                  type="date"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  placeholder="Date de début"
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Date de fin</Form.Label>
                <Form.Control
                  type="date"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                  placeholder="Date de fin"
                />
              </Form.Group>
            </Col>
            <Col md={4} className="d-flex align-items-end">
              <Button 
                variant="primary" 
                onClick={handleRechercher}
                disabled={loading}
              >
                {loading ? 'Recherche en cours...' : 'Rechercher'}
              </Button>
              <Button 
                variant="secondary" 
                onClick={handleSupprimerTout}
                className="ms-2"
                disabled={donnees.length === 0}
              >
                Supprimer tout
              </Button>
            </Col>
          </Row>
        </Form>

        {donnees.length > 0 && (
          <div>
            {/* En-tête d'impression */}
            <div className="d-none d-print-block mb-4">
              <div className="text-center mb-3">
                <h4 className="text-primary">Point de Saisie Accueil</h4>
              </div>
              <div className="border-bottom pb-2 mb-3">
                <Row>
                  <Col md={6}>
                    <strong>Période:</strong> {new Date(dateDebut).toLocaleDateString('fr-FR')} au {new Date(dateFin).toLocaleDateString('fr-FR')}
                  </Col>
                  <Col md={6} className="text-end">
                    <strong>Date d'impression:</strong> {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}
                  </Col>
                </Row>
              </div>
            </div>

            <div className="mt-4 d-print-none">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Résumé Financier</h5>
                <div>
                  <Button variant="primary" onClick={handlePrint} className="me-2">
                    🖨️ Imprimer avec entête
                  </Button>
                  <Button variant="secondary" onClick={handlePrintWithoutHeader}>
                    📄 Imprimer sans entête
                  </Button>
                </div>
              </div>
            </div>
            
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <Table striped bordered hover responsive>
                <thead className="table-dark sticky-top">
                  <tr>
                    <th>Date</th>
                    <th>Patient =&gt; Prestation</th>
                    <th>Désignation</th>
                    <th>Prix Clinique</th>
                    <th>Ticket Modérateur</th>
                    <th>Part Assurance</th>
                    <th>Statut Paiement</th>
                    <th>Saisi par</th>
                  </tr>
                </thead>
                <tbody>
                  {donnees.map((item) => (
                    <tr key={item.id}>
                      <td>{new Date(item.date).toLocaleDateString('fr-FR')}</td>
                      <td>{item.patientPrestation}</td>
                      <td>{item.designation}</td>
                      <td>{item.prixClinique}</td>
                      <td>{item.ticketModerateur}</td>
                      <td>{item.partAssurance}</td>
                      <td>
                        <span className={`badge ${
                          item.statutPaiement?.toLowerCase().includes('pas facturé') || item.statutPaiement === 'Pas Facturé' ? 'bg-secondary' : 
                          item.statutPaiement?.toLowerCase().includes('facturé') || item.statutPaiement === 'Facturé' ? 'bg-success' : 
                          item.statutPaiement?.toLowerCase().includes('en cours') || item.statutPaiement === 'En cours' ? 'bg-warning' : 
                          item.statutPaiement?.toLowerCase().includes('payé') || item.statutPaiement === 'Payé' ? 'bg-success' :
                          item.statutPaiement?.toLowerCase().includes('non payé') || item.statutPaiement === 'Non payé' ? 'bg-danger' :
                          item.statutPaiement === '' || !item.statutPaiement ? 'bg-secondary' : 'bg-info'
                        }`}>
                          {item.statutPaiement || ''}
                        </span>
                      </td>
                      <td>{item.saisiPar}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </div>
        )}

        {donnees.length === 0 && dateDebut && dateFin && !loading && (
          <div className="alert alert-info mt-3">
            Aucune donnée trouvée pour la période spécifiée
          </div>
        )}

        {donnees.length > 0 && (
          <div className="mt-4">
            <Row>
              <Col md={4} className="mb-3">
                <div className="card border-primary">
                  <div className="card-body text-center">
                    <div className="text-primary mb-2">
                      <strong>Prix Clinique</strong>
                    </div>
                    <h4 className="mb-0 text-primary">
                      {donnees.reduce((sum, item) => sum + parseFloat(item.prixClinique || '0'), 0).toFixed(2)} FCFA
                    </h4>
                  </div>
                </div>
              </Col>
              <Col md={4} className="mb-3">
                <div className="card border-warning">
                  <div className="card-body text-center">
                    <div className="text-warning mb-2">
                      <strong>Ticket Modérateur</strong>
                    </div>
                    <h4 className="mb-0 text-warning">
                      {donnees.reduce((sum, item) => sum + parseFloat(item.ticketModerateur || '0'), 0).toFixed(2)} FCFA
                    </h4>
                  </div>
                </div>
              </Col>
              <Col md={4} className="mb-3">
                <div className="card border-info">
                  <div className="card-body text-center">
                    <div className="text-info mb-2">
                      <strong>Part Assurance</strong>
                    </div>
                    <h4 className="mb-0 text-info">
                      {donnees.reduce((sum, item) => sum + parseFloat(item.partAssurance || '0'), 0).toFixed(2)} FCFA
                    </h4>
                  </div>
                </div>
              </Col>
            </Row>
            <Row className="mt-3">
              <Col md={12}>
                <div className="card border-success">
                  <div className="card-body text-center">
                    <div className="text-success mb-2">
                      <strong>Total Général</strong>
                    </div>
                    <h3 className="mb-0 text-success">
                      {(
                          donnees.reduce((sum, item) => sum + parseFloat(item.prixClinique || '0'), 0) +
                          donnees.reduce((sum, item) => sum + parseFloat(item.ticketModerateur || '0'), 0) +
                          donnees.reduce((sum, item) => sum + parseFloat(item.partAssurance || '0'), 0)
                        ).toFixed(2)} FCFA
                      </h3>
                    </div>
                  </div>
                </Col>
              </Row>
              
              {/* Pied de page d'impression */}
              <div className="d-none d-print-block mt-5">
                <div className="border-top pt-3">
                  <Row className="mt-3">
                    <Col md={6}>
                      <small className="text-muted">
                        <strong>Imprimé par:</strong> {user || 'Utilisateur'}<br/>
                        <strong>Système:</strong> Easy Medical
                      </small>
                    </Col>
                    <Col md={6} className="text-end">
                      <small className="text-muted">
                        <strong>Total enregistrements:</strong> {donnees.length}<br/>
                        <strong>Généré le:</strong> {new Date().toLocaleString('fr-FR')}
                      </small>
                    </Col>
                  </Row>
                </div>
              </div>
            </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Fermer
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
