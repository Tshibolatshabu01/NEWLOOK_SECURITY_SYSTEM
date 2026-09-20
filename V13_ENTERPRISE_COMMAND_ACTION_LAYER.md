# NEWLOOK SaaS V13 — Enterprise Command & Action Layer

## Scope
This release preserves the existing NEWLOOK V12.9 structured application and adds a non-invasive enterprise-wide action presentation layer.

## Implemented
- Unified action classification across all loaded dashboards and dynamically generated sections.
- Consistent semantic button colors:
  - Green: Create, Save, Approve, Activate, Restore, Register, Process
  - Blue: View, Open, Search, Filter, Scan, QR
  - Orange: Edit, Update, Correct, Adjust
  - Purple: Copy, Duplicate, Clone, Reassign, Schedule
  - Red: Delete, Remove, Destroy, Terminate, Revoke, Reject, Suspend, Emergency/Panic
  - Amber: Cancel, Disable, Deactivate, Archive, Lock, Unlock, Reopen, Escalate
  - Teal: Export, Download, Sync, Refresh, Acknowledge
  - Slate: neutral/secondary actions
- Existing project-specific buttons such as Guard/Site/Checkpoint/Shift Edit and Delete receive the same semantic palette.
- Copy action is automatically added to data-table rows that already expose row actions. It copies the row's data values to the clipboard without changing database data.
- Destructive confirmation is opt-in through `data-confirm-action="true"`; existing module confirmations remain untouched to prevent double prompts.
- Existing backend handlers, Firestore collections, tenant boundaries, payroll source contracts, Guard/Attendance workflows and realtime listeners are preserved.
- Loading state and enterprise confirmation/toast utilities remain available through `window.NEWLOOK_ACTIONS`.

## Important boundary
`Copy` is a clipboard/data-summary operation in this release. It does not silently duplicate Firestore documents because each module has different schemas and permission requirements. True record duplication should be implemented module-by-module with explicit repository contracts and audit logging.

## Validation
Run the existing V12.9 audit suite plus browser smoke testing. Static syntax/import validation remains required before customer deployment.
