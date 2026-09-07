// NEWLOOK Enterprise Data Contracts — V12
// Canonical collection and route names. Existing application collections are preserved.
export const COLLECTIONS = Object.freeze({
  USERS:'users', COMPANIES:'companies', PLANS:'subscriptionPlans',
  GUARDS:'guards', SITES:'sites', SHIFTS:'shifts', CHECKPOINTS:'checkpoints',
  ATTENDANCE:'attendance', SHIFT_RECORDS:'shiftRecords', ATTENDANCE_RECORDS:'attendanceRecords',
  PATROLS:'patrols', VISITORS:'visitors', INCIDENTS:'incidents', PANIC_ALERTS:'panicAlerts',
  BROADCASTS:'broadcasts', BROADCAST_REPLIES:'broadcastReplies', BROADCAST_READS:'broadcastReads',
  NOTIFICATIONS:'notifications', SUPPORT_TICKETS:'supportTickets', DEVICES:'devices',
  PAYROLL:'payroll', PAYROLL_PERIODS:'payrollPeriods', PAYROLL_HISTORY:'payrollHistory',
  SALARY_PROFILES:'salaryProfiles', SALARY_HISTORY:'salaryHistory', PAYROLL_AUDIT:'payrollAuditLogs',
  PAYROLL_CORRECTIONS:'payrollCorrections', PAYROLL_PAYMENTS:'payrollPayments',
  PAYROLL_PAYMENT_AUDIT:'payrollPaymentAudit', PAYROLL_PAYMENT_EXCEPTIONS:'payrollPaymentExceptions',
  PAYROLL_PAYSLIPS:'payrollPayslips', PAYROLL_BENEFITS:'payrollBenefits', PAYROLL_GL:'payrollGL',
  PAYROLL_GL_CONFIG:'payrollGLConfig', PAYROLL_FINANCE_AUDIT:'payrollFinanceAudit',
  EMP201:'emp201Snapshots', EMP501:'emp501Snapshots', IRP5:'irp5Snapshots', YTD:'payrollYTD',
  AUDIT_LOGS:'auditLogs',
  DEVICE_REGISTRATIONS:'deviceRegistrations'
});
export const SOURCE_CONTRACT = Object.freeze({
  SECURITY:{department:'Security', source:'Guard', collection:COLLECTIONS.SHIFT_RECORDS},
  STAFF:{department:'Staff', source:'Attendance', collection:COLLECTIONS.ATTENDANCE_RECORDS}
});
export const ROUTES = Object.freeze({ LOGIN:'SaasLogin.html', ADMIN:'admin.html', PAYROLL:'payroll.html', GUARD:'guard.html', ATTENDANCE:'attendance.html', SUPER_ADMIN:'superAdmin/superadmin.html' });
