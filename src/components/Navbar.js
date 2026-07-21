import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = ({ theme, onToggleTheme }) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header
      style={{
        background: "var(--color-header)",
        color: "var(--color-header-text)",
        borderBottom: "1px solid var(--color-header-border)",
        boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
      }}
    >
      <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px" }}>
        <Link to="/" style={{ textDecoration: "none", color: "var(--color-header-text)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src="/logo.png" alt="Logo" style={{ height: 48 }} />
          </div>
        </Link>

        {user && (
          <nav style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 14 }}>
            <button
              type="button"
              onClick={onToggleTheme}
              className="navbar-action-button"
              style={{
                padding: "6px 10px",
                fontSize: 13,
              }}
            >
              {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
            </button>
            <Link
              to="/"
              className="navbar-icon-link"
              style={navIconLinkStyle}
              title="Αναζήτηση"
              aria-label="Αναζήτηση"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </Link>
            <Link
              to="/profile"
              className="navbar-icon-link"
              style={{ ...navIconLinkStyle, color: "var(--color-accent)" }}
              title="Προφίλ"
              aria-label="Προφίλ"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
                <path d="M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12zm0 2.2c-3.3 0-9.8 1.7-9.8 5v1.6h19.6v-1.6c0-3.3-6.5-5-9.8-5z" />
              </svg>
            </Link>
            <Link
              to="/#email-groups-section"
              className="navbar-icon-link"
              style={navIconLinkStyle}
              title="Ομάδες Email"
              aria-label="Ομάδες Email"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className="navbar-icon-link"
                style={navIconLinkStyle}
                title="Διαχείριση"
                aria-label="Διαχείριση"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3z" />
                  <path d="M9.5 12.5 11 14l3.5-4" />
                </svg>
              </Link>
            )}
            <span style={{ color: "var(--color-accent)", fontWeight: 600 }}>
              {user.fullName} {isAdmin ? "(Admin)" : ""}
            </span>
            <button
              onClick={handleLogout}
              className="navbar-action-button"
              title="Αποσύνδεση"
              aria-label="Αποσύνδεση"
              style={{
                width: 36,
                height: 36,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                cursor: "pointer",
              }}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M14 3h-7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7" />
                <path d="M10 12h10" />
                <path d="m17 9 3 3-3 3" />
              </svg>
            </button>
          </nav>
        )}
      </div>
    </header>
  );
};

const navIconLinkStyle = {
  textDecoration: "none",
  color: "var(--color-text-muted)",
  width: 36,
  height: 36,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

export default Navbar;
