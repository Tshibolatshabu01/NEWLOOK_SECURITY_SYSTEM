# NEWLOOK V14.4 — Public Website & Lead Intake QA

**Audit date:** 2026-09-19  
**Source:** `NEWLOOK_V14_3_FULL_SAAS_ENTERPRISE.zip`  
**Change policy:** Preserve existing operational applications; add/integrate rather than replace.

## 1. Implementation completed

- Added the public NEWLOOK website at `index.html`.
- Added dedicated website styling at `Css/website.css`.
- Added website behaviour and public enquiry submission at `Js/website.js`.
- Login CTA routes to the existing `SaasLogin.html`.
- Added public website sections: Home, About, Solutions, SaaS Features, Plans, Security, FAQ and Contact.
- Commercial prices were not invented.
- Added a tenant-independent `publicLeads` intake collection for website enquiries.
- Added restrictive Firestore create/read/update/delete rules for `publicLeads`.
- Integrated new enquiries into Super Admin Customer Success visibility through the existing `superAdmin/enterpriseExpansion.js` layer.
- Existing Guard, Attendance, Admin, Payroll and Super Admin entrypoints were preserved.

## 2. Static QA

| Control | Result | Notes |
|---|---|---|
| JavaScript syntax | PASS | All project `.js` files passed Node syntax validation. |
| HTML duplicate IDs | PASS | All project HTML files checked; no duplicate IDs found. |
| Local script references | PASS | Existing local HTML script references resolved; website scripts added successfully. |
| Public website login route | PASS | `index.html` links to `SaasLogin.html`. |
| Existing Guard entrypoint | PASS | `guard.html` preserved. |
| Existing Attendance entrypoint | PASS | `attendance.html` preserved. |
| Existing Payroll entrypoint | PASS | `payroll.html` preserved. |
| Existing Admin entrypoint | PASS | `admin.html` preserved. |
| Existing Super Admin entrypoint | PASS | `superAdmin/superadmin.html` preserved. |
| No site-radius blocking reintroduced | PASS (static) | Guard/Attendance operational code remains documented and implemented without radius enforcement. |
| Public lead validation rules | PASS (static) | Create-only public rule with field/length/type restrictions added. |

## 3. NEEDS LIVE FIREBASE TEST

The following cannot be certified from static source inspection alone:

- Firebase Authentication sign-in/logout/password reset.
- `users/{uid}` role and company session resolution.
- Company A → Company B tenant isolation.
- Super Admin platform access.
- Company Admin/Operations Manager/Supervisor permission enforcement.
- Guard device activation and operational writes.
- Guard Clock In/Out, Patrol, Incident and Panic workflows on a real device.
- Attendance face verification and `attendanceRecords` writes.
- Payroll source integrity:
  - `shiftRecords` → Security Payroll.
  - `attendanceRecords` → Staff Payroll.
- Payroll processing, locking, finalization and payment controls.
- Realtime Firestore listeners across multiple authenticated sessions.
- Public website `publicLeads` write against deployed Firestore rules.
- Super Admin visibility of public enquiries.
- Firestore rule behaviour under authenticated and unauthenticated attack scenarios.
- Mobile camera/device/browser compatibility.

## 4. Public website production-security note

The public enquiry form is deliberately create-only for unauthenticated visitors. For a production deployment, Firebase App Check and application-level abuse/rate controls should be enabled before exposing the form broadly. No public read access was granted to submitted enquiries.

## 5. Release status

**Static implementation:** PASS  
**Integration status:** IMPLEMENTED  
**Live Firebase acceptance:** NEEDS LIVE FIREBASE TEST  
**Production declaration:** NOT YET — deployment-specific acceptance remains required.
