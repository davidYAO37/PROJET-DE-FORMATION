import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { NumberToLetter } from "@mandarvl/convertir-nombre-lettre";
import { ILicenceOrder, LicenceOrder } from "@/models/licenceOrder";
import { Entreprise } from "@/models/entreprise";

type OrderItem = {
    code?: string;
    name: string;
    qty: number;
    unit: number;
    total?: number;
};

// Informations de l'éditeur du logiciel (Le Prestataire), configurables via variables d'environnement.
function getProviderInfo() {
    return {
        name: process.env.PROVIDER_NAME || "Easy Medical",
        address: process.env.PROVIDER_ADDRESS || "",
        phone: process.env.PROVIDER_PHONE || "",
        email: process.env.PROVIDER_EMAIL || "",
        city: process.env.PROVIDER_CITY || "",
    };
}

// Convertit un montant (FCFA) en toutes lettres, ex: "cent mille Francs CFA".
function amountInWords(amount: number): string {
    try {
        const words = NumberToLetter(Math.max(0, Math.round(amount || 0)));
        return `${words} Francs CFA`;
    } catch {
        return "";
    }
}

// Formate un nombre avec des espaces normales comme séparateur de milliers (ex: "300 000").
// On évite volontairement `toLocaleString("fr-FR")` qui utilise une espace fine insécable
// (U+202F) non supportée par les polices de base de PDFKit et s'affichant comme "/".
function formatNumber(amount?: number): string {
    const rounded = Math.round(amount || 0);
    return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function formatAmount(amount?: number): string {
    return `${formatNumber(amount)} FCFA`;
}

function paymentMethodLabel(method?: string): string {
    switch (method) {
        case "wave":
            return "Mobile Money (Wave)";
        case "bank_transfer":
            return "Virement bancaire";
        case "manual":
            return "Manuel / Espèces";
        default:
            return "Non spécifié";
    }
}

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "licence-docs");

async function ensureDir() {
    await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });
}

function savePdf(doc: PDFKit.PDFDocument, filePath: string) {
    return new Promise<void>((resolve, reject) => {
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);
        doc.end();
        stream.on("finish", () => resolve());
        stream.on("error", (err) => reject(err));
    });
}

async function trySignPdf(filePath: string) {
    const pfxPath = process.env.SIGN_PFX_PATH;
    const pfxPass = process.env.SIGN_PFX_PASS || "";
    if (!pfxPath) return false;
    try {
        const signerLib = require("node-signpdf");
        const helpers = require("node-signpdf/dist/helpers");
        const p12Buffer = fs.readFileSync(pfxPath);
        const pdfBuffer = fs.readFileSync(filePath);
        const placeholder = helpers.plainAddPlaceholder({ pdfBuffer, reason: 'Signature', signatureLength: 8192 });
        const signedPdf = signerLib.sign(placeholder, p12Buffer, { passphrase: pfxPass });
        fs.writeFileSync(filePath, signedPdf);
        return true;
    } catch (err) {
        console.warn("PDF signing failed:", (err as any)?.message || err);
        return false;
    }
}

