import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../server.js";

describe("Health API", () => {
    it("should return server status", async () => {
        const response = await request(app)
            .get("/health");

        expect(response.status).toBe(200);

        expect(response.body).toEqual({
            status: "ok",
        });
    });
});
describe("Error handling", () => {
    it("should reject an invalid expense ID", async () => {
        const response = await request(app)
            .get("/expenses/invalid");

        expect(response.status).toBe(401);
    });
});
describe("Authentication", () => {
    it("should reject login with invalid credentials", async () => {
        const response = await request(app)
            .post("/auth/login")
            .send({
                email: "invalid@example.com",
                password: "wrongpassword",
            });

        expect(response.status).toBe(401);
    });
});