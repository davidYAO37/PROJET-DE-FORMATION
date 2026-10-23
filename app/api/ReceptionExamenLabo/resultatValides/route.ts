import { NextRequest, NextResponse } from "next/server";
import { withTenant, getTenantFilter } from "@/lib/withTenant";
import { requireAuth } from "@/lib/auth";
import { Types } from "mongoose";
import { getTenantModel } from "@/lib/tenantModels";
import { IExamenHospitalisation } from "@/models/examenHospit";

const ROLES = ["admin", "medecin", "accueil", "infirmier", "biologiste", "technicienlabo"];

export async function POST(req: NextRequest) {
    const { user, error } = await requireAuth(req, ROLES);
    if (error) return error;
    const { context, response } = await withTenant(req, ROLES);
    if (!context) return response;
    try {
        const body = await req.json();
        const nom = typeof body.resultatRecuPar === "string" ? body.resultatRecuPar.trim() : "";
        const tel = typeof body.telephoneReceptionResultat === "string" ? body.telephoneReceptionResultat.trim() : "";
        if (typeof body.idHospitalisation !== "string" || !Types.ObjectId.isValid(body.idHospitalisation) ||
            !nom || nom.length > 150 || tel.length > 30 || !/^[+\d\s().-]+$/.test(tel) || tel.replace(/\D/g, "").length < 8) {
            return NextResponse.json({ message: "Examen, nom du réceptionnaire et téléphone valide (8 chiffres minimum) requis." }, { status: 400 });
        }
        const Examen = getTenantModel<IExamenHospitalisation>(context.connection, "ExamenHospitalisation");
        const updated = await Examen.findOneAndUpdate({
            ...getTenantFilter(context),
            _id: body.idHospitalisation,
            Designationtypeacte: "EXAMEN BIOLOGIQUE",
            StatutLaboratoire: 4,
            dateRemiseResultat: null,
        }, { $set: {
            resultatRemisPar: `${user.prenom} ${user.nom}`.trim() || user.email,
            resultatRemisParId: new Types.ObjectId(user._id),
            dateRemiseResultat: new Date(),
            resultatRecuPar: nom,
            telephoneReceptionResultat: tel,
        } }, { new: true, runValidators: true }).select("resultatRemisPar dateRemiseResultat resultatRecuPar telephoneReceptionResultat").lean();
        if (!updated) {
            return NextResponse.json({ message: "Résultat introuvable, non validé ou déjà remis." }, { status: 409 });
        }
        return NextResponse.json({ message: "Remise du résultat enregistrée.", remise: updated });
    } catch {
        return NextResponse.json({ message: "Impossible d'enregistrer la remise du résultat." }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const { context, response } = await withTenant(req, ROLES);
    if (!context) return response;
    const ExamenHospitalisation = getTenantModel<IExamenHospitalisation>(context.connection, "ExamenHospitalisation");

    try {
        const { searchParams } = new URL(req.url);

        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        if (!startDate || !endDate) {
            return NextResponse.json(
                { error: "Paramètres manquants", message: "startDate et endDate sont requis." },
                { status: 400 }
            );
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const receptions = await ExamenHospitalisation.find({
            ...getTenantFilter(context),
            Designationtypeacte: 'EXAMEN BIOLOGIQUE',
            StatutLaboratoire: 4,
            DateValidation: {
                $gte: start,
                $lte: end,
            },
        }).lean();

        return NextResponse.json(receptions);
    } catch (error) {
        console.error("Erreur GET examens validés:", error);
        return NextResponse.json(
            { error: "Erreur serveur", message: String(error) },
            { status: 500 }
        );
    }
}
