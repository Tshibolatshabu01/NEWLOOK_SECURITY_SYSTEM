# NEWLOOK SaaS V12.1 — Enterprise Structured Rebuild

## Source of truth
This release is built from the supplied V10 One-Time Device Activation FIXED package and retains its complete application/file set.

## Rebuild strategy
- Preserve existing V10 Admin, Guard, Attendance and Payroll code and DOM contracts.
- Preserve the complete V10 Super Admin implementation.
- Preserve all existing payroll engines and accounting/statutory modules.
- Preserve one-time Guard/Attendance device activation.
- Preserve `users/{uid}` as the account identity source of truth.
- Preserve company tenant isolation under `companies/{companyId}/...`.
- Add explicit enterprise service boundaries and shared core contracts.
- Do not repurpose payroll source collections.

## Payroll source contract
- Security / Guard -> `shiftRecords` -> Payroll.
- Staff / Attendance -> `attendanceRecords` -> Payroll.

These collections remain reserved for payroll source processing and are not used as generic operational logs.

## Application surfaces
Customer side: SaasLogin, Admin, Company Users, Devices, Guard, Attendance, Payroll and all existing operational/reporting pages.

Platform side: Super Admin, Companies, subscriptions/plans, support, notifications, activity/audit and existing enterprise controls.

## Release rule
This is a structured refactor layer, not a rewrite that discards V10 functionality. Future work should continue refactoring individual V10 modules behind these boundaries while keeping their public DOM/business contracts stable.
