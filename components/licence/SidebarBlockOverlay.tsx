"use client";

import { useLicenceModules } from "@/hooks/useLicenceModules";
import { LicenceModuleCode } from "@/lib/licenceModules";

const BLOCK_MESSAGES: Record<string, string> = {
  expired: "Essai expiré — accès bloqué. Contactez l'administrateur.",
  suspended: "Licence suspendue — accès bloqué.",
  resiliated: "Licence résiliée — accès bloqué.",
  maintenance_overdue: "Maintenance échue — accès bloqué. Réglez la maintenance pour continuer.",
};

interface SidebarBlockOverlayProps {
  children: React.ReactNode;
  /**
   * Code du module de licence correspondant à ce portail (ex: "caisse",
   * "laboratoire"...). Si fourni, le menu est aussi grisé quand ce module
   * n'est pas inclus dans la licence de l'entreprise, même si la licence
   * elle-même n'est pas globalement bloquée.
   */
  module?: LicenceModuleCode;
}

/**
 * Grise le menu d'une sidebar de service (médecin, caisse, labo, pharmacie...)
 * quand l'entreprise est bloquée (essai expiré, suspension, résiliation,
 * maintenance impayée) OU quand le module de ce service n'est pas inclus
 * dans la licence souscrite par l'entreprise. Le contenu du service
 * lui-même est déjà protégé côté page par `LicenceModuleGuard` et côté API
 * par `requireAuth`/`withTenant` : ceci n'est qu'un signal visuel cohérent
 * au niveau de la sidebar, propre au tenant actuellement connecté (le
 * statut est résolu à partir de l'entreprise de l'utilisateur authentifié,
 * cf. `/api/licence/status`).
 */
export default function SidebarBlockOverlay({ children, module }: SidebarBlockOverlayProps) {
  const { isBlocked, effectiveStatus, loading, hasModule } = useLicenceModules();

  const moduleExcluded = !loading && module ? !hasModule(module) : false;

  if (loading || (!isBlocked && !moduleExcluded)) {
    return <>{children}</>;
  }

  const message = isBlocked
    ? (effectiveStatus && BLOCK_MESSAGES[effectiveStatus]) ||
      "Accès bloqué par votre licence. Contactez l'administrateur."
    : `Module (${module}) non inclus dans votre licence actuelle. Contactez l'administrateur.`;

  return (
    <div>
      <div
        className="px-3 py-2 mb-2 small text-danger d-flex align-items-center gap-1"
        title={message}
        style={{ lineHeight: 1.2 }}
      >
        <i className="bi bi-lock-fill"></i>
        <span>{message}</span>
      </div>
      <div className="opacity-50" style={{ pointerEvents: "none", userSelect: "none" }} aria-disabled="true">
        {children}
      </div>
    </div>
  );
}
