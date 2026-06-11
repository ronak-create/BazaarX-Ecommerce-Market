import type { CreateOrderResult, VerifyPaymentInput } from "@bazaarx/types";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Open Razorpay Checkout for a placed order, then confirm the payment with the
 * server. Resolves true on successful verification.
 */
export async function payWithRazorpay(
  rzp: NonNullable<CreateOrderResult["razorpay"]>,
  customer: { name?: string | null; email?: string | null; phone?: string | null },
): Promise<boolean> {
  const ok = await loadScript();
  if (!ok || !window.Razorpay) throw new Error("Could not load Razorpay");

  return new Promise<boolean>((resolve, reject) => {
    const instance = new window.Razorpay!({
      key: rzp.keyId,
      amount: rzp.amount,
      currency: rzp.currency,
      order_id: rzp.razorpayOrderId,
      name: "BazaarX",
      description: "Order payment",
      prefill: {
        name: customer.name ?? undefined,
        email: customer.email ?? undefined,
        contact: customer.phone ?? undefined,
      },
      handler: async (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        const body: VerifyPaymentInput = {
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        };
        const res = await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) resolve(true);
        else reject(new Error("Payment verification failed"));
      },
      modal: { ondismiss: () => resolve(false) },
    });
    instance.open();
  });
}
