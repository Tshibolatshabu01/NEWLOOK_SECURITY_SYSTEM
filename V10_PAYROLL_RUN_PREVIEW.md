# NEWLOOK SaaS V10 — Payroll Run Preview & Validation Engine

## Release
Payroll Run Preview is added before payroll processing.

### Capabilities
- Validates the selected payroll period before processing.
- Uses configured payroll calendar start/end dates when available.
- Shows employees ready to process.
- Shows employees skipped because of inactive status, missing Guard ID, invalid/missing salary profile, or already processed payroll.
- Reports attendanceRecords and shiftRecords source counts per employee.
- Calculates preview gross, deductions and net totals without writing payroll records.
- Warns when one of the two payroll source streams is empty.
- Company Admin can continue from preview into the existing Process Payroll workflow.
- Operations Manager remains read-only.

### Source contract
`shiftRecords` and `attendanceRecords` remain dedicated payroll source streams and are not repurposed for operational data.

### Safety
The preview performs no payroll writes. Existing Process / Approve / Finalize / Paid permissions remain unchanged.
