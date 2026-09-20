# NEWLOOK V14.5 Enterprise Hardening QA

## Scope
V14.5 continues from the V14.4 source of truth without replacing the existing Admin, Guard, Attendance, Payroll, Super Admin or SaaS modules.

## Implemented
- Canonical application roles are now strictly:
  - `super_admin`
  - `company_admin`
  - `operations_manager`
  - `supervisor`
- Legacy role aliases such as `admin`, `manager`, `team_leader`, `companyAdmin`, `operationsManager` and `superAdmin` are no longer accepted by the canonical client RBAC or Firestore role predicates.
- Payroll source contracts remain unchanged:
  - `shiftRecords` -> Security Payroll
  - `attendanceRecords` -> Staff Payroll
- Guard and Attendance site-radius enforcement remains disabled.
- Public website enquiry writes remain restricted to the expected field set, `status == "new"`, and `createdAt == request.time`.
- Existing Firestore static security audit retained and re-run.

## Static QA Results

| Test | Result |
|---|---|
| Required entrypoints | PASS |
| Local HTML resource references | PASS |
| Duplicate HTML IDs | PASS |
| Canonical RBAC | PASS |
| Firestore canonical roles | PASS |
| Payroll source contract | PASS |
| Guard site-radius enforcement guardrail | PASS |
| Attendance site-radius enforcement guardrail | PASS |
| Public lead rule | PASS |
| Existing Firestore security harness | PASS |
| Version/tenant architecture metadata | PASS |
| JavaScript syntax | PASS |
| Existing Firestore static security audit | PASS |

## Runtime Acceptance

**NEEDS LIVE FIREBASE TEST**

Static analysis cannot prove:
- Firebase Authentication sign-in/sign-out in the deployed environment
- Firestore rule evaluation against real users
- Company A vs Company B isolation under real queries
- Realtime listener behaviour across separate sessions
- Device registration and activation
- Guard camera/face verification and operational writes
- Attendance face verification and payroll-source writes
- Payroll preview, processing, approval and finalization
- Super Admin provisioning and lifecycle operations
- Public website lead submission against deployed Firestore rules
- Mobile browser camera/device behaviour

A Firebase Emulator or dedicated staging Firebase project is required for those tests.

## Important Compatibility Note
The canonical-role hardening intentionally follows the documented NEWLOOK role model and does not preserve authorization for the retired `admin` role or legacy role aliases. Existing production user profiles should therefore be verified before deployment.
