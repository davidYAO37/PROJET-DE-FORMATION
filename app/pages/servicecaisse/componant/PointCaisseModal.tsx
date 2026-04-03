'use client';

import { useState, useEffect } from 'react';
import { Modal, Form, Button, Table, Card, Tabs, Tab } from 'react-bootstrap';
import { FaCalendarAlt, FaFilter, FaPrint, FaUser, FaCreditCard, FaLayerGroup, FaCalendarDay, FaCalendarCheck, FaEye, FaUserTie } from 'react-icons/fa';

interface PointCaisseModalProps {
  show: boolean;
  onHide: () => void;
}

interface Encaissement {
  _id: string;
  DateEncaissement: string | Date;
  Type: string;
  Patient: string;
  Assurance: string;
  Designation: string;
  Totalacte: number;
  Taux: number;
  PartAssurance: number;
  PartPatient: number;
  Montantencaisse: number;
  REMISE: number;
  Restapayer: number;
  Medecin: string;
  Caissiere: string;
}

/** Affiche la partie date calendaire sans décalage fuseau (préfixe YYYY-MM-DD des ISO Mongo). */
function formaterDateColonne(valeur: string | Date | undefined | null): string {
  if (valeur === undefined || valeur === null || valeur === '') return '';
  if (valeur instanceof Date) {
    if (Number.isNaN(valeur.getTime())) return '';
    return valeur.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  const s = String(valeur).trim();
  const ymd = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) {
    const [, y, m, d] = ymd;
    return `${d}/${m}/${y}`;
  }
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  return s;
}

