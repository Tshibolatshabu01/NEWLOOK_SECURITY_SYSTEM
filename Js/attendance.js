//====================================================
// FIREBASE
//====================================================

import {
    db
} from "./firebase.js";

import {

    collection,
    getDocs,
    getDoc,
    addDoc,
    doc,
    query,
    where,
    serverTimestamp

} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

//====================================================
// SPEAK MESSAGE
//====================================================

function speakMessage(message){

    if(!("speechSynthesis" in window)){
        return;
    }

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(message);

    speech.lang = "en-US";
    speech.rate = 1;
    speech.pitch = 1;
    speech.volume = 1;

    window.speechSynthesis.speak(speech);

}



//====================================================
// DOM
//====================================================

const video =
document.getElementById("attendanceVideo");

const statusBox =
document.getElementById("attendanceStatus");

const employeeDisplay =
document.getElementById("employeeDisplay");

const nameDisplay =
document.getElementById("nameDisplay");

const departmentDisplay =
document.getElementById("departmentDisplay");

const siteDisplay =
document.getElementById("siteDisplay");

const statusDisplay =
document.getElementById("statusDisplay");

const liveTime = document.getElementById("currentTime");

const liveDate = document.getElementById("currentDate");


//====================================================
// VARIABLES
//====================================================

let bodyModel;

let modelsLoaded = false;

let bodyDetected = false;

let processing = false;

let attendanceStream = null;
let cameraStarting = false;

let verificationLocked = false;
let lastEmployeeID = null;
//====================================================
// LIVE CLOCK
//====================================================

function startClock(){

    setInterval(()=>{

        const now = new Date();

        if(liveTime){

            liveTime.textContent =
            now.toLocaleTimeString();

        }

        if(liveDate){

            liveDate.textContent =
            now.toDateString();

        }

    },1000);

}


//====================================================
// STATUS
//====================================================

function setStatus(text,type="waiting"){

    statusBox.textContent = text;

    statusBox.className = "";

    statusBox.classList.add(type);

}


//====================================================
// LOAD FACE MODELS
//====================================================

async function loadFaceModels(){

    const MODEL_PATH = "./models";

    await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_PATH);

    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_PATH);

    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_PATH);

    console.log("Face models loaded.");

}


//====================================================
// LOAD BODY MODEL
//====================================================

async function loadBodyModel(){

    bodyModel =
    await cocoSsd.load();

    console.log("Body model loaded.");

}


//====================================================
// START CAMERA
//====================================================

//====================================================
// START CAMERA SAFELY
//====================================================

//====================================================
// START CAMERA
//====================================================

async function startCamera(){

    try{

        if(cameraStarting){
            console.log("Camera already starting");
            return;
        }

        cameraStarting = true;

        // Stop previous camera
        if(attendanceStream){

            attendanceStream.getTracks().forEach(track=>{
                track.stop();
            });

            attendanceStream = null;
        }

        const devices =
        await navigator.mediaDevices.enumerateDevices();

        const cameras =
        devices.filter(device => device.kind === "videoinput");

        if(cameras.length === 0){
            throw new Error("No camera found");
        }

        attendanceStream =
        await navigator.mediaDevices.getUserMedia({

            video:{
                facingMode:"user",
                width:{ ideal:1280 },
                height:{ ideal:720 }
            },

            audio:false

        });

        // USE THE VIDEO VARIABLE
        video.srcObject = attendanceStream;

        await new Promise(resolve=>{

            video.onloadedmetadata = async()=>{

                await video.play();

                resolve();

            };

        });

        console.log(
            "Camera started:",
            video.videoWidth,
            video.videoHeight
        );

    }

    catch(error){

        console.error("Camera error:",error);

        if(error.name==="NotReadableError"){

            setStatus(
                "Camera busy. Close other apps using camera.",
                "error"
            );

        }else{

            setStatus(
                "Unable to access camera.",
                "error"
            );

        }

    }

    finally{

        cameraStarting = false;

    }

}



//====================================================
// STOP CAMERA WHEN PAGE CLOSES
//====================================================

window.addEventListener(
"beforeunload",
()=>{


    if(attendanceStream){


        attendanceStream
        .getTracks()
        .forEach(track=>{

            track.stop();

        });


    }


});

//====================================================
// INITIALIZE
//====================================================

async function initializeAttendance(){

    try{

        setStatus("Loading models...");

        await loadFaceModels();

        await loadBodyModel();

        await startCamera();

        startClock();

        modelsLoaded = true;

        setStatus("Waiting for body...");

        console.log("Starting body detection...");
        detectBody();

        console.log("Attendance ready.");

    }

    catch(error){

        console.error(error);

        setStatus("Initialization failed","error");

    }

}

