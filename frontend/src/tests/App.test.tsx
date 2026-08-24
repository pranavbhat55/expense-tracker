import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import App from "../App";

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
});