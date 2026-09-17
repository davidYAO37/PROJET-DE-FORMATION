"use client";

import { useEffect, useState } from 'react';
import { Card, Col, Container, Form, Row, Spinner, Button, Modal, Table, Badge } from 'react-bootstrap';
import { generatePrintHeader, generatePrintFooter, createPrintWindow } from '@/utils/printRecu';
import { useEntreprise } from '@/hooks/useEntreprise';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';

interface StatusItem {
  label: string;
  value: number;
  color: string;
}

interface MoisItem {
  mois: string;
  approvisionnements: number;
  commandes: number;
  entrees: number;
  sorties: number;
  total: number;
}

interface JourItem {
  jour: string;
  approvisionnements: number;
  commandes: number;
  entrees: number;
  sorties: number;
  total: number;
}

interface FournisseurItem {
  nom: string;
  approvisionnements: number;
  commandes: number;
  montantAppro: number;
  montantCommande: number;
  total: number;
}

interface CategorieItem {
  categorie: string;
  count: number;
  valeur: number;
}

interface Totals {
  totalProduits: number;
  valeurStock: number;
  ruptures: number;
  sousSeuil: number;
  prochesPeremption: number;
  lotsPerimes: number;
  approvisionnements: number;
  approvisionnementsJour: number;
  approvisionnementsMois: number;
  commandesFournisseur: number;
  commandesEnCours: number;
  entreesStock: number;
  sortiesStock: number;
  inventaires: number;
  ecartInventaire: number;
}

interface DetailLists {
  ruptures: any[];
  sousSeuil: any[];
  prochesPeremption: any[];
  perimes: any[];
  approvisionnements: any[];
  commandes: any[];
  entrees: any[];
  sorties: any[];
  inventaires: any[];
}

interface StatsData {
  totals: Totals;
  parStatus: StatusItem[];
  parMois: MoisItem[];
  parJour: JourItem[];
  parFournisseur: FournisseurItem[];
  parCategorie: CategorieItem[];
  details: DetailLists;
}

interface ColumnDef {
  key: string;
  label: string;
}

const initialStats: StatsData = {
  totals: {
    totalProduits: 0,
    valeurStock: 0,
    ruptures: 0,
    sousSeuil: 0,
    prochesPeremption: 0,
    lotsPerimes: 0,
    approvisionnements: 0,
    approvisionnementsJour: 0,
    approvisionnementsMois: 0,
    commandesFournisseur: 0,
    commandesEnCours: 0,
    entreesStock: 0,
    sortiesStock: 0,
    inventaires: 0,
    ecartInventaire: 0,
  },
  parStatus: [],
  parMois: [],
  parJour: [],
  parFournisseur: [],
  parCategorie: [],
  details: {
    ruptures: [],
    sousSeuil: [],
    prochesPeremption: [],
    perimes: [],
    approvisionnements: [],
    commandes: [],
    entrees: [],
    sorties: [],
    inventaires: [],
  },
};

const ruptureColumns: ColumnDef[] = [
  { key: 'reference', label: 'Référence' },
  { key: 'medicament', label: 'Médicament' },
  { key: 'qte', label: 'Qté' },
  { key: 'seuil', label: 'Seuil min' },
  { key: 'categorie', label: 'Catégorie' },
];

const peremptionColumns: ColumnDef[] = [
  { key: 'reference', label: 'Référence' },
  { key: 'medicament', label: 'Médicament' },
  { key: 'lot', label: 'Lot' },
  { key: 'quantite', label: 'Qté' },
  { key: 'peremption', label: 'Péremption' },
];

const approColumns: ColumnDef[] = [
  { key: 'numero', label: 'N° facture' },
  { key: 'fournisseur', label: 'Fournisseur' },
  { key: 'date', label: 'Date' },
  { key: 'montant', label: 'Montant TTC' },
];

const commandeColumns: ColumnDef[] = [
  { key: 'numero', label: 'N° commande' },
  { key: 'fournisseur', label: 'Fournisseur' },
  { key: 'date', label: 'Date' },
  { key: 'statut', label: 'Statut' },
  { key: 'montant', label: 'Montant TTC' },
];

const entreeColumns: ColumnDef[] = [
  { key: 'reference', label: 'Référence' },
  { key: 'medicament', label: 'Médicament' },
  { key: 'date', label: 'Date' },
  { key: 'quantite', label: 'Qté' },
  { key: 'montant', label: 'Montant TTC' },
];

