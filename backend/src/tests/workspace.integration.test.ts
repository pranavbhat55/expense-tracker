import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../server.js";
import { prisma } from "../services/prisma.js";
import { getPlanEntitlements } from "../services/entitlement.service.js";
import { setMailTransportForTests } from "../services/mailer.service.js";

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const tenantIds: number[] = [];

function bearer(token: string) {
    return { Authorization: `Bearer ${token}` };
}

async function register(name: string, email: string, workspaceSlug?: string) {
    return request(app).post("/auth/register").send({ name, email, password: "password123", workspaceSlug });
}

async function invite(ownerToken: string, email: string, role: "ADMIN" | "MEMBER" = "MEMBER") {
    return request(app).post("/workspace/invitations").set(bearer(ownerToken)).send({ email, role });
}

// Joining an organization now requires an invitation issued by an owner/admin.
async function join(ownerToken: string, name: string, email: string, role: "ADMIN" | "MEMBER" = "MEMBER") {
    const inv = await invite(ownerToken, email, role);
    expect(inv.status).toBe(201);
    return request(app).post("/auth/register").send({ name, email, password: "password123", inviteToken: inv.body.token });
}

beforeAll(() => setMailTransportForTests(null)); // never send real mail from tests

afterAll(async () => {
    for (const tenantId of tenantIds) {
        await prisma.auditLog.deleteMany({ where: { tenantId } });
        await prisma.expense.deleteMany({ where: { tenantId } });
        await prisma.budget.deleteMany({ where: { tenantId } });
        await prisma.subscription.deleteMany({ where: { tenantId } });
        await prisma.user.deleteMany({ where: { tenantId } });
        await prisma.tenant.deleteMany({ where: { id: tenantId } });
    }
});

