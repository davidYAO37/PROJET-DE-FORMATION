export interface GuidePoint {
  image: string;
  title: string;
  detail: string;
}

export interface GuideService {
  code: string;
  label: string;
  icon: string;
  color: string;
  intro: string;
  points: GuidePoint[];
}

export const GUIDE_SERVICES: GuideService[] = [
  {
    code: "accueil",
    label: "Service Accueil",
    icon: "bi-people-fill",
    color: "primary",
    intro:
      "Le service Accueil est le point d'entrée du patient : enregistrement, salle d'attente, transfert vers un médecin et suivi des rendez-vous du jour. Voici, point par point, chaque élément de son menu latéral.",
    points: [
      { image: "/guide/accueil/01-tableau-de-bord.png", title: "Tableau de bord", detail: "Vue d'ensemble du service : patients reçus du jour, patients en attente, rendez-vous du jour, avis d'hospitalisation à admettre et planning des rendez-vous (filtrable par jour, semaine ou mois)." },
      { image: "/guide/accueil/02-accueil-patient.png", title: "Accueil Patient", detail: "Formulaire pour enregistrer un nouveau patient ou retrouver un patient existant à l'arrivée à la clinique, avant de l'orienter vers un service." },
      { image: "/guide/accueil/03-transferer-patient.png", title: "Transférer un patient", detail: "Ouvre une fenêtre où vous saisissez le code prestation du patient, puis cliquez sur « Rechercher » pour le transférer vers le médecin ou un autre service." },
      { image: "/guide/accueil/04-salle-attente.png", title: "Salle d'attente", detail: "Affiche la « Salle d'attente du jour » avec la liste des consultations prévues ; un bouton « Actualiser » permet de rafraîchir la liste en temps réel." },
      { image: "/guide/accueil/05-constantes.png", title: "Constantes", detail: "Ouvre le formulaire de saisie des constantes du patient (tension, température, poids, pouls...) avant sa consultation." },
      { image: "/guide/accueil/06-planning-medecin.png", title: "Planning Médecin", detail: "Affiche la liste des plannings de consultation de chaque médecin, pour orienter le patient vers un médecin disponible." },
      { image: "/guide/accueil/07-disponibilite-medecin.png", title: "Disponibilité Médecin", detail: "Permet de vérifier les créneaux de disponibilité d'un médecin avant de programmer ou d'orienter un rendez-vous." },
      { image: "/guide/accueil/08-point-de-saisie.png", title: "Point de saisie", detail: "Récapitule les opérations saisies par l'agent d'accueil dans la journée (contrôle et suivi de l'activité)." },
    ],
  },
  {
    code: "medecin",
    label: "Service Médecin",
    icon: "bi-person-badge-fill",
    color: "success",
    intro:
      "Le tableau de bord Médecin permet de gérer les consultations, prescriptions et rendez-vous. Détail de chaque item du menu.",
    points: [
      { image: "/guide/medecin/01-tableau-de-bord.png", title: "Tableau de bord", detail: "Affiche les patients reçus, en attente et les rendez-vous du jour, ainsi que la liste des patients avec leur dossier (nom, âge, sexe, contact, code dossier)." },
      { image: "/guide/medecin/02-patient-en-attente.png", title: "Patient en attente", detail: "Liste des patients actuellement en salle d'attente pour ce médecin, prêts à être reçus en consultation." },
      { image: "/guide/medecin/03-mes-rendez-vous.png", title: "Mes Rendez-Vous", detail: "Ouvre la fenêtre de gestion des rendez-vous et de la disponibilité du médecin pour planifier ou consulter ses créneaux." },
      { image: "/guide/medecin/04-saisir-fiche-prescription.png", title: "Saisir fiche prescription", detail: "Formulaire pour rédiger une ordonnance ou prescrire des examens (laboratoire, radiologie) pour un patient en consultation." },
      { image: "/guide/medecin/05-comptes-rendus-radio.png", title: "Comptes rendus Radio", detail: "Fenêtre listant les comptes rendus d'imagerie transmis par le service Radiologie pour les patients du médecin." },
      { image: "/guide/medecin/06-statistiques.png", title: "Statistiques", detail: "Donne une vue d'ensemble de l'activité de consultation du médecin (nombre de patients, actes réalisés, etc.)." },
    ],
  },
  {
    code: "infirmier",
    label: "Service Infirmier / Soins",
    icon: "bi-heart-pulse-fill",
    color: "info",
    intro:
      "Le service Infirmier suit les patients pris en charge et la gestion des patients hospitalisés.",
    points: [
      { image: "/guide/infirmier/01-tableau-de-bord.png", title: "Tableau de bord", detail: "Affiche les patients en charge, le nombre de constantes saisies aujourd'hui, le total d'observations, et les avis d'hospitalisation à admettre (avec « Admettre un patient » et « Gestion Chambre »)." },
      { image: "/guide/infirmier/02-liste-des-patients.png", title: "Liste des patients", detail: "Liste complète des patients actuellement pris en charge par l'infirmier connecté, avec accès à leur dossier." },
      { image: "/guide/infirmier/03-patients-hospitalises.png", title: "Patients hospitalisés", detail: "Liste des patients hospitalisés à suivre : saisie des constantes quotidiennes et des observations de soins." },
    ],
  },
  {
    code: "laboratoire",
    label: "Service Laboratoire",
    icon: "bi-virus",
    color: "primary",
    intro:
      "Le service Laboratoire gère la réception des demandes d'examens, la saisie des résultats et leurs paramètres.",
    points: [
      { image: "/guide/laboratoire/01-tableau-de-bord.png", title: "Tableau de bord", detail: "Liste des examens à réceptionner sur la période choisie, avec les boutons « Nouvelle Réception » et « Résultats à saisir et code barre »." },
      { image: "/guide/laboratoire/02-accueil-patient.png", title: "Accueil Patient", detail: "Formulaire pour réceptionner un patient venant réaliser un examen prescrit par un médecin." },
      { image: "/guide/laboratoire/03-liste-resultat-retour.png", title: "Liste Resultat Retour", detail: "Suivi des résultats d'examens en attente de retour vers le service prescripteur." },
      { image: "/guide/laboratoire/04-resultats-valides.png", title: "Resultats Validés", detail: "Fenêtre listant les résultats déjà validés, avec recherche par période, numéro de prestation ou nom de patient." },
      { image: "/guide/laboratoire/05-gestion-automates.png", title: "Gestion des automates", detail: "Configuration de la connexion aux automates de laboratoire pour la récupération automatique des résultats d'examens." },
      { image: "/guide/laboratoire/06-parametres-examens.png", title: "Paramètres Examens", detail: "Définition des examens de biologie proposés par le laboratoire (libellés, tarifs, unités)." },
      { image: "/guide/laboratoire/07-parametres-biochimie.png", title: "Paramètres Biochimie", detail: "Définition des paramètres et valeurs de référence utilisés pour les analyses de biochimie." },
    ],
  },
  {
    code: "biologiste",
    label: "Service Biologiste",
    icon: "bi-microscope",
    color: "info",
    intro:
      "Le biologiste valide les résultats biologiques saisis par le laboratoire avant leur transmission au médecin prescripteur.",
    points: [
      { image: "/guide/biologiste/01-accueil-patient.png", title: "Accueil Patient", detail: "Réception d'un patient venant réaliser un examen biologique prescrit." },
      { image: "/guide/biologiste/02-examens-a-valider.png", title: "Examens à valider", detail: "Tableau de bord listant les résultats biologiques à valider sur la période sélectionnée, avec le nombre de résultats en attente." },
      { image: "/guide/biologiste/03-liste-examens-valides.png", title: "Liste Examens Validés", detail: "Historique des examens déjà validés, consultable par période." },
      { image: "/guide/biologiste/04-gestion-automates.png", title: "Gestion des automates", detail: "Réservé aux administrateurs : configuration des automates connectés au laboratoire." },
      { image: "/guide/biologiste/05-parametres-examens.png", title: "Paramètres Examens", detail: "Définition des examens de biologie proposés et de leurs caractéristiques." },
      { image: "/guide/biologiste/06-parametres-biochimie.png", title: "Paramètres Biochimie", detail: "Définition des paramètres et valeurs de référence en biochimie." },
      { image: "/guide/biologiste/07-statistiques-labo.png", title: "Statistiques Labo", detail: "Analyse du volume d'examens traités par le laboratoire sur la période choisie." },
      { image: "/guide/biologiste/08-releve-de-compte.png", title: "Relevé de Compte", detail: "Relevé de compte du service biologiste, lié à la facturation des examens réalisés." },
    ],
  },
  {
    code: "radio",
    label: "Service Radiologie",
    icon: "bi-broadcast",
    color: "info",
    intro:
      "Le service Radiologie gère les rendez-vous d'imagerie et les comptes rendus des patients.",
    points: [
      { image: "/guide/radio/01-tableau-de-bord.png", title: "Tableau de bord", detail: "Liste des patients à examiner avec recherche par nom, prénom ou numéro de dossier, et accès aux onglets « Compte Rendu à Saisir/Valider » et « Compte Rendus Validés »." },
      { image: "/guide/radio/02-mes-rendez-vous.png", title: "Mes Rendez-Vous", detail: "Fenêtre de gestion des rendez-vous et de la disponibilité du médecin radiologue." },
    ],
  },
  {
    code: "pharmacie",
    label: "Service Pharmacie",
    icon: "bi-capsule",
    color: "danger",
    intro:
      "Le service Pharmacie suit le stock de médicaments, les approvisionnements, les ordonnances et les alertes de péremption.",
    points: [
      { image: "/guide/pharmacie/01-tableau-de-bord.png", title: "Tableau de bord", detail: "Visualisez les ruptures de stock, les articles sous le seuil minimum, les lots bientôt/déjà périmés, et ajoutez une ordonnance à dispenser via « Ajouter une ordonnance »." },
      { image: "/guide/pharmacie/02-gestion-du-stock.png", title: "Gestion du stock", detail: "Consultez et gérez les quantités disponibles pour chaque médicament du stock de la pharmacie." },
      { image: "/guide/pharmacie/03-approvisionnement.png", title: "Approvisionnement", detail: "Créez une commande d'approvisionnement auprès d'un fournisseur pour réapprovisionner le stock." },
      { image: "/guide/pharmacie/04-commandes-en-cours.png", title: "Commandes en cours", detail: "Suivez l'état des commandes d'approvisionnement passées et en attente de livraison." },
      { image: "/guide/pharmacie/05-fournisseurs.png", title: "Fournisseurs", detail: "Gérez la liste de vos fournisseurs de médicaments et leurs coordonnées." },
      { image: "/guide/pharmacie/06-historique-mouvements.png", title: "Historique mouvements", detail: "Consultez l'historique complet des mouvements de stock (entrées, sorties, dispensations)." },
      { image: "/guide/pharmacie/07-mouvements-manuels.png", title: "Mouvements manuels", detail: "Enregistrez un mouvement de stock manuel (perte, correction, don...) hors flux normal de vente." },
      { image: "/guide/pharmacie/08-inventaire-complet.png", title: "Inventaire complet", detail: "Lancez un inventaire complet du stock pharmacie pour vérifier les quantités réelles." },
      { image: "/guide/pharmacie/09-impression-rapports.png", title: "Impression / Rapports", detail: "Générez et imprimez les rapports de stock, de mouvements et de ventes de la pharmacie." },
    ],
  },
  {
    code: "caisse",
    label: "Service Caisse",
    icon: "bi-cash-stack",
    color: "warning",
    intro:
      "Le service Caisse centralise la facturation des consultations, examens et pharmacie, ainsi que les encaissements.",
    points: [
      { image: "/guide/caisse/01-tableau-de-bord.png", title: "Tableau de bord", detail: "Affiche les consultations à facturer, les examens/pharmacie à facturer et les factures à solder, ainsi que la liste des patients avec leur compte." },
      { image: "/guide/caisse/02-compte-patient.png", title: "Compte patient", detail: "Recherchez un patient pour consulter ou solder son compte (consultations, examens, pharmacie)." },
      { image: "/guide/caisse/03-factures-en-attente.png", title: "Factures en attente", detail: "Liste des consultations et prestations à facturer avant encaissement." },
      { image: "/guide/caisse/04-saisie-auto-facture.png", title: "Saisie Auto Facture Exam-Hospit...", detail: "Formulaire « Fiche de saisie » pour facturer automatiquement les examens et frais d'hospitalisation d'un patient (actes, part assurance, part patient, mode de paiement)." },
      { image: "/guide/caisse/05-saisie-manuelle-facture.png", title: "Saisie Manuelle Facture Exam-Hospit...", detail: "Variante manuelle de la saisie de facture pour les examens et l'hospitalisation, en cas de besoin d'ajustement." },
      { image: "/guide/caisse/06-facturer-pharmacie.png", title: "Facturer une pharmacie", detail: "Facturez la dispensation de médicaments réalisée par le service Pharmacie pour un patient." },
      { image: "/guide/caisse/07-facture-a-solder.png", title: "Facture à solder", detail: "Liste des factures partiellement payées restant à solder pour les patients." },
      { image: "/guide/caisse/08-point-de-caisse.png", title: "Point de caisse", detail: "Effectuez la clôture de caisse en fin de journée ou de poste (total encaissé, moyens de paiement)." },
      { image: "/guide/caisse/09-liste-encaissement.png", title: "Liste encaissement", detail: "Historique de tous les encaissements réalisés à la caisse." },
      { image: "/guide/caisse/10-liste-facture-annulee.png", title: "Liste Facture Annulée", detail: "Liste des factures annulées, avec droit de validation par un responsable." },
      { image: "/guide/caisse/11-imprimer-facture.png", title: "Imprimer Facture", detail: "Réimprimez une facture déjà émise pour un patient." },
    ],
  },
  {
    code: "facturation",
    label: "Service Facturation",
    icon: "bi-receipt-cutoff",
    color: "primary",
    intro:
      "Le service Facturation suit les honoraires à reverser aux médecins et la facturation des assurances/tiers-payants.",
    points: [
      { image: "/guide/facturation/01-tableau-de-bord.png", title: "Tableau de bord", detail: "Sélectionnez le mois et l'année pour afficher les honoraires médecins (montant net à payer, payé, reste à payer) et la facturation assurances (à déposer, déposées, recouvrées)." },
      { image: "/guide/facturation/02-honoraires-medecins.png", title: "Honoraires Médecins", detail: "Détail des honoraires par médecin : fiches soldées et non soldées, avec possibilité d'ouvrir chaque fiche." },
      { image: "/guide/facturation/03-facturation-assurances.png", title: "Facturation assurances", detail: "Suivi des factures à déposer, déjà déposées et recouvrées auprès des compagnies d'assurance." },
    ],
  },
  {
    code: "comptabilite",
    label: "Service Comptabilité",
    icon: "bi-calculator-fill",
    color: "secondary",
    intro:
      "Le service Comptabilité donne une vue financière globale de la clinique : recettes, dépenses, débiteurs et bilan.",
    points: [
      { image: "/guide/comptabilite/01-tableau-de-bord.png", title: "Tableau de bord", detail: "Recettes du jour (total actes, part assurance, encaissé patients, reste à payer, remises accordées) et opérations en attente de règlement (honoraires médecins, factures assurances)." },
      { image: "/guide/comptabilite/02-honoraires.png", title: "Honoraires", detail: "Détail des honoraires à verser aux médecins de la clinique." },
      { image: "/guide/comptabilite/03-caisse.png", title: "Caisse", detail: "Vue comptable des opérations de caisse de l'établissement." },
      { image: "/guide/comptabilite/04-etat-des-entrees.png", title: "État des entrées", detail: "Suivi de tous les mouvements financiers entrants de la clinique." },
      { image: "/guide/comptabilite/05-etat-des-sorties.png", title: "État des sorties", detail: "Suivi de tous les mouvements financiers sortants (dépenses, achats, charges)." },
      { image: "/guide/comptabilite/06-bilan-financier.png", title: "Bilan financier", detail: "Bilan financier global de l'établissement sur la période choisie." },
      { image: "/guide/comptabilite/07-budget-de-tresorerie.png", title: "Budget de trésorerie", detail: "Budget de trésorerie prévisionnel pour anticiper les flux financiers à venir." },
      { image: "/guide/comptabilite/08-recette-depense.png", title: "Recette / Dépense", detail: "Enregistrement manuel d'une recette ou d'une dépense hors facturation patient." },
      { image: "/guide/comptabilite/09-debiteurs.png", title: "Débiteurs", detail: "Suivi des patients ou organismes débiteurs envers la clinique." },
      { image: "/guide/comptabilite/10-facturation-assurances.png", title: "Facturation assurances", detail: "État du recouvrement des factures auprès des compagnies d'assurance." },
    ],
  },
];

export function getGuideService(code: string): GuideService | undefined {
  return GUIDE_SERVICES.find((s) => s.code === code);
}
