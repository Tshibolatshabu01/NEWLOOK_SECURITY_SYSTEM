import { payrollService } from "../SaaS/apps/payroll/service.js";
window.NEWLOOK_PAYROLL_SERVICE = payrollService;
import { registerManagementSession } from "../SaaS/appKernel.js";
import { auth, companyCollection, companyDoc, db, getCompanyId } from "./firebase.js";
import { loadSession, clearSession } from "../SaaS/companySession.js";
import { normalizeRole, isCompanyAdmin, isOperationsManager } from "../SaaS/permissions.js";


import {
    collection,
    doc,
    addDoc,
    getDoc,
    updateDoc,
    getDocs,
    setDoc,
    query,
    orderBy,
    limit,
    increment,
    where,
    serverTimestamp,
    onSnapshot,

} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import {

    exportPayrollCSV,

    exportPayrollExcel,

    printPayroll

}
from "./payroll-export.js";



import {

monthlyPayrollReport,

weeklyPayrollReport,

yearlyPayrollReport,

departmentPayrollReport,

allowanceReport,

deductionReport,

overtimeReport,

attendanceReport,

UIFReport,

PAYEReport


}

from "./payroll-reports.js";

import {
    calculatePayrollRun,
    DEFAULT_STATUTORY
} from "./payroll-statutory-engine.js";
import {
    getPayrollPeriodState,
    createPayrollSnapshot,
    lockPayrollPeriod,
    requestPayrollCorrection,
    reopenPayrollPeriod
} from "./payroll-lock-engine.js";

import {

    formatCurrency,

    calculateWorkedHours,

    calculateOvertimeHours,

    calculateLateMinutes,

    calculateShortageMinutes,

    calculateCompliance,

    calculateNightHours,

    calculateWeekendHours,

    calculateHolidayHours,

    calculateAllowances,

    calculateDeductions,

    calculateGrossSalary,

    calculateNetSalary

} from "./payroll-calculations.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

onAuthStateChanged(auth, async(user)=>{

    if(!user){

        location.href="SaasLogin.html";
        return;

    }

    try{

        const session = await loadSession(user);
        registerManagementSession("payroll", session);
        if (!session.companyId || !["company_admin","operations_manager"].includes(session.role)) throw new Error("Payroll access denied.");
        payrollState.currentUser = { ...user, ...session, uid: user.uid, role: normalizeRole(session.role) };
        window.__newlookPayrollRole = payrollState.currentUser.role;
        window.__newlookPayrollUid = user.uid;
        document.getElementById("payrollApp")?.setAttribute("data-payroll-role", payrollState.currentUser.role);
        window.dispatchEvent(new CustomEvent("newlook:payroll-ready", { detail: { role: payrollState.currentUser.role, uid: user.uid } }));
        const snap=await getDoc(doc(db,"users",user.uid));

        if(!snap.exists()){

            alert("User account not found.");

            await signOut(auth);

            location.href="SaasLogin.html";

            return;

        }

        const admin=snap.data();

        if(!["super_admin","superAdmin","company_admin","companyAdmin","operations_manager","supervisor"].includes(admin.role)){

            alert("Access denied.");

            await signOut(auth);

            location.href="SaasLogin.html";

            return;

        }

        if(admin.status && admin.status.toLowerCase()!=="active"){

            alert("Account suspended.");

            await signOut(auth);

            location.href="SaasLogin.html";

            return;

        }

    }

    catch(error){

        console.error(error);

    }

});


const COLLECTIONS = {

    COMPANY: "company",

    SETTINGS: "settings",

    GUARDS: "guards",

    SHIFT_RECORDS: "shiftRecords",

    ATTENDANCE: "attendanceRecords",

    SALARY_PROFILES: "salaryProfiles",

    PAYROLL: "payroll",

    PAYROLL_PERIODS: "payrollPeriods",

    PAYSLIPS: "payslips",

    ALLOWANCES: "allowances",

    DEDUCTIONS: "deductions",

    SALARY_HISTORY: "salaryHistory",

    PAYROLL_HISTORY: "payrollHistory",

    AUDIT_LOGS: "auditLogs"

};

const payrollState = {

    currentUser: null,

    company: null,

    settings: null,

    employees: [],

    attendanceRecords: [],

    attendanceMap: new Map(),

    shiftRecords: [],

    shiftMap: new Map(),

    salaryProfiles: [],

    payrollRecords: [],

    payrollMap: new Map(),

    reports:{},

    payrollPeriods: [],

    selectedEmployee: null,

    selectedPayroll: null,

    selectedPayroll: null,

    notifications: [],

    salaryProfiles: [],

    selectedPayrollIds: [],

  salaryProfileMap: new Map(),

  generatedPayslips:[],

  
    filters: {

        search: "",

        department: "",

        position: "",

        salaryType: "",

        payrollStatus: "",

        paymentStatus: ""

    },

    statistics: {

        totalEmployees: 0,

        activeEmployees: 0,

        payrollReady: 0,

        grossPayroll: 0,

        allowances: 0,

        deductions: 0,

        netPayroll: 0,

        pending: 0,

        approved: 0,

        paid: 0

    }

    

};


// =======================================================
// DOM ELEMENT REFERENCES
// These IDs match payroll.html
// =======================================================


const DOM = {


    companyName:
    document.getElementById(
        "companyName"
    ),


    companyLogo:
    document.getElementById(
        "companyLogo"
    ),


    loggedAdmin:
    document.getElementById(
        "loggedAdmin"
    ),


    currentDate:
    document.getElementById(
        "currentDate"
    ),



    loadingOverlay:
    document.getElementById(
        "loadingOverlay"
    ),



    notificationButton:
    document.getElementById(
        "notificationButton"
    ),



    emptyState:
    document.getElementById(
        "emptyPayrollState"
    ),

    payrollTableBody:
    document.getElementById(
    "payrollTableBody"
   ),

    totalEmployees:
    document.getElementById(
    "totalEmployees"
   ),

    activeEmployees:
    document.getElementById(
    "activeEmployees"
   ),

   employeePayrollModal:

   document.getElementById(
    "employeePayrollModal"
   ),


   employeePayrollModalContent:

   document.getElementById(
    "employeePayrollModalContent"
   ),


  closePayrollModalButton:

  document.getElementById(
    "closePayrollModalButton"
  )

};





// =======================================================
// APPLICATION START
// =======================================================


document.addEventListener(
"DOMContentLoaded",
()=>{


    initializeApplication();


});







// =======================================================
// INITIALIZE APPLICATION
// =======================================================


function initializeApplication(){


    displayCurrentDate();


    setupNotificationButton();


    monitorAuthentication();


}







// =======================================================
// AUTHENTICATION CHECK
// =======================================================


function monitorAuthentication(){



    onAuthStateChanged(
    auth,
    async(user)=>{


        if(user){


            payrollState.currentUser =
            user;



            await verifyAdministrator(
                user
            );


        }

        else{


            showNotification(
                "User not authenticated",
                "error"
            );


            redirectToLogin();


        }


    });



}







// =======================================================
// ADMIN PERMISSION CHECK
// =======================================================


async function verifyAdministrator(user){
    const allowed = await checkAdminAccess();
    if (allowed) {
        await initializePayrollInterface();
    }
}

// =======================================================
// INITIALIZE UI
// =======================================================


async function initializePayrollInterface(){

    const allowed =
    await checkAdminAccess();


    if(!allowed){

        return;

    }


    await loadCompanyInformation();

    await loadPayrollSettings();

    await loadEmployees();

    await loadSalaryProfiles();
    await loadPayrollCompensationRecords();

    await loadAttendanceRecords();

    await loadShiftRecords();

    setupPayrollPeriodControls();
    await loadConfiguredPayrollPeriods();
    await loadPayrollRecords();
    setupPayrollFilters();
    setupPayrollActionButtons();
    setupPayrollTableEvents();
    updateSelectedPeriodLabel();
    const subscriptionStatus = document.getElementById("subscriptionStatus");
    if (subscriptionStatus) subscriptionStatus.textContent = payrollState.company?.subscriptionStatus ? `Subscription: ${payrollState.company.subscriptionStatus}` : "Tenant active";

}







// =======================================================
// DATE DISPLAY
// =======================================================


function displayCurrentDate(){


    if(
        DOM.currentDate
    ){


        DOM.currentDate.textContent =
        new Date()
        .toLocaleDateString();


    }


}







