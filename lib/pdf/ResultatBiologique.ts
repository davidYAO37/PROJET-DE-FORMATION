// ============================================================================
// lib/pdf/ResultatBiologique.ts
// Générateur d'état RESULTAT D'ANALYSE BIOLOGIQUE
// EasyMedical Laboratory
// ============================================================================

import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

type PDFDocumentType = InstanceType<typeof PDFDocument>;


// ============================================================================
// TYPES
// ============================================================================

export interface PatientPdf {

    Nom: string;

    Prenoms: string;

    Sexe: string;

    Age_partient: number;

    Code_dossier: string;

}

export interface ExamenPdf {

    _id: string;

    CodePrestation: string;

    NomMed: string;

    CONCLUSIONGENE: string;

    Rclinique?: string;

    ObservationC: string;

    ProvenanceExamen: string;

    NIdentificationExamen: string;

    Assurance: string;

    DatePres: Date;

    DATERECEPTIONNER?: Date;

    DateValidation?: Date;

    Heurereception?: string;

    Biologiste?: string;

    CachetBiologiste?: Buffer;

}

export interface ResultatPdf {

    Param_designation: string;

    ChampResultat: string;

    ValeurNormale: string;

    PlageMin?: number;

    PlageMax?: number;

    unite?: string;

    interpretation?: string;

}

export interface LignePdf {

    prestation: string;

    familleDescription: string;

    typeResultat: number;

    ordre: number;

    observation?: string;

    familleId: string;

    resultats: ResultatPdf[];

}

export interface EntreprisePdf {

    NomSociete?: string;

    EnteteSociete?: string;

    LogoE?: string;

    PiedPageSociete?: string;

}

export interface OptionsPdf {

    afficherEntete?: boolean;

    orientation?: "portrait" | "landscape";

}

export interface DonneesPdf {

    patient: PatientPdf;

    examen: ExamenPdf;

    lignes: LignePdf[];

    entreprise?: EntreprisePdf;

    options?: OptionsPdf;

}


// ============================================================================
// CONSTANTES
// ============================================================================

export const PAGE_MARGIN = 40;

export const HEADER_HEIGHT = 120;

export const FOOTER_HEIGHT = 45;

export const TABLE_ROW_HEIGHT = 20;

export const TABLE_HEADER_HEIGHT = 30;

export const FONT_NORMAL = "Helvetica";

export const FONT_BOLD = "Helvetica-Bold";

export const FONT_ITALIC = "Helvetica-Oblique";


// ============================================================================
// COULEURS
// ============================================================================

export const COLORS = {

    bleu: "#0d6efd",

    bleuFonce: "#084298",

    cyan: "#00B0C8",

    gris: "#d9d9d9",

    grisClair: "#f2f2f2",

    noir: "#000000",

    rouge: "#dc3545",

    orange: "#e07000",

    vert: "#198754",

    blanc: "#ffffff"

};


// ============================================================================
// POSITION COURANTE
// ============================================================================

export interface CursorPdf {

    x: number;

    y: number;

}

export const cursor: CursorPdf = {

    x: PAGE_MARGIN,

    y: PAGE_MARGIN

};


// ============================================================================
// STYLES
// ============================================================================

export const Styles = {

    titre(doc: PDFDocumentType) {

        doc
            .font(FONT_BOLD)
            .fontSize(18)
            .fillColor(COLORS.bleuFonce);

    },

    sousTitre(doc: PDFDocumentType) {

        doc
            .font(FONT_BOLD)
            .fontSize(15)
            .fillColor(COLORS.bleu);

    },

    normal(doc: PDFDocumentType) {

        doc
            .font(FONT_NORMAL)
            .fontSize(11)
            .fillColor(COLORS.noir);

    },

    petit(doc: PDFDocumentType) {

        doc
            .font(FONT_NORMAL)
            .fontSize(8)
            .fillColor(COLORS.noir);

    },

    gras(doc: PDFDocumentType) {

        doc
            .font(FONT_BOLD)
            .fontSize(12)
            .fillColor(COLORS.noir);

    },

    interpretation(doc: PDFDocumentType) {

        doc
            .font(FONT_BOLD)
            .fontSize(11)
            .fillColor(COLORS.orange);

    },

    conclusion(doc: PDFDocumentType) {

        doc
            .font(FONT_BOLD)
            .fontSize(13)
            .fillColor(COLORS.bleuFonce);

    }

};


// ============================================================================
// LARGEURS DES COLONNES
// ============================================================================

export const COLONNES = {

    parametre: 215,

    resultat: 95,

    normale: 115,

    unite: 90

};


// ============================================================================
// LOGO
// ============================================================================

export function getLogoPath(

    logoUrl?: string

) {

    if (logoUrl) {

        const relativePath = logoUrl.startsWith("/")

            ? logoUrl.slice(1)

            : logoUrl;

        return path.join(

            process.cwd(),

            "public",

            relativePath

        );

    }

    return path.join(

        process.cwd(),

        "public",

        "images",

        "logo.png"

    );

}


// ============================================================================
// CACHET
// ============================================================================

export function getCachetPath() {

    return path.join(

        process.cwd(),

        "public",

        "images",

        "cachet.png"

    );

}


// ============================================================================
// SIGNATURE
// ============================================================================

export function getSignaturePath() {

    return path.join(

        process.cwd(),

        "public",

        "images",

        "signature.png"

    );

}


// ============================================================================
// VERIFICATION IMAGE
// ============================================================================

export function imageExiste(fichier: string) {

    return fs.existsSync(fichier);

}


// ============================================================================
// FORMAT A4
// ============================================================================

