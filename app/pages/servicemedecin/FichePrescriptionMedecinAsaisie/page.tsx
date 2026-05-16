'use client';
import { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Form, Button, Badge, Alert, Table, Modal, Spinner } from 'react-bootstrap';
import { useRouter } from 'next/navigation';
import PharmacieModalPharmAccueilMedecin from '../PharmacieMedecin/PharmacieModalPharmAccueilMedecin';
import HospitalisationPageMedecin from '../examenhospitalisationMedecin/page';
import PrintFichePrescription from '../MesImpressions/printFichePrescription';
import AvisHospitModal from '../tmedecin/composants/AvisHospit/AvisHospitModal';

interface Patient {
  _id: string;
  Nom: string;
  Prenoms: string;
  Date_naisse: Date;
  sexe: string;
  Contact?: string;
  Code_dossier: string;
  Age_partient?: number;
  Situationgeo?: string;
  Assurance?: string;
  Matricule?: string;
}

interface Antecedent {
  _id: string;
  type: 'medical' | 'chirurgical' | 'familial' | 'autre' | 'allergie';
  description: string;
  date?: string;
}

interface Consultation {
  _id: string;
  temperature?: string;
  poids?: string;
  tension?: string;
  glycemie?: string;
  frequenceCardiaque?: string;
  frequenceRespiratoire?: string;
  MotifConsultation?: string;
  examenClinique?: string;
  codeAffection?: string;
  codePrestation?: string;
  ExamenParaclinique?: string;
  TraitementClinique?: string;
  ConclusionClinique?: string;
  attenteMedecin?: number;
}

interface Prescription {
  _id: string;
  type: 'medicament' | 'examen';
  designation: string;
  posologie?: string;
  duree?: string;
  instructions?: string;
}

