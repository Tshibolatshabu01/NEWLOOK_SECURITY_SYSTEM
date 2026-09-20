// NEWLOOK: Site-radius verification is intentionally disabled for this application.
import { attendanceService } from "../SaaS/apps/attendance/service.js";
window.NEWLOOK_ATTENDANCE_SERVICE = attendanceService;
import { bootDeviceApp } from "../SaaS/appKernel.js";
//====================================================
// DEVICE SECURITY
//====================================================
import { ensureDeviceAuthorized, getDeviceContext } from "./deviceAuth.js";

//====================================================
// FIREBASE
//====================================================
import { auth, db, companyCollection, companyDoc, getCompanyId } from "./firebase.js";
import {

    collection,
    getDocs,
    getDoc,
    addDoc,
    setDoc,
    doc,
    query,
    where,
    serverTimestamp

} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const DEVICE_READY = await ensureDeviceAuthorized("attendance.html", "attendance");
if (!DEVICE_READY) {
    throw new Error("NEWLOOK: Device setup required.");
}
bootDeviceApp("attendance", "attendance", getDeviceContext());

//====================================================
// DEBUG
//====================================================

const DEBUG = false;

function debugLog(...args){

    if(DEBUG){

        console.log(...args);

    }

}
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

let lastVerificationTime = 0;

const VERIFICATION_COOLDOWN = 15000;
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

    debugLog("Face models loaded.");
}


//====================================================
// LOAD BODY MODEL
//====================================================

