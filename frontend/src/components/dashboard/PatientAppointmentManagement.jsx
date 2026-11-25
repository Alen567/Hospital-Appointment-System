
import { useEffect, useMemo, useState } from "react";
import {
    CalendarDays,
    Clock,
    UserRound,
    Building2,
    IndianRupee,
    Search,
    RefreshCw,
    XCircle,
    CheckCircle,
    AlertCircle
} from "lucide-react";

import api from "../../services/api";

function formatDate(value) {
    if (!value) return "—";

    const [year, month, day] = String(value).slice(0, 10).split("-");

    return new Date(
        Number(year),
        Number(month) - 1,
        Number(day)
    ).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function formatTime(value) {
    if (!value) return "—";

    const [hours, minutes] = String(value).slice(0, 5).split(":");
    const hour = Number(hours);
    const period = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;

    return `${formattedHour}:${minutes} ${period}`;
}

function isFutureAppointment(appointment) {
    const date = String(appointment.slot_date).slice(0, 10);
    const time = String(appointment.start_time).slice(0, 8);

    const appointmentDate = new Date(`${date}T${time}`);
    return appointmentDate > new Date();
}

function PatientAppointmentManagement() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [cancellingId, setCancellingId] = useState(null);
    const [confirmCancelId, setConfirmCancelId] = useState(null);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/appointments/mine");

            setAppointments(response.data.appointments || []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load your appointments. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const filteredAppointments = useMemo(() => {
        return appointments.filter((appointment) => {
            const searchText = [
                appointment.doctor_name,
                appointment.specialization,
                appointment.department,
                appointment.reason
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            const matchesSearch = searchText.includes(search.toLowerCase());

            const matchesStatus =
                statusFilter === "all" ||
                appointment.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [appointments, search, statusFilter]);

    const handleCancel = async (appointmentId) => {
        try {
            setCancellingId(appointmentId);
            setError("");
            setSuccess("");

            const response = await api.patch(
                `/appointments/${appointmentId}/cancel`
            );

            setSuccess(
                response.data.message || "Appointment cancelled successfully."
            );

            setConfirmCancelId(null);
            await fetchAppointments();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to cancel this appointment. Please try again."
            );
        } finally {
            setCancellingId(null);
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case "confirmed":
                return "status-confirmed";
            case "completed":
                return "status-completed";
            case "cancelled":
                return "status-cancelled";
            case "rejected":
                return "status-rejected";
            case "pending":
            default:
                return "status-pending";
        }
    };

    return (
        <section className="dashboard-section" id="appointments">
            <div className="section-heading">
                <div>
                    <h2>My Appointments</h2>
                    <p>View and manage your consultations.</p>
                </div>

                <button
                    type="button"
                    className="appointment-refresh-btn"
                    onClick={fetchAppointments}
                    disabled={loading}
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="department-alert error">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {success && (
                <div className="department-alert success">
                    <CheckCircle size={18} />
                    {success}
                </div>
            )}

            <div className="appointment-toolbar">
                <div className="appointment-search">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search doctor, department or reason..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="appointment-filter"
                >
                    <option value="all">All appointments</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>

            {loading ? (
                <div className="empty-state">
                    <RefreshCw size={30} />
                    <h3>Loading appointments...</h3>
                    <p>Please wait while we retrieve your appointments.</p>
                </div>
            ) : filteredAppointments.length === 0 ? (
                <div className="empty-state">
                    <CalendarDays size={36} />
                    <h3>
                        {appointments.length === 0
                            ? "No appointments yet"
                            : "No matching appointments"}
                    </h3>
                    <p>
                        {appointments.length === 0
                            ? "Your booked consultations will appear here."
                            : "Try changing your search or status filter."}
                    </p>
                </div>
            ) : (
                <div className="appointment-list">
                    {filteredAppointments.map((appointment) => {
                        const canCancel =
                            ["pending", "confirmed"].includes(appointment.status) &&
                            isFutureAppointment(appointment);

                        return (
                            <article
                                className="appointment-card"
                                key={appointment.appointment_id}
                            >
                                <div className="appointment-card-header">
                                    <div>
                                        <h3>
                                            Dr. {appointment.doctor_name}
                                        </h3>
                                        <p>
                                            {appointment.specialization || "General Practitioner"}
                                        </p>
                                    </div>

                                    <span
                                        className={`appointment-status ${getStatusClass(
                                            appointment.status
                                        )}`}
                                    >
                                        {appointment.status}
                                    </span>
                                </div>

                                <div className="appointment-details">
                                    <div>
                                        <CalendarDays size={17} />
                                        <span>{formatDate(appointment.slot_date)}</span>
                                    </div>

                                    <div>
                                        <Clock size={17} />
                                        <span>
                                            {formatTime(appointment.start_time)} –{" "}
                                            {formatTime(appointment.end_time)}
                                        </span>
                                    </div>

                                    <div>
                                        <Building2 size={17} />
                                        <span>{appointment.department || "—"}</span>
                                    </div>

                                    <div>
                                        <IndianRupee size={17} />
                                        <span>
                                            {appointment.consultation_fee != null
                                                ? `₹${appointment.consultation_fee}`
                                                : "Fee not specified"}
                                        </span>
                                    </div>
                                </div>

                                <div className="appointment-reason">
                                    <strong>Reason for consultation</strong>
                                    <p>{appointment.reason || "Not specified"}</p>
                                </div>

                                {canCancel && (
                                    <div className="appointment-actions">
                                        {confirmCancelId === appointment.appointment_id ? (
                                            <div className="appointment-confirm-cancel">
                                                <span>Are you sure you want to cancel?</span>

                                                <button
                                                    type="button"
                                                    className="appointment-cancel-confirm"
                                                    onClick={() =>
                                                        handleCancel(appointment.appointment_id)
                                                    }
                                                    disabled={
                                                        cancellingId === appointment.appointment_id
                                                    }
                                                >
                                                    {cancellingId === appointment.appointment_id
                                                        ? "Cancelling..."
                                                        : "Yes, cancel"}
                                                </button>

                                                <button
                                                    type="button"
                                                    className="appointment-keep-btn"
                                                    onClick={() => setConfirmCancelId(null)}
                                                    disabled={
                                                        cancellingId === appointment.appointment_id
                                                    }
                                                >
                                                    Keep appointment
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                className="appointment-cancel-btn"
                                                onClick={() =>
                                                    setConfirmCancelId(appointment.appointment_id)
                                                }
                                            >
                                                <XCircle size={16} />
                                                Cancel appointment
                                            </button>
                                        )}
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

export default PatientAppointmentManagement;
