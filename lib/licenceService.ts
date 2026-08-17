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
  modules?: LicenceModuleCode[];
  price?: number;
  currency?: string;
  createdBy?: string;
  notes?: string;
}

export interface OrderInput {
  entrepriseId: string;
  initiatedBy: string;
  action: "purchase" | "maintenance";
  planCode?: string;
  // Informatif uniquement : 0 pour un achat (licence perpétuelle), 12 pour la maintenance annuelle.
  durationMonths?: number;
  modules?: LicenceModuleCode[];
  items?: Array<{
    code?: string;
    name: string;
    qty: number;
    unit: number;
    total: number;
  }>;
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
    modules,
    notes: input.notes,
    createdBy: input.createdBy,
  });

  return entreprise;
}

// Achat de la licence perpétuelle : opération unique par entreprise (pas de durée, pas de
// date de fin). La 1ère année de maintenance est incluse et démarre le jour de l'achat.
export async function purchaseLicence(input: PurchaseInput): Promise<IEntreprise> {
  const existing = await Entreprise.findById(input.entrepriseId);
  if (!existing) {
    throw new Error("Entreprise introuvable");
  }

  if (existing.licenceType === "paid") {
    throw new Error("La licence de cette entreprise a déjà été achetée (licence perpétuelle).");
  }

  const wasTrial = existing.licenceType === "trial";
  const now = startOfDay(new Date());
  const maintenanceDue = addMonths(now, 12); // 1ère année de maintenance incluse
  const modules = input.modules?.length ? input.modules : [...ALL_MODULE_CODES];

  existing.licenceType = "paid";
  existing.licenceStatus = "active";
  existing.statut = "active";
  existing.isActive = true;
  existing.licenceStartDate = now;
  existing.licensePurchasedAt = now;
  existing.licenceEndDate = undefined;
  existing.dateExpiration = undefined;
  existing.maintenanceAccepted = true;
  existing.maintenanceDueDate = maintenanceDue;
  existing.modules = modules;
  existing.licenceKey = generateLicenceKey(existing);

  await existing.save();

  await saveLicenceHistory(wasTrial ? "trial_converted" : "purchased", {
    entrepriseId: input.entrepriseId,
    newMaintenanceDueDate: maintenanceDue,
    modules,
    price: input.price,
    currency: input.currency,
    notes: input.notes,
    createdBy: input.createdBy,
  });

  return existing;
}

// Modification des modules inclus dans une licence déjà achetée. Purement forfaitaire :
// aucun recalcul de montant ni de date, la licence reste perpétuelle.
export async function updateLicenceModules(
  entrepriseId: string,
  modules: LicenceModuleCode[],
  createdBy?: string,
  notes?: string
): Promise<IEntreprise> {
  const existing = await Entreprise.findById(entrepriseId);
  if (!existing) {
    throw new Error("Entreprise introuvable");
  }
  if (existing.licenceType !== "paid") {
    throw new Error("Seule une entreprise ayant acheté sa licence peut voir ses modules modifiés.");
  }

  existing.modules = modules?.length ? modules : [...ALL_MODULE_CODES];
  existing.licenceKey = generateLicenceKey(existing);
  await existing.save();

  await saveLicenceHistory("modules_changed", {
    entrepriseId,
    modules: existing.modules,
    notes,
    createdBy,
  });

  return existing;
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
  const now = startOfDay(new Date());
  const base = previousMaintenanceDueDate && previousMaintenanceDueDate > now
    ? startOfDay(previousMaintenanceDueDate)
    : now;
  const newMaintenanceDueDate = addMonths(base, options.months || 12);

  // Le paiement (validé) de la maintenance vaut acceptation de la maintenance par l'entreprise.
  existing.maintenanceAccepted = true;
  existing.maintenanceDueDate = newMaintenanceDueDate;
  existing.licenceKey = generateLicenceKey(existing);
  await existing.save();

  await saveLicenceHistory("maintenance_paid", {
    entrepriseId,
    previousMaintenanceDueDate,
    newMaintenanceDueDate,
    price: options.price,
    currency: options.currency,
    notes: options.notes,
    createdBy: options.createdBy,
  });

  return existing;
}

export async function createLicenceOrder(
  input: OrderInput
): Promise<{ order: ILicenceOrder; paymentUrl?: string }> {
  const modules = input.modules?.length ? input.modules : [...ALL_MODULE_CODES];
  // La licence et la maintenance sont forfaitaires : un montant fixe, pas de calcul
  // par module ni par mois.
  const durationMonths = input.action === "maintenance" ? 12 : 0;

  let items: OrderInput["items"] = [];
  if (Array.isArray((input as any).items) && (input as any).items.length > 0) {
    items = (input as any).items.map((it: any) => ({
      code: it.code,
      name: it.name || it.label || String(it.code || "Module"),
      qty: Number(it.qty || 1),
      unit: Number(it.unit || it.unitPrice || 0),
      total: Number(it.total ?? (Number(it.qty || 1) * Number(it.unit || it.unitPrice || 0))),
    }));
  } else {
    const entreprise = await Entreprise.findById(input.entrepriseId).lean();
    const flatPrice = input.action === "maintenance"
      ? (entreprise?.maintenancePrice || input.amount || 0)
      : (entreprise?.licencePrice || input.amount || 0);

    items = [
      {
        name: input.action === "maintenance" ? "Maintenance annuelle" : "Licence perpétuelle",
        qty: 1,
        unit: flatPrice,
        total: flatPrice,
      },
    ];
  }

  const amount = input.amount || (items || []).reduce((s, it) => s + (it?.total || 0), 0);

  const order = await LicenceOrder.create({
    entrepriseId: new Types.ObjectId(input.entrepriseId),
    initiatedBy: new Types.ObjectId(input.initiatedBy),
    action: input.action,
    planCode: input.planCode,
    durationMonths,
    modules,
    items,
    amount,
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
    price: amount,
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
      amount,
      currency: input.currency || "XOF",
      description: `Easy Medical - ${input.action === "maintenance" ? "maintenance annuelle" : "achat licence"}`,
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
      months: 12,
      price: order.amount,
      currency: order.currency,
      createdBy: validatedBy,
      notes: `Maintenance validée depuis commande ${orderId}`,
    });
  } else {
    entreprise = await purchaseLicence({
      entrepriseId: order.entrepriseId.toString(),
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

export async function cancelOrder(orderId: string, cancelledBy: string) {
  const order = await LicenceOrder.findById(orderId);
  if (!order) throw new Error("Commande introuvable");

  if (order.status === "validated") {
    throw new Error("Impossible d'annuler une commande déjà validée");
  }

  order.status = "cancelled";
  order.cancelledBy = new Types.ObjectId(cancelledBy);
  order.cancelledAt = new Date();
  await order.save();

  await saveLicenceHistory("order_cancelled", {
    entrepriseId: order.entrepriseId.toString(),
    orderId: order._id.toString(),
    price: order.amount,
    currency: order.currency,
    notes: `Commande annulée par ${cancelledBy}`,
    createdBy: cancelledBy,
  });

  return order;
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
