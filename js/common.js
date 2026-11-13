/* Shared behaviour: footer year, scroll reveal, count-up numbers, page transitions, nav state. */
(function () {
  document.documentElement.classList.add("js");
  window.SpAn = window.SpAn || {};
  const S = window.SpAn;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // Count-up animation for a number element
  S.countUp = function (el, to, decimals) {
    decimals = decimals || 0;
    if (reduce) { el.textContent = to.toFixed(decimals); return; }
    const dur = 1100, t0 = performance.now();
    (function tick(now) {
      const p = Math.min((now - t0) / dur, 1);
      el.textContent = (to * (1 - Math.pow(1 - p, 4))).toFixed(decimals);
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  };

  // Scroll reveal + count-up (<span data-count="185" data-decimals="0">0</span>)
  const reveals = document.querySelectorAll(".reveal");
  const counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        io.unobserve(e.target);
      });
    }, { threshold: 0.15 });
    reveals.forEach((el) => {
      if (el.dataset.delay) el.style.transitionDelay = el.dataset.delay + "ms";
      io.observe(el);
    });

    const co = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        S.countUp(el, parseFloat(el.dataset.count), parseInt(el.dataset.decimals || "0", 10));
        co.unobserve(el);
      });
    }, { threshold: 0.4 });
    counters.forEach((el) => co.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("in"));
    counters.forEach((el) => { el.textContent = el.dataset.count; });
  }

  // Fade out before navigating to another page
  S.go = function (url) {
    document.body.classList.add("leaving");
    setTimeout(() => { window.location.href = url; }, 280);
  };

  // Launch page nav: returning members see "Dashboard" instead of "Sign up"
  const cta = document.getElementById("nav-cta");
  if (cta && S.Storage && S.Storage.getUser()) {
    cta.textContent = "Dashboard";
    cta.setAttribute("href", "dashboard.html");
  }
})();