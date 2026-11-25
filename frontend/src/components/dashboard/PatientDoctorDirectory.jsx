
import { useEffect, useMemo, useState } from "react";
import {
    Stethoscope,
    Search,
    GraduationCap,
    BriefcaseMedical,
    IndianRupee,
    Building2,
    RefreshCw,
    UserRound,
    CalendarDays,
    Clock,
    X,
    CheckCircle
} from "lucide-react";

import api from "../../services/api";

function PatientDoctorDirectory() {
    const [doctors, setDoctors] = useState([]);
    const [search, setSearch] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Booking state
    const [bookingDoctor, setBookingDoctor] = useState(null);
    const [slots, setSlots] = useState([]);
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [reason, setReason] = useState("");
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingError, setBookingError] = useState("");
    const [bookingSuccess, setBookingSuccess] = useState("");

    const fetchDoctors = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/doctors/available");
            setDoctors(response.data.doctors || []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load doctors. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDoctors();
    }, []);

    const departments = useMemo(() => {
        return [
            ...new Set(
                doctors
                    .map((doctor) => doctor.department_name)
                    .filter(Boolean)
            )
        ].sort();
    }, [doctors]);

    const filteredDoctors = useMemo(() => {
        return doctors.filter((doctor) => {
            const searchText = search.toLowerCase();

            const matchesSearch =
                doctor.name?.toLowerCase().includes(searchText) ||
                doctor.specialization?.toLowerCase().includes(searchText) ||
                doctor.qualification?.toLowerCase().includes(searchText) ||
                doctor.department_name?.toLowerCase().includes(searchText);

            const matchesDepartment =
                selectedDepartment === "all" ||
                doctor.department_name === selectedDepartment;

            return matchesSearch && matchesDepartment;
        });
    }, [doctors, search, selectedDepartment]);

    const availableDates = useMemo(() => {
        return [...new Set(slots.map((slot) => {
            return String(slot.slot_date).slice(0, 10);
        }))].sort();
    }, [slots]);

    const dateSlots = useMemo(() => {
        return slots.filter((slot) => {
            return String(slot.slot_date).slice(0, 10) === selectedDate;
        });
    }, [slots, selectedDate]);

    const openBooking = async (doctor) => {
        setBookingDoctor(doctor);
        setSlots([]);
        setSelectedDate("");
        setSelectedSlot(null);
        setReason("");
        setBookingError("");
        setBookingSuccess("");
        setSlotsLoading(true);

        try {
            const response = await api.get(
                `/appointments/available/${doctor.doctor_id}`
            );

            const availableSlots = response.data.slots || [];

            setSlots(availableSlots);

            if (availableSlots.length > 0) {
                setSelectedDate(
                    String(availableSlots[0].slot_date).slice(0, 10)
                );
            }
        } catch (err) {
            setBookingError(
                err.response?.data?.message ||
                "Unable to retrieve available appointment slots."
            );
        } finally {
            setSlotsLoading(false);
        }
    };

    const closeBooking = () => {
        if (bookingLoading) return;

        setBookingDoctor(null);
        setSlots([]);
        setSelectedSlot(null);
        setReason("");
        setBookingError("");
        setBookingSuccess("");
    };

    const handleBooking = async () => {
        if (!selectedSlot) {
            setBookingError("Please select an appointment time.");
            return;
        }

        if (!reason.trim()) {
            setBookingError("Please provide a reason for your appointment.");
            return;
        }

        try {
            setBookingLoading(true);
            setBookingError("");

            const response = await api.post("/appointments/book", {
                slot_id: selectedSlot.id,
                reason: reason.trim()
            });

            setBookingSuccess(
                response.data.message ||
                "Appointment request submitted successfully."
            );

            setSlots((previousSlots) =>
                previousSlots.filter(
                    (slot) => slot.id !== selectedSlot.id
                )
            );

            setSelectedSlot(null);
            setReason("");
        } catch (err) {
            setBookingError(
                err.response?.data?.message ||
                "Unable to book this appointment. Please try again."
            );
        } finally {
            setBookingLoading(false);
        }
    };

    const formatDate = (date) => {
        return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    };

    const formatTime = (time) => {
        const [hours, minutes] = String(time).split(":");
        const date = new Date();
        date.setHours(Number(hours), Number(minutes), 0, 0);

        return date.toLocaleTimeString("en-IN", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true
        });
    };

    return (
        <div className="dashboard-section" id="doctors">
            <div className="section-heading">
                <div>
                    <h2>Find a Doctor</h2>
                    <p>
                        Explore our healthcare professionals and find the
                        right specialist for your needs.
                    </p>
                </div>

                <button
                    className="department-btn secondary"
                    onClick={fetchDoctors}
                    disabled={loading}
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            <div className="doctor-directory-toolbar">
                <div className="doctor-search">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, specialization or qualification..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                >
                    <option value="all">All Departments</option>

                    {departments.map((department) => (
                        <option key={department} value={department}>
                            {department}
                        </option>
                    ))}
                </select>
            </div>

            {error && (
                <div className="department-alert error">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="empty-state">
                    <RefreshCw size={32} />
                    <h3>Loading doctors...</h3>
                    <p>Please wait while we retrieve the doctor directory.</p>
                </div>
            ) : filteredDoctors.length === 0 ? (
                <div className="empty-state">
                    <Stethoscope size={36} />
                    <h3>
                        {doctors.length === 0
                            ? "No doctors available"
                            : "No matching doctors found"}
                    </h3>
                    <p>
                        {doctors.length === 0
                            ? "There are currently no doctors available for consultation."
                            : "Try changing your search or department filter."}
                    </p>
                </div>
            ) : (
                <>
                    <div className="doctor-directory-count">
                        Showing {filteredDoctors.length} of {doctors.length} doctors
                    </div>

                    <div className="doctor-directory-grid">
                        {filteredDoctors.map((doctor) => (
                            <div
                                className="doctor-directory-card"
                                key={doctor.doctor_id}
                            >
                                <div className="doctor-directory-header">
                                    <div className="doctor-avatar">
                                        <UserRound size={27} />
                                    </div>

                                    <div>
                                        <h3>Dr. {doctor.name}</h3>
                                        <span>{doctor.specialization}</span>
                                    </div>
                                </div>

                                <div className="doctor-directory-details">
                                    <div>
                                        <Building2 size={17} />
                                        <span>
                                            {doctor.department_name || "Department not specified"}
                                        </span>
                                    </div>

                                    <div>
                                        <GraduationCap size={17} />
                                        <span>
                                            {doctor.qualification || "Qualification not specified"}
                                        </span>
                                    </div>

                                    <div>
                                        <BriefcaseMedical size={17} />
                                        <span>
                                            {doctor.experience_years} years experience
                                        </span>
                                    </div>

                                    <div>
                                        <IndianRupee size={17} />
                                        <span>
                                            {Number(doctor.consultation_fee || 0).toLocaleString("en-IN")}
                                            {" "}consultation fee
                                        </span>
                                    </div>
                                </div>

                                {doctor.bio && (
                                    <p className="doctor-directory-bio">
                                        {doctor.bio}
                                    </p>
                                )}

                                <div className="doctor-directory-footer">
                                    <span className="doctor-available-status">
                                        Available
                                    </span>

                                    <button
                                        className="department-btn primary"
                                        onClick={() => openBooking(doctor)}
                                    >
                                        <CalendarDays size={16} />
                                        Book Appointment
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {bookingDoctor && (
                <div className="booking-modal-overlay">
                    <div className="booking-modal">
                        <div className="booking-modal-header">
                            <div>
                                <h2>Book Appointment</h2>
                                <p>
                                    Dr. {bookingDoctor.name} · {bookingDoctor.specialization}
                                </p>
                            </div>

                            <button
                                className="booking-close-btn"
                                onClick={closeBooking}
                                disabled={bookingLoading}
                            >
                                <X size={21} />
                            </button>
                        </div>

                        {bookingSuccess ? (
                            <div className="booking-success">
                                <CheckCircle size={48} />
                                <h3>Booking Request Submitted!</h3>
                                <p>{bookingSuccess}</p>
                                <p>
                                    Your appointment is pending confirmation
                                    from the doctor.
                                </p>

                                <button
                                    className="department-btn primary"
                                    onClick={closeBooking}
                                >
                                    Done
                                </button>
                            </div>
                        ) : (
                            <>
                                {bookingError && (
                                    <div className="department-alert error">
                                        {bookingError}
                                    </div>
                                )}

                                {slotsLoading ? (
                                    <div className="empty-state">
                                        <RefreshCw size={30} />
                                        <h3>Loading available slots...</h3>
                                    </div>
                                ) : slots.length === 0 ? (
                                    <div className="empty-state">
                                        <CalendarDays size={36} />
                                        <h3>No available slots</h3>
                                        <p>
                                            This doctor currently has no
                                            available future appointment slots.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="booking-field">
                                            <label>Select Date</label>
                                            <select
                                                value={selectedDate}
                                                onChange={(e) => {
                                                    setSelectedDate(e.target.value);
                                                    setSelectedSlot(null);
                                                }}
                                            >
                                                {availableDates.map((date) => (
                                                    <option key={date} value={date}>
                                                        {formatDate(date)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="booking-field">
                                            <label>Select Time</label>

                                            <div className="booking-slot-grid">
                                                {dateSlots.map((slot) => (
                                                    <button
                                                        key={slot.id}
                                                        className={`booking-slot ${
                                                            selectedSlot?.id === slot.id
                                                                ? "selected"
                                                                : ""
                                                        }`}
                                                        onClick={() => {
                                                            setSelectedSlot(slot);
                                                            setBookingError("");
                                                        }}
                                                    >
                                                        <Clock size={15} />
                                                        {formatTime(slot.start_time)}
                                                        {" - "}
                                                        {formatTime(slot.end_time)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="booking-field">
                                            <label htmlFor="booking-reason">
                                                Reason for Appointment
                                            </label>
                                            <textarea
                                                id="booking-reason"
                                                rows="3"
                                                placeholder="Briefly describe why you need this consultation..."
                                                value={reason}
                                                onChange={(e) => setReason(e.target.value)}
                                            />
                                        </div>

                                        <div className="booking-fee">
                                            <span>Consultation Fee</span>
                                            <strong>
                                                ₹{Number(
                                                    bookingDoctor.consultation_fee || 0
                                                ).toLocaleString("en-IN")}
                                            </strong>
                                        </div>

                                        <button
                                            className="department-btn primary booking-submit"
                                            onClick={handleBooking}
                                            disabled={bookingLoading || !selectedSlot}
                                        >
                                            {bookingLoading
                                                ? "Submitting..."
                                                : "Confirm Appointment"}
                                        </button>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default PatientDoctorDirectory;
