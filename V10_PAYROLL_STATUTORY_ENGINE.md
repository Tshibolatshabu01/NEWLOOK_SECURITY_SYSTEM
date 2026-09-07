# NEWLOOK V10 Payroll Calculation & Statutory Engine

Release: 2026-09-04

## Implemented
- Shared calculation engine used by Payroll Run Preview and Process Payroll.
- Tenant-scoped recurring allowances and controlled deductions.
- Detailed allowance and deduction breakdown persisted with each payroll record.
- South Africa 2026/27 PAYE calculation based on SARS published individual tax brackets and rebates.
- UIF employee/employer calculation with R17,712 monthly ceiling by default.
- Medical scheme fee tax credit support using 2026/27 published values.
- Pension deduction cap handling for PAYE estimation.
- Validation for missing sources, negative earnings and deductions exceeding gross pay.
- Payroll history entries for processing, status changes, finalization and payment.
- Reconciliation metrics for PAYE, UIF, pension, deductions, gross and net.

## Source contract preserved
Payroll calculations continue to use only tenant-scoped `shiftRecords` and `attendanceRecords` as the operational payroll source streams. They are not repurposed for general operations.

## Important compliance boundary
The engine encodes published SARS rates and common payroll calculations, but employers remain responsible for employee-specific PAYE treatment, directives, taxable fringe benefits, exemptions, year-to-date reconciliation, IRP5/IT3(a) submissions and statutory filing. No SARS submission or EMP201 integration is claimed by this release.

## Default 2026/27 values
- Tax year: 1 March 2026 to 28 February 2027
- Primary rebate: R17,820
- Secondary rebate: R9,765
- Tertiary rebate: R3,249
- UIF employee rate: 1%
- UIF employer rate: 1%
- UIF monthly ceiling: R17,712
- Medical credit: R376 for taxpayer and first dependant, R254 for each additional dependant
