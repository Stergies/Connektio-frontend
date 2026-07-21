import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import api from "../api/axios";

// Χρωματική παλέτα από το εικαστικό που δόθηκε (σκούρο -> ανοιχτό μπλε)
// Επαγγελματική παλέτα: μπλε/slate για τις κατηγορίες θέσεων (κύβοι),
// και σημασιολογικά πράσινο/κόκκινο για την κατεύθυνση της μεταβολής (κύλινδροι)
const PALETTE = [
  "#60A5FA",
  "#93C5FD",
  "#38BDF8",
  "#22D3EE",
  "#818CF8",
  "#A5B4FC",
  "#7DD3FC"
];
const NO_SNAPSHOT_COLOR = "#CBD5E1";
const INCREASE_COLOR = "#22C55E";
const DECREASE_COLOR = "#EF4444";
const NEUTRAL_COLOR = "#94A3B8";

const GROUP_SPACING = 2.4;
const BAR_SIZE = 0.9;
const Z_GAP = 1.6; // απόσταση βάθους (Z) ανάμεσα στη σειρά "Τρέχων Αριθμός" και "Μεταβολή"
const MIN_HEIGHT = 0.06;

// Δημιουργεί ένα sprite κειμένου (canvas texture) - χρησιμοποιείται για ετικέτες πάνω στη σκηνή
function makeTextSprite(text, options) {
  const opts = options || {};
  const fontSize = opts.fontSize || 46;
  const color = opts.color || "#0F172A";
  const weight = opts.weight || 700;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  ctx.font = weight + " " + fontSize + "px system-ui, sans-serif";
  const padding = 18;
  const metrics = ctx.measureText(text);
  canvas.width = Math.ceil(metrics.width) + padding * 2;
  canvas.height = fontSize + padding * 2;
  // Το resize του canvas καθαρίζει το context - ξαναβάζουμε τις ρυθμίσεις
  ctx.font = weight + " " + fontSize + "px system-ui, sans-serif";
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(material);
  const scale = 0.011;
  sprite.scale.set(canvas.width * scale, canvas.height * scale, 1);
  return sprite;
}

