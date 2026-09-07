import { db, companyCollection, companyDoc, getCompanyId } from './firebase.js';
import { getDocs, query, limit, addDoc, setDoc, getDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';

const cid=()=>getCompanyId();
const role=()=>String(window.__newlookPayrollRole||'').toLowerCase();
const uid=()=>window.__newlookPayrollUid||null;
const canRead=()=>['company_admin','operations_manager'].includes(role());
const admin=()=>role()==='company_admin';
const esc=v=>String(v??'').replace(/[&<>\'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const money=v=>`R${Number(v||0).toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const num=v=>Number(v||0);
const read=async(n,lim=3000)=>{const s=await getDocs(query(companyCollection(db,n),limit(lim)));return s.docs.map(d=>({id:d.id,...d.data()}));};
const iso=v=>{if(!v)return '';if(typeof v==='string')return v.slice(0,10);if(v?.toDate)return v.toDate().toISOString().slice(0,10);return String(v).slice(0,10)};
const fmt=v=>{const d=v?.toDate?.();return d?d.toLocaleString('en-ZA'):String(v||'—')};
const employeeId=r=>r.guardId||r.employeeId||r.employeeID||r.id||'';
const employeeName=r=>r.employeeName||r.fullName||r.guardName||r.name||'Unnamed Employee';
const periodKey=()=>document.getElementById('payrollPeriod')?.value||'';
const panel=()=>document.getElementById('pe-payslips-benefits');

function periodLabel(p){return p?.name||p?.label||p?.periodName||p?.id||'Payroll Period';}
function periodWindow(p){return {start:iso(p?.startDate),end:iso(p?.endDate),payDate:iso(p?.payDate)};}
function breakdown(r){
 const a=r.allowanceBreakdown||{}; const d=r.deductionBreakdown||{}; const statutory=r.statutory||{};
 const allowances={transport:a.transport??r.transportAllowance??0,housing:a.housing??r.housingAllowance??0,meal:a.meal??r.mealAllowance??0,other:a.other??a.otherAllowance??r.otherAllowance??0,overtime:r.overtimeAmount??r.overtime??0};
 const deductions={paye:statutory.paye??d.paye??0,uif:statutory.uif??d.uif??0,pension:d.pension??0,medicalAid:d.medicalAid??0,loan:d.loan??0,advanceSalary:d.advanceSalary??0,otherDeductions:d.otherDeductions??0};
 return {allowances,deductions};
}
function benefitRows(r){
 const b=breakdown(r), rows=[];
 if(num(b.deductions.medicalAid)>0)rows.push(['Medical aid',num(b.deductions.medicalAid)]);
 if(num(b.deductions.pension)>0)rows.push(['Pension / retirement',num(b.deductions.pension)]);
 return rows;
}
function recordFor(records,id){return records.find(r=>String(employeeId(r))===String(id));}
function printPayslip(s){
 const w=window.open('','_blank','noopener,noreferrer'); if(!w)return alert('Allow pop-ups to print the payslip.');
 const a=s.allowances||{},d=s.deductions||{};
 w.document.write(`<!doctype html><html><head><title>${esc(s.payslipNumber)}</title><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;margin:40px;color:#151922}h1{margin:0 0 4px}small{color:#667085}.head{display:flex;justify-content:space-between;border-bottom:2px solid #222;padding-bottom:18px;margin-bottom:20px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px}.box{border:1px solid #ddd;padding:14px;border-radius:8px}.row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #eee}.total{font-size:18px;font-weight:bold}.net{font-size:22px;font-weight:bold;margin-top:15px;padding:14px;background:#f3f4f6;border-radius:8px}@media print{body{margin:18mm}.no-print{display:none}}</style></head><body><div class="head"><div><h1>NEWLOOK SaaS</h1><small>Employee Payslip</small></div><div><strong>${esc(s.payslipNumber)}</strong><br><small>${esc(s.payrollKey)}</small></div></div><div class="grid"><div class="box"><strong>Employee</strong><br>${esc(s.employeeName)}<br><small>Employee ID: ${esc(s.employeeId)}</small></div><div class="box"><strong>Pay Information</strong><br>Pay date: ${esc(s.payDate||'—')}<br>Period: ${esc(s.periodStart||'—')} → ${esc(s.periodEnd||'—')}</div></div><div class="box"><h3>Earnings</h3><div class="row"><span>Basic salary</span><strong>${money(s.basicSalary)}</strong></div><div class="row"><span>Overtime</span><strong>${money(a.overtime)}</strong></div><div class="row"><span>Transport allowance</span><strong>${money(a.transport)}</strong></div><div class="row"><span>Housing allowance</span><strong>${money(a.housing)}</strong></div><div class="row"><span>Meal allowance</span><strong>${money(a.meal)}</strong></div><div class="row"><span>Other allowance</span><strong>${money(a.other)}</strong></div><div class="row total"><span>Gross</span><strong>${money(s.grossSalary)}</strong></div></div><div class="box" style="margin-top:14px"><h3>Deductions</h3>${Object.entries(d).map(([k,v])=>`<div class="row"><span>${esc(k.replace(/([A-Z])/g,' $1').replace(/^./,x=>x.toUpperCase()))}</span><strong>${money(v)}</strong></div>`).join('')}<div class="row total"><span>Total deductions</span><strong>${money(s.totalDeductions)}</strong></div></div><div class="net">Net pay: ${money(s.netSalary)}</div><p><small>Generated from finalized payroll data. This document is an immutable payroll statement snapshot. Verify statutory and employment details with the employer.</small></p><button class="no-print" onclick="window.print()">Print / Save PDF</button></body></html>`);w.document.close();}

async function snapshotPayslip(r,p){
 if(!admin())throw new Error('Only Company Admin can issue immutable payslip snapshots.');
 if(String(r.payrollStatus||'')!=='Finalized' && String(r.paymentStatus||'')!=='Paid')throw new Error('Payslips can only be issued for Finalized or Paid payroll records.');
 const existing=await getDoc(companyDoc(db,'payrollPayslips',`${r.payrollKey}_${employeeId(r)}`));if(existing.exists())return {id:existing.id,...existing.data()};
 const b=breakdown(r), totalD=num(r.deductions), snap={companyId:cid(),payrollKey:r.payrollKey,employeeId:employeeId(r),employeeName:employeeName(r),periodStart:periodWindow(p).start,periodEnd:periodWindow(p).end,payDate:periodWindow(p).payDate,basicSalary:num(r.basicSalary),allowances:b.allowances,deductions:b.deductions,totalDeductions:totalD,grossSalary:num(r.grossSalary||r.grossPay),netSalary:num(r.netSalary||r.netPay),payrollId:r.id,payrollStatus:r.payrollStatus,paymentStatus:r.paymentStatus||'Unpaid',payslipNumber:`PS-${String(r.payrollKey||'').replace(/[^A-Za-z0-9_-]/g,'-')}-${String(employeeId(r)).replace(/[^A-Za-z0-9_-]/g,'-')}`,issuedBy:uid(),issuedAt:serverTimestamp(),immutable:true};
 await setDoc(companyDoc(db,'payrollPayslips',`${r.payrollKey}_${employeeId(r)}`),snap);
 await addDoc(companyCollection(db,'payrollHistory'),{companyId:cid(),action:'PAYSLIP_ISSUED',payrollKey:r.payrollKey,employeeId:employeeId(r),payslipNumber:snap.payslipNumber,performedBy:uid(),createdAt:serverTimestamp()});
 return snap;
}
function renderTable(records,payslips){
 const q=(panel()?.querySelector('#pePayslipSearch')?.value||'').toLowerCase().trim();
 const rows=records.filter(r=>!q||employeeName(r).toLowerCase().includes(q)||String(employeeId(r)).toLowerCase().includes(q));
 return rows.map(r=>{const p=payslips.find(x=>String(x.payrollKey)===String(r.payrollKey)&&String(x.employeeId)===String(employeeId(r)));return `<tr><td>${esc(employeeName(r))}</td><td>${esc(employeeId(r))}</td><td>${money(r.grossSalary||r.grossPay)}</td><td>${money(r.netSalary||r.netPay)}</td><td>${esc(r.paymentStatus||'Unpaid')}</td><td>${p?'<span class="pe-status">Issued</span>':'<span class="muted">Not issued</span>'}</td><td><button class="action-btn action-btn-secondary pe-view-slip" data-id="${esc(r.id)}">View</button>${admin()&&!p?` <button class="action-btn action-btn-primary pe-issue-slip" data-id="${esc(r.id)}">Issue Payslip</button>`:''}</td></tr>`}).join('')||'<tr><td colspan="7">No payroll records match the selected period/search.</td></tr>';
}
async function load(){
 const p=panel();if(!p||!canRead())return;
 const key=p.querySelector('#pePayslipPeriod')?.value||periodKey();
 const periods=await read('payrollPeriods',500), payroll=await read('payroll',3000), slips=await read('payrollPayslips',3000);
 const period=periods.find(x=>String(x.id)===String(key)||String(x.key)===String(key));
 const records=payroll.filter(r=>String(r.payrollKey||'')===String(key)&&['Finalized','Paid'].includes(String(r.payrollStatus||'')));
 const periodSlips=slips.filter(s=>String(s.payrollKey||'')===String(key));
 const gross=records.reduce((n,r)=>n+num(r.grossSalary||r.grossPay),0),net=records.reduce((n,r)=>n+num(r.netSalary||r.netPay),0),issued=periodSlips.length;
 p.innerHTML=`<div class="pe-toolbar"><div><h3>Payslips & Benefits Control Centre</h3><p class="muted">Secure payroll statements, earnings, deductions and benefit visibility. Employee self-service is not enabled as a separate role in V10; access remains controlled by the existing company payroll roles.</p></div><select id="pePayslipPeriod">${periods.sort((a,b)=>String(b.id).localeCompare(String(a.id))).map(x=>`<option value="${esc(x.id)}" ${String(x.id)===String(key)?'selected':''}>${esc(periodLabel(x))} — ${esc(x.status||'')}</option>`).join('')}</select></div><section class="grid"><div class="card metric"><div class="label">Finalized/Paid employees</div><div class="value">${records.length}</div></div><div class="card metric"><div class="label">Gross payroll</div><div class="value">${money(gross)}</div></div><div class="card metric"><div class="label">Net payroll</div><div class="value">${money(net)}</div></div><div class="card metric"><div class="label">Payslips issued</div><div class="value">${issued}</div></div></section><div class="card"><div class="pe-toolbar"><div><h3>Employee statements</h3><p class="muted">Only finalized/paid payroll is available for statement generation.</p></div><input id="pePayslipSearch" placeholder="Search employee or ID" autocomplete="off"></div><div class="table"><table><thead><tr><th>Employee</th><th>ID</th><th>Gross</th><th>Net</th><th>Payment</th><th>Payslip</th><th>Action</th></tr></thead><tbody id="pePayslipRows">${renderTable(records,periodSlips)}</tbody></table></div></div><div class="card"><h3>Benefits & deductions visibility</h3><p class="muted">The statement exposes configured payroll compensation components such as pension and medical aid only when they are present in the finalized payroll calculation. Sensitive banking details are intentionally excluded from payslips.</p><div id="peBenefitSummary"><p>Select <b>View</b> on an employee to inspect their statement.</p></div></div>`;
 p.querySelector('#pePayslipPeriod').onchange=load;
 p.querySelector('#pePayslipSearch').oninput=()=>p.querySelector('#pePayslipRows').innerHTML=renderTable(records,periodSlips);
 p.querySelectorAll('.pe-view-slip').forEach(b=>b.onclick=async()=>{const r=records.find(x=>x.id===b.dataset.id);if(!r)return;const existing=periodSlips.find(x=>String(x.employeeId)===String(employeeId(r)));const s=existing||{...r,payrollKey:r.payrollKey,employeeId:employeeId(r),employeeName:employeeName(r),grossSalary:r.grossSalary||r.grossPay,netSalary:r.netSalary||r.netPay,totalDeductions:r.deductions,allowances:breakdown(r).allowances,deductions:breakdown(r).deductions,...periodWindow(period)};const br=benefitRows(s);p.querySelector('#peBenefitSummary').innerHTML=`<div class="pe-detail-card"><h4>${esc(s.employeeName)} — ${esc(s.payslipNumber||'Preview')}</h4><p>Basic: <b>${money(s.basicSalary)}</b> · Gross: <b>${money(s.grossSalary)}</b> · Net: <b>${money(s.netSalary)}</b></p><p>Benefits/deductions: ${br.length?br.map(x=>`${esc(x[0])} ${money(x[1])}`).join(' · '):'No pension or medical-aid deduction recorded.'}</p><button class="action-btn action-btn-primary" id="pePrintCurrent">Print / Save PDF</button></div>`;p.querySelector('#pePrintCurrent').onclick=()=>printPayslip(s);});
 p.querySelectorAll('.pe-issue-slip').forEach(b=>b.onclick=async()=>{try{const r=records.find(x=>x.id===b.dataset.id);const s=await snapshotPayslip(r,period);alert(`Immutable payslip ${s.payslipNumber} issued.`);await load();}catch(e){alert(e.message)}});
}
function init(){const host=document.querySelector('#payrollApp');if(!host||document.getElementById('pe-payslips-benefits'))return;const nav=document.getElementById('payrollEnterpriseNav');if(!nav)return;const b=document.createElement('button');b.className='action-btn action-btn-secondary';b.dataset.payrollView='payslips-benefits';b.textContent='Payslips & Benefits';nav.appendChild(b);const p=document.createElement('section');p.id='pe-payslips-benefits';p.className='payroll-enterprise-panel card';p.hidden=true;p.innerHTML='<p>Loading…</p>';document.getElementById('payrollEnterprisePanels')?.appendChild(p);b.onclick=()=>{document.querySelectorAll('#payrollEnterpriseNav [data-payroll-view]').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('.payroll-enterprise-panel').forEach(x=>x.hidden=true);p.hidden=false;load()};}
window.addEventListener('newlook:payroll-ready',()=>setTimeout(init,0));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
