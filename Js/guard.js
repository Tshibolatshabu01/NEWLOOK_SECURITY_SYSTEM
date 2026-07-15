// ============================================
// NEWLOOK SECURITY SYSTEM
// guard.js
// ============================================

import { db } from "js/firebase.js";

import {
    collection,
    doc,
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
    onSnapshot
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";



function stopCamera() {

    if (currentStream) {

        currentStream.getTracks().forEach(track => track.stop());

        currentStream = null;

    }

    faceVideo.srcObject = null;

}


// ============================================
// FACE API
// ============================================

const MODEL_PATH = "./models";

async function loadModels(){

    await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_PATH);

    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_PATH);

    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_PATH);

    console.log("Face models loaded.");

}

loadModels();

// ============================================
// CURRENT SESSION
// ============================================

let currentGuard = null;
let currentShift = null;
let currentShiftRecord = null;

function setCurrentSession(guard, shift = null, record = null) {

    currentGuard = guard;
    currentShift = shift;
    currentShiftRecord = record;


    if (guard) {

        localStorage.setItem(
            "currentGuardId",
            guard.guardId
        );

    }


    if (shift) {

        localStorage.setItem(
            "currentShiftId",
            shift.shiftId || ""
        );

    }


    if (record) {

        localStorage.setItem(
            "currentShiftRecordId",
            record.id || ""
        );

    }


    if (guard) {

        document.getElementById("guardName").textContent =
            guard.fullName;

    }


    if (shift) {

        document.getElementById("guardSite").textContent =
            shift.siteName;

    }


    // Reload broadcasts after session exists
    if(typeof loadBroadcasts === "function"){

        loadBroadcasts();

    }

}

function clearCurrentSession() {


    currentGuard = null;

    currentShift = null;

    currentShiftRecord = null;


    localStorage.removeItem(
        "currentGuardId"
    );

    localStorage.removeItem(
        "currentShiftId"
    );

    localStorage.removeItem(
        "currentShiftRecordId"
    );


    document.getElementById("guardName").textContent =
        "Not Verified";


    document.getElementById("guardSite").textContent =
        "---";


}

async function restoreCurrentSession(){


    const guardId =
        localStorage.getItem(
            "currentGuardId"
        );


    if(!guardId){

        return;

    }


    try{


        // Restore guard

        const guardSnap =
            await getDocs(
                query(
                    collection(db,"guards"),
                    where(
                        "guardId",
                        "==",
                        guardId
                    )
                )
            );


        if(guardSnap.empty){

            clearCurrentSession();

            return;

        }


        const guard =
            guardSnap.docs[0].data();



        // Restore shift

        const shift =
            await getAssignedShift(
                guardId
            );


        // Restore today's record

        const record =
            await getTodayShiftRecord(
                guardId
            );



        setCurrentSession(
            guard,
            shift,
            record
        );


        console.log(
            "Guard session restored",
            guard.fullName
        );


    }
    catch(error){

        console.error(
            "Session restore failed:",
            error
        );

    }

}

window.addEventListener(
    "load",
    ()=>{

        restoreCurrentSession();

    }
);
// ============================================
// DUTY STATE
// ============================================

function setDutyState(state){

    switch(state){

        case "OFF_DUTY":

            dutyStatus.textContent = "OFF DUTY";

            break;

        case "ON_DUTY":

            dutyStatus.textContent = "ON DUTY";

            break;

        case "LUNCH":

            dutyStatus.textContent = "ON LUNCH";

            break;

    }

}
setDutyState("OFF_DUTY");
// Dashboard always starts locked


const menuItems = document.querySelectorAll(".menu li");
const pages = document.querySelectorAll(".page");

function closeAllCameras() {

    stopVisitorCamera();
    stopIncidentCamera();
    stopPanicCamera();

}

menuItems.forEach(item => {

    item.addEventListener("click", () => {

        menuItems.forEach(menu =>
            menu.classList.remove("active")
        );

        pages.forEach(page =>
            page.classList.remove("active-page")
        );

        item.classList.add("active");

        document
            .getElementById(item.dataset.page)
            .classList.add("active-page");

        // Always stop every camera first
        closeAllCameras();

        switch (item.dataset.page) {

            case "visitorPage":
                startVisitorCamera();
                break;

            case "incident":
                startIncidentCamera();
                break;

            case "panic":
                startPanicCamera();
                break;

        }

    });

});

const currentDateTime =
document.getElementById("currentDateTime");

function updateClock(){

    currentDateTime.textContent =
        new Date().toLocaleString();

}

updateClock();

setInterval(updateClock,1000);

// ============================================
// FACE VERIFICATION ELEMENTS
// ============================================

const faceModal = document.getElementById("faceModal");

const faceVideo = document.getElementById("faceVideo");

const faceCanvas = document.getElementById("faceCanvas");

const faceStatus = document.getElementById("faceStatus");

const cancelFaceBtn = document.getElementById("cancelFaceBtn");

let currentStream = null;

async function startCamera(){

    currentStream =
        await navigator.mediaDevices.getUserMedia({

            video:{
                facingMode:"user"
            }

        });

    faceVideo.srcObject = currentStream;

    await new Promise(resolve=>{

        faceVideo.onloadedmetadata = resolve;

    });

}



cancelFaceBtn.addEventListener("click",()=>{

    stopCamera();

    faceModal.style.display="none";

});

// ============================================
// VERIFY GUARD FACE
// ============================================

