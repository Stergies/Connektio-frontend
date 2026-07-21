import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import api from "../api/axios";

// Επαγγελματική, ποικίλη παλέτα - ένα σταθερό χρώμα ανά ΘΕΣΗ (στήλη), ίδιο σε όλα τα τμήματα
const POSITION_PALETTE = [
  "#2563EB", "#16A34A", "#D97706", "#7C3AED",
  "#0891B2", "#DB2777", "#475569", "#CA8A04",
];
const OVERLAP_COLOR = "#F59E0B";

const POS_SPACING = 1.7;
const DEPT_SPACING = 2.1;
const BAR_SIZE = 0.75;
const HEIGHT_SCALE = 3.0;
const MIN_HEIGHT = 0.05;

function makeTextSprite(text, options) {
  const opts = options || {};
  const fontSize = opts.fontSize || 42;
  const color = opts.color || "#0F172A";
  const weight = opts.weight || 700;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  ctx.font = weight + " " + fontSize + "px system-ui, sans-serif";
  const padding = 16;
  const metrics = ctx.measureText(text);
  canvas.width = Math.ceil(metrics.width) + padding * 2;
  canvas.height = fontSize + padding * 2;
  ctx.font = weight + " " + fontSize + "px system-ui, sans-serif";
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(material);
  const scale = 0.01;
  sprite.scale.set(canvas.width * scale, canvas.height * scale, 1);
  return sprite;
}

