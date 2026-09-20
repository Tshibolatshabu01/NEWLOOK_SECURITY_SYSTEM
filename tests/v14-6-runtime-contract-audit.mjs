#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const pass = [];
const fail = [];
const note = [];
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const exists = p => fs.existsSync(path.join(root, p));
const check = (name, condition) => (condition ? pass.push(name) : fail.push(name));

// Entrypoint and shared-kernel contracts.
check('Shared Firebase kernel exports tenant helpers', /export \{[^}]*companyCollection[^}]*companyDoc[^}]*getCompanyId/.test(read('Js/firebase.js')));
check('Canonical login entrypoint preserved', exists('SaasLogin.html') && /SaasLogin\.html/.test(read('Js/auth.js')));
check('Canonical role set preserved', ['super_admin','company_admin','operations_manager','supervisor'].every(r => read('SaaS/permissions.js').includes(`'${r}'`) || read('SaaS/permissions.js').includes(`"${r}"`)));
check('No legacy admin role authorization', !/['"]admin['"]|['"]manager['"]|['"]team_leader['"]/.test(read('SaaS/permissions.js')));

// Existing application/service boundaries.
const modules = [
  ['Admin', 'Js/admin.js', 'SaaS/apps/admin/service.js'],
  ['Guard', 'Js/guard.js', 'SaaS/apps/guard/service.js'],
  ['Attendance', 'Js/attendance.js', 'SaaS/apps/attendance/service.js'],
  ['Payroll', 'Js/payroll.js', 'SaaS/apps/payroll/service.js']
];
for (const [name, app, service] of modules) {
  const a = read(app), s = read(service);
  check(`${name} module imports its enterprise service boundary`, a.includes(service.split('/').pop()));
  check(`${name} service asserts tenant context`, /assertTenant\(getCompanyId\(\)\)/.test(s));
}

// Source contracts.
const contracts = read('SaaS/core/contracts.js');
check('Security payroll source is shiftRecords', /SHIFT_RECORDS/.test(contracts) && /shiftRecords/.test(contracts));
check('Staff payroll source is attendanceRecords', /ATTENDANCE_RECORDS/.test(contracts) && /attendanceRecords/.test(contracts));
check('Guard has no site-radius enforcement', !/(siteRadius|radiusRequired|withinRadius|geofence|distanceToSite|siteDistance|distanceFromSite)/i.test(read('Js/guard.js')));
check('Attendance has no site-radius enforcement', !/(siteRadius|radiusRequired|withinRadius|geofence|distanceToSite|siteDistance|distanceFromSite)/i.test(read('Js/attendance.js')));

// Tenant stamping in critical write paths.
for (const [name, file] of [['Admin','Js/admin.js'],['Guard','Js/guard.js'],['Attendance','Js/attendance.js'],['Payroll','Js/payroll.js']]) {
  check(`${name} contains companyId tenant stamping`, /companyId\s*:\s*getCompanyId\(\)/.test(read(file)));
}

// Public website boundary.
const web = read('Js/website.js');
const rules = read('firestore.rules');
check('Public website writes only publicLeads', /collection\(db,\s*["']publicLeads["']\)/.test(web));
check('Public lead client validates email format', /emailOk/.test(web) && /\^\[\^\\s@\]\+@/.test(web));
check('Public lead Firestore rule constrains fields', /request\.resource\.data\.keys\(\)\.hasOnly/.test(rules));
check('Public lead Firestore rule requires server timestamp', /publicLeads\/\{id\}[\s\S]*createdAt == request\.time/.test(rules));

// Required enterprise surfaces.
const contract = read('SaaS/fullSaaSContract.js');
for (const section of ['dashboard','guards','sites','shifts','attendance','reports','patrols','visitors','incidents','panic','analytics','devices','broadcast','notifications','support','users','operations','payroll','documents','settings']) {
  check(`Company contract contains ${section}`, contract.includes(`${section}:`));
}
for (const section of ['Companies','Users','Plans','Support','Notifications','Activity','Devices','Security','Features','System Health','Customer Success','Onboarding Center','Service Management','Data Management','Backup & Recovery','API & Integrations','Email & Communications','Platform Automation','System Logs']) {
  check(`Super Admin source contains ${section}`, read('superAdmin/superadmin.js').includes(section) || read('superAdmin/enterpriseExpansion.js').includes(section));
}

// Syntax/runtime limitation is explicit.
note.push('This audit verifies source-level integration contracts. Firebase Authentication, Firestore Rules, realtime listeners, anonymous device activation, face verification, and payroll execution still require Firebase Emulator or dedicated staging credentials for live acceptance.');

for (const x of pass) console.log(`PASS  ${x}`);
for (const x of fail) console.log(`FAIL  ${x}`);
for (const x of note) console.log(`NOTE  ${x}`);
console.log(`SUMMARY PASS=${pass.length} FAIL=${fail.length}`);
process.exitCode = fail.length ? 1 : 0;
