import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import App from "../App";

afterEach(cleanup);

describe("Login form", () => {
    it("allows the user to enter email and password", () => {
        render(<App />);

        const emailInput = screen.getByLabelText("Work email");
        const passwordInput = screen.getByLabelText("Password");

        fireEvent.change(emailInput, {
            target: {
                value: "test@example.com",
            },
        });

        fireEvent.change(passwordInput, {
            target: {
                value: "password123",
            },
        });

        expect(emailInput).toHaveProperty(
            "value",
            "test@example.com",
        );

        expect(passwordInput).toHaveProperty(
            "value",
            "password123",
        );
    });

    it("creates a workspace on sign-up and no longer offers open joining by slug", () => {
        render(<App />);

        fireEvent.click(
            screen.getByRole("button", {
                name: "New here? Create a workspace",
            }),
        );

        expect(screen.getByRole("heading", { name: "Create your workspace" })).toBeTruthy();
        expect(screen.getByLabelText("Full name")).toBeTruthy();
        // Joining an organization is invitation-only, so there is no slug field to guess.
        expect(screen.queryByLabelText(/workspace slug/i)).toBeNull();
    });
});
