'use client';

import { useState, useEffect } from 'react';
import { Modal, Form, Button, Table, Row, Col, Card, Badge, Spinner } from 'react-bootstrap';
import { FaCalendarAlt, FaPlus, FaTrash } from 'react-icons/fa';
import { useEntreprise } from '@/hooks/useEntreprise';
import { generatePrintHeader, generatePrintFooter, createPrintWindow } from '@/utils/printRecu';
import { IMedecin } from '@/models/medecin';
import styles from './DisponibilitePrescriptuerModal.module.css';

interface DisponibilitePrescriptuerModalProps {
  show: boolean;
  onHide: () => void;
}

interface PlanningItem {
  _id: string;
  IDMEDECIN: string;
  DateDebut: Date;
  DateFin: Date;
  heureDebut: string;
  HeureFin: string;
  Dureconsul: number;
  TotalRDV: number;
  ResteRDV: number;
  DESCRIPTION?: string;
  SaisiLe: Date;
  Modifiele: Date;
  medecin?: IMedecin;
}

interface RdvItem {
  _id: string;
  LibelleRDV: string;
  PatientR: string;
  Medecinr: string;
  IDMEDECIN: string;
  DateDisponinibilite: string;
  DatePlanning: Date;
  IDPLANNING_MED: string;
  HeureRDV: string;
  StatutRdv: string;
  DESCRIPTION: string;
  Contact: string;
  Statutrdvpris: boolean;
}

