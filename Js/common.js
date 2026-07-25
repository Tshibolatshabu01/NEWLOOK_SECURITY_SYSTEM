/*=====================================================
REPORTS DATA
=====================================================*/
const reportType = document.getElementById("reportType")

const reportGuard = document.getElementById("reportGuard");
const reportCustomer = document.getElementById("reportCustomer");

const reportFromDate = document.getElementById("reportFromDate");
const reportToDate = document.getElementById("reportToDate");

const generateReportBtn =
document.getElementById("generateReport");

const printReportBtn =
document.getElementById("printReport");

const exportPDFBtn =
document.getElementById("exportPDF");

const exportExcelBtn =
document.getElementById("exportExcel");

const reportViewer =
document.getElementById("reportViewer");

reportType.addEventListener("change", () => {

    reportGuard.parentElement.style.display = "none";
    reportCustomer.parentElement.style.display = "none";

    if(reportType.value === "single"){

        reportGuard.parentElement.style.display = "block";

    }

    if(reportType.value === "customer"){

        reportCustomer.parentElement.style.display = "block";

    }

});

async function loadReportGuards(){

    reportGuard.innerHTML =
    `<option value="">Select Guard</option>`;

    const snapshot =
    await getDocs(collection(db,"guards"));

    snapshot.forEach(doc=>{

        const guard = doc.data();

        reportGuard.innerHTML += `

        <option

            value="${guard.guardId}"

            data-employee="${guard.employeeID}"

            data-site="${guard.siteId || ""}">

            ${guard.fullName}

        </option>

        `;

    });

}

async function loadReportCustomers(){

    reportCustomer.innerHTML =
    `<option value="">Select Customer</option>`;

    const snapshot =
    await getDocs(collection(db,"sites"));

    snapshot.forEach(doc=>{

        const site = doc.data();

        reportCustomer.innerHTML += `

        <option value="${site.siteId}">

            ${site.customerName}

        </option>

        `;

    });

}

loadReportGuards();

loadReportCustomers();

generateReportBtn.addEventListener(

    "click",

    generateReport

);

async function generateReport(){

    if(!reportFromDate.value){

        alert("Select From Date");

        return;

    }

    if(!reportToDate.value){

        alert("Select To Date");

        return;

    }

    switch(reportType.value){

        case "single":

            await generateSingleGuardReport();

            break;

        case "all":

            await generateAllGuardsReport();

            break;

        case "customer":

            await generateCustomerReport();

            break;

        default:

            alert("Select Report Type");

    }

}

async function getAttendanceRecords(){

    const snapshot =

    await getDocs(

        collection(db,"attendanceRecords")

    );

    const records = [];

    snapshot.forEach(doc=>{

        records.push({

            id:doc.id,

            ...doc.data()

        });

    });

    return records;

}

function formatTimestamp(timestamp){

    if(!timestamp) return "-";

    if(timestamp.toDate){

        return timestamp
            .toDate()
            .toLocaleString();

    }

    return new Date(timestamp)
        .toLocaleString();

}

