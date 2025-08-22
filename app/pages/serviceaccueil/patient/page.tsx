'use client';

import React, { useEffect, useState } from 'react';
import { Button, Table, Container, Form, InputGroup, Row, Col, Pagination, Toast, ToastContainer, Spinner } from 'react-bootstrap';
import { FaEdit, FaTrash, FaPlus, FaPlusCircle } from 'react-icons/fa';
import AjouterPatient from './AjouterPatient';
import ModifierPatient from './ModifierPatient';
import { Patient } from '@/types/patient';
import { BiSolidBookAdd } from 'react-icons/bi';
import { CgUserList } from 'react-icons/cg';
import { Modal } from 'react-bootstrap';
import FicheConsultation from '../componant/FicheConsultation';
import dayjs from 'dayjs';

const ITEMS_PER_PAGE = 10;

export default function Page() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
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

  // ✅ Charger les patients depuis MongoDB via API
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await fetch('/api/patients');
        if (!res.ok) throw new Error('Erreur de chargement');
        const data = await res.json();
        setPatients(data);
      } catch (err) {
        setError('Impossible de charger les patients');
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  // ✅ Ajouter patient (local + MongoDB)
  const handleAddPatient = (patient: Patient) => {
    setPatients((prev) => [...prev, patient]);
    showNotification(`✅ Patient "${patient.nom}" ajouté.`, 'success');
  };

  // ✅ Modifier patient
  const handleEditClick = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowEditModal(true);
  };

  const handleSavePatient = (updatedPatient: Patient) => {
    const updatedList = patients.map((p) => (p._id === updatedPatient._id ? updatedPatient : p));
    setPatients(updatedList);
    showNotification(`📝 Patient "${updatedPatient.nom}" modifié.`, 'info');
  };
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [consultationJour, setConsultationJour] = useState<string | null>(null);

  // ✅ Supprimer patient avec loader par id
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const handleDeletePatient = async (id?: string) => {
    if (!id) return;
    setDeleteLoadingId(id);
    try {
      const response = await fetch(`/api/patients/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setPatients((prev) => prev.filter((p) => p._id !== id));
        showNotification(`🗑️ Patient supprimé.`, 'danger');
      }
    } catch {
      showNotification('Erreur suppression', 'danger');
    } finally {
      setDeleteLoadingId(null);
    }
  };

  // ✅ Filtrage + Pagination
  const filteredPatients = patients.filter((p) =>
    p.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.prenoms?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sexe?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.contact?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.codeDossier?.toLowerCase().includes(searchTerm.toLowerCase())

  );

  const totalPages = Math.ceil(filteredPatients.length / ITEMS_PER_PAGE);
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const goToPreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <Container className="py-4">
      <Row className="mb-3 align-items-center">
        <Col xs={12} md={6}>
          <h2>Liste des Patients</h2>
        </Col>
      </Row>

      {/* Barre de recherche et bouton ajout */}
      <Row className="mb-3 align-items-center">
        <Col xs={12} md={6}>
          <InputGroup>
            <Form.Control
              placeholder="Rechercher par nom ou prénoms..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </InputGroup>
        </Col>
        <Col xs={12} md={6} className="mt-2 mt-md-0 text-md-end text-start">
          <Button variant="success" onClick={() => setShowAddModal(true)}>
            <FaPlus className="me-2" />
            Ajouter un Patient
          </Button>
        </Col>
      </Row>

      {/* Table */}
      {loading ? (
        <div className="text-center">
          <Spinner animation="border" /> Chargement...
        </div>
      ) : error ? (
        <div className="text-danger text-center">{error}</div>
      ) : (
        <div className="table-responsive">
          <Table bordered hover className="text-center">
            <thead className="table-primary">
              <tr>
                <th>#</th>
                <th>Nom</th>
                <th>Prénoms</th>
                <th>Âge</th>
                <th>Sexe</th>
                <th>Contact</th>
                <th>Code Dossier</th>
                <th>Visite ou Consultation</th>
                <th>Gestion Patient</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPatients.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center">
                    Aucun patient trouvé.
                  </td>
                </tr>
              ) : (
                paginatedPatients.map((patient, index) => (
                  <tr key={patient._id}>
                    <td>{index + 1 + (currentPage - 1) * ITEMS_PER_PAGE}</td>
                    <td>{patient.nom}</td>
                    <td>{patient.prenoms}</td>
                    <td>{patient.age}</td>
                    <td>{patient.sexe}</td>
                    <td>{patient.contact}</td>
                    <td>{patient.codeDossier}</td>
                    <td className="bg-secondary bg-opacity-10">
                      <Button
                        variant="outline-primary"
                        title="Nouvelle Consultation ou visite"
                        size="sm"
                        className="me-4"
                        onClick={async () => {
                          setSelectedPatient(patient);
                          try {
                            const res = await fetch(`/api/consultation?patientId=${patient._id}`);
                            if (res.ok) {
                              const consultations = await res.json();
                              const today = dayjs().startOf('day');
                              const found = consultations.find((c: any) => {
                                const date = dayjs(c.Date_consulation);
                                return date.isSame(today, 'day');
                              });
                              if (found && found.Code_Prestation) {
                                setConsultationJour(found.Code_Prestation);
                                setShowConsultationModal(true);
                                return;
                              }
                            }
                          } catch (e) {
                            console.error("Erreur vérification consultation", e);
                          }
                          // sinon -> pas de consultation aujourd’hui, ouvrir la fiche
                          setConsultationJour(null);
                          setShowConsultationModal(true);
                        }}

                      >
                        <BiSolidBookAdd />
                      </Button>

                      <Button
                        variant="outline-success"
                        title="Liste des consultations ou visites du patient"
                        size="sm"
                        onClick={() => handleDeletePatient(patient._id)}
                      >
                        <CgUserList />
                      </Button>

                    </td>
                    <td className="bg-primary bg-opacity-10">
                      <Button
                        variant="outline-primary"
                        title="Modifier le patient"
                        size="sm"
                        className="me-4"
                        onClick={() => handleEditClick(patient)}
                      >
                        <FaEdit />
                      </Button>
                      <Button
                        variant="outline-danger"
                        title="Supprimer le patient"
                        size="sm"
                        onClick={() => handleDeletePatient(patient._id)}
                        disabled={deleteLoadingId === patient._id}
                      >
                        {deleteLoadingId === patient._id ? (
                          <Spinner as="span" animation="border" size="sm" />
                        ) : (
                          <FaTrash />
                        )}
                      </Button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-3">
          <Pagination>
            <Pagination.Prev
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
            >
              Précédent
            </Pagination.Prev>

            <Pagination.Next
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
            >
              Suivant
            </Pagination.Next>
          </Pagination>
        </div>
      )}

      {/* Toast */}
      <ToastContainer position="bottom-end" className="p-3">
        <Toast
          show={showToast}
          onClose={() => setShowToast(false)}
          bg={toastVariant}
          delay={3000}
          autohide
        >
          <Toast.Body className="text-white">{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>

      {/* Modales */}
      <AjouterPatient
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        onAdd={handleAddPatient}
        nextId={patients.length + 1}
      />

      <ModifierPatient
        show={showEditModal}
        handleClose={() => setShowEditModal(false)}
        patient={selectedPatient}
        onUpdate={handleSavePatient}
      />
      {/* on vérifie si le patient selection a un Code_Prestation pour la journée */}


      <Modal
        show={showConsultationModal}
        onHide={() => setShowConsultationModal(false)}
        size="xl"
        centered
        scrollable
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Nouvelle Consultation - {selectedPatient?.nom} {selectedPatient?.prenoms} - Age : {selectedPatient?.age} ans
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {consultationJour ? (
            <div className="text-center p-4">
              <h4 className="text-success">Ce patient a déjà une consultation aujourd'hui.</h4>
              <p>Code Prestation : <b>{consultationJour}</b></p>
            </div>
          ) : (
            <FicheConsultation patient={selectedPatient} />
          )}
        </Modal.Body>
      </Modal>
    </Container>

  );
}
