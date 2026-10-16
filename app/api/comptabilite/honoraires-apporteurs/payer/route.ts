import { NextRequest, NextResponse } from "next/server";
import { getTenantFilter, withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IHonoraireApporteur } from "@/models/HonoraireApporteur";
import { IPaiementApporteur } from "@/models/PaiementApporteur";
import { Entreprise, IEntreprise } from "@/models/entreprise";

const ROLES = ["admin", "adminsuper", "comptable", "facturation"];

async function checkApporteurActif(entrepriseId?: string) {
    if (!entrepriseId) return true;
    const entreprise = await Entreprise.findById(entrepriseId).lean<IEntreprise | null>();
    return !!entreprise?.travailleAvecApporteur;
}

export async function GET(request: NextRequest) {
    const { context, response } = await withTenant(request, ROLES, { actions: ["export_comptable"] });
    if (!context) return response;
    const apporteurActif = await checkApporteurActif(context.entrepriseId);
    if (!apporteurActif) return NextResponse.json({ success: true, data: [] });
    const Paiement = getTenantModel<IPaiementApporteur>(context.connection, "PaiementApporteur");
    getTenantModel(context.connection, "Apporteur");
    const { searchParams } = new URL(request.url);
    const dateDebut = searchParams.get("dateDebut");
    const dateFin = searchParams.get("dateFin");
    const filter: Record<string, any> = { ...getTenantFilter(context) };
    if (dateDebut || dateFin) {
        filter.date = {};
        if (dateDebut) filter.date.$gte = new Date(dateDebut);
        if (dateFin) {
            const fin = new Date(dateFin);
            fin.setHours(23, 59, 59, 999);
            filter.date.$lte = fin;
        }
    }
    const data = await Paiement.find(filter).populate("Apporteur", "nom").sort({ date: -1 }).lean();
    return NextResponse.json({ success: true, data });
}

export async function POST(request: NextRequest) {
    const { context, response } = await withTenant(request, ROLES, { actions: ["export_comptable"] });
    if (!context) return response;
    const apporteurActif = await checkApporteurActif(context.entrepriseId);
    if (!apporteurActif) return NextResponse.json({ success: false, message: "L'entreprise ne travaille pas avec des apporteurs" }, { status: 403 });
    const Honoraire = getTenantModel<IHonoraireApporteur>(context.connection, "HonoraireApporteur");
    const Paiement = getTenantModel<IPaiementApporteur>(context.connection, "PaiementApporteur");
    const { honoraireId, montant, datePaiement, modePaiement, banque, numeroCheque, payePar, recuPar } = await request.json();
    if (!honoraireId || !Number.isFinite(Number(montant)) || Number(montant) <= 0) return NextResponse.json({ success: false, message: "Montant invalide" }, { status: 400 });
    // Tous les montants doivent être des entiers
    const montantPaiement = Math.round(Number(montant));
    const honoraire = await Honoraire.findOneAndUpdate(
        { _id: honoraireId, annule: { $ne: true }, resteAPayer: { $gte: montantPaiement }, ...getTenantFilter(context) },
        { $inc: { montantPaye: montantPaiement, resteAPayer: -montantPaiement } },
        { new: true }
    );
    if (!honoraire) {
        const existe = await Honoraire.exists({ _id: honoraireId, annule: { $ne: true }, ...getTenantFilter(context) });
        return NextResponse.json({ success: false, message: existe ? "Le montant dépasse le reste à payer" : "Bordereau introuvable" }, { status: existe ? 400 : 404 });
    }
    try {
        await Paiement.create({ Apporteur: honoraire.Apporteur, HonoraireApporteur: honoraire._id, montant: montantPaiement, resteAPayer: honoraire.resteAPayer, date: datePaiement ? new Date(datePaiement) : new Date(), heure: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }), modePaiement, banque, numeroCheque, payePar, recuPar, entrepriseId: context.entrepriseId, ligneIds: [] });
        return NextResponse.json({ success: true });
    } catch (error) {
        await Honoraire.findByIdAndUpdate(honoraire._id, { $inc: { montantPaye: -montantPaiement, resteAPayer: montantPaiement } });
        console.error("Erreur paiement apporteur:", error);
        return NextResponse.json({ success: false, message: "Impossible d'enregistrer le paiement" }, { status: 500 });
    }
}
