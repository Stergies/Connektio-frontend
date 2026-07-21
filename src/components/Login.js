import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Lottie from "lottie-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import NetworkBackground from "./NetworkBackground";
import welcomeAnimation from "../assets/welcome-lottie.json";

// Μικρό error boundary - αν για οποιονδήποτε λόγο δεν φορτώσει το Lottie animation,
// δείχνουμε ένα απλό CSS fallback αντί να σπάσει η σελίδα σύνδεσης
class LottieErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

const emptyRegister = {
  firstName: "",
  lastName: "",
  username: "",
  password: "",
  position: "",
  email: "",
  department: "",
  secondDepartment: "",
  internalPhones: ["", "", ""],
};

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [registerForm, setRegisterForm] = useState(emptyRegister);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isRegistering) return;

    const loadDepartments = async () => {
      try {
        const { data } = await api.get("/departments");
        setDepartments(data);
      } catch (err) {
        setError("Δεν ήταν δυνατή η φόρτωση των τμημάτων");
      }
    };

    loadDepartments();
  }, [isRegistering]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await login(username, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Σφάλμα σύνδεσης");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterChange = (e) => {
    setRegisterForm({ ...registerForm, [e.target.name]: e.target.value });
  };

  const handlePhoneChange = (index, value) => {
    setRegisterForm({
      ...registerForm,
      internalPhones: registerForm.internalPhones.map((phone, idx) => (idx === index ? value : phone)),
    });
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const payload = {
        ...registerForm,
        username: registerForm.username.trim().toLowerCase(),
        internalPhones: registerForm.internalPhones.map((phone) => phone.trim()).filter(Boolean),
      };

      await api.post("/auth/register", payload);
      setSuccess("Η εγγραφή ολοκληρώθηκε επιτυχώς. Μπορείτε τώρα να συνδεθείτε.");
      setRegisterForm(emptyRegister);
      setUsername(payload.username);
      setPassword(payload.password);
      setIsRegistering(false);
    } catch (err) {
      setError(err.response?.data?.message || "Σφάλμα εγγραφής");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-split">
      {/* Αριστερά: η φόρμα σύνδεσης/εγγραφής */}
      <div className="login-form-side">
        <div
          style={{
            background: "var(--color-card)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow)",
            padding: isRegistering ? 26 : 32,
            width: "100%",
            maxWidth: isRegistering ? 460 : 360,
            maxHeight: isRegistering ? "calc(100vh - 140px)" : "none",
            overflowY: isRegistering ? "auto" : "visible",
          }}
        >
          <h2 style={{ fontFamily: "var(--font-display)", marginTop: 0, color: "var(--color-ink)" }}>
            {isRegistering ? "Δημιουργία λογαριασμού" : "Σύνδεση"}
          </h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: 14, marginTop: -8 }}>
            {isRegistering
              ? "Συμπληρώστε τα στοιχεία σας όπως θα τα έδινε ο διαχειριστής για τον νέο χρήστη"
              : "Εισάγετε τα στοιχεία σας για πρόσβαση στον κατάλογο"}
          </p>

        {isRegistering ? (
          <form onSubmit={handleRegisterSubmit}>
            <div style={row2}>
              <div>
                <label style={labelStyle}>Όνομα *</label>
                <input name="firstName" value={registerForm.firstName} onChange={handleRegisterChange} required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Επώνυμο *</label>
                <input name="lastName" value={registerForm.lastName} onChange={handleRegisterChange} required style={inputStyle} />
              </div>
            </div>

            <label style={labelStyle}>Τμήμα *</label>
            <select name="department" value={registerForm.department} onChange={handleRegisterChange} required style={inputStyle}>
              <option value="">-- Επιλέξτε τμήμα --</option>
              {departments.map((department) => (
                <option key={department._id} value={department._id}>{department.name}</option>
              ))}
            </select>

            <label style={labelStyle}>Δεύτερο Τμήμα</label>
            <select name="secondDepartment" value={registerForm.secondDepartment} onChange={handleRegisterChange} style={inputStyle}>
              <option value="">-- Δεν απαιτείται --</option>
              {departments.map((department) => (
                <option key={department._id} value={department._id}>{department.name}</option>
              ))}
            </select>

            <label style={labelStyle}>Θέση</label>
            <input name="position" value={registerForm.position} onChange={handleRegisterChange} style={inputStyle} />

            <label style={labelStyle}>Εσωτερικά τηλέφωνα</label>
            <div style={{ display: "grid", gap: 8, marginTop: 4 }}>
              {[0, 1, 2].map((index) => (
                <input
                  key={index}
                  value={registerForm.internalPhones[index] || ""}
                  onChange={(e) => handlePhoneChange(index, e.target.value)}
                  placeholder={`Εσωτερικό ${index + 1}`}
                  style={inputStyle}
                />
              ))}
            </div>

            <label style={labelStyle}>Email</label>
            <input type="email" name="email" value={registerForm.email} onChange={handleRegisterChange} style={inputStyle} />

            <label style={labelStyle}>Όνομα χρήστη *</label>
            <input name="username" value={registerForm.username} onChange={handleRegisterChange} required style={inputStyle} />

            <label style={labelStyle}>Κωδικός πρόσβασης *</label>
            <div style={{ position: "relative" }}>
              <input
                type={showRegisterPassword ? "text" : "password"}
                name="password"
                value={registerForm.password}
                onChange={handleRegisterChange}
                required
                minLength={6}
                style={{ ...inputStyle, paddingRight: 42 }}
              />
              <button
                type="button"
                onClick={() => setShowRegisterPassword((prev) => !prev)}
                style={eyeBtnStyle}
                title={showRegisterPassword ? "Απόκρυψη κωδικού" : "Προβολή κωδικού"}
              >
                {showRegisterPassword ? "🙈" : "👁️"}
              </button>
            </div>

            {error && <div style={{ color: "var(--color-danger)", fontSize: 13, marginTop: 8 }}>{error}</div>}
            {success && <div style={{ color: "var(--color-success)", fontSize: 13, marginTop: 8 }}>{success}</div>}

            <button type="submit" disabled={loading} style={primaryBtn}>
              {loading ? "Γίνεται εγγραφή..." : "Δημιουργία λογαριασμού"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            <label style={labelStyle}>Όνομα χρήστη</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={inputStyle}
              required
              autoFocus
            />

            <label style={labelStyle}>Κωδικός πρόσβασης</label>
            <div style={{ position: "relative" }}>
              <input
                type={showLoginPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ ...inputStyle, paddingRight: 42 }}
                required
              />
              <button
                type="button"
                onClick={() => setShowLoginPassword((prev) => !prev)}
                style={eyeBtnStyle}
                title={showLoginPassword ? "Απόκρυψη κωδικού" : "Προβολή κωδικού"}
              >
                {showLoginPassword ? "🙈" : "👁️"}
              </button>
            </div>

            {error && <div style={{ color: "var(--color-danger)", fontSize: 13, marginTop: 8 }}>{error}</div>}
            {success && <div style={{ color: "var(--color-success)", fontSize: 13, marginTop: 8 }}>{success}</div>}

            <button type="submit" disabled={loading} style={primaryBtn}>
              {loading ? "Σύνδεση..." : "Σύνδεση"}
            </button>
          </form>
        )}

        <button
          type="button"
          onClick={() => {
            setIsRegistering(!isRegistering);
            setError("");
            setSuccess("");
          }}
          style={switchBtn}
        >
          {isRegistering ? "Έχω ήδη λογαριασμό" : "Δημιουργία νέου λογαριασμού"}
        </button>
        </div>
      </div>

      {/* Δεξιά: διακοσμητικό animated panel με τα χρώματα της εφαρμογής */}
      <div className="login-animation-side">
        <div className="login-animation-network">
          <NetworkBackground nodeCount={26} seed={7} stroke="#FFFFFF" nodeColor="#FFFFFF" />
        </div>

        <div className="login-animation-content">
          <LottieErrorBoundary
            fallback={
              <div className="login-lottie-wrap">
                <div
                  className="login-lottie-fallback"
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.18)",
                    border: "2px solid rgba(255,255,255,0.6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
              </div>
            }
          >
            <div className="login-lottie-wrap">
              <Lottie animationData={welcomeAnimation} loop style={{ width: 160, height: 160 }} />
            </div>
          </LottieErrorBoundary>

          <h2 style={{ fontFamily: "var(--font-display)", color: "#FFFFFF", margin: "12px 0 6px", textAlign: "center" }}>
            Καλώς ήρθες στο Connektio
          </h2>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, textAlign: "center", maxWidth: 320, margin: "0 auto" }}>
            Ο τηλεφωνικός κατάλογος και οι ομάδες email της υπηρεσίας σου, όλα σε ένα σημείο.
          </p>
        </div>
      </div>
    </div>
  );
};

const labelStyle = { display: "block", fontSize: 13, marginTop: 14, marginBottom: 6, color: "var(--color-text-muted)" };
const inputStyle = {
  width: "100%",
  padding: "9px 10px",
  border: "1px solid var(--color-line)",
  borderRadius: 6,
  fontSize: 14,
};
const row2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };
const primaryBtn = {
  marginTop: 18,
  width: "100%",
  padding: "10px 0",
  background: "var(--color-accent)",
  color: "#FFFFFF",
  border: "none",
  borderRadius: 8,
  fontWeight: 700,
};
const switchBtn = {
  marginTop: 12,
  width: "100%",
  padding: "8px 0",
  background: "transparent",
  border: "1px solid var(--color-line)",
  borderRadius: 8,
  color: "var(--color-ink)",
};
const eyeBtnStyle = {
  position: "absolute",
  right: 8,
  top: "50%",
  transform: "translateY(-50%)",
  border: "none",
  background: "transparent",
  cursor: "pointer",
  fontSize: 16,
};

export default Login;
