import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';
import { IExamenHospitalisation } from '@/models/examenHospit';

const ROLES = ['admin', 'medecin', 'accueil', 'infirmier'];

const startOfDay = (d: Date) => { const v = new Date(d); v.setHours(0, 0, 0, 0); return v; };
const endOfDay = (d: Date) => { const v = new Date(d); v.setHours(23, 59, 59, 999); return v; };

export async function GET(req: NextRequest) {
    const { context, response } = await withTenant(req, ROLES);
    if (!context) return response;
    const ExamenHospitalisation = getTenantModel<IExamenHospitalisation>(context.connection, 'ExamenHospitalisation');

    try {
        const { searchParams } = new URL(req.url);
        const dateDebutParam = searchParams.get('dateDebut');
        const dateFinParam = searchParams.get('dateFin');

        if (!dateDebutParam || !dateFinParam) {
            return NextResponse.json({ error: 'dateDebut et dateFin sont requis' }, { status: 400 });
        }

        const dateDebut = startOfDay(new Date(dateDebutParam));
        const dateFin = endOfDay(new Date(dateFinParam));

        const examens = await ExamenHospitalisation.find(
            {
                Designationtypeacte: 'EXAMEN BIOLOGIQUE',
                Datetransferbiologiste: { $gte: dateDebut, $lte: dateFin },
                StatutLaboratoire: 3,
            },
            {
                _id: 1,
                CodePrestation: 1,
                Designationtypeacte: 1,
                PatientP: 1,
                StatutLaboratoire: 1,
                IdPatient: 1,
                Datetransferbiologiste: 1,
                Transferepar: 1,
                resultatSaisiePar: 1,
                ProvenanceExamen: 1,
                NIdentificationExamen: 1,
                Externe_Interne: 1,
                CONCLUSIONGENE: 1,
                ObservationC: 1,
                idMedecin: 1,
                IDHOSPITALISATION: 1,
            }
        )
            .sort({ Datetransferbiologiste: -1 })
            .lean();

        return NextResponse.json({ success: true, total: examens.length, examens });

    } catch (error) {
        console.error('Erreur API examens à valider:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