initializeAttendance();

// --------------------------------BODY DETECTION----------------------------------------------------------------

//====================================================
// BODY DETECTION
//====================================================

async function detectBody(){

    console.log("detectBody running");

    if(!modelsLoaded){
        console.log("Models not loaded");
        return;
    }

    if(video.readyState !== 4){

        requestAnimationFrame(detectBody);
        return;

    }

    try{

        const predictions =
        await bodyModel.detect(video);
        console.log("Predictions:", predictions);

        const personFound =
        predictions.some(item => item.class === "person");

        if(personFound){

            if(!bodyDetected){

                bodyDetected = true;

                setStatus(
                    "Body detected. Verifying face...",
                    "success"
                );

                console.log("Person detected.");

            }

            if(!processing){

                processing = true;

                verifyFace();

            }

        }

        else{

            if(bodyDetected){

                bodyDetected = false;

                processing = false;

                verificationLocked = false;

                lastEmployeeID = null;

                clearDisplay();

                setStatus(
                    "Waiting for body..."
                );

                console.log("No person.");

             }

            

        }

    }

    

    catch(error){

        console.error(error);

    }

    setTimeout(detectBody,300);

}

//====================================================
// CLEAR SCREEN
//====================================================

function clearDisplay(){

    employeeDisplay.textContent = "--";

    nameDisplay.textContent = "--";

    departmentDisplay.textContent = "--";

    siteDisplay.textContent = "--";

    statusDisplay.textContent = "Waiting";

}

// --------------------------------------------FACE VERIFICATION-------------------------------------------------------

//====================================================
// FACE VERIFICATION
//====================================================

async function verifyFace(){



    try{

    if(verificationLocked){

    processing = false;
    return;

 }

        if(!bodyDetected) {

            processing = false;
            return;

        }


        const detection =
        await faceapi
        .detectSingleFace(
            video,
            new faceapi.SsdMobilenetv1Options()
        )
        .withFaceLandmarks()
        .withFaceDescriptor();


        if(!detection){

            setStatus(
                "Face not detected",
                "warning"
            );

            processing = false;

            setTimeout(()=>{

                if(bodyDetected){

                    verifyFace();

                }

            },2000);

            return;

        }



        console.log(
            "Face descriptor created"
        );



        const descriptor =
        detection.descriptor;



        const employee =
        await findMatchingStaff(descriptor);



        if(employee){

            console.log(
                "Employee verified",
                employee
            );

            if(lastEmployeeID === employee.employeeID){

            processing = false;
            return;

            }

           verificationLocked = true;
           lastEmployeeID = employee.employeeID;


            employeeDisplay.textContent =
            employee.employeeID;


            nameDisplay.textContent =
            employee.fullName;


            departmentDisplay.textContent =
            employee.department;


            siteDisplay.textContent =
            employee.siteName;



            if(employee.department?.trim().toLowerCase() !== "staff"){
                setStatus(
                    "Access denied. Staff only.",
                    "error"
                );

                processing=false;

                return;

            }



            setStatus(
                "Face verified",
                "success"
            );

          

            await checkLocation(employee);



        }

        else{


            setStatus(
                "Face not registered",
                "error"
            );


            processing=false;


        }


    }

    catch(error){

        console.error(
            "Face verification error:",
            error
        );


        processing=false;

    }

}

//====================================================
// FIND STAFF BY FACE DESCRIPTOR
//====================================================

async function findMatchingStaff(inputDescriptor){


    const staffSnapshot =
    await getDocs(
        collection(db,"guards")
    );


    let bestMatch = null;

    let smallestDistance = 0.45;



    staffSnapshot.forEach((docSnap)=>{


        const staff =
        docSnap.data();



        if(
            !staff.faceDescriptor
        ){

            return;

        }



        const storedDescriptor =
        new Float32Array(
            staff.faceDescriptor
        );



        const distance =
        faceapi.euclideanDistance(
            inputDescriptor,
            storedDescriptor
        );



        if(distance < smallestDistance){

            smallestDistance =
            distance;

            bestMatch = {

                id:docSnap.id,

                ...staff

            };

        }


    });



    return bestMatch;


}

// ---------------------------------GPS------------------------------------------------------------------------

//====================================================
// GET CURRENT LOCATION
//====================================================