export default function DisponibilitePrescriptuerModal({ show, onHide }: DisponibilitePrescriptuerModalProps) {
  const { entreprise } = useEntreprise();
  const [medecins, setMedecins] = useState<IMedecin[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMedecin, setSelectedMedecin] = useState('');
  const [plannings, setPlannings] = useState<PlanningItem[]>([]);
  const [rendezVous, setRendezVous] = useState<RdvItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingRdv, setEditingRdv] = useState<{ [key: string]: { patient: string; contact: string; typeVisite: string } }>({});
  const [updatingRdv, setUpdatingRdv] = useState<string | null>(null);
  const [validatedRdv, setValidatedRdv] = useState<{ [key: string]: { patient: string; contact: string; typeVisite: string } }>({});
  const [addingRdv, setAddingRdv] = useState(false);
  const [rdvStatutSwitch, setRdvStatutSwitch] = useState<{ [key: string]: boolean }>({});

  // Charger le médecin connecté uniquement
  useEffect(() => {
    const fetchConnectedMedecin = async () => {
      try {
        // Récupérer le profil depuis le localStorage
        const profilStr = localStorage.getItem('profil');
        
        if (profilStr) {
          const profil = JSON.parse(profilStr);
          
          // Rechercher le médecin par ID, nom et prénoms
          const response = await fetch('/api/medecins');
          if (response.ok) {
            const allMedecins = await response.json();
            
            // Chercher le médecin correspondant au profil (par ID, nom et prénoms)
            const connectedMedecin = allMedecins.find((medecin: IMedecin) => 
              medecin._id.toString() === profil._id ||
              (medecin.nom === profil.nom && medecin.prenoms === profil.prenom)
            );
            
            if (connectedMedecin) {
              setMedecins([connectedMedecin]);
              setSelectedMedecin(connectedMedecin._id.toString());
            } else {
              console.warn('Aucun médecin correspondant trouvé pour le profil:', profil);
            }
          } else {
            console.error('Erreur API médecins:', response.status);
          }
        } else {
          console.warn('Aucun profil trouvé dans le localStorage');
        }
      } catch (error) {
        console.error('Erreur lors du chargement du médecin connecté:', error);
      }
    };

    if (show) {
      fetchConnectedMedecin();
    }
  }, [show]);

  // Charger les plannings du médecin sélectionné pour la date
  useEffect(() => {
    if (selectedMedecin && selectedDate) {
      fetchPlannings();
    } else {
      setPlannings([]);
      setRendezVous([]);
    }
  }, [selectedMedecin, selectedDate]);

  const fetchPlannings = async () => {
    if (!selectedMedecin || !selectedDate) return;

    setLoading(true);
    setError('');

    try {
      // Convertir la date sélectionnée en format YYYY-MM-DD
      const dateObj = new Date(selectedDate);
      const dateDebut = dateObj.toISOString().split('T')[0];
      const dateFin = dateDebut; // Même jour

      const url = `/api/planning-medecin/liste?medecinId=${selectedMedecin}&dateDebut=${dateDebut}&dateFin=${dateFin}`;

      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        
        // Filtrer pour n'afficher que les plannings qui correspondent exactement à la date sélectionnée
        const selectedDateObj = new Date(selectedDate);
        selectedDateObj.setHours(0, 0, 0, 0);
        
        const filteredPlannings = data.filter((planning: PlanningItem) => {
          const planningDate = new Date(planning.DateDebut);
          planningDate.setHours(0, 0, 0, 0);
          return planningDate.getTime() === selectedDateObj.getTime();
        });
        
        setPlannings(filteredPlannings);
        
        // Charger les rendez-vous associés UNIQUEMENT au planning trouvé (s'il y en a un)
        if (filteredPlannings.length > 0) {
          // Prendre uniquement le premier planning (il ne devrait y en avoir qu'un par jour)
          const planningId = filteredPlannings[0]._id.toString();
          await fetchRendezVous(planningId);
        } else {
          setRendezVous([]);
          // Réinitialiser l'état des interrupteurs quand il n'y a pas de rendez-vous
          setRdvStatutSwitch({});
        }
      } else {
        setError('Erreur lors du chargement des plannings');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des plannings:', error);
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const fetchRendezVous = async (planningId: string) => {
    try {
      // Récupérer les rendez-vous pour UN SEUL planning spécifique
      const url = `/api/rendez-vous/by-planning?planningId=${planningId}`;

      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        setRendezVous(data);
        
        // Initialiser l'état des interrupteurs avec les statuts actuels des rendez-vous
        const initialSwitchState: { [key: string]: boolean } = {};
        data.forEach((rdv: RdvItem) => {
          // L'interrupteur doit refléter le statut '2' (patient présent) pour tous les rendez-vous validés
          if (rdv.Statutrdvpris) {
            initialSwitchState[rdv._id] = rdv.StatutRdv === '2';
          }
        });
        setRdvStatutSwitch(initialSwitchState);
      } else {
        console.error('Erreur lors du chargement des rendez-vous');
        setRendezVous([]);
        setRdvStatutSwitch({});
      }
    } catch (error) {
      console.error('Erreur lors du chargement des rendez-vous:', error);
      setRendezVous([]);
      setRdvStatutSwitch({});
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string | undefined | null) => {
    if (!timeString) return '-';
    return timeString.slice(0, 5); // HH:MM
  };

  const getStatutBadge = (statut: string | undefined | null, statutrdvpris: boolean) => {
    if (!statutrdvpris) return <Badge bg="secondary">Disponible</Badge>;
    
    switch (statut) {
      case '1':
        return <Badge bg="primary">En cours</Badge>;
      case '2':
        return <Badge bg="success">Validé</Badge>;
      case '3':
        return <Badge bg="danger">Annulé</Badge>;
      default:
        return <Badge bg="secondary">Disponible</Badge>;
    }
  };

  const isRdvPast = (rdv: RdvItem) => {
    if (!rdv.DateDisponinibilite) return false;
    
    // Utiliser la date de disponibilité comme référence (fin de journée)
    const rdvDate = new Date(rdv.DateDisponinibilite);
    rdvDate.setHours(23, 59, 59, 999); // Fin de journée
    const now = new Date();
    
    return rdvDate < now;
  };

  const getTotalResteRDV = () => {
    return plannings.reduce((total, planning) => {
      return total + (planning.TotalRDV || 0);
    }, 0);
  };

  const getRdvValidesCount = () => {
    return rendezVous.filter(rdv => rdv.Statutrdvpris).length;
  };

  const handleInputChange = (rdvId: string, field: 'patient' | 'contact' | 'typeVisite', value: string) => {
    setEditingRdv(prev => ({
      ...prev,
      [rdvId]: {
        ...prev[rdvId],
        [field]: value
      }
    }));
  };

  const handleStatutSwitchChange = async (rdvId: string, checked: boolean) => {
    // Mettre à jour l'état local de l'interrupteur
    setRdvStatutSwitch(prev => ({
      ...prev,
      [rdvId]: checked
    }));

    // Mettre à jour automatiquement le statut du rendez-vous
    try {
      const response = await fetch('/api/rendez-vous/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rdvId: rdvId,
          StatutRdv: checked ? '2' : '1'
        }),
      });

      if (response.ok) {
        // Mettre à jour le rendez-vous dans la liste locale
        setRendezVous(prev => prev.map(rdv => 
          rdv._id === rdvId 
            ? { ...rdv, StatutRdv: checked ? '2' : '1' }
            : rdv
        ));
        
        console.log(`✅ Statut du rendez-vous mis à jour: ${checked ? '2' : '1'}`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Erreur lors de la mise à jour du statut:', errorData.error);
        // Revenir à l'état précédent en cas d'erreur
        setRdvStatutSwitch(prev => ({
          ...prev,
          [rdvId]: !checked
        }));
      }
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du statut:', error);
      // Revenir à l'état précédent en cas d'erreur
      setRdvStatutSwitch(prev => ({
        ...prev,
        [rdvId]: !checked
      }));
    }
  };

  const handleValidateRdv = async (rdvId: string) => {
    const editedData = editingRdv[rdvId];
    if (!editedData) {
      alert('⚠️ Veuillez remplir les informations avant de valider');
      return;
    }

    if (!editedData.patient || !editedData.contact || !editedData.typeVisite) {
      alert('⚠️ Veuillez remplir tous les champs (Patient, Contact, Type Visite)');
      return;
    }

    // Vérifier si le rendez-vous n'est pas passé
    const rdv = rendezVous.find(r => r._id === rdvId);
    if (rdv && isRdvPast(rdv)) {
      alert('❌ Impossible de valider un rendez-vous passé');
      return;
    }

    // Confirmation comme dans Windev
    const confirmed = window.confirm('Voulez-vous valider ce rendez-vous ?');
    if (!confirmed) {
      return;
    }

    setUpdatingRdv(rdvId);
    try {
      const entrepriseId = typeof window !== 'undefined' ? localStorage.getItem('IdEntreprise') : null;
      
      // Récupérer les détails du rendez-vous pour obtenir le planning ID
      const rdv = rendezVous.find(r => r._id === rdvId);
      if (!rdv) {
        throw new Error('Rendez-vous non trouvé');
      }

      // Mettre à jour le rendez-vous
      const rdvResponse = await fetch(`/api/rendez-vous/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rdvId,
          PatientR: editedData.patient,
          Contact: editedData.contact,
          DESCRIPTION: editedData.typeVisite,
          StatutRdv: '1', // Toujours 1 lors de la validation initiale
          Statutrdvpris: true,
          RENDEZVOUSLE: new Date(), // DateSys() équivalent
          entrepriseId
        })
      });

      if (!rdvResponse.ok) {
        const errorData = await rdvResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors de la mise à jour du rendez-vous');
      }

      // Mettre à jour le planning (décrémenter ResteRDV uniquement si c'était un créneau disponible)
      if (!rdv.Statutrdvpris) {
        const planningResponse = await fetch(`/api/planning-medecin/update-reste-rdv`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            planningId: rdv.IDPLANNING_MED,
            decrement: 1, // ResteRDV -= 1
            entrepriseId
          })
        });

        if (!planningResponse.ok) {
          const errorData = await planningResponse.json().catch(() => ({}));
          console.warn('⚠️ Rendez-vous validé mais erreur lors de la mise à jour du planning:', errorData.error);
        } else {
          // Mettre à jour le planning dans la liste locale
          setPlannings(prev => prev.map(p => 
            p._id === rdv.IDPLANNING_MED 
              ? { ...p, ResteRDV: Math.max(0, (p.ResteRDV || 0) - 1) }
              : p
          ));
        }
      }

      const result = await rdvResponse.json();
      alert('✅ Rendez-vous valider avec succès');
      
      // Mettre à jour le rendez-vous dans la liste
      setRendezVous(prev => prev.map(r => 
        r._id === rdvId 
          ? { ...r, PatientR: editedData.patient, Contact: editedData.contact, DESCRIPTION: editedData.typeVisite, StatutRdv: '1', Statutrdvpris: true }
          : r
      ));
      
      // Sauvegarder les données validées pour la modification future
      setValidatedRdv(prev => ({
        ...prev,
        [rdvId]: {
          patient: editedData.patient,
          contact: editedData.contact,
          typeVisite: editedData.typeVisite
        }
      }));
      
      // Vider les champs d'édition
      setEditingRdv(prev => {
        const newEdits = { ...prev };
        delete newEdits[rdvId];
        return newEdits;
      });
      
      // Réinitialiser l'interrupteur de statut après validation
      setRdvStatutSwitch(prev => {
        const newSwitch = { ...prev };
        delete newSwitch[rdvId];
        return newSwitch;
      });
    } catch (error) {
      console.error('Erreur lors de la validation du rendez-vous:', error);
      alert(`❌ Erreur lors de la validation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setUpdatingRdv(null);
    }
  };

  const handleCancelEdit = (rdvId: string) => {
    setEditingRdv(prev => {
      const newEdits = { ...prev };
      delete newEdits[rdvId];
      return newEdits;
    });
    // Réinitialiser l'interrupteur de statut
    setRdvStatutSwitch(prev => {
      const newSwitch = { ...prev };
      delete newSwitch[rdvId];
      return newSwitch;
    });
  };

  const handleStartEdit = (rdvId: string) => {
    // Vérifier si le rendez-vous n'est pas passé
    const rdv = rendezVous.find(r => r._id === rdvId);
    if (rdv && isRdvPast(rdv)) {
      alert('❌ Impossible de modifier un rendez-vous passé');
      return;
    }

    if (rdv) {
      setEditingRdv(prev => ({
        ...prev,
        [rdvId]: {
          patient: rdv.PatientR || '',
          contact: rdv.Contact || '',
          typeVisite: rdv.DESCRIPTION || ''
        }
      }));
      
      // L'interrupteur est déjà initialisé avec le bon état lors du chargement
      // Pas besoin de le réinitialiser ici
    }
  };

  const handleUpdateRdv = async (rdvId: string) => {
    const editedData = editingRdv[rdvId];
    if (!editedData) {
      alert('⚠️ Veuillez remplir les informations avant de mettre à jour');
      return;
    }

    if (!editedData.patient || !editedData.contact || !editedData.typeVisite) {
      alert('⚠️ Veuillez remplir tous les champs (Patient, Contact, Type Visite)');
      return;
    }

    setUpdatingRdv(rdvId);
    
    try {
      const response = await fetch('/api/rendez-vous/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rdvId: rdvId,
          PatientR: editedData.patient,
          Contact: editedData.contact,
          DESCRIPTION: editedData.typeVisite
        }),
      });
      
      if (response.ok) {
        // Mettre à jour le rendez-vous dans la liste locale
        setRendezVous(prev => prev.map(rdv => 
          rdv._id === rdvId 
            ? { ...rdv, PatientR: editedData.patient, Contact: editedData.contact, DESCRIPTION: editedData.typeVisite }
            : rdv
        ));
        
        // Mettre à jour les données validées
        setValidatedRdv(prev => ({
          ...prev,
          [rdvId]: {
            patient: editedData.patient,
            contact: editedData.contact,
            typeVisite: editedData.typeVisite
          }
        }));
        
        // Vider les champs d'édition
        setEditingRdv(prev => {
          const newEdits = { ...prev };
          delete newEdits[rdvId];
          return newEdits;
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`❌ Erreur lors de la mise à jour: ${errorData.error || 'Erreur inconnue'}`);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du rendez-vous:', error);
      alert('❌ Erreur de connexion lors de la mise à jour');
    } finally {
      setUpdatingRdv(null);
    }
  };

  const handleCancelUpdate = (rdvId: string) => {
    // Restaurer les données validées originales
    const validatedData = validatedRdv[rdvId];
    if (validatedData) {
      setEditingRdv(prev => ({
        ...prev,
        [rdvId]: validatedData
      }));
    } else {
      handleCancelEdit(rdvId);
    }
  };

  // Fonctions d'impression
  const handlePrint = (type: 'fiche-rendezvous' | 'liste-personnes' | 'liste-medecins') => {
    switch (type) {
      case 'fiche-rendezvous':
        printFicheRendezVous();
        break;
      case 'liste-personnes':
        printListePersonnes();
        break;
      case 'liste-medecins':
        printListeMedecins();
        break;
    }
  };

  const printFicheRendezVous = () => {
    const selectedMedecinData = medecins.find(m => m._id.toString() === selectedMedecin);
    
    // Générer l'en-tête et le pied de page avec les données de l'entreprise
    const headerHTML = generatePrintHeader(entreprise);
    const footerHTML = generatePrintFooter(entreprise);
    
    // Contenu principal du tableau
    const contentHTML = `
      <div class="sub-header">FICHE RENDEZ-VOUS DU MEDECIN</div>
      <div class="sub-header">Dr ${selectedMedecinData?.nom || ''} ${selectedMedecinData?.prenoms || ''} - ${formatDate(selectedDate)}</div>
      
      <table>
        <thead>
          <tr>
            <th>Disponibilité</th>
            <th>Patient</th>
            <th>Contact</th>
            <th>Description</th>
            <th>Statut RDV</th>
            <th>Patient présent ?</th>
          </tr>
        </thead>
        <tbody>
          ${rendezVous.map(rdv => {
            const isSwitchOn = rdvStatutSwitch[rdv._id] || rdv.StatutRdv === '2';
            return `
              <tr>
                <td>${rdv.DateDisponinibilite || '-'}</td>
                <td>${rdv.PatientR || '-'}</td>
                <td>${rdv.Contact || '-'}</td>
                <td>${rdv.DESCRIPTION || '-'}</td>
                <td>${rdv.StatutRdv === '1' ? 'En cours' : rdv.StatutRdv === '2' ? 'Validé' : rdv.StatutRdv === '3' ? 'Annulé' : '-'}</td>
                <td>
                  <div class="d-flex align-items-center justify-content-center">
                    <input type="checkbox" class="checkbox" ${isSwitchOn ? 'checked' : ''} style="width: 20px; height: 20px;" />
                  </div>
                </td>
              </tr>
            `;}).join('')}
        </tbody>
      </table>
      
      <div class="text-center mt-4">
        <div>
          <span class="fw-bold">Merci pour votre confiance</span> <br />
          <small>Imprimé par : ${typeof window !== 'undefined' ? localStorage.getItem('nom_utilisateur') || "Utilisateur inconnu" : "Chargement..."} le : ${new Date().toLocaleString()}</small>
        </div>
      </div>
    `;
    
    // Créer la fenêtre d'impression avec l'en-tête et le pied de page
    createPrintWindow('Fiche Rendez-vous', headerHTML, contentHTML, footerHTML);
  };

  const printListePersonnes = () => {
    const selectedMedecinData = medecins.find(m => m._id.toString() === selectedMedecin);
    
    // Générer l'en-tête et le pied de page avec les données de l'entreprise
    const headerHTML = generatePrintHeader(entreprise);
    const footerHTML = generatePrintFooter(entreprise);
    
    // Filtrer uniquement les rendez-vous validés
    const rdvValides = rendezVous.filter(rdv => rdv.Statutrdvpris);
    
    // Contenu principal du tableau
    const contentHTML = `
      <div class="sub-header">LISTE DES PERSONNES A CONTACTER</div>
      <div class="sub-header">Dr ${selectedMedecinData?.nom || ''} ${selectedMedecinData?.prenoms || ''} - ${formatDate(selectedDate)}</div>
      
      <table>
        <thead>
          <tr>
            <th>Disponibilité</th>
            <th>Patient</th>
            <th>Contact</th>
            <th>Statut RDV</th>
            <th>Patient présent ?</th>
          </tr>
        </thead>
        <tbody>
          ${rdvValides.map(rdv => {
            const isSwitchOn = rdvStatutSwitch[rdv._id] || rdv.StatutRdv === '2';
            return `
              <tr>
                <td>${rdv.DateDisponinibilite || '-'}</td>
                <td>${rdv.PatientR || '-'}</td>
                <td>${rdv.Contact || '-'}</td>
                <td>${rdv.StatutRdv === '1' ? 'En cours' : rdv.StatutRdv === '2' ? 'Validé' : rdv.StatutRdv === '3' ? 'Annulé' : '-'}</td>
                <td>
                  <div class="d-flex align-items-center justify-content-center">
                    <input type="checkbox" class="checkbox" ${isSwitchOn ? 'checked' : ''} style="width: 20px; height: 20px;" />
                  </div>
                </td>
              </tr>
            `;}).join('')}
        </tbody>
      </table>
      
      <div class="text-center mt-4">
        <div>
          <span class="fw-bold">Merci pour votre confiance</span> <br />
          <small>Imprimé par : ${typeof window !== 'undefined' ? localStorage.getItem('nom_utilisateur') || "Utilisateur inconnu" : "Chargement..."} le : ${new Date().toLocaleString()}</small>
        </div>
      </div>
    `;
    
    // Créer la fenêtre d'impression avec l'en-tête et le pied de page
    createPrintWindow('Liste Personnes à Contacter', headerHTML, contentHTML, footerHTML);
  };

  const printListeMedecins = () => {
    // Générer l'en-tête et le pied de page avec les données de l'entreprise
    const headerHTML = generatePrintHeader(entreprise);
    const footerHTML = generatePrintFooter(entreprise);
    
    // Récupérer TOUS les plannings de la date sélectionnée (sans filtrer par médecin sélectionné)
    // On doit faire un appel API pour obtenir tous les plannings de la date
    const fetchAllPlanningsForDate = async () => {
      try {
        const entrepriseId = typeof window !== 'undefined' ? localStorage.getItem('IdEntreprise') : null;
        const url = entrepriseId 
          ? `/api/planning-medecin/by-date?date=${selectedDate}&entrepriseId=${entrepriseId}`
          : `/api/planning-medecin/by-date?date=${selectedDate}`;
        
        const response = await fetch(url);
        if (response.ok) {
          const allPlannings = await response.json();
          
          // Associer les médecins aux plannings et dédupliquer
          const medecinsAvecPlanning = allPlannings
            .map((planning: any) => {
              const medecin = medecins.find((m: any) => m._id.toString() === planning.IDMEDECIN);
              return {
                planning,
                medecin
              };
            })
            .filter((item: any) => item.medecin) // Garder seulement les items avec un médecin trouvé
            .filter((item: any, index: number, arr: any[]) => // Dédupliquer par ID de médecin
              arr.findIndex((i: any) => i.medecin?._id.toString() === item.medecin?._id.toString()) === index
            )
            .sort((a: any, b: any) => (a.medecin?.nom || '').localeCompare(b.medecin?.nom || '')); // Trier par nom ASC
          
          // Contenu principal du tableau
          const contentHTML = `
            <div class="sub-header">LISTE DES MEDECINS A CONTACTER</div>
            <div class="sub-header">${formatDate(selectedDate)}</div>
            
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Médecin</th>
                  <th>Contact</th>
                  <th>Heure début</th>
                  <th>Heure fin</th>
                  <th>Appel Reçu ?</th>
                </tr>
              </thead>
              <tbody>
                ${medecinsAvecPlanning.map((item: any) => `
                  <tr>
                    <td>${formatDate(selectedDate)}</td>
                    <td>Dr ${item.medecin?.nom || ''} ${item.medecin?.prenoms || ''}</td>
                    <td>${item.medecin?.specialite || '-'}</td>
                    <td>${item.planning?.heureDebut || '-'}</td>
                    <td>${item.planning?.HeureFin || '-'}</td>
                    <td>
                      <input type="checkbox" class="checkbox" />
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="text-center mt-4">
              <div>
                <span class="fw-bold">Merci pour votre confiance</span> <br />
                <small>Imprimé par : ${typeof window !== 'undefined' ? localStorage.getItem('nom_utilisateur') || "Utilisateur inconnu" : "Chargement..."} le : ${new Date().toLocaleString()}</small>
              </div>
            </div>
          `;
          
          // Créer la fenêtre d'impression avec l'en-tête et le pied de page
          createPrintWindow('Liste Médecins à Contacter', headerHTML, contentHTML, footerHTML);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des plannings:', error);
        alert('Erreur lors du chargement des plannings pour l\'impression');
      }
    };
    
    // Exécuter la fonction
    fetchAllPlanningsForDate();
  };

  // Fonction pour calculer la prochaine disponibilité
  const calculateNextDisponibilite = (lastDateStr: string, dureeConsult: number): string => {
    const lastDate = new Date(lastDateStr);
    // Ajouter la durée de consultation en minutes
    lastDate.setMinutes(lastDate.getMinutes() + dureeConsult);
    
    // Formater la date en YYYY-MM-DD HH:mm
    const year = lastDate.getFullYear();
    const month = String(lastDate.getMonth() + 1).padStart(2, '0');
    const day = String(lastDate.getDate()).padStart(2, '0');
    const hours = String(lastDate.getHours()).padStart(2, '0');
    const minutes = String(lastDate.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  // Fonction pour ajouter une nouvelle ligne de rendez-vous
  const handleAddRdvLine = async () => {
    if (!plannings.length || !selectedMedecin) {
      alert('⚠️ Veuillez sélectionner un médecin avec un planning valide');
      return;
    }

    const currentPlanning = plannings[0];

    setAddingRdv(true);
    
    try {
      const entrepriseId = typeof window !== 'undefined' ? localStorage.getItem('IdEntreprise') : null;
      
      // Calculer la prochaine disponibilité selon la logique demandée
      let nextDisponibilite: string;
      
      if (rendezVous.length === 0) {
        // Premier rendez-vous : utiliser l'heure de début du planning
        const debutDate = new Date(currentPlanning.DateDebut);
        nextDisponibilite = debutDate.toISOString().slice(0, 16).replace('T', ' ');
      } else {
        // Rendez-vous suivant : calculer basé sur le dernier rendez-vous
        // Trier par DateDisponinibilite pour trouver le dernier
        const sortedRdv = [...rendezVous].sort((a, b) => 
          new Date(a.DateDisponinibilite).getTime() - new Date(b.DateDisponinibilite).getTime()
        );
        const lastRdv = sortedRdv[sortedRdv.length - 1];
        
        // Calculer la prochaine disponibilité en ajoutant la durée de consultation
        const lastDate = new Date(lastRdv.DateDisponinibilite);
        lastDate.setMinutes(lastDate.getMinutes() + currentPlanning.Dureconsul);
        
        // Formater la date en YYYY-MM-DD HH:mm
        const year = lastDate.getFullYear();
        const month = String(lastDate.getMonth() + 1).padStart(2, '0');
        const day = String(lastDate.getDate()).padStart(2, '0');
        const hours = String(lastDate.getHours()).padStart(2, '0');
        const minutes = String(lastDate.getMinutes()).padStart(2, '0');
        
        nextDisponibilite = `${year}-${month}-${day} ${hours}:${minutes}`;
      }

      // Créer le nouveau rendez-vous
      const response = await fetch('/api/rendez-vous/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          IDMEDECIN: selectedMedecin,
          IDPLANNING_MED: currentPlanning._id,
          DateDisponinibilite: nextDisponibilite,
          DatePlanning: currentPlanning.DateDebut,
          StatutRdv: '0', // Non validé
          Statutrdvpris: false,
          DESCRIPTION: '',
          PatientR: '',
          Contact: '',
          entrepriseId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors de la création du rendez-vous');
      }

      // Mettre à jour le planning (incrémenter TotalRDV et ResteRDV)
      const planningUpdateResponse = await fetch(`/api/planning-medecin/update-totals`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planningId: currentPlanning._id,
          increment: 1, // TotalRDV += 1, ResteRDV += 1
          entrepriseId
        })
      });

      if (!planningUpdateResponse.ok) {
        const errorData = await planningUpdateResponse.json().catch(() => ({}));
        console.warn('⚠️ Rendez-vous créé mais erreur lors de la mise à jour du planning:', errorData.error);
      }

      alert('✅ Nouvelle ligne de rendez-vous ajoutée avec succès');
      
      // Mettre à jour le planning localement
      setPlannings(prev => prev.map(p => 
        p._id === currentPlanning._id 
          ? { ...p, TotalRDV: (p.TotalRDV || 0) + 1, ResteRDV: (p.ResteRDV || 0) + 1 }
          : p
      ));
      
      // Recharger les rendez-vous pour afficher la nouvelle ligne
      await fetchRendezVous(currentPlanning._id);
      
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la ligne de rendez-vous:', error);
      alert(`❌ Erreur lors de l'ajout: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setAddingRdv(false);
    }
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      size="xl" 
      className={styles.disponibiliteModal}
      backdrop="static"
      keyboard={false}
    >
      <Modal.Header closeButton className={styles.modalHeader}>
        <Modal.Title className={styles.modalTitle}>
          <i className="bi bi-calendar2-check-fill me-2"></i>
          DISPONIBILITÉ MÉDECIN
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className={styles.modalBody}>
        <Row>
          {/* Colonne de gauche - Calendrier et liste médecins */}
          <Col md={4}>
            {/* Calendrier */}
            <Card className={styles.selectionCard}>
              <Card.Header className={styles.cardHeader}>
                <h6 className="mb-0">
                  <i className="bi bi-calendar3 me-2"></i>
                  Calendrier
                </h6>
              </Card.Header>
              <Card.Body>
                <Form.Group>
                  <Form.Label className="fw-bold">Sélectionner une date</Form.Label>
                  <Form.Control
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className={styles.dateInput}
                  />
                </Form.Group>
                <div className="mt-3">
                  <small className="text-muted">
                    Date sélectionnée: <strong>{formatDate(selectedDate)}</strong>
                    {(() => {
                      const medecinsAvecPlanning = medecins.filter(medecin => 
                        plannings.some(planning => {
                          const planningDate = new Date(planning.DateDebut).toISOString().split('T')[0];
                          return planningDate === selectedDate && planning.IDMEDECIN === medecin._id.toString();
                        })
                      );
                      return medecinsAvecPlanning.length > 0 && (
                        <span> - <strong>{medecinsAvecPlanning.length}</strong> médecin(s) avec planning</span>
                      );
                    })()}
                  </small>
                </div>
              </Card.Body>
            </Card>

            {/* Médecin connecté */}
            <Card className={`${styles.selectionCard} mt-3`}>
              <Card.Header className={styles.cardHeader}>
                <h6 className="mb-0">
                  <i className="bi bi-person-fill me-2"></i>
                  Médecin Connecté
                </h6>
              </Card.Header>
              <Card.Body className={styles.medecinsList}>
                {medecins.length === 0 ? (
                  <div className="text-center text-muted py-3">
                    <i className="bi bi-person-x fs-3"></i>
                    <p className="mb-0 mt-2">Médecin non trouvé</p>
                  </div>
                ) : (
                  medecins.map((medecin) => (
                    <div
                      key={medecin._id.toString()}
                      className={`${styles.medecinItem} ${styles.selected}`}
                    >
                      <div className={styles.medecinInfo}>
                        <div className={styles.medecinName}>
                          <i className="bi bi-person-circle me-2"></i>
                          PR {medecin.nom} {medecin.prenoms}
                        </div>
                        <div className={styles.medecinSpecialite}>
                          {medecin.specialite}
                        </div>
                      </div>
                      <i className="bi bi-check-circle-fill text-success"></i>
                    </div>
                  ))
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Colonne de droite - Tableau Rendez-vous */}
          <Col md={8}>
            {/* Tableau Rendez-vous */}
            <Card className={styles.tableCard}>
              <Card.Header className={styles.cardHeader}>
                <h6 className="mb-0">
                  <i className="bi bi-clock-history me-2"></i>
                  Rendez-vous du {formatDate(selectedDate)}
                  {selectedMedecin && (
                    <span className="ms-2 text-primary">
                      ({medecins.find(m => m._id.toString() === selectedMedecin)?.nom} {medecins.find(m => m._id.toString() === selectedMedecin)?.prenoms})
                    </span>
                  )}
                  <Badge bg="primary" className="ms-2">
                    {rendezVous.length}/{getRdvValidesCount()}
                  </Badge>
                </h6>
              </Card.Header>
              <Card.Body className={styles.tableBody}>
                {loading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Chargement...</span>
                    </div>
                  </div>
                ) : error ? (
                  <div className="alert alert-danger">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                  </div>
                ) : rendezVous.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    <i className="bi bi-calendar-x fs-3"></i>
                    <p className="mb-0 mt-2">
                      {!selectedMedecin 
                        ? 'Sélectionnez un médecin' 
                        : plannings.length === 0
                          ? `Aucun planning trouvé pour le ${formatDate(selectedDate)}`
                          : 'Aucun rendez-vous pour ce planning'
                      }
                    </p>
                    {selectedMedecin && plannings.length > 0 && (
                      <small className="text-muted">
                        Le planning existe mais aucun rendez-vous n\'est encore programmé
                      </small>
                    )}
                  </div>
                ) : (
                  <Table responsive striped hover size="sm">
                    <thead>
                      <tr>
                        <th>Disponibilité</th>
                        <th>Patient</th>
                        <th>Contact</th>
                        <th>Type Visite</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rendezVous.map((rdv) => {
                        const rdvId = rdv._id.toString();
                        const isEditing = editingRdv[rdvId];
                        const isUpdating = updatingRdv === rdvId;
                        const rdvIsPast = isRdvPast(rdv);
                        
                        return (
                          <tr key={rdvId} className={rdvIsPast ? 'table-muted' : ''}>
                            <td>
                              <div className="d-flex flex-column">
                                {/* <span>{formatTime(rdv.HeureRDV)}</span> */}
                                <small className="text-muted">{rdv.DateDisponinibilite}</small>
                                {rdvIsPast && (
                                  <Badge bg="secondary" className="mt-1">
                                    Passé
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td>
                              {rdv.Statutrdvpris && !isEditing ? (
                                <span className={`fw-bold ${rdvIsPast ? 'text-muted' : ''}`}>{rdv.PatientR || '-'}</span>
                              ) : (
                                <Form.Control
                                  type="text"
                                  size="sm"
                                  placeholder="Nom du patient"
                                  value={isEditing?.patient || ''}
                                  onChange={(e) => handleInputChange(rdvId, 'patient', e.target.value)}
                                  disabled={isUpdating || rdvIsPast}
                                />
                              )}
                            </td>
                            <td>
                              {rdv.Statutrdvpris && !isEditing ? (
                                <span className={rdvIsPast ? 'text-muted' : ''}>{rdv.Contact || '-'}</span>
                              ) : (
                                <Form.Control
                                  type="text"
                                  size="sm"
                                  placeholder="Contact"
                                  value={isEditing?.contact || ''}
                                  onChange={(e) => handleInputChange(rdvId, 'contact', e.target.value)}
                                  disabled={isUpdating || rdvIsPast}
                                />
                              )}
                            </td>
                            <td>
                              {rdv.Statutrdvpris && !isEditing ? (
                                <span className={rdvIsPast ? 'text-muted' : ''}>{rdv.DESCRIPTION || '-'}</span>
                              ) : (
                                <Form.Control
                                  type="text"
                                  size="sm"
                                  placeholder="Type de visite"
                                  value={isEditing?.typeVisite || ''}
                                  onChange={(e) => handleInputChange(rdvId, 'typeVisite', e.target.value)}
                                  disabled={isUpdating || rdvIsPast}
                                />
                              )}
                            </td>
                            <td>
                              <div className="d-flex gap-1">
                                {rdv.Statutrdvpris ? (
                                  isEditing ? (
                                    <>
                                      <Button
                                        variant="success"
                                        size="sm"
                                        onClick={() => handleUpdateRdv(rdvId)}
                                        disabled={isUpdating || rdvIsPast}
                                        title={rdvIsPast ? "Impossible de modifier un rendez-vous passé" : "Mettre à jour le rendez-vous"}
                                      >
                                        {isUpdating ? (
                                          <span className="spinner-border spinner-border-sm"></span>
                                        ) : (
                                          <i className="bi bi-check-lg"></i>
                                        )}
                                      </Button>
                                      <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        onClick={() => handleCancelUpdate(rdvId)}
                                        disabled={isUpdating || rdvIsPast}
                                        title={rdvIsPast ? "Impossible de modifier un rendez-vous passé" : "Annuler la modification"}
                                      >
                                        <i className="bi bi-x-lg"></i>
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <span
                                        style={{
                                            fontSize: '0.75rem',
                                            padding: '0.25rem 0.5rem',
                                            backgroundColor: rdvIsPast ? '#6c757d' : '#198754',
                                            color: 'white',
                                            borderRadius: '0.375rem',
                                            display: 'inline-block',
                                            fontWeight: 500
                                        }}
                                      >
                                        {rdvIsPast ? 'Passé' : 'Validé'}
                                      </span>
                                      <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={() => handleStartEdit(rdvId)}
                                        disabled={isUpdating || rdvIsPast}
                                        title={rdvIsPast ? "Impossible de modifier un rendez-vous passé" : "Modifier le rendez-vous"}
                                      >
                                        <i className="bi bi-pencil"></i>
                                      </Button>
                                      {/* Interrupteur de statut - placé derrière les boutons */}
                                      <div className="d-flex align-items-center ms-2">
                                        <Form.Check
                                          type="switch"
                                          id={`statut-switch-${rdvId}`}
                                          label=""
                                          checked={rdvStatutSwitch[rdvId] || false}
                                          onChange={(e) => handleStatutSwitchChange(rdvId, e.target.checked)}
                                          disabled={isUpdating || rdvIsPast}
                                          title="Patient présent ?"
                                          style={{ cursor: 'pointer' }}
                                        />
                                      </div>
                                    </>
                                  )
                                ) : (
                                  <>
                                    <Button
                                      variant="success"
                                      size="sm"
                                      onClick={() => handleValidateRdv(rdvId)}
                                      disabled={isUpdating || rdvIsPast}
                                      title={rdvIsPast ? "Impossible de valider un rendez-vous passé" : "Valider le rendez-vous"}
                                    >
                                      {isUpdating ? (
                                        <span className="spinner-border spinner-border-sm"></span>
                                      ) : (
                                        <i className="bi bi-check-lg"></i>
                                      )}
                                    </Button>
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      onClick={() => handleCancelEdit(rdvId)}
                                      disabled={isUpdating || rdvIsPast}
                                      title={rdvIsPast ? "Impossible d'annuler un rendez-vous passé" : "Annuler la saisie"}
                                    >
                                      <i className="bi bi-trash"></i>
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                )}
                
                {/* Bouton pour ajouter une nouvelle ligne de rendez-vous */}
                {selectedMedecin && plannings.length > 0 && (
                  <div className="mt-3 d-flex justify-content-end">
                    <Button
                      variant="primary"
                      onClick={handleAddRdvLine}
                      disabled={addingRdv}
                      className="d-flex align-items-center gap-2"
                    >
                      {addingRdv ? (
                        <>
                          <span className="spinner-border spinner-border-sm"></span>
                          Ajout en cours...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-plus-circle"></i>
                          Ajouter une ligne
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <div className="d-flex justify-content-between w-100">
          <div className="d-flex gap-2">
            <Button variant="info" onClick={() => handlePrint('fiche-rendezvous')} disabled={!selectedMedecin || rendezVous.length === 0}>
              <i className="bi bi-file-text me-2"></i>
              FICHE RENDEZ-VOUS DU MEDECIN
            </Button>
            <Button variant="primary" onClick={() => handlePrint('liste-personnes')} disabled={!selectedMedecin || rendezVous.length === 0}>
              <i className="bi bi-people me-2"></i>
              LISTE DES PERSONNES A CONTACTER
            </Button>
            <Button variant="success" onClick={() => handlePrint('liste-medecins')} disabled={!selectedMedecin || plannings.length === 0}>
              <i className="bi bi-hospital me-2"></i>
              LISTE DES MEDECINS A CONTACTER
            </Button>
          </div>
          <Button variant="secondary" onClick={onHide}>
            <i className="bi bi-x-lg me-2"></i>
            Fermer
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