async function verifyGuardFace(){

    faceModal.style.display="flex";

    faceStatus.textContent="Starting camera...";

    await startCamera();

    faceStatus.textContent="Looking for face...";

    const detection =
        await faceapi
        .detectSingleFace(faceVideo)
        .withFaceLandmarks()
        .withFaceDescriptor();

    if(!detection){

        stopCamera();

        faceModal.style.display="none";

        alert("No face detected.");

        return null;

    }

    faceStatus.textContent="Verifying...";

    const guards =
        await getDocs(collection(db,"guards"));

    let matchedGuard=null;

    let bestDistance=1;

    guards.forEach(docSnap=>{

        const guard=docSnap.data();

        if(!guard.faceDescriptor) return;

        const distance=
            faceapi.euclideanDistance(

                detection.descriptor,

                new Float32Array(
                    guard.faceDescriptor
                )

            );

        if(distance<0.45 && distance<bestDistance){

            bestDistance=distance;

            matchedGuard=guard;

        }

    });

    stopCamera();

    faceModal.style.display="none";

    if (!matchedGuard) {

    alert("Face not recognised.");

    return null;

}

// Load today's shift
const shift = await getAssignedShift(
    matchedGuard.guardId
);

// Load today's attendance record
const record = await getTodayShiftRecord(
    matchedGuard.guardId
);

// Save session
setCurrentSession(
    matchedGuard,
    shift,
    record
);

return matchedGuard;

}

function getTodayDate() {
    return new Date().toISOString().split("T")[0];
}

// CLOCK IN BTN
clockInBtn.addEventListener("click", async () => {

    clockInBtn.disabled = true;

    try {

        const guard = await verifyGuardFace();

        if (!guard) return;

        const alreadyClocked = await hasClockedInToday(
            guard.guardId
        );

        if (alreadyClocked) {

            alert("You have already clocked in today.");

            return;

        }

        const shift = await getAssignedShift(
            guard.guardId
        );

        if (!shift) {

            alert("No shift assigned.");

            return;

        }

        if (!isWorkingDay(shift)) {

            alert(
                "Today is not one of your assigned working days."
            );

            return;

        }

        if (
            !shift.siteId ||
            !shift.siteName ||
            !shift.startTime ||
            !shift.endTime
        ) {

            alert(
                "Your shift information is incomplete."
            );

            return;

        }

        alert(

            "Shift Found\n\n" +

            "Guard: " + guard.fullName +

            "\nSite: " + shift.siteName +

            "\nShift: " + shift.shiftType +

            "\nStart: " + shift.startTime +

            "\nEnd: " + shift.endTime

        );

        const insideSite = await verifyGPS(
            shift.siteId
        );

        if (!insideSite) {

            return;

        }

        const success = await createShiftRecord(guard, shift);

if(!success){
    return;
}



const clockInBtn =
document.getElementById("clockInBtn");

const clockOutBtn =
document.getElementById("clockOutBtn");

const lunchInBtn =
document.getElementById("lunchInBtn");

const lunchOutBtn =
document.getElementById("lunchOutBtn");

const scanCheckpointBtn =
document.getElementById("scanCheckpointBtn");

const checkInVisitorBtn =
document.getElementById("checkInVisitorBtn");

const reportIncidentBtn =
document.getElementById("reportIncidentBtn");

const sendPanicAlertBtn =
document.getElementById("sendPanicAlertBtn");
// Refresh today's attendance record
// Refresh today's attendance record
currentShiftRecord = await getTodayShiftRecord(
    guard.guardId
);

// Save current guard session
setCurrentSession(
    guard,
    shift,
    currentShiftRecord
);

loadBroadcasts();

// Update dashboard
document.getElementById("guardName").textContent =
    guard.fullName;

document.getElementById("guardSite").textContent =
    shift.siteName;

setDutyState("ON_DUTY");

alert("Clock In successful.");

    }

    catch(error){

        console.error(error);

        alert(
            "Clock In failed.\nPlease try again."
        );

    }

    

});

async function getTodayShiftRecord(guardId){

    const q = query(
        collection(db,"shiftRecords"),
        where("guardId","==",guardId),
        where("date","==",getTodayDate())
    );

    const snapshot = await getDocs(q);

    if(snapshot.empty){

        return null;

    }

    return {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
    };

}

async function verifyGuardOnDuty() {

    const guard = await verifyGuardFace();

    if (!guard) return null;

    const shift = await getAssignedShift(guard.guardId);

    if (!shift) {

        alert("No shift assigned.");

        return null;

    }

    const record = await getTodayShiftRecord(guard.guardId);

    if (!record) {

        alert("Please Clock In first.");

        return null;

    }

    if (record.shiftCompleted) {

        alert("Your shift has already ended.");

        return null;

    }

    setCurrentSession(

        guard,

        shift,

        record

    );

    return {

        guard,

        shift,

        record

    };

}

async function hasClockedInToday(guardId){

    const today = getTodayDate();

    const q = query(
        collection(db,"shiftRecords"),
        where("guardId","==",guardId),
        where("date","==",today)
    );

    const snapshot = await getDocs(q);

    return !snapshot.empty;

}

async function getAssignedShift(guardId){

    const q = query(
        collection(db,"shifts"),
        where("guardId","==",guardId)
    );

    const snapshot = await getDocs(q);

    if(snapshot.empty){

        return null;

    }

    return snapshot.docs[0].data();

}

function getTodayName() {

    return new Date().toLocaleDateString("en-US", {
        weekday: "long"
    });

}

function isWorkingDay(shift) {

    if (!shift || !shift.workingDays) {

        console.error("Shift has no workingDays:", shift);

        return false;

    }

    const today = getTodayName();

    return shift.workingDays.includes(today);

}
// GPS

async function getCurrentPosition(){

    return new Promise((resolve,reject)=>{

        navigator.geolocation.getCurrentPosition(

            position=>{

                console.log("GPS Success:", position);

                resolve(position);

            },

            error=>{

                console.error("GPS Error:", error);

                alert(
                    "GPS Error\n\n" +
                    "Code: " + error.code +
                    "\nMessage: " + error.message
                );

                reject(error);

            },

            {
                enableHighAccuracy:true,
                timeout:30000,
                maximumAge:60000
                
            }

        );

    });

}

