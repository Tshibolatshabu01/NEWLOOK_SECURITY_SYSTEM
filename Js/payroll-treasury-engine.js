import { db, companyCollection, companyDoc, getCompanyId } from './firebase.js';
import { getDocs, query, limit, addDoc, updateDoc, getDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';

const cid=()=>getCompanyId();
const role=()=>String(window.__newlookPayrollRole||'').toLowerCase();
const uid=()=>window.__newlookPayrollUid||null;
const admin=()=>role()==='company_admin';
const esc=v=>String(v??'').replace(/[&<>\'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const money=v=>`R${Number(v||0).toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const num=v=>Number(v||0);
const read=async(n,lim=3000)=>{const s=await getDocs(query(companyCollection(db,n),limit(lim)));return s.docs.map(d=>({id:d.id,...d.data()}));};
const periodKey=()=>document.getElementById('payrollPeriod')?.value||document.querySelector('[id*=payrollPeriod]')?.value||'';
const panel=()=>document.getElementById('pe-treasury');

function payrollAmount(r){return num(r.netSalary??r.netPay??0);}
function employeeName(r){return r.employeeName||r.guardName||r.fullName||r.name||r.employee?.name||r.guard?.name||'Unnamed Employee';}
function employeeId(r){return r.guardId||r.employeeId||r.employeeID||'';}
function bank(r){const b=r.bankDetails||r.banking||{};return {holder:b.accountHolderName||r.accountHolderName||employeeName(r),bankName:b.bankName||r.bankName||'',accountNumber:b.accountNumber||r.bankAccountNumber||r.accountNumber||'',branchCode:b.branchCode||r.branchCode||'',accountType:b.accountType||r.accountType||'',reference:b.paymentReference||r.paymentReference||`SAL-${r.payrollKey||''}-${employeeId(r)}`};}
function bankIssues(r){const b=bank(r),issues=[];if(!employeeId(r))issues.push('Missing employee/Guard ID');if(!b.holder)issues.push('Missing account holder');if(!b.accountNumber)issues.push('Missing bank account number');if(!b.bankName)issues.push('Missing bank name');if(!b.branchCode)issues.push('Missing branch code');return issues;}
function statusClass(s){return String(s||'').toLowerCase().replace(/\s+/g,'-');}
function csvDownload(filename,rows){const csv='\ufeff'+rows.map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
async function getPeriod(key){const s=await getDoc(companyDoc(db,'payrollPeriods',key));return s.exists()?{id:s.id,...s.data()}:null;}
async function batches(){return read('payrollPaymentBatches',500);}
async function currentBatch(key){return (await batches()).filter(x=>String(x.payrollKey)===String(key)).sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')))[0]||null;}
async function getEligible(key){const all=await read('payroll',3000);return all.filter(r=>String(r.payrollKey||'')===String(key)&&String(r.payrollStatus||'')==='Finalized'&&String(r.paymentStatus||'Unpaid')!=='Paid');}
function duplicateIds(records){const seen=new Set(),dupes=[];for(const r of records){const id=employeeId(r);if(id&&seen.has(id))dupes.push(id);if(id)seen.add(id);}return dupes;}
function summarize(records){return {employeeCount:records.length,totalNet:records.reduce((a,r)=>a+payrollAmount(r),0),missingBank:records.filter(r=>bankIssues(r).length).length};}

async function createBatch(){
 if(!admin())return alert('Only Company Admin can create payroll payment batches.');
 const key=periodKey();if(!key)return alert('Select a payroll period first.');
 const period=await getPeriod(key);if(!period)return alert('The selected payroll period is not configured.');
 if(['Correction','Closed','closed'].includes(String(period.status)))return alert('Payment batch creation is blocked for Correction or Closed periods. A Locked finalized period remains eligible for treasury payment processing.');
 const existing=await currentBatch(key);if(existing&&!['Rejected','Cancelled'].includes(String(existing.status)))return alert(`A payment batch already exists for this period: ${existing.batchNumber}.`);
 const records=await getEligible(key);if(!records.length)return alert('No Finalized and Unpaid payroll records are available for payment.');
 const dupes=duplicateIds(records);if(dupes.length)return alert(`Payment batch blocked: duplicate employee IDs detected (${dupes.join(', ')}).`);
 const invalid=records.map(r=>({r,issues:bankIssues(r)})).filter(x=>x.issues.length);if(invalid.length){alert(`Payment batch blocked: ${invalid.length} employee(s) have incomplete banking details. Review the Treasury validation table.`);render();return;}
 const total=records.reduce((a,r)=>a+payrollAmount(r),0);
 const batch={companyId:cid(),payrollKey:key,batchNumber:`PB-${new Date().getFullYear()}-${String(Date.now()).slice(-8)}`,status:'Pending Approval',currency:'ZAR',employeeCount:records.length,totalNet:Number(total.toFixed(2)),payrollIds:records.map(r=>r.id),createdBy:uid(),createdAt:serverTimestamp(),makerUid:uid(),makerName:window.__newlookPayrollUserName||'',controlTotals:{payrollNet:Number(total.toFixed(2)),paymentFileNet:Number(total.toFixed(2)),variance:0,balanced:true},approvalRequired:true,immutableAfterApproval:false};
 const ref=await addDoc(companyCollection(db,'payrollPaymentBatches'),batch);
 await addDoc(companyCollection(db,'payrollHistory'),{action:'payment_batch_created',payrollKey:key,batchId:ref.id,batchNumber:batch.batchNumber,totalNet:batch.totalNet,payrollCount:records.length,performedBy:uid(),createdAt:serverTimestamp()});
 alert(`Payment batch ${batch.batchNumber} created and sent for checker approval.`);await render();
}
// Firestore document reference helper avoids relying on collection internals.
async function updateBatch(id,data){await updateDoc(companyDoc(db,'payrollPaymentBatches',id),data);}

async function approveBatchSafe(){
 if(!admin())return alert('Only Company Admin can approve a payment batch.');const b=await currentBatch(periodKey());if(!b)return alert('Create a payment batch first.');
 if(b.status!=='Pending Approval')return alert(`Only Pending Approval batches can be approved. Current status: ${b.status}.`);
 if(String(b.makerUid||b.createdBy)===String(uid()))return alert('Maker/checker control: the batch creator cannot approve their own batch.');
 const period=await getPeriod(b.payrollKey);if(period&&['Correction','Closed','closed'].includes(String(period.status)))return alert('Approval blocked because the payroll period is in correction or closed.');
 await updateBatch(b.id,{status:'Approved',approvedBy:uid(),approvedAt:serverTimestamp(),checkerUid:uid(),immutableAfterApproval:true});
 await addDoc(companyCollection(db,'payrollHistory'),{action:'payment_batch_approved',payrollKey:b.payrollKey,batchId:b.id,batchNumber:b.batchNumber,performedBy:uid(),createdAt:serverTimestamp()});
 alert(`Payment batch ${b.batchNumber} approved.`);await render();
}
async function exportBatch(){
 if(!admin())return alert('Only Company Admin can export payroll payment files.');const b=await currentBatch(periodKey());if(!b)return alert('Create a payment batch first.');
 if(b.status!=='Approved'&&b.status!=='Exported')return alert('Only an Approved payment batch can be exported.');
 const all=await read('payroll',3000),records=all.filter(r=>b.payrollIds?.includes(r.id));if(records.length!==Number(b.employeeCount||0))return alert('Payment export blocked: payroll records no longer match the approved batch.');
 const invalid=records.map(r=>({r,issues:bankIssues(r)})).filter(x=>x.issues.length);if(invalid.length)return alert('Payment export blocked: banking validation failed for one or more employees.');
 const total=records.reduce((a,r)=>a+payrollAmount(r),0);if(Math.abs(total-num(b.totalNet))>0.01)return alert('Payment export blocked: approved batch control total does not match current payroll.');if(b.immutableAfterApproval!==true)return alert('Payment export blocked: the batch has not passed immutable checker approval.');
 const rows=[['Batch Number','Payroll Period','Employee ID','Account Holder','Bank Name','Account Number','Branch Code','Account Type','Amount','Payment Reference']];
 records.forEach(r=>{const x=bank(r);rows.push([b.batchNumber,b.payrollKey,employeeId(r),x.holder,x.bankName,x.accountNumber,x.branchCode,x.accountType,payrollAmount(r).toFixed(2),x.reference]);});
 rows.push([]);rows.push(['CONTROL TOTAL','','','','','','','',total.toFixed(2),'']);
 csvDownload(`NEWLOOK_PAYROLL_PAYMENT_${b.batchNumber}.csv`,rows);
 if(b.status==='Approved'){await updateBatch(b.id,{status:'Exported',exportedBy:uid(),exportedAt:serverTimestamp(),exportControlTotal:Number(total.toFixed(2)),exportRecordCount:records.length});await addDoc(companyCollection(db,'payrollHistory'),{action:'payment_batch_exported',payrollKey:b.payrollKey,batchId:b.id,batchNumber:b.batchNumber,totalNet:Number(total.toFixed(2)),performedBy:uid(),createdAt:serverTimestamp()});}
 alert('Secure payroll payment export generated. NEWLOOK does not execute or transmit the bank payment.');await render();
}
async function markPaid(){
 if(!admin())return alert('Only Company Admin can mark a payment batch as Paid.');const b=await currentBatch(periodKey());if(!b)return alert('Create a payment batch first.');if(!['Exported','Approved'].includes(String(b.status)))return alert('Only an Approved/Exported batch can be marked Paid after the bank payment has actually been completed.');
 const reference=prompt('Enter the bank payment reference / confirmation number:');if(!reference?.trim())return alert('Bank payment reference is required.');
 const all=await read('payroll',3000),records=all.filter(r=>b.payrollIds?.includes(r.id));if(records.length!==Number(b.employeeCount||0))return alert('Payment confirmation blocked: batch payroll records no longer match.');
 for(const r of records){await updateDoc(companyDoc(db,'payroll',r.id),{paymentStatus:'Paid',paidAt:serverTimestamp(),paidBy:uid(),paymentBatchId:b.id,paymentBatchNumber:b.batchNumber,bankPaymentReference:reference.trim(),updatedAt:serverTimestamp(),updatedBy:uid()});}
 await updateBatch(b.id,{status:'Paid',paidBy:uid(),paidAt:serverTimestamp(),bankPaymentReference:reference.trim(),paymentControlTotal:Number(b.totalNet||0)});
 await addDoc(companyCollection(db,'payrollHistory'),{action:'payment_batch_marked_paid',payrollKey:b.payrollKey,batchId:b.id,batchNumber:b.batchNumber,totalNet:b.totalNet,bankPaymentReference:reference.trim(),performedBy:uid(),createdAt:serverTimestamp()});alert(`Batch ${b.batchNumber} marked Paid.`);await render();
}
async function reconcileBatch(){
 if(!admin())return alert('Only Company Admin can reconcile a payroll payment batch.');const b=await currentBatch(periodKey());if(!b)return alert('No payment batch found.');if(!['Paid','Exported'].includes(String(b.status)))return alert('Payment reconciliation requires an Exported or Paid batch.');
 const entered=prompt(`Enter actual bank settlement amount for ${b.batchNumber}:`,Number(b.totalNet||0).toFixed(2));if(entered===null)return;const actual=Number(entered);if(!Number.isFinite(actual)||actual<0)return alert('Enter a valid settlement amount.');const variance=Number((actual-num(b.totalNet)).toFixed(2));const ref=prompt('Enter bank settlement reference: ',b.bankPaymentReference||'');if(!ref?.trim())return alert('Settlement reference is required.');
 const tolerance=0.01,ok=Math.abs(variance)<=tolerance;await updateBatch(b.id,{status:ok?'Reconciled':'Exception',reconciledBy:uid(),reconciledAt:serverTimestamp(),settlementReference:ref.trim(),actualSettlementAmount:Number(actual.toFixed(2)),settlementVariance:variance,reconciliationStatus:ok?'RECONCILED':'EXCEPTION'});
 await addDoc(companyCollection(db,'payrollHistory'),{action:ok?'payment_batch_reconciled':'payment_batch_reconciliation_exception',payrollKey:b.payrollKey,batchId:b.id,batchNumber:b.batchNumber,expected:b.totalNet,actual,variance,performedBy:uid(),createdAt:serverTimestamp()});alert(ok?'Payment batch reconciled successfully.':'Payment batch has a settlement variance and is now an Exception.');await render();
}
function masked(v){const s=String(v||'');return s.length>4?'••••'+s.slice(-4):s?'••••':'';}
function table(rows){return `<div class="table"><table><thead><tr><th>Employee</th><th>ID</th><th>Net Pay</th><th>Bank</th><th>Account</th><th>Validation</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(employeeName(x.r))}</td><td>${esc(employeeId(x.r))}</td><td>${money(payrollAmount(x.r))}</td><td>${esc(x.b.bankName||'—')}</td><td>${esc(masked(x.b.accountNumber))}</td><td>${x.issues.length?`<span>${esc(x.issues.join('; '))}</span>`:'✓ Ready'}</td></tr>`).join('')}</tbody></table></div>`;}
async function render(){const host=panel();if(!host)return;const key=periodKey();let records=[],b=null,period=null;try{records=await getEligible(key);b=await currentBatch(key);period=await getPeriod(key);}catch(e){console.error(e);}const summary=summarize(records);const validation=records.map(r=>({r,b:bank(r),issues:bankIssues(r)}));host.innerHTML=`<div class="pe-toolbar"><div><h3>Payroll Payments & Treasury Control Centre</h3><p class="muted">Maker/checker payroll payment control, bank-file export and settlement reconciliation. NEWLOOK never executes a bank transfer.</p></div></div><section class="grid"><div class="card metric"><div class="label">Eligible employees</div><div class="value">${summary.employeeCount}</div></div><div class="card metric"><div class="label">Payment total</div><div class="value">${money(summary.totalNet)}</div></div><div class="card metric"><div class="label">Batch</div><div class="value">${esc(b?.batchNumber||'Not created')}</div></div><div class="card metric"><div class="label">Status</div><div class="value">${esc(b?.status||'Ready')}</div></div></section><div class="card"><h3>Treasury Workflow</h3><p class="muted">Period: <strong>${esc(key||'Not selected')}</strong> · Payroll period status: <strong>${esc(period?.status||'Not configured')}</strong></p><div class="pe-toolbar"><button class="action-btn action-btn-primary" id="peCreateBatch" ${admin()?'':'disabled'}>Create Payment Batch</button><button class="action-btn action-btn-secondary" id="peApproveBatch" ${admin()?'':'disabled'}>Checker Approve</button><button class="action-btn action-btn-secondary" id="peExportBatch" ${admin()?'':'disabled'}>Export Bank Payment CSV</button><button class="action-btn action-btn-warning" id="peMarkPaid" ${admin()?'':'disabled'}>Mark Paid</button><button class="action-btn action-btn-secondary" id="peReconcilePayment" ${admin()?'':'disabled'}>Reconcile Settlement</button></div><p class="muted">Maker/checker rule: the batch creator cannot approve their own batch. Approval requires a second Company Admin.</p></div><div class="card"><h3>Banking Validation</h3>${table(validation)}</div><div class="card"><h3>Control Totals</h3><div class="grid"><div class="card metric"><div class="label">Payroll Net</div><div class="value">${money(b?.totalNet||summary.totalNet)}</div></div><div class="card metric"><div class="label">Approved Payment Total</div><div class="value">${money(b?.controlTotals?.paymentFileNet||0)}</div></div><div class="card metric"><div class="label">Settlement Variance</div><div class="value">${money(b?.settlementVariance||0)}</div></div><div class="card metric"><div class="label">Reconciliation</div><div class="value">${esc(b?.reconciliationStatus||'NOT RECONCILED')}</div></div></div></div><div class="card"><h3>Security Boundary</h3><ul><li>Payment batches are tenant-scoped under <code>companies/{companyId}/payrollPaymentBatches</code>.</li><li>Payment exports are generated locally as CSV for the customer's banking workflow.</li><li>No bank credentials, API keys or online-banking login details are collected by this module.</li><li>Paid payroll records receive the payment batch reference for audit traceability.</li></ul></div>`;
 document.getElementById('peCreateBatch').onclick=()=>createBatch().catch(e=>alert(e.message));document.getElementById('peApproveBatch').onclick=()=>approveBatchSafe().catch(e=>alert(e.message));document.getElementById('peExportBatch').onclick=()=>exportBatch().catch(e=>alert(e.message));document.getElementById('peMarkPaid').onclick=()=>markPaid().catch(e=>alert(e.message));document.getElementById('peReconcilePayment').onclick=()=>reconcileBatch().catch(e=>alert(e.message));}
function init(){if(!document.getElementById('payrollApp'))return;const nav=document.getElementById('payrollEnterpriseNav');if(!nav||document.querySelector('[data-payroll-view="treasury"]'))return;const b=document.createElement('button');b.className='action-btn action-btn-secondary';b.dataset.payrollView='treasury';b.textContent='Payments & Treasury';nav.appendChild(b);b.onclick=()=>{document.querySelectorAll('#payrollEnterpriseNav [data-payroll-view]').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('.payroll-enterprise-panel').forEach(x=>x.hidden=true);let p=document.getElementById('pe-treasury');if(!p){p=document.createElement('section');p.id='pe-treasury';p.className='payroll-enterprise-panel card';document.getElementById('payrollEnterprisePanels').appendChild(p);}p.hidden=false;render();};}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
