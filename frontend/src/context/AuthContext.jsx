
import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

import api from "../services/api";

// Create a shared authentication context.
const AuthContext = createContext(null);

export function AuthProvider({ children }) {

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Refresh the current user's complete profile.
    const refreshUser = async () => {
        try {
            const response = await api.get("/users/profile");

            setUser(response.data.user);

            return response.data.user;
        } catch (error) {
            console.error("Failed to refresh user profile:", error);
            return null;
        }
    };

    // Restore the session when the application starts.
    useEffect(() => {

        const restoreSession = async () => {

            const token = localStorage.getItem("careconnect_token");

            // No saved token means no existing session.
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const response = await api.get("/auth/me");

                setUser(response.data.user);

                // Load the complete profile, including the S3 image URL.
                await refreshUser();

            } catch (error) {

                console.error("Session restoration failed:", error);

                // Remove an invalid or expired session.
                localStorage.removeItem("careconnect_token");
                localStorage.removeItem("careconnect_user");

                setUser(null);

            } finally {
                setLoading(false);
            }
        };

        restoreSession();

    }, []);

    // Login a user and update the global authentication state.
    const login = async (email, password) => {

        const response = await api.post("/auth/login", {
            email,
            password
        });

        const { token, user } = response.data;

        const allowedRoles = ["patient", "doctor", "admin"];

        if (!token || !user || !user.id || !allowedRoles.includes(user.role)) {
            throw new Error("Invalid login response from server.");
        }

        // Save the JWT.
        localStorage.setItem("careconnect_token", token);

        // Update global user state.
        setUser(user);

        // Fetch the complete profile, including the profile image.
        await refreshUser();

        return user;
    };

    // Register a new patient and update global authentication state.
    const register = async (name, email, password, phone) => {

        const response = await api.post("/auth/register", {
            name,
            email,
            password,
            phone
        });

        const { token, user } = response.data;

        if (!token || !user || !user.id || user.role !== "patient") {
            throw new Error("Invalid registration response from server.");
        }

        // Save JWT.
        localStorage.setItem("careconnect_token", token);

        // Update global user state.
        setUser(user);

        // Fetch the complete profile.
        await refreshUser();

        return user;
    };

    // Logout the current user.
    const logout = () => {
        localStorage.removeItem("careconnect_token");
        localStorage.removeItem("careconnect_user");

        setUser(null);
    };

    const value = {
        user,
        loading,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout,
        refreshUser
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// Custom hook for accessing authentication state.
export function useAuth() {

    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth must be used inside an AuthProvider"
        );
    }

    return context;
}
