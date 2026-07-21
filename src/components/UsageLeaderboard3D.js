import React, { useEffect, useState } from "react";
import api from "../api/axios";

const PALETTE = [
  "#2C6C1E", // Primary
  "#157E1C", // Dark Primary
  "#4D8C43", // Medium Green
  "#7DA874", // Soft Green
  "#64748B", // Muted Slate
  "#94A3B8", // Disabled
  "#CBD5E1"  // Light Gray
];
const MEDALS = ["\uD83E\uDD47", "\uD83E\uDD48", "\uD83E\uDD49"];

function shade(hex, percent) {
  const num = parseInt(hex.slice(1), 16);
  const amt = Math.round(2.55 * percent);
  let r = (num >> 16) + amt;
  let g = ((num >> 8) & 0xff) + amt;
  let b = (num & 0xff) + amt;
  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));
  return "#" + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
}

// Επιλέγει λευκό ή σκούρο κείμενο ανάλογα με τη φωτεινότητα του φόντου (για ευανάγνωστα αρχικά avatar)
function textColorFor(hex) {
  const num = parseInt(hex.slice(1), 16);
  const r = num >> 16;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#0F172A" : "#FFFFFF";
}

function getInitials(name) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const UsageLeaderboard3D = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/auth/usage-leaderboard");
        setLeaderboard(data.leaderboard || []);
      } catch (err) {
        setError(err.response?.data?.message || "Σφάλμα φόρτωσης κατάταξης");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div>
      <h2 style={{ margin: 0, fontFamily: "var(--font-display)", color: "var(--color-ink)" }}>
        Κατάταξη Χρήσης Εφαρμογής
      </h2>
      <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--color-text-muted)", maxWidth: 560, minHeight: 58 }}>
        Οι χρήστες κατατάσσονται βάσει πλήθους πραγματικών συνδέσεων στην εφαρμογή. Ο πρώτος
        ορίζει το 100% και οι υπόλοιποι υπολογίζονται αναλογικά.
      </p>

      {error && <div style={{ color: "var(--color-danger)", marginTop: 12, fontWeight: 600 }}>{error}</div>}

      {loading ? (
        <p style={{ color: "var(--color-text-muted)", marginTop: 20 }}>Φόρτωση κατάταξης...</p>
      ) : leaderboard.length === 0 ? (
        <p style={{ color: "var(--color-text-muted)", marginTop: 20 }}>Δεν υπάρχουν ακόμα δεδομένα χρήσης.</p>
      ) : (
        <div className="leaderboard-list">
          {leaderboard.map((row, i) => {
            const front = PALETTE[i % PALETTE.length];
            const top = shade(front, 22);
            const side = shade(front, -22);
            const isTopThree = i < 3;

            return (
              <div key={row._id} style={rowStyle}>
                <div style={isTopThree ? rankBadgeStyle : { ...rankBadgeStyle, ...rankBadgeMutedStyle }}>
                  {isTopThree ? MEDALS[i] : i + 1}
                </div>

                <div
                  style={{
                    ...avatarStyle,
                    background:`linear-gradient(135deg,${top},${front})`,
                    color: textColorFor(front),
                    boxShadow: `0 0 16px ${front}55`,
                  }}
                >
                  {getInitials(row.fullName)}
                </div>

                <div style={{ minWidth: 150, maxWidth: 190 }}>
                  <div style={nameStyle}>{row.fullName}</div>
                  <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>@{row.username}</div>
                </div>

                <div style={{ flex: 1, minWidth: 120 }}>
                  <div className="bar3d-track">
                    <div
                      className="bar3d-fill"
                      style={{
                        width: Math.max(row.percentage, 3) + "%",
                        "--front-color": front,
                        "--top-color": top,
                        "--side-color": side,
                      }}
                    />
                  </div>
                </div>

                <div style={percentageStyle}>{row.percentage}%</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const rowStyle = { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", minHeight: 36 };
const rankBadgeStyle = {
  width: 30,
  height: 30,
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 16,
  fontWeight: 800,
  color: "var(--color-ink)",
};
const rankBadgeMutedStyle = { fontSize: 13, color: "var(--color-text-muted)" };
const avatarStyle = {
  width: 36,
  height: 36,
  borderRadius: "50%",
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#ffffff",
  fontSize: 13,
  fontWeight: 700,
};

const nameStyle = {
  fontWeight: 700,
  fontSize: 14,
  color: "var(--color-text)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const percentageStyle = {
  width: 46,
  textAlign: "right",
  fontWeight: 800,
  fontSize: 15,
  color: "var(--color-ink)",
};

export default UsageLeaderboard3D;
