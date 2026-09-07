# NEWLOOK V10 Firestore Security Penetration Matrix

Date: 2026-09-06
Scope: `firestore.rules`, tenant identity, management roles, device boundaries, payroll controls, and Security/Staff source separation.

## Test status legend
- **STATIC PASS** — verified from the deployed source/rules structure in this package.
- **EMULATOR PENDING** — requires a Firebase Emulator/Rules Unit Test run against seeded Firestore data.
- **PRODUCTION GATE** — must be executed against the actual Firebase project before production release.

## Tenant isolation matrix

| ID | Scenario | Expected | Static assessment |
|---|---|---|---|
| T01 | Company A user reads Company B tenant document | DENY | STATIC PASS |
| T02 | Company A user writes Company B tenant path | DENY | STATIC PASS |
| T03 | Company A management user changes `companyId` on payroll to B | DENY | STATIC PASS |
| T04 | Company A device creates `shiftRecords` with companyId B | DENY | STATIC PASS |
| T05 | Company A device creates `attendanceRecords` with companyId B | DENY | STATIC PASS |
| T06 | Company A user reads Company B top-level `users` profile | DENY | STATIC PASS by `companyId` membership rule |

## Role matrix

| Role | Admin master | Payroll read | Payroll process/write | Payroll finalize | User access |
|---|---:|---:|---:|---:|---:|
| `super_admin` | YES | YES | YES | YES | YES |
| `company_admin` | YES | YES | YES | YES | YES |
| `operations_manager` | YES | YES | NO | NO | NO |
| `supervisor` | YES (operational scope) | NO payroll | NO | NO | NO |

The application additionally enforces payroll processing/finalization as Company Admin only. Firestore rules independently protect payroll writes.

## Device matrix

| ID | Scenario | Expected | Static assessment |
|---|---|---|---|
| D01 | Guard device writes `shiftRecords` for Security employee in same tenant | ALLOW | STATIC PASS |
| D02 | Guard device writes `shiftRecords` for Staff employee | DENY | STATIC PASS |
| D03 | Attendance device writes `attendanceRecords` for Staff employee | ALLOW | STATIC PASS |
| D04 | Attendance device writes `attendanceRecords` for Security employee | DENY | STATIC PASS |
| D05 | Guard device writes `attendance` operational attendance | DENY | STATIC PASS |
| D06 | Attendance device writes Guard patrol/incident/panic records | DENY | STATIC PASS |
| D07 | Device changes Security employee to Staff through source record | DENY | STATIC PASS |
| D08 | Device writes source record after employee is suspended | DENY | STATIC PASS |
| D09 | Anonymous device queries all registration codes | DENY | STATIC PASS: `get` and `list` are separated; anonymous access is exact-document only |
| D10 | Anonymous device fetches a valid unexpired registration code | ALLOW | STATIC PASS |
| D11 | Anonymous device claims a registration for another tenant without the registration secret | DENY | STATIC PASS / secret-code model |

## Payroll lock matrix

| ID | Scenario | Expected | Static assessment |
|---|---|---|---|
| P01 | Company Admin changes locked finalized payroll salary/gross/net | DENY | STATIC PASS |
| P02 | Company Admin changes locked finalized payroll payment metadata | ALLOW | STATIC PASS |
| P03 | Company Admin deletes locked payroll | DENY | STATIC PASS |
| P04 | Operations Manager creates payroll | DENY | STATIC PASS |
| P05 | Operations Manager finalizes payroll | DENY | STATIC PASS |
| P06 | Supervisor reads payroll | DENY | STATIC PASS |
| P07 | Payroll correction updates arbitrary payroll fields | DENY | STATIC PASS |
| P08 | Salary history update/delete | DENY | STATIC PASS |
| P09 | Payroll journal update/delete | DENY | STATIC PASS |
| P10 | Payment batch maker approves own batch | DENY | STATIC PASS via maker/checker separation |

## Cross-department matrix

| ID | Scenario | Expected |
|---|---|---|
| C01 | Security employee → `shiftRecords` | ALLOW |
| C02 | Staff employee → `attendanceRecords` | ALLOW |
| C03 | Security employee → `attendanceRecords` | DENY |
| C04 | Staff employee → `shiftRecords` | DENY |
| C05 | Security payroll calculation uses `shiftRecords` | ALLOW |
| C06 | Staff payroll calculation uses `attendanceRecords` | ALLOW |
| C07 | Security payroll uses `attendanceRecords` as primary source | DENY by source contract |
| C08 | Staff payroll uses `shiftRecords` as primary source | DENY by source contract |

## Identity integrity checks

- `users/{uid}` remains the account/profile/role/company identity source.
- `companies/{companyId}/guards/{guardId}` remains the Admin Guard Management employee master.
- Department remains `Security` or `Staff`.
- Role remains the employee function such as Security, Supervisor, Manager, Assistant, General Worker, Cashier, or Other.
- `shiftRecords` remain the Security payroll source.
- `attendanceRecords` remain the Staff payroll source.

## Mandatory live gate

The matrix must still be executed using the Firebase Emulator Suite or a dedicated staging Firebase project with seeded Company A/Company B data. A static rules audit cannot prove live authorization behavior, query behavior, or batched/transactional behavior.
