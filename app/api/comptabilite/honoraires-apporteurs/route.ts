import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getTenantFilter, withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { ILignePrestation } from "@/models/lignePrestation";
import { IApporteur } from "@/models/Apporteur";
import { IHonoraireApporteur } from "@/models/HonoraireApporteur";
import { ILigneHonoraireApporteur } from "@/models/LigneHonoraireApporteur";
import { IPaiementApporteur } from "@/models/PaiementApporteur";
import { Entreprise, IEntreprise } from "@/models/entreprise";

const ROLES = ["admin", "adminsuper", "comptable", "facturation"];
// Tous les montants doivent être des entiers
const toInt = (v: any) => Math.round(Number(v) || 0);
const toEndDate = (value: string) => { const date = new Date(value); date.setHours(23, 59, 59, 999); return date; };
const patientName = (ligne: any) => {
    const patient = ligne.IdPatient || ligne.LignePrestation?.IdPatient;
    const nomComplet = patient && typeof patient === "object" ? `${patient.Nom || ""} ${patient.Prenoms || ""}`.trim() : "";
    return nomComplet || ligne.nomPatient || ligne.patient || "-";
};

async function checkApporteurActif(entrepriseId?: string) {
    if (!entrepriseId) return true;
    const entreprise = await Entreprise.findById(entrepriseId).lean<IEntreprise | null>();
    return !!entreprise?.travailleAvecApporteur;
}

export async function GET(request: NextRequest) {
    const { context, response } = await withTenant(request, ROLES);
    if (!context) return response;
    const apporteurActif = await checkApporteurActif(context.entrepriseId);
    if (!apporteurActif) return NextResponse.json({ success: true, data: [] }, { status: 200 });
    const LignePrestation = getTenantModel<ILignePrestation>(context.connection, "LignePrestation");
    const Apporteur = getTenantModel<IApporteur>(context.connection, "Apporteur");
    const Honoraire = getTenantModel<IHonoraireApporteur>(context.connection, "HonoraireApporteur");
    const LigneHonoraire = getTenantModel<ILigneHonoraireApporteur>(context.connection, "LigneHonoraireApporteur");
    const Paiement = getTenantModel<IPaiementApporteur>(context.connection, "PaiementApporteur");
    getTenantModel(context.connection, "Patient");
    const params = new URL(request.url).searchParams;
    const apporteurId = params.get("apporteurId") || "";
    const dateDebut = params.get("dateDebut") || "";
    const dateFin = params.get("dateFin") || "";

    if (params.get("action") === "apporteurs") {
        return NextResponse.json({ success: true, data: await Apporteur.find({ actif: true }).sort({ nom: 1 }).lean() });
    }

    if (params.get("action") === "actes") {
        if (!apporteurId || !dateDebut || !dateFin || !mongoose.isValidObjectId(apporteurId)) return NextResponse.json({ success: false, message: "Apporteur et période requis" }, { status: 400 });
        const dejaInclus = await LigneHonoraire.find({}).distinct("LignePrestation");
        const lignes = await LignePrestation.find({
            idApporteur: apporteurId,
            acteApporteur: "OUI",
            actePayeCaisse: "Payé",
            datePaiementCaisse: { $gte: new Date(dateDebut), $lte: toEndDate(dateFin) },
            _id: { $nin: dejaInclus },
            ...getTenantFilter(context),
        }).populate("IdPatient", "Nom Prenoms").sort({ datePaiementCaisse: 1 }).lean();
        return NextResponse.json({ success: true, data: lignes.map(l => ({
            id: String(l._id), date: l.datePaiementCaisse || l.dateLignePrestation, acte: l.prestation,
            patient: patientName(l), montantActe: toInt(l.prixTotal), taux: Number(l.tauxApporteur || 0), netAPayer: toInt(l.montantApporteur),
        })) });
    }

    const filtre: Record<string, unknown> = { annule: { $ne: true }, ...getTenantFilter(context) };
    if (apporteurId) filtre.Apporteur = apporteurId;
    if (dateDebut && dateFin) filtre.date = { $gte: new Date(dateDebut), $lte: toEndDate(dateFin) };
    const honoraires = await Honoraire.find(filtre).populate("Apporteur", "nom telephone taux").sort({ date: -1 }).lean();
    const ids = honoraires.map(h => h._id);
    const [lignes, paiements] = await Promise.all([
        LigneHonoraire.find({ HonoraireApporteur: { $in: ids } }).populate({ path: "LignePrestation", populate: { path: "IdPatient", select: "Nom Prenoms" } }).lean(),
        Paiement.find({ HonoraireApporteur: { $in: ids } }).sort({ date: -1 }).lean(),
    ]);
    return NextResponse.json({ success: true, data: honoraires.map(h => ({
        ...h,
        montantTotalActes: toInt(h.montantTotalActes),
        totalNetAPayer: toInt(h.totalNetAPayer),
        montantPaye: toInt(h.montantPaye),
        resteAPayer: toInt(h.resteAPayer),
        lignes: lignes.filter(l => String(l.HonoraireApporteur) === String(h._id)).map(l => ({ ...l, montantActe: toInt(l.montantActe), netAPayer: toInt(l.netAPayer), patient: patientName(l) })),
        paiements: paiements.filter(p => String(p.HonoraireApporteur) === String(h._id)).map(p => ({ ...p, montant: toInt(p.montant), resteAPayer: toInt(p.resteAPayer) })),
    })) });
}

