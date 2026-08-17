"use client";

import { Entreprise } from "@/types/entreprise";
import React, { useState } from "react";
import { Modal, Button, Form, Col, Row, Card } from "react-bootstrap";
import RTFEditor from "@/components/RTFEditor";
import { buildDbNameFromNomSociete } from "@/lib/slugify";

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
  const [dbName, setDbName] = useState("");
  const [dbNameEdited, setDbNameEdited] = useState(false);
  const [maintenancePrice, setMaintenancePrice] = useState<number | string>(0);
  const [licencePrice, setLicencePrice] = useState<number | string>(0);
  const [maintenanceAccepted, setMaintenanceAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleNomSocieteChange = (value: string) => {
    setNomSociete(value);
    if (!dbNameEdited) {
      setDbName(buildDbNameFromNomSociete(value));
    }
  };

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
      formData.append("dbName", dbName);
      formData.append("maintenancePrice", String(maintenancePrice ?? 0));
      formData.append("licencePrice", String(licencePrice ?? 0));
      formData.append("maintenanceAccepted", String(maintenanceAccepted));

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
        setDbName("");
        setDbNameEdited(false);
        setMaintenancePrice(0);
        setLicencePrice(0);
        setMaintenanceAccepted(false);
        onHide();
      }
    } catch (error) {
      console.error("Erreur ajout Entreprise", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      size="lg"
      backdrop="static"
      keyboard={false}
    >
      <Modal.Header closeButton className="bg-primary text-white border-0">
        <Modal.Title className="d-flex align-items-center">
          <i className="bi bi-building-add me-2"></i>
          Ajouter une Entreprise
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4 bg-light">
        <Form onSubmit={handleSubmit}>
          <Row className="g-3">
            <Col lg={8}>
              <Card className="border-0 shadow-sm mb-3">
                <Card.Header className="bg-white border-0 pt-3">
                  <h6 className="mb-0 text-primary">
                    <i className="bi bi-info-circle me-2"></i>
                    Informations générales
                  </h6>
                </Card.Header>
                <Card.Body className="p-3">
                  <Row className="g-3">
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold text-secondary">
                          Nom de l'entreprise{" "}
                          <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          value={NomSociete}
                          onChange={(e) => handleNomSocieteChange(e.target.value)}
                          placeholder="Entrez le nom de l'entreprise..."
                          required
                          className="shadow-sm"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold text-secondary">
                          NCC <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          value={NCC}
                          onChange={(e) => setNCC(e.target.value)}
                          placeholder="Entrez le NCC..."
                          required
                          className="shadow-sm"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold text-secondary">
                          Base de données dédiée
                        </Form.Label>
                        <Form.Control
                          value={dbName}
                          onChange={(e) => {
                            setDbName(e.target.value);
                            setDbNameEdited(true);
                          }}
                          placeholder="bd_nom_entreprise"
                          className="shadow-sm"
                        />
                        <Form.Text className="text-muted">
                          Générée automatiquement à partir du nom. Modifiable avant validation, mais non modifiable après création.
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold text-secondary">
                          Prix maintenance (XOF)
                        </Form.Label>
                        <Form.Control
                          type="number"
                          value={maintenancePrice as any}
                          onChange={(e) => setMaintenancePrice(e.target.value === '' ? '' : Number(e.target.value))}
                          min={0}
                          className="shadow-sm"
                        />
                        <Form.Text className="text-muted">Prix de la maintenance annuelle pour cette entreprise.</Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold text-secondary">
                          Prix licence (XOF)
                        </Form.Label>
                        <Form.Control
                          type="number"
                          value={licencePrice as any}
                          onChange={(e) => setLicencePrice(e.target.value === '' ? '' : Number(e.target.value))}
                          min={0}
                          className="shadow-sm"
                        />
                        <Form.Text className="text-muted">Prix annuel de la licence pour cette entreprise.</Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Check
                          type="switch"
                          id="maintenance-accepted-switch"
                          label="Maintenance annuelle acceptée par l'entreprise"
                          checked={maintenanceAccepted}
                          onChange={(e) => setMaintenanceAccepted(e.target.checked)}
                        />
                        <Form.Text className="text-muted">
                          Activé = l&apos;entreprise a accepté la maintenance : l&apos;accès sera bloqué si la maintenance expire sans être renouvelée.
                          Désactivé = aucun blocage lié à la maintenance (licence perpétuelle utilisable sans limite).
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-white border-0 pt-3">
                  <h6 className="mb-0 text-primary">
                    <i className="bi bi-image me-2"></i>
                    Logo de l'entreprise
                  </h6>
                </Card.Header>
                <Card.Body className="p-3 d-flex flex-column">
                  <Form.Group className="mb-3 flex-grow-1">
                    <div className="text-center">
                      {LogoEPreview ? (
                        <div className="mb-3">
                          <div className="position-relative d-inline-block">
                            <img
                              src={LogoEPreview}
                              alt="Logo preview"
                              className="img-fluid rounded-3 border shadow-sm"
                              style={{
                                maxWidth: "200px",
                                maxHeight: "200px",
                                objectFit: "cover",
                              }}
                            />
                            <Button
                              variant="danger"
                              size="sm"
                              className="position-absolute top-0 end-0 m-2"
                              onClick={() => {
                                setLogoEPreview("");
                                setLogoE("");
                                setLogoEFile(null);
                              }}
                              title="Supprimer le logo"
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="mb-3 d-flex align-items-center justify-content-center border-2 border-dashed rounded-3 p-4 bg-white"
                          style={{
                            height: "200px",
                            backgroundColor: "#f8f9fa",
                            border: "2px dashed #dee2e6",
                          }}
                        >
                          <div className="text-center">
                            <i className="bi bi-cloud-upload display-4 text-muted mb-2"></i>
                            <div className="text-muted">
                              <small>Aucun logo</small>
                            </div>
                          </div>
                        </div>
                      )}
                      <Form.Control
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        style={{ display: "none" }}
                        id="logo-upload"
                      />
                      <Button
                        as="label"
                        htmlFor="logo-upload"
                        variant="outline-primary"
                        className="w-100 shadow-sm"
                      >
                        <i className="bi bi-upload me-2"></i>
                        {LogoEPreview ? "Changer le logo" : "Ajouter une image"}
                      </Button>
                    </div>
                  </Form.Group>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          <Row>
            <Card className="border-0 shadow-sm mb-3">
              <Card.Header className="bg-white border-0 pt-3">
                <h6 className="mb-0 text-primary">
                  <i className="bi bi-file-text me-2"></i>
                  Contenu des documents
                </h6>
              </Card.Header>
              <Card.Body className="p-3">
                <Row className="g-3">
                  <Col md={12}>
                    <RTFEditor
                      value={EnteteSociete}
                      onChange={setEnteteSociete}
                      label="Entête des documents"
                      placeholder="Entrez le contenu de l'entête avec formatage riche..."
                      required
                    />
                  </Col>
                  <Col md={12}>
                    <RTFEditor
                      value={PiedPageSociete}
                      onChange={setPiedPageSociete}
                      label="Pied de page des documents"
                      placeholder="Entrez le contenu du pied de page avec formatage riche..."
                      required
                    />
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Row>

          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <Button
              variant="secondary"
              onClick={onHide}
              className="px-4"
              disabled={loading}
            >
              <i className="bi bi-x-circle me-2"></i>
              Annuler
            </Button>
            <Button
              variant="success"
              type="submit"
              disabled={loading}
              className="px-4 shadow-sm"
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Ajout en cours...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle me-2"></i>
                  Ajouter l'entreprise
                </>
              )}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}
