import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/mongoConnect';
import { Consultation } from '@/models/consultation';
import { Facturation } from '@/models/Facturation';
import { LignePrestation } from '@/models/lignePrestation';
import { Medecin } from '@/models/medecin';
import { HonoraireMed } from '@/models/HonoraireMed';
import { LigneHonoraireMed } from '@/models/LigneHonoraireMed';
import mongoose from 'mongoose';

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
  try {
    await db();

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

    const medecin = await Medecin.findById(medecinId).lean();
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
    }).lean();

    const facturationIds = facturations.map(f => f._id);
    const allLignes = await LignePrestation.find({
      idFacturation: { $in: facturationIds },
      statutPrescriptionMedecin: 3,
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
  try {
    await db();
    const body = await request.json();
    const { medecinId, dateDebut, dateFin, actes, payePar } = body;

    if (!medecinId || !dateDebut || !dateFin || !Array.isArray(actes) || actes.length === 0) {
      return NextResponse.json({ success: false, message: 'Données manquantes' }, { status: 400 });
    }

    if (!mongoose.isValidObjectId(medecinId)) {
      return NextResponse.json({ success: false, message: 'Identifiant médecin invalide' }, { status: 400 });
    }

    const medecin = await Medecin.findById(medecinId).lean();
    if (!medecin) {
      return NextResponse.json({ success: false, message: 'Médecin introuvable' }, { status: 404 });
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

    const montantTotalHono = actes
      .filter(a => a.type === 'HONORAIRE CONSULTATION')
      .reduce((s, a) => s + a.totalActe, 0);
    const partHono = actes
      .filter(a => a.type === 'HONORAIRE CONSULTATION')
      .reduce((s, a) => s + a.totalMedecin, 0);

    const montantTotalPrescrip = actes
      .filter(a => a.type === 'HONORAIRE PRESCRIPTION')
      .reduce((s, a) => s + a.totalActe, 0);
    const partPres = actes
      .filter(a => a.type === 'HONORAIRE PRESCRIPTION')
      .reduce((s, a) => s + a.totalMedecin, 0);

    const montantTotalExecut = actes
      .filter(a => a.type === 'HONORAIRE EXECUTANT')
      .reduce((s, a) => s + a.totalActe, 0);
    const partExecut = actes
      .filter(a => a.type === 'HONORAIRE EXECUTANT')
      .reduce((s, a) => s + a.totalMedecin, 0);

    const montantTotalAide = actes
      .filter(a => a.type === 'HONORAIRE AIDE OPERATOIRE')
      .reduce((s, a) => s + a.totalActe, 0);
    const partAide = actes
      .filter(a => a.type === 'HONORAIRE AIDE OPERATOIRE')
      .reduce((s, a) => s + a.totalMedecin, 0);

    const montantTotalAnest = actes
      .filter(a => a.type === 'HONORAIRE ANESTHESISTE')
      .reduce((s, a) => s + a.totalActe, 0);
    const partAnest = actes
      .filter(a => a.type === 'HONORAIRE ANESTHESISTE')
      .reduce((s, a) => s + a.totalMedecin, 0);

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

    let honoraire: any = null;

    try {
      honoraire = new HonoraireMed({
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
      });

      await honoraire.save();

      for (const a of actes) {
        const ligne = await new LigneHonoraireMed({
          DatePres: a.date ? new Date(a.date) : new Date(),
          IdPres: a.idActe,
          PrestationMed: a.acte,
          Montantpres: a.totalMedecin,
          Medecin: new mongoose.Types.ObjectId(medecinId),
          HonoraireMed: honoraire._id,
          Totalacte: a.totalActe,
          TYPEACTE: a.type,
          TAXE: a.taxe,
          Netapayer: a.netAPayer,
          Patient: a.patient,
        }).save();

        // Mise à jour des statuts selon le type d'acte
        if (a.type === 'HONORAIRE CONSULTATION') {
          await Consultation.findByIdAndUpdate(a.idActe, { Statumed: 1 });
        } else if (a.type === 'HONORAIRE PRESCRIPTION') {
          await Facturation.findByIdAndUpdate(a.idActe, { Statumed: '1' });
        } else if (a.type === 'HONORAIRE EXECUTANT') {
          await LignePrestation.findByIdAndUpdate(a.idActe, { statutExecutant: '1' });
        } else if (a.type === 'HONORAIRE AIDE OPERATOIRE') {
          await LignePrestation.findByIdAndUpdate(a.idActe, { AideOperatoirePaye: 1 });
        } else if (a.type === 'HONORAIRE ANESTHESISTE') {
          await LignePrestation.findByIdAndUpdate(a.idActe, { AnesthesistePaye: 1 });
        }
      }
    } catch (error) {
      // Rollback manuel en cas d'erreur (MongoDB non replica set)
      if (honoraire?._id) {
        await HonoraireMed.findByIdAndDelete(honoraire._id).catch(() => {});
        await LigneHonoraireMed.deleteMany({ HonoraireMed: honoraire._id }).catch(() => {});
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Bordereau médecin créé avec succès',
      data: honoraire,
    });
  } catch (error) {
    console.error('Erreur POST bordereau honoraire:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur', error: error instanceof Error ? error.message : 'Erreur' },
      { status: 500 }
    );
  }
}
