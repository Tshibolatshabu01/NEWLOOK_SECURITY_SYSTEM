import { auth } from "./firebase.js";
import { signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { loadSession, clearSession } from "../SaaS/companySession.js";
import { isSuperAdmin, isManagement } from "../SaaS/permissions.js";

export async function login(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  try { return await loadSession(credential.user); }
  catch (error) { await signOut(auth); clearSession(); throw error; }
}

export async function logout() {
  await signOut(auth);
  clearSession();
  location.href = "SaasLogin.html";
}

const form = document.getElementById("loginForm");
if (form) {
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const message = document.getElementById("message");
  const button = form.querySelector("button[type=submit],button:not([type])");

  form.addEventListener("submit", async event => {
    event.preventDefault();
    message.textContent = "";
    button.disabled = true;
    button.textContent = "Signing in…";
    try {
      const session = await login(emailInput.value.trim(), passwordInput.value);
      location.href = isSuperAdmin(session.role) ? "superAdmin/superadmin.html" : isManagement(session.role) ? "admin.html" : "SaasLogin.html";
    } catch (error) {
      message.textContent = friendlyAuthError(error);
      button.disabled = false;
      button.textContent = "Continue";
    }
  });

  const reset = document.getElementById("resetPassword");
  if (reset) reset.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    if (!email) { message.textContent = "Enter your email first."; return; }
    try { await sendPasswordResetEmail(auth, email); message.textContent = "Password reset instructions sent."; }
    catch (error) { message.textContent = friendlyAuthError(error); }
  });
}

function friendlyAuthError(error) {
  const code = error?.code || "";
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) return "Email or password is incorrect.";
  if (code.includes("too-many-requests")) return "Too many attempts. Please wait and try again.";
  if (code.includes("network-request-failed")) return "Network error. Check your connection.";
  if (code.includes("api-key-not-valid")) return "Firebase configuration error: the Web API key does not match the configured Firebase project.";
  return error?.message || "Unable to sign in.";
}
