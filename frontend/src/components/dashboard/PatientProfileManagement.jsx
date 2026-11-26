
import { useEffect, useState } from "react";

import {
    User,
    Save,
    RefreshCw,
    Mail,
    ShieldCheck,
    AlertCircle,
    CheckCircle,
    Phone,
    CalendarDays
} from "lucide-react";

import api from "../../services/api";

function PatientProfileManagement() {
    const [profile, setProfile] = useState(null);
    const [imageUploading, setImageUploading] = useState(false);

    const [form, setForm] = useState({
        name: "",
        phone: ""
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const fetchProfile = async () => {
        try {
            setLoading(true);
            setError("");
            setSuccess("");

            const response = await api.get("/users/profile");
            const user = response.data.user;

            if (!user) {
                throw new Error("Profile information not found.");
            }

            setProfile(user);

            setForm({
                name: user.name || "",
                phone: user.phone || ""
            });

        } catch (err) {
            console.error("Error fetching patient profile:", err);

            setError(
                err.response?.data?.message ||
                err.message ||
                "Unable to load your profile."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value
        }));

        setSuccess("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (!form.name.trim() || form.name.trim().length < 2) {
            setError("Please enter a valid name.");
            return;
        }

        try {
            setSaving(true);

            const response = await api.patch("/users/profile", {
                name: form.name.trim(),
                phone: form.phone.trim()
            });

            const updatedUser = response.data.user;

            if (updatedUser) {
                setProfile(updatedUser);

                setForm({
                    name: updatedUser.name || "",
                    phone: updatedUser.phone || ""
                });
            }

            setSuccess("Your profile has been updated successfully.");

        } catch (err) {
            console.error("Error updating patient profile:", err);

            setError(
                err.response?.data?.message ||
                "Unable to update your profile."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];

        if (!file) return;

        setError("");
        setSuccess("");

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(file.type)) {
            setError("Only JPEG, PNG, and WebP images are allowed.");
            e.target.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError("Image size must be 5 MB or less.");
            e.target.value = "";
            return;
        }

        try {
            setImageUploading(true);

            const formData = new FormData();
            formData.append("image", file);

            await api.post("/users/profile/image", formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });

            const response = await api.get("/users/profile");
            setProfile(response.data.user);

            setSuccess("Profile picture updated successfully.");

        } catch (err) {
            console.error("Error uploading profile image:", err);

            setError(
                err.response?.data?.message ||
                "Unable to upload your profile picture."
            );
        } finally {
            setImageUploading(false);
            e.target.value = "";
        }
    };

    const formatDate = (date) => {
        if (!date) return "Not available";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "long",
            year: "numeric"
        });
    };

    if (loading) {
        return (
            <section className="dashboard-section" id="profile">
                <div className="empty-state">
                    <RefreshCw size={28} />
                    <h3>Loading profile...</h3>
                </div>
            </section>
        );
    }

    if (!profile) {
        return (
            <section className="dashboard-section" id="profile">
                <div className="department-alert">
                    <AlertCircle size={18} />
                    {error || "Profile could not be loaded."}
                </div>

                <button
                    type="button"
                    className="department-action-btn"
                    onClick={fetchProfile}
                >
                    <RefreshCw size={16} />
                    Retry
                </button>
            </section>
        );
    }

    return (
        <section className="dashboard-section" id="profile">

            <div className="section-heading">
                <div>
                    <h2>My Profile</h2>
                    <p>
                        Manage your personal and account information.
                    </p>
                </div>

                <button
                    type="button"
                    className="department-action-btn"
                    onClick={fetchProfile}
                    disabled={saving}
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="department-alert">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {success && (
                <div className="profile-success">
                    <CheckCircle size={18} />
                    {success}
                </div>
            )}

            {/* Account Information */}

            <div className="profile-card">

                <div className="profile-card-heading">
                    <div className="profile-heading-icon">
                        <User size={21} />
                    </div>

                    <div>
                        <h3>Account Information</h3>
                        <p>Your basic account details.</p>
                    </div>
                </div>

                <div className="profile-account-header">

                    <div className="profile-avatar-section">
                        <div className="profile-large-avatar">
                            {profile.profile_image_url ? (
                                <img
                                    src={profile.profile_image_url}
                                    alt="Profile"
                                    className="profile-avatar-image"
                                />
                            ) : (
                                profile.name?.charAt(0).toUpperCase() || "P"
                            )}
                        </div>
                    </div>

                    <div className="profile-account-details">
                        <h3>{profile.name}</h3>
                        <p>{profile.email}</p>

                        <span
                            className={
                                profile.is_active
                                    ? "profile-status active"
                                    : "profile-status inactive"
                            }
                        >
                            {profile.is_active
                                ? "Active Account"
                                : "Inactive Account"}
                        </span>
                    </div>

                    <div className="profile-image-upload">
                        <label>
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleImageUpload}
                                disabled={imageUploading}
                                hidden
                            />

                            <span className="profile-image-button">
                                {imageUploading
                                    ? "Uploading..."
                                    : "Change Picture"}
                            </span>
                        </label>

                        <small>JPEG, PNG or WebP. Maximum 5 MB.</small>
                    </div>

                </div>

                <div className="profile-readonly-grid">

                    <div className="profile-readonly-field">
                        <label>Email Address</label>
                        <div>
                            <Mail size={16} />
                            {profile.email}
                        </div>
                    </div>

                    <div className="profile-readonly-field">
                        <label>Account Role</label>
                        <div>
                            <ShieldCheck size={16} />
                            Patient
                        </div>
                    </div>

                    <div className="profile-readonly-field">
                        <label>Phone Number</label>
                        <div>
                            <Phone size={16} />
                            {profile.phone || "Not provided"}
                        </div>
                    </div>

                    <div className="profile-readonly-field">
                        <label>Member Since</label>
                        <div>
                            <CalendarDays size={16} />
                            {formatDate(profile.created_at)}
                        </div>
                    </div>

                </div>
            </div>

            {/* Editable Personal Details */}

            <form onSubmit={handleSubmit}>

                <div className="profile-card">

                    <div className="profile-card-heading">
                        <div className="profile-heading-icon">
                            <User size={21} />
                        </div>

                        <div>
                            <h3>Personal Details</h3>
                            <p>
                                Update your name and contact information.
                            </p>
                        </div>
                    </div>

                    <div className="profile-form-grid">

                        <div className="profile-form-group">
                            <label>Full Name *</label>

                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                minLength={2}
                                maxLength={100}
                                required
                            />
                        </div>

                        <div className="profile-form-group">
                            <label>Phone Number</label>

                            <input
                                type="tel"
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                maxLength={20}
                                placeholder="Enter phone number"
                            />
                        </div>

                    </div>

                    <div className="profile-form-footer">
                        <button
                            type="submit"
                            className="profile-save-btn"
                            disabled={saving}
                        >
                            <Save size={17} />
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>

                </div>

            </form>

        </section>
    );
}

export default PatientProfileManagement;
