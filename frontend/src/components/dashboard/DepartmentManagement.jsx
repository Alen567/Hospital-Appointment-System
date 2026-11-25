
import { useEffect, useState } from "react";
import {
    Plus,
    Pencil,
    Power,
    Building2,
    Users,
    X,
    RefreshCw
} from "lucide-react";

import api from "../../services/api";

function DepartmentManagement() {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [modalOpen, setModalOpen] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState(null);

    const [formData, setFormData] = useState({
        name: "",
        description: ""
    });

    // Fetch all departments, including inactive ones.
    const fetchDepartments = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get(
                "/departments/admin/all"
            );

            setDepartments(response.data.departments);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load departments."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    // Open modal for creating a department.
    const openAddModal = () => {
        setEditingDepartment(null);

        setFormData({
            name: "",
            description: ""
        });

        setError("");
        setModalOpen(true);
    };

    // Open modal for editing a department.
    const openEditModal = (department) => {
        setEditingDepartment(department);

        setFormData({
            name: department.name,
            description: department.description || ""
        });

        setError("");
        setModalOpen(true);
    };

    // Handle form input.
    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    // Create or update a department.
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const payload = {
                name: formData.name.trim(),
                description: formData.description.trim()
            };

            if (editingDepartment) {
                await api.patch(
                    `/departments/${editingDepartment.id}`,
                    payload
                );

                setSuccess("Department updated successfully.");
            } else {
                await api.post("/departments", payload);

                setSuccess("Department created successfully.");
            }

            setModalOpen(false);
            await fetchDepartments();

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Something went wrong. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    // Activate or deactivate a department.
    const toggleDepartmentStatus = async (department) => {
        const action = department.is_active
            ? "deactivate"
            : "activate";

        const confirmed = window.confirm(
            `Are you sure you want to ${action} ${department.name}?`
        );

        if (!confirmed) return;

        try {
            setError("");
            setSuccess("");

            await api.patch(
                `/departments/${department.id}/active`,
                {
                    is_active: !department.is_active
                }
            );

            setSuccess(
                `${department.name} ${action}d successfully.`
            );

            await fetchDepartments();

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to update department status."
            );
        }
    };

    return (
        <section
            className="dashboard-section department-section"
            id="departments"
        >
            <div className="section-heading department-heading">
                <div>
                    <h2>Department Management</h2>
                    <p>
                        Manage hospital departments and their availability.
                    </p>
                </div>

                <button
                    className="department-add-button"
                    onClick={openAddModal}
                >
                    <Plus size={18} />
                    Add Department
                </button>
            </div>

            {/* Feedback messages */}
            {error && !modalOpen && (
                <div className="department-alert error">
                    {error}
                </div>
            )}

            {success && (
                <div className="department-alert success">
                    {success}
                </div>
            )}

            {/* Department summary */}
            <div className="department-summary">
                <div className="department-summary-card">
                    <Building2 size={22} />

                    <div>
                        <strong>{departments.length}</strong>
                        <span>Total Departments</span>
                    </div>
                </div>

                <div className="department-summary-card">
                    <Power size={22} />

                    <div>
                        <strong>
                            {departments.filter(
                                (d) => d.is_active
                            ).length}
                        </strong>
                        <span>Active Departments</span>
                    </div>
                </div>
            </div>

            {/* Department table */}
            <div className="department-table-container">

                <div className="department-table-header">
                    <h3>All Departments</h3>

                    <button
                        className="department-refresh"
                        onClick={fetchDepartments}
                        disabled={loading}
                    >
                        <RefreshCw size={15} />
                        Refresh
                    </button>
                </div>

                {loading ? (
                    <div className="department-loading">
                        <RefreshCw size={22} />
                        <p>Loading departments...</p>
                    </div>
                ) : departments.length === 0 ? (
                    <div className="empty-state">
                        <Building2 size={35} />

                        <h3>No departments found</h3>

                        <p>
                            Add your first hospital department
                            to get started.
                        </p>
                    </div>
                ) : (
                    <div className="department-table-scroll">
                        <table className="department-table">
                            <thead>
                                <tr>
                                    <th>Department</th>
                                    <th>Description</th>
                                    <th>Doctors</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {departments.map((department) => (
                                    <tr key={department.id}>
                                        <td>
                                            <div className="department-name">
                                                <div className="department-table-icon">
                                                    <Building2 size={18} />
                                                </div>

                                                <strong>
                                                    {department.name}
                                                </strong>
                                            </div>
                                        </td>

                                        <td className="department-description">
                                            {department.description || "—"}
                                        </td>

                                        <td>
                                            <span className="doctor-count">
                                                <Users size={14} />
                                                {department.doctor_count}
                                            </span>
                                        </td>

                                        <td>
                                            <span
                                                className={`department-status ${
                                                    department.is_active
                                                        ? "active"
                                                        : "inactive"
                                                }`}
                                            >
                                                {department.is_active
                                                    ? "Active"
                                                    : "Inactive"}
                                            </span>
                                        </td>

                                        <td>
                                            <div className="department-actions">
                                                <button
                                                    className="department-edit-button"
                                                    title="Edit department"
                                                    onClick={() =>
                                                        openEditModal(department)
                                                    }
                                                >
                                                    <Pencil size={16} />
                                                </button>

                                                <button
                                                    className={`department-toggle-button ${
                                                        department.is_active
                                                            ? "deactivate"
                                                            : "activate"
                                                    }`}
                                                    title={
                                                        department.is_active
                                                            ? "Deactivate"
                                                            : "Activate"
                                                    }
                                                    onClick={() =>
                                                        toggleDepartmentStatus(
                                                            department
                                                        )
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

            {/* Add/Edit modal */}
            {modalOpen && (
                <div
                    className="department-modal-overlay"
                    onClick={() => setModalOpen(false)}
                >
                    <div
                        className="department-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="department-modal-header">
                            <div>
                                <h2>
                                    {editingDepartment
                                        ? "Edit Department"
                                        : "Add Department"}
                                </h2>

                                <p>
                                    Enter the department information below.
                                </p>
                            </div>

                            <button
                                className="department-modal-close"
                                onClick={() => setModalOpen(false)}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {error && (
                                <div className="department-alert error">
                                    {error}
                                </div>
                            )}

                            <div className="department-form-group">
                                <label htmlFor="department-name">
                                    Department Name
                                </label>

                                <input
                                    id="department-name"
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="e.g. Cardiology"
                                    minLength={2}
                                    maxLength={100}
                                    required
                                />
                            </div>

                            <div className="department-form-group">
                                <label htmlFor="department-description">
                                    Description
                                </label>

                                <textarea
                                    id="department-description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Describe the department..."
                                    rows={4}
                                />
                            </div>

                            <div className="department-modal-actions">
                                <button
                                    type="button"
                                    className="department-cancel-button"
                                    onClick={() => setModalOpen(false)}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="department-submit-button"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingDepartment
                                            ? "Save Changes"
                                            : "Create Department"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
}

export default DepartmentManagement;
