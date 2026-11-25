
import { useEffect, useMemo, useState } from "react";
import {
    CalendarDays,
    Clock,
    Search,
    RefreshCw,
    XCircle,
    UserRound,
    Stethoscope,
    Filter,
    AlertCircle
} from "lucide-react";

import api from "../../services/api";


const API_URL = "http://localhost:5000/api";

const statusStyles = {
    pending: "status-pending",
    confirmed: "status-confirmed",
    rejected: "status-rejected",
    cancelled: "status-cancelled",
    completed: "status-completed"
};

function AppointmentManagement() {
    const [appointments, setAppointments] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const getToken = () => localStorage.getItem("token");

    const fetchAppointments = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const response = await api.get("/appointments/admin/all");

            setAppointments(response.data.appointments || []);

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load appointments."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const filteredAppointments = useMemo(() => {
        return appointments.filter((appointment) => {
            const matchesStatus =
                statusFilter === "all" ||
                appointment.status === statusFilter;

            const search = searchTerm.toLowerCase();

            const matchesSearch =
                (appointment.patient_name || "")
                    .toLowerCase()
                    .includes(search) ||
                (appointment.doctor_name || "")
                    .toLowerCase()
                    .includes(search);

            return matchesStatus && matchesSearch;
        });
    }, [appointments, searchTerm, statusFilter]);

    const cancelAppointment = async (appointment) => {
        const confirmed = window.confirm(
            `Are you sure you want to cancel appointment #${appointment.appointment_id}?`
        );

        if (!confirmed) return;

        try {
            setError("");
            setMessage("");

            await api.patch(
                `/appointments/admin/${appointment.appointment_id}/status`,
                {
                    action: "cancel"
                }
            );

            setMessage("Appointment cancelled successfully.");

            await fetchAppointments(true);

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to cancel appointment."
            );
        }
    };

    const formatDate = (date) => {
        if (!date) return "N/A";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            timeZone: "UTC"
        });
    };

    const formatTime = (time) => {
        if (!time) return "N/A";

        const [hours, minutes] = time.split(":");

        const date = new Date();
        date.setHours(Number(hours), Number(minutes));

        return date.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        });
    };

    const statusCounts = {
        all: appointments.length,
        pending: appointments.filter(a => a.status === "pending").length,
        confirmed: appointments.filter(a => a.status === "confirmed").length,
        completed: appointments.filter(a => a.status === "completed").length,
        cancelled: appointments.filter(a => a.status === "cancelled").length,
        rejected: appointments.filter(a => a.status === "rejected").length
    };

    return (
        <div className="appointment-management">

            {/* Header */}
            <div className="management-header">
                <div>
                    <h2>Appointment Management</h2>
                    <p>
                        Manage and monitor hospital appointments
                    </p>
                </div>

                <button
                    className="refresh-btn"
                    onClick={() => fetchAppointments(true)}
                    disabled={refreshing}
                >
                    <RefreshCw
                        size={17}
                        className={refreshing ? "spin" : ""}
                    />
                    {refreshing ? "Refreshing..." : "Refresh"}
                </button>
            </div>

            {/* Messages */}
            {error && (
                <div className="appointment-alert error-alert">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {message && (
                <div className="appointment-alert success-alert">
                    {message}
                </div>
            )}

            {/* Statistics */}
            <div className="appointment-stats">

                <div className="appointment-stat-card">
                    <span>Total Appointments</span>
                    <h3>{statusCounts.all}</h3>
                </div>

                <div className="appointment-stat-card">
                    <span>Pending</span>
                    <h3>{statusCounts.pending}</h3>
                </div>

                <div className="appointment-stat-card">
                    <span>Confirmed</span>
                    <h3>{statusCounts.confirmed}</h3>
                </div>

                <div className="appointment-stat-card">
                    <span>Completed</span>
                    <h3>{statusCounts.completed}</h3>
                </div>

            </div>

            {/* Filters */}
            <div className="appointment-toolbar">

                <div className="appointment-search">
                    <Search size={18} />

                    <input
                        type="text"
                        placeholder="Search patient or doctor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="appointment-filter">
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

            {/* Appointment Table */}
            <div className="appointment-table-container">

                {loading ? (
                    <div className="appointment-loading">
                        Loading appointments...
                    </div>
                ) : filteredAppointments.length === 0 ? (
                    <div className="appointment-empty">
                        <CalendarDays size={38} />
                        <h3>No appointments found</h3>
                        <p>
                            Try changing your search or status filter.
                        </p>
                    </div>
                ) : (

                    <div className="table-responsive">
                        <table className="appointment-table">

                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Patient</th>
                                    <th>Doctor</th>
                                    <th>Department</th>
                                    <th>Date & Time</th>
                                    <th>Reason</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredAppointments.map((appointment) => (
                                    <tr key={appointment.appointment_id}>

                                        <td>
                                            #{appointment.appointment_id}
                                        </td>

                                        <td>
                                            <div className="appointment-person">
                                                <UserRound size={17} />

                                                <div>
                                                    <strong>
                                                        {appointment.patient_name}
                                                    </strong>
                                                    <small>
                                                        {appointment.patient_email}
                                                    </small>
                                                    <small>
                                                        {appointment.patient_phone || "No phone"}
                                                    </small>
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            <div className="appointment-person">
                                                <Stethoscope size={17} />

                                                <div>
                                                    <strong>
                                                        {appointment.doctor_name}
                                                    </strong>
                                                    <small>
                                                        {appointment.specialization}
                                                    </small>
                                                    <small>
                                                        {appointment.doctor_email}
                                                    </small>
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            {appointment.department || "N/A"}
                                        </td>

                                        <td>
                                            <div className="appointment-date">
                                                <strong>
                                                    <CalendarDays size={15} />
                                                    {formatDate(appointment.slot_date)}
                                                </strong>

                                                <small>
                                                    <Clock size={14} />
                                                    {formatTime(appointment.start_time)}
                                                    {" - "}
                                                    {formatTime(appointment.end_time)}
                                                </small>
                                            </div>
                                        </td>

                                        <td className="appointment-reason">
                                            {appointment.reason || "N/A"}
                                        </td>

                                        <td>
                                            <span
                                                className={`appointment-status ${
                                                    statusStyles[appointment.status] || ""
                                                }`}
                                            >
                                                {appointment.status}
                                            </span>
                                        </td>

                                        <td>
                                            {["pending", "confirmed"].includes(
                                                appointment.status
                                            ) ? (
                                                <button
                                                    className="cancel-appointment-btn"
                                                    onClick={() =>
                                                        cancelAppointment(appointment)
                                                    }
                                                    title="Cancel appointment"
                                                >
                                                    <XCircle size={16} />
                                                    Cancel
                                                </button>
                                            ) : (
                                                <span className="no-action">
                                                    —
                                                </span>
                                            )}
                                        </td>

                                    </tr>
                                ))}
                            </tbody>

                        </table>
                    </div>
                )}

            </div>

            <div className="appointment-footer">
                Showing {filteredAppointments.length} of {appointments.length} appointments
            </div>

        </div>
    );
}

export default AppointmentManagement;
