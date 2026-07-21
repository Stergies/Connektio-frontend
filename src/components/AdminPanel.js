import React, { useCallback, useEffect, useState } from "react";
import api from "../api/axios";
import DepartmentForm from "./DepartmentForm";
import EmployeeForm from "./EmployeeForm";
import UserForm from "./UserForm";
import PhoneList from "./PhoneList";
import { useAuth } from "../context/AuthContext";

const AdminPanel = () => {
  const { user: currentUser } = useAuth();
  const [tab, setTab] = useState("employees"); // "employees" | "departments" | "accounts"
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [editingDept, setEditingDept] = useState(null);
  const [editingEmp, setEditingEmp] = useState(null);
  const [editingAccount, setEditingAccount] = useState(null);
  const [showDeptForm, setShowDeptForm] = useState(false);
  const [showEmpForm, setShowEmpForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [deptPage, setDeptPage] = useState(1);
  const [empPage, setEmpPage] = useState(1);
  const [accPage, setAccPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const pageSize = 5;

  const loadData = async () => {
    const [d, e, a] = await Promise.all([
      api.get("/departments"),
      api.get("/employees"),
      api.get("/auth/users"),
    ]);
    setDepartments(d.data);
    setEmployees(e.data);
    setAccounts(a.data);
  };

  const formatDepartments = (item) => {
    const names = [item.department?.name || item.department, item.secondDepartment?.name || item.secondDepartment].filter(Boolean);
    return names.length ? names.join(" / ") : "—";
  };

  const normalizeSearchValue = (value) => String(value || "").toLowerCase().trim();

  const matchesSearch = useCallback((item, query) => {
    const normalizedQuery = normalizeSearchValue(query);
    if (!normalizedQuery) return true;

    const searchableValues = [
      item.firstName,
      item.lastName,
      item.fullName,
      item.username,
      item.name,
      item.position,
      item.email,
      item.role,
      item.department?.name,
      item.secondDepartment?.name,
    ];

    return searchableValues.some((value) => normalizeSearchValue(value).includes(normalizedQuery));
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const totalDeptPages = Math.max(1, Math.ceil(departments.filter((dept) => matchesSearch(dept, searchQuery)).length / pageSize));
    if (deptPage > totalDeptPages) setDeptPage(totalDeptPages);
  }, [departments, deptPage, searchQuery, matchesSearch]);

  useEffect(() => {
    const totalEmpPages = Math.max(1, Math.ceil(employees.filter((emp) => matchesSearch(emp, searchQuery)).length / pageSize));
    if (empPage > totalEmpPages) setEmpPage(totalEmpPages);
  }, [employees, empPage, searchQuery, matchesSearch]);

  useEffect(() => {
    const totalAccPages = Math.max(1, Math.ceil(accounts.filter((acc) => matchesSearch(acc, searchQuery)).length / pageSize));
    if (accPage > totalAccPages) setAccPage(totalAccPages);
  }, [accounts, accPage, searchQuery, matchesSearch]);

  const flash = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  // ---- Τμήματα ----
  const handleDeptSubmit = async (form) => {
    try {
      if (editingDept) {
        await api.put(`/departments/${editingDept._id}`, form);
        flash("Το τμήμα ενημερώθηκε");
      } else {
        await api.post("/departments", form);
        flash("Το τμήμα δημιουργήθηκε");
      }
      setShowDeptForm(false);
      setEditingDept(null);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Σφάλμα");
    }
  };

  const handleDeptDelete = async (dept) => {
    if (!window.confirm(`Διαγραφή τμήματος "${dept.name}";`)) return;
    try {
      await api.delete(`/departments/${dept._id}`);
      flash("Το τμήμα διαγράφηκε");
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Σφάλμα");
    }
  };

  // ---- Χρήστες / Υπάλληλοι ----
  const handleEmpSubmit = async (form) => {
    try {
      if (editingEmp) {
        await api.put(`/employees/${editingEmp._id}`, form);
        flash("Ο χρήστης ενημερώθηκε");
      } else {
        await api.post("/employees", form);
        flash("Ο χρήστης δημιουργήθηκε");
      }
      setShowEmpForm(false);
      setEditingEmp(null);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Σφάλμα");
    }
  };

  const handleEmpDelete = async (emp) => {
    if (!window.confirm(`Διαγραφή χρήστη "${emp.firstName} ${emp.lastName}";`)) return;
    try {
      await api.delete(`/employees/${emp._id}`);
      flash("Ο χρήστης διαγράφηκε");
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Σφάλμα");
    }
  };

  // ---- Λογαριασμοί χρηστών (login) ----
  const handleUserSubmit = async (form) => {
    try {
      if (editingAccount) {
        await api.put(`/auth/users/${editingAccount._id}`, form);
        flash("Ο λογαριασμός ενημερώθηκε");
      } else {
        await api.post("/auth/users", form);
        flash("Ο λογαριασμός δημιουργήθηκε");
      }
      setShowUserForm(false);
      setEditingAccount(null);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Σφάλμα");
    }
  };

  const handleUserDelete = async (acc) => {
    if (!window.confirm(`Διαγραφή λογαριασμού "${acc.username}";`)) return;
    try {
      await api.delete(`/auth/users/${acc._id}`);
      flash("Ο λογαριασμός διαγράφηκε");
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Σφάλμα");
    }
  };

  const filteredDepartments = departments.filter((dept) => matchesSearch(dept, searchQuery));
  const filteredEmployees = employees.filter((emp) => matchesSearch(emp, searchQuery));
  const filteredAccounts = accounts.filter((acc) => matchesSearch(acc, searchQuery));

  const totalDeptPages = Math.max(1, Math.ceil(filteredDepartments.length / pageSize));
  const totalEmpPages = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));
  const totalAccPages = Math.max(1, Math.ceil(filteredAccounts.length / pageSize));
  const currentDepartments = filteredDepartments.slice((deptPage - 1) * pageSize, deptPage * pageSize);
  const currentEmployees = filteredEmployees.slice((empPage - 1) * pageSize, empPage * pageSize);
  const currentAccounts = filteredAccounts.slice((accPage - 1) * pageSize, accPage * pageSize);

  return (
    <div className="container admin-panel" style={{ padding: "36px 20px" }}>
      <h1 style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)" }}>Διαχείριση Καταλόγου</h1>

      <div className="admin-layout" style={{ marginBottom: 20 }}>
        <aside className="admin-sidebar" style={sidebarStyle}>
          <SidebarButton active={tab === "employees"} onClick={() => setTab("employees")} icon={
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
              <path d="M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12zm0 2.2c-3.3 0-9.8 1.7-9.8 5v1.6h19.6V19.2c0-3.3-6.5-5-9.8-5z" />
            </svg>
          }>Χρήστες</SidebarButton>
          <SidebarButton active={tab === "departments"} onClick={() => setTab("departments")} icon={
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
              <path d="M3 13h18v8H3v-8zm2-10h14v6H5V3zM7 7h2v2H7V7z" />
            </svg>
          }>Τμήματα</SidebarButton>
          <SidebarButton active={tab === "accounts"} onClick={() => setTab("accounts")} icon={
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
              <path d="M19.4 12.9c.04-.3.06-.6.06-.9s-.02-.6-.06-.9l2.1-1.6c.18-.14.23-.4.12-.6l-2-3.4c-.11-.2-.35-.3-.57-.22l-2.5 1c-.5-.4-1-.7-1.6-.9l-.4-2.7A.5.5 0 0 0 13.9 2h-4c-.26 0-.47.19-.5.45l-.4 2.7c-.6.2-1.1.5-1.6.9l-2.5-1a.5.5 0 0 0-.57.22l-2 3.4c-.11.2-.06.46.12.6l2.1 1.6c-.04.3-.06.6-.06.9s.02.6.06.9L2.4 14.5c-.18.14-.23.4-.12.6l2 3.4c.11.2.35.3.57.22l2.5-1c.5.4 1 .7 1.6.9l.4 2.7c.03.26.24.45.5.45h4c.26 0 .47-.19.5-.45l.4-2.7c.6-.2 1.1-.5 1.6-.9l2.5 1c.22.09.46 0 .57-.22l2-3.4c.11-.2.06-.46-.12-.6l-2.1-1.6zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z" />
            </svg>
          }>Λογαριασμοί</SidebarButton>
        </aside>

        <div className="admin-main" style={{ flex: 1 }}>
          <div className="section-card">
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "var(--color-text-muted)" }}>
                Αναζήτηση (όνομα, επώνυμο, τμήμα, username)
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setDeptPage(1);
                  setEmpPage(1);
                  setAccPage(1);
                }}
                placeholder="π.χ. Γεωργία ή Λογιστήριο"
                style={{
                  width: "100%",
                  maxWidth: 420,
                  padding: "10px 12px",
                  border: "1px solid var(--color-line)",
                  borderRadius: 8,
                  fontSize: 15,
                }}
              />
            </div>

            {/* content area - tables and forms follow */}

      {message && <div style={{ color: "var(--color-success)", marginBottom: 14, fontWeight: 600 }}>{message}</div>}

      {tab === "departments" && (
        <>
          {!showDeptForm && (
            <button
              onClick={() => { setEditingDept(null); setShowDeptForm(true); }}
              style={addBtn}
            >
              + Νέο Τμήμα
            </button>
          )}

          {showDeptForm && (
            <DepartmentForm
              initialData={editingDept}
              onSubmit={handleDeptSubmit}
              onCancel={() => { setShowDeptForm(false); setEditingDept(null); }}
            />
          )}

          {!showDeptForm && (
            <>
              <Table
                headers={["Τμήμα", "Email", "Τηλέφωνα", ""]}
                rows={currentDepartments.map((d) => [
                  d.name,
                  d.email || "—",
                  <PhoneList key={`phones-${d._id}`} item={d} size="small" />,
                  <RowActions
                    key={d._id}
                    onEdit={() => { setEditingDept(d); setShowDeptForm(true); }}
                    onDelete={() => handleDeptDelete(d)}
                  />,
                ])}
              />
              {totalDeptPages > 1 && (
                <PaginationControls page={deptPage} totalPages={totalDeptPages} onPageChange={setDeptPage} />
              )}
            </>
          )}
        </>
      )}

      {tab === "employees" && (
        <>
          {!showEmpForm && (
            <button
              onClick={() => { setEditingEmp(null); setShowEmpForm(true); }}
              style={addBtn}
            >
              + Νέος Χρήστης
            </button>
          )}

          {showEmpForm && (
            <EmployeeForm
              initialData={editingEmp}
              departments={departments}
              onSubmit={handleEmpSubmit}
              onCancel={() => { setShowEmpForm(false); setEditingEmp(null); }}
            />
          )}

          {!showEmpForm && (
            <>
              <Table
                headers={["Ονοματεπώνυμο", "Τμήμα", "Θέση", "Τηλέφωνα", ""]}
                rows={currentEmployees.map((e) => [
                  `${e.lastName} ${e.firstName}`,
                  formatDepartments(e),
                  e.position || "—",
                  <PhoneList key={`phones-${e._id}`} item={e} size="small" />,
                  <RowActions
                    key={e._id}
                    onEdit={() => { setEditingEmp(e); setShowEmpForm(true); }}
                    onDelete={() => handleEmpDelete(e)}
                  />,
                ])}
              />
              {totalEmpPages > 1 && (
                <PaginationControls page={empPage} totalPages={totalEmpPages} onPageChange={setEmpPage} />
              )}
            </>
          )}
        </>
      )}

      {tab === "accounts" && (
        <>
          <p style={{ color: "var(--color-text-muted)", marginTop: -8 }}>
            Οι λογαριασμοί εδώ αφορούν τα στοιχεία σύνδεσης (username/κωδικός) στην εφαρμογή —
            "Διαχειριστής" έχει πλήρη δικαιώματα, "Χρήστης" έχει πρόσβαση μόνο στην αναζήτηση.
          </p>

          {!showUserForm && (
            <button
              onClick={() => { setEditingAccount(null); setShowUserForm(true); }}
              style={addBtn}
            >
              + Νέος Λογαριασμός
            </button>
          )}

          {showUserForm && (
            <UserForm
              initialData={editingAccount}
              onSubmit={handleUserSubmit}
              onCancel={() => { setShowUserForm(false); setEditingAccount(null); }}
            />
          )}

          {!showUserForm && (
            <>
              <Table
                headers={["Ονοματεπώνυμο", "Username", "Ρόλος", ""]}
                rows={currentAccounts.map((acc) => [
                  acc.fullName,
                  acc.username,
                  acc.role === "admin" ? "Διαχειριστής" : "Χρήστης",
                  acc._id === currentUser?._id ? (
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ color: "var(--color-text-muted)", fontSize: 13 }}>(ο δικός σας λογαριασμός)</span>
                      <button
                        onClick={() => { setEditingAccount(acc); setShowUserForm(true); }}
                        style={iconBtn}
                        title="Επεξεργασία"
                        aria-label="Επεξεργασία"
                      >
                        ✏️
                      </button>
                    </div>
                  ) : (
                    <RowActions
                      key={acc._id}
                      onEdit={() => { setEditingAccount(acc); setShowUserForm(true); }}
                      onDelete={() => handleUserDelete(acc)}
                    />
                  ),
                ])}
              />
              {totalAccPages > 1 && (
                <PaginationControls page={accPage} totalPages={totalAccPages} onPageChange={setAccPage} />
              )}
            </>
          )}
        </>
      )}

          </div>
        </div>
      </div>
    </div>
  );
};

