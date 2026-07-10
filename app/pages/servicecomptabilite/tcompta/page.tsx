'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Button, Spinner, Badge } from 'react-bootstrap';
import { useRouter } from 'next/navigation';

const fmt = (n: number) =>
  (n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const today = () => new Date().toISOString().split('T')[0];

export default function DashboardComptabilite() {
  const router = useRouter();
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [entrepriseId, setEntrepriseId] = useState('');

  useEffect(() => {
    setEntrepriseId(localStorage.getItem('IdEntreprise') || '');
  }, []);

  const chargerKpis = useCallback(async () => {
    setLoading(true);
    try {
      const dateAuj = today();
      // Bilan du jour
      const res = await fetch(`/api/comptabilite/bilan?dateDebut=${dateAuj}&dateFin=${dateAuj}&entrepriseId=${entrepriseId}`);
      if (res.ok) {
        const json = await res.json();
        setKpis({ ...json.totaux, parTypeActe: json.parTypeActe, count: json.count });
      }

      // Honoraires non soldés (sans filtre de date)
      const resH = await fetch(`/api/comptabilite/honoraires?dateDebut=2000-01-01&dateFin=${dateAuj}&entrepriseId=${entrepriseId}`);
      if (resH.ok) {
        const jsonH = await resH.json();
        setKpis((prev: any) => ({
          ...prev,
          honorairesReste: jsonH.totaux?.totalReste || 0,
          honorairesCount: jsonH.count || 0,
        }));
      }

      // Factures assurance non soldées
      const resA = await fetch(`/api/comptabilite/factureAssurance?etat=nonpayee&entrepriseId=${entrepriseId}`);
      if (resA.ok) {
        const jsonA = await resA.json();
        setKpis((prev: any) => ({
          ...prev,
          assuranceReste: jsonA.totaux?.totalReste || 0,
          assuranceCount: jsonA.count || 0,
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [entrepriseId]);

  useEffect(() => {
    if (entrepriseId !== undefined) chargerKpis();
  }, [chargerKpis, entrepriseId]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/connexion');
  };

  const cardStyles = `
    .kpi-card:hover { transform: translateY(-4px) !important; box-shadow: 0 10px 25px rgba(0,0,0,0.15) !important; }
  `;

  return (
    <>
      <style>{cardStyles}</style>
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-0 fw-bold" style={{ color: '#2d3748' }}>
              <i className="bi bi-calculator-fill me-2 text-warning"></i>
              Tableau de Bord Comptabilité
            </h2>
            <small className="text-muted">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </small>
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-secondary" size="sm" onClick={chargerKpis} disabled={loading}>
              {loading ? <Spinner size="sm" animation="border" /> : <><i className="bi bi-arrow-clockwise me-1"></i>Actualiser</>}
            </Button>
            <Button variant="outline-danger" size="sm" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right me-1"></i>Se déconnecter
            </Button>
          </div>
        </div>

        {/* KPI Cards - Recettes du jour */}
        <div className="mb-2">
          <h6 className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.75rem', letterSpacing: '0.08em' }}>
            <i className="bi bi-calendar-day me-1"></i>Recettes du jour
          </h6>
        </div>
        <Row className="g-3 mb-4">
          {[
            { label: "Total actes", value: kpis?.montantTotal, icon: 'bi-cash-coin', color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
            { label: "Part assurance", value: kpis?.partAssurance, icon: 'bi-shield-fill', color: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)' },
            { label: "Encaissé patients", value: kpis?.montantEncaisse, icon: 'bi-check-circle-fill', color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
            { label: "Reste à payer", value: kpis?.resteAPayer, icon: 'bi-exclamation-circle-fill', color: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)' },
            { label: "Remises accordées", value: kpis?.remise, icon: 'bi-percent', color: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', dark: false },
          ].map((c, i) => (
            <Col key={i} md={4} lg={2} style={{ flex: '1 1 0' }}>
              <Card
                className="kpi-card border-0 shadow text-white h-100"
                style={{ background: c.color, transition: 'transform 0.2s ease', cursor: 'default' }}
              >
                <Card.Body className="d-flex flex-column align-items-center justify-content-center py-4">
                  <i className={`bi ${c.icon} mb-2`} style={{ fontSize: '2rem' }}></i>
                  <div className="small fw-semibold text-center mb-1">{c.label}</div>
                  <div className="fw-bold" style={{ fontSize: '1.1rem' }}>
                    {loading ? <Spinner size="sm" animation="border" /> : fmt(c.value || 0)}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Honoraires & Assurances */}
        <div className="mb-2">
          <h6 className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.75rem', letterSpacing: '0.08em' }}>
            <i className="bi bi-clock-history me-1"></i>En attente de règlement
          </h6>
        </div>
        <Row className="g-3 mb-4">
          <Col md={6}>
            <Card className="border-0 shadow h-100" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white', transition: 'transform 0.2s ease' }}>
              <Card.Body className="d-flex align-items-center gap-3 py-4">
                <i className="bi bi-person-badge-fill" style={{ fontSize: '3rem' }}></i>
                <div>
                  <div className="small fw-semibold">Honoraires médecins à payer</div>
                  <div className="fw-bold" style={{ fontSize: '1.4rem' }}>
                    {loading ? <Spinner size="sm" animation="border" /> : fmt(kpis?.honorairesReste || 0)}
                  </div>
                  {kpis?.honorairesCount > 0 && (
                    <Badge bg="light" text="dark" className="mt-1" style={{ fontSize: '0.7rem' }}>
                      {kpis.honorairesCount} fiche(s) non soldée(s)
                    </Badge>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="border-0 shadow h-100" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white', transition: 'transform 0.2s ease' }}>
              <Card.Body className="d-flex align-items-center gap-3 py-4">
                <i className="bi bi-shield-fill-check" style={{ fontSize: '3rem' }}></i>
                <div>
                  <div className="small fw-semibold">Factures assurances à recouvrer</div>
                  <div className="fw-bold" style={{ fontSize: '1.4rem' }}>
                    {loading ? <Spinner size="sm" animation="border" /> : fmt(kpis?.assuranceReste || 0)}
                  </div>
                  {kpis?.assuranceCount > 0 && (
                    <Badge bg="light" text="dark" className="mt-1" style={{ fontSize: '0.7rem' }}>
                      {kpis.assuranceCount} facture(s) non soldée(s)
                    </Badge>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Récap par type d'acte du jour */}
        {kpis?.parTypeActe && Object.keys(kpis.parTypeActe).length > 0 && (
          <>
            <div className="mb-2">
              <h6 className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.75rem', letterSpacing: '0.08em' }}>
                <i className="bi bi-bar-chart-fill me-1"></i>Répartition par type d'acte (aujourd'hui)
              </h6>
            </div>
            <Row className="g-3">
              {Object.entries(kpis.parTypeActe).map(([type, val]: [string, any], i) => (
                <Col key={i} md={3}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="small fw-semibold text-muted text-uppercase">{type}</span>
                        <Badge bg="secondary" style={{ fontSize: '0.65rem' }}>{val.count} acte(s)</Badge>
                      </div>
                      <div className="fw-bold text-dark" style={{ fontSize: '1.1rem' }}>{fmt(val.montant)}</div>
                      <div className="small text-success">Encaissé : {fmt(val.encaisse)}</div>
                      <div className="progress mt-2" style={{ height: '4px' }}>
                        <div
                          className="progress-bar bg-success"
                          style={{ width: `${val.montant > 0 ? Math.min(100, Math.round((val.encaisse / val.montant) * 100)) : 0}%` }}
                        />
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </>
        )}

        {!loading && kpis?.count === 0 && (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-inbox" style={{ fontSize: '3rem' }}></i>
            <p className="mt-2">Aucune opération enregistrée aujourd'hui.</p>
          </div>
        )}
      </div>
    </>
  );
}
