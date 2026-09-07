import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const icons = {
  dashboard: "fa-chart-pie",
  guards: "fa-user-shield",
  sites: "fa-building-shield",
  shifts: "fa-calendar-days",
  attendance: "fa-clock",
  reports: "fa-file-chart-column",
  patrols: "fa-route",
  visitors: "fa-address-book",
  incidents: "fa-triangle-exclamation",
  panic: "fa-bell",
  analytics: "fa-chart-line",
  broadcast: "fa-bullhorn"
};

const labels = {
  dashboard: "Dashboard",
  guards: "Guards",
  sites: "Sites",
  shifts: "Shifts",
  attendance: "Attendance",
  reports: "Reports",
  patrols: "Patrol Monitoring",
  visitors: "Visitors",
  incidents: "Incidents",
  panic: "Panic Alerts",
  analytics: "Analytics",
  broadcast: "Broadcast"
};

function escapeHTML(value = "") {
  return String(value).replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
}

function roleLabel(role = "") {
  return role.replaceAll("_", " ").replace(/\b\w/g, x => x.toUpperCase());
}

function enhanceHeader(session) {
  const header = document.querySelector(".header");
  if (!header) return;
  header.innerHTML = `
    <div class="nl-header-left">
      <button class="nl-menu-toggle" id="nlMenuToggle" aria-label="Open navigation"><i class="fa-solid fa-bars"></i></button>
      <div>
        <div class="nl-eyebrow">SECURITY OPERATIONS</div>
        <h2 id="nlPageTitle">Dashboard</h2>
      </div>
    </div>
    <div class="nl-header-right">
      <div class="nl-company-chip">
        <span class="nl-live-dot"></span>
        <span>${escapeHTML(session.companyName || "Company Workspace")}</span>
      </div>
      <div class="nl-user-chip">
        <div class="nl-avatar">${escapeHTML((session.fullName || session.email || "U").trim().charAt(0).toUpperCase())}</div>
        <div class="nl-user-meta">
          <strong>${escapeHTML(session.fullName || "User")}</strong>
          <small>${escapeHTML(roleLabel(session.role))}</small>
        </div>
      </div>
      <button class="nl-icon-btn" id="nlLogoutBtn" title="Sign out"><i class="fa-solid fa-arrow-right-from-bracket"></i></button>
    </div>`;

  const oldLogout = document.getElementById("logoutBtn");
  if (oldLogout) oldLogout.style.display = "none";
  document.getElementById("nlLogoutBtn")?.addEventListener("click", () => oldLogout?.click());
  document.getElementById("nlMenuToggle")?.addEventListener("click", () => document.body.classList.toggle("sidebar-open"));
}

function enhanceSidebar(session) {
  const sidebar = document.querySelector(".sidebar");
  if (!sidebar) return;
  const logo = sidebar.querySelector(".logo");
  if (logo) {
    logo.innerHTML = `
      <div class="nl-brand-mark">N</div>
      <div class="nl-brand-name">NEWLOOK</div>
      <div class="nl-brand-sub">SECURITY OPERATIONS</div>
      <div class="nl-tenant-mini">${escapeHTML(session.companyName || "Company Workspace")}</div>`;
  }

  const menu = sidebar.querySelector(".menu");
  if (!menu) return;
  menu.querySelectorAll("li[data-section]").forEach(item => {
    const section = item.dataset.section;
    const icon = icons[section] || "fa-circle";
    item.innerHTML = `<span class="nl-nav-icon"><i class="fa-solid ${icon}"></i></span><span class="nl-nav-label">${labels[section] || item.textContent.trim()}</span><span class="nl-nav-arrow"><i class="fa-solid fa-chevron-right"></i></span>`;
  });

  const device = menu.querySelector('a[href="device-registration.html"]');
  if (device) {
    device.innerHTML = `<span class="nl-nav-icon"><i class="fa-solid fa-mobile-screen-button"></i></span><span class="nl-nav-label">Device Management</span><span class="nl-nav-arrow"><i class="fa-solid fa-chevron-right"></i></span>`;
    device.closest("li")?.classList.add("nl-device-link");
  }

  let footer = sidebar.querySelector(".nl-sidebar-footer");
  if (!footer) {
    footer = document.createElement("div");
    footer.className = "nl-sidebar-footer";
    footer.innerHTML = `
      <div class="nl-security-status"><span class="nl-live-dot"></span><div><strong>System Online</strong><small>Secure workspace</small></div></div>
      <div class="nl-version">NEWLOOK SaaS · v2.0</div>`;
    sidebar.appendChild(footer);
  }
}

