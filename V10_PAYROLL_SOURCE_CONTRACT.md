# YOURI SaaS V10 — Payroll Source Contract

This contract is part of the V10 architecture and must be preserved.

## Source ownership

- `companies/{companyId}/shiftRecords` is produced by the existing Guard application (`guard.html` / `guard.js`) and is the Guard shift/report source for Payroll.
- `companies/{companyId}/attendanceRecords` is produced by the existing Attendance application (`attendance.html` / `attendance.js`) and is the Attendance report source for Payroll.
- `companies/{companyId}/attendance` remains operational/live attendance data and is not substituted for `attendanceRecords` in Payroll.

## Payroll consumption

Payroll consumes both reserved sources for the selected employee and payroll period:

1. `shiftRecords` supplies shift/work context, scheduled and actual shift times, shift status, overtime/late fields where present, and operational compliance/night/weekend context.
2. `attendanceRecords` supplies attendance periods, first/last clocking, total working time, expected time, overtime, shortage, work status, and attendance percentage where present.

Payroll stores source IDs/counts for traceability on generated payroll records.

## Preservation rule

Do not redesign or rewrite the existing Guard or Attendance application to satisfy Payroll. Connect the SaaS/Payroll layer around their existing collection responsibilities.
