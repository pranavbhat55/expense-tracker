import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { AppError } from "../utils/AppError.js";
import { prisma } from "./prisma.js";
import { jwtSecret } from "../config/env.js";
import { enforceSeatLimit } from "./entitlement.service.js";
import { createAuditLog } from "./audit.service.js";
import { findUsableInvitation } from "./invitation.service.js";

function makeSlug(name: string) {
    return `${name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "workspace"}-${crypto.randomBytes(3).toString("hex")}`;
}

function licenseKey() { return `EXP-${crypto.randomBytes(12).toString("hex").toUpperCase()}`; }

function registrationResult(result: { tenant: { id: number; name: string }; user: { id: number; name: string; email: string; role: string; isSuperAdmin: boolean; createdAt: Date } }) {
    return { id: result.user.id, name: result.user.name, email: result.user.email, tenantId: result.tenant.id, tenantName: result.tenant.name, role: result.user.role, isSuperAdmin: result.user.isSuperAdmin, createdAt: result.user.createdAt };
}

export async function registerUser(data: { name: string; email: string; password: string; workspaceSlug?: string; inviteToken?: string }) {
    if (await prisma.user.findUnique({ where: { email: data.email } })) throw new AppError("Email already registered", 409);
    const password = await bcrypt.hash(data.password, 10);

    // Joining an organization: the invitation is the credential. It pins the email, the role
    // and the workspace, so the invitee cannot choose any of them.
    if (data.inviteToken) {
        const invitation = await findUsableInvitation(data.inviteToken);
        if (invitation.email.toLowerCase() !== data.email.trim().toLowerCase()) {
            throw new AppError("This invitation was issued to a different email address", 403, "INVITE_EMAIL_MISMATCH");
        }
        await enforceSeatLimit(invitation.tenantId);
        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({ data: { name: data.name, email: data.email, password, tenantId: invitation.tenantId, role: invitation.role } });
            await tx.invitation.update({ where: { id: invitation.id }, data: { acceptedAt: new Date() } });
            return { tenant: invitation.tenant, user };
        });
        await createAuditLog({ tenantId: result.tenant.id, userId: result.user.id, action: "MEMBER_JOINED", entityType: "USER", entityId: result.user.id, metadata: { memberEmail: result.user.email, role: result.user.role } });
        return registrationResult(result);
    }

    if (data.workspaceSlug) {
        const existing = await prisma.tenant.findUnique({ where: { slug: data.workspaceSlug } });
        if (existing?.inviteOnly) {
            throw new AppError("This workspace is invite-only. Ask an admin for an invitation link.", 403, "INVITE_REQUIRED");
        }
        if (existing) await enforceSeatLimit(existing.id);
    }
    const result = await prisma.$transaction(async (tx) => {
        if (data.workspaceSlug) {
            const tenant = await tx.tenant.findUnique({ where: { slug: data.workspaceSlug } });
            if (tenant) {
                // The seat-limit pre-check is outside this transaction because the entitlement service uses the shared client.
                const user = await tx.user.create({ data: { name: data.name, email: data.email, password, tenantId: tenant.id, role: "MEMBER" } });
                return { tenant, user };
            }
        }
        const tenant = await tx.tenant.create({
            data: {
                name: `${data.name}'s Organization`,
                slug: data.workspaceSlug || makeSlug(data.name),
                inviteOnly: true,
            },
        });
        const user = await tx.user.create({ data: { name: data.name, email: data.email, password, tenantId: tenant.id, role: "OWNER" } });
        const startsAt = new Date();
        const expiresAt = new Date(startsAt);
        expiresAt.setDate(expiresAt.getDate() + 14);
        await tx.subscription.create({ data: { tenantId: tenant.id, plan: "FREE", status: "TRIALING", licenseKey: licenseKey(), startsAt, expiresAt } });
        return { tenant, user };
    });
    if (data.workspaceSlug && result.user.role === "MEMBER") {
        await createAuditLog({ tenantId: result.tenant.id, userId: result.user.id, action: "MEMBER_JOINED", entityType: "USER", entityId: result.user.id, metadata: { memberEmail: result.user.email, role: result.user.role } });
    }
    return registrationResult(result);
}

export async function loginUser(data: { email: string; password: string }) {
    const user = await prisma.user.findUnique({ where: { email: data.email }, include: { tenant: true } });
    if (!user || !(await bcrypt.compare(data.password, user.password))) throw new AppError("Invalid email or password", 401);
    if (user.deactivatedAt) throw new AppError("This account has been deactivated. Contact your workspace owner.", 403, "ACCOUNT_DEACTIVATED");
    const token = jwt.sign({ userId: user.id, email: user.email, tenantId: user.tenantId, role: user.role }, jwtSecret, { expiresIn: "1h" });
    return { token, user: { id: user.id, name: user.name, email: user.email, tenantId: user.tenantId, tenantName: user.tenant.name, role: user.role, isSuperAdmin: user.isSuperAdmin } };
}