async function getCurrentLocation(){

    return new Promise((resolve,reject)=>{

        navigator.geolocation.getCurrentPosition(

            position=>{

                resolve({

                    latitude:position.coords.latitude,

                    longitude:position.coords.longitude

                });

            },

            error=>{

                reject(error);

            },

            {

                enableHighAccuracy:true,

                timeout:30000,

                maximumAge:5000

            }

        );

    });

}

//====================================================
// CALCULATE DISTANCE
//====================================================

function calculateDistance(lat1,lon1,lat2,lon2){

    const R = 6371000;

    const dLat = (lat2-lat1)*Math.PI/180;

    const dLon = (lon2-lon1)*Math.PI/180;

    const a =

        Math.sin(dLat/2)**2 +

        Math.cos(lat1*Math.PI/180)

        *

        Math.cos(lat2*Math.PI/180)

        *

        Math.sin(dLon/2)**2;

    const c =

        2 *

        Math.atan2(

            Math.sqrt(a),

            Math.sqrt(1-a)

        );

    return R*c;

}

//====================================================
// VERIFY GPS
//====================================================

async function checkLocation(employee){

    try{

        setStatus(

            "Checking location..."

        );



        const gps =

        await getCurrentLocation();



        const siteDoc =

        await getDoc(

            doc(

                db,

                "sites",

                employee.siteId

            )

        );



        if(!siteDoc.exists()){

            setStatus(

                "Site not found",

                "error"

            );

            processing=false;

            return;

        }



        const site =

        siteDoc.data();



        const distance =

        calculateDistance(

            gps.latitude,

            gps.longitude,

            site.latitude,

            site.longitude

        );



        if(distance > site.radius){

            setStatus(

                "Outside site radius",

                "error"

            );

            processing=false;

            return;

        }



        console.log(

            "GPS Verified"

        );



        setStatus(

            "Location verified",

            "success"

        );



        await verifyDepartment(

            employee

        );



    }

    catch(error){

        console.error(error);

        setStatus(

            "GPS unavailable",

            "error"

        );

        processing=false;

    }

}

//====================================================
// VERIFY STAFF DEPARTMENT
//====================================================

async function verifyDepartment(employee){

    if(!employee.department){

        setStatus(

            "Department not assigned",

            "error"

        );

        processing = false;

        return;

    }

    const department =

    employee.department
    .trim()
    .toLowerCase();

    if(department !== "staff"){

        setStatus(

            "Only Staff can use Attendance",

            "error"

        );

        processing = false;

        return;

    }

    console.log(

        "Department Verified"

    );

    setStatus(

        "Department verified",

        "success"

    );

    await saveAttendanceEvent(

        employee

    );

}

// --------------------------------------ATTENDANCE LOGIC--------------------------------------------------------


let todayAttendance = [];

//====================================================
// LOAD TODAY ATTENDANCE
//====================================================

async function loadTodayAttendance(employeeID){

    const today =
    new Date()
    .toISOString()
    .split("T")[0];


    const q = query(

        collection(db,"attendance"),

        where(
            "employeeID",
            "==",
            employeeID
        ),

        where(
            "date",
            "==",
            today
        )

    );


    const snapshot =
    await getDocs(q);



    todayAttendance = [];



    snapshot.forEach(doc=>{

        todayAttendance.push(
            doc.data()
        );

    });


    return todayAttendance;

}

//====================================================
// DETERMINE ACTION
//====================================================

function getNextAction(records){


    if(records.length === 0){

        return "IN";

    }



    const last =
    records
    [
        records.length-1
    ];



    if(last.action==="IN"){

        return "OUT";

    }


    return "IN";


}

//====================================================
// SAVE ATTENDANCE EVENT
//====================================================

async function saveAttendanceEvent(employee){

    await checkForNewDay(employee);

    const records =
    await loadTodayAttendance(
        employee.employeeID
    );



    const action =
    getNextAction(records);



    const now =
    new Date();



    await addDoc(

        collection(
            db,
            "attendance"
        ),

        {

            employeeID:
            employee.employeeID,


            guardId:
            employee.id,


            fullName:
            employee.fullName,


            department:
            employee.department,

            role:
            employee.role || "",


            siteId:
            employee.siteId,


            siteName:
            employee.siteName,


            action:


            action,

            status:
            action==="IN"
            ?
            "ON DUTY"
            :
            "OFF DUTY",


            date:

            now
            .toISOString()
            .split("T")[0],


            timestamp:

            serverTimestamp()

        }

    );



    if(action==="IN"){


        statusDisplay.textContent =
        "ON DUTY";


        setStatus(
            "Checked IN",
            "success"
        );
      
        speakMessage(
        `Welcome ${employee.fullName}. Thank you. You have successfully checked in.`
     );

    }

    else{


        statusDisplay.textContent =
        "OFF DUTY";


        setStatus(
            "Checked OUT",
            "success"
        );

        speakMessage(
        `Goodbye ${employee.fullName}. Thank you. You have successfully checked out.`
     );


    }



    document
    .getElementById(
        "verificationDisplay"
    )
    .textContent =
    records.length+1;

  processing = false;

}

