# YOURI SaaS V10 — Senior Release QA

## Source of truth
`YOURI_SaaS_2.0_V10_FULL_OPERATIONAL_CSS_REDESIGN.zip`

## Completion status
**Customer-ready release candidate — static engineering gate passed.**

## Architecture
- `SaasLogin.html` is the single administrative login.
- `users/{uid}` is the source of truth for account identity, role and company assignment.
- Customer data is tenant-scoped under `companies/{companyId}/...`.
- Supported administrative roles: `super_admin`, `company_admin`, `operations_manager`, `supervisor`.
- Guard and Attendance remain separate field applications.
- `shiftRecords` remains the Guard -> Payroll source.
- `attendanceRecords` remains the Attendance -> Payroll source.
- `attendance` remains operational/live attendance data.

## Super Admin
- Tenant provisioning and Company Admin provisioning.
- Tenant activation/suspension.
- Subscription plan administration.
- Subscription renewal with explicit renewal period.
- Customer notifications.
- Support queue and responses.
- Tenant activity/audit review.
- Platform notification control.

## Customer
- Role-based operational navigation.
- Guard/site/shift/attendance/report operations.
- Patrols, visitors, incidents, panic and broadcast.
- Device management for authorized roles.
- Team Access for Company Admin.
- Payroll for Company Admin and Operations Manager.
- Company Settings for Company Admin.
- Customer notifications with per-user read state support.
- Support ticket creation and follow-up.

## Security hardening completed
- User self-service updates can no longer change role, company assignment or account status.
- Company Admin management-user updates are limited to safe profile/status fields.
- Company user listing is tenant-filtered with a Firestore `companyId` query.
- Device management navigation is permission-controlled.
- Device registration reads are no longer unrestricted across all registration records.
- Super Admin notifications can only be created/changed by Super Admin.
- Firebase Hosting security headers added.
- Subscription plan assignment and active-plan validation enforced during administrative session loading.
- Expired subscriptions now require explicit renewal rather than simple reactivation.

## Static QA
- JavaScript syntax check: PASS for all project `.js` files.
- Local HTML dependency/reference check: PASS.
- Duplicate HTML ID check: PASS.
- Legacy `login.html`: absent.
- Invalid content after `</html>`: removed from `admin.html`.
- OS metadata files removed from customer release.

## Live production gate
The following must be executed against the real Firebase project before production launch:
1. Deploy Firestore rules and indexes.
2. Deploy Firebase Hosting.
3. Confirm Email/Password authentication.
4. Confirm Anonymous Authentication for field devices.
5. Create/verify the initial Super Admin profile.
6. Test Company A and Company B tenant isolation.
7. Test all four administrative roles.
8. Test device registration -> claim -> Guard/Attendance activation.
9. Verify Guard -> `shiftRecords`.
10. Verify Attendance -> `attendanceRecords`.
11. Verify Payroll source traceability and permissions.
12. Test suspension, expiry and renewal.
13. Test support and customer notifications.
14. Test production payment webhook if recurring billing is enabled.

## Production security boundary
The Firebase Web configuration is intentionally client-visible. No service-account private key, payment secret or privileged server credential may be placed in browser code. Recurring payment verification requires a trusted server/webhook endpoint.
