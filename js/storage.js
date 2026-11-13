/*
 * Storage layer. Everything that reads or writes user data goes through here,
 * so swapping localStorage for a real backend later means editing only this file.
 *
 * NOTE: localStorage lives in the visitor's own browser. It is fine for a prototype,
 * but it is not a real account system (see README).
 */
(function () {
  const KEY = "span-user";

  const Storage = {
    getUser() {
      try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; }
    },
    saveUser(user) {
      try { localStorage.setItem(KEY, JSON.stringify(user)); return true; } catch (e) { return false; }
    },
    clear() {
      try { localStorage.removeItem(KEY); } catch (e) {}
    },
  };

  window.SpAn = window.SpAn || {};
  window.SpAn.Storage = Storage;
})();
