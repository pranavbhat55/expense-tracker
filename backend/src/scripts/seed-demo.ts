/**
 * Demo data for trying every feature. Goes through the real service layer (registration, invitations,
 * plan changes, expenses, budgets, offboarding) so audit logs, seat rules and isolation are genuine.
 *
 *   npm run seed:demo            load demo data (skips if already loaded)
 *   npm run seed:demo -- --reset remove previous demo data first (only tenants that contain a *.demo user)
 *
 * Every demo account uses the password below.
 */
import "dotenv/config";
import { prisma } from "../services/prisma.js";
import { registerUser } from "../services/auth.service.js";
import { changeSubscription } from "../services/subscription.service.js";
import { createInvitation } from "../services/invitation.service.js";
import { createExpense } from "../services/expense.service.js";
import { createBudget } from "../services/budget.service.js";
import { removeMember } from "../services/workspace.service.js";

const PASSWORD = "Demo@1234";
type Role = "ADMIN" | "MEMBER";
interface Org { tenantId: number; ownerId: number }

// Deterministic "random" so everyone gets the same demo data.
let seed = 42;
const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
const pick = <T,>(items: T[]): T => items[Math.floor(rnd() * items.length)] as T;

const today = new Date();
const day = (monthsAgo: number, d: number) => {
    const maxDay = monthsAgo === 0 ? today.getUTCDate() : 28;
    return new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - monthsAgo, Math.max(1, Math.min(d, maxDay)), 12));
};
const currentMonth = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, "0")}`;

interface Profile { category: string; notes: string[]; min: number; max: number; perMonth: number }
const PROFILES: Record<string, Profile[]> = {
    software: [{ category: "Software", notes: ["Figma seats", "AWS invoice", "GitHub Teams", "Notion workspace", "Linear"], min: 900, max: 9500, perMonth: 3 }],
    travel: [{ category: "Travel", notes: ["Client visit - Mumbai", "Flight - Bengaluru", "Cab to airport", "Hotel - 2 nights", "Train - Pune"], min: 400, max: 12000, perMonth: 3 }],
    marketing: [{ category: "Marketing", notes: ["LinkedIn ads", "Google ads", "Event booth", "Print collateral", "Newsletter tool"], min: 1500, max: 9000, perMonth: 3 }],
    meals: [{ category: "Meals & Entertainment", notes: ["Team lunch", "Client dinner", "Coffee with candidate", "Offsite snacks"], min: 250, max: 3200, perMonth: 4 }],
    supplies: [{ category: "Office Supplies", notes: ["Monitor arms", "Stationery", "Printer ink", "Desk lamps"], min: 300, max: 5200, perMonth: 2 }],
};

async function spend(org: Org, userId: number, profiles: Profile[], months = 3) {
    for (let m = 0; m < months; m++) {
        for (const p of profiles) {
            for (let i = 0; i < p.perMonth; i++) {
                const amount = Math.round((p.min + rnd() * (p.max - p.min)) / 10) * 10 + (rnd() > 0.7 ? 0.5 : 0);
                await createExpense(userId, org.tenantId, { amount, category: p.category, date: day(m, 1 + Math.floor(rnd() * 27)), note: pick(p.notes) });
            }
        }
    }
}

async function makeOrg(orgName: string, ownerName: string, email: string, plan: "FREE" | "PRO" | "BUSINESS"): Promise<Org> {
    const owner = await registerUser({ name: ownerName, email, password: PASSWORD });
    await prisma.tenant.update({ where: { id: owner.tenantId }, data: { name: orgName } });
    if (plan !== "FREE") await changeSubscription(owner.tenantId, owner.id, plan);
    return { tenantId: owner.tenantId, ownerId: owner.id };
}

async function addMember(org: Org, name: string, email: string, role: Role) {
    const invitation = await createInvitation(org.tenantId, org.ownerId, "OWNER", { email, role });
    return registerUser({ name, email, password: PASSWORD, inviteToken: invitation.token });
}

async function reset() {
    const rows = await prisma.user.findMany({ where: { email: { endsWith: ".demo" } }, select: { tenantId: true } });
    for (const tenantId of new Set(rows.map((r) => r.tenantId))) {
        await prisma.auditLog.deleteMany({ where: { tenantId } });
        await prisma.expense.deleteMany({ where: { tenantId } });
        await prisma.budget.deleteMany({ where: { tenantId } });
        await prisma.invitation.deleteMany({ where: { tenantId } });
        await prisma.subscription.deleteMany({ where: { tenantId } });
        await prisma.user.deleteMany({ where: { tenantId } });
        await prisma.tenant.deleteMany({ where: { id: tenantId } });
    }
    console.log(`Removed ${new Set(rows.map((r) => r.tenantId)).size} previous demo workspace(s).`);
}

async function main() {
    if (process.argv.includes("--reset")) await reset();
    if (await prisma.user.findUnique({ where: { email: "aditi@acme.demo" } })) {
        console.log("Demo data is already loaded. Re-run with:  npm run seed:demo -- --reset");
        return;
    }

    // ---- 1. Acme Design Co: PRO organization with a full team ---------------------------------
    const acme = await makeOrg("Acme Design Co", "Aditi Rao", "aditi@acme.demo", "PRO");
    const rahul = await addMember(acme, "Rahul Mehta", "rahul@acme.demo", "ADMIN");
    const priya = await addMember(acme, "Priya Singh", "priya@acme.demo", "MEMBER");
    const karan = await addMember(acme, "Karan Shah", "karan@acme.demo", "MEMBER");
    const vikram = await addMember(acme, "Vikram Nair", "vikram@acme.demo", "MEMBER");

    // The owner's current month is scripted so every budget-health state is on screen:
    // Software 96% (warning), Travel over budget, Marketing on track, Meals comfortable.
    const scripted: Array<[string, number, string, number]> = [
        ["Rent & Facilities", 42000, "Coworking desks", 1],
        ["Software", 12400, "AWS invoice", 2], ["Software", 6800, "Figma + Linear seats", 3],
        ["Travel", 9800, "Client visit - Mumbai", 4], ["Travel", 6600, "Flight - Bengaluru", 6],
        ["Marketing", 5000, "LinkedIn ads", 5], ["Meals & Entertainment", 2300, "Team lunch", 7],
    ];
    for (const [category, amount, note, d] of scripted) await createExpense(acme.ownerId, acme.tenantId, { amount, category, note, date: day(0, d) });
    await spend(acme, acme.ownerId, [...(PROFILES.software ?? []), ...(PROFILES.travel ?? [])].map((p) => ({ ...p, perMonth: 1 })), 3);
    await spend(acme, rahul.id, [...(PROFILES.software ?? []), ...(PROFILES.travel ?? [])]);
    await spend(acme, priya.id, [...(PROFILES.travel ?? []), ...(PROFILES.meals ?? [])]);
    await spend(acme, karan.id, [...(PROFILES.marketing ?? []), ...(PROFILES.supplies ?? [])]);
    await spend(acme, vikram.id, [...(PROFILES.meals ?? []), ...(PROFILES.supplies ?? [])], 2);
    for (const [category, amount] of [["Software", 20000], ["Marketing", 12000], ["Travel", 15000], ["Meals & Entertainment", 6000]] as const) {
        await createBudget(acme.ownerId, acme.tenantId, { amount, category, month: currentMonth });
    }
    await removeMember(acme.tenantId, acme.ownerId, vikram.id); // ex-employee: access revoked, records kept
    const pending = await createInvitation(acme.tenantId, acme.ownerId, "OWNER", { email: "meera@acme.demo", role: "MEMBER" });

    // ---- 2. Northwind Traders: FREE plan (feature locks, one seat, isolation from Acme) -------
    const northwind = await makeOrg("Northwind Traders", "Nikhil Verma", "nikhil@northwind.demo", "FREE");
    await spend(northwind, northwind.ownerId, [...(PROFILES.supplies ?? []), ...(PROFILES.meals ?? []), ...(PROFILES.travel ?? [])].map((p) => ({ ...p, perMonth: 2 })), 2);
    await createBudget(northwind.ownerId, northwind.tenantId, { amount: 8000, category: "Office Supplies", month: currentMonth });

    // ---- 3. An individual: their own private workspace ---------------------------------------
    const sam = await makeOrg("Sam's Freelance Studio", "Sam Freelancer", "sam@solo.demo", "FREE");
    await spend(sam, sam.ownerId, [...(PROFILES.software ?? []), ...(PROFILES.meals ?? [])].map((p) => ({ ...p, perMonth: 2 })), 2);

    // ---- 4. Bluebird Studio (BUSINESS, unlimited seats) and Legacy Corp (suspended) ----------
    const bluebird = await makeOrg("Bluebird Studio", "Bala Iyer", "bala@bluebird.demo", "BUSINESS");
    const zoya = await addMember(bluebird, "Zoya Khan", "zoya@bluebird.demo", "MEMBER");
    await spend(bluebird, bluebird.ownerId, PROFILES.marketing ?? [], 2);
    await spend(bluebird, zoya.id, PROFILES.travel ?? [], 2);
    const legacy = await makeOrg("Legacy Corp", "Leela Menon", "leela@legacy.demo", "FREE");
    await spend(legacy, legacy.ownerId, (PROFILES.supplies ?? []), 1);
    await prisma.subscription.update({ where: { tenantId: legacy.tenantId }, data: { status: "CANCELLED" } });

    // ---- 5. Platform super-admin (cross-tenant /admin console) -------------------------------
    const hq = await makeOrg("Expenso HQ", "Ops Admin", "admin@expenso.demo", "FREE");
    await prisma.user.update({ where: { id: hq.ownerId }, data: { isSuperAdmin: true } });

    const [users, expenses, tenants] = await Promise.all([prisma.user.count(), prisma.expense.count(), prisma.tenant.count()]);
    console.log(`\nDemo data loaded: ${tenants} workspaces, ${users} users, ${expenses} expenses.\nPassword for every account: ${PASSWORD}\n`);
    console.table([
        { account: "aditi@acme.demo", role: "OWNER", workspace: "Acme Design Co (PRO)", try: "everything: team view, invites, budgets, billing" },
        { account: "rahul@acme.demo", role: "ADMIN", workspace: "Acme Design Co (PRO)", try: "invite members, team view; no billing/role control" },
        { account: "priya@acme.demo", role: "MEMBER", workspace: "Acme Design Co (PRO)", try: "sees only own expenses; no team toggle/invites" },
        { account: "karan@acme.demo", role: "MEMBER", workspace: "Acme Design Co (PRO)", try: "second employee - proves isolation from Priya" },
        { account: "vikram@acme.demo", role: "(deactivated)", workspace: "Acme Design Co (PRO)", try: "login is refused; his expenses remain in team view" },
        { account: "nikhil@northwind.demo", role: "OWNER", workspace: "Northwind Traders (FREE)", try: "timeline/CSV locked, seats full, sees none of Acme" },
        { account: "sam@solo.demo", role: "OWNER", workspace: "Sam's Freelance Studio (FREE)", try: "an individual user's private workspace" },
        { account: "bala@bluebird.demo", role: "OWNER", workspace: "Bluebird Studio (BUSINESS)", try: "unlimited seats" },
        { account: "leela@legacy.demo", role: "OWNER", workspace: "Legacy Corp (suspended)", try: "cancelled subscription -> features disabled" },
        { account: "admin@expenso.demo", role: "SUPER-ADMIN", workspace: "Expenso HQ", try: "Admin console: all tenants, suspend/reactivate" },
    ]);
    console.log(`Pending invitation for meera@acme.demo (open in a private window to accept):\n  http://localhost:5173/?invite=${pending.token}\n`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
