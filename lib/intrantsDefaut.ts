/**
 * Catalogue par défaut des intrants de laboratoire.
 * Servi par POST /api/intrants/init : crée uniquement les références absentes
 * du tenant (idempotent). Les quantités restent à 0 : le stock s'alimente
 * par les réceptions.
 */
export interface IntrantDefaut {
  reference: string;
  designation: string;
  categorie: string;
  uniteStock: string;
  conditionnement?: string;
  qteParConditionnement?: number;
  seuilMinimum?: number;
  suiviLot?: boolean;
  delaiApresOuvertureJours?: number;
  conservation?: string;
}

export const INTRANTS_DEFAUT: IntrantDefaut[] = [
  // ── Réactifs d'analyse ──────────────────────────────────────────────
  { reference: "REA-GLU", designation: "Réactif glucose (GOD-PAP)", categorie: "Réactif d'analyse", uniteStock: "mL", conditionnement: "flacon", conservation: "2-8°C", seuilMinimum: 100 },
  { reference: "REA-URE", designation: "Réactif urée", categorie: "Réactif d'analyse", uniteStock: "mL", conditionnement: "flacon", conservation: "2-8°C", seuilMinimum: 100 },
  { reference: "REA-CRE", designation: "Réactif créatinine", categorie: "Réactif d'analyse", uniteStock: "mL", conditionnement: "flacon", conservation: "2-8°C", seuilMinimum: 100 },
  { reference: "REA-CHO", designation: "Réactif cholestérol total", categorie: "Réactif d'analyse", uniteStock: "mL", conditionnement: "flacon", conservation: "2-8°C", seuilMinimum: 100 },
  { reference: "REA-TGL", designation: "Réactif triglycérides", categorie: "Réactif d'analyse", uniteStock: "mL", conditionnement: "flacon", conservation: "2-8°C", seuilMinimum: 100 },
  { reference: "REA-ALAT", designation: "Réactif ALAT (GPT)", categorie: "Réactif d'analyse", uniteStock: "mL", conditionnement: "flacon", conservation: "2-8°C", seuilMinimum: 100 },
  { reference: "REA-ASAT", designation: "Réactif ASAT (GOT)", categorie: "Réactif d'analyse", uniteStock: "mL", conditionnement: "flacon", conservation: "2-8°C", seuilMinimum: 100 },
  { reference: "REA-PROT", designation: "Réactif protéines totales", categorie: "Réactif d'analyse", uniteStock: "mL", conditionnement: "flacon", conservation: "2-8°C", seuilMinimum: 50 },
  { reference: "REA-ALB", designation: "Réactif albumine", categorie: "Réactif d'analyse", uniteStock: "mL", conditionnement: "flacon", conservation: "2-8°C", seuilMinimum: 50 },
  { reference: "REA-BIL", designation: "Réactif bilirubine totale", categorie: "Réactif d'analyse", uniteStock: "mL", conditionnement: "flacon", conservation: "2-8°C, à l'abri de la lumière", seuilMinimum: 50 },
  { reference: "REA-DIL", designation: "Diluant hématologie", categorie: "Réactif d'analyse", uniteStock: "L", conditionnement: "bidon", seuilMinimum: 5 },
  { reference: "REA-LYSE", designation: "Solution de lyse hématologie", categorie: "Réactif d'analyse", uniteStock: "mL", conditionnement: "flacon", conservation: "2-8°C", seuilMinimum: 250 },
  { reference: "REA-COAG", designation: "Réactif TP/TCA (thromboplastine)", categorie: "Réactif d'analyse", uniteStock: "mL", conditionnement: "flacon", conservation: "2-8°C", seuilMinimum: 50 },
  { reference: "REA-CACL", designation: "Chlorure de calcium 0,025 M (coagulation)", categorie: "Réactif d'analyse", uniteStock: "mL", conditionnement: "flacon", seuilMinimum: 100 },
  { reference: "REA-GROUP", designation: "Sérum de groupage anti-A / anti-B / anti-D", categorie: "Réactif d'analyse", uniteStock: "mL", conditionnement: "flacon", conservation: "2-8°C", seuilMinimum: 10 },

  // ── Kits et tests unitaires ─────────────────────────────────────────
  { reference: "KIT-HIV", designation: "Test rapide VIH", categorie: "Kit / test unitaire", uniteStock: "test", conditionnement: "boîte", qteParConditionnement: 25, seuilMinimum: 25 },
  { reference: "KIT-HBS", designation: "Test rapide HBsAg (hépatite B)", categorie: "Kit / test unitaire", uniteStock: "test", conditionnement: "boîte", qteParConditionnement: 25, seuilMinimum: 25 },
  { reference: "KIT-HCV", designation: "Test rapide VHC (hépatite C)", categorie: "Kit / test unitaire", uniteStock: "test", conditionnement: "boîte", qteParConditionnement: 25, seuilMinimum: 25 },
  { reference: "KIT-PALU", designation: "Test rapide paludisme (TDR)", categorie: "Kit / test unitaire", uniteStock: "test", conditionnement: "boîte", qteParConditionnement: 25, seuilMinimum: 25 },
  { reference: "KIT-GRAV", designation: "Test de grossesse (hCG urinaire)", categorie: "Kit / test unitaire", uniteStock: "test", conditionnement: "boîte", qteParConditionnement: 25, seuilMinimum: 25 },
  { reference: "KIT-SYPH", designation: "Test rapide syphilis (TPHA/TDR)", categorie: "Kit / test unitaire", uniteStock: "test", conditionnement: "boîte", qteParConditionnement: 25, seuilMinimum: 20 },
  { reference: "KIT-COVID", designation: "Test antigénique COVID-19", categorie: "Kit / test unitaire", uniteStock: "test", conditionnement: "boîte", qteParConditionnement: 25, seuilMinimum: 10 },
  { reference: "KIT-TYPHI", designation: "Test rapide typhoïde", categorie: "Kit / test unitaire", uniteStock: "test", conditionnement: "boîte", qteParConditionnement: 25, seuilMinimum: 20 },
  { reference: "KIT-BAND", designation: "Bandelettes urinaires (10 paramètres)", categorie: "Kit / test unitaire", uniteStock: "bandelette", conditionnement: "flacon", qteParConditionnement: 100, seuilMinimum: 100 },
  { reference: "KIT-GROUP", designation: "Carte de groupage sanguin", categorie: "Kit / test unitaire", uniteStock: "carte", conditionnement: "boîte", seuilMinimum: 20 },
  { reference: "KIT-HBA1C", designation: "Cassette HbA1c", categorie: "Kit / test unitaire", uniteStock: "cassette", conditionnement: "boîte", seuilMinimum: 10 },

  // ── Prélèvement ─────────────────────────────────────────────────────
  { reference: "PRL-TSEC", designation: "Tube sec", categorie: "Prélèvement", uniteStock: "pièce", conditionnement: "sachet", qteParConditionnement: 100, seuilMinimum: 200 },
  { reference: "PRL-TEDTA", designation: "Tube EDTA (violet)", categorie: "Prélèvement", uniteStock: "pièce", conditionnement: "sachet", qteParConditionnement: 100, seuilMinimum: 200 },
  { reference: "PRL-TCIT", designation: "Tube citrate (bleu, coagulation)", categorie: "Prélèvement", uniteStock: "pièce", conditionnement: "sachet", qteParConditionnement: 100, seuilMinimum: 100 },
  { reference: "PRL-TFLUO", designation: "Tube fluorure (gris, glycémie)", categorie: "Prélèvement", uniteStock: "pièce", conditionnement: "sachet", qteParConditionnement: 100, seuilMinimum: 100 },
  { reference: "PRL-AIG", designation: "Aiguille de prélèvement", categorie: "Prélèvement", uniteStock: "pièce", conditionnement: "boîte", qteParConditionnement: 100, seuilMinimum: 200 },
  { reference: "PRL-LANC", designation: "Lancette stérile", categorie: "Prélèvement", uniteStock: "pièce", conditionnement: "boîte", qteParConditionnement: 100, seuilMinimum: 100 },
  { reference: "PRL-ECOU", designation: "Écouvillon stérile", categorie: "Prélèvement", uniteStock: "pièce", conditionnement: "sachet", qteParConditionnement: 100, seuilMinimum: 50 },
  { reference: "PRL-ADHE", designation: "Sparadrap / pansement de prélèvement", categorie: "Prélèvement", uniteStock: "pièce", conditionnement: "boîte", seuilMinimum: 100 },
  { reference: "PRL-GAR", designation: "Garrot", categorie: "Prélèvement", uniteStock: "pièce", seuilMinimum: 5 },

  // ── Recueil et transport ────────────────────────────────────────────
  { reference: "REC-PUR", designation: "Pot à urines stérile", categorie: "Recueil et transport", uniteStock: "pièce", conditionnement: "sachet", seuilMinimum: 100 },
  { reference: "REC-PSE", designation: "Pot à selles stérile", categorie: "Recueil et transport", uniteStock: "pièce", conditionnement: "sachet", seuilMinimum: 50 },
  { reference: "REC-HEMO", designation: "Flacon d'hémoculture", categorie: "Recueil et transport", uniteStock: "pièce", seuilMinimum: 10 },
  { reference: "REC-TRANS", designation: "Milieu de transport (Amies/Stuart)", categorie: "Recueil et transport", uniteStock: "pièce", seuilMinimum: 25 },

  // ── Consommables techniques ─────────────────────────────────────────
  { reference: "CON-EMB", designation: "Embouts de pipette (tips)", categorie: "Consommable technique", uniteStock: "pièce", conditionnement: "sachet", qteParConditionnement: 1000, seuilMinimum: 500 },
  { reference: "CON-CUV", designation: "Cuvettes d'analyse", categorie: "Consommable technique", uniteStock: "pièce", conditionnement: "boîte", seuilMinimum: 100 },
  { reference: "CON-MICR", designation: "Microtubes 1,5 mL", categorie: "Consommable technique", uniteStock: "pièce", conditionnement: "sachet", qteParConditionnement: 500, seuilMinimum: 200 },
  { reference: "CON-ESSAI", designation: "Tubes à essai", categorie: "Consommable technique", uniteStock: "pièce", conditionnement: "sachet", seuilMinimum: 200 },
  { reference: "CON-PAST", designation: "Pipettes Pasteur", categorie: "Consommable technique", uniteStock: "pièce", conditionnement: "sachet", seuilMinimum: 100 },
  { reference: "CON-POCH", designation: "Portoirs / racks à tubes", categorie: "Consommable technique", uniteStock: "pièce", seuilMinimum: 5 },

  // ── Microscopie ─────────────────────────────────────────────────────
  { reference: "MIC-LAME", designation: "Lames de microscope", categorie: "Microscopie", uniteStock: "pièce", conditionnement: "boîte", qteParConditionnement: 50, seuilMinimum: 100 },
  { reference: "MIC-LAMEL", designation: "Lamelles couvre-objet", categorie: "Microscopie", uniteStock: "pièce", conditionnement: "boîte", qteParConditionnement: 100, seuilMinimum: 100 },
  { reference: "MIC-HUILE", designation: "Huile à immersion", categorie: "Microscopie", uniteStock: "mL", conditionnement: "flacon", seuilMinimum: 50 },
  { reference: "MIC-GIEMSA", designation: "Colorant de Giemsa", categorie: "Microscopie", uniteStock: "mL", conditionnement: "flacon", seuilMinimum: 250 },
  { reference: "MIC-GRAM", designation: "Kit de coloration de Gram", categorie: "Microscopie", uniteStock: "kit", seuilMinimum: 1 },
  { reference: "MIC-ZIEHL", designation: "Réactifs de Ziehl-Neelsen", categorie: "Microscopie", uniteStock: "kit", seuilMinimum: 1 },

  // ── Microbiologie ───────────────────────────────────────────────────
  { reference: "MIO-GEL", designation: "Gélose en boîte (milieu préparé)", categorie: "Microbiologie", uniteStock: "boîte", seuilMinimum: 20 },
  { reference: "MIO-GELP", designation: "Gélose déshydratée", categorie: "Microbiologie", uniteStock: "g", conditionnement: "flacon", seuilMinimum: 100 },
  { reference: "MIO-ATB", designation: "Disques d'antibiotiques", categorie: "Microbiologie", uniteStock: "cartouche", seuilMinimum: 5 },
  { reference: "MIO-BRO", designation: "Bouillon de culture", categorie: "Microbiologie", uniteStock: "mL", conditionnement: "flacon", seuilMinimum: 100 },

  // ── Contrôle qualité / calibration ──────────────────────────────────
  { reference: "CQ-NORM", designation: "Sérum de contrôle (niveau normal)", categorie: "Contrôle qualité / calibration", uniteStock: "flacon", seuilMinimum: 2 },
  { reference: "CQ-PATH", designation: "Sérum de contrôle (niveau pathologique)", categorie: "Contrôle qualité / calibration", uniteStock: "flacon", seuilMinimum: 2 },
  { reference: "CQ-CAL", designation: "Calibrateur multiparamétrique", categorie: "Contrôle qualité / calibration", uniteStock: "flacon", seuilMinimum: 1 },
  { reference: "CQ-HEM", designation: "Contrôle hématologie (3 niveaux)", categorie: "Contrôle qualité / calibration", uniteStock: "kit", seuilMinimum: 1 },

  // ── Produits pour automates ─────────────────────────────────────────
  { reference: "AUT-NET", designation: "Solution de nettoyage automate", categorie: "Produit pour automate", uniteStock: "mL", conditionnement: "flacon", seuilMinimum: 500 },
  { reference: "AUT-LAV", designation: "Solution de lavage automate", categorie: "Produit pour automate", uniteStock: "L", conditionnement: "bidon", seuilMinimum: 2 },
  { reference: "AUT-DET", designation: "Détergent enzymatique", categorie: "Produit pour automate", uniteStock: "mL", conditionnement: "flacon", seuilMinimum: 250 },

  // ── Hygiène et protection ───────────────────────────────────────────
  { reference: "HYG-GANT", designation: "Gants d'examen (latex/nitrile)", categorie: "Hygiène et protection", uniteStock: "paire", conditionnement: "boîte", qteParConditionnement: 100, seuilMinimum: 200 },
  { reference: "HYG-MAS", designation: "Masques chirurgicaux", categorie: "Hygiène et protection", uniteStock: "pièce", conditionnement: "boîte", qteParConditionnement: 50, seuilMinimum: 100 },
  { reference: "HYG-DES", designation: "Désinfectant de surfaces", categorie: "Hygiène et protection", uniteStock: "L", conditionnement: "bidon", seuilMinimum: 2 },
  { reference: "HYG-SHA", designation: "Solution hydro-alcoolique", categorie: "Hygiène et protection", uniteStock: "mL", conditionnement: "flacon", seuilMinimum: 500 },
  { reference: "HYG-SAV", designation: "Savon antiseptique", categorie: "Hygiène et protection", uniteStock: "L", conditionnement: "bidon", seuilMinimum: 2 },
  { reference: "HYG-ESS", designation: "Essuie-tout / papier absorbant", categorie: "Hygiène et protection", uniteStock: "rouleau", seuilMinimum: 5 },

  // ── Gestion des déchets ─────────────────────────────────────────────
  { reference: "DEC-SAC", designation: "Sacs à déchets d'activités de soins", categorie: "Gestion des déchets", uniteStock: "pièce", conditionnement: "rouleau", seuilMinimum: 100 },
  { reference: "DEC-COL", designation: "Collecteur d'objets piquants (DASRI)", categorie: "Gestion des déchets", uniteStock: "pièce", seuilMinimum: 10 },

  // ── Produits auxiliaires ────────────────────────────────────────────
  { reference: "AUX-EAU", designation: "Eau distillée / déminéralisée", categorie: "Produit auxiliaire", uniteStock: "L", conditionnement: "bidon", seuilMinimum: 10 },
  { reference: "AUX-ALC", designation: "Alcool 70°", categorie: "Produit auxiliaire", uniteStock: "L", conditionnement: "flacon", seuilMinimum: 2 },
  { reference: "AUX-COT", designation: "Coton hydrophile", categorie: "Produit auxiliaire", uniteStock: "sachet", seuilMinimum: 10 },
  { reference: "AUX-SER", designation: "Sérum physiologique", categorie: "Produit auxiliaire", uniteStock: "mL", conditionnement: "flacon", seuilMinimum: 500 },

  // ── Identification et édition ───────────────────────────────────────
  { reference: "IDE-ETI", designation: "Étiquettes de tubes", categorie: "Identification et édition", uniteStock: "rouleau", seuilMinimum: 2 },
  { reference: "IDE-RUB", designation: "Ruban d'impression / cartouche", categorie: "Identification et édition", uniteStock: "pièce", seuilMinimum: 2 },
  { reference: "IDE-PAP", designation: "Papier d'imprimante", categorie: "Identification et édition", uniteStock: "ramette", seuilMinimum: 5 },
];

