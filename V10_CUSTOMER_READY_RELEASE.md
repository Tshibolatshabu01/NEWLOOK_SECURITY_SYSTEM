# YOURI SaaS V10 — Customer Ready Release

## Product scope
YOURI SaaS is a multi-tenant security operations platform for customer companies. The release contains the Super Admin platform control center and the customer Company Operations workspace.

## Administrative roles
- `super_admin`: platform-level tenant, plan, support, notification and activity administration.
- `company_admin`: full company administration, team access, devices and payroll.
- `operations_manager`: operational management, devices and payroll read access.
- `supervisor`: operational supervision without company administration, devices or payroll administration.

## Tenant boundary
Customer data is stored below `companies/{companyId}/...`. The `users/{uid}` document is the source of truth for account role and company assignment.

## Protected application contracts
- Guard application remains separate and does not require administrative login.
- Attendance application remains separate and does not require administrative login.
- `shiftRecords` is reserved for Guard output consumed by Payroll.
- `attendanceRecords` is reserved for Attendance output consumed by Payroll.
- `attendance` remains the operational attendance collection.

## Super Admin operating model
1. Create/maintain subscription plans.
2. Create a customer company and provision its Company Admin.
3. Assign/renew the company subscription.
4. Suspend or reactivate a tenant.
5. Send customer notifications.
6. Resolve support tickets.
7. Review tenant activity/audit records.

## Customer operating model
1. Company Admin signs in through `SaasLogin.html`.
2. Company Admin configures company identity and team access.
3. Operations Manager/Supervisor receive only their permitted operational areas.
4. Authorized managers register Guard/Attendance devices.
5. Devices are activated through the registration/setup flow.
6. Guard and Attendance continue to produce their protected source records.
7. Payroll consumes those source records without repurposing them.

## Production acceptance
Before declaring a live deployment complete, test the following against the actual Firebase project:
- Email/password authentication.
- Anonymous authentication for field devices.
- Initial Super Admin profile.
- Firestore rules deployment.
- Company A/B tenant isolation.
- All four administrative roles.
- Company suspension and subscription expiry.
- Subscription renewal.
- Device registration, claim and revocation.
- Guard -> `shiftRecords`.
- Attendance -> `attendanceRecords`.
- Payroll source traceability.
- Support ticket creation and response.
- Customer notifications and per-user read state.
- Production payment webhook, if recurring billing is enabled.

## Security note
The browser application contains only the Firebase Web configuration. No payment secret, service-account credential or privileged server credential should be placed in client-side files. Recurring payment verification must be performed by a trusted server/webhook endpoint.

## Release status
This package is the V10 customer-ready release candidate after static code, navigation, tenant-boundary and security hardening. Live Firebase acceptance remains the final deployment gate.