export function creerDocument(

    orientation: "portrait" | "landscape" = "portrait"

) {

    return new PDFDocument({

        size: "A4",

        layout: orientation,

        margins: {

            top: PAGE_MARGIN,

            left: PAGE_MARGIN,

            right: PAGE_MARGIN,

            bottom: FOOTER_HEIGHT + 10

        },

        bufferPages: true,

        autoFirstPage: true

    });

}
// ============================================================================
// FORMAT DATE
// ============================================================================

export function formatDate(
    date?: Date | string | null
): string {

    if (!date) return "";

    const d = new Date(date);

    if (isNaN(d.getTime()))
        return "";

    return d.toLocaleDateString(
        "fr-FR"
    );

}

// ============================================================================
// FORMAT HEURE
// ============================================================================

export function formatHeure(
    date?: Date | string | null
): string {

    if (!date)
        return "";

    const d = new Date(date);

    if (isNaN(d.getTime()))
        return "";

    return d.toLocaleTimeString(
        "fr-FR",
        {

            hour: "2-digit",

            minute: "2-digit"

        }

    );

}

// ============================================================================
// FORMAT DATE + HEURE
// ============================================================================

export function formatDateHeure(
    date?: Date | string | null
): string {

    if (!date)
        return "";

    return (
        formatDate(date) +
        " à " +
        formatHeure(date)
    );

}

// ============================================================================
// AGE
// ============================================================================

export function formatAge(
    age?: number
) {

    if (!age)
        return "";

    return `${age} An(s)`;

}

// ============================================================================
// CHAINE
// ============================================================================

export function texte(
    valeur: any
) {

    if (
        valeur === null ||
        valeur === undefined
    ) {
        return "";
    }

    return String(valeur);

}

// ============================================================================
// NOMBRE
// ============================================================================

export function nombre(
    valeur: any,
    decimal = 2
) {

    if (
        valeur === "" ||
        valeur === null ||
        valeur === undefined
    ) {
        return "";
    }

    const n =
        Number(valeur);

    if (
        isNaN(n)
    )
        return "";

    return n.toFixed(decimal);

}

// ============================================================================
// VALEUR HORS NORME
// ============================================================================

export function valeurAnormale(

    resultat: string,

    min?: number,

    max?: number

) {

    const valeur =
        Number(resultat);

    if (
        isNaN(valeur)
    )
        return false;

    if (
        min !== undefined &&
        valeur < min
    ) {
        return true;
    }

    if (
        max !== undefined &&
        valeur > max
    ) {
        return true;
    }

    return false;

}

// ============================================================================
// LIGNE TABLEAU
// ============================================================================

export interface LigneTableau {

    parametre: string;

    resultat: string;

    normale: string;

    unite: string;

    interpretation?: string;

    couleur?: string;

}

// ============================================================================
// GROUPE
// ============================================================================

export interface GroupePdf {

    famille: string;

    familleDescription: string;

    prestation: string;

    ordre: number;

    typeResultat: number;

    lignes: LigneTableau[];

    observation?: string;

}

// ============================================================================
// REGROUPEMENT
// ============================================================================

export interface FamillePdf {

    familleId: string;

    familleDescription: string;

    sousGroupes: GroupePdf[];

}

export function construireGroupes(

    lignes: LignePdf[]

): GroupePdf[] {

    const groupes =
        new Map<
            string,
            GroupePdf
        >();

    for (
        const ligne of lignes
    ) {

        const cle =
            `${ligne.familleId}___${ligne.prestation}`;

        if (
            !groupes.has(cle)
        ) {

            groupes.set(
                cle,
                {

                    famille:
                        ligne.familleId,

                    familleDescription:
                        ligne.familleDescription,

                    prestation:
                        ligne.prestation,

                    ordre:
                        ligne.ordre,

                    typeResultat:
                        ligne.typeResultat,

                    observation:
                        ligne.observation,

                    lignes: []

                }
            );

        }

        const groupe =
            groupes.get(cle)!;

        for (
            const resultat of ligne.resultats
        ) {

            groupe.lignes.push({

                parametre:
                    resultat.Param_designation,

                resultat:
                    resultat.ChampResultat,

                normale:
                    resultat.ValeurNormale,

                unite:
                    resultat.unite || "",

                interpretation:
                    resultat.interpretation || "",

                couleur:
                    valeurAnormale(

                        resultat.ChampResultat,

                        resultat.PlageMin,

                        resultat.PlageMax

                    )

                        ? COLORS.rouge

                        : COLORS.noir

            });

        }

    }

    return Array
        .from(
            groupes.values()
        )
        .sort(

            (
                a,
                b
            ) => {

                if (
                    a.famille <
                    b.famille
                )
                    return -1;

                if (
                    a.famille >
                    b.famille
                )
                    return 1;

                // typeResultat DESC (valeurs plus grandes = sans sous-groupe d'abord)
                if (b.typeResultat !== a.typeResultat)
                    return b.typeResultat - a.typeResultat;

                return (
                    a.ordre -
                    b.ordre
                );

            }

        );

}

export function construireFamilles(

    lignes: LignePdf[]

): FamillePdf[] {

    const groupes = construireGroupes(lignes);

    const famillesMap = new Map<string, FamillePdf>();

    for (const groupe of groupes) {

        if (!famillesMap.has(groupe.famille)) {
            famillesMap.set(groupe.famille, {
                familleId: groupe.famille,
                familleDescription: groupe.familleDescription || groupe.famille,
                sousGroupes: []
            });
        }

        famillesMap.get(groupe.famille)!.sousGroupes.push(groupe);

    }

    return Array.from(famillesMap.values());

}

// ============================================================================
// SAUT DE PAGE
// ============================================================================

export function verifierPage(

    doc: PDFDocumentType,

    hauteur = 25

) {

    const limite =

        doc.page.height -

        FOOTER_HEIGHT -

        PAGE_MARGIN;

    if (

        doc.y +

            hauteur >

        limite

    ) {

        doc.addPage();

        doc.y = PAGE_MARGIN;
        cursor.y = PAGE_MARGIN;

    }

}

