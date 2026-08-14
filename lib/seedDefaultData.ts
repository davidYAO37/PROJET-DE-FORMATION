import { Connection } from "mongoose";
import { getTenantModel } from "./tenantModels";

export interface SeedResult {
  model: string;
  copied: number;
  error?: string;
}

// Données par défaut injectées si la collection est vide,
// équivalent WinDev : "SI HNbEnr(Table)=0 ALORS ... HAjoute(...)"

const now = new Date();
const heureActuelle = `${String(now.getHours()).padStart(2, "0")}:${String(
  now.getMinutes()
).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

const DEFAULT_PARAMETRE_CRENDU = [
  {
    LettreCle: "Z",
    Date: now,
    HeureAjoute: heureActuelle,
    AjouterPar: "Admin",
  },
  {
    LettreCle: "KC",
    Date: now,
    HeureAjoute: heureActuelle,
    AjouterPar: "Admin",
  },
    {
    LettreCle: "K",
    Date: now,
    HeureAjoute: heureActuelle,
    AjouterPar: "Admin",
  },
];

const DEFAULT_PARAMETRE_NFS = [
  { PARAMETRE: "WBC", DESCRIPTION: "GLOABULES BLANCS (GB)" },
  { PARAMETRE: "RBC", DESCRIPTION: "GLOBULES ROUGES (GR)" },
  { PARAMETRE: "HGB", DESCRIPTION: "Hémoglobine (HB)" },
  { PARAMETRE: "HCT", DESCRIPTION: "Hématocrite" },
  { PARAMETRE: "MCV", DESCRIPTION: "VGM" },
  { PARAMETRE: "MCH", DESCRIPTION: "TCMH" },
  { PARAMETRE: "MCHC", DESCRIPTION: "CCMH" },
  { PARAMETRE: "PLT", DESCRIPTION: "PLAQUETTES" },
  { PARAMETRE: "NEU%", DESCRIPTION: "Polynucléaires neutrophiles" },
  { PARAMETRE: "NEU#", DESCRIPTION: "Polynucléaires neutrophiles" },
  { PARAMETRE: "LYM%", DESCRIPTION: "Lymphocytes" },
  { PARAMETRE: "LYM#", DESCRIPTION: "Lymphocytes" },
  { PARAMETRE: "MON%", DESCRIPTION: "Monocytes" },
  { PARAMETRE: "MON#", DESCRIPTION: "Monocytes" },
  { PARAMETRE: "EOS%", DESCRIPTION: "Polynucléaires éosinophiles" },
  { PARAMETRE: "EOS#", DESCRIPTION: "Polynucléaires éosinophiles" },
  { PARAMETRE: "BAS%", DESCRIPTION: "Polynucléaires Basophiles" },
  { PARAMETRE: "BAS#", DESCRIPTION: "Polynucléaires Basophiles" },
];

const DEFAULT_ASSURANCES = [
  {
    designationassurance: "NON ASSURE",
    codeassurance: "NON-ASSURE",
    telephone: "",
    email: "",
    NCC: "",
  },
];

const DEFAULT_OPERATIONS = [
  {
    Libeleo: "Paiement Honoraire",
    TYPEOP: "Sortie de caisse",
  },
];

const DEFAULT_TYPES_ACTE = [
  { Designation: "EXAMEN BIOLOGIQUE" },
  { Designation: "ACTE DE RADIOLOGIE" },
  { Designation: "HOSPITALISATION" },
  { Designation: "ACTE DE CHIRURGIE" },
  { Designation: "ACTE DE BIOPSIE" },
  { Designation: "ACCOUCHEMENT" },
  { Designation: "MATERNITE" },
  { Designation: "ACTES SPECIALISES" },
  { Designation: "AUXILIAIRES MEDICAUX" },
  { Designation: "HONORAIRES MEDICAUX" },
  { Designation: "PEDIATRIE /NEONAT" },
  { Designation: "TRAITEMENT PREVENTIF" },
  { Designation: "REANIMATION" },
  { Designation: "DENTISTERIE" },
  { Designation: "OPHTALMOLOGIE" },
  { Designation: "TRANSPORT MEDICALISE" },
  { Designation: "EXPLORATIONS FONCTIONNELLES" },
];

const DEFAULT_MODES_PAIEMENT = [
  { Modepaiement: "Espèce" },
  { Modepaiement: "Chèque" },
  { Modepaiement: "Carte de crédit" },
  { Modepaiement: "Caution" },
];

interface DefaultSeedConfig {
  modelName: string;
  docs: Record<string, unknown>[];
}

const DEFAULT_MODELS: DefaultSeedConfig[] = [
  { modelName: "ParametreCRendu", docs: DEFAULT_PARAMETRE_CRENDU },
  { modelName: "ParametreNfs", docs: DEFAULT_PARAMETRE_NFS },
  { modelName: "Assurance", docs: DEFAULT_ASSURANCES },
  { modelName: "Operation", docs: DEFAULT_OPERATIONS },
  { modelName: "TypeActe", docs: DEFAULT_TYPES_ACTE },
  { modelName: "ModeDePaiement", docs: DEFAULT_MODES_PAIEMENT },
];

/**
 * Injecte les données par défaut (style WinDev "ajoute si vide")
 * dans la connexion fournie (principale ou tenant).
 * Vérifie uniquement le compte sans mapping de champs : les noms de champs
 * utilisés sont ceux définis dans les modèles Mongoose.
 */
export async function seedDefaultDataForConnection(
  connection: Connection
): Promise<SeedResult[]> {
  const results: SeedResult[] = [];

  for (const { modelName, docs } of DEFAULT_MODELS) {
    try {
      const Model = getTenantModel(connection, modelName);
      const count = await Model.countDocuments();

      if (count === 0) {
        const insertedDocs = await Model.insertMany(docs, { ordered: false });
        results.push({ model: modelName, copied: insertedDocs.length });
      } else {
        results.push({ model: modelName, copied: 0 });
      }
    } catch (error) {
      console.error(`Erreur seed par défaut pour ${modelName}:`, error);
      results.push({
        model: modelName,
        copied: 0,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }

  return results;
}
