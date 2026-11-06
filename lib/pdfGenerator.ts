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
        case "mobile_money":
            return "Mobile Money";
        case "bank_transfer":
            return "Virement bancaire";
        case "cheque":
            return "Chèque";
        case "carte":
            return "Carte bancaire";
        case "especes":
            return "Espèces";
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
    const provider = getProviderInfo();
    const doc = new PDFDocument({
        size: "A4",
        margins: { top: 45, bottom: 56, left: 52, right: 52 },
    });
    const colors = {
        navy: "#12324A",
        teal: "#0D9B8A",
        pale: "#EAF6F5",
        ink: "#263746",
        muted: "#647789",
        line: "#DCE6EC",
        white: "#FFFFFF",
    };
    const left = 52;
    const right = 543;
    const contentWidth = right - left;
    const ref = `BC-EASY-${String(order._id).slice(-6).toUpperCase()}`;
    const orderRef = order.reference || `CMD-${new Date(order.createdAt || Date.now()).getFullYear()}-${String(order._id).slice(-6).toUpperCase()}`;
    const orderDate = new Date(order.createdAt || Date.now());
    const formatDate = (date: Date) => date.toLocaleDateString("fr-FR");
    const logoPath = path.join(process.cwd(), "public", "images", "logo-easy.png");

    // Build items
    const { LICENCE_MODULES } = await import("@/lib/licenceModules");
    const moduleLabel = (code?: string) =>
        LICENCE_MODULES.find((m) => m.code === code)?.label || code || "Module";

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
            items.push({ name: "Maintenance annuelle (12 mois)", qty: 1, unit: order.amount || 0, total: order.amount || 0 });
        } else {
            items.push({ name: "Licence perpétuelle Easy Medical", qty: 1, unit: order.amount || 0, total: order.amount || 0 });
        }
        if (order.modules && order.modules.length > 0) {
            for (const code of order.modules) {
                items.push({ code, name: `Module ${moduleLabel(code)}`, qty: 1, unit: 0, total: 0 });
            }
        }
    }

    // Estimation du nombre de pages : tableau (lignes de 20px) + sections finales (~360px)
    const tableEnd = 400 + items.length * 20;
    const totalPages = tableEnd + 360 <= 730 ? 1 : 2;

    const drawPageHeader = (pageNumber: number) => {
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, left, 34, { fit: [45, 45] });
        }
        doc.font("Helvetica-Bold").fontSize(13).fillColor(colors.navy).text("EASY MEDICAL", 106, 39);
        doc.font("Helvetica").fontSize(8).fillColor(colors.muted).text(
            "BON DE COMMANDE",
            106,
            57,
        );
        doc.font("Helvetica-Bold").fontSize(8).fillColor(colors.teal).text(ref, 420, 44, { width: 123, align: "right" });
        doc.moveTo(left, 91).lineTo(right, 91).strokeColor(colors.line).lineWidth(1).stroke();
        doc.moveTo(left, 758).lineTo(right, 758).strokeColor(colors.line).lineWidth(0.7).stroke();
        doc.font("Helvetica").fontSize(8).fillColor(colors.muted).text(
            "Easy Medical  |  Bon de commande",
            left,
            769,
            { lineBreak: false },
        );
        doc.text(`${String(pageNumber).padStart(2, "0")} / ${String(totalPages).padStart(2, "0")}`, 490, 769, {
            width: 53,
            align: "right",
            lineBreak: false,
        });
    };

    const drawSectionTitle = (title: string, y: number) => {
        doc.roundedRect(left, y, 3, 16, 1).fill(colors.teal);
        doc.font("Helvetica-Bold").fontSize(10.5).fillColor(colors.navy).text(title, left + 12, y + 1, {
            width: contentWidth - 12,
        });
        return y + 22;
    };

    const drawParagraph = (text: string, y: number, x = left + 12, width = contentWidth - 12) => {
        doc.font("Helvetica").fontSize(8.8).fillColor(colors.ink).text(text, x, y, {
            width,
            lineGap: 1.5,
        });
        return doc.y + 7;
    };

    const drawPartyCard = (title: string, lines: Array<[string, string]>, x: number, y: number, width: number) => {
        doc.roundedRect(x, y, width, 126, 8).fill("#F5F8FA");
        doc.font("Helvetica-Bold").fontSize(8.5).fillColor(colors.teal).text(title.toUpperCase(), x + 14, y + 12);
        let lineY = y + 34;
        for (const [label, value] of lines) {
            doc.font("Helvetica-Bold").fontSize(7.5).fillColor(colors.muted).text(label, x + 14, lineY, { width: 70 });
            doc.font("Helvetica").fontSize(8).fillColor(colors.ink).text(value, x + 84, lineY, { width: width - 98 });
            lineY += 17;
        }
    };

    drawPageHeader(1);
    doc.roundedRect(left, 110, contentWidth, 82, 10).fill(colors.navy);
    doc.font("Helvetica-Bold").fontSize(8).fillColor("#91DCD3").text("DOCUMENT DE COMMANDE", left + 20, 125);
    doc.font("Helvetica-Bold").fontSize(19).fillColor(colors.white).text("Bon de commande", left + 20, 144, { width: 310 });
    doc.font("Helvetica").fontSize(8.5).fillColor("#D7E8EF").text(
        order.action === "maintenance" ? "Maintenance annuelle" : "Achat licence perpétuelle",
        left + 20,
        171,
    );
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#91DCD3").text("DATE", 390, 125);
    doc.font("Helvetica").fontSize(8.5).fillColor(colors.white).text(formatDate(orderDate), 390, 141);
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#91DCD3").text("RÉFÉRENCE", 390, 161);
    doc.font("Helvetica").fontSize(8.5).fillColor(colors.white).text(orderRef, 390, 177);

    drawPartyCard("Le prestataire", [
        ["Nom", provider.name],
        ["Adresse", provider.address || "—"],
        ["Téléphone", provider.phone || "—"],
        ["E-mail", provider.email || "—"],
    ], left, 212, 239);
    drawPartyCard("Le client", [
        ["Établissement", entreprise?.NomSociete || "—"],
        ["Adresse", entreprise?.adresse || "—"],
        ["Téléphone", entreprise?.contact || "—"],
        ["E-mail", entreprise?.email || "—"],
        ...(entreprise?.NCC ? [["NCC", entreprise.NCC] as [string, string]] : []),
    ], 304, 212, 239);

    // Items table
    let y = drawSectionTitle("DÉTAILS DE LA COMMANDE", 358);
    let page = 1;
    const ensureSpace = (needed: number) => {
        if (y + needed > 730) {
            doc.addPage();
            page += 1;
            drawPageHeader(page);
            y = 116;
        }
    };
    const colDesc = left + 12;
    const colQty = 350;
    const colUnit = 410;
    const colTotal = 480;
    const tableWidth = contentWidth - 12;

    doc.roundedRect(colDesc, y, tableWidth, 20, 4).fill(colors.navy);
    doc.font("Helvetica-Bold").fontSize(8).fillColor(colors.white).text("DESCRIPTION", colDesc + 10, y + 6);
    doc.text("QTÉ", colQty, y + 6, { width: 50, align: "right" });
    doc.text("PRIX UNITAIRE", colUnit, y + 6, { width: 60, align: "right" });
    doc.text("TOTAL", colTotal, y + 6, { width: 45, align: "right" });
    y += 20;

    items.forEach((it, idx) => {
        ensureSpace(20);
        if (idx % 2 === 1) {
            doc.rect(colDesc, y, tableWidth, 20).fill("#F5F8FA");
        }
        const isIncluded = !it.unit && !it.total;
        doc.font("Helvetica").fontSize(8.5).fillColor(colors.ink).text(it.name, colDesc + 10, y + 6, { width: 320 });
        doc.text(String(it.qty), colQty, y + 6, { width: 50, align: "right" });
        doc.text(isIncluded ? "Inclus" : formatNumber(it.unit), colUnit, y + 6, { width: 60, align: "right" });
        doc.text(isIncluded ? "Inclus" : formatNumber(it.total), colTotal, y + 6, { width: 45, align: "right" });
        y += 20;
    });
    doc.moveTo(colDesc, y).lineTo(colDesc + tableWidth, y).strokeColor(colors.line).lineWidth(0.8).stroke();
    y += 10;

    // Total box
    ensureSpace(54);
    const subtotal = items.reduce((s, it) => s + (it.total || 0), 0);
    doc.roundedRect(left + 12, y, contentWidth - 12, 44, 6).fill(colors.pale);
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor(colors.navy).text("TOTAL DE LA COMMANDE", left + 24, y + 10);
    doc.font("Helvetica-Bold").fontSize(11).fillColor(colors.teal).text(
        `${formatNumber(subtotal)} ${(order as any).currency || "XOF"}  (${amountInWords(subtotal)})`,
        left + 24,
        y + 24,
        { width: contentWidth - 48 },
    );
    y += 54;

    ensureSpace(75);
    y = drawSectionTitle("MODALITÉS DE RÈGLEMENT", y);
    doc.roundedRect(left + 12, y, contentWidth - 12, 42, 6).fill("#F5F8FA");
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor(colors.muted).text("MODE DE PAIEMENT", left + 24, y + 10);
    doc.font("Helvetica").fontSize(8.5).fillColor(colors.ink).text(paymentMethodLabel(order.paymentMethod), left + 160, y + 10);
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor(colors.muted).text("STATUT", left + 24, y + 26);
    doc.font("Helvetica").fontSize(8.5).fillColor(colors.ink).text(
        order.status === "validated" ? "Validée" : order.status === "paid_awaiting_validation" ? "Payée, en attente de validation" : "En attente",
        left + 160,
        y + 26,
    );
    y += 52;

    ensureSpace(230);
    y = drawParagraph(
        "Le présent bon de commande formalise la commande du Client auprès du Prestataire. Sa validation et le règlement correspondant donnent lieu à la délivrance des documents contractuels et justificatifs appropriés.",
        y,
        left,
        contentWidth,
    );

    doc.roundedRect(left, y + 5, contentWidth, 42, 6).fill(colors.pale);
    doc.font("Helvetica-Bold").fontSize(8).fillColor(colors.navy).text("FAIT À", left + 14, y + 19);
    doc.font("Helvetica").fontSize(8.5).fillColor(colors.ink).text(provider.city || "________________________", left + 53, y + 19);
    doc.font("Helvetica-Bold").fontSize(8).fillColor(colors.navy).text("LE", left + 310, y + 19);
    doc.font("Helvetica").fontSize(8.5).fillColor(colors.ink).text(formatDate(orderDate), left + 334, y + 19);

    const signatureY = y + 66;
    const signatureWidth = 239;
    for (const x of [left, 304]) {
        doc.roundedRect(x, signatureY, signatureWidth, 150, 8).lineWidth(0.8).strokeColor(colors.line).stroke();
    }
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(colors.teal).text("LE PRESTATAIRE", left + 15, signatureY + 15);
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(colors.teal).text("LE CLIENT", 319, signatureY + 15);
    doc.font("Helvetica").fontSize(8).fillColor(colors.ink).text(`Nom : ${provider.name}`, left + 15, signatureY + 37, { width: signatureWidth - 30 });
    doc.font("Helvetica").fontSize(8).fillColor(colors.ink).text(
        `Nom : ${entreprise?.NomSociete || "—"}`,
        319,
        signatureY + 37,
        { width: signatureWidth - 30 },
    );
    doc.font("Helvetica").fontSize(7.5).fillColor(colors.muted).text("Signature", left + 15, signatureY + 66);
    doc.font("Helvetica").fontSize(7.5).fillColor(colors.muted).text("Signature et cachet", 319, signatureY + 66);
    doc.moveTo(left + 15, signatureY + 124).lineTo(left + signatureWidth - 15, signatureY + 124).strokeColor(colors.line).stroke();
    doc.moveTo(319, signatureY + 124).lineTo(304 + signatureWidth - 15, signatureY + 124).strokeColor(colors.line).stroke();

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
    const doc = new PDFDocument({
        size: "A4",
        margins: { top: 45, bottom: 56, left: 52, right: 52 },
    });
    const colors = {
        navy: "#12324A",
        teal: "#0D9B8A",
        pale: "#EAF6F5",
        ink: "#263746",
        muted: "#647789",
        line: "#DCE6EC",
        white: "#FFFFFF",
    };
    const left = 52;
    const right = 543;
    const contentWidth = right - left;
    const ref = `RE-EASY-${String(order._id).slice(-6).toUpperCase()}`;
    const orderRef = order.reference || `CMD-${new Date(order.createdAt || Date.now()).getFullYear()}-${String(order._id).slice(-6).toUpperCase()}`;
    const paidDate = order.paidAt ? new Date(order.paidAt) : new Date();
    const formatDate = (date: Date) => date.toLocaleDateString("fr-FR");
    const logoPath = path.join(process.cwd(), "public", "images", "logo-easy.png");

    const drawPageHeader = (pageNumber: number) => {
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, left, 34, { fit: [45, 45] });
        }
        doc.font("Helvetica-Bold").fontSize(13).fillColor(colors.navy).text("EASY MEDICAL", 106, 39);
        doc.font("Helvetica").fontSize(8).fillColor(colors.muted).text(
            "REÇU DE PAIEMENT",
            106,
            57,
        );
        doc.font("Helvetica-Bold").fontSize(8).fillColor(colors.teal).text(ref, 420, 44, { width: 123, align: "right" });
        doc.moveTo(left, 91).lineTo(right, 91).strokeColor(colors.line).lineWidth(1).stroke();
        doc.moveTo(left, 758).lineTo(right, 758).strokeColor(colors.line).lineWidth(0.7).stroke();
        doc.font("Helvetica").fontSize(8).fillColor(colors.muted).text(
            "Easy Medical  |  Reçu de paiement",
            left,
            769,
            { lineBreak: false },
        );
        doc.text(`${String(pageNumber).padStart(2, "0")} / 01`, 490, 769, {
            width: 53,
            align: "right",
            lineBreak: false,
        });
    };

    const drawSectionTitle = (title: string, y: number) => {
        doc.roundedRect(left, y, 3, 16, 1).fill(colors.teal);
        doc.font("Helvetica-Bold").fontSize(10.5).fillColor(colors.navy).text(title, left + 12, y + 1, {
            width: contentWidth - 12,
        });
        return y + 22;
    };

    const drawParagraph = (text: string, y: number, x = left + 12, width = contentWidth - 12) => {
        doc.font("Helvetica").fontSize(8.8).fillColor(colors.ink).text(text, x, y, {
            width,
            lineGap: 1.5,
        });
        return doc.y + 7;
    };

    const drawPartyCard = (title: string, lines: Array<[string, string]>, x: number, y: number, width: number) => {
        doc.roundedRect(x, y, width, 108, 8).fill("#F5F8FA");
        doc.font("Helvetica-Bold").fontSize(8.5).fillColor(colors.teal).text(title.toUpperCase(), x + 14, y + 10);
        let lineY = y + 30;
        for (const [label, value] of lines) {
            doc.font("Helvetica-Bold").fontSize(7.5).fillColor(colors.muted).text(label, x + 14, lineY, { width: 70 });
            doc.font("Helvetica").fontSize(8).fillColor(colors.ink).text(value, x + 84, lineY, { width: width - 98 });
            lineY += 17;
        }
    };

    drawPageHeader(1);
    doc.roundedRect(left, 110, contentWidth, 82, 10).fill(colors.navy);
    doc.font("Helvetica-Bold").fontSize(8).fillColor("#91DCD3").text("JUSTIFICATIF DE PAIEMENT", left + 20, 125);
    doc.font("Helvetica-Bold").fontSize(19).fillColor(colors.white).text("Reçu de paiement", left + 20, 144, { width: 310 });
    doc.font("Helvetica").fontSize(8.5).fillColor("#D7E8EF").text("Logiciel de gestion médicale Easy Medical", left + 20, 171);
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#91DCD3").text("DATE", 390, 125);
    doc.font("Helvetica").fontSize(8.5).fillColor(colors.white).text(formatDate(paidDate), 390, 141);
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#91DCD3").text("RÉFÉRENCE", 390, 161);
    doc.font("Helvetica").fontSize(8.5).fillColor(colors.white).text(ref, 390, 177);

    drawPartyCard("Le prestataire", [
        ["Nom", provider.name],
        ["Adresse", provider.address || "—"],
        ["Téléphone", provider.phone || "—"],
        ["E-mail", provider.email || "—"],
    ], left, 204, 239);
    drawPartyCard("Le client", [
        ["Établissement", entreprise?.NomSociete || "—"],
        ["Adresse", entreprise?.adresse || "—"],
        ["Téléphone", entreprise?.contact || "—"],
        ["E-mail", entreprise?.email || "—"],
    ], 304, 204, 239);

    let y = drawSectionTitle("OBJET DU PAIEMENT", 330);
    y = drawParagraph(
        `Je soussigné, ${provider.name}, reconnais avoir reçu de ${entreprise?.NomSociete || "—"} la somme de :`,
        y,
    );
    doc.roundedRect(left + 12, y, contentWidth - 12, 58, 6).fill(colors.pale);
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor(colors.navy).text("MONTANT REÇU", left + 24, y + 10);
    doc.font("Helvetica-Bold").fontSize(10).fillColor(colors.teal).text(
        `${formatAmount(order.amount)} (${amountInWords(order.amount)})`,
        left + 24,
        y + 24,
        { width: contentWidth - 48 },
    );
    doc.font("Helvetica").fontSize(8).fillColor(colors.ink).text(
        `Paiement relatif à la commande : ${orderRef}`,
        left + 24,
        y + 42,
        { width: contentWidth - 48 },
    );
    y += 68;

    // ── MOTIF DU PAIEMENT + DÉTAILS DU RÈGLEMENT : deux colonnes ──────────────
    const drawHalfSectionTitle = (title: string, x: number, yPos: number, width: number) => {
        doc.roundedRect(x, yPos, 3, 16, 1).fill(colors.teal);
        doc.font("Helvetica-Bold").fontSize(10).fillColor(colors.navy).text(title, x + 12, yPos + 1, {
            width: width - 12,
        });
        return yPos + 22;
    };

    const colL = left;
    const colR = 304;
    const colW = 239;

    const sectionTop = y;
    drawHalfSectionTitle("MOTIF DU PAIEMENT", colL, sectionTop, colW);
    drawHalfSectionTitle("DÉTAILS DU RÈGLEMENT", colR, sectionTop, colW);
    y = sectionTop + 22;

    // Colonne gauche : motifs avec cases à cocher
    const motifs = [
        "Acquisition de licence Easy Medical",
        "Installation et configuration",
        "Formation",
        "Maintenance annuelle",
        "Acompte sur commande",
        "Solde de commande",
        "Autre",
    ];
    const motifChecked = order.action === "maintenance" ? "Maintenance annuelle" : "Acquisition de licence Easy Medical";
    let motifY = y;
    for (const m of motifs) {
        const checked = m === motifChecked;
        doc.roundedRect(colL + 4, motifY, 10, 10, 2).lineWidth(1).strokeColor(checked ? colors.teal : colors.line).stroke();
        if (checked) {
            doc.moveTo(colL + 6, motifY + 5)
                .lineTo(colL + 8.5, motifY + 8)
                .lineTo(colL + 12, motifY + 2.5)
                .lineWidth(1.5)
                .strokeColor(colors.teal)
                .stroke();
        }
        doc.font("Helvetica").fontSize(8.4).fillColor(colors.ink).text(m, colL + 20, motifY, {
            width: colW - 24,
            lineBreak: false,
        });
        motifY += 14;
    }

    // Colonne droite : détails du règlement
    const montantPaye = typeof order.montantPaye === "number" ? order.montantPaye : (order.amount || 0);
    const resteAPayer = Math.max(0, (order.amount || 0) - montantPaye);
    const detY = y;
    doc.roundedRect(colR, detY, colW, 58, 6).fill("#F5F8FA");
    const detLabelX = colR + 12;
    const detValueX = colR + 105;
    doc.font("Helvetica-Bold").fontSize(7).fillColor(colors.muted).text("MODE DE PAIEMENT", detLabelX, detY + 10, { width: 90 });
    doc.font("Helvetica").fontSize(8).fillColor(colors.ink).text(paymentMethodLabel(order.paymentMethod), detValueX, detY + 10, { width: colW - 117 });
    doc.font("Helvetica-Bold").fontSize(7).fillColor(colors.muted).text("MONTANT PAYÉ", detLabelX, detY + 26, { width: 90 });
    doc.font("Helvetica").fontSize(8).fillColor(colors.ink).text(formatAmount(montantPaye), detValueX, detY + 26, { width: colW - 117 });
    doc.font("Helvetica-Bold").fontSize(7).fillColor(colors.muted).text("RESTE À PAYER", detLabelX, detY + 42, { width: 90 });
    doc.font("Helvetica").fontSize(8).fillColor(resteAPayer > 0 ? "#B71C1C" : colors.ink).text(formatAmount(resteAPayer), detValueX, detY + 42, { width: colW - 117 });

    y = Math.max(motifY, detY + 58) + 10;

    y = drawParagraph(
        "OBSERVATION : Le présent document constitue une reconnaissance du paiement reçu au titre de la commande indiquée ci-dessus, sous réserve des obligations de facturation applicables.",
        y,
        left,
        contentWidth,
    );

    doc.roundedRect(left, y + 4, contentWidth, 34, 6).fill(colors.pale);
    doc.font("Helvetica-Bold").fontSize(8).fillColor(colors.navy).text("FAIT À", left + 14, y + 16);
    doc.font("Helvetica").fontSize(8.5).fillColor(colors.ink).text(provider.city || "________________________", left + 53, y + 16);
    doc.font("Helvetica-Bold").fontSize(8).fillColor(colors.navy).text("LE", left + 310, y + 16);
    doc.font("Helvetica").fontSize(8.5).fillColor(colors.ink).text(formatDate(paidDate), left + 334, y + 16);

    const signatureY = y + 52;
    const signatureWidth = 239;
    const signatureHeight = 88;
    for (const x of [left, 304]) {
        doc.roundedRect(x, signatureY, signatureWidth, signatureHeight, 8).lineWidth(0.8).strokeColor(colors.line).stroke();
    }
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(colors.teal).text("LE PRESTATAIRE", left + 15, signatureY + 12);
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(colors.teal).text("LE CLIENT", 319, signatureY + 12);
    doc.font("Helvetica").fontSize(8).fillColor(colors.ink).text(`Nom : ${provider.name}`, left + 15, signatureY + 30, { width: signatureWidth - 30 });
    doc.font("Helvetica").fontSize(8).fillColor(colors.ink).text(
        `Nom : ${entreprise?.NomSociete || "—"}`,
        319,
        signatureY + 30,
        { width: signatureWidth - 30 },
    );
    doc.font("Helvetica").fontSize(7.5).fillColor(colors.muted).text("Signature", left + 15, signatureY + 50);
    doc.font("Helvetica").fontSize(7.5).fillColor(colors.muted).text("Signature et cachet", 319, signatureY + 50);
    doc.moveTo(left + 15, signatureY + signatureHeight - 12).lineTo(left + signatureWidth - 15, signatureY + signatureHeight - 12).strokeColor(colors.line).stroke();
    doc.moveTo(319, signatureY + signatureHeight - 12).lineTo(304 + signatureWidth - 15, signatureY + signatureHeight - 12).strokeColor(colors.line).stroke();

    // Tampon « PAYÉ »
    doc.save();
    doc.rotate(-12, { origin: [420, signatureY + 40] });
    doc.roundedRect(420, signatureY + 22, 110, 34, 6).lineWidth(2).strokeColor(colors.teal).stroke();
    doc.font("Helvetica-Bold").fontSize(16).fillColor(colors.teal).text("PAYÉ", 420, signatureY + 30, { width: 110, align: "center" });
    doc.restore();

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
    const doc = new PDFDocument({
        size: "A4",
        margins: { top: 45, bottom: 56, left: 52, right: 52 },
    });
    const isMaintenance = type === "maintenance";
    const headerTitle = isMaintenance
        ? "Contrat de maintenance"
        : "Contrat d'acquisition de licence";
    const refPrefix = isMaintenance ? "CM-EASY" : "CA-EASY";
    const colors = {
        navy: "#12324A",
        teal: "#0D9B8A",
        pale: "#EAF6F5",
        ink: "#263746",
        muted: "#647789",
        line: "#DCE6EC",
        white: "#FFFFFF",
    };
    const left = 52;
    const right = 543;
    const contentWidth = right - left;
    const ref = `${refPrefix}-${String(order._id).slice(-6).toUpperCase()}`;
    const contractDate = new Date(order.createdAt || Date.now());
    const formatDate = (date: Date) => date.toLocaleDateString("fr-FR");
    const logoPath = path.join(process.cwd(), "public", "images", "logo-easy.png");

    const startDate = entreprise?.licensePurchasedAt
        ? new Date(entreprise.licensePurchasedAt)
        : (entreprise?.licenceStartDate ? new Date(entreprise.licenceStartDate) : new Date(order.createdAt || Date.now()));
    const maintenanceExpiry = entreprise?.maintenanceDueDate ? new Date(entreprise.maintenanceDueDate) : undefined;

    const drawPageHeader = (pageNumber: number) => {
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, left, 34, { fit: [45, 45] });
        }
        doc.font("Helvetica-Bold").fontSize(13).fillColor(colors.navy).text("EASY MEDICAL", 106, 39);
        doc.font("Helvetica").fontSize(8).fillColor(colors.muted).text(
            isMaintenance ? "CONTRAT DE MAINTENANCE LOGICIELLE" : "CONTRAT DE LICENCE LOGICIELLE",
            106,
            57,
        );
        doc.font("Helvetica-Bold").fontSize(8).fillColor(colors.teal).text(ref, 420, 44, { width: 123, align: "right" });
        doc.moveTo(left, 91).lineTo(right, 91).strokeColor(colors.line).lineWidth(1).stroke();
        doc.moveTo(left, 758).lineTo(right, 758).strokeColor(colors.line).lineWidth(0.7).stroke();
        doc.font("Helvetica").fontSize(8).fillColor(colors.muted).text(
            "Easy Medical  |  Contrat logiciel",
            left,
            769,
            { lineBreak: false },
        );
        doc.text(`${String(pageNumber).padStart(2, "0")} / 03`, 490, 769, {
            width: 53,
            align: "right",
            lineBreak: false,
        });
    };

    const drawSectionTitle = (title: string, y: number) => {
        doc.roundedRect(left, y, 3, 16, 1).fill(colors.teal);
        doc.font("Helvetica-Bold").fontSize(10.5).fillColor(colors.navy).text(title, left + 12, y + 1, {
            width: contentWidth - 12,
        });
        return y + 22;
    };

    const drawParagraph = (text: string, y: number, x = left + 12, width = contentWidth - 12) => {
        doc.font("Helvetica").fontSize(8.8).fillColor(colors.ink).text(text, x, y, {
            width,
            lineGap: 1.5,
        });
        return doc.y + 7;
    };

    const drawBullets = (items: string[], y: number, x = left + 12, width = contentWidth - 12) => {
        for (const item of items) {
            doc.circle(x + 3, y + 5, 1.5).fill(colors.teal);
            doc.font("Helvetica").fontSize(8.6).fillColor(colors.ink).text(item, x + 12, y, {
                width: width - 12,
                lineGap: 1,
            });
            y = doc.y + 2;
        }
        return y + 2;
    };

    const drawPartyCard = (title: string, lines: Array<[string, string]>, x: number, y: number, width: number) => {
        doc.roundedRect(x, y, width, 126, 8).fill("#F5F8FA");
        doc.font("Helvetica-Bold").fontSize(8.5).fillColor(colors.teal).text(title.toUpperCase(), x + 14, y + 12);
        let lineY = y + 34;
        for (const [label, value] of lines) {
            doc.font("Helvetica-Bold").fontSize(7.5).fillColor(colors.muted).text(label, x + 14, lineY, { width: 70 });
            doc.font("Helvetica").fontSize(8).fillColor(colors.ink).text(value, x + 84, lineY, { width: width - 98 });
            lineY += 17;
        }
    };

    drawPageHeader(1);
    doc.roundedRect(left, 110, contentWidth, 82, 10).fill(colors.navy);
    doc.font("Helvetica-Bold").fontSize(8).fillColor("#91DCD3").text("ACCORD DE SERVICES", left + 20, 125);
    doc.font("Helvetica-Bold").fontSize(19).fillColor(colors.white).text(headerTitle, left + 20, 144, { width: 310 });
    doc.font("Helvetica").fontSize(8.5).fillColor("#D7E8EF").text("Logiciel de gestion médicale Easy Medical", left + 20, 171);
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#91DCD3").text("DATE", 390, 125);
    doc.font("Helvetica").fontSize(8.5).fillColor(colors.white).text(formatDate(contractDate), 390, 141);
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#91DCD3").text("RÉFÉRENCE", 390, 161);
    doc.font("Helvetica").fontSize(8.5).fillColor(colors.white).text(ref, 390, 177);

    doc.font("Helvetica").fontSize(8.5).fillColor(colors.ink).text(
        "Entre les soussignés, il a été convenu ce qui suit :",
        left,
        208,
        { width: contentWidth },
    );
    drawPartyCard("Le prestataire", [
        ["Nom", provider.name],
        ["Adresse", provider.address || "—"],
        ["Téléphone", provider.phone || "—"],
        ["E-mail", provider.email || "—"],
    ], left, 230, 239);
    drawPartyCard("Le client", [
        ["Établissement", entreprise?.NomSociete || "—"],
        ["Adresse", entreprise?.adresse || "—"],
        ["Téléphone", entreprise?.contact || "—"],
        ["E-mail", entreprise?.email || "—"],
    ], 304, 230, 239);
    doc.font("Helvetica").fontSize(7.8).fillColor(colors.muted).text(
        "Ci-après désignés individuellement « la Partie » et ensemble « les Parties ».",
        left,
        365,
        { width: contentWidth },
    );

    let y = drawSectionTitle("ARTICLE 1 — OBJET", 390);
    y = drawParagraph(
        isMaintenance
            ? "Le présent contrat définit les conditions de maintenance du logiciel de gestion médicale Easy Medical installé et utilisé par le Client. La maintenance vise à contribuer au bon fonctionnement du logiciel, à corriger les anomalies et à accompagner le Client dans son utilisation."
            : "Le présent contrat définit les conditions d'acquisition et d'utilisation par le Client de la licence du logiciel de gestion médicale Easy Medical, pour les modules et la durée précisés ci-dessous.",
        y,
    );
    if (!isMaintenance) {
        y = drawParagraph(
            `Modules souscrits : ${(order.modules && order.modules.length > 0) ? order.modules.join(", ") : "Tous les modules"}.`,
            y,
        );
    }

    y = drawSectionTitle("ARTICLE 2 — DURÉE", y + 3);
    y = drawParagraph(
        isMaintenance
            ? "Le présent contrat de maintenance est conclu pour douze (12) mois, renouvelables chaque année sous réserve du paiement de la redevance annuelle."
            : "Le présent contrat est conclu pour une durée indéterminée : la licence est acquise à titre perpétuel par le Client, sans date d'expiration.",
        y,
    );
    doc.roundedRect(left + 12, y, contentWidth - 12, 39, 6).fill(colors.pale);
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor(colors.navy).text(
        isMaintenance ? "PÉRIODE DE MAINTENANCE" : "DATE D'ACQUISITION",
        left + 24,
        y + 8,
    );
    doc.font("Helvetica").fontSize(8).fillColor(colors.ink).text(
        isMaintenance
            ? `Début : ${formatDate(startDate)}     Échéance : ${maintenanceExpiry ? formatDate(maintenanceExpiry) : "—"}`
            : `Acquisition : ${formatDate(startDate)}     Licence perpétuelle`,
        left + 24,
        y + 22,
        { width: contentWidth - 36 },
    );
    if (!isMaintenance) {
        doc.font("Helvetica").fontSize(7.7).fillColor(colors.muted).text(
            "La maintenance annuelle est prévue séparément (première année incluse) : voir le contrat de maintenance associé.",
            left + 12,
            y + 46,
            { width: contentWidth - 12 },
        );
    }

    doc.addPage();
    drawPageHeader(2);
    y = drawSectionTitle("ARTICLE 3 — SERVICES COMPRIS DANS LA MAINTENANCE", 116);
    y = drawBullets([
        "Correction des anomalies liées au fonctionnement du logiciel ;",
        "Assistance technique ;",
        "Assistance à l'utilisation des fonctionnalités existantes ;",
        "Mises à jour correctives ;",
        "Petites adaptations nécessaires au maintien du fonctionnement ;",
        "Assistance à distance lorsque cela est possible ;",
        "Conseils concernant l'utilisation du logiciel.",
    ], y);

    y = drawSectionTitle("ARTICLE 4 — SERVICES NON COMPRIS", y + 7);
    y = drawParagraph("Sauf accord écrit complémentaire, les prestations suivantes ne sont pas comprises :", y);
    y = drawBullets([
        "Développement d'un nouveau module ou création d'une fonctionnalité entièrement nouvelle ;",
        "Modification importante de l'architecture du logiciel ;",
        "Intervention sur du matériel informatique, remplacement ou réparation du matériel ;",
        "Récupération de données perdues à la suite d'une mauvaise manipulation du Client ;",
        "Prestations extérieures au logiciel Easy Medical.",
    ], y);
    y = drawParagraph("Ces prestations pourront faire l'objet d'un devis séparé.", y);

    y = drawSectionTitle("ARTICLE 5 — SAUVEGARDE DES DONNÉES", y + 7);
    y = drawParagraph(
        "Le Client reste responsable de la conservation et de la sauvegarde de ses données. Le Prestataire peut l'accompagner dans la mise en place d'une procédure de sauvegarde, mais ne peut être tenu responsable d'une perte résultant notamment :",
        y,
    );
    y = drawBullets([
        "D'une panne matérielle ou d'une défaillance du système informatique ;",
        "D'une mauvaise manipulation ou d'une suppression volontaire ou accidentelle ;",
        "D'une absence de sauvegarde.",
    ], y);

    y = drawSectionTitle("ARTICLE 6 — CONFIDENTIALITÉ", y + 7);
    y = drawParagraph(
        "Le Prestataire s'engage à préserver la confidentialité des informations auxquelles il pourrait avoir accès dans le cadre de ses interventions. Les données relatives aux patients et aux activités de l'établissement ne sont utilisées que dans la mesure strictement nécessaire à l'assistance ou à la maintenance du logiciel.",
        y,
    );

    y = drawSectionTitle(isMaintenance ? "ARTICLE 7 — PRIX DE LA MAINTENANCE" : "ARTICLE 7 — PRIX DE LA LICENCE", y + 7);
    y = drawParagraph(
        isMaintenance ? "Le montant de la maintenance pour la période convenue est fixé comme suit :" : "Le montant de la licence est fixé comme suit :",
        y,
    );
    doc.roundedRect(left + 12, y, contentWidth - 12, 75, 6).fill("#F5F8FA");
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor(colors.navy).text("MONTANT", left + 24, y + 10);
    doc.font("Helvetica-Bold").fontSize(10).fillColor(colors.teal).text(
        `${formatAmount(order.amount)} (${amountInWords(order.amount)})`,
        left + 24,
        y + 24,
        { width: contentWidth - 48 },
    );
    doc.font("Helvetica").fontSize(8).fillColor(colors.ink).text(
        `Modalités de paiement : ${paymentMethodLabel(order.paymentMethod)}`,
        left + 24,
        y + 50,
        { width: contentWidth - 48 },
    );
    doc.font("Helvetica").fontSize(7.5).fillColor(colors.muted).text(
        "Le paiement donne lieu à la délivrance du document justificatif approprié.",
        left + 24,
        y + 63,
        { width: contentWidth - 48 },
    );

    doc.addPage();
    drawPageHeader(3);
    y = drawSectionTitle("ARTICLE 8 — INTERRUPTION DU SERVICE", 116);
    y = drawParagraph(
        "En cas de non-paiement du renouvellement de la maintenance à son échéance, le Prestataire pourra suspendre les prestations de maintenance après information du Client. Cette suspension n'entraîne pas automatiquement la suppression ou la perte des données du Client.",
        y,
    );
    y = drawSectionTitle("ARTICLE 9 — RÉSILIATION", y + 8);
    y = drawParagraph(
        "Chaque partie peut demander la résiliation du contrat en informant l'autre partie par écrit. Les prestations déjà réalisées restent dues.",
        y,
    );
    y = drawSectionTitle("ARTICLE 10 — ACCEPTATION", y + 8);
    y = drawParagraph(
        "Le Client reconnaît avoir pris connaissance des conditions du présent contrat et les accepter. Les Parties confirment leur accord par leur signature ci-dessous.",
        y,
    );

    doc.roundedRect(left, y + 5, contentWidth, 42, 6).fill(colors.pale);
    doc.font("Helvetica-Bold").fontSize(8).fillColor(colors.navy).text("FAIT À", left + 14, y + 19);
    doc.font("Helvetica").fontSize(8.5).fillColor(colors.ink).text(provider.city || "________________________", left + 53, y + 19);
    doc.font("Helvetica-Bold").fontSize(8).fillColor(colors.navy).text("LE", left + 310, y + 19);
    doc.font("Helvetica").fontSize(8.5).fillColor(colors.ink).text(formatDate(contractDate), left + 334, y + 19);

    const signatureY = y + 66;
    const signatureWidth = 239;
    for (const x of [left, 304]) {
        doc.roundedRect(x, signatureY, signatureWidth, 190, 8).lineWidth(0.8).strokeColor(colors.line).stroke();
    }
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(colors.teal).text("LE PRESTATAIRE", left + 15, signatureY + 15);
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(colors.teal).text("LE CLIENT", 319, signatureY + 15);
    doc.font("Helvetica").fontSize(8).fillColor(colors.ink).text(`Nom : ${provider.name}`, left + 15, signatureY + 37, { width: signatureWidth - 30 });
    doc.font("Helvetica").fontSize(8).fillColor(colors.ink).text(
        `Nom : ${entreprise?.NomSociete || "—"}`,
        319,
        signatureY + 37,
        { width: signatureWidth - 30 },
    );
    doc.font("Helvetica").fontSize(7.5).fillColor(colors.muted).text("Signature", left + 15, signatureY + 66);
    doc.font("Helvetica").fontSize(7.5).fillColor(colors.muted).text("Signature et cachet", 319, signatureY + 66);
    doc.moveTo(left + 15, signatureY + 164).lineTo(left + signatureWidth - 15, signatureY + 164).strokeColor(colors.line).stroke();
    doc.moveTo(319, signatureY + 164).lineTo(304 + signatureWidth - 15, signatureY + 164).strokeColor(colors.line).stroke();

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