function calculateDistance(lat1, lon1, lat2, lon2){

    const R = 6371000;

    const dLat = (lat2-lat1) * Math.PI / 180;

    const dLon = (lon2-lon1) * Math.PI / 180;

    const a =

        Math.sin(dLat/2) * Math.sin(dLat/2) +

        Math.cos(lat1*Math.PI/180) *

        Math.cos(lat2*Math.PI/180) *

        Math.sin(dLon/2) *

        Math.sin(dLon/2);

    const c = 2 * Math.atan2(Math.sqrt(a),Math.sqrt(1-a));

    return R * c;

}

// GET SITE

async function getSite(siteId){

    const snap = await getDoc(

        doc(db,"sites",siteId)

    );

    if(!snap.exists()){

        return null;

    }

    return snap.data();

}

// VERIFY GPS

async function verifyGPS(siteId){

    const site = await getSite(siteId);

    if(!site){

        alert("Assigned site not found.");

        return false;

    }

    const position = await getCurrentPosition();

    const distance = calculateDistance(

        position.coords.latitude,

        position.coords.longitude,

        site.latitude,

        site.longitude

    );

    if(distance > site.radius){

        alert(

            "You are outside the allowed site radius.\n\n" +

            "Distance: " +

            Math.round(distance) +

            " metres."

        );

        return false;

    }

    return true;

}

// ATTENDANCE STATUS

function calculateAttendanceStatus(startTime, graceMinutes){

    const now = new Date();

    const [hour, minute] = startTime.split(":").map(Number);

    const scheduled = new Date();

    scheduled.setHours(hour, minute, 0, 0);

    const difference = Math.floor(
        (now - scheduled) / 60000
    );

    if(difference <= 0){

        return {
            status: "On Time",
            lateMinutes: 0
        };

    }

    if(difference <= graceMinutes){

        return {
            status: "Grace",
            lateMinutes: difference
        };

    }

    return {
        status: "Late",
        lateMinutes: difference
    };

}

async function createShiftRecord(guard, shift){

    try{

        const attendance = calculateAttendanceStatus(
            shift.startTime,
            Number(shift.graceMinutes || 0)
        );

        const position = await getCurrentPosition();

        const recordRef = doc(collection(db,"shiftRecords"));

        console.log("Writing Shift Record...");

        await setDoc(recordRef,{

            recordId: recordRef.id,
            date: getTodayDate(),
            createdAt: serverTimestamp(),

            guardId: guard.guardId,
            employeeID: guard.employeeID,
            guardName: guard.fullName,
            department: guard.department,
            phone: guard.phone || "",

            siteId: shift.siteId,
            siteName: shift.siteName,
            shiftId: shift.shiftId,
            shiftType: shift.shiftType,

            scheduledStart: shift.startTime,
            scheduledEnd: shift.endTime,

            patrolInterval: Number(shift.patrolInterval || 60),
            patrolGrace: Number(shift.patrolGrace || 0),

            clockInTime: new Date(),
            clockOutTime: null,

            attendanceStatus: attendance.status,
            lateMinutes: attendance.lateMinutes,

            overtimeMinutes: 0,
            workedHours: 0,
            shiftCompleted: false,

            lunchIn: null,
            lunchOut: null,
            lunchMinutes: 0,

            patrolCount: 0,
            expectedPatrols: 0,
            missedPatrols: 0,
            compliance: 0,

            lastPatrolTime: null,
            lastCheckpoint: "",

            incidentCount: 0,

             panicAlerts: 0,

            clockInLatitude: position.coords.latitude,
            clockInLongitude: position.coords.longitude,

            clockOutLatitude: null,
            clockOutLongitude: null,

            status: "ON DUTY"

        });

        console.log("Shift Record Created Successfully");

        return true;

    }catch(error){

        console.error("Shift Record Error:", error);

        alert(error.message);

        return false;

    }
   

}




// CLOCK OUT



function calculateWorkedHours(clockInDate){

    const now = new Date();

    const start = clockInDate.toDate
        ? clockInDate.toDate()
        : new Date(clockInDate);

    const milliseconds = now - start;

    return Number((milliseconds / 3600000).toFixed(2));

}

function calculateOvertime(workedHours, shift){

    const [h,m] = shift.endTime.split(":").map(Number);

    const scheduledEnd = new Date();

    scheduledEnd.setHours(h,m,0,0);

    const now = new Date();

    if(now <= scheduledEnd){

        return 0;

    }

    return Math.floor(
        (now - scheduledEnd) / 60000
    );

}

async function clockOutGuard(record, shift){

    const workedHours =
        calculateWorkedHours(record.clockInTime);

    const overtime =
        calculateOvertime(workedHours, shift);

    await updateDoc(

        doc(db,"shiftRecords",record.id),

        {

            clockOutTime: serverTimestamp(),

            workedHours,

            overtimeMinutes: overtime,

            status: "Completed",

            shiftCompleted: true,

        }

    );

}

clockOutBtn.addEventListener("click", async () => {

    const session = await verifyGuardOnDuty();

    if(!session) return;

    const {

        record,

        shift

    } = session;

    await clockOutGuard(

        record,

        shift

    );

    clearCurrentSession();

    broadcastData = [];
 renderBroadcastTable();

    setDutyState("OFF_DUTY");

    alert("Clock Out successful.");

});
// ------------------LUNCH MANAGEMENT----------------------------------------------------------------

async function lunchInGuard(record){

    if(record.lunchIn){

        alert("Lunch has already started.");

        return false;

    }

    await updateDoc(

        doc(db,"shiftRecords",record.id),

        {

            lunchIn: serverTimestamp()

        }

    );

    return true;

}

lunchInBtn.addEventListener("click", async()=>{

    const session = await verifyGuardOnDuty();

    if(!session) return;

    const {

        record

    } = session;

    const success = await lunchInGuard(record);

    if(!success) return;

    alert("Lunch started.");

    setDutyState("LUNCH");

});

function calculateLunchDuration(lunchInTime){

    const start = lunchInTime.toDate
        ? lunchInTime.toDate()
        : new Date(lunchInTime);

    const end = new Date();

    return Math.floor(
        (end - start) / 60000
    );

}

