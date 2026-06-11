import { prisma, type Prisma } from "@bazaarx/db";

interface NotifyArgs {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Prisma.InputJsonValue;
  /** Optional Prisma transaction client so the notification is written atomically. */
  tx?: Prisma.TransactionClient;
}

/**
 * Create an in-app notification and best-effort send an email.
 * Email is sent only when NOTIFY_EMAIL=true (kept off by default so testing
 * doesn't spam inboxes). Failures never block the caller.
 */
export async function notify({ userId, type, title, body, data, tx }: NotifyArgs): Promise<void> {
  const db = tx ?? prisma;
  await db.notification.create({
    data: { userId, type, title, body, data: data ?? undefined },
  });

  if (process.env.NOTIFY_EMAIL === "true") {
    void sendEmail(userId, title, body).catch(() => {});
  }
}

/** Best-effort transactional email via Resend's REST API (no SDK dependency). */
async function sendEmail(userId: string, subject: string, text: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (!user?.email) return;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: user.email, subject, text, html: emailHtml(subject, text) }),
  });
}

/** Minimal branded HTML wrapper for transactional emails. */
function emailHtml(title: string, body: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://bazaarx.app";
  const safe = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<!doctype html><html><body style="margin:0;background:#fafaf9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1c1917">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#fff;border:1px solid #e7e5e4;border-radius:16px;overflow:hidden">
        <tr><td style="padding:20px 24px;border-bottom:1px solid #f5f5f4">
          <span style="font-size:18px;font-weight:700;color:#1c1917">Bazaar<span style="color:#7c3aed">X</span></span>
        </td></tr>
        <tr><td style="padding:24px">
          <h1 style="margin:0 0 8px;font-size:18px;color:#1c1917">${safe(title)}</h1>
          <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#57534e">${safe(body)}</p>
          <a href="${appUrl}/orders" style="display:inline-block;background:#5b21b6;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:10px 20px;border-radius:9999px">View in BazaarX</a>
        </td></tr>
        <tr><td style="padding:16px 24px;border-top:1px solid #f5f5f4;font-size:12px;color:#a8a29e">
          You're receiving this because you have a BazaarX account.
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
}
