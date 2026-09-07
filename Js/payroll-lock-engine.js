/* NEWLOOK V10 Payroll Audit & Period Lock Engine
 * Client-side workflow backed by Firestore security rules.
 * Locked periods are immutable until an auditable correction workflow reopens them.
 */
import { db, companyCollection, companyDoc, getCompanyId } from "./firebase.js";
import {
  collection, doc, getDoc, getDocs, query, where,
  setDoc, addDoc, updateDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const cid = () => getCompanyId();
const uid = () => window.__newlookPayrollUid || "";
const clean = v => String(v ?? "").trim();

export async function getPayrollPeriodState(periodKey) {
  if (!cid() || !periodKey) return null;
  const ref = companyDoc(db, "payrollPeriods", periodKey);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const d = snap.data() || {};
  return { id: snap.id, ...d, locked: d.locked === true || clean(d.status).toLowerCase() === "locked" };
}

export async function createPayrollSnapshot(periodKey, records = [], performedBy = uid()) {
  if (!cid() || !periodKey) throw new Error("Payroll period is required.");
  const period = await getPayrollPeriodState(periodKey);
  if (period?.locked) throw new Error("Payroll period is already locked.");
  const now = serverTimestamp();
  const payload = {
    action: "immutable_snapshot",
    snapshotType: "PAYROLL_FINALIZATION",
    payrollKey: periodKey,
    payrollCount: records.length,
    performedBy,
    createdAt: now,
    immutable: true,
    records: records.map(r => ({
      payrollId: r.id,
      guardId: r.guardId || "",
      employeeID: r.employeeID || "",
      fullName: r.fullName || r.employeeName || "",
      department: r.department || "",
      position: r.position || "",
      payrollStatus: r.payrollStatus || "",
      paymentStatus: r.paymentStatus || "",
      payrollKey: r.payrollKey || periodKey,
      basicSalary: Number(r.basicSalary || 0),
      overtimeHours: Number(r.overtimeHours || 0),
      overtimeAmount: Number(r.overtimeAmount || 0),
      allowanceBreakdown: r.allowanceBreakdown || {},
      grossSalary: Number(r.grossSalary || 0),
      deductionBreakdown: r.deductionBreakdown || {},
      deductions: Number(r.deductions || 0),
      netSalary: Number(r.netSalary || 0),
      sourceShiftRecordIds: r.sourceShiftRecordIds || [],
      sourceAttendanceRecordIds: r.sourceAttendanceRecordIds || [],
      sourceShiftRecordCount: Number(r.sourceShiftRecordCount || 0),
      sourceAttendanceRecordCount: Number(r.sourceAttendanceRecordCount || 0)
    }))
  };
  const ref = doc(companyCollection(db, "payrollHistory"), `snapshot_${periodKey}_${Date.now()}`);
  await setDoc(ref, payload, { merge: false });
  return ref.id;
}

async function setPayrollSourceLock(records = [], locked = true, periodKey = "") {
  const seen = new Set();
  for (const r of records) {
    const sources = [
      ["shiftRecords", ...(r.sourceShiftRecordIds || [])],
      ["attendanceRecords", ...(r.sourceAttendanceRecordIds || [])]
    ];
    for (const [col, id] of sources) {
      if (!id) continue;
      const key = `${col}:${id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      try {
        await updateDoc(companyDoc(db, col, id), { payrollLocked: locked, payrollLockedKey: locked ? periodKey : "", payrollLockUpdatedAt: serverTimestamp(), payrollLockUpdatedBy: uid() });
      } catch (e) { console.warn("Unable to update payroll source lock", key, e); }
    }
  }
}

export async function lockPayrollPeriod(periodKey, metadata = {}) {
  if (!cid() || !periodKey) throw new Error("Payroll period is required.");
  const ref = companyDoc(db, "payrollPeriods", periodKey);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Configured payroll period not found.");
  const existing = snap.data() || {};
  if (existing.locked === true || clean(existing.status).toLowerCase() === "locked") return true;
  await updateDoc(ref, {
    status: "Locked",
    locked: true,
    lockedAt: serverTimestamp(),
    lockedBy: uid(),
    lockReason: metadata.reason || "Finalization",
    lockedPayrollCount: Number(metadata.payrollCount || 0),
    updatedAt: serverTimestamp(),
    updatedBy: uid()
  });
  const payrollSnap = await getDocs(query(collection(db, "companies", cid(), "payroll"), where("payrollKey", "==", periodKey)));
  await setPayrollSourceLock(payrollSnap.docs.map(d => ({id:d.id,...d.data()})), true, periodKey);
  return true;
}

export async function requestPayrollCorrection(periodKey, reason, payrollIds = [], performedBy = uid()) {
  if (!cid() || !periodKey) throw new Error("Payroll period is required.");
  if (!clean(reason)) throw new Error("A correction reason is required.");
  const period = await getPayrollPeriodState(periodKey);
  if (!period?.locked && clean(period?.status).toLowerCase() !== "locked") throw new Error("A correction request is only required for a locked payroll period.");
  const key = `${periodKey}_${Date.now()}`;
  await setDoc(companyDoc(db, "payrollCorrections", key), {
    companyId: cid(),
    payrollKey: periodKey,
    reason: clean(reason),
    payrollIds: Array.isArray(payrollIds) ? payrollIds : [],
    status: "Requested",
    requestedBy: performedBy,
    requestedAt: serverTimestamp(),
    createdAt: serverTimestamp()
  });
  return key;
}

export async function reopenPayrollPeriod(periodKey, reason, performedBy = uid()) {
  if (!cid() || !periodKey) throw new Error("Payroll period is required.");
  const period = await getPayrollPeriodState(periodKey);
  if (!period?.locked) throw new Error("Payroll period is not locked.");
  const q = query(collection(db, "companies", cid(), "payrollCorrections"), where("payrollKey", "==", periodKey));
  const snap = await getDocs(q);
  if (snap.empty) throw new Error("No correction request exists for this period.");
  const latest = snap.docs.map(d => ({ id:d.id, ...d.data() })).sort((a,b) => String(b.requestedAt?.seconds||0).localeCompare(String(a.requestedAt?.seconds||0)))[0];
  const ref = companyDoc(db, "payrollPeriods", periodKey);
  await updateDoc(ref, {
    status: "Correction",
    locked: false,
    correctionOpen: true,
    correctionId: latest.id,
    correctionReason: clean(reason),
    reopenedAt: serverTimestamp(),
    reopenedBy: performedBy,
    updatedAt: serverTimestamp(),
    updatedBy: performedBy
  });
  const payrollSnap = await getDocs(query(collection(db, "companies", cid(), "payroll"), where("payrollKey", "==", periodKey)));
  for (const d of payrollSnap.docs) {
    const data = d.data() || {};
    if (["Finalized","Approved","Paid","Correction"].includes(String(data.payrollStatus || ""))) {
      await updateDoc(d.ref, { payrollStatus: "Correction", paymentStatus: "Unpaid", correctionOpen: true, correctionId: latest.id, updatedAt: serverTimestamp(), updatedBy: performedBy });
    }
    await setPayrollSourceLock([{...data}], false, periodKey);
  }
  await updateDoc(companyDoc(db, "payrollCorrections", latest.id), {
    status: "Open",
    approvedBy: performedBy,
    approvedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return true;
}