async function generateSingleGuardReport(){

    if(!reportGuard.value){

        alert("Select a guard.");

        return;

    }

    const option =
    reportGuard.options[
        reportGuard.selectedIndex
    ];

    const guardId =
    option.value;

    const employeeID =
    option.dataset.employee;

    const allRecords =
    await getAttendanceRecords();

    const records =
    allRecords.filter(record=>

        record.guardId===guardId &&

        record.employeeID===employeeID &&

        record.recordDate>=reportFromDate.value &&

        record.recordDate<=reportToDate.value

    );

    if(records.length===0){

        reportViewer.innerHTML=`

        <div class="report-placeholder">

            <h3>

                No Attendance Records Found

            </h3>

        </div>

        `;

        return;

    }

    records.sort((a,b)=>

        a.recordDate.localeCompare(

            b.recordDate

        )

    );

    const guard=
    records[0];

    const totals=
    calculateAttendanceTotals(records);

    let rows="";

    records.forEach(record=>{

        rows+=`

        <tr>

            <td>${record.recordDate}</td>

            <td>${formatTimestamp(record.firstClockIn)}</td>

            <td>${formatTimestamp(record.lastClockOut)}</td>

            <td>${record.totalWorkingHours||0}</td>

            <td>${record.expectedWorkingHours||0}</td>

            <td>${record.lateMinutes||0}</td>

            <td>${record.overtimeMinutes||0}</td>

            <td>${record.shortageMinutes||0}</td>

            <td>${record.attendancePercentage||0}%</td>

            <td>${record.attendanceStatus}</td>

            <td>${record.siteName}</td>

            <td>${record.assignedShift}</td>

        </tr>

        `;

    });

    reportViewer.innerHTML=`

<div class="report-page page-break">

<div class="report-header">

<div>

<img
src="images/logo.png"
class="company-logo">

</div>

<div class="company-details">

<h2>

NEWLOOK SECURITY

</h2>

<h4>

Guard Attendance Report

</h4>

<p>

Reporting Period

<br>

${reportFromDate.value}

-

${reportToDate.value}

</p>

</div>

<div class="generated-details">

Generated By :

${generatedBy}

<br><br>

Date :

${new Date().toLocaleDateString()}

<br>

Time :

${new Date().toLocaleTimeString()}

</div>

</div>

<div class="guard-info">

<div>

<strong>Guard</strong>

<br>

${guard.guardName}

</div>

<div>

<strong>Employee ID</strong>

<br>

${guard.employeeID}

</div>

<div>

<strong>Department</strong>

<br>

${guard.department}

</div>

<div>

<strong>Site</strong>

<br>

${guard.siteName}

</div>

</div>

<table class="report-table">

<thead>

<tr>

<th>Date</th>

<th>Clock In</th>

<th>Clock Out</th>

<th>Worked</th>

<th>Expected</th>

<th>Late</th>

<th>Overtime</th>

<th>Shortage</th>

<th>Attendance %</th>

<th>Status</th>

<th>Site</th>

<th>Shift</th>

</tr>

</thead>

<tbody>

${rows}

</tbody>

</table>

<div class="report-summary">

<div class="summary-card">

<h4>

Attendance Summary

</h4>

<p>Total Working Days : ${totals.totalWorkingDays}</p>

<p>Present Days : ${totals.presentDays}</p>

<p>Late Days : ${totals.lateDays}</p>

<p>Absent Days : ${totals.absentDays}</p>

<p>Total Worked Hours : ${totals.workedHours}</p>

<p>Total Expected Hours : ${totals.expectedHours}</p>

<p>Total Overtime : ${totals.overtimeHours}</p>

<p>Total Shortage : ${totals.shortageHours}</p>

<p>Average Attendance : ${totals.averageAttendance}%</p>

<p>Average Hours/Day : ${totals.averageHours}</p>

</div>

</div>

<div class="signature-section">

<div class="signature-box">

<div class="signature-line">

Supervisor

</div>

</div>

<div class="signature-box">

<div class="signature-line">

Manager

</div>

</div>

</div>

</div>

`;

}

function calculateAttendanceTotals(records){

    let present=0;
    let absent=0;
    let late=0;

    let worked=0;
    let expected=0;

    let overtime=0;
    let shortage=0;

    let attendance=0;

    records.forEach(record=>{

        if(record.attendanceStatus==="Present")
            present++;

        if(record.attendanceStatus==="Absent")
            absent++;

        if(record.lateMinutes>0)
            late++;

        worked+=Number(
            record.totalWorkingHours||0
        );

        expected+=Number(
            record.expectedWorkingHours||0
        );

        overtime+=Number(
            record.overtimeMinutes||0
        )/60;

        shortage+=Number(
            record.shortageMinutes||0
        )/60;

        attendance+=Number(
            record.attendancePercentage||0
        );

    });

    return{

        totalWorkingDays:
        records.length,

        presentDays:
        present,

        absentDays:
        absent,

        lateDays:
        late,

        workedHours:
        worked.toFixed(2),

        expectedHours:
        expected.toFixed(2),

        overtimeHours:
        overtime.toFixed(2),

        shortageHours:
        shortage.toFixed(2),

        averageHours:
        records.length
        ?
        (
            worked/
            records.length
        ).toFixed(2)
        :
        "0",

        averageAttendance:
        records.length
        ?
        (
            attendance/
            records.length
        ).toFixed(2)
        :
        "0"

    };

}

