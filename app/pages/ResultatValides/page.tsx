// app/pages/ResultatValides/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Container, Form, Table, Pagination } from 'react-bootstrap';

export default function ListeResultatValides() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [resultats, setResultats] = useState<any[]>([]);
  const [loadingResultats, setLoadingResultats] = useState(false);
  const [resultatsError, setResultatsError] = useState<string | null>(null);
  const [renvoiId, setRenvoiId] = useState<string | null>(null);
  const [codePrestationFilter, setCodePrestationFilter] = useState('');
  const [patientFilter, setPatientFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today);
    monday.setDate(diff);
    const sunday = new Date(today);
    sunday.setDate(diff + 6);

    setStartDate(monday.toISOString().slice(0, 10));
    setEndDate(sunday.toISOString().slice(0, 10));
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      loadResultats();
    }
  }, [startDate, endDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [codePrestationFilter, patientFilter, resultats]);

  const getUtilisateur = () => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem("nom_utilisateur");
      return user;
    }
    return 'Utilisateur';
  };

  const getItemId = (item: any): string => {
    if (!item) return '';
    if (typeof item._id === 'string') return item._id;
    if (item._id && typeof item._id.toString === 'function') return item._id.toString();
    return '';
  };

  const loadResultats = async () => {
    setResultatsError(null);
    setLoadingResultats(true);

    const start = startDate || new Date().toISOString().slice(0, 10);
    const end = endDate || new Date().toISOString().slice(0, 10);

    try {
      const response = await fetch(
        `/api/ReceptionExamenLabo/resultatValides?startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}`
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


  const handleImprimer = (idHospitalisation: string) => {
    if (!idHospitalisation) return;
    window.open(
      `/api/laboratoire/resultat/${idHospitalisation}/pdf?avecEntete=true`,
      '_blank'
    );
  };

  const handleImprimerSansEntete = (idHospitalisation: string) => {
    if (!idHospitalisation) return;
    window.open(
      `/api/laboratoire/resultat/${idHospitalisation}/pdf?avecEntete=false`,
      '_blank'
    );
  };

  const handleRenvoyerResultat = async (idHospitalisation: string) => {
    const confirmed = window.confirm('Voulez-vous renvoyer le résultat de ce patient ?');
    if (!confirmed) return;

    setRenvoiId(idHospitalisation);
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
        throw new Error(data?.message || data?.error || 'Erreur lors du renvoi du résultat.');
      }

      alert('✅ Renvoi du résultat effectué avec succès.');
      await loadResultats();
    } catch (error) {
      console.error('Erreur renvoi du résultat :', error);
      alert(`❌ ${(error as Error).message}`);
    } finally {
      setRenvoiId(null);
    }
  };

  const filteredResultats = resultats.filter((item) => {
    const code = (item.CodePrestation ?? '').toLowerCase();
    const patient = (item.PatientP ?? '').toLowerCase();
    const matchCode = !codePrestationFilter || code.includes(codePrestationFilter.toLowerCase());
    const matchPatient = !patientFilter || patient.includes(patientFilter.toLowerCase());
    return matchCode && matchPatient;
  });

  const totalPages = Math.ceil(filteredResultats.length / itemsPerPage) || 1;
  const paginatedResultats = filteredResultats.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <Container className="py-2">
      <h2 className="mb-4 text-primary">Liste des résultats validés</h2>
      <Row className="g-4 mt-2">
        <Col md={6}>
          <Card className="shadow-sm h-100 border-0">
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <i className="bi bi-calendar-range text-primary me-2 fs-5"></i>
                <Card.Title className="h5 mb-0">Recherche par période</Card.Title>
              </div>
              <Form>
                <Row className="align-items-end gy-3">
                  <Col xs={12} md={4}>
                    <Form.Label className="small text-muted fw-semibold">Date début</Form.Label>
                    <Form.Control
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="border-primary"
                    />
                  </Col>
                  <Col xs={12} md={4}>
                    <Form.Label className="small text-muted fw-semibold">Date fin</Form.Label>
                    <Form.Control
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="border-primary"
                    />
                  </Col>
                  <Col xs={12} md={4}>
                    <Button
                      variant="primary"
                      className="w-100"
                      onClick={() => loadResultats()}
                    >
                      <i className="bi bi-search me-2"></i>
                      Rechercher
                    </Button>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="shadow-sm h-100 border-0">
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <i className="bi bi-funnel text-success me-2 fs-5"></i>
                <Card.Title className="h5 mb-0">Filtrer les résultats</Card.Title>
              </div>
              <Form>
                <Row className="align-items-end gy-3">
                  <Col xs={12} md={4}>
                    <Form.Label className="small text-muted fw-semibold">N° Prestation</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Code prestation"
                      value={codePrestationFilter}
                      onChange={(e) => setCodePrestationFilter(e.target.value)}
                      className="border-success"
                    />
                  </Col>
                  <Col xs={12} md={4}>
                    <Form.Label className="small text-muted fw-semibold">Patient</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Nom du patient"
                      value={patientFilter}
                      onChange={(e) => setPatientFilter(e.target.value)}
                      className="border-success"
                    />
                  </Col>
                  <Col xs={12} md={4}>
                    <Button
                      variant="outline-danger"
                      className="w-100"
                      onClick={() => {
                        setCodePrestationFilter('');
                        setPatientFilter('');
                        setCurrentPage(1);
                      }}
                    >
                      <i className="bi bi-arrow-counterclockwise me-2"></i>
                      Réinitialiser
                    </Button>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    
      <div className="mt-3 text-muted">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <strong className="text-dark">Liste des résultats validés</strong>
        </div>

        <Table responsive striped bordered hover className="align-middle">
          <thead>
            <tr>
              <th>Validé le</th>
              <th>N°Prestation</th>
              <th>Designation</th>
              <th>Patient</th>
              <th>Saisi par</th>
              <th>Validé par</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loadingResultats ? (
              <tr>
                <td colSpan={7} className="text-center py-4">
                  Chargement des résultats validés...
                </td>
              </tr>
            ) : resultatsError ? (
              <tr>
                <td colSpan={7} className="text-center text-danger py-4">
                  {resultatsError}
                </td>
              </tr>
            ) : filteredResultats.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-4">
                  Aucun résultat validé trouvé pour les critères sélectionnés.
                </td>
              </tr>
            ) : (
              paginatedResultats.map((item) => {
                const itemId = getItemId(item);
                return (
                  <tr key={itemId}>
                    <td>{item.DateValidation ? new Date(item.DateValidation).toISOString().slice(0, 10) : ''}</td>
                    <td>{item.CodePrestation ?? ''}</td>
                    <td>{item.Designationtypeacte ?? item.IDTYPE_ACTE ?? ''}</td>
                    <td>{item.PatientP ?? ''}</td>
                    <td>{item.resultatSaisiePar ?? ''}</td>
                    <td>{item.Biologiste ?? ''}</td>
                    <td className="d-flex gap-2 flex-wrap">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleImprimer(itemId)}
                      >
                        <i className="bi bi-printer me-1"></i>
                        Avec entête
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => handleImprimerSansEntete(itemId)}
                      >
                        <i className="bi bi-file-earmark me-1"></i>
                        Sans entête
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        disabled={renvoiId === itemId}
                        onClick={() => handleRenvoyerResultat(itemId)}
                      >
                        {renvoiId === itemId ? 'Traitement...' : 'Renvoyer le résultat'}
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </Table>

        {filteredResultats.length > 0 && (
          <div className="d-flex justify-content-between align-items-center mt-3">
            <small className="text-muted">
              {filteredResultats.length} résultat{filteredResultats.length > 1 ? 's' : ''} — Page {currentPage} / {totalPages}
            </small>
            <Pagination size="sm">
              <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
              <Pagination.Prev onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} />
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Pagination.Item
                  key={page}
                  active={page === currentPage}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Pagination.Item>
              ))}
              <Pagination.Next onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} />
              <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
            </Pagination>
          </div>
        )}
      </div>

    </Container>
  );
}
