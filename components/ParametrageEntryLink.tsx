"use client";

import Link from "next/link";
import { useAuthUser } from "@/hooks/useAuthUser";
import { ALL_ACTION_CODES } from "@/lib/permissions";

/**
 * Lien "Paramétrage" affiché dans les sidebars de service pour les
 * utilisateurs non-admin ayant au moins une action sensible autorisée.
 * Pointe vers /dashboard, dont la sidebar filtre les liens par action.
 */
export default function ParametrageEntryLink({ className }: { className?: string }) {
  const { user, loading } = useAuthUser();

  if (loading || !user) return null;
  if (user.type === "admin" || user.type === "adminsuper") return null;

  const actions = user.permissions?.actions || [];
  const hasAnyAction =
    actions.includes("*") || ALL_ACTION_CODES.some((a) => actions.includes(a));
  if (!hasAnyAction) return null;

  return (
    <Link
      href="/dashboard"
      className={className || "sidebar-link-medical d-flex align-items-center"}
    >
      <i className="bi bi-gear-fill me-2 text-dark"></i>
      <span>Paramétrage</span>
    </Link>
  );
}
