const API = process.env.NEXT_API_URL;
const TOKEN_KEY = "purba_token";
const USER_KEY = "purba_user";

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
};

export const signOut = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {}
};

// called when the API says the token is missing/expired
export const handleUnauthorized = () => {
  signOut();
  if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
    window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
  }
};

export async function login(email, password) {
  try {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, error: data.message || "Something went wrong" };

    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return { success: true, user: data.user };
  } catch {
    return { success: false, error: "Cannot reach the server. Please try again." };
  }
}

// Sign up is switched off for now
export async function signup() {
  return { success: false, error: "Sign up is currently disabled." };
}