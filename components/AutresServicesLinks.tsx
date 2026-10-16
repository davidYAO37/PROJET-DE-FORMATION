"use client";

import Link from "next/link";
import { useAuthUser } from "@/hooks/useAuthUser";
import { getUserPermissions, SERVICE_HOME } from "@/lib/permissions";
import { LICENCE_MODULES } from "@/lib/licenceModules";

/**
 * Liens vers les autres services autorisés d'un utilisateur multi-services.
 * - Masqué pour admin / adminsuper (accès complet via le dashboard).
 * - N'affiche que les services en plus des défauts du rôle et du service
 *   courant (ex. un "accueil" personnalisé avec [medecin, pharmacie] voit
 *   des liens vers ces deux services ; un "accueil-caisse" standard ne voit
 *   rien car il a déjà ses boutons de switch).
 */
export default function AutresServicesLinks({ current }: { current: string[] }) {
  const { user, loading } = useAuthUser();

  if (loading || !user) return null;
  if (user.type === "admin" || user.type === "adminsuper") return null;

  const { services } = getUserPermissions(user);
  // Services déjà accessibles via les boutons de switch dédiés
  // (rôle combiné accueil-caisse) : pas de lien en double.
  const coveredByButtons = user.type === "accueil-caisse" ? ["accueil", "caisse"] : [];
  const extra = services.filter(
    (s) =>
      !current.includes(s) && !coveredByButtons.includes(s) && SERVICE_HOME[s]
  );
  if (extra.length === 0) return null;

  return (
    <>
      <div className="text-white-50 small mb-1 mt-2">
        <i className="bi bi-grid me-1"></i>
        Mes autres services
      </div>
      {extra.map((s) => {
        const label = LICENCE_MODULES.find((m) => m.code === s)?.label || s;
        return (
          <Link
            key={s}
            href={SERVICE_HOME[s]}
            className="sidebar-link-medical d-flex align-items-center mb-2"
          >
            <i className="bi bi-box-arrow-in-right me-2 text-success"></i>
            <span>{label}</span>
          </Link>
        );
      })}
    </>
  );
}
