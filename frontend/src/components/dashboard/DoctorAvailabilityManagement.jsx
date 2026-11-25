
import { useEffect, useState } from "react";
import {
    CalendarDays,
    Clock,
    Plus,
    RefreshCw,
    Pencil,
    Trash2,
    X,
    CheckCircle,
    Lock
} from "lucide-react";

import api from "../../services/api";

const getToday = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const formatDate = (date) => {
    if (!date) return "—";

    return new Date(`${String(date).slice(0, 10)}T00:00:00`)
        .toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
};

const formatTime = (time) => {
    if (!time) return "—";

    const [hours, minutes] = String(time).slice(0, 5).split(":");
    const date = new Date();
    date.setHours(Number(hours), Number(minutes));

    return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });
};

const getErrorMessage = (error) => {
    return error.response?.data?.message ||
        "Something went wrong. Please try again.";
};

function DoctorAvailabilityManagement() {
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [editingSlot, setEditingSlot] = useState(null);

    const initialForm = {
        slot_date: "",
        start_time: "",
        end_time: ""
    };

    const [form, setForm] = useState(initialForm);

    const fetchSlots = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get(
                "/appointments/doctor/calendar"
            );

            setSlots(response.data.slots || []);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSlots();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const resetForm = () => {
        setForm(initialForm);
        setEditingSlot(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (!form.slot_date || !form.start_time || !form.end_time) {
            setError("Please fill in all the fields.");
            return;
        }

        if (form.start_time >= form.end_time) {
            setError("End time must be later than start time.");
            return;
        }

        try {
            setSaving(true);

            if (editingSlot) {
                await api.patch(
                    `/appointments/slots/${editingSlot.id}`,
                    form
                );

                setSuccess("Availability slot updated successfully.");
            } else {
                await api.post("/appointments/slots", form);

                setSuccess("Availability slot created successfully.");
            }

            resetForm();
            await fetchSlots();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (slot) => {
        if (slot.is_booked || slot.appointment) return;

        setEditingSlot(slot);

        setForm({
            slot_date: String(slot.slot_date).slice(0, 10),
            start_time: String(slot.start_time).slice(0, 5),
            end_time: String(slot.end_time).slice(0, 5)
        });

        setError("");
        setSuccess("");

        document.getElementById("availability-form")?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    };

    const handleDelete = async (slot) => {
        if (slot.is_booked || slot.appointment) return;

        const confirmed = window.confirm(
            "Are you sure you want to delete this availability slot?"
        );

        if (!confirmed) return;

        try {
            setError("");
            setSuccess("");

            await api.delete(`/appointments/slots/${slot.id}`);

            setSuccess("Availability slot deleted successfully.");
            await fetchSlots();
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    const bookedSlots = slots.filter(
        (slot) => slot.is_booked || slot.appointment
    ).length;

    const availableSlots = slots.length - bookedSlots;

    return (
        <section className="dashboard-section" id="availability">

            <div className="section-heading">
                <div>
                    <h2>Appointment Availability</h2>
                    <p>
                        Create and manage the time slots when patients
                        can book appointments with you.
                    </p>
                </div>

                <button
                    type="button"
                    className="department-refresh-btn"
                    onClick={fetchSlots}
                    disabled={loading}
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            {/* Availability Summary */}

            <div className="department-summary">

                <div className="department-summary-card">
                    <div className="department-summary-icon">
                        <CalendarDays size={22} />
                    </div>

                    <div>
                        <h3>{slots.length}</h3>
                        <p>Total Slots</p>
                    </div>
                </div>

                <div className="department-summary-card">
                    <div className="department-summary-icon">
                        <CheckCircle size={22} />
                    </div>

                    <div>
                        <h3>{availableSlots}</h3>
                        <p>Available Slots</p>
                    </div>
                </div>

                <div className="department-summary-card">
                    <div className="department-summary-icon">
                        <Lock size={22} />
                    </div>

                    <div>
                        <h3>{bookedSlots}</h3>
                        <p>Booked Slots</p>
                    </div>
                </div>

            </div>

            {/* Add / Edit Availability Form */}

            <div
                className="department-table-container availability-form-container"
                id="availability-form"
            >
                <div className="availability-form-heading">
                    <div>
                        <h3>
                            {editingSlot ? "Edit Availability" : "Add Availability"}
                        </h3>
                        <p>
                            Set the date and time range for patient appointments.
                        </p>
                    </div>

                    {editingSlot && (
                        <button
                            type="button"
                            className="availability-cancel-btn"
                            onClick={resetForm}
                        >
                            <X size={16} />
                            Cancel Edit
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="availability-form">

                    <div className="availability-form-field">
                        <label htmlFor="slot_date">Date</label>
                        <input
                            type="date"
                            id="slot_date"
                            name="slot_date"
                            min={getToday()}
                            value={form.slot_date}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="availability-form-field">
                        <label htmlFor="start_time">Start Time</label>
                        <input
                            type="time"
                            id="start_time"
                            name="start_time"
                            value={form.start_time}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="availability-form-field">
                        <label htmlFor="end_time">End Time</label>
                        <input
                            type="time"
                            id="end_time"
                            name="end_time"
                            value={form.end_time}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="availability-submit-btn"
                        disabled={saving}
                    >
                        {editingSlot ? <Pencil size={16} /> : <Plus size={17} />}
                        {saving
                            ? "Saving..."
                            : editingSlot
                                ? "Update Slot"
                                : "Add Slot"}
                    </button>

                </form>
            </div>

            {/* Messages */}

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

            {/* Slots Table */}

            <div className="department-table-container">

                <div className="availability-list-heading">
                    <div>
                        <h3>Your Availability Slots</h3>
                        <p>
                            Manage your existing appointment availability.
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="empty-state">
                        Loading availability slots...
                    </div>
                ) : slots.length === 0 ? (
                    <div className="empty-state">
                        <CalendarDays size={32} />
                        <h3>No availability slots yet</h3>
                        <p>
                            Add your first availability slot using the form above.
                        </p>
                    </div>
                ) : (
                    <div className="department-table-scroll">
                        <table className="department-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Start Time</th>
                                    <th>End Time</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {slots.map((slot) => {
                                    const isBooked =
                                        slot.is_booked || Boolean(slot.appointment);

                                    return (
                                        <tr key={slot.id}>
                                            <td>
                                                <strong>
                                                    {formatDate(slot.slot_date)}
                                                </strong>
                                            </td>

                                            <td>
                                                {formatTime(slot.start_time)}
                                            </td>

                                            <td>
                                                {formatTime(slot.end_time)}
                                            </td>

                                            <td>
                                                <span
                                                    className={`availability-status ${
                                                        isBooked
                                                            ? "booked"
                                                            : "available"
                                                    }`}
                                                >
                                                    {isBooked
                                                        ? "Booked"
                                                        : "Available"}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="availability-actions">
                                                    {isBooked ? (
                                                        <span className="availability-locked">
                                                            <Lock size={15} />
                                                            Locked
                                                        </span>
                                                    ) : (
                                                        <>
                                                            <button
                                                                type="button"
                                                                className="availability-edit-btn"
                                                                title="Edit slot"
                                                                onClick={() =>
                                                                    handleEdit(slot)
                                                                }
                                                            >
                                                                <Pencil size={16} />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="availability-delete-btn"
                                                                title="Delete slot"
                                                                onClick={() =>
                                                                    handleDelete(slot)
                                                                }
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

            </div>

        </section>
    );
}

export default DoctorAvailabilityManagement;
