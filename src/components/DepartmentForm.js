import React, { useEffect, useState } from "react";

const empty = { name: "", email: "", internalPhones: ["", "", ""] };

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

const DepartmentForm = ({ initialData, onSubmit, onCancel }) => {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    setForm(
      initialData
        ? {
            name: initialData.name,
            email: initialData.email || "",
            internalPhones: normalizePhoneSlots(initialData),
          }
        : empty
    );
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
      email: form.email.trim(),
      internalPhones: form.internalPhones.map((phone) => phone.trim()).filter((phone) => phone),
    });
  };

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <h3 style={{ marginTop: 0 }}>{initialData ? "Επεξεργασία Τμήματος" : "Νέο Τμήμα"}</h3>

      <label style={labelStyle}>Όνομα Τμήματος *</label>
      <input name="name" value={form.name} onChange={handleChange} required style={inputStyle} />

      <label style={labelStyle}>Email</label>
      <input type="email" name="email" value={form.email} onChange={handleChange} style={inputStyle} />

      <label style={labelStyle}>Εσωτερικά τηλέφωνα (έως 3)</label>
      <div style={{ display: "grid", gap: 10 }}>
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

export default DepartmentForm;
