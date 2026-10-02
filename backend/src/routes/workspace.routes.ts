import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/authorize.middleware.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { auditLogQuerySchema, changeRoleSchema, createInvitationSchema, workspaceSettingsSchema } from "../middleware/workspace.validation.js";
import { changeMemberRoleController, getAuditLogsController, getMembersController, removeMemberController } from "../controllers/workspace.controller.js";

import {
    createInvitationController, getWorkspaceSettingsController, listInvitationsController,
    revokeInvitationController, updateWorkspaceSettingsController,
} from "../controllers/invitation.controller.js";

const router = Router();
router.use(authenticate);
router.get("/members", getMembersController);
router.patch("/members/:userId/role", requireRole("OWNER"), validateBody(changeRoleSchema), changeMemberRoleController);
router.delete("/members/:userId", requireRole("OWNER"), removeMemberController);
router.get("/settings", getWorkspaceSettingsController);
router.patch("/settings", requireRole("OWNER"), validateBody(workspaceSettingsSchema), updateWorkspaceSettingsController);
router.get("/invitations", requireRole("OWNER", "ADMIN"), listInvitationsController);
router.post("/invitations", requireRole("OWNER", "ADMIN"), validateBody(createInvitationSchema), createInvitationController);
router.delete("/invitations/:invitationId", requireRole("OWNER", "ADMIN"), revokeInvitationController);
router.get("/audit-logs", validateQuery(auditLogQuerySchema), getAuditLogsController);

export default router;
