# YOURI Security Software — Enterprise SaaS Customer Build

This build uses the original YOURI operational applications as the foundation and adds a clean multi-tenant SaaS control layer.

## Core applications
- `admin.html` — company operations platform
- `guard.html` — field guard application
- `attendance.html` — attendance / face recognition
- `payroll.html` — payroll management

## SaaS control
- `SaasLogin.html` — single administrative login
- `superAdmin/superadmin.html` — platform control center
- `company-users.html` — Company Admin team access
- `device-registration.html` / `device-setup.html` — field device lifecycle

## Identity model
`users/{uid}` is the single source of truth for administrative identity, role and company assignment.

Supported administrative roles:
- `super_admin`
- `company_admin`
- `operations_manager`
- `supervisor`

## Tenant model
Company data is stored under `companies/{companyId}/...` and access is enforced in Firestore Rules. Field devices are authenticated anonymously and authorized through an active company device record.

## Customer onboarding
1. Create a subscription plan as Super Admin.
2. Create a company from Super Admin.
3. Provision the first Company Admin.
4. Company Admin signs in through `SaasLogin.html`.
5. Company Admin manages guards, sites, shifts, attendance, devices and team access.
6. Operations Managers and Supervisors receive only their permitted modules.

## Production requirements
- Enable Firebase Email/Password Authentication.
- Create the initial Super Admin `users/{uid}` profile manually or through a trusted provisioning process.
- Deploy `firestore.rules` and `firestore.indexes.json`.
- Deploy the Hosting directory using `firebase deploy`.
- For real recurring billing, use a secure server-side/payment-provider webhook. Do not place payment secrets in browser JavaScript.
- Before accepting a paying customer, run staging tests for authentication, tenant isolation, device activation, attendance, payroll and reporting.

## QA performed on this package
- JavaScript syntax validation
- JSON validation
- Local HTML dependency/reference validation
- Removal of legacy `login.html` routing
- Removal of legacy `admins` profile lookup in the payroll module
- Backward-compatible company helper signatures for the original operational code
- ZIP integrity validation

## FINAL V6 hardening
- Role-aware navigation is centralized in `SaaS/navigation.js`.
- Firestore company writes are explicitly scoped by role and collection.
- Company Admin team creation/update is allowed only for management roles in the same tenant.
- Payroll writes are restricted to Company Admin.
- Company subscription/status fields cannot be changed by Company Admin through the company document update rule.
- Company audit logs are append-only.
- Guard creation checks the plan guard limit in the client; production billing/entitlement enforcement should also be mirrored in trusted server-side infrastructure when payments are enabled.


## Public website — V14.4
- `index.html` — public YOURI Security Software website.
- Brand: **YOURI Security Software**.
- Tagline: **Smart Security Management Solutions**.
- Login CTA routes to `SaasLogin.html`.
- Contact/demo enquiries are written to the top-level `publicLeads` collection.
- Public lead rules permit create-only submissions with strict field/length validation; public clients cannot read, update or delete submissions.
- App Check/rate limiting should be enabled at deployment for stronger public-form abuse protection.

## V14.4 QA status
Static source validation passed for JavaScript syntax, duplicate HTML IDs and local script references. Firestore behaviour, tenant isolation, device workflows, realtime listeners, public lead writes and payroll workflows still require live Firebase/staging acceptance. This package is therefore **not declared production-ready solely from static validation**.
