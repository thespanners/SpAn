// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

// Scroll-reveal animations
document.documentElement.classList.add("js");
const revealEls = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealEls.forEach((el, i) => {
    el.style.transitionDelay = (i % 4) * 60 + "ms";
    io.observe(el);
  });
} else {
  revealEls.forEach((el) => el.classList.add("in"));
}

const form = document.getElementById("profile-form");
const errorBox = document.getElementById("form-error");
const summary = document.getElementById("summary");

function showSummary(p) {
  const ratio = (p.wingspan / p.height).toFixed(2);
  summary.hidden = false;
  summary.innerHTML =
    "<p><strong>Profile saved.</strong></p>" +
    "<p>Height: " + p.height + " cm &middot; Wingspan: " + p.wingspan + " cm</p>" +
    "<p>Weight: " + p.weight + " kg &middot; Vertical: " + p.vertical + " cm</p>" +
    "<p>Wingspan-to-height ratio: " + ratio + "</p>" +
    "<p>Next: we'll pair you with a sample basketball player (coming soon).</p>";
}

// Restore a saved profile if one exists
try {
  const saved = JSON.parse(localStorage.getItem("span-profile"));
  if (saved) {
    for (const key of Object.keys(saved)) {
      if (form.elements[key]) form.elements[key].value = saved[key];
    }
    showSummary(saved);
  }
} catch (e) { /* storage unavailable, ignore */ }

form.addEventListener("submit", (event) => {
  event.preventDefault();
  errorBox.hidden = true;

  const profile = {};
  for (const name of ["height", "wingspan", "weight", "vertical"]) {
    const input = form.elements[name];
    const value = parseFloat(input.value);
    if (Number.isNaN(value) || value < Number(input.min) || value > Number(input.max)) {
      errorBox.textContent =
        "Please enter a valid " + name + " between " + input.min + " and " + input.max + ".";
      errorBox.hidden = false;
      input.focus();
      return;
    }
    profile[name] = value;
  }

  try { localStorage.setItem("span-profile", JSON.stringify(profile)); } catch (e) {}
  showSummary(profile);
  summary.scrollIntoView({ behavior: "smooth", block: "center" });
});