// =======================================================
// LOADING SYSTEM
// =======================================================


function showLoading(message="Loading..."){



    payrollState.loading =
    true;



    if(
        DOM.loadingOverlay
    ){


        DOM.loadingOverlay.style.display =
        "flex";


    }



}



function hideLoading(){



    payrollState.loading =
    false;



    if(
        DOM.loadingOverlay
    ){


        DOM.loadingOverlay.style.display =
        "none";


    }



}







// =======================================================
// NOTIFICATION SYSTEM
// =======================================================


function showNotification(message, type="success"){
    let stack = document.getElementById("payrollToastStack");
    if (!stack) {
        stack = document.createElement("div");
        stack.id = "payrollToastStack";
        stack.className = "toast-stack";
        document.body.appendChild(stack);
    }
    const toast = document.createElement("div");
    toast.className = `payroll-toast ${type}`;
    toast.setAttribute("role", "status");
    toast.textContent = message;
    stack.appendChild(toast);
    setTimeout(() => toast.remove(), 4200);
}





// =======================================================
// NOTIFICATION BUTTON
// =======================================================


function setupNotificationButton(){


    if(
        DOM.notificationButton
    ){


        DOM.notificationButton
        .addEventListener(
        "click",
        ()=>{


            showNotification(
                "No new notifications"
            );


        });


    }


}







// =======================================================
// LOGIN REDIRECT PLACEHOLDER
// =======================================================


function redirectToLogin(){


    console.log(
        "Redirecting to login"
    );


    /*
    Connect with existing
    authentication page later.
    */


}


async function loadEmployees(){

    try{

        showLoading(
            "Loading employees..."
        );

        const employeeQuery = query(

            payrollService.collection(
                db,
                COLLECTIONS.GUARDS
            ),

            orderBy(
                "fullName"
            )

        );

        onSnapshot(

            employeeQuery,

            (snapshot)=>{

                payrollState.employees = [];

                snapshot.forEach(

                    (docSnapshot)=>{

                        const data = docSnapshot.data();
                        payrollState.employees.push({
                            id: docSnapshot.id,
                            guardId: data.guardId || docSnapshot.id,
                            employeeID: data.employeeID || data.employeeId || "",
                            department: String(data.department || "").trim().toLowerCase(),
                            role: String(data.role || "").trim().toLowerCase(),
                            ...data
                        });

                    }

                );

                updateEmployeeStatistics();

                renderEmployeeTable();

                hideLoading();

            },

            (error)=>{

                hideLoading();

                console.error(error);

                showNotification(

                    error.message,

                    "error"

                );

            }

        );

    }

    catch(error){

        hideLoading();

        console.error(error);

    }

}


// =======================================================
// V10 PAYROLL SOURCE CONTRACT
// shiftRecords = Guard.html shift/report source for Payroll
// attendanceRecords = attendance.html attendance source for Payroll
// Neither collection is used as a generic Payroll collection.
// =======================================================
function firestoreDateValue(value){
    if(!value) return null;
    if(typeof value?.toDate === "function") return value.toDate();
    if(value instanceof Date) return value;
    if(typeof value === "number") { const d=new Date(value); return Number.isNaN(d.getTime()) ? null : d; }
    const d=new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
}

function recordPayrollDate(record, source){
    const candidates = source === "shift"
        ? [record.date, record.shiftDate, record.clockInTime, record.createdAt]
        : [record.shiftDate, record.date, record.firstClockIn, record.createdAt];
    for(const value of candidates){
        const d=firestoreDateValue(value);
        if(d) return d;
    }
    return null;
}

function recordBelongsToPayrollPeriod(record, source, month, period, configuredPeriod = null){
    if(!month) return false;
    const d=recordPayrollDate(record, source);
    if(!d) return false;

    // Prefer the configured payroll calendar dates when available.
    if(configuredPeriod?.startDate){
        const start=new Date(`${configuredPeriod.startDate}T00:00:00`);
        if(!Number.isNaN(start.getTime()) && d < start) return false;
    }
    if(configuredPeriod?.endDate){
        const end=new Date(`${configuredPeriod.endDate}T23:59:59.999`);
        if(!Number.isNaN(end.getTime()) && d > end) return false;
    }

    const ym=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    if(ym!==month) return false;
    if(configuredPeriod?.startDate || configuredPeriod?.endDate) return true;
    if(period === "monthly") return true;
    const day=d.getDate();
    if(period === "weekly_1") return day>=1 && day<=7;
    if(period === "weekly_2") return day>=8 && day<=14;
    if(period === "weekly_3") return day>=15 && day<=21;
    if(period === "weekly_4") return day>=22 && day<=28;
    if(period === "weekly_5") return day>=29;
    return true;
}

function getPayrollSourceRecords(employeeOrId){
    const payrollPeriod = getPayrollPeriod();
    const {month, period} = payrollPeriod;
    const employee = typeof employeeOrId === "object" ? employeeOrId : null;
    const guardId = employee?.guardId || employeeOrId;
    const department = String(employee?.department || "").trim().toLowerCase();
    const matches = r => String(r.guardId || r.employeeID || "") === String(guardId || "");

    const attendance = department === "staff"
        ? (payrollState.attendanceRecords || []).filter(r => matches(r) && recordBelongsToPayrollPeriod(r, "attendance", month, period, payrollPeriod))
        : [];
    const shifts = department === "security"
        ? (payrollState.shiftRecords || []).filter(r => matches(r) && recordBelongsToPayrollPeriod(r, "shift", month, period, payrollPeriod))
        : [];

    return {attendance, shifts};
}

function updateEmployeeStatistics(){

    payrollState.statistics.totalEmployees =

        payrollState.employees.length;

    payrollState.statistics.activeEmployees =

        payrollState.employees.filter(

            employee=>employee.active === true

        ).length;

    DOM.totalEmployees.textContent =

        payrollState.statistics.totalEmployees;

    DOM.activeEmployees.textContent =

        payrollState.statistics.activeEmployees;

}

function getSelectedPeriodKey(){
    const month = document.getElementById("payrollMonth")?.value || "";
    const period = document.getElementById("payrollPeriodSelector")?.value || "monthly";
    return `${month}_${period}`;
}

function getEmployeePayroll(employee){
    const guardId = employee.guardId;
    const key = getSelectedPeriodKey();
    return payrollState.payrollRecords.find(p => p.guardId === guardId && p.payrollKey === key)
        || payrollState.payrollMap.get(`${guardId}::${key}`)
        || buildEmployeePayroll(employee);
}

function populatePayrollFilterOptions(){
    const fields = [
        ["filterDepartment", payrollState.employees.map(e=>e.department)],
        ["filterPosition", payrollState.employees.map(e=>e.position)],
        ["filterSalaryType", payrollState.salaryProfiles.map(p=>p.salaryType)]
    ];
    fields.forEach(([id, values])=>{
        const el=document.getElementById(id); if(!el) return;
        const current=el.value; const unique=[...new Set(values.filter(Boolean).map(String))].sort();
        el.innerHTML='<option value="">All</option>'+unique.map(v=>`<option value="${v.replace(/"/g,"&quot;")}">${v}</option>`).join("");
        el.value=current;
    });
    [
      ["filterPayrollStatus", ["Pending","Approved","Finalized"]],
      ["filterPaymentStatus", ["Unpaid","Paid"]]
    ].forEach(([id, values])=>{
      const el=document.getElementById(id); if(!el) return; const current=el.value; el.innerHTML='<option value="">All</option>'+values.map(v=>`<option value="${v}">${v}</option>`).join(""); el.value=current;
    });
}

