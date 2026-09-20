# YOURI SaaS V10 — Payroll Financial Controls & General Ledger

## Scope
Adds a tenant-scoped payroll finance control layer without pretending to post directly into an external accounting package.

### Controls
- Balanced payroll journal generation for eligible payroll records.
- Debit/credit control totals.
- Employer cost calculation including employer UIF and SDL.
- Cost-centre preview by site and department using payroll employee attributes.
- Payroll-to-journal reconciliation snapshots.
- CSV export suitable for controlled import/mapping into an accounting/GL system.
- Month-end payroll financial close snapshot.
- Immutable close records and history entries.

## Journal model
Typical generated entries include:
- Debit: Salaries & Wages
- Debit: Employer UIF expense
- Debit: SDL expense
- Credit: PAYE payable
- Credit: Employee UIF payable
- Credit: Net wages payable
- Credit: Employer UIF payable
- Credit: SDL payable
- Credit: Pension payable
- Credit: Medical aid payable
- Credit: Loans/advances/other deductions payable

The generated journal must balance before close.

## Boundary
YOURI does not directly post to Sage, Xero, QuickBooks, SAP, or another external GL in this release. The CSV export is the controlled integration boundary.

## Payroll source separation
`shiftRecords` and `attendanceRecords` remain reserved payroll source streams and are not converted into general ledger data.
