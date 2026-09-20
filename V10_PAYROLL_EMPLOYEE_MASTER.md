# YOURI SaaS V10 — Payroll Employee Master & Compensation Management

## Added
- Payroll Employee Master with search and employee readiness status.
- Complete tenant-scoped compensation profile management.
- Recurring allowances and controlled deductions.
- Bonuses and advances/loans through existing allowance/deduction collections.
- Salary history snapshots before profile changes.
- Payroll validation for missing profiles and invalid base salary.
- Operations Manager read-only; Company Admin write access.
- Other allowance included in payroll calculation engine.

## Data boundaries
- `users/{uid}` remains the identity/profile source.
- `companies/{companyId}/salaryProfiles` stores current compensation profiles.
- `companies/{companyId}/salaryHistory` stores prior compensation snapshots.
- `companies/{companyId}/allowances` stores allowance/bonus records.
- `companies/{companyId}/deductions` stores deduction/advance/loan records.
- `shiftRecords` and `attendanceRecords` remain reserved payroll source collections.

## Production limitation
Statutory submission, payment gateway execution, bank payment execution, automated email delivery, and scheduled server-side payroll runs are not claimed as implemented because this release does not use Cloud Functions or external payroll providers.
