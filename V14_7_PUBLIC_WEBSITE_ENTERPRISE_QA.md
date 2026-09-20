# NEWLOOK V14.7 — Public Website Enterprise UI/UX + Production Integration QA

## Source of truth
- Base release: `NEWLOOK_V14_6_RUNTIME_INTEGRATION_HARDENED.zip`
- Release: `V14.7.0`
- Scope: public website only, while preserving the existing SaaS application modules and security contracts.

## Implemented
- Enterprise responsive navigation with mobile menu and accessibility labels.
- Skip-to-content accessibility control and visible focus states.
- Refined hero, product positioning and SaaS command-preview visual.
- Added Platform Architecture section showing Website → SaaS Login → Company SaaS → Operations flow.
- Expanded Solutions, SaaS Features, Security, Plans, FAQ and Contact presentation.
- Preserved `SaasLogin.html` as the customer authentication entrypoint.
- Preserved `publicLeads` as the only public website persistence path.
- Public form validates name/email/company/phone/type/message before Firestore submission.
- Public website does not read customer/company operational data.
- Preserved the V14.6 tenant, payroll, Guard/Attendance and RBAC architecture.
- Added the supplied YOURI Security Software logo asset to the public website asset set for future branding use without replacing the existing site icon.

## Static validation
- PASS — JavaScript syntax validation for all project `.js` files.
- PASS — HTML duplicate-ID scan.
- PASS — local HTML script/stylesheet reference validation.
- PASS — `publicLeads` rule contract remains aligned with website payload.
- PASS — public website contains no operational Firestore reads.
- PASS — SaaS Login path `SaasLogin.html` is present and referenced.
- PASS — mobile/desktop responsive CSS breakpoints present.
- PASS — navigation controls have ARIA attributes and focus styles.
- PASS — website section anchors resolve to local page IDs.
- PASS — ZIP integrity after packaging.

## Needs live test
- NEEDS LIVE FIREBASE TEST — public lead creation against deployed `newlook-dc1cf` rules.
- NEEDS LIVE FIREBASE TEST — verify public anonymous create is accepted and public read/update/delete is denied.
- NEEDS LIVE FIREBASE TEST — verify App Check/rate-limiting deployment controls if enabled.
- NEEDS LIVE BROWSER TEST — SaaS Login authentication and role routing.
- NEEDS LIVE BROWSER TEST — desktop/mobile layout on deployed domain.
- NEEDS LIVE FIREBASE TEST — full V14.6 tenant isolation, realtime, Guard, Attendance, Payroll and Super Admin acceptance.

## Release status
**V14.7 static website integration: PASS**

**Overall production acceptance: NEEDS LIVE FIREBASE / STAGING TEST**

Static validation is not treated as proof of production runtime correctness.

## Existing enterprise regression harnesses run on V14.7 source
- PASS — V14.5 enterprise static audit: **17 PASS / 0 FAIL**.
- PASS — V14.6 runtime integration contract audit: **63 PASS / 0 FAIL**.
- PASS — Firestore static security audit: **15 PASS / 0 FAIL**.
- NOTE — These are source/static contract audits. They do not replace live Firebase Emulator/staging acceptance.
