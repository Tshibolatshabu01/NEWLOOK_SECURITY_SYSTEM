# Firestore Security Test Harness

This folder contains the V10 penetration-test matrix for Firestore authorization.

Recommended execution environment:

1. Firebase Emulator Suite.
2. Seed two companies (`companyA`, `companyB`) with active plans and active users for all management roles.
3. Seed Security and Staff employees in each company.
4. Seed Guard and Attendance device identities.
5. Execute the matrix in `FIRESTORE_RULES_PENETRATION_MATRIX.md`.

This package intentionally does not include production credentials or service-account keys.
