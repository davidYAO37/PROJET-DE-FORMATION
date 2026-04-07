'use client';
import { useState, useEffect } from 'react';
import { Modal, Button, Row, Col, Card, Form } from 'react-bootstrap';
import { IMedecin } from '@/models/medecin';
import PlanningModal from './PlanningModal';
import PlanningField from './PlanningField';
// import AnnulerPlanningModal from './AnnulerPlanningModal'; // Temporairement commenté
import styles from './ListePlanningModal.module.css';

interface ListePlanningModalProps {
  show: boolean;
  onHide: () => void;
}

interface PlanningItem {
  id: string;
  medecinId: string;
  medecinNom: string;
  date: string;
  heure: string;
  statut: 'disponible' | 'pris' | 'indisponible';
}

export default function ListePlanningModal({ show, onHide }: ListePlanningModalProps) {
  const [showPlanningModal, setShowPlanningModal] = useState(false);
  const [showAnnulerModal, setShowAnnulerModal] = useState(false);
  const [selectedPlanning, setSelectedPlanning] = useState<any>(null);

  const handleNouveauPlanning = () => {
    setSelectedPlanning(null); // Nouveau planning
    setShowPlanningModal(true);
    // Ne PAS fermer le modal de liste ici
  };

  const handleModifierPlanning = (planning: any) => {
    setSelectedPlanning(planning); // Planning existant à modifier
    setShowPlanningModal(true);
    // Ne PAS fermer le modal de liste ici
  };

  const handlePlanningModalClose = () => {
    setShowPlanningModal(false);
    setSelectedPlanning(null);
    // Ne PAS fermer le modal de liste
  };

  const handleAnnulerPlanning = () => {
    setShowAnnulerModal(true);
    // Ne PAS fermer le modal de liste ici
  };

  const handleRefresh = () => {
    // Force le rafraîchissement du PlanningField
    // Cette fonction sera appelée après une suppression
    console.log('🔄 Rafraîchissement des plannings demandé');
  };

  return (
    <>
      <Modal show={show} onHide={onHide} size="xl" className={styles.listePlanningModal}>
        <Modal.Header closeButton className={styles.modalHeader}>
          <Modal.Title className={styles.modalTitle}>
            <i className="bi bi-calendar-week me-2"></i>
            GESTION PLANNING MEDECIN
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className={styles.modalBody}>
          <PlanningField 
            onPlanningSelect={handleModifierPlanning}
            showActions={true}
            onRefresh={handleRefresh}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            <i className="bi bi-x-lg me-2"></i>
            Fermer
          </Button>
          <Button variant="primary" onClick={handleNouveauPlanning} className="me-2">
            <i className="bi bi-file-earmark-plus me-2"></i>
            Nouveau Planning
          </Button>
          <Button variant="danger" onClick={handleAnnulerPlanning}>
            <i className="bi bi-pencil-square me-2"></i>
            Annuler Planning
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal pour créer/modifier un planning */}
      <PlanningModal
        show={showPlanningModal}
        onHide={handlePlanningModalClose}
      />

      {/* Modal pour annuler un planning - temporairement désactivé */}
      {/* <AnnulerPlanningModal
        show={showAnnulerModal}
        onHide={() => setShowAnnulerModal(false)}
      /> */}
    </>
  );
}
