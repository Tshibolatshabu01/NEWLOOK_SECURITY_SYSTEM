// ============================================
// NEWLOOK SECURITY SYSTEM
// Secure Guard / Attendance Device Authentication
// ============================================

import { auth, db } from "./firebase.js";
import {
    signInAnonymously,
    onAuthStateChanged,
    setPersistence,
    browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const DEVICE_ID_KEY = "newlookDeviceId";
const DEVICE_COMPANY_KEY = "newlookDeviceCompanyId";
const DEVICE_SITE_KEY = "newlookDeviceSiteId";
const DEVICE_STATUS_KEY = "newlookDeviceStatus";
const DEVICE_CONTEXT_KEY = "newlookDeviceContext";

function waitForAuthUser() {
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, user => {
            unsubscribe();
            if (user) resolve(user);
            else reject(new Error("NEWLOOK: Device authentication failed."));
        }, reject);
    });
}

function clearDeviceStorage() {
    [DEVICE_ID_KEY, DEVICE_COMPANY_KEY, DEVICE_SITE_KEY, DEVICE_STATUS_KEY, "newlookDeviceName", "newlookDeviceType", DEVICE_CONTEXT_KEY]
        .forEach(key => localStorage.removeItem(key));
}

function readStoredDeviceContext() {
    try {
        const raw = localStorage.getItem(DEVICE_CONTEXT_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.deviceId && parsed.companyId && parsed.siteId && parsed.status === "active") return parsed;
        }
    } catch (error) {
        console.warn("NEWLOOK: stored device context could not be parsed; rebuilding it.", error);
    }
    const context = {
        deviceId: localStorage.getItem(DEVICE_ID_KEY),
        companyId: localStorage.getItem(DEVICE_COMPANY_KEY),
        siteId: localStorage.getItem(DEVICE_SITE_KEY),
        status: localStorage.getItem(DEVICE_STATUS_KEY),
        deviceName: localStorage.getItem("newlookDeviceName") || "",
        deviceType: localStorage.getItem("newlookDeviceType") || ""
    };
    if (context.deviceId && context.companyId && context.siteId && context.status === "active") {
        localStorage.setItem(DEVICE_CONTEXT_KEY, JSON.stringify(context));
        return context;
    }
    return null;
}

function publishDeviceContext(device) {
    const context = {
        deviceId: device.deviceId || device.authUid || device.id,
        companyId: device.companyId,
        siteId: device.siteId,
        status: device.status || "active",
        deviceName: device.deviceName || device.name || "NEWLOOK Device",
        deviceType: String(device.deviceType || "").toLowerCase()
    };
    localStorage.setItem(DEVICE_CONTEXT_KEY, JSON.stringify(context));
    window.newlookDeviceContext = context;
    return context;
}

export async function ensureDeviceAuthorized(returnPage = "guard.html", expectedType = null) {
    try {
        // Restore the existing device Auth session before attempting a new sign-in.
        // This prevents a fresh anonymous account from being requested after every page load.
        await setPersistence(auth, browserLocalPersistence);

        let user = auth.currentUser;

        if (!user) {
            try {
                user = await waitForAuthUser();
            } catch {
                user = null;
            }
        }

        if (!user) {
            try {
                await signInAnonymously(auth);
                user = await waitForAuthUser();
            } catch (error) {
                if (error?.code === "auth/admin-restricted-operation") {
                    throw new Error("NEWLOOK: Anonymous Authentication is disabled in Firebase Authentication. Enable the Anonymous provider, then activate this device again.");
                }
                throw error;
            }
        }

        const stored = readStoredDeviceContext();
        const deviceId = stored?.deviceId || localStorage.getItem(DEVICE_ID_KEY);
        const companyId = stored?.companyId || localStorage.getItem(DEVICE_COMPANY_KEY);
        const siteId = stored?.siteId || localStorage.getItem(DEVICE_SITE_KEY);
        const status = stored?.status || localStorage.getItem(DEVICE_STATUS_KEY);

        if (!deviceId || !companyId || !siteId || status !== "active") {
            const returnUrl = encodeURIComponent(returnPage);
            window.location.href = `device-setup.html?return=${returnUrl}`;
            return false;
        }

        if (deviceId !== user.uid) {
            clearDeviceStorage();
            const returnUrl = encodeURIComponent(returnPage);
            window.location.href = `device-setup.html?return=${returnUrl}`;
            return false;
        }

        const deviceRef = doc(db, "companies", companyId, "devices", user.uid);
        const deviceSnap = await getDoc(deviceRef);

        if (!deviceSnap.exists()) {
            clearDeviceStorage();
            const returnUrl = encodeURIComponent(returnPage);
            window.location.href = `device-setup.html?return=${returnUrl}`;
            return false;
        }

        const device = deviceSnap.data();

        if (
            device.authUid !== user.uid ||
            device.companyId !== companyId ||
            device.siteId !== siteId ||
            device.status !== "active" ||
            (expectedType && String(device.deviceType || "").toLowerCase() !== String(expectedType).toLowerCase())
        ) {
            clearDeviceStorage();
            const returnUrl = encodeURIComponent(returnPage);
            window.location.href = `device-setup.html?return=${returnUrl}`;
            return false;
        }

        publishDeviceContext({ ...device, deviceId: device.deviceId || user.uid, authUid: user.uid });
        return true;
    } catch (error) {
        console.error("Device authorization failed:", error);
        document.body.innerHTML = `
            <div style="padding:30px;font-family:Arial,sans-serif;text-align:center">
                <h2>Device authorization failed</h2>
                <p>${error.message}</p>
            </div>
        `;
        return false;
    }
}

export function getDeviceContext() {
    return readStoredDeviceContext() || {
        deviceId: localStorage.getItem(DEVICE_ID_KEY),
        companyId: localStorage.getItem(DEVICE_COMPANY_KEY),
        siteId: localStorage.getItem(DEVICE_SITE_KEY),
        status: localStorage.getItem(DEVICE_STATUS_KEY),
        deviceName: localStorage.getItem("newlookDeviceName") || "",
        deviceType: localStorage.getItem("newlookDeviceType") || ""
    };
}
