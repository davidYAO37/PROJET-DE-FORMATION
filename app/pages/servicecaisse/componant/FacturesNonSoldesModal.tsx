'use client';
import { useState, useEffect } from 'react';
import { Modal, Button, Table, Badge, Spinner, Form } from 'react-bootstrap';
import { FaMoneyBillWave, FaUser, FaCalendarAlt, FaFileInvoice } from 'react-icons/fa';

interface FactureNonSoldee {
  id: string;
  code: string;
  patient: string;
  designation: string;
  montantRestant: number;
  type: 'facturation' | 'consultation';
  statut: string;
  date: string;
  medecin?: string;
  assure?: string;
}

interface FacturesNonSoldesModalProps {
  show: boolean;
  onHide: () => void;
}

export default function FacturesNonSoldesModal({ show, onHide }: FacturesNonSoldesModalProps) {
  const [factures, setFactures] = useState<FactureNonSoldee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Pour le tris et recherche
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'patient' | 'designation' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // États pour le modal de paiement
  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [selectedFacture, setSelectedFacture] = useState<FactureNonSoldee | null>(null);
  const [montantClient, setMontantClient] = useState('');
  const [modesPaiement, setModesPaiement] = useState<any[]>([]);
  const [modePaiement, setModePaiement] = useState('');
  const [loadingPaiement, setLoadingPaiement] = useState(false);

  const fetchOptsNoCache: RequestInit = {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
  };

  const extraireListeFacturesApi = (data: unknown): any[] => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && Array.isArray((data as { data?: unknown }).data)) {
      return (data as { data: any[] }).data;
    }
    return [];
  };

  useEffect(() => {
    if (show) {
      void chargerFactures();
    }
  }, [show]);

  const chargerFactures = async (options?: { retryIfSuspiciousEmpty?: boolean; countBefore?: number }) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/facturesnonsoldees', fetchOptsNoCache);
      if (response.ok) {
        const data = await response.json();
        const facturesBrutes = extraireListeFacturesApi(data);

        // Appliquer la logique de vérification des encaissements
        const facturesFiltrees = await Promise.all(
          facturesBrutes.map(async (facture) => {
            // Si le reste à payer est <= 0, on n'affiche pas
            if (facture.montantRestant <= 0) {
              return null;
            }

            const idBrut = facture.id != null ? String(facture.id).trim() : '';
            if (!idBrut) {
              return facture;
            }

            const idEnc = encodeURIComponent(idBrut);
            let encaissements: Response;
            if (facture.type === 'consultation') {
              encaissements = await fetch(
                `/api/encaissementcaisse?idConsultation=${idEnc}`,
                fetchOptsNoCache
              );
            } else {
              encaissements = await fetch(
                `/api/encaissementcaisse?idFacturation=${idEnc}`,
                fetchOptsNoCache
              );
            }

            if (encaissements.ok) {
              const encaissementsData = await encaissements.json();
              const sommeEncaissements = encaissementsData.data?.reduce(
                (sum: number, enc: any) => sum + (enc.Montantencaisse || 0),
                0
              ) || 0;

              // Calculer le reste réel à payer
              const resteReel = facture.montantRestant - sommeEncaissements;

              // Si le reste à payer - la somme des encaissements = 0, on n'affiche pas
              if (resteReel <= 0) {
                return null;
              }

              // Sinon on affiche avec le reste réel
              return {
                ...facture,
                montantRestant: resteReel
              };
            } else {
              // Si pas trouvé dans encaissements, on affiche directement
              return facture;
            }
          })
        );

        // Filtrer les null et mettre à jour les factures
        const facturesValidées = facturesFiltrees.filter((f): f is NonNullable<typeof f> => f !== null);
        setFactures(facturesValidées);

        if (
          options?.retryIfSuspiciousEmpty &&
          (options.countBefore ?? 0) > 1 &&
          facturesValidées.length === 0
        ) {
          await new Promise((r) => setTimeout(r, 900));
          await chargerFactures();
        }
      } else {
        setError('Erreur lors du chargement des factures');
        setFactures([]);
      }
    } catch (err) {
      setError('Erreur de connexion');
      setFactures([]);
    } finally {
      setLoading(false);
    }
  };

  // Fonction de tri et filtrage
  const getSortedAndFilteredFactures = () => {
    let filteredFactures = factures.filter(facture =>
      facture.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      facture.designation.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filteredFactures.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'patient':
          aValue = a.patient.toLowerCase();
          bValue = b.patient.toLowerCase();
          break;
        case 'designation':
          aValue = a.designation.toLowerCase();
          bValue = b.designation.toLowerCase();
          break;
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const handleSort = (field: 'patient' | 'designation' | 'date') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Fonction pour gérer le paiement
  const handleSolder = (facture: FactureNonSoldee) => {
    setSelectedFacture(facture);
    setMontantClient(facture.montantRestant.toString());
    setShowPaiementModal(true);
  };

  const handlePaiement = async () => {
    if (!selectedFacture || !montantClient || !modePaiement) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    setLoadingPaiement(true);
    try {
      // utilisateur connecté
      const utilisateur = localStorage.getItem('nom_utilisateur') || '';
      const response = await fetch('/api/encaissementcaisse', {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          type: selectedFacture.type,
          TotalapayerPatient: selectedFacture.montantRestant || 0,
          Montantencaisse: parseFloat(montantClient),
          Modepaiement: modePaiement,
          Utilisateur: utilisateur,
          IDFACTURATION: selectedFacture.type === 'consultation' ? '' : selectedFacture.id,
          IDCONSULTATION: selectedFacture.type === 'consultation' ? selectedFacture.id : undefined

        }),
      });

      if (response.ok) {
        const countAvantRefresh = factures.length;
        alert('Paiement enregistré avec succès');
        setShowPaiementModal(false);
        setMontantClient('');
        setModePaiement('');
        setSelectedFacture(null);
        // Laisser le temps au POST d’être visible côté MongoDB (serverless / latence réseau).
        await new Promise((r) => setTimeout(r, 450));
        await chargerFactures({
          retryIfSuspiciousEmpty: true,
          countBefore: countAvantRefresh,
        });
      } else {
        alert('Erreur lors de l\'enregistrement du paiement');
      }
    } catch (error) {
      console.error('Erreur paiement:', error);
      alert('Erreur de connexion');
    } finally {
      setLoadingPaiement(false);
    }
  };

  const getTypeBadge = (type: string) => {
    const variant = type === 'facturation' ? '#0d6efd' : '#198754';
    const icon = type === 'facturation' ? <FaFileInvoice /> : <FaMoneyBillWave />;
    return (
      <span
        className="d-flex align-items-center gap-1"
        style={{
          fontSize: '0.75rem',
          padding: '0.25rem 0.5rem',
          backgroundColor: variant,
          color: 'white',
          borderRadius: '0.375rem',
          display: 'inline-flex',
          alignItems: 'center',
          fontWeight: 500
        }}
      >
        {icon}
        {type === 'facturation' ? 'Facturation' : 'Consultation'}
      </span>
    );
  };

  const getStatutBadge = (statut: string) => {
    const variant = statut === 'Payé' ? '#198754' : statut === 'En cours de Paiement' ? '#ffc107' : '#dc3545';
    return (
      <span
        style={{
          fontSize: '0.75rem',
          padding: '0.25rem 0.5rem',
          backgroundColor: variant,
          color: 'white',
          borderRadius: '0.375rem',
          display: 'inline-block',
          fontWeight: 500
        }}
      >
        {statut}
      </span>
    );
  };
  // Récupérer les modes de paiement depuis l'API
  useEffect(() => {
    const fetchModesPaiement = async () => {
      try {
        const response = await fetch('/api/modepaiement');

        if (!response.ok) {
          console.error('Erreur HTTP:', response.status);
          // Utiliser des modes de paiement par défaut
          setModesPaiement([
            { _id: '1', Modepaiement: 'ESPECE' },
            { _id: '2', Modepaiement: 'CARTE' },
            { _id: '3', Modepaiement: 'CHEQUE' },
            { _id: '4', Modepaiement: 'MOBILE' }
          ]);
          return;
        }

        const result = await response.json();
        if (result && result.data && Array.isArray(result.data)) {
          setModesPaiement(result.data);
        } else {
          // Utiliser des modes de paiement par défaut si la réponse n'est pas un tableau
          setModesPaiement([
            { _id: '1', Modepaiement: 'ESPECE' },
            { _id: '2', Modepaiement: 'CARTE' },
            { _id: '3', Modepaiement: 'CHEQUE' },
            { _id: '4', Modepaiement: 'MOBILE' }
          ]);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des modes de paiement:', error);
        // Utiliser des modes de paiement par défaut en cas d'erreur
        setModesPaiement([
          { _id: '1', Modepaiement: 'ESPECE' },
          { _id: '2', Modepaiement: 'CARTE' },
          { _id: '3', Modepaiement: 'CHEQUE' },
          { _id: '4', Modepaiement: 'MOBILE' }
        ]);
      }
    };

    fetchModesPaiement();
  }, []);

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="xl"
      centered
      backdrop="static"
      dialogClassName="modal-90w"
    >
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title className="d-flex align-items-center gap-2">
          <FaMoneyBillWave size={24} />
          Factures à Solder
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-4">
        {/* Interface de recherche et de tri */}
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="input-group">
              <span className="input-group-text">
                <FaUser />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Rechercher par patient ou désignation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-6">
            <div className="btn-group w-100" role="group">
              <button
                className={`btn ${sortBy === 'patient' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => handleSort('patient')}
              >
                Patient {sortBy === 'patient' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
              <button
                className={`btn ${sortBy === 'designation' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => handleSort('designation')}
              >
                Désignation {sortBy === 'designation' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
              <button
                className={`btn ${sortBy === 'date' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => handleSort('date')}
              >
                Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" className="me-2" />
            <span>Chargement des factures...</span>
          </div>
        ) : error ? (
          <div className="alert alert-danger text-center">
            {error}
          </div>
        ) : getSortedAndFilteredFactures().length === 0 ? (
          <div className="text-center py-5 text-muted">
            <FaMoneyBillWave size={48} className="mb-3" />
            <h5>Aucune facture trouvée</h5>
            <p>Essayez de modifier votre recherche ou vos filtres</p>
          </div>
        ) : (
          <div className="table-responsive">
            <Table hover className="align-middle">
              <thead className="table-light">
                <tr>
                  <th className="text-nowrap">Code</th>
                  <th className="text-nowrap">Patient</th>
                  <th className="text-nowrap">Désignation</th>
                  <th className="text-nowrap">Reste à payer</th>
                  <th className="text-nowrap">Date</th>
                  <th className="text-nowrap">Médecin</th>
                  {/* <th className="text-nowrap">Assuré</th> */}
                  <th className="text-nowrap">Action</th>
                </tr>
              </thead>
              <tbody>
                {getSortedAndFilteredFactures().map((facture) => (
                  <tr key={facture.id}>
                    <td className="text-nowrap">
                      <code className="bg-light px-2 py-1 rounded">{facture.code}</code>
                    </td>
                    <td className="text-nowrap">
                      <div className="d-flex align-items-center gap-2">
                        <FaUser className="text-muted" size={14} />
                        <span>{facture.patient}</span>
                      </div>
                    </td>
                    <td className="text-nowrap">{facture.designation}</td>
                    <td className="text-nowrap">
                      <div className="d-flex align-items-center gap-2">
                        <span className="fw-bold text-danger">
                          {facture.montantRestant.toLocaleString()} FCFA
                        </span>
                      </div>
                    </td>
                    <td className="text-nowrap">
                      <div className="d-flex align-items-center gap-1">
                        <FaCalendarAlt className="text-muted" size={14} />
                        <span>{facture.date}</span>
                      </div>
                    </td>
                    <td className="text-nowrap text-muted">
                      {facture.medecin || '-'}
                    </td>
                    {/* <td className="text-nowrap">
                      {facture.assure ? (
                        <span 
                          style={{ 
                            fontSize: '0.75rem', 
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#0dcaf0',
                            color: 'white',
                            borderRadius: '0.375rem',
                            display: 'inline-block',
                            fontWeight: 500
                          }}
                        >
                          {facture.assure}
                        </span>
                      ) : (
                        <span 
                          style={{ 
                            fontSize: '0.75rem', 
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            borderRadius: '0.375rem',
                            display: 'inline-block',
                            fontWeight: 500
                          }}
                        >
                          Non assuré
                        </span>
                      )}
                    </td> */}
                    <td className="text-nowrap">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleSolder(facture)}
                        disabled={loadingPaiement}
                      >
                        <FaMoneyBillWave className="me-1" />
                        Solder
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}

        {!loading && !error && getSortedAndFilteredFactures().length > 0 && (
          <div className="mt-3 p-3 bg-light rounded">
            <div className="row text-center">
              <div className="col-md-4">
                <h6 className="text-muted mb-1">Total des factures</h6>
                <h4 className="text-primary mb-0">{getSortedAndFilteredFactures().length}</h4>
              </div>
              <div className="col-md-4">
                <h6 className="text-muted mb-1">Montant total dû</h6>
                <h4 className="text-danger mb-0">
                  {getSortedAndFilteredFactures().reduce((sum, f) => sum + f.montantRestant, 0).toLocaleString()} FCFA
                </h4>
              </div>
              <div className="col-md-4">
                <h6 className="text-muted mb-1">Moyenne par facture</h6>
                <h4 className="text-info mb-0">
                  {Math.round(getSortedAndFilteredFactures().reduce((sum, f) => sum + f.montantRestant, 0) / getSortedAndFilteredFactures().length).toLocaleString()} FCFA
                </h4>
              </div>
            </div>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Fermer
        </Button>
        {!loading && !error && factures.length > 0 && (
          <Button variant="primary" onClick={() => { void chargerFactures(); }}>
            <i className="bi bi-arrow-clockwise me-2"></i>
            Actualiser
          </Button>
        )}
      </Modal.Footer>

      {/* Modal de paiement */}
      <Modal
        show={showPaiementModal}
        onHide={() => setShowPaiementModal(false)}
        size="lg"
        centered
        backdrop="static"
      >
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title>
            <FaMoneyBillWave className="me-2" />
            Solder la facture
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedFacture && (
            <div>
              <div className="alert alert-info">
                <h6 className="mb-2">Détails de la facture</h6>
                <div className="row">
                  <div className="col-md-6">
                    <strong>Patient:</strong> {selectedFacture?.patient || ''}
                  </div>
                  <div className="col-md-6">
                    <strong>Désignation:</strong> {selectedFacture?.designation || ''}
                  </div>
                  <div className="col-md-6">
                    <strong>Montant dû:</strong> {selectedFacture?.montantRestant?.toLocaleString() || '0'} FCFA
                  </div>
                  <div className="col-md-6">
                    <strong>Type:</strong> {selectedFacture?.type || ''}
                  </div>
                </div>
              </div>

              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Montant paye par le client</Form.Label>
                  <Form.Control
                    type="number"
                    value={montantClient}
                    onChange={(e: any) => setMontantClient(e.target.value)}
                    placeholder="Entrez le montant paye"
                    min="0"
                    max={selectedFacture?.montantRestant || 0}
                  />
                </Form.Group>

                <Form.Group className="mb-1">
                  <Form.Label>Mode de Paiement</Form.Label>
                  <Form.Select
                    className="border-info fw-bold text-info"
                    size="lg"
                    name="modePaiement"
                    value={modePaiement} // ✅ OK
                    onChange={(e: any) => setModePaiement(e.target.value)}
                  >
                    <option value="">-- Sélectionner --</option>

                    {modesPaiement.map((mode) => (
                      <option key={mode._id} value={mode.Modepaiement}>
                        {mode.Modepaiement}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <div className="alert alert-warning">
                  <strong>Reste à payer après paiement:</strong>{" "}
                  {((selectedFacture?.montantRestant || 0) - parseFloat(montantClient || '0')).toLocaleString()} FCFA
                </div>
              </Form>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPaiementModal(false)}>
            Annuler
          </Button>
          <Button
            variant="success"
            onClick={handlePaiement}
            disabled={loadingPaiement || !montantClient || !modePaiement}
          >
            {loadingPaiement ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Traitement...
              </>
            ) : (
              <>
                <FaMoneyBillWave className="me-2" />
                Enregistrer le paiement
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Modal>
  );
}
