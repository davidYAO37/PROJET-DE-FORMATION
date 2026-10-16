"use client";

import AccueilCaisseDashboard from "@/components/AccueilCaisseDashboard";
import LicenceModuleGuard from "@/components/licence/LicenceModuleGuard";

export default function TaccueilcaissePage() {
  return (
    <LicenceModuleGuard module="accueil">
      <AccueilCaisseDashboard />
    </LicenceModuleGuard>
  );
}
