
import { useEffect, useState } from "react";

import {
    Users,
    Search,
    RefreshCw,
    Power,
    Mail,
    Phone,
    CalendarDays
} from "lucide-react";

import api from "../../services/api";

function PatientManagement() {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [searchTerm, setSearchTerm] = useState("");

    // Fetch all registered patients.
    const fetchPatients = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/users/admin/patients");

            setPatients(response.data.patients || []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load patients."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, []);

    // Activate or deactivate a patient account.
    const togglePatientStatus = async (patient) => {
        const action = patient.is_active
            ? "deactivate"
            : "activate";

        const confirmed = window.confirm(
            `Are you sure you want to ${action} ${patient.name}'s account?`
        );

        if (!confirmed) return;

        try {
            setError("");
            setSuccess("");

            await api.patch(
                `/users/admin/patients/${patient.id}/active`,
                {
                    is_active: !patient.is_active
                }
            );

            setSuccess(
                `${patient.name}'s account ${action}d successfully.`
            );

            await fetchPatients();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to update patient status."
            );
        }
    };

    // Format registration date.
    const formatDate = (date) => {
        if (!date) return "—";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    };

    // Filter patients using the search input.
    const filteredPatients = patients.filter((patient) => {
        const search = searchTerm.toLowerCase();

        return (
            patient.name?.toLowerCase().includes(search) ||
            patient.email?.toLowerCase().includes(search) ||
            patient.phone?.toLowerCase().includes(search)
        );
    });

    const activePatients = patients.filter(
        (patient) => patient.is_active
    ).length;

    const inactivePatients = patients.length - activePatients;

    return (
        <section
            className="dashboard-section department-section"
            id="patients"
        >
            {/* Heading */}
            <div className="section-heading department-heading">
                <div>
                    <h2>Patient Management</h2>
                    <p>
                        View and manage registered patient accounts.
                    </p>
                </div>
            </div>

            {/* Feedback messages */}
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

            {/* Patient summary */}
            <div className="department-summary">

                <div className="department-summary-card">
                    <Users size={22} />

                    <div>
                        <strong>{patients.length}</strong>
                        <span>Total Patients</span>
                    </div>
                </div>

                <div className="department-summary-card">
                    <Power size={22} />

                    <div>
                        <strong>{activePatients}</strong>
                        <span>Active Patients</span>
                    </div>
                </div>

                <div className="department-summary-card">
                    <Power size={22} />

                    <div>
                        <strong>{inactivePatients}</strong>
                        <span>Inactive Patients</span>
                    </div>
                </div>

            </div>

            {/* Patient table */}
            <div className="department-table-container">

                <div className="department-table-header">
                    <div>
                        <h3>Registered Patients</h3>
                        <p>
                            {filteredPatients.length} patient(s) found
                        </p>
                    </div>

                    <button
                        className="department-refresh"
                        onClick={fetchPatients}
                        disabled={loading}
                    >
                        <RefreshCw size={15} />
                        Refresh
                    </button>
                </div>

                {/* Search */}
                <div className="doctor-toolbar">
                    <div className="doctor-search">
                        <Search size={17} />

                        <input
                            type="text"
                            placeholder="Search by name, email or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="department-loading">
                        <RefreshCw size={22} />
                        <p>Loading patients...</p>
                    </div>
                ) : filteredPatients.length === 0 ? (
                    <div className="empty-state">
                        <Users size={35} />

                        <h3>No patients found</h3>

                        <p>
                            {searchTerm
                                ? "Try changing your search term."
                                : "Registered patients will appear here."}
                        </p>
                    </div>
                ) : (
                    <div className="department-table-scroll">
                        <table className="department-table">
                            <thead>
                                <tr>
                                    <th>Patient</th>
                                    <th>Contact Information</th>
                                    <th>Registered On</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredPatients.map((patient) => (
                                    <tr key={patient.id}>
                                        {/* Patient name */}
                                        <td>
                                            <div className="doctor-name-cell">
                                                <div className="doctor-avatar">
                                                    {patient.name
                                                        ?.charAt(0)
                                                        .toUpperCase()}
                                                </div>

                                                <div>
                                                    <strong>
                                                        {patient.name}
                                                    </strong>

                                                    <span>
                                                        Patient #{patient.id}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Contact */}
                                        <td>
                                            <div className="patient-contact">
                                                <span>
                                                    <Mail size={14} />
                                                    {patient.email}
                                                </span>

                                                <span>
                                                    <Phone size={14} />
                                                    {patient.phone || "Not provided"}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Registration date */}
                                        <td>
                                            <span className="patient-date">
                                                <CalendarDays size={14} />
                                                {formatDate(patient.created_at)}
                                            </span>
                                        </td>

                                        {/* Status */}
                                        <td>
                                            <span
                                                className={`department-status ${
                                                    patient.is_active
                                                        ? "active"
                                                        : "inactive"
                                                }`}
                                            >
                                                {patient.is_active
                                                    ? "Active"
                                                    : "Inactive"}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td>
                                            <div className="department-actions">
                                                <button
                                                    className={`department-toggle-button ${
                                                        patient.is_active
                                                            ? "deactivate"
                                                            : "activate"
                                                    }`}
                                                    title={
                                                        patient.is_active
                                                            ? "Deactivate patient"
                                                            : "Activate patient"
                                                    }
                                                    onClick={() =>
                                                        togglePatientStatus(patient)
                                                    }
                                                >
                                                    <Power size={16} />
                                                </button>
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

export default PatientManagement;