async function lunchOutGuard(record, shift){

    if(!record.lunchIn){

        alert("Lunch has not been started.");

        return false;

    }

    if(record.lunchOut){

        alert("Lunch has already ended.");

        return false;

    }

    const duration =
        calculateLunchDuration(
            record.lunchIn
        );

    await updateDoc(

        doc(db,"shiftRecords",record.id),

        {

            lunchOut: serverTimestamp(),

            lunchDuration: duration,

            lunchExceeded:
                duration >
                Number(shift.lunchMinutes)

        }

    );

    return {

        duration,

        exceeded:
            duration >
            Number(shift.lunchMinutes)

    };

}

lunchOutBtn.addEventListener("click", async()=>{

    const session = await verifyGuardOnDuty();

    if(!session) return;

    const {

        record,

        shift

    } = session;

    const result = await lunchOutGuard(

        record,

        shift

    );

    if(!result) return;

    alert(

        "Lunch completed.\n\n" +

        "Duration: " +

        result.duration +

        " minutes"

    );

    if(result.exceeded){

        alert("Allowed lunch time exceeded.");

    }

    setDutyState("ON_DUTY");

});

// ------------------------PATROL MANAGEMENT-------------------------------------------------------------

scanCheckpointBtn.addEventListener("click", async()=>{

    const session = await verifyGuardOnDuty();

    if(!session) return;

    const {

        guard

    } = session;

    startQRScanner(guard);

});

let html5QrScanner = null;

async function startQRScanner(guard){

    document.getElementById("qrScannerContainer").style.display="block";

    html5QrScanner = new Html5Qrcode("qr-reader");

    await html5QrScanner.start(

        {
            facingMode:"environment"
        },

        {
            fps:10,
            qrbox:{
                width:250,
                height:250
            }
        },

        async(decodedText)=>{

           await html5QrScanner.stop();

            html5QrScanner.clear();

            html5QrScanner = null;

            document.getElementById(
                "qrScannerContainer"
            ).style.display="none";

            processCheckpointQR(
                decodedText,
                guard
            );

        }

    );

}

const closeScannerBtn =
document.getElementById("closeScannerBtn");

closeScannerBtn.addEventListener("click",async()=>{

    if(html5QrScanner){

        await html5QrScanner.stop();

        html5QrScanner.clear();

        html5QrScanner = null;

    }

    document.getElementById(
        "qrScannerContainer"
    ).style.display="none";

});

async function processCheckpointQR(decodedText, guard){

    try{

        const qr = JSON.parse(decodedText);

        const checkpoint =
            await getCheckpoint(
                qr.checkpointId
            );

        if(!checkpoint){

            alert("Checkpoint not found.");

            return;

        }

        if(checkpoint.siteId !== qr.siteId){

            alert("Invalid checkpoint.");

            return;

        }

        if(checkpoint.checkpointName !== qr.checkpointName){

            alert("Checkpoint information does not match.");

            return;

        }

        if(checkpoint.location !== qr.location){

            alert("Checkpoint location does not match.");

            return;

        }

        alert(

            "Checkpoint verified.\n\n" +

            checkpoint.checkpointName

        );

    }

    catch(error){

        console.error(error);

        alert("Invalid QR Code.");

    }

    const record = currentShiftRecord;
const shift = currentShift;

if (!record || !shift) {

    alert("Please Clock In first.");

    return;

}

 const patrol = await canScanCheckpoint(
    guard,
    checkpoint,
    shift
);

if (!patrol.allowed) {

    alert(
        "Patrol not yet due.\n\n" +
        "Next scan allowed in " +
        patrol.remaining +
        " minute(s)."
    );

    return;

}

 await savePatrol(
    guard,
    checkpoint
 );

 await updatePatrolCount(
    record,
    checkpoint
 );

 alert(

    "✅ Patrol Recorded\n\n" +

    "Checkpoint: " +

    checkpoint.checkpointName +

    "\n\nTotal Patrols: " +

    ((record.patrolCount || 0) + 1)

 );

}

async function getCheckpoint(checkpointId){

    const q = query(
        collection(db,"checkpoints"),
        where("checkpointId","==",checkpointId)
    );

    const snapshot = await getDocs(q);

    if(snapshot.empty){

        return null;

    }

    return {

        id: snapshot.docs[0].id,

        ...snapshot.docs[0].data()

    };

}

async function savePatrol(guard, checkpoint){

    const position = await getCurrentPosition();

    const patrolRef =
        doc(collection(db,"patrols"));

    await setDoc(patrolRef,{

        patrolId: patrolRef.id,

        guardId: guard.guardId,

        employeeID: guard.employeeID,

        guardName: guard.fullName,

        siteId: checkpoint.siteId,

        siteName: checkpoint.siteName,

        checkpointId: checkpoint.checkpointId,

        checkpointName: checkpoint.checkpointName,

        location: checkpoint.location,

        latitude: position.coords.latitude,

        longitude: position.coords.longitude,

        scanTime: serverTimestamp(),

        createdAt: serverTimestamp()

    });

}

async function updatePatrolCount(record, checkpoint){

    await updateDoc(

        doc(db,"shiftRecords",record.id),

        {

            patrolCount:
                (record.patrolCount || 0) + 1,

            lastCheckpoint:
                checkpoint.checkpointName,

            lastPatrolTime:
                serverTimestamp()

        }

    );

}

async function getLastPatrol(guardId, checkpointId){

    const q = query(

        collection(db,"patrols"),

        where("guardId","==",guardId),

        where("checkpointId","==",checkpointId),

        orderBy("scanTime","desc"),

        limit(1)

    );

    const snapshot = await getDocs(q);

    if(snapshot.empty){

        return null;

    }

    return snapshot.docs[0].data();

}

