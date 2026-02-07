'use client';
import React, { useEffect, useState } from 'react';
import { Button, Table, Container, Form, InputGroup, Row, Col, Pagination, Toast, ToastContainer, Spinner } from 'react-bootstrap';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import AjouterEntreprise from './AjouterEntreprise';
import ModifierEntreprise from './ModifierEntreprise';
import { Entreprise } from '@/types/entreprise';


const ITEMS_PER_PAGE = 10;

export default function Entreprises() {
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEntreprise, setSelectedEntreprises] = useState<Entreprise | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastVariant, setToastVariant] = useState<'success' | 'info' | 'danger'>('info');

  const showNotification = (message: string, variant: 'success' | 'info' | 'danger') => {
    setToastMessage(message);
    setToastVariant(variant);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  useEffect(() => {
    const fetchEntreprises = async () => {
      try {
        const res = await fetch('/api/entreprise');
        if (!res.ok) throw new Error('Erreur de chargement');
        const data = await res.json();
        setEntreprises(data);
      } catch {
        setError('Impossible de charger les entreprises');
      } finally {
        setLoading(false);
      }
    };
    fetchEntreprises();
  }, []);


  const handleAddEntreprise = (Entreprise: Entreprise) => {
    setEntreprises((prev) => [...prev, Entreprise]);
    showNotification(`✅ l'Entreprise "${Entreprise.NomSociete}" ajoutée.`, 'success');
  };

  const handleEditClick = (Entreprise: Entreprise) => {
    setSelectedEntreprises(Entreprise);
    setShowEditModal(true);
  };

  const handleSaveEntreprise = (updated: Entreprise) => {
    const updatedList = entreprises.map((m) => (m._id === updated._id ? updated : m));
    setEntreprises(updatedList);
    showNotification(`📝 l'Entreprise "${updated.NomSociete}" modifiée.`, 'info');
  };

  const handleDeleteEntreprise = async (id?: string) => {
    try {
      const response = await fetch(`/api/entreprises/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setEntreprises((prev) => prev.filter((m) => m._id !== id));
        showNotification(`🗑️ l'Entreprise supprimée.`, 'danger');
      }
    } catch {
      showNotification('Erreur suppression', 'danger');
    }
  };

  const filtered = entreprises.filter((m) =>
    m?.NomSociete?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="flex-grow-1 bg-light">
      <Container className="py-4">
        <Row className="mb-3 align-items-center">
          <Col><h2>Liste des Entreprises</h2></Col>
        </Row>
        <Row className="mb-3">
          <Col md={6}>
            <InputGroup>
              <Form.Control placeholder="Rechercher..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
            </InputGroup>
          </Col>
          <Col md={6} className="text-end">
            <Button variant="success" onClick={() => setShowAddModal(true)}><FaPlus className="me-2" />Ajouter Médecin</Button>
          </Col>
        </Row>

        {loading ? (
          <div className="text-center"><Spinner animation="border" /> Chargement...</div>
        ) : error ? (
          <div className="text-danger text-center">{error}</div>
        ) : (
          <div className="table-responsive">
            <Table bordered hover className="text-center">
              <thead className="table-primary">
                <tr>
                  <th>#</th>
                  <th>Nom de centre</th> 
                  <th>Entete</th>
                  <th>Pied de page</th> 
                  <th>NCC</th>
                  <th>LogoE</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center">
                      Aucune entreprise trouvée.
                    </td>
                  </tr>
                ) : (
                  paginated.map((Entreprise, idx) => (
                    <tr key={Entreprise._id}>
                      <td>{idx + 1 + (currentPage - 1) * ITEMS_PER_PAGE}</td>
                      <td>{Entreprise.NomSociete}</td>
                      <td>{Entreprise.EnteteSociete || 0}</td>
                      <td>{Entreprise.PiedPageSociete || 0}</td>
                      <td>{Entreprise.NCC || 0}</td>
                      <td>
                        {Entreprise.LogoE && typeof Entreprise.LogoE === 'string' ? (
                          <img 
                            src={Entreprise.LogoE.startsWith('data:') ? Entreprise.LogoE : `/uploads/logos/${Entreprise.LogoE}`}
                            alt={`Logo de ${Entreprise.NomSociete}`}
                            style={{ 
                              maxWidth: '50px', 
                              maxHeight: '50px',
                              objectFit: 'cover',
                              border: '1px solid #ddd',
                              borderRadius: '4px'
                            }}
                          />
                        ) : (
                          <div 
                            style={{ 
                              width: '50px', 
                              height: '50px',
                              backgroundColor: '#f8f9fa',
                              border: '1px dashed #dee2e6',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              margin: '0 auto'
                            }}
                            title="Aucun logo"
                          >
                            <span style={{ fontSize: '12px', color: '#6c757d' }}>∅</span>
                          </div>
                        )}
                      </td>
                      <td className="bg-primary bg-opacity-10">
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          className="me-2" 
                          title="Modifier l'entreprise"
                          onClick={() => handleEditClick(Entreprise)}
                        >
                          <FaEdit />
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          title="Supprimer le médecin"
                          onClick={() => handleDeleteEntreprise(Entreprise._id)}
                        >
                          <FaTrash />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="d-flex justify-content-center mt-3">
            <Pagination>
              <Pagination.Prev disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>Précédent</Pagination.Prev>
              <Pagination.Next disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>Suivant</Pagination.Next>
            </Pagination>
          </div>
        )}

        <ToastContainer position="bottom-end" className="p-3">
          <Toast show={showToast} bg={toastVariant} delay={3000} autohide>
            <Toast.Body className="text-white">{toastMessage}</Toast.Body>
          </Toast>
        </ToastContainer>

        <AjouterEntreprise show={showAddModal} onHide={() => setShowAddModal(false)} onAdd={handleAddEntreprise} />
        <ModifierEntreprise show={showEditModal} onHide={() => setShowEditModal(false)} entreprise={selectedEntreprise} onSave={handleSaveEntreprise} />
      </Container>
    </div>

  );
}