// -------------------------------------SHIFTRECORD------------------------------------------------------------



async function getPreviousDayAttendance(employeeID,date){

    const q = query(

        collection(db,"attendance"),

        where(
            "employeeID",
            "==",
            employeeID
        ),

        where(
            "date",
            "==",
            date
        )

    );


    const snapshot =
    await getDocs(q);


    let records=[];


    snapshot.forEach(doc=>{

        records.push({

            id:doc.id,

            ...doc.data()

        });

    });


    records.sort((a,b)=>{

        return a.timestamp.seconds -
        b.timestamp.seconds;

    });


    return records;

}

function getFirstClockIn(records){


    const first =
    records.find(
        r=>r.action==="IN"
    );


    return first || null;

}


//====================================================
// CALCULATE ALL WORK PERIODS
//====================================================




//====================================================
// GET ASSIGNED SHIFT
//====================================================



//====================================================
// LATE CALCULATION
//====================================================



//====================================================
// ATTENDANCE STATUS
//====================================================



//====================================================
// CALCULATE EXPECTED SHIFT HOURS
//====================================================


//====================================================
// COMPARE WORK RESULT
//====================================================




function getLastClockOut(records){


    const outs =
    records.filter(
        r=>r.action==="OUT"
    );


    if(outs.length===0){

        return null;

    }


    return outs[
        outs.length-1
    ];

}

//====================================================
// CALCULATE ALL WORK PERIODS
//====================================================

function calculateAllWorkingPeriods(records){


    let totalMinutes = 0;

    let checkInTime = null;

    let periods = [];



    records.forEach(record=>{


        const time =
        new Date(
            record.timestamp.seconds * 1000
        );



        if(record.action==="IN"){


            checkInTime = time;


        }



        if(
            record.action==="OUT" &&
            checkInTime
        ){


            const minutes =

            Math.floor(

                (
                    time -
                    checkInTime

                ) / 60000

            );



            periods.push({

                clockIn:
                checkInTime,


                clockOut:
                time,


                minutes:
                minutes

            });



            totalMinutes += minutes;



            checkInTime=null;


        }



    });



    return {


        periods:


        periods,


        totalMinutes:


        totalMinutes,


        totalHours:


        (
            totalMinutes / 60

        ).toFixed(2)


    };


}

async function createShiftRecord(
 employee,
 records
 ){


    const first =
    getFirstClockIn(records);

    if(!first){

    return;

 }

    const shift =
    await getAssignedShift(
    employee.id
    );

    if(!shift){

    console.log("No shift assigned.");

    return;

 }

    let lateMinutes = 0;

 let attendanceStatus =
 "Unknown";


 if(shift){


    lateMinutes =
    calculateLateMinutes(
        first,
        shift
    );


    attendanceStatus =
    getAttendanceStatus(
        lateMinutes,
        shift
    );


 }


    const last =
    getLastClockOut(records);



    if(!first || !last){

        return;

    }



    const work =
    calculateAllWorkingPeriods(records);

    const expected =
    calculateExpectedHours(shift);

    const comparison =
    compareWorkingHours(
    work.totalMinutes,
    expected.minutes
 );

 //====================================================
 // ATTENDANCE PERCENTAGE
 //====================================================

 let attendancePercentage = 0;

 if(expected.minutes > 0){

    attendancePercentage = Math.min(

        100,

        Number(

            (

                work.totalMinutes /

                expected.minutes

            ) * 100

        ).toFixed(2)

    );

 }



    await addDoc(

        collection(
            db,
            "shiftRecords"
        ),

        {

            assignedShift:
            shift?.shiftType || "",


            scheduledStart:
            shift?.startTime || "",


            scheduledEnd:
            shift?.endTime || "",


            graceMinutes:
            shift?.graceMinutes ||"0",


            lateMinutes:
            lateMinutes,


            attendanceStatus:
            attendanceStatus,
           recordDate:
           records[0].date,

           firstClockIn:
           first.timestamp,

           lastClockOut:
           last.timestamp,


            employeeID:
            employee.employeeID,


            guardId:
            employee.id,


            guardName:
            employee.fullName,


            department:
            employee.department,


            siteId:
            employee.siteId,


            siteName:
            employee.siteName,


            attendancePeriods:
            work.periods,


            totalWorkingMinutes:
            work.totalMinutes,


            totalWorkingHours:
            work.totalHours,


            expectedWorkingMinutes:
            expected.minutes,


            expectedWorkingHours:
            expected.hours,


            workStatus:
            comparison.status,


            overtimeMinutes:
            comparison.overtimeMinutes,


            shortageMinutes:
            comparison.shortageMinutes,

            attendancePercentage:
            attendancePercentage,

            expectedHours:
            expected.hours,

            actualHours:
            work.totalHours,

            lunchTakenMinutes:0,

            lunchExceededMinutes:0,

        


            attendanceRecords:
            records,

            payrollReady:true,
            createdAt:
            serverTimestamp()


        }

    );


    console.log(
        "Shift record created"
    );


}