const sortieColumns: ColumnDef[] = [
  { key: 'reference', label: 'Référence' },
  { key: 'medicament', label: 'Médicament' },
  { key: 'date', label: 'Date' },
  { key: 'quantite', label: 'Qté' },
  { key: 'montant', label: 'Montant' },
  { key: 'motif', label: 'Motif' },
];

const invColumns: ColumnDef[] = [
  { key: 'date', label: 'Date' },
  { key: 'saisiPar', label: 'Saisi par' },
  { key: 'nbLignes', label: 'Nb lignes' },
  { key: 'ecart', label: 'Écart' },
];

const categorieColumns: ColumnDef[] = [
  { key: 'categorie', label: 'Catégorie' },
  { key: 'count', label: 'Nb produits' },
  { key: 'valeur', label: 'Valeur stock' },
];

const fournisseurColumns: ColumnDef[] = [
  { key: 'nom', label: 'Fournisseur' },
  { key: 'approvisionnements', label: 'Appro.' },
  { key: 'commandes', label: 'Cmdes' },
  { key: 'montantAppro', label: 'Montant appro.' },
  { key: 'montantCommande', label: 'Montant cmde' },
];

function statusLabelToKey(label: string): keyof DetailLists | null {
  switch (label) {
    case 'Ruptures': return 'ruptures';
    case 'Sous seuil min': return 'sousSeuil';
    case 'Proches péremption': return 'prochesPeremption';
    case 'Périmés': return 'perimes';
    default: return null;
  }
}

