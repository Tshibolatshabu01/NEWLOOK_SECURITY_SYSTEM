import { hasPermission, normalizeRole } from './permissions.js';

const SECTION_PERMISSION = {
  dashboard: 'dashboard', guards: 'guards', sites: 'sites', shifts: 'shifts',
  attendance: 'attendance', reports: 'reports', patrols: 'patrols', visitors: 'visitors',
  incidents: 'incidents', panic: 'panic', analytics: 'reports', broadcast: 'broadcasts', notifications: 'notifications', support: 'support', devices: 'devices', payroll: 'payroll', users: 'users', settings: 'settings', support: 'support', notifications: 'notifications', documents: 'documents', operations: 'reports'
};

export function applyRoleNavigation(role) {
  const normalized = normalizeRole(role);
  document.querySelectorAll('.menu li[data-section]').forEach(item => {
    const section = item.dataset.section;
    const permission = SECTION_PERMISSION[section];
    if (permission && !hasPermission(normalized, permission)) item.hidden = true;
  });
}

export function canAccessSection(role, section) {
  const permission = SECTION_PERMISSION[section];
  return !permission || hasPermission(role, permission);
}
