# NEWLOOK V13.2.4 Production Customer-Ready QA

## Source
- Base: NEWLOOK V13.2.3 Production Customer Ready
- Existing Guard, Attendance, Admin, Payroll and Super Admin structured code preserved.
- No dashboard was replaced with a demo/rebuild.

## Corrected
1. Guard GPS helper restored (`getCurrentPosition`).
2. Guard GPS capture is optional operational metadata; no site-radius blocking was introduced.
3. Guard Clock In / Patrol / Incident / Panic records tolerate unavailable GPS and continue without coordinates.
4. Guard operational records are tenant-stamped with `companyId` where required.
5. Guard action handlers now surface Firestore permission failures instead of leaving unhandled promise rejections.
6. Attendance raw events are tenant-stamped with `companyId`.
7. Removed an accidental label-like `companyId: getCompanyId()` statement from an Attendance catch block.
8. Firestore payroll-period delete rule corrected from `resource.status` to `resource.data.status`.
9. Guard incident listener query corrected from DocumentReference to tenant CollectionReference.
10. Payroll source separation preserved:
   - `shiftRecords` = Security Payroll
   - `attendanceRecords` = Staff Payroll
11. Device authorization remains one-time and tenant/device scoped.

## Automated validation
- JavaScript syntax: PASS for all JS files.
- Local ES module imports: PASS, 0 missing.
- HTML local scripts/styles/assets: PASS, 0 missing.
- Static HTML duplicate IDs: PASS, 0 duplicates.
- Firestore security audit: PASS, 15/15 controls.
- Firestore rules delimiter/structure audit: PASS.
- No broad company catch-all rule.
- Anonymous device registration remains restricted and expiring.
- Guard source requires Security department and active employee.
- Attendance source requires Staff department and active employee.

## Customer deployment requirement
Deploy the included `firestore.rules` to the Firebase project before customer testing. Static validation cannot prove the live Firebase project has the same rules deployed.

## Recommended acceptance test
### Guard
Face verification -> Clock In -> shiftRecords -> Clock Out -> Lunch In/Out -> QR Patrol -> Incident -> Panic -> Broadcast Reply.

### Attendance
Face verification -> Staff validation -> IN -> OUT -> attendance -> attendanceRecords.

### Admin
Guards -> Sites -> Shifts -> Checkpoints -> Attendance -> Security Payroll source -> Reports -> Patrol -> Visitors -> Incidents -> Panic -> Devices -> Broadcast -> Notifications -> Support -> Settings.

### Payroll
Security `shiftRecords` and Staff `attendanceRecords` -> payroll preview -> validation -> processing -> period lock -> payslips -> finance/treasury controls.

### Super Admin
Overview -> Companies -> Users -> Plans -> Billing -> Analytics -> Reports -> Devices -> Security -> Features -> Support -> Notifications -> Audit -> System Health -> Settings.

## Release
Version: V13.2.3
Status: Production customer-ready candidate, pending live Firebase acceptance test.
