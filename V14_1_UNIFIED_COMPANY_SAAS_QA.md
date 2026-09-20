# NEWLOOK V14.1 Unified Company SaaS QA

## Scope
The Company SaaS layer was unified without replacing the existing Guard, Attendance, Admin or Payroll operational modules.

## Company navigation
The intended Company SaaS navigation is now 20 sections:
1. Dashboard
2. Guard Management
3. Site Management
4. Shift Management
5. Attendance
6. Reports
7. Patrol Monitoring
8. Visitors
9. Incidents
10. Panic Alerts
11. Analytics
12. Device Management
13. Broadcast
14. Notifications
15. Support
16. Users & Access
17. Operations Control
18. Payroll
19. Documents
20. Company Settings

## Synchronisation controls
- One tenant session source: `users/{uid}` + `companies/{companyId}`.
- One role normalization and permission map in `SaaS/permissions.js`.
- Navigation permissions are mapped in `SaaS/navigation.js`.
- Customer SaaS extensions are owned by `SaaS/customerSaaSControl.js`.
- `SaaS/enterpriseExpansion.js` is retained only as a compatibility bridge and no longer creates duplicate menus.
- Existing Admin operational sections remain in `admin.html`.
- Payroll remains a dedicated module and is linked without changing its source contracts.
- `shiftRecords` remains Security Payroll source; `attendanceRecords` remains Staff Payroll source.
- Device Management now has a real matching page for the existing sidebar item.
- Notifications and Support remain tenant-scoped.
- Company Settings writes only the company document and remains Company Admin-only.

## Static validation targets
- All relative JS imports resolve.
- JavaScript syntax checks pass.
- No duplicate Company SaaS menu creation paths remain.
- No `login.html` redirect introduced by this change.
- No site-radius verification is reintroduced.

## Live acceptance
Firebase staging/emulator acceptance is still required for real Firestore permission, realtime listener, device registration, and production account workflows. Static QA cannot substitute for live Firebase acceptance.
