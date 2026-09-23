import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../server.js";
import { prisma } from "../services/prisma.js";

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const tenantIds: number[] = [];

function bearer(token: string) {
    return { Authorization: `Bearer ${token}` };
}

async function register(name: string, email: string, workspaceSlug?: string) {
    return request(app).post("/auth/register").send({ name, email, password: "password123", workspaceSlug });
}

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

        const member = await register("Owner Two", `owner-two-${suffix}@example.com`, slug);
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

        // Free workspaces have one seat; the existing join flow must enforce it.
        const rejectedJoin = await register("Rejected Member", `rejected-${suffix}@example.com`, slug);
        expect(rejectedJoin.status).toBe(403);
        expect(rejectedJoin.body.code).toBe("SEAT_LIMIT_EXCEEDED");

        const upgrade = await request(app).post("/subscriptions/change-plan").set(bearer(ownerToken)).send({ plan: "PRO" });
        expect(upgrade.status).toBe(200);

        const member = await register("Member One", `member-${suffix}@example.com`, slug);
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
