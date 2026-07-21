import React, { useMemo } from "react";

// Δημιουργεί ένα ελαφρύ, ψευδο-τυχαίο δίκτυο κόμβων/γραμμών (network pattern) για διακοσμητικό
// φόντο. Οι κόμβοι "παλλόνται" απαλά (CSS animation: nodePulse) για μια ζωντανή, διακριτική κίνηση.
const NetworkBackground = (props) => {
  const nodeCount = props.nodeCount || 18;
  const seed = props.seed || 42;
  const stroke = props.stroke || "#2c6c1e";
  const nodeColor = props.nodeColor || "#2c6c1e";

  const data = useMemo(() => {
    let s = seed;
    const rand = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };

    const pts = Array.from({ length: nodeCount }, (_, i) => ({
      id: i,
      x: Math.round(rand() * 100),
      y: Math.round(rand() * 100),
      r: 1.8 + rand() * 1.8,
      delay: (rand() * 3.6).toFixed(2),
    }));

    const segs = [];
    pts.forEach((p, i) => {
      pts.forEach((q, j) => {
        if (j <= i) return;
        const dist = Math.hypot(p.x - q.x, p.y - q.y);
        if (dist < 26) segs.push({ id: i + "-" + j, x1: p.x, y1: p.y, x2: q.x, y2: q.y, opacity: Math.max(0.05, 0.28 - dist / 130) });
      });
    });

    return { nodes: pts, lines: segs };
  }, [nodeCount, seed]);

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%" aria-hidden="true">
      {data.lines.map((l) => (
        <line key={l.id} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={stroke} strokeWidth="0.25" opacity={l.opacity} />
      ))}
      {data.nodes.map((n) => (
        <circle
          key={n.id}
          className="network-bg-node"
          cx={n.x}
          cy={n.y}
          r={n.r}
          fill={nodeColor}
          style={{ animationDelay: n.delay + "s" }}
        />
      ))}
    </svg>
  );
};

export default NetworkBackground;