// ============================================================================
// LIGNE
// ============================================================================

export function separateur(

    doc: PDFDocumentType

) {

    doc

        .moveTo(
            PAGE_MARGIN,
            doc.y
        )

        .lineTo(
            doc.page.width -
                PAGE_MARGIN,
            doc.y
        )

        .strokeColor(
            "#d9d9d9"
        )

        .stroke();

    doc.moveDown(
        0.5
    );

}
// ============================================================================
// DESSINE LE LOGO
// ============================================================================

export function dessinerLogo(
    doc: PDFDocumentType,
    entreprise?: EntreprisePdf
) {

    const logo = getLogoPath(entreprise?.LogoE);

    if (imageExiste(logo)) {

        doc.image(
            logo,
            PAGE_MARGIN,
            PAGE_MARGIN,
            {
                width: 75
            }
        );

    }

}

// ============================================================================
// NETTOYAGE ENTETE HTML
// ============================================================================

export function extraireLignesEntete(
    enteteHtml?: string
): string[] {

    if (!enteteHtml) return [];

    const nettoye = enteteHtml
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .trim();

    return nettoye
        .split("\n")
        .map(ligne => ligne.trim())
        .filter(ligne => ligne.length > 0);

}

// ============================================================================
// ENTETE CLINIQUE
// ============================================================================

export function dessinerEnteteClinique(
    doc: PDFDocumentType,
    entreprise?: EntreprisePdf
) {

    const toutesLignesEntete = extraireLignesEntete(entreprise?.EnteteSociete);
    const nomSociete = texte(entreprise?.NomSociete) || "CLINIQUE";
    const lignesEntete = toutesLignesEntete.filter(
        l => l.trim().toLowerCase() !== nomSociete.trim().toLowerCase()
    );
    const largeurPage = doc.page.width - PAGE_MARGIN * 2;
    const logoW = 90;
    const xTexte = PAGE_MARGIN + logoW + 10;
    const largeurTexte = largeurPage - logoW - 10;

    // Nom de la clinique — grand, cyan, centré
    doc.font(FONT_BOLD).fontSize(20).fillColor(COLORS.cyan)
        .text(nomSociete.toUpperCase(), xTexte, PAGE_MARGIN, { width: largeurTexte, align: "center" });

    let y = PAGE_MARGIN + 26;

    // Lignes de l'entête (adresse, téléphone, etc.)
    if (lignesEntete.length > 0) {
        doc.font(FONT_BOLD).fontSize(16).fillColor(COLORS.cyan);
        for (const ligne of lignesEntete) {
            doc.text(ligne, xTexte, y, { width: largeurTexte, align: "center" });
            y += 22;
        }
    }

    doc.y = Math.max(doc.y, y + 8);

}

// ============================================================================
// IDENTIFIANT HOSPITALISATION
// ============================================================================

export function dessinerNumeroAnalyse(

    doc: PDFDocumentType,

    examen: ExamenPdf

) {

    const largeur = doc.page.width - PAGE_MARGIN * 2;
    const yBandeau = doc.y + 4;
    const hauteurBandeau = 28;

    // Bandeau gris clair avec bordure
    doc.rect(PAGE_MARGIN, yBandeau, largeur, hauteurBandeau)
        .fillColor("#e8e8e8").fill();
    doc.rect(PAGE_MARGIN, yBandeau, largeur, hauteurBandeau)
        .strokeColor("#cccccc").lineWidth(0.5).stroke();

    // Texte centré noir gras dans le bandeau
    doc.font(FONT_BOLD).fontSize(13).fillColor(COLORS.noir)
        .text(
            `RESULTAT D'ANALYSE BIOLOGIQUE N° ${texte(examen.CodePrestation)}`,
            PAGE_MARGIN,
            yBandeau + (hauteurBandeau - 13) / 2,
            { width: largeur, align: "center" }
        );

    doc.y = yBandeau + hauteurBandeau + 8;

}

// ============================================================================
// INFOS PATIENT
// ============================================================================

