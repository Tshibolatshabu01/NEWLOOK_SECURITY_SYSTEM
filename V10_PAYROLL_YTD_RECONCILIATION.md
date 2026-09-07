# NEWLOOK V10 Payroll YTD & Reconciliation Engine

## Release
2026-09-04

## Added
- Tax-year YTD payroll register for South African March-to-February tax years.
- Employee-level YTD Gross, PAYE, UIF, Pension, Deductions and Net accumulation.
- Payroll arithmetic reconciliation: Net = Gross - Deductions.
- Deduction component reconciliation against stored deduction totals.
- Negative amount detection.
- Payroll source traceability validation for shiftRecords and attendanceRecords.
- Duplicate employee/payroll-period key detection.
- Tax-year selector for 2026/27 and 2025/26.

## Design boundary
This release does not repurpose `shiftRecords` or `attendanceRecords`. They remain the dedicated payroll source streams.

## Statutory basis
The payroll statutory engine is configuration-driven and currently defaults to SARS 2026/27 values. Production statutory reporting should still be reviewed by the employer/payroll practitioner before submission.

## Permissions
- Company Admin: payroll processing and configuration.
- Operations Manager: payroll read/report/reconciliation visibility.
- Supervisor: no payroll processing access.

## No external automation
No Cloud Functions, Firebase Storage, bank payment integration, SARS electronic submission, or automatic statutory filing is claimed by this release.
