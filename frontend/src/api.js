const API_URL = "http://localhost:8002";

export const fetchWelcome = async () => {
    const response = await fetch(`${API_URL}/`);
    return response.json();
};

export const createUser = async (user) => {
    const response = await fetch(`${API_URL}/users/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
    });
    if (!response.ok) {
        throw new Error("Failed to create user");
    }
    return response.json();
};

export const loginUser = async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${API_URL}/token`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
    });
    if (!response.ok) {
        throw new Error("Login failed");
    }
    return response.json();
};