function renderEmployeeTable(){

    DOM.payrollTableBody.innerHTML = "";

    if(

        payrollState.employees.length === 0

    ){

        DOM.emptyState.style.display =

            "block";

        return;

    }

    DOM.emptyState.style.display =

        "none";

    const visibleEmployees = payrollState.employees.filter(employee => {
        const payroll = payrollState.payrollMap.get(employee.guardId) || buildEmployeePayroll(employee);
        const f = payrollState.filters;
        const name = String(employee.fullName || "").toLowerCase();
        const eid = String(employee.employeeID || "").toLowerCase();
        return (!f.search || name.includes(f.search))
            && (!f.employeeID || eid.includes(f.employeeID))
            && (!f.department || employee.department === f.department)
            && (!f.position || employee.position === f.position)
            && (!f.salaryType || payroll.salary?.salaryType === f.salaryType)
            && (!f.payrollStatus || (payroll.payrollStatus || "Pending") === f.payrollStatus)
            && (!f.paymentStatus || (payroll.paymentStatus || "Unpaid") === f.paymentStatus);
    });
    const countBadge = document.getElementById("recordCountBadge");
    if (countBadge) countBadge.textContent = `${visibleEmployees.length} record${visibleEmployees.length === 1 ? "" : "s"}`;
    visibleEmployees.forEach(

        (employee)=>{

            
           let payroll = getEmployeePayroll(employee);

           if(!payroll){

             payroll =
              buildEmployeePayroll(
              employee
             );

            }

           const salary =
           payroll.salary;

            const attendance =
            payrollState.attendanceMap.get(
            employee.guardId
            ) || [];

            const shifts =
            payrollState.shiftMap.get(
            employee.guardId
            ) || [];

            const basicSalary =
            salary?.basicSalary || 0;

            const salaryType =
            salary?.salaryType || "";

            const row = document.createElement("tr");

            row.innerHTML = `

                <td>

                    <input
                        type="checkbox"
                        class="employeeCheckbox"
                        data-id="${employee.guardId}"
                    >

                </td>

                <td>

                    <img
                        src="${employee.photoBase64 || ""}"
                        alt="Photo"
                        class="employeePhoto"
                    >

                </td>

                <td>

                    ${employee.employeeID || ""}

                </td>

                <td>

                    ${employee.fullName || ""}

                </td>

                <td>

                    ${employee.position || ""}

                </td>

                <td>

                    ${employee.department || ""}

                </td>

                <td>${salaryType}</td>

                <td>${formatCurrency(payroll.basicSalary)}</td>

                <td>${formatCurrency(payroll.overtimeAmount)}</td>

                <td>${formatCurrency(payroll.allowances)}</td>

                <td>${formatCurrency(payroll.deductions)}</td>

                <td>${formatCurrency(payroll.grossSalary)}</td>

                <td>${formatCurrency(payroll.netSalary)}</td>

                <td>${payroll.payrollStatus || "Pending"}</td>

                <td>${payroll.paymentStatus || "Unpaid"}</td>

                <td>

                    -

                </td>

                <td>

                    <button
                        class="viewPayrollButton"
                        data-id="${employee.guardId}"
                    >

                        View

                    </button>

                </td>

            `;

            DOM.payrollTableBody.appendChild(
                row
            );

        }

    );

}

function buildEmployeePayroll(employee){
    const salary = payrollState.salaryProfileMap.get(employee.guardId) || {};
    const source = getPayrollSourceRecords(employee);
    const period = getPayrollPeriod();
    const statutory = { ...(payrollState.company?.settings?.payrollStatutory || {}), ...(payrollState.settings?.payrollStatutory || {}) };
    return calculatePayrollRun({
        employee, salary, attendance: source.attendance, shifts: source.shifts, period,
        allowances: payrollState.allowanceRecords || [],
        deductions: payrollState.deductionRecords || [],
        statutory
    });
}

async function loadPayrollCompensationRecords(){
    try {
        const [a,d] = await Promise.all([
            getDocs(query(payrollService.collection(db, COLLECTIONS.ALLOWANCES))),
            getDocs(query(payrollService.collection(db, COLLECTIONS.DEDUCTIONS)))
        ]);
        payrollState.allowanceRecords = a.docs.map(x=>({id:x.id,...x.data()}));
        payrollState.deductionRecords = d.docs.map(x=>({id:x.id,...x.data()}));
    } catch(error) {
        console.warn("Payroll compensation records unavailable", error);
        payrollState.allowanceRecords = []; payrollState.deductionRecords = [];
    }
}

async function loadSalaryProfiles(){

    try{

        const salaryQuery = query(

            payrollService.collection(
                db,
                COLLECTIONS.SALARY_PROFILES
            ),

            where(
                "active",
                "==",
                true
            )

        );

        onSnapshot(

            salaryQuery,

            (snapshot)=>{

                payrollState.salaryProfiles = [];

                payrollState.salaryProfileMap.clear();

                snapshot.forEach((document)=>{

                    const salary = {

                        id: document.id,

                        ...document.data()

                    };

                    payrollState.salaryProfiles.push(
                        salary
                    );

                    payrollState.salaryProfileMap.set(

                        salary.guardId,

                        salary

                    );

                });

                populatePayrollFilterOptions();
                renderEmployeeTable();

            }

        );

    }

    catch(error){

        console.error(error);

        showNotification(

            error.message,

            "error"

        );

    }

}

async function loadAttendanceRecords(){

    try{

        const attendanceQuery = query(

            payrollService.collection(
                db,
                COLLECTIONS.ATTENDANCE
            )

        );

        onSnapshot(

            attendanceQuery,

            (snapshot)=>{

                payrollState.attendanceRecords = [];

                payrollState.attendanceMap.clear();

                snapshot.forEach((document)=>{

                    const attendance = {

                        id: document.id,

                        ...document.data()

                    };

                    payrollState.attendanceRecords.push(attendance);

                    if(
                        !payrollState.attendanceMap.has(attendance.guardId)
                    ){

                        payrollState.attendanceMap.set(
                            attendance.guardId,
                            []
                        );

                    }

                    payrollState.attendanceMap
                    .get(attendance.guardId)
                    .push(attendance);

                });

                renderEmployeeTable();

            }

        );

    }

    catch(error){

        console.error(error);

        showNotification(
            error.message,
            "error"
        );

    }

}

async function loadShiftRecords(){

    try{

        const shiftQuery = query(

            payrollService.collection(
                db,
                COLLECTIONS.SHIFT_RECORDS
            )

        );

        onSnapshot(

            shiftQuery,

            (snapshot)=>{

                payrollState.shiftRecords = [];

                payrollState.shiftMap.clear();

                snapshot.forEach((document)=>{

                    const shift = {

                        id: document.id,

                        ...document.data()

                    };

                    payrollState.shiftRecords.push(shift);

                    if(
                        !payrollState.shiftMap.has(shift.guardId)
                    ){

                        payrollState.shiftMap.set(
                            shift.guardId,
                            []
                        );

                    }

                    payrollState.shiftMap
                    .get(shift.guardId)
                    .push(shift);

                });

                renderEmployeeTable();

            }

        );

    }

    catch(error){

        console.error(error);

        showNotification(
            error.message,
            "error"
        );

    }

}

function getPayrollPeriod(){
    const month = document.getElementById("payrollMonth").value;
    const selected = document.getElementById("payrollPeriodSelector").value;
    const configured = payrollState.payrollPeriods.find(x => (x.key || x.id) === selected);
    if(configured){
        return { month: configured.month || month, period: configured.period || "monthly", key: configured.key || configured.id, startDate: configured.startDate || null, endDate: configured.endDate || null, payDate: configured.payDate || null };
    }
    return { month, period:selected, key:`${month}_${selected}` };
}

async function payrollAlreadyExists(guardId, periodKey){

    const payrollQuery = query(

        payrollService.collection(
            db,
            COLLECTIONS.PAYROLL
        ),

        where(
            "guardId",
            "==",
            guardId
        ),

        where(
            "payrollKey",
            "==",
            periodKey
        )

    );

    const snapshot = await getDocs(payrollQuery);

    return !snapshot.empty;

}



