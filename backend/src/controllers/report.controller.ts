import type { Request, Response } from "express";
import { getTimelineReport } from "../services/report.service.js";

export async function getTimelineReportController(
    req: Request,
    res: Response,
) {
    try {
        const fromString =
            typeof req.query.from === "string"
                ? req.query.from
                : undefined;

        const toString =
            typeof req.query.to === "string"
                ? req.query.to
                : undefined;

        const groupBy =
            typeof req.query.groupBy === "string"
                ? req.query.groupBy
                : "day";

        if (!fromString || !toString) {
            return res.status(400).json({
                message:
                    "from and to query parameters are required",
            });
        }

        if (
            groupBy !== "day" &&
            groupBy !== "week" &&
            groupBy !== "month"
        ) {
            return res.status(400).json({
                message:
                    "groupBy must be day, week, or month",
            });
        }

        const from = new Date(fromString);
        const to = new Date(toString);

        if (
            Number.isNaN(from.getTime()) ||
            Number.isNaN(to.getTime())
        ) {
            return res.status(400).json({
                message: "Invalid date range",
            });
        }

        const report = await getTimelineReport(
            req.tenantId,
            from,
            to,
            groupBy,
        );

        return res.status(200).json(report);
    } catch (error) {
        console.error(
            "Failed to generate timeline report:",
            error,
        );

        if (
            error instanceof Error &&
            error.message ===
                "The start date must be before the end date"
        ) {
            return res.status(400).json({
                message: error.message,
            });
        }

        return res.status(500).json({
            message: "Failed to generate timeline report",
        });
    }
}