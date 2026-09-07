/* NEWLOOK V10 Payroll Calculation & Statutory Engine
 * South Africa 2026/27 (SARS tax year 1 Mar 2026 - 28 Feb 2027).
 * Configuration-driven, tenant-safe and shared by Preview + Process.
 */
const N = v => Math.max(0, Number(v || 0));
const money = v => Math.round((N(v) + Number.EPSILON) * 100) / 100;

export const DEFAULT_STATUTORY = {
  taxYear: '2027',
  effectiveFrom: '2026-03-01',
  uifEmployeeRate: 0.01,
  uifEmployerRate: 0.01,
  uifMonthlyCeiling: 17712,
  primaryRebate: 17820,
  secondaryRebate: 9765,
  tertiaryRebate: 3249,
  medicalCreditFirst: 376,
  medicalCreditAdditional: 254,
  pensionDeductionCapRate: 0.275,
  pensionDeductionAnnualCap: 350000,
  medicalTaxCreditEnabled: true
};

const TAX_2027 = [
  [245100, 0.18, 0, 0],
  [383100, 0.26, 44118, 245100],
  [530200, 0.31, 79998, 383100],
  [695800, 0.36, 125599, 530200],
  [887000, 0.39, 185215, 695800],
  [1878600, 0.41, 259783, 887000],
  [Infinity, 0.45, 666339, 1878600]
];
// 2025/26 rates were unchanged from the preceding published table.
const TAX_2026 = [
  [237100, 0.18, 0, 0],
  [370500, 0.26, 42678, 237100],
  [512800, 0.31, 77362, 370500],
  [673000, 0.36, 121475, 512800],
  [857900, 0.39, 179147, 673000],
  [1817000, 0.41, 251258, 857900],
  [Infinity, 0.45, 644489, 1817000]
];

export function getTaxYear(periodEnd, config = {}) {
  if (config.taxYear) return String(config.taxYear);
  return String(periodEnd || '') >= '2026-03-01' ? '2027' : '2026';
}

export function annualTaxBeforeRebate(annualTaxable, taxYear = '2027') {
  const x = N(annualTaxable);
  const table = String(taxYear) === '2026' ? TAX_2026 : TAX_2027;
  const row = table.find(r => x <= r[0]) || table[table.length - 1];
  return money(row[2] + Math.max(0, x - row[3]) * row[1]);
}

export function calculatePAYE({ taxableGross, pensionContribution = 0, medicalAid = 0, medicalDependants = 0, age = 0, periodType = 'monthly', taxYear = '2027', statutory = {} }) {
  const s = { ...DEFAULT_STATUTORY, ...statutory };
  const frequency = periodType === 'weekly' ? 52 : periodType === 'biweekly' ? 26 : 12;
  const annualGross = N(taxableGross) * frequency;
  const annualPension = Math.min(N(pensionContribution) * frequency, annualGross * N(s.pensionDeductionCapRate), N(s.pensionDeductionAnnualCap));
  const taxableAnnual = Math.max(0, annualGross - annualPension);
  let tax = annualTaxBeforeRebate(taxableAnnual, taxYear);
  const rebate = N(s.primaryRebate) + (age >= 75 ? N(s.secondaryRebate) + N(s.tertiaryRebate) : age >= 65 ? N(s.secondaryRebate) : 0);
  tax = Math.max(0, tax - rebate);
  let monthlyEquivalent = tax / frequency;
  if (s.medicalTaxCreditEnabled) {
    const dependants = Math.max(0, Math.floor(N(medicalDependants)));
    const credit = dependants === 0 ? N(s.medicalCreditFirst) : N(s.medicalCreditFirst) * 2 + Math.max(0, dependants - 1) * N(s.medicalCreditAdditional);
    monthlyEquivalent = Math.max(0, monthlyEquivalent - Math.min(N(medicalAid) > 0 ? credit : 0, monthlyEquivalent));
  }
  return money(monthlyEquivalent);
}

export function calculateUIF(grossSalary, statutory = {}) {
  const s = { ...DEFAULT_STATUTORY, ...statutory };
  return money(Math.min(N(grossSalary), N(s.uifMonthlyCeiling)) * N(s.uifEmployeeRate));
}

