import { LicenceModuleCode } from "@/lib/licenceModules";

export type EntrepriseStatut = "active" | "suspendue" | "resiliee";
export type LicenceType = "trial" | "paid";
export type LicenceStatus = "active" | "suspended" | "resiliated";

export interface Entreprise {
  _id?: string;
  NomSociete?: string;
  EnteteSociete?: string;
  LogoE?: string;
  PiedPageSociete?: string;
  NCC?: string;
  adresse?: string;
  contact?: string;
  email?: string;
  dbName?: string;
  mongoUri?: string;
  statut?: EntrepriseStatut;
  isActive?: boolean;

  // Licence
  licenceType?: LicenceType;
  licencePlan?: string;
  licenceStatus?: LicenceStatus;
  licenceStartDate?: string;
  licenceEndDate?: string;
  licensePurchasedAt?: string;
  maintenanceAccepted?: boolean;
  maintenanceDueDate?: string;
  gracePeriodDays?: number;
  modules?: LicenceModuleCode[];
  licenceKey?: string;
  dateExpiration?: string;
  lastAlertShownAt?: string;
  maintenancePrice?: number;
  licencePrice?: number;
}