async function processPayroll(){

    if(
 !payrollState.currentUser ||
 !isCompanyAdmin(payrollState.currentUser?.role)
 ){

    showNotification(

        "Unauthorized action",

        "error"

    );

    return;

 }

    try{

        showLoading("Processing payroll...");

        const payrollPeriod =
        getPayrollPeriod();
        const periodState = await getPayrollPeriodState(payrollPeriod.key);
        if (periodState?.locked || String(periodState?.status || "").toLowerCase() === "locked") throw new Error("This payroll period is locked. Use the authorized correction workflow to reopen it.");

        if (!payrollPeriod.month || !payrollPeriod.period) throw new Error("Select a payroll month and period first.");
        if (payrollState.payrollPeriods.length && !payrollState.payrollPeriods.some(x => (x.key || x.id) === payrollPeriod.key)) throw new Error("The selected payroll period is not configured. Create it in Payroll → Pay Rates / Payroll Calendar first.");
        let processed = 0;
        let skipped = 0;

        for(const employee of payrollState.employees){
            if (employee.active === false) { skipped++; continue; }
            if (!employee.guardId) { skipped++; continue; }
            const salaryProfile = payrollState.salaryProfileMap.get(employee.guardId);
            if (!salaryProfile || Number(salaryProfile.basicSalary || salaryProfile.salary || 0) <= 0) {
                skipped++;
                console.warn("Payroll skipped: missing salary profile", employee.guardId);
                continue;
            }

            const existingPayroll = payrollState.payrollRecords.find(x => x.guardId === employee.guardId && x.payrollKey === payrollPeriod.key);
            if (existingPayroll && !["Correction"].includes(String(existingPayroll.payrollStatus || ""))) continue;

            const payroll =
            buildEmployeePayroll(employee);
            if (!payroll.attendance.length && !payroll.shifts.length) {
                skipped++;
                console.warn("Payroll skipped: no payroll source records", employee.guardId);
                continue;
            }
            if (payroll.validationIssues?.length) {
                skipped++;
                console.warn("Payroll skipped: validation issues", employee.guardId, payroll.validationIssues);
                continue;
            }

            const payrollPayload = {

                    companyId:
                    getCompanyId(),

                    payrollKey:
                    payrollPeriod.key,

                    payrollMonth:
                    payrollPeriod.month,

                    payrollPeriod:
                    payrollPeriod.period,

                    processedAt:
                    serverTimestamp(),

                    processedBy:
                    payrollState.currentUser.uid,

                    guardId:
                    employee.guardId,

                    employeeID:
                    employee.employeeID,

                    fullName:
                    employee.fullName,

                    department:
                    employee.department,

                    role:
                    employee.role || employee.position || "",

                    position:
                    employee.position || employee.role || "",

                    salaryType:
                    payroll.salary.salaryType,

                    basicSalary:
                    payroll.basicSalary,

                    workedHours:
                    payroll.workedHours,

                    overtimeHours:
                    payroll.overtimeHours,

                    overtimeAmount:
                    payroll.overtimeAmount,

                    nightHours:
                    payroll.nightHours,

                    weekendHours:
                    payroll.weekendHours,

                    holidayHours:
                    payroll.holidayHours,

                    allowances:
                    payroll.allowances,

                    allowanceBreakdown: payroll.allowanceBreakdown,

                    deductions:
                    payroll.deductions,

                    deductionBreakdown: payroll.deductionBreakdown,

                    statutory: payroll.statutory,

                    sourceCompensationIds: payroll.sourceCompensationIds,

                    validationIssues: payroll.validationIssues,

                    grossSalary:
                    payroll.grossSalary,

                    netSalary:
                    payroll.netSalary,

                    attendancePercentage:
                    payroll.attendance.length
                        ? payroll.attendance.reduce(
                            (sum, record)=>
                                sum + Number(record.attendancePercentage || 0),
                            0
                          ) / payroll.attendance.length
                        : 0,

                    compliance:
                    payroll.compliance,

                    // Traceability: Payroll is calculated from the two reserved source streams.
                    sourceCollections: {
                        shiftRecords: "companies/{companyId}/shiftRecords",
                        attendanceRecords: "companies/{companyId}/attendanceRecords"
                    },
                    sourceShiftRecordIds: payroll.shifts.map(r => r.id).filter(Boolean),
                    sourceAttendanceRecordIds: payroll.attendance.map(r => r.id).filter(Boolean),
                    sourceShiftRecordCount: payroll.shifts.length,
                    sourceAttendanceRecordCount: payroll.attendance.length,

                    payrollStatus:
                    "Pending",

                    paymentStatus:
                    "Unpaid",

                    createdAt:
                    serverTimestamp()

            };

            if (existingPayroll) {
                await updateDoc(payrollService.doc(db, COLLECTIONS.PAYROLL, existingPayroll.id), { ...payrollPayload, payrollStatus: "Pending", paymentStatus: "Unpaid", correctedAt: serverTimestamp(), correctedBy: payrollState.currentUser.uid, updatedAt: serverTimestamp(), updatedBy: payrollState.currentUser.uid });
                await createAuditLog("PAYROLL_CORRECTION_RECALCULATED", { payrollId: existingPayroll.id, payrollKey: payrollPeriod.key });
            } else {
                await addDoc(payrollService.collection(db, COLLECTIONS.PAYROLL), payrollPayload);
            }

            processed++;

        }

        hideLoading();

        showNotification(

            `${processed} payroll records processed${skipped ? `; ${skipped} employee(s) skipped because they are inactive, missing a guard ID, or have no valid salary profile.` : "."}`,

            "success"

        );

    }

    catch(error){

        hideLoading();

        console.error(error);

        showNotification(

            error.message,

            "error"

        );

    }

}

function ensurePayrollPreviewModal(){
    if(document.getElementById("payrollPreviewModal")) return document.getElementById("payrollPreviewModal");
    const modal=document.createElement("div");
    modal.id="payrollPreviewModal";
    modal.className="modal-layer";
    modal.innerHTML=`<div class="payroll-preview-modal"><div class="modal-header"><div><span class="section-kicker">PRE-PROCESS VALIDATION</span><h2>Payroll Run Preview</h2><p id="previewPeriodLabel">Selected payroll period</p></div><button type="button" class="action-btn action-btn-secondary" id="closePayrollPreview">Close</button></div><div id="payrollPreviewContent"><p>Preparing preview…</p></div><div class="modal-actions"><button type="button" class="action-btn action-btn-secondary" id="refreshPayrollPreview">Refresh Preview</button><button type="button" class="action-btn action-btn-primary" id="continuePayrollProcess">Continue to Process Payroll</button></div></div>`;
    document.body.appendChild(modal);
    modal.querySelector("#closePayrollPreview").onclick=()=>modal.style.display="none";
    modal.querySelector("#refreshPayrollPreview").onclick=()=>renderPayrollPreview();
    modal.querySelector("#continuePayrollProcess").onclick=async()=>{ modal.style.display="none"; await processPayroll(); };
    return modal;
}

function previewMoney(v){
    return formatCurrency(Number(v||0));
}

