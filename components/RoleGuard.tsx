"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface RoleGuardProps {
  /** Types d'utilisateur autorisés pour cette section (en plus de "adminsuper", toujours autorisé). */
  allowedRoles: string[];
  children: React.ReactNode;
}

// Page d'accueil "naturelle" de chaque rôle, utilisée pour rediriger un
// utilisateur qui tape directement l'URL d'un service qui n'est pas le sien
// (ex: un utilisateur "caisse" qui navigue vers /pages/servicemedecin/...).
const ROLE_HOME: Record<string, string> = {
  admin: "/dashboard",
  adminsuper: "/dashboard",
  medecin: "/pages/servicemedecin/tmedecin",
  infirmier: "/pages/serviceinfirmier/tinfirmier",
  pharmacien: "/pages/servicepharmacie",
  radiologue: "/pages/serviceradio/tradio",
  biologiste: "/pages/servicebiologiste/tbiologiste",
  technicienlabo: "/pages/servicelaboratoire/tlaboratoire",
  caisse: "/pages/servicecaisse/tcaisse",
  comptable: "/pages/servicecomptabilite/tcompta",
  facturation: "/pages/servicefacturation/tfacturation",
  accueil: "/pages/serviceaccueil/tpatient",
};

/**
 * Vérifie que l'utilisateur connecté a le bon rôle pour accéder à cette
 * section de l'application. `Verifconnecion` (utilisé dans tous les layouts)
 * vérifie uniquement l'authentification, pas le rôle : sans ce garde, un
 * utilisateur "caisse" qui tape directement l'URL d'un autre service (ex:
 * /pages/servicemedecin/...) ou de /dashboard verrait le shell de cette
 * section s'afficher (menu, mise en page), même si les appels API sous-jacents
 * finissent par échouer selon leurs propres restrictions de rôle.
 */
export default function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const [status, setStatus] = useState<"loading" | "allowed" | "denied">("loading");
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    fetch("/api/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        const type = data?.user?.type;
        if (type && (type === "adminsuper" || allowedRoles.includes(type))) {
          setStatus("allowed");
        } else {
          setStatus("denied");
          const home = (type && ROLE_HOME[type]) || "/connexion";
          setTimeout(() => {
            if (!cancelled) router.replace(home);
          }, 1200);
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("denied");
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "loading") {
    return <div className="text-center p-5">Chargement...</div>;
  }

  if (status === "denied") {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "60vh" }}>
        <div className="alert alert-danger text-center">
          <strong>Accès non autorisé</strong>
          <div>Vous n&apos;avez pas le rôle requis pour accéder à cette section. Redirection...</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
