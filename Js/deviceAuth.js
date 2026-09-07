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
    [DEVICE_ID_KEY, DEVICE_COMPANY_KEY, DEVICE_SITE_KEY, DEVICE_STATUS_KEY, "newlookDeviceName", "newlookDeviceType"]
        .forEach(key => localStorage.removeItem(key));
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

        const deviceId = localStorage.getItem(DEVICE_ID_KEY);
        const companyId = localStorage.getItem(DEVICE_COMPANY_KEY);
        const siteId = localStorage.getItem(DEVICE_SITE_KEY);
        const status = localStorage.getItem(DEVICE_STATUS_KEY);

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
    return {
        deviceId: localStorage.getItem(DEVICE_ID_KEY),
        companyId: localStorage.getItem(DEVICE_COMPANY_KEY),
        siteId: localStorage.getItem(DEVICE_SITE_KEY)
    };
}
