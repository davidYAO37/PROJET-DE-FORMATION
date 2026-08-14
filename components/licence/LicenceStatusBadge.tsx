"use client";

import { Badge } from "react-bootstrap";
import { Entreprise } from "@/types/entreprise";

interface LicenceStatusBadgeProps {
  entreprise: Entreprise;
}

export default function LicenceStatusBadge({ entreprise }: LicenceStatusBadgeProps) {
  const today = new Date();
  const endDate = entreprise.licenceEndDate
    ? new Date(entreprise.licenceEndDate)
    : null;

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
    if (endDate && endDate < today) {
      return <Badge bg="danger">Essai expiré</Badge>;
    }
    return <Badge bg="info">Essai</Badge>;
  }

  if (entreprise.licenceType === "maintenance_overdue") {
    return <Badge bg="warning" text="dark">Maintenance en retard</Badge>;
  }

  if (endDate && endDate < today) {
    return <Badge bg="danger">Expirée</Badge>;
  }

  return <Badge bg="success">Active</Badge>;
}