export async function POST(request: NextRequest) {
    const { context, response } = await withTenant(request, ROLES, { actions: ["export_comptable"] });
    if (!context) return response;
    const apporteurActif = await checkApporteurActif(context.entrepriseId);
    if (!apporteurActif) return NextResponse.json({ success: false, message: "L'entreprise ne travaille pas avec des apporteurs" }, { status: 403 });
    const LignePrestation = getTenantModel<ILignePrestation>(context.connection, "LignePrestation");
    const Apporteur = getTenantModel<IApporteur>(context.connection, "Apporteur");
    const Honoraire = getTenantModel<IHonoraireApporteur>(context.connection, "HonoraireApporteur");
    const LigneHonoraire = getTenantModel<ILigneHonoraireApporteur>(context.connection, "LigneHonoraireApporteur");
    const { apporteurId, dateDebut, dateFin, ligneIds } = await request.json();
    if (!apporteurId || !dateDebut || !dateFin || !Array.isArray(ligneIds) || !ligneIds.length) return NextResponse.json({ success: false, message: "Données manquantes" }, { status: 400 });
    const apporteur = await Apporteur.findById(apporteurId).lean();
    if (!apporteur) return NextResponse.json({ success: false, message: "Apporteur introuvable" }, { status: 404 });
    const dejaInclus = await LigneHonoraire.find({ LignePrestation: { $in: ligneIds } }).distinct("LignePrestation");
    const lignes = await LignePrestation.find({ _id: { $in: ligneIds, $nin: dejaInclus }, idApporteur: apporteurId, acteApporteur: "OUI", actePayeCaisse: "Payé" }).populate("IdPatient", "Nom Prenoms").lean();
    if (!lignes.length) return NextResponse.json({ success: false, message: "Aucun acte disponible" }, { status: 400 });
    const montantTotalActes = toInt(lignes.reduce((s, l) => s + Number(l.prixTotal || 0), 0));
    const totalNetAPayer = toInt(lignes.reduce((s, l) => s + Number(l.montantApporteur || 0), 0));
    const honoraire = await Honoraire.create({ Apporteur: apporteurId, debut: new Date(dateDebut), fin: toEndDate(dateFin), nombreActes: lignes.length, montantTotalActes, taux: apporteur.taux, totalNetAPayer, montantPaye: 0, resteAPayer: totalNetAPayer, entrepriseId: context.entrepriseId });
    try {
        await LigneHonoraire.insertMany(lignes.map(l => ({ HonoraireApporteur: honoraire._id, LignePrestation: l._id, date: l.datePaiementCaisse || l.dateLignePrestation || new Date(), prestation: l.prestation, patient: patientName(l), montantActe: toInt(l.prixTotal), taux: l.tauxApporteur || apporteur.taux, netAPayer: toInt(l.montantApporteur), entrepriseId: context.entrepriseId })));
        return NextResponse.json({ success: true, id: String(honoraire._id) });
    } catch (error) {
        await Promise.all([
            LigneHonoraire.deleteMany({ HonoraireApporteur: honoraire._id }),
            Honoraire.findByIdAndDelete(honoraire._id),
        ]);
        console.error("Erreur création bordereau apporteur:", error);
        return NextResponse.json({ success: false, message: "Impossible de créer le bordereau" }, { status: 500 });
    }
}
