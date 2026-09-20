// Canonical NEWLOOK roles only. Legacy role aliases are intentionally not accepted.
export const normalizeRole = role => String(role || '').trim().toLowerCase();
export const isSuperAdmin = role => normalizeRole(role) === 'super_admin';
export const isManagement = role => ['company_admin','operations_manager','supervisor'].includes(normalizeRole(role));
export const isCompanyAdmin = role => normalizeRole(role) === 'company_admin';
export const isOperationsManager = role => normalizeRole(role) === 'operations_manager';
export const isSupervisor = role => normalizeRole(role) === 'supervisor';
export const canManageUsers = role => isCompanyAdmin(role);
export const canManageDevices = role => ['company_admin','operations_manager'].includes(normalizeRole(role));

export const ROLE_PERMISSIONS = {
  company_admin:[
    'dashboard','guards','sites','shifts','attendance','reports','analytics','patrols','visitors','incidents','panic','broadcasts',
    'devices','notifications','support','users','operations','payroll','documents','settings'
  ],
  operations_manager:[
    'dashboard','guards','sites','shifts','attendance','reports','analytics','patrols','visitors','incidents','panic','broadcasts',
    'devices','notifications','support','operations','payroll','documents'
  ],
  supervisor:[
    'dashboard','attendance','reports','analytics','patrols','visitors','incidents','panic','broadcasts','notifications','support','operations'
  ],
  super_admin:['platform']
};

export const hasPermission = (role, permission) => ROLE_PERMISSIONS[normalizeRole(role)]?.includes(permission) === true;