async function renderPayrollPreview(){
    const modal=ensurePayrollPreviewModal();
    const content=modal.querySelector("#payrollPreviewContent");
    const label=modal.querySelector("#previewPeriodLabel");
    const period=getPayrollPeriod();
    label.textContent=`${period.key || "Unselected period"}${period.startDate ? ` • ${period.startDate} → ${period.endDate}` : ""}${period.payDate ? ` • Pay date ${period.payDate}` : ""}`;
    content.innerHTML='<p class="pe-help">Validating employees, compensation profiles and payroll source records…</p>';
    modal.style.display="flex";

    const rows=[];
    let processable=0, skipped=0, warnings=0, existing=0;
    let gross=0, deductions=0, net=0;
    for(const employee of payrollState.employees){
        const profile=payrollState.salaryProfileMap.get(employee.guardId);
        const source=getPayrollSourceRecords(employee);
        const already=payrollState.payrollMap.has(`${employee.guardId}::${period.key}`);
        const issues=[];
        if(employee.active===false) issues.push("Inactive employee");
        if(!employee.guardId) issues.push("Missing Guard ID");
        if(!profile || Number(profile.basicSalary || profile.salary || 0)<=0) issues.push("Missing/invalid salary profile");
        if(!source.attendance.length && !source.shifts.length) issues.push("No payroll source records");
        else if(!source.attendance.length || !source.shifts.length) { issues.push("One payroll source stream is empty"); warnings++; }
        if(already) issues.push("Already processed for this period");
        const payroll=profile && Number(profile.basicSalary || profile.salary || 0)>0 ? buildEmployeePayroll(employee) : null;
        if(payroll?.validationIssues?.length) issues.push(...payroll.validationIssues);
        const blockingIssues=new Set(["Inactive employee","Missing Guard ID","Missing/invalid salary profile","Already processed for this period","No payroll source records","Negative earnings","Deductions exceed gross salary","Statutory configuration unavailable"]);
        const canProcess=!issues.some(x=>blockingIssues.has(x));
        if(already) existing++;
        if(canProcess){ processable++; gross+=Number(payroll?.grossSalary||0); deductions+=Number(payroll?.deductions||0); net+=Number(payroll?.netSalary||0); } else skipped++;
        if(issues.length) warnings++;
        rows.push({employee,payroll,source,issues,canProcess});
    }
    const issueRows=rows.filter(r=>r.issues.length).map(r=>`<tr><td>${r.employee.employeeID||"—"}</td><td>${r.employee.fullName||r.employee.name||"—"}</td><td>${r.issues.map(x=>`<span class="pe-status">${x}</span>`).join(" ")}</td><td>${r.source.attendance.length}</td><td>${r.source.shifts.length}</td></tr>`).join("");
    const readyRows=rows.filter(r=>r.canProcess).map(r=>`<tr><td>${r.employee.employeeID||"—"}</td><td>${r.employee.fullName||r.employee.name||"—"}</td><td>${r.source.attendance.length}</td><td>${r.source.shifts.length}</td><td>${previewMoney(r.payroll?.grossSalary)}</td><td>${previewMoney(r.payroll?.deductions)}</td><td>${previewMoney(r.payroll?.netSalary)}</td></tr>`).join("");
    content.innerHTML=`<section class="grid preview-metrics">${metric("Employees",rows.length)}${metric("Ready to process",processable)}${metric("Skipped",skipped)}${metric("Existing",existing)}${metric("Gross",previewMoney(gross))}${metric("Net",previewMoney(net))}</section><div class="card"><h3>Ready for processing</h3><div class="table"><table><thead><tr><th>Employee ID</th><th>Employee</th><th>Attendance</th><th>Shifts</th><th>Gross</th><th>Deductions</th><th>Net</th></tr></thead><tbody>${readyRows||'<tr><td colspan="7">No employees are ready to process.</td></tr>'}</tbody></table></div></div><div class="card"><h3>Exceptions & warnings</h3><p class="muted">${warnings ? `${warnings} validation item(s) require attention.` : "No validation exceptions found."}</p><div class="table"><table><thead><tr><th>Employee ID</th><th>Employee</th><th>Issue</th><th>Attendance</th><th>Shifts</th></tr></thead><tbody>${issueRows||'<tr><td colspan="5">No exceptions or warnings.</td></tr>'}</tbody></table></div></div><div class="pe-help"><b>Source contract:</b> payroll calculations use the tenant-scoped <b>shiftRecords</b> and <b>attendanceRecords</b> streams only. This preview does not write payroll records.</div>`;
    modal.querySelector("#continuePayrollProcess").disabled=processable===0;
}

async function previewPayroll(){
    if(!payrollState.currentUser || !isCompanyAdmin(payrollState.currentUser?.role)){ showNotification("Unauthorized action","error"); return; }
    await renderPayrollPreview();
}

document
.getElementById("previewPayrollButton")
.addEventListener("click", previewPayroll);

document
.getElementById("processPayrollButton")
.addEventListener(

    "click",

    processPayroll

);

async function loadPayrollRecords(){

    const payrollQuery = query(

        payrollService.collection(
            db,
            COLLECTIONS.PAYROLL
        )

    );

    onSnapshot(

        payrollQuery,

        (snapshot)=>{

            payrollState.payrollRecords = [];

            payrollState.payrollMap.clear();

            snapshot.forEach((document)=>{

                const payroll = {

                  id: document.id,

                  ...document.data()

                };

                payrollState.payrollRecords.push(
                  payroll
                );

                payrollState.payrollMap.set(
                 `${payroll.guardId}::${payroll.payrollKey || ""}`,
                 payroll
                );

            });

            updateDashboardStatistics();

            generatePayrollReports();

            renderEmployeeTable();

        }

    );

}

function updateDashboardStatistics(){

    const stats = {

        gross:0,

        net:0,

        allowances:0,

        deductions:0,

        pending:0,

        approved:0,

        paid:0

    };

    payrollState.payrollRecords.filter(p => !p.payrollKey || p.payrollKey === getSelectedPeriodKey()).forEach(

        payroll=>{

            stats.gross +=
            Number(payroll.grossSalary || 0);

            stats.net +=
            Number(payroll.netSalary || 0);

            stats.allowances +=
            Number(payroll.allowances || 0);

            stats.deductions +=
            Number(payroll.deductions || 0);

            if(
                payroll.payrollStatus === "Pending"
            ){

                stats.pending++;

            }

            if(
                payroll.payrollStatus === "Approved"
            ){

                stats.approved++;

            }

            if(
                payroll.paymentStatus === "Paid"
            ){

                stats.paid++;

            }

        }

    );

    payrollState.statistics.grossPayroll =
    stats.gross;

    payrollState.statistics.netPayroll =
    stats.net;

    payrollState.statistics.allowances =
    stats.allowances;

    payrollState.statistics.deductions =
    stats.deductions;

    payrollState.statistics.pending =
    stats.pending;

    payrollState.statistics.approved =
    stats.approved;

    payrollState.statistics.paid =
    stats.paid;

    document.getElementById(
        "grossPayroll"
    ).textContent =
    formatCurrency(stats.gross);

    document.getElementById(
        "netPayroll"
    ).textContent =
    formatCurrency(stats.net);

    document.getElementById(
        "totalAllowances"
    ).textContent =
    formatCurrency(stats.allowances);

    document.getElementById(
        "totalDeductions"
    ).textContent =
    formatCurrency(stats.deductions);

    document.getElementById(
        "pendingPayroll"
    ).textContent =
    stats.pending;

    document.getElementById(
        "approvedPayroll"
    ).textContent =
    stats.approved;

    document.getElementById(
        "paidPayroll"
    ).textContent =
    stats.paid;

}

function updatePayrollReady(){

    const ready = payrollState.employees.filter(

        employee=>{

            return payrollState.salaryProfileMap.has(
                employee.guardId
            );

        }

    ).length;

    payrollState.statistics.payrollReady =
    ready;

    document.getElementById(
        "payrollReadyCount"
    ).textContent =
    ready;

}

// ----------------------------------------EMPLOYEE PAYROLL NODAL-----------------------------------------

function setupPayrollTableEvents(){

    document.addEventListener(

        "click",

        (event)=>{


            if(
                event.target.classList.contains(
                    "viewPayrollButton"
                )
            ){

                const guardId =
                event.target.dataset.id;


                openEmployeePayrollModal(
                    guardId
                );

            }


        }

    );

}

function openEmployeePayrollModal(guardId){


    const employee =
    payrollState.employees.find(

        employee=>

        employee.guardId === guardId

    );


    if(!employee){

        showNotification(
            "Employee not found",
            "error"
        );

        return;

    }


    const payroll = getEmployeePayroll(employee);


    payrollState.selectedEmployee =
    employee;


    payrollState.selectedPayroll =
    payroll;


    renderPayrollModal(
        employee,
        payroll
    );


    DOM.employeePayrollModal.style.display = "flex";
    DOM.employeePayrollModal.setAttribute("aria-hidden", "false");

}

