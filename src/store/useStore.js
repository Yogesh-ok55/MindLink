import { create } from "zustand";

const baseUrl = import.meta.env.VITE_API_URL;
const useStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,

  initializeAuth: async () => {
    set({ loading: true, error: null });
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const response = await fetch(baseUrl + "/api/auth/verify", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const { user } = await response.json();
          set({ user, isAuthenticated: true, loading: false });
        } else {
          localStorage.removeItem("token");
          set({ user: null, isAuthenticated: false, loading: false });
        }
      } catch (error) {
        localStorage.removeItem("token");
        set({ user: null, isAuthenticated: false, loading: false });
      }
    } else {
      set({ user: null, isAuthenticated: false, loading: false });
    }
  },

  signUp: async (userData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(baseUrl + "/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error("Sign-up failed");
      }

      const data = await response.json();
      set({ user: data.user, isAuthenticated: true, loading: false });
    } catch (err) {
      set({ loading: false, error: err.message });
    }
  },

  signIn: async ({ email, password }) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(baseUrl + "/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Login failed");
      }

      const { token } = await response.json();

      localStorage.setItem("token", token);

      set({ user: { email }, isAuthenticated: true, loading: false });

      return true;
    } catch (error) {
      console.error(error);
      set({ loading: false, error: error.message });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ user: null, isAuthenticated: false });
  },
  
}));
export default useStore;