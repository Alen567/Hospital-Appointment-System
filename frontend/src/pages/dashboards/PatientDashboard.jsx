
import { useEffect, useState } from "react";

import {
    CalendarDays,
    Stethoscope,
    Clock,
    CheckCircle,
    ArrowUpRight
} from "lucide-react";

import api from "../../services/api";
import DashboardLayout from "../../components/dashboard/DashboardLayout";

import PatientAppointmentManagement
    from "../../components/dashboard/PatientAppointmentManagement";

import PatientProfileManagement
    from "../../components/dashboard/PatientProfileManagement";

import PatientDoctorDirectory
    from "../../components/dashboard/PatientDoctorDirectory";

const navItems = [
    {
        label: "Overview",
        icon: "dashboard",
        target: "overview",
        active: true
    },
    {
        label: "My Appointments",
        icon: "appointments",
        target: "appointments"
    },
    {
        label: "Find Doctors",
        icon: "doctors",
        target: "doctors"
    },
    {
        label: "My Profile",
        icon: "profile",
        target: "profile"
    }
];

function PatientDashboard() {
    const [activeTarget, setActiveTarget] = useState("overview");

    const [appointments, setAppointments] = useState([]);
    const [availableDoctors, setAvailableDoctors] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                setError("");

                const [appointmentsResponse, doctorsResponse] =
                    await Promise.all([
                        api.get("/appointments/mine"),
                        api.get("/doctors/available")
                    ]);

                setAppointments(
                    appointmentsResponse.data.appointments || []
                );

                const doctorList = doctorsResponse.data.doctors || [];

                const uniqueDoctorIds = new Set(
                    doctorList.map((doctor) => doctor.doctor_id)
                );

                setAvailableDoctors(uniqueDoctorIds.size);

            } catch (error) {
                console.error("Dashboard data error:", error);

                setError(
                    error.response?.data?.message ||
                    "Failed to load dashboard information."
                );

            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const getLocalDateTime = (date, time) => {
        const datePart = String(date).slice(0, 10);
        const timePart = String(time).slice(0, 8);

        return new Date(`${datePart}T${timePart}`);
    };

    const now = new Date();

    const upcomingAppointments = appointments.filter((appointment) => {
        const appointmentDate = getLocalDateTime(
            appointment.slot_date,
            appointment.start_time
        );

        return (
            ["pending", "confirmed"].includes(appointment.status) &&
            appointmentDate > now
        );
    });

    const completedAppointments = appointments.filter(
        (appointment) => appointment.status === "completed"
    );

    const stats = [
        {
            label: "Total Appointments",
            value: appointments.length,
            icon: CalendarDays,
            color: "blue"
        },
        {
            label: "Upcoming",
            value: upcomingAppointments.length,
            icon: Clock,
            color: "teal"
        },
        {
            label: "Completed",
            value: completedAppointments.length,
            icon: CheckCircle,
            color: "purple"
        },
        {
            label: "Available Doctors",
            value: availableDoctors,
            icon: Stethoscope,
            color: "orange"
        }
    ];

    const renderOverview = () => (
        <>
            {/* Dashboard Statistics */}
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
                                {loading ? "..." : stat.value}
                            </h2>

                            <h3>{stat.label}</h3>

                            <p>
                                {stat.label === "Total Appointments"
                                    ? "Your overall consultations"
                                    : stat.label === "Upcoming"
                                    ? "Your scheduled consultations"
                                    : stat.label === "Completed"
                                    ? "Your completed consultations"
                                    : "Currently registered doctors"}
                            </p>

                        </div>
                    );
                })}

            </div>

            {error && (
                <div className="department-alert">
                    {error}
                </div>
            )}

            {/* Appointment Management */}
            <PatientAppointmentManagement />

            {/* Doctor Directory */}
            <div className="dashboard-section" id="doctors">
                <PatientDoctorDirectory />
            </div>

            {/* Patient Profile */}
            <PatientProfileManagement />
        </>
    );

    return (
        <DashboardLayout
            role="patient"
            navItems={navItems}
            activeTarget={activeTarget}
            onNavigate={setActiveTarget}
            title="Patient Dashboard"
            subtitle="Your health journey starts here. Manage your care with ease."
        >

            {/* Overview: Show everything */}
            {activeTarget === "overview" && renderOverview()}

            {/* Individual Sections */}
            {activeTarget === "appointments" && (
                <PatientAppointmentManagement />
            )}

            {activeTarget === "doctors" && (
                <div className="dashboard-section" id="doctors">
                    <PatientDoctorDirectory />
                </div>
            )}

            {activeTarget === "profile" && (
                <PatientProfileManagement />
            )}

        </DashboardLayout>
    );
}

export default PatientDashboard;
