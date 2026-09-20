import { auth } from "../Js/firebase.js";
import { loadSession } from "./companySession.js";
import { applyRoleNavigation } from "./navigation.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

/* Single navigation authority: customerSaaSControl.js creates the Company SaaS extension pages.
 * This bridge only applies role visibility to both static and dynamically-created menu items. */
onAuthStateChanged(auth, async user => {
  if (!user) return;
  try {
    const session = await loadSession(user);
    applyRoleNavigation(session.role);
    window.NEWLOOK_COMPANY_NAVIGATION = { role: session.role, companyId: session.companyId };
  } catch (e) {
    console.error("NEWLOOK navigation/session error", e);
  }
});
