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
    body: JSON.stringify({ from, to: user.email, subject, text }),
  });
}
