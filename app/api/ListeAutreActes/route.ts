// app/api/ListeAutreActes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IExamenHospitalisation } from "@/models/examenHospit";

const ROLES = ["admin", "medecin", "accueil", "infirmier"];

export async function GET(req: NextRequest) {
    const { context, response } = await withTenant(req, ROLES);
    if (!context) return response;
    const ExamenHospitalisation = getTenantModel<IExamenHospitalisation>(context.connection, "ExamenHospitalisation");
    getTenantModel(context.connection, "Medecin");
    getTenantModel(context.connection, "Assurance");
    getTenantModel(context.connection, "Patient");
    try {
        const { searchParams } = new URL(req.url);
        const patientId = searchParams.get("patientId");

        if (!patientId) {
            return NextResponse.json(
                { error: "L'ID du patient est requis" },
                { status: 400 }
            );
        }

        const typeActe = searchParams.get("typeActe");

        const filter: any = { $or: [{ IdPatient: patientId }, { PatientP: patientId }] };
        if (typeActe) {
            filter.Designationtypeacte = typeActe;
        }

        const examens = await ExamenHospitalisation.find(filter)
            .populate("IDASSURANCE", "designationassurance")
            .populate("IdPatient", "Nom Prenoms")
            .populate("idMedecin", "nom prenoms")
            .sort({ DatePres: -1 })
            .lean();

        const formatted = examens.map(examen => ({
            _id: examen._id.toString(),
            designation: examen.Designationtypeacte || "Non spécifié",
            montant: examen.Montanttotal || 0,
            date: examen.DatePres,
            statut: examen.Payeoupas ? 'Validé' : 'En attente',
            StatutLaboratoire: examen.StatutLaboratoire || 0,
            patientId: examen.IdPatient?._id?.toString(),
            codePrestation: examen.CodePrestation || "",
            designationTypeActe: examen.Designationtypeacte || "",
            Numfacture: examen.Numfacture || "",
            Entrele: examen.Entrele,
            SortieLe: examen.SortieLe,
            Rclinique: examen.Rclinique,
            NomMed: examen.NomMed || '-'
        }));

        return NextResponse.json(formatted);

    } catch (error: any) {
        console.error("Erreur API ListeAutreActes:", error);
        return NextResponse.json(
            { error: "Erreur lors de la récupération des examens" },
            { status: 500 }
        );
    }
}