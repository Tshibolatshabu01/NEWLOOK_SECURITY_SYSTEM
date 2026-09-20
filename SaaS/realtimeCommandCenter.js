/* NEWLOOK V13.1 Enterprise Realtime Command Center
 * Non-invasive orchestration layer. Existing module listeners remain authoritative.
 * Adds missing realtime coverage for registry/control sections and a universal
 * clickable Refresh + realtime status command without replacing business logic.
 */
import { auth, companyCollection, getCompanyId } from "../Js/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { onSnapshot } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

(() => {
  "use strict";
  const page = location.pathname.split("/").pop().toLowerCase();
  const unsubs = [];
  const refreshers = new Map();
  let active = false;
  let refreshTimer = null;
  let statusEl = null;

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const setStatus = (text, ok = true) => {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.classList.toggle("is-error", !ok);
    statusEl.classList.toggle("is-live", ok);
  };

  function register(section, fn) { if (typeof fn === "function") refreshers.set(section, fn); }

  function currentSection() {
    if (page === "superadmin.html") return document.querySelector("[data-v].active")?.dataset.v || "overview";
    return document.querySelector(".page.active-page")?.id || document.querySelector(".menu li.active")?.dataset.section || "dashboard";
  }

  async function refreshCurrentSection() {
    const section = currentSection();
    const fn = refreshers.get(section) || refreshers.get("*");
    if (!fn) { location.reload(); return; }
    try {
      setStatus("Refreshing…", true);
      await fn();
      setStatus("Realtime connected", true);
      window.NEWLOOK_LAST_MANUAL_REFRESH = new Date().toISOString();
    } catch (e) {
      console.error("NEWLOOK refresh", e);
      setStatus("Refresh failed", false);
      window.NEWLOOK_REALTIME_ERROR = e?.message || String(e);
    }
  }

  function addCommandBar() {
    if (document.getElementById("newlook-realtime-command-bar")) return;
    const host = document.querySelector("main > header") || document.querySelector("header");
    if (!host) return;
    const bar = document.createElement("div");
    bar.id = "newlook-realtime-command-bar";
    bar.className = "newlook-realtime-command-bar";
    bar.innerHTML = `<span id="newlook-realtime-status" class="newlook-realtime-status is-live"><span class="newlook-live-dot"></span>Realtime connected</span><button type="button" class="action-btn action-btn-teal" id="newlook-refresh-current"><i class="fas fa-rotate"></i><span>Refresh</span></button>`;
    host.appendChild(bar);
    statusEl = bar.querySelector("#newlook-realtime-status");
    bar.querySelector("#newlook-refresh-current").addEventListener("click", refreshCurrentSection);
  }

  function watch(name, label, onChange) {
    let ref;
    try { ref = companyCollection(name); } catch { return; }
    const unsub = onSnapshot(ref, snap => {
      window.NEWLOOK_REALTIME = { collection: name, label, count: snap.size, at: new Date().toISOString() };
      setStatus("Realtime connected", true);
      if (onChange) onChange(snap);
      else {
        const fn = refreshers.get(label) || refreshers.get("*");
        if (fn) fn().catch(e => console.error(`Realtime ${label}`, e));
      }
      document.dispatchEvent(new CustomEvent("newlook:realtime", { detail: { collection: name, label, count: snap.size } }));
    }, err => {
      console.error(`NEWLOOK realtime ${name}`, err);
      setStatus("Realtime error", false);
      window.NEWLOOK_REALTIME_ERROR = err?.message || String(err);
    });
    unsubs.push(unsub);
  }

  function stop() { unsubs.splice(0).forEach(fn => { try { fn(); } catch {} }); active = false; if (refreshTimer) clearInterval(refreshTimer); refreshTimer = null; }

  async function start(user) {
    if (active || !user || !getCompanyId()) return;
    active = true;
    addCommandBar();

    if (page === "admin.html") {
      register("dashboard", async () => window.enhanceDashboard?.());
      register("guards", async () => window.loadGuards?.(document.getElementById("searchGuard")?.value || "", document.getElementById("filterStatus")?.value || ""));
      register("sites", async () => window.loadSites?.(document.getElementById("searchSite")?.value || ""));
      register("checkpoints", async () => window.loadCheckpoints?.());
      register("shifts", async () => window.loadShifts?.(document.getElementById("searchShift")?.value || ""));
      register("devices", async () => window.NEWLOOK_CUSTOMER_TOOLS?.loadDevices?.());
      register("notifications", async () => window.NEWLOOK_CUSTOMER_TOOLS?.loadNotifications?.());
      register("support", async () => window.NEWLOOK_CUSTOMER_TOOLS?.loadTickets?.());
      register("users", async () => window.NEWLOOK_ENTERPRISE_CONTROL?.renderUsers?.());
      register("operations", async () => window.NEWLOOK_ENTERPRISE_CONTROL?.renderOperations?.());
      register("documents", async () => window.NEWLOOK_ENTERPRISE_CONTROL?.renderDocuments?.());
      watch("guards", "guards", () => refreshers.get("guards")?.());
      watch("sites", "sites", () => refreshers.get("sites")?.());
      watch("checkpoints", "checkpoints", () => refreshers.get("checkpoints")?.());
      watch("shifts", "shifts", () => refreshers.get("shifts")?.());
      watch("devices", "devices", () => refreshers.get("devices")?.());
      watch("notifications", "notifications", () => refreshers.get("notifications")?.());
      watch("supportTickets", "support", () => refreshers.get("support")?.());
    } else if (page === "attendance.html") {
      register("*", async () => {
        if (typeof window.loadGuardsCache === "function") { window.NEWLOOK_ATTENDANCE_GUARDS_DIRTY = true; }
      });
      watch("guards", "guards", () => { window.NEWLOOK_ATTENDANCE_GUARDS_DIRTY = true; document.dispatchEvent(new CustomEvent("newlook:attendance-guards-changed")); });
      watch("attendance", "attendance");
      watch("attendanceRecords", "attendanceRecords");
      watch("shifts", "shifts");
    } else if (page === "guard.html") {
      watch("guards", "guards");
      watch("sites", "sites");
      watch("shifts", "shifts");
    } else if (page === "payroll.html") {
      // Payroll already has dedicated onSnapshot listeners for its source contracts.
      // The command bar remains available without creating duplicate listeners.
      setStatus("Realtime payroll connected", true);
    }

    refreshTimer = setInterval(() => {
      if (document.hidden) return;
      window.NEWLOOK_REALTIME_HEARTBEAT = new Date().toISOString();
    }, 30000);
    window.NEWLOOK_REALTIME_COMMAND_CENTER = { stop, refreshCurrentSection, register };
    await sleep(0);
  }

  onAuthStateChanged(auth, user => { if (user) start(user); else stop(); });
  window.addEventListener("beforeunload", stop);
})();
