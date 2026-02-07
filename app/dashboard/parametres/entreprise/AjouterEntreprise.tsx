"use client";

import { Entreprise } from "@/types/entreprise";
import React, { useState } from "react";
import { Modal, Button, Form, Col, Row } from "react-bootstrap";

interface AjouterEntrepriseProps {
  show: boolean;
  onHide: () => void;
  onAdd: (entreprise: Entreprise) => void;
}

export default function AjouterEntreprise({
  show,
  onHide,
  onAdd,
}: AjouterEntrepriseProps) {
  const [NomSociete, setNomSociete] = useState("");
  const [EnteteSociete, setEnteteSociete] = useState("");
  const [LogoE, setLogoE] = useState("");
  const [LogoEFile, setLogoEFile] = useState<File | null>(null);
  const [LogoEPreview, setLogoEPreview] = useState<string>("");
  const [PiedPageSociete, setPiedPageSociete] = useState("");
  const [NCC, setNCC] = useState("");
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoEFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoEPreview(reader.result as string);
        setLogoE(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("NomSociete", NomSociete);
      formData.append("EnteteSociete", EnteteSociete);
      formData.append("PiedPageSociete", PiedPageSociete);
      formData.append("LogoE", LogoE);
      formData.append("NCC", NCC);
      
      if (LogoEFile) {
        formData.append("logoFile", LogoEFile);
      }

      const response = await fetch("/api/entreprise", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const newEntreprise = await response.json();
        onAdd(newEntreprise);
        setNomSociete("");
        setEnteteSociete("");
        setLogoE("");
        setLogoEFile(null);
        setLogoEPreview("");
        setPiedPageSociete("");
        setNCC("");
      }
    } catch (error) {
      console.error("Erreur ajout Entreprise", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Ajouter une Entreprise</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        
        <Form onSubmit={handleSubmit}>
           <Row>
            <Col className="9">
             <Row>

              <Form.Group className="mb-3">
            <Form.Label> Entreprise</Form.Label>
            <Form.Control
              value={NomSociete}
              onChange={(e) => setNomSociete(e.target.value)}
              required
            />
          </Form.Group>
            </Row>

             <Row>
              <Form.Group className="mb-3">
                <Form.Label>Entete</Form.Label>
                <Form.Control
                  value={EnteteSociete}
                  onChange={(e) => setEnteteSociete(e.target.value)}
                  required
                />
              </Form.Group>
             </Row>
            <Row>
              <Form.Group className="mb-3">
                <Form.Label>Pied de paginated</Form.Label>
                <Form.Control
                  value={PiedPageSociete}
                  onChange={(e) => setPiedPageSociete(e.target.value)}
                  required
                />
              </Form.Group>

            </Row>            
            <Row>
              <Form.Group className="mb-3">
                <Form.Label>NCC</Form.Label>
                <Form.Control
                  value={NCC}
                  onChange={(e) => setNCC(e.target.value)}
                  required
                />
              </Form.Group>
            </Row>
            
            </Col>
            <Col className="3">
             <Form.Group className="mb-3">
                <Form.Label>LOGO</Form.Label>
                <div className="text-center">
                  {LogoEPreview ? (
                    <div className="mb-3">
                      <img 
                        src={LogoEPreview} 
                        alt="Logo preview" 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '100px',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }} 
                      />
                      <div className="mt-2">
                        <small className="text-muted">{LogoE}</small>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="mb-3 d-flex align-items-center justify-content-center border rounded"
                      style={{ 
                        height: '100px',
                        backgroundColor: '#f8f9fa',
                        border: '2px dashed #dee2e6'
                      }}
                    >
                      <span className="text-muted">Aucun logo</span>
                    </div>
                  )}
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                    id="logo-upload"
                  />
                  <Button 
                    as="label" 
                    htmlFor="logo-upload"
                    variant="outline-primary"
                    className="w-100"
                  >
                    {LogoEPreview ? "Changer le logo" : "Ajouter une image"}
                  </Button>
                </div>
              </Form.Group>
            
            </Col>
           

          
          





          </Row>
         
            
         
          <div className="text-end">
            <Button variant="secondary" onClick={onHide} className="me-2">
              Annuler
            </Button>
            <Button variant="success" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Ajout...
                </>
              ) : (
                "Ajouter"
              )}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}