export function dessinerPatient(

    doc: PDFDocumentType,

    patient: PatientPdf,

    examen: ExamenPdf

) {

    const nomComplet = `${texte(patient.Nom)} ${texte(patient.Prenoms)}`.trim();
    const largeurPage = doc.page.width - PAGE_MARGIN * 2;
    // Zone gauche : nom patient (environ 35% de la largeur)
    const nomW = Math.floor(largeurPage * 0.33);
    // Zone droite : infos centrees
    const xInfos = PAGE_MARGIN + nomW;
    const infosW = largeurPage - nomW;
    let y = doc.y;

    // — Ligne 1 : N°Dossier + N°identification (centré dans zone droite)
    const lDoss = 70;  // largeur label
    const lIdent = 100;
    const xDoss = xInfos;
    const xDossVal = xDoss + lDoss;
    const xIdent = xDossVal + 70;
    const xIdentVal = xIdent + lIdent;

    doc.font(FONT_BOLD).fontSize(11).fillColor(COLORS.noir)
        .text("N°Dossier:", xDoss, y, { width: lDoss });
    doc.font(FONT_NORMAL).fontSize(11).fillColor(COLORS.noir)
        .text(texte(patient.Code_dossier), xDossVal, y, { width: 65 });
    doc.font(FONT_BOLD).fontSize(11).fillColor(COLORS.noir)
        .text("N°identification", xIdent, y, { width: lIdent });
    doc.font(FONT_NORMAL).fontSize(11).fillColor(COLORS.noir)
        .text(texte(examen.NIdentificationExamen), xIdentVal, y);

    y += 17;

    // — Ligne 2 : Nom patient centré verticalement et horizontalement dans zone gauche
    const yNom = y; // ligne du milieu des 3 lignes (0, 17, 34)
    doc.font(FONT_BOLD).fontSize(13).fillColor(COLORS.noir)
        .text(nomComplet.toUpperCase(), PAGE_MARGIN, yNom, { width: nomW, align: "center" });

    // sexe : X   Age: XX  An(s) — tout sur une seule ligne
    const sexeVal = texte(patient.Sexe).charAt(0).toUpperCase() || "";
    const ageVal = texte(String(patient.Age_partient || ""));
    const xSexe = xInfos;

    doc.font(FONT_BOLD).fontSize(11).fillColor(COLORS.noir)
        .text("sexe :", xSexe, y, { width: 42, lineBreak: false });
    doc.font(FONT_NORMAL).fontSize(11).fillColor(COLORS.noir)
        .text(sexeVal, xSexe + 42, y, { width: 20, lineBreak: false });
    doc.font(FONT_BOLD).fontSize(11).fillColor(COLORS.noir)
        .text("Age:", xSexe + 68, y, { width: 32, lineBreak: false });
    doc.font(FONT_NORMAL).fontSize(11).fillColor(COLORS.noir)
        .text(ageVal, xSexe + 100, y, { width: 35, lineBreak: false });
    doc.font(FONT_NORMAL).fontSize(11).fillColor(COLORS.noir)
        .text("An(s)", xSexe + 135, y, { lineBreak: false });

    y += 17;

    // — Ligne 3 : Prescripteur (centré dans zone droite)
    const xPrescLabel = xInfos;
    const lPrescLabel = 82;
    doc.font(FONT_BOLD).fontSize(11).fillColor(COLORS.noir)
        .text("Prescripteur:", xPrescLabel, y, { width: lPrescLabel });
    doc.font(FONT_NORMAL).fontSize(11).fillColor(COLORS.noir)
        .text(texte(examen.NomMed), xPrescLabel + lPrescLabel, y, { width: infosW - lPrescLabel });

    doc.y = y + 18;

}

// ============================================================================
// PRESCRIPTION
// ============================================================================

export function dessinerPrescription(

    doc: PDFDocumentType,

    examen: ExamenPdf

) {

    const largeurPage = doc.page.width - PAGE_MARGIN * 2;
    const nomW = Math.floor(largeurPage * 0.33);
    const xInfos = PAGE_MARGIN + nomW;
    const infosW = largeurPage - nomW;
    let y = doc.y;

    const dateRecep = examen.DATERECEPTIONNER ? new Date(examen.DATERECEPTIONNER) : null;
    const dateRecepStr = dateRecep ? formatDate(dateRecep) : "";
    const heureRecepStr = examen.Heurereception || (dateRecep ? formatHeure(dateRecep) : "");
    const dateValid = examen.DateValidation ? formatDate(examen.DateValidation) : "";
    const lLabel = 72;

    // — Ligne 1 : Assurance (zone infos gauche) + Prescrit le (zone infos droite)
    doc.font(FONT_BOLD).fontSize(11).fillColor(COLORS.noir)
        .text("Assurance", xInfos, y, { width: lLabel });
    doc.font(FONT_NORMAL).fontSize(11).fillColor(COLORS.noir)
        .text(texte(examen.Assurance), xInfos + lLabel, y, { width: infosW / 2 - lLabel });
    doc.font(FONT_BOLD).fontSize(11).fillColor(COLORS.noir)
        .text("Prescrit le:", xInfos + infosW / 2, y, { width: 72 });
    doc.font(FONT_NORMAL).fontSize(11).fillColor(COLORS.noir)
        .text(formatDate(examen.DatePres), xInfos + infosW / 2 + 72, y);

    y += 17;

    // — Ligne 2 : Provenance (pleine largeur gauche) | Prélevé le (italique centré) | Valider le (droite)
    doc.font(FONT_NORMAL).fontSize(11).fillColor(COLORS.noir)
        .text("Provenance", PAGE_MARGIN, y, { width: nomW });
    doc.font(FONT_ITALIC).fontSize(11).fillColor(COLORS.noir)
        .text("Prélevé le", xInfos, y, { width: 60 });
    doc.font(FONT_ITALIC).fontSize(11).fillColor(COLORS.noir)
        .text(dateRecepStr, xInfos + 60, y, { width: 65 });
    doc.font(FONT_ITALIC).fontSize(11).fillColor(COLORS.noir)
        .text("A", xInfos + 128, y, { width: 16 });
    doc.font(FONT_ITALIC).fontSize(11).fillColor(COLORS.noir)
        .text(heureRecepStr, xInfos + 144, y, { width: 50 });
    doc.font(FONT_ITALIC).fontSize(11).fillColor(COLORS.noir)
        .text("Valider le", xInfos + infosW / 2 + 20, y, { width: 65 });
    doc.font(FONT_ITALIC).fontSize(11).fillColor(COLORS.noir)
        .text(dateValid, xInfos + infosW / 2 + 85, y);

    doc.y = y + 18;

}

// ============================================================================
// RENSEIGNEMENTS CLINIQUES
// ============================================================================

export function dessinerRenseignementClinique(

    doc: PDFDocumentType,

    examen: ExamenPdf

) {

    const y = doc.y;
    const largeurPage = doc.page.width - PAGE_MARGIN * 2;
    const labelW = 160;

    doc.font(FONT_BOLD).fontSize(11).fillColor(COLORS.noir)
        .text("RENSEIGNEMENT CLINIQUE:", PAGE_MARGIN, y, { width: labelW });

    const rcliniqueVal = typeof examen.Rclinique === 'string' && examen.Rclinique.trim() !== "" && examen.Rclinique.trim().toLowerCase() !== 'true' && examen.Rclinique.trim().toLowerCase() !== 'false'
        ? examen.Rclinique.trim()
        : "";
    if (rcliniqueVal) {
        doc.font(FONT_NORMAL).fontSize(11).fillColor(COLORS.noir)
            .text(rcliniqueVal, PAGE_MARGIN + labelW, y, { width: largeurPage - labelW });
    }

    doc.y = Math.max(doc.y, y + 16);
    separateur(doc);

}

