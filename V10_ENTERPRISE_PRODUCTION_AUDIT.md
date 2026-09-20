# YOURI V10 Enterprise Production Audit


## 2026-09-06 Hardening Pass — Tenant/Data Integrity
- Added `companyId` to new Security `shiftRecords`, Staff `attendanceRecords`, and payroll records.
- Hardened Firestore payroll creation/update so tenant identity cannot be changed through payroll documents.
- Hardened Security/Staff payroll source creation so device type and employee department must agree.
- Hardened source-record updates so department and tenant identity cannot be changed by a device.
- Preserved compatibility with legacy source records that predate the `companyId` field; their next valid device update stamps the tenant identity.
- Added active-employee validation to source-record creation.
- JavaScript syntax validation: PASS (31/31).
- Firestore rules structural balance validation: PASS.


## 2026-09-06 Security Penetration Hardening Pass
- Separated `deviceRegistrations` Firestore `get` and `list` permissions so anonymous device setup can retrieve only an exact unexpired registration code; anonymous listing is denied. Firestore query/list rules are evaluated separately from single-document reads.
- Hardened device creation/update so management cannot write a device document with a mismatched tenant `companyId`.
- Hardened Admin Guard Management, Sites, Shifts and Checkpoints to carry tenant identity and preserve tenant identity on updates.
- Hardened operational device boundaries: Attendance devices can write operational `attendance`; Guard devices can write Guard operational collections such as patrols, visitors, incidents, panic alerts and broadcasts.
- Hardened registration creation with an unexpired registration requirement.
- Added `tests/FIRESTORE_RULES_PENETRATION_MATRIX.md` and `tests/static-security-audit.mjs`.
- Static security audit: PASS (15/15 controls plus rule delimiter balance).
- JavaScript syntax validation: PASS (31/31).
- HTML local-reference validation: PASS (0 missing local references).
- Live Firebase Emulator/staging execution remains a mandatory release gate.
