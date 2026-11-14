/*
 * Pose engine: keyframed shooting-form skeleton, angle maths and an SVG renderer.
 * Used by the launch page (auto-looping) and the dashboard (scrubbable).
 * The keyframes are illustrative sample data, not real tracking output.
 */
(function () {
  const NS = "http://www.w3.org/2000/svg";

  // Joints: head, sh (shoulder), hip, el/wr (shooting arm), off (off hand), knR/anR, knL/anL
  const POSES = [
    { name: "Set",            head: [150, 52], sh: [150, 96],  hip: [150, 176], el: [184, 128], wr: [186, 92],  off: [122, 126], knR: [172, 256], anR: [164, 338], knL: [130, 258], anL: [136, 338] },
    { name: "Load",           head: [148, 70], sh: [148, 114], hip: [146, 194], el: [184, 142], wr: [186, 106], off: [120, 140], knR: [176, 262], anR: [166, 338], knL: [126, 264], anL: [130, 338] },
    { name: "Release",        head: [150, 40], sh: [150, 84],  hip: [150, 162], el: [188, 56],  wr: [198, 22],  off: [118, 100], knR: [160, 244], anR: [158, 318], knL: [140, 246], anL: [142, 320] },
    { name: "Follow-through", head: [152, 42], sh: [152, 86],  hip: [152, 164], el: [196, 56],  wr: [214, 28],  off: [116, 108], knR: [162, 248], anR: [160, 326], knL: [142, 250], anL: [144, 328] },
  ];
  const JOINTS = ["head", "sh", "hip", "el", "wr", "off", "knR", "anR", "knL", "anL"];
  const BONES = [["sh", "hip"], ["sh", "el"], ["el", "wr"], ["sh", "off"], ["hip", "knR"], ["knR", "anR"], ["hip", "knL"], ["knL", "anL"]];

  /** Interpolated pose for t in [0, 1] across all keyframes. */
  function poseAt(t) {
    t = Math.max(0, Math.min(1, t));
    const seg = t * (POSES.length - 1);
    const i = Math.min(Math.floor(seg), POSES.length - 2);
    const f = seg - i;
    const a = POSES[i], b = POSES[i + 1];
    const out = {};
    JOINTS.forEach((j) => {
      out[j] = [a[j][0] + (b[j][0] - a[j][0]) * f, a[j][1] + (b[j][1] - a[j][1]) * f];
    });
    out.phase = POSES[Math.round(seg)].name;
    return out;
  }

  /** Angle in degrees at point b formed by a-b-c. */
  function angle(a, b, c) {
    const v1 = [a[0] - b[0], a[1] - b[1]], v2 = [c[0] - b[0], c[1] - b[1]];
    const dot = v1[0] * v2[0] + v1[1] * v2[1];
    const m = Math.hypot(v1[0], v1[1]) * Math.hypot(v2[0], v2[1]);
    return (Math.acos(Math.max(-1, Math.min(1, dot / m))) * 180) / Math.PI;
  }

  function arcPath(a, b, c, r) {
    const u = norm([a[0] - b[0], a[1] - b[1]]), v = norm([c[0] - b[0], c[1] - b[1]]);
    const p1 = [b[0] + u[0] * r, b[1] + u[1] * r], p2 = [b[0] + v[0] * r, b[1] + v[1] * r];
    const sweep = u[0] * v[1] - u[1] * v[0] > 0 ? 1 : 0;
    return "M " + p1[0].toFixed(1) + " " + p1[1].toFixed(1) + " A " + r + " " + r + " 0 0 " + sweep + " " + p2[0].toFixed(1) + " " + p2[1].toFixed(1);
  }
  function norm(v) { const m = Math.hypot(v[0], v[1]) || 1; return [v[0] / m, v[1] / m]; }

  function el(name, attrs) {
    const n = document.createElementNS(NS, name);
    Object.keys(attrs || {}).forEach((k) => n.setAttribute(k, attrs[k]));
    return n;
  }

  /**
   * Build the figure inside an <svg> and return { update(pose) }.
   * update() returns { elbow, knee } angles so callers can show them elsewhere.
   */
  function createFigure(svg, opts) {
    const showLabels = !opts || opts.labels !== false;
    svg.setAttribute("viewBox", "20 0 280 360");
    svg.setAttribute("font-family", "Barlow Condensed, Arial Narrow, sans-serif");

    svg.appendChild(el("line", { x1: 30, y1: 345, x2: 290, y2: 345, stroke: "#fff", "stroke-opacity": ".14", "stroke-width": 1.5 }));
    const guide = el("line", { y1: 10, y2: 345, stroke: "#ffb800", "stroke-opacity": ".35", "stroke-width": 1.2, "stroke-dasharray": "4 5" });
    svg.appendChild(guide);

    const bones = BONES.map(() => svg.appendChild(el("line", { stroke: "#f2f5fa", "stroke-opacity": ".9", "stroke-width": 4, "stroke-linecap": "round" })));
    const head = svg.appendChild(el("circle", { r: 20, fill: "none", stroke: "#f2f5fa", "stroke-opacity": ".9", "stroke-width": 4 }));
    const elbowArc = svg.appendChild(el("path", { fill: "none", stroke: "#ffb800", "stroke-width": 3.5, "stroke-linecap": "round" }));
    const kneeArc = svg.appendChild(el("path", { fill: "none", stroke: "#ffb800", "stroke-width": 3.5, "stroke-linecap": "round" }));
    const dots = {};
    JOINTS.filter((j) => j !== "head").forEach((j) => { dots[j] = svg.appendChild(el("circle", { r: 5.5, fill: "#ff5a1f" })); });

    // Angle labels are optional (the launch page shows the numbers in tiles instead).
    const elbowTxt = el("text", { fill: "#ffb800", "font-size": 15, "font-weight": 700 });
    const kneeTxt = el("text", { fill: "#ffb800", "font-size": 15, "font-weight": 700 });
    if (showLabels) { svg.appendChild(elbowTxt); svg.appendChild(kneeTxt); }

    function update(p) {
      guide.setAttribute("x1", p.hip[0]); guide.setAttribute("x2", p.hip[0]);
      BONES.forEach((b, i) => {
        bones[i].setAttribute("x1", p[b[0]][0]); bones[i].setAttribute("y1", p[b[0]][1]);
        bones[i].setAttribute("x2", p[b[1]][0]); bones[i].setAttribute("y2", p[b[1]][1]);
      });
      head.setAttribute("cx", p.head[0]); head.setAttribute("cy", p.head[1]);
      Object.keys(dots).forEach((j) => { dots[j].setAttribute("cx", p[j][0]); dots[j].setAttribute("cy", p[j][1]); });

      const elbow = angle(p.sh, p.el, p.wr);
      const knee = angle(p.hip, p.knR, p.anR);
      elbowArc.setAttribute("d", arcPath(p.sh, p.el, p.wr, 18));
      kneeArc.setAttribute("d", arcPath(p.hip, p.knR, p.anR, 22));
      elbowTxt.setAttribute("x", p.el[0] + 14); elbowTxt.setAttribute("y", p.el[1] + 4);
      elbowTxt.textContent = "elbow " + Math.round(elbow) + "°";
      kneeTxt.setAttribute("x", p.knR[0] + 18); kneeTxt.setAttribute("y", p.knR[1] + 4);
      kneeTxt.textContent = "knee " + Math.round(knee) + "°";
      return { elbow: elbow, knee: knee, phase: p.phase };
    }
    return { update: update };
  }

  /** Smooth yoyo loop: calls cb(t) with t in [0, 1]. Returns a stop function. */
  function loop(cb, periodMs) {
    periodMs = periodMs || 6000;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { cb(0.66); return function () {}; }
    let raf, start = performance.now();
    (function frame(now) {
      const phase = ((now - start) % periodMs) / periodMs;
      cb(0.5 - 0.5 * Math.cos(phase * 2 * Math.PI));
      raf = requestAnimationFrame(frame);
    })(start);
    return function () { cancelAnimationFrame(raf); };
  }

  window.SpAn = window.SpAn || {};
  /** Body lean in degrees: head vs the midpoint between the ankles (0 = perfectly upright). */
  function tilt(p) {
    const mx = (p.anR[0] + p.anL[0]) / 2, my = (p.anR[1] + p.anL[1]) / 2;
    return Math.abs((Math.atan2(p.head[0] - mx, my - p.head[1]) * 180) / Math.PI);
  }

  window.SpAn.Pose = { POSES: POSES, poseAt: poseAt, angle: angle, tilt: tilt, createFigure: createFigure, loop: loop };
})();