// ============================================================================
// ENTETE COMPLET
// ============================================================================

export function dessinerEntete(

    doc: PDFDocumentType,

    data: DonneesPdf

) {

    const afficherEntete = data.options?.afficherEntete !== false;

    if (afficherEntete) {

        dessinerLogo(doc, data.entreprise);

        dessinerEnteteClinique(doc, data.entreprise);

        // 1.5 cm de marge entre le bas du logo/entête et le bandeau titre
        doc.y += 43;

    } else {

        // 5 cm de marge en haut quand pas d'entête
        doc.y = PAGE_MARGIN + 142;

    }

    dessinerNumeroAnalyse(
        doc,
        data.examen
    );

    dessinerPatient(
        doc,
        data.patient,
        data.examen
    );

    dessinerPrescription(
        doc,
        data.examen
    );

    // Biologiste + Imprimé par sur une seule ligne, juste au-dessus du renseignement clinique
    const nomBio = texte(data.examen.Biologiste);
    if (nomBio) {
        doc.moveDown(0.3);
        const yBio = doc.y;
        const now = new Date();
        let x = PAGE_MARGIN;
        doc.font(FONT_NORMAL).fontSize(9).fillColor(COLORS.noir)
            .text("Le Biologiste :", x, yBio, { width: 85, lineBreak: false });
        x += 87;
        doc.font(FONT_BOLD).fontSize(9).fillColor(COLORS.noir)
            .text(nomBio.toUpperCase(), x, yBio, { width: 110, lineBreak: false });
        x += 112;
        doc.font(FONT_NORMAL).fontSize(9).fillColor(COLORS.noir)
            .text("  —  Imprimé par", x, yBio, { width: 95, lineBreak: false });
        x += 97;
        doc.font(FONT_ITALIC).fontSize(9).fillColor(COLORS.noir)
            .text(nomBio, x, yBio, { width: 90, underline: true, lineBreak: false });
        x += 92;
        doc.font(FONT_NORMAL).fontSize(9).fillColor(COLORS.noir)
            .text(`  Le ${formatDate(now)}  A  ${formatHeure(now)}`, x, yBio, { lineBreak: false });
        doc.y = yBio + 14;
    }

    dessinerRenseignementClinique(
        doc,
        data.examen
    );

}
// ============================================================================
// ENTETE COMPACTE POUR LES PAGES SUIVANTES
// ============================================================================

export function dessinerEnteteNouvellePage(
    doc: PDFDocumentType,
    data: DonneesPdf
) {
    // Entête complète identique à la première page
    dessinerEntete(doc, data);
}

// ============================================================================
// POSITION DES COLONNES
// ============================================================================

const X_PARAM = PAGE_MARGIN;

const X_RESULTAT = X_PARAM + COLONNES.parametre;

const X_NORMALE = X_RESULTAT + COLONNES.resultat;

const X_UNITE = X_NORMALE + COLONNES.normale;

const TABLE_WIDTH =
    COLONNES.parametre +
    COLONNES.resultat +
    COLONNES.normale +
    COLONNES.unite;


// ============================================================================
// DESSIN D'UNE CELLULE
// ============================================================================

export function dessinerCellule(

    doc: PDFDocumentType,

    texteCellule: string,

    x: number,

    y: number,

    largeur: number,

    hauteur: number,

    options?: {

        align?: "left" | "center" | "right";

        bold?: boolean;

        background?: string;

        color?: string;

        fontSize?: number;

    }

) {

    const fond =
        options?.background ?? COLORS.blanc;

    doc
        .save()

        .rect(
            x,
            y,
            largeur,
            hauteur
        )

        .fillAndStroke(
            fond,
            "#777777"
        );

    doc.restore();

    if (options?.bold) {

        Styles.gras(doc);

    } else {

        Styles.normal(doc);

    }

    if (options?.fontSize) {
        doc.fontSize(options.fontSize);
    }

    doc.fillColor(
        options?.color ?? COLORS.noir
    );

    const textY = y + Math.max(3, (TABLE_HEADER_HEIGHT - (options?.fontSize ?? 11)) / 2);

    doc.text(

        texte(texteCellule),

        x + 4,

        textY,

        {

            width: largeur - 8,

            align:
                options?.align ??
                "left"

        }

    );

}


// ============================================================================
// DESSIN D'UNE LIGNE COMPLETE
// ============================================================================

export function dessinerLigneTableau(

    doc: PDFDocumentType,

    parametre: string,

    resultat: string,

    normale: string,

    unite: string,

    couleurResultat = COLORS.noir

) {

    verifierPage(
        doc,
        TABLE_ROW_HEIGHT
    );

    const y = doc.y;
    const estAnormal = couleurResultat === COLORS.rouge;
    const bgResultat = estAnormal ? COLORS.grisClair : COLORS.grisClair;

    const tY = y + 4;

    // Cellule paramètre — sans bordure, fond blanc
    doc.font(FONT_NORMAL).fontSize(11).fillColor(COLORS.noir)
        .text(texte(parametre) + " :", X_PARAM + 2, tY, { width: COLONNES.parametre - 4 });

    // Cellule résultat — fond gris clair, texte rouge si anormal
    doc.rect(X_RESULTAT, y, COLONNES.resultat, TABLE_ROW_HEIGHT)
        .fillColor(bgResultat).fill();
    doc.font(FONT_BOLD).fontSize(11).fillColor(couleurResultat)
        .text(texte(resultat), X_RESULTAT + 2, tY,
            { width: COLONNES.resultat - 4, align: "center" });

    // Cellule valeur normale
    doc.font(FONT_NORMAL).fontSize(11).fillColor(COLORS.noir)
        .text(texte(normale), X_NORMALE + 2, tY,
            { width: COLONNES.normale - 4, align: "center" });

    // Cellule unité
    doc.font(FONT_NORMAL).fontSize(11).fillColor(COLORS.noir)
        .text(texte(unite), X_UNITE + 2, tY,
            { width: COLONNES.unite - 4, align: "center" });

    // Trait de séparation bas de ligne
    doc.moveTo(X_PARAM, y + TABLE_ROW_HEIGHT)
        .lineTo(X_UNITE + COLONNES.unite, y + TABLE_ROW_HEIGHT)
        .strokeColor("#dddddd").lineWidth(0.5).stroke();
    doc.lineWidth(1);

    doc.y = y + TABLE_ROW_HEIGHT;

}


