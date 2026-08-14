"use client";

import { Badge } from "react-bootstrap";
import { LICENCE_MODULES } from "@/lib/licenceModules";
import { LicenceModuleCode } from "@/lib/licenceModules";

interface ModuleLabelsProps {
  modules?: LicenceModuleCode[];
  max?: number;
}

export default function ModuleLabels({ modules, max = 4 }: ModuleLabelsProps) {
  if (!modules || modules.length === 0) {
    return <span className="text-muted">Aucun</span>;
  }

  const labels = modules
    .map((code) => LICENCE_MODULES.find((m) => m.code === code)?.label || code)
    .slice(0, max);

  const remaining = modules.length - max;

  return (
    <div className="d-flex flex-wrap gap-1">
      {labels.map((label) => (
        <Badge key={label} bg="light" text="dark" className="border">
          {label}
        </Badge>
      ))}
      {remaining > 0 && (
        <Badge bg="secondary">+{remaining}</Badge>
      )}
    </div>
  );
}