const DepartmentPositionChart3D = () => {
  const containerRef = useRef(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedDept, setExpandedDept] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/employees/stats/by-department");
        setDepartments(data.departments || []);
      } catch (err) {
        setError(err.response?.data?.message || "Σφάλμα φόρτωσης ανάλυσης τμημάτων");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const allPositions = React.useMemo(() => {
    const totals = new Map();
    departments.forEach((d) => {
      d.positions.forEach((p) => {
        totals.set(p.position, (totals.get(p.position) || 0) + p.count);
      });
    });
    return Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([position]) => position);
  }, [departments]);

  // Αν έχει επιλεγεί ένα τμήμα, το chart δείχνει ΜΟΝΟ αυτό (isolation) - τα υπόλοιπα εξαφανίζονται
  const selectedDept = React.useMemo(
    () => departments.find((d) => d.departmentId === expandedDept) || null,
    [departments, expandedDept]
  );
  const visibleDepartments = selectedDept ? [selectedDept] : departments;
  const visiblePositions = selectedDept ? selectedDept.positions.map((p) => p.position) : allPositions;

  useEffect(() => {
    if (loading || !containerRef.current || visibleDepartments.length === 0 || visiblePositions.length === 0) return undefined;

    const container = containerRef.current;
    container.innerHTML = "";

    const width = container.clientWidth;
    const height = 480;

    const scene = new THREE.Scene();
    scene.background = null;

    const gridW = (visiblePositions.length - 1) * POS_SPACING;
    const gridD = (visibleDepartments.length - 1) * DEPT_SPACING;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(gridW * 0.55 + 3, 7.5, gridD * 0.8 + 6);
    camera.lookAt(gridW * 0.4, 0.5, gridD * 0.3);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(gridW * 0.4, 0.5, gridD * 0.3);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 4;
    controls.maxDistance = 34;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.update();

    scene.add(new THREE.AmbientLight(0xffffff, 0.68));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
    dirLight.position.set(6, 10, 6);
    scene.add(dirLight);
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-6, 4, -4);
    scene.add(fillLight);

    const grid = new THREE.GridHelper(Math.max(gridW, gridD) + 6, 18, "#94A3B8", "#E2E8F0");
    grid.position.set(gridW * 0.4, 0, gridD * 0.3);
    grid.material.opacity = 0.35;
    grid.material.transparent = true;
    scene.add(grid);

    const maxCount = Math.max(1, ...visibleDepartments.flatMap((d) => d.positions.map((p) => p.count)));

    visibleDepartments.forEach((dept, di) => {
      const z = di * DEPT_SPACING;

      const deptLabel = makeTextSprite(dept.departmentName, { color: "#0F172A", fontSize: 34, weight: 700 });
      deptLabel.position.set(-1.7, 0.25, z);
      scene.add(deptLabel);

      const totalLabel = makeTextSprite(String(dept.total) + " άτομα", { color: "#64748B", fontSize: 26, weight: 600 });
      totalLabel.position.set(-1.7, -0.35, z);
      scene.add(totalLabel);

      dept.positions.forEach((posRow) => {
        const posIndex = visiblePositions.indexOf(posRow.position);
        if (posIndex === -1) return;
        const x = posIndex * POS_SPACING;
        const color = POSITION_PALETTE[posIndex % POSITION_PALETTE.length];

        const barHeight = Math.max(MIN_HEIGHT, (posRow.count / maxCount) * HEIGHT_SCALE);
        const geo = new THREE.BoxGeometry(BAR_SIZE, barHeight, BAR_SIZE);
        const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.08 });
        const cube = new THREE.Mesh(geo, mat);
        cube.position.set(x, barHeight / 2, z);
        scene.add(cube);

        const countLabel = makeTextSprite(String(posRow.count), { color: "#0F172A", fontSize: 34 });
        countLabel.position.set(x, barHeight + 0.3, z);
        scene.add(countLabel);

        const overlapTotal = posRow.overlaps.reduce((sum, o) => sum + o.count, 0);
        if (overlapTotal > 0) {
          const markerGeo = new THREE.SphereGeometry(0.13, 20, 20);
          const markerMat = new THREE.MeshStandardMaterial({ color: OVERLAP_COLOR, roughness: 0.3, metalness: 0.2 });
          const marker = new THREE.Mesh(markerGeo, markerMat);
          marker.position.set(x + BAR_SIZE * 0.45, barHeight + 0.62, z - BAR_SIZE * 0.45);
          scene.add(marker);

          const overlapLabel = makeTextSprite("+" + overlapTotal, { color: "#B45309", fontSize: 26, weight: 800 });
          overlapLabel.position.set(x + BAR_SIZE * 0.45, barHeight + 0.95, z - BAR_SIZE * 0.45);
          scene.add(overlapLabel);
        }
      });
    });

    visiblePositions.forEach((position, i) => {
      const label = makeTextSprite(position, { color: POSITION_PALETTE[i % POSITION_PALETTE.length], fontSize: 26, weight: 700 });
      label.position.set(i * POS_SPACING, -0.35, -DEPT_SPACING * 0.75);
      scene.add(label);
    });

    let frameId;
    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
      renderer.setSize(w, height);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      controls.dispose();
      renderer.dispose();
      scene.traverse((obj) => {
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
  }, [visibleDepartments, visiblePositions, loading]);

  return (
    <div>
      <h2 style={{ margin: 0, fontFamily: "var(--font-display)", color: "var(--color-ink)" }}>
        Ανάλυση Τμημάτων ανά Θέση (3D)
      </h2>
      <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--color-text-muted)", maxWidth: 640 }}>
        Κάθε γραμμή είναι ένα τμήμα, κάθε στήλη μια θέση. Το ύψος δείχνει πόσα άτομα την κατέχουν σε αυτό
        το τμήμα (ως κύριο ή δεύτερο τμήμα). Η <strong style={{ color: "#B45309" }}>κίτρινη σφαίρα</strong> δείχνει
        ότι κάποιοι από αυτούς ανήκουν και σε άλλο τμήμα — δείτε αναλυτικά παρακάτω.
      </p>

      {error && <div style={{ color: "var(--color-danger)", marginTop: 12, fontWeight: 600 }}>{error}</div>}

      {loading ? (
        <p style={{ color: "var(--color-text-muted)", marginTop: 20 }}>Φόρτωση ανάλυσης...</p>
      ) : departments.length === 0 ? (
        <p style={{ color: "var(--color-text-muted)", marginTop: 20 }}>
          Δεν υπάρχουν ακόμα αρκετά δεδομένα (υπάλληλοι με τμήμα/θέση) για την ανάλυση.
        </p>
      ) : (
        <>
          {selectedDept && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
              <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                Προβολή μόνο: <strong style={{ color: "var(--color-ink)" }}>{selectedDept.departmentName}</strong>
              </span>
              <button
                type="button"
                onClick={() => setExpandedDept(null)}
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: 999,
                  border: "1px solid var(--color-line)",
                  background: "var(--color-paper)",
                  color: "var(--color-ink)",
                  cursor: "pointer",
                }}
              >
                ✕ Εμφάνιση όλων
              </button>
            </div>
          )}

          <div ref={containerRef} style={{ width: "100%", height: 480, marginTop: 16, cursor: "grab" }} />

          <div style={{ marginTop: 20, borderTop: "1px solid var(--color-line)", paddingTop: 16 }}>
            <h3 style={{ margin: "0 0 10px", fontSize: 15, color: "var(--color-ink)" }}>Αναλυτική κατανομή ανά τμήμα</h3>
            <p style={{ margin: "-4px 0 10px", fontSize: 12, color: "var(--color-text-muted)" }}>
              Πατήστε σε ένα τμήμα για να δείτε λεπτομέρειες — και να το απομονώσετε στο chart από πάνω.
            </p>
            <div
              className="dept-analysis-list"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                maxHeight: 300,
                overflowY: "auto",
                paddingRight: 6,
              }}
            >
              {departments.map((dept) => {
                const isOpen = expandedDept === dept.departmentId;
                return (
                  <div key={dept.departmentId} style={{ border: "1px solid var(--color-line)", borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => setExpandedDept(isOpen ? null : dept.departmentId)}
                      style={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 14px",
                        background: "var(--color-paper)",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: 700,
                        color: "var(--color-ink)",
                        fontSize: 14,
                      }}
                    >
                      <span>{dept.departmentName}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)" }}>{dept.total} άτομα</span>
                        <span style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 160ms ease" }}>▾</span>
                      </span>
                    </button>

                    {isOpen && (
                      <div style={{ padding: "12px 16px", background: "var(--color-card)" }}>
                        {dept.positions.map((p) => (
                          <div key={p.position} style={{ marginBottom: 8, fontSize: 13.5, color: "var(--color-text)" }}>
                            <strong>{p.count}</strong> {p.position}
                            {p.overlaps.length > 0 && (
                              <span style={{ color: "var(--color-text-muted)" }}>
                                {" "}— εκ των οποίων{" "}
                                {p.overlaps.map((o, i) => (
                                  <React.Fragment key={o.departmentId}>
                                    {i > 0 ? ", " : ""}
                                    <strong style={{ color: "#B45309" }}>{o.count}</strong> είναι εγγεγραμμένοι και στο{" "}
                                    <strong>{o.departmentName}</strong>
                                  </React.Fragment>
                                ))}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DepartmentPositionChart3D;
