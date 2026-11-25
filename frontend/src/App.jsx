
import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import LogoutButton from "./components/LogoutButton";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import DoctorDashboard from "./pages/dashboards/DoctorDashboard";
import PatientDashboard from "./pages/dashboards/PatientDashboard";
import DashboardLayout from "./components/dashboard/DashboardLayout";

function App() {
    return (
        <BrowserRouter>
            <Routes>

                {/* Public routes */}
                <Route
                    path="/"
                    element={<Navigate to="/login" replace />}
                />

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/register"
                    element={<Register />}
                />

                <Route
                    path="/patient/dashboard"
                    element={
                        <ProtectedRoute allowedRoles={["patient"]} />
                    }
                >
                    <Route index element={<PatientDashboard />} />
                </Route>

                <Route
                    path="/doctor/dashboard"
                    element={
                        <ProtectedRoute allowedRoles={["doctor"]} />
                    }
                >
                    <Route index element={<DoctorDashboard />} />
                </Route>

                <Route
                    path="/admin/dashboard"
                    element={<ProtectedRoute allowedRoles={["admin"]} />}
                >
                    <Route index element={<AdminDashboard />} />
                </Route>

                {/* Unknown routes */}
                <Route
                    path="*"
                    element={<Navigate to="/login" replace />}
                />

            </Routes>
        </BrowserRouter>
    );
}

export default App;
