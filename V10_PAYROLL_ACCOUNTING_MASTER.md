# NEWLOOK SaaS V10 — Payroll Accounting Master & Cost-Centre Controls

## Purpose
Provides each tenant with a controlled payroll accounting master without introducing direct external ERP posting.

## Company Admin configuration
- GL account code and account name for payroll expense and liability accounts.
- Cost-centre allocation basis: Site + Department, Site, Department, or Employee Cost Centre.
- Default cost centre for missing employee allocation attributes.
- Journal prefix and sequential journal numbering.
- Payroll-to-GL reconciliation tolerance.

## Journal boundary
Only Finalized or Paid payroll records can create a payroll GL control journal. Journal records are immutable after creation. CSV export is the external accounting integration boundary.

## Cost allocation
Expense lines are allocated to configured cost centres. Liability/control lines remain global so the journal remains balanced and suitable for controlled accounting import.

## Month-end close
Close requires:
1. Configured payroll period.
2. Period status Finalized or Paid.
3. No correction mode open.
4. Finalized/Paid payroll records present.
5. No duplicate employee/period payroll keys.
6. GL journal exists and is balanced within configured tolerance.
7. A successful Payroll-to-GL reconciliation exists.
8. No prior immutable financial close snapshot for the period.

## Security
All settings and finance records are tenant-scoped under `companies/{companyId}`. Company Admin can configure and create finance controls. Operations Manager can read finance controls but cannot change configuration, generate journals, or close a period.
