import crypto from "crypto";
import { prisma } from "./prisma.js";
import { AppError } from "../utils/AppError.js";
import { getTenantEntitlements } from "./entitlement.service.js";
import { createAuditLog } from "./audit.service.js";
import { appUrl, sendInviteEmail } from "./mailer.service.js";

const INVITE_TTL_DAYS = 7;

export function hashInviteToken(token: string) {
    return crypto.createHash("sha256").update(token).digest("hex");
}

function pendingWhere(tenantId: number) {
    return { tenantId, acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } };
}

function publicInvite(i: { id: number; email: string; role: string; expiresAt: Date; createdAt: Date }) {
    return { id: i.id, email: i.email, role: i.role, expiresAt: i.expiresAt, createdAt: i.createdAt };
}

// Only the raw token (returned once, never stored) lets someone join. The DB keeps a
// SHA-256 hash, so a database leak cannot be used to accept outstanding invitations.
export async function createInvitation(
    tenantId: number,
    actorId: number,
    actorRole: "OWNER" | "ADMIN" | "MEMBER",
    data: { email: string; role: "ADMIN" | "MEMBER" },
) {
    if (actorRole !== "OWNER" && data.role !== "MEMBER") {
        throw new AppError("Only the workspace owner can invite admins", 403, "FORBIDDEN");
    }
    const email = data.email.trim().toLowerCase();
    if (await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } })) {
        throw new AppError("This email already has an account", 409, "EMAIL_ALREADY_REGISTERED");
    }
    const pending = await prisma.invitation.findMany({ where: pendingWhere(tenantId) });
    if (pending.some((i) => i.email === email)) {
        throw new AppError("This email already has a pending invitation", 409, "INVITE_ALREADY_PENDING");
    }
    const { entitlements } = await getTenantEntitlements(tenantId);
    const limit = entitlements.limits.maxUsers;
    // A pending invitation reserves a seat, so a plan can never be over-committed.
    if (limit !== null && entitlements.usage.users + pending.length >= limit) {
        throw new AppError("Workspace seat limit reached.", 403, "SEAT_LIMIT_EXCEEDED");
    }
    const token = crypto.randomBytes(24).toString("base64url");
    const invitation = await prisma.invitation.create({
        data: {
            tenantId, email, role: data.role, tokenHash: hashInviteToken(token), invitedById: actorId,
            expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
        },
    });
    await createAuditLog({ tenantId, userId: actorId, action: "MEMBER_INVITED", entityType: "INVITATION", entityId: invitation.id, metadata: { inviteeEmail: email, role: data.role } });
    const [tenant, inviter] = await Promise.all([
        prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } }),
        prisma.user.findUnique({ where: { id: actorId }, select: { name: true } }),
    ]);
    const emailSent = await sendInviteEmail({ to: email, organization: tenant.name, inviterName: inviter?.name ?? "A teammate", role: data.role, link: `${appUrl()}/?invite=${token}` });
    return { invitation: publicInvite(invitation), token, emailSent };
}

export async function listInvitations(tenantId: number) {
    const rows = await prisma.invitation.findMany({ where: pendingWhere(tenantId), orderBy: { createdAt: "desc" } });
    return rows.map(publicInvite);
}

export async function revokeInvitation(tenantId: number, actorId: number, id: number) {
    const invitation = await prisma.invitation.findFirst({ where: { id, ...pendingWhere(tenantId) } });
    if (!invitation) throw new AppError("Invitation not found", 404, "INVITE_NOT_FOUND");
    await prisma.invitation.update({ where: { id }, data: { revokedAt: new Date() } });
    await createAuditLog({ tenantId, userId: actorId, action: "INVITATION_REVOKED", entityType: "INVITATION", entityId: id, metadata: { inviteeEmail: invitation.email } });
}

export async function findUsableInvitation(token: string) {
    const invitation = await prisma.invitation.findUnique({ where: { tokenHash: hashInviteToken(token) }, include: { tenant: true } });
    if (!invitation) throw new AppError("This invitation link is not valid", 404, "INVITE_INVALID");
    if (invitation.acceptedAt) throw new AppError("This invitation has already been used", 410, "INVITE_USED");
    if (invitation.revokedAt) throw new AppError("This invitation was revoked", 410, "INVITE_REVOKED");
    if (invitation.expiresAt <= new Date()) throw new AppError("This invitation has expired", 410, "INVITE_EXPIRED");
    return invitation;
}

export async function getInvitationPreview(token: string) {
    const invitation = await findUsableInvitation(token);
    return { email: invitation.email, role: invitation.role, organization: invitation.tenant.name };
}
