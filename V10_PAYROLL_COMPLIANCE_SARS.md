# YOURI SaaS V10 — Payroll Compliance & Statutory Reporting

## Scope
Adds a tenant-scoped payroll compliance workspace for South African PAYE/UIF/SDL reporting preparation, EMP201 monthly working schedules, EMP501 reconciliation snapshots, IRP5/IT3(a) working registers and tax-year close snapshots.

## Important boundary
YOURI prepares and reconciles data; it does **not** directly submit EMP201/EMP501 or IRP5 files to SARS. Employers must validate and submit through the SARS-prescribed channels and current BRS/e@syFile/eFiling requirements.

## Current statutory basis
- PAYE: stored payroll PAYE values are aggregated by reporting period.
- UIF: employee and employer contributions are calculated using configured rates and the configured monthly ceiling.
- SDL: default 1% employer levy, with a tenant exemption switch for employers below the applicable remuneration threshold.
- IRP5 working register includes remuneration plus codes 4102 (PAYE), 4141 (UIF liable) and 4142 (SDL liable).

## Controls
- Company Admin can save EMP501 reconciliation snapshots and year-end close snapshots.
- Operations Manager has read-only visibility.
- Tenant isolation is enforced in Firestore rules.
- Statutory snapshots are immutable after creation.
- Existing payroll period locks and payroll audit history remain intact.

## Sources
SARS employer declaration guidance and 2026/27 employer guide should be treated as the authority for filing deadlines, codes, validation and submission requirements.