/*=====================================================
ALL GUARDS REPORT
=====================================================*/

async function generateAllGuardsReport(){

    const records =
    await getAttendanceRecords();

    const groupedGuards = {};

    records.forEach(record=>{

        if(

            record.recordDate >= reportFromDate.value &&

            record.recordDate <= reportToDate.value

        ){

            const key =

            `${record.guardId}_${record.employeeID}`;

            if(!groupedGuards[key]){

                groupedGuards[key] = [];

            }

            groupedGuards[key].push(record);

        }

    });

    const guardKeys =
    Object.keys(groupedGuards);

    if(guardKeys.length===0){

        reportViewer.innerHTML=`

        <div class="report-placeholder">

            <h3>

                No Attendance Records Found

            </h3>

        </div>

        `;

        return;

    }

    let html="";

    guardKeys.forEach(key=>{

        const records =
        groupedGuards[key];

        records.sort((a,b)=>

            a.recordDate.localeCompare(

                b.recordDate

            )

        );

        const guard =
        records[0];

        const totals =
        calculateAttendanceTotals(records);

        let rows="";

        records.forEach(record=>{

            rows+=`

            <tr>

                <td>${record.recordDate}</td>

                <td>${formatTimestamp(record.firstClockIn)}</td>

                <td>${formatTimestamp(record.lastClockOut)}</td>

                <td>${record.totalWorkingHours||0}</td>

                <td>${record.expectedWorkingHours||0}</td>

                <td>${record.lateMinutes||0}</td>

                <td>${record.overtimeMinutes||0}</td>

                <td>${record.shortageMinutes||0}</td>

                <td>${record.attendancePercentage||0}%</td>

                <td>${record.attendanceStatus}</td>

                <td>${record.siteName}</td>

                <td>${record.assignedShift}</td>

            </tr>

            `;

        });

        html += `

<div class="report-page page-break">

<div class="report-header">

<div>

<img
src="images/logo.png"
class="company-logo">

</div>

<div class="company-details">

<h2>

NEWLOOK SECURITY

</h2>

<h4>

All Guards Attendance Report

</h4>

<p>

Reporting Period

<br>

${reportFromDate.value}

-

${reportToDate.value}

</p>

</div>

<div class="generated-details">

Generated By :

${generatedBy}

<br><br>

Date :

${new Date().toLocaleDateString()}

<br>

Time :

${new Date().toLocaleTimeString()}

</div>

</div>

<div class="guard-info">

<div>

<strong>Guard</strong>

<br>

${guard.guardName}

</div>

<div>

<strong>Employee ID</strong>

<br>

${guard.employeeID}

</div>

<div>

<strong>Department</strong>

<br>

${guard.department}

</div>

<div>

<strong>Site</strong>

<br>

${guard.siteName}

</div>

</div>

<table class="report-table">

<thead>

<tr>

<th>Date</th>

<th>Clock In</th>

<th>Clock Out</th>

<th>Worked</th>

<th>Expected</th>

<th>Late</th>

<th>Overtime</th>

<th>Shortage</th>

<th>Attendance %</th>

<th>Status</th>

<th>Site</th>

<th>Shift</th>

</tr>

</thead>

<tbody>

${rows}

</tbody>

</table>

<div class="report-summary">

<div class="summary-card">

<h4>

Attendance Summary

</h4>

<p>Total Working Days : ${totals.totalWorkingDays}</p>

<p>Present Days : ${totals.presentDays}</p>

<p>Late Days : ${totals.lateDays}</p>

<p>Absent Days : ${totals.absentDays}</p>

<p>Total Worked Hours : ${totals.workedHours}</p>

<p>Total Expected Hours : ${totals.expectedHours}</p>

<p>Total Overtime : ${totals.overtimeHours}</p>

<p>Total Shortage : ${totals.shortageHours}</p>

<p>Average Attendance : ${totals.averageAttendance}%</p>

<p>Average Hours/Day : ${totals.averageHours}</p>

</div>

</div>

<div class="signature-section">

<div class="signature-box">

<div class="signature-line">

Supervisor

</div>

</div>

<div class="signature-box">

<div class="signature-line">

Manager

</div>

</div>

</div>

</div>

`;

    });

    reportViewer.innerHTML = html;

}