export default function StatistiquesPharmaciePage() {
  const [data, setData] = useState<StatsData>(initialStats);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [showDetail, setShowDetail] = useState(false);
  const [detailTitle, setDetailTitle] = useState('');
  const [detailItems, setDetailItems] = useState<any[]>([]);
  const [detailColumns, setDetailColumns] = useState<ColumnDef[]>([]);
  const { entreprise } = useEntreprise();

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (dateDebut) params.append('dateDebut', dateDebut);
      if (dateFin) params.append('dateFin', dateFin);

      const res = await fetch(`/api/pharmacie/statistiques?${params.toString()}`);
      if (!res.ok) throw new Error('Erreur lors du chargement des statistiques');
      const json = await res.json();
      setData(json as StatsData);
    } catch (err: any) {
      setError(err.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [dateDebut, dateFin]);

  const openDetail = (title: string, items: any[], columns: ColumnDef[]) => {
    setDetailTitle(title);
    setDetailItems(items || []);
    setDetailColumns(columns);
    setShowDetail(true);
  };

  const handleKpiDetail = (label: string) => {
    switch (label) {
      case 'Ruptures':
        openDetail('Produits en rupture', data.details.ruptures, ruptureColumns);
        break;
      case 'Sous seuil min':
        openDetail('Produits sous le seuil minimum', data.details.sousSeuil, ruptureColumns);
        break;
      case 'Proches péremption':
        openDetail('Lots proches de la péremption', data.details.prochesPeremption, peremptionColumns);
        break;
      case 'Périmés':
        openDetail('Lots périmés', data.details.perimes, peremptionColumns);
        break;
      case 'Approvisionnements':
      case 'Approvisionnements du jour':
      case 'Approvisionnements du mois':
        openDetail('Détails approvisionnements', data.details.approvisionnements, approColumns);
        break;
      case 'Commandes fourn.':
        openDetail('Commandes fournisseurs', data.details.commandes, commandeColumns);
        break;
      case 'Commandes en cours':
        openDetail(
          'Commandes en cours',
          data.details.commandes.filter((c) => c.statut && c.statut !== 'SOLDEE' && c.statut !== 'ANNULEE'),
          commandeColumns
        );
        break;
      case 'Entrées stock':
        openDetail('Entrées de stock', data.details.entrees, entreeColumns);
        break;
      case 'Sorties stock':
        openDetail('Sorties de stock', data.details.sorties, sortieColumns);
        break;
      case 'Inventaires':
        openDetail('Historique des inventaires', data.details.inventaires, invColumns);
        break;
      case 'Produits en stock':
        openDetail('Répartition par catégorie', data.parCategorie, categorieColumns);
        break;
      case 'Valeur stock':
        openDetail('Répartition par catégorie', data.parCategorie, categorieColumns);
        break;
      default:
        break;
    }
  };

  const handleStatusDetail = (label: string) => {
    const key = statusLabelToKey(label);
    if (key) {
      openDetail(label, data.details[key], key === 'ruptures' || key === 'sousSeuil' ? ruptureColumns : peremptionColumns);
    }
  };

  const handlePrintDetails = () => {
    const headerHTML = generatePrintHeader(entreprise);
    const footerHTML = generatePrintFooter(entreprise);

    const rows = detailItems.map((item) => `
      <tr>
        ${detailColumns.map((col) => `<td>${item[col.key] ?? '-'}</td>`).join('')}
      </tr>
    `).join('');

    const headers = detailColumns.map((col) => `<th>${col.label}</th>`).join('');

    const contentHTML = `
      <div class="sub-header">${detailTitle.toUpperCase()}</div>
      <table>
        <thead>
          <tr>${headers}</tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="text-center mt-4">
        <span class="fw-bold">Merci pour votre confiance</span><br/>
        <small>Imprimé le ${new Date().toLocaleString('fr-FR')}</small>
      </div>
    `;

    createPrintWindow(detailTitle, headerHTML, contentHTML, footerHTML);
  };

  const kpiCards = [
    { label: 'Produits en stock', value: data.totals.totalProduits, icon: 'bi-capsule', color: 'primary' },
    { label: 'Valeur stock', value: data.totals.valeurStock, icon: 'bi-cash-stack', color: 'success', formatter: (v: number) => `${v.toLocaleString('fr-FR')} FCFA` },
    { label: 'Ruptures', value: data.totals.ruptures, icon: 'bi-exclamation-triangle', color: 'danger' },
    { label: 'Sous seuil min', value: data.totals.sousSeuil, icon: 'bi-thermometer-low', color: 'warning' },
    { label: 'Proches péremption', value: data.totals.prochesPeremption, icon: 'bi-calendar-minus', color: 'info' },
    { label: 'Périmés', value: data.totals.lotsPerimes, icon: 'bi-calendar-x', color: 'secondary' },
    { label: 'Approvisionnements', value: data.totals.approvisionnements, icon: 'bi-cart-plus', color: 'primary' },
    { label: 'Approvisionnements du jour', value: data.totals.approvisionnementsJour, icon: 'bi-calendar-check', color: 'info' },
    { label: 'Approvisionnements du mois', value: data.totals.approvisionnementsMois, icon: 'bi-calendar-month', color: 'primary' },
    { label: 'Commandes fourn.', value: data.totals.commandesFournisseur, icon: 'bi-box-seam', color: 'warning' },
    { label: 'Commandes en cours', value: data.totals.commandesEnCours, icon: 'bi-hourglass-split', color: 'info' },
    { label: 'Entrées stock', value: data.totals.entreesStock, icon: 'bi-arrow-down-left-circle', color: 'success' },
    { label: 'Sorties stock', value: data.totals.sortiesStock, icon: 'bi-arrow-up-right-circle', color: 'danger' },
    { label: 'Inventaires', value: data.totals.inventaires, icon: 'bi-clipboard2-check', color: 'secondary' },
  ];

  const formatValue = (kpi: any) => kpi.formatter ? kpi.formatter(kpi.value) : kpi.value.toLocaleString('fr-FR');

  return (
    <Container fluid className="py-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold text-primary m-0">
          <i className="bi bi-bar-chart-line me-2"></i>
          Statistiques Pharmacie
        </h3>
      </div>

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col md={4}>
              <Form.Label>Date début</Form.Label>
              <Form.Control type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
            </Col>
            <Col md={4}>
              <Form.Label>Date fin</Form.Label>
              <Form.Control type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
            </Col>
            <Col md={4}>
              <button className="btn btn-primary w-100" onClick={fetchStats} disabled={loading}>
                {loading ? <Spinner animation="border" size="sm" /> : <><i className="bi bi-arrow-clockwise me-2"></i>Actualiser</>}
              </button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {error && <div className="alert alert-danger">{error}</div>}

      <Row className="g-3 mb-4">
        {kpiCards.map((kpi, idx) => (
          <Col key={idx} xs={12} sm={6} md={4} lg={3}>
            <Card className={`border-0 shadow-sm h-100 border-start border-4 border-${kpi.color}`}>
              <Card.Body className="d-flex align-items-center p-3">
                <div className={`bg-${kpi.color} bg-opacity-10 text-${kpi.color} rounded-3 p-3 me-3 flex-shrink-0`}>
                  <i className={`bi ${kpi.icon} fs-4`}></i>
                </div>
                <div className="flex-grow-1 min-w-0">
                  <h5 className={`fw-bold text-${kpi.color} mb-0 text-truncate`}>{formatValue(kpi)}</h5>
                  <small className="text-muted text-truncate d-block">{kpi.label}</small>
                </div>
                <button
                  className="btn btn-link btn-sm text-decoration-none p-0 ms-2 flex-shrink-0"
                  title="Voir les détails"
                  onClick={() => handleKpiDetail(kpi.label)}
                >
                  <i className="bi bi-box-arrow-up-right"></i>
                </button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row className="g-4 mb-4">
        <Col lg={4}>
          <Card className="border-0 shadow-sm h-100 overflow-hidden">
            <Card.Header className="bg-white border-bottom-0 pt-3">
              <h6 className="fw-bold">Alertes stock</h6>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.parStatus.filter((s) => s.value > 0)}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label
                    onClick={(entry: any) => entry && handleStatusDetail(entry.name as string)}
                  >
                    {data.parStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ReTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          <Card className="border-0 shadow-sm h-100 overflow-hidden">
            <Card.Header className="bg-white border-bottom-0 pt-3">
              <h6 className="fw-bold">Évolution mensuelle</h6>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.parMois} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ReTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="approvisionnements" name="Approvisionnements" stroke="#0d6efd" strokeWidth={2} />
                  <Line type="monotone" dataKey="entrees" name="Entrées stock" stroke="#198754" strokeWidth={2} />
                  <Line type="monotone" dataKey="sorties" name="Sorties stock" stroke="#dc3545" strokeWidth={2} />
                  <Line type="monotone" dataKey="commandes" name="Commandes" stroke="#ffc107" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        <Col lg={6}>
          <Card className="border-0 shadow-sm h-100 overflow-hidden">
            <Card.Header className="bg-white border-bottom-0 pt-3">
              <h6 className="fw-bold">Répartition par catégorie</h6>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.parCategorie} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="categorie" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ReTooltip />
                  <Bar dataKey="count" name="Nb produits" fill="#0d6efd" onClick={(e: any) => e && openDetail(`Catégorie : ${e.categorie}`, data.parCategorie.filter((c) => c.categorie === e.categorie), categorieColumns)} />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card className="border-0 shadow-sm h-100 overflow-hidden">
            <Card.Header className="bg-white border-bottom-0 pt-3">
              <h6 className="fw-bold">Top fournisseurs</h6>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.parFournisseur} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="nom" type="category" width={140} tick={{ fontSize: 11 }} tickFormatter={(value: string) => value.length > 20 ? `${value.substring(0, 20)}...` : value} />
                  <ReTooltip />
                  <Legend />
                  <Bar dataKey="approvisionnements" name="Appro." stackId="a" fill="#198754" onClick={(e: any) => e && openDetail(`Fournisseur : ${e.nom}`, data.parFournisseur.filter((f) => f.nom === e.nom), fournisseurColumns)} />
                  <Bar dataKey="commandes" name="Cmdes" stackId="a" fill="#ffc107" onClick={(e: any) => e && openDetail(`Fournisseur : ${e.nom}`, data.parFournisseur.filter((f) => f.nom === e.nom), fournisseurColumns)} />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        <Col>
          <Card className="border-0 shadow-sm overflow-hidden">
            <Card.Header className="bg-white border-bottom-0 pt-3">
              <h6 className="fw-bold">Volume journalier</h6>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.parJour} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="jour" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ReTooltip />
                  <Legend />
                  <Bar dataKey="entrees" name="Entrées" stackId="a" fill="#198754" />
                  <Bar dataKey="sorties" name="Sorties" stackId="a" fill="#dc3545" />
                  <Bar dataKey="commandes" name="Commandes" stackId="a" fill="#ffc107" />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showDetail} onHide={() => setShowDetail(false)} size="xl" fullscreen="lg-down">
        <Modal.Header closeButton>
          <Modal.Title><i className="bi bi-list-check me-2"></i>{detailTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailItems.length === 0 ? (
            <div className="text-center text-muted py-5">Aucun élément trouvé.</div>
          ) : (
            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <Table striped bordered hover responsive size="sm">
                <thead className="table-primary">
                  <tr>
                    <th>#</th>
                    {detailColumns.map((col) => (
                      <th key={col.key}>{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detailItems.map((item, idx) => (
                    <tr key={item._id || idx}>
                      <td>{idx + 1}</td>
                      {detailColumns.map((col) => (
                        <td key={col.key}>{item[col.key] ?? '-'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handlePrintDetails} disabled={detailItems.length === 0}>
            <i className="bi bi-printer me-2"></i>Imprimer
          </Button>
          <Button variant="secondary" onClick={() => setShowDetail(false)}>Fermer</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
