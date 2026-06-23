// app/pages/servicelaboratoire/components/ListeResultatRetour/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Container, Form, Table, Modal } from 'react-bootstrap';
import Barcode from 'react-barcode';
import SaisieResultat from '@/app/pages/SaisieResultat/page';

export default function ListeResultatRetour() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [resultats, setResultats] = useState<any[]>([]);
  const [loadingResultats, setLoadingResultats] = useState(false);
  const [resultatsError, setResultatsError] = useState<string | null>(null);
  const [renvoiId, setRenvoiId] = useState<string | null>(null);
  const [showSaisieResultatModal, setShowSaisieResultatModal] = useState(false);
  const [selectedIdHospitalisation, setSelectedIdHospitalisation] = useState<string>('');
  const [saisieInitialProps, setSaisieInitialProps] = useState({
    ProvenanceExamen: '',
    NIdentificationExamen: '',
    Externe_Interne: '',
    CONCLUSIONGENE: '',
    idMedecin: '',
  });

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

  const getBarcodeValue = (item: any): string => {
    const id = getItemId(item);
    const code = item.CodePrestation ?? '';
    if (!code && !id) return 'UNKNOWN';
    return `${code || 'ID'}-${id || Math.random().toString(36).substring(2, 8)}`;
  };

  const loadResultats = async () => {
    setResultatsError(null);
    setLoadingResultats(true);

    const start = startDate || new Date().toISOString().slice(0, 10);
    const end = endDate || new Date().toISOString().slice(0, 10);

    try {
      const response = await fetch(
        `/api/ReceptionExamenLabo/retourResultat?startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}`
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

  const handlePrintBarcodes = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <Container className="py-4">
      <h2 className="mb-4 text-primary">Liste des résultats retournés</h2>
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
                    <Button
                      className="ms-auto"
                      variant="outline-secondary"
                      onClick={() => loadResultats()}
                    >
                      Résultats retournés à saisir
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
              <strong className="text-dark">Liste des résultats retournés à saisir ou à techniquer</strong>
              <Button variant="outline-info" size="sm" onClick={handlePrintBarcodes}>
                Code Barre
              </Button>
            </div>

            <Table responsive striped bordered hover className="align-middle">
              <thead>
                <tr>
                  <th>Retourné le</th>
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
                      Chargement des résultats retournés...
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
                      Aucun résultat retourné trouvé pour la période sélectionnée.
                    </td>
                  </tr>
                ) : (
                  resultats.map((item) => {
                    const itemId = getItemId(item);
                    return (
                      <tr key={itemId}>
                        <td>{item.dateretour ? new Date(item.dateretour).toISOString().slice(0, 10) : ''}</td>
                        <td>{item.CodePrestation ?? ''}</td>
                        <td>{item.Designationtypeacte ?? item.IDTYPE_ACTE ?? ''}</td>
                        <td>{item.PatientP ?? ''}</td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => {
                              setSelectedIdHospitalisation(itemId);
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
{/* Pour imprimer les codes barre */}
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
                    <tr key={`print-${getItemId(item)}`}>
                      <td>{item.dateretour ? new Date(item.dateretour).toISOString().slice(0, 10) : ''}</td>
                      <td>{item.CodePrestation ?? ''}</td>
                      <td>{item.Designationtypeacte ?? ''}</td>
                      <td>{item.PatientP ?? ''}</td>
                      <td>
                        <Barcode
                          value={getBarcodeValue(item)}
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
