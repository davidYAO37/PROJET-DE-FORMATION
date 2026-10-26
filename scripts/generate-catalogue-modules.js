/**
 * Génère un catalogue PDF de présentation des modules Easy Medical.
 * Usage : node scripts/generate-catalogue-modules.js
 * Sortie : catalogue-modules-easy-medical.pdf (racine du projet)
 */
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUTPUT = path.join(ROOT, "catalogue-modules-easy-medical.pdf");
const LOGO = path.join(ROOT, "public", "images", "logo-easy.png");
const GUIDE_DIR = path.join(ROOT, "public", "guide");

// Dossier de captures associé à chaque module (public/guide/<dir>)
const MODULES = [
  {
    code: "accueil",
    label: "Accueil / Patients",
    guideDir: "accueil",
    description:
      "Enregistrement des patients, gestion des dossiers, admission, " +
      "rendez-vous, salle d'attente et orientation vers les services. " +
      "Gestion des assurances et des sociétés partenaires, planning des " +
      "médecins et disponibilités.",
  },
  {
    code: "medecin",
    label: "Médecin / Consultation",
    guideDir: "medecin",
    description:
      "Dossier de consultation complet : constantes, motif, diagnostic, " +
      "examens cliniques et paracliniques, prescriptions médicales, " +
      "ordonnances, demandes d'examens et transfert entre médecins.",
  },
  {
    code: "infirmier",
    label: "Infirmier / Soins",
    guideDir: "infirmier",
    description:
      "Suivi des soins infirmiers, prise des constantes, administration " +
      "des traitements prescrits, pharmacie infirmerie et suivi des " +
      "patients hospitalisés ou ambulants.",
  },
  {
    code: "laboratoire",
    label: "Laboratoire",
    guideDir: "laboratoire",
    description:
      "Réception des demandes d'examens de laboratoire, saisie et " +
      "validation des résultats, gestion des tubes et prélèvements, " +
      "envoi des résultats validés aux prescripteurs.",
  },
  {
    code: "biologiste",
    label: "Biologiste",
    guideDir: "biologiste",
    description:
      "Validation biologique des résultats d'analyses, gestion des " +
      "automates, paramétrage des examens (biochimie, hématologie), " +
      "statistiques et supervision technique du laboratoire.",
  },
  {
    code: "radio",
    label: "Radio / Imagerie",
    guideDir: "radio",
    description:
      "Gestion des demandes d'imagerie (radiologie, échographie, scanner), " +
      "saisie des comptes rendus, archivage des résultats et envoi aux " +
      "médecins prescripteurs.",
  },
  {
    code: "pharmacie",
    label: "Pharmacie",
    guideDir: "pharmacie",
    description:
      "Délivrance des médicaments sur ordonnance, gestion du stock et des " +
      "entrées/sorties, facturation des produits, suivi des parts " +
      "assurance/assuré et gestion des remises.",
  },
  {
    code: "caisse",
    label: "Caisse",
    guideDir: "caisse",
    description:
      "Encaissement des prestations (consultations, examens, médicaments), " +
      "factures en attente et à solder, tickets modérateurs, point de " +
      "caisse et journal des encaissements.",
  },
  {
    code: "facturation",
    label: "Facturation",
    guideDir: "facturation",
    description:
      "Édition des factures patients et sociétés, gestion de la " +
      "tarification des prestations, suivi des impayés et facturation " +
      "globale aux assurances.",
  },
  {
    code: "comptabilite",
    label: "Comptabilité",
    guideDir: "comptabilite",
    description:
      "Suivi comptable de l'activité : journaux de recettes, honoraires " +
      "des médecins, règlements des assurances et sociétés, états de " +
      "synthèse et export des écritures.",
  },
  {
    code: "hospitalisation",
    label: "Hospitalisation",
    guideDir: "hospitalisation",
    description:
      "Gestion des admissions et des séjours : lits, examens " +
      "d'hospitalisation, bloc opératoire, honoraires des médecins, " +
      "sorties et bilans de séjour.",
  },
  {
    code: "operation",
    label: "Paramétrage opération",
    guideDir: "operation",
    description:
      "Configuration de l'établissement : utilisateurs et rôles, " +
      "planning des médecins, prestations, tarifs, services, assurances " +
      "et paramètres généraux.",
  },
  {
    code: "impressions",
    label: "Impressions",
    guideDir: null,
    liste: [
      "Ordonnances et prescriptions médicales",
      "Factures patients et factures détaillées assurance",
      "Bordereaux : consultation, pharmacie, soins et examens, hospitalisation",
      "Reçus : consultation, examen, pharmacie",
      "Certificats de décès et arrêts de travail",
      "Comptes rendus d'examens (laboratoire, imagerie)",
      "Listes de rendez-vous et plannings médecins",
      "États statistiques et rapports d'activité",
    ],
    description:
      "Centre d'impression regroupant tous les documents éditables " +
      "de l'établissement. Les documents imprimables sont :",
  },
  {
    code: "portail_patient",
    label: "Portail Patient",
    guideDir: "portail_patient",
    description:
      "Espace en ligne du patient : prise de rendez-vous avec choix du " +
      "médecin et du créneau, consultation du dossier médical, des " +
      "résultats d'examens et des documents.",
  },
];

