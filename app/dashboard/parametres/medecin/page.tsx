'use client';
import React, { useEffect, useState } from 'react';
import { Button, Table, Container, Form, InputGroup, Row, Col, Pagination, Toast, ToastContainer, Spinner } from 'react-bootstrap';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import AjouterMedecin from './AjouterMedecin';
import ModifierMedecin from './ModifierMedecin';
import { Medecin } from '@/types/medecin';
import Sidebar from '@/components/Sidebar';


const ITEMS_PER_PAGE = 10;

export default function Medecins() {
  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMedecin, setSelectedMedecin] = useState<Medecin | null>(null);
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
    const fetchMedecins = async () => {
      try {
        const res = await fetch('/api/medecins');
        if (!res.ok) throw new Error('Erreur de chargement');
        const data = await res.json();
        setMedecins(data);
      } catch {
        setError('Impossible de charger les médecins');
      } finally {
        setLoading(false);
      }
    };
    fetchMedecins();
  }, []);


  const handleAddMedecin = (medecin: Medecin) => {
    setMedecins((prev) => [...prev, medecin]);
    showNotification(`✅ Médecin "${medecin.nom}" ajouté.`, 'success');
  };

  const handleEditClick = (medecin: Medecin) => {
    setSelectedMedecin(medecin);
    setShowEditModal(true);
  };

  const handleSaveMedecin = (updated: Medecin) => {
    const updatedList = medecins.map((m) => (m._id === updated._id ? updated : m));
    setMedecins(updatedList);
    showNotification(`📝 Médecin "${updated.nom}" modifié.`, 'info');
  };

  const handleDeleteMedecin = async (id?: string) => {
    try {
      const response = await fetch(`/api/medecins/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setMedecins((prev) => prev.filter((m) => m._id !== id));
        showNotification(`🗑️ Médecin supprimé.`, 'danger');
      }
    } catch {
      showNotification('Erreur suppression', 'danger');
    }
  };

  const filtered = medecins.filter((m) =>
    m?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m?.prenoms?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m?.specialite?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="flex-grow-1 bg-light">
      <Container className="py-4">
        <Row className="mb-3 align-items-center">
          <Col><h2>Liste des Médecins</h2></Col>
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
            <Table bordered hover>
              <thead className="table-primary">
                <tr>
                  <th>#</th><th>Nom</th><th>Prénoms</th><th>Spécialité</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={5} className="text-center">Aucun médecin trouvé.</td></tr>
                ) : paginated.map((medecin, idx) => (
                  <tr key={medecin._id}>
                    <td>{idx + 1 + (currentPage - 1) * ITEMS_PER_PAGE}</td>
                    <td>{medecin.nom}</td>
                    <td>{medecin.prenoms}</td>
                    <td>{medecin.specialite}</td>
                    <td>
                      <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleEditClick(medecin)}><FaEdit /></Button>
                      <Button variant="outline-danger" size="sm" onClick={() => handleDeleteMedecin(medecin._id)}><FaTrash /></Button>
                    </td>
                  </tr>
                ))}
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

        <AjouterMedecin show={showAddModal} onHide={() => setShowAddModal(false)} onAdd={handleAddMedecin} />
        <ModifierMedecin show={showEditModal} onHide={() => setShowEditModal(false)} medecin={selectedMedecin} onSave={handleSaveMedecin} />
      </Container>
    </div>

  );
}