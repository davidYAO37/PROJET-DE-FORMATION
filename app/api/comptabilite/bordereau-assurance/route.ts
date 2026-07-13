import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/mongoConnect';
import { Facturation } from '@/models/Facturation';
import { Consultation } from '@/models/consultation';
import { Prescription } from '@/models/Prescription';
import { Assurance } from '@/models/assurance';
import { FacturationAssur } from '@/models/factureAssur';
import { LigneFacture } from '@/models/ligneFacture';
import { FactureRecap } from '@/models/factureRecap';
import { TypeActe } from '@/models/TypeActe';
import { ExamenHospitalisation } from '@/models/examenHospit';
import mongoose from 'mongoose';

const arrondi = (n: number) => Math.round(n || 0);

interface LigneBordereau {
  id: string;
  idConsultation?: string;
  idPrescription?: string;
  idHospitalisation?: string;
  idFacturation?: string;
  date: string;
  numBon: string;
  matricule: string;
  taux: string;
  patient: string;
  prestation: string;
  montantTotal: number;
  partAssurance: number;
  partAssure: number;
  societePatient: string;
  typeActe: string;
  aHospitalisation: number;
}

export async function GET(request: NextRequest) {
  try {
    await db();
    const { searchParams } = new URL(request.url);
    const assuranceId = searchParams.get('assuranceId') || '';
    const dateDebut = searchParams.get('dateDebut') || '';
    const dateFin = searchParams.get('dateFin') || '';

    if (!assuranceId || !dateDebut || !dateFin) {
      return NextResponse.json({ success: false, message: 'Assurance et période requis' }, { status: 400 });
    }

    if (!mongoose.isValidObjectId(assuranceId)) {
      return NextResponse.json({ success: false, message: 'Identifiant assurance invalide' }, { status: 400 });
    }

    const assurance = await Assurance.findById(assuranceId).lean();
    if (!assurance) {
      return NextResponse.json({ success: false, message: 'Assurance introuvable' }, { status: 404 });
    }

    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);
    fin.setHours(23, 59, 59, 999);

    const lignes: LigneBordereau[] = [];

    // 1. FACTURATION : hospitalisation, autres prestations et pharmacie (via IDPRESCRIPTION)
    const facturations = await Facturation.find({
      IDASSURANCE: new mongoose.Types.ObjectId(assuranceId),
      $or: [
        { DateModif: { $gte: debut, $lte: fin } },
        { DateFacturation: { $gte: debut, $lte: fin } },
      ],
    }).lean();

    for (const f of facturations) {
      if (f.StatutFacture) continue;

      const idPrescription = f.IDPRESCRIPTION ? String(f.IDPRESCRIPTION) : '';
      const isPharmacie = idPrescription && idPrescription !== '0';

      const typeActe = await TypeActe.findOne({ Designation: f.Designationtypeacte || '' }).lean();
      const aHospitalisation = typeActe?.Hospitalisation ? 1 : 0;

      lignes.push({
        id: String(f._id),
        idFacturation: String(f._id),
        idPrescription: isPharmacie ? idPrescription : undefined,
        idHospitalisation: !isPharmacie && f.idHospitalisation ? String(f.idHospitalisation) : undefined,
        date: f.DateFacturation ? new Date(f.DateFacturation).toISOString() : (f.DateModif ? new Date(f.DateModif).toISOString() : ''),
        numBon: f.NumBon || '',
        matricule: f.Numcarte || '',
        taux: f.Taux || '',
        patient: f.PatientP || '',
        prestation: isPharmacie ? 'PHARMACIE' : (f.Designationtypeacte || 'PRESTATION'),
        montantTotal: f.Montanttotal || 0,
        partAssurance: f.PartAssuranceP || 0,
        partAssure: f.TotalapayerPatient || 0,
        societePatient: f.SOCIETE_PATIENT || '',
        typeActe: isPharmacie ? 'PHARMACIE' : (f.Designationtypeacte || 'PRESTATION'),
        aHospitalisation,
      });
    }

    // 2. CONSULTATION
    const consultations = await Consultation.find({
      IDASSURANCE: new mongoose.Types.ObjectId(assuranceId),
      DateFacturation: { $gte: debut, $lte: fin },
      statutPrescriptionMedecin: 3,
    }).lean();

    for (const c of consultations) {
      if (c.StatutFacture) continue;
      lignes.push({
        id: String(c._id),
        idConsultation: String(c._id),
        date: c.DateFacturation ? new Date(c.DateFacturation).toISOString() : '',
        numBon: c.NumBon || '',
        matricule: c.numero_carte || '',
        taux: String(c.tauxAssurance || ''),
        patient: c.PatientP || '',
        prestation: c.designationC || 'CONSULTATION',
        montantTotal: c.PrixClinique || 0,
        partAssurance: c.PartAssurance || 0,
        partAssure: c.montantapayer || 0,
        societePatient: c.SOCIETE_PATIENT || '',
        typeActe: 'CONSULTATION',
        aHospitalisation: 0,
      });
    }

    lignes.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json({
      success: true,
      data: lignes,
      assurance,
    });
  } catch (error) {
    console.error('Erreur GET bordereau assurance:', error);
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
    const { assuranceId, dateDebut, dateFin, lignes, saisirpar, entrepriseId } = body;

    if (!assuranceId || !dateDebut || !dateFin || !Array.isArray(lignes) || lignes.length === 0) {
      return NextResponse.json({ success: false, message: 'Données manquantes' }, { status: 400 });
    }

    if (!mongoose.isValidObjectId(assuranceId)) {
      return NextResponse.json({ success: false, message: 'Identifiant assurance invalide' }, { status: 400 });
    }

    const assurance = await Assurance.findById(assuranceId).lean();
    if (!assurance) {
      return NextResponse.json({ success: false, message: 'Assurance introuvable' }, { status: 404 });
    }

    const total = lignes.reduce((s, l) => ({
      montantTotal: s.montantTotal + (l.montantTotal || 0),
      partAssurance: s.partAssurance + (l.partAssurance || 0),
      partAssure: s.partAssure + (l.partAssure || 0),
    }), { montantTotal: 0, partAssurance: 0, partAssure: 0 });

    // Créer la facture récapitulative
    const debutF = new Date(dateDebut);
    const finF = new Date(dateFin);
    const dateSys = new Date();
    const reference = `${Date.now()}${finF.getMonth() + 1}${finF.getMonth() + 1}${finF.getFullYear()}`;

    const factureAssur = new FacturationAssur({
      Reference: reference,
      Date: dateSys,
      MontantTotalFacture: arrondi(total.montantTotal),
      Partassure: arrondi(total.partAssure),
      PartAssurance: arrondi(total.partAssurance),
      DebutF: debutF,
      FinF: finF,
      Saisirpar: saisirpar || '',
      Assurance: assurance.designationassurance,
      etat_facture: false,
      TotalPaye: 0,
      Restapayer: arrondi(total.partAssurance),
      entrepriseId: entrepriseId || '',
    });

    await factureAssur.save();

    // Créer les lignes de facture
    for (const l of lignes) {
      await new LigneFacture({
        DateFacture: l.date ? new Date(l.date) : dateSys,
        TotalHT: l.montantTotal || 0,
        FactureAssur: factureAssur._id,
        ACTEF: l.prestation,
        NumBon: l.numBon,
        Matricule: l.matricule,
        Partassure: l.partAssure || 0,
        PartAssurance: l.partAssurance || 0,
        Totalacte: l.montantTotal || 0,
        TYPEACTE: l.typeActe,
        SaisiLe: dateSys,
        SaisiPar: saisirpar || '',
        Beneficiaire: l.patient,
        SOCIETE_PATIENT: l.societePatient || '',
        IDCONSULTATION: l.idConsultation ? new mongoose.Types.ObjectId(l.idConsultation) : undefined,
        IDPRESCRIPTION: l.idPrescription ? new mongoose.Types.ObjectId(l.idPrescription) : undefined,
        idHospitalisation: l.idHospitalisation ? new mongoose.Types.ObjectId(l.idHospitalisation) : undefined,
        IDFACTURATION: l.idFacturation ? new mongoose.Types.ObjectId(l.idFacturation) : undefined,
      }).save();
    }

    // Mise à jour des statuts
    const consultationsIds = lignes.filter(l => l.idConsultation).map(l => l.idConsultation!);
    const prescriptionsIds = lignes.filter(l => l.idPrescription).map(l => l.idPrescription!);
    const facturationsIds = lignes.filter(l => l.idFacturation).map(l => l.idFacturation!);

    if (consultationsIds.length > 0) {
      await Consultation.updateMany(
        { _id: { $in: consultationsIds } },
        { $set: { StatutFacture: true, Numfacture: reference } }
      );
    }

    if (prescriptionsIds.length > 0) {
      await Prescription.updateMany(
        { _id: { $in: prescriptionsIds } },
        { $set: { StatutFacture: true, Numfacture: reference } }
      );
    }

    if (facturationsIds.length > 0) {
      await Facturation.updateMany(
        { _id: { $in: facturationsIds } },
        { $set: { StatutFacture: true, Numfacture: reference } }
      );
    }

    const hospitalisationsIds = lignes.filter(l => l.idHospitalisation).map(l => l.idHospitalisation!);
    if (hospitalisationsIds.length > 0) {
      await ExamenHospitalisation.updateMany(
        { _id: { $in: hospitalisationsIds } },
        { $set: { StatutFacture: true, Numfacture: reference } }
      );
    }

    // Facture récap par type d'acte
    const typesActes = new Map<string, { montant: number; partAssurance: number; partAssure: number }>();
    for (const l of lignes) {
      const key = l.typeActe || 'AUTRE';
      const existing = typesActes.get(key) || { montant: 0, partAssurance: 0, partAssure: 0 };
      existing.montant += l.montantTotal || 0;
      existing.partAssurance += l.partAssurance || 0;
      existing.partAssure += l.partAssure || 0;
      typesActes.set(key, existing);
    }

    for (const [acte, montants] of typesActes.entries()) {
      await new FactureRecap({
        Numfacture: reference,
        ACTE: acte,
        montantacte: arrondi(montants.montant),
        Partassure: arrondi(montants.partAssure),
        PartAssurance: arrondi(montants.partAssurance),
        DebutF: debutF,
        FinF: finF,
        DateSaisie: dateSys,
        FactureAssur: factureAssur._id,
        Assurance: assurance.designationassurance,
        CreePar: saisirpar || '',
        NCC: (assurance as any).NCC || '',
      }).save();
    }

    return NextResponse.json({
      success: true,
      message: 'Bordereau assurance créé avec succès',
      data: factureAssur,
    });
  } catch (error) {
    console.error('Erreur POST bordereau assurance:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur', error: error instanceof Error ? error.message : 'Erreur' },
      { status: 500 }
    );
  }
}
