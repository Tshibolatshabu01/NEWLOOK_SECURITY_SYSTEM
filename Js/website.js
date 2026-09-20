import { db } from "./firebase.js";
import { addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const navToggle = document.getElementById("navToggle");
const siteNav = document.getElementById("siteNav");
const body = document.body;

function setNav(open) {
  siteNav?.classList.toggle("open", open);
  navToggle?.setAttribute("aria-expanded", String(open));
  navToggle?.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  body.classList.toggle("nav-open", open);
}

navToggle?.addEventListener("click", () => setNav(!siteNav?.classList.contains("open")));
siteNav?.querySelectorAll("a").forEach(link => link.addEventListener("click", () => setNav(false)));

document.getElementById("year")?.replaceChildren(String(new Date().getFullYear()));

document.querySelectorAll("[data-demo]").forEach(trigger => trigger.addEventListener("click", () => {
  window.setTimeout(() => document.querySelector('#leadForm input[name="name"]')?.focus(), 300);
}));

const form = document.getElementById("leadForm");
const message = document.getElementById("leadMessage");
const submit = document.getElementById("leadSubmit");

function showMessage(text, type = "") {
  if (!message) return;
  message.className = `form-message${type ? ` ${type}` : ""}`;
  message.textContent = text;
}

form?.addEventListener("submit", async event => {
  event.preventDefault();
  showMessage("");

  const data = Object.fromEntries(new FormData(form).entries());
  if (String(data.website || "").trim()) return;

  const clean = Object.fromEntries(
    ["name", "email", "company", "phone", "type", "message"].map(key => [key, String(data[key] || "").trim()])
  );
  const allowedTypes = new Set(["demo", "sales", "support"]);
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email);

  if (clean.name.length < 2 || clean.name.length > 80 || !clean.email || !clean.message) {
    showMessage("Please complete your name, email and message.", "error");
    return;
  }
  if (!emailOk || clean.email.length > 120) {
    showMessage("Please enter a valid work email address.", "error");
    return;
  }
  if (clean.company.length > 120 || clean.phone.length > 40 || clean.message.length < 3 || clean.message.length > 1200) {
    showMessage("Please check the length of the information entered.", "error");
    return;
  }
  if (!allowedTypes.has(clean.type)) {
    showMessage("Please select a valid enquiry type.", "error");
    return;
  }

  if (submit) {
    submit.disabled = true;
    submit.innerHTML = "Sending… <span aria-hidden=\"true\">•</span>";
  }

  try {
    await addDoc(collection(db, "publicLeads"), {
      ...clean,
      source: "newlook-public-website",
      status: "new",
      createdAt: serverTimestamp()
    });
    form.reset();
    showMessage("Thank you. Your enquiry has been submitted to NEWLOOK.", "success");
  } catch (error) {
    console.error("NEWLOOK public lead submission failed", error);
    showMessage("We could not submit the enquiry right now. Please try again later.", "error");
  } finally {
    if (submit) {
      submit.disabled = false;
      submit.innerHTML = "Send enquiry <span aria-hidden=\"true\">→</span>";
    }
  }
});
