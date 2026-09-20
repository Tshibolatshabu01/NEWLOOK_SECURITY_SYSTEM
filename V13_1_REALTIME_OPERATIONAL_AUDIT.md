# NEWLOOK V13.1 — Realtime Operational Command Center

## Scope
Built directly on NEWLOOK V13 Enterprise Command & Action Layer. Existing Guard, Attendance, Admin, Payroll and Super Admin business logic is preserved.

## Implemented
- Universal realtime command/status bar with clickable Refresh action.
- Admin realtime coverage for Guards, Sites, Checkpoints, Shifts, Devices, Notifications and Support Tickets.
- Attendance realtime monitoring for Guards, Attendance, Attendance Records and Shifts.
- Guard realtime monitoring for Guards, Sites and Shifts without duplicating its existing Visitors/Incidents/Broadcast listeners.
- Payroll dedicated realtime listeners remain authoritative; no duplicate source listeners added.
- Existing Super Admin realtime listeners remain authoritative.
- Existing enterprise action color system remains active.
- Copy action remains available for dynamically rendered table rows.
- Existing Delete/Edit/Approve/Reject/Archive/etc. handlers are preserved.
- No payroll source contract changes: `shiftRecords` remains Security Payroll source and `attendanceRecords` remains Staff Payroll source.
- Device setup persistence remains one-time and durable across refresh.

## Validation
- All JavaScript files pass `node --check`.
- Relative JavaScript imports checked for missing targets.
- Local HTML script/style/resource references checked for missing targets.
- No existing module was replaced with a demo implementation.

## Production boundary
Static validation cannot prove live Firebase security rules, indexes, authentication-provider configuration, browser camera permissions, face-model loading, network conditions, or real customer data. Those require a browser/Firebase smoke test in the deployed environment.
