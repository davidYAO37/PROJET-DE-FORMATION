import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IStock } from "@/models/Stock";
import { IApprovisionnement } from "@/models/Approvisionnement";
import { ICommandeFournisseur } from "@/models/CommandeFournisseur";
import { IEntreeStock } from "@/models/EntreeStock";
import { ISortieStock } from "@/models/SortieStock";
import { IHistoriqueInventaire } from "@/models/HistoriqueInventaire";
import { IPharmacie } from "@/models/Pharmacie";
import { IFournisseur } from "@/models/Fournisseur";

const READ_ROLES = ["admin", "pharmacien", "caisse", "comptable", "medecin", "accueil"];

function startOfDay(d: Date): Date {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDay(d: Date): Date {
  const date = new Date(d);
  date.setHours(23, 59, 59, 999);
  return date;
}

function startOfMonth(d: Date): Date {
  const date = new Date(d);
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
}

function toMonth(value: any): string | null {
  const date = value ? new Date(value) : null;
  return date && !isNaN(date.getTime())
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    : null;
}

function toDay(value: any): string | null {
  const date = value ? new Date(value) : null;
  return date && !isNaN(date.getTime())
    ? date.toISOString().split("T")[0]
    : null;
}

export async function GET(req: NextRequest) {
  const { context, response: tenantErrorResponse } = await withTenant(req, READ_ROLES);
  if (!context) return tenantErrorResponse;

  const Stock = getTenantModel<IStock>(context.connection, "Stock");
  const Approvisionnement = getTenantModel<IApprovisionnement>(context.connection, "Approvisionnement");
  const CommandeFournisseur = getTenantModel<ICommandeFournisseur>(context.connection, "CommandeFournisseur");
  const EntreeStock = getTenantModel<IEntreeStock>(context.connection, "EntreeStock");
  const SortieStock = getTenantModel<ISortieStock>(context.connection, "SortieStock");
  const HistoriqueInventaire = getTenantModel<IHistoriqueInventaire>(context.connection, "HistoriqueInventaire");
  const Pharmacie = getTenantModel<IPharmacie>(context.connection, "Pharmacie");
  const Fournisseur = getTenantModel<IFournisseur>(context.connection, "Fournisseur");

  try {
    const { searchParams } = new URL(req.url);
    const now = new Date();
    const debutParam = searchParams.get("dateDebut");
    const finParam = searchParams.get("dateFin");

    const periodeDebut = debutParam
      ? startOfDay(new Date(debutParam))
      : startOfMonth(now);
    const periodeFin = finParam
      ? endOfDay(new Date(finParam))
      : endOfDay(now);

    const startToday = startOfDay(now);
    const endToday = endOfDay(now);
    const startMois = startOfMonth(now);

    const [stocks, medicaments, fournisseurs] = await Promise.all([
      Stock.find({}).lean(),
      Pharmacie.find({}).lean(),
      Fournisseur.find({}).select("Nom").lean(),
    ]);

    const medicamentMap = new Map<string, IPharmacie & { _id: string }>();
    for (const m of medicaments as any[]) {
      medicamentMap.set(String(m._id), m);
    }

    const fournisseurMap = new Map<string, string>();
    for (const f of fournisseurs as any[]) {
      fournisseurMap.set(String(f._id), f.Nom || "Fournisseur inconnu");
    }

    function getCategorie(stock: any): string {
      if (!stock.IDMEDICAMENT) return "Non classé";
      const med = medicamentMap.get(String(stock.IDMEDICAMENT));
      return med?.TypeArticle || "Non classé";
    }

    function getPrixVente(stock: any): number {
      if (!stock.IDMEDICAMENT) return 0;
      const med = medicamentMap.get(String(stock.IDMEDICAMENT));
      return Number(med?.PrixVente || med?.PrixAchat || 0);
    }

    // Alertes stock
    const ruptures: any[] = [];
    const sousSeuil: any[] = [];
    let valeurStock = 0;
    const parCategorieMap = new Map<string, { categorie: string; count: number; valeur: number }>();

    for (const s of stocks as any[]) {
      const qte = Number(s.QteEnStock || 0);
      const prix = getPrixVente(s);
      const val = qte * prix;
      valeurStock += val;

      const categorie = getCategorie(s);
      const catEntry = parCategorieMap.get(categorie) || { categorie, count: 0, valeur: 0 };
      catEntry.count++;
      catEntry.valeur += val;
      parCategorieMap.set(categorie, catEntry);

      if (qte <= 0) {
        ruptures.push({
          _id: String(s._id || ""),
          reference: s.Reference || "-",
          medicament: s.Medicament || "-",
          qte,
          seuil: Number(s.QteMinimum || 0),
          categorie,
        });
      } else if (Number(s.QteMinimum || 0) > 0 && qte < Number(s.QteMinimum || 0)) {
        sousSeuil.push({
          _id: String(s._id || ""),
          reference: s.Reference || "-",
          medicament: s.Medicament || "-",
          qte,
          seuil: Number(s.QteMinimum || 0),
          categorie,
        });
      }
    }

    const dateLimite = new Date();
    dateLimite.setDate(dateLimite.getDate() + 30);

    const [lotsProches, lotsPerimes] = await Promise.all([
      EntreeStock.find({
        DatePeremption: { $lte: dateLimite, $gt: now },
      })
        .sort({ DatePeremption: 1 })
        .lean(),
      EntreeStock.find({
        DatePeremption: { $lt: now },
      })
        .sort({ DatePeremption: 1 })
        .lean(),
    ]);

    const prochesPeremption = (lotsProches as any[]).map((e) => ({
      _id: String(e._id || ""),
      reference: e.Reference || "-",
      medicament: e.Medicament || "-",
      lot: e.NumeroLot || "-",
      quantite: Number(e.Quantite || 0),
      peremption: e.DatePeremption ? new Date(e.DatePeremption).toLocaleDateString("fr-FR") : "-",
    }));

    const perimes = (lotsPerimes as any[]).map((e) => ({
      _id: String(e._id || ""),
      reference: e.Reference || "-",
      medicament: e.Medicament || "-",
      lot: e.NumeroLot || "-",
      quantite: Number(e.Quantite || 0),
      peremption: e.DatePeremption ? new Date(e.DatePeremption).toLocaleDateString("fr-FR") : "-",
    }));

    // Période filtrée
    const approQuery = {
      $or: [
        { DateAppro: { $gte: periodeDebut, $lte: periodeFin } },
        { createdAt: { $gte: periodeDebut, $lte: periodeFin }, DateAppro: { $exists: false } },
      ],
    };
    const commandeQuery = {
      $or: [
        { DateCommande: { $gte: periodeDebut, $lte: periodeFin } },
        { createdAt: { $gte: periodeDebut, $lte: periodeFin }, DateCommande: { $exists: false } },
      ],
    };
    const entreeQuery = {
      $or: [
        { DateAppro: { $gte: periodeDebut, $lte: periodeFin } },
        { createdAt: { $gte: periodeDebut, $lte: periodeFin }, DateAppro: { $exists: false } },
      ],
    };
    const sortieQuery = {
      $or: [
        { DateSortie: { $gte: periodeDebut, $lte: periodeFin } },
        { createdAt: { $gte: periodeDebut, $lte: periodeFin }, DateSortie: { $exists: false } },
      ],
    };
    const inventaireQuery = {
      $or: [
        { DateInventaire: { $gte: periodeDebut, $lte: periodeFin } },
        { createdAt: { $gte: periodeDebut, $lte: periodeFin }, DateInventaire: { $exists: false } },
      ],
    };

    const [
      approvisionnements,
      commandes,
      entrees,
      sorties,
      inventaires,
      approJour,
      approMois,
    ] = await Promise.all([
      Approvisionnement.find(approQuery).sort({ DateAppro: -1 }).limit(200).lean(),
      CommandeFournisseur.find(commandeQuery).sort({ DateCommande: -1 }).limit(200).lean(),
      EntreeStock.find(entreeQuery).sort({ DateAppro: -1 }).limit(200).lean(),
      SortieStock.find(sortieQuery).sort({ DateSortie: -1 }).limit(200).lean(),
      HistoriqueInventaire.find(inventaireQuery).sort({ DateInventaire: -1 }).limit(200).lean(),
      Approvisionnement.find({
        DateAppro: { $gte: startToday, $lte: endToday },
      }).lean(),
      Approvisionnement.find({
        DateAppro: { $gte: startMois, $lte: endToday },
      }).lean(),
    ]);

    const approDetails = (approvisionnements as any[]).map((a) => ({
      _id: String(a._id || ""),
      numero: a.NumeroFacture || "-",
      fournisseur: a.NomFournisseur || fournisseurMap.get(String(a.IDFournisseur || "")) || "-",
      date: a.DateAppro ? new Date(a.DateAppro).toLocaleDateString("fr-FR") : "-",
      montant: Number(a.MontantTTC || 0),
    }));

    const commandeDetails = (commandes as any[]).map((c) => ({
      _id: String(c._id || ""),
      numero: c.NumeroCommande || "-",
      fournisseur: c.NomFournisseur || fournisseurMap.get(String(c.IDFournisseur || "")) || "-",
      date: c.DateCommande ? new Date(c.DateCommande).toLocaleDateString("fr-FR") : "-",
      statut: c.Statut || "BROUILLON",
      montant: Number(c.MontantTTC || 0),
    }));

    const entreeDetails = (entrees as any[]).map((e) => ({
      _id: String(e._id || ""),
      reference: e.Reference || "-",
      medicament: e.Medicament || "-",
      date: e.DateAppro ? new Date(e.DateAppro).toLocaleDateString("fr-FR") : "-",
      quantite: Number(e.Quantite || 0),
      montant: Number(e.MontantTTCE || 0),
    }));

    const sortieDetails = (sorties as any[]).map((s) => ({
      _id: String(s._id || ""),
      reference: s.Reference || "-",
      medicament: s.ArticleS || "-",
      date: s.DateSortie ? new Date(s.DateSortie).toLocaleDateString("fr-FR") : "-",
      quantite: Number(s.Quantite || 0),
      montant: Number(s.Prix_TotalS || 0),
      motif: s.Motif || s.TypeMouvement || "-",
    }));

    let ecartTotal = 0;
    const inventaireDetails = (inventaires as any[]).map((i) => {
      const lignes = (i.Lignes || []) as any[];
      const ecart = lignes.reduce((acc, l) => acc + Math.abs(Number(l.Ecart || 0)), 0);
      ecartTotal += ecart;
      return {
        _id: String(i._id || ""),
        date: i.DateInventaire ? new Date(i.DateInventaire).toLocaleDateString("fr-FR") : "-",
        saisiPar: i.SaisiPar || "-",
        nbLignes: Number(i.NbLignes || lignes.length || 0),
        ecart,
      };
    });

    const parMoisMap = new Map<string, { mois: string; approvisionnements: number; commandes: number; entrees: number; sorties: number; total: number }>();
    const parJourMap = new Map<string, { jour: string; approvisionnements: number; commandes: number; entrees: number; sorties: number; total: number }>();

    function addToSeries(dateValue: any, maps: { mois?: Map<string, any>; jour?: Map<string, any> }, type: 'approvisionnements' | 'commandes' | 'entrees' | 'sorties') {
      const mois = toMonth(dateValue || undefined);
      const jour = toDay(dateValue || undefined);
      if (mois && maps.mois) {
        const m = maps.mois.get(mois) || { mois, approvisionnements: 0, commandes: 0, entrees: 0, sorties: 0, total: 0 };
        m[type]++;
        m.total++;
        maps.mois.set(mois, m);
      }
      if (jour && maps.jour) {
        const j = maps.jour.get(jour) || { jour, approvisionnements: 0, commandes: 0, entrees: 0, sorties: 0, total: 0 };
        j[type]++;
        j.total++;
        maps.jour.set(jour, j);
      }
    }

    for (const a of approvisionnements as any[]) {
      addToSeries(a.DateAppro || a.createdAt, { mois: parMoisMap, jour: parJourMap }, "approvisionnements");
    }
    for (const c of commandes as any[]) {
      addToSeries(c.DateCommande || c.createdAt, { mois: parMoisMap, jour: parJourMap }, "commandes");
    }
    for (const e of entrees as any[]) {
      addToSeries(e.DateAppro || e.createdAt, { mois: parMoisMap, jour: parJourMap }, "entrees");
    }
    for (const s of sorties as any[]) {
      addToSeries(s.DateSortie || s.createdAt, { mois: parMoisMap, jour: parJourMap }, "sorties");
    }

    const parMois = Array.from(parMoisMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);

    const parJour = Array.from(parJourMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);

    const parFournisseurMap = new Map<string, { nom: string; approvisionnements: number; commandes: number; montantAppro: number; montantCommande: number; total: number }>();

    for (const a of approvisionnements as any[]) {
      const nom = a.NomFournisseur || fournisseurMap.get(String(a.IDFournisseur || "")) || "Inconnu";
      const f = parFournisseurMap.get(nom) || { nom, approvisionnements: 0, commandes: 0, montantAppro: 0, montantCommande: 0, total: 0 };
      f.approvisionnements++;
      f.montantAppro += Number(a.MontantTTC || 0);
      f.total++;
      parFournisseurMap.set(nom, f);
    }

    for (const c of commandes as any[]) {
      const nom = c.NomFournisseur || fournisseurMap.get(String(c.IDFournisseur || "")) || "Inconnu";
      const f = parFournisseurMap.get(nom) || { nom, approvisionnements: 0, commandes: 0, montantAppro: 0, montantCommande: 0, total: 0 };
      f.commandes++;
      f.montantCommande += Number(c.MontantTTC || 0);
      f.total++;
      parFournisseurMap.set(nom, f);
    }

    const parFournisseur = Array.from(parFournisseurMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    const parCategorie = Array.from(parCategorieMap.values())
      .sort((a, b) => b.valeur - a.valeur);

    const commandesEnCours = (commandes as any[]).filter(
      (c) => c.Statut && c.Statut !== "SOLDEE" && c.Statut !== "ANNULEE"
    ).length;

    const totals = {
      totalProduits: stocks.length,
      valeurStock: Math.round(valeurStock),
      ruptures: ruptures.length,
      sousSeuil: sousSeuil.length,
      prochesPeremption: prochesPeremption.length,
      lotsPerimes: perimes.length,
      approvisionnements: (approvisionnements as any[]).length,
      approvisionnementsJour: (approJour as any[]).length,
      approvisionnementsMois: (approMois as any[]).length,
      commandesFournisseur: (commandes as any[]).length,
      commandesEnCours,
      entreesStock: (entrees as any[]).length,
      sortiesStock: (sorties as any[]).length,
      inventaires: (inventaires as any[]).length,
      ecartInventaire: Math.round(ecartTotal),
    };

    const parStatus = [
      { label: "Ruptures", value: ruptures.length, color: "#dc3545" },
      { label: "Sous seuil min", value: sousSeuil.length, color: "#fd7e14" },
      { label: "Proches péremption", value: prochesPeremption.length, color: "#ffc107" },
      { label: "Périmés", value: perimes.length, color: "#6f42c1" },
    ];

    return NextResponse.json({
      totals,
      parStatus,
      parMois,
      parJour,
      parFournisseur,
      parCategorie,
      details: {
        ruptures,
        sousSeuil,
        prochesPeremption,
        perimes,
        approvisionnements: approDetails,
        commandes: commandeDetails,
        entrees: entreeDetails,
        sorties: sortieDetails,
        inventaires: inventaireDetails,
      },
    });
  } catch (error: any) {
    console.error("Erreur statistiques pharmacie:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des statistiques", details: error.message },
      { status: 500 }
    );
  }
}
