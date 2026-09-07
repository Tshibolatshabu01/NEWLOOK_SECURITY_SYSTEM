# NEWLOOK SaaS V10 — Enterprise Sections Expansion

## Super Admin
Added: Overview, Companies, Users, Subscriptions, Plans, Billing & Payments, Analytics, Reports, Devices, Security, Features, Support, Notifications, Audit & Activity, System Health, Settings.

## Company Administration
Added: Users & Access, Operations Control, Payroll entry point, Documents, Company Settings, while preserving existing Guard, Site, Shift, Attendance, Patrol, Visitor, Incident, Panic, Reports, Analytics, Device and Broadcast modules.

## Payroll contract
`shiftRecords` and `attendanceRecords` remain dedicated payroll source collections. The Operations Control dashboard intentionally excludes those collections.

## Tenant model
The expansion continues to use `users/{uid}` for identity and `companies/{companyId}/...` for tenant-scoped data.


## V10.1 Production Functionality Hardening
- Users & Access reads the top-level `users/{uid}` identity source filtered by `companyId`; it does not assume `companies/{companyId}/users`.
- Operations Control uses live tenant operational collections and uses `panicAlerts` for emergency events.
- Payroll remains a dedicated environment; `shiftRecords` and `attendanceRecords` remain payroll source contracts.
- Operations Manager has payroll read/report access; Company Admin retains payroll processing authority.
