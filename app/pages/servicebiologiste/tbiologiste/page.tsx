// app/page.tsx
'use client';

import React, { useState } from 'react';
import { Card, Row, Col, Button, Container, Form, ButtonGroup, Table, Modal } from 'react-bootstrap';
import SaisieResultat from '../../SaisieResultat/page';

export default function Dashboard() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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

  const getUtilisateur = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('nom_utilisateur') || 'Biologiste';
    }
    return 'Biologiste';
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
      alert('✅ Résultat validé avec succès.');
    } catch (error) {
      alert(`❌ ${(error as Error).message}`);
    } finally {
      setValiderResultatId(null);
    }
  };

  const handleRetournerResultat = async (idHospitalisation: string) => {
    const item = aValider.find((i) => i._id === idHospitalisation);
    const observation = item?.ObservationC ?? '';

    if (!observation || observation.trim() === '') {
      alert('Merci de marquer votre refus avant cette opération.');
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
      alert('✅ Examen retourné au laboratoire.');
    } catch (error) {
      alert(`❌ ${(error as Error).message}`);
    } finally {
      setRetourAuLaboId(null);
    }
  };

  const handleRetoutauLabo = async (idHospitalisation: string) => {
    await handleRetournerResultat(idHospitalisation);
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
                      <Button
                        variant="outline-warning"
                        onClick={loadAValider}
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
              <th className="text-center">Action</th>
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
                      disabled={retourAuLaboId === item._id}
                      onClick={() => handleRetoutauLabo(item._id)}
                    >
                      {retourAuLaboId === item._id ? 'Traitement...' : 'Retour au laboratoire'}
                    </Button>
                    {/* Valider le résultat */}
                    <Button
                      variant="outline-success"
                      size="sm"
                      className="ms-2"
                      disabled={validerResultatId === item._id}
                      onClick={() => handleValiderResultat(item._id)}
                    >
                      {validerResultatId === item._id ? 'Traitement...' : 'Valider le résultat'}
                    </Button>
                    {/* Afficher le résultat avec entête */}
                    <Button
                      variant="outline-info"
                      size="sm"
                      className="ms-2"
                      onClick={() => handleAfficherResultat(item._id)}
                    >
                      📄 Avec entête
                    </Button>
                    {/* Afficher le résultat sans entête */}
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      className="ms-2"
                      onClick={() => handleAfficherResultatSansEntete(item._id)}
                    >
                      📋 Sans entête
                    </Button>
                    {/* Retourné le resultat au laboratoire pour saisie */}
                    <Button
                      variant="outline-warning"
                      size="sm"
                      className="ms-2"
                      onClick={() => handleRetournerResultat(item._id)}
                    >
                      Retourner le résultat
                    </Button>
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
