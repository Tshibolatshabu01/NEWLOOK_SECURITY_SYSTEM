import { auth } from "../Js/firebase.js";
import { loadSession } from "./companySession.js";
import { isCompanyAdmin, hasPermission } from "./permissions.js";
import { applyRoleNavigation } from "./navigation.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

onAuthStateChanged(auth, async user => {
  if (!user) return;
  try {
    const session = await loadSession(user);
    applyRoleNavigation(session.role);
    const menu = document.querySelector(".menu");
    if (!menu) return;
    if (hasPermission(session.role, "payroll") && !menu.querySelector('[data-saas-link="payroll"]')) {
      const li = document.createElement("li");
      li.dataset.saasLink = "payroll";
      li.innerHTML = '<a href="payroll.html" style="color:inherit;text-decoration:none;display:block">Payroll</a>';
      menu.appendChild(li);
    }
    if (isCompanyAdmin(session.role) && !menu.querySelector('[data-saas-link="users"]')) {
      const li = document.createElement("li");
      li.dataset.saasLink = "users";
      li.innerHTML = '<a href="company-users.html" style="color:inherit;text-decoration:none;display:block">Team Access</a>';
      menu.appendChild(li);
    }
  } catch (e) { console.error("NEWLOOK navigation/session error", e); }
});
