const aliases = {
  superadmin: "super_admin",
  superAdmin: "super_admin",
  companyAdmin: "company_admin",
  admin: "company_admin",
  manager: "operations_manager",
  operationsManager: "operations_manager",
  team_leader: "supervisor"
};

export const normalizeRole = role => aliases[role] || String(role || "").trim().toLowerCase();
export const isSuperAdmin = role => normalizeRole(role) === "super_admin";
export const isManagement = role => ["company_admin", "operations_manager", "supervisor"].includes(normalizeRole(role));
export const isCompanyAdmin = role => normalizeRole(role) === "company_admin";
export const isOperationsManager = role => normalizeRole(role) === "operations_manager";
export const isSupervisor = role => normalizeRole(role) === "supervisor";
export const canManageUsers = role => ["company_admin"].includes(normalizeRole(role));
export const canManageDevices = role => ["company_admin", "operations_manager"].includes(normalizeRole(role));

export const ROLE_PERMISSIONS = {
  company_admin: ["dashboard","guards","sites","shifts","attendance","patrols","visitors","incidents","panic","broadcasts","payroll","reports","devices","users","settings","notifications","support"],
  operations_manager: ["dashboard","guards","sites","shifts","attendance","patrols","visitors","incidents","panic","broadcasts","reports","devices","notifications","support","payroll"],
  supervisor: ["dashboard","attendance","patrols","visitors","incidents","panic","broadcasts","reports","notifications","support"],
  super_admin: ["platform"]
};

export const hasPermission = (role, permission) => ROLE_PERMISSIONS[normalizeRole(role)]?.includes(permission) === true;
