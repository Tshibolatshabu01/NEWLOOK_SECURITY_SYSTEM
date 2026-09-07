# NEWLOOK V10 — Security / Staff Department Synchronization

## Source of truth
Admin Guard Management remains the employee master for Department and Role. Department is `Security` or `Staff`; Role is the employee function.

## Operational boundary
- Guard application: active `Security` department only.
- Attendance application: active `Staff` department only.
- Admin Shift Management and Security operational reports: active `Security` department only.
- Staff employees remain visible/manageable in Admin and Payroll Employee Master but are not scheduled into Guard Operations.

## Payroll source contract
- `companies/{companyId}/shiftRecords` remains the Guard.html payroll source for Security employees.
- `companies/{companyId}/attendanceRecords` remains the Attendance.html payroll source for Staff employees.
- Payroll calculations now select the source stream from the employee Department instead of treating every employee as a Guard.
- Department, Role, Employee ID and site identity propagate into salary profiles and processed payroll records.

## Security rules
Source-record creation/update is restricted by registered device type and department: guard devices may create Security shift records; attendance devices may create Staff attendance records.

## QA
JavaScript syntax checks and Firestore rule structural balance pass. Deployment still requires Firebase Rules Simulator/Emulator tests with real device claims and representative Security/Staff records.
