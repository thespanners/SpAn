/*
 * Sample players + pairing logic.
 * These are fictional placeholder entries. Replace with real data (or an API call) later.
 * source: "PE Society" | "Basketball Squad" | "Professional"
 */
(function () {
  const PLAYERS = [
    { id: "pe-01",  name: "p1",     source: "PE Society",       height: 172, wingspan: 176, weight: 64, vertical: 52 },
    { id: "pe-02",  name: "p2",    source: "PE Society",       height: 165, wingspan: 168, weight: 58, vertical: 48 },
    { id: "sq-01",  name: "s1",      source: "Basketball Squad", height: 181, wingspan: 186, weight: 74, vertical: 61 },
    { id: "sq-02",  name: "s2",      source: "Basketball Squad", height: 188, wingspan: 195, weight: 82, vertical: 68 },
    { id: "pro-01", name: "pr1",  source: "Professional",     height: 193, wingspan: 202, weight: 88, vertical: 74 },
    { id: "pro-02", name: "pr2",   source: "Professional",     height: 201, wingspan: 211, weight: 97, vertical: 79 },
    { id: "pro-03", name: "pr3",      source: "Professional",     height: 178, wingspan: 183, weight: 72, vertical: 70 },
  ];

  // Typical spread of each stat, used so no single unit dominates the distance.
  const SCALE = { height: 12, wingspan: 14, weight: 12, vertical: 10 };
  const KEYS = Object.keys(SCALE);

  function distance(user, player) {
    let sum = 0;
    KEYS.forEach((k) => { const d = (user[k] - player[k]) / SCALE[k]; sum += d * d; });
    return Math.sqrt(sum);
  }

  /** Closest sample player to the user, with a 0-100 match score. */
  function findMatch(user) {
    let best = null, bestD = Infinity;
    PLAYERS.forEach((p) => { const d = distance(user, p); if (d < bestD) { bestD = d; best = p; } });
    return { player: best, score: Math.round(100 * Math.exp(-bestD / 2)) };
  }

  window.SpAn = window.SpAn || {};
  window.SpAn.Players = { all: PLAYERS, findMatch: findMatch, KEYS: KEYS };
})();
