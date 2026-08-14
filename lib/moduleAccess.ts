import { IEntreprise } from "@/models/entreprise";
import { LicenceModuleCode, ALL_MODULE_CODES } from "@/lib/licenceModules";
import { getLicenceStatus } from "@/lib/licence";

export function hasModuleAccess(
  entreprise: IEntreprise | null | undefined,
  moduleCode: LicenceModuleCode
): boolean {
  if (!entreprise) return false;

  const status = getLicenceStatus(entreprise);
  if (status.isBlocked) return false;

  // Si aucun module n'est défini, on autorise tout (compatibilité anciennes entreprises)
  if (!entreprise.modules || entreprise.modules.length === 0) {
    return true;
  }

  return entreprise.modules.includes(moduleCode);
}

export function getAccessibleModules(
  entreprise: IEntreprise | null | undefined
): LicenceModuleCode[] {
  if (!entreprise) return [];

  const status = getLicenceStatus(entreprise);
  if (status.isBlocked) return [];

  if (!entreprise.modules || entreprise.modules.length === 0) {
    return [...ALL_MODULE_CODES];
  }

  return entreprise.modules.filter((m): m is LicenceModuleCode =>
    ALL_MODULE_CODES.includes(m as LicenceModuleCode)
  );
}

export function requireModuleAccess(
  entreprise: IEntreprise | null | undefined,
  moduleCode: LicenceModuleCode
): void {
  if (!hasModuleAccess(entreprise, moduleCode)) {
    throw new Error(`Module ${moduleCode} non inclus dans la licence`);
  }
}
