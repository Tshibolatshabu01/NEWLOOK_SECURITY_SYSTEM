import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const rules = fs.readFileSync(path.join(root, 'firestore.rules'), 'utf8');
const admin = fs.readFileSync(path.join(root, 'Js', 'admin.js'), 'utf8');
const guard = fs.readFileSync(path.join(root, 'Js', 'guard.js'), 'utf8');
const attendance = fs.readFileSync(path.join(root, 'Js', 'attendance.js'), 'utf8');
const payroll = fs.readFileSync(path.join(root, 'Js', 'payroll.js'), 'utf8');

const checks = [
  ['No broad company catch-all rule', !/match\s+\/\{col\}\/\{id\}/.test(rules)],
  ['Registration get/list separated', /allow get:[^;]+anonymous/.test(rules) && /allow list:[^;]+companyAdmin/.test(rules)],
  ['Anonymous registration requires expiry', /anonymous[^;]+expiresAt > request\.time/.test(rules)],
  ['Guard source requires Security', /match \/shiftRecords/.test(rules) && /department in \['Security','security'\]/.test(rules)],
  ['Attendance source requires Staff', /match \/attendanceRecords/.test(rules) && /department in \['Staff','staff'\]/.test(rules)],
  ['Guard source requires active employee', /shiftRecords[\s\S]{0,1200}status in \['Active','active'\]/.test(rules)],
  ['Attendance source requires active employee', /attendanceRecords[\s\S]{0,1200}status in \['Active','active'\]/.test(rules)],
  ['Locked payroll field whitelist', /paymentStatus.*paidAt.*paymentBatchId.*bankPaymentReference/.test(rules)],
  ['Salary history immutable', /match \/salaryHistory\/\{id\}[\s\S]{0,600}allow update, delete: if false/.test(rules)],
  ['Payroll journal immutable', /match \/payrollJournals\/\{id\}[\s\S]{0,500}allow update, delete: if false/.test(rules)],
  ['Admin employee tenant identity', /companyId:\s*getCompanyId\(\)/.test(admin)],
  ['Guard records stamp tenant identity', /companyId:\s*getCompanyId\(\)/.test(guard)],
  ['Attendance records stamp tenant identity', /companyId:\s*getCompanyId\(\)/.test(attendance)],
  ['Payroll records stamp tenant identity', /companyId:\s*getCompanyId\(\)/.test(payroll)],
];

let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) failed++;
}
if (rules.split('{').length !== rules.split('}').length || rules.split('(').length !== rules.split(')').length) {
  console.error('FAIL  Firestore rules structural delimiter balance');
  failed++;
} else {
  console.log('PASS  Firestore rules structural delimiter balance');
}
process.exitCode = failed ? 1 : 0;
