'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Row, Col, Card, Table, Button, Badge } from 'react-bootstrap';
import { useEntreprise } from "@/hooks/useEntreprise";
import { generatePrintHeader, generatePrintFooter, createPrintWindow, createPrintWindowWithoutHeader, extractContentWithoutHeaderAndFooter } from "@/utils/printRecu";

interface Patient {
  _id: string;
  Nom: string;
  Prenoms: string;
  sexe: string;
  Age_partient: number;
  Contact?: string;
  Situationgeo?: string;
  AnteChirurgico?: string;
  AntecedentMedico?: string;
  AnteFamille?: string;
  AutreAnte?: string;
  IDPARTIENT?: string;
  // Champs exacts du modèle MongoDB
  Code_dossier: string;
  Assurance?: string;
  Matricule?: string;
}

interface LignePrestation {
  _id: string;
  CodePrestation: string;
  prestation: string;
  qte: number;
  prix: number;
  partAssurance: number;
  partAssure: number;
  prixTotal: number;
  lettreCle?: string;
  resultatActe?: string;
  observationExamen?: string;
  familleActe?: string;
  biologiste?: string;
  validerLe?: Date;
  provenanceExamen?: string;
  externeInterne?: string;
  nIdentificationExamen?: string;
  ordonnancementAffichage?: number;
}

interface PatientPrescription {
  _id: string;
  IDPRESCRIPTION: string;
  PatientP: string;
  IdPatient: string;
  QteP: number;
  posologie: string;
  DatePres: Date;
  prixUnitaire: number;
  prixTotal: number;
  nomMedicament: string;
  partAssurance: number;
  partAssure: number;
  CodePrestation: string;
  StatutPrescriptionMedecin?: number;
}

interface Consultation {
  _id: string;
  Code_consultation?: string;
  designationC?: string;
  Date_consulation?: Date;
  Température?: string;
  Tension?: string;
  Glycemie?: string;
  TailleCons?: string;
  Poids?: string;
  ConstancePrisepar?: string;
  IDPARTIENT?: string;
  EXAMENDEMANDE?: string;
  ExamenParaclinique?: string;
  Traitement?: string;
  Conclision?: string;
  Diagnostic?: string;
  MotifConsultation?: string;
  Code_dossier?: string;
  // Champs manquants ajoutés
  TraitementClinique?: string;
  ConclusionClinique?: string;
  CodeAffection?: string;
  CodePrestation?: string;
  ExamenClinique?: string;
  Medecin?: string;
  // Champs ajoutés pour les données complémentaires
  lignesPrestation?: LignePrestation[];
  prescriptions?: PatientPrescription[];
}

interface Antecedent {
  _id: string;
  type: 'medical' | 'chirurgical' | 'familial' | 'autre' | 'allergie';
  description: string;
}

interface Prescription {
  _id: string;
  type: 'medicament' | 'examen';
  designation: string;
  posologie?: string;
  duree?: string;
  instructions?: string;
}

interface PrintFichePrescriptionProps {
  consultationId?: string;
  patientId?: string;
  patientNom?: string;
  patientPrenoms?: string;
}

