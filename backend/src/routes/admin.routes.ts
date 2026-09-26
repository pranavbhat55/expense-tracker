import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireSuperAdmin } from "../middleware/authorize.middleware.js";
import { validateBody } from "../middleware/validate.js";
import { tenantSubscriptionStatusSchema } from "../middleware/admin.validation.js";
import {
    getTenantDetailController,
    listTenantsController,
    updateTenantSubscriptionStatusController,
} from "../controllers/admin.controller.js";

const router = Router();
router.use(authenticate, requireSuperAdmin);

router.get("/tenants", listTenantsController);
router.get("/tenants/:tenantId", getTenantDetailController);
router.patch("/tenants/:tenantId/subscription-status", validateBody(tenantSubscriptionStatusSchema), updateTenantSubscriptionStatusController);

export default router;
