"use client";

import { useState, useEffect } from "react";
import { Card, Spinner, Form } from "react-bootstrap";
import { FaCalendarAlt } from "react-icons/fa";

// Interface pour les rendez-vous
interface RendezVous {
  id?: string;
  date: string;
  heure?: string;
  patientNom?: string;
  medecinNom?: string;
  description?: string;
  statut?: "en cours" | "validé" | "annulé" | string;
  DateDisponinibilite?: string;
}

export default function PlanningRdvMed() {
  const [planningMode, setPlanningMode] = useState("jour"); // 'jour', 'semaine', 'mois'
  const [rendezVous, setRendezVous] = useState<RendezVous[]>([]);
  const [planningLoading, setPlanningLoading] = useState(false);
  const [planningError, setPlanningError] = useState("");
  const [searchTerm, setSearchTerm] = useState(""); // État pour la recherche

  // Effet pour charger les rendez-vous selon le mode sélectionné
  useEffect(() => {
    fetchRendezVous();
  }, [planningMode]);

  const fetchRendezVous = async () => {
    setPlanningLoading(true);
    setPlanningError("");

    try {
      // Calculer les dates selon le mode
      const today = new Date();
      let startDate, endDate;

      if (planningMode === "jour") {
        startDate = today.toISOString().split("T")[0];
        endDate = startDate;
      } else if (planningMode === "semaine") {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        startDate = startOfWeek.toISOString().split("T")[0];
        endDate = endOfWeek.toISOString().split("T")[0];
      } else if (planningMode === "mois") {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          0,
        );

        startDate = startOfMonth.toISOString().split("T")[0];
        endDate = endOfMonth.toISOString().split("T")[0];
      }

      // Appel API pour récupérer les rendez-vous
      const response = await fetch(
        `/api/rendezvous?startDate=${startDate}&endDate=${endDate}`,
      );
      if (!response.ok)
        throw new Error("Erreur lors du chargement des rendez-vous");

      const data = await response.json();
      setRendezVous(data);
    } catch (err) {
      console.error("Erreur planning:", err);
      setPlanningError("Impossible de charger les rendez-vous");
    } finally {
      setPlanningLoading(false);
    }
  };

  // Styles CSS pour les cartes
  const cardStyles = `
    /* Planning card styles */
    .planning-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 16px;
      border: none;
    }
    
    /* Radio button group styling */
    .radio-button-group .form-check {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 4px 12px;
      margin: 0;
      transition: all 0.3s ease;
      border: 2px solid transparent;
    }
    .radio-button-group .form-check:hover {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.3);
    }
    .radio-button-group .form-check.checked {
      background: rgba(255, 255, 255, 0.3);
      border-color: #fff;
      box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
    }
    .radio-button-group .form-check-input:checked + .form-check-label {
      color: #fff;
      font-weight: 600;
    }
    .radio-button-group .form-check-input {
      filter: brightness(0) invert(1);
    }
    .radio-button-group .form-check-label {
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.9rem;
      cursor: pointer;
    }
    
    /* Rendezvous card styles */
    .rendezvous-card {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: none;
      border-radius: 16px;
      background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
      position: relative;
      overflow: hidden;
    }
    .rendezvous-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 4px;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .rendezvous-card:hover {
      transform: translateY(-8px) scale(1.02);
      box-shadow: 0 20px 40px rgba(102, 126, 234, 0.15);
    }
    .rendezvous-time {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 12px;
      padding: 6px 12px;
      font-weight: 600;
      font-size: 0.85rem;
      min-width: 80px;
      text-align: center;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }
    .rendezvous-header {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
      border-radius: 12px;
      padding: 8px;
      margin-bottom: 10px;
    }
    .info-item {
      display: flex;
      align-items: center;
      padding: 4px 0;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    }
    .info-item:last-child {
      border-bottom: none;
    }
    .info-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 10px;
      font-size: 1rem;
    }
    .patient-icon {
      background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
      color: #1976d2;
    }
    .medecin-icon {
      background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%);
      color: #388e3c;
    }
    .description-box {
      background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
      border-radius: 8px;
      padding: 8px;
      border-left: 3px solid #667eea;
      margin-top: 8px;
    }
    .status-badge {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: inline-block;
    }
    .status-en-cours {
      background-color: #fd7e14;
      color: white;
    }
    .status-validé {
      background-color: #198754;
      color: white;
    }
    .status-annulé {
      background-color: #dc3545;
      color: white;
    }
    .status-non-défini {
      background-color: #6c757d;
      color: white;
    }
    /* Scroll zone for rendezvous */
    .rendezvous-scroll-container {
      max-height: 300px;
      overflow-y: auto;
      overflow-x: hidden;
      border-radius: 12px;
      background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
      padding: 8px;
    }
    .rendezvous-scroll-container::-webkit-scrollbar {
      width: 8px;
    }
    .rendezvous-scroll-container::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 10px;
    }
    .rendezvous-scroll-container::-webkit-scrollbar-thumb {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 10px;
    }
    .rendezvous-scroll-container::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
    }
  `;

  return (
    <>
      <style>{cardStyles}</style>
      <Card className="shadow border-0 planning-card">
        <Card.Header className="bg-transparent border-0 py-3">
          <div className="d-flex flex-column gap-3">
            {/* Ligne 1: Titre, recherche et boutons radio */}
            <div className="d-flex justify-content-between align-items-center flex-wrap">
              <h4 className="mb-0 text-white">
                <FaCalendarAlt className="me-2" />
                Planning des Rendez-vous
              </h4>
              
              {/* Champ de recherche au milieu */}
              <Form.Control
                type="text"
                placeholder="🔍 Rechercher par médecin ou patient..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white text-dark"
                style={{ maxWidth: "300px" }}
              />
              
              <div className="radio-button-group d-flex gap-3">
                <div className={`form-check ${planningMode === "jour" ? "checked" : ""}`}>
                  <Form.Check
                    type="radio"
                    label="Du Jour"
                    name="planningMode"
                    id="mode-jour"
                    value="jour"
                    checked={planningMode === "jour"}
                    onChange={(e) => setPlanningMode(e.target.value)}
                    className="text-white"
                  />
                </div>
                <div className={`form-check ${planningMode === "semaine" ? "checked" : ""}`}>
                  <Form.Check
                    type="radio"
                    label="De la Semaine"
                    name="planningMode"
                    id="mode-semaine"
                    value="semaine"
                    checked={planningMode === "semaine"}
                    onChange={(e) => setPlanningMode(e.target.value)}
                    className="text-white"
                  />
                </div>
                <div className={`form-check ${planningMode === "mois" ? "checked" : ""}`}>
                  <Form.Check
                    type="radio"
                    label="Du Mois"
                    name="planningMode"
                    id="mode-mois"
                    value="mois"
                    checked={planningMode === "mois"}
                    onChange={(e) => setPlanningMode(e.target.value)}
                    className="text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </Card.Header>
        <Card.Body className="bg-white">
          {planningLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Chargement des rendez-vous...</p>
            </div>
          ) : planningError ? (
            <div className="alert alert-danger" role="alert">
              {planningError}
            </div>
          ) : (
            <div className="rendezvous-scroll-container">
              <div className="row g-2">
                {rendezVous.length === 0 ? (
                  <div className="col-12">
                    <div className="text-center py-3 text-muted">
                      <FaCalendarAlt size={32} className="mb-2 opacity-50" />
                      <h6>Aucun rendez-vous trouvé</h6>
                      <small>Essayez de modifier les filtres</small>
                    </div>
                  </div>
                ) : (
                  rendezVous
                    .filter(
                      (rdv) =>
                        searchTerm === "" ||
                        rdv.patientNom
                          ?.toLowerCase()
                          .includes(searchTerm.toLowerCase()) ||
                        rdv.medecinNom
                          ?.toLowerCase()
                          .includes(searchTerm.toLowerCase()),
                    )
                    .map((rdv, index) => (
                      <div
                        key={index}
                        className="col-xl-3 col-lg-4 col-md-6 col-sm-6"
                      >
                        <Card className="rendezvous-card h-100">
                          <Card.Body className="p-2">
                            <div className="rendezvous-header">
                              <div className="d-flex justify-content-between align-items-center">
                                <div className="rendezvous-time">
                                  {rdv.heure || "N/A"}
                                </div>
                                <span
                                  className={`status-badge status-${rdv.statut === "en cours" ? "en-cours" : rdv.statut === "validé" ? "validé" : rdv.statut === "annulé" ? "annulé" : "non-défini"}`}
                                >
                                  {rdv.statut || "Non défini"}
                                </span>
                              </div>
                            </div>

                            <div className="mb-2">
                              <div className="d-flex align-items-center">
                                Date :
                                <i className="bi bi-calendar-event me-2 text-primary"></i>
                                <strong className="small">
                                  {rdv.DateDisponinibilite
                                    ? new Date(
                                        rdv.DateDisponinibilite,
                                      ).toLocaleDateString("fr-FR", {
                                        weekday: "short",
                                        day: "numeric",
                                        month: "short",
                                      })
                                    : new Date(rdv.date).toLocaleDateString(
                                        "fr-FR",
                                        {
                                          weekday: "short",
                                          day: "numeric",
                                          month: "short",
                                        },
                                      )}
                                </strong>
                              </div>
                            </div>

                            <div className="info-item">
                              <div className="info-icon patient-icon">
                                <i className="bi bi-person-fill"></i>
                              </div>
                              <div>
                                <small className="text-muted d-block">
                                  Patient
                                </small>
                                <strong className="small d-block">
                                  {rdv.patientNom || "Non spécifié"}
                                </strong>
                              </div>
                            </div>

                            <div className="info-item">
                              <div className="info-icon medecin-icon">
                                <i className="bi bi-hospital-fill"></i>
                              </div>
                              <div>
                                <small className="text-muted d-block">
                                  Médecin
                                </small>
                                <strong className="small d-block">
                                  {rdv.medecinNom || "Non spécifié"}
                                </strong>
                              </div>
                            </div>

                            {rdv.description && (
                              <div className="description-box">
                                <small className="text-muted d-block mb-1">
                                  Description
                                </small>
                                <p className="mb-0 small text-secondary">
                                  {rdv.description.length > 60
                                    ? rdv.description.substring(0, 60) + "..."
                                    : rdv.description}
                                </p>
                              </div>
                            )}
                          </Card.Body>
                        </Card>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}
        </Card.Body>
      </Card>
    </>
  );
}
