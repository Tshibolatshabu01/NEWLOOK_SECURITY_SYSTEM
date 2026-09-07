# NEWLOOK SaaS V12 — Enterprise Structured Rebuild

## Principle
V10 remains the functional source of truth. The existing Guard, Attendance, Admin and Payroll entrypoints, business workflows, DOM IDs, collections and payroll source contracts are preserved. V12 adds a shared enterprise application kernel and canonical contracts around those systems instead of replacing them with simplified applications.

## Application boundaries
- Admin: customer administration and operational configuration.
- Guard: physical security operations; writes Security payroll source `shiftRecords`.
- Attendance: staff attendance and face recognition; writes Staff payroll source `attendanceRecords`.
- Payroll: consumes the two payroll source contracts and runs the existing payroll engines.
- Super Admin: platform/customer/subscription administration.
- SaaS core: identity, tenant context, RBAC, repository and audit primitives.

## Tenant contract
All customer data is under `companies/{companyId}/...`. `users/{uid}` remains the identity source for email, role and company assignment.

## Payroll source contract
Security -> Guard -> `shiftRecords` -> Payroll.
Staff -> Attendance -> `attendanceRecords` -> Payroll.
These collections are not general operational collections.

## Rebuild strategy
1. Preserve current functional code.
2. Centralize contracts and tenant primitives.
3. Keep compatibility signatures in `Js/firebase.js`.
4. Move new enterprise services through `SaaS/core`.
5. Add integration incrementally; do not duplicate application logic.
6. Validate static paths/syntax before release.

## Production gate
Static QA is not a substitute for live Firebase authorization tests. A Firebase Emulator or dedicated staging project is required to certify cross-tenant, role, device and payroll security behavior.
