import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { CommandeFournisseur } from "@/models/CommandeFournisseur";
import { Approvisionnement } from "@/models/Approvisionnement";
import { EntreeStock } from "@/models/EntreeStock";
import { Stock } from "@/models/Stock";

/**
 * POST /api/commande-fournisseur/[id]/reception
 * Body: {
 *   NumeroFacture: string,
 *   SaisiPar: string,
 *   Observations: string,
 *   lignes: [{ ligneId, QteRecue, PrixAchat, PrixVente, TVA, NumeroLot, DatePeremption, QteMinimum, QteMaximum }]
 * }
 * - Crée ou réutilise l'approvisionnement lié à la commande
 * - Ajoute des entrées en stock pour chaque ligne reçue
 * - Met à jour QteRecue sur chaque ligne de la commande
 * - Met à jour le statut : RECEPTION_PARTIELLE ou SOLDEE (tout reçu)
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await db();
    const { id } = await params;
    const body = await req.json();

    const commande = await CommandeFournisseur.findById(id);
    if (!commande) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    if (commande.Statut === "ANNULEE") return NextResponse.json({ error: "Commande annulée" }, { status: 400 });

    const { NumeroFacture, SaisiPar, Observations, lignes: lignesRecues } = body;
    const now = new Date();

    // 1. Créer ou récupérer l'approvisionnement lié
    let approId = commande.IDApprovisionnement;
    if (!approId) {
        const appro = await Approvisionnement.create({
            DateAppro:      now,
            IDFournisseur:  commande.IDFournisseur,
            NomFournisseur: commande.NomFournisseur,
            NumeroFacture:  NumeroFacture || "",
            Observations:   Observations || commande.Observations || "",
            SaisiPar:       SaisiPar || commande.SaisiPar,
            SaisiLe:        now,
            PrixHT:         0,
            tVAApro:        0,
            MontantTTC:     0,
        });
        approId = appro._id as any;
        commande.IDApprovisionnement = approId;
    } else if (NumeroFacture) {
        await Approvisionnement.findByIdAndUpdate(approId, { NumeroFacture });
    }

    // 2. Traiter chaque ligne reçue
    let totalHT = 0, totalTVA = 0, totalTTC = 0;

    for (const lr of (lignesRecues || [])) {
        if (!lr.QteRecue || lr.QteRecue <= 0) continue;

        const ligne = commande.lignes?.find((l: any) => l._id?.toString() === lr.ligneId);
        if (!ligne) continue;

        const ht  = lr.QteRecue * (lr.PrixAchat ?? ligne.PrixAchat ?? 0);
        const tva = lr.TVA ?? ligne.TVA ?? 0;
        const ttc = ht + tva;

        // Créer l'entrée en stock
        await EntreeStock.create({
            DateAppro:      now,
            IDAppro:        approId,
            Reference:      ligne.Reference,
            IDMEDICAMENT:   ligne.IDMEDICAMENT,
            Medicament:     ligne.Medicament,
            Quantite:       lr.QteRecue,
            PrixAchat:      lr.PrixAchat ?? ligne.PrixAchat,
            PrixVente:      lr.PrixVente ?? ligne.PrixVente ?? 0,
            PRIXTHT:        ht,
            TVAEntree:      tva,
            MontantTTCE:    ttc,
            QteMinimum:     lr.QteMinimum ?? 0,
            QteMaximum:     lr.QteMaximum ?? 0,
            NumeroLot:      lr.NumeroLot || "",
            DatePeremption: lr.DatePeremption ? new Date(lr.DatePeremption) : null,
            Observations:   Observations || "",
            SaisiPar:       SaisiPar || "",
            SaisiLe:        now,
        });

        // Mise à jour ou création du stock physique
        try {
            const medId = ligne.IDMEDICAMENT ? ligne.IDMEDICAMENT.toString() : null;
            let stock = null;
            if (medId) {
                stock = await Stock.findOne({ IDMEDICAMENT: medId }).lean();
            }
            if (!stock && ligne.Reference) {
                stock = await Stock.findOne({ Reference: ligne.Reference }).lean();
            }
            if (stock?._id) {
                await Stock.findByIdAndUpdate(stock._id, {
                    QteEnStock: (stock.QteEnStock || 0) + lr.QteRecue,
                    AuteurModif: SaisiPar || "",
                    DateModif: now,
                });
            } else if (medId) {
                await Stock.create({
                    IDMEDICAMENT: medId,
                    Reference: ligne.Reference || "",
                    Medicament: ligne.Medicament || "",
                    QteEnStock: lr.QteRecue,
                    QteMinimum: lr.QteMinimum ?? 0,
                    QteMaximum: lr.QteMaximum ?? 0,
                    AuteurModif: SaisiPar || "",
                    DateModif: now,
                });
            }
        } catch { /* non bloquant */ }

        // Mettre à jour QteRecue sur la ligne de commande
        ligne.QteRecue = (ligne.QteRecue || 0) + lr.QteRecue;
        totalHT  += ht;
        totalTVA += tva;
        totalTTC += ttc;
    }

    // 3. Mettre à jour les totaux de l'approvisionnement
    await Approvisionnement.findByIdAndUpdate(approId, {
        $inc: { PrixHT: totalHT, tVAApro: totalTVA, MontantTTC: totalTTC },
    });

    // 4. Déterminer le nouveau statut
    const toutesSoldees = commande.lignes?.every(
        (l: any) => (l.QteRecue || 0) >= (l.QteCommandee || 0)
    );
    commande.Statut = toutesSoldees ? "SOLDEE" : "RECEPTION_PARTIELLE";
    commande.markModified("lignes");
    await commande.save();

    return NextResponse.json({ ok: true, statut: commande.Statut, IDApprovisionnement: approId });
}