export default function FichePrescriptionMedecinAsaisie() {
  const router = useRouter();

  // États pour les données
  const [patient, setPatient] = useState<Patient | null>(null);
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [antecedents, setAntecedents] = useState<Antecedent[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  // États pour les formulaires
  const [showAntecedentModal, setShowAntecedentModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showCIM10Modal, setShowCIM10Modal] = useState(false);
  const [loadingAntecedent, setLoadingAntecedent] = useState(false);
  const [prescriptionType, setPrescriptionType] = useState<'medicament' | 'examen'>('medicament');
  const [antecedentType, setAntecedentType] = useState<'medical' | 'chirurgical' | 'familial' | 'autre' | 'allergie'>('medical');

  // États pour les nouveaux modaux
  const [showPharmacieModal, setShowPharmacieModal] = useState(false);
  const [showExamenModal, setShowExamenModal] = useState(false);
  const [showAvisHospitModal, setShowAvisHospitModal] = useState(false);
  const [avisHospitCount, setAvisHospitCount] = useState(0);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // États pour les nouveaux champs
  const [loadingExamenParaclinique, setLoadingExamenParaclinique] = useState(false);
  const [loadingTraitementClinique, setLoadingTraitementClinique] = useState(false);
  const [examensParacliniques, setExamensParacliniques] = useState<string[]>([]);
  const [traitementsCliniques, setTraitementsCliniques] = useState<string[]>([]);

  // Formulaires
  const [constantesForm, setConstantesForm] = useState({
    temperature: '',
    poids: '',
    tension: '',
    glycemie: '',
    taille: ''
  });

  const [consultationForm, setConsultationForm] = useState({
    MotifConsultation: '',
    examenClinique: '',
    codeAffection: '',
    codePrestation: '',
    ExamenParaclinique: '',
    TraitementClinique: '',
    ConclusionClinique: ''
  });

  const [cim10Codes, setCim10Codes] = useState<string[]>([]);
  const [selectedCim10Codes, setSelectedCim10Codes] = useState<string[]>([]);
  const [cim10Search, setCim10Search] = useState('');
  const [affections, setAffections] = useState<any[]>([]);
  const [loadingAffections, setLoadingAffections] = useState(false);
  const [showNewAffectionForm, setShowNewAffectionForm] = useState(false);
  const [newAffection, setNewAffection] = useState({ lettreCle: '', designation: '' });

  const [antecedentForm, setAntecedentForm] = useState({
    description: '',
    date: ''
  });

  const [prescriptionForm, setPrescriptionForm] = useState({
    designation: '',
    posologie: '',
    duree: '',
    instructions: ''
  });

  // États pour le Code Prestation
  const [consultationLiee, setConsultationLiee] = useState<any>(null);
  const [loadingConsultationLiee, setLoadingConsultationLiee] = useState(false);
  const [errorConsultationLiee, setErrorConsultationLiee] = useState('');

  // Fonction pour rechercher la consultation liée au Code Prestation
  const rechercherConsultationLiee = async (codePrestation: string) => {
    if (!codePrestation.trim()) {
      setConsultationLiee(null);
      setErrorConsultationLiee('');
      return;
    }

    try {
      setLoadingConsultationLiee(true);
      setErrorConsultationLiee('');

      const response = await fetch(`/api/consultation/code?CodePrestation=${encodeURIComponent(codePrestation)}`);

      if (response.ok) {
        const data = await response.json();
        setConsultationLiee(data);

        // Initialiser la fiche avec les informations de la consultation trouvée
        if (data) {
          // Mettre à jour le formulaire de consultation
          setConsultationForm({
            MotifConsultation: data.MotifConsultation || '',
            examenClinique: data.ExamenClinique || '',
            codeAffection: data.CodeAffection || '',
            codePrestation: data.CodePrestation || codePrestation,
            ExamenParaclinique: data.ExamenParaclinique || '',
            TraitementClinique: data.TraitementClinique || '',
            ConclusionClinique: data.ConclusionClinique || ''
          });

          // Mettre à jour les constantes
          setConstantesForm({
            temperature: data.Temperature || '',
            poids: data.Poids || '',
            tension: data.Tension || '',
            glycemie: data.Glycemie || '',
            taille: data.TailleCons || ''
          });

          // Charger les codes CIM-10 si présents
          if (data.CodeAffection) {
            const codes = data.CodeAffection.split(',').map((code: string) => code.trim()).filter((code: string) => code);
            setSelectedCim10Codes(codes);
          }

          // Mettre à jour la consultation actuelle
          setConsultation({
            ...data,
            codePrestation: data.CodePrestation || codePrestation
          });

          // Mettre à jour le patient si disponible
          if (data.IdPatient) {
            const patientData = {
              _id: data.IdPatient._id,
              Nom: data.IdPatient.Nom,
              Prenoms: data.IdPatient.Prenoms,
              Date_naisse: data.IdPatient.Date_naisse || new Date(),
              sexe: data.IdPatient.sexe || '',
              Contact: data.IdPatient.Contact || '',
              Code_dossier: data.IdPatient.Code_dossier || '',
              Age_partient: data.IdPatient.Age_partient || 0,
              Situationgeo: data.IdPatient.Situationgeo || '',
              Assurance: data.IdPatient.Assurance || '',
              Matricule: data.IdPatient.Matricule || ''
            };
            setPatient(patientData);

            // Charger les antécédents du patient
            chargerAntecedentsPatient(data.IdPatient._id);
          }

          // Mettre à jour la consultation actuelle
          setConsultation({
            ...data,
            codePrestation: data.CodePrestation || codePrestation
          });

          // Charger les avis d'hospitalisation pour cette consultation (après mise à jour de l'état)
          setTimeout(() => {
            console.log('🏥 rechercherConsultationLiee - appel chargerAvisHospitCount après timeout');
            chargerAvisHospitCount();
          }, 100);
        }

        setSuccess('Fiche initialisée avec la consultation liée');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Consultation non trouvée');
      }
    } catch (err: any) {
      setErrorConsultationLiee(err.message);
      setConsultationLiee(null);
    } finally {
      setLoadingConsultationLiee(false);
    }
  };

  // Fonction pour la recherche manuelle via le bouton
  const handleRechercheManuelle = () => {
    if (consultationForm.codePrestation.trim()) {
      rechercherConsultationLiee(consultationForm.codePrestation);
    } else {
      setErrorConsultationLiee('Veuillez entrer un Code Prestation');
      setTimeout(() => setErrorConsultationLiee(''), 3000);
    }
  };

  // Fonction pour récupérer les examens paracliniques (lettre clé = "B", "Z", "KC", "D")
  const chargerExamensParacliniques = async (codePrestation: string) => {
    if (!codePrestation) {
      setExamensParacliniques([]);
      return;
    }

    try {
      setLoadingExamenParaclinique(true);
      const response = await fetch(`/api/ligneprestation?CodePrestation=${encodeURIComponent(codePrestation)}`);

      if (response.ok) {
        const result = await response.json();
        const lignes = Array.isArray(result?.data) ? result.data : [];

        // Extraire les examens paracliniques (lettre clé = "B", "Z", "KC", "D")
        const examens = lignes
          .filter((ligne: any) => {
            const lettreCle = ligne.lettreCle;
            return ['B', 'Z', 'KC', 'D'].includes(lettreCle) && ligne.prestation;
          })
          .map((ligne: any) => ligne.prestation);

        console.log('🔬 Examens paracliniques trouvés:', examens);
        setExamensParacliniques(examens);

        // Mettre à jour le formulaire avec les examens trouvés
        setConsultationForm(prev => ({
          ...prev,
          ExamenParaclinique: examens.join('\n')
        }));
      } else {
        console.error('Erreur lors du chargement des examens paracliniques');
        setExamensParacliniques([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des examens paracliniques:', error);
      setExamensParacliniques([]);
    } finally {
      setLoadingExamenParaclinique(false);
    }
  };

  // Fonction pour récupérer les traitements cliniques (médicaments de patientprescription)
  const chargerTraitementsCliniques = async (codePrestation: string) => {
    if (!codePrestation) {
      setTraitementsCliniques([]);
      return;
    }

    try {
      setLoadingTraitementClinique(true);
      const response = await fetch(`/api/patientprescription?CodePrestation=${encodeURIComponent(codePrestation)}`);

      if (response.ok) {
        const data = await response.json();
        const prescriptions = Array.isArray(data) ? data : [];

        // Extraire les médicaments
        const medicaments = prescriptions
          .filter((prescription: any) => prescription.nomMedicament) // Filtrer les médicaments
          .map((prescription: any) => {
            const details = [];
            if (prescription.posologie) details.push(`Posologie: ${prescription.posologie}`);
            if (prescription.QteP) details.push(`Quantité: ${prescription.QteP}`);
            if (prescription.prixUnitaire) details.push(`Prix: ${prescription.prixUnitaire}`);

            return `${prescription.nomMedicament}${details.length > 0 ? ' - ' + details.join(', ') : ''}`;
          });

        console.log('📊 Médicaments trouvés:', medicaments);
        setTraitementsCliniques(medicaments);

        // Mettre à jour le formulaire avec les traitements trouvés
        setConsultationForm(prev => ({
          ...prev,
          TraitementClinique: medicaments.join('\n')
        }));
      } else {
        console.error('Erreur lors du chargement des traitements cliniques');
        setTraitementsCliniques([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des traitements cliniques:', error);
      setTraitementsCliniques([]);
    } finally {
      setLoadingTraitementClinique(false);
    }
  };

  // États pour les messages
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Charger les antécédents d'un patient
  const chargerAntecedentsPatient = async (patientId: string) => {
    try {
      const response = await fetch(`/api/fichePrescriptionMedecin/antecedents?patientId=${patientId}`);

      if (response.ok) {
        const data = await response.json();

        // Convertir les antécédents objet en tableau
        const antecedentsArray: Antecedent[] = [];
        if (data) {
          if (data.antecedentMedico) {
            antecedentsArray.push({
              _id: 'medical',
              type: 'medical',
              description: data.antecedentMedico
            });
          }
          if (data.anteChirurgico) {
            antecedentsArray.push({
              _id: 'chirurgical',
              type: 'chirurgical',
              description: data.anteChirurgico
            });
          }
          if (data.anteFamille) {
            antecedentsArray.push({
              _id: 'familial',
              type: 'familial',
              description: data.anteFamille
            });
          }
          if (data.autreAnte) {
            antecedentsArray.push({
              _id: 'autre',
              type: 'autre',
              description: data.autreAnte
            });
          }
          if (data.AlergiePatient) {
            antecedentsArray.push({
              _id: 'allergies',
              type: 'allergie',
              description: data.AlergiePatient
            });
          }
        }
        setAntecedents(antecedentsArray);
      } else {
        console.error('Erreur lors du chargement des antécédents');
        setAntecedents([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des antécédents:', error);
      setAntecedents([]);
    }
  };

  // Charger le nombre d'avis d'hospitalisation
  const chargerAvisHospitCount = async () => {
    try {
      // Récupérer consultationId depuis l'URL ou depuis l'état consultation
      let consultationId = new URLSearchParams(window.location.search).get('consultationId');

      // Si pas de consultationId dans l'URL, utiliser celui de l'état consultation
      if (!consultationId && consultation?._id) {
        consultationId = consultation._id;
      }

      if (consultationId) {
        const response = await fetch(`/api/avishospit?consultationId=${consultationId}`);
        if (response.ok) {
          const data = await response.json();
          setAvisHospitCount(data.total || 0);
        }
      }
    } catch (error) {
      console.error('🏥 Erreur lors du chargement des avis d\'hospitalisation:', error);
    }
  };

  // Charger les données de la consultation
  useEffect(() => {
    // Ne charger que s'il y a un consultationId dans l'URL
    const consultationId = new URLSearchParams(window.location.search).get('consultationId');

    if (!consultationId) {
      // Pas de consultationId, on attend que le médecin saisisse un codePrestation
      setLoading(false);
      return;
    }

    const chargerFicheConsultation = async () => {
      try {
        setLoading(true);

        const response = await fetch(`/api/fichePrescriptionMedecin?consultationId=${consultationId}`);

        if (response.ok) {
          const data = await response.json();

          // Mettre à jour les états
          setPatient(data.patient || null);
          setConsultation(data.consultation || null);

          // Convertir les antécédents objet en tableau
          const antecedentsArray: Antecedent[] = [];
          if (data.antecedents) {
            if (data.antecedents.antecedentMedico) {
              antecedentsArray.push({
                _id: 'medical',
                type: 'medical',
                description: data.antecedents.antecedentMedico
              });
            }
            if (data.antecedents.anteChirurgico) {
              antecedentsArray.push({
                _id: 'chirurgical',
                type: 'chirurgical',
                description: data.antecedents.anteChirurgico
              });
            }
            if (data.antecedents.anteFamille) {
              antecedentsArray.push({
                _id: 'familial',
                type: 'familial',
                description: data.antecedents.anteFamille
              });
            }
            if (data.antecedents.autreAnte) {
              antecedentsArray.push({
                _id: 'autre',
                type: 'autre',
                description: data.antecedents.autreAnte
              });
            }
            if (data.antecedents.AlergiePatient) {
              antecedentsArray.push({
                _id: 'allergies',
                type: 'allergie',
                description: data.antecedents.AlergiePatient
              });
            }
          }
          setAntecedents(antecedentsArray);

          setPrescriptions(data.prescriptions || []);

          // Pré-remplir les formulaires avec les données existantes
          if (data.consultation) {
            setConstantesForm({
              temperature: data.consultation.temperature || '',
              poids: data.consultation.poids || '',
              tension: data.consultation.tension || '',
              glycemie: data.consultation.glycemie || '',
              taille: data.consultation.taille || ''
            });

            setConsultationForm({
              MotifConsultation: data.consultation.MotifConsultation || '',
              examenClinique: data.consultation.examenClinique || '',
              codeAffection: data.consultation.codeAffection || '',
              codePrestation: data.consultation.codePrestation || data.consultation.CodePrestation || '',
              ExamenParaclinique: data.consultation.ExamenParaclinique || '',
              TraitementClinique: data.consultation.TraitementClinique || '',
              ConclusionClinique: data.consultation.ConclusionClinique || ''
            });

            // Mettre à jour la consultation avec le codePrestation
            setConsultation({
              ...data.consultation,
              codePrestation: data.consultation.codePrestation || data.consultation.CodePrestation || ''
            });

            // Charger les codes CIM-10 existants
            if (data.consultation.codeAffection) {
              const codes = data.consultation.codeAffection.split(',').map((code: string) => code.trim()).filter((code: string) => code);
              setSelectedCim10Codes(codes);
            }

            // Charger les examens paracliniques et traitements cliniques
            const codePrestationToLoad = data.consultation.codePrestation || data.consultation.CodePrestation;
            if (codePrestationToLoad) {
              chargerExamensParacliniques(codePrestationToLoad);
              chargerTraitementsCliniques(codePrestationToLoad);
            }
          }
        } else {
          throw new Error('Erreur lors du chargement des données');
        }
      } catch (err: any) {
        setError(err.message);
        setTimeout(() => setError(''), 5000);
      } finally {
        setLoading(false);
      }
    };

    chargerFicheConsultation();
    chargerAvisHospitCount();
  }, []);

  // Mettre à jour le compteur d'avis d'hospitalisation lorsque le modal est fermé
  useEffect(() => {
    if (!showAvisHospitModal) {
      chargerAvisHospitCount();
    }
  }, [showAvisHospitModal]);

  // Recharger les avis d'hospitalisation quand la consultation change
  useEffect(() => {
    if (consultation?._id) {
      chargerAvisHospitCount();
    }
  }, [consultation?._id]);

  // Fonctions utilitaires pour les cartes dynamiques
  const hasConstantesData = () => {
    return Object.values(constantesForm).some(value => value.trim() !== '');
  };

  const getConstantesCount = () => {
    return Object.values(constantesForm).filter(value => value.trim() !== '').length;
  };

  const renderConstanteField = (label: string, field: string, value: string, placeholder: string, icon: string) => {
    const indice = getIndiceConstante(value, field as 'temperature' | 'tension' | 'glycemie' | 'poids');

    return (
      <Col md={6} className="mb-3">
        <Form.Group>
          <Form.Label className="small">
            <i className={`bi bi-${icon} me-1`}></i>
            {label}
            {getBadgeIndice(indice)}
          </Form.Label>
          <Form.Control
            type="text"
            value={value}
            onChange={(e) => setConstantesForm({ ...constantesForm, [field]: e.target.value })}
            placeholder={placeholder}
            className={indice?.niveau === 'danger' ? 'border-danger' : indice?.niveau === 'warning' ? 'border-warning' : ''}
          />
          {indice && (
            <small className={`text-${indice.niveau === 'danger' ? 'danger' : indice.niveau === 'warning' ? 'warning' : 'success'} mt-1 d-block`}>
              <i className={`bi ${indice.icone} me-1`}></i>
              {indice.message}
            </small>
          )}
        </Form.Group>
      </Col>
    );
  };

  const hasConsultationData = () => {
    return Object.values(consultationForm).some(value => value.trim() !== '');
  };

  const getConsultationCount = () => {
    return Object.values(consultationForm).filter(value => value.trim() !== '').length;
  };

  const hasPrescriptionData = () => {
    return prescriptions.length > 0;
  };

  const getPrescriptionCount = () => {
    return prescriptions.length;
  };

  const chargerAffections = async () => {
    try {
      setLoadingAffections(true);
      const response = await fetch('/api/affections');
      if (response.ok) {
        const data = await response.json();
        setAffections(data);
      } else {
        console.error('Erreur lors du chargement des affections');
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoadingAffections(false);
    }
  };

  const creerAffection = async () => {
    try {
      if (!newAffection.lettreCle.trim() || !newAffection.designation.trim()) {
        setError('La lettre clé et la désignation sont requises');
        setTimeout(() => setError(''), 3000);
        return;
      }

      const response = await fetch('/api/affections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAffection)
      });

      if (response.ok) {
        const createdAffection = await response.json();
        setAffections([...affections, createdAffection]);
        setNewAffection({ lettreCle: '', designation: '' });
        setShowNewAffectionForm(false);
        setSuccess('Affection créée avec succès');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création de l\'affection');
      }
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(''), 5000);
    }
  };

  // Charger les affections à l'ouverture du modal
  useEffect(() => {
    if (showCIM10Modal) {
      chargerAffections();
    }
  }, [showCIM10Modal]);

  const calculerAge = (dateNaissance: string) => {
    const naissance = new Date(dateNaissance);
    const aujourdHui = new Date();
    const age = aujourdHui.getFullYear() - naissance.getFullYear();
    const mois = aujourdHui.getMonth() - naissance.getMonth();

    if (mois < 0 || (mois === 0 && aujourdHui.getDate() < naissance.getDate())) {
      return age - 1;
    }

    return age;
  };

  const getAntecedentBadge = (type: string) => {
    switch (type) {
      case 'medical':
        return <Badge bg="info">Médical</Badge>;
      case 'chirurgical':
        return <Badge bg="warning">Chirurgical</Badge>;
      case 'familial':
        return <Badge bg="success">Familial</Badge>;
      case 'autre':
        return <Badge bg="primary">Autre</Badge>;
      case 'allergie':
        return <Badge bg="danger">Allergie</Badge>;
      default:
        return <Badge bg="secondary">Inconnu</Badge>;
    }
  };

  const getPrescriptionBadge = (type: string) => {
    switch (type) {
      case 'medicament':
        return <Badge bg="primary">Médicament</Badge>;
      case 'examen':
        return <Badge bg="info">Examen</Badge>;
      default:
        return <Badge bg="secondary">Inconnu</Badge>;
    }
  };

  // Fonctions de gestion
  // Fonction pour calculer l'indice des constantes
  const getIndiceConstante = (valeur: string, type: 'temperature' | 'tension' | 'glycemie' | 'poids') => {
    if (!valeur) return null;

    const numValeur = parseFloat(valeur.replace(',', '.'));
    if (isNaN(numValeur)) return null;

    switch (type) {
      case 'temperature':
        if (numValeur > 39 || numValeur < 35) return { niveau: 'danger', message: 'Température critique', icone: 'bi-exclamation-triangle-fill' };
        if (numValeur > 38 || numValeur < 36) return { niveau: 'warning', message: 'Température anormale', icone: 'bi-exclamation-circle-fill' };
        return { niveau: 'success', message: 'Température normale', icone: 'bi-check-circle-fill' };

      case 'tension':
        const tensionValues = valeur.split('/').map(v => parseFloat(v.trim()));
        if (tensionValues.length >= 2) {
          const [systolique, diastolique] = tensionValues;
          if (systolique > 160 || systolique < 90 || diastolique > 100 || diastolique < 60) {
            return { niveau: 'danger', message: 'Tension critique', icone: 'bi-exclamation-triangle-fill' };
          }
          if (systolique > 140 || systolique < 100 || diastolique > 90 || diastolique < 70) {
            return { niveau: 'warning', message: 'Tension anormale', icone: 'bi-exclamation-circle-fill' };
          }
          return { niveau: 'success', message: 'Tension normale', icone: 'bi-check-circle-fill' };
        }
        return null;

      case 'glycemie':
        if (numValeur > 2.5 || numValeur < 0.6) return { niveau: 'danger', message: 'Glycémie critique', icone: 'bi-exclamation-triangle-fill' };
        if (numValeur > 1.5 || numValeur < 0.8) return { niveau: 'warning', message: 'Glycémie anormale', icone: 'bi-exclamation-circle-fill' };
        return { niveau: 'success', message: 'Glycémie normale', icone: 'bi-check-circle-fill' };

      case 'poids':
        // Indice de masse corporelle approximatif (en supposant une taille moyenne de 1.70m)
        const imc = numValeur / (1.70 * 1.70);
        if (imc > 30) return { niveau: 'warning', message: 'Surpoids/Obésité', icone: 'bi-exclamation-circle-fill' };
        if (imc < 18.5) return { niveau: 'warning', message: 'Insuffisance pondérale', icone: 'bi-exclamation-circle-fill' };
        return { niveau: 'success', message: 'Poids normal', icone: 'bi-check-circle-fill' };

      default:
        return null;
    }
  };

  const getBadgeIndice = (indice: any) => {
    if (!indice) return null;

    const variantMap = {
      danger: 'danger' as const,
      warning: 'warning' as const,
      success: 'success' as const
    };

    const variant = variantMap[indice.niveau as keyof typeof variantMap] || 'secondary';

    return (
      <Badge bg={variant} className="ms-2" title={indice.message}>
        <i className={`bi ${indice.icone} me-1`}></i>
        {indice.niveau === 'danger' ? 'Critique' : indice.niveau === 'warning' ? 'Anormal' : 'Normal'}
      </Badge>
    );
  };

  const sauvegarderConstantes = async () => {
    try {
      const consultationId = new URLSearchParams(window.location.search).get('consultationId');
      const codePrestation = consultationForm.codePrestation;

      // Utiliser l'ID MongoDB de la consultation si disponible, sinon le codePrestation
      const idConsultation = consultation?._id || consultationId || codePrestation;

      if (!idConsultation) {
        setError('ID de consultation manquant');
        setTimeout(() => setError(''), 3000);
        return;
      }

      // Validation qu'au moins une constante est remplie
      const hasAnyConstante = Object.values(constantesForm).some(value => value.trim() !== '');
      if (!hasAnyConstante) {
        setError('Veuillez remplir au moins une constante vitale');
        setTimeout(() => setError(''), 3000);
        return;
      }

      const response = await fetch('/api/fichePrescriptionMedecin/constantes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          consultationId: idConsultation, // Utiliser l'ID MongoDB ou codePrestation
          constantes: {
            temperature: constantesForm.temperature,
            poids: constantesForm.poids,
            tension: constantesForm.tension,
            glycemie: constantesForm.glycemie,
            taille: constantesForm.taille || ''
          }
        })
      });

      if (response.ok) {
        setSuccess('Constantes sauvegardées avec succès');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la sauvegarde des constantes');
      }
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(''), 5000);
    }
  };

  const sauvegarderConsultation = async () => {
    try {
      const consultationId = new URLSearchParams(window.location.search).get('consultationId');
      const codePrestation = consultationForm.codePrestation;

      // Pour FichePrescriptionMedecinAsaisie, on utilise le codePrestation
      if (!codePrestation) {
        setError('Code Prestation manquant');
        setTimeout(() => setError(''), 3000);
        return;
      }

      if (!consultationForm.MotifConsultation.trim()) {
        setError('Le motif de consultation est requis');
        setTimeout(() => setError(''), 3000);
        return;
      }

      if (!consultationForm.ConclusionClinique.trim()) {
        setError('La conclusion clinique est requise');
        setTimeout(() => setError(''), 3000);
        return;
      }

      const response = await fetch('/api/fichePrescriptionMedecin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          consultationId: consultationId, // Garder pour compatibilité
          codePrestation: codePrestation, // Utiliser codePrestation comme identifiant principal
          MotifConsultation: consultationForm.MotifConsultation,
          examenClinique: consultationForm.examenClinique,
          codeAffection: selectedCim10Codes.join(', '),
          ExamenParaclinique: consultationForm.ExamenParaclinique,
          TraitementClinique: consultationForm.TraitementClinique,
          ConclusionClinique: consultationForm.ConclusionClinique,
          diagnostic: 'Consultation en cours' // Diagnostic par défaut
        })
      });

      if (response.ok) {
        setSuccess('Consultation sauvegardée avec succès');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la sauvegarde de la consultation');
      }
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(''), 5000);
    }
  };

  const enregistrerFicheComplete = async () => {
    try {
      setLoading(true);
      const consultationId = new URLSearchParams(window.location.search).get('consultationId');
      const codePrestation = consultationForm.codePrestation;

      if (!codePrestation && !consultationId) {
        setError('ID de consultation ou Code Prestation manquant');
        setTimeout(() => setError(''), 3000);
        return;
      }

      // 1. Sauvegarder les constantes vitales si présentes
      const hasConstantes = Object.values(constantesForm).some(value => value.trim() !== '');
      if (hasConstantes) {
        await sauvegarderConstantes();
      }

      // 2. Sauvegarder la consultation
      await sauvegarderConsultation();

      // 3. Mettre à jour attenteMedecin = 2
      const updateResponse = await fetch('/api/consultation/updateAttente', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          consultationId,
          codePrestation,
          attenteMedecin: 2
        })
      });

      if (updateResponse.ok) {
        setSuccess('Fiche enregistrée avec succès ! Statut mis à jour.');
        setTimeout(() => setSuccess(''), 5000);

        // Mettre à jour l'état local
        if (consultation) {
          setConsultation({ ...consultation, attenteMedecin: 2 });
        }
      } else {
        throw new Error('Erreur lors de la mise à jour du statut');
      }

    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'enregistrement complet de la fiche');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const ajouterAntecedent = async () => {
    try {
      setLoadingAntecedent(true);
      const patientId = patient?._id;

      if (!patientId) {
        setError('ID patient non trouvé');
        return;
      }

      if (!antecedentForm.description.trim()) {
        setError('La description de l\'antécédent est requise');
        return;
      }

      const response = await fetch('/api/fichePrescriptionMedecin/antecedents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId,
          type: antecedentType,
          antecedents: antecedentForm
        })
      });

      if (response.ok) {
        const result = await response.json();

        // Créer un nouvel antécédent pour le tableau
        const newAntecedent = {
          _id: `${antecedentType}_${Date.now()}`,
          type: antecedentType,
          description: antecedentForm.description,
          date: antecedentForm.date || undefined
        };

        // Ajouter ou mettre à jour l'antécédent dans le tableau
        setAntecedents(prevAntecedents => {
          const filtered = prevAntecedents.filter(a => a.type !== antecedentType);
          return [...filtered, newAntecedent];
        });

        setAntecedentForm({ description: '', date: '' });
        setShowAntecedentModal(false);
        setSuccess('Antécédent ajouté avec succès');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'ajout de l\'antécédent');
      }
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoadingAntecedent(false);
    }
  };

  const supprimerAntecedent = async (antecedentId: string) => {
    try {
      const consultationId = new URLSearchParams(window.location.search).get('consultationId');
      const patientId = patient?._id;

      if (!consultationId && !patientId) {
        setError('ID de consultation ou de patient requis');
        return;
      }

      // Construire l'URL avec les paramètres requis
      const url = new URL(`/api/fichePrescriptionMedecin/antecedents/${antecedentId}`, window.location.origin);
      if (patientId) {
        url.searchParams.set('patientId', patientId);
      }
      if (consultationId) {
        url.searchParams.set('consultationId', consultationId);
      }

      const response = await fetch(url.toString(), {
        method: 'DELETE'
      });

      if (response.ok) {
        setAntecedents(antecedents.filter(a => a._id !== antecedentId));
        setSuccess('Antécédent supprimé avec succès');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression');
      }
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(''), 5000);
    }
  };

  const ajouterPrescription = async () => {
    try {
      const consultationId = new URLSearchParams(window.location.search).get('consultationId');

      // Validation des champs
      if (!prescriptionForm.designation.trim()) {
        setError('La désignation est requise');
        setTimeout(() => setError(''), 3000);
        return;
      }

      if (prescriptionType === 'medicament' && (!prescriptionForm.posologie.trim() || !prescriptionForm.duree.trim())) {
        setError('La posologie et la durée sont requises pour les médicaments');
        setTimeout(() => setError(''), 3000);
        return;
      }

      const response = await fetch('/api/fichePrescriptionMedecin/prescriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          consultationId,
          type: prescriptionType,
          designation: prescriptionForm.designation,
          posologie: prescriptionForm.posologie,
          duree: prescriptionForm.duree,
          instructions: prescriptionForm.instructions
        })
      });

      if (response.ok) {
        const nouvellePrescription = await response.json();
        setPrescriptions([...prescriptions, nouvellePrescription]);
        setPrescriptionForm({ designation: '', posologie: '', duree: '', instructions: '' });
        setShowPrescriptionModal(false);
        setSuccess('Prescription ajoutée avec succès');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'ajout de la prescription');
      }
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(''), 5000);
    }
  };

  const supprimerPrescription = async (prescriptionId: string) => {
    try {
      const response = await fetch(`/api/fichePrescriptionMedecin/prescriptions/${prescriptionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setPrescriptions(prescriptions.filter(p => p._id !== prescriptionId));
        setSuccess('Prescription supprimée avec succès');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error('Erreur lors de la suppression');
      }
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(''), 5000);
    }
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" className="me-2" />
          Chargement de la fiche consultation...
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* En-tête professionnel sur une seule ligne */}
      <Card className="mb-4 shadow-sm border-0">
        <Card.Body className="p-3">
          <Row className="align-items-center g-3">
            {/* Colonne gauche: Code Prestation */}
            <Col md="5">
              <div className="d-flex flex-column">
                <Form.Label className="small text-muted fw-semibold mb-2">
                  <i className="bi bi-upc-scan me-1"></i>
                  Code Prestation
                </Form.Label>
                <div className="d-flex gap-2">
                  <Form.Control
                    type="text"
                    value={consultationForm.codePrestation}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setConsultationForm({ ...consultationForm, codePrestation: newValue });
                    }}
                    placeholder="Ex: CONS001"
                    className={consultationForm.codePrestation.trim() ? 'border-warning' : ''}
                    style={{ flex: 1 }}
                  />
                  <Button
                    variant="primary"
                    onClick={handleRechercheManuelle}
                    disabled={loadingConsultationLiee}
                    title="Rechercher la consultation liée"
                    className="rounded-pill px-3"
                  >
                    {loadingConsultationLiee ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <i className="bi bi-search"></i>
                    )}
                  </Button>
                </div>
                {errorConsultationLiee && (
                  <small className="text-danger mt-1 d-block">
                    <i className="bi bi-exclamation-triangle me-1"></i>
                    {errorConsultationLiee}
                  </small>
                )}
              </div>
            </Col>

            {/* Colonne droite: Boutons retour et enregistrement */}
            <Col md="7" className="text-end">
              <div className="d-flex gap-2 justify-content-end align-items-start">
                <Button
                  variant="success"
                  onClick={enregistrerFicheComplete}
                  disabled={loading}
                  title="Enregistrer la fiche de prescription"
                  className="rounded-pill px-3"
                >
                  <i className="bi bi-save me-2"></i>
                  {loading ? 'Enregistrement...' : 'Enregistrer la fiche'}
                </Button>
                <Button
                  variant="danger"
                  className="rounded-pill px-3"
                  onClick={() => setShowPrintModal(true)}
                  disabled={!patient && !consultation}
                  title="Imprimer la fiche de prescription"                    >
                  <i className="bi bi-printer me-1"></i>
                  Imprimer la fiche de prescription
                </Button>
                <Button
                  variant="outline-primary"
                  onClick={() => router.back()}
                  className="rounded-pill px-3"
                >
                  <i className="bi bi-arrow-left me-2"></i>
                  Retour
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess('')}>
          <i className="bi bi-check-circle-fill me-2"></i>
          {success}
        </Alert>
      )}

      {/* Afficher la fiche seulement si une consultation est trouvée */}
      {(patient || consultationLiee) ? (
        <>
          {/* En-tête patient - Design professionnel */}
          <Card className="mb-4 shadow-sm border-0">
            <Card.Header className="bg-gradient-primary text-dark">
              <div className="d-flex align-items-center">
                FICHE DE CONSULTATION
                <div className="rounded-circle bg-white text-primary p-3 me-3">
                  <i className="bi bi-person-fill fs-4"></i>
                </div>
                <div>
                  <div className="d-flex align-items-center flex-wrap">
                    <h4 className="mb-0 me-3">
                      {(() => {
                        const nom = patient?.Nom || consultationLiee?.IdPatient?.Nom || consultationLiee?.PatientP || 'Patient';
                        const prenoms = patient?.Prenoms || consultationLiee?.IdPatient?.Prenoms || '';
                        return `${nom} ${prenoms}`.trim();
                      })()}
                    </h4>
                    <div className="text-muted small">
                      <span className="me-3">
                        <i className="bi bi-person-fill me-1"></i>
                        {(() => {
                          const sexe = patient?.sexe || consultationLiee?.IdPatient?.sexe;
                          if (sexe) {
                            return sexe.toUpperCase() === 'M' ? 'Homme' : sexe.toUpperCase() === 'F' ? 'Femme' : sexe;
                          }
                          return 'N/C';
                        })()}
                      </span>
                      <span className="me-3">
                        <i className="bi bi-calendar3 me-1"></i>
                        {(() => {
                          try {
                            const dateNaiss = patient?.Date_naisse || consultationLiee?.IdPatient?.Date_naisse;
                            if (dateNaiss) {
                              return `${calculerAge(dateNaiss)} ans`;
                            }
                            return 'Âge N/C';
                          } catch (error) {
                            console.error('Erreur calcul âge:', error);
                            return 'Âge err.';
                          }
                        })()}
                      </span>
                      <span className="me-3">
                        <i className="bi bi-folder2-open me-1"></i>
                        {(() => {
                          const codeDossier = patient?.Code_dossier || consultationLiee?.IdPatient?.Code_dossier || consultationLiee?.Code_dossier;
                          return codeDossier || 'N/C';
                        })()}
                      </span>
                      <span>
                        <i className="bi bi-telephone me-1"></i>
                        {(() => {
                          const tel = patient?.Contact || consultationLiee?.IdPatient?.Contact || consultationLiee?.IdPatient?.Telephone;
                          return tel || 'N/C';
                        })()}
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            </Card.Header>
          </Card>

          {/* Section principale - Organisation en colonnes */}
          <Row className="g-4 align-items-start">
            {/* Colonne gauche - Antécédents et Constantes */}
            <Col lg={6}>
              {/* Antécédents - Carte dynamique */}
              <Card className={`shadow-sm border-0 mb-4 ${antecedents.length > 0 ? 'border-success' : 'border-light'}`}>
                <Card.Header className={`${antecedents.length > 0 ? 'bg-success' : 'bg-light'} ${antecedents.length > 0 ? 'text-white' : 'text-dark'} d-flex justify-content-between align-items-center py-3`}>
                  <div className="d-flex align-items-center">
                    <div className={`rounded-circle ${antecedents.length > 0 ? 'bg-white text-success' : 'bg-success text-white'} p-2 me-3`}>
                      <i className={`bi ${antecedents.length > 0 ? 'bi-clock-history' : 'bi-clock'} fs-5`}></i>
                    </div>
                    <div>
                      <h5 className="mb-0">Antécédents</h5>
                      <small className={`${antecedents.length > 0 ? 'opacity-75' : 'opacity-100'}`}>
                        {antecedents.length > 0 ? `${antecedents.length} enregistré${antecedents.length > 1 ? 's' : ''}` : 'Aucun antécédent'}
                      </small>
                    </div>
                  </div>
                  <Button
                    variant={antecedents.length > 0 ? "light" : "success"}
                    size="sm"
                    onClick={() => setShowAntecedentModal(true)}
                    className="rounded-pill"
                  >
                    <i className="bi bi-plus-circle me-1"></i>
                    {antecedents.length > 0 ? 'Ajouter' : 'Commencer'}
                  </Button>
                </Card.Header>
                <Card.Body className="p-3">
                  {antecedents.length === 0 ? (
                    <div className="text-center py-4">
                      <i className="bi bi-clock-history text-muted fs-1 mb-3"></i>
                      <p className="text-muted mb-0">Aucun antécédent enregistré</p>
                      <small className="text-muted">Cliquez sur "Commencer" pour ajouter le premier antécédent</small>
                    </div>
                  ) : (
                    <>
                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center">
                          <small className="text-muted">
                            <i className="bi bi-info-circle me-1"></i>
                            {antecedents.length} type{antecedents.length > 1 ? 's' : ''} d'antécédents
                          </small>
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => setShowAntecedentModal(true)}
                          >
                            <i className="bi bi-plus me-1"></i>
                            Ajouter un type
                          </Button>
                        </div>
                      </div>
                      <div className="table-responsive">
                        <Table striped hover className="mb-0">
                          <thead>
                            <tr>
                              <th className="border-0">Type</th>
                              <th className="border-0">Description</th>
                              <th className="border-0">Date</th>
                              <th className="border-0 text-end">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {antecedents.map((antecedent, index) => (
                              <tr key={antecedent._id} className={index === 0 ? 'table-success' : ''}>
                                <td className="align-middle">{getAntecedentBadge(antecedent.type)}</td>
                                <td className="align-middle">
                                  <div>
                                    <strong>{antecedent.description}</strong>
                                    {antecedent.date && (
                                      <small className="text-muted d-block mt-1">
                                        <i className="bi bi-calendar3 me-1"></i>
                                        {new Date(antecedent.date).toLocaleDateString('fr-FR')}
                                      </small>
                                    )}
                                  </div>
                                </td>
                                <td className="align-middle">
                                  {antecedent.date ? (
                                    <Badge bg="light" text="dark">
                                      {new Date(antecedent.date).toLocaleDateString('fr-FR')}
                                    </Badge>
                                  ) : (
                                    <Badge bg="secondary">N/A</Badge>
                                  )}
                                </td>
                                <td className="align-middle text-end">
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => supprimerAntecedent(antecedent._id)}
                                    className="rounded-circle"
                                    title="Supprimer cet antécédent"
                                  >
                                    <i className="bi bi-trash"></i>
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    </>
                  )}
                </Card.Body>
              </Card>

              {/* Consultation - Carte dynamique */}
              <Card className={`mb-4 shadow-sm border-0 ${hasConsultationData() ? 'border-warning' : 'border-light'}`}>
                <Card.Header className={`${hasConsultationData() ? 'bg-warning' : 'bg-light'} ${hasConsultationData() ? 'text-dark' : 'text-dark'} d-flex justify-content-between align-items-center py-3`}>
                  <div className="d-flex align-items-center">
                    <div className={`rounded-circle ${hasConsultationData() ? 'bg-dark text-warning' : 'bg-warning text-dark'} p-2 me-3`}>
                      <i className={`bi ${hasConsultationData() ? 'bi-clipboard2-pulse-fill' : 'bi-clipboard2-pulse'} fs-5`}></i>
                    </div>
                    <div>
                      <h5 className="mb-0">Consultation</h5>
                      <small className={`${hasConsultationData() ? 'opacity-75' : 'opacity-100'}`}>
                        {hasConsultationData() ? `${getConsultationCount()} champ${getConsultationCount() > 1 ? 's' : ''} rempli${getConsultationCount() > 1 ? 's' : ''}` : 'Consultation vide'}
                      </small>
                    </div>
                  </div>
                  <Button
                    variant={hasConsultationData() ? "dark" : "warning"}
                    size="sm"
                    onClick={sauvegarderConsultation}
                    className="rounded-pill"
                  >
                    <i className="bi bi-check-circle me-1"></i>
                    {hasConsultationData() ? 'Mettre à jour' : 'Commencer'}
                  </Button>
                </Card.Header>
                <Card.Body className="p-3">
                  {hasConsultationData() ? (
                    <>
                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center">
                          <small className="text-muted">
                            <i className="bi bi-info-circle me-1"></i>
                            {getConsultationCount()} section{getConsultationCount() > 1 ? 's' : ''} complétée{getConsultationCount() > 1 ? 's' : ''}
                          </small>
                          <Badge bg="warning" text="dark">
                            <i className="bi bi-pencil-square me-1"></i>
                            En cours
                          </Badge>
                        </div>
                      </div>
                      <Form.Group className="mb-3">
                        <Form.Label className={`${consultationForm.MotifConsultation.trim() ? 'text-dark' : 'text-muted'} small`}>
                          <i className="bi bi-chat-quote me-1"></i>
                          Motif de Consultation
                        </Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={consultationForm.MotifConsultation}
                          onChange={(e) => setConsultationForm({ ...consultationForm, MotifConsultation: e.target.value })}
                          placeholder="Décrire le motif de la consultation..."
                          className={consultationForm.MotifConsultation.trim() ? 'border-warning' : ''}
                        />
                        {consultationForm.MotifConsultation.trim() && (
                          <small className="text-muted mt-1 d-block">
                            <i className="bi bi-check-circle-fill text-success me-1"></i>
                            {consultationForm.MotifConsultation.length} caractères
                          </small>
                        )}
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label className={`${consultationForm.examenClinique.trim() ? 'text-dark' : 'text-muted'} small`}>
                          <i className="bi bi-stethoscope me-1"></i>
                          Examen Clinique
                        </Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={4}
                          value={consultationForm.examenClinique}
                          onChange={(e) => setConsultationForm({ ...consultationForm, examenClinique: e.target.value })}
                          placeholder="Résultats de l'examen clinique..."
                          className={consultationForm.examenClinique.trim() ? 'border-warning' : ''}
                        />
                        {consultationForm.examenClinique.trim() && (
                          <small className="text-muted mt-1 d-block">
                            <i className="bi bi-check-circle-fill text-success me-1"></i>
                            {consultationForm.examenClinique.length} caractères
                          </small>
                        )}
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label className="small">
                          <i className="bi bi-tag me-1"></i>
                          Codes d'Affection (CIM-10)
                        </Form.Label>
                        <div className="d-flex gap-2">
                          <Form.Control
                            type="text"
                            value={selectedCim10Codes.join(', ')}
                            readOnly
                            placeholder="Sélectionner les codes CIM-10..."
                            className="flex-grow-1"
                          />
                          <Button
                            variant="outline-primary"
                            onClick={() => setShowCIM10Modal(true)}
                          >
                            <i className="bi bi-search me-1"></i>
                            CIM-10
                          </Button>
                        </div>
                        {selectedCim10Codes.length > 0 && (
                          <div className="mt-2">
                            {selectedCim10Codes.map((code, index) => (
                              <Badge key={index} bg="info" className="me-1 mb-1">
                                {code}
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="text-white p-0 ms-1"
                                  onClick={() => setSelectedCim10Codes(prev => prev.filter((_, i) => i !== index))}
                                >
                                  <i className="bi bi-x"></i>
                                </Button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </Form.Group>

                      {/* Conclusion Clinique */}
                      <Form.Group className="mb-3">
                        <Form.Label className={`${consultationForm.ConclusionClinique.trim() ? 'text-dark' : 'text-muted'} small`}>
                          <i className="bi bi-clipboard-check me-1"></i>
                          Conclusion Clinique
                          <span className="text-danger ms-1">*</span>
                        </Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={consultationForm.ConclusionClinique}
                          onChange={(e) => setConsultationForm({ ...consultationForm, ConclusionClinique: e.target.value })}
                          placeholder="Conclusion et diagnostic final..."
                          className={consultationForm.ConclusionClinique.trim() ? 'border-success' : ''}
                        />
                        {consultationForm.ConclusionClinique.trim() && (
                          <small className="text-muted mt-1 d-block">
                            <i className="bi bi-check-circle-fill text-success me-1"></i>
                            {consultationForm.ConclusionClinique.length} caractères
                          </small>
                        )}
                        {!consultationForm.ConclusionClinique.trim() && (
                          <small className="text-danger mt-1 d-block">
                            <i className="bi bi-exclamation-triangle me-1"></i>
                            La conclusion clinique est obligatoire
                          </small>
                        )}
                      </Form.Group>
                    </>
                  ) : (
                    <div className="text-center py-5">
                      <i className="bi bi-clipboard2-pulse text-muted fs-1 mb-4"></i>
                      <h5 className="text-muted mb-3">Consultation non commencée</h5>
                      <p className="text-muted mb-4">Commencez par remplir les informations de la consultation</p>
                      <Button
                        variant="warning"
                        size="lg"
                        onClick={() => {
                          setConsultationForm({
                            MotifConsultation: 'Patient consulte pour...',
                            examenClinique: 'Examen clinique en cours...',
                            codeAffection: '',
                            codePrestation: '',
                            ExamenParaclinique: '',
                            TraitementClinique: '',
                            ConclusionClinique: ''
                          });
                        }}
                        className="rounded-pill px-4"
                      >
                        <i className="bi bi-pencil-square me-2"></i>
                        Commencer la consultation
                      </Button>
                    </div>
                  )}
                </Card.Body>
              </Card>


            </Col>

            {/* Colonne droite - Consultation et Prescriptions */}
            <Col lg={6}>
              {/* Constantes Vitales - Carte dynamique */}
              <Card className={`shadow-sm border-0 ${hasConstantesData() ? 'border-info' : 'border-light'}`}>
                <Card.Header className={`${hasConstantesData() ? 'bg-info' : 'bg-light'} ${hasConstantesData() ? 'text-white' : 'text-dark'} d-flex justify-content-between align-items-center py-3`}>
                  <div className="d-flex align-items-center">
                    <div className={`rounded-circle ${hasConstantesData() ? 'bg-white text-info' : 'bg-info text-white'} p-2 me-3`}>
                      <i className={`bi ${hasConstantesData() ? 'bi-activity' : 'bi-activity'} fs-5`}></i>
                    </div>
                    <div>
                      <h5 className="mb-0">Constantes Vitales</h5>
                      <small className={`${hasConstantesData() ? 'opacity-75' : 'opacity-100'}`}>
                        {hasConstantesData() ? `${getConstantesCount()} enregistrée${getConstantesCount() > 1 ? 's' : ''}` : 'Aucune constante'}
                      </small>
                    </div>
                  </div>
                  <Button
                    variant={hasConstantesData() ? "light" : "info"}
                    size="sm"
                    onClick={sauvegarderConstantes}
                    className="rounded-pill"
                  >
                    <i className="bi bi-check-circle me-1"></i>
                    {hasConstantesData() ? 'Mettre à jour' : 'Commencer'}
                  </Button>
                </Card.Header>
                <Card.Body className="p-3">
                  {hasConstantesData() ? (
                    <Row className="g-3">
                      {renderConstanteField('Température (°C)', 'temperature', constantesForm.temperature, '37.5', 'thermometer-half')}
                      {renderConstanteField('Poids (kg)', 'poids', constantesForm.poids, '70', 'speedometer2')}
                      {renderConstanteField('Tension (mmHg)', 'tension', constantesForm.tension, '120/80', 'heart-pulse')}
                      {renderConstanteField('Glycémie (g/L)', 'glycemie', constantesForm.glycemie, '1.05', 'droplet')}
                      {renderConstanteField('Taille (cm)', 'taille', constantesForm.taille, '175', 'rulers')}
                    </Row>
                  ) : (
                    <div className="text-center py-5">
                      <i className="bi bi-activity text-muted fs-1 mb-4"></i>
                      <h5 className="text-muted mb-3">Aucune constante vitale</h5>
                      <p className="text-muted mb-4">Commencez par enregistrer les signes vitaux du patient</p>
                      <Button
                        variant="info"
                        size="lg"
                        onClick={() => {
                          setConstantesForm({
                            temperature: '37.5',
                            poids: '70',
                            tension: '120/80',
                            glycemie: '1.05',
                            taille: '175'
                          });
                        }}
                        className="rounded-pill px-4"
                      >
                        <i className="bi bi-plus-circle me-2"></i>
                        Remplir les constantes
                      </Button>
                    </div>
                  )}
                </Card.Body>
              </Card>

              {/* Actions de Prescription */}
              <Card className="shadow-sm border-0">
                <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center py-3">
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle bg-white text-primary p-2 me-3">
                      <i className="bi bi-capsule fs-5"></i>
                    </div>
                    <div>
                      <h5 className="mb-0">Prescriptions</h5>
                      <small className="opacity-75">Traitements et examens</small>
                    </div>
                  </div>
                  <div className="d-flex align-items-center">

                  </div>
                </Card.Header>
                <Card.Body className="p-3">
                  {/* Section Traitements Médicamenteux */}
                  <div className="mb-4">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div className="d-flex align-items-center">
                        <div className="rounded-circle bg-success bg-opacity-10 p-2 me-2">
                          <i className="bi bi-capsule text-success"></i>
                        </div>
                        <div>
                          <label className="small text-muted fw-semibold mb-1">Traitements Médicamenteux</label>
                          <div className="d-flex align-items-center">
                            <span className="badge bg-success bg-opacity-10 text-success me-2">
                              <i className="bi bi-prescription me-1"></i>
                              Pharmacothérapie
                            </span>
                            {loadingTraitementClinique && (
                              <Spinner animation="border" size="sm" variant="success" className="ms-2" />
                            )}
                            {!loadingTraitementClinique && traitementsCliniques.length > 0 && (
                              <span className="badge bg-primary bg-opacity-10 text-primary ms-2">
                                <i className="bi bi-check-circle me-1"></i>
                                {traitementsCliniques.length} médicament(s)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="success"
                        size="sm"
                        className="rounded-pill px-3"
                        onClick={() => setShowPharmacieModal(true)}
                      >
                        <i className="bi bi-plus-circle me-1"></i>
                        Ajouter
                      </Button>
                    </div>
                    <div className="bg-light rounded-3 p-3 border border-success border-opacity-25">
                      {consultationForm.TraitementClinique.trim() ? (
                        <div className="text-muted small">
                          {consultationForm.TraitementClinique.split('\n').map((ligne, index) => (
                            <div key={index} className="mb-1">
                              <i className="bi bi-chevron-right text-success me-2" style={{ fontSize: '0.6rem' }}></i>
                              {ligne}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-muted text-center py-2">
                          <i className="bi bi-info-circle me-1"></i>
                          Aucun traitement médicamenteux prescrit
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section Examens Paracliniques */}
                  <div className="mb-4">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div className="d-flex align-items-center">
                        <div className="rounded-circle bg-info bg-opacity-10 p-2 me-2">
                          <i className="bi bi-clipboard2-pulse text-info"></i>
                        </div>
                        <div>
                          <label className="small text-muted fw-semibold mb-1">Examens Paracliniques</label>
                          <div className="d-flex align-items-center">
                            <span className="badge bg-info bg-opacity-10 text-info me-2">
                              <i className="bi bi-microscope me-1"></i>
                              Examen de Biologie - Imagerie - Dentisterie
                            </span>
                            {loadingExamenParaclinique && (
                              <Spinner animation="border" size="sm" variant="info" className="ms-2" />
                            )}
                            {!loadingExamenParaclinique && examensParacliniques.length > 0 && (
                              <span className="badge bg-success bg-opacity-10 text-success ms-2">
                                <i className="bi bi-check-circle me-1"></i>
                                {examensParacliniques.length} examen(s)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="info"
                        size="sm"
                        className="rounded-pill px-3"
                        onClick={() => setShowExamenModal(true)}
                      >
                        <i className="bi bi-plus-circle me-1"></i>
                        Ajouter
                      </Button>
                    </div>
                    <div className="bg-light rounded-3 p-3 border border-info border-opacity-25">
                      {consultationForm.ExamenParaclinique.trim() ? (
                        <div className="text-muted small">
                          {consultationForm.ExamenParaclinique.split('\n').map((ligne, index) => (
                            <div key={index} className="mb-1">
                              <i className="bi bi-chevron-right text-info me-2" style={{ fontSize: '0.6rem' }}></i>
                              {ligne}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-muted text-center py-2">
                          <i className="bi bi-info-circle me-1"></i>
                          Aucun examen paraclinique enregistré
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section Avis d'Hospitalisation */}
                  <div className="mb-4">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div className="d-flex align-items-center">
                        <div className="rounded-circle bg-danger bg-opacity-10 p-2 me-2">
                          <i className="bi bi-hospital text-danger"></i>
                        </div>
                        <div>
                          <label className="small text-muted fw-semibold mb-1">Avis d'Hospitalisation</label>
                          <div className="d-flex align-items-center">
                            <span className="badge bg-danger bg-opacity-10 text-danger me-2">
                              <i className="bi bi-building me-1"></i>
                              Hospitalisation
                            </span>
                            {avisHospitCount > 0 && (
                              <span className="badge bg-primary bg-opacity-10 text-primary ms-2">
                                <i className="bi bi-check-circle me-1"></i>
                                {avisHospitCount} avis
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="danger"
                        size="sm"
                        className="rounded-pill px-3"
                        onClick={() => setShowAvisHospitModal(true)}
                      >
                        <i className="bi bi-plus-circle me-1"></i>
                        Ajouter
                      </Button>
                    </div>
                    <div className="bg-light rounded-3 p-3 border border-danger border-opacity-25">
                      {avisHospitCount > 0 ? (
                        <div className="text-center">
                          <div className="d-flex align-items-center justify-content-center mb-2">
                            <i className="bi bi-hospital text-danger me-2"></i>
                            <span className="text-muted small">
                              {avisHospitCount} avis d'hospitalisation enregistré{avisHospitCount > 1 ? 's' : ''}
                            </span>
                          </div>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => setShowAvisHospitModal(true)}
                          >
                            <i className="bi bi-eye me-1"></i>
                            Voir les avis
                          </Button>
                        </div>
                      ) : (
                        <div className="text-muted text-center py-2">
                          <i className="bi bi-info-circle me-1"></i>
                          Aucun avis d'hospitalisation enregistré
                        </div>
                      )}
                    </div>
                  </div>

                  {prescriptions.length > 0 && (
                    <div className="mt-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="mb-0 text-muted">
                          <i className="bi bi-list-check me-1"></i>
                          Prescriptions existantes ({prescriptions.length})
                        </h6>
                      </div>
                      <div className="table-responsive">
                        <Table striped hover className="mb-0">
                          <thead>
                            <tr>
                              <th className="border-0">Type</th>
                              <th className="border-0">Désignation</th>
                              <th className="border-0">Détails</th>
                              <th className="border-0 text-end">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {prescriptions.map((prescription) => (
                              <tr key={prescription._id}>
                                <td className="align-middle">{getPrescriptionBadge(prescription.type)}</td>
                                <td className="align-middle">{prescription.designation}</td>
                                <td className="align-middle">
                                  <small>
                                    {prescription.posologie && <div>Posologie: {prescription.posologie}</div>}
                                    {prescription.duree && <div>Durée: {prescription.duree}</div>}
                                    {prescription.instructions && <div>Instructions: {prescription.instructions}</div>}
                                  </small>
                                </td>
                                <td className="align-middle text-end">
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => supprimerPrescription(prescription._id)}
                                    className="rounded-circle"
                                  >
                                    <i className="bi bi-trash"></i>
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Modal Antécédent */}
          <Modal show={showAntecedentModal} onHide={() => setShowAntecedentModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Ajouter un Antécédent</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Type d'Antécédent</Form.Label>
                <Form.Select
                  value={antecedentType}
                  onChange={(e) => setAntecedentType(e.target.value as any)}
                >
                  <option value="medical">Médical</option>
                  <option value="chirurgical">Chirurgical</option>
                  <option value="familial">Familial</option>
                  <option value="autre">Autre</option>
                  <option value="allergie">Allergie</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={antecedentForm.description}
                  onChange={(e) => setAntecedentForm({ ...antecedentForm, description: e.target.value })}
                  placeholder="Décrire l'antécédent..."
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Date (optionnel)</Form.Label>
                <Form.Control
                  type="date"
                  value={antecedentForm.date}
                  onChange={(e) => setAntecedentForm({ ...antecedentForm, date: e.target.value })}
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowAntecedentModal(false)} disabled={loadingAntecedent}>
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={ajouterAntecedent}
                disabled={!antecedentForm.description.trim() || loadingAntecedent}
              >
                {loadingAntecedent ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" className="me-2" />
                    Ajout en cours...
                  </>
                ) : (
                  'Ajouter'
                )}
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Modal Prescription */}
          <Modal show={showPrescriptionModal} onHide={() => setShowPrescriptionModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>
                {prescriptionType === 'medicament' ? 'Prescrire un Médicament' : 'Prescrire un Examen'}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Type</Form.Label>
                <Form.Select
                  value={prescriptionType}
                  onChange={(e) => setPrescriptionType(e.target.value as any)}
                >
                  <option value="medicament">Médicament</option>
                  <option value="examen">Examen</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Désignation</Form.Label>
                <Form.Control
                  type="text"
                  value={prescriptionForm.designation}
                  onChange={(e) => setPrescriptionForm({ ...prescriptionForm, designation: e.target.value })}
                  placeholder={prescriptionType === 'medicament' ? 'ex: Paracétamol 500mg' : 'ex: Radiographie thoracique'}
                />
              </Form.Group>
              {prescriptionType === 'medicament' && (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Posologie</Form.Label>
                    <Form.Control
                      type="text"
                      value={prescriptionForm.posologie}
                      onChange={(e) => setPrescriptionForm({ ...prescriptionForm, posologie: e.target.value })}
                      placeholder="ex: 1 comprimé 3 fois par jour"
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Durée</Form.Label>
                    <Form.Control
                      type="text"
                      value={prescriptionForm.duree}
                      onChange={(e) => setPrescriptionForm({ ...prescriptionForm, duree: e.target.value })}
                      placeholder="ex: 7 jours"
                    />
                  </Form.Group>
                </>
              )}
              <Form.Group className="mb-3">
                <Form.Label>Instructions</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={prescriptionForm.instructions}
                  onChange={(e) => setPrescriptionForm({ ...prescriptionForm, instructions: e.target.value })}
                  placeholder="Instructions spécifiques..."
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowPrescriptionModal(false)}>
                Annuler
              </Button>
              <Button variant="primary" onClick={ajouterPrescription} disabled={!prescriptionForm.designation.trim() || (prescriptionType === 'medicament' && (!prescriptionForm.posologie.trim() || !prescriptionForm.duree.trim()))}>
                Ajouter
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Modal CIM-10 */}
          <Modal show={showCIM10Modal} onHide={() => setShowCIM10Modal(false)} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>
                <i className="bi bi-search me-2"></i>
                Sélectionner les Codes CIM-10
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {/* Champ de recherche fixe */}
              <div className="sticky-top bg-white pb-3 mb-3" style={{ zIndex: 10 }}>
                <Form.Group>
                  <Form.Label>Rechercher un code CIM-10</Form.Label>
                  <Form.Control
                    type="text"
                    value={cim10Search}
                    onChange={(e) => setCim10Search(e.target.value)}
                    placeholder="Ex: A00, Choléra, Diabète..."
                    className="shadow-sm"
                  />
                </Form.Group>
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0">Liste des affections disponibles:</h6>
                  <Button
                    variant="outline-success"
                    size="sm"
                    onClick={() => setShowNewAffectionForm(!showNewAffectionForm)}
                  >
                    <i className="bi bi-plus-circle me-1"></i>
                    {showNewAffectionForm ? 'Annuler' : 'Nouvelle affection'}
                  </Button>
                </div>

                {showNewAffectionForm && (
                  <Card className="mb-3 border-success">
                    <Card.Header className="bg-success text-white py-2">
                      <h6 className="mb-0">
                        <i className="bi bi-plus-circle me-2"></i>
                        Créer une nouvelle affection
                      </h6>
                    </Card.Header>
                    <Card.Body className="p-3">
                      <Row className="g-2">
                        <Col md={4}>
                          <Form.Group className="mb-2">
                            <Form.Label className="small">Lettre clé</Form.Label>
                            <Form.Control
                              type="text"
                              value={newAffection.lettreCle}
                              onChange={(e) => setNewAffection({ ...newAffection, lettreCle: e.target.value })}
                              placeholder="Ex: A00.1"
                              size="sm"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-2">
                            <Form.Label className="small">Désignation</Form.Label>
                            <Form.Control
                              type="text"
                              value={newAffection.designation}
                              onChange={(e) => setNewAffection({ ...newAffection, designation: e.target.value })}
                              placeholder="Ex: Choléra due à Vibrio cholerae O1"
                              size="sm"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={2}>
                          <Form.Group className="mb-2">
                            <Form.Label className="small invisible">Action</Form.Label>
                            <Button
                              variant="success"
                              size="sm"
                              className="w-100"
                              onClick={creerAffection}
                              disabled={!newAffection.lettreCle.trim() || !newAffection.designation.trim()}
                            >
                              <i className="bi bi-check-lg"></i>
                            </Button>
                          </Form.Group>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                )}
                {loadingAffections ? (
                  <div className="text-center py-3">
                    <Spinner animation="border" className="me-2" />
                    Chargement des affections...
                  </div>
                ) : affections.length > 0 ? (
                  <Row className="g-2">
                    {affections
                      .filter(affection =>
                        cim10Search === '' ||
                        affection.designation.toLowerCase().includes(cim10Search.toLowerCase()) ||
                        affection.lettreCle.toLowerCase().includes(cim10Search.toLowerCase())
                      )
                      .map((affection: any, index: number) => (
                        <Col key={index} md={6}>
                          <Form.Check
                            type="checkbox"
                            label={`${affection.lettreCle} - ${affection.designation}`}
                            checked={selectedCim10Codes.includes(`${affection.lettreCle} - ${affection.designation}`)}
                            onChange={(e) => {
                              const fullCode = `${affection.lettreCle} - ${affection.designation}`;
                              if (e.target.checked) {
                                setSelectedCim10Codes([...selectedCim10Codes, fullCode]);
                              } else {
                                setSelectedCim10Codes(selectedCim10Codes.filter(c => c !== fullCode));
                              }
                            }}
                          />
                        </Col>
                      ))}
                  </Row>
                ) : (
                  <Alert variant="info">
                    <i className="bi bi-info-circle me-2"></i>
                    Aucune affection trouvée dans la base de données.
                  </Alert>
                )}
              </div>

              {selectedCim10Codes.length > 0 && (
                <div className="alert alert-info sticky-bottom">
                  <strong>Codes sélectionnés ({selectedCim10Codes.length}):</strong>
                  <div className="mt-2">
                    {selectedCim10Codes.map((code, index) => (
                      <Badge key={index} bg="primary" className="me-1 mb-1">
                        {code}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowCIM10Modal(false)}>
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setShowCIM10Modal(false);
                  setSuccess(`${selectedCim10Codes.length} code(s) CIM-10 sélectionné(s)`);
                  setTimeout(() => setSuccess(''), 3000);
                }}
              >
                Valider la sélection
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Modal Pharmacie */}
          <PharmacieModalPharmAccueilMedecin
            show={showPharmacieModal}
            onHide={() => {
              setShowPharmacieModal(false);
              // Recharger les traitements cliniques après ajout de médicament
              if (consultation?.codePrestation) {
                chargerTraitementsCliniques(consultation.codePrestation);
              }
            }}
            codePrestation={consultation?.codePrestation}
          />

          {/* Modal Examen Hospitalisation */}
          <Modal show={showExamenModal} onHide={() => {
            setShowExamenModal(false);
            // Recharger les examens paracliniques après ajout d'acte
            if (consultation?.codePrestation) {
              chargerExamensParacliniques(consultation.codePrestation);
            }
          }} size="xl">
            <Modal.Header closeButton>
              <Modal.Title>
                <i className="bi bi-clipboard2-pulse me-2"></i>
                Examen - Chirurgie - Biopsie - Hospitalisation - Autre Acte
              </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ maxHeight: '80vh', overflowY: 'auto' }}>
              {(() => {
                // Stocker le codePrestation dans le localStorage pour que le composant puisse le récupérer
                if (consultation?.codePrestation) {
                  localStorage.setItem('codePrestationConsultation', consultation.codePrestation);
                }
                return <HospitalisationPageMedecin />;
              })()}
            </Modal.Body>
          </Modal>

          {/* Modal Avis d'Hospitalisation */}
          <AvisHospitModal
            show={showAvisHospitModal}
            onHide={() => setShowAvisHospitModal(false)}
            consultationId={consultation?._id}
            patientId={patient?._id}
            patientNom={patient?.Nom}
            patientPrenoms={patient?.Prenoms}
            Code_dossier={patient?.Code_dossier}
          />

          {/* Modal Impression */}
          <Modal show={showPrintModal} onHide={() => setShowPrintModal(false)} size="xl">
            <Modal.Header closeButton>
              <Modal.Title>
                <i className="bi bi-printer me-2"></i>
                Impression de la Fiche de Prescription
              </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ maxHeight: '80vh', overflowY: 'auto' }}>
              <PrintFichePrescription
                consultationId={consultation?.codePrestation || consultationForm.codePrestation}
                patientId={patient?._id}
                patientNom={patient?.Nom}
                patientPrenoms={patient?.Prenoms}
              />
            </Modal.Body>
          </Modal>

        </>
      ) : (
        /* Message d'attente si aucune consultation trouvée */
        <Card className="shadow-sm border-0">
          <Card.Body className="text-center py-5">
            <i className="bi bi-search text-muted fs-1 mb-3"></i>
            <h5 className="text-muted mb-3">Aucune consultation trouvée</h5>
            <p className="text-muted mb-4">
              Veuillez saisir un Code Prestation valide pour rechercher une consultation existante,
              ou attendre qu'une consultation soit assignée.
            </p>
            <div className="bg-light p-3 rounded text-start" style={{ maxWidth: '500px', margin: '0 auto' }}>
              <h6 className="text-primary mb-2">
                <i className="bi bi-info-circle me-2"></i>
                Comment utiliser cette page :
              </h6>
              <ol className="mb-0 small text-muted">
                <li>Saisissez un Code Prestation dans le champ ci-dessus</li>
                <li>Cliquez sur le bouton de recherche pour trouver la consultation</li>
                <li>La fiche de consultation s'affichera automatiquement</li>
              </ol>
            </div>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
}
