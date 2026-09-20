# NEWLOOK V12.9 — Full Dashboard / App Operational Audit

## Source
Audited and updated from `NEWLOOK_Security_System_RADIUS_REMOVED_ADMIN_CSS_REDESIGNED_FINAL.zip`.

## Scope
- Customer Admin: `admin.html` + `Js/admin.js` + SaaS customer extensions
- Super Admin: `superAdmin/superadmin.html` + `superAdmin/superadmin.js`
- Guard: `guard.html` + `Js/guard.js`
- Attendance: `attendance.html` + `Js/attendance.js`
- Supporting device/auth infrastructure
- All JavaScript syntax and all HTML local script references

## Audit result
| Area | Result | Notes |
|---|---|---|
| HTML syntax/structure | PASS | 9 HTML entry/support pages inspected; no duplicate IDs found |
| Local script references | PASS | All local script sources resolve |
| JavaScript syntax | PASS | All 43 JS files pass `node --check` |
| Admin dashboard | PASS | Existing structured sections preserved; realtime listeners retained |
| Admin operational registries | PASS | Guards, Sites, Checkpoints and Shifts now receive a 45-second soft refresh fallback |
| Admin operational feeds | PASS | Patrols, Visitors, Incidents, Panic, Broadcast and payroll-source feeds retain `onSnapshot` listeners |
| Admin Device Management | FIXED | Removed hard navigation to `device-registration.html`; the dashboard Device Management page can now open the SaaS device workspace |
| Admin Notifications/Support | PASS | Existing customer SaaS bridge preserved; periodic refresh added |
| Super Admin dashboard | PASS | Existing views preserved; Companies, Users, Plans and Platform Notifications now trigger realtime refresh; nested activity/support has a 30-second fallback |
| Guard app | PASS | Existing workflows preserved; verified device context is reused after refresh |
| Attendance app | PASS | Existing workflow preserved; verified device context is reused after refresh |
| Device setup | FIXED | Durable activation context is stored once and published to the app kernel; refresh does not require a new setup code while the device remains active |
| Tenant/payroll boundaries | PRESERVED | No changes to payroll source separation or tenant architecture |
| Site-radius removal | PRESERVED | Guard/Attendance remain free of site-radius blocking |

## Customer Admin sections
1. Dashboard
2. Guard Management
3. Site Management
4. Shift Management
5. Attendance
6. Reports
7. Patrol Monitoring
8. Visitors
9. Incidents
10. Panic Alerts
11. Analytics
12. Device Management
13. Broadcast
14. Notifications
15. Support
16. Settings (Company Admin)
17. Payroll entry is preserved as a separate `payroll.html` application for authorized management roles.

## Super Admin sections
1. Overview
2. Companies
3. Users
4. Subscriptions
5. Plans
6. Billing & Payments
7. Analytics
8. Reports
9. Devices
10. Security
11. Features
12. Support
13. Notifications
14. Audit & Activity
15. System Health
16. Settings

## Realtime model
### Admin
- Realtime listeners remain authoritative for high-frequency operational data.
- 45-second soft refresh covers getDocs-backed registries without re-creating listeners.
- Browser visibility changes trigger an immediate soft refresh when the tab becomes visible.
- No full page reload is used for the normal refresh cycle, preventing loss of the current section/form state.

### Super Admin
- `companies`, `users`, `subscriptionPlans`, and `superAdminNotifications` are watched with Firestore `onSnapshot`.
- Changes queue a debounced dashboard refresh.
- Nested tenant audit/support data is refreshed every 30 seconds as a fallback.

### Customer SaaS controls
- Devices, notifications, support and settings receive a 30-second active-section refresh fallback.

## Device activation model
- Guard and Attendance each retain their own registered device type.
- Activation writes the device registry once and stores a durable activation context in browser local storage.
- On every Guard/Attendance load, the existing Firebase Auth session is restored using browser-local persistence.
- The Firestore device record is verified against the stored device identity, company, site, type and active status.
- A valid activation is reused after page refresh; a new setup code is only required if the device was revoked, removed, its local storage was cleared, or its registry no longer matches.
- `window.newlookDeviceContext` and `bootDeviceApp()` now receive the verified context.

## Important Firebase requirement
Device activation uses Firebase Anonymous Authentication. The Firebase project must have the Anonymous sign-in provider enabled. This is a platform configuration requirement, not a refresh bug.

## Static QA limitations
This audit validates source structure, wiring, imports, DOM references, syntax and architecture. A final customer-production acceptance test still needs a live Firebase/browser run covering real sign-in, Firestore permissions, device activation, Guard clock-in/out, Attendance IN/OUT, Admin realtime updates and Super Admin actions.
