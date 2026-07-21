import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../api/axios";
import EmailGroups from "./EmailGroups";
import PersonnelBarChart3D from "./PersonnelBarChart3D";
import UsageLeaderboard3D from "./UsageLeaderboard3D";
import DepartmentPositionChart3D from "./DepartmentPositionChart3D";
import PhoneList from "./PhoneList";
import { useAuth } from "../context/AuthContext";
import { openComposeEmail, openComposeEmailBulk } from "../utils/mailto";

const SearchDirectory = () => {
  const location = useLocation();
  const { isAdmin } = useAuth();
  const [nameQuery, setNameQuery] = useState("");
  const [deptQuery, setDeptQuery] = useState("");
  const [departments, setDepartments] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [showDeptEmails, setShowDeptEmails] = useState(false);
  const [selectedDeptIds, setSelectedDeptIds] = useState(() => new Set());
  const [selectedEmpIds, setSelectedEmpIds] = useState(() => new Set());
  const [deptPanelQuery, setDeptPanelQuery] = useState("");
  const [deptPanelPage, setDeptPanelPage] = useState(1);
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const debounceRef = useRef(null);

  const departmentsWithEmail = departments.filter((department) => department.email?.trim());

  const filteredDeptPanelItems = departments.filter((department) =>
    department.name.toLowerCase().includes(deptPanelQuery.trim().toLowerCase())
  );
  const totalDeptPanelPages = Math.max(1, Math.ceil(filteredDeptPanelItems.length / pageSize));
  const currentDeptPanelItems = filteredDeptPanelItems.slice(
    (deptPanelPage - 1) * pageSize,
    deptPanelPage * pageSize
  );
  const visibleDeptEmailItems = currentDeptPanelItems.filter((department) => department.email?.trim());

  const formatDepartments = (item) => {
    const names = [item.department?.name || item.department, item.secondDepartment?.name || item.secondDepartment].filter(Boolean);
    return names.length ? names.join(" / ") : "—";
  };

  const copyTextToClipboard = async (text) => {
    if (!text) return false;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }

      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand("copy");
      document.body.removeChild(textarea);
      return copied;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleCopyEmail = async (email, id) => {
    const copied = await copyTextToClipboard(email);
    if (copied) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    }
  };

  const toggleDeptSelection = (deptId) => {
    setSelectedDeptIds((prev) => {
      const next = new Set(prev);
      if (next.has(deptId)) next.delete(deptId);
      else next.add(deptId);
      return next;
    });
  };

  const handleCopySelectedDeptEmails = async () => {
    const emails = departmentsWithEmail
      .filter((department) => selectedDeptIds.has(department._id))
      .map((department) => department.email.trim())
      .join("; ");

    const copied = await copyTextToClipboard(emails);
    if (copied) {
      setCopiedId("selected-depts");
      setTimeout(() => setCopiedId(null), 1800);
    }
  };

  const toggleEmpSelection = (empId) => {
    setSelectedEmpIds((prev) => {
      const next = new Set(prev);
      if (next.has(empId)) next.delete(empId);
      else next.add(empId);
      return next;
    });
  };

  const handleCopySelectedEmpEmails = async () => {
    const emails = results
      .filter((emp) => selectedEmpIds.has(emp._id) && emp.email?.trim())
      .map((emp) => emp.email.trim())
      .join("; ");

    const copied = await copyTextToClipboard(emails);
    if (copied) {
      setCopiedId("selected-emps");
      setTimeout(() => setCopiedId(null), 1800);
    }
  };

  const handleClearSearch = () => {
    setNameQuery("");
    setDeptQuery("");
  };

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const { data } = await api.get("/departments");
        setDepartments(data);
      } catch (err) {
        console.error(err);
      }
    };

    loadDepartments();
  }, []);

  // Όταν ο χρήστης πατάει το εικονίδιο "Ομάδες Email" στο Navbar, κατεβαίνουμε αυτόματα στην ενότητα
  useEffect(() => {
    if (location.hash === "#email-groups-section") {
      const el = document.getElementById("email-groups-section");
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  // Live αναζήτηση: κάθε φορά που αλλάζει το όνομα ή το τμήμα, ξαναφέρνουμε αποτελέσματα
  useEffect(() => {
    if (!nameQuery.trim() && !deptQuery.trim()) {
      setResults([]);
      setSelectedEmpIds(new Set());
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/employees/search", {
          params: { name: nameQuery.trim(), department: deptQuery.trim() },
        });
        setResults(data);
        setPage(1);
        setSelectedEmpIds(new Set());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 250); // μικρή καθυστέρηση ώστε να μη γίνεται αίτημα σε κάθε πάτημα πλήκτρου αμέσως

    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nameQuery, deptQuery]);

  const totalPages = Math.max(1, Math.ceil(results.length / pageSize));
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setDeptPanelPage(1);
  }, [deptPanelQuery]);

  useEffect(() => {
    if (deptPanelPage > totalDeptPanelPages) {
      setDeptPanelPage(totalDeptPanelPages);
    }
  }, [deptPanelPage, totalDeptPanelPages]);

  const currentResults = results.slice((page - 1) * pageSize, page * pageSize);
  const visibleEmpItems = currentResults.filter((emp) => emp.email?.trim());

  const allVisibleDeptsSelected =
    visibleDeptEmailItems.length > 0 &&
    visibleDeptEmailItems.every((department) => selectedDeptIds.has(department._id));

  const allVisibleEmpsSelected =
    visibleEmpItems.length > 0 &&
    visibleEmpItems.every((emp) => selectedEmpIds.has(emp._id));

  const handleToggleAllVisibleDepts = async (checked) => {
    const visibleIds = visibleDeptEmailItems.map((department) => department._id);

    setSelectedDeptIds((prev) => {
      const next = new Set(prev);
      visibleIds.forEach((id) => {
        if (checked) next.add(id);
        else next.delete(id);
      });
      return next;
    });

    if (checked) {
      const emails = visibleDeptEmailItems.map((department) => department.email.trim()).join("; ");
      const copied = await copyTextToClipboard(emails);
      if (copied) {
        setCopiedId("selected-depts");
        setTimeout(() => setCopiedId(null), 1800);
      }
    }
  };

  const handleToggleAllVisibleEmps = async (checked) => {
    const visibleIds = visibleEmpItems.map((emp) => emp._id);

    setSelectedEmpIds((prev) => {
      const next = new Set(prev);
      visibleIds.forEach((id) => {
        if (checked) next.add(id);
        else next.delete(id);
      });
      return next;
    });

    if (checked) {
      const emails = visibleEmpItems.map((emp) => emp.email.trim()).join("; ");
      const copied = await copyTextToClipboard(emails);
      if (copied) {
        setCopiedId("selected-emps");
        setTimeout(() => setCopiedId(null), 1800);
      }
    }
  };

  return (
    <div className="container" style={{ padding: "36px 20px" }}>
      <div className="section-card">
        <h1 style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)", marginBottom: 4 }}>
          Αναζήτηση Καταλόγου
        </h1>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <p style={{ color: "var(--color-text-muted)", marginTop: 0, marginBottom: 0, flex: "1 1 280px" }}>
            Πληκτρολογήστε όνομα/επώνυμο ή/και τμήμα — τα αποτελέσματα εμφανίζονται αυτόματα.
          </p>
          <button
            type="button"
            onClick={() => setShowDeptEmails((visible) => !visible)}
            style={deptEmailsToggleBtnStyle}
          >
            {showDeptEmails ? "Απόκρυψη Email Τμημάτων" : "Email Τμημάτων"}
          </button>
        </div>

      {showDeptEmails && (
        <div style={deptEmailsPanelStyle}>
          {departments.length === 0 ? (
            <p style={{ color: "var(--color-text-muted)", margin: 0 }}>Δεν υπάρχουν καταχωρημένα τμήματα.</p>
          ) : (
            <>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Αναζήτηση Τμήματος</label>
                <input
                  type="text"
                  placeholder="π.χ. Λογιστήριο..."
                  value={deptPanelQuery}
                  onChange={(e) => setDeptPanelQuery(e.target.value)}
                  style={{ ...inputStyle, maxWidth: 320 }}
                />
              </div>

              {filteredDeptPanelItems.length === 0 ? (
                <p style={{ color: "var(--color-text-muted)", margin: 0 }}>Δεν βρέθηκαν τμήματα.</p>
              ) : (
                <>
              <div style={deptEmailsToolbarStyle}>
                <label style={selectAllLabelStyle}>
                  <input
                    type="checkbox"
                    checked={allVisibleDeptsSelected}
                    disabled={visibleDeptEmailItems.length === 0}
                    onChange={(e) => handleToggleAllVisibleDepts(e.target.checked)}
                    aria-label="Επιλογή και αντιγραφή όλων των email τμημάτων στην οθόνη"
                  />
                  Επιλογή & αντιγραφή όλων στην οθόνη
                </label>
                <span style={{ color: "var(--color-text-muted)", fontSize: 13 }}>
                  Επιλέξτε τμήματα και αντιγράψτε τα email μαζί.
                </span>
                <button
                  type="button"
                  onClick={handleCopySelectedDeptEmails}
                  disabled={selectedDeptIds.size === 0}
                  style={{
                    ...primaryActionBtnStyle,
                    opacity: selectedDeptIds.size === 0 ? 0.55 : 1,
                    cursor: selectedDeptIds.size === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  {copiedId === "selected-depts" ? "✓ Αντιγράφηκαν" : "Αντιγραφή επιλεγμένων"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    openComposeEmailBulk(
                      departmentsWithEmail.filter((d) => selectedDeptIds.has(d._id)).map((d) => d.email)
                    )
                  }
                  disabled={selectedDeptIds.size === 0}
                  title="Άνοιγμα email client με όλους τους επιλεγμένους στο BCC"
                  style={{
                    ...primaryActionBtnStyle,
                    opacity: selectedDeptIds.size === 0 ? 0.55 : 1,
                    cursor: selectedDeptIds.size === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  ✉️ Νέο email
                </button>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: "var(--color-table-header-bg)", color: "var(--color-table-header-text)", textAlign: "left" }}>
                      <th style={{ ...thStyle, width: 44 }} aria-label="Επιλογή" />
                      <th style={thStyle}>Τμήμα</th>
                      <th style={thStyle}>Email</th>
                      <th style={thStyle}>Τηλέφωνα</th>
                      <th style={{ ...thStyle, width: 104 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {currentDeptPanelItems.map((department) => (
                      <tr key={department._id} style={{ borderBottom: "1px solid var(--color-line)" }}>
                        <td style={tdStyle}>
                          {department.email?.trim() ? (
                            <input
                              type="checkbox"
                              checked={selectedDeptIds.has(department._id)}
                              onChange={() => toggleDeptSelection(department._id)}
                              aria-label={`Επιλογή ${department.name}`}
                            />
                          ) : null}
                        </td>
                        <td style={tdStyle}>{department.name}</td>
                        <td style={tdStyle}>{department.email || "—"}</td>
                        <td style={tdStyle}><PhoneList item={department} size="small" /></td>
                        <td style={tdStyle}>
                          {department.email && (
                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                type="button"
                                onClick={() => handleCopyEmail(department.email, `dept-${department._id}`)}
                                title="Αντιγραφή email"
                                style={copyBtnStyle}
                              >
                                {copiedId === `dept-${department._id}` ? "✓" : "📋"}
                              </button>
                              <button
                                type="button"
                                onClick={() => openComposeEmail(department.email)}
                                title="Σύνταξη email"
                                style={copyBtnStyle}
                              >
                                ✉️
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredDeptPanelItems.length > pageSize && (
                <div style={{ ...paginationContainerStyle, background: "transparent", borderTop: "none", padding: "14px 0 0" }}>
                  <button
                    type="button"
                    onClick={() => setDeptPanelPage((prev) => Math.max(1, prev - 1))}
                    disabled={deptPanelPage === 1}
                    style={paginationButtonStyle}
                  >
                    ←
                  </button>
                  {Array.from({ length: totalDeptPanelPages }, (_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setDeptPanelPage(idx + 1)}
                      style={deptPanelPage === idx + 1 ? paginationActiveButtonStyle : paginationButtonStyle}
                    >
                      {idx + 1}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setDeptPanelPage((prev) => Math.min(totalDeptPanelPages, prev + 1))}
                    disabled={deptPanelPage === totalDeptPanelPages}
                    style={paginationButtonStyle}
                  >
                    →
                  </button>
                </div>
              )}
                </>
              )}
            </>
          )}
        </div>
      )}

      {showDeptEmails && (
        <div className="section-divider">
          <span>Αναζήτηση Χρηστών</span>
        </div>
      )}

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24, marginTop: 24, alignItems: "flex-end" }}>
        <div style={{ flex: "1 1 240px" }}>
          <label style={labelStyle}>Όνομα ή Επώνυμο</label>
          <input
            type="text"
            placeholder="π.χ. Γεωργ..."
            value={nameQuery}
            onChange={(e) => setNameQuery(e.target.value)}
            style={inputStyle}
            autoFocus
          />
        </div>
        <div style={{ flex: "1 1 240px" }}>
          <label style={labelStyle}>Τμήμα</label>
          <div style={departmentSearchStyle}>
            <input
              type="text"
              placeholder="π.χ. Λογιστ..."
              value={deptQuery}
              onChange={(e) => setDeptQuery(e.target.value)}
              style={{ ...inputStyle, flex: "1 1 180px" }}
            />
            <select
              value={departments.some((department) => department.name === deptQuery) ? deptQuery : ""}
              onChange={(e) => setDeptQuery(e.target.value)}
              style={{ ...inputStyle, flex: "0 1 220px" }}
              aria-label="Επιλογή τμήματος"
            >
              <option value="">Επιλογή τμήματος</option>
              {departments.map((department) => (
                <option key={department._id} value={department.name}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClearSearch}
          disabled={!nameQuery.trim() && !deptQuery.trim()}
          title="Καθαρισμός"
          aria-label="Καθαρισμός αναζήτησης"
          style={{
            ...clearSearchBtnStyle,
            opacity: !nameQuery.trim() && !deptQuery.trim() ? 0.55 : 1,
            cursor: !nameQuery.trim() && !deptQuery.trim() ? "not-allowed" : "pointer",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 2v6h6" />
            <path d="M21 12A9 9 0 0 0 6 5.3L3 8" />
            <path d="M21 22v-6h-6" />
            <path d="M3 12a9 9 0 0 0 15 6.7l3-2.7" />
          </svg>
        </button>
      </div>

      {loading && <p style={{ color: "var(--color-text-muted)" }}>Αναζήτηση...</p>}

      {!loading && (nameQuery.trim() || deptQuery.trim()) && results.length === 0 && (
        <p style={{ color: "var(--color-text-muted)" }}>Δεν βρέθηκαν αποτελέσματα.</p>
      )}

      {results.length > 0 && (
        <div
          style={{
            background: "var(--color-card)",
            borderRadius: "var(--radius)",
            boxShadow: "var(--shadow)",
            overflow: "hidden",
          }}
        >
          <div style={resultsToolbarStyle}>
            <label style={selectAllLabelStyle}>
              <input
                type="checkbox"
                checked={allVisibleEmpsSelected}
                disabled={visibleEmpItems.length === 0}
                onChange={(e) => handleToggleAllVisibleEmps(e.target.checked)}
                aria-label="Επιλογή και αντιγραφή όλων των email στην τρέχουσα σελίδα"
              />
              Επιλογή & αντιγραφή όλων στην οθόνη
            </label>
            <span style={{ color: "var(--color-text-muted)", fontSize: 13 }}>
              Επιλέξτε εγγραφές και αντιγράψτε τα email μαζί.
            </span>
            <button
              type="button"
              onClick={handleCopySelectedEmpEmails}
              disabled={selectedEmpIds.size === 0}
              style={{
                ...primaryActionBtnStyle,
                opacity: selectedEmpIds.size === 0 ? 0.55 : 1,
                cursor: selectedEmpIds.size === 0 ? "not-allowed" : "pointer",
              }}
            >
              {copiedId === "selected-emps" ? "✓ Αντιγράφηκαν" : "Αντιγραφή επιλεγμένων"}
            </button>
            <button
              type="button"
              onClick={() =>
                openComposeEmailBulk(
                  results.filter((emp) => selectedEmpIds.has(emp._id) && emp.email?.trim()).map((emp) => emp.email)
                )
              }
              disabled={selectedEmpIds.size === 0}
              title="Άνοιγμα email client με όλους τους επιλεγμένους στο BCC"
              style={{
                ...primaryActionBtnStyle,
                opacity: selectedEmpIds.size === 0 ? 0.55 : 1,
                cursor: selectedEmpIds.size === 0 ? "not-allowed" : "pointer",
              }}
            >
              ✉️ Νέο email
            </button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "var(--color-table-header-bg)", color: "var(--color-table-header-text)", textAlign: "left" }}>
                <th style={{ ...thStyle, width: 44 }} aria-label="Επιλογή" />
                <th style={thStyle}>Ονοματεπώνυμο</th>
                <th style={thStyle}>Τμήμα</th>
                <th style={thStyle}>Θέση</th>
                <th style={thStyle}>Τηλέφωνα</th>
                <th style={thStyle}>Email</th>
                <th style={{ ...thStyle, width: 104 }} />
              </tr>
            </thead>
            <tbody>
              {currentResults.map((emp) => (
                <tr key={emp._id} style={{ borderBottom: "1px solid var(--color-line)" }}>
                  <td style={tdStyle}>
                    {emp.email?.trim() ? (
                      <input
                        type="checkbox"
                        checked={selectedEmpIds.has(emp._id)}
                        onChange={() => toggleEmpSelection(emp._id)}
                        aria-label={`Επιλογή ${emp.lastName} ${emp.firstName}`}
                      />
                    ) : null}
                  </td>
                  <td style={tdStyle}>
                    {emp.lastName} {emp.firstName}
                  </td>
                  <td style={tdStyle}>{formatDepartments(emp)}</td>
                  <td style={tdStyle}>{emp.position || "—"}</td>
                  <td style={tdStyle}><PhoneList item={emp} size="small" /></td>
                  <td style={tdStyle}>{emp.email || "—"}</td>
                  <td style={tdStyle}>
                    {emp.email && (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => handleCopyEmail(emp.email, emp._id)}
                          title="Αντιγραφή email"
                          style={copyBtnStyle}
                        >
                          {copiedId === emp._id ? "✓" : "📋"}
                        </button>
                        <button
                          type="button"
                          onClick={() => openComposeEmail(emp.email)}
                          title="Σύνταξη email"
                          style={copyBtnStyle}
                        >
                          ✉️
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {results.length > pageSize && (
            <div style={paginationContainerStyle}>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
                style={paginationButtonStyle}
              >
                ←
              </button>
              {Array.from({ length: totalPages }, (_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPage(idx + 1)}
                  style={page === idx + 1 ? paginationActiveButtonStyle : paginationButtonStyle}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                style={paginationButtonStyle}
              >
                →
              </button>
            </div>
          )}
        </div>
      )}
      </div>

      {/* Ομάδες Email - μεταφέρθηκαν εδώ, στο τέλος της αρχικής σελίδας αναζήτησης */}
      <div id="email-groups-section" style={{ marginTop: 40 }}>
        <EmailGroups />
      </div>

      {/* 3D Charts - ορατά μόνο σε Διαχειριστές, ένα δίπλα στο άλλο */}
      {isAdmin && (
        <div className="admin-charts-row" style={{ marginTop: 40 }}>
          <div className="section-card admin-chart-card">
            <PersonnelBarChart3D />
          </div>
          <div className="section-card admin-chart-card">
            <UsageLeaderboard3D />
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="section-card" style={{ marginTop: 24 }}>
          <DepartmentPositionChart3D />
        </div>
      )}
    </div>
  );
};

const labelStyle = { display: "block", fontSize: 13, marginBottom: 6, color: "var(--color-text-muted)" };
const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid var(--color-line)",
  borderRadius: 8,
  fontSize: 15,
};
const departmentSearchStyle = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  flexWrap: "wrap",
};
const thStyle = { padding: "10px 14px", fontWeight: 600, fontSize: 13 };
const tdStyle = { padding: "10px 14px", color: "var(--color-text)" };
const copyBtnStyle = {
  border: "1px solid var(--color-line)",
  background: "transparent",
  borderRadius: 6,
  padding: "4px 7px",
  cursor: "pointer",
  fontSize: 12,
};
const paginationContainerStyle = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  justifyContent: "flex-end",
  flexWrap: "wrap",
  padding: "14px 16px",
  background: "var(--color-card)",
  borderTop: "1px solid var(--color-line)",
};
const paginationButtonStyle = {
  background: "transparent",
  border: "1px solid var(--color-line)",
  borderRadius: 8,
  color: "var(--color-text)",
  padding: "8px 12px",
  cursor: "pointer",
};
const paginationActiveButtonStyle = {
  ...paginationButtonStyle,
  background: "var(--color-accent)",
  color: "#FFFFFF",
  borderColor: "var(--color-accent)",
};
const deptEmailsToggleBtnStyle = {
  background: "var(--color-accent)",
  color: "#FFFFFF",
  border: "none",
  borderRadius: 8,
  padding: "10px 14px",
  fontWeight: 700,
  fontSize: 14,
  whiteSpace: "nowrap",
};
const deptEmailsPanelStyle = {
  marginTop: 20,
  background: "var(--color-card)",
  borderRadius: "var(--radius)",
  boxShadow: "var(--shadow)",
  padding: 16,
  overflow: "hidden",
};
const deptEmailsToolbarStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 14,
};
const resultsToolbarStyle = {
  ...deptEmailsToolbarStyle,
  padding: "14px 16px",
  borderBottom: "1px solid var(--color-line)",
  marginBottom: 0,
};
const primaryActionBtnStyle = {
  background: "var(--color-accent)",
  color: "#FFFFFF",
  border: "none",
  borderRadius: 8,
  padding: "8px 14px",
  fontWeight: 700,
  fontSize: 13,
};
const selectAllLabelStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  fontSize: 13,
  fontWeight: 600,
  color: "var(--color-text)",
  cursor: "pointer",
  whiteSpace: "nowrap",
};
const clearSearchBtnStyle = {
  background: "var(--color-card)",
  border: "1px solid var(--color-line)",
  color: "var(--color-text)",
  borderRadius: 8,
  width: 42,
  height: 42,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  flexShrink: 0,
};

export default SearchDirectory;