async function canScanCheckpoint(
    guard,
    checkpoint,
    shift
){

    const lastPatrol =
        await getLastPatrol(
            guard.guardId,
            checkpoint.checkpointId
        );

    if(!lastPatrol){

        return {
            allowed:true
        };

    }

    const last =
        lastPatrol.scanTime.toDate();

    const interval =
        Number(shift.patrolInterval);

    const elapsed =
        Math.floor(
            (Date.now()-last.getTime())/60000
        );

    if(elapsed >= interval){

        return {
            allowed:true
        };

    }

    return{

        allowed:false,

        remaining:
            interval-elapsed

    };

}

// -----------------------------------VISITOR MANAGEMENT-------------------------------------------------------
let visitorFacingMode = "environment";
const visitorVideo =
document.getElementById("visitorVideo");

const visitorCanvas =
document.getElementById("visitorCanvas");

const visitorPreview =
document.getElementById("visitorPreview");

const captureVisitorPhoto =
document.getElementById("captureVisitorPhoto");

let visitorPhotoBase64 = "";

const visitorName = document.getElementById("visitorName");
const visitorID = document.getElementById("visitorID");
const visitorPhone = document.getElementById("visitorPhone");
const visitorCompany = document.getElementById("visitorCompany");
const visitorPurpose = document.getElementById("visitorPurpose");

const visitorHostName =
document.getElementById("visitorHostName");

const visitorHostEmployeeID =
document.getElementById("visitorHostEmployeeID");

const visitorVehicle =
document.getElementById("visitorVehicle");

const visitorBadge =
document.getElementById("visitorBadge");

const visitorNotes =
document.getElementById("visitorNotes");

const checkInVisitor =
document.getElementById("checkInVisitor");

const visitorTableBody =
document.getElementById("visitorTableBody");

let visitorData = [];

let visitorStream = null;

async function startVisitorCamera(){

    if(visitorStream){

        stopVisitorCamera();

    }

    visitorStream = await navigator.mediaDevices.getUserMedia({

        video:{
            facingMode: visitorFacingMode
        }

    });

    visitorVideo.srcObject = visitorStream;

}

const switchVisitorCameraBtn =
document.getElementById("switchVisitorCameraBtn");

switchVisitorCameraBtn.addEventListener("click", async ()=>{

    visitorFacingMode =
        visitorFacingMode==="environment"
        ? "user"
        : "environment";

    await startVisitorCamera();

});

function stopVisitorCamera(){

    if(!visitorStream) return;

    visitorStream.getTracks().forEach(track=>{

        track.stop();

    });

    visitorVideo.srcObject = null;

    visitorStream = null;

       visitorPreview.removeAttribute("src");
}

captureVisitorPhoto.addEventListener("click",()=>{

    visitorCanvas.width =
        visitorVideo.videoWidth;

    visitorCanvas.height =
        visitorVideo.videoHeight;

    const ctx =
        visitorCanvas.getContext("2d");

    ctx.drawImage(

        visitorVideo,

        0,

        0

    );

    visitorPhotoBase64 =
        visitorCanvas.toDataURL(

            "image/jpeg",

            0.8

        );

    visitorPreview.src =
        visitorPhotoBase64;

});

checkInVisitorBtn.addEventListener("click", async()=>{

    const session = await verifyGuardOnDuty();

    if(!session) return;

    const {

        guard,

        record

    } = session;

    await registerVisitor(

        guard,

        record

    );

});

async function registerVisitor(guard,shift){

    if(visitorPhotoBase64===""){

        alert("Capture visitor photo.");

        return;

    }

    if(visitorName.value.trim()===""){

        alert("Enter visitor name.");

        return;

    }

    if(visitorCompany.value.trim()===""){

        alert("Enter company.");

        return;

    }

    if(visitorPurpose.value.trim()===""){

        alert("Enter purpose of visit.");

        return;

    }

    if(visitorHostName.value.trim()===""){

        alert("Enter host name.");

        return;

    }

    const visitorRef =
        doc(collection(db,"visitors"));

    await setDoc(visitorRef,{

        visitorId: visitorRef.id,

        fullName:
            visitorName.value.trim(),

        idNumber:
            visitorID.value.trim(),

        phone:
            visitorPhone.value.trim(),

        company:
            visitorCompany.value.trim(),

        purpose:
            visitorPurpose.value.trim(),

        hostName:
            visitorHostName.value.trim(),

        hostEmployeeID:
            visitorHostEmployeeID.value.trim(),

        vehicleRegistration:
            visitorVehicle.value.trim(),

        badgeNumber:
            visitorBadge.value.trim(),

        notes:
            visitorNotes.value.trim(),

        photoBase64:
            visitorPhotoBase64,

        guardId:
            guard.guardId,

        employeeID:
            guard.employeeID,

        guardName:
            guard.fullName,

        guardDepartment:
            guard.department,

        siteId:
            shift.siteId,

        siteName:
            shift.siteName,

        visitDate:
            getTodayDate(),

        checkInTime:
            serverTimestamp(),

        checkOutTime:
            null,

        checkedOut:
            false,

        status:
            "Inside",

        createdBy:
            "Guard",

        createdAt:
            serverTimestamp()

    });

    alert("Visitor Registered Successfully.");

    clearVisitorForm();
    stopVisitorCamera();
    

}

function clearVisitorForm(){

    visitorName.value="";
    visitorID.value="";
    visitorPhone.value="";
    visitorCompany.value="";
    visitorPurpose.value="";
    visitorHostName.value="";
    visitorHostEmployeeID.value="";
    visitorVehicle.value="";
    visitorBadge.value="";
    visitorNotes.value="";

    visitorPreview.removeAttribute("src");

    visitorPhotoBase64="";

}

function loadVisitors(){

    const q = query(

        collection(db,"visitors"),

        where("checkedOut","==",false)

    );

    onSnapshot(q,(snapshot)=>{

        visitorData=[];

        snapshot.forEach(doc=>{

            visitorData.push({

                id:doc.id,

                ...doc.data()

            });

        });

        renderVisitorTable();

    });

}