const BLEU = "#1a5276";
const BLEU_CLAIR = "#eaf2f8";
const GRIS = "#555555";
const GRIS_CLAIR = "#999999";

const doc = new PDFDocument({
  size: "A4",
  bufferPages: true,
  margins: { top: 60, bottom: 60, left: 55, right: 55 },
  info: {
    Title: "Easy Medical — Catalogue des modules",
    Author: "Easy Medical",
    Subject: "Présentation des modules de la solution de gestion hospitalière",
  },
});
doc.pipe(fs.createWriteStream(OUTPUT));

const pageW = doc.page.width;
const pageH = doc.page.height;
const contentW = pageW - doc.page.margins.left - doc.page.margins.right;

const hasLogo = fs.existsSync(LOGO);

/** Retourne jusqu'à `max` captures PNG du dossier guide du module. */
function screenshotsFor(guideDir, max = 2) {
  if (!guideDir) return [];
  const dir = path.join(GUIDE_DIR, guideDir);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /\.(png|jpe?g)$/i.test(f))
    .sort()
    .slice(0, max)
    .map((f) => path.join(dir, f));
}

function sectionTitle(text) {
  if (doc.y > pageH - doc.page.margins.bottom - 80) doc.addPage();
  doc.moveDown(0.5);
  const y = doc.y;
  doc.rect(doc.page.margins.left, y, 4, 18).fill(BLEU);
  doc.fillColor(BLEU).font("Helvetica-Bold").fontSize(15)
    .text(text, doc.page.margins.left + 12, y + 1);
  doc.moveDown(1);
}

// ================= PAGE DE COUVERTURE =================
doc.rect(0, 0, pageW, pageH).fill("#ffffff");
doc.rect(0, 0, pageW, 300).fill(BLEU);

let yLogo = 90;
if (hasLogo) {
  doc.image(LOGO, pageW / 2 - 60, yLogo, { fit: [120, 120] });
  yLogo += 135;
}

doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(30)
  .text("EASY MEDICAL", 55, yLogo + 10, { width: contentW, align: "center" });
doc.font("Helvetica").fontSize(16)
  .text("Catalogue de présentation des modules", { align: "center" });
doc.moveDown(0.5);
doc.fontSize(12)
  .text(`Solution de gestion hospitalière — ${MODULES.length} modules`, { align: "center" });

doc.y = 340;
doc.fillColor(GRIS).font("Helvetica").fontSize(11.5)
  .text(
    "Easy Medical est une solution modulaire de gestion d'établissement de santé : " +
    "cabinet, clinique, polyclinique ou hôpital. Chaque module est activable " +
    "indépendamment selon la licence de l'établissement, ce qui permet d'adapter " +
    "le système à la taille et aux besoins de chaque structure.",
    { align: "center", width: contentW - 60, indent: 30 }
  );

// Sommaire des modules sur la couverture
doc.moveDown(3);
doc.fillColor(BLEU).font("Helvetica-Bold").fontSize(13)
  .text("Sommaire des modules", { align: "center" });
doc.moveDown(0.8);
MODULES.forEach((mod, i) => {
  doc.fillColor(GRIS).font("Helvetica").fontSize(10.5)
    .text(`${i + 1}. ${mod.label}`, { align: "center" });
});

// ================= MODULES =================
doc.addPage();
sectionTitle("Présentation des modules");
doc.fillColor(GRIS).font("Helvetica").fontSize(10.5)
  .text(
    "Chaque module dispose d'une interface dédiée à son service. " +
    "Les écrans ci-dessous donnent un aperçu des principales fonctionnalités.",
    { align: "justify" }
  );
doc.moveDown(1.5);

