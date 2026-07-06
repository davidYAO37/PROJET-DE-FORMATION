'use client';
import React, { useEffect, useState } from 'react';
import { Button, Table, Container, Form, InputGroup, Row, Col, Pagination, Toast, ToastContainer, Spinner } from 'react-bootstrap';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import AjouterInfirmier from './AjouterInfirmier';
import ModifierInfirmier from './ModifierInfirmier';
import { Infirmier } from '@/types/infirmier';

const ITEMS_PER_PAGE = 10;

export default function Infirmiers() {
  const [infirmiers, setInfirmiers] = useState<Infirmier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedInfirmier, setSelectedInfirmier] = useState<Infirmier | null>(null);
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
    const fetchInfirmiers = async () => {
      try {
        const res = await fetch('/api/infirmiers');
        if (!res.ok) throw new Error('Erreur de chargement');
        const data = await res.json();
        setInfirmiers(data);
      } catch {
        setError('Impossible de charger les infirmiers');
      } finally {
        setLoading(false);
      }
    };
    fetchInfirmiers();
  }, []);

  const handleAddInfirmier = (infirmier: Infirmier) => {
    setInfirmiers((prev) => [...prev, infirmier]);
    showNotification(`✅ Infirmier "${infirmier.nom}" ajouté.`, 'success');
  };

  const handleEditClick = (infirmier: Infirmier) => {
    setSelectedInfirmier(infirmier);
    setShowEditModal(true);
  };

  const handleSaveInfirmier = (updated: Infirmier) => {
    setInfirmiers((prev) => prev.map((i) => (i._id === updated._id ? updated : i)));
    showNotification(`📝 Infirmier "${updated.nom}" modifié.`, 'info');
  };

  const handleDeleteInfirmier = async (id?: string) => {
    if (!id) return;
    try {
      const response = await fetch(`/api/infirmiers/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setInfirmiers((prev) => prev.filter((i) => i._id !== id));
        showNotification(`🗑️ Infirmier supprimé.`, 'danger');
      }
    } catch {
      showNotification('Erreur suppression', 'danger');
    }
  };

  const filtered = infirmiers.filter((i) =>
    i?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i?.prenoms?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i?.service?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i?.grade?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="flex-grow-1 bg-light">
      <Container className="py-4">
        <Row className="mb-3 align-items-center">
          <Col><h2>Liste des Infirmiers</h2></Col>
        </Row>
        <Row className="mb-3">
          <Col md={6}>
            <InputGroup>
              <Form.Control
                placeholder="Rechercher par nom, service ou grade..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </InputGroup>
          </Col>
          <Col md={6} className="text-end">
            <Button variant="success" onClick={() => setShowAddModal(true)}>
              <FaPlus className="me-2" />Ajouter Infirmier
            </Button>
          </Col>
        </Row>

        {loading ? (
          <div className="text-center"><Spinner animation="border" /> Chargement...</div>
        ) : error ? (
          <div className="text-danger text-center">{error}</div>
        ) : (
          <div className="table-responsive">
            <Table bordered hover className="text-center">
              <thead className="table-info">
                <tr>
                  <th>#</th>
                  <th>Nom</th>
                  <th>Prénoms</th>
                  <th>Service</th>
                  <th>Grade</th>
                  <th>Téléphone</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center">Aucun infirmier trouvé.</td>
                  </tr>
                ) : (
                  paginated.map((infirmier, idx) => (
                    <tr key={infirmier._id}>
                      <td>{idx + 1 + (currentPage - 1) * ITEMS_PER_PAGE}</td>
                      <td>{infirmier.nom}</td>
                      <td>{infirmier.prenoms}</td>
                      <td>{infirmier.service || 'N/A'}</td>
                      <td>{infirmier.grade || 'N/A'}</td>
                      <td>{infirmier.telephone || 'N/A'}</td>
                      <td>{infirmier.EmailInf || 'N/A'}</td>
                      <td className="bg-info bg-opacity-10">
                        <Button
                          variant="outline-primary" size="sm" className="me-2"
                          title="Modifier l'infirmier"
                          onClick={() => handleEditClick(infirmier)}
                        >
                          <FaEdit />
                        </Button>
                        <Button
                          variant="outline-danger" size="sm"
                          title="Supprimer l'infirmier"
                          onClick={() => handleDeleteInfirmier(infirmier._id)}
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

        <AjouterInfirmier show={showAddModal} onHide={() => setShowAddModal(false)} onAdd={handleAddInfirmier} />
        <ModifierInfirmier show={showEditModal} onHide={() => setShowEditModal(false)} infirmier={selectedInfirmier} onSave={handleSaveInfirmier} />
      </Container>
    </div>
  );
}
