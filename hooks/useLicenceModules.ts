"use client";

import { useEffect, useState } from "react";
import { LicenceModuleCode } from "@/lib/licenceModules";

interface LicenceStatusResponse {
  isBlocked: boolean;
  modules: string[];
}

export function useLicenceModules() {
  const [modules, setModules] = useState<LicenceModuleCode[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/licence/status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: LicenceStatusResponse | null) => {
        if (data && !data.isBlocked) {
          setModules(
            (data.modules as LicenceModuleCode[]) || []
          );
        } else {
          setModules([]);
        }
      })
      .catch(() => setModules([]))
      .finally(() => setLoading(false));
  }, []);

  const hasModule = (code: LicenceModuleCode): boolean => {
    if (loading || modules === null) return true; // pendant le chargement, autoriser
    if (modules.length === 0) return true; // compatibilité : aucun module défini = tout autorisé
    return modules.includes(code);
  };

  return { modules, loading, hasModule };
}
