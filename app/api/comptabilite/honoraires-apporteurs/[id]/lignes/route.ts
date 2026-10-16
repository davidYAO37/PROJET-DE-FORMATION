import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IHonoraireApporteur } from "@/models/HonoraireApporteur";
import { ILigneHonoraireApporteur } from "@/models/LigneHonoraireApporteur";
import { Entreprise, IEntreprise } from "@/models/entreprise";

async function checkApporteurActif(entrepriseId?: string) {
    if (!entrepriseId) return true;
    const entreprise = await Entreprise.findById(entrepriseId).lean<IEntreprise | null>();
    return !!entreprise?.travailleAvecApporteur;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { context, response } = await withTenant(request, ["admin", "adminsuper", "comptable", "facturation"]);
    if (!context) return response;
    const apporteurActif = await checkApporteurActif(context.entrepriseId);
    if (!apporteurActif) return NextResponse.json({ success: false, message: "L'entreprise ne travaille pas avec des apporteurs" }, { status: 403 });
    const Honoraire = getTenantModel<IHonoraireApporteur>(context.connection, "HonoraireApporteur");
    const Ligne = getTenantModel<ILigneHonoraireApporteur>(context.connection, "LigneHonoraireApporteur");
    getTenantModel(context.connection, "Apporteur");
    getTenantModel(context.connection, "LignePrestation");
    getTenantModel(context.connection, "Patient");
    const id = (await params).id;
    const honoraire = await Honoraire.findById(id).populate("Apporteur", "nom telephone taux").lean();
    if (!honoraire) return NextResponse.json({ success: false, message: "Bordereau introuvable" }, { status: 404 });
    const lignes = await Ligne.find({ HonoraireApporteur: id })
        .populate({ path: "LignePrestation", populate: { path: "IdPatient", select: "Nom Prenoms" } })
        .sort({ date: 1 })
        .lean();
    return NextResponse.json({
        success: true,
        honoraire,
        lignes: lignes.map((ligne: any) => {
            const patient = ligne.LignePrestation?.IdPatient;
            const nomComplet = patient && typeof patient === "object" ? `${patient.Nom || ""} ${patient.Prenoms || ""}`.trim() : "";
            return { ...ligne, patient: nomComplet || ligne.patient || "-" };
        }),
    });
}
