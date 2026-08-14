export const LICENCE_MODULES = [
  { code: "accueil", label: "Accueil / Patients", servicePath: "/pages/serviceaccueil" },
  { code: "medecin", label: "Médecin / Consultation", servicePath: "/pages/servicemedecin" },
  { code: "infirmier", label: "Infirmier / Soins", servicePath: "/pages/serviceinfirmier" },
  { code: "laboratoire", label: "Laboratoire", servicePath: "/pages/servicelaboratoire" },
  { code: "biologiste", label: "Biologiste", servicePath: "/pages/servicebiologiste" },
  { code: "radio", label: "Radio / Imagerie", servicePath: "/pages/serviceradio" },
  { code: "pharmacie", label: "Pharmacie", servicePath: "/pages/servicepharmacie" },
  { code: "caisse", label: "Caisse", servicePath: "/pages/servicecaisse" },
  { code: "facturation", label: "Facturation", servicePath: "/pages/servicefacturation" },
  { code: "comptabilite", label: "Comptabilité", servicePath: "/pages/servicecomptabilite" },
  { code: "hospitalisation", label: "Hospitalisation", servicePath: "/pages/examenhospitalisation" },
  { code: "operation", label: "Paramétrage opération", servicePath: "/pages/parametrageoperation" },
  { code: "impressions", label: "Impressions", servicePath: "/pages/MesImpressions" },
] as const;

export type LicenceModuleCode = (typeof LICENCE_MODULES)[number]["code"];

export const ALL_MODULE_CODES: LicenceModuleCode[] = LICENCE_MODULES.map((m) => m.code);