// ============================================================================
// ENTETE DU TABLEAU
// ============================================================================

export function dessinerEnteteTableau(

    doc: PDFDocumentType

) {

    verifierPage(
        doc,
        TABLE_HEADER_HEIGHT + 10
    );

    const y = doc.y;

    dessinerCellule(doc, "Paramètre", X_PARAM, y, COLONNES.parametre, TABLE_HEADER_HEIGHT,
        { bold: true, align: "center", background: COLORS.gris, fontSize: 11 });

    dessinerCellule(doc, "Résultat", X_RESULTAT, y, COLONNES.resultat, TABLE_HEADER_HEIGHT,
        { bold: true, align: "center", background: COLORS.gris, fontSize: 11 });

    dessinerCellule(doc, "Valeur Normale", X_NORMALE, y, COLONNES.normale, TABLE_HEADER_HEIGHT,
        { bold: true, align: "center", background: COLORS.gris, fontSize: 11 });

    dessinerCellule(doc, "Unité", X_UNITE, y, COLONNES.unite, TABLE_HEADER_HEIGHT,
        { bold: true, align: "center", background: COLORS.gris, fontSize: 11 });

    doc.y = y + TABLE_HEADER_HEIGHT;

}


// ============================================================================
// TITRE D'UNE PRESTATION
// ============================================================================

export function dessinerTitrePrestation(

    doc: PDFDocumentType,

    titre: string

) {

    verifierPage(
        doc,
        35
    );

    doc.moveDown(0.5);

    const yTitre = doc.y;

    doc
        .rect(PAGE_MARGIN, yTitre, TABLE_WIDTH, 22)
        .fillAndStroke(COLORS.cyan, COLORS.cyan);

    doc.font(FONT_BOLD).fontSize(10).fillColor(COLORS.blanc)
        .text(
            titre.toUpperCase(),
            PAGE_MARGIN,
            yTitre + 5,
            { width: TABLE_WIDTH, align: "center" }
        );

    doc.y = yTitre + 24;

    dessinerEnteteTableau(doc);

}
// ============================================================================
// RESULTAT ANORMAL
// ============================================================================

export function getCouleurResultat(
    resultat: ResultatPdf
): string {

    if (
        valeurAnormale(
            resultat.ChampResultat,
            resultat.PlageMin,
            resultat.PlageMax
        )
    ) {
        return COLORS.rouge;
    }

    return COLORS.noir;

}

// ============================================================================
// IMPRESSION D'UNE LIGNE RESULTAT
// ============================================================================

export function dessinerResultat(
    doc: PDFDocumentType,
    resultat: ResultatPdf
) {

    verifierPage(doc, TABLE_ROW_HEIGHT);

    const couleur =
        getCouleurResultat(resultat);

    dessinerLigneTableau(

        doc,

        texte(
            resultat.Param_designation
        ),

        texte(
            resultat.ChampResultat
        ),

        texte(
            resultat.ValeurNormale
        ),

        texte(
            resultat.unite
        ),

        couleur

    );

}

// ============================================================================
// IMPRESSION D'UNE LISTE DE RESULTATS
// ============================================================================

export function dessinerListeResultats(

    doc: PDFDocumentType,

    lignes: ResultatPdf[]

) {

    for (
        const resultat of lignes
    ) {

        dessinerResultat(
            doc,
            resultat
        );

    }

}

// ============================================================================
// INTERPRETATION
// ============================================================================

export function dessinerInterpretation(

    doc: PDFDocumentType,

    texteInterpretation?: string

) {

    if (
        !texteInterpretation
    ) {
        return;
    }

    verifierPage(
        doc,
        40
    );

    const y = doc.y + 2;

    doc.font(FONT_BOLD).fontSize(9).fillColor(COLORS.orange)
        .text("INTERPRETATION : ", PAGE_MARGIN, y, { continued: true });

    doc.font(FONT_BOLD).fontSize(9).fillColor(COLORS.orange)
        .text(texteInterpretation, { width: 450, align: "left" });

    doc.moveDown(0.5);

}

// ============================================================================
// OBSERVATION
// ============================================================================

export function dessinerObservation(

    doc: PDFDocumentType,

    observation?: string

) {

    if (
        !observation
    ) {
        return;
    }

    verifierPage(
        doc,
        60
    );

    Styles.gras(doc);

    doc.text(
        "OBSERVATION"
    );

    Styles.normal(doc);

    doc.moveDown(0.2);

    doc.text(

        observation,

        {

            width: 500,

            align: "justify"

        }

    );

    doc.moveDown();

}

// ============================================================================
// DESSIN D'UN GROUPE
// ============================================================================

export function dessinerGroupe(

    doc: PDFDocumentType,

    groupe: GroupePdf

) {

    dessinerTitrePrestation(

        doc,

        groupe.prestation

    );

    dessinerListeResultats(

        doc,

        groupe.lignes.map(

            ligne => ({

                Param_designation:
                    ligne.parametre,

                ChampResultat:
                    ligne.resultat,

                ValeurNormale:
                    ligne.normale,

                unite:
                    ligne.unite

            })

        )

    );

    dessinerObservation(

        doc,

        groupe.observation

    );

}