/*=====================================================
CUSTOMER REPORT
=====================================================*/

async function generateCustomerReport(){

    if(!reportCustomer.value){

        alert("Select a customer.");

        return;

    }

    const siteId = reportCustomer.value;

    const allRecords =
    await getAttendanceRecords();

    const groupedGuards = {};

    allRecords.forEach(record=>{

        if(

            record.siteId === siteId &&

            record.recordDate >= reportFromDate.value &&

            record.recordDate <= reportToDate.value

        ){

            const key =

            `${record.guardId}_${record.employeeID}`;

            if(!groupedGuards[key]){

                groupedGuards[key]=[];

            }

            groupedGuards[key].push(record);

        }

    });

    const guardKeys =
    Object.keys(groupedGuards);

    if(guardKeys.length===0){

        reportViewer.innerHTML=`

        <div class="report-placeholder">

            <h3>

                No Attendance Records Found

            </h3>

        </div>

        `;

        return;

    }

    let html="";

    guardKeys.forEach(key=>{

        const records =
        groupedGuards[key];

        records.sort((a,b)=>

            a.recordDate.localeCompare(

                b.recordDate

            )

        );

        const guard =
        records[0];

        const totals =
        calculateAttendanceTotals(records);

        let rows="";

        records.forEach(record=>{

            rows+=`

            <tr>

                <td>${record.recordDate}</td>

                <td>${formatTimestamp(record.firstClockIn)}</td>

                <td>${formatTimestamp(record.lastClockOut)}</td>

                <td>${record.totalWorkingHours||0}</td>

                <td>${record.expectedWorkingHours||0}</td>

                <td>${record.lateMinutes||0}</td>

                <td>${record.overtimeMinutes||0}</td>

                <td>${record.shortageMinutes||0}</td>

                <td>${record.attendancePercentage||0}%</td>

                <td>${record.attendanceStatus}</td>

                <td>${record.siteName}</td>

                <td>${record.assignedShift}</td>

            </tr>

            `;

        });

        html+=`

<div class="report-page page-break">

<div class="report-header">

<div>

<img
src="images/logo.png"
class="company-logo">

</div>

<div class="company-details">

<h2>

NEWLOOK SECURITY

</h2>

<h4>

Customer Attendance Report

</h4>

<p>

Customer :
${guard.siteName}

<br>

${reportFromDate.value}

-

${reportToDate.value}

</p>

</div>

<div class="generated-details">

Generated By :

${generatedBy}

<br><br>

Date :

${new Date().toLocaleDateString()}

<br>

Time :

${new Date().toLocaleTimeString()}

</div>

</div>

<div class="guard-info">

<div>

<strong>Guard</strong>

<br>

${guard.guardName}

</div>

<div>

<strong>Employee ID</strong>

<br>

${guard.employeeID}

</div>

<div>

<strong>Department</strong>

<br>

${guard.department}

</div>

<div>

<strong>Site</strong>

<br>

${guard.siteName}

</div>

</div>

<table class="report-table">

<thead>

<tr>

<th>Date</th>

<th>Clock In</th>

<th>Clock Out</th>

<th>Worked</th>

<th>Expected</th>

<th>Late</th>

<th>Overtime</th>

<th>Shortage</th>

<th>Attendance %</th>

<th>Status</th>

<th>Site</th>

<th>Shift</th>

</tr>

</thead>

<tbody>

${rows}

</tbody>

</table>

<div class="report-summary">

<div class="summary-card">

<h4>

Attendance Summary

</h4>

<p>Total Working Days : ${totals.totalWorkingDays}</p>

<p>Present Days : ${totals.presentDays}</p>

<p>Late Days : ${totals.lateDays}</p>

<p>Absent Days : ${totals.absentDays}</p>

<p>Total Worked Hours : ${totals.workedHours}</p>

<p>Total Expected Hours : ${totals.expectedHours}</p>

<p>Total Overtime : ${totals.overtimeHours}</p>

<p>Total Shortage : ${totals.shortageHours}</p>

<p>Average Attendance : ${totals.averageAttendance}%</p>

<p>Average Hours/Day : ${totals.averageHours}</p>

</div>

</div>

<div class="signature-section">

<div class="signature-box">

<div class="signature-line">

Supervisor

</div>

</div>

<div class="signature-box">

<div class="signature-line">

Manager

</div>

</div>

</div>

</div>

`;

    });

    reportViewer.innerHTML = html;

}