function renderPayrollModal(employee, payroll){
    const canEdit = canEditPayroll();
    const status = payroll.payrollStatus || "Pending";
    const payment = payroll.paymentStatus || "Unpaid";
    const safe = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
    DOM.employeePayrollModalContent.innerHTML = `
      <div class="modal-header">
        <div><span class="section-kicker">PAYROLL RECORD</span><h2>${safe(employee.fullName || "Employee")}</h2><p>${safe(employee.employeeID || "")} • ${safe(employee.position || "")}</p></div>
        <button id="closePayrollModalButton" type="button" class="action-btn action-btn-secondary">Close</button>
      </div>
      <div class="payroll-detail-grid">
        <section class="detail-card"><span>Employee</span><strong>${safe(employee.fullName)}</strong><small>${safe(employee.department || "No department")}</small></section>
        <section class="detail-card"><span>Salary Type</span><strong>${safe(payroll.salary?.salaryType || "—")}</strong><small>${formatCurrency(payroll.basicSalary)} basic</small></section>
        <section class="detail-card"><span>Payroll Status</span><strong>${safe(status)}</strong><small>Payment: ${safe(payment)}</small></section>
        <section class="detail-card"><span>Attendance</span><strong>${Number(payroll.attendancePercentage || 0).toFixed(1)}%</strong><small>${Number(payroll.workedHours || 0).toFixed(2)} hours worked</small></section>
      </div>
      <div class="detail-sections">
        <section><h3>Attendance & Shift Summary</h3><div class="detail-list"><div>Overtime <b>${Number(payroll.overtimeHours || 0).toFixed(2)} h</b></div><div>Late <b>${Number(payroll.lateMinutes || 0)} min</b></div><div>Night <b>${Number(payroll.nightHours || 0).toFixed(2)} h</b></div><div>Weekend <b>${Number(payroll.weekendHours || 0).toFixed(2)} h</b></div><div>Holiday <b>${Number(payroll.holidayHours || 0).toFixed(2)} h</b></div><div>Compliance <b>${Number(payroll.compliance || 0).toFixed(1)}%</b></div></div></section>
        <section><h3>Salary Breakdown</h3><div class="detail-list"><div>Basic Salary <b>${formatCurrency(payroll.basicSalary)}</b></div><div>Overtime <b>${formatCurrency(payroll.overtimeAmount)}</b></div><div>Allowances <b>${formatCurrency(payroll.allowances)}</b></div><div>Deductions <b>${formatCurrency(payroll.deductions)}</b></div><div>Gross <b>${formatCurrency(payroll.grossSalary)}</b></div><div class="net-row">Net Salary <b>${formatCurrency(payroll.netSalary)}</b></div></div></section>
      </div>
      <section class="notes-card"><h3>Payroll Notes</h3><textarea id="payrollNotes" placeholder="Add an internal payroll note...">${safe(payroll.notes || "")}</textarea></section>
      <div class="modal-actions">
        ${canEdit ? `<button id="updatePayrollButton" type="button" class="action-btn action-btn-primary">Save Changes</button>` : ""}
        <button id="modalGeneratePayslipButton" type="button" class="action-btn action-btn-secondary">Generate Payslip</button>
        <button id="modalPrintButton" type="button" class="action-btn action-btn-secondary">Print</button>
      </div>`;
    document.getElementById("closePayrollModalButton")?.addEventListener("click", closePayrollModal);
    document.getElementById("modalPrintButton")?.addEventListener("click", () => showPayslipPreview(payroll));
    document.getElementById("modalGeneratePayslipButton")?.addEventListener("click", () => generatePayslip(payroll));
    document.getElementById("updatePayrollButton")?.addEventListener("click", async () => {
        if (!canEdit) return showNotification("Only Company Admin can edit payroll records.", "error");
        const id = payroll.id;
        if (!id) return showNotification("This payroll record has not been saved yet.", "error");
        try {
            showLoading("Saving payroll note...");
            await updateDoc(payrollService.doc(db, COLLECTIONS.PAYROLL, id), { notes: document.getElementById("payrollNotes")?.value || "", updatedAt: serverTimestamp(), updatedBy: payrollState.currentUser.uid });
            await createAuditLog("PAYROLL_NOTE_UPDATED", { payrollId:id });
            hideLoading(); showNotification("Payroll record updated.", "success");
        } catch(error){ hideLoading(); console.error(error); showNotification("Unable to update payroll record.", "error"); }
    });
}

function closePayrollModal(){

    DOM.employeePayrollModal.style.display =

    "none";

    if(
        DOM.closePayrollModalButton
    ){

      DOM.closePayrollModalButton
     .addEventListener(

      "click",

     closePayrollModal

     );

    }

}

async function updatePayrollStatus(
payrollId,
status
){

    try{
        const current = payrollState.payrollRecords.find(x => x.id === payrollId);
        const periodState = await getPayrollPeriodState(current?.payrollKey || getSelectedPeriodKey());
        if (periodState?.locked || String(periodState?.status || "").toLowerCase() === "locked") throw new Error("Payroll period is locked. Request an authorized correction before changing payroll.");


        showLoading(
            "Updating payroll..."
        );


        const payrollRef =
        payrollService.doc(

            db,

            COLLECTIONS.PAYROLL,

            payrollId

        );


        await updateDoc(

            payrollRef,

            {

                payrollStatus:
                status,


                updatedAt:
                serverTimestamp(),


                updatedBy:
                payrollState.currentUser.uid

            }

        );

        await createAuditLog(

                "PAYROLL_STATUS_CHANGE",

            {

               payrollId,

               newStatus:status

            }

        );
        await addDoc(payrollService.collection(db, COLLECTIONS.PAYROLL_HISTORY), { payrollId, action:`status_${String(status).toLowerCase()}`, payrollKey:getSelectedPeriodKey(), performedBy:payrollState.currentUser.uid, createdAt:serverTimestamp() });


        hideLoading();


        showNotification(

            `Payroll ${status}`,

            "success"

        );


    }

    catch(error){


        hideLoading();


        console.error(error);


        showNotification(

            error.message,

            "error"

        );


    }


}



async function approvePayroll(){

    if(!payrollState.currentUser || !isCompanyAdmin(payrollState.currentUser.role)){

    showNotification(

        "Unauthorized action",

        "error"

    );

    return;

 }

    const confirmation =
    confirm(

        "Are you sure you want to approve payroll?"

    );


    if(!confirmation){

        return;

    }


    const selectedKey = getSelectedPeriodKey();
    const payrolls = payrollState.payrollRecords.filter(payroll =>
        payroll.payrollKey === selectedKey && payroll.payrollStatus === "Pending"
    );
    if (!payrolls.length) {
        showNotification("No pending payroll records are available for the selected period.", "error");
        return;
    }


    for(const payroll of payrolls){


        await updatePayrollStatus(

            payroll.id,

            "Approved"

        );


    }


}



async function finalizePayroll(){
    if (!payrollState.currentUser || !isCompanyAdmin(payrollState.currentUser.role)) {
        showNotification("Only Company Admin can finalize payroll.", "error");
        return;
    }
    const periodKey = getSelectedPeriodKey();
    const periodState = await getPayrollPeriodState(periodKey);
    if (periodState?.locked || String(periodState?.status || "").toLowerCase() === "locked") return showNotification("This payroll period is already locked.", "error");
    const records = payrollState.payrollRecords.filter(p => p.payrollKey === periodKey && p.payrollStatus === "Approved");
    if (!records.length) return showNotification("No approved payroll records are available for finalization.", "error");
    if (!confirm(`Finalize ${records.length} approved payroll record(s)? This will create immutable snapshots and lock the payroll period.`)) return;
    try {
        showLoading("Finalizing and locking payroll...");
        for (const payroll of records) {
            await updateDoc(payrollService.doc(db, COLLECTIONS.PAYROLL, payroll.id), { payrollStatus:"Finalized", finalizedAt:serverTimestamp(), finalizedBy:payrollState.currentUser.uid, updatedAt:serverTimestamp(), updatedBy:payrollState.currentUser.uid });
        }
        await createPayrollSnapshot(periodKey, records, payrollState.currentUser.uid);
        await lockPayrollPeriod(periodKey, { payrollCount: records.length, reason: "Finalization" });
        await createAuditLog("PAYROLL_PERIOD_LOCKED", { payrollCount:records.length, payrollKey:periodKey, immutableSnapshot:true });
        hideLoading(); showNotification("Payroll finalized and period locked successfully.", "success");
        await loadPayrollRecords();
        updateDashboardStatistics();
    } catch(error) { hideLoading(); console.error(error); showNotification(error.message || "Unable to finalize and lock payroll.", "error"); }
}

async function markPayrollAsPaid(){

    if(!payrollState.currentUser || !isCompanyAdmin(payrollState.currentUser.role)){

    showNotification(

        "Unauthorized action",

        "error"

    );

    return;

 }


    const confirmation =
    confirm(

        "Confirm payroll payment?"

    );


    if(!confirmation){

        return;

    }



    const payrolls =
    payrollState.payrollRecords.filter(

        payroll=>

        payroll.payrollKey === getSelectedPeriodKey() && payroll.payrollStatus === "Finalized" && payroll.paymentStatus !== "Paid"

    );



    if (!payrolls.length) {
        showNotification("No finalized unpaid payroll records are available for the selected period.", "error");
        return;
    }

    for(const payroll of payrolls){


        const payrollRef =
        payrollService.doc(

            db,

            COLLECTIONS.PAYROLL,

            payroll.id

        );


        await updateDoc(

            payrollRef,

            {

                paymentStatus:
                "Paid",


                paidDate:
                serverTimestamp(),


                updatedAt:
                serverTimestamp(),
                updatedBy: payrollState.currentUser.uid


            }

        );


    }


    await addDoc(payrollService.collection(db, COLLECTIONS.PAYROLL_HISTORY), { action:"paid", payrollCount:payrolls.length, payrollKey:getSelectedPeriodKey(), performedBy:payrollState.currentUser.uid, createdAt:serverTimestamp() });

    showNotification(

        "Payroll marked as paid",

        "success"

    );


}

