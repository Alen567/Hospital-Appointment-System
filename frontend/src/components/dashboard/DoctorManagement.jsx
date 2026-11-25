
import { useEffect, useState } from "react";
import {
    Plus,
    Pencil,
    Power,
    Stethoscope,
    Users,
    X,
    RefreshCw,
    Search
} from "lucide-react";

import api from "../../services/api";

function DoctorManagement() {
    const [doctors, setDoctors] = useState([]);
    const [departments, setDepartments] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [modalOpen, setModalOpen] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState(null);

    const [searchTerm, setSearchTerm] = useState("");

    const initialFormData = {
        name: "",
        email: "",
        password: "",
        phone: "",
        department_id: "",
        specialization: "",
        qualification: "",
        experience_years: 0,
        consultation_fee: 0,
        bio: ""
    };

    const [formData, setFormData] = useState(initialFormData);

    // Fetch all doctors.
    const fetchDoctors = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/doctors/admin/all");

            setDoctors(response.data.doctors || []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load doctors."
            );
        } finally {
            setLoading(false);
        }
    };

    // Fetch active departments for the dropdown.
    const fetchDepartments = async () => {
        try {
            const response = await api.get("/departments");

            setDepartments(response.data.departments || []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load departments."
            );
        }
    };

    useEffect(() => {
        fetchDoctors();
        fetchDepartments();
    }, []);

    // Open modal for a new doctor.
    const openAddModal = () => {
        setEditingDoctor(null);
        setFormData(initialFormData);
        setError("");
        setSuccess("");
        setModalOpen(true);
    };

    // Open modal for editing an existing doctor.
    const openEditModal = (doctor) => {
        setEditingDoctor(doctor);

        setFormData({
            name: doctor.name || "",
            email: doctor.email || "",
            password: "",
            phone: doctor.phone || "",
            department_id: doctor.department_id?.toString() || "",
            specialization: doctor.specialization || "",
            qualification: doctor.qualification || "",
            experience_years: doctor.experience_years ?? 0,
            consultation_fee: doctor.consultation_fee ?? 0,
            bio: doctor.bio || ""
        });

        setError("");
        setSuccess("");
        setModalOpen(true);
    };

    // Handle form input changes.
    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    // Submit doctor form.
    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (
            !formData.name.trim() ||
            !formData.email.trim() ||
            !formData.department_id ||
            !formData.specialization.trim()
        ) {
            setError("Please fill in all required fields.");
            return;
        }

        if (!editingDoctor && formData.password.length < 8) {
            setError("Password must contain at least 8 characters.");
            return;
        }

        try {
            setSaving(true);

            const payload = {
                name: formData.name.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim() || null,
                department_id: Number(formData.department_id),
                specialization: formData.specialization.trim(),
                qualification: formData.qualification.trim(),
                experience_years: Number(formData.experience_years),
                consultation_fee: Number(formData.consultation_fee),
                bio: formData.bio.trim()
            };

            if (editingDoctor) {
                await api.patch(
                    `/doctors/${editingDoctor.doctor_id}`,
                    payload
                );

                setSuccess("Doctor details updated successfully.");
            } else {
                await api.post("/doctors", {
                    ...payload,
                    password: formData.password
                });

                setSuccess("Doctor account created successfully.");
            }

            setModalOpen(false);
            setFormData(initialFormData);

            await fetchDoctors();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to save doctor details."
            );
        } finally {
            setSaving(false);
        }
    };

    // Activate or deactivate doctor login account.
    const toggleDoctorStatus = async (doctor) => {
        const action = doctor.is_active ? "deactivate" : "activate";

        const confirmed = window.confirm(
            `Are you sure you want to ${action} ${doctor.name}'s account?`
        );

        if (!confirmed) return;

        try {
            setError("");
            setSuccess("");

            await api.patch(
                `/doctors/${doctor.doctor_id}/active`,
                {
                    is_active: !doctor.is_active
                }
            );

            setSuccess(
                `${doctor.name}'s account ${action}d successfully.`
            );

            await fetchDoctors();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to update doctor status."
            );
        }
    };

    // Filter doctors by name, specialization or department.
    const filteredDoctors = doctors.filter((doctor) => {
        const search = searchTerm.toLowerCase();

        return (
            doctor.name?.toLowerCase().includes(search) ||
            doctor.email?.toLowerCase().includes(search) ||
            doctor.specialization?.toLowerCase().includes(search) ||
            doctor.department_name?.toLowerCase().includes(search)
        );
    });

    const activeDoctors = doctors.filter(
        (doctor) => doctor.is_active
    ).length;

    const inactiveDoctors = doctors.length - activeDoctors;

    return (
        <section className="dashboard-section doctor-management" id="doctors-management">

            {/* Heading */}
            <div className="section-heading">
                <div>
                    <h2>Doctor Management</h2>
                    <p>Manage doctor accounts and professional information.</p>
                </div>

                <button
                    className="management-button"
                    onClick={openAddModal}
                >
                    <Plus size={18} />
                    Add Doctor
                </button>
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

            {/* Statistics */}
            <div className="department-summary">

                <div className="department-summary-card">
                    <div className="department-summary-icon blue">
                        <Stethoscope size={22} />
                    </div>

                    <div>
                        <span>Total Doctors</span>
                        <h3>{doctors.length}</h3>
                    </div>
                </div>

                <div className="department-summary-card">
                    <div className="department-summary-icon green">
                        <Users size={22} />
                    </div>

                    <div>
                        <span>Active Doctors</span>
                        <h3>{activeDoctors}</h3>
                    </div>
                </div>

                <div className="department-summary-card">
                    <div className="department-summary-icon orange">
                        <Power size={22} />
                    </div>

                    <div>
                        <span>Inactive Doctors</span>
                        <h3>{inactiveDoctors}</h3>
                    </div>
                </div>

            </div>

            {/* Search and refresh */}
            <div className="doctor-toolbar">
                <div className="doctor-search">
                    <Search size={18} />

                    <input
                        type="text"
                        placeholder="Search doctors, specialization or department..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <button
                    className="doctor-refresh-button"
                    onClick={fetchDoctors}
                    disabled={loading}
                    title="Refresh doctors"
                >
                    <RefreshCw size={17} />
                    Refresh
                </button>
            </div>

            {/* Doctor table */}
            <div className="department-table-container">

                {loading ? (
                    <div className="empty-state">
                        Loading doctors...
                    </div>
                ) : filteredDoctors.length === 0 ? (
                    <div className="empty-state">
                        {searchTerm
                            ? "No doctors match your search."
                            : "No doctors have been added yet."}
                    </div>
                ) : (
                    <table className="department-table">
                        <thead>
                            <tr>
                                <th>Doctor</th>
                                <th>Department</th>
                                <th>Specialization</th>
                                <th>Experience</th>
                                <th>Consultation Fee</th>
                                <th>Account Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredDoctors.map((doctor) => (
                                <tr key={doctor.doctor_id}>

                                    <td>
                                        <div className="doctor-name-cell">
                                            <div className="doctor-avatar">
                                                <Stethoscope size={19} />
                                            </div>

                                            <div>
                                                <strong>{doctor.name}</strong>
                                                <span>{doctor.email}</span>
                                            </div>
                                        </div>
                                    </td>

                                    <td>
                                        {doctor.department_name || "Unassigned"}
                                    </td>

                                    <td>
                                        {doctor.specialization}
                                    </td>

                                    <td>
                                        {doctor.experience_years} years
                                    </td>

                                    <td>
                                        ₹{Number(
                                            doctor.consultation_fee
                                        ).toLocaleString("en-IN")}
                                    </td>

                                    <td>
                                        <span
                                            className={`department-status ${
                                                doctor.is_active
                                                    ? "active"
                                                    : "inactive"
                                            }`}
                                        >
                                            {doctor.is_active
                                                ? "Active"
                                                : "Inactive"}
                                        </span>
                                    </td>

                                    <td>
                                        <div className="department-actions">

                                            <button
                                                className="department-action-button edit"
                                                onClick={() => openEditModal(doctor)}
                                                title="Edit doctor"
                                            >
                                                <Pencil size={16} />
                                            </button>

                                            <button
                                                className={`department-action-button ${
                                                    doctor.is_active
                                                        ? "deactivate"
                                                        : "activate"
                                                }`}
                                                onClick={() => toggleDoctorStatus(doctor)}
                                                title={
                                                    doctor.is_active
                                                        ? "Deactivate doctor"
                                                        : "Activate doctor"
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
                )}

            </div>

            {/* Add/Edit Doctor Modal */}
            {modalOpen && (
                <div
                    className="department-modal-overlay"
                    onClick={() => !saving && setModalOpen(false)}
                >
                    <div
                        className="department-modal doctor-modal"
                        onClick={(e) => e.stopPropagation()}
                    >

                        <div className="department-modal-header">
                            <div>
                                <h2>
                                    {editingDoctor
                                        ? "Edit Doctor"
                                        : "Add New Doctor"}
                                </h2>

                                <p>
                                    {editingDoctor
                                        ? "Update the doctor's professional details."
                                        : "Create a doctor account and profile."}
                                </p>
                            </div>

                            <button
                                className="modal-close-button"
                                onClick={() => setModalOpen(false)}
                                disabled={saving}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>

                            <div className="doctor-form-grid">

                                <div className="form-group">
                                    <label>Full Name *</label>

                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Dr. John Smith"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Email Address *</label>

                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="doctor@example.com"
                                        required
                                    />
                                </div>

                                {!editingDoctor && (
                                    <div className="form-group">
                                        <label>Initial Password *</label>

                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="Minimum 8 characters"
                                            minLength={8}
                                            required
                                        />
                                    </div>
                                )}

                                <div className="form-group">
                                    <label>Phone Number</label>

                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="9876543210"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Department *</label>

                                    <select
                                        name="department_id"
                                        value={formData.department_id}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">
                                            Select department
                                        </option>

                                        {departments.map((department) => (
                                            <option
                                                key={department.id}
                                                value={department.id}
                                            >
                                                {department.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Specialization *</label>

                                    <input
                                        type="text"
                                        name="specialization"
                                        value={formData.specialization}
                                        onChange={handleChange}
                                        placeholder="e.g. Cardiologist"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Qualification</label>

                                    <input
                                        type="text"
                                        name="qualification"
                                        value={formData.qualification}
                                        onChange={handleChange}
                                        placeholder="e.g. MBBS, MD"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Experience (Years)</label>

                                    <input
                                        type="number"
                                        name="experience_years"
                                        value={formData.experience_years}
                                        onChange={handleChange}
                                        min="0"
                                        step="1"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Consultation Fee (₹)</label>

                                    <input
                                        type="number"
                                        name="consultation_fee"
                                        value={formData.consultation_fee}
                                        onChange={handleChange}
                                        min="0"
                                        step="0.01"
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label>Professional Bio</label>

                                    <textarea
                                        name="bio"
                                        value={formData.bio}
                                        onChange={handleChange}
                                        placeholder="Brief introduction about the doctor..."
                                        rows={4}
                                    />
                                </div>

                            </div>

                            {error && (
                                <div className="department-alert error">
                                    {error}
                                </div>
                            )}

                            <div className="department-modal-actions">

                                <button
                                    type="button"
                                    className="modal-cancel-button"
                                    onClick={() => setModalOpen(false)}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="modal-submit-button"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingDoctor
                                            ? "Save Changes"
                                            : "Create Doctor"}
                                </button>

                            </div>

                        </form>
                    </div>
                </div>
            )}

        </section>
    );
}

export default DoctorManagement;