async function loadBodyModel(){

    bodyModel =
    await cocoSsd.load();

    debugLog("body loaded.");
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
           debugLog("camera started.");
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

        debugLog(
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

        debugLog("Starting body detection...");
        detectBody();

        debugLog("Attendance ready.");

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

    debugLog("detectBody running");

    if(!modelsLoaded){
        debugLog("Models not loaded");
        return;
    }

    if(video.readyState !== 4){

        requestAnimationFrame(detectBody);
        return;

    }

    try{

        const predictions =
        await bodyModel.detect(video);
        debugLog("Predictions:", predictions);

        const personFound =
        predictions.some(item => item.class === "person");

        if(personFound){

            if(!bodyDetected){

                bodyDetected = true;

                setStatus(
                    "Body detected. Verifying face...",
                    "success"
                );

                debugLog("Person detected.");

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

                debugLog("No person.");

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
debugLog("calculateDistance loaded");
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



        debugLog(
            "Face descriptor created"
        );



        const descriptor =
        detection.descriptor;



        const employee =
        await findMatchingStaff(descriptor);



        if(employee){

            debugLog(
                "Employee verified",
                employee
            );

            const now = Date.now();

        if(
             lastEmployeeID === employee.employeeID &&
             (now - lastVerificationTime) < VERIFICATION_COOLDOWN
            ){

              processing = false;
               return;

            }

             lastVerificationTime = now;

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

          

            await verifyDepartment(employee);



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
    attendanceService.collection(db,"guards")
 );


    let bestMatch = null;

    let smallestDistance = 0.45;



    staffSnapshot.forEach((docSnap)=>{


        const staff =
        docSnap.data();
        const department = String(staff.department || "").trim().toLowerCase();
        const status = String(staff.status || "active").trim().toLowerCase();

        // Attendance/face clock is for active Staff-department employees only.
        if (department !== "staff" || status !== "active") return;

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

    debugLog(

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
// SHIFT DATE UTILITIES
// Supports both Day and Overnight Shifts
//====================================================

function formatDateOnly(date){

    return date
    .toISOString()
    .split("T")[0];

}

//====================================================
// DETERMINE WHETHER SHIFT CROSSES MIDNIGHT
//====================================================

function isOvernightShift(shift){

    if(!shift){
        return false;
    }

    return shift.startTime > shift.endTime;

}

//====================================================
// GET SHIFT DATE
//
// Day Shift
// 07:00 -> 19:00
// Check In  = today
// Check Out = today
//
// Night Shift
// 19:00 -> 07:00
// Check In  = today
// Check Out = previous day
//====================================================

function getShiftDate(now, shift){

    const attendanceDate = new Date(now);

    if(!shift){

        return formatDateOnly(attendanceDate);

    }

    if(!isOvernightShift(shift)){

        return formatDateOnly(attendanceDate);

    }

    const currentMinutes =
        now.getHours() * 60 +
        now.getMinutes();

    const endParts =
    shift.endTime.split(":");

    const endMinutes =
        Number(endParts[0]) * 60 +
        Number(endParts[1]);

    // After midnight but before scheduled end
    // belongs to yesterday's shift

    if(currentMinutes <= endMinutes){

        attendanceDate.setDate(
            attendanceDate.getDate() - 1
        );

    }

    return formatDateOnly(attendanceDate);

}

//====================================================
// BUILD SHIFT START DATETIME
//====================================================

function buildShiftStartDate(shiftDate, shift){

    return new Date(
        `${shiftDate}T${shift.startTime}`
    );

}

//====================================================
// BUILD SHIFT END DATETIME
//====================================================

function buildShiftEndDate(shiftDate, shift){

    const end = new Date(
        `${shiftDate}T${shift.endTime}`
    );

    if(isOvernightShift(shift)){

        end.setDate(
            end.getDate() + 1
        );

    }

    return end;

}

//====================================================
// LOAD TODAY ATTENDANCE
//====================================================

//====================================================
// LOAD SHIFT ATTENDANCE
//====================================================

async function loadTodayAttendance(employeeID, shift){

    const shiftDate =
    getShiftDate(
        new Date(),
        shift
    );

    const q = query(

        attendanceService.collection(db,"attendance"),

        where(
            "employeeID",
            "==",
            employeeID
        ),

        where(
            "shiftDate",
            "==",
            shiftDate
        )

    );

    const snapshot =
    await getDocs(q);

    todayAttendance = [];

    snapshot.forEach(doc=>{

        todayAttendance.push({

            id:doc.id,

            ...doc.data()

        });

    });

    todayAttendance.sort((a,b)=>{

        const first =
        a.timestamp?.seconds || 0;

        const second =
        b.timestamp?.seconds || 0;

        return first - second;

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

//====================================================
// SAVE ATTENDANCE EVENT
//====================================================

async function saveAttendanceEvent(employee){

    try{


        const records =
        await loadTodayAttendance(
       employee.employeeID,
       await getAssignedShift(employee.id)
       );

       const action =
       getNextAction(records);

       const now =
       new Date();

       const shift =
       await getAssignedShift(employee.id);


        const shiftDate =
        getShiftDate(
            now,
            shift
        );



        debugLog(
            "Attendance Action:",
            action
        );


        debugLog(
            "Shift Date:",
            shiftDate
        );



        await addDoc(

            attendanceService.collection(
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


                shiftId:
                shift?.id || "",


                shiftType:
                shift?.shiftType || "",


                scheduledStart:
                shift?.startTime || "",


                scheduledEnd:
                shift?.endTime || "",



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



                shiftDate:
                shiftDate,



                timestamp:

                serverTimestamp()


            }

        );



        debugLog(
            "Attendance event saved"
        );



        // AFTER saving OUT event,
        // calculate the complete shift

        if(action === "OUT"){


            await updateAttendanceRecord(employee);


        }



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
        records.length + 1;



        processing = false;


    }


    catch(error){


        console.error(
            "Save attendance error:",
            error
        );


        processing = false;


    }

}
// -------------------------------------ATTENDANCERECORD------------------------------------------------------------



//====================================================
// LOAD SHIFT ATTENDANCE
//====================================================

async function getPreviousDayAttendance(
    employeeID,
    shiftDate
){

    let q;


    if(shiftDate){

        q = query(

            attendanceService.collection(db,"attendance"),

            where(
                "employeeID",
                "==",
                employeeID
            ),

            where(
                "shiftDate",
                "==",
                shiftDate
            )

        );

    }

    else{

        q = query(

            attendanceService.collection(db,"attendance"),

            where(
                "employeeID",
                "==",
                employeeID
            )

        );

    }



    const snapshot =
    await getDocs(q);



    let records = [];



    snapshot.forEach(doc=>{

        records.push({

            id:doc.id,

            ...doc.data()

        });

    });



    records.sort((a,b)=>{


        const first =
        a.timestamp?.seconds || 0;


        const second =
        b.timestamp?.seconds || 0;


        return first-second;


    });



    return records;

}

function getFirstClockIn(records) {

    if (!records || records.length === 0) {
        return null;
    }

    const sorted = [...records].sort((a, b) => {

        const first = a.timestamp?.seconds || 0;
        const second = b.timestamp?.seconds || 0;

        return first - second;

    });

    return sorted.find(record => record.action === "IN") || null;

}

function getLastClockOut(records) {

    if (!records || records.length === 0) {
        return null;
    }

    const sorted = [...records].sort((a, b) => {

        const first = a.timestamp?.seconds || 0;
        const second = b.timestamp?.seconds || 0;

        return second - first;

    });

    return sorted.find(record => record.action === "OUT") || null;

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

async function createAttendanceRecord(employee, records){

    try{

        debugLog("========== createAttendanceRecord START ==========");

        const first = getFirstClockIn(records);

        debugLog("First Clock In:", first);

        if(!first){
            debugLog("No first clock in.");
            return;
        }

        const shift = await getAssignedShift(employee.id);

        debugLog("Shift:", shift);

        if(!shift){
            debugLog("No shift assigned.");
            return;
        }

        let lateMinutes = calculateLateMinutes(first, shift);

        let attendanceStatus = getAttendanceStatus(
            lateMinutes,
            shift
        );

        debugLog("Late Minutes:", lateMinutes);
        debugLog("Attendance Status:", attendanceStatus);

        const last = getLastClockOut(records);

        debugLog("Last Clock Out:", last);

        if(!last){
            debugLog("No clock out found.");
            return;
        }

        const work = calculateAllWorkingPeriods(records);

        debugLog("Working Time:", work);

        const expected = calculateExpectedHours(shift);

        debugLog("Expected Hours:", expected);

        const comparison = compareWorkingHours(
            work.totalMinutes,
            expected.minutes
        );

        debugLog("Comparison:", comparison);

        const shiftDate =
            records[0].shiftDate ||
            records[0].date;

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

        debugLog("Attendance %:", attendancePercentage);

        const data = {

            assignedShift:
            shift?.shiftType || "",

            scheduledStart:
            shift?.startTime || "",

            scheduledEnd:
            shift?.endTime || "",

            graceMinutes:
            shift?.graceMinutes || "0",

            lateMinutes,

            attendanceStatus,

            recordDate:
            shiftDate,

            shiftDate,

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

            attendancePercentage,

            expectedHours:
            expected.hours,

            actualHours:
            work.totalHours,

            lunchTakenMinutes:0,

            lunchExceededMinutes:0,

            attendanceRecords:records,

            payrollReady:true,

            createdAt:
            serverTimestamp()

        };

        debugLog("Document to save:");
        debugLog(data);

        const docRef = await addDoc(
            attendanceService.collection(db, "attendanceRecords"),
            data
        );

        debugLog("SUCCESS!");
        debugLog("Document ID:", docRef.id);

    }
    catch(error){

        console.error("createAttendanceRecord ERROR:");
        console.error(error);

    }

}
//====================================================
// CHECK IF NEW DAY STARTED
//====================================================

//====================================================
// CHECK IF SHIFT RECORD SHOULD BE GENERATED
//====================================================

//====================================================
// CHECK IF SHIFT RECORD SHOULD BE GENERATED
//====================================================

async function updateAttendanceRecord(employee){

    try{

        console.log("========== UPDATE ATTENDANCE RECORD ==========");

        const shift =
        await getAssignedShift(employee.id);

        if(!shift){

            console.log("No assigned shift");

            return;

        }

        const shiftDate =
        getShiftDate(
            new Date(),
            shift
        );

        const records =
        await getPreviousDayAttendance(

            employee.employeeID,

            shiftDate

        );

        console.log("Today's Attendance:", records);

        if(records.length === 0){

            console.log("No attendance events");

            return;

        }

        const first =
        getFirstClockIn(records);

        const last =
        getLastClockOut(records);

        if(!first){

            console.log("Missing IN");

            return;

        }

        if(!last){

            console.log("Missing OUT");

            return;

        }

        await saveAttendanceRecord(

            employee,

            shift,

            records,

            shiftDate

        );

        console.log("Attendance Record Updated");

    }

    catch(error){

        console.error(
            "Update Attendance Record Error:",
            error
        );

    }

}

async function saveAttendanceRecord(

    employee,

    shift,

    records,

    shiftDate

){

    try{

        const first =
        getFirstClockIn(records);

        const last =
        getLastClockOut(records);

        if(!first || !last){

            console.log("Cannot build summary");

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

        const attendancePercentage =

        expected.minutes > 0

        ?

        Number(

            (

                work.totalMinutes /

                expected.minutes

            ) * 100

        ).toFixed(2)

        :

        0;

        const recordID =
        `${employee.employeeID}_${shiftDate}`;

        await setDoc(

            attendanceService.doc(

                db,

                "attendanceRecords",

                recordID

            ),

            {
                companyId: getCompanyId(),

                employeeID:
                employee.employeeID,

                guardId:
                employee.id,

                guardName:
                employee.fullName,

                department:
                employee.department,

                role:
                employee.role || "",

                siteId:
                employee.siteId,

                siteName:
                employee.siteName,

                shiftDate:
                shiftDate,

                firstClockIn:
                first.timestamp,

                lastClockOut:
                last.timestamp,

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
                Number(attendancePercentage),

                payrollReady:
                true,

                createdAt:
                serverTimestamp(),

                updatedAt:
                serverTimestamp()

            },

            {

                merge:true

            }

        );

        console.log(
            "Attendance Summary Saved"
        );

    }

    catch(error){

        console.error(
            "Save Attendance Record Error:",
            error
        );

    }

}
//====================================================
// CHECK WHETHER ATTENDANCE RECORD ALREADY EXISTS
//====================================================

async function attendanceRecordExists(employeeID, shiftDate){

    const q = query(

        attendanceService.collection(db,"attendanceRecords"),

        where(
            "employeeID",
            "==",
            employeeID
        ),

        where(
            "shiftDate",
            "==",
            shiftDate
        )

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

        attendanceService.collection(db,"shifts"),

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

//====================================================
// LATE CALCULATION
//====================================================

function calculateLateMinutes(clockIn, shift){

    if(!shift){
        return 0;
    }

    const actual =
    new Date(
        clockIn.timestamp.seconds * 1000
    );

    const shiftDate =
    clockIn.shiftDate ||
    formatDateOnly(actual);

    const scheduled =
    buildShiftStartDate(
        shiftDate,
        shift
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

    let start =
    new Date(
        `2000-01-01T${shift.startTime}`
    );

    let end =
    new Date(
        `2000-01-01T${shift.endTime}`
    );

    // Overnight shift

    if(end <= start){

        end.setDate(
            end.getDate() + 1
        );

    }

    let minutes =
    Math.floor(

        (
            end -
            start
        ) / 60000

    );

    minutes -= Number(
        shift.lunchMinutes || 0
    );

    if(minutes < 0){

        minutes = 0;

    }

    return{

        minutes:minutes,

        hours:
        (
            minutes / 60
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


let guardsCache = [];

let guardsLoaded = false;

async function loadGuardsCache(){

    if(guardsLoaded){

        return;

    }

    const snapshot =
    await getDocs(attendanceService.collection(db,"guards"));

    guardsCache = [];

    snapshot.forEach(docSnap=>{

        const employee = docSnap.data();
        if (String(employee.department || "").trim().toLowerCase() !== "staff") return;
        if (String(employee.status || "active").trim().toLowerCase() !== "active") return;
        guardsCache.push({

            id:docSnap.id,

            ...employee

        });

    });

    guardsLoaded = true;

}

// NEWLOOK V13.1 realtime command bridge
window.loadGuardsCache = loadGuardsCache;
