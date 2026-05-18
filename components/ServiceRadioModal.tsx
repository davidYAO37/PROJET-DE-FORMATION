'use client';
import { Modal, Button, Nav, Tab } from 'react-bootstrap';
import { FaTimes, FaFileMedical, FaClock, FaCheckCircle, FaUserMd } from 'react-icons/fa';
import { useState } from 'react';
import ListeAvalider from '@/app/pages/serviceradio/tradio/components/ListeAvalider';
import ListePatientRadio from '@/app/pages/serviceradio/tradio/components/ListePatientRadio';
import ListesValides from '@/app/pages/serviceradio/tradio/components/ListesValides';

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
      style={{
        borderRadius: '15px',
        overflow: 'hidden',
        border: 'none',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
      }}
    >
      <Modal.Header 
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
          padding: '25px 30px',
          borderRadius: '15px 15px 0 0'
        }}
        className="text-white"
      >
        <Modal.Title 
          className="d-flex align-items-center"
          style={{
            fontSize: '20px',
            fontWeight: '600',
            margin: 0
          }}
        >
          <FaUserMd 
            style={{ 
              fontSize: '24px',
              marginRight: '12px',
              color: '#ffffff'
            }} 
          />
          Service de Radiologie
        </Modal.Title>
        <Button 
          variant="link" 
          className="text-white p-2" 
          onClick={onHide}
          style={{
            borderRadius: '8px',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <FaTimes style={{ fontSize: '18px' }} />
        </Button>
      </Modal.Header>
      
      <Modal.Body 
        style={{
          padding: 0,
          background: '#f8f9fa',
          height: '650px', // Hauteur fixe pour le modal
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'avalider')}>
          <Nav 
            variant="tabs" 
            className="border-0"
            style={{
              background: 'white',
              padding: '0',
              borderBottom: '1px solid #e9ecef'
            }}
          >
            <Nav.Item>
              <Nav.Link 
                eventKey="avalider" 
                className="d-flex align-items-center px-4 py-3"
                style={{
                  border: 'none',
                  borderRadius: '0',
                  color: '#6c757d',
                  fontWeight: '500',
                  transition: 'all 0.3s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'avalider') {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                    e.currentTarget.style.color = '#667eea';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'avalider') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#6c757d';
                  }
                }}
              >
                <FaClock className="me-2" />
                À Saisir/Valider
                {activeTab === 'avalider' && (
                  <div 
                    style={{
                      position: 'absolute',
                      bottom: '0',
                      left: '0',
                      right: '0',
                      height: '3px',
                      background: 'linear-gradient(90deg, #667eea, #764ba2)',
                      borderRadius: '3px 3px 0 0'
                    }}
                  />
                )}
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                eventKey="valides" 
                className="d-flex align-items-center px-4 py-3"
                style={{
                  border: 'none',
                  borderRadius: '0',
                  color: '#6c757d',
                  fontWeight: '500',
                  transition: 'all 0.3s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'valides') {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                    e.currentTarget.style.color = '#667eea';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'valides') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#6c757d';
                  }
                }}
              >
                <FaCheckCircle className="me-2" />
                Validés
                {activeTab === 'valides' && (
                  <div 
                    style={{
                      position: 'absolute',
                      bottom: '0',
                      left: '0',
                      right: '0',
                      height: '3px',
                      background: 'linear-gradient(90deg, #667eea, #764ba2)',
                      borderRadius: '3px 3px 0 0'
                    }}
                  />
                )}
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                eventKey="patients" 
                className="d-flex align-items-center px-4 py-3"
                style={{
                  border: 'none',
                  borderRadius: '0',
                  color: '#6c757d',
                  fontWeight: '500',
                  transition: 'all 0.3s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'patients') {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                    e.currentTarget.style.color = '#667eea';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'patients') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#6c757d';
                  }
                }}
              >
                <FaUserMd className="me-2" />
                Patients Radio
                {activeTab === 'patients' && (
                  <div 
                    style={{
                      position: 'absolute',
                      bottom: '0',
                      left: '0',
                      right: '0',
                      height: '3px',
                      background: 'linear-gradient(90deg, #667eea, #764ba2)',
                      borderRadius: '3px 3px 0 0'
                    }}
                  />
                )}
              </Nav.Link>
            </Nav.Item>
          </Nav>
          
          <Tab.Content 
            style={{
              background: 'white',
              padding: '30px',
              flex: 1, // Prend tout l'espace restant
              overflow: 'auto', // Activer le scroll
              maxHeight: 'calc(650px - 60px)', // Hauteur maximale (modal height - nav height)
              // Style du scroll compatible avec tous les navigateurs
              scrollbarWidth: 'thin', // Firefox
              scrollbarColor: '#667eea #f1f1f1' // Firefox
            }}
            className="scrollable-tab-content"
          >
            <Tab.Pane eventKey="avalider">
              <ListeAvalider 
                onLigneSelect={(ligne, patient) => {
                  console.log('Sélection de la ligne:', ligne, patient);
                }} 
              />
            </Tab.Pane>
            <Tab.Pane eventKey="valides">
              <ListesValides 
                onLigneSelect={(ligne, patient) => {
                  console.log('Sélection de la ligne validée:', ligne, patient);
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
      
      <Modal.Footer 
        style={{
          background: 'white',
          borderTop: '1px solid #e9ecef',
          padding: '20px 30px',
          borderRadius: '0 0 15px 15px'
        }}
      >
        <Button 
          variant="secondary" 
          onClick={onHide}
          style={{
            borderRadius: '8px',
            padding: '10px 25px',
            fontWeight: '500',
            border: '1px solid #dee2e6',
            backgroundColor: '#6c757d',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#5a6268';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#6c757d';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Fermer
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
