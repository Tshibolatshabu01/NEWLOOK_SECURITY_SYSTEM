# YOURI V10 Payroll Setup Center

## Production workflow
1. Company Admin creates a salary profile under Payroll > Pay Rates.
2. Company Admin creates a payroll period with month, start date, end date and optional pay date.
3. Guard/Attendance apps continue writing only to shiftRecords and attendanceRecords as payroll source streams.
4. Payroll loads configured periods and validates the selected period before processing.
5. Payroll creates tenant-scoped payroll records with source traceability.
6. Company Admin reviews, approves, finalizes and marks payroll paid.

## Roles
- Company Admin: setup, process, approve, finalize, payment controls.
- Operations Manager: payroll read/report/analytics only.
- Supervisor: no payroll control center.

## Important
No statutory submission, bank payment API, or external payroll provider is claimed as implemented by this setup center.
