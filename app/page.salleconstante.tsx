"use client";

import { useState } from 'react';
import type { FC } from 'react';
import { Button, Container, Row, Col, Card } from 'react-bootstrap';
import SalleConstante from './pages/serviceaccueil/components/SalleConstante';
import TransfertPatientModal from './pages/serviceaccueil/components/TransfertPatientModal';

const SalleConstantePreview: FC = () => {
  const [showSalleConstante, setShowSalleConstante] = useState(false);
  const [showTransfert, setShowTransfert] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<any>(null);

  // Mock data pour les tests
  const mockConsultations = [
    {
      _id: '507f1f77bcf86cd799439011',
      IDCONSULTATION: 'CONS001',
      CodePrestation: 'PREST2024001',
      PatientP: 'KOUAME Jean',
      PatientNom: 'KOUAME Jean',
      Medecin: 'Dr. TRAORE Marie',
      IDMEDECIN: '507f1f77bcf86cd799439012'
    },
    {
      _id: '507f1f77bcf86cd799439013',
      IDCONSULTATION: 'CONS002',
      CodePrestation: 'PREST2024002',
      PatientP: 'DIALLO Fatou',
      PatientNom: 'DIALLO Fatou',
      Medecin: 'Dr. KONE Ibrahim',
      IDMEDECIN: '507f1f77bcf86cd799439014'
    }
  ];

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={10}>
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0">🏥 Prévisualisation - Salle de Constante & Transfert Patient</h4>
            </Card.Header>
            <Card.Body>
              <div className="alert alert-success mb-4">
                <h5>✅ Améliorations appliquées</h5>
                <ul className="mb-0">
                  <li><strong>Validation corrigée :</strong> La fonction handleSubmit vérifie correctement les deux scénarios (SalleAttente et recherche manuelle)</li>
                  <li><strong>Messages d'erreur clairs :</strong> Affichage d'un warning si le code prestation n'est pas trouvé</li>
                  <li><strong>Feedback utilisateur :</strong> Messages de succès et d'information selon l'état des constantes</li>
                  <li><strong>Distinction des flux :</strong> Interface adaptée selon l'origine (SalleAttente vs recherche directe)</li>
                </ul>
              </div>

              <h5 className="mb-3">📝 Scénarios de test (selon la logique demandée) :</h5>

              <Row className="g-3">
                <Col md={6}>
                  <Card className="h-100 border-success">
                    <Card.Body>
                      <h6 className="text-success mb-3">📋 Scénario 1 : Depuis Salle d'Attente</h6>
                      <p className="small text-muted mb-3">
                        Clic sur "Salle d'attente" → Sélection d'une consultation → "Ajouter Constante"
                      </p>

                      <div className="d-grid gap-2">
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => {
                            setSelectedConsultation(mockConsultations[0]);
                            setShowSalleConstante(true);
                          }}
                        >
                          ✅ Nouvelle saisie (depuis SalleAttente)
                        </Button>

                        <Button
                          variant="info"
                          size="sm"
                          onClick={() => {
                            setSelectedConsultation({
                              ...mockConsultations[0],
                              hasConstantes: true
                            });
                            setShowSalleConstante(true);
                          }}
                        >
                          📝 Modification (constantes existantes)
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={6}>
                  <Card className="h-100 border-primary">
                    <Card.Body>
                      <h6 className="text-primary mb-3">🔍 Scénario 2 : Recherche Directe</h6>
                      <p className="small text-muted mb-3">
                        Clic sur "Constantes" → Saisie du code prestation → Recherche
                      </p>

                      <div className="d-grid gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setSelectedConsultation(null);
                            setShowSalleConstante(true);
                          }}
                        >
                          🔍 Recherche par code prestation
                        </Button>

                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => setShowTransfert(true)}
                        >
                          🔄 Tester Transfert Patient
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <div className="mt-4 p-3 bg-light rounded">
                <h6 className="mb-2">💡 Instructions de test :</h6>
                <div className="row">
                  <div className="col-md-6">
                    <p className="small mb-2"><strong>Scénario 1 (SalleAttente) :</strong></p>
                    <ol className="small mb-3">
                      <li>Consultation pré-sélectionnée</li>
                      <li>Code prestation en lecture seule</li>
                      <li>Formulaire vide pour nouvelle saisie</li>
                      <li>Validation directe possible</li>
                    </ol>
                  </div>
                  <div className="col-md-6">
                    <p className="small mb-2"><strong>Scénario 2 (Recherche) :</strong></p>
                    <ol className="small mb-3">
                      <li>Saisir code : <code>PREST2024001</code></li>
                      <li>Cliquer sur "Rechercher"</li>
                      <li>Si trouvé : affiche constantes existantes ou formulaire vide</li>
                      <li>Si non trouvé : warning "Code non trouvé..."</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="mt-3 p-3 border border-warning rounded bg-warning bg-opacity-10">
                <h6 className="text-warning mb-2">⚠️ Note importante :</h6>
                <p className="small mb-0">
                  Cette prévisualisation utilise des données mockées. En production, les appels API réels seront effectués
                  vers <code>/api/consultation/code</code> et <code>/api/consultation/constantes</code>.
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modals */}
      <SalleConstante
        show={showSalleConstante}
        onHide={() => setShowSalleConstante(false)}
        user="Utilisateur Test"
        consultation={selectedConsultation}
      />

      <TransfertPatientModal
        show={showTransfert}
        onHide={() => setShowTransfert(false)}
      />
    </Container>
  );
};

export default SalleConstantePreview;