/**
 * Règles de comparaison par défaut : intrant (par référence) ↔ prestation
 * (designationacte telle que saisie par le tenant, comparaison sans accents
 * ni casse). Les consommations théoriques sont des estimations génériques
 * à ajuster selon les procédures et automates réels de l'établissement.
 */
export interface RegleComparaisonDefaut {
  referenceIntrant: string;
  /** Noms possibles de l'acte (designationacte) : une règle est créée par nom. */
  prestations: string[];
  consommationTheorique: number;
}

export const REGLES_COMPARAISON_DEFAUT: RegleComparaisonDefaut[] = [
  // Kits et tests unitaires — 1 unité par test
  { referenceIntrant: "KIT-HIV", prestations: ["SERODIAGNOSTIC VIH", "TEST RAPIDE VIH", "VIH 1+2"], consommationTheorique: 1 },
  { referenceIntrant: "KIT-HBS", prestations: ["AG HBS", "AGHBS", "SERODIAGNOSTIC HEPATITE B"], consommationTheorique: 1 },
  { referenceIntrant: "KIT-HCV", prestations: ["AC ANTI-VHC", "VHC", "SERODIAGNOSTIC HEPATITE C"], consommationTheorique: 1 },
  { referenceIntrant: "KIT-PALU", prestations: ["TDR PALUDISME", "TEST RAPIDE PALUDISME", "GOUTTE EPAISSE + TDR"], consommationTheorique: 1 },
  { referenceIntrant: "KIT-GRAV", prestations: ["TEST DE GROSSESSE", "HCG URINAIRE", "BETA-HCG URINAIRE"], consommationTheorique: 1 },
  { referenceIntrant: "KIT-SYPH", prestations: ["TPHA", "TPHA-VDRL", "SERODIAGNOSTIC SYPHILIS"], consommationTheorique: 1 },
  { referenceIntrant: "KIT-TYPHI", prestations: ["SERODIAGNOSTIC FIEVRE TYPHOIDE", "TEST RAPIDE TYPHOIDE", "WIDAL"], consommationTheorique: 1 },
  { referenceIntrant: "KIT-BAND", prestations: ["BANDELETTE URINAIRE", "EXAMEN URINAIRE PAR BANDELETTE"], consommationTheorique: 1 },
  { referenceIntrant: "KIT-GROUP", prestations: ["GROUPAGE SANGUIN ABO-RHESUS", "GROUPAGE SANGUIN"], consommationTheorique: 1 },
  { referenceIntrant: "KIT-HBA1C", prestations: ["HEMOGLOBINE GLYQUEE", "HBA1C"], consommationTheorique: 1 },

  // Réactifs — estimation mL par analyse (à ajuster selon l'automate)
  { referenceIntrant: "REA-GLU", prestations: ["GLYCEMIE", "GLYCEMIE A JEUN"], consommationTheorique: 1 },
  { referenceIntrant: "REA-URE", prestations: ["UREE", "UREMIE"], consommationTheorique: 1 },
  { referenceIntrant: "REA-CRE", prestations: ["CREATININEMIE", "CREATININE"], consommationTheorique: 1 },
  { referenceIntrant: "REA-CHO", prestations: ["CHOLESTEROL TOTAL", "CHOLESTEROLEMIE"], consommationTheorique: 1 },
  { referenceIntrant: "REA-TGL", prestations: ["TRIGLYCERIDES", "TRIGLYCERIDEMIE"], consommationTheorique: 1 },
  { referenceIntrant: "REA-ALAT", prestations: ["ALAT", "TRANSAMINASES ALAT", "SGPT"], consommationTheorique: 1 },
  { referenceIntrant: "REA-ASAT", prestations: ["ASAT", "TRANSAMINASES ASAT", "SGOT"], consommationTheorique: 1 },
  { referenceIntrant: "REA-PROT", prestations: ["PROTEINES TOTALES", "PROTEINEMIE"], consommationTheorique: 1 },
  { referenceIntrant: "REA-ALB", prestations: ["ALBUMINEMIE", "ALBUMINE"], consommationTheorique: 1 },
  { referenceIntrant: "REA-BIL", prestations: ["BILIRUBINE TOTALE", "BILIRUBINEMIE"], consommationTheorique: 1 },
  { referenceIntrant: "REA-GROUP", prestations: ["GROUPAGE SANGUIN ABO-RHESUS", "GROUPAGE SANGUIN"], consommationTheorique: 0.5 },

  // Consommables de prélèvement — rattachés à l'analyse type
  { referenceIntrant: "PRL-TEDTA", prestations: ["NUMERATION FORMULE SANGUINE (NFS)", "NFS", "VITESSE DE SEDIMENTATION"], consommationTheorique: 1 },
  { referenceIntrant: "PRL-TFLUO", prestations: ["GLYCEMIE", "GLYCEMIE A JEUN"], consommationTheorique: 1 },
  { referenceIntrant: "PRL-TCIT", prestations: ["TEMPS DE PROTHROMBINE (TP)", "TP-INR", "TCA"], consommationTheorique: 1 },
  { referenceIntrant: "PRL-TSEC", prestations: ["CREATININEMIE", "IONOGRAMME SANGUIN", "SEROLOGIE"], consommationTheorique: 1 },
  { referenceIntrant: "REC-PUR", prestations: ["ECBU", "EXAMEN CYTO-BACTERIOLOGIQUE DES URINES"], consommationTheorique: 1 },
  { referenceIntrant: "PRL-ECOU", prestations: ["ECOUVILLONNAGE VAGINAL", "ECOUVILLONNAGE URETRAL", "FROTIS CERVICO-VAGINAL"], consommationTheorique: 1 },
  { referenceIntrant: "MIC-LAME", prestations: ["GOUTTE EPAISSE", "FROTTIS SANGUIN", "GOUTTE EPAISSE + TDR"], consommationTheorique: 1 },
  { referenceIntrant: "MIC-GIEMSA", prestations: ["GOUTTE EPAISSE", "FROTTIS SANGUIN"], consommationTheorique: 0.5 },
  { referenceIntrant: "MIO-ATB", prestations: ["ANTIBIOGRAMME"], consommationTheorique: 1 },
];
