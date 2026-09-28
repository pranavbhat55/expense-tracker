import type { NextFunction, Request, Response } from "express";
import { createInvitation, getInvitationPreview, listInvitations, revokeInvitation } from "../services/invitation.service.js";
import { getWorkspaceSettings, updateWorkspaceSettings } from "../services/workspace.service.js";
import { AppError } from "../utils/AppError.js";

export async function createInvitationController(req: Request, res: Response, next: NextFunction) {
    try {
        const { invitation, token } = await createInvitation(req.tenantId, req.userId, req.role, req.body);
        // The raw token is returned exactly once; only its hash is stored.
        res.status(201).json({ ...invitation, token });
    } catch (error) { next(error); }
}

export async function listInvitationsController(req: Request, res: Response, next: NextFunction) {
    try { res.json(await listInvitations(req.tenantId)); } catch (error) { next(error); }
}

export async function revokeInvitationController(req: Request, res: Response, next: NextFunction) {
    try {
        const id = Number(req.params.invitationId);
        if (!Number.isInteger(id) || id <= 0) throw new AppError("Invalid invitation ID", 400, "INVALID_INVITATION_ID");
        await revokeInvitation(req.tenantId, req.userId, id);
        res.status(204).send();
    } catch (error) { next(error); }
}

export async function invitationPreviewController(req: Request, res: Response, next: NextFunction) {
    try {
        const token = req.params.token;
        if (typeof token !== "string") throw new AppError("Invalid invitation", 400, "INVITE_INVALID");
        res.json(await getInvitationPreview(token));
    } catch (error) { next(error); }
}

export async function getWorkspaceSettingsController(req: Request, res: Response, next: NextFunction) {
    try { res.json(await getWorkspaceSettings(req.tenantId)); } catch (error) { next(error); }
}

export async function updateWorkspaceSettingsController(req: Request, res: Response, next: NextFunction) {
    try { res.json(await updateWorkspaceSettings(req.tenantId, req.body)); } catch (error) { next(error); }
}
