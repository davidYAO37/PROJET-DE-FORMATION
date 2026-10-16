import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
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

async function updatePayment(request: NextRequest, id: string, remove: boolean) {
    const { context, response } = await withTenant(request, ROLES, { actions: ["export_comptable"] });
    if (!context) return response;
    const apporteurActif = await checkApporteurActif(context.entrepriseId);
    if (!apporteurActif) return NextResponse.json({ success: false, message: "L'entreprise ne travaille pas avec des apporteurs" }, { status: 403 });
    const Honoraire = getTenantModel<IHonoraireApporteur>(context.connection, "HonoraireApporteur");
    const Paiement = getTenantModel<IPaiementApporteur>(context.connection, "PaiementApporteur");
    const body = await request.json().catch(() => ({}));
    const paiement = await Paiement.findById(id);
    if (!paiement?.HonoraireApporteur) return NextResponse.json({ success: false, message: "Paiement introuvable" }, { status: 404 });
    const honoraire = await Honoraire.findById(paiement.HonoraireApporteur);
    if (!honoraire) return NextResponse.json({ success: false, message: "Bordereau introuvable" }, { status: 404 });
    const nouveauMontant = remove ? 0 : Math.round(Number(body.montant));
    if (!remove && (!Number.isFinite(nouveauMontant) || nouveauMontant <= 0)) return NextResponse.json({ success: false, message: "Montant invalide" }, { status: 400 });
    const nouveauTotal = Math.round(honoraire.montantPaye - paiement.montant + nouveauMontant);
    if (nouveauTotal > honoraire.totalNetAPayer) return NextResponse.json({ success: false, message: "Le montant dépasse le net à payer" }, { status: 400 });
    honoraire.montantPaye = nouveauTotal;
    honoraire.resteAPayer = Math.round(honoraire.totalNetAPayer - nouveauTotal);
    await honoraire.save();
    if (remove) await paiement.deleteOne();
    else {
        paiement.montant = nouveauMontant;
        paiement.resteAPayer = honoraire.resteAPayer;
        paiement.modePaiement = body.modePaiement;
        paiement.banque = body.banque;
        paiement.numeroCheque = body.numeroCheque;
        paiement.recuPar = body.recuPar;
        paiement.payePar = body.payePar;
        await paiement.save();
    }
    return NextResponse.json({ success: true });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { return updatePayment(request, (await params).id, false); }
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { return updatePayment(request, (await params).id, true); }
