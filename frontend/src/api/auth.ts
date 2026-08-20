const API_URL = "http://localhost:3000";

interface LoginResponse {
    token: string;
    user: {
        id: number;
        name: string;
        email: string;
    };
}

export async function login(
    email: string,
    password: string,
): Promise<LoginResponse> {
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