//====================================================
// CHECK IF NEW DAY STARTED
//====================================================

async function checkForNewDay(employee){

    const yesterday =

    new Date(
        Date.now()-86400000
    )
    .toISOString()
    .split("T")[0];



    const exists =

    await shiftRecordExists(

        employee.employeeID,

        yesterday

    );



    if(exists){

        return;

    }



    const records =

    await getPreviousDayAttendance(

        employee.employeeID,

        yesterday

    );



    if(records.length===0){

        return;

    }



    await createShiftRecord(

        employee,

        records

    );

}
async function shiftRecordExists(employeeID,date){

    const q = query(

        collection(db,"shiftRecords"),

        where("employeeID","==",employeeID),

        where("recordDate","==",date)

    );



    const snapshot =
    await getDocs(q);

    return !snapshot.empty;

}

//====================================================
// GET ASSIGNED SHIFT
//====================================================

async function getAssignedShift(guardId){


    const q = query(

        collection(db,"shifts"),

        where(
            "guardId",
            "==",
            guardId
        )

    );


    const snapshot =
    await getDocs(q);


    let shift=null;


    snapshot.forEach(doc=>{


        shift={

            id:doc.id,

            ...doc.data()

        };


    });


    return shift;


}

//====================================================
// LATE CALCULATION
//====================================================

function calculateLateMinutes(
 clockIn,
 shift
 ){

    if(!shift){

    return 0;

 }


    const actual =
    new Date(clockIn.timestamp.seconds*1000);



    const date =
    actual.toISOString()
    .split("T")[0];



    const scheduled =
    new Date(
        `${date}T${shift.startTime}`
    );



    const difference =
    Math.floor(
        (
            actual -
            scheduled
        ) / 60000
    );



    if(difference <= 0){

        return 0;

    }



    return difference;


}

//====================================================
// ATTENDANCE STATUS
//====================================================

function getAttendanceStatus(
lateMinutes,
shift
){


    if(lateMinutes===0){

        return "On Time";

    }


    if(
        lateMinutes <=
        Number(shift.graceMinutes)
    ){

        return "Within Grace Period";

    }


    return `Late by ${lateMinutes} minutes`;

}

//====================================================
// CALCULATE EXPECTED SHIFT HOURS
//====================================================

function calculateExpectedHours(shift){

    if(!shift){

    return{

        minutes:0,

        hours:"0.00"

    };

 }


    const start =
    new Date(
        `2000-01-01T${shift.startTime}`
    );


    const end =
    new Date(
        `2000-01-01T${shift.endTime}`
    );


    let minutes =
    Math.floor(
        (end-start)/60000
    );



    // Remove lunch time

    minutes -=
    Number(
        shift.lunchMinutes || 0
    );



    return {


        minutes:minutes,


        hours:
        (
            minutes/60
        ).toFixed(2)


    };


}

//====================================================
// COMPARE WORK RESULT
//====================================================

function compareWorkingHours(
actualMinutes,
expectedMinutes
){


    let difference =
    actualMinutes -
    expectedMinutes;



    let result = "";

    let overtime = 0;

    let shortage = 0;



    if(difference > 0){


        overtime =
        difference;



        result =
        "Overtime";


    }


    else if(difference < 0){


        shortage =
        Math.abs(
            difference
        );


        result =
        "Under Worked";


    }


    else{


        result =
        "Completed Shift";


    }



    return {


        status:
        result,


        overtimeMinutes:
        overtime,


        shortageMinutes:
        shortage


    };


}



