import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/authorize.middleware.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { auditLogQuerySchema, changeRoleSchema } from "../middleware/workspace.validation.js";
import { changeMemberRoleController, getAuditLogsController, getMembersController, removeMemberController } from "../controllers/workspace.controller.js";

const router = Router();
router.use(authenticate);
router.get("/members", getMembersController);
router.patch("/members/:userId/role", requireRole("OWNER"), validateBody(changeRoleSchema), changeMemberRoleController);
router.delete("/members/:userId", requireRole("OWNER"), removeMemberController);
router.get("/audit-logs", validateQuery(auditLogQuerySchema), getAuditLogsController);

export default router;