const PointCaisseModal: React.FC<PointCaisseModalProps> = ({ show, onHide }) => {
  const [encaissements, setEncaissements] = useState<Encaissement[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [modeAffichage, setModeAffichage] = useState<'famille' | 'detail'>('famille');
  const [ongletActif, setOngletActif] = useState<'parCaissiere' | 'statutPatient'>('parCaissiere');
  const [modePaiement, setModePaiement] = useState('TOUS LES PAIEMENTS');
  const [typePatient, setTypePatient] = useState('');
  const [caissiere, setCaissiere] = useState('');
  const [modesPaiement, setModesPaiement] = useState<string[]>([]);
  const [caissieres, setCaissieres] = useState<any[]>([]);

  // Initialiser les dates avec le mois actuel
  useEffect(() => {
    const now = new Date();
    const premierJour = new Date(now.getFullYear(), now.getMonth(), 1);
    const dernierJour = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    setDateDebut(premierJour.toISOString().split('T')[0]);
    setDateFin(dernierJour.toISOString().split('T')[0]);
  }, []);

  // Charger les modes de paiement depuis le modèle
  useEffect(() => {
    const chargerModesPaiement = async () => {
      try {
        const response = await fetch('/api/modepaiement');
        if (response.ok) {
          const data = await response.json();
          setModesPaiement(data.data || []);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des modes de paiement:', error);
      }
    };

    chargerModesPaiement();
  }, []);

  // Charger les caissières de la même société
  useEffect(() => {
    const chargerCaissieres = async () => {
      try {
        // Récupérer l'ID entreprise depuis localStorage
        const idEntreprise = localStorage.getItem('IdEntreprise');
        const uidUtilisateur = localStorage.getItem('uid');

        if (idEntreprise) {
          const response = await fetch(`/api/utilisateurs?entrepriseId=${idEntreprise}`);
          if (response.ok) {
            const data = await response.json();
            setCaissieres(data.data || []);

            // Sélectionner l'utilisateur actuel par défaut
            if (uidUtilisateur) {
              const utilisateurActuel = data.data?.find((user: any) =>
                user.uid === uidUtilisateur
              );
              if (utilisateurActuel) {
                setCaissiere(`${utilisateurActuel.nom} ${utilisateurActuel.prenom}`);
              }
            }
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des caissières:', error);
      }
    };

    chargerCaissieres();
  }, []);

  // Charger les encaissements selon les filtres
  const chargerEncaissements = async (overrides?: Partial<{
    dateDebut: string;
    dateFin: string;
    modeAffichage: 'famille' | 'detail';
    ongletActif: 'parCaissiere' | 'statutPatient';
    modePaiement: string;
    typePatient: string;
    caissiere: string;
  }>): Promise<Encaissement[]> => {
    const filtres = {
      dateDebut,
      dateFin,
      modeAffichage,
      ongletActif,
      modePaiement,
      typePatient,
      caissiere,
      ...overrides
    };

    if (!filtres.dateDebut || !filtres.dateFin) {
      alert('Veuillez sélectionner une période');
      return [];
    }

    setLoading(true);
    try {
      // Construire l'URL avec les paramètres de filtre
      const params = new URLSearchParams({
        dateDebut: filtres.dateDebut,
        dateFin: filtres.dateFin,
        modeAffichage: filtres.modeAffichage,
        ongletActif: filtres.ongletActif,
        modePaiement: filtres.modePaiement,
        typePatient: filtres.typePatient,
        caissiere: filtres.caissiere
      });

      const response = await fetch(`/api/pointcaisse?${params}`);

      if (response.ok) {
        const data = await response.json();

        if (data.success) {
          const liste = data.data || [];
          setEncaissements(liste);
          return liste;
        } else {
          console.error('Erreur API:', data.message);
          setEncaissements([]);
          return [];
        }
      } else {
        console.error('Erreur HTTP:', response.status);
        setEncaissements([]);
        return [];
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de chargement des données');
      setEncaissements([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Calculer les totaux
  const calculerTotaux = () => {
    const totalActe = encaissements.reduce((sum, enc) => sum + (enc.Totalacte || 0), 0);
    const totalAssurance = encaissements.reduce((sum, enc) => sum + (enc.PartAssurance || 0), 0);
    const totalPatient = encaissements.reduce((sum, enc) => sum + (enc.PartPatient || 0), 0);
    const totalRemise = encaissements.reduce((sum, enc) => sum + (enc.REMISE || 0), 0);
    const totalEncaisse = encaissements.reduce((sum, enc) => sum + (enc.Montantencaisse || 0), 0);
    const totalReste = encaissements.reduce((sum, enc) => sum + (enc.Restapayer || 0), 0);

    return {
      totalActe,
      totalAssurance,
      totalPatient,
      totalRemise,
      totalEncaisse,
      totalReste
    };
  };

  // Libellés d'impression (logique WinDev)
  const majuscule = (s: string) => (s || '').toUpperCase();
  const echapperHtml = (s: string) =>
    (s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const libellePointFicheRecette = (): string => {
    const gsMaCaissiere = (caissiere || '').trim();
    if (gsMaCaissiere === '') {
      return 'Point de toutes les caisses';
    }
    return `Point de :\t${gsMaCaissiere}`;
  };

  const libelleEtTitreSuiviActivites = (): { LIB_Caissiere: string; TITREDOC: string } => {
    const gsTypePatient = (typePatient || '').trim();
    const gsMaCaissiere = (caissiere || '').trim();
    const gsModepaiement = (modePaiement || '').trim();

    if (gsTypePatient === '') {
      let LIB_Caissiere: string;
      if (gsMaCaissiere === '') {
        LIB_Caissiere = `PAIEMENT ${majuscule(gsModepaiement)} DE LA CAISSE`;
      } else {
        LIB_Caissiere = `POINT : ${majuscule(gsModepaiement)} DE L'AGENT\t${majuscule(gsMaCaissiere)}`;
      }
      const TITREDOC = `FICHE SUIVI DE RECETTE ${majuscule(gsModepaiement)} / CREDIT`;
      return { LIB_Caissiere, TITREDOC };
    }
    const LIB_Caissiere = `PAIEMENT ${majuscule(gsTypePatient)} DE LA CAISSE`;
    const TITREDOC = `FICHE SUIVI DE RECETTE ${majuscule(gsTypePatient)} / CREDIT`;
    return { LIB_Caissiere, TITREDOC };
  };

  // Fonction pour générer le contenu imprimable formaté
  const genererContenuImprimable = (type: 'suivi' | 'fiche', donnees: Encaissement[] = encaissements) => {
    const { LIB_Caissiere: libSuivi, TITREDOC } = libelleEtTitreSuiviActivites();
    const libFiche = libellePointFicheRecette();

    const titreDocument =
      type === 'suivi' ? TITREDOC : 'FICHE SUIVI DE RECETTE EN ESPECE';
    const sousTeteImpression =
      type === 'suivi'
        ? echapperHtml(libSuivi)
        : echapperHtml(libFiche);

    const contenu = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${echapperHtml(titreDocument)}</title>
    <style>
        @page {
            margin: 1cm;
            size: A4 portrait;
        }
        body {
            font-family: 'Times New Roman', serif;
            font-size: 12px;
            margin: 0;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
        }
        .titre {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .periode {
            font-size: 14px;
            margin-bottom: 5px;
        }
        .point {
            font-size: 14px;
            font-weight: bold;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th {
            background-color: #f0f0f0;
            border: 1px solid #000;
            padding: 8px;
            text-align: center;
            font-weight: bold;
            font-size: 11px;
        }
        td {
            border: 1px solid #000;
            padding: 6px;
            font-size: 11px;
        }
        .text-center {
            text-align: center;
        }
        .text-right {
            text-align: right;
        }
        .total-row {
            background-color: #e0e0e0;
            font-weight: bold;
        }
        .footer {
            margin-top: 30px;
            text-align: right;
            font-size: 11px;
        }
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="titre">${echapperHtml(titreDocument)}</div>
        <div class="periode">Période du ${new Date(dateDebut).toLocaleDateString('fr-FR')} au ${new Date(dateFin).toLocaleDateString('fr-FR')}</div>
        <div class="point" style="white-space: pre-wrap">${sousTeteImpression}</div>
    </div>
    
    <table>
        <thead>
            ${type === 'fiche' ? `
            <tr>
                <th>Date</th>
                <th>Patient</th>
                <th>Assurance</th>
                <th>Designation</th>
                <th>Taux</th>
                <th>PartPatient</th>
                <th>Medecin</th>
            </tr>
            ` : `
            <tr>
                <th>Date</th>
                <th>Patient</th>
                <th>Assurance</th>
                <th>Designation</th>
                <th>Total Acte</th>
                <th>Taux</th>
                <th>Part Assurance</th>
                <th>Part Patient</th>
                <th>Montant Encaissé</th>
                <th>Remise</th>
                <th>Reste à Payer</th>
                <th>Médecin</th>
            </tr>
            `}
        </thead>
        <tbody>
            ${donnees.map(enc => type === 'fiche' ? `
                <tr>
                    <td class="text-center">${formaterDateColonne(enc.DateEncaissement)}</td>
                    <td>${enc.Patient || ''}</td>
                    <td>${enc.Assurance || ''}</td>
                    <td>${enc.Designation || ''}</td>
                    <td class="text-center">${enc.Taux || 0}%</td>
                    <td class="text-right">${enc.PartPatient?.toLocaleString() || 0}</td>
                    <td>${enc.Medecin || ''}</td>
                </tr>
            ` : `
                <tr>
                    <td class="text-center">${formaterDateColonne(enc.DateEncaissement)}</td>
                    <td>${enc.Patient || ''}</td>
                    <td>${enc.Assurance || ''}</td>
                    <td>${enc.Designation || ''}</td>
                    <td class="text-end">${enc.Totalacte?.toLocaleString() || 0}</td>
                    <td class="text-center">${enc.Taux || 0}%</td>
                    <td class="text-end">${enc.PartAssurance?.toLocaleString() || 0}</td>
                    <td class="text-end">${enc.PartPatient?.toLocaleString() || 0}</td>
                    <td class="text-end">${enc.Montantencaisse?.toLocaleString() || 0}</td>
                    <td class="text-end">${enc.REMISE?.toLocaleString() || 0}</td>
                    <td class="text-end">${enc.Restapayer?.toLocaleString() || 0}</td>
                    <td>${enc.Medecin || ''}</td>
                </tr>
            `).join('')}
        </tbody>
        ${type === 'fiche' ? `
        <tfoot>
            <tr class="total-row">
                <td colspan="5" class="text-right">TOTAL PART PATIENT :</td>
                <td class="text-right">${donnees.reduce((sum, enc) => sum + (enc.PartPatient || 0), 0).toLocaleString()}</td>
                <td></td>
            </tr>
        </tfoot>
        ` : `
        <tfoot>
            <tr class="total-row">
                <td colspan="4" class="text-right">TOTAL :</td>
                <td class="text-right">${totaux.totalActe?.toLocaleString() || 0}</td>
                <td></td>
                <td class="text-right">${totaux.totalAssurance?.toLocaleString() || 0}</td>
                <td class="text-right">${totaux.totalPatient?.toLocaleString() || 0}</td>
                <td class="text-right">${totaux.totalEncaisse?.toLocaleString() || 0}</td>
                <td class="text-right">${totaux.totalRemise?.toLocaleString() || 0}</td>
                <td class="text-right">${totaux.totalReste?.toLocaleString() || 0}</td>
                <td></td>
            </tr>
        </tfoot>
        `}
    </table>
    
    <div class="footer">
        Imprimé par ${localStorage.getItem('uid') || 'Utilisateur'} le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
    </div>
</body>
</html>`;

    return contenu;
  };

  // Fonctions d'impression
  const imprimerSuiviActivites = () => {
    console.log("iAperçu() - SUIVIE DES ACTIVITES DE LA CAISSE");
    console.log("Date Début:", dateDebut);
    console.log("Date Fin:", dateFin);

    const contenu = genererContenuImprimable('suivi');
    const nouvelleFenetre = window.open('', '_blank');
    if (nouvelleFenetre) {
      nouvelleFenetre.document.write(contenu);
      nouvelleFenetre.document.close();
      nouvelleFenetre.focus();
      setTimeout(() => {
        nouvelleFenetre.print();
      }, 500);
    }
  };

  const imprimerFicheSuiviRecette = async () => {
    let gsMaCaissiere = "";
    if (!caissiere || caissiere === "") {
      gsMaCaissiere = "";
    } else {
      gsMaCaissiere = caissiere;
    }

    // Recharger avant impression pour garantir les données à jour.
    const donneesImpression = await chargerEncaissements();
    const contenu = genererContenuImprimable('fiche', donneesImpression);
    const nouvelleFenetre = window.open('', '_blank');
    if (nouvelleFenetre) {
      nouvelleFenetre.document.write(contenu);
      nouvelleFenetre.document.close();
      nouvelleFenetre.focus();
      setTimeout(() => {
        nouvelleFenetre.print();
      }, 500);
    }
  };

  const totaux = calculerTotaux();

  // Obtenir le titre selon les filtres
  const getTitre = () => {
    let titre = 'LISTE DES ENCAISSEMENTS';

    // Logique WinDev pour l'onglet "Recherche Caissiere" (avec caissière et mode de paiement)
    if (ongletActif === 'parCaissiere') {
      // SI COMBO_Choisir_la_caissière..ValeurAffichée="" ALORS
      //   TABLE_ESPECE..Libellé="LISTE DES ENCAISSEMENTS"+" "+Majuscule(COMBO_Choisir_le_mode_de_paiement..ValeurAffichée)
      // SINON
      //   TABLE_ESPECE..Libellé="LISTE DES ENCAISSEMENTS"+" "+Majuscule(COMBO_Choisir_le_mode_de_paiement..ValeurAffichée)+" "+" DE"+" "+Majuscule(COMBO_Choisir_la_caissière..ValeurAffichée)
      // FIN
      if (modePaiement !== 'TOUS LES PAIEMENTS' && modePaiement !== '') {
        titre += ` ${modePaiement.toUpperCase()}`;
      }

      if (caissiere !== '') {
        titre += ` DE ${caissiere.toUpperCase()}`;
      }
    } else {
      // Logique WinDev pour l'onglet "Par Statut Patient" (type de patient)
      // TABLE_ESPECE..Libellé="LISTE DES ENCAISSEMENTS"+" "+Majuscule(COMBO_Choisir_le_type_patient..ValeurAffichée)
      if (typePatient !== '') {
        titre += ` ${typePatient.toUpperCase()}`;
      }
    }

    return titre;
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="xl"
      backdrop="static"
    >
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title className="d-flex align-items-center">
          <FaCalendarAlt className="me-2" />
          Point de Caisse
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* Formulaire de filtrage professionnel */}
        <Card className="border-0 shadow-sm mb-4">
          <Card.Header className="bg-gradient-primary text-white py-3">
            <div className="d-flex align-items-center">
              <FaFilter className="me-2" />
              <h6 className="mb-0 fw-bold">Filtres de Recherche</h6>
            </div>
          </Card.Header>
          <Card.Body>
            {/* Première ligne de filtres */}
            <div className="row g-3 mb-3">
              <div className="col-md-4">
                <Form.Label className="fw-semibold text-muted small">
                  <FaCalendarDay className="me-1" />
                  Date Début
                </Form.Label>
                <Form.Control
                  type="date"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  className="border-primary-subtle"
                />
              </div>

              <div className="col-md-4">
                <Form.Label className="fw-semibold text-muted small">
                  <FaCalendarCheck className="me-1" />
                  Date Fin
                </Form.Label>
                <Form.Control
                  type="date"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                  className="border-primary-subtle"
                />
              </div>

              <div className="col-md-4">
                <Form.Label className="fw-semibold text-muted small">
                  <FaEye className="me-1" />
                  Mode Affichage
                </Form.Label>
                <Form.Select
                  value={modeAffichage}
                  onChange={(e) => {
                    const newModeAffichage = e.target.value;

                    // Logique WinDev : TABLE_ESPECE.SupprimeTout()
                    setEncaissements([]);
                    setModeAffichage(newModeAffichage as 'famille' | 'detail');

                    // Recharger les données avec le nouveau mode d'affichage
                    setTimeout(() => {
                      chargerEncaissements({ modeAffichage: newModeAffichage as 'famille' | 'detail' });
                    }, 100);
                  }}
                  className="border-primary-subtle"
                >
                  <option value="famille">PAR FAMILLE</option>
                  <option value="detail">PAR DETAIL</option>
                </Form.Select>
              </div>
            </div>

            {/* Tabs pour les différents modes de recherche */}
            <div className="mt-4">
              <Tabs
                activeKey={ongletActif}
                onSelect={(k) => {
                  const nouvelOnglet = k as 'parCaissiere' | 'statutPatient';

                  // Logique WinDev : TABLE_ESPECE.SupprimeTout() au changement d'onglet
                  setEncaissements([]);
                  setOngletActif(nouvelOnglet);

                  // Réinitialiser les filtres spécifiques à l'onglet
                  if (nouvelOnglet === 'parCaissiere') {
                    // Réinitialiser les filtres de l'onglet statutPatient
                    setTypePatient('');
                  } else {
                    // Réinitialiser les filtres de l'onglet parCaissiere
                    setModePaiement('TOUS LES PAIEMENTS');
                    setCaissiere('');
                  }

                  // Recharger les données après le changement d'onglet
                  setTimeout(() => {
                    chargerEncaissements({
                      ongletActif: nouvelOnglet,
                      typePatient: nouvelOnglet === 'parCaissiere' ? '' : typePatient,
                      modePaiement: nouvelOnglet === 'statutPatient' ? 'TOUS LES PAIEMENTS' : modePaiement,
                      caissiere: nouvelOnglet === 'statutPatient' ? '' : caissiere
                    });
                  }, 100);
                }}
                className="mb-4"
              >
                <Tab eventKey="parCaissiere" title={
                  <span>
                    <FaUserTie className="me-2" />
                    Recherche par Caissière
                  </span>
                }>
                  <Card className="border-0 bg-light">
                    <Card.Body className="p-4">
                      <div className="row g-4">
                        <div className="col-md-6">
                          <Form.Label className="fw-semibold text-muted small">
                            <FaCreditCard className="me-1" />
                            Choisir le mode de paiement
                          </Form.Label>
                          <Form.Select
                            value={modePaiement}
                            onChange={(e) => {
                              const newModePaiement = e.target.value;

                              // Logique WinDev : gsModepaiement=MoiMême..ValeurAffichée
                              // ExécuteTraitement(BTN_Affiche_tous,trtClic)
                              setModePaiement(newModePaiement);

                              // Simuler l'exécution de BTN_Affiche_tous
                              // SELON SEL_AFFICHAGE_ACTE
                              if (modeAffichage === 'famille') {
                                // CAS 1 - PAR FAMILLE
                                if (ongletActif === 'parCaissiere') {
                                  // CAS 1 - Onglet caissière
                                  if (newModePaiement === 'TOUS LES PAIEMENTS' || newModePaiement === '') {
                                    // TOUS_LES_PAIEMENT_CAISSE()
                                    setEncaissements([]);
                                    setTimeout(() => chargerEncaissements({ modePaiement: newModePaiement }), 100);
                                  } else {
                                    // Paiement_par_mode_de_paiement()
                                    setEncaissements([]);
                                    setTimeout(() => chargerEncaissements({ modePaiement: newModePaiement }), 100);
                                  }
                                } else {
                                  // AUTRE CAS - Onglet statutPatient
                                  // TABLE_ESPECE.SupprimeTout()
                                  // Tous_paiement_par_typePatient()
                                  setEncaissements([]);
                                  setTimeout(() => chargerEncaissements({ modePaiement: newModePaiement }), 100);
                                }
                              } else {
                                // CAS 2 - PAR DETAIL
                                if (ongletActif === 'parCaissiere') {
                                  if (newModePaiement === 'TOUS LES PAIEMENTS' || newModePaiement === '') {
                                    // TOUS_LES_PAIEMENT_CAISSE_detail()
                                    setEncaissements([]);
                                    setTimeout(() => chargerEncaissements({ modePaiement: newModePaiement }), 100);
                                  } else {
                                    // Paiement_par_mode_de_paiement_detail()
                                    setEncaissements([]);
                                    setTimeout(() => chargerEncaissements({ modePaiement: newModePaiement }), 100);
                                  }
                                } else {
                                  // AUTRE CAS - Onglet statutPatient
                                  // TABLE_ESPECE.SupprimeTout()
                                  // Tous_paiement_par_typePatient_detail()
                                  setEncaissements([]);
                                  setTimeout(() => chargerEncaissements({ modePaiement: newModePaiement }), 100);
                                }
                              }
                            }}
                            className="border-primary-subtle shadow-sm"
                          >
                            <option value="TOUS LES PAIEMENTS">TOUS LES PAIEMENTS</option>
                            {modesPaiement.map((mode: any, index) => (
                              <option key={index} value={mode.Modepaiement}>
                                {mode.Modepaiement}
                              </option>
                            ))}
                          </Form.Select>
                        </div>

                        <div className="col-md-6">
                          <Form.Label className="fw-semibold text-muted small">
                            <FaUserTie className="me-1" />
                            Choisir la caissière
                          </Form.Label>
                          <Form.Select
                            value={caissiere}
                            onChange={(e) => {
                              const newCaissiere = e.target.value;

                              // Logique WinDev : SI MoiMême..ValeurAffichée="" ALORS
                              if (!newCaissiere) {
                                // ExécuteTraitement(BTN_Affiche_tous,trtClic)
                                setCaissiere("");
                                setModePaiement("TOUS LES PAIEMENTS");

                                // Simuler BTN_Affiche_tous
                                setEncaissements([]);
                                setTimeout(() => chargerEncaissements({ caissiere: "", modePaiement: "TOUS LES PAIEMENTS" }), 100);
                                return;
                              }

                              // SINON SI COMBO_Choisir_le_mode_de_paiement..ValeurAffichée="" ALORS
                              if (!modePaiement || modePaiement === "" || modePaiement === "TOUS LES PAIEMENTS") {
                                alert("Veuillez sélectionner le mode de paiement");
                                return;
                              }

                              setCaissiere(newCaissiere);

                              // Logique WinDev : Mise à jour du libellé
                              // SI COMBO_Choisir_la_caissière..ValeurAffichée="" ALORS
                              //   TABLE_ESPECE..Libellé="LISTE DES ENCAISSEMENTS"+" "+Majuscule(COMBO_Choisir_le_mode_de_paiement..ValeurAffichée)
                              // SINON
                              //   TABLE_ESPECE..Libellé="LISTE DES ENCAISSEMENTS"+" "+Majuscule(COMBO_Choisir_le_mode_de_paiement..ValeurAffichée)+" "+" DE"+" "+Majuscule(COMBO_Choisir_la_caissière..ValeurAffichée)
                              // FIN
                              // TABLE_ESPECE.SupprimeTout()

                              setEncaissements([]);

                              // Logique WinDev : SELON SEL_AFFICHAGE_ACTE
                              if (modeAffichage === 'famille') {
                                // CAS 1 - PAR FAMILLE
                                if (modePaiement === 'TOUS LES PAIEMENTS') {
                                  // Tous_paiement_par_caissiere()
                                  setTimeout(() => chargerEncaissements({ caissiere: newCaissiere }), 100);
                                } else {
                                  // Par_mode_par_caissiere()
                                  setTimeout(() => chargerEncaissements({ caissiere: newCaissiere }), 100);
                                }
                              } else {
                                // CAS 2 - PAR DETAIL
                                if (modePaiement === 'TOUS LES PAIEMENTS') {
                                  // Tous_paiement_par_caissiere_detail()
                                  setTimeout(() => chargerEncaissements({ caissiere: newCaissiere }), 100);
                                } else {
                                  // Par_mode_par_caissiere_detail()
                                  setTimeout(() => chargerEncaissements({ caissiere: newCaissiere }), 100);
                                }
                              }
                            }}
                            className="border-primary-subtle shadow-sm"
                          >
                            <option value="">Toutes les caissières</option>
                            {caissieres.map((caiss, index) => (
                              <option key={index} value={`${caiss.nom} ${caiss.prenom}`}>
                                {caiss.nom} {caiss.prenom}
                              </option>
                            ))}
                          </Form.Select>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Tab>

                <Tab eventKey="statutPatient" title={
                  <span>
                    <FaUser className="me-2" />
                    Recherche par Statut Patient
                  </span>
                }>
                  <Card className="border-0 bg-light">
                    <Card.Body className="p-4">
                      <div className="row g-4">
                        <div className="col-md-6">
                          <Form.Label className="fw-semibold text-muted small">
                            <FaUser className="me-1" />
                            Choisir le type de patient
                          </Form.Label>
                          <Form.Select
                            value={typePatient}
                            onChange={(e) => {
                              const newTypePatient = e.target.value;

                              // Logique WinDev : SI MoiMême..ValeurAffichée="" ALORS
                              if (!newTypePatient) {
                                // ExécuteTraitement(BTN_Affiche_tous,trtClic) -> Charger tous les encaissements
                                setTypePatient("");
                                chargerEncaissements({ typePatient: "" });
                                return;
                              }

                              setTypePatient(newTypePatient);
                              chargerEncaissements({ typePatient: newTypePatient });
                            }}
                            className="border-primary-subtle shadow-sm"
                          >
                            <option value="">Tous</option>
                            <option value="NON ASSURE">NON ASSURE</option>
                            <option value="TARIF MUTUALISTE">TARIF MUTUALISTE</option>
                            <option value="TARIF ASSURE">TARIF ASSURE</option>
                          </Form.Select>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Tab>
              </Tabs>
            </div>

            {/* Boutons d'action */}
            <div className="row mt-4">
              <div className="col-md-12">
                <Card className="border-0 bg-gradient-light">
                  <Card.Body className="p-3">
                    <div className="d-flex gap-3">
                      <Button
                        variant="outline-primary"
                        className="flex-fill py-2 px-4"
                        onClick={() => {
                          // Logique WinDev : ExécuteTraitement(BTN_Affiche_tous,trtClic)
                          // SELON SEL_AFFICHAGE_ACTE
                          setEncaissements([]); // TABLE_ESPECE.SupprimeTout()

                          if (modeAffichage === 'famille') {
                            // CAS 1 - PAR FAMILLE
                            if (ongletActif === 'parCaissiere') {
                              // CAS 1 - Onglet caissière
                              if (modePaiement === 'TOUS LES PAIEMENTS' || modePaiement === '') {
                                // TOUS_LES_PAIEMENT_CAISSE()
                                // Ne fait rien de spécial, charge tous les paiements
                              } else {
                                // Paiement_par_mode_de_paiement()
                                // Le filtre de mode paiement est déjà appliqué
                              }
                            } else {
                              // AUTRE CAS - Onglet statutPatient
                              // TABLE_ESPECE.SupprimeTout() - déjà fait
                              // Tous_paiement_par_typePatient()
                              // Le filtre de type patient est déjà appliqué
                            }
                          } else {
                            // CAS 2 - PAR DETAIL
                            if (ongletActif === 'parCaissiere') {
                              if (modePaiement === 'TOUS LES PAIEMENTS' || modePaiement === '') {
                                // TOUS_LES_PAIEMENT_CAISSE_detail()
                              } else {
                                // Paiement_par_mode_de_paiement_detail()
                              }
                            } else {
                              // AUTRE CAS - Onglet statutPatient
                              // TABLE_ESPECE.SupprimeTout() - déjà fait
                              // Tous_paiement_par_typePatient_detail()
                            }
                          }

                          // Recharger les données
                          setTimeout(() => {
                            chargerEncaissements();
                          }, 100);
                        }}
                      >
                        <FaFilter className="me-2" />
                        Afficher tous
                      </Button>
                      <Button
                        variant="primary"
                        className="flex-fill py-2 px-4"
                        onClick={() => chargerEncaissements()}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            Chargement...
                          </>
                        ) : (
                          <>
                            <FaFilter className="me-2" />
                            Filtrer par critères
                          </>
                        )}
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Titre dynamique */}
        <div className="row mb-4">
          <div className="col-md-12">
            <Card className="border-0 bg-primary text-white">
              <Card.Body className="text-center py-3">
                <h5 className="mb-0 fw-bold">
                  <FaCalendarAlt className="me-2" />
                  {getTitre()}
                </h5>
              </Card.Body>
            </Card>
          </div>
        </div>

        {/* Tableau des encaissements */}
        <Card className="border-0 shadow-sm">
          <Card.Header className="bg-dark text-white">
            <h6 className="mb-0">
              <FaCalendarAlt className="me-2" />
              Détail des Encaissements
            </h6>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table striped bordered hover className="mb-0">
                <thead className="table-primary">
                  <tr>
                    <th className="text-center">Date</th>
                    <th className="text-center">Type</th>
                    <th>Patient</th>
                    <th>Assurance</th>
                    <th>Désignation</th>
                    <th className="text-end">Total Acte</th>
                    <th className="text-center">Taux</th>
                    <th className="text-end">Part Assurance</th>
                    <th className="text-end">Part Patient</th>
                    <th className="text-end">Montant Encaissé</th>
                    <th className="text-end">Remise</th>
                    <th className="text-end">Reste à Payer</th>
                    <th>Médecin</th>
                    <th>Caissière</th>
                  </tr>
                </thead>
                <tbody>
                  {encaissements.map((encaissement, index) => (
                    <tr key={encaissement._id || index}>
                      <td className="text-center">{formaterDateColonne(encaissement.DateEncaissement)}</td>
                      <td className="text-center">{encaissement.Type}</td>
                      <td>{encaissement.Patient}</td>
                      <td>{encaissement.Assurance}</td>
                      <td
                        style={
                          modeAffichage === 'detail' && encaissement.Type === 'FACTURATION'
                            ? { whiteSpace: 'pre-line' }
                            : undefined
                        }
                      >
                        {encaissement.Designation}
                      </td>
                      <td className="text-end fw-semibold">{encaissement.Totalacte?.toLocaleString()}</td>
                      <td className="text-center">{encaissement.Taux}%</td>
                      <td className="text-end">{encaissement.PartAssurance?.toLocaleString()}</td>
                      <td className="text-end">{encaissement.PartPatient?.toLocaleString()}</td>
                      <td className="text-end fw-bold text-success">{encaissement.Montantencaisse?.toLocaleString()}</td>
                      <td className="text-end">{encaissement.REMISE?.toLocaleString()}</td>
                      <td className="text-end text-danger">{encaissement.Restapayer?.toLocaleString()}</td>
                      <td>{encaissement.Medecin}</td>
                      <td>{encaissement.Caissiere}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="table-secondary fw-bold">
                  <tr>
                    <td colSpan={5} className="text-end">TOTAUX :</td>
                    <td className="text-end">{totaux.totalActe?.toLocaleString()}</td>
                    <td></td>
                    <td className="text-end">{totaux.totalAssurance?.toLocaleString()}</td>
                    <td className="text-end">{totaux.totalPatient?.toLocaleString()}</td>
                    <td className="text-end">{totaux.totalEncaisse?.toLocaleString()}</td>
                    <td className="text-end">{totaux.totalRemise?.toLocaleString()}</td>
                    <td className="text-end">{totaux.totalReste?.toLocaleString()}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </Table>
            </div>
          </Card.Body>
        </Card>

        {/* Boutons d'action */}
        <div className="row mt-4">
          <div className="col-md-12 text-center">
            <Card className="border-0 bg-light">
              <Card.Body className="p-3">
                <div className="d-flex gap-3 justify-content-center flex-wrap">
                  <Button variant="outline-secondary" onClick={onHide} className="px-4 py-2">
                    Fermer
                  </Button>
                  <Button
                    variant="success"
                    className="px-4 py-2"
                    onClick={imprimerSuiviActivites}
                  >
                    <FaPrint className="me-2" />
                    SUIVIE DES ACTIVITES DE LA CAISSE
                  </Button>
                  <Button
                    variant="primary"
                    className="px-4 py-2"
                    onClick={imprimerFicheSuiviRecette}
                  >
                    <FaPrint className="me-2" />
                    AFFICHER LA FICHE DE SUIVI DE RECETTE
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default PointCaisseModal;
