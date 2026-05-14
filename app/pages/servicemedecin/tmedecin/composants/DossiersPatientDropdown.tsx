'use client';
import { useState, useEffect } from 'react';
import { Dropdown, DropdownButton, Button, Modal } from 'react-bootstrap';
import { FaList, FaUserInjured, FaFileMedical, FaBriefcaseMedical, FaProcedures, FaHospitalUser, FaPrint } from 'react-icons/fa';

interface DossiersPatientDropdownProps {
  patientId: string;
  patientNom?: string;
  patientPrenoms?: string;
  onDossierPatient?: () => void;
  onAvisHospitalisation?: () => void;
  onArretTravail?: () => void;
  onCompteRenduOperatoire?: () => void;
  onRapportHospitalisation?: () => void;
}

export default function DossiersPatientDropdown({ 
  patientId, 
  patientNom, 
  patientPrenoms,
  onDossierPatient,
  onAvisHospitalisation,
  onArretTravail,
  onCompteRenduOperatoire,
  onRapportHospitalisation
}: DossiersPatientDropdownProps) {
  const [avisCount, setAvisCount] = useState(0);
  const [arretCount, setArretCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Charger les statistiques du patient
  useEffect(() => {
    const chargerStatistiques = async () => {
      try {
        setLoading(true);
        
        // Charger les avis d'hospitalisation du patient
        try {
          const avisResponse = await fetch(`/api/avishospit?patientId=${patientId}`);
          if (avisResponse.ok) {
            const avisData = await avisResponse.json();
            setAvisCount(avisData.data?.length || 0);
          }
        } catch (err) {
          console.warn('Erreur lors du chargement des avis d\'hospitalisation:', err);
        }

        // Charger les arrêts de travail du patient (API à créer)
        try {
          const arretResponse = await fetch(`/api/arrettravail?patientId=${patientId}`);
          if (arretResponse.ok) {
            const arretData = await arretResponse.json();
            setArretCount(arretData.data?.length || 0);
          }
        } catch (err) {
          console.warn('Erreur lors du chargement des arrêts de travail:', err);
        }
        
      } catch (err) {
        console.error('Erreur générale:', err);
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      chargerStatistiques();
    }
  }, [patientId]);

  return (
    <DropdownButton
      variant="outline-primary"
      title={
        <span>
          <FaList className="me-2" />
          Dossiers Patient
        </span>
      }
      size="sm"
      className="me-3"
    >
      <Dropdown.Item onClick={onDossierPatient} className="d-flex align-items-center">
        <FaUserInjured className="me-2 text-primary" />
        <span className="fw-bold">Dossier Patient</span>
      </Dropdown.Item>

      <Dropdown.Divider />

      <Dropdown.Item onClick={onAvisHospitalisation} className="d-flex align-items-center">
        <FaFileMedical className="me-2 text-danger" />
        <span className="fw-bold">Avis d'hospitalisation</span>
        {!loading && avisCount > 0 && (
          <span className="bg-danger text-white ms-auto" style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}>{avisCount}</span>
        )}
      </Dropdown.Item>

      <Dropdown.Item onClick={onArretTravail} className="d-flex align-items-center">
        <FaBriefcaseMedical className="me-2 text-warning" />
        <span className="fw-bold">Arrêt de travail</span>
        {!loading && arretCount > 0 && (
          <span className="bg-warning text-dark ms-auto" style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}>{arretCount}</span>
        )}
      </Dropdown.Item>

      <Dropdown.Divider />

      <Dropdown.Item onClick={onCompteRenduOperatoire} className="d-flex align-items-center">
        <FaProcedures className="me-2 text-info" />
        <span className="fw-bold">Compte rendu opératoire</span>
      </Dropdown.Item>

      <Dropdown.Item onClick={onRapportHospitalisation} className="d-flex align-items-center">
        <FaHospitalUser className="me-2 text-success" />
        <span className="fw-bold">Rapport d'hospitalisation</span>
      </Dropdown.Item>
    </DropdownButton>
  );
}
