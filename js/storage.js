/*
 * Storage layer. Everything that reads or writes user data goes through here,
 * so swapping localStorage for a real backend later means editing only this file.
 *
 * Two things are stored in the visitor's browser (localStorage):
 *   span-users    { "<email>": { name, email, height, ... } }   every profile created on this browser
 *   span-session  "<email>"                                      who is currently logged in
 *
 * NOTE: localStorage lives in the visitor's own browser. Profiles survive reloads and
 * return visits on the same browser, but they are not shared between devices and there
 * is no password. It is a prototype, not a real account system (see README).
 */
(function () {
  const USERS_KEY = "span-users";
  const SESSION_KEY = "span-session";
  const LEGACY_KEY = "span-user"; // the old single-user format

  const norm = (email) => String(email || "").trim().toLowerCase();

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch (e) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
  }

  function users() {
    const u = read(USERS_KEY, {});
    return u && typeof u === "object" && !Array.isArray(u) ? u : {};
  }

  // One-off migration: a profile saved by the old version becomes the first registry entry
  // and the current session, so existing visitors stay logged in.
  (function migrate() {
    const legacy = read(LEGACY_KEY, null);
    if (!legacy || !legacy.email) return;
    const all = users();
    const key = norm(legacy.email);
    if (!all[key]) { all[key] = legacy; write(USERS_KEY, all); }
    if (!read(SESSION_KEY, null)) write(SESSION_KEY, key);
    try { localStorage.removeItem(LEGACY_KEY); } catch (e) {}
  })();

  const Storage = {
    /** Profile for an email, or null if nobody has joined with it. */
    findByEmail(email) {
      return users()[norm(email)] || null;
    },
    /** The logged-in user, or null. */
    getUser() {
      const email = read(SESSION_KEY, null);
      return email ? users()[email] || null : null;
    },
    /** Log in as an existing member. Returns the profile, or null if the email is unknown. */
    signIn(email) {
      const user = this.findByEmail(email);
      if (!user) return null;
      return write(SESSION_KEY, norm(user.email)) ? user : null;
    },
    /** Create (or update) a profile and log in as it. */
    saveUser(user) {
      const all = users();
      const key = norm(user.email);
      all[key] = user;
      return write(USERS_KEY, all) && write(SESSION_KEY, key);
    },
    /** Log out. The profile stays saved, so the same email can log back in. */
    signOut() {
      try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
    },
  };

  window.SpAn = window.SpAn || {};
  window.SpAn.Storage = Storage;
})();