function renderVisitorTable(){

    visitorTableBody.innerHTML="";

    visitorData.forEach(visitor=>{

        const checkIn =

            visitor.checkInTime

            ? visitor.checkInTime
                .toDate()
                .toLocaleTimeString()

            : "-";

        visitorTableBody.innerHTML+=`

        <tr>

            <td>

                ${visitor.fullName}

            </td>

            <td>

                ${visitor.company}

            </td>

            <td>

                ${visitor.hostName}

            </td>

            <td>

                ${checkIn}

            </td>

            <td>

                <span class="status active">

                    ${visitor.status}

                </span>

            </td>

            <td>

                <button

                    onclick="checkOutVisitor('${visitor.id}')"

                >

                    Check Out

                </button>

            </td>

        </tr>

        `;

    });

}

async function checkOutVisitor(id){

   const session = await verifyGuardOnDuty();

 if(!session) return;

    const ok = confirm(

        "Check this visitor out?"

    );

    if(!ok) return;

    await updateDoc(

        doc(db,"visitors",id),

        {

            checkOutTime:
                serverTimestamp(),

            checkedOut:
                true,

            status:
                "Checked Out"

        }

    );

    alert("Visitor Checked Out.");

}
loadVisitors();

// -------------------------------------INCIDENT MANAGEMENT---------------------------------------------------------

// =====================================
// INCIDENT MANAGEMENT
// =====================================
let incidentFacingMode = "environment";
const incidentVideo =
document.getElementById("incidentVideo");

const incidentCanvas =
document.getElementById("incidentCanvas");

const incidentPreview =
document.getElementById("incidentPreview");

const captureIncidentPhoto =
document.getElementById("captureIncidentPhoto");

const incidentType =
document.getElementById("incidentType");

const incidentPriority =
document.getElementById("incidentPriority");

const incidentLocation =
document.getElementById("incidentLocation");

const incidentDescription =
document.getElementById("incidentDescription");

const incidentWitnesses =
document.getElementById("incidentWitnesses");

const incidentActions =
document.getElementById("incidentActions");

const reportIncident =
document.getElementById("reportIncident");

const incidentTableBody =
document.getElementById("incidentTableBody");

let incidentPhotoBase64 = "";

let incidentStream = null;

let incidentData = [];



async function startIncidentCamera(){

    stopIncidentCamera();

    incidentStream =
    await navigator.mediaDevices.getUserMedia({

        video:{
            facingMode:incidentFacingMode
        }

    });

    incidentVideo.srcObject = incidentStream;

}

const switchIncidentCameraBtn =
document.getElementById("switchIncidentCameraBtn");

switchIncidentCameraBtn.addEventListener("click", async ()=>{

    incidentFacingMode =
        incidentFacingMode==="environment"
        ? "user"
        : "environment";

    await startIncidentCamera();

});

function stopIncidentCamera() {

    if (!incidentStream) return;

    incidentStream.getTracks().forEach(track => track.stop());

    incidentVideo.srcObject = null;

    incidentStream = null;

}

captureIncidentPhoto.addEventListener("click",()=>{

    incidentCanvas.width =
        incidentVideo.videoWidth;

    incidentCanvas.height =
        incidentVideo.videoHeight;

    const ctx =
        incidentCanvas.getContext("2d");

    ctx.drawImage(

        incidentVideo,

        0,

        0

    );

    incidentPhotoBase64 =
        incidentCanvas.toDataURL(

            "image/jpeg",

            0.7

        );

    incidentPreview.src =
        incidentPhotoBase64;

});

function clearIncidentForm(){

    incidentType.value="";

    incidentPriority.value="";

    incidentLocation.value="";

    incidentDescription.value="";

    incidentWitnesses.value="";

    incidentActions.value="";

    incidentPreview.src="";

    incidentPhotoBase64="";

}

function generateIncidentNumber(){

    const now = new Date();

    const year = now.getFullYear();

    const month = String(
        now.getMonth()+1
    ).padStart(2,"0");

    const day = String(
        now.getDate()
    ).padStart(2,"0");

    const time =
        Date.now().toString().slice(-6);

    return `INC-${year}${month}${day}-${time}`;

}

reportIncidentBtn.addEventListener("click", async()=>{

    const session = await verifyGuardOnDuty();

    if(!session) return;

    const {

        guard,

        shift

    } = session;

    const insideSite = await verifyGPS(
        shift.siteId
    );

    if(!insideSite) return;

    await saveIncident(
        guard,
        shift
    );

});

async function saveIncident(guard,shift){

    if(incidentPhotoBase64===""){

        alert("Capture incident photo.");

        return;

    }

    if(incidentType.value===""){

        alert("Select incident type.");

        return;

    }

    if(incidentPriority.value===""){

        alert("Select priority.");

        return;

    }

    if(incidentLocation.value.trim()===""){

        alert("Enter incident location.");

        return;

    }

    if(incidentDescription.value.trim()===""){

        alert("Enter incident description.");

        return;

    }

    const position =
        await getCurrentPosition();

    const incidentRef =
        doc(collection(db,"incidents"));

    await setDoc(incidentRef,{

        incidentId:
            incidentRef.id,

        incidentNumber:
            generateIncidentNumber(),

        guardId:
            guard.guardId,

        employeeID:
            guard.employeeID,

        guardName:
            guard.fullName,

        department:
            guard.department,

        siteId:
            shift.siteId,

        siteName:
            shift.siteName,

        shiftId:
            shift.shiftId,

        incidentType:
            incidentType.value,

        priority:
            incidentPriority.value,

        location:
            incidentLocation.value,

        description:
            incidentDescription.value,

        witnesses:
            incidentWitnesses.value,

        actionsTaken:
            incidentActions.value,

        photosBase64:[
            incidentPhotoBase64
        ],

        latitude:
            position.coords.latitude,

        longitude:
            position.coords.longitude,

        date:
            getTodayDate(),

        time:
            new Date().toLocaleTimeString(),

        status:
            "Open",

        createdAt:
            serverTimestamp()

    });

    await updateDoc(

        doc(
            db,
            "shiftRecords",
            shift.id
        ),

        {

            incidentCount:
                increment(1)

        }

    );

    alert(
        "Incident Reported Successfully."
    );

    clearIncidentForm();
    stopIncidentCamera();

}

