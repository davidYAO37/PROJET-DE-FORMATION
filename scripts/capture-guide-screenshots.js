const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const BASE_URL = "http://localhost:3000";
const OUT_DIR = path.join(__dirname, "..", "public", "guide");

// Pour chaque service : la page de base (Tableau de bord) et la liste des items du menu
// à capturer. type "route" => navigation directe. type "modal" => clic sur le lien du
// menu latéral (depuis la page de base) puis capture de la fenêtre modale ouverte.
const SERVICES = [
  {
    code: "accueil",
    base: "/pages/serviceaccueil/tpatient",
    items: [
      { key: "01-tableau-de-bord", label: "Tableau de bord", type: "route", url: "/pages/serviceaccueil/tpatient" },
      { key: "02-accueil-patient", label: "Accueil Patient", type: "route", url: "/pages/serviceaccueil/patient" },
      { key: "03-transferer-patient", label: "Transférer un patient", type: "modal" },
      { key: "04-salle-attente", label: "Salle d'attente", type: "modal" },
      { key: "05-constantes", label: "Constantes", type: "modal" },
      { key: "06-planning-medecin", label: "Planning Médecin", type: "modal" },
      { key: "07-disponibilite-medecin", label: "Disponibilité Médecin", type: "modal" },
      { key: "08-point-de-saisie", label: "Point de saisie", type: "modal" },
    ],
  },
  {
    code: "medecin",
    base: "/pages/servicemedecin/tmedecin",
    items: [
      { key: "01-tableau-de-bord", label: "Tableau de bord", type: "route", url: "/pages/servicemedecin/tmedecin" },
      { key: "02-patient-en-attente", label: "Patient en attente", type: "route", url: "/pages/servicemedecin/ListePatientAttentes" },
      { key: "03-mes-rendez-vous", label: "Mes Rendez-Vous", type: "modal" },
      { key: "04-saisir-fiche-prescription", label: "Saisir fiche prescription", type: "route", url: "/pages/servicemedecin/FichePrescriptionMedecinAsaisie" },
      { key: "05-comptes-rendus-radio", label: "Comptes rendus Radio", type: "modal" },
      { key: "06-statistiques", label: "Statistiques", type: "route", url: "/pages/servicemedecin/Statistiques" },
    ],
  },
  {
    code: "infirmier",
    base: "/pages/serviceinfirmier/tinfirmier",
    items: [
      { key: "01-tableau-de-bord", label: "Tableau de bord", type: "route", url: "/pages/serviceinfirmier/tinfirmier" },
      { key: "02-liste-des-patients", label: "Liste des patients", type: "route", url: "/pages/serviceinfirmier/tinfirmier/patients" },
      { key: "03-patients-hospitalises", label: "Patients hospitalisés", type: "route", url: "/pages/serviceinfirmier/tinfirmier/patientsHospitalises" },
    ],
  },
  {
    code: "laboratoire",
    base: "/pages/servicelaboratoire/tlaboratoire",
    items: [
      { key: "01-tableau-de-bord", label: "Tableau de bord", type: "route", url: "/pages/servicelaboratoire/tlaboratoire" },
      { key: "02-accueil-patient", label: "Accueil Patient", type: "route", url: "/pages/servicelaboratoire/patientLabo" },
      { key: "03-liste-resultat-retour", label: "Liste Resultat Retour", type: "route", url: "/pages/servicelaboratoire/components/ListeResultatRetour" },
      { key: "04-resultats-valides", label: "Resultats Validés", type: "modal" },
      { key: "05-gestion-automates", label: "Gestion des automates", type: "modal" },
      { key: "06-parametres-examens", label: "Paramètres Examens", type: "modal" },
      { key: "07-parametres-biochimie", label: "Paramètres Biochimie", type: "modal" },
    ],
  },
  {
    code: "biologiste",
    base: "/pages/servicebiologiste/tbiologiste",
    items: [
      { key: "01-accueil-patient", label: "Accueil Patient", type: "route", url: "/pages/servicebiologiste/patientLabo" },
      { key: "02-examens-a-valider", label: "Examens à valider", type: "route", url: "/pages/servicebiologiste/tbiologiste" },
      { key: "03-liste-examens-valides", label: "Liste Examens Validés", type: "modal" },
      { key: "04-gestion-automates", label: "Gestion des automates", type: "modal" },
      { key: "05-parametres-examens", label: "Paramètres Examens", type: "modal" },
      { key: "06-parametres-biochimie", label: "Paramètres Biochimie", type: "modal" },
      { key: "07-statistiques-labo", label: "Statistiques Labo", type: "route", url: "/pages/servicebiologiste/statistiques" },
      { key: "08-releve-de-compte", label: "Relevé de Compte", type: "route", url: "/pages/servicebiologiste/releveCompte" },
    ],
  },
  {
    code: "radio",
    base: "/pages/serviceradio/tradio",
    items: [
      { key: "01-tableau-de-bord", label: "Tableau de bord", type: "route", url: "/pages/serviceradio/tradio" },
      { key: "02-mes-rendez-vous", label: "Mes Rendez-Vous", type: "modal" },
    ],
  },
  {
    code: "pharmacie",
    base: "/pages/servicepharmacie?vue=dashboard",
    items: [
      { key: "01-tableau-de-bord", label: "Tableau de bord", type: "route", url: "/pages/servicepharmacie?vue=dashboard" },
      { key: "02-gestion-du-stock", label: "Gestion du stock", type: "route", url: "/pages/servicepharmacie?vue=stock" },
      { key: "03-approvisionnement", label: "Approvisionnement", type: "route", url: "/pages/servicepharmacie?vue=approvisionnement" },
      { key: "04-commandes-en-cours", label: "Commandes en cours", type: "route", url: "/pages/servicepharmacie?vue=commandes" },
      { key: "05-fournisseurs", label: "Fournisseurs", type: "route", url: "/pages/servicepharmacie?vue=fournisseurs" },
      { key: "06-historique-mouvements", label: "Historique mouvements", type: "route", url: "/pages/servicepharmacie?vue=historique" },
      { key: "07-mouvements-manuels", label: "Mouvements manuels", type: "route", url: "/pages/servicepharmacie?vue=mouvements" },
      { key: "08-inventaire-complet", label: "Inventaire complet", type: "route", url: "/pages/servicepharmacie?vue=inventaire" },
      { key: "09-impression-rapports", label: "Impression / Rapports", type: "route", url: "/pages/servicepharmacie?vue=impression" },
    ],
  },
  {
    code: "caisse",
    base: "/pages/servicecaisse/tcaisse",
    items: [
      { key: "01-tableau-de-bord", label: "Tableau de bord", type: "route", url: "/pages/servicecaisse/tcaisse" },
      { key: "02-compte-patient", label: "Compte patient", type: "route", url: "/pages/servicecaisse/comptePatient" },
      { key: "03-factures-en-attente", label: "Factures en attente", type: "route", url: "/pages/servicecaisse/listefactures" },
      { key: "04-saisie-auto-facture", label: "Saisie Auto Facture Exam-Hospit...", type: "modal" },
      { key: "05-saisie-manuelle-facture", label: "Saisie Manuelle Facture Exam-Hospit...", type: "modal" },
      { key: "06-facturer-pharmacie", label: "Facturer une pharmacie", type: "modal" },
      { key: "07-facture-a-solder", label: "Facture à solder", type: "modal" },
      { key: "08-point-de-caisse", label: "Point de caisse", type: "modal" },
      { key: "09-liste-encaissement", label: "Liste encaissement", type: "modal" },
      { key: "10-liste-facture-annulee", label: "Liste Facture Annulée", type: "modal" },
      { key: "11-imprimer-facture", label: "Imprimer Facture", type: "modal" },
    ],
  },
  {
    code: "facturation",
    base: "/pages/servicefacturation/tfacturation",
    items: [
      { key: "01-tableau-de-bord", label: "Tableau de bord", type: "route", url: "/pages/servicefacturation/tfacturation" },
      { key: "02-honoraires-medecins", label: "Honoraires Médecins", type: "route", url: "/pages/servicefacturation/honoraires" },
      { key: "03-facturation-assurances", label: "Facturation assurances", type: "route", url: "/pages/servicefacturation/factureassurance" },
    ],
  },
  {
    code: "comptabilite",
    base: "/pages/servicecomptabilite/tcompta",
    items: [
      { key: "01-tableau-de-bord", label: "Tableau de bord", type: "route", url: "/pages/servicecomptabilite/tcompta" },
      { key: "02-honoraires", label: "Honoraires", type: "route", url: "/pages/servicecomptabilite/honoraires" },
      { key: "03-caisse", label: "Caisse", type: "route", url: "/pages/servicecomptabilite/caisse" },
      { key: "04-etat-des-entrees", label: "État des entrées", type: "route", url: "/pages/servicecomptabilite/etatentrees" },
      { key: "05-etat-des-sorties", label: "État des sorties", type: "route", url: "/pages/servicecomptabilite/etatsorties" },
      { key: "06-bilan-financier", label: "Bilan financier", type: "route", url: "/pages/servicecomptabilite/bilan" },
      { key: "07-budget-de-tresorerie", label: "Budget de trésorerie", type: "route", url: "/pages/servicecomptabilite/budgettresorerie" },
      { key: "08-recette-depense", label: "Recette / Dépense", type: "route", url: "/pages/servicecomptabilite/recettedepense" },
      { key: "09-debiteurs", label: "Débiteurs", type: "route", url: "/pages/servicecomptabilite/debiteurs" },
      { key: "10-facturation-assurances", label: "Facturation assurances", type: "route", url: "/pages/factureassurance" },
    ],
  },
];