document
.getElementById(
"approvePayrollButton"
)
.addEventListener(

"click",

approvePayroll

);



document
.getElementById(
"markPaidButton"
)
.addEventListener(

"click",

markPayrollAsPaid

);

async function createAuditLog(
action,
details
){


    await addDoc(

        payrollService.collection(

            db,

            COLLECTIONS.AUDIT_LOGS

        ),

        {

            action,

            details,

            performedBy:
            payrollState.currentUser.uid,


            createdAt:
            serverTimestamp()

        }

    );


}

// --------------------------------------PAYSLIP--------------------------------------------------------------

async function generatePayslip(payroll){

    if(
 !payrollState.currentUser ||
 (!isCompanyAdmin(payrollState.currentUser?.role) && !isOperationsManager(payrollState.currentUser?.role))
 ){

    showNotification(

        "Unauthorized action",

        "error"

    );

    return;

 }

    try{

        showLoading(
            "Generating payslip..."
        );


        const payslipData = {


            payrollId:
            payroll.id,


            companyId:
            payroll.companyId || "",


            guardId:
            payroll.guardId,


            employeeID:
            payroll.employeeID,


            employeeName:
            payroll.fullName,


            department:
            payroll.department,


            position:
            payroll.position,


            payrollMonth:
            payroll.payrollMonth,


            payrollPeriod:
            payroll.payrollPeriod,



            earnings:{


                basicSalary:
                payroll.basicSalary,


                overtime:
                payroll.overtimeAmount,


                allowances:
                payroll.allowances,


                bonus:
                0,


                commission:
                0

            },



            deductions:{


                paye:
                payroll.paye || 0,


                uif:
                payroll.uif || 0,


                pension:
                payroll.pension || 0,


                medicalAid:
                payroll.medicalAid || 0,


                loan:
                payroll.loan || 0,


                other:
                payroll.otherDeductions || 0

            },



            attendance:{


                workedHours:
                payroll.workedHours,


                overtimeHours:
                payroll.overtimeHours,


                lateMinutes:
                payroll.lateMinutes,


                attendancePercentage:
                payroll.attendancePercentage

            },



            totals:{


                grossSalary:
                payroll.grossSalary,


                totalDeductions:
                payroll.deductions,


                netSalary:
                payroll.netSalary

            },



            generatedBy:
            payrollState.currentUser.uid,


            createdAt:
            serverTimestamp()


        };



        const payslipRef =

        await addDoc(

            payrollService.collection(

                db,

                COLLECTIONS.PAYSLIPS

            ),

            payslipData

        );



        hideLoading();


        showNotification(

            "Payslip generated successfully",

            "success"

        );


        return payslipRef.id;


    }


    catch(error){


        hideLoading();


        console.error(error);


        showNotification(

            error.message,

            "error"

        );


    }

}

document
.getElementById(
"generatePayslipButton"
)
.addEventListener(

"click",

()=>{


    if(

        payrollState.selectedPayroll

    ){

        generatePayslip(

            payrollState.selectedPayroll

        );

    }


});

function showPayslipPreview(payslip){

    const windowPrint =
    window.open(
        "",
        "_blank"
    );


    windowPrint.document.write(`

    <html>

    <head>

    <title>
    Payslip
    </title>


    </head>


    <body>


    <h1>
    ${payrollState.company.companyName}
    </h1>


    <h2>
    Employee Payslip
    </h2>


    <hr>


    <p>
    Employee:
    ${payslip.employeeName}
    </p>


    <p>
    Employee ID:
    ${payslip.employeeID}
    </p>


    <p>
    Department:
    ${payslip.department}
    </p>


    <hr>


    <h3>
    Earnings
    </h3>


    <p>
    Basic Salary:
    R${payslip.earnings.basicSalary}
    </p>


    <p>
    Overtime:
    R${payslip.earnings.overtime}
    </p>


    <p>
    Allowances:
    R${payslip.earnings.allowances}
    </p>


    <hr>


    <h3>
    Deductions
    </h3>


    <p>
    Total Deductions:
    R${payslip.totals.totalDeductions}
    </p>


    <hr>


    <h2>
    Net Salary:
    R${payslip.totals.netSalary}
    </h2>


    </body>

    </html>

    `);


}

function generatePayrollReports(){


    payrollState.reports = {


        monthly:

        monthlyPayrollReport(

            payrollState.payrollRecords,

            document.getElementById(
                "payrollMonth"
            ).value

        ),



        allowances:

        allowanceReport(

            payrollState.payrollRecords

        ),



        deductions:

        deductionReport(

            payrollState.payrollRecords

        ),



        overtime:

        overtimeReport(

            payrollState.payrollRecords

        ),



        attendance:

        attendanceReport(

            payrollState.payrollRecords

        ),



        UIF:

        UIFReport(

            payrollState.payrollRecords

        ),



        PAYE:

        PAYEReport(

            payrollState.payrollRecords

        )


    };


}

// ------------------------------------------COMPANY--------------------------------------------------------------

async function loadCompanyInformation(){
    try {
        const companyId = payrollState.currentUser?.companyId;
        if (!companyId) throw new Error("Company context is missing.");
        const direct = await getDoc(doc(db, "companies", companyId));
        if (direct.exists()) {
            payrollState.company = { id: direct.id, ...direct.data() };
            updateCompanyUI();
            return;
        }
        // Backward-compatible fallback for the original payroll structure.
        const snapshot = await getDocs(query(payrollService.collection(db, COLLECTIONS.COMPANY)));
        if (!snapshot.empty) {
            const company = snapshot.docs[0];
            payrollState.company = { id: company.id, ...company.data() };
            updateCompanyUI();
        }
    } catch(error) {
        console.error("Company loading failed:", error);
        showNotification("Unable to load company information.", "error");
    }
}

function updateCompanyUI(){


    if(
        !payrollState.company
    ){

        return;

    }


    const company =
    payrollState.company;



    const name =
    document.getElementById(
        "companyName"
    );


    if(name){

        name.textContent =
        company.companyName;

    }



    const logo =
    document.getElementById(
        "companyLogo"
    );


    if(

        logo &&
        company.logoBase64

    ){

        logo.src =
        company.logoBase64;

    }


}

// --------------------------------------------PAYROLL SETTINGS----------------------------------------------------

async function loadPayrollSettings(){

    try{


        const settingsQuery =
        query(

            payrollService.collection(
                db,
                COLLECTIONS.SETTINGS
            )

        );


        const snapshot =
        await getDocs(
            settingsQuery
        );


        if(
            !snapshot.empty
        ){

            payrollState.settings = {

                id:
                snapshot.docs[0].id,

                ...snapshot.docs[0].data()

            };


        }


    }

    catch(error){


        console.error(error);


    }

}


// =======================================================
// PAYROLL PERIOD LOCK / CORRECTION ACTIONS
// =======================================================
async function requestSelectedPayrollCorrection(){
    if (!payrollState.currentUser || !isCompanyAdmin(payrollState.currentUser.role)) return showNotification("Only Company Admin can request a payroll correction.", "error");
    const key = getSelectedPeriodKey();
    const reason = prompt("Enter the reason for reopening this payroll period for correction:");
    if (!reason || !reason.trim()) return;
    try {
        showLoading("Creating correction request...");
        await requestPayrollCorrection(key, reason.trim(), [], payrollState.currentUser.uid);
        await createAuditLog("PAYROLL_CORRECTION_REQUESTED", { payrollKey:key, reason:reason.trim() });
        hideLoading(); showNotification("Correction request recorded. The period remains locked until it is explicitly reopened.", "success");
    } catch (e) { hideLoading(); console.error(e); showNotification(e.message || "Unable to create correction request.", "error"); }
}

