'use client';
import { useState, useEffect, FormEvent } from 'react';
import { Modal, Card, Row, Col, Table, Button, Form, Alert, Badge } from 'react-bootstrap';
import { FaHospitalUser, FaPrint, FaSave, FaPlus, FaEdit, FaTrash, FaFileAlt, FaSyncAlt } from 'react-icons/fa';
import { useEntreprise } from '@/hooks/useEntreprise';
import { generatePrintHeader, generatePrintFooter, createPrintWindow, createPrintWindowWithoutHeader } from '@/utils/printRecu';
import { normalizeRapportHospitalisationStatut, RapportHospitalisationForm, ServiceHospitalisation, StatutRapportHospitalisation } from '@/types/rapportHospitalisation';

interface RapportHospitalisation extends RapportHospitalisationForm {
  _id: string;
  dateCreation: Date;
  dureeHospitalisation?: number;
}

interface RapportHospitalisationModalProps {
  show: boolean;
  onHide: () => void;
  patientId: string;
  patientNom?: string;
  patientPrenoms?: string;
  patientDateNaissance?: Date;
  patientSexe?: string;
  patientNumeroDossier?: string;
  patientAssurance?: string;
}

const SERVICE_LABELS: Record<ServiceHospitalisation | string, string> = {
  MED: 'Médecine',
  CHIR: 'Chirurgie',
  'CHR.SP': 'Chirurgie Spécialisée',
  OBST: 'Obstétrique',
  GYN: 'Gynécologie',
  PED: 'Pédiatrie',
  REA: 'Réanimation',
  URG: 'Urgences',
};

const formatDateInput = (value: string | Date | undefined) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

