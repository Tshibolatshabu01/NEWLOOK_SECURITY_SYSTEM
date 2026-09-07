/*
=========================================================
NEWLOOK SECURITY SYSTEM

Payroll Calculation Engine

All payroll calculations are handled here.

=========================================================
*/


export function formatCurrency(amount){

    const symbol =
     "R";


 return `${symbol}${Number(amount || 0).toLocaleString(

    "en-ZA",

    {

        minimumFractionDigits:2,

        maximumFractionDigits:2

    }

 )}`;

}

export function calculateWorkedHours(attendanceRecords){

    if(!attendanceRecords.length){

        return 0;

    }

    return attendanceRecords.reduce(

        (total, record)=>{

            return total +

            Number(

                record.totalWorkingHours || 0

            );

        },

        0

    );

}


export function calculateOvertimeHours(attendanceRecords){

    if(!attendanceRecords.length){

        return 0;

    }

    return attendanceRecords.reduce(

        (total, record)=>{

            return total +

            (

                Number(

                    record.overtimeMinutes || 0

                ) / 60

            );

        },

        0

    );

}

export function calculateLateMinutes(attendanceRecords){

    if(!attendanceRecords.length){

        return 0;

    }

    return attendanceRecords.reduce(

        (total, record)=>{

            return total +

            Number(

                record.lateMinutes || 0

            );

        },

        0

    );

}

export function calculateShortageMinutes(attendanceRecords){

    if(!attendanceRecords.length){

        return 0;

    }

    return attendanceRecords.reduce(

        (total, record)=>{

            return total +

            Number(

                record.shortageMinutes || 0

            );

        },

        0

    );

}

export function calculateCompliance(shiftRecords){

    if(!shiftRecords.length){

        return 0;

    }

    const total = shiftRecords.reduce(

        (sum, shift)=>{

            return sum +

            Number(

                shift.compliance || 0

            );

        },

        0

    );

    return total / shiftRecords.length;

}

export function calculateNightHours(shiftRecords){

    let total = 0;

    shiftRecords.forEach((shift)=>{

        const start = Number(

            String(shift.scheduledStart || "0:00")

            .split(":")[0]

        );

        if(

            start >= 18 ||

            start < 6

        ){

            total += Number(

                shift.workedHours || 0

            );

        }

    });

    return total;

}

export function calculateWeekendHours(attendanceRecords){

    let total = 0;

    attendanceRecords.forEach((record)=>{

        const date = new Date(

            record.shiftDate

        );

        const day = date.getDay();

        if(

            day === 0 ||

            day === 6

        ){

            total += Number(

                record.totalWorkingHours || 0

            );

        }

    });

    return total;

}

export function calculateHolidayHours(){

    return 0;

}

export function calculateAllowances(salary){

    return (

        Number(salary.transportAllowance || 0) +

        Number(salary.housingAllowance || 0) +

        Number(salary.mealAllowance || 0) +

        Number(salary.phoneAllowance || 0) +

        Number(salary.uniformAllowance || 0) +

        Number(salary.riskAllowance || 0) +

        Number(salary.bonus || 0) +

        Number(salary.commission || 0) +

        Number(salary.otherAllowance || 0)

    );

}

export function calculateDeductions(salary){

    return (

        Number(salary.paye || 0) +

        Number(salary.uif || 0) +

        Number(salary.pension || 0) +

        Number(salary.medicalAid || 0) +

        Number(salary.loan || 0) +

        Number(salary.advanceSalary || 0) +

        Number(salary.otherDeductions || 0)

    );

}

export function calculateGrossSalary(

    basicSalary,

    overtimeAmount,

    allowances

){

    return (

        Number(basicSalary || 0) +

        Number(overtimeAmount || 0) +

        Number(allowances || 0)

    );

}

export function calculateNetSalary(

    grossSalary,

    deductions

){

    return (

        Number(grossSalary || 0) -

        Number(deductions || 0)

    );

}