async function reopenSelectedPayrollPeriod(){
    if (!payrollState.currentUser || !isCompanyAdmin(payrollState.currentUser.role)) return showNotification("Only Company Admin can reopen a payroll period.", "error");
    const key = getSelectedPeriodKey();
    const reason = prompt("Enter the authorized correction reason to reopen this payroll period:");
    if (!reason || !reason.trim()) return;
    try {
        showLoading("Reopening payroll period for correction...");
        await requestPayrollCorrection(key, reason.trim(), [], payrollState.currentUser.uid);
        await reopenPayrollPeriod(key, reason.trim(), payrollState.currentUser.uid);
        await createAuditLog("PAYROLL_PERIOD_REOPENED_FOR_CORRECTION", { payrollKey:key, reason:reason.trim() });
        hideLoading(); showNotification("Payroll period reopened in Correction mode.", "success");
        await loadConfiguredPayrollPeriods();
    } catch (e) { hideLoading(); console.error(e); showNotification(e.message || "Unable to reopen payroll period.", "error"); }
}

// =======================================================
// PAYROLL V9 WORKFLOW / UI CONTROLS
// Preserves existing payroll IDs and business functions.
// =======================================================

async function loadConfiguredPayrollPeriods(){
    const period = document.getElementById("payrollPeriodSelector");
    const month = document.getElementById("payrollMonth");
    if(!period || !month || !payrollState.currentUser?.companyId) return;
    try{
        const snap = await getDocs(payrollService.collection(db, COLLECTIONS.PAYROLL_PERIODS));
        payrollState.payrollPeriods = snap.docs.map(d=>({id:d.id,...d.data()}));
        if(!payrollState.payrollPeriods.length) return;
        const configured = payrollState.payrollPeriods.filter(x=>x.status !== "Locked");
        if(configured.length){
            period.innerHTML = "";
            configured.sort((a,b)=>String(b.month||"").localeCompare(String(a.month||""))).forEach(x=>{
                const key=x.key||x.id;
                const lockLabel=String(x.status||"Open").toLowerCase()==="locked"?" • 🔒 Locked":String(x.status||"Open").toLowerCase()==="correction"?" • ⚠ Correction":"";
                const label=`${x.month||key} • ${String(x.period||"monthly").replace(/_/g," ")}${lockLabel}`;
                period.add(new Option(label,key));
            });
            const currentMonth=month.value;
            const preferred=configured.find(x=>x.key===`${currentMonth}_monthly`) || configured[0];
            if(preferred){
                month.value=preferred.month||currentMonth;
                period.value=preferred.key||preferred.id;
            }
            updateSelectedPeriodLabel();
        }
    }catch(error){ console.warn("Unable to load configured payroll periods",error); }
}

function setupPayrollPeriodControls(){
    const month = document.getElementById("payrollMonth");
    const period = document.getElementById("payrollPeriodSelector");
    if (!month || !period) return;

    if (!month.options.length || month.options.length === 1) {
        month.innerHTML = "";
        const now = new Date();
        for (let i = 0; i < 12; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const value = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
            const label = d.toLocaleDateString(undefined, {month:"long", year:"numeric"});
            month.add(new Option(label, value));
        }
    }
    if (!period.options.length || period.options.length === 1) {
        period.innerHTML = "";
        [
            ["monthly", "Monthly"],
            ["weekly_1", "Week 1"],
            ["weekly_2", "Week 2"],
            ["weekly_3", "Week 3"],
            ["weekly_4", "Week 4"],
            ["weekly_5", "Week 5"]
        ].forEach(([value,label]) => period.add(new Option(label,value)));
    }
    const nowValue = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,"0")}`;
    month.value = month.value || nowValue;
    period.value = period.value || "monthly";
    month.addEventListener("change", () => { updateSelectedPeriodLabel(); renderEmployeeTable(); });
    period.addEventListener("change", () => { updateSelectedPeriodLabel(); renderEmployeeTable(); });
}

function updateSelectedPeriodLabel(){
    const month = document.getElementById("payrollMonth");
    const period = document.getElementById("payrollPeriodSelector");
    const label = document.getElementById("selectedPeriodLabel");
    if (label && month && period) {
        const m = month.options[month.selectedIndex]?.text || "Current month";
        const p = period.options[period.selectedIndex]?.text || "Monthly";
        label.textContent = `${m} • ${p}`;
    }
}

function setupPayrollFilters(){
    const inputs = ["searchEmployee","searchEmployeeID","filterDepartment","filterPosition","filterPayrollStatus","filterSalaryType","filterPaymentStatus"];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener(el.tagName === "INPUT" ? "input" : "change", () => {
                if (id === "searchEmployee") payrollState.filters.search = el.value.trim().toLowerCase();
                if (id === "searchEmployeeID") payrollState.filters.employeeID = el.value.trim().toLowerCase();
                if (id === "filterDepartment") payrollState.filters.department = el.value;
                if (id === "filterPosition") payrollState.filters.position = el.value;
                if (id === "filterPayrollStatus") payrollState.filters.payrollStatus = el.value;
                if (id === "filterSalaryType") payrollState.filters.salaryType = el.value;
                if (id === "filterPaymentStatus") payrollState.filters.paymentStatus = el.value;
                renderEmployeeTable();
            });
        }
    });
}

function setupPayrollActionButtons(){
    const toolbar = document.getElementById("payrollToolbar");
    if (toolbar && !document.getElementById("requestPayrollCorrectionButton")) {
        const b=document.createElement("button"); b.id="requestPayrollCorrectionButton"; b.type="button"; b.className="action-btn action-btn-secondary"; b.textContent="Request Correction"; b.onclick=requestSelectedPayrollCorrection; toolbar.appendChild(b);
        const r=document.createElement("button"); r.id="reopenPayrollPeriodButton"; r.type="button"; r.className="action-btn action-btn-warning"; r.textContent="Reopen for Correction"; r.onclick=reopenSelectedPayrollPeriod; toolbar.appendChild(r);
    }
    const refresh = document.getElementById("refreshPayrollButton");
    refresh?.addEventListener("click", () => location.reload());
    document.getElementById("backDashboardButton")?.addEventListener("click", () => location.href = "admin.html");
    document.getElementById("printPayrollButton")?.addEventListener("click", () => window.print());
    document.getElementById("exportCSVButton")?.addEventListener("click", () => exportCurrentPayroll("csv"));
    document.getElementById("exportExcelButton")?.addEventListener("click", () => exportCurrentPayroll("excel"));
    document.getElementById("exportPDFButton")?.addEventListener("click", () => window.print());
    document.getElementById("payrollSettingsButton")?.addEventListener("click", () => showNotification("Payroll settings are managed from the company configuration.", "success"));
}

async function exportCurrentPayroll(type){
    const records = payrollState.payrollRecords || [];
    if (!records.length) return showNotification("There are no payroll records to export.", "error");
    try {
        if (type === "csv") await exportPayrollCSV(records);
        else await exportPayrollExcel(records);
        showNotification(`${type.toUpperCase()} export prepared.`, "success");
    } catch (error) {
        console.error(error);
        showNotification(`Unable to export ${type.toUpperCase()}.`, "error");
    }
}

function canEditPayroll(){
    return isCompanyAdmin(payrollState.currentUser?.role);
}

// -------------------------------------AUTHENTIFICATION----------------------------------------------------------
async function checkAdminAccess(){

    try {
        const user = auth.currentUser;
        if (!user) {
            redirectToLogin();
            return false;
        }

        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (!userSnap.exists()) {
            showNotification("User profile not found.", "error");
            await signOut(auth);
            redirectToLogin();
            return false;
        }

        const userData = userSnap.data();
        const role = normalizeRole(userData.role);
        const allowedRoles = ["company_admin", "operations_manager"];

        if (!allowedRoles.includes(role)) {
            showNotification("Payroll access is restricted to authorized company management.", "error");
            location.href = "admin.html";
            return false;
        }

        if (userData.status && String(userData.status).toLowerCase() !== "active") {
            showNotification("Your account is suspended.", "error");
            await signOut(auth);
            redirectToLogin();
            return false;
        }

        if (!userData.companyId) {
            showNotification("No company is assigned to this account.", "error");
            return false;
        }

        payrollState.currentUser = { ...user, ...userData, role };
        DOM.loggedAdmin.textContent = userData.displayName || userData.email || "Administrator";
        return true;
    } catch (error) {
        console.error("Payroll access check failed:", error);
        showNotification("Unable to verify payroll access.", "error");
        return false;
    }
}
