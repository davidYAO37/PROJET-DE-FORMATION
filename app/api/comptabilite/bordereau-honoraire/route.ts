import { NextRequest, NextResponse } from 'next/server';
import { getTenantFilter, withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';
import { IConsultation } from '@/models/consultation';
import { IFacturation } from '@/models/Facturation';
import { ILignePrestation } from '@/models/lignePrestation';
import { IMedecin } from '@/models/medecin';
import { IHonoraireMed } from '@/models/HonoraireMed';
import { ILigneHonoraireMed } from '@/models/LigneHonoraireMed';
import mongoose from 'mongoose';

const ROLES = ['admin', 'medecin', 'accueil', 'infirmier', 'comptable', 'facturation'];

const TAUX_TAXE = 7.5;

const arrondi = (n: number) => Math.round(n || 0);

interface ActeBordereau {
  idActe: string;
  date: string;
  type: string;
  acte: string;
  totalActe: number;
  totalMedecin: number;
  taxe: number;
  netAPayer: number;
  patient: string;
}

export async function GET(request: NextRequest) {
  const { context, response: tenantErrorResponse } = await withTenant(request, ROLES);
  if (!context) return tenantErrorResponse;
  const { connection } = context;
  const Consultation = getTenantModel<IConsultation>(connection, 'Consultation');
  const Facturation = getTenantModel<IFacturation>(connection, 'Facturation');
  const LignePrestation = getTenantModel<ILignePrestation>(connection, 'LignePrestation');
  const Medecin = getTenantModel<IMedecin>(connection, 'Medecin');

  try {
    const { searchParams } = new URL(request.url);
    const medecinId = searchParams.get('medecinId') || '';
    const dateDebut = searchParams.get('dateDebut') || '';
    const dateFin = searchParams.get('dateFin') || '';

    if (!medecinId || !dateDebut || !dateFin) {
      return NextResponse.json({ success: false, message: 'Médecin et période requis' }, { status: 400 });
    }

    if (!mongoose.isValidObjectId(medecinId)) {
      return NextResponse.json({ success: false, message: 'Identifiant médecin invalide' }, { status: 400 });
    }

    const medecin = await Medecin.findOne({ _id: medecinId, ...getTenantFilter(context) }).lean();
    if (!medecin) {
      return NextResponse.json({ success: false, message: 'Médecin introuvable' }, { status: 404 });
    }

    const medecinNomComplet = `${medecin.nom || ''} ${medecin.prenoms || ''}`.trim();

    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);
    fin.setHours(23, 59, 59, 999);

    const actes: ActeBordereau[] = [];

    // 1. HONORAIRE CONSULTATION
    const consultations = await Consultation.find({
      IDMEDECIN: new mongoose.Types.ObjectId(medecinId),
      StatutC: true,
      Statumed: { $ne: 1 },
      Date_consulation: { $gte: debut, $lte: fin },
      ...getTenantFilter(context),
    }).lean();

    for (const c of consultations) {
      const totalActe = arrondi((c.Prix_Assurance || 0) + (c.ReliquatPatient || 0));
      const totalMedecin = arrondi(totalActe * ((medecin.TauxHonoraire || 0) / 100));
      const taxe = arrondi((totalMedecin * TAUX_TAXE) / 100);
      const netAPayer = arrondi(totalMedecin - taxe);
      actes.push({
        idActe: String(c._id),
        date: c.Date_consulation ? new Date(c.Date_consulation).toISOString() : '',
        type: 'HONORAIRE CONSULTATION',
        acte: c.designationC || 'CONSULTATION',
        totalActe,
        totalMedecin,
        taxe,
        netAPayer,
        patient: c.PatientP || '-',
      });
    }

    // 2. HONORAIRE PRESCRIPTION, EXECUTANT, AIDE OPERATOIRE, ANESTHESISTE
    const facturations = await Facturation.find({
      DatePres: { $gte: debut, $lte: fin },
      ...getTenantFilter(context),
    }).lean();

    const facturationIds = facturations.map(f => f._id);
    const allLignes = await LignePrestation.find({
      idFacturation: { $in: facturationIds },
      statutPrescriptionMedecin: 3,
      ...getTenantFilter(context),
    }).lean();

    const lignesParFacturation = new Map<string, any[]>();
    for (const l of allLignes) {
      const cle = String(l.idFacturation);
      if (!lignesParFacturation.has(cle)) lignesParFacturation.set(cle, []);
      lignesParFacturation.get(cle)!.push(l);
    }

    for (const f of facturations) {
      const lignes = lignesParFacturation.get(String(f._id)) || [];
      const tauxRemise = (f.tauxreduction ?? f.reduction) || 0;

      // HONORAIRE PRESCRIPTION : une ligne par facturation
      const matchMedecinPrescription = f.IDMEDECIN
        ? String(f.IDMEDECIN) === medecinId
        : !!f.NomMed && f.NomMed.trim().toLowerCase() === medecinNomComplet.toLowerCase();

      if (
        matchMedecinPrescription &&
        (f.Designationtypeacte || '').toUpperCase() !== 'PHARMACIE' &&
        f.Statumed !== '1'
      ) {
        const montantTotal = arrondi(lignes.reduce((s, l) => s + (l.prixTotal || 0) * (1 - tauxRemise / 100), 0));
        if (montantTotal > 0) {
          const totalMedecin = arrondi(montantTotal * ((medecin.TauxPrescription || 0) / 100));
          const taxe = arrondi((totalMedecin * TAUX_TAXE) / 100);
          actes.push({
            idActe: String(f._id),
            date: f.DatePres ? new Date(f.DatePres).toISOString() : '',
            type: 'HONORAIRE PRESCRIPTION',
            acte: f.Designationtypeacte || '-',
            totalActe: montantTotal,
            totalMedecin,
            taxe,
            netAPayer: arrondi(totalMedecin - taxe),
            patient: f.PatientP || '-',
          });
        }
      }

      for (const l of lignes) {
        const montantNetLigne = arrondi((l.prixTotal || 0) * (1 - tauxRemise / 100));

        // HONORAIRE EXECUTANT
        if (
          String(l.numMedecinExecutant) === medecinId &&
          l.statutExecutant !== '1'
        ) {
          const totalMedecin = arrondi(montantNetLigne * ((medecin.TauxExecution || 0) / 100));
          const taxe = arrondi((totalMedecin * TAUX_TAXE) / 100);
          actes.push({
            idActe: String(l._id),
            date: l.dateLignePrestation ? new Date(l.dateLignePrestation).toISOString() : (f.DatePres ? new Date(f.DatePres).toISOString() : ''),
            type: 'HONORAIRE EXECUTANT',
            acte: l.prestation || '-',
            totalActe: montantNetLigne,
            totalMedecin,
            taxe,
            netAPayer: arrondi(totalMedecin - taxe),
            patient: f.PatientP || '-',
          });
        }

        // HONORAIRE AIDE OPERATOIRE
        if (
          String(l.IDmedecinAideOperatoire) === medecinId &&
          (l.AideOperatoirePaye || 0) !== 1
        ) {
          const totalMedecin = arrondi(montantNetLigne * ((medecin.TauxAideOperatoire || 0) / 100));
          const taxe = arrondi((totalMedecin * TAUX_TAXE) / 100);
          actes.push({
            idActe: String(l._id),
            date: l.dateLignePrestation ? new Date(l.dateLignePrestation).toISOString() : (f.DatePres ? new Date(f.DatePres).toISOString() : ''),
            type: 'HONORAIRE AIDE OPERATOIRE',
            acte: l.prestation || '-',
            totalActe: montantNetLigne,
            totalMedecin,
            taxe,
            netAPayer: arrondi(totalMedecin - taxe),
            patient: f.PatientP || '-',
          });
        }

        // HONORAIRE ANESTHESISTE
        if (
          String(l.IDAnesthesiste) === medecinId &&
          (l.AnesthesistePaye || 0) !== 1
        ) {
          const totalMedecin = arrondi(montantNetLigne * ((medecin.TauxAnesthesiste || 0) / 100));
          const taxe = arrondi((totalMedecin * TAUX_TAXE) / 100);
          actes.push({
            idActe: String(l._id),
            date: l.dateLignePrestation ? new Date(l.dateLignePrestation).toISOString() : (f.DatePres ? new Date(f.DatePres).toISOString() : ''),
            type: 'HONORAIRE ANESTHESISTE',
            acte: l.prestation || '-',
            totalActe: montantNetLigne,
            totalMedecin,
            taxe,
            netAPayer: arrondi(totalMedecin - taxe),
            patient: f.PatientP || '-',
          });
        }
      }
    }

    actes.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json({ success: true, data: actes, medecin });
  } catch (error) {
    console.error('Erreur GET bordereau honoraire:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur', error: error instanceof Error ? error.message : 'Erreur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { context, response: tenantErrorResponse } = await withTenant(request, ROLES, { actions: ["export_comptable"] });
  if (!context) return tenantErrorResponse;
  const { connection } = context;
  const Consultation = getTenantModel<IConsultation>(connection, 'Consultation');
  const Facturation = getTenantModel<IFacturation>(connection, 'Facturation');
  const LignePrestation = getTenantModel<ILignePrestation>(connection, 'LignePrestation');
  const Medecin = getTenantModel<IMedecin>(connection, 'Medecin');
  const HonoraireMed = getTenantModel<IHonoraireMed>(connection, 'HonoraireMed');
  const LigneHonoraireMed = getTenantModel<ILigneHonoraireMed>(connection, 'LigneHonoraireMed');

  const body = await request.json();
  const { medecinId, dateDebut, dateFin, actes, payePar } = body;

  if (!medecinId || !dateDebut || !dateFin || !Array.isArray(actes) || actes.length === 0) {
    return NextResponse.json({ success: false, message: 'Données manquantes' }, { status: 400 });
  }

  if (!mongoose.isValidObjectId(medecinId)) {
    return NextResponse.json({ success: false, message: 'Identifiant médecin invalide' }, { status: 400 });
  }

  let totalActe = 0;
  let totalMedecin = 0;
  let totalTaxe = 0;
  let netAPayer = 0;

    const nbConsultation = actes.filter(a => a.type === 'HONORAIRE CONSULTATION' && a.totalMedecin > 0).length;
    const nbPrescription = actes.filter(a => a.type === 'HONORAIRE PRESCRIPTION' && a.totalMedecin > 0).length;
    const nbExecutant = actes.filter(a => a.type === 'HONORAIRE EXECUTANT' && a.totalMedecin > 0).length;
    const nbAideOperatoire = actes.filter(a => a.type === 'HONORAIRE AIDE OPERATOIRE' && a.totalMedecin > 0).length;
    const nbAnesthesiste = actes.filter(a => a.type === 'HONORAIRE ANESTHESISTE' && a.totalMedecin > 0).length;

    const montantTotalHono = arrondi(actes
      .filter(a => a.type === 'HONORAIRE CONSULTATION')
      .reduce((s, a) => s + a.totalActe, 0));
    const partHono = arrondi(actes
      .filter(a => a.type === 'HONORAIRE CONSULTATION')
      .reduce((s, a) => s + a.totalMedecin, 0));

    const montantTotalPrescrip = arrondi(actes
      .filter(a => a.type === 'HONORAIRE PRESCRIPTION')
      .reduce((s, a) => s + a.totalActe, 0));
    const partPres = arrondi(actes
      .filter(a => a.type === 'HONORAIRE PRESCRIPTION')
      .reduce((s, a) => s + a.totalMedecin, 0));

    const montantTotalExecut = arrondi(actes
      .filter(a => a.type === 'HONORAIRE EXECUTANT')
      .reduce((s, a) => s + a.totalActe, 0));
    const partExecut = arrondi(actes
      .filter(a => a.type === 'HONORAIRE EXECUTANT')
      .reduce((s, a) => s + a.totalMedecin, 0));

    const montantTotalAide = arrondi(actes
      .filter(a => a.type === 'HONORAIRE AIDE OPERATOIRE')
      .reduce((s, a) => s + a.totalActe, 0));
    const partAide = arrondi(actes
      .filter(a => a.type === 'HONORAIRE AIDE OPERATOIRE')
      .reduce((s, a) => s + a.totalMedecin, 0));

    const montantTotalAnest = arrondi(actes
      .filter(a => a.type === 'HONORAIRE ANESTHESISTE')
      .reduce((s, a) => s + a.totalActe, 0));
    const partAnest = arrondi(actes
      .filter(a => a.type === 'HONORAIRE ANESTHESISTE')
      .reduce((s, a) => s + a.totalMedecin, 0));

    for (const a of actes) {
      totalActe += a.totalActe;
      totalMedecin += a.totalMedecin;
      totalTaxe += a.taxe;
      netAPayer += a.netAPayer;
    }

    totalActe = arrondi(totalActe);
    totalMedecin = arrondi(totalMedecin);
    totalTaxe = arrondi(totalTaxe);
    netAPayer = arrondi(netAPayer);

    if (totalMedecin === 0 || netAPayer === 0) {
      return NextResponse.json({ success: false, message: 'Le montant à payer du médecin est 0 fr CFA' }, { status: 400 });
    }

    for (const a of actes) {
      if (!a.idActe || !mongoose.isValidObjectId(a.idActe)) {
        return NextResponse.json({ success: false, message: 'Acte invalide dans la sélection' }, { status: 400 });
      }
      if (
        typeof a.totalActe !== 'number' ||
        typeof a.totalMedecin !== 'number' ||
        typeof a.taxe !== 'number' ||
        typeof a.netAPayer !== 'number' ||
        !a.type
      ) {
        return NextResponse.json({ success: false, message: 'Données acte invalides' }, { status: 400 });
      }
    }

    let honoraireResult: any = null;
    const statutsModifies: Array<{ idActe: string; revert: () => Promise<any> }> = [];

    try {
      const medecinDoc = await Medecin.findOne({ _id: medecinId, ...getTenantFilter(context) }).lean();
      if (!medecinDoc) {
        return NextResponse.json({ success: false, message: 'Médecin introuvable' }, { status: 404 });
      }

      honoraireResult = await HonoraireMed.create({
        date: new Date(),
        Heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        Montanttotal: totalActe,
        MontantJour: totalMedecin,
        MontantPayé: 0,
        Restapayer: netAPayer,
        Medecin: new mongoose.Types.ObjectId(medecinId),
        DEBUTD: new Date(dateDebut),
        FIND: new Date(dateFin),
        NBHONRAIRE: nbConsultation,
        montanttotalhono: montantTotalHono,
        parthonoraire: partHono,
        NBPRESCRIPTION: nbPrescription,
        montanttaotalPrescrip: montantTotalPrescrip,
        partpres: partPres,
        NBEXECUTANT: nbExecutant,
        MontanttotalExeut: montantTotalExecut,
        partexcu: partExecut,
        Totalnetapayer: netAPayer,
        Totalretenue: totalTaxe,
        NBAideOperatoire: nbAideOperatoire,
        ParAide: partAide,
        MontantAideTotal: montantTotalAide,
        NBAnestesiste: nbAnesthesiste,
        ParAnesthesiste: partAnest,
        MontantTotalAnestesiste: montantTotalAnest,
        entrepriseId: context.entrepriseId,
      });

      for (const a of actes) {
        await LigneHonoraireMed.create({
          DatePres: a.date ? new Date(a.date) : new Date(),
          IdPres: a.idActe,
          PrestationMed: a.acte,
          Montantpres: arrondi(a.totalMedecin),
          Medecin: new mongoose.Types.ObjectId(medecinId),
          HonoraireMed: honoraireResult._id,
          Totalacte: arrondi(a.totalActe),
          TYPEACTE: a.type,
          TAXE: arrondi(a.taxe),
          Netapayer: arrondi(a.netAPayer),
          Patient: a.patient,
          entrepriseId: context.entrepriseId,
        });

        if (a.type === 'HONORAIRE CONSULTATION') {
          await Consultation.findOneAndUpdate({ _id: a.idActe, ...getTenantFilter(context) }, { Statumed: 1 });
          statutsModifies.push({ idActe: a.idActe, revert: () => Consultation.findOneAndUpdate({ _id: a.idActe, ...getTenantFilter(context) }, { Statumed: 0 }) });
        } else if (a.type === 'HONORAIRE PRESCRIPTION') {
          await Facturation.findOneAndUpdate({ _id: a.idActe, ...getTenantFilter(context) }, { Statumed: '1' });
          statutsModifies.push({ idActe: a.idActe, revert: () => Facturation.findOneAndUpdate({ _id: a.idActe, ...getTenantFilter(context) }, { Statumed: '0' }) });
        } else if (a.type === 'HONORAIRE EXECUTANT') {
          await LignePrestation.findOneAndUpdate({ _id: a.idActe, ...getTenantFilter(context) }, { statutExecutant: '1' });
          statutsModifies.push({ idActe: a.idActe, revert: () => LignePrestation.findOneAndUpdate({ _id: a.idActe, ...getTenantFilter(context) }, { statutExecutant: '0' }) });
        } else if (a.type === 'HONORAIRE AIDE OPERATOIRE') {
          await LignePrestation.findOneAndUpdate({ _id: a.idActe, ...getTenantFilter(context) }, { AideOperatoirePaye: 1 });
          statutsModifies.push({ idActe: a.idActe, revert: () => LignePrestation.findOneAndUpdate({ _id: a.idActe, ...getTenantFilter(context) }, { AideOperatoirePaye: 0 }) });
        } else if (a.type === 'HONORAIRE ANESTHESISTE') {
          await LignePrestation.findOneAndUpdate({ _id: a.idActe, ...getTenantFilter(context) }, { AnesthesistePaye: 1 });
          statutsModifies.push({ idActe: a.idActe, revert: () => LignePrestation.findOneAndUpdate({ _id: a.idActe, ...getTenantFilter(context) }, { AnesthesistePaye: 0 }) });
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Bordereau médecin créé avec succès',
        data: honoraireResult,
      });
    } catch (error) {
      console.error('Erreur POST bordereau honoraire:', error);
      // Rollback manuel : rétablir les statuts modifiés puis supprimer les lignes et le bordereau créés
      for (const s of statutsModifies) {
        try { await s.revert(); } catch {}
      }
      if (honoraireResult?._id) {
        try {
          await LigneHonoraireMed.deleteMany({ HonoraireMed: honoraireResult._id, ...getTenantFilter(context) });
          await HonoraireMed.deleteOne({ _id: honoraireResult._id, ...getTenantFilter(context) });
        } catch {}
      }
      const msg = error instanceof Error ? error.message : 'Erreur';
      const status = msg.includes('introuvable') ? 404 : msg.includes('invalide') ? 400 : 500;
      return NextResponse.json({ success: false, message: msg }, { status });
    }
}
