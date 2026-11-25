import { useEffect, useState } from "react";
import api from "../../services/api";

import {
    CalendarCheck,
    Users,
    Clock,
    CheckCircle,
    ArrowUpRight
} from "lucide-react";

import DashboardLayout from "../../components/dashboard/DashboardLayout";

import DoctorAppointmentManagement
    from "../../components/dashboard/DoctorAppointmentManagement";

import DoctorAvailabilityManagement
    from "../../components/dashboard/DoctorAvailabilityManagement";

import DoctorPatientManagement
    from "../../components/dashboard/DoctorPatientManagement";

import DoctorProfileManagement
    from "../../components/dashboard/DoctorProfileManagement";

const navItems = [
    { label: "Overview", icon: "dashboard", target: "overview", active: true },
    { label: "Appointments", icon: "appointments", target: "appointments" },
    { label: "Availability", icon: "appointments", target: "availability" },
    { label: "Patients", icon: "patients", target: "patients" },
    { label: "My Profile", icon: "profile", target: "profile" }
];



function DoctorDashboard() {
    const [overview, setOverview] = useState({
        totalAppointments: 0,
        totalPatients: 0,
        pendingAppointments: 0,
        completedAppointments: 0
    });

    const [overviewLoading, setOverviewLoading] = useState(true);
    const [overviewError, setOverviewError] = useState("");

    const fetchOverview = async () => {
        try {
            setOverviewLoading(true);
            setOverviewError("");

            const response = await api.get("/appointments/doctor/mine");

            const appointments = response.data.appointments || [];

            const uniquePatients = new Set(
                appointments
                    .map((appointment) => appointment.patient_id)
                    .filter((id) => id !== null && id !== undefined)
            );

            setOverview({
                totalAppointments: appointments.length,
                totalPatients: uniquePatients.size,
                pendingAppointments: appointments.filter(
                    (appointment) => appointment.status === "pending"
                ).length,
                completedAppointments: appointments.filter(
                    (appointment) => appointment.status === "completed"
                ).length
            });

        } catch (error) {
            console.error("Error fetching doctor overview:", error);

            setOverviewError(
                error.response?.data?.message ||
                "Unable to load dashboard statistics."
            );
        } finally {
            setOverviewLoading(false);
        }
    };

    useEffect(() => {
        fetchOverview();
    }, []);

    const stats = [
        {
            label: "Total Appointments",
            value: overview.totalAppointments,
            icon: CalendarCheck,
            color: "blue"
        },
        {
            label: "Total Patients",
            value: overview.totalPatients,
            icon: Users,
            color: "teal"
        },
        {
            label: "Pending Appointments",
            value: overview.pendingAppointments,
            icon: Clock,
            color: "orange"
        },
        {
            label: "Completed Appointments",
            value: overview.completedAppointments,
            icon: CheckCircle,
            color: "purple"
        }
    ];

    return (
        <DashboardLayout
            role="doctor"
            navItems={navItems}
            title="Doctor Dashboard"
            subtitle="View your appointments and manage patient care."
        >

            {/* Overview */}

            <div id="overview" className="dashboard-stats">

                {stats.map((stat) => {
                    const Icon = stat.icon;

                    return (
                        <div className="stat-card" key={stat.label}>
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
                                {overviewLoading ? "..." : stat.value}
                            </h2>

                            <h3>{stat.label}</h3>
                            <p>Appointment overview</p>
                        </div>
                    );
                })}

            </div>

            {overviewError && (
                <div className="department-alert">
                    {overviewError}

                    <button
                        type="button"
                        onClick={fetchOverview}
                        disabled={overviewLoading}
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Appointments */}

            <DoctorAppointmentManagement />

            {/* Availability Management */}

            <DoctorAvailabilityManagement />

            {/* Patients */}

            <DoctorPatientManagement />

            {/* My Profile */}

            <DoctorProfileManagement />

        </DashboardLayout>
    );
}

export default DoctorDashboard;