const PersonnelBarChart3D = () => {
  const containerRef = useRef(null);
  const [stats, setStats] = useState([]);
  const [hasPreviousSnapshot, setHasPreviousSnapshot] = useState(false);
  const [previousTakenAt, setPreviousTakenAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snapshotSaving, setSnapshotSaving] = useState(false);
  const [snapshotMessage, setSnapshotMessage] = useState("");

  const loadStats = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/employees/stats/by-position");
      setStats(data.stats || []);
      setHasPreviousSnapshot(Boolean(data.hasPreviousSnapshot));
      setPreviousTakenAt(data.previousTakenAt || null);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Σφάλμα φόρτωσης στατιστικών");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleSnapshot = async () => {
    setSnapshotSaving(true);
    try {
      await api.post("/employees/stats/snapshot");
      setSnapshotMessage("✓ Η τρέχουσα κατάσταση καταγράφηκε. Η επόμενη καταγραφή θα δείξει τη μεταβολή.");
      await loadStats();
    } catch (err) {
      setSnapshotMessage(err.response?.data?.message || "Σφάλμα καταγραφής");
    } finally {
      setSnapshotSaving(false);
      setTimeout(function () { setSnapshotMessage(""); }, 4500);
    }
  };

  // ---- Δημιουργία / ενημέρωση της 3D σκηνής όποτε αλλάζουν τα δεδομένα ----
  useEffect(() => {
    if (loading || !containerRef.current || stats.length === 0) return undefined;

    const container = containerRef.current;
    container.innerHTML = ""; // καθαρισμός τυχόν προηγούμενου canvas

    const width = container.clientWidth;
    const height = 460;

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    const totalWidth = (stats.length - 1) * GROUP_SPACING;
    camera.position.set(totalWidth * 0.4 + 2, 6.5, 9.5);
    camera.lookAt(totalWidth * 0.4, 0.5, -Z_GAP / 2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(totalWidth * 0.4, 0.5, -Z_GAP / 2);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 4;
    controls.maxDistance = 26;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.update();

    // Φωτισμός - ώστε οι κύβοι/κύλινδροι να δείχνουν πραγματικό βάθος (σκίαση)
    scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(6, 10, 6);
    scene.add(dirLight);
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.35);
    fillLight.position.set(-6, 4, -4);
    scene.add(fillLight);

    // Δάπεδο / πλέγμα αναφοράς
    const grid = new THREE.GridHelper(
      Math.max(totalWidth + 6, 10),
      16,
      "#94A3B8",
      "#CBD5E1"
    );;
    grid.position.set(totalWidth * 0.4, 0, -Z_GAP / 2);
    grid.material.opacity = 0.35;
    grid.material.transparent = true;
    scene.add(grid);

    const maxCurrent = Math.max(1, ...stats.map(function (s) { return s.current; }));
    const maxChange = Math.max(1, ...stats.map(function (s) { return Math.abs(s.change || 0); }));
    const scaleFactor = 3.2; // ύψος (world units) για τη μέγιστη τιμή

    stats.forEach(function (row, i) {
      const color = PALETTE[i % PALETTE.length];
      const x = i * GROUP_SPACING;

      // --- Κύβος: Τρέχων Αριθμός Προσωπικού (σειρά Z = 0) ---
      const currentHeight = Math.max(MIN_HEIGHT, (row.current / maxCurrent) * scaleFactor);
      const cubeGeo = new THREE.BoxGeometry(BAR_SIZE, currentHeight, BAR_SIZE);
      const cubeMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.45, metalness: 0.08 });
      const cube = new THREE.Mesh(cubeGeo, cubeMat);
      cube.position.set(x, currentHeight / 2, 0);
      scene.add(cube);

      const currentLabel = makeTextSprite(String(row.current), { color: "#0F172A", fontSize: 40 });
      currentLabel.position.set(x, currentHeight + 0.35, 0);
      scene.add(currentLabel);

      // --- Κύλινδρος: Μεταβολή (σειρά Z = -Z_GAP, ξεχωριστός άξονας βάθους) ---
      if (row.change === null) {
        // Δεν υπάρχει προηγούμενο στιγμιότυπο για σύγκριση - εμφανίζουμε "placeholder" δίσκο
        const discGeo = new THREE.CylinderGeometry(BAR_SIZE / 2, BAR_SIZE / 2, 0.05, 28);
        const discMat = new THREE.MeshStandardMaterial({
          color: NO_SNAPSHOT_COLOR,
          transparent: true,
          opacity: 0.5,
          roughness: 0.6,
        });
        const disc = new THREE.Mesh(discGeo, discMat);
        disc.position.set(x, 0.03, -Z_GAP);
        scene.add(disc);

        const naLabel = makeTextSprite("—", { color: "#64748B", fontSize: 40 });
        naLabel.position.set(x, 0.5, -Z_GAP);
        scene.add(naLabel);
      } else {
        const change = row.change;
        const magnitude = Math.max(MIN_HEIGHT, (Math.abs(change) / maxChange) * scaleFactor);
        const cylGeo = new THREE.CylinderGeometry(BAR_SIZE / 2, BAR_SIZE / 2, magnitude, 28);
        const changeColor = change > 0 ? INCREASE_COLOR : change < 0 ? DECREASE_COLOR : NEUTRAL_COLOR;
        const cylMat = new THREE.MeshStandardMaterial({ color: changeColor, roughness: 0.4, metalness: 0.12 });
        const cylinder = new THREE.Mesh(cylGeo, cylMat);
        const yPos = change >= 0 ? magnitude / 2 : -magnitude / 2;
        cylinder.position.set(x, yPos, -Z_GAP);
        scene.add(cylinder);

        const changeText = change > 0 ? "+" + change : String(change);
        const changeLabel = makeTextSprite(changeText, {
          color: changeColor,
          fontSize: 40,
        });
        const labelY = change >= 0 ? magnitude + 0.35 : -magnitude - 0.35;
        changeLabel.position.set(x, labelY, -Z_GAP);
        scene.add(changeLabel);
      }

      // --- Ετικέτα θέσης (κάτω από τη στήλη) ---
      const posLabel = makeTextSprite(row.position, { color: "#1E293B", fontSize: 34, weight: 600 });
      posLabel.position.set(x, -0.55, 0.75);
      scene.add(posLabel);
    });

    // --- Ετικέτες αξόνων βάθους (Z): "Τρέχων Αριθμός" vs "Μεταβολή" ---
    const rowLabel1 = makeTextSprite("ΤΡΕΧΩΝ ΑΡΙΘΜΟΣ", { color: "#157e1c", fontSize: 30, weight: 800 });
    rowLabel1.position.set(-1.6, 0.2, 0);
    scene.add(rowLabel1);
    const rowLabel2 = makeTextSprite("ΜΕΤΑΒΟΛΗ", { color: "#475569", fontSize: 30, weight: 800 });
    rowLabel2.position.set(-1.6, 0.2, -Z_GAP);
    scene.add(rowLabel2);

    let frameId;
    const animate = function () {
      controls.update();
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = function () {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
      renderer.setSize(w, height);
    };
    window.addEventListener("resize", handleResize);

    return function cleanup() {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      controls.dispose();
      renderer.dispose();
      scene.traverse(function (obj) {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (obj.material.map) obj.material.map.dispose();
          obj.material.dispose();
        }
      });
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [stats, loading]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: "var(--font-display)", color: "var(--color-ink)" }}>
            Προσωπικό ανά Θέση &amp; Μεταβολή (3D)
          </h2>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--color-text-muted)", maxWidth: 560 }}>
            Κάθε θέση έχει δύο μπάρες: έναν <strong>κύβο</strong> για τον τρέχοντα αριθμό προσωπικού
            και έναν <strong>κύλινδρο</strong> σε ξεχωριστό άξονα βάθους (Z) για τη μεταβολή έναντι
            του τελευταίου καταγεγραμμένου στιγμιότυπου. Σύρετε με το ποντίκι για περιστροφή/zoom.
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <button
            type="button"
            onClick={handleSnapshot}
            disabled={snapshotSaving}
            style={snapshotBtnStyle}
          >
            {snapshotSaving ? "Καταγραφή..." : "📸 Καταγραφή τρέχουσας κατάστασης"}
          </button>
          {previousTakenAt && (
            <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 6 }}>
              Τελευταία καταγραφή: {new Date(previousTakenAt).toLocaleString("el-GR")}
            </div>
          )}
        </div>
      </div>

      {snapshotMessage && (
        <div style={{ marginTop: 10, fontSize: 13, fontWeight: 600, color: "var(--color-success)" }}>
          {snapshotMessage}
        </div>
      )}

      {!hasPreviousSnapshot && !loading && stats.length > 0 && (
        <div style={noSnapshotNoticeStyle}>
          Δεν υπάρχει προηγούμενο στιγμιότυπο για σύγκριση — οι κύλινδροι μεταβολής δείχνουν "—".
          Πατήστε <strong>«Καταγραφή τρέχουσας κατάστασης»</strong> τώρα, και την επόμενη φορά που θα
          αλλάξει το προσωπικό (π.χ. σε ένα μήνα) θα φανεί η πραγματική μεταβολή.
        </div>
      )}

      {error && <div style={{ color: "var(--color-danger)", marginTop: 12, fontWeight: 600 }}>{error}</div>}

      {loading ? (
        <p style={{ color: "var(--color-text-muted)", marginTop: 20 }}>Φόρτωση στατιστικών...</p>
      ) : stats.length === 0 ? (
        <p style={{ color: "var(--color-text-muted)", marginTop: 20 }}>
          Δεν υπάρχουν ακόμα καταχωρημένοι υπάλληλοι με θέση για να εμφανιστεί το γράφημα.
        </p>
      ) : (
        <>
          <div
            ref={containerRef}
            style={{
              width: "100%",
              height: 460,
              marginTop: 16,
              cursor: "grab",

              background:
                "radial-gradient(circle at top right, rgba(6,182,212,.12), transparent 35%), linear-gradient(180deg, #CBD5E1 0%, #94A3B8 100%)",

              borderRadius: 20,

              border: "1px solid #E5E7EB",

              boxShadow: "0 10px 30px rgba(30,58,138,.06)",

              overflow: "hidden"
            }}
          />

          <div style={legendContainerStyle}>
            <div style={legendItemStyle}>
              <span style={{ ...legendSwatchStyle, borderRadius: 4 }} />
              Τρέχων Αριθμός Προσωπικού (κύβος, χρώμα ανά θέση)
            </div>
            <div style={legendItemStyle}>
              <span style={{ ...legendSwatchStyle, borderRadius: 999, background: "#22C55E" }} />
              Αύξηση
            </div>
            <div style={legendItemStyle}>
              <span style={{ ...legendSwatchStyle, borderRadius: 999, background: "#EF4444" }} />
              Μείωση
            </div>
            <div style={legendItemStyle}>
              <span style={{ ...legendSwatchStyle, borderRadius: 999, background: "#94A3B8" }} />
              Καμία μεταβολή / Χωρίς στιγμιότυπο
            </div>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              {PALETTE.map(function (c) {
                return <span key={c} style={{ width: 16, height: 16, borderRadius: 4, background: c, border: "1px solid rgba(0,0,0,0.15)" }} />;
              })}
              <span style={{ fontSize: 12, color: "var(--color-text-muted)", marginLeft: 6 }}>ανά θέση</span>
            </div>
          </div>

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--color-line)" }}>
            <h3 style={{ margin: "0 0 10px", fontSize: 15, color: "var(--color-ink)" }}>Σύνολο Προσωπικού ανά Θέση</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {stats.map(function (row, i) {
                return (
                  <div
                    key={row.position}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 12px",
                      borderRadius: 999,
                      border: "1px solid var(--color-line)",
                      background: "var(--color-paper)",
                    }}
                  >
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: PALETTE[i % PALETTE.length], flexShrink: 0 }} />
                    <strong style={{ color: "var(--color-ink)" }}>{row.current}</strong>
                    <span style={{ color: "var(--color-text-muted)", fontSize: 13 }}>{row.position}</span>
                  </div>
                );
              })}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 14px",
                  borderRadius: 999,
                  background: "var(--color-accent)",
                  color: "#FFFFFF",
                  fontWeight: 700,
                }}
              >
                Σύνολο: {stats.reduce(function (sum, row) { return sum + row.current; }, 0)}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const snapshotBtnStyle = {
  background: "var(--color-accent)",
  color: "var(--color-paper)",
  border: "none",
  borderRadius: 8,
  padding: "9px 16px",
  fontWeight: 700,
  whiteSpace: "nowrap",
};
const noSnapshotNoticeStyle = {
  marginTop: 12,
  padding: "10px 14px",
  background: "rgba(245, 158, 11, 0.10)",
  border: "1px solid rgba(245, 158, 11, 0.35)",
  borderRadius: 8,
  fontSize: 13,
  color: "var(--color-text)",
};
const legendContainerStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: 18,
  marginTop: 16,
  paddingTop: 14,
  borderTop: "1px solid var(--color-line)",
  fontSize: 13,
  color: "var(--color-text)",
  alignItems: "center",
};
const legendItemStyle = { display: "flex", alignItems: "center", gap: 8 };
const legendSwatchStyle = {
  width: 16,
  height: 16,
  background: "var(--color-accent-dark)",
  display: "inline-block",
  flexShrink: 0,
};

export default PersonnelBarChart3D;