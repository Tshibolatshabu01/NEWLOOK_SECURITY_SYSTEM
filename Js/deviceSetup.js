import { auth, db } from "./firebase.js";
import { signInAnonymously, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
    doc,
    getDoc,
    runTransaction,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const setupCode = document.getElementById("setupCode");
const activateBtn = document.getElementById("activateBtn");
const statusEl = document.getElementById("status");
const deviceMeta = document.getElementById("deviceMeta");

const params = new URLSearchParams(window.location.search);
const requestedReturn = params.get("return") || "guard.html";
const returnPage = ["guard.html", "attendance.html"].includes(requestedReturn) ? requestedReturn : "guard.html";
const expectedDeviceType = returnPage === "attendance.html" ? "attendance" : "guard";

function status(message, type = "") {
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
}

function saveDevice(data, uid) {
    localStorage.setItem("newlookDeviceId", uid);
    localStorage.setItem("newlookDeviceCompanyId", data.companyId);
    localStorage.setItem("newlookDeviceSiteId", data.siteId);
    localStorage.setItem("newlookDeviceStatus", "active");
    localStorage.setItem("newlookDeviceName", data.deviceName || "");
    localStorage.setItem("newlookDeviceType", data.deviceType || "guard");
    localStorage.setItem("newlookDeviceContext", JSON.stringify({
        deviceId: uid,
        companyId: data.companyId,
        siteId: data.siteId,
        status: "active",
        deviceName: data.deviceName || "NEWLOOK Device",
        deviceType: data.deviceType || "guard"
    }));
}


function existingActivationMatchesType() {
    const deviceId = localStorage.getItem("newlookDeviceId");
    const companyId = localStorage.getItem("newlookDeviceCompanyId");
    const siteId = localStorage.getItem("newlookDeviceSiteId");
    const status = localStorage.getItem("newlookDeviceStatus");
    const type = String(localStorage.getItem("newlookDeviceType") || "").toLowerCase();
    if (deviceId && companyId && siteId && status === "active" && type === expectedDeviceType) return true;
    try {
        const stored = JSON.parse(localStorage.getItem("newlookDeviceContext") || "null");
        return Boolean(stored?.deviceId && stored?.companyId && stored?.siteId && stored?.status === "active" && String(stored?.deviceType || "").toLowerCase() === expectedDeviceType);
    } catch { return false; }
}

function showAlreadyActivated() {
    const deviceName = localStorage.getItem("newlookDeviceName") || "NEWLOOK Device";
    status(`This ${expectedDeviceType} device is already activated. Opening application...`, "success");
    deviceMeta.style.display = "block";
    deviceMeta.innerHTML = `<strong>Device:</strong> ${deviceName}<br><strong>Type:</strong> ${expectedDeviceType}<br><strong>Activation:</strong> One-time activation complete`;
    setupCode.disabled = true;
    activateBtn.disabled = true;
    setTimeout(() => { window.location.href = returnPage; }, 500);
}

if (existingActivationMatchesType()) {
    showAlreadyActivated();
}

activateBtn.addEventListener("click", async () => {
    const code = setupCode.value.trim().toUpperCase();
    if (!code) {
        status("Enter the setup code.", "error");
        return;
    }

    activateBtn.disabled = true;
    status("Activating device...");

    try {
        await setPersistence(auth, browserLocalPersistence);

        if (!auth.currentUser) {
            try {
                await signInAnonymously(auth);
            } catch (error) {
                if (error?.code === "auth/admin-restricted-operation") {
                    throw new Error("Anonymous Authentication is disabled in Firebase Authentication. Enable the Anonymous provider, then try device activation again.");
                }
                throw error;
            }
        }

        const user = auth.currentUser;
        if (!user) throw new Error("Anonymous device authentication failed.");

        const registrationRef = doc(db, "deviceRegistrations", code);
        const registrationSnap = await getDoc(registrationRef);

        if (!registrationSnap.exists()) {
            throw new Error("Invalid setup code.");
        }

        const registration = registrationSnap.data();
        const now = Date.now();
        const expiresAt = registration.expiresAt?.toMillis?.() || 0;

        if (registration.status !== "available") {
            throw new Error("This setup code has already been used.");
        }

        const registrationType = String(registration.deviceType || "guard").toLowerCase();
        if (!(["guard", "attendance"].includes(registrationType))) {
            throw new Error("The registration contains an unsupported device type.");
        }
        if (registrationType !== expectedDeviceType) {
            throw new Error(`This code is registered for a ${registrationType} device. Open the matching ${registrationType}.html application.`);
        }

        if (!expiresAt || expiresAt <= now) {
            throw new Error("This setup code has expired. Ask the administrator for a new code.");
        }

        const deviceRef = doc(db, "companies", registration.companyId, "devices", user.uid);

        await runTransaction(db, async transaction => {
            const latest = await transaction.get(registrationRef);
            if (!latest.exists() || latest.data().status !== "available") {
                throw new Error("This setup code has already been claimed.");
            }

            transaction.update(registrationRef, {
                status: "claimed",
                authUid: user.uid,
                claimedAt: serverTimestamp()
            });

            transaction.set(deviceRef, {
                deviceId: user.uid,
                authUid: user.uid,
                companyId: registration.companyId,
                siteId: registration.siteId,
                deviceName: registration.deviceName || "NEWLOOK Device",
                deviceType: registrationType,
                registrationCode: code,
                status: "active",
                registeredAt: serverTimestamp(),
                lastSeenAt: serverTimestamp()
            });
        });

        saveDevice(registration, user.uid);
        deviceMeta.style.display = "block";
        deviceMeta.innerHTML = `<strong>Site:</strong> ${registration.siteName || registration.siteId}<br><strong>Device:</strong> ${registration.deviceName || "NEWLOOK Device"}<br><strong>Type:</strong> ${registration.deviceType || "guard"}`;
        status("Device activated successfully. Opening application...", "success");

        setTimeout(() => {
            window.location.href = returnPage;
        }, 700);
    } catch (error) {
        console.error(error);
        status(error.message || "Device activation failed.", "error");
        activateBtn.disabled = false;
    }
});
