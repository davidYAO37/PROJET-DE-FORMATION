import { ALL_MODULE_CODES, LicenceModuleCode } from "@/lib/licenceModules";
import { COMBINED_ROLES } from "@/lib/roleUtils";

/**
 * Système de permissions personnalisées.
 *
 * Le champ `type` (rôle) reste la base : il détermine les services et actions
 * par défaut. Un admin peut ensuite personnaliser, par utilisateur, la liste
 * des services accessibles (modules de licence du tenant) et des actions
 * sensibles autorisées (paramétrage, annulations, exports...).
 *
 * Règle de résolution :
 * - `permissions.customized === true` → les listes stockées sont utilisées telles quelles.
 * - Sinon → les valeurs par défaut du rôle sont utilisées.
 * - `adminsuper` / `admin` gardent un accès complet (action "*" = tout).
 */

export interface StoredPermissions {
  services?: string[];
  actions?: string[];
  customized?: boolean;
}

export interface ResolvedPermissions {
  services: LicenceModuleCode[];
  actions: string[];
  customized: boolean;
}

/** Catalogue des actions sensibles attribuables individuellement. */
export const PERMISSION_ACTIONS = [
  {
    code: "parametrage_actes_clinique",
    label: "Paramétrer les actes cliniques",
    modules: ["medecin", "accueil"],
  },
  {
    code: "parametrage_actes_biologie",
    label: "Paramétrer les actes de biologie",
    modules: ["biologiste", "laboratoire"],
  },
  {
    code: "parametrage_actes_radio",
    label: "Paramétrer les actes de radiologie",
    modules: ["radio"],
  },
  {
    code: "parametrage_medecins",
    label: "Gérer les fiches médecins",
    modules: ["medecin", "accueil"],
  },
  {
    code: "parametrage_assurances",
    label: "Gérer les assurances et sociétés partenaires",
    modules: ["accueil", "facturation", "comptabilite"],
  },
  {
    code: "parametrage_pharmacie",
    label: "Paramétrer la pharmacie (produits, stock)",
    modules: ["pharmacie"],
  },
  {
    code: "annulation_encaissement",
    label: "Annuler un encaissement",
    modules: ["caisse"],
  },
  {
    code: "reduction_facture",
    label: "Appliquer des réductions sur les factures",
    modules: ["caisse", "facturation"],
  },
  {
    code: "parametrage_general",
    label: "Paramétrages divers (chambres, infirmiers, modes de paiement...)",
    modules: [],
  },
  {
    code: "export_comptable",
    label: "Exports et impressions comptables",
    modules: ["comptabilite", "facturation"],
  },
  {
    code: "gestion_utilisateurs",
    label: "Gérer les utilisateurs de l'entreprise",
    modules: [],
  },
] as const;

export type PermissionActionCode = (typeof PERMISSION_ACTIONS)[number]["code"];

export const ALL_ACTION_CODES: string[] = PERMISSION_ACTIONS.map((a) => a.code);

/**
 * Services (modules de licence) auxquels chaque rôle donne accès par défaut.
 * "admin" est exclu volontairement des vérifications par service (il passe
 * déjà par son rôle) mais listé ici pour pré-remplir les formulaires.
 */
export const ROLE_SERVICES: Record<string, LicenceModuleCode[]> = {
  admin: [...ALL_MODULE_CODES],
  adminsuper: [...ALL_MODULE_CODES],
  accueil: ["accueil"],
  caisse: ["caisse"],
  "accueil-caisse": ["accueil", "caisse"],
  medecin: ["medecin"],
  infirmier: ["infirmier"],
  pharmacien: ["pharmacie"],
  radiologue: ["radio"],
  biologiste: ["biologiste"],
  technicienlabo: ["laboratoire"],
  comptable: ["comptabilite"],
  facturation: ["facturation"],
};

/** Actions accordées par défaut à chaque rôle (hors personnalisation). */
export const ROLE_ACTIONS: Record<string, string[]> = {
  admin: ["*"],
  adminsuper: ["*"],
};

/** Page d'accueil par service, pour la redirection après connexion. */
export const SERVICE_HOME: Record<string, string> = {
  accueil: "/pages/serviceaccueil/tpatient",
  medecin: "/pages/servicemedecin/tmedecin",
  infirmier: "/pages/serviceinfirmier/tinfirmier",
  pharmacie: "/pages/servicepharmacie",
  radio: "/pages/serviceradio/tradio",
  biologiste: "/pages/servicebiologiste/tbiologiste",
  laboratoire: "/pages/servicelaboratoire/tlaboratoire",
  caisse: "/pages/servicecaisse/tcaisse",
  comptabilite: "/pages/servicecomptabilite/tcompta",
  facturation: "/pages/servicefacturation/tfacturation",
  hospitalisation: "/pages/examenhospitalisation",
  impressions: "/pages/MesImpressions",
  operation: "/pages/parametrageoperation",
};

