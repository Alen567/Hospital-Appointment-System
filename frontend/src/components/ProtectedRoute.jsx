
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ allowedRoles }) {

    const { user, loading } = useAuth();

    // Wait until session restoration finishes.
    if (loading) {
        return <div>Loading...</div>;
    }

    // Redirect unauthenticated users.
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Check whether the user's role is authorized.
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        switch (user.role) {
            case "patient":
                return <Navigate to="/patient/dashboard" replace />;

            case "doctor":
                return <Navigate to="/doctor/dashboard" replace />;

            case "admin":
                return <Navigate to="/admin/dashboard" replace />;

            default:
                return <Navigate to="/login" replace />;
        }
    }

    return <Outlet />;
}

export default ProtectedRoute;
