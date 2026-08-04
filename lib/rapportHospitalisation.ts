import { Connection } from 'mongoose';
import { getTenantModel } from '@/lib/tenantModels';
import { IExamenHospitalisation } from '@/models/examenHospit';
import { ILignePrestation } from '@/models/lignePrestation';
import { IPatientPrescription } from '@/models/PatientPrescription';
import { IConsultation } from '@/models/consultation';
import { IPrescriptionHospitalisation } from '@/models/hospitalisation/PrescriptionHospitalisation';
import { ISoinHospitalisation } from '@/models/hospitalisation/SoinHospitalisation';
import { IConstanteHospitalisation } from '@/models/hospitalisation/ConstanteHospitalisation';
import { IEvolutionMedicaleHospitalisation } from '@/models/hospitalisation/EvolutionMedicaleHospitalisation';
import { IRapportHospitalisation } from '@/models/rapportHospitalisation';

const LETTRES_PARACLINIQUE = ['K', 'KC', 'B', 'Z', 'D'];

function formatConstante(c: any): string {
  const parts: string[] = [];
  if (c.temperature != null) parts.push(`T° ${c.temperature}°C`);
  if (c.tensionSystole != null || c.tensionDiastole != null) parts.push(`TA ${c.tensionSystole ?? '?'}/${c.tensionDiastole ?? '?'}`);
  if (c.pouls != null) parts.push(`Pouls ${c.pouls}`);
  if (c.frequenceRespiratoire != null) parts.push(`FR ${c.frequenceRespiratoire}`);
  if (c.spo2 != null) parts.push(`SpO2 ${c.spo2}%`);
  if (c.glycemie != null) parts.push(`Glycémie ${c.glycemie}`);
  if (c.poids != null) parts.push(`Poids ${c.poids}kg`);
  const date = c.date ? new Date(c.date).toLocaleDateString('fr-FR') : '';
  return `- ${date} ${c.heure || ''} : ${parts.join(', ')}${c.observation ? ` (${c.observation})` : ''}`;
}

function formatSoin(s: any): string {
  const date = s.date ? new Date(s.date).toLocaleDateString('fr-FR') : '';
  return `- ${date} ${s.heure || ''} : ${s.type} - ${s.description}${s.observation ? ` (${s.observation})` : ''}`;
}

function formatPrescriptionHospit(p: any): string {
  const statut = p.statut === 'administre' ? 'administré' : p.statut === 'annule' ? 'annulé' : 'en attente';
  return `- ${p.medicament} ${p.dosage || ''} (${[p.voie, p.frequence, p.duree].filter(Boolean).join(', ')}) qté:${p.quantite} [${statut}]`;
}

function formatEvolution(e: any): string {
  const date = e.date ? new Date(e.date).toLocaleDateString('fr-FR') : '';
  return `- ${date} ${e.heure || ''} : ${e.observation}${e.decision ? ` — Décision : ${e.decision}` : ''}${e.etatPatient ? ` — État : ${e.etatPatient}` : ''}`;
}

/**
 * Recalcule et met à jour automatiquement les champs pré-remplis du rapport
 * d'hospitalisation lié (Examen clinique, Examens paracliniques, Traitement
 * administré, Évolution) à partir des données de la consultation d'origine et
 * du suivi durant le séjour (prescriptions, soins, constantes, évolutions).
 *
 * N'a aucun effet si aucun rapport n'est lié à cette hospitalisation, ou si le
 * rapport est déjà au statut "valide" (verrouillé après validation médecin).
 */
export async function refreshRapportHospitalisation(
  connection: Connection,
  hospitalisationId: string | undefined | null
): Promise<void> {
  if (!hospitalisationId) return;

  const RapportHospitalisation = getTenantModel<IRapportHospitalisation>(connection, 'RapportHospitalisation');
  const rapport = await RapportHospitalisation.findOne({ hospitalisationId: String(hospitalisationId) });
  if (!rapport || rapport.statut === 'valide') return;

  const ExamenHospitalisation = getTenantModel<IExamenHospitalisation>(connection, 'ExamenHospitalisation');
  const examenHospit = await ExamenHospitalisation.findById(hospitalisationId).lean();
  if (!examenHospit) return;

  const LignePrestation = getTenantModel<ILignePrestation>(connection, 'LignePrestation');
  const PatientPrescription = getTenantModel<IPatientPrescription>(connection, 'PatientPrescription');
  const Consultation = getTenantModel<IConsultation>(connection, 'Consultation');
  const PrescriptionHospitalisation = getTenantModel<IPrescriptionHospitalisation>(connection, 'PrescriptionHospitalisation');
  const SoinHospitalisation = getTenantModel<ISoinHospitalisation>(connection, 'SoinHospitalisation');
  const ConstanteHospitalisation = getTenantModel<IConstanteHospitalisation>(connection, 'ConstanteHospitalisation');
  const EvolutionMedicaleHospitalisation = getTenantModel<IEvolutionMedicaleHospitalisation>(
    connection,
    'EvolutionMedicaleHospitalisation'
  );

  const codePrestation = (examenHospit as any).CodePrestation;

  const [consultation, lignesConsultation, prescriptionsConsultation, prescriptionsHospit, soins, constantes, evolutions] =
    await Promise.all([
      codePrestation ? Consultation.findOne({ CodePrestation: codePrestation }).lean() : Promise.resolve(null),
      codePrestation ? LignePrestation.find({ CodePrestation: codePrestation }).lean() : Promise.resolve([]),
      codePrestation ? PatientPrescription.find({ CodePrestation: codePrestation }).lean() : Promise.resolve([]),
      PrescriptionHospitalisation.find({ hospitalisationId }).sort({ dateDebut: 1 }).lean(),
      SoinHospitalisation.find({ hospitalisationId }).sort({ date: 1 }).lean(),
      ConstanteHospitalisation.find({ hospitalisationId }).sort({ date: 1 }).lean(),
      EvolutionMedicaleHospitalisation.find({ hospitalisationId }).sort({ date: 1 }).lean(),
    ]);

  const examenCliniqueParts: string[] = [];
  if ((consultation as any)?.ExamenClinique) examenCliniqueParts.push((consultation as any).ExamenClinique);
  examenCliniqueParts.push(...constantes.map(formatConstante));
  examenCliniqueParts.push(...soins.map(formatSoin));
  const examenClinique = examenCliniqueParts.filter(Boolean).join('\n');

  const examensParacliniques = (lignesConsultation as any[])
    .filter((ligne) => !!ligne.lettreCle && LETTRES_PARACLINIQUE.includes(ligne.lettreCle))
    .sort((a, b) => (a.ordonnancementAffichage || 0) - (b.ordonnancementAffichage || 0))
    .map((l) => l.prestation)
    .join(' - ');

  const traitementAdministre = [
    ...(prescriptionsConsultation as any[]).map((p) => `- ${p.nomMedicament} ${p.posologie || ''} qté:${p.QteP}`),
    ...prescriptionsHospit.map(formatPrescriptionHospit),
  ].join('\n');

  const evolution = evolutions.map(formatEvolution).join('\n');

  await RapportHospitalisation.findByIdAndUpdate(rapport._id, {
    examenClinique: examenClinique || rapport.examenClinique,
    examensParacliniques: examensParacliniques || rapport.examensParacliniques,
    traitementAdministre: traitementAdministre || rapport.traitementAdministre,
    evolution: evolution || rapport.evolution,
  });
}
