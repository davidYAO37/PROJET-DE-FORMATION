import { Types } from "mongoose";
import { Entreprise, IEntreprise } from "@/models/entreprise";
import { LicenceHistory } from "@/models/licenceHistory";
import { LicenceOrder, ILicenceOrder } from "@/models/licenceOrder";
import { generateLicenceKey, ALERT_THRESHOLDS_DAYS } from "@/lib/licence";
import { LicenceModuleCode, ALL_MODULE_CODES } from "@/lib/licenceModules";
import { createWaveCheckout } from "@/lib/wave";

export interface TrialInput {
  entrepriseId: string;
  durationDays: number;
  modules?: LicenceModuleCode[];
  createdBy?: string;
  notes?: string;
}

export interface PurchaseInput {
  entrepriseId: string;
  durationMonths: number;
  modules?: LicenceModuleCode[];
  price?: number;
  currency?: string;
  createdBy?: string;
  notes?: string;
}

export interface OrderInput {
  entrepriseId: string;
  initiatedBy: string;
  action: "purchase" | "renewal" | "maintenance";
  planCode?: string;
  durationMonths: number;
  modules?: LicenceModuleCode[];
  amount: number;
  currency?: string;
  paymentMethod: "wave" | "manual" | "bank_transfer";
  notes?: string;
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function addMonths(date: Date, months: number): Date {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + months);
  return copy;
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

async function saveLicenceHistory(
  action: string,
  data: {
    entrepriseId: string;
    orderId?: string;
    previousEndDate?: Date;
    newEndDate?: Date;
    previousMaintenanceDueDate?: Date;
    newMaintenanceDueDate?: Date;
    modules?: string[];
    price?: number;
    currency?: string;
    validatedBy?: string;
    notes?: string;
    createdBy?: string;
  }
) {
  await LicenceHistory.create({
    entrepriseId: new Types.ObjectId(data.entrepriseId),
    orderId: data.orderId ? new Types.ObjectId(data.orderId) : undefined,
    action,
    previousEndDate: data.previousEndDate,
    newEndDate: data.newEndDate,
    previousMaintenanceDueDate: data.previousMaintenanceDueDate,
    newMaintenanceDueDate: data.newMaintenanceDueDate,
    modules: data.modules,
    price: data.price,
    currency: data.currency,
    validatedBy: data.validatedBy ? new Types.ObjectId(data.validatedBy) : undefined,
    notes: data.notes,
    createdBy: data.createdBy ? new Types.ObjectId(data.createdBy) : undefined,
  });
}

export async function activateTrial(input: TrialInput): Promise<IEntreprise> {
  const start = startOfDay(new Date());
  const end = addDays(start, input.durationDays);
  const modules = input.modules?.length ? input.modules : [...ALL_MODULE_CODES];

  const entreprise = await Entreprise.findByIdAndUpdate(
    input.entrepriseId,
    {
      licenceType: "trial",
      licenceStatus: "active",
      statut: "active",
      isActive: true,
      licenceStartDate: start,
      licenceEndDate: end,
      maintenanceDueDate: end,
      modules,
    },
    { new: true }
  );

  if (!entreprise) {
    throw new Error("Entreprise introuvable");
  }

  entreprise.licenceKey = generateLicenceKey(entreprise);
  entreprise.dateExpiration = entreprise.licenceEndDate;
  await entreprise.save();

  await saveLicenceHistory("trial_started", {
    entrepriseId: input.entrepriseId,
    newEndDate: end,
    newMaintenanceDueDate: end,
    modules,
    notes: input.notes,
    createdBy: input.createdBy,
  });

  return entreprise;
}

export async function purchaseLicence(input: PurchaseInput): Promise<IEntreprise> {
  const existing = await Entreprise.findById(input.entrepriseId);
  if (!existing) {
    throw new Error("Entreprise introuvable");
  }

  const now = startOfDay(new Date());
  const previousEndDate = existing.licenceEndDate
    ? new Date(existing.licenceEndDate)
    : undefined;
  const previousMaintenanceDueDate = existing.maintenanceDueDate
    ? new Date(existing.maintenanceDueDate)
    : undefined;

  const start = previousEndDate && previousEndDate > now ? previousEndDate : now;
  const end = addMonths(start, input.durationMonths);
  const maintenanceDue = addMonths(start, 12); // maintenance due 1 an après le début de la période payée

  const modules = input.modules?.length ? input.modules : [...ALL_MODULE_CODES];

  const updated = await Entreprise.findByIdAndUpdate(
    input.entrepriseId,
    {
      licenceType: "paid",
      licenceStatus: "active",
      statut: "active",
      isActive: true,
      licenceStartDate: start,
      licenceEndDate: end,
      maintenanceDueDate: maintenanceDue,
      modules,
    },
    { new: true }
  );

  if (!updated) {
    throw new Error("Échec mise à jour entreprise");
  }

  updated.licenceKey = generateLicenceKey(updated);
  updated.dateExpiration = updated.licenceEndDate;
  await updated.save();

  await saveLicenceHistory(
    existing.licenceType === "trial" ? "trial_converted" : "purchased",
    {
      entrepriseId: input.entrepriseId,
      previousEndDate,
      newEndDate: end,
      previousMaintenanceDueDate,
      newMaintenanceDueDate: maintenanceDue,
      modules,
      price: input.price,
      currency: input.currency,
      notes: input.notes,
      createdBy: input.createdBy,
    }
  );

  return updated;
}

export async function renewLicence(input: PurchaseInput): Promise<IEntreprise> {
  return purchaseLicence(input);
}

export async function payMaintenance(
  entrepriseId: string,
  options: {
    months?: number;
    price?: number;
    currency?: string;
    createdBy?: string;
    notes?: string;
  } = {}
): Promise<IEntreprise> {
  const existing = await Entreprise.findById(entrepriseId);
  if (!existing) {
    throw new Error("Entreprise introuvable");
  }

  const previousMaintenanceDueDate = existing.maintenanceDueDate
    ? new Date(existing.maintenanceDueDate)
    : undefined;
  const base = previousMaintenanceDueDate
    ? startOfDay(previousMaintenanceDueDate)
    : startOfDay(new Date());
  const newMaintenanceDueDate = addMonths(base, options.months || 12);

  const updated = await Entreprise.findByIdAndUpdate(
    entrepriseId,
    {
      licenceType: "paid",
      licenceStatus: "active",
      maintenanceDueDate: newMaintenanceDueDate,
    },
    { new: true }
  );

  if (!updated) {
    throw new Error("Échec mise à jour maintenance");
  }

  updated.licenceKey = generateLicenceKey(updated);
  await updated.save();

  await saveLicenceHistory("maintenance_paid", {
    entrepriseId,
    previousMaintenanceDueDate,
    newMaintenanceDueDate,
    price: options.price,
    currency: options.currency,
    notes: options.notes,
    createdBy: options.createdBy,
  });

  return updated;
}

export async function createLicenceOrder(
  input: OrderInput
): Promise<{ order: ILicenceOrder; paymentUrl?: string }> {
  const modules = input.modules?.length ? input.modules : [...ALL_MODULE_CODES];

  const order = await LicenceOrder.create({
    entrepriseId: new Types.ObjectId(input.entrepriseId),
    initiatedBy: new Types.ObjectId(input.initiatedBy),
    action: input.action,
    planCode: input.planCode,
    durationMonths: input.durationMonths,
    modules,
    amount: input.amount,
    currency: input.currency || "XOF",
    status: "pending",
    paymentMethod: input.paymentMethod,
    notes: input.notes,
  });

  await saveLicenceHistory("order_created", {
    entrepriseId: input.entrepriseId,
    orderId: order._id.toString(),
    newEndDate: undefined,
    modules,
    price: input.amount,
    currency: input.currency || "XOF",
    createdBy: input.initiatedBy,
    notes: input.notes,
  });

  let paymentUrl: string | undefined;

  if (input.paymentMethod === "wave") {
    const callbackUrl =
      process.env.WAVE_CALLBACK_URL ||
      `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/licence/payment-callback`;
    const checkout = await createWaveCheckout({
      amount: input.amount,
      currency: input.currency || "XOF",
      description: `Easy Medical - ${input.action} licence ${input.durationMonths} mois`,
      orderId: order._id.toString(),
      callbackUrl,
    });

    if (checkout.success && checkout.checkoutId && checkout.paymentUrl) {
      order.waveCheckoutId = checkout.checkoutId;
      order.wavePaymentUrl = checkout.paymentUrl;
      await order.save();
      paymentUrl = checkout.paymentUrl;
    }
  }

  return { order, paymentUrl };
}

export async function validateOrder(
  orderId: string,
  validatedBy: string
): Promise<IEntreprise> {
  const order = await LicenceOrder.findById(orderId);
  if (!order) {
    throw new Error("Commande introuvable");
  }

  if (order.status === "validated") {
    throw new Error("Commande déjà validée");
  }

  const modules = order.modules as LicenceModuleCode[];

  let entreprise: IEntreprise;

  if (order.action === "maintenance") {
    entreprise = await payMaintenance(order.entrepriseId.toString(), {
      months: order.durationMonths,
      price: order.amount,
      currency: order.currency,
      createdBy: validatedBy,
      notes: `Maintenance validée depuis commande ${orderId}`,
    });
  } else {
    entreprise = await purchaseLicence({
      entrepriseId: order.entrepriseId.toString(),
      durationMonths: order.durationMonths,
      modules,
      price: order.amount,
      currency: order.currency,
      createdBy: validatedBy,
      notes: `Achat validé depuis commande ${orderId}`,
    });
  }

  order.status = "validated";
  order.validatedBy = new Types.ObjectId(validatedBy);
  order.validatedAt = new Date();
  await order.save();

  await saveLicenceHistory("order_validated", {
    entrepriseId: order.entrepriseId.toString(),
    orderId,
    modules,
    price: order.amount,
    currency: order.currency,
    validatedBy,
  });

  return entreprise;
}

export async function suspendEntreprise(
  entrepriseId: string,
  createdBy?: string,
  notes?: string
): Promise<IEntreprise> {
  const updated = await Entreprise.findByIdAndUpdate(
    entrepriseId,
    { licenceStatus: "suspended", statut: "suspendue", isActive: false },
    { new: true }
  );
  if (!updated) throw new Error("Entreprise introuvable");

  await saveLicenceHistory("suspended", {
    entrepriseId,
    notes,
    createdBy,
  });

  return updated;
}

export async function resumeEntreprise(
  entrepriseId: string,
  createdBy?: string,
  notes?: string
): Promise<IEntreprise> {
  const updated = await Entreprise.findByIdAndUpdate(
    entrepriseId,
    { licenceStatus: "active", statut: "active", isActive: true },
    { new: true }
  );
  if (!updated) throw new Error("Entreprise introuvable");

  await saveLicenceHistory("resumed", {
    entrepriseId,
    notes,
    createdBy,
  });

  return updated;
}

export async function resiliateEntreprise(
  entrepriseId: string,
  createdBy?: string,
  notes?: string
): Promise<IEntreprise> {
  const updated = await Entreprise.findByIdAndUpdate(
    entrepriseId,
    { licenceStatus: "resiliated", statut: "resiliee", isActive: false },
    { new: true }
  );
  if (!updated) throw new Error("Entreprise introuvable");

  await saveLicenceHistory("resiliated", {
    entrepriseId,
    notes,
    createdBy,
  });

  return updated;
}

export function getAlertThresholds(): number[] {
  return [...ALERT_THRESHOLDS_DAYS];
}
