import { createHmac } from "crypto";
import { IEntreprise } from "@/models/entreprise";

export const ALERT_THRESHOLDS_DAYS = [30, 15, 7, 1];

type LicenceStatusInput = {
  _id?: unknown;
  licenceType?: "trial" | "paid";
  licenceStatus?: "active" | "suspended" | "resiliated";
  // Date de fin d'essai uniquement (la licence achetée est perpétuelle, sans date de fin).
  licenceEndDate?: Date | string | null;
  // Interrupteur : l'entreprise a-t-elle accepté/souscrit la maintenance annuelle ?
  maintenanceAccepted?: boolean | null;
  // Date d'expiration de la maintenance en cours (pertinente uniquement si maintenanceAccepted).
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

  // ------------------------------------------------------------------
  // Cas 1 : licence en période d'essai — blocage uniquement à l'expiration
  // de l'essai (la licence n'a pas encore été achetée).
  // ------------------------------------------------------------------
  if (entreprise.licenceType === "trial") {
    const trialEnd = entreprise.licenceEndDate
      ? startOfDay(new Date(entreprise.licenceEndDate))
      : null;
    const daysUntilExpiration = trialEnd ? diffDays(now, trialEnd) : null;

    if (trialEnd && now > trialEnd) {
      return {
        effectiveStatus: "expired",
        isBlocked: true,
        daysUntilExpiration,
        daysUntilMaintenance: null,
        alerts: [
          {
            code: "TRIAL_EXPIRED",
            level: "danger",
            message: "Votre période d'essai a expiré. Contactez l'administrateur pour acheter votre licence.",
          },
        ],
      };
    }

    if (daysUntilExpiration !== null && ALERT_THRESHOLDS_DAYS.includes(daysUntilExpiration)) {
      const level: LicenceAlertLevel = daysUntilExpiration <= 7 ? "danger" : "warning";
      alerts.push({
        code: "TRIAL_EXPIRING_SOON",
        level,
        message:
          daysUntilExpiration === 1
            ? "Votre période d'essai expire demain."
            : daysUntilExpiration === 0
            ? "Votre période d'essai expire aujourd'hui."
            : `Votre période d'essai expire dans ${daysUntilExpiration} jours.`,
      });
    } else if (daysUntilExpiration !== null) {
      // 4.1 — message informatif : en essai
      alerts.push({
        code: "TRIAL_ACTIVE",
        level: "info",
        message: `Vous êtes en période d'essai. ${daysUntilExpiration} jour(s) restant(s).`,
      });
    }

    return {
      effectiveStatus: "trial",
      isBlocked: false,
      daysUntilExpiration,
      daysUntilMaintenance: null,
      alerts,
    };
  }

  // ------------------------------------------------------------------
  // Cas 2 : licence achetée (perpétuelle). Pas de date de fin : l'accès
  // aux modules inclus n'est jamais bloqué par l'ancienneté de la licence.
  // Seule la maintenance (si acceptée par l'entreprise) peut entraîner un
  // blocage, à son expiration.
  // ------------------------------------------------------------------
  const maintenanceDue = entreprise.maintenanceDueDate
    ? startOfDay(new Date(entreprise.maintenanceDueDate))
    : null;
  const daysUntilMaintenance = maintenanceDue ? diffDays(now, maintenanceDue) : null;

  if (entreprise.maintenanceAccepted && maintenanceDue) {
    if (now > maintenanceDue) {
      const graceDays = entreprise.gracePeriodDays ?? 15;
      const daysOverdue = diffDays(maintenanceDue, now);
      if (daysOverdue > graceDays) {
        return {
          effectiveStatus: "maintenance_overdue",
          isBlocked: true,
          daysUntilExpiration: null,
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
    } else if (ALERT_THRESHOLDS_DAYS.includes(daysUntilMaintenance as number)) {
      const level: LicenceAlertLevel = (daysUntilMaintenance as number) <= 7 ? "danger" : "warning";
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
    } else {
      // 4.2 — message informatif : maintenance active
      alerts.push({
        code: "MAINTENANCE_ACTIVE",
        level: "info",
        message: `Maintenance active jusqu'au ${maintenanceDue.toLocaleDateString("fr-FR")}.`,
      });
    }
  } else if (alerts.length === 0) {
    alerts.push({
      code: "LICENCE_ACTIVE",
      level: "info",
      message: "Votre licence est active (licence perpétuelle, sans date d'expiration).",
    });
  }

  return {
    effectiveStatus: "active",
    isBlocked: false,
    daysUntilExpiration: null,
    daysUntilMaintenance,
    alerts,
  };
}
