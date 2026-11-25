import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';
import { IConsultation } from '@/models/consultation';

const READ_ROLES = ['admin', 'accueil', 'caisse', 'comptable', 'facturation', 'medecin', 'infirmier'];

function startOfDay(d: Date) {
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);
    return date;
}

function endOfDay(d: Date) {
    const date = new Date(d);
    date.setHours(23, 59, 59, 999);
    return date;
}

function toMonth(d: any): string | null {
    const date = d ? new Date(d) : null;
    return date && !isNaN(date.getTime())
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        : null;
}

function toDay(d: any): string | null {
    const date = d ? new Date(d) : null;
    return date && !isNaN(date.getTime())
        ? date.toISOString().split('T')[0]
        : null;
}

export async function GET(req: NextRequest) {
    const { context, response } = await withTenant(req, READ_ROLES);
    if (!context) return response;

    const Consultation = getTenantModel<IConsultation>(context.connection, 'Consultation');

    try {
        const { searchParams } = new URL(req.url);
        const dateDebut = searchParams.get('dateDebut');
        const dateFin = searchParams.get('dateFin');

        const today = new Date();
        const periodeDebut = dateDebut ? startOfDay(new Date(dateDebut)) : startOfDay(today);
        const periodeFin = dateFin ? endOfDay(new Date(dateFin)) : endOfDay(today);

        // Consultations ayant au moins un acte supplémentaire
        const consultations = await Consultation.find({
            Date_consulation: { $gte: periodeDebut, $lte: periodeFin },
            'actesSupplementaires.0': { $exists: true },
        }).lean();

        let lignes = 0;
        let qte = 0;
        let montant = 0;
        let partPatient = 0;
        let partAssurance = 0;

        const parActeMap = new Map<string, { idActe: string; designation: string; qte: number; montant: number; nbConsultations: number }>();
        const parJourMap = new Map<string, { qte: number; montant: number; lignes: number }>();
        const parMoisMap = new Map<string, { qte: number; montant: number; lignes: number }>();
        const parMedecinMap = new Map<string, { nom: string; qte: number; montant: number; consultations: number }>();
        const details: any[] = [];

        for (const c of consultations as any[]) {
            const actesSupp = Array.isArray(c.actesSupplementaires) ? c.actesSupplementaires : [];
            const jour = toDay(c.Date_consulation);
            const mois = toMonth(c.Date_consulation);
            const medecinKey = String(c.IDMEDECIN || c.Medecin || 'inconnu');

            const medEntry = parMedecinMap.get(medecinKey) || { nom: c.Medecin || 'Médecin inconnu', qte: 0, montant: 0, consultations: 0 };
            medEntry.consultations++;
            parMedecinMap.set(medecinKey, medEntry);

            for (const a of actesSupp) {
                const qteLigne = Math.max(1, Number(a.qte) || 1);
                const montantLigne = (Number(a.prixClinique) || 0) * qteLigne;
                const partPatLigne = (Number(a.partAssure) || 0) + (Number(a.surplus) || 0);
                const partAssurLigne = Number(a.partAssurance) || 0;

                lignes++;
                qte += qteLigne;
                montant += montantLigne;
                partPatient += partPatLigne;
                partAssurance += partAssurLigne;
                medEntry.qte += qteLigne;
                medEntry.montant += montantLigne;

                const acteKey = String(a.idActe || a.designation);
                const acteEntry = parActeMap.get(acteKey) || {
                    idActe: String(a.idActe || ''),
                    designation: a.designation || 'Acte inconnu',
                    qte: 0,
                    montant: 0,
                    nbConsultations: 0,
                };
                acteEntry.qte += qteLigne;
                acteEntry.montant += montantLigne;
                acteEntry.nbConsultations++;
                parActeMap.set(acteKey, acteEntry);

                if (jour) {
                    const jourEntry = parJourMap.get(jour) || { qte: 0, montant: 0, lignes: 0 };
                    jourEntry.qte += qteLigne;
                    jourEntry.montant += montantLigne;
                    jourEntry.lignes++;
                    parJourMap.set(jour, jourEntry);
                }
                if (mois) {
                    const moisEntry = parMoisMap.get(mois) || { qte: 0, montant: 0, lignes: 0 };
                    moisEntry.qte += qteLigne;
                    moisEntry.montant += montantLigne;
                    moisEntry.lignes++;
                    parMoisMap.set(mois, moisEntry);
                }

                details.push({
                    consultationId: String(c._id),
                    codePrestation: c.CodePrestation || '',
                    date: jour || '',
                    patient: c.PatientP || '',
                    codeDossier: c.Code_dossier || '',
                    medecin: c.Medecin || '',
                    caissiere: c.Caissiere || c.Recupar || '',
                    designation: a.designation || '',
                    qte: qteLigne,
                    montant: montantLigne,
                    partPatient: partPatLigne,
                    facture: !!c.StatutC,
                });
            }
        }

        const parActe = Array.from(parActeMap.values()).sort((a, b) => b.montant - a.montant);
        const parJour = Array.from(parJourMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([jour, v]) => ({ jour, ...v }));
        const parMois = Array.from(parMoisMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([mois, v]) => ({ mois, ...v }));
        const parMedecin = Array.from(parMedecinMap.values())
            .map((v) => ({ ...v }))
            .sort((a, b) => b.montant - a.montant)
            .slice(0, 10);

        details.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

        return NextResponse.json({
            totals: {
                consultations: consultations.length,
                lignes,
                qte,
                montant,
                partPatient,
                partAssurance,
                actesDistincts: parActe.length,
                moyenneParConsultation: consultations.length ? Math.round(montant / consultations.length) : 0,
            },
            parActe,
            parJour,
            parMois,
            parMedecin,
            details: details.slice(0, 300),
        });
    } catch (error: any) {
        console.error('Erreur statistiques actes additionnels:', error);
        return NextResponse.json(
            { error: 'Erreur lors du chargement des statistiques', details: error.message },
            { status: 500 }
        );
    }
}
