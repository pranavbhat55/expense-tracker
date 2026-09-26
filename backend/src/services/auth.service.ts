import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { AppError } from "../utils/AppError.js";
import { prisma } from "./prisma.js";
import { jwtSecret } from "../config/env.js";
import { enforceSeatLimit } from "./entitlement.service.js";
import { createAuditLog } from "./audit.service.js";

function makeSlug(name: string) {
    return `${name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "workspace"}-${crypto.randomBytes(3).toString("hex")}`;
}

function licenseKey() { return `EXP-${crypto.randomBytes(12).toString("hex").toUpperCase()}`; }

export async function registerUser(data: { name: string; email: string; password: string; workspaceSlug?: string }) {
    if (await prisma.user.findUnique({ where: { email: data.email } })) throw new AppError("Email already registered", 409);
    const password = await bcrypt.hash(data.password, 10);
    if (data.workspaceSlug) {
        const tenant = await prisma.tenant.findUnique({ where: { slug: data.workspaceSlug } });
        if (tenant) {
            await enforceSeatLimit(tenant.id);
        }
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
    return { id: result.user.id, name: result.user.name, email: result.user.email, tenantId: result.tenant.id, tenantName: result.tenant.name, role: result.user.role, isSuperAdmin: result.user.isSuperAdmin, createdAt: result.user.createdAt };
}

export async function loginUser(data: { email: string; password: string }) {
    const user = await prisma.user.findUnique({ where: { email: data.email }, include: { tenant: true } });
    if (!user || !(await bcrypt.compare(data.password, user.password))) throw new AppError("Invalid email or password", 401);
    const token = jwt.sign({ userId: user.id, email: user.email, tenantId: user.tenantId, role: user.role }, jwtSecret, { expiresIn: "1h" });
    return { token, user: { id: user.id, name: user.name, email: user.email, tenantId: user.tenantId, tenantName: user.tenant.name, role: user.role, isSuperAdmin: user.isSuperAdmin } };
}
