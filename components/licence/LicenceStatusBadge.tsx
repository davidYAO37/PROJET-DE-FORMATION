"use client";

import { Badge } from "react-bootstrap";
import { Entreprise } from "@/types/entreprise";

interface LicenceStatusBadgeProps {
  entreprise: Entreprise;
}

export default function LicenceStatusBadge({ entreprise }: LicenceStatusBadgeProps) {
  const today = new Date();

  if (entreprise.licenceStatus === "resiliated" || entreprise.statut === "resiliee") {
    return <Badge bg="dark">Résiliée</Badge>;
  }

  if (entreprise.licenceStatus === "suspended" || entreprise.statut === "suspendue") {
    return <Badge bg="danger">Suspendue</Badge>;
  }

  if (!entreprise.licenceType) {
    return <Badge bg="secondary">Non activée</Badge>;
  }

  if (entreprise.licenceType === "trial") {
    const trialEnd = entreprise.licenceEndDate ? new Date(entreprise.licenceEndDate) : null;
    if (trialEnd && trialEnd < today) {
      return <Badge bg="danger">Essai expiré</Badge>;
    }
    return <Badge bg="info">Essai</Badge>;
  }

  // Licence perpétuelle achetée : le seul motif de blocage possible est la maintenance
  // expirée (si l'entreprise l'a acceptée).
  if (entreprise.maintenanceAccepted) {
    const maintenanceDue = entreprise.maintenanceDueDate ? new Date(entreprise.maintenanceDueDate) : null;
    if (maintenanceDue && maintenanceDue < today) {
      return <Badge bg="warning" text="dark">Maintenance expirée</Badge>;
    }
  }

  return <Badge bg="success">Active (perpétuelle)</Badge>;
}
