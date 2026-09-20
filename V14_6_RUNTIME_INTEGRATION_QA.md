# NEWLOOK V14.6 Runtime Integration Contract QA

Date: 2026-09-19

## Scope

V14.6 continues from V14.5 without replacing the existing Admin, Guard, Attendance, Payroll, Super Admin or SaaS modules.

## Static integration controls

The new `tests/v14-6-runtime-contract-audit.mjs` validates:

- Firebase tenant helper exports
- canonical authentication entrypoint
- canonical RBAC roles
- Admin/Guard/Attendance/Payroll service boundaries
- tenant assertions
- Security and Staff payroll source contracts
- Guard/Attendance no-radius enforcement requirement
- tenant stamping in critical application modules
- public website enquiry boundary and validation
- Company SaaS 20-section contract
- Super Admin enterprise section coverage

## Live acceptance gate

Live Firebase testing is still required for:

- Authentication and session creation
- Company A / Company B Firestore isolation
- Firestore Rules evaluation
- Guard device activation
- Attendance device activation
- Guard Clock In/Out, Patrol, Incident and Panic workflows
- Attendance IN/OUT and `attendanceRecords` generation
- Security `shiftRecords` generation
- Payroll calculation, approval and finalization
- realtime listeners across separate browser sessions
- Super Admin platform actions
- public lead creation against deployed Firestore rules

Static source checks must not be represented as proof of live production authorization.
