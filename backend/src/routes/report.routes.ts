import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
    getTimelineReportController,
} from "../controllers/report.controller.js";

const router = Router();

router.use(authenticate);

router.get(
    "/timeline",
    getTimelineReportController,
);

export default router;