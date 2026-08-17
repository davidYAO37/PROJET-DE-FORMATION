"use client";

import { useEffect, useState } from "react";
import { LicenceModuleCode } from "@/lib/licenceModules";

interface LicenceStatusResponse {
  effectiveStatus: string;
  isBlocked: boolean;
  modules: string[];
}

export function useLicenceModules() {
  const [modules, setModules] = useState<LicenceModuleCode[] | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [effectiveStatus, setEffectiveStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/licence/status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: LicenceStatusResponse | null) => {
        if (data) {
          setModules((data.modules as LicenceModuleCode[]) || []);
          setIsBlocked(!!data.isBlocked);
          setEffectiveStatus(data.effectiveStatus || null);
        } else {
          setModules([]);
          setIsBlocked(false);
        }
      })
      .catch(() => setModules([]))
      .finally(() => setLoading(false));
  }, []);

  // Le module fait-il partie de la licence souscrite (indépendamment du blocage) ?
  const hasModule = (code: LicenceModuleCode): boolean => {
    if (loading || modules === null) return true; // pendant le chargement, autoriser
    if (modules.length === 0) return true; // compatibilité : aucun module défini = tout autorisé
    return modules.includes(code);
  };

  return { modules, loading, hasModule, isBlocked, effectiveStatus };
}
