# NEWLOOK V14.3 Full SaaS Enterprise Synchronization QA

## Scope
Preserves the existing Admin, Guard, Attendance, Payroll and Super Admin applications while hardening the shared company/tenant contract.

## Module map
- Company/Admin: `admin.html`
- Guard: `guard.html`
- Staff Attendance: `attendance.html`
- Payroll: `payroll.html`
- Super Admin: `superAdmin/superadmin.html`
- Identity: `users/{uid}`
- Tenant root: `companies/{companyId}`

## Payroll source contracts
- Security Payroll: `shiftRecords`
- Staff Payroll: `attendanceRecords`
- These collections are not reused as general operational collections.

## Tenant integrity
Operational creates now require `request.resource.data.companyId == c` and operational updates preserve the tenant companyId. Deletes require the existing record to belong to the tenant. Notifications also require companyId on create.

## Reports
Company reports now support Operations, Guards, Sites, Attendance, Patrols, Visitors, Incidents, Panic Alerts, Payroll, Security Payroll Source and Staff Payroll Source. CSV generation uses normalized header/value rows and no longer attempts `.map()` on object records.

## Customer readiness
Static architecture hardening is complete for this release. Live Firebase acceptance testing remains required before a production launch.
