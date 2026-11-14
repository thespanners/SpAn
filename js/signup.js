/* Join flow: email -> (known email: log in) or (new email: name + stats -> sign up) -> dashboard. */
(function () {
  const S = window.SpAn;

  // Already logged in? Go straight to the dashboard.
  if (S.Storage.getUser()) { window.location.replace("dashboard.html"); return; }

  const form = document.getElementById("signup-form");
  const steps = { 1: document.getElementById("step-1"), 2: document.getElementById("step-2"), done: document.getElementById("step-done") };
  const bar = document.getElementById("progress-bar");
  const err1 = document.getElementById("error-1");
  const err2 = document.getElementById("error-2");
  const who = document.getElementById("who");
  const doneTitle = document.getElementById("done-title");
  const doneSub = document.getElementById("done-sub");
  const sideCopy = document.querySelector(".side-copy");
  const sideTitle = document.getElementById("side-title");
  const sideSub = document.getElementById("side-sub");
  const sideFigure = document.getElementById("side-figure");
  let current = 1;

  const COPY = {
    1: ["Join the squad.", "Enter your email. New here? We'll set you up. Been here before? We'll log you straight in."],
    2: ["Now, how are you built?", "Your height, wingspan, weight and jump decide who you're paired with."],
    back: ["Welcome back.", "Loading your profile."],
    done: ["Welcome to SpAn.", "Your sample player is on its way."],
  };

  // ----- Live figure on the dark side -----
  const figure = S.Pose.createFigure(sideFigure, { labels: false });
  S.Pose.loop((t) => figure.update(S.Pose.poseAt(t)), 7000);

  // The figure scales with the height you type
  function scaleFigure() {
    const h = parseFloat(form.elements.height.value);
    let k = 1;
    if (h > 0) k = 0.8 + (Math.max(150, Math.min(220, h)) - 150) / 70 * 0.28;
    sideFigure.style.transform = "scale(" + k.toFixed(3) + ")";
  }

  function setCopy(key) {
    sideCopy.classList.add("swap");
    setTimeout(() => {
      sideTitle.textContent = COPY[key][0];
      sideSub.textContent = COPY[key][1];
      sideCopy.classList.remove("swap");
    }, 220);
  }

  function show(step, copyKey) {
    Object.keys(steps).forEach((k) => { steps[k].hidden = String(k) !== String(step); });
    const changed = step !== current;
    current = step;
    bar.style.width = step === 1 ? "50%" : "100%";
    if (changed) setCopy(copyKey || step);
    const first = steps[step].querySelector("input");
    if (first && changed) first.focus({ preventScroll: true });
  }

  function flag(input, message, box) {
    input.classList.add("invalid");
    box.textContent = message;
    input.focus();
    input.addEventListener("input", () => input.classList.remove("invalid"), { once: true });
  }

  // Clear messages as the user types
  form.addEventListener("input", () => { err1.textContent = ""; err2.textContent = ""; });

  // Live wingspan-to-height ratio
  const ratio = document.getElementById("ratio");
  const ratioValue = document.getElementById("ratio-value");
  const ratioDot = document.getElementById("ratio-dot");
  function updateRatio() {
    const h = parseFloat(form.elements.height.value), w = parseFloat(form.elements.wingspan.value);
    if (h > 0 && w > 0) {
      const r = w / h;
      ratioValue.textContent = r.toFixed(2);
      const pos = Math.max(0, Math.min(1, (r - 0.95) / 0.2)); // map 0.95 to 1.15 across the track
      ratioDot.style.left = (pos * 100) + "%";
      ratio.classList.add("live");
    } else {
      ratioValue.textContent = "–";
      ratio.classList.remove("live");
    }
  }
  form.elements.height.addEventListener("input", () => { updateRatio(); scaleFigure(); });
  form.elements.wingspan.addEventListener("input", updateRatio);

  document.getElementById("back").addEventListener("click", () => show(1));

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    // Step 1: email. A known email logs in; a new one continues to the sign-up step.
    if (current === 1) {
      const email = form.elements.email;
      const value = email.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return flag(email, "Please enter a valid email address.", err1);

      const existing = S.Storage.findByEmail(value);
      if (existing) {
        if (!S.Storage.signIn(value)) {
          err1.textContent = "Couldn't log you in. Check that your browser allows site storage.";
          return;
        }
        const first = (existing.name || "").split(" ")[0];
        doneTitle.textContent = first ? "Welcome back, " + first + "." : "Welcome back.";
        doneSub.textContent = "Loading your profile…";
        show("done", "back");
        setTimeout(() => S.go("dashboard.html"), 1300);
        return;
      }

      who.textContent = value;
      return show(2);
    }

    // Step 2: name + stats, creates the profile.
    if (current === 2) {
      const name = form.elements.name;
      if (!name.value.trim()) return flag(name, "Please enter your name.", err2);

      const stats = {};
      const labels = { height: "height", wingspan: "wingspan", weight: "weight", vertical: "vertical jump" };
      for (const key of Object.keys(labels)) {
        const input = form.elements[key];
        const value = parseFloat(input.value);
        if (Number.isNaN(value) || value < Number(input.min) || value > Number(input.max)) {
          return flag(input, "Enter a " + labels[key] + " between " + input.min + " and " + input.max + ".", err2);
        }
        stats[key] = value;
      }

      const user = Object.assign({
        name: name.value.trim(),
        email: form.elements.email.value.trim(),
        joined: new Date().toISOString(),
      }, stats);

      if (!S.Storage.saveUser(user)) {
        err2.textContent = "Couldn't save your profile. Check that your browser allows site storage.";
        return;
      }
      doneTitle.textContent = "You're in.";
      doneSub.textContent = "Finding your sample player…";
      show("done");
      setTimeout(() => S.go("dashboard.html"), 1600);
    }
  });

  form.elements.email.focus({ preventScroll: true });
})();