// ============================================================================
// TITRE FAMILLE
// ============================================================================

export function dessinerFamille(

    doc: PDFDocumentType,

    famille: string

) {

    verifierPage(
        doc,
        35
    );

    doc.moveDown();

    Styles.sousTitre(doc);

    doc.text(

        famille.toUpperCase()

    );

    doc.moveDown(0.3);

    separateur(doc);

}
// ============================================================================
// TRI DES GROUPES
// ============================================================================

export function trierGroupes(
    groupes: GroupePdf[]
): GroupePdf[] {

    return groupes.sort((a, b) => {

        if (a.famille < b.famille) return -1;
        if (a.famille > b.famille) return 1;

        if (a.typeResultat < b.typeResultat) return -1;
        if (a.typeResultat > b.typeResultat) return 1;

        return a.ordre - b.ordre;

    });

}

// ============================================================================
// IMPRESSION D'UNE LIGNE DE TABLEAU (LigneTableau)
// ============================================================================

export function dessinerLignePdf(

    doc: PDFDocumentType,

    ligne: LigneTableau

) {

    dessinerLigneTableau(

        doc,

        ligne.parametre,

        ligne.resultat,

        ligne.normale,

        ligne.unite,

        ligne.couleur ?? COLORS.noir

    );

}

// ============================================================================
// IMPRESSION COMPLETE D'UN GROUPE
// ============================================================================

export function dessinerPrestation(

    doc: PDFDocumentType,

    groupe: GroupePdf

) {

    dessinerTitrePrestation(

        doc,

        groupe.prestation

    );

    for (const ligne of groupe.lignes) {

        dessinerLignePdf(

            doc,

            ligne

        );

    }

    dessinerInterpretation(doc, groupe.observation);

}

// ============================================================================
// IMPRESSION COMPLETE DES RESULTATS
// ============================================================================

export function dessinerSousTitrePrestation(

    doc: PDFDocumentType,

    titre: string

) {

    verifierPage(doc, 30);

    doc.moveDown(0.3);

    const yTitre = doc.y;

    doc
        .rect(PAGE_MARGIN, yTitre, TABLE_WIDTH, 18)
        .fillAndStroke("#cccccc", "#cccccc");

    doc.font(FONT_BOLD).fontSize(9).fillColor(COLORS.noir)
        .text(
            titre.toUpperCase(),
            PAGE_MARGIN,
            yTitre + 4,
            { width: TABLE_WIDTH, align: "center" }
        );

    doc.y = yTitre + 18;

}

export function dessinerResultats(

    doc: PDFDocumentType,

    data: DonneesPdf

) {

    const familles = construireFamilles(data.lignes);

    for (let fi = 0; fi < familles.length; fi++) {

        const famille = familles[fi];

        // Saut de page entre familles (pas avant la première)
        if (fi > 0) {
            doc.addPage();
            doc.y = PAGE_MARGIN;
            dessinerEnteteNouvellePage(doc, data);
        }

        doc.moveDown(0.5);

        const yFam = doc.y;
        doc
            .rect(PAGE_MARGIN, yFam, TABLE_WIDTH, 22)
            .fillAndStroke(COLORS.cyan, COLORS.cyan);
        doc.font(FONT_BOLD).fontSize(10).fillColor(COLORS.blanc)
            .text(
                famille.familleDescription.toUpperCase(),
                PAGE_MARGIN,
                yFam + 5,
                { width: TABLE_WIDTH, align: "center" }
            );
        doc.y = yFam + 24;

        // ---- En-tête du tableau (Paramètre / Résultat / Valeur Normale / Unité) ----
        dessinerEnteteTableau(doc);

        for (const groupe of famille.sousGroupes) {

            const aPrestation = groupe.prestation && groupe.prestation.trim() !== "";
            const multiParams = groupe.lignes.length > 1;

            if (aPrestation && multiParams) {
                // Sous-titre gris = nom de la LignePrestation (uniquement si plusieurs paramètres)
                dessinerSousTitrePrestation(doc, groupe.prestation);
            }

            for (const ligne of groupe.lignes) {
                dessinerLignePdf(doc, ligne);
            }

            dessinerInterpretation(doc, groupe.observation);

        }

        // Plafonner doc.y pour éviter qu'un débordement crée une page vierge
        const limiteY = doc.page.height - FOOTER_HEIGHT - PAGE_MARGIN;
        if (doc.y > limiteY) doc.y = limiteY;

    }

}

// ============================================================================
// NOMBRE TOTAL DE PARAMETRES
// ============================================================================

export function nombreResultats(

    groupes: GroupePdf[]

): number {

    let total = 0;

    for (const groupe of groupes) {

        total +=

            groupe.lignes.length;

    }

    return total;

}

// ============================================================================
// RESUME DES EXAMENS
// ============================================================================

export function dessinerResume(

    doc: PDFDocumentType,

    groupes: GroupePdf[]

) {

    doc.moveDown();

    Styles.gras(doc);

    doc.text(

        `Nombre d'examens : ${groupes.length}`

    );

    doc.text(

        `Nombre de paramètres : ${nombreResultats(groupes)}`

    );

    doc.moveDown();

}
// ============================================================================
// CONCLUSION GENERALE
// ============================================================================

