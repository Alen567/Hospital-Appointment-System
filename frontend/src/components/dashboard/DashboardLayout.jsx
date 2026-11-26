
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import {
    HeartPulse,
    LayoutDashboard,
    CalendarDays,
    Users,
    Stethoscope,
    Building2,
    UserRound,
    LogOut,
    Menu,
    X,
    Activity
} from "lucide-react";

import "./dashboard.css";

const iconMap = {
    dashboard: LayoutDashboard,
    appointments: CalendarDays,
    patients: Users,
    doctors: Stethoscope,
    departments: Building2,
    profile: UserRound,
    availability: Activity
};

function DashboardLayout({
    role,
    navItems = [],
    title,
    subtitle,
    activeTarget,
    onNavigate,
    children
}) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    const handleNavigation = (item) => {
        if (onNavigate) {
            // Switch to the selected dashboard section.
            onNavigate(item.target);
        } else {
            // Temporary fallback for dashboards not yet converted.
            document.getElementById(item.target)?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }

        setSidebarOpen(false);
    };

    const fullName = user?.name || "User";

    return (
        <div className="dashboard-container">

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`dashboard-sidebar ${
                    sidebarOpen ? "sidebar-open" : ""
                }`}
            >
                <div className="sidebar-brand">
                    <div className="brand-icon">
                        <HeartPulse size={25} />
                    </div>

                    <span>CareConnect</span>

                    <button
                        type="button"
                        className="sidebar-close"
                        onClick={() => setSidebarOpen(false)}
                        aria-label="Close navigation"
                    >
                        <X size={22} />
                    </button>
                </div>

                <div className="sidebar-section">
                    <p className="sidebar-label">
                        MAIN MENU
                    </p>

                    <nav className="sidebar-navigation">
                        {navItems.map((item) => {
                            const Icon =
                                iconMap[item.icon] || LayoutDashboard;

                            const isActive = activeTarget
                                ? activeTarget === item.target
                                : item.active;

                            return (
                                <button
                                    key={item.target}
                                    type="button"
                                    className={`sidebar-link ${
                                        isActive ? "active" : ""
                                    }`}
                                    onClick={() => handleNavigation(item)}
                                >
                                    <Icon size={19} />
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                <div className="sidebar-bottom">
                    <div className="sidebar-security">
                        <Activity size={19} />

                        <div>
                            <strong>Secure Access</strong>
                            <span>Your account is protected</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="sidebar-logout"
                        onClick={handleLogout}
                    >
                        <LogOut size={19} />
                        <span>Sign out</span>
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="dashboard-main">

                <header className="dashboard-header">
                    <div className="header-left">
                        <button
                            type="button"
                            className="mobile-menu-button"
                            onClick={() => setSidebarOpen(true)}
                            aria-label="Open navigation"
                        >
                            <Menu size={23} />
                        </button>

                        <div>
                            <p className="header-greeting">
                                CARECONNECT / {role.toUpperCase()}
                            </p>

                            <h2>{title}</h2>
                        </div>
                    </div>

                    <div className="header-user">
                        <div className="header-user-info">
                            <strong>{fullName}</strong>
                            <span>{role}</span>
                        </div>

                        <div className="user-avatar">
                            {fullName.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </header>

                <section className="dashboard-content">
                    <div className="dashboard-welcome">
                        <div>
                            <h1>
                                Welcome back, {fullName}!
                            </h1>

                            <p>{subtitle}</p>
                        </div>
                    </div>

                    {children}
                </section>

                <footer className="dashboard-footer">
                    © 2026 CareConnect. All rights reserved.
                </footer>

            </main>
        </div>
    );
}

export default DashboardLayout;
