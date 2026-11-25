
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  HeartPulse,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
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

      if (!formData.email.trim() || !formData.password) {
          setError("Please enter your email and password.");
          return;
      }

      try {
          setLoading(true);

          // Authenticate using the global AuthContext.
          const user = await login(
              formData.email.trim(),
              formData.password
          );

          // Redirect according to the authenticated user's role.
          const dashboardRoutes = {
              patient: "/patient/dashboard",
              doctor: "/doctor/dashboard",
              admin: "/admin/dashboard"
          };

          navigate(dashboardRoutes[user.role], {
              replace: true
          });

      } catch (err) {
          setError(
              err.response?.data?.message ||
              err.message ||
              "Unable to login. Please try again."
          );
      } finally {
          setLoading(false);
      }
  };

  return (
    <main className="login-page">
      <section className="login-visual">
        <div className="brand">
          <div className="brand-icon">
            <HeartPulse size={27} />
          </div>
          <span>CareConnect</span>
        </div>

        <div className="visual-content">
          <span className="visual-tag">YOUR HEALTH, OUR PRIORITY</span>

          <h1>
            Healthcare made
            <br />
            <span>simpler.</span>
          </h1>

          <p>
            Connect with trusted doctors, manage your
            appointments and take control of your
            healthcare journey.
          </p>

          <div className="visual-points">
            <div>
              <ShieldCheck size={19} />
              <span>Secure healthcare access</span>
            </div>
            <div>
              <HeartPulse size={19} />
              <span>Personalized patient care</span>
            </div>
          </div>
        </div>

        <p className="visual-footer">
          Better care starts with a connection.
        </p>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="mobile-brand">
            <div className="brand-icon">
              <HeartPulse size={25} />
            </div>
            <span>CareConnect</span>
          </div>

          <div className="login-heading">
            <span className="welcome-label">WELCOME BACK</span>
            <h2>Sign in to your account</h2>
            <p>
              Enter your credentials to access your
              healthcare dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
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

            <div className="form-group">
              <label htmlFor="password">Password</label>

              <div className="input-wrapper">
                <Lock size={19} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
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
            </div>

            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
              {!loading && <ArrowRight size={19} />}
            </button>
          </form>

          <div className="register-prompt">
            New to CareConnect?
            {" "}
            <Link to="/register">Create a patient account</Link>
          </div>

          <div className="login-security">
            <ShieldCheck size={17} />
            Your account is protected with secure authentication.
          </div>
        </div>

        <p className="copyright">
          © 2026 CareConnect. All rights reserved.
        </p>
      </section>
    </main>
  );
}

export default Login;
