#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const passes = [];
const note = [];
const ok = (name) => passes.push(name);
const fail = (name) => failures.push(name);
const read = (p) => fs.readFileSync(path.join(root,p),'utf8');

// 1. Required entrypoints
for (const p of ['index.html','SaasLogin.html','admin.html','guard.html','attendance.html','payroll.html','superAdmin/superadmin.html']) {
  fs.existsSync(path.join(root,p)) ? ok(`Entrypoint exists: ${p}`) : fail(`Missing entrypoint: ${p}`);
}

// 2. Local HTML resource references
for (const html of fs.readdirSync(root).filter(f=>f.endsWith('.html')).concat(['superAdmin/superadmin.html'])) {
  const abs = path.join(root,html);
  if (!fs.existsSync(abs)) continue;
  const s = fs.readFileSync(abs,'utf8');
  for (const m of s.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
    const ref = m[1].split(/[?#]/)[0];
    if (!ref || /^(https?:|mailto:|#|data:|javascript:)/i.test(ref)) continue;
    const target = path.normalize(path.join(path.dirname(html),ref));
    if (!fs.existsSync(path.join(root,target))) fail(`Broken local resource: ${html} -> ${ref}`);
  }
}
if (!failures.some(x=>x.startsWith('Broken local resource'))) ok('All local HTML resources resolve');

// 3. Duplicate IDs per HTML file
for (const html of ['index.html','SaasLogin.html','admin.html','guard.html','attendance.html','payroll.html','company-users.html','device-registration.html','device-setup.html','superAdmin/superadmin.html']) {
  if (!fs.existsSync(path.join(root,html))) continue;
  const s = read(html); const counts = new Map();
  for (const m of s.matchAll(/\bid=["']([^"']+)["']/g)) counts.set(m[1],(counts.get(m[1])||0)+1);
  for (const [id,n] of counts) if (n>1) fail(`Duplicate HTML id in ${html}: ${id} (${n})`);
}
if (!failures.some(x=>x.startsWith('Duplicate HTML id'))) ok('No duplicate IDs in audited HTML entrypoints');

// 4. Canonical roles only
const roles = read('SaaS/permissions.js');
const rules = read('firestore.rules');
if (/\b(admin|manager|team_leader|companyAdmin|operationsManager|superAdmin)\b/.test(roles)) fail('Legacy role alias remains in SaaS/permissions.js');
else ok('Client RBAC uses canonical roles only');
if (/role\(\) in \[[^\]]*(admin|manager|team_leader|companyAdmin|operationsManager|superAdmin)/.test(rules)) fail('Legacy role alias remains in Firestore role predicates');
else ok('Firestore RBAC predicates use canonical roles');

// 5. Payroll source contract
const contract = read('SaaS/core/contracts.js');
const payroll = read('Js/payroll.js');
if (contract.includes("collection:COLLECTIONS.SHIFT_RECORDS") && contract.includes("collection:COLLECTIONS.ATTENDANCE_RECORDS") && payroll.includes('shiftRecords') && payroll.includes('attendanceRecords')) ok('Payroll source contract preserved: shiftRecords + attendanceRecords');
else fail('Payroll source contract is incomplete');

// 6. Radius blocking guardrail: calculation may exist for operational site selection, but action gating must not use it.
const guard = read('Js/guard.js');
const attendance = read('Js/attendance.js');
for (const [name,s] of [['Guard',guard],['Attendance',attendance]]) {
  const forbidden = /(?:siteRadius|radiusRequired|withinRadius|geofence|distanceToSite|siteDistance|distanceFromSite)/i.test(s);
  if (forbidden) fail(`${name} contains a site-radius enforcement symbol`);
  else ok(`${name} has no site-radius enforcement symbol`);
}

// 7. Public lead security contract
if (rules.includes('match /publicLeads/{id}') && rules.includes('request.resource.data.status == "new"') && rules.includes('request.resource.data.createdAt == request.time')) ok('Public lead creation is server-time/status constrained');
else fail('Public lead rule hardening incomplete');

// 8. Firestore static security audit
const security = fs.existsSync(path.join(root,'tests/static-security-audit.mjs')) ? read('tests/static-security-audit.mjs') : '';
if (security) ok('Existing Firestore static security audit harness present'); else fail('Existing Firestore static security audit harness missing');

// 9. Version/source markers
const version = JSON.parse(read('VERSION.json'));
if (version.publicWebsite?.entrypoint === 'index.html' && version.tenantModel === 'companies/{companyId}' && version.identitySource === 'users/{uid}') ok('Version metadata matches tenant and public website architecture');
else fail('Version metadata does not match canonical architecture');

// 10. Runtime limitation explicitly tracked
note.push('Live Firebase Authentication/Firestore acceptance requires deployment or Firebase Emulator/staging credentials; static checks cannot prove runtime permissions, realtime listeners, device activation or payroll execution.');

for (const p of passes) console.log(`PASS  ${p}`);
for (const f of failures) console.log(`FAIL  ${f}`);
for (const n of note) console.log(`NOTE  ${n}`);
console.log(`SUMMARY PASS=${passes.length} FAIL=${failures.length}`);
process.exitCode = failures.length ? 1 : 0;