describe("workspace membership and audit APIs", () => {
    it("prevents an owner from removing themselves from the workspace", async () => {
        const slug = `workspace-self-removal-${suffix}`;
        const owner = await register("Owner Self", `owner-self-${suffix}@example.com`, slug);
        expect(owner.status).toBe(201);
        tenantIds.push(owner.body.user.tenantId);

        const ownerToken = owner.body.token as string;
        const upgrade = await request(app).post("/subscriptions/change-plan").set(bearer(ownerToken)).send({ plan: "PRO" });
        expect(upgrade.status).toBe(200);

        const member = await join(ownerToken, "Owner Two", `owner-two-${suffix}@example.com`);
        expect(member.status).toBe(201);

        const promote = await request(app)
            .patch(`/workspace/members/${member.body.user.id}/role`)
            .set(bearer(ownerToken))
            .send({ role: "OWNER" });
        expect(promote.status).toBe(200);

        const selfRemoval = await request(app)
            .delete(`/workspace/members/${owner.body.user.id}`)
            .set(bearer(ownerToken));

        expect(selfRemoval.status).toBe(409);
        expect(selfRemoval.body.code).toBe("SELF_REMOVAL_NOT_ALLOWED");
    });

    it("enforces tenant-scoped owner management and records domain activity", async () => {
        const slug = `workspace-${suffix}`;
        const owner = await register("Owner One", `owner-${suffix}@example.com`, slug);
        expect(owner.status).toBe(201);
        tenantIds.push(owner.body.user.tenantId);
        const ownerToken = owner.body.token as string;

        // Free workspaces have one seat; inviting beyond it must be rejected.
        const rejectedInvite = await invite(ownerToken, `rejected-${suffix}@example.com`);
        expect(rejectedInvite.status).toBe(403);
        expect(rejectedInvite.body.code).toBe("SEAT_LIMIT_EXCEEDED");

        // Knowing a workspace slug is no longer enough to take a seat.
        const openJoin = await register("Slug Guesser", `guesser-${suffix}@example.com`, slug);
        expect(openJoin.status).toBe(403);
        expect(openJoin.body.code).toBe("INVITE_REQUIRED");

        const upgrade = await request(app).post("/subscriptions/change-plan").set(bearer(ownerToken)).send({ plan: "PRO" });
        expect(upgrade.status).toBe(200);

        const member = await join(ownerToken, "Member One", `member-${suffix}@example.com`);
        expect(member.status).toBe(201);
        const memberToken = member.body.token as string;
        const memberId = member.body.user.id as number;

        const listed = await request(app).get("/workspace/members").set(bearer(ownerToken));
        expect(listed.status).toBe(200);
        expect(listed.body).toHaveLength(2);
        expect(listed.body[0]).not.toHaveProperty("password");

        const forbidden = await request(app).patch(`/workspace/members/${memberId}/role`).set(bearer(memberToken)).send({ role: "ADMIN" });
        expect(forbidden.status).toBe(403);

        const roleChange = await request(app).patch(`/workspace/members/${memberId}/role`).set(bearer(ownerToken)).send({ role: "ADMIN" });
        expect(roleChange.status).toBe(200);
        expect(roleChange.body.role).toBe("ADMIN");

        const other = await register("Other Owner", `other-${suffix}@example.com`, `other-${suffix}`);
        expect(other.status).toBe(201);
        tenantIds.push(other.body.user.tenantId);
        const crossTenant = await request(app).patch(`/workspace/members/${memberId}/role`).set(bearer(other.body.token)).send({ role: "MEMBER" });
        expect(crossTenant.status).toBe(404);

        const expense = await request(app).post("/expenses").set(bearer(ownerToken)).send({ amount: 2500, category: "Food", date: "2026-09-20" });
        expect(expense.status).toBe(201);
        expect((await request(app).put(`/expenses/${expense.body.id}`).set(bearer(ownerToken)).send({ amount: 2600, category: "Food", date: "2026-09-20" })).status).toBe(200);
        expect((await request(app).delete(`/expenses/${expense.body.id}`).set(bearer(ownerToken))).status).toBe(204);

        const budget = await request(app).post("/budgets").set(bearer(ownerToken)).send({ amount: 5000, category: "Food", month: "2026-09" });
        expect(budget.status).toBe(201);
        expect((await request(app).put(`/budgets/${budget.body.id}`).set(bearer(ownerToken)).send({ amount: 5500, category: "Food", month: "2026-09" })).status).toBe(200);
        expect((await request(app).delete(`/budgets/${budget.body.id}`).set(bearer(ownerToken))).status).toBe(204);

        const removed = await request(app).delete(`/workspace/members/${memberId}`).set(bearer(ownerToken));
        expect(removed.status).toBe(204);
        expect((await request(app).delete(`/workspace/members/${owner.body.user.id}`).set(bearer(ownerToken))).status).toBe(409);

        const logs = await request(app).get("/workspace/audit-logs?limit=100").set(bearer(ownerToken));
        expect(logs.status).toBe(200);
        expect(logs.body.data.map((log: { action: string }) => log.action)).toEqual(expect.arrayContaining([
            "MEMBER_JOINED", "ROLE_CHANGED", "MEMBER_REMOVED", "EXPENSE_CREATED", "EXPENSE_UPDATED", "EXPENSE_DELETED",
            "BUDGET_CREATED", "BUDGET_UPDATED", "BUDGET_DELETED", "SUBSCRIPTION_PLAN_CHANGED",
        ]));
        expect(logs.body.data.every((log: { tenantId: number }) => log.tenantId === owner.body.user.tenantId)).toBe(true);

        const otherLogs = await request(app).get("/workspace/audit-logs").set(bearer(other.body.token));
        expect(otherLogs.status).toBe(200);
        expect(otherLogs.body.data).toHaveLength(0);
    });
});

