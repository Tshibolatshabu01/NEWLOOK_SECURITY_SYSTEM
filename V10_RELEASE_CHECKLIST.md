# NEWLOOK SaaS V10 — Senior Release Checklist

## Source of truth
- Current baseline: `NEWLOOK_SaaS_2.0_V10_PAYROLL_CONNECTED_FINAL2.zip`
- Do not substitute V10.1.

## Protected applications
- `guard.html`, `Js/guard.js`, `Css/guard.css` remain existing Guard application code.
- `attendance.html`, `Js/attendance.js`, `Css/attendance.css` remain existing Attendance application code.
- SaaS changes connect around these applications; their business workflows are not redesigned.

## Payroll source ownership
- `companies/{companyId}/shiftRecords` = Guard.html / guard.js shift-report source for Payroll.
- `companies/{companyId}/attendanceRecords` = attendance.html / attendance.js attendance-report source for Payroll.
- `companies/{companyId}/attendance` = operational/live attendance; it is not the Payroll source replacement.

## Tenant/security
- Administrative identity comes from `users/{uid}`.
- Company data is under `companies/{companyId}/...`.
- Roles: `super_admin`, `company_admin`, `operations_manager`, `supervisor`.
- Guard/Attendance devices use anonymous Firebase auth plus an authorized company device record.
- Device type is constrained to `guard` or `attendance` and must match the application setup target.
- Payroll writes require an active tenant/plan and Company Admin (or Super Admin).

## Operational QA required before production
1. Verify Firebase Web API key/project match in the deployed environment.
2. Verify Email/Password Auth is enabled.
3. Verify initial Super Admin `users/{uid}` profile.
4. Deploy and test Firestore rules.
5. Test company A/B tenant isolation.
6. Test each role and logout.
7. Test device registration → setup → Guard.
8. Test device registration → setup → Attendance.
9. Test Guard → shiftRecords.
10. Test Attendance → attendanceRecords.
11. Test Payroll period filtering and source traceability.
12. Test action buttons, notifications and support end-to-end.
13. Test subscription expiration and inactive-plan behavior.
