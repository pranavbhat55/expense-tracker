-- Add a platform-level super-admin flag, independent of per-tenant roles.
-- Super-admins have no elevated permission inside any single tenant's
-- OWNER/ADMIN/MEMBER role model; they can only access the separate
-- cross-tenant /admin API surface (see admin.routes.ts).
ALTER TABLE "User" ADD COLUMN "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false;
