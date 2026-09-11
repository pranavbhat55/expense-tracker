import "express";

declare global {
    namespace Express {
        interface Request {
            userId: number;
            tenantId: number;
            role: "OWNER" | "ADMIN" | "MEMBER";
        }
    }
}