export default function RapportHospitalisationModal({
  show,
  onHide,
  patientId,
  patientNom,
  patientPrenoms,
  patientDateNaissance,
  patientSexe,
  patientNumeroDossier,
  patientAssurance,
}: RapportHospitalisationModalProps) {
  const [rapports, setRapports] = useState<RapportHospitalisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingRapport, setEditingRapport] = useState<RapportHospitalisation | null>(null);
  const [loadingHospitData, setLoadingHospitData] = useState(false);
  const [hospitDataError, setHospitDataError] = useState('');
  const [typeActes, setTypeActes] = useState<{ _id: string; Designation: string }[]>([]);
  const [statutFilter, setStatutFilter] = useState<"" | "brouillon" | "a_valider" | "valide" | "annule">("");
  const [medecinFilter, setMedecinFilter] = useState("");

  const currentUser = typeof window !== 'undefined'
    ? localStorage.getItem('nom_utilisateur') || localStorage.getItem('userName') || ''
    : '';

  const { entreprise } = useEntreprise();

  const [formData, setFormData] = useState<RapportHospitalisationForm>({
    patientId,
    hospitalisationId: undefined,
    patientNom,
    patientPrenoms,
    patientDateNaissance,
    patientSexe,
    patientNumeroDossier,
    patientAssurance,
    dateEntree: new Date(),
    dateSortie: new Date(),
    service: '',
    motifHospitalisation: '',
    antecedentsMedicaux: '',
    antecedentsChirurgicaux: '',
    tensionArterielle: '',
    temperature: '',
    pouls: '',
    diagnosticAdmission: '',
    diagnosticFinal: '',
    histoireMaladie: '',
    examenClinique: '',
    examensParacliniques: '',
    traitementAdministre: '',
    evolution: '',
    complications: '',
    suitesHospitalisation: '',
    medecinTraitant: currentUser,
    medecinChefService: '',
    recommandations: '',
    conclusion: '',
    dateRapport: new Date(),
  });

  const medecins = [...new Set(rapports.map(rapport => rapport.medecinTraitant || '').filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr'));
  const rapportsFiltres = rapports.filter(rapport =>
    (!statutFilter || normalizeRapportHospitalisationStatut(rapport.statut) === statutFilter) &&
    (!medecinFilter || rapport.medecinTraitant === medecinFilter)
  );

  const loadRapports = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/rapportHospitalisation?patientId=${patientId}`);
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Impossible de charger les rapports');
      }

      const data = await response.json();
      setRapports(data.data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erreur lors du chargement des rapports');
      setRapports([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTypeActes = async () => {
    try {
      const response = await fetch('/api/typeacte/hospitalisation');
      if (!response.ok) return;
      const data = await response.json();
      setTypeActes(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des types d\'actes:', err);
    }
  };

  useEffect(() => {
    if (show && patientId) {
      setStatutFilter('');
      setMedecinFilter('');
      loadRapports();
      loadTypeActes();
    }
  }, [show, patientId]);

  const resetForm = () => {
    setFormData({
      patientId,
      hospitalisationId: undefined,
      patientNom,
      patientPrenoms,
      patientDateNaissance,
      patientSexe,
      patientNumeroDossier,
      patientAssurance,
      dateEntree: new Date(),
      dateSortie: new Date(),
      service: '',
      motifHospitalisation: '',
      antecedentsMedicaux: '',
      antecedentsChirurgicaux: '',
      tensionArterielle: '',
      temperature: '',
      pouls: '',
      diagnosticAdmission: '',
      diagnosticFinal: '',
      histoireMaladie: '',
      examenClinique: '',
      examensParacliniques: '',
      traitementAdministre: '',
      evolution: '',
      complications: '',
      suitesHospitalisation: '',
      medecinTraitant: currentUser,
      medecinChefService: '',
      recommandations: '',
      conclusion: '',
      dateRapport: new Date(),
    });
    setEditingRapport(null);
  };

  const handleAdd = () => {
    resetForm();
    setShowFormModal(true);
  };

  const handleEdit = async (rapport: RapportHospitalisation) => {
    const freshRapport = await getFreshRapport(rapport);
    setFormData({
      patientId: freshRapport.patientId,
      hospitalisationId: freshRapport.hospitalisationId,
      patientNom: freshRapport.patientNom,
      patientPrenoms: freshRapport.patientPrenoms,
      patientDateNaissance: freshRapport.patientDateNaissance,
      patientSexe: freshRapport.patientSexe,
      patientNumeroDossier: freshRapport.patientNumeroDossier,
      patientAssurance: freshRapport.patientAssurance,
      dateEntree: new Date(freshRapport.dateEntree),
      dateSortie: freshRapport.dateSortie ? new Date(freshRapport.dateSortie) : undefined,
      service: freshRapport.service || '',
      motifHospitalisation: freshRapport.motifHospitalisation || '',
      antecedentsMedicaux: freshRapport.antecedentsMedicaux || '',
      antecedentsChirurgicaux: freshRapport.antecedentsChirurgicaux || '',
      tensionArterielle: freshRapport.tensionArterielle || '',
      temperature: freshRapport.temperature || '',
      pouls: freshRapport.pouls || '',
      diagnosticAdmission: freshRapport.diagnosticAdmission || '',
      diagnosticFinal: freshRapport.diagnosticFinal || '',
      histoireMaladie: freshRapport.histoireMaladie || '',
      examenClinique: freshRapport.examenClinique || '',
      examensParacliniques: freshRapport.examensParacliniques || '',
      traitementAdministre: freshRapport.traitementAdministre || '',
      evolution: freshRapport.evolution || '',
      complications: freshRapport.complications || '',
      suitesHospitalisation: freshRapport.suitesHospitalisation || '',
      medecinTraitant: freshRapport.medecinTraitant || '',
      medecinChefService: freshRapport.medecinChefService || '',
      recommandations: freshRapport.recommandations || '',
      conclusion: freshRapport.conclusion || '',
      dateRapport: new Date(freshRapport.dateRapport),
      statut: freshRapport.statut,
    });
    setEditingRapport(freshRapport);
    setShowFormModal(true);
  };

  const chargerDonneesHospitalisation = async () => {
    setLoadingHospitData(true);
    setHospitDataError('');

    try {
      const response = await fetch(`/api/rapportHospitalisation/donnees?patientId=${patientId}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Impossible de récupérer les données de l\'hospitalisation');
      }

      const {
        examenHospitalisation,
        evolutions,
        consultation,
        lignesConsultation,
        prescriptionsConsultation,
      } = result.data;

      // Mêmes sources et format que PrintFichePrescription : ExamenClinique est le
      // texte saisi par le médecin à la consultation, les examens paracliniques sont
      // les LignePrestation de la consultation filtrées par lettreCle, et le
      // traitement liste les PatientPrescription de la consultation.
      const examenCliniqueText = consultation?.ExamenClinique || '';

      const examensParacliniques = (lignesConsultation || []).filter(
        (ligne: any) => !!ligne.lettreCle && ['K', 'KC', 'B', 'Z', 'D'].includes(ligne.lettreCle)
      );
      const examensParacliniquesText = examensParacliniques
        .sort((a: any, b: any) => (a.ordonnancementAffichage || 0) - (b.ordonnancementAffichage || 0))
        .map((l: any) => l.prestation)
        .join(' - ');

      const traitementAdministreText = (prescriptionsConsultation || [])
        .map((p: any) => `- ${p.nomMedicament} ${p.posologie || ''} qté:${p.QteP}`)
        .join('\n');

      const evolutionText = evolutions
        .map((e: any) => {
          const date = e.date ? new Date(e.date).toLocaleDateString('fr-FR') : '';
          return `- ${date} ${e.heure || ''} : ${e.observation}${e.decision ? ` — Décision : ${e.decision}` : ''}${e.etatPatient ? ` — État : ${e.etatPatient}` : ''}`;
        })
        .join('\n');

      setFormData((prev) => ({
        ...prev,
        hospitalisationId: examenHospitalisation._id ? String(examenHospitalisation._id) : prev.hospitalisationId,
        dateEntree: examenHospitalisation.Entrele ? new Date(examenHospitalisation.Entrele) : prev.dateEntree,
        dateSortie: examenHospitalisation.SortieLe ? new Date(examenHospitalisation.SortieLe) : prev.dateSortie,
        service: examenHospitalisation.Designationtypeacte || prev.service,
        medecinTraitant: examenHospitalisation.NomMed || prev.medecinTraitant,
        diagnosticAdmission: examenHospitalisation.Rclinique || prev.diagnosticAdmission,
        motifHospitalisation: examenHospitalisation.motifHospitalisation || examenHospitalisation.Rclinique || prev.motifHospitalisation,
        examenClinique: examenCliniqueText || prev.examenClinique,
        examensParacliniques: examensParacliniquesText || prev.examensParacliniques,
        traitementAdministre: traitementAdministreText || prev.traitementAdministre,
        evolution: evolutionText || prev.evolution,
      }));
    } catch (err: any) {
      setHospitDataError(err.message || 'Erreur lors du chargement des données de l\'hospitalisation');
      setTimeout(() => setHospitDataError(''), 5000);
    } finally {
      setLoadingHospitData(false);
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const url = editingRapport
        ? `/api/rapportHospitalisation/${editingRapport._id}`
        : '/api/rapportHospitalisation';
      const method = editingRapport ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        patientId,
        patientNom,
        patientPrenoms,
        patientDateNaissance,
        patientSexe,
        patientNumeroDossier,
        patientAssurance,
        statut: editingRapport?.statut || 'brouillon',
        dateRapport: formData.dateRapport || new Date(),
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-name': currentUser,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la sauvegarde');
      }

      setSuccess(result.message || (editingRapport ? 'Rapport modifié avec succès' : 'Rapport créé avec succès'));
      setTimeout(() => setSuccess(''), 3000);
      setShowFormModal(false);
      resetForm();
      await loadRapports();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (rapportId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce rapport d\'hospitalisation ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/rapportHospitalisation/${rapportId}`, {
        method: 'DELETE',
        headers: {
          'x-user-name': currentUser,
        },
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la suppression');
      }

      setSuccess(result.message || 'Rapport supprimé avec succès');
      setTimeout(() => setSuccess(''), 3000);
      setRapports((prev) => prev.filter((rapport) => rapport._id !== rapportId));
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleStatusChange = async (rapport: RapportHospitalisation, statut: 'a_valider' | 'valide' | 'annule') => {
    const motifAnnulation = statut === 'annule' ? prompt('Indiquez le motif de l’annulation :')?.trim() : undefined;
    if (statut === 'annule' && !motifAnnulation) return;
    if (statut === 'valide' && !confirm('Valider définitivement ce rapport ? Il ne pourra plus être modifié.')) return;

    try {
      const response = await fetch(`/api/rapportHospitalisation/${rapport._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-name': currentUser },
        body: JSON.stringify({ statut, motifAnnulation }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Erreur lors du changement de statut');
      setRapports(current => current.map(item => item._id === rapport._id ? result.data : item));
      setSuccess(result.message || 'Statut mis à jour avec succès');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du changement de statut');
      setTimeout(() => setError(''), 3000);
    }
  };

  const getServiceLabel = (service: ServiceHospitalisation | string | undefined) => {
    if (!service) return 'N/A';
    return SERVICE_LABELS[service] || service;
  };

  const getStatutBadge = (statut: StatutRapportHospitalisation | undefined) => {
    const normalized = normalizeRapportHospitalisationStatut(statut);
    if (normalized === 'valide') return <Badge bg="success">Validé</Badge>;
    if (normalized === 'a_valider') return <Badge bg="warning" text="dark">À valider</Badge>;
    if (normalized === 'annule') return <Badge bg="danger">Annulé</Badge>;
    return <Badge bg="secondary">Brouillon</Badge>;
  };

  const getReportPrintContent = (rapport: RapportHospitalisation) => {
    const escapeHtml = (value?: string | number) => String(value ?? 'Non renseigné').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    const text = (value?: string) => escapeHtml(value).replace(/\r?\n/g, '<br>');
    const patientFullName = `${rapport.patientNom || ''} ${rapport.patientPrenoms || ''}`.trim() || 'Patient non renseigné';
    const dateEntree = new Date(rapport.dateEntree).toLocaleDateString('fr-FR');
    const dateSortie = rapport.dateSortie ? new Date(rapport.dateSortie).toLocaleDateString('fr-FR') : 'Non renseignée';
    const dateNaissance = rapport.patientDateNaissance ? new Date(rapport.patientDateNaissance).toLocaleDateString('fr-FR') : 'Non renseignée';
    const statut = normalizeRapportHospitalisationStatut(rapport.statut);
    const statutLabel = statut === 'brouillon' ? 'BROUILLON' : statut === 'a_valider' ? 'À VALIDER' : statut === 'annule' ? 'ANNULÉ' : '';
    const section = (title: string, content?: string, minHeight = 36) => `<div style="margin-bottom:14px;page-break-inside:avoid"><div style="font-size:11px;font-weight:750;color:#0f766e;text-transform:uppercase;letter-spacing:.7px;border-bottom:1px solid #99f6e4;padding-bottom:4px;margin-bottom:6px">${title}</div><div style="min-height:${minHeight}px;text-align:justify">${text(content)}</div></div>`;

    return `<html><body><div style="font-family:'Segoe UI',Arial,sans-serif;padding:10px 20px;color:#1f2937;font-size:12px;line-height:1.5;position:relative">
      ${statutLabel ? `<div style="position:fixed;top:45%;left:16%;transform:rotate(-28deg);font-size:72px;font-weight:800;letter-spacing:8px;color:${statut === 'annule' ? 'rgba(185,28,28,.12)' : 'rgba(71,85,105,.12)'};z-index:0">${statutLabel}</div>` : ''}
      <div style="position:relative;z-index:1">
        <div style="border-bottom:3px solid #0f766e;padding-bottom:12px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:flex-end"><div><div style="font-size:10px;font-weight:700;color:#0f766e;letter-spacing:1.8px;text-transform:uppercase">Document médical</div><div style="font-size:24px;font-weight:750;color:#111827">Rapport d’hospitalisation</div></div>${statut === 'valide' ? '<div style="font-size:10px;font-weight:800;color:#047857">DOCUMENT VALIDÉ</div>' : ''}</div>
        <div style="background:#f8fafc;border:1px solid #dbe3ea;border-left:4px solid #0f766e;border-radius:7px;padding:12px 14px;margin-bottom:16px"><table style="width:100%;border-collapse:collapse"><tr><td colspan="3" style="font-size:15px;font-weight:700;padding-bottom:8px">${escapeHtml(patientFullName)}</td></tr><tr><td><small>DDN</small><br><b>${escapeHtml(dateNaissance)}</b></td><td><small>Sexe</small><br><b>${escapeHtml(rapport.patientSexe)}</b></td><td><small>N° dossier</small><br><b style="color:#0f766e">${escapeHtml(rapport.patientNumeroDossier)}</b></td></tr><tr><td colspan="3" style="padding-top:8px"><small>Assurance</small><br><b>${escapeHtml(rapport.patientAssurance || 'Non assuré')}</b></td></tr></table></div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px"><tr><td><b>Médecin traitant :</b> ${escapeHtml(rapport.medecinTraitant)}</td></tr><tr><td><b>Date d’entrée :</b> ${escapeHtml(dateEntree)} &nbsp;&nbsp;&nbsp; <b>Date de sortie :</b> ${escapeHtml(dateSortie)}</td></tr></table>
        ${section('Motif d’hospitalisation', rapport.motifHospitalisation)}
        <div style="display:flex;gap:16px"><div style="flex:1">${section('Antécédents médicaux', rapport.antecedentsMedicaux)}</div><div style="flex:1">${section('Antécédents chirurgicaux', rapport.antecedentsChirurgicaux)}</div></div>
        <div style="background:#f1f5f9;border-radius:6px;padding:8px 12px;margin-bottom:14px"><b>Constantes :</b> TA ${escapeHtml(rapport.tensionArterielle)} &nbsp;|&nbsp; Température ${escapeHtml(rapport.temperature)} &nbsp;|&nbsp; Pouls ${escapeHtml(rapport.pouls)}</div>
        ${section('Examen clinique', rapport.examenClinique)}
        ${section('Examens paracliniques réalisés pendant l’hospitalisation', rapport.examensParacliniques)}
        ${section('Traitements', rapport.traitementAdministre)}
        ${section('Évolution', rapport.evolution)}
        ${section('Conclusion', rapport.conclusion, 70)}
        <div style="display:flex;justify-content:flex-end;margin-top:32px"><div style="width:230px;text-align:center;border-top:1px solid #94a3b8;padding-top:8px"><div style="font-size:10px;color:#64748b;text-transform:uppercase">Date, signature et cachet</div><div style="font-size:13px;font-weight:700;margin-top:18px">${escapeHtml(rapport.medecinTraitant)}</div></div></div>
      </div></div></body></html>`;
  };

  const getFreshRapport = async (rapport: RapportHospitalisation): Promise<RapportHospitalisation> => {
    if (!rapport._id) return rapport;
    try {
      const response = await fetch(`/api/rapportHospitalisation/${rapport._id}`);
      const result = await response.json();
      if (response.ok && result.success && result.data) {
        return result.data;
      }
    } catch (err) {
      console.error('Erreur lors du rechargement du rapport avant impression:', err);
    }
    return rapport;
  };

  const handlePrintWithHeader = async (rapport: RapportHospitalisation) => {
    const freshRapport = await getFreshRapport(rapport);
    const headerHTML = generatePrintHeader(entreprise);
    const footerHTML = generatePrintFooter(entreprise);
    // Extraire juste le contenu du body sans le wrapper HTML
    const fullHTML = getReportPrintContent(freshRapport);
    const bodyMatch = fullHTML.match(/<body>([\s\S]*)<\/body>/);
    const contentHTML = bodyMatch ? bodyMatch[1] : fullHTML;
    createPrintWindow('Rapport d\'Hospitalisation', headerHTML, contentHTML, footerHTML);
  };

  const handlePrintWithoutHeader = async (rapport: RapportHospitalisation) => {
    const freshRapport = await getFreshRapport(rapport);
    const fullHTML = getReportPrintContent(freshRapport);
    const bodyMatch = fullHTML.match(/<body>([\s\S]*)<\/body>/);
    const contentHTML = bodyMatch ? bodyMatch[1] : fullHTML;
    createPrintWindowWithoutHeader('Rapport d\'Hospitalisation', contentHTML);
  };

  return (
    <>
      <Modal show={show} onHide={onHide} size="xl">
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title className="d-flex align-items-center">
            <FaHospitalUser className="me-2" />
            Gestion des Rapports d'Hospitalisation
            <Badge bg="light" text="dark" className="ms-2">{rapportsFiltres.length}/{rapports.length}</Badge>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <div className="fw-bold">Patient :</div>
              <div>{patientNom} {patientPrenoms}</div>
            </div>
            <Button variant="primary" onClick={handleAdd}>
              <FaPlus className="me-2" />
              Nouveau rapport
            </Button>
          </div>

          {rapports.length > 0 && (
            <Card className="border-0 bg-light mb-3"><Card.Body className="py-3"><Row className="g-3 align-items-end">
              <Col md={5}><Form.Group><Form.Label className="small fw-semibold mb-1">Filtrer par statut</Form.Label><Form.Select value={statutFilter} onChange={(e) => setStatutFilter(e.target.value as typeof statutFilter)}><option value="">Tous les statuts</option><option value="brouillon">Brouillon</option><option value="a_valider">À valider</option><option value="valide">Validé</option><option value="annule">Annulé</option></Form.Select></Form.Group></Col>
              <Col md={5}><Form.Group><Form.Label className="small fw-semibold mb-1">Filtrer par médecin</Form.Label><Form.Select value={medecinFilter} onChange={(e) => setMedecinFilter(e.target.value)}><option value="">Tous les médecins</option>{medecins.map(medecin => <option key={medecin} value={medecin}>{medecin}</option>)}</Form.Select></Form.Group></Col>
              <Col md={2}><Button variant="outline-secondary" className="w-100" disabled={!statutFilter && !medecinFilter} onClick={() => { setStatutFilter(''); setMedecinFilter(''); }}>Réinitialiser</Button></Col>
            </Row></Card.Body></Card>
          )}

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
            </div>
          ) : rapportsFiltres.length > 0 ? (
            <Table striped hover responsive>
              <thead>
                <tr>
                  <th>Date entrée</th>
                  <th>Date sortie</th>
                  <th>Médecin traitant</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rapportsFiltres.map((rapport) => {
                  const normalizedStatus = normalizeRapportHospitalisationStatut(rapport.statut);
                  const isLocked = normalizedStatus === 'valide' || normalizedStatus === 'annule';
                  return (
                  <tr key={rapport._id}>
                    <td>{formatDateInput(rapport.dateEntree)}</td>
                    <td>{formatDateInput(rapport.dateSortie)}</td>
                    <td>{rapport.medecinTraitant}</td>
                    <td>{getStatutBadge(rapport.statut)}</td>
                    <td>
                      <div className="btn-group" role="group">
                        <Button variant="outline-primary" size="sm" onClick={() => handleEdit(rapport)} title={isLocked ? 'Consulter (lecture seule)' : 'Modifier'}>
                          <FaEdit />
                        </Button>
                        {normalizedStatus === 'brouillon' && <Button variant="outline-warning" size="sm" onClick={() => handleStatusChange(rapport, 'a_valider')}>Soumettre</Button>}
                        {normalizedStatus === 'a_valider' && <Button variant="outline-success" size="sm" onClick={() => handleStatusChange(rapport, 'valide')}>Valider</Button>}
                        {!isLocked && <Button variant="outline-danger" size="sm" onClick={() => handleStatusChange(rapport, 'annule')}>Annuler</Button>}
                        <Button variant="outline-success" size="sm" onClick={() => handlePrintWithHeader(rapport)}>
                          <FaPrint />
                        </Button>
                        <Button variant="outline-info" size="sm" onClick={() => handlePrintWithoutHeader(rapport)}>
                          <FaFileAlt />
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(rapport._id)} disabled={normalizedStatus !== 'brouillon'} title={normalizedStatus !== 'brouillon' ? 'Seul un brouillon peut être supprimé' : 'Supprimer'}>
                          <FaTrash />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-5">
              <p className="text-muted">Aucun rapport d'hospitalisation trouvé</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>Fermer</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showFormModal} onHide={() => setShowFormModal(false)} size="xl">
        <Modal.Header
          closeButton
          closeVariant="white"
          className="text-white border-0"
          style={{ background: 'linear-gradient(135deg, #198754, #146c43)' }}
        >
          <Modal.Title className="d-flex align-items-center gap-2 flex-grow-1">
            <FaHospitalUser />
            <span>{editingRapport ? 'Modifier le rapport d\'hospitalisation' : 'Nouveau rapport d\'hospitalisation'}</span>
            {getStatutBadge(formData.statut)}
          </Modal.Title>
          <Button
            variant="light"
            size="sm"
            onClick={chargerDonneesHospitalisation}
            disabled={loadingHospitData || normalizeRapportHospitalisationStatut(formData.statut) === 'valide' || normalizeRapportHospitalisationStatut(formData.statut) === 'annule'}
            className="me-3 fw-semibold"
          >
            <FaSyncAlt className={`me-2 ${loadingHospitData ? 'fa-spin' : ''}`} />
            {loadingHospitData ? 'Chargement...' : 'Charger les données'}
          </Button>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '80vh', overflowY: 'auto' }}>
          {(normalizeRapportHospitalisationStatut(formData.statut) === 'valide' || normalizeRapportHospitalisationStatut(formData.statut) === 'annule') && (
            <Alert variant={normalizeRapportHospitalisationStatut(formData.statut) === 'valide' ? 'success' : 'danger'} className="d-flex align-items-center gap-2">
              <FaHospitalUser /> Ce rapport est {normalizeRapportHospitalisationStatut(formData.statut) === 'valide' ? 'validé' : 'annulé'} et disponible uniquement en lecture.
            </Alert>
          )}
          {hospitDataError && <Alert variant="warning" className="py-2">{hospitDataError}</Alert>}
          <Form onSubmit={handleSave}>
          <fieldset disabled={normalizeRapportHospitalisationStatut(formData.statut) === 'valide' || normalizeRapportHospitalisationStatut(formData.statut) === 'annule'}>
            <Card className="mb-3 border-0 bg-light">
              <Card.Header className="bg-light"><h6 className="mb-0">Informations du patient</h6></Card.Header>
              <Card.Body>
                <Row className="g-3">
                  <Col md={4}><Form.Group><Form.Label>Nom et prénom</Form.Label><Form.Control value={`${patientNom || ''} ${patientPrenoms || ''}`.trim()} readOnly /></Form.Group></Col>
                  <Col md={2}><Form.Group><Form.Label>Date de naissance</Form.Label><Form.Control value={formatDateInput(patientDateNaissance) || 'Non renseignée'} readOnly /></Form.Group></Col>
                  <Col md={2}><Form.Group><Form.Label>Sexe</Form.Label><Form.Control value={patientSexe || 'Non renseigné'} readOnly /></Form.Group></Col>
                  <Col md={2}><Form.Group><Form.Label>N° dossier</Form.Label><Form.Control value={patientNumeroDossier || 'Non renseigné'} readOnly /></Form.Group></Col>
                  <Col md={2}><Form.Group><Form.Label>Assurance</Form.Label><Form.Control value={patientAssurance || 'Non assuré'} readOnly /></Form.Group></Col>
                </Row>
              </Card.Body>
            </Card>

            <Card className="mb-3">
              <Card.Header className="bg-light">
                <h6 className="mb-0">Informations Générales</h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Date d'entrée *</Form.Label>
                      <Form.Control
                        type="date"
                        value={formatDateInput(formData.dateEntree)}
                        onChange={(e) => setFormData({ ...formData, dateEntree: new Date(e.target.value) })}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Date de sortie *</Form.Label>
                      <Form.Control
                        type="date"
                        value={formatDateInput(formData.dateSortie)}
                        onChange={(e) => setFormData({ ...formData, dateSortie: new Date(e.target.value) })}
                        min={formatDateInput(formData.dateEntree)}
                        required
                      />
                    </Form.Group>
                  </Col>

                </Row>
                <Row>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label>Médecin traitant *</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.medecinTraitant}
                        onChange={(e) => setFormData({ ...formData, medecinTraitant: e.target.value })}
                        placeholder="Nom du médecin traitant"
                        required
                      />
                    </Form.Group>
                  </Col>

                </Row>
              </Card.Body>
            </Card>

            <Card className="mb-3">
              <Card.Header className="bg-light">
                <h6 className="mb-0">Motif et antécédents</h6>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Motif d'hospitalisation *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={formData.motifHospitalisation}
                    onChange={(e) => setFormData({ ...formData, motifHospitalisation: e.target.value })}
                    placeholder="Motif principal de l'hospitalisation..."
                    required
                  />
                </Form.Group>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Antécédents médicaux</Form.Label>
                      <Form.Control as="textarea" rows={2} value={formData.antecedentsMedicaux} onChange={(e) => setFormData({ ...formData, antecedentsMedicaux: e.target.value })} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Antécédents chirurgicaux</Form.Label>
                      <Form.Control as="textarea" rows={2} value={formData.antecedentsChirurgicaux} onChange={(e) => setFormData({ ...formData, antecedentsChirurgicaux: e.target.value })} />
                    </Form.Group>
                  </Col>
                </Row>

              </Card.Body>
            </Card>

            <Card className="mb-3">
              <Card.Header className="bg-light">
                <h6 className="mb-0">Examens cliniques</h6>
              </Card.Header>
              <Card.Body>

                <Row className="g-3 mb-3">
                  <Col md={4}><Form.Group><Form.Label>TA</Form.Label><Form.Control value={formData.tensionArterielle} onChange={(e) => setFormData({ ...formData, tensionArterielle: e.target.value })} placeholder="Ex. 120/80 mmHg" /></Form.Group></Col>
                  <Col md={4}><Form.Group><Form.Label>TC</Form.Label><Form.Control value={formData.temperature} onChange={(e) => setFormData({ ...formData, temperature: e.target.value })} placeholder="Ex. 37 °C" /></Form.Group></Col>
                  <Col md={4}><Form.Group><Form.Label>Pouls</Form.Label><Form.Control value={formData.pouls} onChange={(e) => setFormData({ ...formData, pouls: e.target.value })} placeholder="Ex. 72 bpm" /></Form.Group></Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label>Examen clinique *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.examenClinique}
                    onChange={(e) => setFormData({ ...formData, examenClinique: e.target.value })}
                    placeholder="Résultats de l'examen clinique..."
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Examens paracliniques</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.examensParacliniques}
                    onChange={(e) => setFormData({ ...formData, examensParacliniques: e.target.value })}
                    placeholder="Résultats des examens complémentaires..."
                    required
                  />
                </Form.Group>
              </Card.Body>
            </Card>

            <Card className="mb-3">
              <Card.Header className="bg-light">
                <h6 className="mb-0">Traitement et Évolution</h6>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Traitement administré *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.traitementAdministre}
                    onChange={(e) => setFormData({ ...formData, traitementAdministre: e.target.value })}
                    placeholder="Traitements administrés pendant l'hospitalisation..."
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Évolution *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.evolution}
                    onChange={(e) => setFormData({ ...formData, evolution: e.target.value })}
                    placeholder="Évolution du patient pendant l'hospitalisation..."
                    required
                  />
                </Form.Group>

              </Card.Body>
            </Card>

            <Card className="mb-3">
              <Card.Header className="bg-light">
                <h6 className="mb-0">Conclusion</h6>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Conclusion *</Form.Label>
                  <Form.Control as="textarea" rows={4} value={formData.conclusion} onChange={(e) => setFormData({ ...formData, conclusion: e.target.value })} placeholder="Conclusion du rapport d'hospitalisation..." required />
                </Form.Group>

              </Card.Body>
            </Card>

          </fieldset>

            <div className="d-flex justify-content-between">
              <Button variant="outline-success" onClick={() => handlePrintWithHeader(editingRapport ? editingRapport : formData as RapportHospitalisation)}>
                <FaPrint className="me-2" />
                Aperçu Impression (avec entête)
              </Button>
              <Button variant="outline-info" onClick={() => handlePrintWithoutHeader(editingRapport ? editingRapport : formData as RapportHospitalisation)}>
                <FaFileAlt className="me-2" />
                Aperçu Impression (sans entête)
              </Button>
              <div>
                <Button variant="secondary" className="me-2" onClick={() => setShowFormModal(false)}>
                  Annuler
                </Button>
                <Button variant="success" type="submit" disabled={saving || normalizeRapportHospitalisationStatut(formData.statut) === 'valide' || normalizeRapportHospitalisationStatut(formData.statut) === 'annule'}>
                  <FaSave className="me-2" />
                  {saving ? 'Sauvegarde...' : (editingRapport ? 'Modifier' : 'Créer')}
                </Button>
              </div>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
}
