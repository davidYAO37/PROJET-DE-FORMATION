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

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { context, response } = await withTenant(request, ["admin", "adminsuper", "comptable", "facturation"], { actions: ["export_comptable"] });
    if (!context) return response;
    const apporteurActif = await checkApporteurActif(context.entrepriseId);
    if (!apporteurActif) return NextResponse.json({ success: false, message: "L'entreprise ne travaille pas avec des apporteurs" }, { status: 403 });
    const Honoraire = getTenantModel<IHonoraireApporteur>(context.connection, "HonoraireApporteur");
    const Ligne = getTenantModel<ILigneHonoraireApporteur>(context.connection, "LigneHonoraireApporteur");
    const id = (await params).id;
    const honoraire = await Honoraire.findById(id);
    if (!honoraire) return NextResponse.json({ success: false, message: "Bordereau introuvable" }, { status: 404 });
    if (honoraire.montantPaye > 0) return NextResponse.json({ success: false, message: "Annulez d'abord les paiements" }, { status: 400 });
    await Ligne.deleteMany({ HonoraireApporteur: id });
    honoraire.annule = true;
    await honoraire.save();
    return NextResponse.json({ success: true });
}
