import {
  ARRET_TRAVAIL_LABELS,
  computeDureeJoursCalendar,
  formatDateFr,
  type TypeArretTravail,
} from '@/types/arretTravail';
import { resolveTypePourImpression, type ArretTravailPrintInput } from '@/lib/arretTravail/business';

export function escapeHtmlCert(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Apostrophe typographique pour « à l’… » */
const APOS = '\u2019';

function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** Ignore les articles en tête de raison sociale (« Le Centre… », « La Clinique… »). */
function premierLexemeSignificatif(nomBrut: string): string {
  const tokens = nomBrut.trim().split(/\s+/).filter(Boolean);
  const skip = new Set([
    'le',
    'la',
    'les',
    'l',
    'un',
    'une',
    'des',
    'de',
    'du',
    'd',
    'the',
    'et',
  ]);
  for (const t of tokens) {
    const raw = t.replace(/^[''']+/, '').replace(/[''']+$/, '');
    const low = stripDiacritics(raw).toLowerCase();
    if (!skip.has(low)) return raw;
  }
  return tokens[0] || nomBrut.trim();
}

/**
 * Préposition + article adaptés au nom d’établissement (ex. à la Clinique…, au Centre…, à l’Hôpital…).
 */
export function prefixeAuPourEtablissement(nomBrut: string): string {
  const n = nomBrut.trim();
  if (!n) return `à l${APOS}`;

  const firstToken = premierLexemeSignificatif(n);
  const w = stripDiacritics(firstToken).toLowerCase();
  const firstChar = stripDiacritics(firstToken.charAt(0) || '').toLowerCase();

  if ('aeiouy'.includes(firstChar)) {
    return `à l${APOS}`;
  }

  if (w.startsWith('hopital') || w.startsWith('hopit')) {
    return `à l${APOS}`;
  }

  const feminines = [
    'clinique',
    'polyclinique',
    'maison',
    'maternite',
    'infirmerie',
    'galerie',
    'fondation',
    'unite',
    'unité',
    'residence',
    'pratique',
    'structure',
    'collectivite',
    'collectivité',
    'association',
  ];
  for (const f of feminines) {
    if (w === f || w.startsWith(f)) return 'à la ';
  }

  if (w.startsWith('institut') || w.startsWith('universit') || w.startsWith('ecole')) {
    return `à l${APOS}`;
  }

  const masculins = [
    'centre',
    'cabinet',
    'groupe',
    'campus',
    'site',
    'pole',
    'pôle',
    'service',
    'bureau',
    'poste',
    'plateau',
    'complexe',
    'parc',
    'domaine',
    'pavillon',
    'batiment',
    'bâtiment',
    'etablissement',
    'établissement',
  ];
  for (const m of masculins) {
    if (w === m || w.startsWith(m)) return 'au ';
  }

  if (/^chu\b/i.test(w) || /^chr\b/i.test(w)) return 'au ';

  if (w === 'hopitaux' || w === 'cliniques' || w === 'centres') return 'aux ';

  if ('bcdfgjklmnpqrstvwxyz'.includes(firstChar)) return 'au ';

  return `à l${APOS}`;
}

export interface CertificatArretHtmlOptions {
  cliniqueNom: string;
  medecinDefaut: string;
  villeSignature?: string;
}

export interface CertificatArretContext {
  type: TypeArretTravail;
  medecin: string;
  clinique: string;
  patientNomComplet: string;
  civilitePatient: 'M.' | 'Mme' | 'M./Mme';
  dateDebutFr: string;
  dateFinFr: string;
  dureeJours: number;
  dateDocumentFr: string;
  ville: string;
  numeroDocument: string;
  typeLibelle: string;
  motif: string;
  observations: string;
  dateEntreeHospitalisationFr: string;
  dateSortieHospitalisationFr: string;
  dateAccidentFr: string;
  termeGrossesse: string;
  interventionChirurgicale: string;
  suiviPsychologique: string;
  precisionsIsolement: string;
  /** Préposition + article + espace : « à la », « au », « à l’ », « aux » */
  liaisonEtablissement: string;
}

function buildCertificatContext(
  arret: ArretTravailPrintInput,
  options: CertificatArretHtmlOptions
): CertificatArretContext {
  const type = resolveTypePourImpression(arret.typeArret);
  const medecin = arret.medecinTraitant || options.medecinDefaut || '—';
  const cliniqueBrut = (options.cliniqueNom || '').trim() || 'Établissement de santé';
  const liaisonEtablissement = prefixeAuPourEtablissement(cliniqueBrut);
  const clinique = cliniqueBrut;
  const patientNomComplet =
    `${arret.patientNom || ''} ${arret.patientPrenoms || ''}`.trim() || '_______________';
  const civilitePatient: CertificatArretContext['civilitePatient'] =
    type === 'maternite' || type === 'grossesse_pathologique' ? 'Mme' : 'M./Mme';
  const dateDebutFr = formatDateFr(arret.dateDebut);
  const dateFinFr = formatDateFr(arret.dateFin);
  const duree =
    arret.dateDebut && arret.dateFin
      ? computeDureeJoursCalendar(new Date(arret.dateDebut), new Date(arret.dateFin))
      : 0;
  const dateDocumentFr = formatDateFr(arret.dateCreation);
  const ville = options.villeSignature || 'Abidjan';

  const dateEntreeHospitalisationFr = escapeHtmlCert(formatDateFr(arret.dateEntreeHospitalisation));
  const dateSortieHospitalisationFr = escapeHtmlCert(formatDateFr(arret.dateSortieHospitalisation));
  const dateAccidentFr = escapeHtmlCert(formatDateFr(arret.dateAccident));
  const termeGrossesse = escapeHtmlCert((arret.termeGrossesse || '').trim());
  const interventionChirurgicale = escapeHtmlCert((arret.interventionChirurgicale || '').trim());
  const suiviPsychologique = escapeHtmlCert((arret.suiviPsychologique || '').trim());
  const precisionsIsolement = escapeHtmlCert((arret.precisionsIsolement || '').trim());

  return {
    type,
    medecin: escapeHtmlCert(medecin),
    clinique: escapeHtmlCert(clinique),
    liaisonEtablissement,
    patientNomComplet: escapeHtmlCert(patientNomComplet),
    civilitePatient,
    dateDebutFr: escapeHtmlCert(dateDebutFr),
    dateFinFr: escapeHtmlCert(dateFinFr),
    dureeJours: duree,
    dateDocumentFr: escapeHtmlCert(dateDocumentFr),
    ville: escapeHtmlCert(ville),
    numeroDocument: escapeHtmlCert(arret.numeroDocument || '—'),
    typeLibelle: escapeHtmlCert(ARRET_TRAVAIL_LABELS[type]),
    motif: escapeHtmlCert(arret.motif || ''),
    observations: escapeHtmlCert(arret.observations || ''),
    dateEntreeHospitalisationFr,
    dateSortieHospitalisationFr,
    dateAccidentFr,
    termeGrossesse,
    interventionChirurgicale,
    suiviPsychologique,
    precisionsIsolement,
  };
}

function blocMeta(ctx: CertificatArretContext): string {
  return `
    <div style="margin-bottom:14px;padding:10px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;font-size:12px;color:#475569;">
      <span style="font-weight:600;">N° document :</span> ${ctx.numeroDocument}
      &nbsp;·&nbsp;
      <span style="font-weight:600;">Type :</span> ${ctx.typeLibelle}
    </div>`;
}

function blocMotifObs(ctx: CertificatArretContext): string {
  if (!ctx.motif && !ctx.observations) return '';
  return `
    <div style="margin-top:18px;padding:12px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;line-height:1.5;">
      ${ctx.motif ? `<div style="margin-bottom:8px;"><strong>Motif / précisions :</strong><br/><span style="white-space:pre-wrap;">${ctx.motif}</span></div>` : ''}
      ${ctx.observations ? `<div><strong>Observations :</strong><br/><span style="white-space:pre-wrap;">${ctx.observations}</span></div>` : ''}
    </div>`;
}

function blocCertificatMedical(arret: ArretTravailPrintInput): string {
  const showCertBloc =
    arret.certificatMedical &&
    (arret.numeroCertificat || arret.dateCertificat || arret.medecinCertificat);
  if (!showCertBloc) return '';
  return `
      <div style="margin-top:18px;background:#eff6ff;padding:14px;border-radius:8px;border:1px solid #bfdbfe;">
        <div style="font-weight:700;margin-bottom:8px;color:#1e3a8a;">Références certificat</div>
        <div style="display:flex;flex-wrap:wrap;gap:10px;font-size:13px;">
          ${arret.numeroCertificat ? `<div><span style="font-weight:600;">N° :</span> ${escapeHtmlCert(arret.numeroCertificat)}</div>` : ''}
          ${arret.dateCertificat ? `<div><span style="font-weight:600;">Date :</span> ${escapeHtmlCert(formatDateFr(arret.dateCertificat))}</div>` : ''}
          ${arret.medecinCertificat ? `<div><span style="font-weight:600;">Médecin :</span> ${escapeHtmlCert(arret.medecinCertificat)}</div>` : ''}
        </div>
      </div>`;
}

function blocSignature(ctx: CertificatArretContext): string {
  return `
    <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:32px;flex-wrap:wrap;gap:16px;font-size:14px;">
      <div style="color:#64748b;">Fait à ${ctx.ville}, le ${ctx.dateDocumentFr}</div>
      <div style="text-align:center;font-weight:600;padding-top:28px;border-top:1px solid #cbd5e1;min-width:220px;">Signature et cachet du médecin</div>
    </div>`;
}

function corpsParType(ctx: CertificatArretContext): string {
  const dr = ctx.medecin;
  const nom = ctx.patientNomComplet;
  const civ = ctx.civilitePatient;
  const X = String(ctx.dureeJours);
  const dd = ctx.dateDebutFr;
  const df = ctx.dateFinFr;

  const ligneMedecinEtablissement = `<p style="margin:0 0 14px;">Je soussigné <strong>Dr ${dr}</strong>, médecin ${ctx.liaisonEtablissement}<strong>${ctx.clinique}</strong></p>`;

  switch (ctx.type) {
    case 'maladie': {
      if (ctx.dateAccidentFr) {
        return `
        ${ligneMedecinEtablissement}
        <p style="margin:0 0 14px;">certifie avoir examiné ce jour : <strong>${civ}</strong> : <strong>${nom}</strong></p>
        <p style="margin:0 0 14px;">Victime d’un accident survenu le <strong>${ctx.dateAccidentFr}</strong>.</p>
        <p style="margin:0 0 14px;">Son état nécessite un arrêt de travail de <strong>${X}</strong> jours, à compter du <strong>${dd}</strong> jusqu’au <strong>${df}</strong>.</p>`;
      }
      return `
        ${ligneMedecinEtablissement}
        <p style="margin:0 0 14px;">certifie avoir examiné ce jour : <strong>${civ}</strong> : <strong>${nom}</strong></p>
        <p style="margin:0 0 14px;">Présentant un état de santé nécessitant un arrêt de travail.</p>
        <p style="margin:0 0 14px;">En conséquence, l’intéressé(e) devra observer un repos de <strong>${X}</strong> jours allant du <strong>${dd}</strong> au <strong>${df}</strong> inclus.</p>`;
    }

    case 'prolongation':
      return `
        ${ligneMedecinEtablissement}
        <p style="margin:0 0 14px;">certifie avoir réexaminé : <strong>${civ}</strong> : <strong>${nom}</strong></p>
        <p style="margin:0 0 14px;">L’état de santé du patient nécessite une prolongation de l’arrêt de travail pour une durée de <strong>${X}</strong> jours.</p>
        <p style="margin:0 0 14px;"><strong>Nouvelle période :</strong> du <strong>${dd}</strong> au <strong>${df}</strong> inclus.</p>`;

    case 'accident_travail': {
      const dateFaits = ctx.dateAccidentFr
        ? `<p style="margin:0 0 14px;">Date des faits / constat : <strong>${ctx.dateAccidentFr}</strong>.</p>`
        : '';
      return `
        ${ligneMedecinEtablissement}
        <p style="margin:0 0 14px;">certifie que : <strong>${civ}</strong> <strong>${nom}</strong></p>
        <p style="margin:0 0 14px;">présente des lésions compatibles avec un accident de travail.</p>
        ${dateFaits}
        <p style="margin:0 0 14px;">Un arrêt de travail de <strong>${X}</strong> jours est prescrit du <strong>${dd}</strong> au <strong>${df}</strong>.</p>`;
    }

    case 'maladie_professionnelle': {
      const dateCtx = ctx.dateAccidentFr
        ? `<p style="margin:0 0 14px;">Date de constat / exposition pertinente : <strong>${ctx.dateAccidentFr}</strong>.</p>`
        : '';
      return `
        ${ligneMedecinEtablissement}
        <p style="margin:0 0 14px;">certifie avoir examiné : <strong>${civ}</strong> <strong>${nom}</strong></p>
        ${dateCtx}
        <p style="margin:0 0 14px;">dont l’état est compatible avec une pathologie d’origine professionnelle, nécessitant une interruption temporaire d’activité.</p>
        <p style="margin:0 0 14px;">Arrêt prescrit de <strong>${X}</strong> jours, du <strong>${dd}</strong> au <strong>${df}</strong> inclus.</p>`;
    }

    case 'maternite': {
      const terme = ctx.termeGrossesse
        ? `<p style="margin:0 0 14px;">Terme prévu / suivi : <strong>${ctx.termeGrossesse}</strong>.</p>`
        : '';
      return `
        ${ligneMedecinEtablissement}
        <p style="margin:0 0 14px;">certifie que : <strong>${civ}</strong> <strong>${nom}</strong></p>
        ${terme}
        <p style="margin:0 0 14px;">nécessite un repos médical dans le cadre de son congé maternité.</p>
        <p style="margin:0 0 14px;">Un arrêt de travail est prescrit du <strong>${dd}</strong> au <strong>${df}</strong>.</p>`;
    }

    case 'paternite': {
      const terme = ctx.termeGrossesse
        ? `<p style="margin:0 0 14px;">Prévu accueil / terme (précisions) : <strong>${ctx.termeGrossesse}</strong>.</p>`
        : '';
      return `
        ${ligneMedecinEtablissement}
        <p style="margin:0 0 14px;">certifie que : <strong>${civ}</strong> <strong>${nom}</strong></p>
        ${terme}
        <p style="margin:0 0 14px;">nécessite un congé paternité / d’accueil du enfant pour motif médical documenté.</p>
        <p style="margin:0 0 14px;">Congé prescrit du <strong>${dd}</strong> au <strong>${df}</strong> inclus (<strong>${X}</strong> jours).</p>`;
    }

    case 'grossesse_pathologique': {
      const terme = ctx.termeGrossesse
        ? `<p style="margin:0 0 14px;">Terme prévu / suivi obstétrical : <strong>${ctx.termeGrossesse}</strong>.</p>`
        : '';
      return `
        ${ligneMedecinEtablissement}
        <p style="margin:0 0 14px;">certifie que : <strong>${civ}</strong> <strong>${nom}</strong></p>
        ${terme}
        <p style="margin:0 0 14px;">nécessite un repos médical dans le cadre d’une grossesse pathologique.</p>
        <p style="margin:0 0 14px;">Un arrêt de travail est prescrit du <strong>${dd}</strong> au <strong>${df}</strong>.</p>`;
    }

    case 'conge_enfant_malade':
      return `
        ${ligneMedecinEtablissement}
        <p style="margin:0 0 14px;">certifie que : <strong>${civ}</strong> <strong>${nom}</strong></p>
        <p style="margin:0 0 14px;">doit assurer la présence parentale auprès d’un enfant malade, sur la base de l’examen et des éléments cliniques disponibles.</p>
        <p style="margin:0 0 14px;">Absence justifiée du <strong>${dd}</strong> au <strong>${df}</strong> (<strong>${X}</strong> jours).</p>`;

    case 'conge_proche_aidant':
      return `
        ${ligneMedecinEtablissement}
        <p style="margin:0 0 14px;">certifie que : <strong>${civ}</strong> <strong>${nom}</strong></p>
        <p style="margin:0 0 14px;">assume la fonction de proche aidant et doit être disponible pour la prise en charge d’une personne en perte d’autonomie.</p>
        <p style="margin:0 0 14px;">Congé prescrit du <strong>${dd}</strong> au <strong>${df}</strong> (<strong>${X}</strong> jours).</p>`;

    case 'arret_derogatoire': {
      const suivi = ctx.suiviPsychologique
        ? `<p style="margin:0 0 14px;"><strong>Suivi psychologique / psychiatrique :</strong> <span style="white-space:pre-wrap;">${ctx.suiviPsychologique}</span></p>`
        : '';
      return `
        ${ligneMedecinEtablissement}
        <p style="margin:0 0 14px;">certifie que l’état de santé de : <strong>${civ}</strong> <strong>${nom}</strong></p>
        <p style="margin:0 0 14px;">nécessite un arrêt temporaire des activités professionnelles dans un cadre dérogatoire, pour raison médicale.</p>
        ${suivi}
        <p style="margin:0 0 14px;"><strong>Durée de l’arrêt :</strong> du <strong>${dd}</strong> au <strong>${df}</strong>.</p>`;
    }

    case 'hospitalisation': {
      const de = ctx.dateEntreeHospitalisationFr || '_______________';
      const ds = ctx.dateSortieHospitalisationFr || '_______________';
      return `
        ${ligneMedecinEtablissement}
        <p style="margin:0 0 14px;">certifie que : <strong>${civ}</strong> <strong>${nom}</strong></p>
        <p style="margin:0 0 14px;">a été hospitalisé(e) du <strong>${de}</strong> au <strong>${ds}</strong>.</p>
        <p style="margin:0 0 14px;">Un arrêt de travail de <strong>${X}</strong> jours est prescrit (du <strong>${dd}</strong> au <strong>${df}</strong>).</p>`;
    }

    case 'repos_post_operatoire': {
      const inter = ctx.interventionChirurgicale
        ? ` (<strong>${ctx.interventionChirurgicale}</strong>)`
        : '';
      return `
        ${ligneMedecinEtablissement}
        <p style="margin:0 0 14px;">certifie que : <strong>${civ}</strong> <strong>${nom}</strong></p>
        <p style="margin:0 0 14px;">a bénéficié d’une intervention chirurgicale${inter} nécessitant un repos médical de <strong>${X}</strong> jours.</p>
        <p style="margin:0 0 14px;">Arrêt valable du <strong>${dd}</strong> au <strong>${df}</strong>.</p>`;
    }

    case 'isolement_medical': {
      const iso = ctx.precisionsIsolement
        ? `<p style="margin:0 0 14px;"><strong>Mesure / précisions d’isolement :</strong> <span style="white-space:pre-wrap;">${ctx.precisionsIsolement}</span></p>`
        : '';
      return `
        ${ligneMedecinEtablissement}
        <p style="margin:0 0 14px;">certifie que : <strong>${civ}</strong> <strong>${nom}</strong></p>
        <p style="margin:0 0 14px;">présente une affection nécessitant un isolement médical et un arrêt temporaire de travail.</p>
        ${iso}
        <p style="margin:0 0 14px;">Arrêt prescrit du <strong>${dd}</strong> au <strong>${df}</strong>.</p>`;
    }

    case 'autre': {
      if (ctx.dateAccidentFr) {
        return `
        ${ligneMedecinEtablissement}
        <p style="margin:0 0 14px;">certifie avoir examiné : <strong>${civ}</strong> <strong>${nom}</strong></p>
        <p style="margin:0 0 14px;">Victime d’un accident survenu le <strong>${ctx.dateAccidentFr}</strong>.</p>
        <p style="margin:0 0 14px;">Son état nécessite un arrêt de travail de <strong>${X}</strong> jours, à compter du <strong>${dd}</strong> jusqu’au <strong>${df}</strong>.</p>`;
      }
      return `
        ${ligneMedecinEtablissement}
        <p style="margin:0 0 14px;">certifie avoir examiné : <strong>${civ}</strong> <strong>${nom}</strong></p>
        <p style="margin:0 0 14px;">dont l’état de santé nécessite un repos médical de <strong>${X}</strong> jours.</p>
        <p style="margin:0 0 14px;">Repos valable du <strong>${dd}</strong> au <strong>${df}</strong>.</p>`;
    }
  }
}

function titreParType(type: TypeArretTravail): string {
  const titres: Record<TypeArretTravail, string> = {
    maladie: 'CERTIFICAT D’ARRÊT DE TRAVAIL',
    prolongation: 'CERTIFICAT DE PROLONGATION D’ARRÊT DE TRAVAIL',
    accident_travail: 'CERTIFICAT D’ACCIDENT DE TRAVAIL',
    maladie_professionnelle: 'CERTIFICAT MÉDICAL — MALADIE PROFESSIONNELLE',
    maternite: 'CERTIFICAT MÉDICAL DE REPOS MATERNITÉ',
    paternite: 'CERTIFICAT MÉDICAL — CONGÉ PATERNITÉ / ACCUEIL DU ENFANT',
    grossesse_pathologique: 'CERTIFICAT MÉDICAL — GROSSESSE PATHOLOGIQUE',
    conge_enfant_malade: 'CERTIFICAT MÉDICAL — CONGÉ ENFANT MALADE',
    conge_proche_aidant: 'CERTIFICAT MÉDICAL — CONGÉ PROCHE AIDANT',
    arret_derogatoire: 'CERTIFICAT MÉDICAL',
    hospitalisation: 'CERTIFICAT D’HOSPITALISATION AVEC ARRÊT DE TRAVAIL',
    repos_post_operatoire: 'CERTIFICAT MÉDICAL POST-OPÉRATOIRE',
    isolement_medical: 'CERTIFICAT MÉDICAL D’ISOLEMENT',
    autre: 'CERTIFICAT DE REPOS MÉDICAL',
  };
  return titres[type] ?? titres.maladie;
}

/**
 * Corps HTML du certificat « état imprimable » (texte officiel selon le type d’arrêt).
 */
export function buildArretTravailCertificatHtml(
  arret: ArretTravailPrintInput,
  options: CertificatArretHtmlOptions
): string {
  const ctx = buildCertificatContext(arret, options);
  const type = ctx.type;
  const titre = escapeHtmlCert(titreParType(type));
  const corps = corpsParType(ctx);

  return `
    <div class="print-area certificat-arret" style="font-family:Georgia,'Times New Roman',serif;color:#0f172a;padding:24px;max-width:820px;margin:0 auto;line-height:1.6;">
      ${blocMeta(ctx)}
      <div style="text-align:center;margin-bottom:24px;padding-bottom:14px;border-bottom:2px solid #0f172a;">
        <div style="font-size:20px;font-weight:700;letter-spacing:0.4px;">${titre}</div>
      </div>
      ${corps}
      ${blocMotifObs(ctx)}
      ${blocCertificatMedical(arret)}
      ${blocSignature(ctx)}
    </div>
  `;
}
