import { db } from "../Js/firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { normalizeRole } from "./permissions.js";

function clearCompanyStorage() {
  ["newlookSession", "companyId", "userRole"].forEach(k => sessionStorage.removeItem(k));
  window.currentUser = null;
}

function subscriptionIsUsable(company) {
  const status = String(company.subscriptionStatus || company.status || "active").toLowerCase();
  if (["suspended", "cancelled", "expired", "inactive", "past_due"].includes(status)) return false;
  const end = company.subscriptionEndsAt?.toMillis?.() || (company.subscriptionEndsAt ? Date.parse(company.subscriptionEndsAt) : 0);
  return !end || end > Date.now();
}

export async function loadSession(user) {
  const profileSnap = await getDoc(doc(db, "users", user.uid));
  if (!profileSnap.exists()) throw new Error("Account profile not found.");

  const d = profileSnap.data();
  const role = normalizeRole(d.role);
  const status = String(d.status || "active").toLowerCase();
  if (status !== "active") throw new Error("Account is inactive.");
  if (role !== "super_admin" && !d.companyId) throw new Error("Company assignment is missing.");

  let company = null;
  let plan = null;
  if (d.companyId) {
    const companySnap = await getDoc(doc(db, "companies", d.companyId));
    if (!companySnap.exists()) throw new Error("Company account not found.");
    company = { id: companySnap.id, ...companySnap.data() };
    if (String(company.status || "active").toLowerCase() !== "active") throw new Error("Company is suspended.");
    if (!subscriptionIsUsable(company)) throw new Error("Company subscription is inactive or expired.");
    if (!company.planId) throw new Error("Company subscription plan is not assigned.");
    if (company.planId) {
      const planSnap = await getDoc(doc(db, "subscriptionPlans", company.planId));
      if (planSnap.exists()) { plan = { id: planSnap.id, ...planSnap.data() }; if (String(plan.status || "active").toLowerCase() !== "active") throw new Error("Company subscription plan is inactive."); }
      else throw new Error("Company subscription plan is unavailable.");
    }
  }

  const session = {
    uid: user.uid,
    email: user.email || d.email || "",
    fullName: d.fullName || d.displayName || "",
    role,
    companyId: d.companyId || null,
    companyName: company?.name || company?.companyName || "",
    status,
    companyStatus: company?.status || null,
    subscriptionStatus: company?.subscriptionStatus || null,
    subscriptionEndsAt: company?.subscriptionEndsAt || null,
    planId: company?.planId || null,
    plan: plan || null
  };

  sessionStorage.setItem("newlookSession", JSON.stringify(session));
  if (session.companyId) sessionStorage.setItem("companyId", session.companyId);
  sessionStorage.setItem("userRole", role);
  window.currentUser = session;
  return session;
}

export function clearSession() { clearCompanyStorage(); }
