/*
 * Training areas popup. Click (or press Enter on) any line of an ".areas-list" and a small
 * dialog opens with a fault-vs-target stickman drawing and coaching notes.
 * Works on both the launch page and the dashboard. The ranges are illustrative coaching
 * guidelines; the real comparison always uses the user's sample player.
 */
(function () {
  const S = window.SpAn;
  const Sk = S.Sketch;
  const NS = "http://www.w3.org/2000/svg";
  const INK = "#0a0a0a", MARK = "#e1380a";

  const W = 250, H = 250, GROUND = 232;

  /** Scene helpers. Each scene gets a seeded pen so the drawing is identical every time it opens. */
  const AREAS = [
    {
      title: "Arm position and elbow angle",
      summary: "A stable shooting arm sends the ball on a straight line to the rim. The model tracks your shoulder, elbow and wrist in every frame.",
      aim: ["Elbow at set: about 85–100°", "Ball over the elbow", "Forearm near vertical"],
      measures: ["Elbow angle through the shot", "Wrist height against the shoulder", "Elbow drift away from your body line"],
      watch: "Elbow flaring out (the “chicken wing”) or pushing the ball out from the chest.",
      drill: "One-hand shots close to the rim: elbow under the ball, 20 slow reps.",
      fault: { tag: "Pushed out", scene(p) {
        const J = p.figure({ x: 90, ground: GROUND, hipH: 72, feet: [8, -10], lean: 2, arm: [55, 100], arm2: [60, 95], ball: true });
        p.angleMark(J.el, J.sh, J.wr, 17);
        p.text([150, 70], "too open", { size: 17 });
        p.arrow([156, 78], [J.el[0] + 14, J.el[1] - 8]);
      } },
      target: { tag: "Stacked", scene(p) {
        const J = p.figure({ x: 90, ground: GROUND, hipH: 72, feet: [8, -10], lean: 2, arm: [80, 170], arm2: [75, 160], ball: true });
        p.angleMark(J.el, J.sh, J.wr, 17, null, { flip: true });
        p.line([J.el[0], J.el[1] + 4], [J.el[0] + 4, J.el[1] - 78], { stroke: MARK, w: 1.6, dotted: true });
        p.text([J.el[0] + 14, J.el[1] + 48], "ball over elbow", { size: 16 });
      } },
    },
    {
      title: "Knee bend and leg extension",
      summary: "Your legs make the power so your arm does not have to. The model watches how deep you load and how fully you extend.",
      aim: ["Knee bend at load: about 110–130°", "Full extension at release (170°+)"],
      measures: ["Knee angle from load to release", "How far your hips drop and rise", "Both knees moving together"],
      watch: "Stiff legs that leave the arm doing all the work, or a squat so deep it breaks your rhythm.",
      drill: "Form shooting from close range: load the legs, drive up, finish on your toes.",
      fault: { tag: "Stiff legs", scene(p) {
        const J = p.figure({ x: 90, ground: GROUND, hipH: 75, feet: [6, -8], lean: 1, arm: [80, 170], arm2: [75, 160], ball: true });
        p.angleMark(J.kneeF, J.hip, J.ankF, 20);
        p.text([150, 175], "no drive", { size: 17 });
      } },
      target: { tag: "Loaded", scene(p) {
        const J = p.figure({ x: 84, ground: GROUND, hipH: 62, feet: [14, -12], lean: 8, arm: [80, 170], arm2: [75, 160], ball: true });
        p.angleMark(J.kneeF, J.hip, J.ankF, 20);
        p.arrow([J.hip[0] + 64, J.hip[1] + 24], [J.hip[0] + 64, J.hip[1] - 20]);
        p.text([J.hip[0] + 74, J.hip[1] + 8], "drive up", { size: 16 });
      } },
    },
    {
      title: "Body alignment",
      summary: "Head, shoulders, hips and feet stacked on one line make every shot repeatable. The model measures how far your body leans from that line.",
      aim: ["Lean under 3–4°", "Shoulders square to the rim", "Feet about shoulder width"],
      measures: ["Lean of your head over your ankles", "Shoulder and hip angle", "Width of your base"],
      watch: "Fading back or drifting forward as you release.",
      drill: "Shoot from a spot marked on the floor and land on the same mark.",
      fault: { tag: "Leaning back", scene(p) {
        const J = p.figure({ x: 96, ground: GROUND, hipH: 72, feet: [8, -10], lean: -14, arm: [80, 170], arm2: [75, 160], ball: true });
        p.line([J.hip[0], J.hip[1] + 60], [J.hip[0], J.hip[1] - 100], { stroke: MARK, w: 1.6, dotted: true });
        const deg = p.angleMark(J.hip, J.sh, [J.hip[0], J.hip[1] - 60], 34, false);
        p.text([J.hip[0] - 78, J.hip[1] - 62], "lean " + Math.round(deg) + "\u00b0", { size: 17 });
      } },
      target: { tag: "Stacked", scene(p) {
        const J = p.figure({ x: 90, ground: GROUND, hipH: 72, feet: [8, -10], lean: 1.5, arm: [80, 170], arm2: [75, 160], ball: true });
        p.line([J.hip[0], J.hip[1] + 60], [J.hip[0] + 3, J.hip[1] - 104], { stroke: MARK, w: 1.6, dotted: true });
        const deg = p.angleMark(J.hip, J.sh, [J.hip[0], J.hip[1] - 60], 34, false);
        p.text([J.hip[0] - 78, J.hip[1] - 62], "lean " + Math.round(deg) + "\u00b0", { size: 17 });
        p.text([J.hip[0] + 46, J.hip[1] + 58], "head-hip-feet", { size: 15 });
      } },
    },
    {
      title: "Jump height and release timing",
      summary: "How high you jump matters less than when you let go. The ball should leave your hand at the top of your jump.",
      aim: ["Release at the apex", "Same jump height shot to shot"],
      measures: ["Jump height from hip travel", "Frame of release against the apex", "Where you land"],
      watch: "Releasing on the way up or on the way down. Both change the arc.",
      drill: "Say “up, top, release”. Pause a beat at the top on slow reps.",
      fault: { tag: "Still rising", scene(p) {
        const J = p.figure({ x: 90, ground: GROUND, hipH: 72, lift: 12, feet: [6, -6], lean: 2, arm: [150, 168], arm2: [140, 160], ball: true });
        p.dim([32, GROUND], [32, J.gy], null);
        p.text([22, J.gy - 12], "≈ " + Math.round(12 * 1.2) + " cm", { size: 15 });
        p.arrow([196, 120], [196, 80]);
        p.text([134, 148], "still rising", { size: 17 });
        p.text([134, 166], "(released early)", { size: 14 });
      } },
      target: { tag: "At the top", scene(p) {
        const J = p.figure({ x: 90, ground: GROUND, hipH: 72, lift: 36, feet: [6, -6], lean: 2, arm: [150, 168], arm2: [140, 160], ball: true });
        p.dim([32, GROUND], [32, J.gy], null);
        p.text([22, J.gy - 12], "≈ " + Math.round(36 * 1.2) + " cm", { size: 15 });
        p.cross([J.ball[0] + 30, J.ball[1] + 2]);
        p.text([J.ball[0] + 42, J.ball[1] + 8], "apex", { size: 17 });
      } },
    },
    {
      title: "Follow-through",
      summary: "What your hand does after the ball leaves shows how you shot it. The model measures your arm angle and how long you hold the finish.",
      aim: ["Arm extended (elbow 160°+)", "Wrist flicked, fingers down at the rim", "Hold until the ball lands"],
      measures: ["Arm angle after release", "Wrist flick", "How long the finish is held"],
      watch: "Dropping the arm early or stopping the motion short.",
      drill: "Freeze your finish on every rep like a photo, until the ball lands.",
      fault: { tag: "Arm drops", scene(p) {
        const J = p.figure({ x: 90, ground: GROUND, hipH: 72, feet: [8, -10], lean: 2, arm: [105, 110], arm2: [20, 10], ball: false });
        p.line(J.sh, [J.sh[0] + 78, J.sh[1]], { stroke: MARK, w: 1.6, dotted: true });
        p.angleMark(J.sh, [J.sh[0] + 70, J.sh[1]], J.wr, 44);
        p.text([150, 84], "dropped", { size: 17 });
      } },
      target: { tag: "Held", scene(p) {
        const J = p.figure({ x: 90, ground: GROUND, hipH: 72, feet: [8, -10], lean: 3, arm: [150, 160], arm2: [20, 10], ball: false, flick: 38 });
        p.line(J.sh, [J.sh[0] + 78, J.sh[1]], { stroke: MARK, w: 1.6, dotted: true });
        p.angleMark(J.sh, [J.sh[0] + 70, J.sh[1]], J.wr, 44);
        p.curve([[J.wr[0] + 12, J.wr[1] - 6], [J.wr[0] + 38, J.wr[1] - 30], [J.wr[0] + 70, J.wr[1] - 30], [J.wr[0] + 96, J.wr[1] - 6]], { stroke: MARK, w: 1.8, dotted: true });
        p.text([J.sh[0] + 40, J.sh[1] + 44], "hold it", { size: 17 });
      } },
    },
  ];

  function draw(variant, seedBase) {
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 -14 " + W + " " + (H + 14));
    svg.setAttribute("role", "img");
    svg.setAttribute("class", "sk-draw");
    svg.style.color = INK;
    const pen = Sk.createPen(svg, { seed: seedBase, ink: INK, mark: MARK, jitter: 0.9 });
    pen.ground(14, W - 14, GROUND);
    variant.scene(pen);
    return svg;
  }

  // ----- Dialog -----
  const dlg = document.createElement("dialog");
  dlg.className = "modal theme-light";
  dlg.setAttribute("aria-labelledby", "modal-title");
  document.body.appendChild(dlg);
  let index = 0, lastFocus = null;

  function figure(kind, label, variant, seed) {
    const fig = document.createElement("figure");
    fig.className = "fig " + kind;
    fig.appendChild(draw(variant, seed));
    const cap = document.createElement("figcaption");
    cap.innerHTML = (kind === "fault" ? "✕ " : "✓ ") + label + "<span></span>";
    cap.lastChild.textContent = variant.tag;
    fig.appendChild(cap);
    fig.firstChild.setAttribute("aria-label", label + ": " + variant.tag);
    return fig;
  }

  function li(arr) { return arr.map((t) => "<li>" + t + "</li>").join(""); }

  function render(i) {
    index = (i + AREAS.length) % AREAS.length;
    const a = AREAS[index];
    const n = String(index + 1).padStart(2, "0");
    dlg.innerHTML =
      '<div class="modal-body">' +
        '<div class="modal-top">' +
          '<span class="modal-num" aria-hidden="true">' + n + "</span>" +
          '<h2 class="modal-title" id="modal-title"></h2>' +
          '<button class="modal-x" type="button" aria-label="Close">✕</button>' +
        "</div>" +
        '<p class="modal-sum"></p>' +
        '<div class="fig-pair"></div>' +
        '<ul class="aim" aria-label="Aim for"></ul>' +
        '<div class="info">' +
          '<div><h3>The model measures</h3><ul class="measures"></ul></div>' +
          '<div><h3>Watch out for</h3><p class="watch"></p></div>' +
          '<div><h3>Try this drill</h3><p class="drill"></p></div>' +
        "</div>" +
        '<div class="modal-foot">' +
          "<small>Ranges are typical coaching guidelines. Your real comparison uses your sample player’s numbers.</small>" +
          '<div class="modal-nav"><button type="button" data-step="-1">← Prev</button><button type="button" data-step="1">Next →</button></div>' +
        "</div>" +
      "</div>";
    dlg.querySelector(".modal-title").textContent = a.title;
    dlg.querySelector(".modal-sum").textContent = a.summary;
    dlg.querySelector(".aim").innerHTML = li(a.aim);
    dlg.querySelector(".measures").innerHTML = li(a.measures);
    dlg.querySelector(".watch").textContent = a.watch;
    dlg.querySelector(".drill").textContent = a.drill;
    const pair = dlg.querySelector(".fig-pair");
    pair.appendChild(figure("fault", "Common fault", a.fault, 100 + index * 2));
    pair.appendChild(figure("target", "Target", a.target, 101 + index * 2));
    dlg.scrollTop = 0;
  }

  function open(i, trigger) {
    lastFocus = trigger || document.activeElement;
    render(i);
    if (!dlg.open) dlg.showModal();
    document.body.classList.add("modal-open");
    const x = dlg.querySelector(".modal-x");
    if (x) x.focus({ preventScroll: true });
  }

  function close() {
    if (!dlg.open || dlg.classList.contains("closing")) return;
    dlg.classList.add("closing");
    setTimeout(() => {
      dlg.close();
      dlg.classList.remove("closing");
      document.body.classList.remove("modal-open");
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }, 190);
  }

  dlg.addEventListener("cancel", (e) => { e.preventDefault(); close(); });             // Esc
  dlg.addEventListener("click", (e) => {
    if (e.target === dlg) return close();                                               // backdrop
    if (e.target.closest(".modal-x")) return close();
    const step = e.target.closest("[data-step]");
    if (step) render(index + Number(step.dataset.step));
  });
  dlg.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") render(index + 1);
    if (e.key === "ArrowLeft") render(index - 1);
  });

  // ----- Wire up the list lines (index and dashboard share the same class) -----
  document.querySelectorAll(".areas-list li").forEach((li, i) => {
    if (!AREAS[i]) return;
    li.setAttribute("role", "button");
    li.setAttribute("tabindex", "0");
    li.setAttribute("aria-haspopup", "dialog");
    li.setAttribute("aria-label", AREAS[i].title + ", show details");
    if (!li.querySelector(".go")) {
      const go = document.createElement("span");
      go.className = "go"; go.setAttribute("aria-hidden", "true"); go.textContent = "+";
      li.appendChild(go);
    }
    li.addEventListener("click", () => open(i, li));
    li.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(i, li); }
    });
  });

  S.Areas = { open: open };
})();
