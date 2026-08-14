// Intégration Wave - stub prêt à être branché dès obtention des clés API.
// Documentation à suivre : https://developer.wave.com (ou équivalent fourni par Wave)

export interface WaveCheckoutInput {
  amount: number;
  currency: string;
  description: string;
  orderId: string;
  callbackUrl: string;
}

export interface WaveCheckoutResult {
  success: boolean;
  checkoutId?: string;
  paymentUrl?: string;
  error?: string;
}

export interface WaveTransaction {
  id: string;
  status: "pending" | "succeeded" | "failed" | "cancelled";
  amount: number;
  currency: string;
  reference?: string;
}

const WAVE_API_KEY = process.env.WAVE_API_KEY;
const WAVE_API_URL = process.env.WAVE_API_URL || "https://api.wave.com/v1";

export function isWaveConfigured(): boolean {
  return Boolean(WAVE_API_KEY);
}

export async function createWaveCheckout(
  input: WaveCheckoutInput
): Promise<WaveCheckoutResult> {
  if (!isWaveConfigured()) {
    // Mode simulateur local : redirection vers une page de test.
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
    const paymentUrl = `${baseUrl}/licence/wave-simulator?orderId=${encodeURIComponent(
      input.orderId
    )}&amount=${input.amount}&currency=${encodeURIComponent(input.currency)}`;
    return {
      success: true,
      checkoutId: `sim_${input.orderId}`,
      paymentUrl,
    };
  }

  try {
    const response = await fetch(`${WAVE_API_URL}/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WAVE_API_KEY}`,
      },
      body: JSON.stringify({
        amount: input.amount,
        currency: input.currency,
        description: input.description,
        // Champs spécifiques à l'API Wave à adapter selon la documentation officielle
        callback_url: input.callbackUrl,
        external_reference: input.orderId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Wave API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    return {
      success: true,
      checkoutId: data.id || data.checkout_id,
      paymentUrl: data.wave_url || data.payment_url || data.checkout_url,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur Wave inconnue",
    };
  }
}

export async function verifyWaveTransaction(
  transactionId: string
): Promise<WaveTransaction | null> {
  if (!isWaveConfigured()) {
    return null;
  }

  try {
    const response = await fetch(
      `${WAVE_API_URL}/transactions/${transactionId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${WAVE_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return {
      id: transactionId,
      status: data.status,
      amount: data.amount,
      currency: data.currency,
      reference: data.external_reference,
    };
  } catch {
    return null;
  }
}

export function verifyWaveWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const secret = process.env.WAVE_WEBHOOK_SECRET;
  if (!secret) {
    return false;
  }
  // Implémentation à adapter selon la documentation Wave (HMAC SHA256 le plus souvent)
  const { createHmac } = require("crypto");
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  return expected === signature;
}
