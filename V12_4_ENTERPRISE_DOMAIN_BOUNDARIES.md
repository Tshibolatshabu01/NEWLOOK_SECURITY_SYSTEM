# NEWLOOK SaaS V12.4 — Enterprise Domain Boundary Migration

## Purpose
Continue the V10-preserving enterprise rebuild without replacing the original application workflows.

## V12.4 changes
- Migrated Super Admin Firestore construction behind `SaaS/apps/superAdmin/service.js`.
- Added explicit platform and tenant-scoped Firestore reference factories.
- Preserved cross-tenant Super Admin visibility while keeping tenant paths explicit.
- Preserved `users/{uid}` as the identity source of truth.
- Preserved Security → Guard → `shiftRecords` and Staff → Attendance → `attendanceRecords` payroll source boundaries.
- Preserved all original Admin, Guard, Attendance and Payroll entrypoints and business logic.

## Validation target
- JavaScript syntax
- local module imports
- HTML script references
- raw Firestore construction audit for Super Admin
- payroll source contract audit
- ZIP integrity
