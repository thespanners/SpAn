/*
 * Hand-drawn SVG toolkit: wobbly lines, circles and arcs, a parametric side-view stickman
 * and "scientific" annotations (dimension lines, angle arcs, arrows, rulers).
 * Used by the background doodles (random) and the training popups (seeded, so they never change).
 *
 * Angles for limbs are in degrees, measured from "straight down" and turning towards the
 * direction the figure faces (right):  0 = down, 90 = forward, 180 = up.
 */
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const D2R = Math.PI / 180;

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function el(name, attrs, parent) {
    const n = document.createElementNS(NS, name);
    Object.keys(attrs || {}).forEach((k) => n.setAttribute(k, attrs[k]));
    if (parent) parent.appendChild(n);
    return n;
  }
  const f = (n) => (Math.round(n * 10) / 10).toString();
  const dir = (a) => [Math.sin(a * D2R), Math.cos(a * D2R)];
  const add = (p, v, k) => [p[0] + v[0] * (k == null ? 1 : k), p[1] + v[1] * (k == null ? 1 : k)];

  /** Catmull-Rom points -> smooth cubic path. */
  function smooth(pts) {
    let d = "M" + f(pts[0][0]) + " " + f(pts[0][1]);
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += " C" + f(p1[0] + (p2[0] - p0[0]) / 6) + " " + f(p1[1] + (p2[1] - p0[1]) / 6) +
        " " + f(p2[0] - (p3[0] - p1[0]) / 6) + " " + f(p2[1] - (p3[1] - p1[1]) / 6) +
        " " + f(p2[0]) + " " + f(p2[1]);
    }
    return d;
  }

  /** Two-link inverse kinematics: knee position for hip -> ankle, knee pushed forward (+x). */
  function ik(hip, ankle, l1, l2) {
    let dx = ankle[0] - hip[0], dy = ankle[1] - hip[1];
    let d = Math.hypot(dx, dy) || 0.01;
    const max = l1 + l2 - 0.5;
    const dd = Math.min(d, max);
    const a = (l1 * l1 - l2 * l2 + dd * dd) / (2 * dd);
    const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
    const ux = dx / d, uy = dy / d;
    const c1 = [hip[0] + ux * a - uy * h, hip[1] + uy * a + ux * h];
    const c2 = [hip[0] + ux * a + uy * h, hip[1] + uy * a - ux * h];
    return c1[0] > c2[0] ? c1 : c2;
  }

  function angleAt(v, a, b) {
    const u1 = [a[0] - v[0], a[1] - v[1]], u2 = [b[0] - v[0], b[1] - v[1]];
    const c = (u1[0] * u2[0] + u1[1] * u2[1]) / ((Math.hypot(u1[0], u1[1]) * Math.hypot(u2[0], u2[1])) || 1);
    return Math.acos(Math.max(-1, Math.min(1, c))) / D2R;
  }

  /**
   * A pen draws onto an <svg>. opts: { seed, jitter, ink, mark }
   *   ink  = colour of the stickman, mark = colour of measurements.
   */
  function createPen(svg, opts) {
    opts = opts || {};
    const rnd = opts.seed == null ? Math.random : mulberry32(opts.seed);
    const jit = opts.jitter == null ? 1 : opts.jitter;
    const ink = opts.ink || "currentColor";
    const mark = opts.mark || "currentColor";
    const root = el("g", { fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round" }, svg);
    const r = (a) => (rnd() * 2 - 1) * a * jit;
    const between = (a, b) => a + rnd() * (b - a);
    let idx = 0;

    function path(d, st) {
      st = st || {};
      const attrs = {
        d: d, stroke: st.stroke || ink, "stroke-width": st.w || 2.4, "stroke-opacity": st.o == null ? 1 : st.o,
        pathLength: 1, class: st.dotted ? "sk-fade" : "ln",
      };
      if (st.dotted) attrs["stroke-dasharray"] = "2 6";
      const p = el("path", attrs, root);
      if (!st.dotted) p.style.setProperty("--i", String(idx++));
      return p;
    }

    function line(p, q, st) {
      st = st || {};
      const dx = q[0] - p[0], dy = q[1] - p[1], len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;
      const draw = (o, w) => {
        const bow = r(Math.min(3.2, len * 0.045) + 0.5);
        const a = [p[0] + r(0.9), p[1] + r(0.9)], b = [q[0] + r(0.9), q[1] + r(0.9)];
        const m = [(a[0] + b[0]) / 2 + nx * bow, (a[1] + b[1]) / 2 + ny * bow];
        path("M" + f(a[0]) + " " + f(a[1]) + " Q" + f(m[0]) + " " + f(m[1]) + " " + f(b[0]) + " " + f(b[1]), Object.assign({}, st, { o: o, w: w }));
      };
      if (st.dotted) { path("M" + f(p[0]) + " " + f(p[1]) + " L" + f(q[0]) + " " + f(q[1]), st); return; }
      draw(st.o == null ? 1 : st.o, st.w || 2.4);
      if (!st.single) draw((st.o == null ? 1 : st.o) * 0.35, (st.w || 2.4) * 0.6); // faint second pass = sketchy
    }

    function circle(c, rad, st) {
      const n = 14, a0 = rnd() * 6.28, pts = [];
      for (let i = 0; i <= n; i++) {
        const a = a0 + (i / n) * 6.28 * 1.07; // overshoots a little, like a real pencil circle
        const rr = rad * (1 + r(0.05));
        pts.push([c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr]);
      }
      path(smooth(pts), st);
    }

    /** Arc around c from angle a0 to a1 (radians, svg coordinates). */
    function arc(c, rad, a0, a1, st) {
      const n = Math.max(3, Math.ceil(Math.abs(a1 - a0) / 0.35)), pts = [];
      for (let i = 0; i <= n; i++) {
        const a = a0 + (a1 - a0) * (i / n), rr = rad * (1 + r(0.03));
        pts.push([c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr]);
      }
      path(smooth(pts), st);
    }

    function curve(pts, st) { path(smooth(pts), st); }

    function text(p, str, st) {
      st = st || {};
      const t = el("text", { x: f(p[0]), y: f(p[1]), class: "sk-text", "text-anchor": st.anchor || "start", "font-size": st.size || 15 }, root);
      t.setAttribute("fill", st.fill || mark);
      t.setAttribute("transform", "rotate(" + f(r(2.5)) + " " + f(p[0]) + " " + f(p[1]) + ")");
      if (st.o != null) t.setAttribute("opacity", st.o);
      t.textContent = str;
      return t;
    }

    function arrow(p, q, st) {
      st = Object.assign({ stroke: mark }, st);
      line(p, q, st);
      const a = Math.atan2(q[1] - p[1], q[0] - p[0]);
      [-0.45, 0.45].forEach((da) => {
        line(q, [q[0] - Math.cos(a + da) * 8, q[1] - Math.sin(a + da) * 8], Object.assign({}, st, { single: true }));
      });
    }

    /** Dimension line with end ticks and a label beside the middle. */
    function dim(p, q, label, st) {
      st = Object.assign({ stroke: mark, w: 1.8 }, st);
      const dx = q[0] - p[0], dy = q[1] - p[1], len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;
      line(p, q, st);
      [p, q].forEach((e) => line([e[0] - nx * 5, e[1] - ny * 5], [e[0] + nx * 5, e[1] + ny * 5], Object.assign({}, st, { single: true })));
      if (label) {
        const side = (st.side || -1);
        const m = [(p[0] + q[0]) / 2 + nx * 9 * side, (p[1] + q[1]) / 2 + ny * 9 * side];
        text(m, label, { anchor: nx * side < -0.3 ? "end" : nx * side > 0.3 ? "start" : "middle", fill: st.stroke });
      }
    }

    /** Angle arc at vertex v between rays towards a and b. Returns the angle in degrees. */
    function angleMark(v, a, b, rad, label, st) {
      st = Object.assign({ stroke: mark, w: 2 }, st);
      let a0 = Math.atan2(a[1] - v[1], a[0] - v[0]), a1 = Math.atan2(b[1] - v[1], b[0] - v[0]);
      let d = a1 - a0;
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      arc(v, rad, a0, a0 + d, st);
      const deg = angleAt(v, a, b);
      if (label !== false) {
        const mid = a0 + d / 2 + (st.flip ? Math.PI : 0), lr = rad + (st.flip ? 15 : 13);
        text([v[0] + Math.cos(mid) * lr, v[1] + Math.sin(mid) * lr + 4], label || Math.round(deg) + "°", { anchor: "middle", fill: st.stroke });
      }
      return deg;
    }

    /** Ruler: a line with ticks every `step` px, taller every 5th. */
    function ruler(x0, x1, y, step, label) {
      const st = { stroke: mark, w: 1.6 };
      line([x0, y], [x1, y], st);
      let i = 0;
      for (let x = x0; x <= x1 + 0.1; x += step, i++) line([x, y], [x, y + (i % 5 === 0 ? 9 : 5)], Object.assign({}, st, { single: true }));
      if (label) text([(x0 + x1) / 2, y + 24], label, { anchor: "middle" });
    }

    function cross(c, label) {
      const st = { stroke: mark, w: 1.8, single: true };
      circle(c, 5, st);
      line([c[0] - 9, c[1]], [c[0] + 9, c[1]], st);
      line([c[0], c[1] - 9], [c[0], c[1] + 9], st);
      if (label) text([c[0] + 11, c[1] - 8], label);
    }

    function stopwatch(c, label) {
      const st = { stroke: mark, w: 1.8, single: true };
      circle(c, 11, st);
      line([c[0], c[1] - 11], [c[0], c[1] - 16], st);
      line(c, [c[0] + 5, c[1] - 5], st);
      if (label) text([c[0] + 16, c[1] + 5], label);
    }

    function ground(x0, x1, y) {
      line([x0, y], [x1, y], { w: 2, o: 0.8 });
      for (let x = x0 + 8; x < x1; x += 15) line([x, y], [x - 7, y + 8], { w: 1.4, o: 0.5, single: true });
    }

    /**
     * Side-view stickman, facing right.
     * p: { x, ground, hipH, lift, lean, feet:[front, back], arm:[upper, fore], arm2:[upper, fore], ball, flick }
     * Returns the joints so callers can annotate them.
     */
    function figure(p) {
      const lift = p.lift || 0, lean = p.lean || 0;
      const gy = p.ground - lift;
      const hip = [p.x, gy - p.hipH];
      const feet = p.feet || [8, -10];
      const ankF = [p.x + feet[0], gy], ankB = [p.x + feet[1], gy];
      const kneeF = ik(hip, ankF, 38, 38), kneeB = ik(hip, ankB, 38, 38);
      const up = [Math.sin(lean * D2R), -Math.cos(lean * D2R)];
      const sh = add(hip, up, 46);
      const head = add(sh, up, 17);
      const arm = p.arm || [20, 10], arm2 = p.arm2 || [10, 5];
      const el1 = add(sh, dir(arm[0]), 27), wr1 = add(el1, dir(arm[1]), 25);
      const el2 = add(sh, dir(arm2[0]), 27), wr2 = add(el2, dir(arm2[1]), 25);
      const J = { hip: hip, sh: sh, head: head, kneeF: kneeF, kneeB: kneeB, ankF: ankF, ankB: ankB, el: el1, wr: wr1, el2: el2, wr2: wr2, gy: gy };

      const soft = { o: 0.55 };
      line(hip, kneeB, soft); line(kneeB, ankB, soft); line(ankB, add(ankB, dir(90), 8), soft);
      line(sh, el2, soft); line(el2, wr2, soft);
      line(hip, sh);
      line(hip, kneeF); line(kneeF, ankF); line(ankF, add(ankF, dir(90), 8));
      line(sh, el1); line(el1, wr1);
      circle(head, 11);
      if (p.flick) line(wr1, add(wr1, dir(arm[1] + p.flick), 9));
      if (p.ball) {
        const bc = add(wr1, dir(arm[1]), 9);
        circle(bc, 9, { w: 2.2 });
        line([bc[0] - 9, bc[1]], [bc[0] + 9, bc[1]], { w: 1.2, o: 0.6, single: true });
        J.ball = bc;
      }
      return J;
    }

    return {
      rnd: rnd, between: between, root: root, path: path, line: line, circle: circle, arc: arc, curve: curve,
      text: text, arrow: arrow, dim: dim, angleMark: angleMark, ruler: ruler, cross: cross, stopwatch: stopwatch,
      ground: ground, figure: figure, ik: ik,
    };
  }

  window.SpAn = window.SpAn || {};
  window.SpAn.Sketch = { createPen: createPen, angleAt: angleAt, dir: dir, add: add, mulberry32: mulberry32 };
})();
