import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import api from "../api/axios";
import { openComposeEmail, openComposeEmailBulk } from "../utils/mailto";

// --- Μικρά SVG εικονίδια ---
const EditIcon = (props) => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);
const CloseIcon = (props) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);
const TrashIcon = (props) => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" />
  </svg>
);
const CopyIcon = (props) => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);
const MailIcon = (props) => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-10 6L2 7" />
  </svg>
);
const CheckIcon = (props) => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
const BuildingIcon = (props) => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="4" y="2" width="16" height="20" rx="1" />
    <path d="M9 22v-4h6v4" />
    <path d="M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01" />
  </svg>
);
const BuildingIconLarge = () => (
  <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.35 }}>
    <rect x="4" y="2" width="16" height="20" rx="1" />
    <path d="M9 22v-4h6v4" />
    <path d="M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01" />
  </svg>
);
// Άτομο -> διακεκομμένη γραμμή με βέλος -> ομάδα φακέλων email (decorative header icon)
const PersonToGroupIcon = (props) => (
  <svg viewBox="0 0 260 56" width="300" height="65" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    {/* Άτομο */}
    <circle cx="18" cy="14" r="9" />
    <path d="M3 47c0-9 6.5-15 15-15s15 6 15 15" />
    {/* Διακεκομμένη γραμμή (πιο μακριά) που καταλήγει σε βέλος - με κίνηση (marching ants) */}
    <path className="email-flow-line" d="M46 27h140" strokeDasharray="6 7" />
    <path d="M176 17 192 27l-16 10" />
    {/* Ομάδα από φακέλους email */}
    <g transform="translate(198,4)">
      <rect x="10" y="11" width="36" height="26" rx="3" opacity="0.5" />
      <rect x="4" y="5" width="36" height="26" rx="3" fill="var(--color-paper)" />
      <path d="M4 8.5 22 21.5 40 8.5" />
    </g>
  </svg>
);