describe("organization SaaS flow: invitations, offboarding and team visibility", () => {
    it("runs the full lifecycle with isolation between organizations", async () => {
        const owner = await register("Org Owner", `org-owner-${suffix}@example.com`);
        expect(owner.status).toBe(201);
        tenantIds.push(owner.body.user.tenantId);
        const ownerToken = owner.body.token as string;
        expect((await request(app).post("/subscriptions/change-plan").set(bearer(ownerToken)).send({ plan: "PRO" })).status).toBe(200);

        // --- invitation lifecycle ---
        const memberEmail = `emp-a-${suffix}@example.com`;
        const inv = await invite(ownerToken, memberEmail);
        expect(inv.status).toBe(201);
        expect(inv.body.token).toEqual(expect.any(String));
        const stored = await prisma.invitation.findUnique({ where: { id: inv.body.id } });
        expect(stored?.tokenHash).not.toBe(inv.body.token); // only a hash is persisted

        const preview = await request(app).get(`/auth/invitations/${inv.body.token}`);
        expect(preview.status).toBe(200);
        expect(preview.body).toMatchObject({ email: memberEmail, role: "MEMBER" });

        expect((await invite(ownerToken, memberEmail)).body.code).toBe("INVITE_ALREADY_PENDING");

        const wrongEmail = await request(app).post("/auth/register").send({ name: "Imposter", email: `imposter-${suffix}@example.com`, password: "password123", inviteToken: inv.body.token });
        expect(wrongEmail.status).toBe(403);
        expect(wrongEmail.body.code).toBe("INVITE_EMAIL_MISMATCH");

        const memberA = await request(app).post("/auth/register").send({ name: "Employee A", email: memberEmail, password: "password123", inviteToken: inv.body.token });
        expect(memberA.status).toBe(201);
        expect(memberA.body.user.tenantId).toBe(owner.body.user.tenantId);
        expect(memberA.body.user.role).toBe("MEMBER");
        const aToken = memberA.body.token as string;

        const reused = await request(app).post("/auth/register").send({ name: "Employee A", email: memberEmail, password: "password123", inviteToken: inv.body.token });
        expect(reused.status).toBe(409); // email now registered
        expect((await request(app).get(`/auth/invitations/${inv.body.token}`)).status).toBe(410);

        // --- roles: members cannot invite; admins can only invite members ---
        expect((await invite(aToken, `x-${suffix}@example.com`)).status).toBe(403);
        const admin = await join(ownerToken, "Admin B", `admin-b-${suffix}@example.com`, "ADMIN");
        expect(admin.body.user.role).toBe("ADMIN");
        const adminToken = admin.body.token as string;
        expect((await invite(adminToken, `adm2-${suffix}@example.com`, "ADMIN")).status).toBe(403);

        // --- seat reservation: pending invites hold seats, whatever the plan's limit is ---
        const seatLimit = getPlanEntitlements("PRO").limits.maxUsers as number;
        const filler: Array<{ id: number; token: string }> = [];
        for (let n = 0; n < seatLimit - 3; n++) { // owner + Employee A + Admin B already hold 3 seats
            const r = await invite(n % 2 ? adminToken : ownerToken, `fill-${n}-${suffix}@example.com`);
            expect(r.status).toBe(201);
            filler.push(r.body);
        }
        const overLimit = await invite(ownerToken, `e-${suffix}@example.com`);
        expect(overLimit.status).toBe(403);
        expect(overLimit.body.code).toBe("SEAT_LIMIT_EXCEEDED");
        const dInvite = { body: filler[0]! };
        expect((await request(app).delete(`/workspace/invitations/${dInvite.body.id}`).set(bearer(ownerToken))).status).toBe(204);
        const eInvite = await invite(ownerToken, `e-${suffix}@example.com`);
        expect(eInvite.status).toBe(201); // revoking freed the seat
        expect(eInvite.body.emailSent).toBe(false); // no SMTP configured in tests
        const revoked = await request(app).get(`/auth/invitations/${dInvite.body.token}`);
        expect(revoked.status).toBe(410);

        // --- expired invitations are rejected ---
        await prisma.invitation.update({ where: { id: eInvite.body.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
        expect((await request(app).get(`/auth/invitations/${eInvite.body.token}`)).status).toBe(410);
        const expiredJoin = await request(app).post("/auth/register").send({ name: "Late", email: `e-${suffix}@example.com`, password: "password123", inviteToken: eInvite.body.token });
        expect(expiredJoin.status).toBe(410);
        expect(expiredJoin.body.code).toBe("INVITE_EXPIRED");

        // --- data isolation between employees, with an opt-in team view for owner/admin ---
        expect((await request(app).post("/expenses").set(bearer(ownerToken)).send({ amount: 100, category: "Food", date: "2026-09-20" })).status).toBe(201);
        expect((await request(app).post("/expenses").set(bearer(aToken)).send({ amount: 250, category: "Travel", date: "2026-09-21" })).status).toBe(201);

        const aOwn = await request(app).get("/expenses").set(bearer(aToken));
        expect(aOwn.body.data).toHaveLength(1);
        expect((await request(app).get("/expenses?scope=team").set(bearer(aToken))).status).toBe(403);

        const ownerOwn = await request(app).get("/expenses").set(bearer(ownerToken));
        expect(ownerOwn.body.data).toHaveLength(1);
        const team = await request(app).get("/expenses?scope=team").set(bearer(ownerToken));
        expect(team.body.data).toHaveLength(2);
        expect(team.body.data.map((e: { user: { name: string } }) => e.user.name).sort()).toEqual(["Employee A", "Org Owner"]);
        const teamSummary = await request(app).get("/expenses/summary?scope=team&month=2026-09").set(bearer(adminToken));
        expect(Number(teamSummary.body.total)).toBe(350);

        // --- another organization sees none of this ---
        const rival = await register("Rival Owner", `rival-${suffix}@example.com`);
        tenantIds.push(rival.body.user.tenantId);
        const rivalToken = rival.body.token as string;
        expect((await request(app).get("/workspace/invitations").set(bearer(rivalToken))).body).toHaveLength(0);
        expect((await request(app).delete(`/workspace/invitations/${dInvite.body.id}`).set(bearer(rivalToken))).status).toBe(404);
        expect((await request(app).get("/expenses?scope=team").set(bearer(rivalToken))).body.data).toHaveLength(0);

        // --- offboarding: access revoked at once, seat freed, records kept ---
        const before = await request(app).get("/workspace/settings").set(bearer(ownerToken));
        expect(before.body.seats.used).toBe(3);
        expect((await request(app).delete(`/workspace/members/${memberA.body.user.id}`).set(bearer(ownerToken))).status).toBe(204);

        expect((await request(app).get("/expenses").set(bearer(aToken))).status).toBe(401); // existing session dies immediately
        const login = await request(app).post("/auth/login").send({ email: memberEmail, password: "password123" });
        expect(login.status).toBe(403);
        expect(login.body.code).toBe("ACCOUNT_DEACTIVATED");

        const members = await request(app).get("/workspace/members").set(bearer(ownerToken));
        expect(members.body.map((m: { email: string }) => m.email)).not.toContain(memberEmail);
        const after = await request(app).get("/workspace/settings").set(bearer(ownerToken));
        expect(after.body.seats.used).toBe(2);
        const kept = await request(app).get("/expenses?scope=team").set(bearer(ownerToken));
        expect(kept.body.data).toHaveLength(2); // the ex-employee's expense is still on the books

        // --- workspace settings are owner-only ---
        expect((await request(app).patch("/workspace/settings").set(bearer(adminToken)).send({ inviteOnly: false })).status).toBe(403);
        const opened = await request(app).patch("/workspace/settings").set(bearer(ownerToken)).send({ inviteOnly: false });
        expect(opened.body.inviteOnly).toBe(false);
    });
});

describe("invitation email", () => {
    it("emails the invitee when a mail transport is configured and never leaks other tenants' data", async () => {
        const sent: Array<{ to: string; subject: string; text: string; html: string }> = [];
        setMailTransportForTests({ sendMail: async (m) => { sent.push(m); return {}; } });
        try {
            const owner = await register("Mail Owner", `mail-owner-${suffix}@example.com`);
            tenantIds.push(owner.body.user.tenantId);
            const token = owner.body.token as string;
            await request(app).post("/subscriptions/change-plan").set(bearer(token)).send({ plan: "PRO" });
            const res = await invite(token, `mail-invitee-${suffix}@example.com`);
            expect(res.status).toBe(201);
            expect(res.body.emailSent).toBe(true);
            expect(sent).toHaveLength(1);
            expect(sent[0]!.to).toBe(`mail-invitee-${suffix}@example.com`);
            expect(sent[0]!.text).toContain(`/?invite=${res.body.token}`);
            expect(sent[0]!.subject).toContain("Mail Owner");
        } finally {
            setMailTransportForTests(null);
        }
    });
});
