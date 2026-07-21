import React, { useEffect, useState } from "react";

const empty = { fullName: "", username: "", password: "", role: "user" };

const UserForm = ({ initialData, onSubmit, onCancel }) => {
  const [form, setForm] = useState(empty);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm({
        fullName: initialData.fullName || "",
        username: initialData.username || "",
        password: "",
        role: initialData.role || "user",
      });
    } else {
      setForm(empty);
    }
  }, [initialData]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (!payload.password) delete payload.password;
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <h3 style={{ marginTop: 0 }}>{initialData ? "Επεξεργασία Λογαριασμού" : "Νέος Λογαριασμός Χρήστη"}</h3>

      <label style={labelStyle}>Ονοματεπώνυμο</label>
      <input name="fullName" value={form.fullName} onChange={handleChange} style={inputStyle} />

      <label style={labelStyle}>Όνομα χρήστη (username) *</label>
      <input name="username" value={form.username} onChange={handleChange} required style={inputStyle} />

      <label style={labelStyle}>{initialData ? "Νέος κωδικός πρόσβασης (προαιρετικό)" : "Κωδικός πρόσβασης *"}</label>
      <div style={{ position: "relative" }}>
        <input
          type={showPassword ? "text" : "password"}
          name="password"
          value={form.password}
          onChange={handleChange}
          required={!initialData}
          minLength={6}
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

      <label style={labelStyle}>Ρόλος *</label>
      <select name="role" value={form.role} onChange={handleChange} style={inputStyle}>
        <option value="user">Χρήστης (μόνο αναζήτηση)</option>
        <option value="admin">Διαχειριστής (πλήρη δικαιώματα)</option>
      </select>

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button type="submit" style={primaryBtn}>Αποθήκευση</button>
        <button type="button" onClick={onCancel} style={secondaryBtn}>Ακύρωση</button>
      </div>
    </form>
  );
};

const formStyle = {
  background: "var(--color-card)",
  borderRadius: "var(--radius)",
  boxShadow: "var(--shadow)",
  padding: 20,
  marginBottom: 20,
  maxWidth: 420,
};
const labelStyle = { display: "block", fontSize: 13, marginTop: 10, marginBottom: 5, color: "var(--color-text-muted)" };
const inputStyle = { width: "100%", padding: "8px 10px", border: "1px solid var(--color-line)", borderRadius: 6, fontSize: 14 };
const primaryBtn = { background: "var(--color-accent)", color: "#FFFFFF", border: "none", borderRadius: 6, padding: "8px 16px", fontWeight: 700 };
const secondaryBtn = {
  background: "var(--color-card)",
  border: "1px solid var(--color-line)",
  color: "var(--color-text)",
  borderRadius: 6,
  padding: "8px 16px",
  fontWeight: 600,
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

export default UserForm;
