/* Dashboard: profile, pairing, comparison, tips and the scrubbable form viewer. */
(function () {
  const S = window.SpAn;
  const user = S.Storage.getUser();

  // Not logged in? Send them to the join page.
  if (!user) { window.location.replace("signup.html"); return; }

  const $ = (id) => document.getElementById(id);
  const first = (user.name || "there").split(" ")[0];

  // ----- Match -----
  const match = S.Players.findMatch(user);
  const player = match.player;

  $("welcome").textContent = "Welcome, " + first + ".";
  $("welcome-sub").textContent = "You're paired with " + player.name + ", a sample player with a build like yours.";

  // ----- Profile -----
  const decimals = (v) => (Number.isInteger(v) ? 0 : 1);
  ["height", "wingspan", "weight", "vertical"].forEach((k) => S.countUp($("s-" + k), user[k], decimals(user[k])));
  const ratio = user.wingspan / user.height;
  $("s-ratio").textContent = ratio.toFixed(2);

  // ----- Match card -----
  const initials = player.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  $("m-avatar").textContent = initials;
  $("m-name").textContent = player.name;
  $("m-source").textContent = player.source;
  $("m-build").textContent = player.height + " cm · " + player.wingspan + " cm span";
  S.countUp($("m-score"), match.score, 0);
  requestAnimationFrame(() => {
    $("ring-fg").style.strokeDashoffset = String(163.4 * (1 - match.score / 100));
  });

  // ----- Comparison -----
  $("cmp-name").textContent = player.name.split(" ")[0];
  $("cmp-legend-name").textContent = player.name;
  $("clip-name").textContent = player.name;
  const rows = [
    { key: "height", label: "Height", unit: "cm" },
    { key: "wingspan", label: "Wingspan", unit: "cm" },
    { key: "weight", label: "Weight", unit: "kg" },
    { key: "vertical", label: "Vertical", unit: "cm" },
  ];
  const cmp = $("cmp");
  rows.forEach((r) => {
    const max = Math.max(user[r.key], player[r.key]) * 1.08;
    const row = document.createElement("div");
    row.className = "cmp-row";
    row.innerHTML =
      '<div class="cmp-top"><span>' + r.label + '</span><span class="vals"><b>' + user[r.key] + '</b><span>' + player[r.key] + " " + r.unit + "</span></span></div>" +
      '<div class="bar you"><i data-w="' + (user[r.key] / max * 100).toFixed(1) + '"></i></div>' +
      '<div class="bar them"><i data-w="' + (player[r.key] / max * 100).toFixed(1) + '"></i></div>';
    cmp.appendChild(row);
  });
  // Animate bars in after the first paint
  setTimeout(() => {
    cmp.querySelectorAll("i[data-w]").forEach((i) => { i.style.width = i.dataset.w + "%"; });
  }, 350);

  // ----- Starter tips (simple rules from your stats; not the trained model) -----
  const tips = [];
  if (ratio >= 1.04) tips.push("Your wingspan is long for your height. Aim for a higher release point to use that reach.");
  else if (ratio <= 0.99) tips.push("Your reach is compact for your height. A quick release from a tight shooting pocket should suit you.");
  else tips.push("Your proportions are balanced, so a classic one-motion shot should feel natural.");

  const vDiff = user.vertical - player.vertical;
  if (vDiff >= 5) tips.push("You jump higher than " + player.name.split(" ")[0] + ". Release at the top of your jump to keep your timing consistent.");
  else if (vDiff <= -5) tips.push(player.name.split(" ")[0] + " gets more lift than you. Focus on smooth leg drive rather than a high jump.");
  else tips.push("Your jump is close to " + player.name.split(" ")[0] + "'s, so you can copy their release timing closely.");

  tips.push("Scrub the shooting form, then compare your own elbow and knee angles once training is live.");
  const tipList = $("tips");
  tips.forEach((t) => { const li = document.createElement("li"); li.textContent = t; tipList.appendChild(li); });

  // ----- Form viewer -----
  const figure = S.Pose.createFigure($("figure"));
  const scrub = $("scrub");
  const hint = $("scrub-hint");
  let stopLoop = null;

  function render(t) {
    const pose = S.Pose.poseAt(t);
    const out = figure.update(pose);
    $("f-phase").textContent = out.phase;
    $("r-elbow").textContent = Math.round(out.elbow) + "°";
    $("r-knee").textContent = Math.round(out.knee) + "°";
    scrub.style.setProperty("--p", (t * 100) + "%");
  }

  // Auto-play until the user takes over
  stopLoop = S.Pose.loop(function (t) {
    scrub.value = String(Math.round(t * 100));
    render(t);
  }, 7000);

  function takeOver() {
    if (stopLoop) { stopLoop(); stopLoop = null; }
    hint.classList.add("gone");
  }
  scrub.addEventListener("pointerdown", takeOver);
  scrub.addEventListener("keydown", takeOver);
  scrub.addEventListener("input", () => { takeOver(); render(Number(scrub.value) / 100); });

  // ----- Sign out -----
  $("signout").addEventListener("click", () => {
    S.Storage.signOut();
    S.go("index.html");
  });
})();