export async function generateOrderFormPdf(order: ILicenceOrder): Promise<string> {
    await ensureDir();
    const filename = `order-${order._id.toString()}-orderform.pdf`;
    const filePath = path.join(UPLOAD_DIR, filename);
    const entreprise = await Entreprise.findById(order.entrepriseId).lean();

    const doc = new PDFDocument({ size: "A4", margin: 48 });

    // Header
    if (entreprise?.LogoE) {
        try {
            const logoPath = path.join(process.cwd(), "public", entreprise.LogoE.replace(/^\//, ""));
            if (fs.existsSync(logoPath)) {
                doc.image(logoPath, 48, 40, { width: 120 });
            } else {
                doc.fontSize(20).text(entreprise.NomSociete || "", 48, 50);
            }
        } catch (e) {
            doc.fontSize(20).text(entreprise?.NomSociete || "", 48, 50);
        }
    } else {
        doc.fontSize(20).text(entreprise?.NomSociete || "Easy Medical", 48, 50);
    }

    // Order title block
    doc.fontSize(14).text("Bon de commande", 0, 40, { align: "right" });
    doc.moveDown(2);

    const leftX = 48;
    const rightX = 350;

    // Billing / Order info
    doc.fontSize(10).text("Facturé à:", leftX, 130);
    doc.fontSize(12).font("Helvetica-Bold").text(entreprise?.NomSociete || "-", leftX, 145);
    doc.font("Helvetica").fontSize(10);
    if (entreprise?.adresse) doc.text(entreprise.adresse, leftX, doc.y);
    if (entreprise?.contact) doc.text(`Contact: ${entreprise.contact}`, leftX, doc.y);
    if (entreprise?.email) doc.text(`Email: ${entreprise.email}`, leftX, doc.y);
    if (entreprise?.NCC) doc.text(`NCC: ${entreprise.NCC}`, leftX, doc.y);

    doc.fontSize(10).text(`Commande #: ${order._id}`, rightX, 130, { align: "right" });
    doc.text(`Date: ${new Date(order.createdAt || Date.now()).toLocaleDateString('fr-FR')}`, { align: "right" });
    doc.text(`Objet: ${order.action === "maintenance" ? "Maintenance annuelle" : "Achat licence perpétuelle"}`, { align: "right" });

    doc.moveDown(2);

    // Items table header
    const tableTop = doc.y + 10;
    doc.fontSize(10).font("Helvetica-Bold");
    doc.text("Description", leftX, tableTop);
    doc.text("Quantité", 320, tableTop, { width: 60, align: "right" });
    doc.text("Prix unitaire", 380, tableTop, { width: 80, align: "right" });
    doc.text("Total", 470, tableTop, { width: 80, align: "right" });

    doc.moveTo(leftX, tableTop + 15).lineTo(550, tableTop + 15).stroke();
    doc.font("Helvetica");


    // Build items: prefer `order.items` (detailed per-module pricing). Fallback to previous behavior.
    const items: OrderItem[] = [];
    if (Array.isArray((order as any).items) && (order as any).items.length > 0) {
        for (const it of (order as any).items) {
            const qty = Number(it.qty || 1);
            const unit = Number(it.unit || it.unitPrice || 0);
            const total = Number(it.total ?? qty * unit);
            items.push({ code: it.code, name: it.name || it.label || String(it.code || "Module"), qty, unit, total });
        }
    } else {
        if (order.action === "maintenance") {
            items.push({ name: "Maintenance annuelle", qty: 1, unit: order.amount || 0, total: order.amount || 0 });
        } else {
            items.push({ name: "Licence perpétuelle", qty: 1, unit: order.amount || 0, total: order.amount || 0 });
        }
        if (order.modules && order.modules.length > 0) {
            items.push({ name: `Modules: ${order.modules.join(", ")}`, qty: 1, unit: 0, total: 0 });
        }
    }

    let y = tableTop + 25;
    items.forEach((it) => {
        doc.fontSize(10).text(it.name, leftX, y);
        doc.text(String(it.qty), 320, y, { width: 60, align: "right" });
        doc.text(formatNumber(it.unit), 380, y, { width: 80, align: "right" });
        doc.text(formatNumber(it.total), 470, y, { width: 80, align: "right" });
        y += 18;
    });

    doc.moveTo(leftX, y + 4).lineTo(550, y + 4).stroke();

    const subtotal = items.reduce((s, it) => s + (it.total || 0), 0);
    const taxes = 0; // adapt if needed
    const grandTotal = subtotal + taxes;

    doc.font("Helvetica-Bold").text(`Total: ${formatNumber(grandTotal)} ${(order as any).currency || "XOF"}`, 470, y + 12, { width: 80, align: "right" });

    await savePdf(doc, filePath);
    await trySignPdf(filePath);
    return `/uploads/licence-docs/${filename}`;
}

export async function generateReceiptPdf(order: ILicenceOrder): Promise<string> {
    await ensureDir();
    const filename = `order-${order._id.toString()}-receipt.pdf`;
    const filePath = path.join(UPLOAD_DIR, filename);
    const entreprise = await Entreprise.findById(order.entrepriseId).lean();
    const provider = getProviderInfo();
    const doc = new PDFDocument({ size: "A4", margin: 48 });

    const orderRef = `BC-EASY-${String(order._id).slice(-6).toUpperCase()}`;
    const paidDate = order.paidAt ? new Date(order.paidAt) : new Date();

    doc.fontSize(16).font("Helvetica-Bold").text(`REÇU DE PAIEMENT — ${provider.name.toUpperCase()}`, { align: "center" });
    doc.moveDown(0.6);

    doc.fontSize(10).text(`N° de reçu : RE-EASY-${String(order._id).slice(-6).toUpperCase()}`, 48);
    doc.text(`Date : ${paidDate.toLocaleDateString('fr-FR')}`);

    doc.moveDown(0.6);
    doc.fontSize(10).font("Helvetica-Bold").text("PRESTATAIRE");
    doc.font("Helvetica").text(`Nom et prénoms : ${provider.name}`);
    doc.text(`Téléphone : ${provider.phone || "—"}`);
    doc.text(`E-mail : ${provider.email || "—"}`);
    doc.text(`Adresse : ${provider.address || "—"}`);

    doc.moveDown(0.4);
    doc.fontSize(10).font("Helvetica-Bold").text("CLIENT");
    doc.font("Helvetica").text(`Nom / Établissement : ${entreprise?.NomSociete || "—"}`);
    doc.text(`Téléphone : ${entreprise?.contact || "—"}`);
    doc.text(`E-mail : ${entreprise?.email || "—"}`);
    doc.text(`Adresse : ${entreprise?.adresse || "—"}`);

    doc.moveDown(0.6);
    doc.fontSize(11).font("Helvetica-Bold").text("OBJET DU PAIEMENT");
    doc.moveDown(0.2);
    doc.fontSize(10).font("Helvetica").text(
        `Je soussigné, ${provider.name}, reconnais avoir reçu de ${entreprise?.NomSociete || "—"} la somme de :`
    );
    doc.moveDown(0.2);
    doc.font("Helvetica-Bold").text(`${formatAmount(order.amount)}`);
    doc.font("Helvetica").text(`Montant en lettres : ${amountInWords(order.amount)}`);

    doc.moveDown(0.6);
    doc.fontSize(10).font("Helvetica-Bold").text("MOTIF DU PAIEMENT :");
    doc.font("Helvetica").text(`Paiement relatif à la commande : ${orderRef}`);
    doc.moveDown(0.2);
    const motifs = [
        "Acquisition de licence Easy Medical",
        "Installation et configuration",
        "Formation",
        "Maintenance annuelle",
        "Acompte sur commande",
        "Solde de commande",
        "Autre"
    ];
    const motifChecked = order.action === "maintenance" ? "Maintenance annuelle" : "Acquisition de licence Easy Medical";
    motifs.forEach(m => doc.text(`${m === motifChecked ? "☑" : "☐"} ${m}`));

    doc.moveDown(0.4);
    doc.text(`MODE DE PAIEMENT : ${paymentMethodLabel(order.paymentMethod)}`);
    doc.moveDown(0.4);
    doc.text(`Montant payé : ${formatAmount(order.amount)}`);
    doc.text(`Reste à payer : ${formatAmount(0)}`);

    doc.moveDown(0.6);
    doc.text("OBSERVATION : Le présent document constitue une reconnaissance du paiement reçu au titre de la commande indiquée ci-dessus, sous réserve des obligations de facturation applicables.");

    doc.moveDown(0.8);
    doc.text(`Fait à ${provider.city || "—"}, le ${paidDate.toLocaleDateString('fr-FR')}`);

    doc.moveDown(0.6);
    doc.text(`LE PRESTATAIRE - Nom : ${provider.name}  Signature :`);
    doc.moveDown(0.8);
    doc.text(`LE CLIENT - Nom : ${entreprise?.NomSociete || "—"}  Signature :`);

    doc.moveDown(0.6);
    doc.fontSize(12).font("Helvetica-Bold").text("MENTION : « PAYÉ »", { align: "right" });

    await savePdf(doc, filePath);
    await trySignPdf(filePath);
    return `/uploads/licence-docs/${filename}`;
}

export async function generateContractPdf(order: ILicenceOrder, type: "acquisition" | "maintenance" = "acquisition"): Promise<string> {
    await ensureDir();
    const filename = `order-${order._id.toString()}-${type}-contract.pdf`;
    const filePath = path.join(UPLOAD_DIR, filename);
    const entreprise = await Entreprise.findById(order.entrepriseId).lean();
    const provider = getProviderInfo();
    const doc = new PDFDocument({ size: "A4", margin: 48 });
    const isMaintenance = type === "maintenance";
    const headerTitle = isMaintenance
        ? "CONTRAT DE MAINTENANCE DU LOGICIEL EASY MEDICAL"
        : "CONTRAT D'ACQUISITION DE LICENCE DU LOGICIEL EASY MEDICAL";
    const refPrefix = isMaintenance ? "CM-EASY" : "CA-EASY";

    const startDate = entreprise?.licensePurchasedAt
        ? new Date(entreprise.licensePurchasedAt)
        : (entreprise?.licenceStartDate ? new Date(entreprise.licenceStartDate) : new Date(order.createdAt || Date.now()));
    // La maintenance a une échéance annuelle (maintenanceDueDate) ; la licence, elle, est perpétuelle
    // et n'a pas de date de fin.
    const maintenanceExpiry = entreprise?.maintenanceDueDate ? new Date(entreprise.maintenanceDueDate) : undefined;

    // Header
    doc.fontSize(14).font("Helvetica-Bold").text(headerTitle, { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(10).font("Helvetica");
    doc.text(`Référence : ${refPrefix}-${String(order._id).slice(-6).toUpperCase()}`, { align: "left" });
    doc.moveDown(0.2);
    doc.text(`Date : ${new Date(order.createdAt || Date.now()).toLocaleDateString('fr-FR')}`);

    doc.moveDown(0.8);
    doc.fontSize(11).font("Helvetica-Bold").text("ENTRE LES SOUSSIGNÉS", { underline: false });
    doc.moveDown(0.4);

    // Le Prestataire
    doc.fontSize(10).font("Helvetica-Bold").text("Le Prestataire :");
    doc.font("Helvetica").text(`Nom et prénoms : ${provider.name}`);
    doc.text(`Adresse : ${provider.address || "—"}`);
    doc.text(`Téléphone : ${provider.phone || "—"}`);
    doc.text(`E-mail : ${provider.email || "—"}`);
    doc.moveDown(0.2);
    doc.text("Ci-après dénommé ", { continued: true }).font("Helvetica-Bold").text("« Le Prestataire »");

    doc.moveDown(0.6);
    // Le Client
    doc.font("Helvetica-Bold").text("ET");
    doc.moveDown(0.4);
    doc.font("Helvetica-Bold").text("Le Client :");
    doc.font("Helvetica").text(`Nom / Établissement : ${entreprise?.NomSociete || "—"}`);
    doc.text(`Adresse : ${entreprise?.adresse || "—"}`);
    doc.text(`Téléphone : ${entreprise?.contact || "—"}`);
    doc.text(`E-mail : ${entreprise?.email || "—"}`);
    doc.moveDown(0.2);
    doc.text("Ci-après dénommé ", { continued: true }).font("Helvetica-Bold").text("« Le Client »");

    doc.moveDown(0.6);
    doc.fontSize(11).font("Helvetica-Bold").text("Il a été convenu ce qui suit :");

    // Article 1
    doc.moveDown(0.4);
    doc.fontSize(12).font("Helvetica-Bold").text("ARTICLE 1 — OBJET");
    doc.moveDown(0.2);
    if (isMaintenance) {
        doc.fontSize(10).font("Helvetica").text("Le présent contrat a pour objet de définir les conditions de maintenance du logiciel de gestion médicale ", { continued: true }).font("Helvetica-Bold").text(provider.name).font("Helvetica").text(" installé et utilisé par le Client.");
        doc.moveDown(0.1);
        doc.text("La maintenance a pour objectif d'assurer le bon fonctionnement du logiciel, de corriger les anomalies et d'accompagner le Client dans son utilisation.");
    } else {
        doc.fontSize(10).font("Helvetica").text("Le présent contrat a pour objet de définir les conditions d'acquisition et d'utilisation de la licence du logiciel de gestion médicale ", { continued: true }).font("Helvetica-Bold").text(provider.name).font("Helvetica").text(" par le Client, pour les modules et la durée précisés ci-après.");
        doc.moveDown(0.1);
        doc.text(`Modules souscrits : ${(order.modules && order.modules.length > 0) ? order.modules.join(", ") : "Tous les modules"}.`);
    }

    // Article 2
    doc.moveDown(0.3);
    doc.fontSize(12).font("Helvetica-Bold").text("ARTICLE 2 — DURÉE");
    doc.moveDown(0.2);
    if (isMaintenance) {
        doc.fontSize(10).font("Helvetica").text("Le présent contrat de maintenance est conclu pour une durée de ", { continued: true }).font("Helvetica-Bold").text("douze (12) mois").font("Helvetica").text(", renouvelable chaque année par tacite reconduction sous réserve du paiement de la redevance annuelle.");
        doc.moveDown(0.1);
        doc.text(`Date de début de la période en cours : ${startDate.toLocaleDateString('fr-FR')}`);
        doc.text(`Échéance de la maintenance : ${maintenanceExpiry ? maintenanceExpiry.toLocaleDateString('fr-FR') : "—"}`);
    } else {
        doc.fontSize(10).font("Helvetica").text("Le présent contrat est conclu pour une durée ", { continued: true }).font("Helvetica-Bold").text("indéterminée").font("Helvetica").text(" : la licence est acquise à titre perpétuel par le Client, sans date d'expiration.");
        doc.moveDown(0.1);
        doc.text(`Date d'acquisition : ${startDate.toLocaleDateString('fr-FR')}`);
        doc.text("Une maintenance annuelle est prévue séparément (1ère année incluse) : voir contrat de maintenance associé.");
    }

    // Article 3
    doc.moveDown(0.3);
    doc.fontSize(12).font("Helvetica-Bold").text("ARTICLE 3 — SERVICES COMPRIS DANS LA MAINTENANCE");
    doc.moveDown(0.2);
    doc.fontSize(10).font("Helvetica").list([
        "correction des anomalies liées au fonctionnement du logiciel ;",
        "assistance technique ;",
        "assistance à l'utilisation des fonctionnalités existantes ;",
        "mises à jour correctives ;",
        "petites adaptations nécessaires au maintien du fonctionnement ;",
        "assistance à distance lorsque cela est possible ;",
        "conseils concernant l'utilisation du logiciel."
    ], { bulletRadius: 2 });

    // Article 4
    doc.moveDown(0.2);
    doc.fontSize(12).font("Helvetica-Bold").text("ARTICLE 4 — SERVICES NON COMPRIS");
    doc.moveDown(0.2);
    doc.fontSize(10).font("Helvetica").text("Ne sont pas compris dans le présent contrat, sauf accord écrit complémentaire :");
    doc.moveDown(0.1);
    doc.list([
        "développement d'un nouveau module ;",
        "création d'une fonctionnalité entièrement nouvelle ;",
        "modification importante de l'architecture du logiciel ;",
        "intervention sur du matériel informatique ;",
        "remplacement ou réparation du matériel ;",
        "récupération de données perdues lorsque cette perte résulte d'une mauvaise manipulation du Client ;",
        "prestations extérieures au logiciel Easy Medical."
    ], { bulletRadius: 2 });
    doc.moveDown(0.1);
    doc.text("Ces prestations pourront faire l'objet d'un devis séparé.");

    // Article 5
    doc.moveDown(0.3);
    doc.fontSize(12).font("Helvetica-Bold").text("ARTICLE 5 — SAUVEGARDE DES DONNÉES");
    doc.moveDown(0.1);
    doc.fontSize(10).font("Helvetica").text("Le Client reste responsable de la conservation et de la sauvegarde de ses données.");
    doc.moveDown(0.1);
    doc.text("Le Prestataire peut accompagner le Client dans la mise en place d'une procédure de sauvegarde, mais ne peut être tenu responsable d'une perte de données résultant notamment :");
    doc.list([
        "d'une panne matérielle ;",
        "d'une mauvaise manipulation ;",
        "d'une suppression volontaire ou accidentelle ;",
        "d'une défaillance du système informatique ;",
        "d'une absence de sauvegarde."
    ], { bulletRadius: 2 });

    // Article 6
    doc.moveDown(0.3);
    doc.fontSize(12).font("Helvetica-Bold").text("ARTICLE 6 — CONFIDENTIALITÉ");
    doc.moveDown(0.1);
    doc.fontSize(10).font("Helvetica").text("Le Prestataire s'engage à préserver la confidentialité des informations auxquelles il pourrait avoir accès dans le cadre de ses interventions.");
    doc.moveDown(0.1);
    doc.text("Les données relatives aux patients et aux activités de l'établissement ne doivent être utilisées que dans le cadre strictement nécessaire à l'assistance ou à la maintenance du logiciel.");

    // Article 7
    doc.moveDown(0.3);
    doc.fontSize(12).font("Helvetica-Bold").text(isMaintenance ? "ARTICLE 7 — PRIX DE LA MAINTENANCE" : "ARTICLE 7 — PRIX DE LA LICENCE");
    doc.moveDown(0.1);
    doc.fontSize(10).font("Helvetica").text(isMaintenance ? "Le montant de la maintenance est fixé à :" : "Le montant de la licence est fixé à :");
    doc.moveDown(0.1);
    doc.font("Helvetica-Bold").text(`Montant : ${formatAmount(order.amount)} (${amountInWords(order.amount)})`);
    doc.moveDown(0.1);
    doc.font("Helvetica").text(`Modalités de paiement : ${paymentMethodLabel(order.paymentMethod)}`);
    doc.moveDown(0.1);
    doc.text("Le paiement donne lieu à la délivrance du document justificatif approprié.");

    // Article 8
    doc.moveDown(0.3);
    doc.fontSize(12).font("Helvetica-Bold").text("ARTICLE 8 — INTERRUPTION DU SERVICE");
    doc.moveDown(0.1);
    doc.fontSize(10).font("Helvetica").text("En cas de non-paiement du renouvellement de la maintenance à son échéance, le Prestataire pourra suspendre les prestations de maintenance après information du Client.");
    doc.moveDown(0.1);
    doc.text("Cette suspension n'entraîne pas automatiquement la suppression ou la perte des données du Client.");

    // Article 9
    doc.moveDown(0.3);
    doc.fontSize(12).font("Helvetica-Bold").text("ARTICLE 9 — RÉSILIATION");
    doc.moveDown(0.1);
    doc.fontSize(10).font("Helvetica").text("Chaque partie peut demander la résiliation du contrat en informant l'autre partie par écrit.");
    doc.moveDown(0.1);
    doc.text("Les prestations déjà réalisées restent dues.");

    // Article 10
    doc.moveDown(0.3);
    doc.fontSize(12).font("Helvetica-Bold").text("ARTICLE 10 — ACCEPTATION");
    doc.moveDown(0.1);
    doc.fontSize(10).font("Helvetica").text("Le Client reconnaît avoir pris connaissance des conditions du présent contrat et les accepter.");

    doc.moveDown(0.6);
    doc.text(`Fait à ${provider.city || "—"}, le ${new Date(order.createdAt || Date.now()).toLocaleDateString('fr-FR')}`);

    doc.moveDown(0.6);
    doc.fontSize(11).font("Helvetica-Bold").text("LE PRESTATAIRE");
    doc.moveDown(0.2);
    doc.fontSize(10).font("Helvetica").text(`Nom : ${provider.name}`);
    doc.moveDown(1);
    doc.text("Signature :");

    doc.moveDown(1.2);
    doc.fontSize(11).font("Helvetica-Bold").text("LE CLIENT");
    doc.moveDown(0.2);
    doc.fontSize(10).font("Helvetica").text(`Nom : ${entreprise?.NomSociete || "—"}`);
    doc.moveDown(1);
    doc.text("Signature et cachet :");

    await savePdf(doc, filePath);
    await trySignPdf(filePath);
    return `/uploads/licence-docs/${filename}`;
}

export async function generateAllForOrder(orderId: string) {
    const order = await LicenceOrder.findById(orderId);
    if (!order) throw new Error("Commande introuvable");

    // Ne générer que le contrat correspondant à l'action de la commande
    // (achat -> contrat d'acquisition, maintenance -> contrat de maintenance).
    const orderFormUrl = await generateOrderFormPdf(order);
    let acquisitionContractUrl: string | undefined;
    let maintenanceContractUrl: string | undefined;
    if (order.action === "maintenance") {
        maintenanceContractUrl = await generateContractPdf(order, "maintenance");
    } else {
        acquisitionContractUrl = await generateContractPdf(order, "acquisition");
    }
    let paymentReceiptUrl: string | undefined;
    if (order.paidAt) {
        paymentReceiptUrl = await generateReceiptPdf(order);
    }

    // persist urls
    if (orderFormUrl) (order as any).orderFormUrl = orderFormUrl;
    if (acquisitionContractUrl) (order as any).acquisitionContractUrl = acquisitionContractUrl;
    if (maintenanceContractUrl) (order as any).maintenanceContractUrl = maintenanceContractUrl;
    if (paymentReceiptUrl) (order as any).paymentReceiptUrl = paymentReceiptUrl;

    await order.save();

    return {
        orderFormUrl,
        acquisitionContractUrl,
        maintenanceContractUrl,
        paymentReceiptUrl,
    };
}

export default generateAllForOrder;