MODULES.forEach((mod, i) => {
  const shots = screenshotsFor(mod.guideDir, 2);
  const IMG_H = 150;
  const listeH = mod.liste ? mod.liste.length * 15 + 10 : 0;
  const needed = 26 + 34 + 60 + (shots.length ? IMG_H + 30 : 0) + listeH;

  if (doc.y > pageH - doc.page.margins.bottom - needed) {
    doc.addPage();
  }

  const blockTop = doc.y;

  // Bandeau du module
  doc.rect(doc.page.margins.left, blockTop, contentW, 26).fill(BLEU_CLAIR);
  doc.fillColor(BLEU).font("Helvetica-Bold").fontSize(13)
    .text(`${i + 1}. ${mod.label}`, doc.page.margins.left + 10, blockTop + 6, { width: contentW - 20 });

  doc.y = blockTop + 34;
  doc.fillColor(GRIS).font("Helvetica").fontSize(10.5)
    .text(mod.description, { align: "justify" });

  // Liste à puces (ex : documents imprimables)
  if (mod.liste) {
    doc.moveDown(0.4);
    mod.liste.forEach((item) => {
      doc.fillColor(GRIS).font("Helvetica").fontSize(10)
        .text(`• ${item}`, doc.page.margins.left + 12);
    });
  }

  // Captures d'écran (jusqu'à 2, côte à côte)
  if (shots.length) {
    doc.moveDown(0.8);
    const top = doc.y;
    const gap = 12;
    const w = (contentW - gap) / 2;
    shots.forEach((img, k) => {
      const x = doc.page.margins.left + k * (w + gap);
      try {
        doc.image(img, x, top, { fit: [w, IMG_H], align: "center" });
        doc.rect(x, top, w, IMG_H).lineWidth(0.5).strokeColor("#dddddd").stroke();
      } catch (_) {
        /* image illisible : on l'ignore */
      }
    });
    doc.y = top + IMG_H + 14;
  } else {
    doc.moveDown(1);
  }
});

// ================= LICENCE =================
sectionTitle("Licence et activation");
doc.fillColor(GRIS).font("Helvetica").fontSize(10.5)
  .text(
    "Les modules sont activés par licence, établissement par établissement. " +
    "Trois plans sont proposés :",
    { align: "justify" }
  );
doc.moveDown(0.8);

const PLANS = [
  ["Trial", "Licence d'essai pour découvrir la solution avec les modules de base."],
  ["Annual", "Licence annuelle complète, tous modules activables, avec support et mises à jour."],
  ["Custom", "Licence sur mesure : sélection des modules et durée adaptées aux besoins de l'établissement."],
];
PLANS.forEach(([name, desc]) => {
  doc.fillColor(BLEU).font("Helvetica-Bold").fontSize(11).text(`• ${name}`, { continued: true });
  doc.fillColor(GRIS).font("Helvetica").fontSize(10.5).text(`  —  ${desc}`);
  doc.moveDown(0.4);
});

doc.moveDown(0.8);
doc.fillColor(GRIS).font("Helvetica").fontSize(10.5)
  .text(
    "La souscription et le renouvellement s'effectuent en ligne depuis l'espace " +
    "« Ma licence » du tableau de bord, avec paiement possible via Wave. " +
    "Un super-administrateur valide l'activation de la licence.",
    { align: "justify" }
  );

// ================= PRÉREQUIS =================
sectionTitle("Prérequis techniques");
const PREREQUIS = [
  "Application web accessible depuis un navigateur moderne (Chrome, Edge, Firefox).",
  "Aucune installation sur les postes clients : un simple accès réseau suffit.",
  "Architecture multi-établissements : chaque structure dispose de ses propres données.",
  "Base de données MongoDB pour la persistance des données.",
  "Impression des documents (ordonnances, factures, résultats) en PDF.",
];
PREREQUIS.forEach((p) => {
  doc.fillColor(GRIS).font("Helvetica").fontSize(10.5).text(`• ${p}`);
  doc.moveDown(0.35);
});

// ================= CONTACT =================
sectionTitle("Contact");
doc.fillColor(GRIS).font("Helvetica").fontSize(10.5)
  .text("Pour une démonstration, un devis ou toute question sur la solution Easy Medical :");
doc.moveDown(0.8);
doc.fillColor(BLEU).font("Helvetica-Bold").fontSize(11).text("Easy Medical");
doc.fillColor(GRIS).font("Helvetica").fontSize(10.5)
  .text("Site web : medical-easy.com")
  .text("Email : yaoentier@gmail.com")
  .text("Téléphone : +225 07 088 365 59- WhatApps: 05 655 510 80");

// ================= PIED DE PAGE =================
const totalPages = doc.bufferedPageRange().count;
for (let i = 0; i < totalPages; i++) {
  doc.switchToPage(i);
  doc.fillColor(GRIS_CLAIR).font("Helvetica").fontSize(8)
    .text(
      `Easy Medical — Catalogue des modules — page ${i + 1}/${totalPages}`,
      doc.page.margins.left,
      pageH - 40,
      { width: contentW, align: "center" }
    );
}

doc.end();
console.log(`PDF généré : ${OUTPUT}`);
