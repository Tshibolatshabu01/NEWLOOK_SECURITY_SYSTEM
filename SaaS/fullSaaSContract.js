/**
 * NEWLOOK Full SaaS Enterprise Contract
 * Single source of truth for module boundaries, tenant ownership and entrypoints.
 * This file does not replace any existing application module.
 */
export const NEWLOOK_SAAS_CONTRACT = Object.freeze({
  tenantRoot: "companies/{companyId}",
  identity: "users/{uid}",
  roles: Object.freeze(["super_admin","company_admin","operations_manager","supervisor"]),
  company: Object.freeze({
    entrypoint: "admin.html",
    modules: Object.freeze({
      dashboard: {section:"dashboard", permissions:["dashboard"]},
      guards: {section:"guards", permissions:["guards"], collection:"guards"},
      sites: {section:"sites", permissions:["sites"], collection:"sites"},
      shifts: {section:"shifts", permissions:["shifts"], collection:"shifts"},
      attendance: {section:"attendance", permissions:["attendance"], collections:["attendance","attendanceRecords"]},
      reports: {section:"reports", permissions:["reports"]},
      patrols: {section:"patrols", permissions:["patrols"], collection:"patrols"},
      visitors: {section:"visitors", permissions:["visitors"], collection:"visitors"},
      incidents: {section:"incidents", permissions:["incidents"], collection:"incidents"},
      panic: {section:"panic", permissions:["panic"], collection:"panicAlerts"},
      analytics: {section:"analytics", permissions:["analytics"]},
      devices: {section:"devices", permissions:["devices"], collection:"devices"},
      broadcast: {section:"broadcast", permissions:["broadcasts"], collections:["broadcasts","broadcastReplies","broadcastReads"]},
      notifications: {section:"notifications", permissions:["notifications"], collection:"notifications"},
      support: {section:"support", permissions:["support"], collection:"supportTickets"},
      users: {section:"users", permissions:["users"], collection:"../users"},
      operations: {section:"operations", permissions:["operations"]},
      payroll: {section:"payroll", permissions:["payroll"], entrypoint:"payroll.html", collections:["payroll","shiftRecords","attendanceRecords"]},
      documents: {section:"documents", permissions:["documents"], collection:"documents"},
      settings: {section:"settings", permissions:["settings"], collection:"companies/{companyId}"}
    })
  }),
  operationalApps: Object.freeze({
    guard: {entrypoint:"guard.html", source:"Security", payrollSource:"shiftRecords"},
    attendance: {entrypoint:"attendance.html", source:"Staff", payrollSource:"attendanceRecords"},
    payroll: {entrypoint:"payroll.html", sources:["shiftRecords","attendanceRecords"]},
    superAdmin: {entrypoint:"superAdmin/superadmin.html", scope:"platform"}
  }),
  forbiddenOperationalBehavior: Object.freeze(["site-radius blocking for Guard/Attendance actions"]),
  companyScopedCollections: Object.freeze(["guards","sites","shifts","checkpoints","attendance","attendanceRecords","shiftRecords","patrols","visitors","incidents","panicAlerts","broadcasts","broadcastReplies","broadcastReads","notifications","supportTickets","documents","devices","auditLogs","payroll"])
});

export function assertCompanyContext(companyId) {
  if (!companyId || typeof companyId !== "string") throw new Error("NEWLOOK: active companyId is required.");
  return companyId;
}

export function stampTenant(data, companyId) {
  return {...data, companyId: assertCompanyContext(companyId)};
}

export function getSaaSModule(id) {
  return NEWLOOK_SAAS_CONTRACT.company.modules[id] || null;
}

if (typeof window !== "undefined") window.NEWLOOK_SAAS_CONTRACT = NEWLOOK_SAAS_CONTRACT;