export default function PrintFichePrescription({ consultationId, patientId, patientNom, patientPrenoms }: PrintFichePrescriptionProps) {
  const router = useRouter();
  const { entreprise } = useEntreprise();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [antecedents, setAntecedents] = useState<Antecedent[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Récupérer l'utilisateur connecté
  const Utilisateur = localStorage.getItem("nom_utilisateur");
  // Fonctions d'impression
  const handlePrint = () => {
    console.log('🖨️ handlePrint appelé');
    console.log('📋 Entreprise:', entreprise);

    if (!entreprise) {
      console.error('❌ Entreprise non disponible');
      return;
    }

    const printContent = document.getElementById('print-content');
    console.log('📄 Print content trouvé:', !!printContent);

    if (!printContent) {
      console.error('❌ Élément print-content non trouvé');
      return;
    }

    const header = generatePrintHeader(entreprise);
    const footer = generatePrintFooter(entreprise);
    const content = printContent.innerHTML;

    console.log('📤 Génération de la fenêtre d\'impression avec entête...');
    createPrintWindow('Fiche de Consultation Médicale', header, content, footer);
  };

  const handlePrintWithoutHeader = () => {
    console.log('🖨️ handlePrintWithoutHeader appelé');
    console.log('📋 Entreprise:', entreprise);

    if (!entreprise) {
      console.error('❌ Entreprise non disponible');
      return;
    }

    const printContent = document.getElementById('print-content');
    console.log('📄 Print content trouvé:', !!printContent);

    if (!printContent) {
      console.error('❌ Élément print-content non trouvé');
      return;
    }

    const content = extractContentWithoutHeaderAndFooter(printContent.innerHTML);
    console.log('📤 Génération de la fenêtre d\'impression sans entête...');
    createPrintWindowWithoutHeader('Fiche de Consultation Médicale', content);
  };

  // Charger les données de la consultation
  useEffect(() => {
    const chargerDonnees = async () => {
      try {
        setLoading(true);

        // Utiliser la nouvelle API avec codeConsultation (CodePrestation selon logique Windev)
        let url = null;

        if (consultationId) {
          // consultationId contient directement le CodePrestation
          url = `/api/printficheprescription?codeConsultation=${consultationId}`;
          console.log('🔍 Composant - consultationId utilisé:', consultationId);
        } else if (patientId) {
          // Si on a que le patientId, il faut d'abord récupérer ses consultations pour avoir un CodePrestation
          const consultationResponse = await fetch(`/api/consultation?patientId=${patientId}`);
          if (consultationResponse.ok) {
            const consultations = await consultationResponse.json();
            if (consultations.length > 0 && consultations[0].CodePrestation) {
              url = `/api/printficheprescription?codeConsultation=${consultations[0].CodePrestation}`;
              console.log('🔍 Composant - CodePrestation depuis patientId:', consultations[0].CodePrestation);
            }
          }
        }

        if (!url) {
          setError('Aucun code consultation disponible');
          return;
        }

        const response = await fetch(url);

        if (response.ok) {
          const result = await response.json();
          console.log('📥 Composant - réponse API reçue:', result);

          if (result.success && result.data && result.data.length > 0) {
            // Prendre la première consultation (les données sont déjà fusionnées)
            const consultationData = result.data[0];

            console.log('📥 Composant - réponse API reçue:', result);
            console.log('🔬 LignePrestation dans consultation:', consultationData.lignesPrestation);
            console.log('💊 PatientPrescription dans consultation:', consultationData.prescriptions);

            // Créer l'objet patient à partir des données fusionnées (champs exacts des modèles)
            const patientData: Patient = {
              _id: patientId || consultationData.IdPatient,
              Nom: consultationData.patientInfo?.Nom || '',
              Prenoms: consultationData.patientInfo?.Prenoms || '',
              sexe: consultationData.patientInfo?.sexe,
              Age_partient: consultationData.patientInfo?.Age_partient,
              Contact: consultationData.patientInfo?.Contact,
              Situationgeo: consultationData.patientInfo?.Situationgeo,
              AnteChirurgico: consultationData.patientInfo?.AnteChirurgico,
              AntecedentMedico: consultationData.patientInfo?.AntecedentMedico,
              AnteFamille: consultationData.patientInfo?.AnteFamille,
              AutreAnte: consultationData.patientInfo?.AutreAnte,
              IDPARTIENT: consultationData.IdPatient,
              // Champs exacts du modèle patient
              Code_dossier: consultationData.patientInfo?.Code_dossier,
              Assurance: consultationData.patientInfo?.Assurance,
              Matricule: consultationData.patientInfo?.Matricule
            };

            // Créer l'objet consultation (sans mapping)
            const consultationDataFormatted: Consultation = {
              _id: consultationData._id,
              CodePrestation: consultationData.CodePrestation,
              designationC: consultationData.designationC,
              Date_consulation: consultationData.Date_consulation,
              Température: consultationData.Temperature,
              Tension: consultationData.Tension,
              Glycemie: consultationData.Glycemie,
              TailleCons: consultationData.TailleCons,
              Poids: consultationData.Poids,
              IDPARTIENT: consultationData.IdPatient,
              ExamenClinique: consultationData.ExamenClinique,
              ExamenParaclinique: consultationData.ExamenParaclinique,
              TraitementClinique: consultationData.TraitementClinique,
              ConclusionClinique: consultationData.ConclusionClinique,
              Diagnostic: consultationData.Diagnostic,
              MotifConsultation: consultationData.MotifConsultation,
              Code_dossier: consultationData.Code_dossier,
              Medecin: consultationData.Medecin,
              CodeAffection: consultationData.CodeAffection,
              // Ajouter les données des LignePrestation et PatientPrescription
              lignesPrestation: consultationData.lignesPrestation || [],
              prescriptions: consultationData.prescriptions || []
            };

            setPatient(patientData);
            setConsultation(consultationDataFormatted);

            // Convertir les antécédents depuis les données du patient
            const antecedentsArray: Antecedent[] = [];
            if (patientData.AntecedentMedico) {
              antecedentsArray.push({
                _id: 'medical',
                type: 'medical',
                description: patientData.AntecedentMedico
              });
            }
            if (patientData.AnteChirurgico) {
              antecedentsArray.push({
                _id: 'chirurgical',
                type: 'chirurgical',
                description: patientData.AnteChirurgico
              });
            }
            if (patientData.AnteFamille) {
              antecedentsArray.push({
                _id: 'familial',
                type: 'familial',
                description: patientData.AnteFamille
              });
            }
            if (patientData.AutreAnte) {
              antecedentsArray.push({
                _id: 'autre',
                type: 'autre',
                description: patientData.AutreAnte
              });
            }

            setAntecedents(antecedentsArray);
            setPrescriptions([]); // Pas de prescriptions dans cette API
          } else {
            setError('Aucune donnée trouvée pour cette consultation');
          }
        } else {
          setError('Erreur lors du chargement des données');
        }
      } catch (error) {
        console.error('Erreur:', error);
        setError('Erreur de connexion au serveur');
      } finally {
        setLoading(false);
      }
    };

    if (consultationId || patientId) {
      chargerDonnees();
    } else {
      setLoading(false);
      setError('Aucun identifiant fourni');
    }
  }, [consultationId, patientId]);


  // Fonction pour calculer l'âge
  const calculateAge = (dateOfBirth: Date) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();

    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  // Fonction pour obtenir le badge d'antécédent
  const getAntecedentBadge = (type: string) => {
    const badges = {
      medical: { bg: 'primary', icon: 'bi-heart-pulse', label: 'Médical' },
      chirurgical: { bg: 'danger', icon: 'bi-scissors', label: 'Chirurgical' },
      familial: { bg: 'info', icon: 'bi-people', label: 'Familial' },
      autre: { bg: 'secondary', icon: 'bi-dash-circle', label: 'Autre' },
      allergie: { bg: 'warning', icon: 'bi-exclamation-triangle', label: 'Allergie' }
    };

    const badge = badges[type as keyof typeof badges] || badges.autre;
    return (
      <Badge bg={badge.bg} className="me-2">
        <i className={`bi ${badge.icon} me-1`}></i>
        {badge.label}
      </Badge>
    );
  };

  // Fonction pour obtenir le badge de prescription
  const getPrescriptionBadge = (type: string) => {
    return type === 'medicament'
      ? <Badge bg="success"><i className="bi bi-capsule me-1"></i>Médicament</Badge>
      : <Badge bg="info"><i className="bi bi-clipboard2-pulse me-1"></i>Examen</Badge>;
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-3">Chargement des données pour impression...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          Erreur: {error}
        </div>
      </Container>
    );
  }

  if (!patient || !consultation) {
    return (
      <Container className="py-4">
        <div className="alert alert-warning">
          <i className="bi bi-info-circle me-2"></i>
          Aucune donnée trouvée pour l'impression
        </div>
      </Container>
    );
  }

  return (
    <>
      {/* ===== BOUTONS (non imprimés) ===== */}
      <div className="text-end mb-3 no-print">
        <Button variant="primary" onClick={handlePrint} className="me-2">
          <i className="bi bi-printer me-2"></i>
          Imprimer avec entête
        </Button>
        <Button variant="secondary" onClick={handlePrintWithoutHeader}>
          <i className="bi bi-file-earmark me-2"></i>
          Imprimer sans entête
        </Button>
      </div>

      {/* ===== ZONE IMPRIMABLE ===== */}
      <div id="print-content" style={{
        padding: '10px',
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        backgroundColor: '#ffffff',
        color: '#000000',
        lineHeight: '1.2'
      }}>
        {/* Titre principal */}
        <div style={{
          textAlign: 'center',
          marginBottom: '20px',
          fontWeight: 'bold',
          fontSize: '20px',
          textDecoration: 'underline'
        }}>
          <i className="bi bi-clipboard2-medical me-2"></i>FICHE DE CONSULTATION MÉDICALE
        </div>

        {/* Date */}
        <div style={{
          textAlign: 'center',
          marginBottom: '20px',
          fontSize: '11px',
          color: '#666666'
        }}>
          {new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>

        {/* 1. Infos patient et constantes */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '15px',
          marginBottom: '15px',
          padding: '15px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          {/* Colonnes gauche - Patient */}
          <div>
            <div style={{
              fontWeight: 'bold',
              marginBottom: '8px',
              color: '#495057',
              fontSize: '12px',
              borderBottom: '1px solid #dee2e6',
              paddingBottom: '4px'
            }}>
              <i className="bi bi-person-fill me-2"></i>INFORMATIONS PATIENT
            </div>
            <div style={{ display: 'grid', gap: '4px', fontSize: '12px' }}>
              <div><strong>Nom & Prénoms:</strong> {patient.Nom} {patient.Prenoms}</div>
              <div><strong>Âge:</strong> {patient.Age_partient} ans <strong>Sexe:</strong> {patient.sexe} <strong>Contact:</strong> {patient.Contact}</div>
              <div><strong>Dossier N°:</strong> {patient.Code_dossier}</div>

            </div>
          </div>

          {/* Colonnes centre - Constantes */}
          <div>
            <div style={{
              fontWeight: 'bold',
              marginBottom: '8px',
              color: '#495057',
              fontSize: '12px',
              borderBottom: '1px solid #dee2e6',
              paddingBottom: '4px'
            }}>
              <i className="bi bi-activity me-2"></i>CONSTANTES VITALES
            </div>
            <div style={{ display: 'grid', gap: '4px', fontSize: '12px' }}>
              <div><strong>Température:</strong> {consultation.Température || 'N/A'}°C <strong>Poids:</strong> {consultation.Poids || 'N/A'} kg</div>

              <div><strong>Tension:</strong> {consultation.Tension || 'N/A'} <strong>Glycémie:</strong> {consultation.Glycemie || 'N/A'}</div>
            </div>
          </div>

          {/* Colonnes droite - Médecin */}
          <div>
            <div style={{
              fontWeight: 'bold',
              marginBottom: '8px',
              color: '#495057',
              fontSize: '12px',
              borderBottom: '1px solid #dee2e6',
              paddingBottom: '4px'
            }}>
              <i className="bi bi-person-badge-fill me-2"></i>MÉDECIN PRESCRIPTEUR
            </div>
            <div style={{ display: 'grid', gap: '4px', fontSize: '12px' }}>
            </div>
            <div><strong>{'->'}</strong> {consultation?.Medecin || 'Non spécifié'}</div>

          </div>
        </div>

        {/* Séparateur */}
        <div style={{
          borderBottom: '2px solid #000000',
          margin: '20px 0',
          marginBottom: '15px'
        }}></div>

        {/* Motif de la consultation */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            fontWeight: 'bold',
            fontSize: '14px',
            marginBottom: '10px',
            color: '#2c3e50',
            borderBottom: '1px solid #000000',
            paddingBottom: '5px'
          }}>
            <i className="bi bi-chat-quote-fill me-2"></i>MOTIF DE LA CONSULTATION
          </div>
          <div style={{
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            padding: '5px',
            backgroundColor: '#ffffff',
            fontSize: '11px'
          }}>
            {consultation.MotifConsultation || 'Non spécifié'}
          </div>
        </div>

        {/* Désignation de la consultation */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{
            fontWeight: 'bold',
            padding: '10px',
            fontSize: '20px',
            backgroundColor: '#0fcf559a',
            borderRadius: '5px 5px 0 0',
            textAlign: 'center'
          }}>
            <i className="bi bi-clipboard2-pulse-fill me-2"></i> {consultation.designationC || 'Non spécifié'} - {consultation.CodePrestation || consultation._id}
          </div>
        </div>

        {/* Affection */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{
            fontWeight: 'bold',
            fontSize: '14px',
            marginBottom: '2px',
            color: '#2c3e50',
            borderBottom: '1px solid #000000',
            paddingBottom: '2px'
          }}>
            <i className="bi bi-tag-fill me-2"></i>AFFECTION (CODES CIM-10)
          </div>
          <div style={{
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            padding: '5px',
            backgroundColor: '#ffffff',
            fontSize: '11px'
          }}>
            {consultation.CodeAffection || 'Non spécifié'}
          </div>
        </div>

        {/* Examen Clinique */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{
            fontWeight: 'bold',
            fontSize: '14px',
            marginBottom: '2px',
            color: '#2c3e50',
            borderBottom: '1px solid #000000',
            paddingBottom: '2px'
          }}>
            <i className="bi bi-stethoscope-fill me-2"></i>EXAMEN CLINIQUE
          </div>
          <div style={{
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            padding: '5px',
            backgroundColor: '#ffffff',
            fontSize: '11px',
            whiteSpace: 'pre-line'
          }}>
            {consultation.ExamenClinique || 'Non spécifié'}
          </div>
        </div>

        {/* Examen Paraclinique */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{
            fontWeight: 'bold',
            fontSize: '14px',
            marginBottom: '2px',
            color: '#2c3e50',
            borderBottom: '1px solid #000000',
            paddingBottom: '2px'
          }}>
            <i className="bi bi-microscope-fill me-2"></i>EXAMEN PARACLINIQUE
          </div>
          <div style={{
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            padding: '5px',
            backgroundColor: '#ffffff',
            fontSize: '11px'
          }}>
            {(() => {
              const examensParacliniques = consultation.lignesPrestation?.filter((ligne) =>
                !!ligne.lettreCle && ["K", "KC", "B", "Z", "D"].includes(ligne.lettreCle)
              ) || [];

              return examensParacliniques.length > 0 ? (
                <div>
                  {examensParacliniques
                    .sort((a, b) => (a.ordonnancementAffichage || 0) - (b.ordonnancementAffichage || 0))
                    .map((ligne, index) => (
                      <span key={ligne._id}>
                        {ligne.prestation}
                        {index < examensParacliniques.length - 1 && ' - '}
                      </span>
                    ))}
                </div>
              ) : (
                <div style={{ color: '#666666' }}>Aucun examen paraclinique spécifié</div>
              );
            })()}
          </div>
        </div>

        {/* 6. Traitement */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{
            fontWeight: 'bold',
            fontSize: '14px',
            marginBottom: '2px',
            color: '#2c3e50',
            borderBottom: '1px solid #000000',
            paddingBottom: '2px'
          }}>
            <i className="bi bi-capsule-fill me-2"></i>TRAITEMENT
          </div>
          <div style={{
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            padding: '5px',
            backgroundColor: '#ffffff'
          }}>
            {consultation.prescriptions && consultation.prescriptions.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', margin: '0' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'left', fontSize: '11px' }}>Désignation</th>
                    <th style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'center', fontSize: '11px' }}>Quantité</th>
                    <th style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'left', fontSize: '11px' }}>Posologie</th>
                  </tr>
                </thead>
                <tbody>
                  {consultation.prescriptions.map((prescription) => (
                    <tr key={prescription._id}>
                      <td style={{ border: '1px solid #dee2e6', padding: '8px', fontSize: '10px' }}>
                        <strong>{prescription.nomMedicament}</strong>
                      </td>
                      <td style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'center', fontSize: '10px' }}>
                        {prescription.QteP}
                      </td>
                      <td style={{ border: '1px solid #dee2e6', padding: '8px', fontSize: '10px' }}>
                        {prescription.posologie || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ color: '#666666', fontSize: '11px' }}>Aucun traitement spécifié</div>
            )}
          </div>
        </div>

        {/* 7. Conclusion */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{
            fontWeight: 'bold',
            fontSize: '14px',
            marginBottom: '2px',
            color: '#2c3e50',
            borderBottom: '1px solid #000000',
            paddingBottom: '2px'
          }}>
            <i className="bi bi-clipboard-check-fill me-2"></i>CONCLUSION
          </div>
          <div style={{
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            padding: '5px',
            backgroundColor: '#ffffff',
            fontSize: '11px',
            whiteSpace: 'pre-line'
          }}>
            {consultation.ConclusionClinique || 'Non spécifié'}
          </div>
        </div>

        {/* Pied de page professionnel */}
        <div style={{
          textAlign: 'center',
          marginTop: '30px',
          paddingTop: '15px',
          borderTop: '1px solid #dee2e6',
          fontSize: '10px',
          color: '#666666'
        }}>

          <div>
            Imprimé le: {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })} à {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} par {Utilisateur}
          </div>
        </div>

        {/* Styles CSS pour masquer les boutons à l'impression */}
        <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      </div>
    </>
  );
};
