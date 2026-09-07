import { auth, db, companyCollection, getCompanyId } from "./firebase.js";
import { writeCompanyAudit } from "./auditLogger.js";
import { loadSession } from "../SaaS/companySession.js";
import { canManageDevices } from "../SaaS/permissions.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
    collection,
    doc,
    getDocs,
    getDoc,
    setDoc,
    updateDoc,
    query,
    where,
    limit,
    serverTimestamp,
    Timestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const siteSelect = document.getElementById("siteSelect");
const deviceName = document.getElementById("deviceName");
const deviceType = document.getElementById("deviceType");
const generateBtn = document.getElementById("generateBtn");
const status = document.getElementById("status");
const generatedCode = document.getElementById("generatedCode");
const registrationList = document.getElementById("registrationList");

function setStatus(message, error = false) {
    status.textContent = message;
    status.className = `status ${error ? "warning" : ""}`;
}

function randomCode() {
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

async function loadSites() {
    siteSelect.innerHTML = '<option value="">Select Site</option>';
    const snap = await getDocs(companyCollection(db, "sites"));
    snap.forEach(d => {
        const data = d.data();
        const option = document.createElement("option");
        option.value = data.siteId || d.id;
        option.textContent = data.siteName || d.id;
        siteSelect.appendChild(option);
    });
}

async function loadRegistrations() {
    registrationList.innerHTML = "";
    const companyId = getCompanyId();
    if (!companyId) return;

    const registrationSnap = await getDocs(query(
        collection(db, "deviceRegistrations"),
        where("companyId", "==", companyId),
        limit(50)
    ));

    const deviceSnap = await getDocs(
        companyCollection(db, "devices")
    );

    const rows = [];
    registrationSnap.forEach(d => {
        rows.push({
            kind: "registration",
            id: d.id,
            ...d.data()
        });
    });

    deviceSnap.forEach(d => {
        rows.push({
            kind: "device",
            id: d.id,
            ...d.data()
        });
    });

    rows.sort((a, b) => {
        const aTime = a.registeredAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
        const bTime = b.registeredAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
    });

    rows.slice(0, 30).forEach(item => {
        const tr = document.createElement("tr");

        const created = item.registeredAt?.toDate?.()?.toLocaleString?.()
            || item.createdAt?.toDate?.()?.toLocaleString?.()
            || "Pending";

        const statusText = item.status || "available";
        const typeText = item.deviceType || "Device";

        if (item.kind === "device") {
            const action =
                statusText === "active"
                    ? `<button type="button" class="device-action revoke-device" data-device-id="${item.id}" data-device-name="${escapeHtml(item.deviceName || "Device")}">Revoke</button>`
                    : `<button type="button" class="device-action activate-device" data-device-id="${item.id}" data-device-name="${escapeHtml(item.deviceName || "Device")}">Reactivate</button>`;

            tr.innerHTML = `
                <td>${escapeHtml(item.deviceName || "NEWLOOK Device")}</td>
                <td>${escapeHtml(item.siteName || item.siteId || "")}</td>
                <td>${escapeHtml(typeText)}</td>
                <td><span class="pill">${escapeHtml(statusText)}</span></td>
                <td>${escapeHtml(created)}</td>
                <td>${action}</td>
            `;
        } else {
            tr.innerHTML = `
                <td>${escapeHtml(item.deviceName || "NEWLOOK Device")}</td>
                <td>${escapeHtml(item.siteName || item.siteId || "")}</td>
                <td>${escapeHtml(typeText)}</td>
                <td><span class="pill">${escapeHtml(statusText)}</span></td>
                <td>${escapeHtml(created)}</td>
                <td>Setup code</td>
            `;
        }

        registrationList.appendChild(tr);
    });

    registrationList.querySelectorAll(".revoke-device").forEach(button => {
        button.addEventListener("click", () =>
            changeDeviceStatus(button.dataset.deviceId, "revoked", button.dataset.deviceName)
        );
    });

    registrationList.querySelectorAll(".activate-device").forEach(button => {
        button.addEventListener("click", () =>
            changeDeviceStatus(button.dataset.deviceId, "active", button.dataset.deviceName)
        );
    });
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

async function changeDeviceStatus(deviceId, nextStatus, deviceNameText) {
    const companyId = getCompanyId();
    if (!companyId) return setStatus("Company context is missing.", true);

    const actionText = nextStatus === "revoked" ? "revoke" : "reactivate";
    if (!window.confirm(`Are you sure you want to ${actionText} ${deviceNameText || "this device"}?`)) {
        return;
    }

    try {
        await updateDoc(
            doc(db, "companies", companyId, "devices", deviceId),
            {
                status: nextStatus,
                updatedAt: serverTimestamp()
            }
        );

        await writeCompanyAudit({
            action: nextStatus === "revoked" ? "REVOKE" : "ACTIVATE",
            module: "devices",
            description: `${nextStatus === "revoked" ? "Revoked" : "Reactivated"} device ${deviceNameText || deviceId}.`,
            targetId: deviceId,
            metadata: { status: nextStatus }
        });

        setStatus(`Device ${nextStatus === "revoked" ? "revoked" : "reactivated"} successfully.`);
        await loadRegistrations();
    } catch (error) {
        console.error(error);
        setStatus(error.message || `Unable to ${actionText} device.`, true);
    }
}

async function init(user) {
    if (!user) {
        location.href = "SaasLogin.html";
        return;
    }

    const session = await loadSession(user);
    if (!session.companyId || !canManageDevices(session.role)) {
        location.href = "SaasLogin.html";
        return;
    }

    const companyId = getCompanyId();
    if (!companyId) {
        setStatus("Company context is missing.", true);
        return;
    }

    await loadSites();
    await loadRegistrations();
}

onAuthStateChanged(auth, init);

generateBtn.addEventListener("click", async () => {
    const siteId = siteSelect.value;
    const option = siteSelect.options[siteSelect.selectedIndex];
    const selectedType = String(deviceType?.value || "guard").toLowerCase();
    if (!["guard", "attendance"].includes(selectedType)) return setStatus("Select a valid device type.", true);
    const companyId = getCompanyId();

    if (!siteId) return setStatus("Select a site first.", true);
    if (!companyId) return setStatus("Company context is missing.", true);

    generateBtn.disabled = true;
    try {
        const code = randomCode();
        const ref = doc(db, "deviceRegistrations", code);
        const expiresAt = Timestamp.fromDate(new Date(Date.now() + 15 * 60 * 1000));

        await setDoc(ref, {
            companyId,
            siteId,
            siteName: option.textContent,
            deviceName: deviceName.value.trim() || "NEWLOOK Device",
            deviceType: selectedType,
            status: "available",
            expiresAt,
            createdAt: serverTimestamp(),
            createdBy: auth.currentUser.uid
        });

        await writeCompanyAudit({
            action: "CREATE",
            module: "devices",
            description: `Generated device registration for ${option.textContent}.`,
            targetId: code,
            metadata: { siteId, deviceName: deviceName.value.trim() || "NEWLOOK Device" }
        });

        generatedCode.textContent = code;
        generatedCode.style.display = "block";
        setStatus("Code generated. Give this code to the device operator.");
        await loadRegistrations();
    } catch (error) {
        console.error(error);
        setStatus(error.message || "Unable to generate device code.", true);
    } finally {
        generateBtn.disabled = false;
    }
});
