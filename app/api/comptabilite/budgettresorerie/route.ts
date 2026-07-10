import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/mongoConnect';
import { Consultation } from '@/models/consultation';
import { Facturation } from '@/models/Facturation';
import { EncaissementCaisse } from '@/models/EncaissementCaisse';
import { caisse } from '@/models/caisse';

const MOIS_LABELS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const MODES_EXCLUS = ['chèque', 'carte de crédit'];

function ventilerParMois(montant: number, moisIndex: number): number[] {
  const arr = new Array(12).fill(0);
  arr[moisIndex] = montant;
  return arr;
}

function addMois(a: number[], b: number[]): number[] {
  return a.map((v, i) => v + b[i]);
}

export async function GET(request: NextRequest) {
  try {
    await db();
    const { searchParams } = new URL(request.url);
    const annee = parseInt(searchParams.get('annee') || String(new Date().getFullYear()));
    const optionPart = parseInt(searchParams.get('optionPart') || '1'); // 1=TOUS, 2=ASSURANCE, 3=PART PATIENT, 4=ENCAISSEMENT
    const avecReport = searchParams.get('avecReport') === 'true';
    const assurance = searchParams.get('assurance') || '';
    const modePaiement = searchParams.get('modePaiement') || '';

    const debut = new Date(annee, 0, 1);
    const fin = new Date(annee, 11, 31, 23, 59, 59, 999);

    // Map : libelle -> montants[12 mois]
    const encaissMap: Record<string, number[]> = {};
    const decaissMap: Record<string, number[]> = {};
    let totalEncaiss = new Array(12).fill(0);
    let totalDecaiss = new Array(12).fill(0);

    const addLigne = (libelle: string, moisIdx: number, montant: number) => {
      if (!encaissMap[libelle]) encaissMap[libelle] = new Array(12).fill(0);
      encaissMap[libelle][moisIdx] += montant;
    };

    const addDecaiss = (libelle: string, moisIdx: number, montant: number) => {
      if (!decaissMap[libelle]) decaissMap[libelle] = new Array(12).fill(0);
      decaissMap[libelle][moisIdx] += montant;
    };

    // ── CAS 1 : TOUS (Consultation PrixClinique + Facturation Montanttotal) ──
    if (optionPart === 1) {
      const consultations = await Consultation.find({
        Date_consulation: { $gte: debut, $lte: fin },
        StatutC: true,
      }).lean();
      for (const c of consultations) {
        const m = new Date(c.Date_consulation as Date).getMonth();
        const montant = (c.PrixClinique as number) || 0;
        if (montant === 0) continue;
        addLigne((c.designationC as string) || 'CONSULTATION', m, montant);
      }

      const facturations = await Facturation.find({
        DateModif: { $gte: debut, $lte: fin },
      }).lean();
      for (const f of facturations) {
        const m = new Date(f.DateModif as Date).getMonth();
        const montant = (f.Montanttotal as number) || 0;
        if (montant === 0) continue;
        addLigne((f.Designationtypeacte as string) || 'PRESTATION', m, montant);
      }
    }

    // ── CAS 2 : PART ASSURANCE (Consultation.PartAssurance + Facturation.PartAssuranceP) ──
    if (optionPart === 2) {
      const qConsult: any = { Date_consulation: { $gte: debut, $lte: fin }, StatutC: true };
      if (assurance && assurance !== 'TOUTES LES ASSURANCES') qConsult['assurance'] = assurance;
      const consultations = await Consultation.find(qConsult).lean();
      for (const c of consultations) {
        const m = new Date(c.Date_consulation as Date).getMonth();
        const montant = (c.PartAssurance as number) || 0;
        if (montant === 0) continue;
        addLigne((c.designationC as string) || 'CONSULTATION', m, montant);
      }

      const qFact: any = { DateModif: { $gte: debut, $lte: fin } };
      if (assurance && assurance !== 'TOUTES LES ASSURANCES') qFact['Assurance'] = assurance;
      const facturations = await Facturation.find(qFact).lean();
      for (const f of facturations) {
        const m = new Date(f.DateModif as Date).getMonth();
        const montant = (f.PartAssuranceP as number) || 0;
        if (montant === 0) continue;
        addLigne((f.Designationtypeacte as string) || 'PRESTATION', m, montant);
      }
    }

    // ── CAS 3 : PART PATIENT (Consultation.montantapayer + Facturation.TotalapayerPatient) ──
    if (optionPart === 3) {
      const consultations = await Consultation.find({
        Date_consulation: { $gte: debut, $lte: fin },
        StatutC: true,
      }).lean();
      for (const c of consultations) {
        const m = new Date(c.Date_consulation as Date).getMonth();
        const montant = (c.montantapayer as number) || 0;
        if (montant === 0) continue;
        addLigne((c.designationC as string) || 'CONSULTATION', m, montant);
      }

      const facturations = await Facturation.find({
        DateModif: { $gte: debut, $lte: fin },
      }).lean();
      for (const f of facturations) {
        const m = new Date(f.DateModif as Date).getMonth();
        const montant = (f.TotalapayerPatient as number) || (f.Montanttotal as number) || 0;
        if (montant === 0) continue;
        addLigne((f.Designationtypeacte as string) || 'PRESTATION', m, montant);
      }
    }

    // ── CAS 4 : ENCAISSEMENT PATIENT TOUS PAIEMENTS (AVEC DÉCAISSEMENTS) ──────
    if (optionPart === 4) {
      // ── ENCAISSEMENTS ──────────────────────────────────────────────────────
      // 1) Caisse entrées (groupées par Caisse.Operation)
      const caisseEntrees = await caisse.find({
        dAteC: { $gte: debut, $lte: fin },
        typeC: 'Entrée de caisse',
      }).lean();
      for (const c of caisseEntrees) {
        const m = new Date(c.dAteC as Date).getMonth();
        const montant = (c.MOntantC as number) || 0;
        if (montant === 0) continue;
        addLigne((c.Operation as string) || 'ENTRÉE CAISSE', m, montant);
      }

      // 2) Consultation.Montantencaisse (filtré par modePaiement si précisé)
      const qC4Consult: any = { Date_consulation: { $gte: debut, $lte: fin }, StatutC: true };
      if (modePaiement && modePaiement !== 'TOUS LES PAIEMENTS') qC4Consult['Modepaiement'] = modePaiement;
      const consultations = await Consultation.find(qC4Consult).lean();
      for (const c of consultations) {
        const m = new Date(c.Date_consulation as Date).getMonth();
        const montant = (c.Montantencaisse as number) || 0;
        if (montant === 0) continue;
        addLigne((c.designationC as string) || 'CONSULTATION', m, montant);
      }

      // 3) Facturation.TotalPaye (filtré par modePaiement si précisé)
      const qC4Fact: any = { DateModif: { $gte: debut, $lte: fin } };
      if (modePaiement && modePaiement !== 'TOUS LES PAIEMENTS') qC4Fact['Modepaiement'] = modePaiement;
      const facturations = await Facturation.find(qC4Fact).lean();
      for (const f of facturations) {
        const m = new Date(f.DateModif as Date).getMonth();
        const montant = (f.TotalPaye as number) || 0;
        if (montant === 0) continue;
        addLigne((f.Designationtypeacte as string) || 'PRESTATION', m, montant);
      }

      // 4) EncaissementCaisse.Montantencaisse → libellé fixe (filtré par modePaiement si précisé)
      const qC4Encaiss: any = { DateEncaissement: { $gte: debut, $lte: fin } };
      if (modePaiement && modePaiement !== 'TOUS LES PAIEMENTS') qC4Encaiss['Modepaiement'] = modePaiement;
      const encaissements = await EncaissementCaisse.find(qC4Encaiss).lean();
      for (const e of encaissements) {
        const m = new Date(e.DateEncaissement as Date).getMonth();
        const montant = (e.Montantencaisse as number) || 0;
        if (montant === 0) continue;
        addLigne('ENCAISSEMENT PATIENT CAISSE', m, montant);
      }

      // ── DÉCAISSEMENTS (Caisse sorties) ────────────────────────────────────
      const caisseSorties = await caisse.find({
        dAteC: { $gte: debut, $lte: fin },
        typeC: 'Sortie de caisse',
      }).lean();
      for (const c of caisseSorties) {
        const m = new Date(c.dAteC as Date).getMonth();
        const montant = (c.MOntantC as number) || 0;
        if (montant === 0) continue;
        addDecaiss((c.Operation as string) || 'SORTIE CAISSE', m, montant);
      }
    }

    // ── Calcul TOTAL ENCAISSEMENT / DÉCAISSEMENT ─────────────────────────────
    for (const vals of Object.values(encaissMap)) {
      totalEncaiss = addMois(totalEncaiss, vals);
    }
    for (const vals of Object.values(decaissMap)) {
      totalDecaiss = addMois(totalDecaiss, vals);
    }

    // ── Calcul SOLDE D'OUVERTURE (année N-1) selon optionPart ────────────────
    let soldeOuvertureBase = 0;
    if (avecReport) {
      const anneePrecedente = annee - 1;
      const debutN1 = new Date(anneePrecedente, 0, 1);
      const finN1   = new Date(anneePrecedente, 11, 31, 23, 59, 59, 999);

      if (optionPart === 4) {
        // CAS 4 : Caisse N-1 (entrées - sorties) + Consultation.Montantencaisse + Facturation.TotalPaye + EncaissementCaisse
        const caisseN1 = await caisse.find({ dAteC: { $gte: debutN1, $lte: finN1 } }).lean();
        for (const c of caisseN1) {
          if ((c.typeC as string) === 'Entrée de caisse') soldeOuvertureBase += (c.MOntantC as number) || 0;
          else if ((c.typeC as string) === 'Sortie de caisse') soldeOuvertureBase -= (c.MOntantC as number) || 0;
        }
        const qN1C: any = { Date_consulation: { $gte: debutN1, $lte: finN1 }, StatutC: true };
        if (modePaiement && modePaiement !== 'TOUS LES PAIEMENTS') qN1C['Modepaiement'] = modePaiement;
        const consultN1 = await Consultation.find(qN1C).lean();
        for (const c of consultN1) soldeOuvertureBase += (c.Montantencaisse as number) || 0;
        const qN1F: any = { DateModif: { $gte: debutN1, $lte: finN1 } };
        if (modePaiement && modePaiement !== 'TOUS LES PAIEMENTS') qN1F['Modepaiement'] = modePaiement;
        const factN1 = await Facturation.find(qN1F).lean();
        for (const f of factN1) soldeOuvertureBase += (f.TotalPaye as number) || 0;
        const qN1E: any = { DateEncaissement: { $gte: debutN1, $lte: finN1 } };
        if (modePaiement && modePaiement !== 'TOUS LES PAIEMENTS') qN1E['Modepaiement'] = modePaiement;
        const encaissN1 = await EncaissementCaisse.find(qN1E).lean();
        for (const e of encaissN1) soldeOuvertureBase += (e.Montantencaisse as number) || 0;
      } else {
        const consultN1 = await Consultation.find({
          Date_consulation: { $gte: debutN1, $lte: finN1 },
          StatutC: true,
        }).lean();
        for (const c of consultN1) {
          // CAS 3 (PART PATIENT) : montantapayer ; CAS 1 (TOUS) : PrixClinique
          soldeOuvertureBase += optionPart === 3
            ? ((c.montantapayer as number) || 0)
            : ((c.PrixClinique as number) || 0);
        }
        const factN1 = await Facturation.find({
          DateModif: { $gte: debutN1, $lte: finN1 },
        }).lean();
        for (const f of factN1) {
          // CAS 3 : TotalapayerPatient ; CAS 1 : Montanttotal
          soldeOuvertureBase += optionPart === 3
            ? ((f.TotalapayerPatient as number) || 0)
            : ((f.Montanttotal as number) || 0);
        }
      }
    }

    // ── Construction des lignes résultat ─────────────────────────────────────
    const lignes: { libelle: string; mois: number[]; total: number; isTotalRow?: boolean; isReportRow?: boolean; isClotureRow?: boolean; isDecaissRow?: boolean; isTotalDecaissRow?: boolean }[] = [];

    if (avecReport) {
      // SOLDE D'OUVERTURE mois par mois : ouverture[0] = soldeN-1, ouverture[i] = clôture[i-1]
      const ouvertureMois = new Array(12).fill(0);
      const clotureMois   = new Array(12).fill(0);

      ouvertureMois[0] = soldeOuvertureBase;
      // CAS 4 : clôture tient compte des décaissements ; CAS 1/3 : décaissements = 0
      clotureMois[0] = ouvertureMois[0] + totalEncaiss[0] - totalDecaiss[0];
      for (let i = 1; i < 12; i++) {
        ouvertureMois[i] = clotureMois[i - 1];
        clotureMois[i]   = ouvertureMois[i] + totalEncaiss[i] - totalDecaiss[i];
      }

      lignes.push({
        libelle: "SOLDE D'OUVERTURE",
        mois: ouvertureMois,
        total: ouvertureMois.reduce((s, v) => s + v, 0),
        isReportRow: true,
      });

      // Lignes détail encaissements
      for (const [libelle, moisVals] of Object.entries(encaissMap)) {
        lignes.push({ libelle, mois: moisVals, total: moisVals.reduce((s, v) => s + v, 0) });
      }

      lignes.push({
        libelle: 'TOTAL ENCAISSEMENT',
        mois: totalEncaiss,
        total: totalEncaiss.reduce((s, v) => s + v, 0),
        isTotalRow: true,
      });

      // CAS 4 AVEC REPORT : ajouter décaissements
      if (optionPart === 4 && Object.keys(decaissMap).length > 0) {
        lignes.push({ libelle: '', mois: new Array(12).fill(0), total: 0 });
        for (const [libelle, moisVals] of Object.entries(decaissMap)) {
          lignes.push({ libelle, mois: moisVals, total: moisVals.reduce((s, v) => s + v, 0), isDecaissRow: true });
        }
        lignes.push({
          libelle: 'TOTAL DÉCAISSEMENT',
          mois: totalDecaiss,
          total: totalDecaiss.reduce((s, v) => s + v, 0),
          isTotalDecaissRow: true,
        });
      }

      // Ligne vide séparatrice
      lignes.push({ libelle: '', mois: new Array(12).fill(0), total: 0 });

      lignes.push({
        libelle: 'SOLDE DE CLÔTURE',
        mois: clotureMois,
        total: clotureMois.reduce((s, v) => s + v, 0),
        isClotureRow: true,
      });
    } else if (optionPart === 4) {
      // CAS 4 : encaissements + décaissements + SOLDE DE CLÔTURE (ouverture = 0)
      for (const [libelle, moisVals] of Object.entries(encaissMap)) {
        lignes.push({ libelle, mois: moisVals, total: moisVals.reduce((s, v) => s + v, 0) });
      }

      lignes.push({
        libelle: 'TOTAL ENCAISSEMENT',
        mois: totalEncaiss,
        total: totalEncaiss.reduce((s, v) => s + v, 0),
        isTotalRow: true,
      });

      lignes.push({ libelle: '', mois: new Array(12).fill(0), total: 0 });

      for (const [libelle, moisVals] of Object.entries(decaissMap)) {
        lignes.push({ libelle, mois: moisVals, total: moisVals.reduce((s, v) => s + v, 0), isDecaissRow: true });
      }

      lignes.push({
        libelle: 'TOTAL DÉCAISSEMENT',
        mois: totalDecaiss,
        total: totalDecaiss.reduce((s, v) => s + v, 0),
        isTotalDecaissRow: true,
      });

      lignes.push({ libelle: '', mois: new Array(12).fill(0), total: 0 });

      // SOLDE DE CLÔTURE = encaiss[i] - decaiss[i] (ouverture = 0 par mois)
      const clotureCas4 = totalEncaiss.map((v, i) => v - totalDecaiss[i]);
      lignes.push({
        libelle: 'SOLDE DE CLÔTURE',
        mois: clotureCas4,
        total: clotureCas4.reduce((s, v) => s + v, 0),
        isClotureRow: true,
      });
    } else {
      for (const [libelle, moisVals] of Object.entries(encaissMap)) {
        lignes.push({ libelle, mois: moisVals, total: moisVals.reduce((s, v) => s + v, 0) });
      }

      lignes.push({
        libelle: 'TOTAL ENCAISSEMENT',
        mois: totalEncaiss,
        total: totalEncaiss.reduce((s, v) => s + v, 0),
        isTotalRow: true,
      });
    }

    return NextResponse.json({ success: true, annee, lignes, moisLabels: MOIS_LABELS });
  } catch (error) {
    console.error('Erreur budget trésorerie:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur', error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}
