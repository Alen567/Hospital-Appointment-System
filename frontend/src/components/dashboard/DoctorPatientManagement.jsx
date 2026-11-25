
import { useEffect, useState } from "react";
import {
    Users,
    Search,
    RefreshCw,
    Mail,
    Phone,
    CalendarCheck,
    AlertCircle
} from "lucide-react";

import api from "../../services/api";

function DoctorPatientManagement() {
    const [patients, setPatients] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchPatients = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/users/doctor/patients");

            setPatients(response.data.patients || []);
        } catch (err) {
            console.error("Error fetching patients:", err);

            setError(
                err.response?.data?.message ||
                "Unable to load patient records."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, []);

    const filteredPatients = patients.filter((patient) =>
        [
            patient.name,
            patient.email,
            patient.phone
        ]
            .filter(Boolean)
            .some((value) =>
                String(value).toLowerCase().includes(search.toLowerCase())
            )
    );

    const formatDate = (date) => {
        if (!date) return "No appointments";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    };

    return (
        <section className="dashboard-section" id="patients">

            <div className="section-heading">
                <div>
                    <h2>My Patients</h2>
                    <p>
                        View patients who have booked appointments with you.
                    </p>
                </div>

                <button
                    className="department-action-btn"
                    onClick={fetchPatients}
                    disabled={loading}
                    title="Refresh patients"
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            <div className="department-summary">

                <div className="department-summary-card">
                    <div className="department-summary-icon">
                        <Users size={21} />
                    </div>

                    <div>
                        <h3>{patients.length}</h3>
                        <p>Total Patients</p>
                    </div>
                </div>

            </div>

            <div className="patient-toolbar">
                <div className="patient-search">
                    <Search size={18} />

                    <input
                        type="text"
                        placeholder="Search by patient name, email or phone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {error && (
                <div className="department-alert">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {loading ? (
                <div className="empty-state">
                    <RefreshCw size={28} />
                    <h3>Loading patients...</h3>
                </div>
            ) : !error && filteredPatients.length === 0 ? (
                <div className="empty-state">
                    <Users size={36} />

                    <h3>
                        {search
                            ? "No matching patients"
                            : "No patients yet"}
                    </h3>

                    <p>
                        {search
                            ? "Try searching with a different name or contact detail."
                            : "Patients who book appointments with you will appear here."}
                    </p>
                </div>
            ) : !error && (
                <div className="department-table-container">
                    <div className="department-table-scroll">

                        <table className="department-table">
                            <thead>
                                <tr>
                                    <th>Patient</th>
                                    <th>Contact</th>
                                    <th>Total Appointments</th>
                                    <th>Last Appointment</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredPatients.map((patient) => (
                                    <tr key={patient.patient_id}>

                                        <td>
                                            <div className="patient-name-cell">
                                                <div className="patient-avatar">
                                                    {patient.name
                                                        ?.charAt(0)
                                                        .toUpperCase()}
                                                </div>

                                                <strong>{patient.name}</strong>
                                            </div>
                                        </td>

                                        <td>
                                            <div className="patient-contact">
                                                <span>
                                                    <Mail size={14} />
                                                    {patient.email || "Not provided"}
                                                </span>

                                                <span>
                                                    <Phone size={14} />
                                                    {patient.phone || "Not provided"}
                                                </span>
                                            </div>
                                        </td>

                                        <td>
                                            <span className="patient-appointment-count">
                                                <CalendarCheck size={15} />
                                                {patient.total_appointments}
                                            </span>
                                        </td>

                                        <td>
                                            {formatDate(
                                                patient.last_appointment_date
                                            )}
                                        </td>

                                    </tr>
                                ))}
                            </tbody>
                        </table>

                    </div>
                </div>
            )}

        </section>
    );
}

export default DoctorPatientManagement;