export function dessinerConclusion(

    doc: PDFDocumentType,

    examen: ExamenPdf

) {

    if (
        !examen.CONCLUSIONGENE ||
        examen.CONCLUSIONGENE.trim() === ""
    ) {
        return;
    }

    verifierPage(doc, 120);

    doc.moveDown(0.5);

    const largeurPage = doc.page.width - PAGE_MARGIN * 2;
    const labelW = 110;
    const xTexte = PAGE_MARGIN + labelW + 10;
    const yConc = doc.y;

    // "CONCLUSION:" à gauche en gras
    doc.font(FONT_BOLD).fontSize(11).fillColor(COLORS.noir)
        .text("CONCLUSION:", PAGE_MARGIN, yConc, { width: labelW });

    // Texte de conclusion centré dans la zone droite
    doc.font(FONT_NORMAL).fontSize(11).fillColor(COLORS.noir)
        .text(examen.CONCLUSIONGENE, xTexte, yConc, {
            width: largeurPage - labelW - 10,
            align: "center"
        });

    const limiteYConc = doc.page.height - FOOTER_HEIGHT - PAGE_MARGIN;
    doc.y = Math.min(Math.max(doc.y, yConc + 16), limiteYConc);

}



// ============================================================================
// LIGNE PIED DE PAGE
// ============================================================================

export function dessinerTraitPied(

    doc: PDFDocumentType

) {

    const y =

        doc.page.height -

        FOOTER_HEIGHT;

    doc

        .moveTo(

            PAGE_MARGIN,

            y

        )

        .lineTo(

            doc.page.width -

            PAGE_MARGIN,

            y

        )

        .strokeColor("#999999")

        .stroke();

}

// ============================================================================
// PIED DE PAGE D'UNE PAGE
// ============================================================================

export function dessinerPiedPageSociete(

    doc: PDFDocumentType,

    entreprise?: EntreprisePdf

) {

    const lignes = extraireLignesEntete(entreprise?.PiedPageSociete);
    if (lignes.length === 0) return;

    const largeur = doc.page.width - PAGE_MARGIN * 2;
    const lignePied = lignes.join("  ·  "); // fusionner en une seule ligne si plusieurs
    const hauteurBandeau = lignes.length > 1 ? 14 * lignes.length + 8 : 22;
    const yBandeau = doc.page.height - 42 - hauteurBandeau;

    // Bandeau cyan plein
    doc.rect(PAGE_MARGIN, yBandeau, largeur, hauteurBandeau)
        .fillColor(COLORS.cyan).fill();

    // Texte blanc centré dans le bandeau
    if (lignes.length === 1) {
        doc.font(FONT_NORMAL).fontSize(9).fillColor(COLORS.blanc)
            .text(lignePied, PAGE_MARGIN, yBandeau + (hauteurBandeau - 9) / 2,
                { width: largeur, align: "center" });
    } else {
        let yL = yBandeau + 4;
        doc.font(FONT_NORMAL).fontSize(9).fillColor(COLORS.blanc);
        for (const l of lignes) {
            doc.text(l, PAGE_MARGIN, yL, { width: largeur, align: "center" });
            yL += 14;
        }
    }

}

export function dessinerFooter(

    doc: PDFDocumentType,

    examen: ExamenPdf,

    entreprise?: EntreprisePdf

) {

    // save/restore pour éviter que les appels text() en position fixe
    // déclenchent une nouvelle page automatique dans PDFKit
    const savedY = doc.y;
    dessinerTraitPied(doc);
    dessinerPiedPageSociete(doc, entreprise);
    doc.y = savedY;

}

// ============================================================================
// FINALISATION
// ============================================================================

export function terminerDocument(

    doc: PDFDocumentType,

    data: DonneesPdf

) {

    const pages = doc.bufferedPageRange();

    for (let i = 0; i < pages.count; i++) {

        doc.switchToPage(i);

        dessinerFooter(doc, data.examen, data.entreprise);

    }

    doc.end();

}

// ============================================================================
// BUFFER
// ============================================================================

export async function documentToBuffer(

    doc: PDFDocumentType

): Promise<Buffer> {

    return new Promise(

        (

            resolve,

            reject

        ) => {

            const chunks:

                Buffer[] = [];

            doc.on(

                "data",

                (chunk) =>

                    chunks.push(chunk)

            );

            doc.on(

                "end",

                () =>

                    resolve(

                        Buffer.concat(

                            chunks

                        )

                    )

            );

            doc.on(

                "error",

                reject

            );

        }

    );

}
// ============================================================================
// GENERATION COMPLETE DU PDF
// ============================================================================

export async function genererResultatBiologique(
    data: DonneesPdf
): Promise<Buffer> {

    // ------------------------------------------------------------------------
    // Création du document
    // ------------------------------------------------------------------------

    const doc = creerDocument(data.options?.orientation || "portrait");

    // ------------------------------------------------------------------------
    // Préparation de la récupération du Buffer
    // ------------------------------------------------------------------------

    const bufferPromise = documentToBuffer(doc);

    // ------------------------------------------------------------------------
    // Première page
    // ------------------------------------------------------------------------

    dessinerEntete(
        doc,
        data
    );

    // ------------------------------------------------------------------------
    // Résultats biologiques
    // ------------------------------------------------------------------------

    dessinerResultats(
        doc,
        data
    );

    // ------------------------------------------------------------------------
    // Conclusion
    // ------------------------------------------------------------------------

    dessinerConclusion(
        doc,
        data.examen
    );

    // ------------------------------------------------------------------------
    // Finalisation
    // ------------------------------------------------------------------------

    terminerDocument(
        doc,
        data
    );

    // ------------------------------------------------------------------------
    // Buffer PDF
    // ------------------------------------------------------------------------

    return await bufferPromise;

}


// ============================================================================
// VERSION STREAM
// ============================================================================

export function genererResultatBiologiqueStream(
    data: DonneesPdf
): PDFDocumentType {

    const doc = creerDocument(data.options?.orientation || "portrait");

    dessinerEntete(
        doc,
        data
    );

    dessinerResultats(
        doc,
        data
    );

    dessinerConclusion(
        doc,
        data.examen
    );

    terminerDocument(
        doc,
        data
    );

    return doc;

}


// ============================================================================
// EXPORT PAR DEFAUT
// ============================================================================

export default genererResultatBiologique;