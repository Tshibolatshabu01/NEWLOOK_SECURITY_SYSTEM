# NEWLOOK V12.2 Application Boundaries

V10 remains the functional source of truth. V12.2 introduces real service boundaries and tenant guards without replacing existing DOM, workflows or payroll engines.

| Domain | Entrypoint | Service | Scope |
|---|---|---|---|
| Customer Admin | admin.html / Js/admin.js | SaaS/apps/admin/service.js | Tenant |
| Guard | guard.html / Js/guard.js | SaaS/apps/guard/service.js | Device + tenant |
| Attendance | attendance.html / Js/attendance.js | SaaS/apps/attendance/service.js | Device + tenant |
| Payroll | payroll.html / Js/payroll.js + engines | SaaS/apps/payroll/service.js | Tenant + source contracts |
| Super Admin | superAdmin/superadmin.html | SaaS/apps/superAdmin/service.js | Platform |

## Payroll source contracts

- Security / Guard writes `shiftRecords`.
- Staff / Attendance writes `attendanceRecords`.
- Payroll consumes both source streams.
- Neither source collection is used as a generic operational log.

## Refactor rule

Existing application functions remain authoritative. New services are the controlled boundary for new/refactored operations and must not create duplicate collection names or alternate identity stores.
