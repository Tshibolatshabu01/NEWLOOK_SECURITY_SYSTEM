# YOURI SaaS V10 Payroll Production Fix

- Company Admin is the only role allowed to process, approve, finalize, and mark payroll paid.
- Operations Manager remains read/report access.
- Payroll source collections remain `shiftRecords` and `attendanceRecords`.
- Salary profiles are tenant-scoped and can be maintained from Payroll > Pay Rates by Company Admin.
- Payroll skips inactive employees and employees without a valid active salary profile.
- Approval is limited to the selected payroll period.
- Payment is limited to finalized, unpaid payroll for the selected period.
- Firestore rules explicitly cover payroll, salary profiles, periods, payslips, allowances, deductions, salary history, and payroll history.
