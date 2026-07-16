//====================================================
// FIREBASE
//====================================================

import {
    db
} from "./firebase.js";

import {

    collection,
    getDocs,
    addDoc,
    updateDoc,
    doc,
    query,
    where,
    serverTimestamp

} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


//====================================================
// DOM
//====================================================

const video =
document.getElementById("attendanceVideo");

const canvas =
document.getElementById("attendanceCanvas");

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

const liveTime =
document.getElementById("liveTime");

const liveDate =
document.getElementById("liveDate");


//====================================================
// VARIABLES
//====================================================

let bodyModel;

let currentStream = null;

let modelsLoaded = false;

let bodyDetected = false;

let processing = false;

let attendanceStream = null;
let cameraStarting = false;


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

async function startCamera(){


    try{


        if(cameraStarting){

            console.log(
                "Camera already starting"
            );

            return;

        }


        cameraStarting = true;



        // Stop previous camera first

        if(attendanceStream){

            attendanceStream
            .getTracks()
            .forEach(track=>{

                track.stop();

            });


            attendanceStream=null;

        }



        const devices =
        await navigator.mediaDevices
        .enumerateDevices();



        const cameras =
        devices.filter(
            d=>d.kind==="videoinput"
        );



        if(cameras.length===0){

            throw new Error(
                "No camera found"
            );

        }



        attendanceStream =
        await navigator.mediaDevices
        .getUserMedia({

            video:{

                facingMode:"user",

                width:{
                    ideal:1280
                },

                height:{
                    ideal:720
                }

            },

            audio:false

        });



        attendanceVideo.srcObject =
        attendanceStream;



        await new Promise(resolve=>{


            attendanceVideo.onloadedmetadata =
            async()=>{


                await attendanceVideo.play();


                resolve();


            };


        });



        console.log(
            "Camera started:",
            attendanceVideo.videoWidth,
            attendanceVideo.videoHeight
        );



    }

    catch(error){


        console.error(
            "Camera error:",
            error
        );


        if(error.name==="NotReadableError"){


            setStatus(
                "Camera busy. Close other apps using camera.",
                "error"
            );


        }


    }

    finally{


        cameraStarting=false;


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

    if(!modelsLoaded) return;

    if(video.readyState !== 4){

        requestAnimationFrame(detectBody);
        return;

    }

    try{

        const predictions =
        await bodyModel.detect(video);

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

    requestAnimationFrame(detectBody);

}
detectBody();
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


            employeeDisplay.textContent =
            employee.employeeID;


            nameDisplay.textContent =
            employee.fullName;


            departmentDisplay.textContent =
            employee.department;


            siteDisplay.textContent =
            employee.siteName;



            if(employee.department !== "Staff"){

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