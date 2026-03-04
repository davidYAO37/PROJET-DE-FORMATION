"use client";

import { useState, useEffect } from 'react';
import { Card, Row, Col } from 'react-bootstrap';

export default function TestLogosPage() {
  const [entreprises, setEntreprises] = useState<any[]>([]);
  const [availableFiles, setAvailableFiles] = useState<string[]>([]);

  useEffect(() => {
    // Charger les entreprises
    fetch('/api/entreprise')
      .then(res => res.json())
      .then(data => setEntreprises(data))
      .catch(err => console.error('Erreur chargement entreprises:', err));

    // Charger les fichiers disponibles
    fetch('/api/entreprise/logos')
      .then(res => res.json())
      .then(files => setAvailableFiles(files))
      .catch(err => console.error('Erreur chargement fichiers:', err));
  }, []);

  return (
    <div className="container-fluid p-4">
      <h1 className="mb-4">Test d'affichage des logos</h1>
      
      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5>Fichiers disponibles dans uploads/logos</h5>
            </Card.Header>
            <Card.Body>
              {availableFiles.length > 0 ? (
                <ul>
                  {availableFiles.map((file, index) => (
                    <li key={index}>
                      <strong>{file}</strong>
                      <br />
                      <img 
                        src={`/uploads/logos/${file}`}
                        alt={file}
                        style={{ maxWidth: '100px', maxHeight: '100px', border: '1px solid #ddd' }}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Aucun fichier trouvé</p>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5>Entreprises et leurs logos</h5>
            </Card.Header>
            <Card.Body>
              {entreprises.length > 0 ? (
                entreprises.map((entreprise, index) => (
                  <div key={index} className="mb-3 p-3 border rounded">
                    <h6>{entreprise.NomSociete}</h6>
                    <p><strong>LogoE:</strong> {entreprise.LogoE}</p>
                    {entreprise.LogoE && (
                      <img 
                        src={
                          entreprise.LogoE.startsWith('data:') ? entreprise.LogoE :
                          entreprise.LogoE.startsWith('/uploads/') ? entreprise.LogoE :
                          `/uploads/logos/${entreprise.LogoE}`
                        }
                        alt={`Logo de ${entreprise.NomSociete}`}
                        style={{ maxWidth: '100px', maxHeight: '100px', border: '1px solid #ddd' }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                ))
              ) : (
                <p>Aucune entreprise trouvée</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
