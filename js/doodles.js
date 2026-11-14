/*
 * Launch page background: random hand-drawn stickmen with "scientific" measurements.
 * Every visit draws a different set. On scroll each doodle is pushed off its side of the
 * screen with its own inertia (nearer ones move more, each lags a little differently),
 * spinning slightly and fading, and it comes back when you scroll up.
 */
(function () {
  const S = window.SpAn;
  const layer = document.getElementById("doodles");
  if (!layer || !S.Sketch) return;

  const NS = "http://www.w3.org/2000/svg";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const small = window.innerWidth < 760;
  const VW = 240, VH = 262, GROUND = 232;
  const INK = "#f4f1ea", MARK = "#ff5a1f";

  const rr = (rnd, a, b) => a + rnd() * (b - a);
  const pick = (rnd, arr) => arr[Math.floor(rnd() * arr.length)];
  const shuffle = (rnd, arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };

  // A handful of body poses; every parameter is re-rolled each time.
  const POSES = [
    (r) => ({ x: 96, ground: GROUND, hipH: rr(r, 72, 76), lean: rr(r, -4, 4), feet: [8, -10], arm: [rr(r, 5, 25), rr(r, 0, 20)], arm2: [rr(r, -25, -5), rr(r, -10, 10)] }),                    // standing
    (r) => ({ x: 90, ground: GROUND, hipH: rr(r, 58, 66), lean: rr(r, 4, 12), feet: [14, -12], arm: [80, rr(r, 160, 175)], arm2: [75, 160], ball: true }),                                   // loaded shot
    (r) => ({ x: 92, ground: GROUND, hipH: rr(r, 70, 75), lift: rr(r, 20, 42), lean: rr(r, -2, 6), feet: [6, -6], arm: [rr(r, 135, 155), rr(r, 155, 175)], arm2: [140, 160], ball: true }),   // jump shot
    (r) => ({ x: 96, ground: GROUND, hipH: rr(r, 62, 68), lift: 4, lean: rr(r, 8, 14), feet: [32, -30], arm: [rr(r, 20, 50), rr(r, 70, 110)], arm2: [rr(r, -70, -40), rr(r, -20, 20)] }),     // running
    (r) => ({ x: 92, ground: GROUND, hipH: 74, lean: 0, feet: [6, -8], arm: [rr(r, 160, 178), 175], arm2: [rr(r, 150, 170), 170] }),                                                        // both arms up
  ];

  // Measurement marks. Each draws something sciency next to the figure.
  const NOTES = [
    (p, J, r) => p.dim([J.hip[0] - 62, GROUND], [J.hip[0] - 62, J.head[1] - 11], rr(r, 1.62, 2.06).toFixed(2) + " m", { side: 1 }),
    (p, J) => p.angleMark(J.kneeF, J.hip, J.ankF, 18),
    (p, J) => p.angleMark(J.el, J.sh, J.wr, 16),
    (p, J, r) => {
      const dn = S.Sketch.dir(170);
      p.arrow([J.wr[0] + 8, J.wr[1] - 4], [J.wr[0] + 54, J.wr[1] - 30 - dn[0] * 4]);
      p.text([J.wr[0] + 40, J.wr[1] - 38], "v = " + rr(r, 4.2, 8.9).toFixed(1) + " m/s", { size: 14 });
    },
    (p, J, r) => {
      const a = [J.wr[0] + 6, J.wr[1] - 6];
      p.curve([a, [a[0] + 30, a[1] - 34], [a[0] + 66, a[1] - 40], [a[0] + 100, a[1] - 14]], { stroke: MARK, w: 1.8, dotted: true });
      p.text([a[0] + 34, a[1] - 48], "θ = " + Math.round(rr(r, 38, 58)) + "°", { size: 14 });
    },
    (p, J, r) => p.ruler(24, 24 + 100, GROUND + 14, 10, "0 – " + rr(r, 0.8, 1.2).toFixed(1) + " m"),
    (p, J) => p.cross([J.hip[0], J.hip[1]], "CoM"),
    (p, J, r) => p.stopwatch([200, 48], "t = " + rr(r, 0.2, 0.9).toFixed(2) + " s"),
    (p, J, r) => { if (J.gy < GROUND - 8) p.dim([J.hip[0] + 62, GROUND], [J.hip[0] + 62, J.gy], "Δh " + Math.round((GROUND - J.gy) * 1.2) + " cm", { side: -1 }); else p.dim([J.hip[0] + 62, GROUND], [J.hip[0] + 62, J.hip[1]], "hip " + Math.round((GROUND - J.hip[1]) * 1.2) + " cm", { side: -1 }); },
  ];

  function buildDoodle(rnd) {
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 " + VW + " " + VH);
    svg.setAttribute("class", "sk-draw doodle-svg");
    svg.style.color = INK;
    const pen = S.Sketch.createPen(svg, { ink: INK, mark: MARK, jitter: 1.15 });
    const J = pen.figure(pick(rnd, POSES)(rnd));
    shuffle(rnd, NOTES.slice()).slice(0, 2 + Math.floor(rnd() * 2)).forEach((n) => n(pen, J, rnd));
    return svg;
  }

  // Place doodles on a jittered grid, leaving the middle (where the title sits) mostly clear.
  const rnd = Math.random;
  const cols = small ? 2 : 6, rows = small ? 3 : 2;
  const cells = [];
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
    if (!small && (c === 2 || c === 3)) continue;
    cells.push([c, r]);
  }
  shuffle(rnd, cells);
  const count = small ? 5 : 8;

  const items = [];
  cells.slice(0, count).forEach((cell, i) => {
    const wrap = document.createElement("div");
    wrap.className = "doodle";
    const wVw = small ? rr(rnd, 30, 40) : rr(rnd, 11, 16);
    const x = (cell[0] + rr(rnd, 0.0, 0.55)) / cols * 100;
    const y = (cell[1] + rr(rnd, 0.0, 0.45)) / rows * 92;
    wrap.style.cssText = "left:" + x.toFixed(1) + "%;top:" + y.toFixed(1) + "%;width:clamp(" + (small ? 110 : 130) + "px," + wVw.toFixed(1) + "vw," + (small ? 170 : 250) + "px)";
    const svg = buildDoodle(rnd);
    svg.style.setProperty("--d0", Math.round(rr(rnd, 0, 700)) + "ms");
    svg.style.setProperty("--r0", rr(rnd, -9, 9).toFixed(1) + "deg");
    svg.style.setProperty("--bob", rr(rnd, 6, 10).toFixed(1) + "s");
    svg.style.setProperty("--bobd", (-rr(rnd, 0, 8)).toFixed(1) + "s");
    wrap.appendChild(svg);
    layer.appendChild(wrap);
    items.push({
      el: wrap,
      side: x + 6 < 50 ? -1 : 1,        // which side of the screen it gets pushed towards
      depth: rr(rnd, 0.6, 1.5),          // nearer doodles travel further and faster
      k: rr(rnd, 0.06, 0.13),            // how quickly this one catches up with the scroll (inertia)
      s: 0,                              // its own smoothed scroll value
      spin: rr(rnd, 0.7, 1.3),
    });
  });

  if (reduce) return; // static drawing, no motion

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  let target = window.scrollY, raf = 0, last = 0;

  function apply(it) {
    const vh = window.innerHeight, vw = window.innerWidth;
    const p = clamp(it.s / (vh * 0.85), 0, 1.4);
    const e = p < 1 ? p * p * (3 - 2 * p) : 1 + (p - 1) * 0.9;  // eases in, then keeps going
    const x = it.side * e * (vw * 0.3 + 260 * it.depth);
    const y = -e * 150 * it.depth - it.s * 0.1 * it.depth;
    const rot = it.side * e * (24 + 20 * it.depth) * it.spin;
    const sc = 1 + e * 0.16 * it.depth;
    const fade = clamp((p - 0.3) / 0.6, 0, 1);
    it.el.style.transform = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px,0) rotate(" + rot.toFixed(2) + "deg) scale(" + sc.toFixed(3) + ")";
    it.el.style.opacity = (1 - fade * fade * (3 - 2 * fade)).toFixed(3);
  }

  function frame(now) {
    const dt = Math.min(48, now - (last || now)) / 16.67; last = now;
    let moving = false;
    items.forEach((it) => {
      const diff = target - it.s;
      if (Math.abs(diff) > 0.15) { it.s += diff * (1 - Math.pow(1 - it.k, dt)); moving = true; } else it.s = target;
      apply(it);
    });
    raf = moving ? requestAnimationFrame(frame) : 0;
    if (!moving) last = 0;
  }
  function kick() { target = window.scrollY; if (!raf) raf = requestAnimationFrame(frame); }

  window.addEventListener("scroll", kick, { passive: true });
  window.addEventListener("resize", kick);
  items.forEach(apply);
  kick();
})();
