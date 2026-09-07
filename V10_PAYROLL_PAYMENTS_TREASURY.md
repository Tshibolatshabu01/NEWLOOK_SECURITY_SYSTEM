# NEWLOOK SaaS V10 — Payroll Payments & Treasury Control Centre

## Scope
Adds a tenant-scoped payroll payment workflow for finalized and unpaid payroll.

### Workflow
1. Company Admin creates a payment batch.
2. Batch enters **Pending Approval**.
3. A different Company Admin performs **Checker Approve**.
4. Approved batch can be exported as a bank-payment CSV.
5. Customer executes the payment through its banking channel outside NEWLOOK.
6. Company Admin records the bank confirmation and marks the batch **Paid**.
7. Settlement amount/reference can be reconciled. Variances become **Exception**.

## Controls
- Finalized + Unpaid payroll only.
- Duplicate employee IDs block batch creation.
- Required banking fields are validated before creation/export.
- Approved control total must equal current payroll net total before export.
- Maker cannot approve own batch.
- Payment batch records are tenant-scoped and cannot be deleted.
- Paid payroll records retain batch and bank reference for audit traceability.
- No bank credentials or online-banking access is collected.
- No direct bank transfer or external banking API is implemented.

## Security boundary
The CSV is a customer-controlled banking import/export artifact. NEWLOOK does not execute or transmit the payment.