/*=====================================================
PRINT REPORT
=====================================================*/

printReportBtn.addEventListener("click", () => {

    if(reportViewer.innerHTML.trim() === ""){

        alert("Generate a report first.");

        return;

    }

    const printWindow = window.open("", "_blank");

    printWindow.document.write(`

    <html>

    <head>

        <title>NEWLOOK Attendance Report</title>

        <link rel="stylesheet" href="admin.css">

    </head>

    <body>

        ${reportViewer.innerHTML}

    </body>

    </html>

    `);

    printWindow.document.close();

    printWindow.focus();

    printWindow.print();

});

/*=====================================================
EXPORT PDF
=====================================================*/

exportPDFBtn.addEventListener("click", async () => {

    if(reportViewer.innerHTML.trim() === ""){

        alert("Generate a report first.");

        return;

    }

    const report = reportViewer;

    const originalWidth = report.style.width;
    const originalMaxWidth = report.style.maxWidth;
    const originalBackground = report.style.background;

    report.style.width = "210mm";
    report.style.maxWidth = "210mm";
    report.style.background = "#ffffff";

    try{

        await html2pdf()

        .set({

            margin: 5,

            filename:

            `Attendance_Report_${new Date().getTime()}.pdf`,

            image:{

                type:"jpeg",

                quality:1

            },

            html2canvas:{

                scale:2,

                useCORS:true,

                scrollY:0

            },

            jsPDF:{

                unit:"mm",

                format:"a4",

                orientation:"portrait"

            },

            pagebreak:{

                mode:["css","legacy"]

            }

        })

        .from(report)

        .save();

    }

    finally{

        report.style.width = originalWidth;

        report.style.maxWidth = originalMaxWidth;

        report.style.background = originalBackground;

    }

});

/*=====================================================
EXPORT EXCEL
=====================================================*/

exportExcelBtn.addEventListener("click", () => {

    if(reportViewer.innerHTML.trim() === ""){

        alert("Generate a report first.");

        return;

    }

    const tables = reportViewer.querySelectorAll("table");

    if(tables.length === 0){

        alert("No report data found.");

        return;

    }

    const workbook = XLSX.utils.book_new();

    tables.forEach((table,index)=>{

        const worksheet = XLSX.utils.table_to_sheet(table);

        let sheetName = `Report ${index + 1}`;

        const title = table
            .closest(".report-page")
            ?.querySelector(".guard-info strong");

        if(title){

            sheetName = `Guard ${index + 1}`;

        }

        XLSX.utils.book_append_sheet(

            workbook,

            worksheet,

            sheetName

        );

    });

    XLSX.writeFile(

        workbook,

        `Attendance_Report_${new Date().getTime()}.xlsx`

    );

});