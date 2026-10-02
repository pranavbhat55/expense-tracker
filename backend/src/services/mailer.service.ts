import nodemailer from "nodemailer";

export interface MailTransport { sendMail: (message: { from: string; to: string; subject: string; text: string; html: string }) => Promise<unknown>; }

// Email is optional infrastructure: with no SMTP_URL the app still works and the owner shares the
// invite link by hand. Configure SMTP_URL (e.g. smtp://user:pass@smtp.example.com:587) to send.
let transport: MailTransport | null | undefined;

function getTransport(): MailTransport | null {
    if (transport !== undefined) return transport;
    const url = process.env.SMTP_URL;
    transport = url ? nodemailer.createTransport(url) : null;
    return transport;
}

export function setMailTransportForTests(next: MailTransport | null) { transport = next; }
export function appUrl() { return (process.env.APP_URL ?? "http://localhost:5173").replace(/\/$/, ""); }

const escapeHtml = (v: string) => v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

export async function sendInviteEmail(data: { to: string; organization: string; inviterName: string; role: string; link: string }): Promise<boolean> {
    const mail = getTransport();
    if (!mail) return false;
    const roleLabel = data.role === "ADMIN" ? "an admin" : "a team member";
    try {
        await mail.sendMail({
            from: process.env.EMAIL_FROM ?? "Expenso <no-reply@localhost>",
            to: data.to,
            subject: `${data.inviterName} invited you to ${data.organization} on Expenso`,
            text: `${data.inviterName} invited you to join ${data.organization} as ${roleLabel}.\n\nAccept the invitation (valid for 7 days):\n${data.link}\n\nYour expenses stay private to you.`,
            html: `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;color:#191a1e"><h2 style="font-family:Georgia,serif">You're invited to ${escapeHtml(data.organization)}</h2><p>${escapeHtml(data.inviterName)} invited you to join as ${roleLabel}. Your expenses stay private to you.</p><p><a href="${escapeHtml(data.link)}" style="display:inline-block;padding:12px 20px;background:#a9760f;color:#fff;text-decoration:none;border-radius:4px">Accept invitation</a></p><p style="font-size:12px;color:#6d6f78">This link works once and expires in 7 days.</p></div>`,
        });
        return true;
    } catch (error) {
        console.error("Failed to send invitation email", error);
        return false; // the invite still exists; the owner can share the link manually
    }
}
