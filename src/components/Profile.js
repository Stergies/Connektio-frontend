import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const emptyForm = {
  fullName: "",
  username: "",
  password: "",
  firstName: "",
  lastName: "",
  position: "",
  email: "",
  department: "",
  secondDepartment: "",
  internalPhones: ["", "", ""],
};

const normalizePhoneSlots = (phones) => {
  const slots = Array.isArray(phones) ? phones.slice(0, 3) : [];
  while (slots.length < 3) slots.push("");
  return slots;
};

const Profile = () => {
  const { user, updateUserData } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const [{ data: profileData }, { data: deptData }] = await Promise.all([
          api.get("/auth/profile"),
          api.get("/departments"),
        ]);

        const employee = profileData.employee || {};
        setDepartments(deptData);
        setForm({
          fullName: profileData.user?.fullName || user?.fullName || "",
          username: profileData.user?.username || user?.username || "",
          password: "",
          firstName: employee.firstName || "",
          lastName: employee.lastName || "",
          position: employee.position || "",
          email: employee.email || "",
          department: employee.department?._id || employee.department || "",
          secondDepartment: employee.secondDepartment?._id || employee.secondDepartment || "",
          internalPhones: normalizePhoneSlots(employee.internalPhones),
        });
      } catch (err) {
        setError(err.response?.data?.message || "Σφάλμα φόρτωσης προφίλ");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handlePhoneChange = (index, value) => {
    const phoneSlots = normalizePhoneSlots(form.internalPhones);
    phoneSlots[index] = value;
    setForm({
      ...form,
      internalPhones: phoneSlots,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);

    try {
      const payload = {
        ...form,
        username: form.username.trim().toLowerCase(),
        internalPhones: form.internalPhones.map((phone) => phone.trim()).filter(Boolean),
      };

      if (!payload.password) delete payload.password;

      const { data } = await api.put("/auth/profile", payload);
      const updatedUser = data.user;
      updateUserData(updatedUser);
      setMessage("Οι αλλαγές αποθηκεύτηκαν επιτυχώς");
      setTimeout(() => navigate("/"), 900);
    } catch (err) {
      setError(err.response?.data?.message || "Σφάλμα αποθήκευσης");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/");
  };

  if (loading) {
    return <div className="container" style={{ padding: "36px 20px" }}><p>Φόρτωση προφίλ...</p></div>;
  }

  return (
    <div className="container" style={{ padding: "36px 20px" }}>
      <div className="section-card" style={{ maxWidth: 860, width: "100%", margin: "0 auto" }}>
        <h1 style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)", marginTop: 0 }}>Το προφίλ μου</h1>
        <p style={{ color: "var(--color-text-muted)", marginTop: -6 }}>
          Ενημερώστε τα στοιχεία σας και αποθηκεύστε τις αλλαγές.
        </p>

        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Όνομα χρήστη *</label>
          <input name="username" value={form.username} onChange={handleChange} required style={inputStyle} />

          <label style={labelStyle}>Νέος κωδικός πρόσβασης (προαιρετικό)</label>
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              style={{ ...inputStyle, paddingRight: 42 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              style={eyeBtnStyle}
              title={showPassword ? "Απόκρυψη κωδικού" : "Προβολή κωδικού"}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <div>
              <label style={labelStyle}>Όνομα</label>
              <input name="firstName" value={form.firstName} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Επώνυμο</label>
              <input name="lastName" value={form.lastName} onChange={handleChange} style={inputStyle} />
            </div>
          </div>

          <label style={labelStyle}>Τμήμα</label>
          <select name="department" value={form.department} onChange={handleChange} style={inputStyle}>
            <option value="">-- Επιλέξτε τμήμα --</option>
            {departments.map((department) => (
              <option key={department._id} value={department._id}>{department.name}</option>
            ))}
          </select>

          <label style={labelStyle}>Δεύτερο Τμήμα</label>
          <select name="secondDepartment" value={form.secondDepartment} onChange={handleChange} style={inputStyle}>
            <option value="">-- Δεν απαιτείται --</option>
            {departments.map((department) => (
              <option key={department._id} value={department._id}>{department.name}</option>
            ))}
          </select>

          <label style={labelStyle}>Θέση</label>
          <input name="position" value={form.position} onChange={handleChange} style={inputStyle} />

          <label style={labelStyle}>Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} style={inputStyle} />

          <label style={labelStyle}>Εσωτερικά τηλέφωνα</label>
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
            {[0, 1, 2].map((index) => (
              <input
                key={index}
                value={form.internalPhones[index] || ""}
                onChange={(e) => handlePhoneChange(index, e.target.value)}
                placeholder={`Εσωτερικό ${index + 1}`}
                style={inputStyle}
              />
            ))}
          </div>

          {error && <div style={{ color: "var(--color-danger)", marginTop: 12 }}>{error}</div>}
          {message && <div style={{ color: "var(--color-success)", marginTop: 12 }}>{message}</div>}

          <div style={buttonRowStyle}>
            <button type="submit" disabled={saving} style={primaryBtn}>
              {saving ? "Αποθήκευση..." : "Αποθήκευση αλλαγών"}
            </button>
            <button type="button" onClick={handleCancel} disabled={saving} className="profile-cancel-button" style={secondaryBtn}>
              Ακύρωση
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const labelStyle = { display: "block", fontSize: 13, marginTop: 12, marginBottom: 6, color: "var(--color-text-muted)" };
const inputStyle = { width: "100%", padding: "9px 10px", border: "1px solid var(--color-line)", borderRadius: 6, fontSize: 14 };
const buttonRowStyle = { display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" };
const primaryBtn = { flex: "1 1 220px", padding: "10px 0", background: "var(--color-accent)", color: "#FFFFFF", border: "none", borderRadius: 6, fontWeight: 700, cursor: "pointer" };
const secondaryBtn = {
  flex: "1 1 160px",
  padding: "10px 0",
  borderRadius: 6,
  fontWeight: 700,
  cursor: "pointer",
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

export default Profile;
