/*
======================================================
NEWLOOK SECURITY SYSTEM

Payroll Export Module

Handles:
- CSV Export
- Excel Export
- Printing
- PDF preparation

Currency:
South African Rand (ZAR)

======================================================
*/


export function formatExportCurrency(amount){

    return Number(amount || 0)
    .toFixed(2);

}



/*
======================================================
EXPORT CSV
======================================================
*/


export function exportPayrollCSV(payrollRecords){


    if(!payrollRecords.length){

        alert(
            "No payroll records available."
        );

        return;

    }


    const headers = [

        "Employee ID",

        "Employee Name",

        "Department",

        "Basic Salary",

        "Overtime",

        "Allowances",

        "Deductions",

        "Gross Salary",

        "Net Salary",

        "Payroll Status",

        "Payment Status"

    ];



    const rows = payrollRecords.map(

        payroll=>[


            payroll.employeeID,


            payroll.fullName,


            payroll.department,


            formatExportCurrency(
                payroll.basicSalary
            ),


            formatExportCurrency(
                payroll.overtimeAmount
            ),


            formatExportCurrency(
                payroll.allowances
            ),


            formatExportCurrency(
                payroll.deductions
            ),


            formatExportCurrency(
                payroll.grossSalary
            ),


            formatExportCurrency(
                payroll.netSalary
            ),


            payroll.payrollStatus,


            payroll.paymentStatus


        ]

    );



    let csv = headers.join(",") + "\n";



    rows.forEach(row=>{


        csv += row.join(",") + "\n";


    });



    downloadFile(

        csv,

        "payroll.csv",

        "text/csv"

    );


}





/*
======================================================
EXPORT EXCEL
======================================================
*/


export function exportPayrollExcel(records){


    let table = `

    <table border="1">

    <tr>

    <th>Employee ID</th>

    <th>Name</th>

    <th>Department</th>

    <th>Basic Salary</th>

    <th>Gross</th>

    <th>Net</th>

    </tr>

    `;



    records.forEach(payroll=>{


        table += `

        <tr>

        <td>
        ${payroll.employeeID}
        </td>


        <td>
        ${payroll.fullName}
        </td>


        <td>
        ${payroll.department}
        </td>


        <td>
        R${formatExportCurrency(payroll.basicSalary)}
        </td>


        <td>
        R${formatExportCurrency(payroll.grossSalary)}
        </td>


        <td>
        R${formatExportCurrency(payroll.netSalary)}
        </td>


        </tr>

        `;


    });



    table += "</table>";



    downloadFile(

        table,

        "payroll.xls",

        "application/vnd.ms-excel"

    );


}





/*
======================================================
PRINT PAYROLL
======================================================
*/


export function printPayroll(records){


    const printWindow =
    window.open(
        "",
        "_blank"
    );



    printWindow.document.write(`


    <html>


    <head>


    <title>
    Payroll Report
    </title>


    </head>


    <body>


    <h1>
    Payroll Report
    </h1>



    <table border="1"
    cellpadding="8">


    <tr>

    <th>
    Employee
    </th>


    <th>
    Gross
    </th>


    <th>
    Net
    </th>


    </tr>


    ${
        records.map(

            payroll=>`

            <tr>


            <td>
            ${payroll.fullName}
            </td>


            <td>
            R${formatExportCurrency(payroll.grossSalary)}
            </td>


            <td>
            R${formatExportCurrency(payroll.netSalary)}
            </td>


            </tr>

            `

        ).join("")

    }


    </table>


    </body>


    </html>


    `);



    printWindow.print();


}





/*
======================================================
DOWNLOAD HELPER
======================================================
*/


function downloadFile(

content,

filename,

type

){


    const blob =
    new Blob(

        [content],

        {

            type

        }

    );



    const url =
    URL.createObjectURL(
        blob
    );



    const link =
    document.createElement(
        "a"
    );



    link.href=url;


    link.download=filename;



    link.click();



    URL.revokeObjectURL(
        url
    );

}

document
.getElementById(
"exportCSVButton"
)
.addEventListener(

"click",

()=>{

exportPayrollCSV(

payrollState.payrollRecords

);

}

);



document
.getElementById(
"exportExcelButton"
)
.addEventListener(

"click",

()=>{

exportPayrollExcel(

payrollState.payrollRecords

);

}

);



document
.getElementById(
"printPayrollButton"
)
.addEventListener(

"click",

()=>{

printPayroll(

payrollState.payrollRecords

);

}

);