
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  HeartPulse,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import "./Login.css";
import "./Register.css";

function Register() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();
    const phone = formData.phone.trim();

    if (!name || !email || !formData.password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (name.length < 2 || name.length > 100) {
      setError("Name must be between 2 and 100 characters.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      // Register through AuthContext.
      await registerUser(
          name,
          email,
          formData.password,
          phone || null
      );

      // Registration successful.
      navigate("/patient/dashboard", {
          replace: true
      });

    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to register. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page register-page">

      {/* Left branding panel */}
      <section className="login-visual">

        <div className="brand">
          <div className="brand-icon">
            <HeartPulse size={27} />
          </div>
          <span>CareConnect</span>
        </div>

        <div className="visual-content">
          <span className="visual-tag">
            YOUR HEALTH, OUR PRIORITY
          </span>

          <h1>
            Start your
            <br />
            <span>healthier journey.</span>
          </h1>

          <p>
            Create your CareConnect account and take
            the first step towards simpler healthcare.
            Connect with trusted doctors and manage
            your health in one place.
          </p>

          <div className="visual-points">
            <div>
              <ShieldCheck size={19} />
              <span>Secure patient registration</span>
            </div>

            <div>
              <HeartPulse size={19} />
              <span>Personalized healthcare access</span>
            </div>

            <div>
              <User size={19} />
              <span>Your healthcare, in your control</span>
            </div>
          </div>
        </div>

        <p className="visual-footer">
          Better care starts with a connection.
        </p>

      </section>

      {/* Registration panel */}
      <section className="login-panel">

        <div className="login-card register-card">

          <div className="mobile-brand">
            <div className="brand-icon">
              <HeartPulse size={25} />
            </div>
            <span>CareConnect</span>
          </div>

          <div className="login-heading">
            <span className="welcome-label">
              JOIN CARECONNECT
            </span>

            <h2>Create your account</h2>

            <p>
              Enter your details to get started with
              your healthcare journey.
            </p>
          </div>

          <form onSubmit={handleSubmit}>

            {/* Full name */}
            <div className="form-group">
              <label htmlFor="name">Full name</label>

              <div className="input-wrapper">
                <User size={19} />

                <input
                  id="name"
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  autoComplete="name"
                  maxLength={100}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email">Email address</label>

              <div className="input-wrapper">
                <Mail size={19} />

                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div className="form-group">
              <label htmlFor="phone">
                Phone number
                <span className="optional-label"> (Optional)</span>
              </label>

              <div className="input-wrapper">
                <Phone size={19} />

                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={handleChange}
                  autoComplete="tel"
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password">Password</label>

              <div className="input-wrapper">
                <Lock size={19} />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>

              <p className="field-hint">
                Minimum 8 characters.
              </p>
            </div>

            {/* Confirm password */}
            <div className="form-group">
              <label htmlFor="confirmPassword">
                Confirm password
              </label>

              <div className="input-wrapper">
                <Lock size={19} />

                <input
                  id="confirmPassword"
                  type={
                    showConfirmPassword ? "text" : "password"
                  }
                  name="confirmPassword"
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create account"}

              {!loading && <ArrowRight size={19} />}
            </button>

          </form>

          <div className="register-prompt">
            Already have an account?{" "}
            <Link to="/login">Sign in</Link>
          </div>

          <div className="login-security">
            <ShieldCheck size={17} />
            Your information is protected with secure authentication.
          </div>

        </div>

        <p className="copyright">
          © 2026 CareConnect. All rights reserved.
        </p>

      </section>

    </main>
  );
}

export default Register;