function enhanceDashboard(session) {
  const dashboard = document.getElementById("dashboard");
  if (!dashboard || dashboard.querySelector(".nl-dashboard-shell")) return;
  const shell = document.createElement("div");
  shell.className = "nl-dashboard-shell";
  shell.innerHTML = `
    <div class="nl-hero">
      <div>
        <span class="nl-kicker">COMMAND CENTER</span>
        <h1>Good to see you, ${escapeHTML((session.fullName || "Administrator").split(" ")[0])}.</h1>
        <p>Monitor your security operation from one connected workspace.</p>
      </div>
      <div class="nl-hero-side">
        <div class="nl-status-pill"><span class="nl-live-dot"></span> Platform operational</div>
        <div class="nl-plan-pill">${escapeHTML(roleLabel(session.role))}</div>
      </div>
    </div>
    <div class="nl-kpi-grid">
      <button class="nl-kpi" data-go="guards"><span class="nl-kpi-icon"><i class="fa-solid fa-user-shield"></i></span><span><small>WORKFORCE</small><strong>Manage Guards</strong><em>People & assignments</em></span><i class="fa-solid fa-arrow-up-right-from-square"></i></button>
      <button class="nl-kpi" data-go="sites"><span class="nl-kpi-icon"><i class="fa-solid fa-building-shield"></i></span><span><small>LOCATIONS</small><strong>Manage Sites</strong><em>Sites & checkpoints</em></span><i class="fa-solid fa-arrow-up-right-from-square"></i></button>
      <button class="nl-kpi" data-go="attendance"><span class="nl-kpi-icon"><i class="fa-solid fa-clock"></i></span><span><small>TIME CONTROL</small><strong>Attendance</strong><em>Live shift activity</em></span><i class="fa-solid fa-arrow-up-right-from-square"></i></button>
      <button class="nl-kpi" data-go="reports"><span class="nl-kpi-icon"><i class="fa-solid fa-chart-line"></i></span><span><small>INSIGHTS</small><strong>Reports</strong><em>Operational intelligence</em></span><i class="fa-solid fa-arrow-up-right-from-square"></i></button>
    </div>
    <div class="nl-dashboard-grid">
      <div class="nl-panel">
        <div class="nl-panel-head"><div><span class="nl-kicker">WORKSPACE</span><h3>Quick actions</h3></div><span class="nl-panel-badge">${escapeHTML(roleLabel(session.role))}</span></div>
        <div class="nl-action-grid">
          <button data-go="guards"><i class="fa-solid fa-user-plus"></i><span>Add / manage guards</span></button>
          <button data-go="sites"><i class="fa-solid fa-location-dot"></i><span>Manage security sites</span></button>
          <button data-go="shifts"><i class="fa-solid fa-calendar-check"></i><span>Configure shifts</span></button>
          <button data-go="patrols"><i class="fa-solid fa-route"></i><span>Monitor patrols</span></button>
          <button data-go="incidents"><i class="fa-solid fa-triangle-exclamation"></i><span>Review incidents</span></button>
          <button data-go="reports"><i class="fa-solid fa-file-lines"></i><span>Generate reports</span></button>
        </div>
      </div>
      <div class="nl-panel nl-security-panel">
        <div class="nl-panel-head"><div><span class="nl-kicker">TENANT STATUS</span><h3>Workspace security</h3></div><i class="fa-solid fa-shield-halved"></i></div>
        <div class="nl-security-row"><span>Company</span><strong>${escapeHTML(session.companyName || "—")}</strong></div>
        <div class="nl-security-row"><span>Account</span><strong class="nl-good">Active</strong></div>
        <div class="nl-security-row"><span>Subscription</span><strong class="nl-good">${escapeHTML(roleLabel(session.subscriptionStatus || "active"))}</strong></div>
        <div class="nl-security-row"><span>Access level</span><strong>${escapeHTML(roleLabel(session.role))}</strong></div>
      </div>
    </div>`;
  const firstHeader = dashboard.querySelector(".staff-report-header");
  firstHeader?.after(shell);
  shell.querySelectorAll("[data-go]").forEach(btn => btn.addEventListener("click", () => document.querySelector(`.menu li[data-section="${btn.dataset.go}"]`)?.click()));
}

function bindNavigationTitle() {
  document.querySelectorAll(".menu li[data-section]").forEach(item => {
    item.addEventListener("click", () => {
      const title = document.getElementById("nlPageTitle");
      if (title) title.textContent = labels[item.dataset.section] || item.textContent.trim();
      document.body.classList.remove("sidebar-open");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

onAuthStateChanged(auth, user => {
  if (!user) return;
  let session = null;
  try { session = JSON.parse(sessionStorage.getItem("newlookSession") || "null"); } catch {}
  if (!session) return;
  enhanceHeader(session);
  enhanceSidebar(session);
  enhanceDashboard(session);
  bindNavigationTitle();
});