const EmailGroups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState(null);

  const loadGroups = async () => {
    try {
      const { data } = await api.get("/email-groups");
      setGroups(data);
    } catch (err) {
      setError(err.response?.data?.message || "Σφάλμα φόρτωσης ομάδων");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const flashError = (msg) => {
    setError(msg);
    setTimeout(() => setError(""), 3500);
  };

  const activeGroup = groups.find((g) => g._id === activeGroupId) || null;

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    try {
      const { data } = await api.post("/email-groups", { name: newGroupName.trim(), emails: [] });
      setGroups((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewGroupName("");
      setShowNewForm(false); // η ομάδα δημιουργείται κλειστή, φαίνεται μόνο το όνομα
    } catch (err) {
      flashError(err.response?.data?.message || "Σφάλμα δημιουργίας ομάδας");
    }
  };

  const handleRenameGroup = async (group, newName) => {
    if (!newName.trim() || newName.trim() === group.name) return;
    try {
      const { data } = await api.put(`/email-groups/${group._id}`, { name: newName.trim() });
      setGroups((prev) => prev.map((g) => (g._id === group._id ? data : g)));
    } catch (err) {
      flashError(err.response?.data?.message || "Σφάλμα μετονομασίας");
    }
  };

  const handleAddEmail = async (group, email) => {
    const trimmed = email.trim();
    if (!trimmed) return;
    try {
      const { data } = await api.post(`/email-groups/${group._id}/emails`, { email: trimmed });
      setGroups((prev) => prev.map((g) => (g._id === group._id ? data : g)));
    } catch (err) {
      flashError(err.response?.data?.message || "Μη έγκυρο email");
    }
  };

  const handleAddEmailsBulk = async (group, emails) => {
    if (!Array.isArray(emails) || emails.length === 0) return;
    try {
      const { data } = await api.post(`/email-groups/${group._id}/emails/bulk`, { emails });
      setGroups((prev) => prev.map((g) => (g._id === group._id ? data : g)));
    } catch (err) {
      flashError(err.response?.data?.message || "Σφάλμα προσθήκης emails");
    }
  };

  const handleRemoveEmail = async (group, email) => {
    try {
      const { data } = await api.delete(`/email-groups/${group._id}/emails/${encodeURIComponent(email)}`);
      setGroups((prev) => prev.map((g) => (g._id === group._id ? data : g)));
    } catch (err) {
      flashError(err.response?.data?.message || "Σφάλμα αφαίρεσης email");
    }
  };

  const handleDeleteGroup = async (group) => {
    if (!window.confirm(`Διαγραφή ομάδας "${group.name}";`)) return;
    try {
      await api.delete(`/email-groups/${group._id}`);
      setGroups((prev) => prev.filter((g) => g._id !== group._id));
      setActiveGroupId(null);
    } catch (err) {
      flashError(err.response?.data?.message || "Σφάλμα διαγραφής ομάδας");
    }
  };

  const handleCopy = async (group) => {
    const text = group.emails.join("; ");
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      return true;
    } catch (err) {
      flashError("Δεν ήταν δυνατή η αντιγραφή. Δοκιμάστε ξανά.");
      return false;
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "12px 0" }}>
        <p>Φόρτωση ομάδων...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "12px 0 8px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <h1 style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)", marginBottom: 4 }}>
          Οι Ομάδες Email μου
        </h1>
        <PersonToGroupIcon className="person-to-group-icon" style={{ flexShrink: 0 }} aria-hidden="true" />
      </div>
      <p style={{ color: "var(--color-text-muted)", marginTop: 0 }}>
        Δημιουργήστε ομάδες με emails για γρήγορη επικόλληση όπου χρειάζεται. Πατήστε σε μια ομάδα για να δείτε τα emails της.
      </p>

      {error && <div style={{ color: "var(--color-danger)", marginBottom: 14, fontWeight: 600 }}>{error}</div>}

      <div className="groups-layout">
        {/* Αριστερά: στοιβαγμένη λίστα ομάδων με scroll */}
        <div className="groups-sidebar">
          {!showNewForm && (
            <button onClick={() => setShowNewForm(true)} style={{ ...addBtn, width: "100%" }}>
              + Νέα Ομάδα
            </button>
          )}

          {showNewForm && (
            <form onSubmit={handleCreateGroup} className="section-card" style={{ marginTop: 0, padding: 16, marginBottom: 18 }}>
              <label style={labelStyle}>Όνομα Ομάδας *</label>
              <input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="π.χ. Προμηθευτές"
                style={inputStyle}
                autoFocus
                required
              />
              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <button type="submit" style={primaryBtn}>Δημιουργία</button>
                <button
                  type="button"
                  onClick={() => { setShowNewForm(false); setNewGroupName(""); }}
                  className="profile-cancel-button"
                  style={secondaryBtn}
                >
                  Ακύρωση
                </button>
              </div>
            </form>
          )}

          {groups.length === 0 && !showNewForm && (
            <p style={{ color: "var(--color-text-muted)", marginTop: 20, fontSize: 14 }}>
              Δεν έχετε δημιουργήσει ακόμα καμία ομάδα.
            </p>
          )}

          <div className="groups-list">
            {groups.map((group) => (
              <GroupChip
                key={group._id}
                group={group}
                active={group._id === activeGroupId}
                onOpen={() => setActiveGroupId(group._id)}
                onRename={(newName) => handleRenameGroup(group, newName)}
                onCopy={() => handleCopy(group)}
              />
            ))}
          </div>
        </div>

        {/* Δεξιά: μεγάλο panel με τις λεπτομέρειες της επιλεγμένης ομάδας */}
        <div className="groups-main">
          {activeGroup ? (
            <GroupPanel
              group={activeGroup}
              onClose={() => setActiveGroupId(null)}
              onAddEmail={(email) => handleAddEmail(activeGroup, email)}
              onAddEmailsBulk={(emails) => handleAddEmailsBulk(activeGroup, emails)}
              onRemoveEmail={(email) => handleRemoveEmail(activeGroup, email)}
              onDelete={() => handleDeleteGroup(activeGroup)}
              onCopy={() => handleCopy(activeGroup)}
            />
          ) : (
            <div className="section-card" style={{ marginTop: 0, textAlign: "center", padding: "48px 24px", color: "var(--color-text-muted)" }}>
              <BuildingIconLarge />
              <p style={{ marginTop: 12, marginBottom: 0 }}>
                {groups.length === 0
                  ? "Δημιουργήστε την πρώτη σας ομάδα από αριστερά."
                  : "Επιλέξτε μια ομάδα από αριστερά για να δείτε τα emails της."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ---- Κουτάκι ομάδας (κλειστό, δείχνει μόνο όνομα) - στοιβαγμένο αριστερά ----
const GroupChip = ({ group, active, onOpen, onRename, onCopy }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(group.name);
  const [copied, setCopied] = useState(false);

  useEffect(() => setDraft(group.name), [group.name]);

  const submit = () => {
    onRename(draft);
    setEditing(false);
  };

  const handleCopyClick = async (e) => {
    e.stopPropagation();
    if (group.emails.length === 0) return;
    const ok = await onCopy();
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };

  if (editing) {
    return (
      <div
        style={{ ...chipStyle, cursor: "default", background: "var(--color-card)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={submit}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") { setDraft(group.name); setEditing(false); }
          }}
          autoFocus
          style={{ border: "none", background: "transparent", outline: "none", fontSize: 14, fontWeight: 600, flex: 1, color: "var(--color-text)" }}
        />
      </div>
    );
  }

  return (
    <div
      className={`group-chip${active ? " active" : ""}`}
      style={chipStyle}
      onClick={onOpen}
      title="Πατήστε για να δείτε τα emails"
    >
      <span style={{ fontWeight: 600, fontSize: 14, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {group.name}
      </span>
      <span style={countBadgeStyle}>{group.emails.length}</span>
      <button
        onClick={handleCopyClick}
        disabled={group.emails.length === 0}
        title={group.emails.length === 0 ? "Δεν υπάρχουν emails" : "Αντιγραφή όλων των emails"}
        aria-label="Αντιγραφή όλων των emails"
        style={{
          ...chipEditBtnStyle,
          color: copied ? "var(--color-success)" : "var(--color-text-muted)",
          opacity: group.emails.length === 0 ? 0.4 : 1,
          cursor: group.emails.length === 0 ? "default" : "pointer",
        }}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); openComposeEmailBulk(group.emails); }}
        disabled={group.emails.length === 0}
        title={group.emails.length === 0 ? "Δεν υπάρχουν emails" : "Νέο email στην ομάδα"}
        aria-label="Νέο email στην ομάδα"
        style={{
          ...chipEditBtnStyle,
          opacity: group.emails.length === 0 ? 0.4 : 1,
          cursor: group.emails.length === 0 ? "default" : "pointer",
        }}
      >
        <MailIcon />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); setEditing(true); }}
        title="Μετονομασία ομάδας"
        aria-label="Μετονομασία ομάδας"
        style={chipEditBtnStyle}
      >
        <EditIcon />
      </button>
    </div>
  );
};

