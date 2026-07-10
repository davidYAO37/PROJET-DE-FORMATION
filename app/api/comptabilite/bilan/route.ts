import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/mongoConnect';
import { EncaissementCaisse } from '@/models/EncaissementCaisse';
import { Facturation } from '@/models/Facturation';
import { Consultation } from '@/models/consultation';

export async function GET(request: NextRequest) {
  try {
    await db();

    const { searchParams } = new URL(request.url);
    const dateDebut = searchParams.get('dateDebut');
    const dateFin = searchParams.get('dateFin');
    const modePaiement = searchParams.get('modePaiement') || '';
    const typePatient = searchParams.get('typePatient') || '';
    const entrepriseId = searchParams.get('entrepriseId') || '';

    if (!dateDebut || !dateFin) {
      return NextResponse.json({ success: false, message: 'dateDebut et dateFin sont requis' }, { status: 400 });
    }

    const debutDate = new Date(dateDebut);
    const finDate = new Date(dateFin);
    finDate.setHours(23, 59, 59, 999);

    const filtreEntreprise = entrepriseId ? { entrepriseId } : {};

    // 1. Consultations payées dans la période
    const consultations = await Consultation.find({
      Date_consulation: { $gte: debutDate, $lte: finDate },
      ...filtreEntreprise,
    }).lean();

    // 2. Facturations de la période
    const facturations = await Facturation.find({
      $or: [
        { DateFacturation: { $gte: debutDate, $lte: finDate } },
        { DateModif: { $gte: debutDate, $lte: finDate } },
      ],
      ...filtreEntreprise,
    }).lean();

    // 3. Encaissements complémentaires
    const encaissements = await EncaissementCaisse.find({
      DateEncaissement: { $gte: debutDate, $lte: finDate },
      ...filtreEntreprise,
    }).lean();

    // Construction des lignes
    let lignes: any[] = [];

    for (const c of consultations) {
      lignes.push({
        date: c.Date_consulation,
        patient: c.PatientP || '',
        assurance: c.assurance || '',
        designation: c.designationC || 'CONSULTATION',
        typeActe: 'Consultation',
        montantTotal: c.PrixClinique || 0,
        taux: c.tauxAssurance || 0,
        partAssurance: c.PartAssurance || 0,
        partPatient: c.montantapayer || 0,
        montantEncaisse: c.Montantencaisse || 0,
        remise: 0,
        resteAPayer: c.Restapayer || 0,
        medecin: c.Medecin || '',
        modePaiement: c.Modepaiement || '',
        typePatient: c.Assure || 'NON ASSURE',
      });
    }

    for (const f of facturations) {
      lignes.push({
        date: f.DateFacturation || f.DateModif,
        patient: f.PatientP || '',
        assurance: f.Assurance || '',
        designation: f.Designationtypeacte || '',
        typeActe: f.Designationtypeacte || 'Prestation',
        montantTotal: f.Montanttotal || 0,
        taux: Number(f.Taux) || 0,
        partAssurance: f.PartAssuranceP || 0,
        partPatient: f.TotalapayerPatient || 0,
        montantEncaisse: f.TotalPaye || 0,
        remise: f.reduction || 0,
        resteAPayer: f.Restapayer || 0,
        medecin: f.NomMed || '',
        modePaiement: f.Modepaiement || '',
        typePatient: f.Assure || 'NON ASSURE',
      });
    }

    for (const e of encaissements) {
      lignes.push({
        date: e.DateEncaissement,
        patient: e.Patient || '',
        assurance: e.Assurance || '',
        designation: e.Designation || '',
        typeActe: 'Encaissement',
        montantTotal: e.Totalacte || 0,
        taux: e.Taux || 0,
        partAssurance: e.PartAssurance || 0,
        partPatient: e.TotalapayerPatient || 0,
        montantEncaisse: e.Montantencaisse || 0,
        remise: e.REMISE || 0,
        resteAPayer: e.Restapayer || 0,
        medecin: e.Medecin || '',
        modePaiement: e.Modepaiement || '',
        typePatient: e.Assure || 'NON ASSURE',
      });
    }

    // Filtres
    if (modePaiement && modePaiement !== 'TOUS') {
      lignes = lignes.filter(l => (l.modePaiement || '').toLowerCase() === modePaiement.toLowerCase());
    }

    if (typePatient && typePatient !== 'TOUS') {
      lignes = lignes.filter(l => {
        const tp = (l.typePatient || '').toUpperCase();
        if (typePatient === 'NON ASSURE') return tp === 'NON' || tp === '' || tp === 'NON ASSURE';
        if (typePatient === 'ASSURE') return tp === 'OUI' || tp === 'ASSURE';
        if (typePatient === 'MUTUALISTE') return tp === 'MUTUALISTE';
        return true;
      });
    }

    // Tri par date
    lignes.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Totaux
    const totaux = {
      montantTotal: lignes.reduce((s, l) => s + (l.montantTotal || 0), 0),
      partAssurance: lignes.reduce((s, l) => s + (l.partAssurance || 0), 0),
      partPatient: lignes.reduce((s, l) => s + (l.partPatient || 0), 0),
      montantEncaisse: lignes.reduce((s, l) => s + (l.montantEncaisse || 0), 0),
      remise: lignes.reduce((s, l) => s + (l.remise || 0), 0),
      resteAPayer: lignes.reduce((s, l) => s + (l.resteAPayer || 0), 0),
    };

    // Récapitulatif par type d'acte
    const parTypeActe: Record<string, { count: number; montant: number; encaisse: number }> = {};
    for (const l of lignes) {
      const type = l.typeActe || 'Autre';
      if (!parTypeActe[type]) parTypeActe[type] = { count: 0, montant: 0, encaisse: 0 };
      parTypeActe[type].count++;
      parTypeActe[type].montant += l.montantTotal || 0;
      parTypeActe[type].encaisse += l.montantEncaisse || 0;
    }

    return NextResponse.json({
      success: true,
      data: lignes,
      totaux,
      parTypeActe,
      count: lignes.length,
    });
  } catch (error) {
    console.error('Erreur bilan financier:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur', error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}
