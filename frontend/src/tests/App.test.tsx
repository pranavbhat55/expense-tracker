import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import App from "../App";

afterEach(cleanup);

describe("Login form", () => {
    it("allows the user to enter email and password", () => {
        render(<App />);

        const emailInput = screen.getByLabelText("Email");
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

    it("offers an optional workspace slug during registration", () => {
        render(<App />);

        fireEvent.click(
            screen.getByRole("button", {
                name: "New here? Create an account",
            }),
        );

        const workspaceInput = screen.getByLabelText(
            "Workspace slug (optional)",
        );

        fireEvent.change(workspaceInput, {
            target: { value: "acme-team" },
        });

        expect(workspaceInput).toHaveProperty(
            "value",
            "acme-team",
        );
    });
});
