# QA — Payroll Accounting Master & Cost-Centre Controls

- [x] Account code/name configuration is tenant-scoped.
- [x] Company Admin only can change accounting master settings.
- [x] Operations Manager remains read-only.
- [x] Configurable cost-centre basis is persisted per tenant.
- [x] Default cost centre is supported for missing attributes.
- [x] Journal numbering is tenant-configurable.
- [x] Reconciliation tolerance is configurable.
- [x] Only Finalized/Paid payroll is eligible for GL journal generation.
- [x] Expense journal lines are allocated by cost centre.
- [x] Liability/control lines remain global.
- [x] Month-end close checks period status, correction state, duplicates, journal balance and reconciliation.
- [x] Existing immutable finance snapshots remain protected by Firestore rules.
- [x] shiftRecords and attendanceRecords remain payroll source streams only.
