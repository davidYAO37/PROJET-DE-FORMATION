import { NextRequest, NextResponse } from "next/server";
import { ActeClinique } from "@/models/acteclinique";
import { TarifAssurance } from "@/models/tarifassurance";
import { db } from "@/db/mongoConnect";

// Fonction utilitaire de nettoyage des nombres
function cleanNumber(value: any): number {
    if (value === null || value === undefined) return 0;

    // Conversion en string pour uniformiser
    let str = String(value).trim();

    // Remplacement des virgules par des points
    str = str.replace(",", ".");

    // Valeurs considérées comme nulles → 0
    if (["", "N/A", "NA", "--", "-", "null", "undefined"].includes(str.toUpperCase())) {
        return 0;
    }

    // Conversion en nombre
    const num = Number(str);
    return isNaN(num) ? 0 : num;
}

// Fonction utilitaire de nettoyage des textes
function cleanText(value: any): string {
    if (value === null || value === undefined) return "";
    
    let str = String(value).trim();
    
    // Supprimer les caractères de contrôle et les espaces multiples
    str = str.replace(/[\x00-\x1F\x7F]/g, '').replace(/\s+/g, ' ');
    
    // Normaliser les caractères spéciaux courants
    str = str.replace(/[']/g, "'").replace(/["]/g, '"');
    
    return str;
}

