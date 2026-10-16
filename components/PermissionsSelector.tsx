"use client";

import { LICENCE_MODULES, LicenceModuleCode, ALL_MODULE_CODES } from "@/lib/licenceModules";
import { PERMISSION_ACTIONS, ROLE_SERVICES, ROLE_ACTIONS } from "@/lib/permissions";

interface PermissionsSelectorProps {
  services: string[];
  actions: string[];
  onChange: (next: { services: string[]; actions: string[] }) => void;
  /**
   * Modules proposables (licence du tenant). Par défaut : tous les modules.
   */
  availableModules?: LicenceModuleCode[];
  disabled?: boolean;
  /** Rôle sélectionné : permet le bouton de réinitialisation aux défauts. */
  role?: string;
  /** Vrai si une personnalisation est en cours (non affiché si fourni). */
  onResetToDefaults?: () => void;
}

/**
 * Valeurs par défaut à pré-cocher pour un rôle donné, filtrées sur les
 * modules disponibles.
 */
export function defaultPermissionsForRole(
  type: string,
  availableModules?: LicenceModuleCode[]
): { services: string[]; actions: string[] } {
  const allowed = new Set<string>(availableModules || ALL_MODULE_CODES);
  const services = (ROLE_SERVICES[type] || []).filter((s) => allowed.has(s));
  const actions = (ROLE_ACTIONS[type] || []).filter((a) => a !== "*");
  return { services, actions };
}

/**
 * Sélecteur de permissions personnalisées : services accessibles (modules du
 * tenant) + actions sensibles autorisées. Les actions ne sont affichées que
 * si au moins un de leurs modules associés est disponible.
 */
export default function PermissionsSelector({
  services,
  actions,
  onChange,
  availableModules,
  disabled,
  role,
  onResetToDefaults,
}: PermissionsSelectorProps) {
  const available = new Set<string>(
    availableModules && availableModules.length > 0
      ? availableModules.filter((m) => ALL_MODULE_CODES.includes(m))
      : ALL_MODULE_CODES
  );
  // Si après filtrage il ne reste aucun module connu, on affiche tout le
  // catalogue plutôt qu'une section vide (cohérent avec le serveur).
  if (available.size === 0) ALL_MODULE_CODES.forEach((m) => available.add(m));

  const resetToRoleDefaults = () => {
    if (onResetToDefaults) {
      onResetToDefaults();
      return;
    }
    const defaults = defaultPermissionsForRole(role || "", availableModules);
    onChange({ services: defaults.services, actions: defaults.actions });
  };

  const visibleModules = LICENCE_MODULES.filter((m) => available.has(m.code));
  const visibleActions = PERMISSION_ACTIONS.filter(
    (a) => a.modules.length === 0 || a.modules.some((m) => available.has(m))
  );

  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  return (
    <div className="border rounded p-3 bg-light-subtle">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <span className="form-text mb-0">
          Personnalisez les droits de cet utilisateur.
        </span>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          disabled={disabled}
          onClick={resetToRoleDefaults}
          title="Revenir aux droits par défaut du rôle"
        >
          <i className="bi bi-arrow-counterclockwise me-1"></i>
          Réinitialiser aux droits du rôle
        </button>
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold mb-1">
          <i className="bi bi-grid-3x3-gap me-1"></i>
          Services accessibles
        </label>
        <div className="form-text mb-2">
          Sections de l&apos;application que cet utilisateur pourra ouvrir.
        </div>
        <div className="row g-1">
          {visibleModules.map((m) => (
            <div className="col-md-6" key={m.code}>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={`svc-${m.code}`}
                  checked={services.includes(m.code)}
                  disabled={disabled}
                  onChange={() =>
                    onChange({ services: toggle(services, m.code), actions })
                  }
                />
                <label className="form-check-label" htmlFor={`svc-${m.code}`}>
                  {m.label}
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="form-label fw-semibold mb-1">
          <i className="bi bi-key me-1"></i>
          Actions autorisées
        </label>
        <div className="form-text mb-2">
          Actions sensibles supplémentaires (paramétrage, annulations...).
        </div>
        {visibleActions.map((a) => (
          <div className="form-check" key={a.code}>
            <input
              className="form-check-input"
              type="checkbox"
              id={`act-${a.code}`}
              checked={actions.includes(a.code)}
              disabled={disabled}
              onChange={() =>
                onChange({ services, actions: toggle(actions, a.code) })
              }
            />
            <label className="form-check-label" htmlFor={`act-${a.code}`}>
              {a.label}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
