const API_URL = "http://localhost:3000";

interface AuthResponse {
    token: string;
    user: {
        id: number;
        name: string;
        email: string;
        role?: "OWNER" | "ADMIN" | "MEMBER";
    };
}

export async function login(
    email: string,
    password: string,
): Promise<AuthResponse> {
    const response = await fetch(
        `${API_URL}/auth/login`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email,
                password,
            }),
        },
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || "Failed to login",
        );
    }

    return data;
}

export async function register(
    name: string,
    email: string,
    password: string,
    workspaceSlug?: string,
    inviteToken?: string,
): Promise<AuthResponse> {
    const response = await fetch(
        `${API_URL}/auth/register`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name,
                email,
                password,
                workspaceSlug: workspaceSlug || undefined,
                inviteToken: inviteToken || undefined,
            }),
        },
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.errors?.[0]?.message ||
            data.message ||
            "Failed to register",
        );
    }

    return data;
}

export interface InvitationPreview { email: string; role: "ADMIN" | "MEMBER" | "OWNER"; organization: string }

/** Public: shows which organization an invite link belongs to before the person signs up. */
export async function getInvitationPreview(token: string): Promise<InvitationPreview> {
    const response = await fetch(`${API_URL}/auth/invitations/${encodeURIComponent(token)}`);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(typeof data.message === "string" ? data.message : "This invitation link is not valid");
    return data;
}
