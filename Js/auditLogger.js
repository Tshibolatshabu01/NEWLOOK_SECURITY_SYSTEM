// =====================================
// NEWLOOK SECURITY SaaS
// Central Audit Logger - A4
// =====================================
import {
    auth,
    db,
    companyCollection,
    getCompanyId
} from "./firebase.js";

import {
    addDoc,
    collection,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

function actorContext() {
    const user = auth.currentUser;
    return {
        userId: user?.uid || "",
        userEmail: user?.email || "",
        role: window.currentUser?.role || "",
        companyId: getCompanyId() || ""
    };
}

export async function writeCompanyAudit({
    action,
    module,
    description,
    targetId = "",
    metadata = {}
}) {
    const ctx = actorContext();
    if (!ctx.companyId) return false;

    try {
        await addDoc(companyCollection(db, "auditLogs"), {
            ...ctx,
            action: String(action || "SECURITY").toUpperCase(),
            module: String(module || "system"),
            description: String(description || ""),
            targetId: String(targetId || ""),
            metadata,
            createdAt: serverTimestamp()
        });
        return true;
    } catch (error) {
        // Audit failure must never break the primary business operation.
        console.error("NEWLOOK audit write failed:", error);
        return false;
    }
}

export async function writeSuperAdminAudit({
    action,
    module,
    description,
    targetId = "",
    metadata = {}
}) {
    const ctx = actorContext();

    try {
        await addDoc(collection(db, "superAdminAuditLogs"), {
            userId: ctx.userId,
            userEmail: ctx.userEmail,
            role: ctx.role,
            action: String(action || "SECURITY").toUpperCase(),
            module: String(module || "system"),
            description: String(description || ""),
            targetId: String(targetId || ""),
            metadata,
            createdAt: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error("NEWLOOK super-admin audit write failed:", error);
        return false;
    }
}
