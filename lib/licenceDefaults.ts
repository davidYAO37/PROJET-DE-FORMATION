import { ALL_MODULE_CODES } from "@/lib/licenceModules";

export const DEFAULT_LICENCE_PLANS = [
  {
    code: "trial",
    name: "Période d'essai",
    description: "Essai gratuit avec tous les modules activés. La durée est gérée en jours côté API.",
    durationMonths: 1,
    defaultModules: [...ALL_MODULE_CODES],
    defaultPrice: 0,
    currency: "XOF",
    isActive: true,
    allowModuleSelection: false,
  },
  {
    code: "annual",
    name: "Licence annuelle complète",
    description: "Tous les modules inclus, maintenance annuelle comprise la première année.",
    durationMonths: 12,
    defaultModules: [...ALL_MODULE_CODES],
    defaultPrice: 100000,
    currency: "XOF",
    isActive: true,
    allowModuleSelection: false,
  },
  {
    code: "custom",
    name: "Licence personnalisée",
    description: "Modules sélectionnés par l'administrateur.",
    durationMonths: 12,
    defaultModules: [...ALL_MODULE_CODES],
    defaultPrice: 0,
    currency: "XOF",
    isActive: true,
    allowModuleSelection: true,
  },
] as const;
