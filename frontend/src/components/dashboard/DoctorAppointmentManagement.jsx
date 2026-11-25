
import { useEffect, useMemo, useState } from "react";

import {
    CalendarCheck,
    Clock,
    CheckCircle,
    XCircle,
    RefreshCw,
    Search,
    UserRound,
    Filter
} from "lucide-react";

import api from "../../services/api";

function DoctorAppointmentManagement() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    // Fetch appointments belonging to the logged-in doctor.
    const fetchAppointments = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/appointments/doctor/mine");

            setAppointments(response.data.appointments || []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load appointments."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    // Update appointment status.
    const updateStatus = async (appointment, action) => {
        const actionLabels = {
            confirm: "confirm",
            reject: "reject",
            complete: "mark as completed"
        };

        const confirmed = window.confirm(
            `Are you sure you want to ${actionLabels[action]} appointment #${appointment.appointment_id}?`
        );

        if (!confirmed) return;

        try {
            setUpdatingId(appointment.appointment_id);
            setError("");
            setSuccess("");

            await api.patch(
                `/appointments/${appointment.appointment_id}/status`,
                { action }
            );

            setSuccess(
                `Appointment #${appointment.appointment_id} updated successfully.`
            );

            await fetchAppointments();

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to update appointment."
            );
        } finally {
            setUpdatingId(null);
        }
    };

    // Format appointment date.
    const formatDate = (date) => {
        if (!date) return "—";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            timeZone: "UTC"
        });
    };

    // Format time.
    const formatTime = (time) => {
        if (!time) return "—";

        const [hours, minutes] = String(time).split(":");

        const date = new Date();
        date.setHours(Number(hours), Number(minutes), 0, 0);

        return date.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        });
    };

    // Search and status filtering.
    const filteredAppointments = useMemo(() => {
        return appointments.filter((appointment) => {
            const search = searchTerm.toLowerCase();

            const matchesSearch =
                appointment.patient_name?.toLowerCase().includes(search) ||
                appointment.patient_email?.toLowerCase().includes(search) ||
                String(appointment.appointment_id).includes(search);

            const matchesStatus =
                statusFilter === "all" ||
                appointment.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [appointments, searchTerm, statusFilter]);

    const pendingCount = appointments.filter(
        (a) => a.status === "pending"
    ).length;

    const confirmedCount = appointments.filter(
        (a) => a.status === "confirmed"
    ).length;

    const completedCount = appointments.filter(
        (a) => a.status === "completed"
    ).length;

    const getStatusClass = (status) => {
        return `doctor-appointment-status status-${status}`;
    };

    return (
        <section
            className="dashboard-section doctor-appointments"
            id="doctor-appointments-management"
        >
            {/* Heading */}
            <div className="section-heading">
                <div>
                    <h2>Appointment Management</h2>
                    <p>
                        Review and manage appointments assigned to you.
                    </p>
                </div>

                <button
                    className="doctor-refresh-button"
                    onClick={fetchAppointments}
                    disabled={loading}
                >
                    <RefreshCw
                        size={17}
                        className={loading ? "spin" : ""}
                    />
                    Refresh
                </button>
            </div>

            {/* Feedback */}
            {error && (
                <div className="department-alert error">
                    {error}
                </div>
            )}

            {success && (
                <div className="department-alert success">
                    {success}
                </div>
            )}

            {/* Appointment statistics */}
            <div className="department-summary">

                <div className="department-summary-card">
                    <CalendarCheck size={22} />
                    <div>
                        <strong>{appointments.length}</strong>
                        <span>Total Appointments</span>
                    </div>
                </div>

                <div className="department-summary-card">
                    <Clock size={22} />
                    <div>
                        <strong>{pendingCount}</strong>
                        <span>Pending</span>
                    </div>
                </div>

                <div className="department-summary-card">
                    <CheckCircle size={22} />
                    <div>
                        <strong>{confirmedCount}</strong>
                        <span>Confirmed</span>
                    </div>
                </div>

                <div className="department-summary-card">
                    <CheckCircle size={22} />
                    <div>
                        <strong>{completedCount}</strong>
                        <span>Completed</span>
                    </div>
                </div>

            </div>

            {/* Search and filter */}
            <div className="doctor-appointment-toolbar">

                <div className="doctor-appointment-search">
                    <Search size={18} />

                    <input
                        type="text"
                        placeholder="Search patient name, email or appointment ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="doctor-appointment-filter">
                    <Filter size={17} />

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="rejected">Rejected</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>

            </div>

            {/* Appointment table */}
            <div className="department-table-container">

                <div className="department-table-header">
                    <div>
                        <h3>Your Appointments</h3>
                        <p>
                            {filteredAppointments.length} appointment(s) found
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="department-loading">
                        <RefreshCw size={22} />
                        <p>Loading appointments...</p>
                    </div>
                ) : filteredAppointments.length === 0 ? (
                    <div className="empty-state">
                        <CalendarCheck size={36} />
                        <h3>No appointments found</h3>
                        <p>
                            {searchTerm || statusFilter !== "all"
                                ? "Try changing your search or filter."
                                : "Your appointments will appear here."}
                        </p>
                    </div>
                ) : (
                    <div className="department-table-scroll">
                        <table className="department-table">
                            <thead>
                                <tr>
                                    <th>Appointment</th>
                                    <th>Patient</th>
                                    <th>Date & Time</th>
                                    <th>Reason</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredAppointments.map((appointment) => (
                                    <tr key={appointment.appointment_id}>

                                        <td>
                                            <strong>
                                                #{appointment.appointment_id}
                                            </strong>
                                        </td>

                                        <td>
                                            <div className="doctor-appointment-patient">
                                                <div className="doctor-avatar">
                                                    <UserRound size={18} />
                                                </div>

                                                <div>
                                                    <strong>
                                                        {appointment.patient_name}
                                                    </strong>
                                                    <span>
                                                        {appointment.patient_email}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            <div className="doctor-appointment-date">
                                                <strong>
                                                    {formatDate(appointment.slot_date)}
                                                </strong>
                                                <span>
                                                    <Clock size={13} />
                                                    {formatTime(appointment.start_time)}
                                                    {" - "}
                                                    {formatTime(appointment.end_time)}
                                                </span>
                                            </div>
                                        </td>

                                        <td>
                                            <span className="doctor-appointment-reason">
                                                {appointment.reason || "Not specified"}
                                            </span>
                                        </td>

                                        <td>
                                            <span className={getStatusClass(appointment.status)}>
                                                {appointment.status}
                                            </span>
                                        </td>

                                        <td>
                                            <div className="doctor-appointment-actions">

                                                {appointment.status === "pending" && (
                                                    <>
                                                        <button
                                                            className="doctor-appointment-action confirm"
                                                            title="Confirm appointment"
                                                            disabled={updatingId === appointment.appointment_id}
                                                            onClick={() => updateStatus(appointment, "confirm")}
                                                        >
                                                            <CheckCircle size={16} />
                                                        </button>

                                                        <button
                                                            className="doctor-appointment-action reject"
                                                            title="Reject appointment"
                                                            disabled={updatingId === appointment.appointment_id}
                                                            onClick={() => updateStatus(appointment, "reject")}
                                                        >
                                                            <XCircle size={16} />
                                                        </button>
                                                    </>
                                                )}

                                                {appointment.status === "confirmed" && (
                                                    <button
                                                        className="doctor-appointment-action complete"
                                                        title="Mark as completed"
                                                        disabled={updatingId === appointment.appointment_id}
                                                        onClick={() => updateStatus(appointment, "complete")}
                                                    >
                                                        <CheckCircle size={16} />
                                                    </button>
                                                )}

                                                {updatingId === appointment.appointment_id && (
                                                    <RefreshCw size={15} className="spin" />
                                                )}

                                                {["completed", "rejected", "cancelled"].includes(appointment.status) && (
                                                    <span className="doctor-appointment-no-action">
                                                        No actions
                                                    </span>
                                                )}

                                            </div>
                                        </td>

                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

            </div>
        </section>
    );
}

export default DoctorAppointmentManagement;
