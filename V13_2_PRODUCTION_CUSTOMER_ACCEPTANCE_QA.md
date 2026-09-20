# NEWLOOK V13.2 — Production Customer Acceptance QA

## Result

**Static acceptance: PASS with 1 compatibility defect repaired during this QA pass.**

The latest V13.1 source was audited without replacing the existing Guard, Attendance, Admin, Payroll or Super Admin implementations.

### `admin.html`
- Static IDs: 199 (unique: 199)
- Local/relative script references: 15
- Navigation sections declared in HTML: analytics, attendance, broadcast, dashboard, devices, guards, incidents, panic, patrols, reports, shifts, sites, visitors

### `guard.html`
- Static IDs: 67 (unique: 67)
- Local/relative script references: 6
- Navigation sections declared in HTML: dynamic / page-internal

### `attendance.html`
- Static IDs: 11 (unique: 11)
- Local/relative script references: 7
- Navigation sections declared in HTML: dynamic / page-internal

### `payroll.html`
- Static IDs: 83 (unique: 83)
- Local/relative script references: 9
- Navigation sections declared in HTML: dynamic / page-internal

### `SaasLogin.html`
- Static IDs: 5 (unique: 5)
- Local/relative script references: 2
- Navigation sections declared in HTML: dynamic / page-internal

### `superAdmin/superadmin.html`
- Static IDs: 6 (unique: 6)
- Local/relative script references: 4
- Navigation sections declared in HTML: dynamic / page-internal

### `company-users.html`
- Static IDs: 7 (unique: 7)
- Local/relative script references: 2
- Navigation sections declared in HTML: dynamic / page-internal

### `device-setup.html`
- Static IDs: 4 (unique: 4)
- Local/relative script references: 2
- Navigation sections declared in HTML: dynamic / page-internal

### `device-registration.html`
- Static IDs: 7 (unique: 7)
- Local/relative script references: 2
- Navigation sections declared in HTML: dynamic / page-internal

### Inline handler coverage: `Js/admin.js`
- Generated inline handlers: 17
- Missing `window` exports: 0
- Status: PASS

### Inline handler coverage: `Js/guard.js`
- Generated inline handlers: 4
- Missing `window` exports: 0
- Status: PASS

### DOM reference check: `Js/admin.js`
- Static `getElementById` references: 181
- References not present in initial HTML: 15
- Note: dynamic/rendered controls account for these references where applicable: checkpointsScanned, createSupportTicket, customerNotificationsList, enterpriseDocumentsList, enterpriseOperationsList, enterpriseUsersList, faceDescriptor, panicResolution, photoBase64, refreshSupportTickets, resolutionNotes, supportMessage, supportPriority, supportSubject, supportTicketsList

### DOM reference check: `Js/guard.js`
- Static `getElementById` references: 62
- References not present in initial HTML: 3
- Note: dynamic/rendered controls account for these references where applicable: checkInVisitor, reportIncident, sendPanicAlert

### DOM reference check: `Js/attendance.js`
- Static `getElementById` references: 9
- References not present in initial HTML: 0
- Note: dynamic/rendered controls account for these references where applicable: none

### DOM reference check: `Js/payroll.js`
- Static `getElementById` references: 24
- References not present in initial HTML: 4
- Note: dynamic/rendered controls account for these references where applicable: closePayrollModalButton, payrollPreviewModal, payrollToastStack, requestPayrollCorrectionButton

### DOM reference check: `Js/auth.js`
- Static `getElementById` references: 5
- References not present in initial HTML: 0
- Note: dynamic/rendered controls account for these references where applicable: none

## Module integrity
- JavaScript files checked: 44
- Relative imports checked: 87
- Missing imports: 0
- Status: PASS

## Firestore static security audit
```text
PASS  No broad company catch-all rule
PASS  Registration get/list separated
PASS  Anonymous registration requires expiry
PASS  Guard source requires Security
PASS  Attendance source requires Staff
PASS  Guard source requires active employee
PASS  Attendance source requires active employee
PASS  Locked payroll field whitelist
PASS  Salary history immutable
PASS  Payroll journal immutable
PASS  Admin employee tenant identity
PASS  Guard records stamp tenant identity
PASS  Attendance records stamp tenant identity
PASS  Payroll records stamp tenant identity
PASS  Firestore rules structural delimiter balance
```
- Status: PASS

## Section-by-section acceptance matrix

| Application | Section/workspace | Static wiring | Existing business logic preserved | Realtime architecture | Status |
|---|---|---|---|---|---|
| Admin | Dashboard | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Admin | Guard Management | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Admin | Site Management | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Admin | Shift Management | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Admin | Attendance | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Admin | Reports | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Admin | Patrol Monitoring | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Admin | Visitors | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Admin | Incidents | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Admin | Panic Alerts | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Admin | Analytics | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Admin | Device Management | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Admin | Broadcast | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Admin | Notifications | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Admin | Support | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Admin | Users & Access | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Admin | Operations Control | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Admin | Payroll | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Admin | Documents | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Admin | Company Settings | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Guard | Clock In / Out | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Guard | Patrol | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Guard | Lunch | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Guard | Visitors Management | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Guard | Incidents | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Guard | Panic Alert | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Guard | Broadcast | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Attendance | Staff attendance capture | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Attendance | Face verification / staff validation | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Attendance | Attendance records | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Attendance | Daily summary / reports | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Payroll | Payroll Control Center | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Payroll | Workforce / employee payroll | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Payroll | Preview | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Payroll | Process | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Payroll | Approve | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Payroll | Finalize | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Payroll | Mark Paid | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Payroll | Payslips | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Payroll | Reports / exports | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Payroll | Payroll settings | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Payroll | Correction / period controls | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Super Admin | Overview | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Super Admin | Companies | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Super Admin | Users | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Super Admin | Subscriptions | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Super Admin | Plans | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Super Admin | Billing & Payments | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Super Admin | Analytics | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Super Admin | Reports | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Super Admin | Devices | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Super Admin | Security | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Super Admin | Features | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Super Admin | Support | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Super Admin | Notifications | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Super Admin | Audit & Activity | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Super Admin | System Health | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |
| Super Admin | Settings | PASS | Preserved | Covered by existing listeners / command bridge where applicable | PASS* |

*PASS means static/code-level acceptance. Live Firebase/Auth/browser workflow acceptance still requires a deployed/staging environment with real credentials/data and camera permissions.

## Defect repaired in V13.2 QA

- `Js/admin.js`: Visitor table rows used `onclick="viewVisitor(...)"`, but because `admin.js` is an ES module the function was not on `window`. The handler is now explicitly exported as `window.viewVisitor = viewVisitor`.
- Re-ran inline handler coverage: **17/17 Admin handlers and 4/4 Guard handlers have window-visible exports**.

## Final validation

- All JavaScript files: PASS `node --check`.
- Relative ES module imports: PASS, 0 missing.
- HTML local resource references: previously audited PASS.
- Static Firestore security harness: PASS 15/15 controls + delimiter balance.
- Payroll source contract preserved: `shiftRecords` → Security Payroll; `attendanceRecords` → Staff Payroll.
- Device activation persistence preserved.
- Site-radius blocking remains removed from Guard/Attendance workflows.

## Remaining live acceptance boundary

Cannot be proven from static files alone: Firebase deployed rules/indexes, Authentication provider configuration, browser camera/face-model permissions, actual Firestore writes under a customer tenant, realtime listener delivery against live data, and end-to-end role permissions.