import "server-only";

/**
 * Sends an email with Resend (https://resend.com). Needs RESEND_API_KEY.
 * Without a verified domain, Resend only delivers from onboarding@resend.dev to the email of the
 * Resend account itself, which is enough for alerts to the Apnacatalog team.
 * Never throws: a lost alert must not break the action that sent it.
 */
export async function sendEmail(to: string[], subject: string, html: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key || to.length === 0) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "Apnacatalog <onboarding@resend.dev>",
        to,
        subject,
        html,
      }),
    });
    if (!res.ok) console.error("Email not sent", res.status, (await res.text()).slice(0, 200).replace(/[\r\n]/g, " "));
    return res.ok;
  } catch (error) {
    console.error("Email not sent", error);
    return false;
  }
}

/** Makes text safe to put inside an email's HTML. */
export const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
