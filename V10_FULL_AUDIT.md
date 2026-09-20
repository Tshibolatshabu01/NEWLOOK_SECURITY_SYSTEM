# YOURI SaaS V10 Full Audit

Source: YOURI_SaaS_2.0_V10_PAYROLL_CONNECTED_FINAL2.zip

## Baseline
- Current V10 structure preserved.
- Current CSS preserved.
- Module scripts corrected to `type="module"` where required.

## Authentication
- SaasLogin.html is canonical admin login.
- users/{uid} is profile/role/company source.
- super_admin does not require companyId.
- Company roles require companyId and active company/subscription/plan.

## Device
- Guard and Attendance authorize through deviceAuth.
- Expected device type is enforced client-side and by device data validation flow.
- Device registration claim uses Firestore getAfter() authorization.

## Customer support/notifications
- Customer supportTickets are company scoped.
- Customer notifications are company scoped.
- Super Admin has platform notifications and support access.

## Static checks
- All local HTML references verified.
- Duplicate static HTML IDs removed/identified where applicable.
- Module script loading corrected.