async function clickSidebarLabel(page, label) {
  return page.evaluate((labelText) => {
    const candidates = Array.from(
      document.querySelectorAll("aside a, aside div.sidebar-link-medical, aside button")
    );
    const el = candidates.find((e) => e.textContent && e.textContent.trim().includes(labelText));
    if (el) {
      el.click();
      return true;
    }
    return false;
  }, label);
}

async function closeAnyModal(page) {
  await page.evaluate(() => {
    const closeBtn = document.querySelector(".modal.show .btn-close, .modal.show [aria-label='Close']");
    if (closeBtn) closeBtn.click();
  });
  await new Promise((r) => setTimeout(r, 400));
  await page.keyboard.press("Escape").catch(() => {});
  await new Promise((r) => setTimeout(r, 400));
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log("Navigating to /connexion...");
  await page.goto(`${BASE_URL}/connexion`, { waitUntil: "networkidle2" });
  await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 15000 });
  const emailSelector = (await page.$('input[type="email"]')) ? 'input[type="email"]' : 'input[name="email"]';
  await page.type(emailSelector, "fofana@gmail.com", { delay: 20 });
  const pwSelector = (await page.$('input[type="password"]')) ? 'input[type="password"]' : 'input[name="motDePasse"]';
  await page.type(pwSelector, "fofana@gmail.com", { delay: 20 });
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: "networkidle2", timeout: 20000 }).catch(() => null),
  ]);
  console.log("Logged in. URL:", page.url());
  await new Promise((r) => setTimeout(r, 1000));

  for (const service of SERVICES) {
    const serviceDir = path.join(OUT_DIR, service.code);
    fs.mkdirSync(serviceDir, { recursive: true });

    for (const item of service.items) {
      try {
        if (item.type === "route") {
          console.log(`[${service.code}] -> route: ${item.label} (${item.url})`);
          await page.goto(`${BASE_URL}${item.url}`, { waitUntil: "networkidle2", timeout: 30000 });
          await new Promise((r) => setTimeout(r, 1000));
        } else {
          // S'assurer d'être sur la page de base du service avant de cliquer sur le menu
          if (!page.url().includes(service.base.split("?")[0])) {
            await page.goto(`${BASE_URL}${service.base}`, { waitUntil: "networkidle2", timeout: 30000 });
            await new Promise((r) => setTimeout(r, 800));
          }
          console.log(`[${service.code}] -> modal: ${item.label}`);
          const clicked = await clickSidebarLabel(page, item.label);
          if (!clicked) {
            console.warn(`  ! Lien "${item.label}" introuvable dans la sidebar, capture ignorée.`);
            continue;
          }
          await new Promise((r) => setTimeout(r, 1300));
        }

        const outPath = path.join(serviceDir, `${item.key}.png`);
        await page.screenshot({ path: outPath, fullPage: false });
        console.log("  Saved", outPath);

        if (item.type === "modal") {
          await closeAnyModal(page);
        }
      } catch (e) {
        console.error(`  ! Échec pour ${service.code} / ${item.label}:`, e.message);
      }
    }
  }

  await browser.close();
  console.log("Done.");
})();
