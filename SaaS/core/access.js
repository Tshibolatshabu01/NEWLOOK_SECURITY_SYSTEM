import { normalizeRole } from '../permissions.js';
export const ADMIN_ROLES=Object.freeze(['company_admin','operations_manager','supervisor']);
export const DEVICE_ROLES=Object.freeze(['guard_device','attendance_device']);
export const PAYROLL_ROLES=Object.freeze(['company_admin','operations_manager']);
export function roleOf(session){ return normalizeRole(session?.role); }
export function requireRole(session, allowed){ const r=roleOf(session); if(!allowed.includes(r)) throw new Error('NEWLOOK: insufficient permissions.'); return r; }
export function can(role, capability){ const r=normalizeRole(role); const map={manage_users:['company_admin'],manage_devices:['company_admin','operations_manager'],manage_payroll:['company_admin','operations_manager'],approve_payments:['company_admin'],operate:['company_admin','operations_manager','supervisor']}; return map[capability]?.includes(r)===true; }
