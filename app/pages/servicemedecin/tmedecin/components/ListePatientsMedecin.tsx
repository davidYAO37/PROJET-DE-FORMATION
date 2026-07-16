'use client';

import React, { useEffect, useState } from 'react';
import { Button, Table, Container, Form, InputGroup, Row, Col, Pagination, Toast, ToastContainer, Spinner } from 'react-bootstrap';
import { FaEdit, FaTrash, FaHospitalUser, FaPrescription, FaList } from 'react-icons/fa';
import { Patient } from '@/types/patient';
import DossiersPatientDropdown from './DossiersPatientDropdown';
import DossierPatient from '@/app/servicemedecin/tmedecin/components/DossierPatient';
import ArretTravailModal from './ArretTravailModal';
import RapportHospitalisationModal from './RapportHospitalisationModal';
import AvisHospitModal from './AvisHospit/AvisHospitModal';
import CompteRenduOperatoireModal from './CompteRenduOperatoireModal';


const ITEMS_PER_PAGE = 10;

export default function ListePatientMedecin() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastVariant, setToastVariant] = useState<'success' | 'info' | 'danger'>('info');

  // État pour le modal unifié des Dossiers patient
  const [showPatientDossiersModal, setShowPatientDossiersModal] = useState(false);
  const [patientIdDossiersModal, setPatientIdDossiersModal] = useState<string | null>(null);

  // États pour les modaux de gestion des dossiers
  const [showDossierPatientModal, setShowDossierPatientModal] = useState(false);
  const [showAvisHospitalisationModal, setShowAvisHospitalisationModal] = useState(false);
  const [showArretTravailModal, setShowArretTravailModal] = useState(false);
  const [showCompteRenduOperatoireModal, setShowCompteRenduOperatoireModal] = useState(false);
  const [showRapportHospitalisationModal, setShowRapportHospitalisationModal] = useState(false);
  const [selectedPatientForModals, setSelectedPatientForModals] = useState<Patient | null>(null);

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

  // ✅ Modifier patient
  const handleEditClick = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowEditModal(true);
  };

  const handleSavePatient = (updatedPatient: Patient) => {
    const updatedList = patients.map((p) => (p._id === updatedPatient._id ? updatedPatient : p));
    setPatients(updatedList);
    showNotification(`📝 Patient "${updatedPatient.Nom}" modifié.`, 'info');
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

  // Fonctions pour les actions du menu déroulant Dossiers Patient
  const handleDossierPatient = (patient: Patient) => {
    setSelectedPatientForModals(patient);
    setShowDossierPatientModal(true);
  };

  const handleAvisHospitalisation = (patient: Patient) => {
    setSelectedPatientForModals(patient);
    setShowAvisHospitalisationModal(true);
  };

  const handleArretTravail = (patient: Patient) => {
    setSelectedPatientForModals(patient);
    setShowArretTravailModal(true);
  };

  const handleCompteRenduOperatoire = (patient: Patient) => {
    setSelectedPatientForModals(patient);
    setShowCompteRenduOperatoireModal(true);
  };

  const handleRapportHospitalisation = (patient: Patient) => {
    setSelectedPatientForModals(patient);
    setShowRapportHospitalisationModal(true);
  };

  // ✅ Filtrage + Pagination
  const filteredPatients = patients.filter((p) =>
    p.Nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.Prenoms?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sexe?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.Contact?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.Code_dossier?.toLowerCase().includes(searchTerm.toLowerCase())

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
                <th>Dossiers Patient</th>
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
                    <td>{patient.Nom}</td>
                    <td>{patient.Prenoms}</td>
                    <td>{patient.Age_partient}</td>
                    <td>{patient.sexe}</td>
                    <td>{patient.Contact}</td>
                    <td>{patient.Code_dossier}</td>
                    <td className="bg-secondary bg-opacity-10">
                      <DossiersPatientDropdown
                        patientId={patient._id?.toString() || ''}
                        patientNom={patient.Nom}
                        patientPrenoms={patient.Prenoms}
                        onDossierPatient={() => handleDossierPatient(patient)}
                        onAvisHospitalisation={() => handleAvisHospitalisation(patient)}
                        onArretTravail={() => handleArretTravail(patient)}
                        onCompteRenduOperatoire={() => handleCompteRenduOperatoire(patient)}
                        onRapportHospitalisation={() => handleRapportHospitalisation(patient)}
                      />
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

      {/* Modal Dossier Patient Complet */}
      {selectedPatientForModals && (
        <DossierPatient
          show={showDossierPatientModal}
          onHide={() => setShowDossierPatientModal(false)}
          patientId={selectedPatientForModals._id?.toString() || ''}
          patientNom={selectedPatientForModals.Nom}
          patientPrenoms={selectedPatientForModals.Prenoms}
        />
      )}

      {/* Modal Avis d'Hospitalisation */}
      {selectedPatientForModals && (
        <ArretTravailModal
          show={showArretTravailModal}
          onHide={() => setShowArretTravailModal(false)}
          patientId={selectedPatientForModals._id?.toString() || ''}
          patientNom={selectedPatientForModals.Nom}
          patientPrenoms={selectedPatientForModals.Prenoms}
          patientCodeDossier={selectedPatientForModals.Code_dossier}
        />
      )}

      {/* Modal Avis d'Hospitalisation */}
      {selectedPatientForModals && (
        <AvisHospitModal
          show={showAvisHospitalisationModal}
          onHide={() => setShowAvisHospitalisationModal(false)}
          patientId={selectedPatientForModals._id?.toString() || ''}
          patientNom={selectedPatientForModals.Nom}
          patientPrenoms={selectedPatientForModals.Prenoms}
          Code_dossier={selectedPatientForModals.Code_dossier}
          Assurance={selectedPatientForModals.assurance}
          SOCIETE_PATIENT={selectedPatientForModals.SOCIETE_PATIENT}
        />
      )}

      {/* Modal Compte Rendu Opératoire */}
      {selectedPatientForModals && (
        <CompteRenduOperatoireModal
          show={showCompteRenduOperatoireModal}
          onHide={() => setShowCompteRenduOperatoireModal(false)}
          patientId={selectedPatientForModals._id?.toString() || ''}
          patientNom={selectedPatientForModals.Nom}
          patientPrenoms={selectedPatientForModals.Prenoms}
        />
      )}

      {/* Modal Rapport d'Hospitalisation */}
      {selectedPatientForModals && (
        <RapportHospitalisationModal
          show={showRapportHospitalisationModal}
          onHide={() => setShowRapportHospitalisationModal(false)}
          patientId={selectedPatientForModals._id?.toString() || ''}
          patientNom={selectedPatientForModals.Nom}
          patientPrenoms={selectedPatientForModals.Prenoms}
        />
      )}

    </Container>

  );
}