// ---- Panel με τις λεπτομέρειες μιας ομάδας (δεξιά, μεγάλο) ----
const GroupPanel = ({ group, onClose, onAddEmail, onAddEmailsBulk, onRemoveEmail, onDelete, onCopy }) => {
  const [emailDraft, setEmailDraft] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [copied, setCopied] = useState(false);
  const [boxStyle, setBoxStyle] = useState({ position: "fixed", top: -9999, left: -9999, opacity: 0 });
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);
  const boxRef = useRef(null);

  // Αναζήτηση/autocomplete emails από τη βάση καθώς πληκτρολογεί ο χρήστης
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!emailDraft.trim()) {
      setSuggestions([]);
      setSelectedEmails([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await api.get("/employees/search-emails", { params: { q: emailDraft.trim() } });
        setSuggestions(data);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      }
    }, 200);
    return () => clearTimeout(debounceRef.current);
  }, [emailDraft]);

  // Κλείσιμο dropdown όταν πατάει κάπου αλλού
  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setShowSuggestions(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Υπολογισμός θέσης dropdown ώστε να μένει ΠΑΝΤΑ μέσα στα όρια της οθόνης.
  // Προτεραιότητα: δεξιά από το πεδίο, στο ίδιο ύψος. Αν δεν χωράει κάθετα, ανοίγει προς τα ΠΑΝΩ (drop-up).
  useLayoutEffect(() => {
    if (!showSuggestions || suggestions.length === 0) return;
    const wrapperEl = wrapperRef.current;
    const boxEl = boxRef.current;
    if (!wrapperEl || !boxEl) return;

    const margin = 16;
    const wrapperRect = wrapperEl.getBoundingClientRect();
    const boxRect = boxEl.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    // Οριζόντια: προσπάθησε δεξιά από το πεδίο· αν δεν χωράει, κόλλα το όσο πιο κοντά γίνεται μέσα στην οθόνη
    let left = wrapperRect.right + margin;
    if (left + boxRect.width > viewportW - margin) {
      left = Math.max(margin, viewportW - boxRect.width - margin);
    }

    // Κάθετα: ξεκίνα στο ύψος του πεδίου· αν δεν χωράει προς τα κάτω, άνοιξε προς τα πάνω (drop-up)
    let top = wrapperRect.top;
    if (top + boxRect.height > viewportH - margin) {
      top = Math.max(margin, wrapperRect.bottom - boxRect.height);
    }

    setBoxStyle({ position: "fixed", top, left, opacity: 1 });
  }, [showSuggestions, suggestions]);

  // Κλείσιμο όταν γίνεται scroll/resize ΕΚΤΟΣ του dropdown (π.χ. scroll στη σελίδα),
  // ώστε να μη μένει "κολλημένο" σε λάθος σημείο. Το scroll ΜΕΣΑ στη λίστα emails αγνοείται.
  useEffect(() => {
    if (!showSuggestions) return;
    const close = (e) => {
      if (boxRef.current && e.target && boxRef.current.contains(e.target)) return;
      setShowSuggestions(false);
    };
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [showSuggestions]);

  const submitEmail = (e) => {
    e?.preventDefault();
    if (!emailDraft.trim()) return;
    onAddEmail(emailDraft.trim());
    resetSearch();
  };

  const resetSearch = () => {
    setEmailDraft("");
    setSuggestions([]);
    setSelectedEmails([]);
    setShowSuggestions(false);
  };

  const toggleSelected = (email) => {
    setSelectedEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  const handleInsertSelected = () => {
    if (selectedEmails.length === 0) return;
    onAddEmailsBulk(selectedEmails);
    resetSearch();
  };

  const handleCopyClick = async () => {
    const ok = await onCopy();
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Μοναδικά emails στη λίστα προτάσεων (ίδιο email μπορεί να προέρχεται από παραπάνω εγγραφές)
  const uniqueSuggestionEmails = [...new Set(suggestions.map((s) => s.email))];
  const allSelected = uniqueSuggestionEmails.length > 0 && selectedEmails.length === uniqueSuggestionEmails.length;

  const toggleSelectAll = () => {
    setSelectedEmails(allSelected ? [] : uniqueSuggestionEmails);
  };

  return (
    <div className="section-card" style={panelStyle}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: "var(--font-display)", color: "var(--color-ink)" }}>{group.name}</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--color-text-muted)" }}>
            {group.emails.length} email{group.emails.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button onClick={onClose} title="Κλείσιμο" aria-label="Κλείσιμο" style={iconOnlyBtn}>
          <CloseIcon />
        </button>
      </div>

      <div style={emailListContainerStyle}>
        {group.emails.length === 0 && (
          <span style={{ color: "var(--color-text-muted)", fontSize: 13 }}>Δεν έχουν προστεθεί emails ακόμα.</span>
        )}
        {group.emails.map((email) => (
          <span key={email} style={emailChipStyle}>
            <button
              onClick={() => openComposeEmail(email)}
              title="Σύνταξη email"
              aria-label={`Σύνταξη email προς ${email}`}
              style={emailComposeBtnStyle}
            >
              <MailIcon style={{ opacity: 0.75, flexShrink: 0 }} />
            </button>
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email}</span>
            <button
              onClick={() => onRemoveEmail(email)}
              title="Αφαίρεση"
              aria-label={`Αφαίρεση ${email}`}
              style={emailRemoveBtnStyle}
            >
              <CloseIcon width={12} height={12} />
            </button>
          </span>
        ))}
      </div>

      <div ref={wrapperRef} style={{ position: "relative" }}>
        <form onSubmit={submitEmail} style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            value={emailDraft}
            onChange={(e) => setEmailDraft(e.target.value)}
            onFocus={() => emailDraft.trim() && setShowSuggestions(true)}
            placeholder="Πληκτρολογήστε email ή γράμματα..."
            style={{ ...inputStyle, flex: 1 }}
            autoComplete="off"
          />
          <button type="submit" style={{ ...primaryBtn, padding: "8px 14px" }}>+ Προσθήκη</button>
        </form>

        {showSuggestions && suggestions.length > 0 && (
            <div ref={boxRef} className="email-suggestions-box" style={boxStyle}>
              <div style={suggestionsHeaderStyle}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--color-text-muted)", cursor: "pointer" }}>
                  <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
                  Επιλογή όλων ({uniqueSuggestionEmails.length})
                </label>
                {selectedEmails.length > 0 && (
                  <span style={{ fontSize: 12, color: "var(--color-accent-dark)", fontWeight: 700 }}>
                    {selectedEmails.length} επιλεγμένα
                  </span>
                )}
              </div>

              <div style={suggestionsListStyle}>
                {suggestions.map((item) => (
                  <label
                    key={`${item.type}-${item.id}`}
                    style={suggestionItemStyle}
                  >
                    <input
                      type="checkbox"
                      checked={selectedEmails.includes(item.email)}
                      onChange={() => toggleSelected(item.email)}
                      style={{ flexShrink: 0 }}
                    />
                    {item.type === "department" ? (
                      <BuildingIcon style={{ opacity: 0.6, flexShrink: 0, color: "var(--color-accent-dark)" }} />
                    ) : (
                      <MailIcon style={{ opacity: 0.6, flexShrink: 0 }} />
                    )}
                    <div style={{ overflow: "hidden" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {item.email}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                        {item.type === "department" ? `Τμήμα: ${item.label}` : `${item.label}${item.sublabel ? " · " + item.sublabel : ""}`}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <div style={suggestionsFooterStyle}>
                <button
                  type="button"
                  onClick={handleInsertSelected}
                  disabled={selectedEmails.length === 0}
                  style={{
                    ...primaryBtn,
                    width: "100%",
                    padding: "8px 0",
                    opacity: selectedEmails.length === 0 ? 0.5 : 1,
                    cursor: selectedEmails.length === 0 ? "default" : "pointer",
                  }}
                >
                  Εισαγωγή επιλεγμένων{selectedEmails.length > 0 ? ` (${selectedEmails.length})` : ""}
                </button>
              </div>
            </div>
          )}
        </div>

      <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
        <button
          onClick={handleCopyClick}
          disabled={group.emails.length === 0}
          style={{
            ...secondaryBtn,
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            borderColor: "var(--color-accent)",
            color: copied ? "var(--color-success)" : "var(--color-text)",
            opacity: group.emails.length === 0 ? 0.5 : 1,
          }}
        >
          {copied ? "✓ Αντιγράφηκε!" : <><CopyIcon /> Αντιγραφή όλων</>}
        </button>
        <button
          onClick={() => openComposeEmailBulk(group.emails)}
          disabled={group.emails.length === 0}
          title="Άνοιγμα email client με όλα τα μέλη της ομάδας στο BCC"
          style={{
            ...secondaryBtn,
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            borderColor: "var(--color-accent)",
            opacity: group.emails.length === 0 ? 0.5 : 1,
          }}
        >
          <MailIcon /> Νέο email στην ομάδα
        </button>
        <button
          onClick={onDelete}
          style={{ ...secondaryBtn, display: "inline-flex", alignItems: "center", gap: 7, borderColor: "var(--color-danger)", color: "var(--color-danger)" }}
        >
          <TrashIcon /> Διαγραφή ομάδας
        </button>
      </div>
    </div>
  );
};

// ---- Στυλ ----
const labelStyle = { display: "block", fontSize: 13, marginBottom: 6, color: "var(--color-text-muted)" };
const inputStyle = {
  width: "100%",
  padding: "9px 10px",
  border: "1px solid var(--color-line)",
  borderRadius: 6,
  fontSize: 14,
};
const addBtn = {
  background: "var(--color-accent)",
  color: "var(--color-paper)",
  border: "none",
  borderRadius: 8,
  padding: "9px 18px",
  fontWeight: 700,
  marginBottom: 18,
};
const primaryBtn = { padding: "9px 16px", background: "var(--color-accent)", color: "var(--color-paper)", border: "none", borderRadius: 6, fontWeight: 700 };
const secondaryBtn = { padding: "9px 16px", borderRadius: 6, fontWeight: 700 };

const chipStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "100%",
  background: "var(--color-card)",
  border: "1px solid var(--color-line)",
  borderRadius: 10,
  padding: "10px 12px",
  boxShadow: "var(--shadow)",
  cursor: "pointer",
  transition: "transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease",
};
const countBadgeStyle = {
  background: "var(--color-paper)",
  color: "var(--color-text-muted)",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 700,
  padding: "2px 7px",
  minWidth: 18,
  textAlign: "center",
  flexShrink: 0,
};
const chipEditBtnStyle = {
  border: "none",
  background: "transparent",
  color: "var(--color-text-muted)",
  padding: 2,
  display: "inline-flex",
  alignItems: "center",
  flexShrink: 0,
};

const panelStyle = {
  marginTop: 0,
  width: "100%",
  maxWidth: 640,
};

const EMAIL_ROW_HEIGHT = 34;
const EMAIL_ROW_GAP = 6;
const EMAIL_VISIBLE_ROWS = 4;

const emailListContainerStyle = {
  display: "flex",
  flexDirection: "column",
  gap: EMAIL_ROW_GAP,
  margin: "16px 0",
  minHeight: EMAIL_ROW_HEIGHT,
  maxHeight: EMAIL_VISIBLE_ROWS * EMAIL_ROW_HEIGHT + (EMAIL_VISIBLE_ROWS - 1) * EMAIL_ROW_GAP,
  overflowY: "auto",
  paddingRight: 4,
};
const emailChipStyle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  width: "100%",
  height: EMAIL_ROW_HEIGHT,
  boxSizing: "border-box",
  background: "var(--color-paper)",
  border: "1px solid var(--color-line)",
  borderRadius: 999,
  padding: "0 6px 0 10px",
  fontSize: 13,
  flexShrink: 0,
};
const emailComposeBtnStyle = {
  border: "none",
  background: "transparent",
  color: "var(--color-text-muted)",
  padding: 0,
  display: "inline-flex",
  alignItems: "center",
  cursor: "pointer",
  flexShrink: 0,
};
const emailRemoveBtnStyle = {
  border: "none",
  background: "transparent",
  color: "var(--color-danger)",
  padding: 0,
  display: "inline-flex",
  alignItems: "center",
  cursor: "pointer",
  flexShrink: 0,
};
const iconOnlyBtn = {
  border: "none",
  background: "transparent",
  color: "var(--color-text-muted)",
  padding: 4,
  display: "inline-flex",
  alignItems: "center",
  flexShrink: 0,
};

const suggestionsHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  padding: "8px 10px",
  borderBottom: "1px solid var(--color-line)",
  flexShrink: 0,
};
const suggestionsListStyle = {
  overflowY: "auto",
  maxHeight: 235, // ~5 γραμμές ορατές πριν χρειαστεί scroll
};
const suggestionsFooterStyle = {
  padding: 8,
  borderTop: "1px solid var(--color-line)",
  flexShrink: 0,
};
const suggestionItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 10px",
  cursor: "pointer",
  borderBottom: "1px solid var(--color-line)",
};

export default EmailGroups;
