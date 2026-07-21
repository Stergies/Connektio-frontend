import React, { useEffect, useState } from "react";

const empty = { firstName: "", lastName: "", position: "", internalPhones: ["", "", ""], email: "", department: "", secondDepartment: "" };

const normalizePhoneSlots = (initialData = {}) => {
  const phones = initialData.internalPhones?.length
    ? initialData.internalPhones
    : initialData.phones?.length
      ? initialData.phones
      : initialData.phone
        ? [initialData.phone]
        : [];
  const slots = phones.slice(0, 3);
  while (slots.length < 3) slots.push("");
  return slots;
};

const EmployeeForm = ({ initialData, departments, onSubmit, onCancel }) => {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (initialData) {
      setForm({
        firstName: initialData.firstName,
        lastName: initialData.lastName,
        position: initialData.position || "",
        internalPhones: normalizePhoneSlots(initialData),
        email: initialData.email || "",
        department: initialData.department?._id || initialData.department || "",
        secondDepartment: initialData.secondDepartment?._id || initialData.secondDepartment || "",
      });
    } else {
      setForm(empty);
    }
  }, [initialData]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handlePhoneChange = (index, value) => {
    const phoneSlots = normalizePhoneSlots({ internalPhones: form.internalPhones });
    phoneSlots[index] = value;
    setForm({
      ...form,
      internalPhones: phoneSlots,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      department: form.department || undefined,
      secondDepartment: form.secondDepartment || undefined,
      internalPhones: form.internalPhones.map((phone) => phone.trim()).filter((phone) => phone),
    });
  };

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <h3 style={{ marginTop: 0 }}>{initialData ? "Επεξεργασία Χρήστη" : "Νέος Χρήστης"}</h3>

      <div style={row2}>
        <div>
          <label style={labelStyle}>Όνομα *</label>
          <input name="firstName" value={form.firstName} onChange={handleChange} required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Επώνυμο *</label>
          <input name="lastName" value={form.lastName} onChange={handleChange} required style={inputStyle} />
        </div>
      </div>

      <label style={labelStyle}>Τμήμα *</label>
      <select name="department" value={form.department} onChange={handleChange} required style={inputStyle}>
        <option value="">-- Επιλέξτε τμήμα --</option>
        {departments.map((d) => (
          <option key={d._id} value={d._id}>{d.name}</option>
        ))}
      </select>

      <label style={labelStyle}>Δεύτερο Τμήμα</label>
      <select name="secondDepartment" value={form.secondDepartment} onChange={handleChange} style={inputStyle}>
        <option value="">-- Δεν απαιτείται --</option>
        {departments.map((d) => (
          <option key={d._id} value={d._id}>{d.name}</option>
        ))}
      </select>

      <label style={labelStyle}>Εσωτερικά τηλέφωνα (έως 3)</label>
      <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
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

      <label style={labelStyle}>Email</label>
      <input type="email" name="email" value={form.email} onChange={handleChange} style={inputStyle} />

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
  maxWidth: 480,
};
const row2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };
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

export default EmployeeForm;