function loadIncidents(){

    const q = query(

        collection(db,"incidents"),

        where("status","==","Open")

    );

    onSnapshot(q,(snapshot)=>{

        incidentData = [];

        snapshot.forEach(doc=>{

            incidentData.push({

                id: doc.id,

                ...doc.data()

            });

        });

        renderIncidentTable();

    });

}

function renderIncidentTable(){

    incidentTableBody.innerHTML = "";

    incidentData.forEach(incident=>{

        incidentTableBody.innerHTML += `

        <tr>

            <td>

                ${incident.incidentNumber}

            </td>

            <td>

                ${incident.incidentType}

            </td>

            <td>

                ${incident.priority}

            </td>

            <td>

                ${incident.time}

            </td>

            <td>

                <span class="status active">

                    ${incident.status}

                </span>

            </td>

            <td>

                <button

                    onclick="viewIncident('${incident.id}')"

                >

                    View

                </button>

            </td>

        </tr>

        `;

    });

}

window.viewIncident = async function(id){

    const snap = await getDoc(

        doc(db,"incidents",id)

    );

    if(!snap.exists()) return;

    const incident = snap.data();

    alert(

        "Incident Number: " +

        incident.incidentNumber +

        "\n\nType: " +

        incident.incidentType +

        "\nPriority: " +

        incident.priority +

        "\nLocation: " +

        incident.location +

        "\n\nDescription:\n" +

        incident.description +

        "\n\nStatus: " +

        incident.status

    );

}

loadIncidents();

// -------------------------------------PANIC ALERT MANAGEMENT--------------------------------------------------

// =====================================
// PANIC ALERT
// =====================================
let panicFacingMode = "environment";
const panicVideo =
document.getElementById("panicVideo");

const panicCanvas =
document.getElementById("panicCanvas");

const panicPreview =
document.getElementById("panicPreview");

const capturePanicPhoto =
document.getElementById("capturePanicPhoto");

const panicReason =
document.getElementById("panicReason");

const sendPanicAlert =
document.getElementById("sendPanicAlert");

let panicPhotoBase64 = "";

let panicStream = null;

async function startPanicCamera(){

    if(panicStream) return;

    panicStream =
        await navigator.mediaDevices.getUserMedia({

            video:{
                facingMode: panicFacingMode
            }

        });

    panicVideo.srcObject =
        panicStream;

}

const switchPanicCameraBtn =
document.getElementById("switchPanicCameraBtn");

switchPanicCameraBtn.addEventListener("click", async ()=>{

    panicFacingMode =
        panicFacingMode==="environment"
        ? "user"
        : "environment";

    await startPanicCamera();

});

function stopPanicCamera(){

    if(!panicStream) return;

    panicStream
        .getTracks()
        .forEach(track=>track.stop());

    panicVideo.srcObject = null;

    panicStream = null;

}

capturePanicPhoto.addEventListener("click",()=>{

    panicCanvas.width =
        panicVideo.videoWidth;

    panicCanvas.height =
        panicVideo.videoHeight;

    const ctx =
        panicCanvas.getContext("2d");

    ctx.drawImage(

        panicVideo,

        0,

        0

    );

    panicPhotoBase64 =
        panicCanvas.toDataURL(

            "image/jpeg",

            0.8

        );

    panicPreview.src =
        panicPhotoBase64;

});

function clearPanicForm(){

    panicReason.value = "";

    panicPhotoBase64 = "";

    panicPreview.removeAttribute("src");

}

sendPanicAlertBtn.addEventListener("click", async()=>{

    const session = await verifyGuardOnDuty();

    if(!session) return;

    const {

        guard,

        shift

    } = session;

    const insideSite = await verifyGPS(
        shift.siteId
    );

    if(!insideSite) return;

    await savePanicAlert(
        guard,
        shift
    );

});

async function savePanicAlert(guard,shift){

    const position =
        await getCurrentPosition();

    const panicRef =
        doc(collection(db,"panicAlerts"));

    await setDoc(panicRef,{

        panicId:
            panicRef.id,

        guardId:
            guard.guardId,

        employeeID:
            guard.employeeID,

        guardName:
            guard.fullName,

        department:
            guard.department,

        siteId:
            shift.siteId,

        siteName:
            shift.siteName,

        shiftId:
            shift.shiftId,

        latitude:
            position.coords.latitude,

        longitude:
            position.coords.longitude,

        photoBase64:
            panicPhotoBase64 || "",

        reason:
            panicReason.value.trim(),

        date:
            getTodayDate(),

        time:
            new Date().toLocaleTimeString(),

        status:
            "Active",

        acknowledgedAt:
            null,

        acknowledgedBy:
            "",

        resolvedAt:
            null,

        resolvedBy:
            "",

        resolutionNotes:
            "",

        createdAt:
            serverTimestamp()

    });

    await updateDoc(

    doc(
        db,
        "shiftRecords",
        shift.id
    ),

    {

        panicAlerts:
            increment(1)

    }

 );

    alert(
        "🚨 PANIC ALERT SENT"
    );

    clearPanicForm();

    stopPanicCamera();

}

// ---------------------------------------BROADCAST---------------------------------------------------------------------------

// =====================================
// GUARD BROADCAST
// =====================================

const broadcastTableBody =
document.getElementById("broadcastTableBody");

const broadcastModal =
document.getElementById("broadcastModal");

const broadcastDetails =
document.getElementById("broadcastDetails");

const closeBroadcastModal =
document.getElementById("closeBroadcastModal");

let broadcastData = [];

