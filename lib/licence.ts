import { createHmac } from "crypto";
import { IEntreprise } from "@/models/entreprise";

export const ALERT_THRESHOLDS_DAYS = [30, 15, 7, 1];

type LicenceStatusInput = {
  _id?: unknown;
  licenceType?: "trial" | "paid" | "maintenance_overdue";
  licenceStatus?: "active" | "suspended" | "resiliated";
  licenceEndDate?: Date | string | null;
  maintenanceDueDate?: Date | string | null;
  gracePeriodDays?: number | null;
  modules?: string[] | null;
  statut?: "active" | "suspendue" | "resiliee";
};

export type LicenceAlertLevel = "info" | "warning" | "danger";

export interface LicenceAlert {
  code: string;
  level: LicenceAlertLevel;
  message: string;
}

export interface LicenceStatusResult {
  effectiveStatus: "active" | "trial" | "expired" | "maintenance_overdue" | "suspended" | "resiliated";
  isBlocked: boolean;
  daysUntilExpiration: number | null;
  daysUntilMaintenance: number | null;
  alerts: LicenceAlert[];
}

function diffDays(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function generateLicenceKey(entreprise: IEntreprise | LicenceStatusInput): string {
  const secret = process.env.LICENCE_SECRET;
  if (!secret) {
    throw new Error("LICENCE_SECRET non configuré");
  }
  const endDate = entreprise.licenceEndDate
    ? new Date(entreprise.licenceEndDate)
    : undefined;
  const maintenanceDate = entreprise.maintenanceDueDate
    ? new Date(entreprise.maintenanceDueDate)
    : undefined;

  const payload = {
    id: entreprise._id?.toString?.() || String(entreprise._id),
    type: entreprise.licenceType,
    status: entreprise.licenceStatus,
    end: endDate?.toISOString(),
    maintenance: maintenanceDate?.toISOString(),
    modules: entreprise.modules,
  };
  const signature = createHmac("sha256", secret)
    .update(JSON.stringify(payload))
    .digest("hex");
  return Buffer.from(JSON.stringify({ ...payload, signature })).toString("base64url");
}

export function verifyLicenceKey(
  key: string,
  expected: Partial<IEntreprise>
): boolean {
  const secret = process.env.LICENCE_SECRET;
  if (!secret) return false;
  try {
    const decoded = Buffer.from(key, "base64url").toString("utf-8");
    const data = JSON.parse(decoded);
    if (!data.signature || !data.id) return false;

    const { signature, ...payload } = data;
    const expectedSignature = createHmac("sha256", secret)
      .update(JSON.stringify(payload))
      .digest("hex");
    if (signature !== expectedSignature) return false;

    if (expected._id && payload.id !== expected._id.toString()) return false;
    if (expected.licenceType && payload.type !== expected.licenceType) return false;
    if (expected.licenceStatus && payload.status !== expected.licenceStatus) return false;

    return true;
  } catch {
    return false;
  }
}

export function getLicenceStatus(entreprise: LicenceStatusInput): LicenceStatusResult {
  const now = startOfDay(new Date());
  const alerts: LicenceAlert[] = [];

  if (entreprise.licenceStatus === "resiliated") {
    return {
      effectiveStatus: "resiliated",
      isBlocked: true,
      daysUntilExpiration: null,
      daysUntilMaintenance: null,
      alerts: [
        {
          code: "LICENCE_RESILIATED",
          level: "danger",
          message: "Votre licence a été résiliée. Contactez l'administrateur.",
        },
      ],
    };
  }

  if (entreprise.licenceStatus === "suspended" || entreprise.statut === "suspendue") {
    return {
      effectiveStatus: "suspended",
      isBlocked: true,
      daysUntilExpiration: null,
      daysUntilMaintenance: null,
      alerts: [
        {
          code: "LICENCE_SUSPENDED",
          level: "danger",
          message: "Votre licence est suspendue. Contactez l'administrateur.",
        },
      ],
    };
  }

  const licenceEnd = entreprise.licenceEndDate
    ? startOfDay(new Date(entreprise.licenceEndDate))
    : null;
  const maintenanceDue = entreprise.maintenanceDueDate
    ? startOfDay(new Date(entreprise.maintenanceDueDate))
    : null;

  const daysUntilExpiration = licenceEnd ? diffDays(now, licenceEnd) : null;
  const daysUntilMaintenance = maintenanceDue ? diffDays(now, maintenanceDue) : null;

  // Maintenance obligatoire
  if (maintenanceDue && now > maintenanceDue) {
    const graceDays = entreprise.gracePeriodDays ?? 15;
    const daysOverdue = diffDays(maintenanceDue, now);
    if (daysOverdue > graceDays) {
      return {
        effectiveStatus: "maintenance_overdue",
        isBlocked: true,
        daysUntilExpiration,
        daysUntilMaintenance,
        alerts: [
          {
            code: "MAINTENANCE_OVERDUE_BLOCKED",
            level: "danger",
            message: `Votre maintenance annuelle est en retard de ${daysOverdue} jours. L'accès est bloqué.`,
          },
        ],
      };
    }
    alerts.push({
      code: "MAINTENANCE_OVERDUE_GRACE",
      level: "danger",
      message: `Votre maintenance annuelle est en retard de ${daysOverdue} jours. Régularisez sous ${graceDays - daysOverdue + 1} jours pour éviter le blocage.`,
    });
  }

  // Licence expirée
  if (licenceEnd && now > licenceEnd) {
    return {
      effectiveStatus: "expired",
      isBlocked: true,
      daysUntilExpiration,
      daysUntilMaintenance,
      alerts: [
        {
          code: "LICENCE_EXPIRED",
          level: "danger",
          message: "Votre licence a expiré. Renouvelez pour retrouver l'accès.",
        },
      ],
    };
  }

  // Alertes expiration
  if (daysUntilExpiration !== null && daysUntilExpiration >= 0) {
    if (ALERT_THRESHOLDS_DAYS.includes(daysUntilExpiration)) {
      const level: LicenceAlertLevel = daysUntilExpiration <= 7 ? "danger" : "warning";
      alerts.push({
        code: "LICENCE_EXPIRING_SOON",
        level,
        message:
          daysUntilExpiration === 1
            ? "Votre licence expire demain."
            : daysUntilExpiration === 0
            ? "Votre licence expire aujourd'hui."
            : `Votre licence expire dans ${daysUntilExpiration} jours.`,
      });
    } else if (entreprise.licenceType === "trial") {
      alerts.push({
        code: "TRIAL_ACTIVE",
        level: "info",
        message: `Vous êtes en période d'essai. ${daysUntilExpiration} jours restants.`,
      });
    }
  }

  // Alertes maintenance
  if (daysUntilMaintenance !== null && daysUntilMaintenance >= 0) {
    if (ALERT_THRESHOLDS_DAYS.includes(daysUntilMaintenance)) {
      const level: LicenceAlertLevel = daysUntilMaintenance <= 7 ? "danger" : "warning";
      alerts.push({
        code: "MAINTENANCE_DUE_SOON",
        level,
        message:
          daysUntilMaintenance === 1
            ? "La maintenance annuelle est due demain."
            : daysUntilMaintenance === 0
            ? "La maintenance annuelle est due aujourd'hui."
            : `La maintenance annuelle est due dans ${daysUntilMaintenance} jours.`,
      });
    }
  }

  // Licence payée active sans alerte critique
  if (entreprise.licenceType === "paid" && alerts.length === 0) {
    alerts.push({
      code: "LICENCE_ACTIVE",
      level: "info",
      message: `Votre licence est active jusqu'au ${licenceEnd?.toLocaleDateString("fr-FR")}.`,
    });
  }

  return {
    effectiveStatus:
      entreprise.licenceType === "trial"
        ? "trial"
        : entreprise.licenceType === "paid"
        ? "active"
        : "active",
    isBlocked: false,
    daysUntilExpiration,
    daysUntilMaintenance,
    alerts,
  };
}