export async function POST(req: NextRequest) {
    await db();
    const { rows, overwriteDuplicates = false, removeDuplicatesAsTarif = false } = await req.json();

    console.log("POST /api/actes/import - Données reçues:", { 
        rowCount: rows?.length, 
        firstRow: rows?.[0],
        overwriteDuplicates,
        removeDuplicatesAsTarif
    });

    if (!Array.isArray(rows)) {
        return NextResponse.json(
            { error: "Format de données invalide : le champ 'rows' doit être un tableau." },
            { status: 400 }
        );
    }

    try {
        const errors: { index: number; message: string }[] = [];

        const actes = rows.map((row: any, i: number) => {
            // On accepte plusieurs variantes de noms de colonnes avec nettoyage
            const designationacte = cleanText(row.designationacte || row["Désignation"] || row["designationacte"] || "");
            const lettreCle = cleanText(row.lettreCle || row["Lettre Clé"] || row["lettreCle"] || "");

            const coefficient = cleanNumber(row.coefficient || row["Coefficient"] || row["coefficient"]);
            const prixClinique = cleanNumber(row.prixClinique || row["Prix Clinique"] || row["prixClinique"]);
            const prixMutuel = cleanNumber(row.prixMutuel || row["Prix Mutuel"] || row["prixMutuel"]);
            const prixPreferentiel = cleanNumber(
                row.prixPreferentiel || row["Prix Préférentiel"] || row["prixPreferentiel"]
            );
            
            // Gestion optionnelle des champs supplémentaires (uniquement si présents dans le fichier)
            const MontantAuMed = cleanNumber(row.MontantAuMed || row["Montant Au Med"] || row["Acte pour Médecin ?"] || "");
            const MontantAnesthesiste = cleanNumber(row.MontantAnesthesiste || row["Montant Anesthésique"] || "");
            const MontantAideOperatoire = cleanNumber(row.MontantAideOperatoire || row["Montant Aide Opératoire"] || "");
            
            // Gestion optionnelle du champ consultationviste
            let consultationviste = false;
            if (row.consultationviste || row["Consultation ou visite"]) {
                const consultationValue = row.consultationviste || row["Consultation ou visite"];
                if (typeof consultationValue === "boolean") {
                    consultationviste = consultationValue;
                } else if (typeof consultationValue === "string") {
                    const cleanValue = consultationValue.toString().toLowerCase().trim();
                    consultationviste = ["true", "1", "oui", "yes", "on"].includes(cleanValue);
                }
            }

            let rowError = "";
            
            // Validation des champs obligatoires
            if (!designationacte || designationacte.length === 0) {
                rowError += "Champ 'designationacte' manquant ou vide. ";
            } else if (designationacte.length > 200) {
                rowError += "Champ 'designationacte' trop long (max 200 caractères). ";
            }
            
            if (!lettreCle || lettreCle.length === 0) {
                rowError += "Champ 'lettreCle' manquant ou vide. ";
            } else if (lettreCle.length > 10) {
                rowError += "Champ 'lettreCle' trop long (max 10 caractères). ";
            }
            
            // Validation des nombres avec plages raisonnables
            if (isNaN(coefficient) || coefficient < 0 || coefficient > 999) {
                rowError += "Champ 'coefficient' invalide (doit être entre 0 et 999). ";
            }
            if (isNaN(prixClinique) || prixClinique < 0 || prixClinique > 999999) {
                rowError += "Champ 'prixClinique' invalide (doit être entre 0 et 999999). ";
            }
            if (isNaN(prixMutuel) || prixMutuel < 0 || prixMutuel > 999999) {
                rowError += "Champ 'prixMutuel' invalide (doit être entre 0 et 999999). ";
            }
            if (isNaN(prixPreferentiel) || prixPreferentiel < 0 || prixPreferentiel > 999999) {
                rowError += "Champ 'prixPreferentiel' invalide (doit être entre 0 et 999999). ";
            }

            if (rowError) errors.push({ index: i + 2, message: rowError.trim() });

            const acteData: any = {
                designationacte,
                lettreCle,
                coefficient,
                prixClinique,
                prixMutuel,
                prixPreferentiel,
            };

            // N'inclure les champs optionnels que s'ils ont des valeurs valides
            if (MontantAuMed > 0) acteData.MontantAuMed = MontantAuMed;
            if (MontantAnesthesiste > 0) acteData.MontantAnesthesiste = MontantAnesthesiste;
            if (MontantAideOperatoire > 0) acteData.MontantAideOperatoire = MontantAideOperatoire;
            if (consultationviste) acteData.consultationviste = consultationviste;

            return acteData;
        });

        // On garde uniquement les lignes valides
        const validActes = actes.filter((a, i) => !errors.find(e => e.index === i + 2));

        if (validActes.length === 0) {
            return NextResponse.json({ error: "Aucune donnée valide à importer.", details: errors }, { status: 400 });
        }

        // Vérification des doublons déjà en base
        const existing = await ActeClinique.find({
            designationacte: { $in: validActes.map(a => a.designationacte) },
        }).lean();

        const existingDesignations = new Set(existing.map((a: any) => a.designationacte));
        const toInsert: any[] = [];
        const toUpdate: any[] = [];

        validActes.forEach((a, i) => {
            if (existingDesignations.has(a.designationacte)) {
                if (overwriteDuplicates) {
                    // Préparer pour mise à jour
                    const existingActe = existing.find(e => e.designationacte === a.designationacte);
                    if (existingActe) {
                        toUpdate.push({ ...a, _id: existingActe._id });
                    }
                } else {
                    // Marquer comme doublon
                    errors.push({ index: i + 2, message: `Désignation '${a.designationacte}' déjà existante.` });
                }
            } else {
                toInsert.push(a);
            }
        });

        let inserted: any[] = [];
        let updated: any[] = [];

        // Insérer les nouveaux actes
        if (toInsert.length > 0) {
            inserted = await ActeClinique.insertMany(toInsert);
        }

        // Mettre à jour les doublons si demandé (optimisation avec bulkWrite)
        if (toUpdate.length > 0 && overwriteDuplicates) {
            const bulkOps = toUpdate.map(acte => ({
                updateOne: {
                    filter: { _id: acte._id },
                    update: { 
                        $set: { ...acte, updatedAt: new Date() },
                        $unset: { _id: 1 } // Ne pas essayer de mettre à jour l'_id
                    },
                    upsert: false
                }
            }));
            
            const updateResult = await ActeClinique.bulkWrite(bulkOps);
            updated = await ActeClinique.find({ 
                _id: { $in: toUpdate.map(a => a._id) }
            }).lean();
        }

        // Retirer les doublons comme tarif acte si demandé (optimisation avec bulk delete)
        let removedTarifsCount = 0;
        if (removeDuplicatesAsTarif && existing.length > 0) {
            // Récupérer tous les actes qui existent déjà et qui sont dans les doublons
            const duplicateActes = existing.filter(e => 
                validActes.some(a => a.designationacte === e.designationacte)
            );
            
            if (duplicateActes.length > 0) {
                // Supprimer tous les tarifs associés en une seule opération
                const deleteResult = await TarifAssurance.deleteMany({ 
                    acteId: { $in: duplicateActes.map(a => a._id) }
                });
                removedTarifsCount = deleteResult.deletedCount || 0;
                
                console.log(`Retrait de ${removedTarifsCount} tarifs pour ${duplicateActes.length} actes en doublon`);
            }
        }

        if (inserted.length === 0 && updated.length === 0) {
            return NextResponse.json({ 
                error: "Aucun acte inséré ou mis à jour.", 
                details: errors,
                suggestion: "Essayez avec l'option overwriteDuplicates: true pour écraser les doublons ou removeDuplicatesAsTarif: true pour retirer les tarifs des doublons"
            }, { status: 409 });
        }

        console.log("POST /api/actes/import - Importation réussie:", { 
            inserted: inserted.length, 
            updated: updated.length,
            ignored: validActes.length - toInsert.length - updated.length,
            removedTarifs: removedTarifsCount,
            errors: errors.length 
        });

        return NextResponse.json({
            success: true,
            inserted: inserted.length,
            updated: updated.length,
            ignored: validActes.length - toInsert.length - updated.length,
            removedTarifs: removedTarifsCount,
            errors,
            overwriteDuplicates,
            removeDuplicatesAsTarif,
        });
    } catch (e: any) {
        console.error("POST /api/actes/import - Erreur:", e.message);
        console.error("POST /api/actes/import - Détails:", e);
        
        if (e.code === 11000) {
            return NextResponse.json(
                { error: "Doublon détecté dans la base de données.", details: e.keyValue },
                { status: 409 }
            );
        }
        
        if (e.name === 'ValidationError') {
            const errors = Object.values(e.errors).map((err: any) => err.message).join(', ');
            return NextResponse.json({ error: `Erreur de validation: ${errors}` }, { status: 400 });
        }
        
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