function dateOnly(v) {
  if (!v) return null;
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  if (v?.toDate) return v.toDate().toISOString().slice(0, 10);
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

export function compensationEligible(record, period) {
  if (!record || String(record.status || 'active').toLowerCase() !== 'active') return false;
  const end = period?.endDate || period?.month ? (period.endDate || `${period.month}-28`) : null;
  const effective = dateOnly(record.effectiveDate || record.startDate || record.createdAt);
  if (effective && end && effective > end) return false;
  const until = dateOnly(record.endDate || record.expiresAt);
  if (until && period?.startDate && until < period.startDate) return false;
  if (record.recurring === true || String(record.recurring).toLowerCase() === 'true') return true;
  const periodKey = period?.key || '';
  return String(record.periodKey || record.payrollKey || '') === String(periodKey) || (!!effective && !!period?.startDate && effective >= period.startDate && effective <= (period.endDate || period.startDate));
}

export function applyCompensation(records = [], guardId, period, baseSalary = {}) {
  const allowances = {};
  const deductions = {};
  const allowanceSources = [];
  const deductionSources = [];
  records.forEach(r => {
    if (String(r.guardId || '') !== String(guardId || '') || !compensationEligible(r, period)) return;
    const type = String(r.type || 'other');
    const amount = N(r.amount);
    if (!amount) return;
    if (r.__collection === 'deductions' || ['advance','loan','paye','uif','pension','medicalAid','otherDeductions'].includes(type)) {
      deductions[type] = N(deductions[type]) + amount;
      deductionSources.push(r.id);
    } else {
      const key = ({ transport:'transportAllowance', housing:'housingAllowance', meal:'mealAllowance', phone:'phoneAllowance', uniform:'uniformAllowance', risk:'riskAllowance', bonus:'bonus', commission:'commission', other:'otherAllowance' })[type] || 'otherAllowance';
      allowances[key] = N(allowances[key]) + amount;
      allowanceSources.push(r.id);
    }
  });
  return { allowances, deductions, allowanceSources, deductionSources };
}

export function calculatePayrollRun({ employee, salary = {}, attendance = [], shifts = [], period, allowances = [], deductions = [], statutory = {} }) {
  const workedHours = attendance.reduce((n,r)=>n+N(r.totalWorkingHours),0);
  const overtimeHours = attendance.reduce((n,r)=>n+N(r.overtimeMinutes)/60,0);
  const salaryType = String(salary.salaryType || 'monthly').toLowerCase();
  const baseRate = N(salary.hourlyRate || salary.basicSalary);
  const basicSalary = salaryType === 'hourly' ? money(baseRate * workedHours) : N(salary.basicSalary || salary.salary);
  const overtimeRate = N(salary.overtimeRate || salary.hourlyRate);
  const overtimeAmount = money(overtimeHours * overtimeRate);
  const dynamic = applyCompensation([...allowances.map(x=>({...x,__collection:'allowances'})), ...deductions.map(x=>({...x,__collection:'deductions'}))], employee.guardId, period, salary);
  const allowanceBreakdown = {
    transportAllowance: N(salary.transportAllowance)+N(dynamic.allowances.transportAllowance),
    housingAllowance: N(salary.housingAllowance)+N(dynamic.allowances.housingAllowance),
    mealAllowance: N(salary.mealAllowance)+N(dynamic.allowances.mealAllowance),
    phoneAllowance: N(salary.phoneAllowance)+N(dynamic.allowances.phoneAllowance),
    uniformAllowance: N(salary.uniformAllowance)+N(dynamic.allowances.uniformAllowance),
    riskAllowance: N(salary.riskAllowance)+N(dynamic.allowances.riskAllowance),
    bonus: N(salary.bonus)+N(dynamic.allowances.bonus),
    commission: N(salary.commission)+N(dynamic.allowances.commission),
    otherAllowance: N(salary.otherAllowance)+N(dynamic.allowances.otherAllowance)
  };
  const allowancesTotal = money(Object.values(allowanceBreakdown).reduce((n,v)=>n+N(v),0));
  const grossSalary = money(basicSalary + overtimeAmount + allowancesTotal);
  const age = N(employee.age || employee.employeeAge || salary.age);
  const medicalAid = N(salary.medicalAid);
  const pension = N(salary.pension) + N(dynamic.deductions.pension);
  const configuredPaye = N(salary.paye) + N(dynamic.deductions.paye);
  const statutoryPAYE = configuredPaye || calculatePAYE({ taxableGross:grossSalary, pensionContribution:pension, medicalAid, medicalDependants:salary.medicalDependants || employee.medicalDependants || 0, age, periodType:period?.period, taxYear:getTaxYear(period?.endDate, statutory), statutory });
  const uif = N(salary.uif) + N(dynamic.deductions.uif) || calculateUIF(grossSalary, statutory);
  const deductionBreakdown = {
    paye: money(statutoryPAYE),
    uif: money(uif),
    pension: money(pension),
    medicalAid: money(medicalAid),
    loan: money(N(salary.loan)+N(dynamic.deductions.loan)),
    advanceSalary: money(N(salary.advanceSalary)+N(dynamic.deductions.advance)),
    otherDeductions: money(N(salary.otherDeductions)+N(dynamic.deductions.otherDeductions))
  };
  const totalDeductions = money(Object.values(deductionBreakdown).reduce((n,v)=>n+N(v),0));
  const netSalary = money(grossSalary - totalDeductions);
  const issues = [];
  if (basicSalary < 0 || grossSalary < 0) issues.push('Negative earnings');
  if (totalDeductions > grossSalary) issues.push('Deductions exceed gross salary');
  if (!statutory && !configuredPaye) issues.push('Statutory configuration unavailable');
  return {
    ...employee, employee, salary, attendance, shifts, workedHours, overtimeHours,
    lateMinutes: attendance.reduce((n,r)=>n+N(r.lateMinutes),0),
    shortageMinutes: attendance.reduce((n,r)=>n+N(r.shortageMinutes),0),
    basicSalary, overtimeRate, overtimeAmount, allowanceBreakdown, allowances:allowancesTotal,
    deductionBreakdown, deductions:totalDeductions, grossSalary, netSalary,
    statutory: { taxYear:getTaxYear(period?.endDate, statutory), paye:statutoryPAYE, uif, pension, medicalAid, uifEmployer:calculateUIF(grossSalary, {...statutory,uifEmployeeRate:statutory.uifEmployerRate || DEFAULT_STATUTORY.uifEmployerRate}) },
    sourceCompensationIds: { allowances:dynamic.allowanceSources, deductions:dynamic.deductionSources },
    validationIssues:issues
  };
}
