// app/pages/servicelaboratoire/tlaboratoire/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Container, Form, InputGroup, ButtonGroup, Nav, Table, Modal } from 'react-bootstrap';
import Barcode from 'react-barcode';
import SaisieResultat from '../../SaisieResultat/page';

export default function Dashboard() {
   // Par défaut : premier et dernier jour du mois en cours
    const now = new Date();
    const premierJour = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const dernierJour = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  
    const [startDate, setStartDate] = useState(premierJour);
    const [endDate, setEndDate] = useState(dernierJour);
  
  const [activeKey, setActiveKey] = useState<string>('reception');

  const [receptions, setReceptions] = useState<any[]>([]);
  const [loadingReceptions, setLoadingReceptions] = useState(false);
  const [receptionError, setReceptionError] = useState<string | null>(null);
  const [receptionningId, setReceptionningId] = useState<string | null>(null);
  const [resultats, setResultats] = useState<any[]>([]);
  const [loadingResultats, setLoadingResultats] = useState(false);
  const [resultatsError, setResultatsError] = useState<string | null>(null);
  const [annulerningId, setAnnulerningId] = useState<string | null>(null);
  const [showSaisieResultatModal, setShowSaisieResultatModal] = useState(false);
  const [selectedIdHospitalisation, setSelectedIdHospitalisation] = useState<string>('');
  const [envoyerBilogisteId, setEnvoyerBilogisteId] = useState<string | null>(null);
  const [saisieInitialProps, setSaisieInitialProps] = useState({
    ProvenanceExamen: '',
    NIdentificationExamen: '',
    Externe_Interne: '',
    CONCLUSIONGENE: '',
    idMedecin: '',
  });



  const getUtilisateur = () => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem("nom_utilisateur");
      return user;
    }
    return 'Utilisateur';
  };

  const loadReceptions = async () => {
    setReceptionError(null);
    setLoadingReceptions(true);

    const start = startDate || new Date().toISOString().slice(0, 10);
    const end = endDate || new Date().toISOString().slice(0, 10);

    try {
      const response = await fetch(
        `/api/ReceptionExamenLabo/ListeAreceptioner?startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Erreur de chargement des réceptions.');
      }

      setReceptions(data);
      setActiveKey('reception');
    } catch (error) {
      console.error('Erreur chargement réceptions :', error);
      setReceptionError((error as Error).message);
      setReceptions([]);
    } finally {
      setLoadingReceptions(false);
    }
  };

  const loadResultats = async () => {
    setResultatsError(null);
    setLoadingResultats(true);

    const start = startDate || new Date().toISOString().slice(0, 10);
    const end = endDate || new Date().toISOString().slice(0, 10);

    try {
      const response = await fetch(
        `/api/ReceptionExamenLabo/ListeAsaisir?startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Erreur de chargement des résultats à saisir.');
      }

      setResultats(data);
    } catch (error) {
      console.error('Erreur chargement resultats :', error);
      setResultatsError((error as Error).message);
      setResultats([]);
    } finally {
      setLoadingResultats(false);
    }
  };

  const handleReceptionner = async (idHospitalisation: string) => {
    const confirmed = window.confirm('Voulez-vous réceptionner ce patient ?');
    if (!confirmed) return;

    setReceptionningId(idHospitalisation);
    try {
      const response = await fetch('/api/ReceptionExamenLabo/receptionner', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idHospitalisation,
          receptionnerPar: getUtilisateur(),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Erreur lors de la réception.');
      }

      await loadReceptions();
      window.dispatchEvent(new Event('labo-counts-updated'));
      alert('✅ Examen réceptionné avec succès.');
    } catch (error) {
      console.error('Erreur réception :', error);
      alert(`❌ ${(error as Error).message}`);
    } finally {
      setReceptionningId(null);
    }
  };
