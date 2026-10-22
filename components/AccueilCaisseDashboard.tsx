"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Row, Col, Button, Badge, Spinner } from "react-bootstrap";
import {
  FaUserCheck,
  FaClock,
  FaCalendarCheck,
  FaCashRegister,
  FaFileInvoice,
  FaFlask,
  FaSignOutAlt,
  FaArrowRight,
} from "react-icons/fa";
import { useAuthUser } from "@/hooks/useAuthUser";

interface AccueilStats {
  totalConsultations: number;
  waitingRoomCount: number;
}

interface CaisseStats {
  consultationsEnAttente: number;
  prestationsEnAttente: number;
  facturesASolder: number;
}

export default function AccueilCaisseDashboard() {
  const router = useRouter();
  const { user, loading: userLoading } = useAuthUser();
  const [accueilStats, setAccueilStats] = useState<AccueilStats>({
    totalConsultations: 0,
    waitingRoomCount: 0,
  });
  const [rdvCount, setRdvCount] = useState(0);
  const [caisseStats, setCaisseStats] = useState<CaisseStats>({
    consultationsEnAttente: 0,
    prestationsEnAttente: 0,
    facturesASolder: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchAllStats = async () => {
    setLoading(true);
    try {
      const [
        accueilRes,
        rdvRes,
        consultAttenteRes,
        prestationAttenteRes,
        prescriptionAttenteRes,
        facturesRes,
      ] = await Promise.all([
        fetch("/api/consultation/date"),
        fetch("/api/rendez-vous/statistiques?all=true"),
        fetch("/api/consultationFacture/consultAttentePaiement"),
        fetch("/api/consultationFacture/prestationAttentePaiement"),
        fetch("/api/consultationFacture/prescriptionAttentePaiement"),
        fetch("/api/facturesnonsoldees"),
      ]);

      if (accueilRes.ok) {
        const data = await accueilRes.json();
        setAccueilStats({
          totalConsultations: data.totalConsultations || 0,
          waitingRoomCount: data.waitingRoomCount || 0,
        });
      }

      if (rdvRes.ok) {
        const rdvData = await rdvRes.json();
        setRdvCount(rdvData.rendezVousDuJour || 0);
      }

      const consultations = consultAttenteRes.ok ? await consultAttenteRes.json() : [];
      const prestations = prestationAttenteRes.ok ? await prestationAttenteRes.json() : [];
      const prescriptions = prescriptionAttenteRes.ok ? await prescriptionAttenteRes.json() : [];

      let facturesASolder = 0;
      if (facturesRes.ok) {
        const facturesData = await facturesRes.json();
        const facturesBrutes = Array.isArray(facturesData)
          ? facturesData
          : facturesData.data || [];
        const facturesUtiles = (facturesBrutes || []).filter(
          (facture: any) => Number(facture.montantRestant) > 0 && facture.id
        );

        const factureIds: string[] = [];
        const consultationIds: string[] = [];
        for (const f of facturesUtiles) {
          if (f.type === "consultation") consultationIds.push(String(f.id));
          else factureIds.push(String(f.id));
        }

        const queryParts: string[] = [];
        if (factureIds.length)
          queryParts.push(`idFacturations=${encodeURIComponent(factureIds.join(","))}`);
        if (consultationIds.length)
          queryParts.push(`idConsultations=${encodeURIComponent(consultationIds.join(","))}`);
        const encaissementsQuery = queryParts.length
          ? `/api/encaissementcaisse?${queryParts.join("&")}`
          : null;

        const encaissementsByKey: Record<string, number> = {};
        if (encaissementsQuery) {
          const encaissementsResponse = await fetch(encaissementsQuery);
          if (encaissementsResponse.ok) {
            const encaissementsData = await encaissementsResponse.json();
            for (const enc of encaissementsData.data || []) {
              const key = enc.IDFACTURATION || enc.IDCONSULTATION;
              if (key) {
                encaissementsByKey[key] =
                  (encaissementsByKey[key] || 0) + (Number(enc.Montantencaisse) || 0);
              }
            }
          }
        }

        facturesASolder = facturesUtiles.reduce((count: number, facture: any) => {
          const sommeEncaissements = encaissementsByKey[String(facture.id)] || 0;
          const resteReel = Number(facture.montantRestant) - sommeEncaissements;
          return resteReel > 0 ? count + 1 : count;
        }, 0);
      }

      setCaisseStats({
        consultationsEnAttente: Array.isArray(consultations) ? consultations.length : 0,
        prestationsEnAttente:
          (Array.isArray(prestations) ? prestations.length : 0) +
          (Array.isArray(prescriptions) ? prescriptions.length : 0),
        facturesASolder,
      });
    } catch (error) {
      console.error("Erreur de chargement des statistiques:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllStats();
    const interval = setInterval(fetchAllStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/connexion");
  };

  const cardStyles = `
    .card:hover {
      transform: translateY(-5px) !important;
      box-shadow: 0 10px 25px rgba(0,0,0,0.15) !important;
    }
    .badge {
      font-size: 1.5rem !important;
      padding: 0.75rem 1.5rem !important;
      border-radius: 2rem !important;
      margin: 0 1rem !important;
      min-width: 80px !important;
      text-align: center !important;
    }
  `;

  const nomUtilisateur =
    `${user?.nom || ''} ${user?.prenom || ''}`.trim() ||
    (typeof window !== 'undefined' ? localStorage.getItem('nom_utilisateur') || '' : '');

  const renderBadge = (value: number) =>
    loading ? (
      <Spinner animation="border" variant="light" />
    ) : (
      <Badge bg="light" text="dark" className="fs-6">
        {value}
      </Badge>
    );

  return (
    <>
      <style>{cardStyles}</style>
      <div className="container-fluid py-2">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0 text-primary fw-bold">
            <FaCashRegister className="me-2" />
            Tableau de bord - Accueil & Caisse
          </h2>
          {nomUtilisateur && (
            <span className="text-muted fw-semibold ms-auto me-3">
              <FaUserCheck className="me-1" />
              {nomUtilisateur}
            </span>
          )}
          <Button variant="outline-danger" onClick={handleLogout}>
            <FaSignOutAlt className="me-1" />
            Se déconnecter
          </Button>
        </div>

        {/* Section Accueil */}
        <h4 className="text-info fw-bold mb-3">
          <FaUserCheck className="me-2" />
          Service Accueil
        </h4>
        <Row className="g-4 mb-4">
          <Col md={4}>
            <Card
              className="shadow h-75 border-0"
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                transition: "transform 0.3s ease",
              }}
            >
              <Card.Body className="text-center d-flex justify-content-center align-items-center mx-3 py-4">
                <div className="mb-3">
                  <FaUserCheck size={48} className="mb-3" />
                </div>
                <Card.Title className="text-white mb-2">Patients reçus du jour</Card.Title>
                <div>{renderBadge(accueilStats.totalConsultations)}</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card
              className="shadow h-75 border-0"
              style={{
                background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                color: "white",
                transition: "transform 0.3s ease",
              }}
            >
              <Card.Body className="text-center d-flex justify-content-center align-items-center mx-3 py-4">
                <div className="mb-3">
                  <FaClock size={48} className="mb-3" />
                </div>
                <Card.Title className="text-white mb-2">Patients en attente</Card.Title>
                <div>{renderBadge(accueilStats.waitingRoomCount)}</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card
              className="shadow h-75 border-0"
              style={{
                background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                color: "white",
                transition: "transform 0.3s ease",
              }}
            >
              <Card.Body className="text-center d-flex justify-content-center align-items-center mx-3 py-4">
                <div className="mb-3">
                  <FaCalendarCheck size={48} className="mb-3" />
                </div>
                <Card.Title className="text-white mb-2">Rendez-vous du jour</Card.Title>
                <div>{renderBadge(rdvCount)}</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Section Caisse */}
        <h4 className="text-warning fw-bold mb-3">
          <FaCashRegister className="me-2" />
          Service Caisse
        </h4>
        <Row className="g-4 mb-4">
          <Col md={4}>
            <Card
              className="shadow h-75 border-0"
              style={{
                background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
                color: "white",
                transition: "transform 0.3s ease",
              }}
            >
              <Card.Body className="text-center d-flex justify-content-center align-items-center mx-3 py-4">
                <div className="mb-3">
                  <FaUserCheck size={48} className="mb-3" />
                </div>
                <Card.Title className="text-white mb-2">Consultations à facturer</Card.Title>
                <div>{renderBadge(caisseStats.consultationsEnAttente)}</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card
              className="shadow h-75 border-0"
              style={{
                background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                color: "white",
                transition: "transform 0.3s ease",
              }}
            >
              <Card.Body className="text-center d-flex justify-content-center align-items-center mx-3 py-4">
                <div className="mb-3">
                  <FaFlask size={48} className="mb-3" />
                </div>
                <Card.Title className="text-white mb-2">Examens / Pharmacies à facturer</Card.Title>
                <div>{renderBadge(caisseStats.prestationsEnAttente)}</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card
              className="shadow h-75 border-0"
              style={{
                background: "linear-gradient(135deg, #ff9966 0%, #ff5e62 100%)",
                color: "white",
                transition: "transform 0.3s ease",
              }}
            >
              <Card.Body className="text-center d-flex justify-content-center align-items-center mx-3 py-4">
                <div className="mb-3">
                  <FaFileInvoice size={48} className="mb-3" />
                </div>
                <Card.Title className="text-white mb-2">Factures à solder</Card.Title>
                <div>{renderBadge(caisseStats.facturesASolder)}</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Accès rapides */}
        <h4 className="text-secondary fw-bold mb-3">Accès rapides</h4>
        <Row className="g-3">
          <Col md={6}>
            <Card
              className="shadow border-0 h-100"
              style={{ cursor: "pointer", transition: "transform 0.3s ease" }}
              onClick={() => router.push("/pages/serviceaccueil/tpatient")}
            >
              <Card.Body className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center me-3"
                    style={{
                      width: 56,
                      height: 56,
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    }}
                  >
                    <FaUserCheck size={24} color="white" />
                  </div>
                  <div>
                    <Card.Title className="mb-0">Service Accueil</Card.Title>
                    <Card.Text className="text-muted small mb-0">
                      Gestion des patients, consultations et rendez-vous
                    </Card.Text>
                  </div>
                </div>
                <FaArrowRight className="text-primary" />
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card
              className="shadow border-0 h-100"
              style={{ cursor: "pointer", transition: "transform 0.3s ease" }}
              onClick={() => router.push("/pages/servicecaisse/tcaisse")}
            >
              <Card.Body className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center me-3"
                    style={{
                      width: 56,
                      height: 56,
                      background: "linear-gradient(135deg, #ff9966 0%, #ff5e62 100%)",
                    }}
                  >
                    <FaCashRegister size={24} color="white" />
                  </div>
                  <div>
                    <Card.Title className="mb-0">Service Caisse</Card.Title>
                    <Card.Text className="text-muted small mb-0">
                      Facturation, encaissements et point de caisse
                    </Card.Text>
                  </div>
                </div>
                <FaArrowRight className="text-warning" />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
}
