-- Add workspace identity and membership roles without discarding existing tenants.
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

ALTER TABLE "Tenant" ADD COLUMN "slug" TEXT;
UPDATE "Tenant" SET "slug" = 'workspace-' || "id" WHERE "slug" IS NULL;
ALTER TABLE "Tenant" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'MEMBER';
-- Existing workspaces did not have memberships. Promote their earliest user to OWNER.
UPDATE "User" AS member
SET "role" = 'OWNER'
WHERE member."id" IN (
  SELECT DISTINCT ON ("tenantId") "id"
  FROM "User"
  ORDER BY "tenantId", "createdAt", "id"
);
