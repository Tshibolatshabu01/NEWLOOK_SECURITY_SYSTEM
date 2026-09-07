/*
======================================================

NEWLOOK SECURITY SYSTEM

Payroll Reports Module

Uses processed payroll records.

Currency:
South African Rand (ZAR)

======================================================
*/


export function monthlyPayrollReport(records, month){


    return records.filter(

        payroll =>

        payroll.payrollMonth === month

    );

}




export function weeklyPayrollReport(records, period){


    return records.filter(

        payroll =>

        payroll.payrollPeriod === period

    );

}





export function yearlyPayrollReport(records, year){


    return records.filter(

        payroll =>

        String(
            payroll.payrollMonth
        )
        .includes(year)

    );

}





export function departmentPayrollReport(

records,

department

){


    return records.filter(

        payroll =>

        payroll.department === department

    );

}





export function allowanceReport(records){


    return records.map(

        payroll=>({


            employee:

            payroll.fullName,


            allowances:

            payroll.allowances || 0


        })

    );

}





export function deductionReport(records){


    return records.map(

        payroll=>({


            employee:

            payroll.fullName,


            deductions:

            payroll.deductions || 0


        })

    );

}





export function overtimeReport(records){


    return records.map(

        payroll=>({


            employee:

            payroll.fullName,


            overtimeHours:

            payroll.overtimeHours || 0,


            overtimeAmount:

            payroll.overtimeAmount || 0


        })

    );

}





export function attendanceReport(records){


    return records.map(

        payroll=>({


            employee:

            payroll.fullName,


            workedHours:

            payroll.workedHours || 0,


            attendance:

            payroll.attendancePercentage || 0


        })

    );

}





export function UIFReport(records){


    return records.map(

        payroll=>({


            employee:

            payroll.fullName,


            UIF:

            payroll.uif || 0


        })

    );

}





export function PAYEReport(records){


    return records.map(

        payroll=>({


            employee:

            payroll.fullName,


            PAYE:

            payroll.paye || 0


        })

    );

}