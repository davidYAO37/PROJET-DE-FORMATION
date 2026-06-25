// app/page.tsx
'use client';

import React, { useState } from 'react';
import { Card, Row, Col, Button, Container, Form, InputGroup, ButtonGroup, Nav, Table } from 'react-bootstrap';

export default function Dashboard() {
  const [activeKey, setActiveKey] = useState<string>('reception');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [receptions, setReceptions] = useState<any[]>([]);
  const [loadingReceptions, setLoadingReceptions] = useState(false);
  const [receptionError, setReceptionError] = useState<string | null>(null);
  const [receptionningId, setReceptionningId] = useState<string | null>(null);

  const [resultats, setResultats] = useState<any[]>([]);
  const [loadingResultats, setLoadingResultats] = useState(false);
  const [resultatsError, setResultatsError] = useState<string | null>(null);

  const [aValider, setAValider] = useState<any[]>([]);
  const [loadingAValider, setLoadingAValider] = useState(false);
  const [aValiderError, setAValiderError] = useState<string | null>(null);

  const getUtilisateur = () => {
    // Récupérer depuis localStorage ou session
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

  const loadAValider = async () => {
    setAValiderError(null);
    setLoadingAValider(true);
    const start = startDate || new Date().toISOString().slice(0, 10);
    const end = endDate || new Date().toISOString().slice(0, 10);
    try {
      const response = await fetch(
        `/api/examens/aValider?dateDebut=${encodeURIComponent(start)}&dateFin=${encodeURIComponent(end)}`
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Erreur chargement examens à valider.');
      setAValider(data.examens || []);
    } catch (error) {
      setAValiderError((error as Error).message);
      setAValider([]);
    } finally {
      setLoadingAValider(false);
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

      // Recharger la liste complète pour refléter l'état mis à jour
      await loadReceptions();

      alert('✅ Réception enregistrée avec succès.');
    } catch (error) {
      console.error('Erreur réception :', error);
      alert(`❌ ${(error as Error).message}`);
    } finally {
      setReceptionningId(null);
    }
  };

  return (
    <Container className="py-4">
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
                    <ButtonGroup className="ms-auto flex-wrap">
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
                        Résultats à saisir
                      </Button>
                      <Button
                        variant="outline-warning"
                        onClick={() => {
                          setActiveKey('aValider');
                          loadAValider();
                        }}
                      >
                        <i className="bi bi-clipboard2-check me-1"></i>Examens à valider
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
          <Nav.Item>
            <Nav.Link eventKey="aValider" className="d-none">Examens à Valider</Nav.Link>
          </Nav.Item>
        </Nav>
        {/* Liest des reception */}
        {activeKey === 'reception' && (
          <div className="mt-3">
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

        {activeKey === 'aValider' && (
          <div className="mt-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="fw-bold mb-0">
                <i className="bi bi-clipboard2-check me-2 text-warning"></i>
                Examens biologiques à valider <span className="badge bg-warning text-dark ms-2">{aValider.length}</span>
              </h6>
              <Button variant="outline-warning" size="sm" onClick={loadAValider} disabled={loadingAValider}>
                <i className="bi bi-arrow-clockwise me-1"></i>Actualiser
              </Button>
            </div>
            <Table responsive striped bordered hover className="align-middle small">
              <thead className="table-warning">
                <tr>
                  <th>#</th>
                  <th>Date transfert biologiste</th>
                  <th>N° Prestation</th>
                  <th>Désignation</th>
                  <th>Patient</th>
                  <th className="text-center">Statut</th>
                </tr>
              </thead>
              <tbody>
                {loadingAValider ? (
                  <tr><td colSpan={6} className="text-center py-4">Chargement...</td></tr>
                ) : aValiderError ? (
                  <tr><td colSpan={6} className="text-center text-danger py-4">{aValiderError}</td></tr>
                ) : aValider.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-4 text-muted">Aucun examen à valider sur cette période.</td></tr>
                ) : (
                  aValider.map((item, i) => (
                    <tr key={item._id}>
                      <td className="text-muted">{i + 1}</td>
                      <td>{item.Datetransferbiologiste ? new Date(item.Datetransferbiologiste).toLocaleDateString('fr-FR') : '—'}</td>
                      <td>{item.CodePrestation ?? '—'}</td>
                      <td>{item.Designationtypeacte ?? '—'}</td>
                      <td className="fw-semibold">{item.PatientP ?? '—'}</td>
                      <td className="text-center">
                        <span className="badge bg-warning text-dark">À valider</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {aValider.length > 0 && (
                <tfoot className="table-light">
                  <tr>
                    <td colSpan={5} className="text-end fw-bold">Total</td>
                    <td className="text-center fw-bold">{aValider.length}</td>
                  </tr>
                </tfoot>
              )}
            </Table>
          </div>
        )}

        {activeKey === 'resultats' && (
          <div className="mt-3 text-muted">
            <Table responsive striped bordered hover className="align-middle">
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
                      <td>{item.Numcarte ?? item.Code_Barre ?? ''}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        )}

      </div>
    </Container>
  );
}
