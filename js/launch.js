/* Launch page: live stage, film preview, scroll-linked stage scale, and the scroll-highlighted areas list. */
(function () {
  const S = window.SpAn;
  const $ = (id) => document.getElementById(id);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ----- Live stage -----
  const figure = S.Pose.createFigure($("hero-figure"), { labels: false });
  const phases = document.querySelectorAll("#hero-phases li");
  let last = -1;

  // Preview of the (coming soon) video analysis: same skeleton, drawn like a tracked clip
  const filmSvg = $("film-figure");
  const film = filmSvg ? S.Pose.createFigure(filmSvg, { labels: false }) : null;

  S.Pose.loop(function (t) {
    const pose = S.Pose.poseAt(t);
    const out = figure.update(pose);
    const tilt = S.Pose.tilt(pose);

    $("m-elbow").textContent = Math.round(out.elbow) + "°";
    $("m-knee").textContent = Math.round(out.knee) + "°";
    $("m-align").textContent = tilt.toFixed(1) + "°";
    $("m-phase").textContent = out.phase;
    $("mt-elbow").style.width = (out.elbow / 180 * 100) + "%";
    $("mt-knee").style.width = (out.knee / 180 * 100) + "%";
    $("mt-align").style.width = Math.min(100, tilt / 8 * 100) + "%";
    $("mt-phase").style.width = (t * 100) + "%";

    if (film) {
      const o2 = film.update(pose);
      $("f-elbow").textContent = Math.round(o2.elbow) + "°";
      $("f-knee").textContent = Math.round(o2.knee) + "°";
    }

    const idx = Math.round(t * (phases.length - 1));
    if (idx !== last) {
      phases.forEach((li, i) => li.classList.toggle("on", i === idx));
      last = idx;
    }
  }, 7000);

  // ----- Stage grows as it scrolls into view -----
  const stage = $("stage");
  if (!reduce) {
    let ticking = false;
    const update = () => {
      const r = stage.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (window.innerHeight - r.top) / (window.innerHeight * 0.75)));
      stage.style.setProperty("--s", (0.92 + 0.08 * p).toFixed(3));
      ticking = false;
    };
    window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener("resize", update);
    update();
  } else {
    stage.style.setProperty("--s", "1");
  }

  // ----- Areas list: highlight the row nearest the middle of the screen, or the one hovered -----
  const items = Array.from(document.querySelectorAll("#areas li"));
  function activate(target) { items.forEach((li) => li.classList.toggle("active", li === target)); }

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) activate(e.target); });
    }, { rootMargin: "-42% 0px -42% 0px" });
    items.forEach((li) => io.observe(li));
  } else {
    items.forEach((li) => li.classList.add("active"));
  }
  items.forEach((li) => li.addEventListener("mouseenter", () => activate(li)));
})();