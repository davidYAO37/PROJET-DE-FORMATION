'use client';
import { Modal, Button, Nav, Tab } from 'react-bootstrap';
import { FaTimes, FaFileMedical, FaClock, FaCheckCircle, FaUserMd } from 'react-icons/fa';
import { useState } from 'react';
import ListeAvalider from '@/app/pages/serviceradio/tradio/composants/ListeAvalider';
import ListePatientRadio from '@/app/pages/serviceradio/tradio/composants/ListePatientRadio';

interface ServiceRadioModalProps {
  show: boolean;
  onHide: () => void;
}

export default function ServiceRadioModal({ show, onHide }: ServiceRadioModalProps) {
  const [activeTab, setActiveTab] = useState('avalider');

  return (
    <Modal 
      show={show} 
      onHide={onHide}
      size="xl"
      centered
      className="service-radio-modal"
    >
      <Modal.Header className="bg-primary text-white">
        <Modal.Title className="d-flex align-items-center">
          <FaUserMd className="me-2" />
          Service Radio - Comptes Rendus
        </Modal.Title>
        <Button variant="link" className="text-white" onClick={onHide}>
          <FaTimes />
        </Button>
      </Modal.Header>
      
      <Modal.Body className="p-0">
        <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'avalider')}>
          <Nav variant="tabs" className="bg-light">
            <Nav.Item>
              <Nav.Link eventKey="avalider" className="d-flex align-items-center">
                <FaClock className="me-2" />
                À Saisir/Valider
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="patients" className="d-flex align-items-center">
                <FaUserMd className="me-2" />
                Patients Radio
              </Nav.Link>
            </Nav.Item>
          </Nav>
          
          <Tab.Content className="p-3">
            <Tab.Pane eventKey="avalider">
              <ListeAvalider 
                onLigneSelect={(ligne, patient) => {
                  // Logique pour ouvrir l'éditeur de compte rendu
                  console.log('Sélection de la ligne:', ligne, patient);
                }} 
              />
            </Tab.Pane>
            <Tab.Pane eventKey="patients">
              <ListePatientRadio 
                onPatientSelect={(patient) => {
                  console.log('Patient sélectionné:', patient);
                }}
              />
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
      </Modal.Body>
      
      <Modal.Footer className="bg-light">
        <Button variant="secondary" onClick={onHide}>
          Fermer
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
