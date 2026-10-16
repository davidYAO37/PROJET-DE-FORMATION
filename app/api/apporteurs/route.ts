import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IApporteur } from "@/models/Apporteur";
import { Entreprise, IEntreprise } from "@/models/entreprise";

const READ_ROLES = ["admin", "caisse", "comptable", "facturation"];
const WRITE_ROLES = ["admin"];
const WRITE_OPTIONS = { actions: ["parametrage_general"] };

async function checkApporteurActif(entrepriseId?: string) {
    if (!entrepriseId) return true;
    const entreprise = await Entreprise.findById(entrepriseId).lean<IEntreprise | null>();
    return !!entreprise?.travailleAvecApporteur;
}

export async function GET(request: NextRequest) {
    const { context, response } = await withTenant(request, READ_ROLES);
    if (!context) return response;
    const apporteurActif = await checkApporteurActif(context.entrepriseId);
    if (!apporteurActif) return NextResponse.json([], { status: 200 });
    const Apporteur = getTenantModel<IApporteur>(context.connection, "Apporteur");
    const actifs = new URL(request.url).searchParams.get("actifs");
    return NextResponse.json(await Apporteur.find(actifs === "true" ? { actif: true } : {}).sort({ nom: 1 }).lean());
}

export async function POST(request: NextRequest) {
    const { context, response } = await withTenant(request, WRITE_ROLES, WRITE_OPTIONS);
    if (!context) return response;
    const apporteurActif = await checkApporteurActif(context.entrepriseId);
    if (!apporteurActif) return NextResponse.json({ error: "L'entreprise ne travaille pas avec des apporteurs" }, { status: 403 });
    const Apporteur = getTenantModel<IApporteur>(context.connection, "Apporteur");
    const { nom, telephone, taux, actif } = await request.json();
    if (!nom?.trim() || !Number.isFinite(Number(taux)) || Number(taux) < 0 || Number(taux) > 100) {
        return NextResponse.json({ error: "Nom et taux compris entre 0 et 100 requis" }, { status: 400 });
    }
    return NextResponse.json(await Apporteur.create({ nom: nom.trim(), telephone: telephone?.trim(), taux: Number(taux), actif: actif ?? true }), { status: 201 });
}

export async function PUT(request: NextRequest) {
    const { context, response } = await withTenant(request, WRITE_ROLES, WRITE_OPTIONS);
    if (!context) return response;
    const apporteurActif = await checkApporteurActif(context.entrepriseId);
    if (!apporteurActif) return NextResponse.json({ error: "L'entreprise ne travaille pas avec des apporteurs" }, { status: 403 });
    const Apporteur = getTenantModel<IApporteur>(context.connection, "Apporteur");
    const { id, nom, telephone, taux, actif } = await request.json();
    if (!id || !nom?.trim() || !Number.isFinite(Number(taux)) || Number(taux) < 0 || Number(taux) > 100) {
        return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }
    return NextResponse.json(await Apporteur.findByIdAndUpdate(id, { nom: nom.trim(), telephone: telephone?.trim(), taux: Number(taux), actif: Boolean(actif) }, { new: true }));
}