// envoie le resultat au biologiste

  const handleEnvoyerBilogiste = async (idHospitalisation: string) => {
    const confirmed = window.confirm('Voulez-vous envoyer le resultat de ce patient au biologiste ?');
    if (!confirmed) return;

    setEnvoyerBilogisteId(idHospitalisation);
    try {
      const response = await fetch('/api/ReceptionExamenLabo/envoyerResultat', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idHospitalisation,
          Transferepar: getUtilisateur(),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Erreur lors de l\'envoi au biologiste.');
      }

      await loadReceptions();
      window.dispatchEvent(new Event('labo-counts-updated'));
      alert('✅ Resultat envoyé au biologiste avec succès.');
    } catch (error) {
      console.error('Erreur envoi au biologiste :', error);
      alert(`❌ ${(error as Error).message}`);
    } finally {
      setEnvoyerBilogisteId(null);
    }
  };

// Annuler la réception
  const handleAnnulerReception = async (idHospitalisation: string) => {
    const confirmed = window.confirm('Voulez-vous annuler la réception de ce patient ?');
    if (!confirmed) return;

    setAnnulerningId(idHospitalisation);
    try {
      const response = await fetch('/api/ReceptionExamenLabo/AnnulerReception', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idHospitalisation,
          receptionnerPar: getUtilisateur(),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Erreur lors de l\'annulation de la réception.');
      }

      await loadReceptions();
      window.dispatchEvent(new Event('labo-counts-updated'));
      alert('✅ Réception annulée avec succès.');
    } catch (error) {
      console.error('Erreur annulation de la réception :', error);
      alert(`❌ ${(error as Error).message}`);
    } finally {
      setAnnulerningId(null);
    }
  };

  const handlePrintBarcodes = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <Container className="py-4">
      {/* Bande défilante de notifications */}
      <div
        className="mb-3 py-2 px-3 rounded shadow-sm"
        style={{ background: 'linear-gradient(90deg, #1e3a5f, #2d5a8e)', overflow: 'hidden' }}
      >
        <div
          style={{
            display: 'flex',
            whiteSpace: 'nowrap',
            animation: 'scroll-left 50s linear infinite',
          }}
        >
          <span className="text-white fw-semibold me-5">
            <i className="bi bi-bell-fill text-warning me-2"></i>
            🟢 Examens à réceptionner : <span className="badge bg-success">{receptions.length}</span>
          </span>
          <span className="text-white fw-semibold me-5">
            🔴 Résultats à saisir : <span className="badge bg-danger">{resultats.length}</span>
          </span>
          <span className="text-white fw-semibold me-5">
            🟡 Résultats retournés par le biologiste : <span className="badge bg-warning text-dark">consulter liste retour</span>
          </span>
          <span className="text-white fw-semibold me-5">
            📅 Période : {startDate} au {endDate}
          </span>
        </div>
      </div>
      <style>{`
        @keyframes scroll-left {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
      <h2 className="mb-4 text-primary">Bienvenue sur le Tableau de Bord</h2>
      <Row className="g-4 mt-2">
        <Col>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title className="h5 mb-3">Filtrer par Période</Card.Title>
              <Form>
                <Row className="align-items-end gy-2">
                  <Col xs={12} md={3}>
                    <Form.Label className="small text-muted">Début</Form.Label>
                    <Form.Control
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </Col>
                  <Col xs={12} md={3}>
                    <Form.Label className="small text-muted">Fin</Form.Label>
                    <Form.Control
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </Col>
                  <Col xs={12} md={6} className="d-flex gap-2">
                    <ButtonGroup className="ms-auto">
                      <Button variant="outline-primary" onClick={loadReceptions}>
                        Nouvelle Réception
                      </Button>
                      <Button
                        variant="outline-secondary"
                        onClick={() => {
                          setActiveKey('resultats');
                          loadResultats();
                        }}
                      >
                        Resultat a saisir et code barre
                      </Button>
                    </ButtonGroup>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <div className="mt-3">
        <Nav variant="tabs" activeKey={activeKey} onSelect={(k) => {
          if (!k) return;
          setActiveKey(k);
          if (k === 'resultats') {
            loadResultats();
          }
        }}>
          <Nav.Item>
            <Nav.Link eventKey="reception" className="d-none">Les Réceptions</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="resultats" className="d-none">Les Résultats à Saisir et Code Barre</Nav.Link>
          </Nav.Item>
        </Nav>

        {/* Liste des receptions */}
        {activeKey === 'reception' && (
          <div className="mt-3">
            <strong className="text-dark mb-3">Liste des examens à réceptionner</strong>
            <Table responsive striped bordered hover className="align-middle">
              <thead>
                <tr>
                  <th>Saisie le</th>
                  <th>N°Prestation</th>
                  <th>Designation</th>
                  <th>Patient</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingReceptions ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4">
                      Chargement des réceptions...
                    </td>
                  </tr>
                ) : receptionError ? (
                  <tr>
                    <td colSpan={5} className="text-center text-danger py-4">
                      {receptionError}
                    </td>
                  </tr>
                ) : receptions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4">
                      Aucun examen trouvé pour la période sélectionnée.
                    </td>
                  </tr>
                ) : (
                  receptions.map((item) => (
                    <tr key={item._id ?? item.IDHOSPITALISATION ?? JSON.stringify(item)}>
                      <td>{item.DatePres ? new Date(item.DatePres).toISOString().slice(0, 10) : ''}</td>
                      <td>{item.CodePrestation ?? ''}</td>
                      <td>{item.Designationtypeacte ?? item.IDTYPE_ACTE ?? ''}</td>
                      <td>{item.PatientP ?? ''}</td>
                      <td>
                        <Button
                          variant="outline-success"
                          size="sm"
                          disabled={receptionningId === item._id || item.StatutLaboratoire === 2}
                          onClick={() => handleReceptionner(item._id)}
                        >
                          {receptionningId === item._id ? 'Traitement...' : 'Réceptionner ici'}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        )}

        {/* Liste des resultats a saisir */}
        {activeKey === 'resultats' && (
          <div className="mt-3 text-muted">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <strong className="text-dark">Liste des résultats à saisir ou a techniquer</strong>
              <Button variant="outline-info" size="sm" onClick={handlePrintBarcodes}>
                Code Barre
              </Button>
            </div>

            <Table responsive striped bordered hover className="align-middle">
              <thead>
                <tr>
                  <th>Receptionné le</th>
                  <th>N°Prestation</th>
                  <th>Designation</th>
                  <th>Patient</th>
                  {/* <th>Code Barre</th> */}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingResultats ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4">
                      Chargement des résultats à saisir...
                    </td>
                  </tr>
                ) : resultatsError ? (
                  <tr>
                    <td colSpan={5} className="text-center text-danger py-4">
                      {resultatsError}
                    </td>
                  </tr>
                ) : resultats.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4">
                      Aucun résultat à saisir trouvé pour la période sélectionnée.
                    </td>
                  </tr>
                ) : (
                  resultats.map((item) => (
                    <tr key={item._id ?? item.IDHOSPITALISATION ?? JSON.stringify(item)}>
                      <td>{item.DATERECEPTIONNER ? new Date(item.DATERECEPTIONNER).toISOString().slice(0, 10) : ''}</td>
                      <td>{item.CodePrestation ?? ''}</td>
                      <td>{item.Designationtypeacte ?? item.IDTYPE_ACTE ?? ''}</td>
                      <td>{item.PatientP ?? ''}</td>
                      {/*  <td>
                        <Barcode
                          value={`${item.CodePrestation ?? ''}-${Math.abs(item._id?.toString().split('')
                            .reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) ?? '')}`}
                          width={1.5}
                          height={40}
                          fontSize={12}
                          displayValue={true}
                        />
                      </td> */}
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => {
                            setSelectedIdHospitalisation(item._id ?? item.IDHOSPITALISATION ?? '');
                            setSaisieInitialProps({
                              ProvenanceExamen: item.ProvenanceExamen ?? item.Provenance ?? '',
                              NIdentificationExamen: item.NIdentificationExamen ?? item.NIdentification ?? '',
                              Externe_Interne: item.Externe_Interne ?? item.externeInterne ?? '',
                              CONCLUSIONGENE: item.CONCLUSIONGENE ?? item.Conclusion ?? '',
                              idMedecin: item.idMedecin ?? item.MedecinId ?? '',
                            });
                            setShowSaisieResultatModal(true);
                          }}
                        >
                          Saisir les résultats
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="ms-2"
                          disabled={annulerningId === item._id}
                          onClick={() => handleAnnulerReception(item._id)}
                        >
                          {annulerningId === item._id ? 'Traitement...' : 'Annuler la réception'}
                        </Button>
                        {/* Envoir au bilogiste */}
                        <Button
                          variant="outline-success"
                          size="sm"
                          className="ms-2"
                          disabled={envoyerBilogisteId === item._id}
                          onClick={() => handleEnvoyerBilogiste(item._id)}
                        >
                          {envoyerBilogisteId === item._id ? 'Traitement...' : 'Envoyer au bilogiste'}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>

            <div className="barcode-print-area" style={{ display: 'none' }}>
              <h2>Table des Codes Barre</h2>
              <Table responsive bordered className="align-middle">
                <thead>
                  <tr>
                    <th>Receptionné le</th>
                    <th>N°Prestation</th>
                    <th>Designation</th>
                    <th>Patient</th>
                    <th>Code Barre</th>
                  </tr>
                </thead>
                <tbody>
                  {resultats.map((item) => (
                    <tr key={`print-${item._id ?? item.IDHOSPITALISATION ?? JSON.stringify(item)}`}>
                      <td>{item.DATERECEPTIONNER ? new Date(item.DATERECEPTIONNER).toISOString().slice(0, 10) : ''}</td>
                      <td>{item.CodePrestation ?? ''}</td>
                      <td>{item.Designationtypeacte ?? ''}</td>
                      <td>{item.PatientP ?? ''}</td>
                      <td>
                        <Barcode
                          value={`${item.CodePrestation ?? ''}-${Math.abs(item._id?.toString().split('')
                            .reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) ?? '')}`}
                          width={1.5}
                          height={40}
                          fontSize={12}
                          displayValue={true}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .barcode-print-area, .barcode-print-area * {
            visibility: visible !important;
          }
          .barcode-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: block !important;
          }
          .barcode-print-area table {
            width: 100%;
            border-collapse: collapse;
          }
        }
      `}</style>

      {/* Modal pour Saisie des Résultats */}
      <Modal
        show={showSaisieResultatModal}
        onHide={() => setShowSaisieResultatModal(false)}
        size="xl"
        centered
        backdrop="static"
        keyboard={false}
        dialogClassName="modal-90w"
      >
        <Modal.Header
          closeButton
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderBottom: '2px solid #667eea',
            padding: '1.5rem'
          }}
        >
          {/* Afficher le code prestation */}
          <Modal.Title style={{ fontWeight: '600', fontSize: '1.3rem' }}>
            📋 Saisie des Résultats d'Examen 
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          style={{
            maxHeight: 'calc(100vh - 200px)',
            overflowY: 'auto',
            padding: '2rem',
            background: '#f8f9fa'
          }}
        >
          <SaisieResultat
            idHospitalisation={selectedIdHospitalisation}
            ProvenanceExamen={saisieInitialProps.ProvenanceExamen}
            NIdentificationExamen={saisieInitialProps.NIdentificationExamen}
            Externe_Interne={saisieInitialProps.Externe_Interne}
            CONCLUSIONGENE={saisieInitialProps.CONCLUSIONGENE}
            idMedecin={saisieInitialProps.idMedecin}
          />
        </Modal.Body>
        <Modal.Footer
          style={{
            background: '#f1f3f5',
            borderTop: '1px solid #dee2e6',
            padding: '1rem 2rem',
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        >
          <Button
            variant="outline-secondary"
            onClick={() => setShowSaisieResultatModal(false)}
          >
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .modal-90w {
          width: 90vw !important;
          max-width: 1200px !important;
        }
        
        .modal-90w .modal-dialog {
          max-width: 100%;
        }
      `}</style>
    </Container>
  );
}
