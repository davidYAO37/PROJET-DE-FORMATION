import { getPrimaryConnection, getTenantConnection } from "./tenantDb";
import { getTenantModel } from "./tenantModels";

/**
 * Liste des modèles de paramétrage à copier depuis la base principale (bd_esaymed)
 * vers la base dédiée d'une nouvelle entreprise, à la création de celle-ci.
 * L'entreprise pourra ensuite librement modifier ces données via les pages
 * "Paramètres" existantes (CRUD par tenant).
 *
 * NB: "tarifassurance" est volontairement exclu (l'entreprise le configure elle-même).
 */
const SEED_MODEL_NAMES = [
  "ActeClinique",
  "TypeActe",
  "FamilleActe",
  "ModeDePaiement",
  "ParametreCRendu",
  "ParamLabo",
  "ParamBiochimie",
  "Affection",
  "Chambre",
  "Assurance",
  "SocietePartenaire",
  "Pharmacie",
  "ActeParamBiochimie",
  "ActeParamLabo",
] as const;

export interface SeedResult {
  model: string;
  copied: number;
  error?: string;
}

/**
 * Copie les données de paramétrage de bd_esaymed vers la base dédiée
 * de l'entreprise nouvellement créée. Les _id sont préservés afin de
 * conserver l'intégrité des références croisées entre modèles
 * (ex: ActeClinique.IDTYPE_ACTE -> TypeActe._id).
 */
export async function seedDefaultTenantData(
  entrepriseId: string
): Promise<SeedResult[]> {
  const sourceConnection = await getPrimaryConnection();
  const destConnection = await getTenantConnection(entrepriseId);

  if (destConnection === sourceConnection) {
    // L'entreprise partage la connexion principale (pas de base dédiée) : rien à copier.
    return [];
  }

  const results: SeedResult[] = [];

  for (const modelName of SEED_MODEL_NAMES) {
    try {
      const SourceModel = getTenantModel(sourceConnection, modelName);
      const DestModel = getTenantModel(destConnection, modelName);

      const sourceDocs = await SourceModel.find({}).lean();

      if (sourceDocs.length === 0) {
        results.push({ model: modelName, copied: 0 });
        continue;
      }

      const docsToInsert = sourceDocs.map((doc: any) => {
        const { entrepriseId: _ignored, ...rest } = doc;
        return rest;
      });

      const inserted = await DestModel.collection.insertMany(docsToInsert, {
        ordered: false,
      });

      results.push({ model: modelName, copied: inserted.insertedCount });
    } catch (error) {
      console.error(`Erreur lors de la copie du modèle ${modelName}:`, error);
      results.push({
        model: modelName,
        copied: 0,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }

  return results;
}
