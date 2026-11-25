
import { useEffect, useState } from "react";

import {
    Users,
    Stethoscope,
    Building2,
    CalendarCheck,
    ArrowUpRight,
    UserPlus,
    ClipboardList,
    RefreshCw
} from "lucide-react";

import api from "../../services/api";

import DepartmentManagement from "../../components/dashboard/DepartmentManagement";
import DoctorManagement from "../../components/dashboard/DoctorManagement";
import PatientManagement from "../../components/dashboard/PatientManagement";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import AppointmentManagement from "../../components/dashboard/AppointmentManagement";

// Sidebar navigation
const navItems = [
    {
        label: "Overview",
        icon: "dashboard",
        target: "overview",
        active: true
    },
    {
        label: "Doctors",
        icon: "doctors",
        target: "doctors"
    },
    {
        label: "Departments",
        icon: "departments",
        target: "departments"
    },
    {
        label: "Patients",
        icon: "patients",
        target: "patients"
    },
    {
        label: "Appointments",
        icon: "appointments",
        target: "appointments"
    }
];

// Dashboard statistic definitions
const statDefinitions = [
    {
        key: "patients",
        label: "Total Patients",
        icon: Users,
        description: "Registered patients",
        color: "blue"
    },
    {
        key: "doctors",
        label: "Total Doctors",
        icon: Stethoscope,
        description: "Registered doctors",
        color: "teal"
    },
    {
        key: "departments",
        label: "Departments",
        icon: Building2,
        description: "Available departments",
        color: "purple"
    },
    {
        key: "appointments",
        label: "Appointments",
        icon: CalendarCheck,
        description: "Total appointments",
        color: "orange"
    }
];

function AdminDashboard() {

    const [counts, setCounts] = useState({
        patients: null,
        doctors: null,
        departments: null,
        appointments: null
    });

    const [statsLoading, setStatsLoading] = useState(true);
    const [statsError, setStatsError] = useState("");

    // Fetch dashboard statistics.
    const fetchDashboardStats = async () => {
        try {
            setStatsLoading(true);
            setStatsError("");

            const results = await Promise.allSettled([
                api.get("/users/admin/patients"),
                api.get("/doctors/admin/all"),
                api.get("/departments/admin/all"),
                api.get("/appointments/admin/all")
            ]);

            const getCount = (result, property) => {
                if (result.status !== "fulfilled") {
                    return null;
                }

                return result.value.data[property]?.length ?? 0;
            };

            setCounts({
                patients: getCount(results[0], "patients"),
                doctors: getCount(results[1], "doctors"),
                departments: getCount(results[2], "departments"),
                appointments: getCount(results[3], "appointments")
            });

            if (results.some(result => result.status === "rejected")) {
                setStatsError(
                    "Some dashboard statistics could not be loaded."
                );
            }

        } catch (error) {
            console.error("Dashboard statistics error:", error);

            setStatsError("Unable to load dashboard statistics.");
        } finally {
            setStatsLoading(false);
        }
    };

    // Load statistics when dashboard opens.
    useEffect(() => {
        fetchDashboardStats();
    }, []);

    // Scroll to a dashboard section.
    const scrollToSection = (id) => {
        document.getElementById(id)?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    };

    return (
        <DashboardLayout
            role="admin"
            navItems={navItems}
            title="Admin Dashboard"
            subtitle="Manage your healthcare system from one place."
        >

            {/* Dashboard Overview */}
            <div id="overview">

                <div className="section-heading">
                    <div>
                        <h2>Welcome back, admin!</h2>
                        <p>
                            Manage your healthcare system from one place.
                        </p>
                    </div>

                    <button
                        className="doctor-refresh-button"
                        onClick={fetchDashboardStats}
                        disabled={statsLoading}
                    >
                        <RefreshCw
                            size={17}
                            className={statsLoading ? "spin" : ""}
                        />
                        Refresh Stats
                    </button>
                </div>

                {statsError && (
                    <div className="department-alert error">
                        {statsError}
                    </div>
                )}

                {/* Dashboard Statistics */}
                <div className="dashboard-stats">

                    {statDefinitions.map((stat) => {
                        const Icon = stat.icon;

                        return (
                            <div
                                className="stat-card"
                                key={stat.key}
                            >

                                <div className="stat-card-top">

                                    <div className={`stat-icon ${stat.color}`}>
                                        <Icon size={22} />
                                    </div>

                                    <ArrowUpRight
                                        size={19}
                                        className="stat-arrow"
                                    />

                                </div>

                                <h2>
                                    {statsLoading
                                        ? "..."
                                        : counts[stat.key] ?? "—"}
                                </h2>

                                <h3>{stat.label}</h3>

                                <p>{stat.description}</p>

                            </div>
                        );
                    })}

                </div>

            </div>

            {/* Quick Management */}
            <div className="dashboard-section">

                <div className="section-heading">
                    <div>
                        <h2>Quick Management</h2>
                        <p>
                            Manage the main components of CareConnect.
                        </p>
                    </div>
                </div>

                <div className="management-grid">

                    {/* Doctor Management */}
                    <div className="management-card">

                        <div className="management-icon blue">
                            <Stethoscope size={23} />
                        </div>

                        <h3>Doctor Management</h3>

                        <p>
                            Create doctor accounts, assign departments
                            and manage doctor information.
                        </p>

                        <button
                            className="management-button"
                            onClick={() => scrollToSection("doctors")}
                        >
                            <UserPlus size={17} />
                            Manage Doctors
                        </button>

                    </div>

                    {/* Department Management */}
                    <div className="management-card">

                        <div className="management-icon teal">
                            <Building2 size={23} />
                        </div>

                        <h3>Department Management</h3>

                        <p>
                            Add and manage hospital departments.
                        </p>

                        <button
                            className="management-button"
                            onClick={() => scrollToSection("departments")}
                        >
                            <Building2 size={17} />
                            Manage Departments
                        </button>

                    </div>

                    {/* Patient Management */}
                    <div className="management-card">

                        <div className="management-icon purple">
                            <Users size={23} />
                        </div>

                        <h3>Patient Management</h3>

                        <p>
                            View registered patients and manage their accounts.
                        </p>

                        <button
                            className="management-button"
                            onClick={() => scrollToSection("patients")}
                        >
                            <ArrowUpRight size={17} />
                            View Patients
                        </button>

                    </div>

                    {/* Appointment Management */}
                    <div className="management-card">

                        <div className="management-icon orange">
                            <CalendarCheck size={23} />
                        </div>

                        <h3>Appointment Management</h3>

                        <p>
                            Monitor and manage patient appointments.
                        </p>

                        <button
                            className="management-button"
                            onClick={() => scrollToSection("appointments")}
                        >
                            <ClipboardList size={17} />
                            View Appointments
                        </button>

                    </div>

                </div>

            </div>

            {/* Doctor Management */}
            <div id="doctors">
                <DoctorManagement />
            </div>

            {/* Department Management */}
            <div id="departments">
                <DepartmentManagement />
            </div>

            {/* Patient Management */}
            <PatientManagement />

            {/* Appointment Management */}
            <div id="appointments">
                <AppointmentManagement />
            </div>

        </DashboardLayout>
    );
}

export default AdminDashboard;