interface PermissionUserLike {
  type?: string;
  permissions?: StoredPermissions | null;
}

/** Résout les permissions effectives d'un utilisateur (custom ou rôle). */
export function getUserPermissions(user: PermissionUserLike): ResolvedPermissions {
  const type = user?.type || "";
  const customized = user?.permissions?.customized === true;

  if (type === "adminsuper" || type === "admin") {
    return {
      services: [...ALL_MODULE_CODES],
      actions: ["*"],
      customized,
    };
  }

  const services = customized
    ? ((user.permissions?.services || []) as LicenceModuleCode[]).filter((s) =>
        ALL_MODULE_CODES.includes(s)
      )
    : ROLE_SERVICES[type] || [];

  const actions = customized
    ? (user.permissions?.actions || []).filter((a) => ALL_ACTION_CODES.includes(a))
    : ROLE_ACTIONS[type] || [];

  return { services, actions, customized };
}

export function hasServiceAccess(
  user: PermissionUserLike,
  service: LicenceModuleCode
): boolean {
  if (user?.type === "adminsuper" || user?.type === "admin") return true;
  return getUserPermissions(user).services.includes(service);
}

/** "*" signifie toutes les actions (admin). */
export function hasActionPermission(
  user: PermissionUserLike,
  action: string
): boolean {
  if (user?.type === "adminsuper") return true;
  const { actions } = getUserPermissions(user);
  return actions.includes("*") || actions.includes(action);
}

/**
 * Services correspondant à une liste de rôles autorisés.
 * Utilisé comme repli : si le `type` de l'utilisateur n'est pas dans
 * `allowedRoles`, on vérifie que ses services personnalisés couvrent au moins
 * un des services visés par ces rôles. "admin"/"adminsuper" sont exclus
 * (sinon ils couvriraient tout).
 */
export function servicesForRoles(roles?: string[]): LicenceModuleCode[] {
  if (!roles) return [];
  const expanded = new Set(roles);
  for (const [combined, bases] of Object.entries(COMBINED_ROLES)) {
    if (bases.some((b) => roles.includes(b))) expanded.add(combined);
  }
  const services = new Set<LicenceModuleCode>();
  for (const role of expanded) {
    if (role === "admin" || role === "adminsuper") continue;
    for (const s of ROLE_SERVICES[role] || []) services.add(s);
  }
  return Array.from(services);
}

/**
 * Vrai si l'utilisateur satisfait un contrôle d'accès par rôles, en tenant
 * compte du repli sur les services personnalisés.
 */
export function matchesAllowedRoles(
  user: PermissionUserLike,
  allowedRoles?: string[]
): boolean {
  if (!allowedRoles) return true;
  const type = user?.type || "";
  if (type === "adminsuper") return true;

  const expanded = new Set(allowedRoles);
  for (const [combined, bases] of Object.entries(COMBINED_ROLES)) {
    if (bases.some((b) => allowedRoles.includes(b))) expanded.add(combined);
  }
  if (expanded.has(type)) return true;

  // Repli : l'utilisateur passe si ses services couvrent ENTIÈREMENT les
  // services d'au moins un des rôles autorisés (ex. un utilisateur ayant
  // [accueil, caisse] couvre le rôle "accueil-caisse" ; un utilisateur ayant
  // seulement [caisse] ne le couvre pas).
  const { services } = getUserPermissions(user);
  for (const role of expanded) {
    if (role === "admin" || role === "adminsuper") continue;
    const needed = ROLE_SERVICES[role] || [];
    if (needed.length > 0 && needed.every((s) => services.includes(s))) return true;
  }
  return false;
}

/**
 * Valide et nettoie un objet `permissions` envoyé par le client.
 * - Les services sont limités aux modules de licence du tenant.
 * - Les actions sont limitées au catalogue.
 * Retourne null si le payload est malformé.
 */
export function sanitizePermissions(
  input: unknown,
  tenantModules?: string[] | null
): { services: string[]; actions: string[]; customized: boolean } | null {
  if (input == null) return null;
  if (typeof input !== "object") return null;

  const raw = input as { services?: unknown; actions?: unknown; customized?: unknown };

  // customized === false → retour aux droits par défaut du rôle
  if (raw.customized === false) {
    return { services: [], actions: [], customized: false };
  }

  const services = Array.isArray(raw.services) ? raw.services : [];
  const actions = Array.isArray(raw.actions) ? raw.actions : [];

  const allowedServices = new Set<string>(
    tenantModules && tenantModules.length > 0 ? tenantModules : ALL_MODULE_CODES
  );

  const cleanServices = services.filter(
    (s): s is string => typeof s === "string" && allowedServices.has(s)
  );
  const cleanActions = actions.filter(
    (a): a is string => typeof a === "string" && ALL_ACTION_CODES.includes(a)
  );

  return { services: cleanServices, actions: cleanActions, customized: true };
}
