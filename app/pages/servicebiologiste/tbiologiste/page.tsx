// app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Container, Form, ButtonGroup, Table, Modal } from 'react-bootstrap';
import SaisieResultat from '../../SaisieResultat/page';

export default function Dashboard() {
  // Par défaut : premier et dernier jour du mois en cours
  const now = new Date();
  const premierJour = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const dernierJour = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState(premierJour);
  const [endDate, setEndDate] = useState(dernierJour);

  const [aValider, setAValider] = useState<any[]>([]);
  const [loadingAValider, setLoadingAValider] = useState(false);
  const [aValiderError, setAValiderError] = useState<string | null>(null);

  const [selectedIdHospitalisation, setSelectedIdHospitalisation] = useState<string>('');
  const [saisieInitialProps, setSaisieInitialProps] = useState({
    ProvenanceExamen: '',
    NIdentificationExamen: '',
    Externe_Interne: '',
    CONCLUSIONGENE: '',
    idMedecin: '',
  });
  const [showSaisieResultatModal, setShowSaisieResultatModal] = useState(false);

  const [validerResultatId, setValiderResultatId] = useState<string | null>(null);
  const [retourAuLaboId, setRetourAuLaboId] = useState<string | null>(null);
  const [observations, setObservations] = useState<Record<string, string>>({});

  const getUtilisateur = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('nom_utilisateur') || 'Biologiste';
    }
    return 'Biologiste';
  };

  // Charger automatiquement les examens à valider au montage
  useEffect(() => {
    loadAValider();
  }, []);

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

  const handleAfficherResultat = (idHospitalisation: string) => {
    const url = `/api/laboratoire/resultat/${idHospitalisation}/pdf?avecEntete=true`;
    window.open(url, '_blank');
  };

  const handleAfficherResultatSansEntete = (idHospitalisation: string) => {
    const url = `/api/laboratoire/resultat/${idHospitalisation}/pdf?avecEntete=false`;
    window.open(url, '_blank');
  };

  const handleValiderResultat = async (idHospitalisation: string) => {
    const confirmed = window.confirm('Voulez-vous valider ces résultats ?');
    if (!confirmed) return;

    setValiderResultatId(idHospitalisation);
    try {
      const response = await fetch('/api/examens/validerResultat', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idHospitalisation,
          biologiste: getUtilisateur(),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || data?.error || 'Erreur lors de la validation.');
      await loadAValider();
      window.dispatchEvent(new Event('examens-avalider-updated'));
      alert('✅ Résultat validé avec succès.');
    } catch (error) {
      alert(`❌ ${(error as Error).message}`);
    } finally {
      setValiderResultatId(null);
    }
  };

  const handleRetournerResultat = async (idHospitalisation: string) => {
    const observation = observations[idHospitalisation] ?? '';

    if (!observation.trim()) {
      alert('Veuillez saisir une observation avant de retourner le résultat.');
      return;
    }

    const confirmed = window.confirm('Voulez-vous retourner pour la correction des résultats ?');
    if (!confirmed) return;

    setRetourAuLaboId(idHospitalisation);
    try {
      const response = await fetch('/api/examens/retournerResultat', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idHospitalisation, observation }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || data?.error || 'Erreur lors du retour.');
      await loadAValider();
      window.dispatchEvent(new Event('examens-avalider-updated'));
      alert('✅ Examen retourné au laboratoire.');
    } catch (error) {
      alert(`❌ ${(error as Error).message}`);
    } finally {
      setRetourAuLaboId(null);
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
          className="blink-notif"
          style={{
            display: 'flex',
            whiteSpace: 'nowrap',
          }}
        >
          <span className="text-white fw-semibold me-5">
            <i className="bi bi-bell-fill text-warning me-2"></i>
            🟢 Résultats  à Valider : <span className="badge bg-success">{aValider.length}</span>
          </span>
         
          <span className="text-white fw-semibold me-5">
            📅 Période : {startDate} au {endDate}
          </span>
        </div>
      </div>
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .blink-notif {
          animation: blink 1.5s ease-in-out infinite;
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
                    <ButtonGroup className="ms-auto flex-wrap">
                      <Button
                        variant="outline-warning"
                        onClick={loadAValider}
                      >
                        <i className="bi bi-clipboard2-check me-1"></i>Résultats à valider
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
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h6 className="fw-bold mb-0">
            <i className="bi bi-clipboard2-check me-2 text-warning"></i>
            Résultats biologiques à valider <span className="badge bg-warning text-dark ms-2">{aValider.length}</span>
          </h6>
          <Button variant="outline-warning" size="sm" onClick={loadAValider} disabled={loadingAValider}>
            <i className="bi bi-arrow-clockwise me-1"></i>Actualiser
          </Button>
        </div>
        <Table responsive striped bordered hover className="align-middle small">
          <thead className="table-warning">
            <tr>
              <th>#</th>
              <th>Résultat</th>
              <th>Reçu le</th>
              <th>N° Prestation</th>
              <th>Patient</th>
              <th>Saisie par</th>
              <th>Observation</th>
              <th className="text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {loadingAValider ? (
              <tr><td colSpan={7} className="text-center py-4">Chargement...</td></tr>
            ) : aValiderError ? (
              <tr><td colSpan={7} className="text-center text-danger py-4">{aValiderError}</td></tr>
            ) : aValider.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-4 text-muted">Aucun résultat à valider sur cette période.</td></tr>
            ) : (
              aValider.map((item, i) => (
                <tr key={item._id}>
                  <td className="text-muted">{i + 1}</td>
                  <td>
                    <Button
                      variant="outline-info"
                      className="ms-1 px-3 py-2"
                      style={{ borderRadius: '8px', fontWeight: '500' }}
                      onClick={() => handleAfficherResultat(item._id)}
                      title="Afficher avec entête"
                    >
                      <i className="bi bi-file-earmark-text"></i>
                    </Button>
                    <Button
                      variant="outline-secondary"
                      className="ms-1 px-3 py-2"
                      style={{ borderRadius: '8px', fontWeight: '500' }}
                      onClick={() => handleAfficherResultatSansEntete(item._id)}
                      title="Afficher sans entête"
                    >
                      <i className="bi bi-file-earmark"></i>
                    </Button>
                  </td>
                  <td>{item.Datetransferbiologiste ? new Date(item.Datetransferbiologiste).toLocaleDateString('fr-FR') : '—'}</td>
                  <td>{item.CodePrestation ?? '—'}</td>
                  <td className="fw-semibold">{item.PatientP ?? '—'}</td>
                  <td className="text-muted">{item.resultatSaisiePar ?? '—'}</td>
                  {/*texte d'Observation a saisir par le biologiste */}
                  <td>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="Observation..."
                      value={observations[item._id] ?? item.ObservationC ?? ''}
                      onChange={(e) => setObservations((prev) => ({ ...prev, [item._id]: e.target.value }))}
                    />
                  </td>
                  <td className="text-center">
                    <Button
                      variant="outline-primary"
                      className="px-3 py-2"
                      style={{ borderRadius: '8px', fontWeight: '500' }}
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
                      title="Saisir les résultats"
                    >
                      <i className="bi bi-pencil-square"></i>
                    </Button>
                   
                    {/* Valider le résultat */}
                    <Button
                      variant="outline-success"
                      className="ms-2 px-3 py-2"
                      style={{ borderRadius: '8px', fontWeight: '500' }}
                      disabled={validerResultatId === item._id}
                      onClick={() => handleValiderResultat(item._id)}
                      title="Valider le résultat"
                    >
                      {validerResultatId === item._id ? (
                        <span className="spinner-border spinner-border-sm" role="status" />
                      ) : (
                        <i className="bi bi-check-circle"></i>
                      )}
                    </Button>
                  
                    {/* Retourné le resultat au laboratoire pour saisie */}
                    <Button
                      variant="outline-warning"
                      className="ms-2 px-3 py-2"
                      style={{ borderRadius: '8px', fontWeight: '500' }}
                      onClick={() => handleRetournerResultat(item._id)}
                      title="Retourner le résultat"
                    >
                      <i className="bi bi-arrow-counterclockwise"></i>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {aValider.length > 0 && (
            <tfoot className="table-light">
              <tr>
                <td colSpan={6} className="text-end fw-bold">Total</td>
                <td className="text-center fw-bold">{aValider.length}</td>
              </tr>
            </tfoot>
          )}
        </Table>
      </div>

      {/* Modal Saisie des Résultats */}
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
            padding: '1.5rem',
          }}
        >
          <Modal.Title style={{ fontWeight: '600', fontSize: '1.3rem' }}>
            📋 Saisie des Résultats d'Examen
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          style={{
            maxHeight: 'calc(100vh - 200px)',
            overflowY: 'auto',
            padding: '2rem',
            background: '#f8f9fa',
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
        <Modal.Footer style={{ background: '#f1f3f5', borderTop: '1px solid #dee2e6', padding: '1rem 2rem' }}>
          <Button variant="outline-secondary" onClick={() => setShowSaisieResultatModal(false)}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .modal-90w {
          width: 90vw !important;
          max-width: 1200px !important;
        }
      `}</style>
    </Container>
  );
}