function loadBroadcasts(){

    onSnapshot(

        collection(db,"broadcasts"),

        snapshot=>{

            broadcastData = [];

            snapshot.forEach(doc=>{

                const broadcast = {

                    id:doc.id,

                    ...doc.data()

                };

                if(canReceiveBroadcast(broadcast)){

                    broadcastData.push(broadcast);

                }

            });

            renderBroadcastTable();

        }

    );

}

function canReceiveBroadcast(broadcast){

    if(!currentGuard) return false;

    if(broadcast.status!=="Active") return false;

    switch(broadcast.targetType){

        case "All":

            return true;

        case "Site":

         return (
         broadcast.targetValue.trim().toLowerCase() ===
         currentShift.siteName.trim().toLowerCase()
        );

        case "Department":

         return (
         broadcast.targetValue.trim().toLowerCase() ===
         currentGuard.department.trim().toLowerCase()
        );

        case "Guard":

          const target =
         broadcast.targetValue.trim().toLowerCase();

         return (

         target === currentGuard.employeeID.toLowerCase() ||

         target === currentGuard.guardId.toLowerCase() ||

         target === currentGuard.fullName.toLowerCase()

        );

        default:

            return false;

    }

}

async function renderBroadcastTable(){

    broadcastTableBody.innerHTML="";

    for(const broadcast of broadcastData){

        const readSnap = await getDocs(

            query(

                collection(db,"broadcastReads"),

                where(

                    "broadcastId",

                    "==",

                    broadcast.broadcastId

                ),

                where(

                    "guardId",

                    "==",

                    currentGuard.guardId

                )

            )

        );

        const isRead =

            !readSnap.empty;

        const status =

            isRead

            ? "Read"

            : "Unread";

        const rowClass =

            isRead

            ? "read"

            : "unread";

        const date =

            broadcast.createdAt

            ?

            broadcast.createdAt
                .toDate()
                .toLocaleString()

            :

            "-";

        broadcastTableBody.innerHTML +=`

        <tr class="${rowClass}">

            <td>

                <span class="priority ${broadcast.priority.toLowerCase()}">

                    ${broadcast.priority}

                </span>

            </td>

            <td>${broadcast.title}</td>

            <td>${broadcast.targetType}</td>

            <td>${date}</td>

            <td>${status}</td>

            <td>

                <button

                onclick="viewBroadcast('${broadcast.id}')">

                    Open

                </button>

            </td>

        </tr>

        `;

    }

}

window.viewBroadcast = async function(id){

    const snap =

        await getDoc(

            doc(db,"broadcasts",id)

        );

    if(!snap.exists()) return;

    const broadcast =

        snap.data();

    await markBroadcastRead(

        broadcast.broadcastId

    );

    let image="";

    if(broadcast.photoBase64){

        image =`

        <img

            src="${broadcast.photoBase64}"

            class="broadcast-photo"

        >

        `;

    }

    broadcastDetails.innerHTML =`

        <h2>

            ${broadcast.title}

        </h2>

        <hr>

        <p>

            <strong>

            Priority:

            </strong>

            ${broadcast.priority}

        </p>

        <p>

            ${broadcast.message}

        </p>

        ${image}

        <hr>

        <textarea

            id="broadcastReply"

            class="reply-box"

            placeholder="Reply..."

        ></textarea>

        <br>

        <div id="guardConversation">

        </div>


        <br><br>

        <button

            onclick="replyBroadcast('${broadcast.broadcastId}')"

        >

            Send Reply

        </button>

    `;

    const repliesSnap =
 await getDocs(
 query(
 collection(db,"broadcastReplies"),
 where(
 "broadcastId",
 "==",
 broadcast.broadcastId
 )
 )
 );


 let conversation="";


 repliesSnap.forEach(doc=>{


  const r = doc.data();
 

    conversation += `

    <div class="reply-card">


    <strong>

    ${r.senderType}

    </strong>


    <br>


   ${r.senderName || r.guardName}


   <br><br>


    ${r.reply}


    </div>


     `;

    });


    document.getElementById(
    "guardConversation"
    ).innerHTML =
    conversation || "No messages yet.";

    broadcastModal.style.display="flex";

}

async function markBroadcastRead(broadcastId){

    const existing =

        await getDocs(

            query(

                collection(db,"broadcastReads"),

                where(

                    "broadcastId",

                    "==",

                    broadcastId

                ),

                where(

                    "guardId",

                    "==",

                    currentGuard.guardId

                )

            )

        );

    if(!existing.empty) return;

    const ref =

        doc(

            collection(

                db,

                "broadcastReads"

            )

        );

    await setDoc(ref,{

        broadcastId,

        guardId:

            currentGuard.guardId,

        guardName:

            currentGuard.fullName,

        employeeID:

            currentGuard.employeeID,

        siteName:

            currentShift?.siteName,

        readAt:

            serverTimestamp()

    });

}

window.replyBroadcast = async function(broadcastId){

    const session = await verifyGuardOnDuty();

 if(!session) return;

 const {

    guard,

    shift

 } = session;
    const reply =

        document

        .getElementById(

            "broadcastReply"

        )

        .value

        .trim();

    if(reply===""){

        alert(

            "Enter your reply."

        );

        return;

    }

    const ref =

        doc(

            collection(

                db,

                "broadcastReplies"

            )

        );

    await setDoc(ref,{

        replyId:

            ref.id,

        broadcastId,

        senderType:"Guard",

        guardId:

            guard.guardId,

        employeeID:

            guard.employeeID,

        guardName:

            guard.fullName,

        department:

            guard.department,

        siteId:

            shift.siteId,

        siteName:

            shift.siteName,

        reply,

        repliedAt:

            serverTimestamp()

    });

    alert(

        "Reply sent."

    );

    broadcastModal.style.display="none";

}

closeBroadcastModal.onclick = ()=>{

    broadcastModal.style.display="none";

};

window.addEventListener(

    "click",

    event=>{

        if(event.target===broadcastModal){

            broadcastModal.style.display="none";

        }

    }

);
