# NEWLOOK SaaS V10 — Payroll Payslips & Benefits Control

## Scope
Adds a controlled payroll statement layer on top of finalized/paid payroll.

## Features
- Employee payroll statement search by employee/ID.
- Payslip preview and browser print / Save as PDF.
- Immutable payslip snapshots under `companies/{companyId}/payrollPayslips`.
- Basic salary, overtime and configured allowances visibility.
- PAYE, UIF, pension, medical aid, loan, advance and other deduction visibility when present in finalized payroll.
- Payslip history/audit event in `payrollHistory`.
- Banking details are deliberately excluded from payslips.
- Company Admin may issue immutable snapshots.
- Company Admin and Operations Manager may read payroll statements.
- Existing V10 roles remain unchanged; no new employee authentication role was introduced.

## Security
Payslip records are tenant-scoped and immutable after creation. The feature does not expose bank account details and does not create a separate employee identity collection. This is intentional because employee financial and banking information requires controlled access under POPIA principles. The Information Regulator identifies employee bank details as high-risk personal information and biometric information as special personal information.

## Boundary
This release does not implement a public/shareable payslip URL, email delivery, or a new employee login role. Those require an explicit employee identity/access model and additional privacy controls.
