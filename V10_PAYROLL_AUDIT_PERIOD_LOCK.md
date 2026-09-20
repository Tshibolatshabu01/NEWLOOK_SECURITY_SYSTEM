# YOURI SaaS V10 — Payroll Audit & Period Lock Engine

## Purpose
The Payroll Audit & Period Lock Engine protects finalized payroll from unauthorized changes while providing an auditable correction path.

## Workflow
1. Payroll is calculated and processed.
2. Payroll is approved by Company Admin.
3. Finalization creates an immutable payroll snapshot in `companies/{companyId}/payrollHistory`.
4. The configured payroll period is changed to `Locked` and marked `locked=true`.
5. Payroll source records referenced by the finalized run (`shiftRecords` and `attendanceRecords`) are marked `payrollLocked=true` so device updates are denied by Firestore rules.
6. A Company Admin may request and approve a correction, moving the period to `Correction` mode.
7. Referenced payroll source records are unfrozen and payroll records enter `Correction` status.
8. Re-processing recalculates the existing correction records rather than creating duplicate payroll records.
9. Approval and finalization can then be completed again, creating a new immutable snapshot and re-locking the period.

## Security
- Locked payroll periods cannot be edited, deleted, or processed through normal payroll operations.
- Finalization snapshots are immutable: `payrollHistory` does not permit update/delete.
- Payroll source records cannot be modified by registered devices while `payrollLocked=true`.
- Source-lock fields can only be changed by Company Admin under the dedicated Firestore rule.
- Correction requests are tenant-scoped and auditable.
- Existing role and tenant isolation remain unchanged.

## Data separation
`shiftRecords` and `attendanceRecords` remain dedicated Payroll source streams and are not repurposed for general operations.