// TabButton removed — replaced by SidebarButton for vertical nav

const SidebarButton = ({ active, onClick, children, icon }) => (
  <button
    className={`sidebar-button ${active ? "active" : ""}`}
    onClick={onClick}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      width: "100%",
      padding: "12px 14px",
      borderRadius: 10,
      textAlign: "left",
      fontWeight: 700,
      cursor: "pointer",
    }}
  >
    <span style={{ fontSize: 18 }}>{icon}</span>
    <span>{children}</span>
  </button>
);

const RowActions = ({ onEdit, onDelete, hideEdit }) => (
  <div style={{ display: "flex", gap: 8 }}>
    {!hideEdit && (
      <button onClick={onEdit} style={iconBtn} title="Επεξεργασία" aria-label="Επεξεργασία">
        ✏️
      </button>
    )}
    <button onClick={onDelete} style={iconBtn} title="Διαγραφή" aria-label="Διαγραφή">
      🗑️
    </button>
  </div>
);

const Table = ({ headers, rows }) => (
  <div style={{ background: "var(--color-card)", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", overflow: "hidden" }}>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
      <thead>
        <tr style={{ background: "var(--color-table-header-bg)", color: "var(--color-table-header-text)", textAlign: "left" }}>
          {headers.map((h, i) => (
            <th key={i} style={{ padding: "10px 14px", fontSize: 13 }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && (
          <tr><td colSpan={headers.length} style={{ padding: 16, color: "var(--color-text-muted)" }}>Δεν υπάρχουν εγγραφές</td></tr>
        )}
          {rows.map((cells, i) => (
          <tr key={i} style={{ borderBottom: "1px solid var(--color-line)", background: i % 2 ? "var(--color-row-alt)" : "transparent" }}>
            {cells.map((c, j) => (
              <td key={j} style={{ padding: "10px 14px", color: "var(--color-text)", borderColor: "var(--color-border)" }}>{c}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const addBtn = {
  background: "var(--color-accent)",
  color: "#FFFFFF",
  border: "none",
  borderRadius: 8,
  padding: "9px 18px",
  fontWeight: 700,
  marginBottom: 18,
};
const iconBtn = {
  background: "transparent",
  border: "1px solid var(--color-line)",
  color: "var(--color-text)",
  borderRadius: 8,
  width: 36,
  height: 36,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 16,
  padding: 0,
  cursor: "pointer",
  transition: "background 140ms ease, border-color 140ms ease, color 140ms ease",
};

const PaginationControls = ({ page, totalPages, onPageChange }) => (
  <div style={paginationContainerStyle}>
    <button
      type="button"
      onClick={() => onPageChange((prev) => Math.max(1, prev - 1))}
      disabled={page === 1}
      style={paginationButtonStyle}
    >
      ←
    </button>
    {Array.from({ length: totalPages }, (_, idx) => (
      <button
        key={idx}
        type="button"
        onClick={() => onPageChange(idx + 1)}
        style={page === idx + 1 ? paginationActiveButtonStyle : paginationButtonStyle}
      >
        {idx + 1}
      </button>
    ))}
    <button
      type="button"
      onClick={() => onPageChange((prev) => Math.min(totalPages, prev + 1))}
      disabled={page === totalPages}
      style={paginationButtonStyle}
    >
      →
    </button>
  </div>
);

const paginationContainerStyle = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  justifyContent: "flex-end",
  flexWrap: "wrap",
  marginTop: 14,
};
const paginationButtonStyle = {
  background: "transparent",
  border: "1px solid var(--color-line)",
  color: "var(--color-text)",
  borderRadius: 8,
  padding: "8px 12px",
  cursor: "pointer",
};
const paginationActiveButtonStyle = {
  ...paginationButtonStyle,
  background: "var(--color-accent)",
  color: "#FFFFFF",
  borderColor: "var(--color-accent)",
};

export default AdminPanel;

const sidebarStyle = {
  width: 200,
  display: "flex",
  flexDirection: "column",
  gap: 8,
  padding: 12,
  borderRadius: 10,
  background: "var(--color-card)",
  boxShadow: "var(--shadow)",
};
