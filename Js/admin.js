// ============================================
// NEWLOOK SECURITY SYSTEM
// admin.js
// ============================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    collection,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    onSnapshot,
    limit,
    increment,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import {
    loadFaceModels,
    openCamera,
    stopCamera,
    capturePhoto,
    previewPhoto,
    generateFaceDescriptor,
    resizeImage
} from "./face.js";

function getTodayDate(){

    return new Date()
        .toISOString()
        .split("T")[0];

}
// ----------------------------
// Protect Admin Dashboard
// ----------------------------

onAuthStateChanged(auth, async(user)=>{

    if(!user){

        location.href="login.html";
        return;

    }

    try{

        const snap=await getDoc(doc(db,"admins",user.uid));

        if(!snap.exists()){

            alert("User account not found.");

            await signOut(auth);

            location.href="login.html";

            return;

        }

        const admin=snap.data();

        if(admin.role!=="admin"){

            alert("Access denied.");

            await signOut(auth);

            location.href="login.html";

            return;

        }

        if(admin.status!=="Active"){

            alert("Account suspended.");

            await signOut(auth);

            location.href="login.html";

            return;

        }

    }

    catch(error){

        console.error(error);

    }

});

// ----------------------------
// Sidebar Navigation
// ----------------------------

const menuItems=document.querySelectorAll(".menu li");

const pages=document.querySelectorAll(".page");

menuItems.forEach(item=>{

    item.addEventListener("click",()=>{

        menuItems.forEach(menu=>{

            menu.classList.remove("active");

        });

        pages.forEach(page=>{

            page.classList.remove("active-page");

        });

        item.classList.add("active");

        const section=item.dataset.section;

        document
        .getElementById(section)
        .classList.add("active-page");

    });

});

console.log("Y O U R I ADMIN READY");

// =======================================================
// GUARD MANAGEMENT
// =======================================================


// ------------------------------
// Elements
// ------------------------------

const employeeID = document.getElementById("employeeID");
const fullName = document.getElementById("fullName");
const phone = document.getElementById("phone");
const emailAddress = document.getElementById("emailAddress");
const role = document.getElementById("role");
const department = document.getElementById("department");
const status = document.getElementById("status");
const siteSelect = document.getElementById("siteSelect");

const saveGuardBtn = document.getElementById("saveGuardBtn");

const photoBase64 = document.getElementById("photoBase64");
const faceDescriptor = document.getElementById("faceDescriptor");

const camera = document.getElementById("camera");

const openCameraBtn = document.getElementById("openCameraBtn");

const canvas = document.getElementById("canvas");

const captureBtn = document.getElementById("captureBtn");

const photoPreview = document.getElementById("photoPreview");

await loadFaceModels();

let capturedPhotoBase64 = "";

let capturedFaceDescriptor = [];

const guardTableBody = document.getElementById("guardTableBody");

loadGuards();

let selectedGuardId = null;

const updateGuardBtn = document.getElementById("updateGuardBtn");

const searchGuard = document.getElementById("searchGuard");

const filterStatus = document.getElementById("filterStatus");

const downloadPDFBtn =
    document.getElementById("downloadPDFBtn");

    const downloadExcelBtn =
document.getElementById("downloadExcelBtn");

// SITES
// ============================================
// SITE MANAGEMENT
// ============================================

const siteName = document.getElementById("siteName");
const siteAddress = document.getElementById("siteAddress");
const siteLatitude = document.getElementById("siteLatitude");
const siteLongitude = document.getElementById("siteLongitude");
const siteRadius = document.getElementById("siteRadius");

const saveSiteBtn = document.getElementById("saveSiteBtn");
const updateSiteBtn = document.getElementById("updateSiteBtn");
const clearSiteBtn = document.getElementById("clearSiteBtn");

const searchSite = document.getElementById("searchSite");
const siteTableBody = document.getElementById("siteTableBody");

let selectedSiteId = null;

// ------------------------------
// Generate Employee ID
// ------------------------------

async function generateEmployeeID(){

    const snapshot = await getDocs(collection(db,"guards"));

    const total = snapshot.size + 1;

    employeeID.value = "NL" + String(total).padStart(5,"0");

}

generateEmployeeID();

// ------------------------------
// Save Guard
// ------------------------------

saveGuardBtn.addEventListener("click", async () => {

    try {

        if (fullName.value.trim() === "") {
            alert("Enter Full Name");
            return;
        }

        if (phone.value.trim() === "") {
            alert("Enter Phone Number");
            return;
        }

        if (siteSelect.value === "") {
            alert("Select Site");
            return;
        }

        if (!capturedPhotoBase64) {

         alert("Capture or upload a photo first.");

         return;

        }

        if (!capturedFaceDescriptor.length) {

         alert("Face descriptor has not been generated.");

         return;

        }

        const duplicate = query(
            collection(db, "guards"),
            where("employeeID", "==", employeeID.value)
        );

        const duplicateSnap = await getDocs(duplicate);

        if (!duplicateSnap.empty) {
            alert("Duplicate Employee ID");
            return;
        }

        const guardRef = doc(collection(db, "guards"));

        await setDoc(guardRef, {

            guardId: guardRef.id,

            employeeID: employeeID.value,

            fullName: fullName.value,

            phone: phone.value,

            email: emailAddress.value,

            role: role.value,

            department: department.value,

            siteId: siteSelect.value,

            siteName:
            siteSelect.options[
            siteSelect.selectedIndex
            ].text,

            status: status.value,

            profilePhotoBase64: capturedPhotoBase64,

            faceDescriptor: capturedFaceDescriptor,

            createdAt: serverTimestamp()

        });

        alert("Guard registered successfully.");

        generateEmployeeID();
        await loadGuards();

    } catch (error) {

        alert(error.message);

        console.error(error);

    }

});

// OPEN CAMERA

openCameraBtn.addEventListener("click", async () => {

    try {

        await openCamera(camera);

    } catch (error) {

        console.error(error);

        alert("Unable to access the camera.");

    }

});

// CAPTURE PHOTO BTN

captureBtn.addEventListener("click", async () => {

    try {

        if (!camera.srcObject) {

            alert("Open the camera first.");

            return;

        }

        const original = capturePhoto(camera, canvas);

        capturedPhotoBase64 = await resizeImage(original);

        previewPhoto(photoPreview, capturedPhotoBase64);

        capturedFaceDescriptor =
            await generateFaceDescriptor(photoPreview);

        stopCamera();

        alert("Face registered successfully.");

    }

    catch (error) {

        alert(error.message);

        console.error(error);

    }

});

// ============================================
// Load Guards
// ============================================

async function loadGuards(searchText = "", statusFilter = "") {

    guardTableBody.innerHTML = "";

    const snapshot = await getDocs(collection(db, "guards"));

    snapshot.forEach((docSnap) => {

        const guard = docSnap.data();

        const keyword = searchText.toLowerCase().trim();

        if (
          keyword &&
          !guard.employeeID.toLowerCase().includes(keyword) &&
          !guard.fullName.toLowerCase().includes(keyword) &&
          !guard.phone.toLowerCase().includes(keyword) &&
          !guard.email.toLowerCase().includes(keyword) &&
          !guard.role.toLowerCase().includes(keyword) &&
          !guard.department.toLowerCase().includes(keyword) &&
          !guard.status.toLowerCase().includes(keyword)
        ) {

         return;

        }

        if (
          statusFilter &&
          guard.status !== statusFilter
        ) {

           return;

        }

        const row = document.createElement("tr");

        row.innerHTML = `

            <td>

                <img
                    src="${guard.profilePhotoBase64}"
                    class="table-photo">

            </td>

            <td>${guard.employeeID}</td>

            <td>${guard.fullName}</td>

            <td>${guard.phone}</td>

            <td>${guard.email}</td>

            <td>${guard.role}</td>

            <td>${guard.department}</td>

            <td>${guard.siteName}</td>

            <td>${guard.status}</td>

            <td>

                <button
                     class="status-btn"
                     data-id="${guard.guardId}"
                     data-status="${guard.status}">

                     ${guard.status === "Active" ? "Suspend" : "Activate"}

                </button>

                <button
                  class="edit-btn"
                  data-id="${guard.guardId}">

                   Edit

                </button>

                <button
                    class="delete-btn"
                    data-id="${guard.guardId}">

                    Delete

                </button>

            </td>

        `;

        guardTableBody.appendChild(row);

        row.querySelector(".edit-btn").addEventListener("click", () => {

     editGuard(guard.guardId);

     });

     row.querySelector(".status-btn").addEventListener("click", () => {

     toggleGuardStatus(

        guard.guardId,

        guard.status

     );

     });

     row.querySelector(".delete-btn").addEventListener("click", () => {

     deleteGuard(guard.guardId);

     });

    });

}

// EDIT GUARD

async function editGuard(id) {

    const snap = await getDoc(doc(db, "guards", id));

    if (!snap.exists()) return;

    const guard = snap.data();

    selectedGuardId = id;

    employeeID.value = guard.employeeID;

    fullName.value = guard.fullName;

    phone.value = guard.phone;

    emailAddress.value = guard.email;

    role.value = guard.role;

    department.value = guard.department;

    siteSelect.value = guard.siteId;

    status.value = guard.status;

    photoPreview.src = guard.profilePhotoBase64;

    capturedPhotoBase64 = guard.profilePhotoBase64;

    capturedFaceDescriptor = guard.faceDescriptor;

}

// UPDATE GUARD

updateGuardBtn.addEventListener("click", async () => {

    if (!selectedGuardId) {

        alert("Select a guard first.");

        return;

    }

    await updateDoc(doc(db, "guards", selectedGuardId), {

        fullName: fullName.value,

        phone: phone.value,

        email: emailAddress.value,

        role: role.value,

        department: department.value,

        siteId: siteSelect.value,

        siteName:
        siteSelect.options[
        siteSelect.selectedIndex
        ].text,

        status: status.value,

        profilePhotoBase64: capturedPhotoBase64,

        faceDescriptor: capturedFaceDescriptor

    });

    alert("Guard updated successfully.");

    selectedGuardId = null;

    await loadGuards();

});

// ============================================
// Delete Guard
// ============================================

async function deleteGuard(id) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this guard?"
    );

    if (!confirmDelete) return;

    try {

        await deleteDoc(doc(db, "guards", id));

        alert("Guard deleted successfully.");

        await loadGuards();

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

}

// SEARCH GUARD

searchGuard.addEventListener("input", () => {

    loadGuards(

        searchGuard.value,

        filterStatus.value

    );

});

// FILTER

filterStatus.addEventListener("change", () => {

    loadGuards(

        searchGuard.value,

        filterStatus.value

    );

});

// ============================================
// Activate / Suspend Guard
// ============================================

async function toggleGuardStatus(id, currentStatus) {

    try {

        const newStatus =
            currentStatus === "Active"
            ? "Suspended"
            : "Active";

        await updateDoc(doc(db, "guards", id), {

            status: newStatus

        });

        await loadGuards(

            searchGuard.value,

            filterStatus.value

        );

    }

    catch(error){

        console.error(error);

        alert(error.message);

    }

}

// ============================================
// Export Guard Report PDF
// ============================================

async function exportGuardsPDF() {

    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF("landscape");

    pdf.setFontSize(18);

    pdf.text("Y O U R I Smart Security Management Solutions", 14, 15);

    pdf.setFontSize(12);

    pdf.text("Guard Management Report", 14, 24);

    const snapshot =
        await getDocs(collection(db, "guards"));

    const rows = [];

    snapshot.forEach((docSnap) => {

        const guard = docSnap.data();

        rows.push([

            guard.employeeID,

            guard.fullName,

            guard.phone,

            guard.email,

            guard.role,

            guard.department,

            guard.siteID,

            guard.status

        ]);

    });

    pdf.autoTable({

        head: [[

            "Employee ID",

            "Full Name",

            "Phone",

            "Email",

            "Role",

            "Department",

            "Site",

            "Status"

        ]],

        body: rows,

        startY: 35,

        theme: "grid",

        styles: {

            fontSize: 9

        }

    });

    pdf.save("Y O U R I Security Solutions_Guards_Report.pdf");

}

downloadPDFBtn.addEventListener("click", () => {

    exportGuardsPDF();

});

// ============================================
// Export Guards Excel
// ============================================

async function exportGuardsExcel(){

    const snapshot =
    await getDocs(collection(db,"guards"));

    const data=[];

    snapshot.forEach(docSnap=>{

        const guard=docSnap.data();

        data.push({

            "Employee ID":guard.employeeID,

            "Full Name":guard.fullName,

            Phone:guard.phone,

            Email:guard.email,

            Role:guard.role,

            Department:guard.department,

            Site:guard.siteID,

            Status:guard.status

        });

    });

    const worksheet=
    XLSX.utils.json_to_sheet(data);

    const workbook=
    XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(

        workbook,

        worksheet,

        "Guards"

    );

    XLSX.writeFile(

        workbook,

        "Y O U R I Security Solutions_Guards_Report.xlsx"

    );

}

downloadExcelBtn.addEventListener("click",()=>{

    exportGuardsExcel();

});

function clearGuardForm(){

    fullName.value="";

    phone.value="";

    emailAddress.value="";

    role.value="Security";

    department.value="Security";

    status.value="Active";

    siteSelect.value="";

    photoPreview.removeAttribute("src");

    capturedPhotoBase64="";

    capturedFaceDescriptor=[];

    selectedGuardId=null;

}
clearGuardForm();

const clearGuardBtn =
document.getElementById("clearGuardBtn");

clearGuardBtn.addEventListener("click",()=>{

    clearGuardForm();

    generateEmployeeID();

});

const uploadPhotoBtn =
document.getElementById("uploadPhotoBtn");

const photoInput =
document.getElementById("photoInput");

uploadPhotoBtn.addEventListener("click", () => {

    photoInput.click();

});

photoInput.addEventListener("change", async () => {

    const file = photoInput.files[0];

    if (!file) return;

    try {

        const reader = new FileReader();

        reader.onload = async (e) => {

            const original = e.target.result;

            capturedPhotoBase64 =
                await resizeImage(original);

            previewPhoto(
                photoPreview,
                capturedPhotoBase64
            );

            capturedFaceDescriptor =
                await generateFaceDescriptor(
                    photoPreview
                );

            alert("Photo uploaded successfully.");

        };

        reader.readAsDataURL(file);

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

});


//--------------------------------------SITE MANAGEMENT------------------------------------------

// ============================================
// Save Site
// ============================================

saveSiteBtn.addEventListener("click", async () => {

    try {

        if (siteName.value.trim() === "") {

            alert("Enter Site Name");

            return;

        }

        if (siteAddress.value.trim() === "") {

            alert("Enter Address");

            return;

        }

        if (siteLatitude.value === "") {

            alert("Enter Latitude");

            return;

        }

        if (siteLongitude.value === "") {

            alert("Enter Longitude");

            return;

        }

        if (siteRadius.value === "") {

            alert("Enter Radius");

            return;

        }

        const siteRef = doc(collection(db, "sites"));

        await setDoc(siteRef, {

            siteId: siteRef.id,

            siteName: siteName.value.trim(),

            address: siteAddress.value.trim(),

            latitude: Number(siteLatitude.value),

            longitude: Number(siteLongitude.value),

            radius: Number(siteRadius.value),

            createdAt: serverTimestamp()

        });

        alert("Site saved successfully.");

        clearSiteForm();

        await loadSites();

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

});

function clearSiteForm() {

    selectedSiteId = null;

    siteName.value = "";

    siteAddress.value = "";

    siteLatitude.value = "";

    siteLongitude.value = "";

    siteRadius.value = "";

}

clearSiteBtn.addEventListener("click", () => {

    clearSiteForm();

});

// ============================================
// Load Sites
// ============================================

async function loadSites(searchText = "") {

    siteTableBody.innerHTML = "";

    const snapshot = await getDocs(collection(db, "sites"));

    snapshot.forEach((docSnap) => {

        const site = docSnap.data();

        const keyword = searchText.toLowerCase().trim();

        if (
            keyword &&
            !site.siteName.toLowerCase().includes(keyword) &&
            !site.address.toLowerCase().includes(keyword)
        ) {
            return;
        }

        const row = document.createElement("tr");

        row.innerHTML = `

            <td>${site.siteName}</td>

            <td>${site.address}</td>

            <td>${site.latitude}</td>

            <td>${site.longitude}</td>

            <td>${site.radius} m</td>

            <td>

                <button
                    class="edit-site-btn"
                    data-id="${site.siteId}">

                    Edit

                </button>

                <button
                    class="delete-site-btn"
                    data-id="${site.siteId}">

                    Delete

                </button>

            </td>

        `;

        row.querySelector(".edit-site-btn").addEventListener("click", () => {

            editSite(site.siteId);

        });

        row.querySelector(".delete-site-btn").addEventListener("click", () => {

            deleteSite(site.siteId);

        });

        siteTableBody.appendChild(row);

    });

}

loadSites();

searchSite.addEventListener("input", () => {

    loadSites(searchSite.value);

});

// ============================================
// Edit Site
// ============================================

async function editSite(siteId) {

    try {

        const snap = await getDoc(doc(db, "sites", siteId));

        if (!snap.exists()) {

            alert("Site not found.");

            return;

        }

        const site = snap.data();

        selectedSiteId = siteId;

        siteName.value = site.siteName;

        siteAddress.value = site.address;

        siteLatitude.value = site.latitude;

        siteLongitude.value = site.longitude;

        siteRadius.value = site.radius;

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

}

// ============================================
// Update Site
// ============================================

updateSiteBtn.addEventListener("click", async () => {

    try {

        if (!selectedSiteId) {

            alert("Select a site first.");

            return;

        }

        await updateDoc(doc(db, "sites", selectedSiteId), {

            siteName: siteName.value.trim(),

            address: siteAddress.value.trim(),

            latitude: Number(siteLatitude.value),

            longitude: Number(siteLongitude.value),

            radius: Number(siteRadius.value)

        });

        alert("Site updated successfully.");

        clearSiteForm();

        await loadSites(searchSite.value);

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

});

// ============================================
// Delete Site
// ============================================

async function deleteSite(siteId) {

    const confirmed = confirm(
        "Are you sure you want to delete this site?"
    );

    if (!confirmed) return;

    try {

        await deleteDoc(doc(db, "sites", siteId));

        alert("Site deleted successfully.");

        await loadSites(searchSite.value);

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

}

// ============================================
// LOAD SITES INTO GUARD FORM
// ============================================

async function loadGuardSiteOptions() {

    siteSelect.innerHTML =
        '<option value="">Select Site</option>';

    const snapshot =
        await getDocs(collection(db, "sites"));

    snapshot.forEach((docSnap) => {

        const site = docSnap.data();

        const option =
            document.createElement("option");

        option.value = site.siteId;

        option.textContent = site.siteName;

        option.dataset.name = site.siteName;

        siteSelect.appendChild(option);

    });

}

loadGuardSiteOptions();

// ----------------------------------CHECKPOINTS MANAGEMENT--------------------------------------------

// ============================================
// CHECKPOINT MANAGEMENT
// ============================================

const checkpointSite =
document.getElementById("checkpointSite");

const checkpointName =
document.getElementById("checkpointName");

const saveCheckpointBtn =
document.getElementById("saveCheckpointBtn");

const updateCheckpointBtn =
document.getElementById("updateCheckpointBtn");

const clearCheckpointBtn =
document.getElementById("clearCheckpointBtn");

const checkpointTableBody =
document.getElementById("checkpointTableBody");

let selectedCheckpointId = null;

// GENERATE QR CHECKPOINT
const qrModal = document.getElementById("qrModal");
const qrContainer = document.getElementById("qrContainer");
const qrCheckpointName = document.getElementById("qrCheckpointName");

const closeQrModal = document.getElementById("closeQrModal");
const downloadQrBtn = document.getElementById("downloadQrBtn");

async function loadSiteOptions() {

    checkpointSite.innerHTML =
        '<option value="">Select Site</option>';

    const snapshot =
        await getDocs(collection(db, "sites"));

    snapshot.forEach((docSnap) => {

        const site = docSnap.data();

        checkpointSite.innerHTML += `

            <option value="${site.siteId}">

                ${site.siteName}

            </option>

        `;

    });

}

await loadSiteOptions();

loadSiteOptions();

// ============================================
// SAVE CHECKPOINT
// ============================================

saveCheckpointBtn.addEventListener("click", async () => {

    try {

        if (checkpointSite.value === "") {

            alert("Select Site");

            return;

        }

        if (checkpointName.value.trim() === "") {

            alert("Enter Checkpoint Name");

            return;

        }

        const checkpointRef = doc(collection(db, "checkpoints"));

        const checkpointCode =
            "CP-" +
            Date.now().toString();

        await setDoc(checkpointRef, {

            checkpointId: checkpointRef.id,

            siteId: checkpointSite.value,

            checkpointName: checkpointName.value.trim(),

            checkpointCode,

            createdAt: serverTimestamp()

        });

        alert("Checkpoint saved successfully.");

        clearCheckpointForm();

        await loadCheckpoints();

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

});

function clearCheckpointForm() {

    selectedCheckpointId = null;

    checkpointSite.value = "";

    checkpointName.value = "";

}

clearCheckpointBtn.addEventListener("click", () => {

    clearCheckpointForm();

});

// ============================================
// LOAD CHECKPOINTS
// ============================================

async function loadCheckpoints() {

    checkpointTableBody.innerHTML = "";

    const siteSnapshot =
        await getDocs(collection(db, "sites"));

    const siteMap = {};

    siteSnapshot.forEach(docSnap => {

        const site = docSnap.data();

        siteMap[site.siteId] = site.siteName;

    });

    const checkpointSnapshot =
        await getDocs(collection(db, "checkpoints"));

    checkpointSnapshot.forEach(docSnap => {

        const cp = docSnap.data();

        const row = document.createElement("tr");

        row.innerHTML = `

            <td>${siteMap[cp.siteId] || ""}</td>

            <td>${cp.checkpointName}</td>

            <td>${cp.checkpointCode}</td>

            <td>

                <button
                    class="qr-btn"
                    data-id="${cp.checkpointId}">

                    QR

                </button>

            </td>

            <td>

                <button
                    class="edit-checkpoint-btn"
                    data-id="${cp.checkpointId}">

                    Edit

                </button>

                <button
                    class="delete-checkpoint-btn"
                    data-id="${cp.checkpointId}">

                    Delete

                </button>

            </td>

        `;

        checkpointTableBody.appendChild(row);

        // CONNECT THE BUTTONS

        row.querySelector(".edit-checkpoint-btn")
         .addEventListener("click", () => {

          editCheckpoint(cp.checkpointId);

        });

        row.querySelector(".delete-checkpoint-btn")
         .addEventListener("click", () => {

          deleteCheckpoint(cp.checkpointId);

        });

        row.querySelector(".qr-btn")
         .addEventListener("click", () => {

         generateCheckpointQR(
         cp.checkpointId
         );

        });

    });

}

loadCheckpoints();

// ============================================
// EDIT CHECKPOINT
// ============================================

async function editCheckpoint(checkpointId) {

    try {

        const snap = await getDoc(
            doc(db, "checkpoints", checkpointId)
        );

        if (!snap.exists()) {

            alert("Checkpoint not found.");

            return;

        }

        const checkpoint = snap.data();

        selectedCheckpointId = checkpointId;

        checkpointSite.value = checkpoint.siteId;

        checkpointName.value = checkpoint.checkpointName;

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

}

// ============================================
// UPDATE CHECKPOINT
// ============================================

updateCheckpointBtn.addEventListener("click", async () => {

    try {

        if (!selectedCheckpointId) {

            alert("Select a checkpoint first.");

            return;

        }

        await updateDoc(
            doc(db, "checkpoints", selectedCheckpointId),
            {

                siteId: checkpointSite.value,

                checkpointName: checkpointName.value.trim()

            }
        );

        alert("Checkpoint updated successfully.");

        clearCheckpointForm();

        await loadCheckpoints();

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

});

// ============================================
// DELETE CHECKPOINT
// ============================================

async function deleteCheckpoint(checkpointId) {

    const confirmed = confirm(
        "Delete this checkpoint?"
    );

    if (!confirmed) return;

    try {

        await deleteDoc(
            doc(db, "checkpoints", checkpointId)
        );

        alert("Checkpoint deleted successfully.");

        await loadCheckpoints();

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

}

// ============================================
// GENERATE QR CODE
// ============================================

async function generateCheckpointQR(checkpointId) {

    const snap = await getDoc(
        doc(db, "checkpoints", checkpointId)
    );

    if (!snap.exists()) return;

    const checkpoint = snap.data();

    qrCheckpointName.textContent =
        checkpoint.checkpointName;

    qrContainer.innerHTML = "";

    new QRCode(qrContainer, {

        text: checkpoint.checkpointCode,

        width: 400,

        height: 400,

         correctLevel:QRCode.CorrectLevel.H

    });

    qrModal.style.display = "flex";

}

downloadQrBtn.addEventListener("click", () => {

    const image =
        qrContainer.querySelector("img");

    if (!image) return;

    const link =
        document.createElement("a");

    link.href = image.src;

    link.download =
        "Y O U R I_CHECKPOINT_QR.png";

    link.click();

});

closeQrModal.addEventListener("click", () => {

    qrModal.style.display = "none";

});

window.addEventListener("click", (e) => {

    if (e.target === qrModal) {

        qrModal.style.display = "none";

    }

});

// ---------------------------------SHIFT MANAGEMENT---------------------------------------------------

// ============================================
// SHIFT MANAGEMENT
// ============================================

const shiftGuard = document.getElementById("shiftGuard");

const shiftType = document.getElementById("shiftType");

const shiftStart = document.getElementById("shiftStart");

const shiftEnd = document.getElementById("shiftEnd");

const graceMinutes = document.getElementById("graceMinutes");

const lunchMinutes = document.getElementById("lunchMinutes");

const patrolInterval = document.getElementById("patrolInterval");

const saveShiftBtn = document.getElementById("saveShiftBtn");

const updateShiftBtn = document.getElementById("updateShiftBtn");

const clearShiftBtn = document.getElementById("clearShiftBtn");

const searchShift = document.getElementById("searchShift");

const shiftTableBody = document.getElementById("shiftTableBody");

let selectedShiftId = null;

// ============================================
// LOAD GUARDS INTO SHIFT FORM
// ============================================

async function loadShiftGuards() {

    shiftGuard.innerHTML =
        '<option value="">Select Guard</option>';

    const snapshot =
        await getDocs(collection(db, "guards"));

    snapshot.forEach((docSnap) => {

        const guard = docSnap.data();

        const option =
            document.createElement("option");

        option.value = guard.guardId;

        option.textContent =
            `${guard.employeeID} - ${guard.fullName}`;

        option.dataset.name = guard.fullName;
        option.dataset.employee = guard.employeeID;
        option.dataset.department = guard.department;
        option.dataset.siteid = guard.siteId;
        option.dataset.sitename = guard.siteName;

        shiftGuard.appendChild(option);

    });

}

loadShiftGuards();

// ============================================
// SAVE SHIFT
// ============================================

saveShiftBtn.addEventListener("click", async () => {

    try {

        if (shiftGuard.value === "") {
            alert("Select a Guard");
            return;
        }

        if (shiftStart.value === "") {
            alert("Select Shift Start Time");
            return;
        }

        if (shiftEnd.value === "") {
            alert("Select Shift End Time");
            return;
        }

        if (getWorkingDays().length === 0) {
            alert("Select at least one working day.");
            return;
        }

        const selectedOption =
            shiftGuard.options[
                shiftGuard.selectedIndex
            ];

        const shiftRef =
            doc(collection(db, "shifts"));

        await setDoc(shiftRef, {

            shiftId: shiftRef.id,

            guardId: selectedOption.value,

            employeeID:
                selectedOption.dataset.employee,

            guardName:
                selectedOption.dataset.name,

            department:
                selectedOption.dataset.department,

            siteId:
                selectedOption.dataset.siteid,

            siteName:
                selectedOption.dataset.sitename,

            shiftType: shiftType.value,

            startTime: shiftStart.value,

            endTime: shiftEnd.value,

            graceMinutes:
                Number(graceMinutes.value),

            lunchMinutes:
                Number(lunchMinutes.value),

            patrolInterval:
                Number(patrolInterval.value),

            workingDays:
                getWorkingDays(),

            createdAt:
                serverTimestamp()

        });

        alert("Shift assigned successfully.");

        clearShiftForm();

        await loadShifts();

    }

    catch(error){

        console.error(error);

        alert(error.message);

    }

});

// ============================================
// CLEAR SHIFT FORM
// ============================================

function clearShiftForm(){

    selectedShiftId = null;

    shiftGuard.value="";

    shiftType.value="Day";

    shiftStart.value="";

    shiftEnd.value="";

    graceMinutes.value=10;

    lunchMinutes.value=60;

    patrolInterval.value=60;

    document
    .querySelectorAll(".working-days input")
    .forEach(box=>{

        box.checked=false;

    });

}

clearShiftBtn.addEventListener("click", () => {

    clearShiftForm();

    document
 .querySelectorAll(".working-days input")
 .forEach(box=>{

    box.checked=false;

 });

});

// ============================================
// LOAD SHIFTS
// ============================================

async function loadShifts(searchText = "") {

    shiftTableBody.innerHTML = "";

    const snapshot = await getDocs(collection(db, "shifts"));

    snapshot.forEach((docSnap) => {

        const shift = docSnap.data();

        const keyword = searchText
            .toLowerCase()
            .trim();

        if (
            keyword &&
            !shift.guardName.toLowerCase().includes(keyword) &&
            !shift.employeeID.toLowerCase().includes(keyword)
        ) {
            return;
        }

        const row = document.createElement("tr");

       row.innerHTML = `

            <td>${shift.employeeID} - ${shift.guardName}</td>

            <td>${shift.shiftType}</td>

            <td>${shift.startTime}</td>

            <td>${shift.endTime}</td>

            <td>${shift.graceMinutes} min</td>

            <td>${shift.lunchMinutes} min</td>

            <td>${shift.patrolInterval} min</td>

            <td>${(shift.workingDays || []).join(", ")}</td>

            <td>

                <button
                 class="edit-shift-btn"
                 data-id="${shift.shiftId}">
                  Edit
                </button>

                 <button
                   class="delete-shift-btn"
                    data-id="${shift.shiftId}">
                    Delete
                    </button>

            </td>

        `;

        row.querySelector(".edit-shift-btn")
        .addEventListener("click", () => {

            editShift(shift.shiftId);

        });

        row.querySelector(".delete-shift-btn")
        .addEventListener("click", () => {

            deleteShift(shift.shiftId);

        });

        shiftTableBody.appendChild(row);

    });

}

loadShifts();

searchShift.addEventListener("input", () => {

    loadShifts(searchShift.value);

});

// ============================================
// EDIT SHIFT
// ============================================

async function editShift(shiftId) {

    try {

        const snap = await getDoc(
            doc(db, "shifts", shiftId)
        );

        if (!snap.exists()) {

            alert("Shift not found.");

            return;

        }

        const shift = snap.data();

        selectedShiftId = shiftId;

        shiftGuard.value = shift.guardId;

        shiftType.value = shift.shiftType;

        shiftStart.value = shift.startTime;

        shiftEnd.value = shift.endTime;

        graceMinutes.value = shift.graceMinutes;

        lunchMinutes.value = shift.lunchMinutes;

        patrolInterval.value = shift.patrolInterval;

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

    document
 .querySelectorAll(".working-days input")
 .forEach(box=>{

    box.checked =
        (shift.workingDays || [])
        .includes(box.value);

 });

}

// ============================================
// UPDATE SHIFT
// ============================================

updateShiftBtn.addEventListener("click", async () => {

    try {

        if (!selectedShiftId) {
            alert("Select a shift first.");
            return;
        }

        if (getWorkingDays().length === 0) {
            alert("Select at least one working day.");
            return;
        }

        const selectedOption =
            shiftGuard.options[
                shiftGuard.selectedIndex
            ];

        await updateDoc(
            doc(db,"shifts",selectedShiftId),
            {

                guardId:
                    selectedOption.value,

                employeeID:
                    selectedOption.dataset.employee,

                guardName:
                    selectedOption.dataset.name,

                department:
                    selectedOption.dataset.department,

                siteId:
                    selectedOption.dataset.siteid,

                siteName:
                    selectedOption.dataset.sitename,

                shiftType:
                    shiftType.value,

                startTime:
                    shiftStart.value,

                endTime:
                    shiftEnd.value,

                graceMinutes:
                    Number(graceMinutes.value),

                lunchMinutes:
                    Number(lunchMinutes.value),

                patrolInterval:
                    Number(patrolInterval.value),

                workingDays:
                    getWorkingDays()

            }

        );

        alert("Shift updated successfully.");

        clearShiftForm();

        await loadShifts(searchShift.value);

    }

    catch(error){

        console.error(error);

        alert(error.message);

    }

});

// ============================================
// DELETE SHIFT
// ============================================

async function deleteShift(shiftId) {

    const confirmed = confirm(
        "Delete this shift assignment?"
    );

    if (!confirmed) return;

    try {

        await deleteDoc(
            doc(db, "shifts", shiftId)
        );

        alert("Shift deleted successfully.");

        await loadShifts(searchShift.value);

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

}

function getWorkingDays(){

    return [...document.querySelectorAll(".working-days input:checked")]

        .map(day => day.value);

}

// -------------------------------------------PATROL MANAGEMENT---------------------------------------------

// ======================================================
// PATROL MANAGEMENT
// ======================================================

const patrolTableBody =
document.getElementById("patrolTableBody");

const patrolSearch =
document.getElementById("patrolSearch");

const patrolSiteFilter =
document.getElementById("patrolSiteFilter");

const patrolDateFilter =
document.getElementById("patrolDateFilter");

const clearPatrolFilter =
document.getElementById("clearPatrolFilter");

const totalPatrols =
document.getElementById("totalPatrols");

const guardsOnPatrol =
document.getElementById("guardsOnPatrol");

const sitesCovered =
document.getElementById("sitesCovered");

const checkpointsScanned =
document.getElementById("checkpointsScanned");

let patrolData = [];

// ======================================================
// LOAD PATROLS
// ======================================================

function loadPatrols(){

    const q = query(

        collection(db,"patrols"),

        orderBy("scanTime","desc")

    );

    onSnapshot(q,(snapshot)=>{

        patrolData = [];

        snapshot.forEach(docSnap=>{

            patrolData.push({

                id:docSnap.id,

                ...docSnap.data()

            });

        });

        loadPatrolStatistics();

        populateSiteFilter();

        renderPatrolTable(patrolData);

    });

}

loadPatrols();

// ======================================================
// LOAD STATISTICS
// ======================================================


// ======================================================
// SITE FILTER
// ======================================================

function populateSiteFilter(){

    patrolSiteFilter.innerHTML =
    `<option value="">All Sites</option>`;

    const sites = [

        ...new Set(

            patrolData.map(

                p=>p.siteName

            )

        )

    ];

    sites.forEach(site=>{

        patrolSiteFilter.innerHTML += `

            <option value="${site}">

                ${site}

            </option>

        `;

    });

}

// ======================================================
// SEARCH & FILTER
// ======================================================

patrolSearch.addEventListener("input", filterPatrols);

patrolSiteFilter.addEventListener("change", filterPatrols);

patrolDateFilter.addEventListener("change", filterPatrols);

clearPatrolFilter.addEventListener("click",()=>{

    patrolSearch.value="";

    patrolSiteFilter.value="";

    patrolDateFilter.value="";

    renderPatrolTable(patrolData);

    loadPatrolStatistics();

});

function filterPatrols(){

    let filtered = [...patrolData];

    const search =
    patrolSearch.value.toLowerCase();

    const site =
    patrolSiteFilter.value;

    const date =
    patrolDateFilter.value;

    if(search){

        filtered = filtered.filter(p =>

            (p.guardName || "")
            .toLowerCase()
            .includes(search)

        );

    }

    if(site){

        filtered = filtered.filter(

            p => p.siteName === site

        );

    }

    if(date){

        filtered = filtered.filter(p=>{

            if(!p.scanTime) return false;

            return p.scanTime
                .toDate()
                .toISOString()
                .slice(0,10) === date;

        });

    }

    renderPatrolTable(filtered);

}

// ======================================================
// PATROL TABLE
// ======================================================

function renderPatrolTable(data){

    patrolTableBody.innerHTML = "";

    data.forEach(patrol=>{

        const row =
        document.createElement("tr");

        row.innerHTML = `

            <td>

                ${patrol.guardName || "-"}

            </td>

            <td>

                ${patrol.employeeID || "-"}

            </td>

            <td>

                ${patrol.siteName || "-"}

            </td>

            <td>

                ${patrol.checkpointName || "-"}

            </td>

            <td>

                ${
                    patrol.scanTime
                    ? patrol.scanTime.toDate().toLocaleString()
                    : "-"
                }

            </td>

            <td>

                <button
                class="view-patrol-btn">

                    View

                </button>

            </td>

        `;

        row.querySelector(".view-patrol-btn")
        .addEventListener("click",()=>{

            viewPatrol(
                patrol.id
            );

        });

        patrolTableBody.appendChild(row);

    });

}

// ======================================================
// PATROL DETAILS MODAL
// ======================================================

const patrolModal =
document.getElementById("patrolModal");

const patrolDetails =
document.getElementById("patrolDetails");

const closePatrolModal =
document.getElementById("closePatrolModal");

function viewPatrol(id){

    const patrol = patrolData.find(

        p => p.id === id

    );

    if(!patrol) return;

    patrolDetails.innerHTML = `

        <table class="details-table">

            <tr>

                <th>Guard</th>

                <td>${patrol.guardName}</td>

            </tr>

            <tr>

                <th>Employee ID</th>

                <td>${patrol.employeeID}</td>

            </tr>

            <tr>

                <th>Site</th>

                <td>${patrol.siteName}</td>

            </tr>

            <tr>

                <th>Checkpoint</th>

                <td>${patrol.checkpointName}</td>

            </tr>

            <tr>

                <th>Checkpoint Code</th>

                <td>${patrol.checkpointCode}</td>

            </tr>

            <tr>

                <th>Latitude</th>

                <td>${patrol.latitude}</td>

            </tr>

            <tr>

                <th>Longitude</th>

                <td>${patrol.longitude}</td>

            </tr>

            <tr>

                <th>Scan Time</th>

                <td>

                    ${
                        patrol.scanTime
                        ? patrol.scanTime.toDate().toLocaleString()
                        : "-"
                    }

                </td>

            </tr>

        </table>

    `;

    patrolModal.style.display = "flex";

}

closePatrolModal.addEventListener("click",()=>{

    patrolModal.style.display="none";

});

window.addEventListener("click",(e)=>{

    if(e.target===patrolModal){

        patrolModal.style.display="none";

    }

});

// ======================================================
// EXPORT PATROLS TO EXCEL
// ======================================================

const exportPatrolExcel =
document.getElementById("exportPatrolExcel");

exportPatrolExcel.addEventListener(
    "click",
    exportPatrolsExcel
);

function exportPatrolsExcel(){

    const rows = [];

    patrolData.forEach(patrol=>{

        rows.push({

            Date:
            patrol.scanTime
            ? patrol.scanTime.toDate().toLocaleDateString()
            : "",

            Time:
            patrol.scanTime
            ? patrol.scanTime.toDate().toLocaleTimeString()
            : "",

            Guard:
            patrol.guardName,

            EmployeeID:
            patrol.employeeID,

            Site:
            patrol.siteName,

            Checkpoint:
            patrol.checkpointName,

            CheckpointCode:
            patrol.checkpointCode,

            Latitude:
            patrol.latitude,

            Longitude:
            patrol.longitude

        });

    });

    const worksheet =
    XLSX.utils.json_to_sheet(rows);

    const workbook =
    XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(

        workbook,

        worksheet,

        "Patrols"

    );

    XLSX.writeFile(

        workbook,

        "Patrol_Report.xlsx"

    );

}

// ======================================================
// EXPORT PATROL REPORT PDF
// ======================================================

const exportPatrolPDF =
document.getElementById("exportPatrolPDF");

exportPatrolPDF.addEventListener(

    "click",

    exportPatrolsPDF

);

function exportPatrolsPDF(){

    const { jsPDF } = window.jspdf;

    const pdf =
    new jsPDF();

    pdf.setFontSize(18);

    pdf.text(

        "Y O U R I SECURITY SOLUTIONS",

        14,

        18

    );

    pdf.setFontSize(12);

    pdf.text(

        "Patrol Report",

        14,

        28

    );

    pdf.autoTable({

        head:[[

            "Date",

            "Time",

            "Guard",

            "Employee ID",

            "Site",

            "Checkpoint"

        ]],

        body:

        patrolData.map(p=>[

            p.scanTime
            ? p.scanTime.toDate().toLocaleDateString()
            : "",

            p.scanTime
            ? p.scanTime.toDate().toLocaleTimeString()
            : "",

            p.guardName,

            p.employeeID,

            p.siteName,

            p.checkpointName

        ])

    });

    pdf.save(

        "Patrol_Report.pdf"

    );

}

function loadPatrolStatistics(){

    totalPatrols.textContent =
    patrolData.length;

    const guards = new Set();
    const sites = new Set();

    let today = 0;

    const todayDate =
    new Date().toISOString().slice(0,10);

    patrolData.forEach(patrol=>{

        guards.add(patrol.guardId);

        sites.add(patrol.siteName);

        if(patrol.scanTime){

            if(

                patrol.scanTime
                .toDate()
                .toISOString()
                .slice(0,10)

                ===

                todayDate

            ){

                today++;

            }

        }

    });

    guardsOnPatrol.textContent =
    guards.size;

    sitesCovered.textContent =
    sites.size;

    todayPatrols.textContent =
    today;

}

// -----------------------------------VISITOR MANAGEMENT-------------------------------------------------------

const visitorTableBodyAdmin =
document.getElementById("visitorTableBodyAdmin");

const visitorSearch =
document.getElementById("visitorSearch");

const visitorSiteFilter =
document.getElementById("visitorSiteFilter");

const visitorStatusFilter =
document.getElementById("visitorStatusFilter");

const visitorDateFilter =
document.getElementById("visitorDateFilter");

const clearVisitorFilter =
document.getElementById("clearVisitorFilter");

const totalVisitors =
document.getElementById("totalVisitors");

const visitorsInside =
document.getElementById("visitorsInside");

const checkedOutVisitors =
document.getElementById("checkedOutVisitors");

const companiesVisited =
document.getElementById("companiesVisited");

const visitorModal =
document.getElementById("visitorModal");

const visitorDetails =
document.getElementById("visitorDetails");

const closeVisitorModal =
document.getElementById("closeVisitorModal");

let visitorData = [];

const exportVisitorExcel =
document.getElementById("exportVisitorExcel");

const exportVisitorPDF =
document.getElementById("exportVisitorPDF");

visitorSearch.addEventListener("input",filterVisitors);

visitorSiteFilter.addEventListener("change",filterVisitors);

visitorStatusFilter.addEventListener("change",filterVisitors);

visitorDateFilter.addEventListener("change",filterVisitors);

clearVisitorFilter.addEventListener("click",()=>{

    visitorSearch.value="";

    visitorSiteFilter.value="";

    visitorStatusFilter.value="";

    visitorDateFilter.value="";

    renderVisitorTable(visitorData);

    loadVisitorStatistics(visitorData);

});

function loadVisitors(){

    const q = query(

        collection(db,"visitors"),

        orderBy("createdAt","desc")

    );

    onSnapshot(q,(snapshot)=>{

        visitorData = [];

        snapshot.forEach(doc=>{

            visitorData.push({

                id: doc.id,

                ...doc.data()

            });

        });

        populateVisitorSiteFilter();

        renderVisitorTable(visitorData);

        loadVisitorStatistics(visitorData);

    });

}

loadVisitors();

function loadVisitorStatistics(data){

    totalVisitors.textContent =
        data.length;

    visitorsInside.textContent =

        data.filter(v=>

            v.status==="Inside"

        ).length;

    checkedOutVisitors.textContent =

        data.filter(v=>

            v.status==="Checked Out"

        ).length;

    companiesVisited.textContent =

        new Set(

            data.map(v=>v.company)

        ).size;

}

function populateVisitorSiteFilter(){

    visitorSiteFilter.innerHTML =

        `<option value="">All Sites</option>`;

    const sites =

        [...new Set(

            visitorData.map(v=>v.siteName)

        )];

    sites.forEach(site=>{

        visitorSiteFilter.innerHTML += `

            <option value="${site}">

                ${site}

            </option>

        `;

    });

}

function renderVisitorTable(data){

    visitorTableBodyAdmin.innerHTML = "";

    data.forEach(visitor=>{

        const checkIn =

            visitor.checkInTime
            ? visitor.checkInTime
                .toDate()
                .toLocaleString()
            : "-";

        let statusClass = "secondary";

        if(visitor.status==="Inside"){

            statusClass="active";

        }

        else if(visitor.status==="Checked Out"){

            statusClass="warning";

        }

        visitorTableBodyAdmin.innerHTML += `

        <tr onclick="viewVisitor('${visitor.id}')">

            <td>

                <img

                    src="${visitor.photoBase64}"

                    class="visitor-thumb"

                >

            </td>

            <td>

                ${visitor.fullName}

            </td>

            <td>

                ${visitor.company || "-"}

            </td>

            <td>

                ${visitor.hostName || "-"}

            </td>

            <td>

                ${visitor.siteName || "-"}

            </td>

            <td>

                ${checkIn}

            </td>

            <td>

                <span class="status ${statusClass}">

                    ${visitor.status}

                </span>

            </td>

        </tr>

        `;

    });

}

function viewVisitor(id){

    const visitor = visitorData.find(

        v => v.id === id

    );

    if(!visitor) return;

    visitorDetails.innerHTML = `

        <div class="visitor-details">

            <div class="visitor-photo-large">

                <img
                    src="${visitor.photoBase64}"
                    alt="Visitor Photo"
                >

            </div>

            <table class="details-table">

                <tr>
                    <th>Name</th>
                    <td>${visitor.fullName}</td>
                </tr>

                <tr>
                    <th>ID / Passport</th>
                    <td>${visitor.idNumber || "-"}</td>
                </tr>

                <tr>
                    <th>Phone</th>
                    <td>${visitor.phone || "-"}</td>
                </tr>

                <tr>
                    <th>Company</th>
                    <td>${visitor.company || "-"}</td>
                </tr>

                <tr>
                    <th>Purpose</th>
                    <td>${visitor.purpose || "-"}</td>
                </tr>

                <tr>
                    <th>Host</th>
                    <td>${visitor.hostName || "-"}</td>
                </tr>

                <tr>
                    <th>Host Employee ID</th>
                    <td>${visitor.hostEmployeeID || "-"}</td>
                </tr>

                <tr>
                    <th>Vehicle</th>
                    <td>${visitor.vehicleRegistration || "-"}</td>
                </tr>

                <tr>
                    <th>Badge</th>
                    <td>${visitor.badgeNumber || "-"}</td>
                </tr>

                <tr>
                    <th>Site</th>
                    <td>${visitor.siteName || "-"}</td>
                </tr>

                <tr>
                    <th>Registered By</th>
                    <td>${visitor.guardName || "-"}</td>
                </tr>

                <tr>
                    <th>Check In</th>
                    <td>${
                        visitor.checkInTime
                        ? visitor.checkInTime.toDate().toLocaleString()
                        : "-"
                    }</td>
                </tr>

                <tr>
                    <th>Check Out</th>
                    <td>${
                        visitor.checkOutTime
                        ? visitor.checkOutTime.toDate().toLocaleString()
                        : "-"
                    }</td>
                </tr>

                <tr>
                    <th>Status</th>
                    <td>${visitor.status}</td>
                </tr>

                <tr>
                    <th>Notes</th>
                    <td>${visitor.notes || "-"}</td>
                </tr>

            </table>

        </div>

    `;

    visitorModal.style.display = "block";

}

closeVisitorModal.addEventListener("click",()=>{

    visitorModal.style.display = "none";

});

window.addEventListener("click",(event)=>{

    if(event.target===visitorModal){

        visitorModal.style.display="none";

    }

});

function filterVisitors(){

    let filtered = [...visitorData];

    const search =
        visitorSearch.value
        .toLowerCase()
        .trim();

    const site =
        visitorSiteFilter.value;

    const status =
        visitorStatusFilter.value;

    const date =
        visitorDateFilter.value;

    if(search){

        filtered = filtered.filter(v=>

            (v.fullName || "")
            .toLowerCase()
            .includes(search)

            ||

            (v.company || "")
            .toLowerCase()
            .includes(search)

            ||

            (v.hostName || "")
            .toLowerCase()
            .includes(search)

            ||

            (v.idNumber || "")
            .toLowerCase()
            .includes(search)

        );

    }

    if(site){

        filtered = filtered.filter(v=>

            v.siteName===site

        );

    }

    if(status){

        filtered = filtered.filter(v=>

            v.status===status

        );

    }

    if(date){

        filtered = filtered.filter(v=>{

            if(!v.createdAt) return false;

            return v.createdAt
                .toDate()
                .toISOString()
                .slice(0,10)===date;

        });

    }

    renderVisitorTable(filtered);

    loadVisitorStatistics(filtered);

}

exportVisitorExcel.addEventListener(
    "click",
    exportVisitorsExcel
);

function exportVisitorsExcel(){

    const table =
        document.querySelector(
            "#visitors table"
        );

    const workbook =
        XLSX.utils.table_to_book(
            table,
            {
                sheet:"Visitors"
            }
        );

    const today =
        new Date()
        .toISOString()
        .slice(0,10);

    XLSX.writeFile(

        workbook,

        `Visitors_${today}.xlsx`

    );

}

exportVisitorPDF.addEventListener(
    "click",
    exportVisitorsPDF
);

async function exportVisitorsPDF(){

    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF();

    pdf.setFontSize(18);

    pdf.text(
        "Y O U R I SECURITY SOLUTIONS",
        14,
        15
    );

    pdf.setFontSize(12);

    pdf.text(
        "Visitor Management Report",
        14,
        25
    );

    pdf.text(
        "Generated: " +
        new Date().toLocaleString(),
        14,
        33
    );

    const rows = [];

    visitorData.forEach(visitor=>{

        rows.push([

            visitor.fullName || "-",

            visitor.company || "-",

            visitor.hostName || "-",

            visitor.siteName || "-",

            visitor.checkInTime
            ? visitor.checkInTime
                .toDate()
                .toLocaleString()
            : "-",

            visitor.checkOutTime
            ? visitor.checkOutTime
                .toDate()
                .toLocaleString()
            : "-",

            visitor.status || "-"

        ]);

    });

    pdf.autoTable({

        startY:40,

        head:[[
            "Visitor",
            "Company",
            "Host",
            "Site",
            "Check In",
            "Check Out",
            "Status"
        ]],

        body:rows

    });

    pdf.save("Visitor_Report.pdf");

}

// -------------------------------------INCIDENT MANAGEMENT----------------------------------------------------

// =====================================
// INCIDENT MANAGEMENT
// =====================================

const incidentTableBody =
document.getElementById("incidentTableBody");

const totalIncidents =
document.getElementById("totalIncidents");

const openIncidents =
document.getElementById("openIncidents");

const resolvedIncidents =
document.getElementById("resolvedIncidents");

const criticalIncidents =
document.getElementById("criticalIncidents");

const incidentModal =
document.getElementById("incidentModal");

const incidentDetails =
document.getElementById("incidentDetails");

const closeIncidentModal =
document.getElementById("closeIncidentModal");

const incidentSearch =
document.getElementById("incidentSearch");

const incidentSiteFilter =
document.getElementById("incidentSiteFilter");

const incidentGuardFilter =
document.getElementById("incidentGuardFilter");

const incidentStatusFilter =
document.getElementById("incidentStatusFilter");

const incidentDateFilter =
document.getElementById("incidentDateFilter");

let incidentData = [];

function loadIncidents(){

    onSnapshot(

        collection(db,"incidents"),

        snapshot=>{

            incidentData=[];

            snapshot.forEach(doc=>{

                incidentData.push({

                    id:doc.id,

                    ...doc.data()

                });

            });

            updateIncidentStats();

            populateIncidentFilters();

            renderIncidentTable();

        }

    );

}

function updateIncidentStats(){

    totalIncidents.textContent =
        incidentData.length;

    openIncidents.textContent =
        incidentData.filter(

            incident=>incident.status==="Open"

        ).length;

    resolvedIncidents.textContent =
        incidentData.filter(

            incident=>incident.status==="Resolved"

        ).length;

    criticalIncidents.textContent =
        incidentData.filter(

            incident=>incident.priority==="Critical"

        ).length;

}

function renderIncidentTable(){

    if(!incidentTableBody) return;

    incidentTableBody.innerHTML = "";

    const search =
        (incidentSearch?.value || "")
        .toLowerCase();

    const site =
        incidentSiteFilter?.value || "";

    const guard =
        incidentGuardFilter?.value || "";

    const status =
        incidentStatusFilter?.value || "";

    const date =
        incidentDateFilter?.value || "";

    const filtered = incidentData.filter(incident=>{

        const incidentNumber =
            (incident.incidentNumber || "")
            .toLowerCase();

        const guardName =
            (incident.guardName || "")
            .toLowerCase();

        const siteName =
            (incident.siteName || "")
            .toLowerCase();

        const incidentStatus =
            incident.status || "";

        const incidentDate =
            incident.date || "";

        const matchesSearch =

            incidentNumber.includes(search) ||

            guardName.includes(search) ||

            siteName.includes(search);

        const matchesSite =
            !site ||
            incident.siteName===site;

        const matchesGuard =
            !guard ||
            incident.guardName===guard;

        const matchesStatus =
            !status ||
            incidentStatus===status;

        const matchesDate =
            !date ||
            incidentDate===date;

        return (
            matchesSearch &&
            matchesSite &&
            matchesGuard &&
            matchesStatus &&
            matchesDate
        );

    });

    filtered.forEach(incident=>{

        const priority =
            incident.priority || "Normal";

        const status =
            incident.status || "Open";

        const priorityClass =
            priority.toLowerCase();

        const statusClass =
            status.toLowerCase();

        incidentTableBody.innerHTML += `

        <tr>

            <td>${incident.incidentNumber || "-"}</td>

            <td>${incident.date || "-"}</td>

            <td>${incident.guardName || "-"}</td>

            <td>${incident.siteName || "-"}</td>

            <td>${incident.incidentType || "-"}</td>

            <td>

                <span class="priority ${priorityClass}">

                    ${priority}

                </span>

            </td>

            <td>

                <span class="status ${statusClass}">

                    ${status}

                </span>

            </td>

            <td>

                <button
                    onclick="viewIncident('${incident.id}')">

                    View

                </button>

            </td>

        </tr>

        `;

    });

}
loadIncidents();

window.viewIncident = async function(id){

    const snap =
        await getDoc(doc(db,"incidents",id));

    if(!snap.exists()) return;

    const incident =
        snap.data();

    let photos="";

    if(incident.photosBase64){

        incident.photosBase64.forEach(photo=>{

            photos +=`

            <img

                src="${photo}"

                class="incident-photo"

            >

            `;

        });

    }

    const resolvedTime =

        incident.resolvedAt

        ?

        incident.resolvedAt

            .toDate()

            .toLocaleString()

        :

        "-";

    incidentDetails.innerHTML=`

        <h2>${incident.incidentNumber}</h2>

        <hr>

        <p>

        <strong>Status:</strong>

       <span class="status ${(incident.status || "Open").toLowerCase()}">

        ${incident.status}

        </span>

        </p>

        <p>

        <strong>Priority:</strong>

        <span class="priority ${(incident.priority || "Normal").toLowerCase()}">

        ${incident.priority}

        </span>

        </p>

        <p><strong>Type:</strong> ${incident.incidentType}</p>

        <p><strong>Date:</strong> ${incident.date}</p>

        <p><strong>Time:</strong> ${incident.time}</p>

        <hr>

        <p><strong>Guard:</strong> ${incident.guardName}</p>

        <p><strong>Employee ID:</strong> ${incident.employeeID}</p>

        <p><strong>Department:</strong> ${incident.department}</p>

        <p><strong>Site:</strong> ${incident.siteName}</p>

        <hr>

        <p><strong>Location:</strong></p>

        <p>${incident.location}</p>

        <p><strong>Description:</strong></p>

        <p>${incident.description}</p>

        <p><strong>Witnesses:</strong></p>

        <p>${incident.witnesses||"-"}</p>

        <p><strong>Actions Taken:</strong></p>

        <p>${incident.actionsTaken||"-"}</p>

        <hr>

        <h3>Evidence</h3>

        ${photos}

        <hr>

        <p>

        <strong>Resolution Notes:</strong>

        </p>

        <textarea

        id="resolutionNotes"

        >${incident.resolutionNotes||""}</textarea>

        <br><br>

        <p>

        <strong>Resolved Time:</strong>

        ${resolvedTime}

        </p>

        <p>

        <strong>Resolved By:</strong>

        ${incident.resolvedBy||"-"}

        </p>

        <br>

        ${

        incident.status==="Open"

        ?

        `<button onclick="resolveIncident('${id}')">

        Resolve Incident

        </button>`

        :

        ""

        }

    `;

    incidentModal.style.display="flex";

}
window.resolveIncident = async function(id){

    const notes =
        document
        .getElementById("resolutionNotes")
        .value
        .trim();

    if(notes===""){

        alert("Enter resolution notes.");

        return;

    }

    await updateDoc(

        doc(db,"incidents",id),

        {

            status:"Resolved",

            resolutionNotes:notes,

            resolvedAt:serverTimestamp(),

            resolvedBy:"Administrator"

        }

    );

    alert("Incident Resolved.");

    incidentModal.style.display="none";

}
closeIncidentModal.addEventListener("click",()=>{

    incidentModal.style.display = "none";

});

window.addEventListener("click", (event)=>{

    if(event.target===incidentModal){

        incidentModal.style.display = "none";

    }

});

function populateIncidentFilters(){

    if(
        !incidentSiteFilter ||
        !incidentGuardFilter
    ){
        return;
    }

    const sites = [

        ...new Set(

            incidentData
            .map(i=>i.siteName)
            .filter(Boolean)

        )

    ];

    const guards = [

        ...new Set(

            incidentData
            .map(i=>i.guardName)
            .filter(Boolean)

        )

    ];

    incidentSiteFilter.innerHTML =
        '<option value="">All Sites</option>';

    sites.forEach(site=>{

        incidentSiteFilter.innerHTML +=

        `<option value="${site}">${site}</option>`;

    });

    incidentGuardFilter.innerHTML =
        '<option value="">All Guards</option>';

    guards.forEach(guard=>{

        incidentGuardFilter.innerHTML +=

        `<option value="${guard}">${guard}</option>`;

    });

}

incidentSearch?.addEventListener(
    "input",
    renderIncidentTable
);

incidentSiteFilter?.addEventListener(
    "change",
    renderIncidentTable
);

incidentGuardFilter?.addEventListener(
    "change",
    renderIncidentTable
);

incidentStatusFilter?.addEventListener(
    "change",
    renderIncidentTable
);

incidentDateFilter?.addEventListener(
    "change",
    renderIncidentTable
);

// --------------------------------PANIC MANAGEMENT------------------------------------------------------------

// =====================================
// PANIC MANAGEMENT
// =====================================

const panicTableBody =
document.getElementById("panicTableBody");

const totalPanics =
document.getElementById("totalPanics");

const activePanics =
document.getElementById("activePanics");

const ackPanics =
document.getElementById("ackPanics");

const resolvedPanics =
document.getElementById("resolvedPanics");

const panicModal =
document.getElementById("panicModal");

const panicDetails =
document.getElementById("panicDetails");

const closePanicModal =
document.getElementById("closePanicModal");

const panicSearch =
document.getElementById("panicSearch");

const panicSiteFilter =
document.getElementById("panicSiteFilter");

const panicGuardFilter =
document.getElementById("panicGuardFilter");

const panicStatusFilter =
document.getElementById("panicStatusFilter");

const panicDateFilter =
document.getElementById("panicDateFilter");

let panicData = [];

function loadPanics(){

    if(
        !panicTableBody ||
        !totalPanics
    ) return;

    onSnapshot(

        collection(db,"panicAlerts"),

        snapshot=>{

            panicData=[];

            snapshot.forEach(doc=>{

                panicData.push({

                    id:doc.id,

                    ...doc.data()

                });

            });

            updatePanicStats();

            populatePanicFilters();

            renderPanicTable();

        }

    );

}

function updatePanicStats(){

    totalPanics.textContent =
        panicData.length;

    activePanics.textContent =
        panicData.filter(

            p=>p.status==="Active"

        ).length;

    ackPanics.textContent =
        panicData.filter(

            p=>p.status==="Acknowledged"

        ).length;

    resolvedPanics.textContent =
        panicData.filter(

            p=>p.status==="Resolved"

        ).length;

}

function renderPanicTable(){

    if(!panicTableBody) return;

    panicTableBody.innerHTML="";

    const search =
        panicSearch
        ? panicSearch.value.toLowerCase()
        : "";

    const site =
        panicSiteFilter
        ? panicSiteFilter.value
        : "";

    const guard =
        panicGuardFilter
        ? panicGuardFilter.value
        : "";

    const status =
        panicStatusFilter
        ? panicStatusFilter.value
        : "";

    const date =
        panicDateFilter
        ? panicDateFilter.value
        : "";

    const filtered = panicData.filter(alert=>{

        const number =
            (alert.panicId || "")
            .toLowerCase();

        const guardName =
            (alert.guardName || "")
            .toLowerCase();

        const siteName =
            (alert.siteName || "")
            .toLowerCase();

        const matchesSearch =

            number.includes(search)

            ||

            guardName.includes(search)

            ||

            siteName.includes(search);

        const matchesSite =
            !site ||
            alert.siteName===site;

        const matchesGuard =
            !guard ||
            alert.guardName===guard;

        const matchesStatus =
            !status ||
            alert.status===status;

        const matchesDate =
            !date ||
            alert.date===date;

        return (

            matchesSearch &&

            matchesSite &&

            matchesGuard &&

            matchesStatus &&

            matchesDate

        );

    });

    filtered.forEach(alert=>{

        const statusClass =
            (alert.status || "")
            .toLowerCase();

        panicTableBody.innerHTML +=`

        <tr>

            <td>${alert.time || "-"}</td>

            <td>${alert.guardName || "-"}</td>

            <td>${alert.siteName || "-"}</td>

            <td>

                <span class="status ${statusClass}">

                    ${alert.status}

                </span>

            </td>

            <td>

                <button
                onclick="viewPanic('${alert.id}')">

                    View

                </button>

            </td>

        </tr>

        `;

    });

}

window.viewPanic = async function(id){

    const snap =
        await getDoc(
            doc(db,"panicAlerts",id)
        );

    if(!snap.exists()) return;

    const panic =
        snap.data();

    const photo =

        panic.photoBase64

        ?

        `<img
            src="${panic.photoBase64}"
            class="panic-photo">`

        :

        "<p>No Photo</p>";

    const acknowledged =

        panic.acknowledgedAt

        ?

        panic.acknowledgedAt
            .toDate()
            .toLocaleString()

        :

        "-";

    const resolved =

        panic.resolvedAt

        ?

        panic.resolvedAt
            .toDate()
            .toLocaleString()

        :

        "-";

    panicDetails.innerHTML=`

        <h2>Panic Alert</h2>

        <hr>

        <p>

        <strong>Status:</strong>

        <span class="status ${(panic.status||"").toLowerCase()}">

        ${panic.status}

        </span>

        </p>

        <p><strong>Guard:</strong> ${panic.guardName}</p>

        <p><strong>Employee:</strong> ${panic.employeeID}</p>

        <p><strong>Department:</strong> ${panic.department}</p>

        <p><strong>Site:</strong> ${panic.siteName}</p>

        <p><strong>Date:</strong> ${panic.date}</p>

        <p><strong>Time:</strong> ${panic.time}</p>

        <hr>

        <p><strong>Reason</strong></p>

        <p>${panic.reason || "-"}</p>

        <hr>

        <p><strong>GPS</strong></p>

        <p>

        Latitude :

        ${panic.latitude}

        <br>

        Longitude :

        ${panic.longitude}

        </p>

        <hr>

        ${photo}

        <hr>

        <p>

        <strong>Acknowledged:</strong>

        ${acknowledged}

        </p>

        <p>

        <strong>Acknowledged By:</strong>

        ${panic.acknowledgedBy || "-"}

        </p>

        <hr>

        <p>

        <strong>Resolved:</strong>

        ${resolved}

        </p>

        <p>

        <strong>Resolved By:</strong>

        ${panic.resolvedBy || "-"}

        </p>

        <textarea

            id="panicResolution"

            placeholder="Resolution Notes"

        >${panic.resolutionNotes || ""}</textarea>

        <br><br>

        ${

            panic.status==="Active"

            ?

            `<button onclick="acknowledgePanic('${id}')">

                Acknowledge

            </button>`

            :

            ""

        }

        ${

            panic.status!=="Resolved"

            ?

            `<button onclick="resolvePanic('${id}')">

                Resolve

            </button>`

            :

            ""

        }

    `;

    panicModal.style.display="flex";

}

window.acknowledgePanic = async function(id){

    await updateDoc(

        doc(db,"panicAlerts",id),

        {

            status:"Acknowledged",

            acknowledgedAt:
                serverTimestamp(),

            acknowledgedBy:
                "Administrator"

        }

    );

}

window.resolvePanic = async function(id){

    const notes =

        document
        .getElementById("panicResolution")
        .value
        .trim();

    await updateDoc(

        doc(db,"panicAlerts",id),

        {

            status:"Resolved",

            resolutionNotes:
                notes,

            resolvedAt:
                serverTimestamp(),

            resolvedBy:
                "Administrator"

        }

    );

    panicModal.style.display="none";

}

function populatePanicFilters(){

    if(
        !panicSiteFilter ||
        !panicGuardFilter
    ) return;

    const sites =

        [...new Set(

            panicData
            .map(p=>p.siteName)
            .filter(Boolean)

        )];

    const guards =

        [...new Set(

            panicData
            .map(p=>p.guardName)
            .filter(Boolean)

        )];

    panicSiteFilter.innerHTML =
        '<option value="">All Sites</option>';

    sites.forEach(site=>{

        panicSiteFilter.innerHTML +=

        `<option>${site}</option>`;

    });

    panicGuardFilter.innerHTML =
        '<option value="">All Guards</option>';

    guards.forEach(guard=>{

        panicGuardFilter.innerHTML +=

        `<option>${guard}</option>`;

    });

}

if(panicSearch)
panicSearch.oninput =
renderPanicTable;

if(panicSiteFilter)
panicSiteFilter.onchange =
renderPanicTable;

if(panicGuardFilter)
panicGuardFilter.onchange =
renderPanicTable;

if(panicStatusFilter)
panicStatusFilter.onchange =
renderPanicTable;

if(panicDateFilter)
panicDateFilter.onchange =
renderPanicTable;

if(closePanicModal){

    closePanicModal.addEventListener("click",()=>{

        panicModal.style.display="none";

    });

}

window.addEventListener("click",event=>{

    if(event.target===panicModal){

        panicModal.style.display="none";

    }

});

loadPanics();

// ----------------------------------BROADCAST MANAGEMENT-----------------------------------------------------------------

// =====================================
// BROADCAST MANAGEMENT
// =====================================

const broadcastTitle =
document.getElementById("broadcastTitle");

const broadcastPriority =
document.getElementById("broadcastPriority");

const broadcastTargetType =
document.getElementById("broadcastTargetType");

const broadcastTargetValue =
document.getElementById("broadcastTargetValue");

const broadcastMessage =
document.getElementById("broadcastMessage");

const broadcastPhoto =
document.getElementById("broadcastPhoto");

const broadcastPreview =
document.getElementById("broadcastPreview");

const sendBroadcast =
document.getElementById("sendBroadcast");

const broadcastTableBody =
document.getElementById("broadcastTableBody");

const totalBroadcasts =
document.getElementById("totalBroadcasts");

const activeBroadcasts =
document.getElementById("activeBroadcasts");

const archivedBroadcasts =
document.getElementById("archivedBroadcasts");

const totalBroadcastReplies =
document.getElementById("totalBroadcastReplies");

const broadcastSearch =
document.getElementById("broadcastSearch");

const broadcastStatusFilter =
document.getElementById("broadcastStatusFilter");

const broadcastPriorityFilter =
document.getElementById("broadcastPriorityFilter");

const broadcastModal =
document.getElementById("broadcastModal");

const broadcastDetails =
document.getElementById("broadcastDetails");

const closeBroadcastModal =
document.getElementById("closeBroadcastModal");

let broadcastPhotoBase64 = "";

let broadcastData = [];

let replyData = [];

broadcastPhoto.addEventListener("change",()=>{

    const file = broadcastPhoto.files[0];

    if(!file) return;

    const reader = new FileReader();

    reader.onload = e=>{

        broadcastPhotoBase64 = e.target.result;

        broadcastPreview.src =
            broadcastPhotoBase64;

    };

    reader.readAsDataURL(file);

});

sendBroadcast.addEventListener("click",async()=>{

    if(broadcastTitle.value.trim()===""){

        alert("Enter title.");

        return;

    }

    if(broadcastMessage.value.trim()===""){

        alert("Enter message.");

        return;

    }

    if(broadcastPriority.value===""){

        alert("Select priority.");

        return;

    }

    const ref =
        doc(collection(db,"broadcasts"));

    await setDoc(ref,{

        broadcastId:ref.id,

        title:
            broadcastTitle.value.trim(),

        message:
            broadcastMessage.value.trim(),

        priority:
            broadcastPriority.value,

        targetType:
            broadcastTargetType.value,

        targetValue:
            broadcastTargetValue.value.trim(),

        photoBase64:
            broadcastPhotoBase64,

        createdBy:"Administrator",

        createdAt:
            serverTimestamp(),

        status:"Active"

    });

    alert("Broadcast Sent.");

    clearBroadcastForm();

});

function clearBroadcastForm(){

    broadcastTitle.value="";

    broadcastPriority.value="";

    broadcastTargetType.value="All";

    broadcastTargetValue.value="";

    broadcastMessage.value="";

    broadcastPhoto.value="";

    broadcastPreview.removeAttribute("src");

    broadcastPhotoBase64="";

}

function loadBroadcasts(){

    onSnapshot(

        collection(db,"broadcasts"),

        snapshot=>{

            broadcastData=[];

            snapshot.forEach(doc=>{

                broadcastData.push({

                    id:doc.id,

                    ...doc.data()

                });

            });

            updateBroadcastStats();

            renderBroadcastTable();

        }

    );

}

function loadBroadcastReplies(){

    onSnapshot(

        collection(db,"broadcastReplies"),

        snapshot=>{

            replyData=[];

            snapshot.forEach(doc=>{

                replyData.push(doc.data());

            });

            updateBroadcastStats();

            renderBroadcastTable();

        }

    );

}

function updateBroadcastStats(){

    totalBroadcasts.textContent =
        broadcastData.length;

    activeBroadcasts.textContent =
        broadcastData.filter(

            b=>b.status==="Active"

        ).length;

    archivedBroadcasts.textContent =
        broadcastData.filter(

            b=>b.status==="Archived"

        ).length;

    totalBroadcastReplies.textContent =
        replyData.length;

}

loadBroadcasts();

loadBroadcastReplies();

function renderBroadcastTable(){

    broadcastTableBody.innerHTML = "";

    const search =
        (broadcastSearch?.value || "")
        .toLowerCase();

    const status =
        broadcastStatusFilter?.value || "";

    const priority =
        broadcastPriorityFilter?.value || "";

    const filtered = broadcastData.filter(broadcast=>{

        const title =
            (broadcast.title || "")
            .toLowerCase();

        const message =
            (broadcast.message || "")
            .toLowerCase();

        const target =
            (broadcast.targetValue || "")
            .toLowerCase();

        const matchesSearch =

            title.includes(search) ||

            message.includes(search) ||

            target.includes(search);

        const matchesStatus =

            !status ||

            broadcast.status===status;

        const matchesPriority =

            !priority ||

            broadcast.priority===priority;

        return (

            matchesSearch &&

            matchesStatus &&

            matchesPriority

        );

    });

    filtered.forEach(broadcast=>{

        const replies =

            replyData.filter(

                r=>r.broadcastId===broadcast.broadcastId

            ).length;

        let created = "-";

            if (broadcast.createdAt) {

                if (typeof broadcast.createdAt.toDate === "function") {

           created = broadcast.createdAt
            .toDate()
            .toLocaleString();

            } else {

           created = new Date(
            broadcast.createdAt
        ).toLocaleString();

    }

}

        const priorityClass =

            (broadcast.priority || "normal")
            .toLowerCase();

        const statusClass =

            (broadcast.status || "active")
            .toLowerCase();

        broadcastTableBody.innerHTML += `

        <tr>

            <td>${broadcast.title}</td>

            <td>

                <span class="priority ${priorityClass}">

                    ${broadcast.priority}

                </span>

            </td>

            <td>

                ${broadcast.targetType}

                <br>

                <small>

                ${broadcast.targetValue || "All"}

                </small>

            </td>

            <td>${created}</td>

            <td>

                <span class="status ${statusClass}">

                    ${broadcast.status}

                </span>

            </td>

            <td>

                 <span class="reply-count">

                  ${replies}

                </span>

            </td>

            <td>

                <button
                onclick="viewBroadcast('${broadcast.id}')">

                    View

                </button>

            </td>

        </tr>

        `;

    });

}

if(broadcastSearch)
broadcastSearch.oninput =
renderBroadcastTable;

if(broadcastStatusFilter)
broadcastStatusFilter.onchange =
renderBroadcastTable;

if(broadcastPriorityFilter)
broadcastPriorityFilter.onchange =
renderBroadcastTable;

window.viewBroadcast = async function(id){

    const snap =
        await getDoc(doc(db,"broadcasts",id));

    if(!snap.exists()) return;

    const broadcast =
        snap.data();

    const replies =

        replyData.filter(

            r=>r.broadcastId===broadcast.broadcastId

        );

    let image = "";

    if(broadcast.photoBase64){

        image = `

        <img

            src="${broadcast.photoBase64}"

            class="broadcast-photo"

        >

        `;

    }

    let replyHtml="";

    replies.forEach(reply=>{


 replyHtml += `

 <div class="reply-card 
 ${reply.senderType}">
 

 <strong>

 ${reply.senderType}

 </strong>


 <br>


 ${reply.senderName || reply.guardName}


 <br><br>


 ${reply.reply}


 <br>


 <small>

 ${

 reply.repliedAt?.toDate

 ?

 reply.repliedAt.toDate()
 .toLocaleString()

 :

 ""

 }

        </small>


        </div>

               `;


    });

    broadcastDetails.innerHTML = `

        <h2>

            ${broadcast.title}

        </h2>

        <hr>

        <p>

            <strong>Priority:</strong>

            ${broadcast.priority}

        </p>

        <p>

            <strong>Status:</strong>

            ${broadcast.status}

        </p>

        <p>

            <strong>Target:</strong>

            ${broadcast.targetType}

            -

            ${broadcast.targetValue || "All"}

        </p>

        <hr>

        <p>

            ${broadcast.message}

        </p>

        ${image}

        <hr>

        <h3>

         Conversation

        </h3>

        <div id="broadcastConversation">

        </div>


        <textarea

         id="adminBroadcastReply"

         class="reply-box"

         placeholder="Reply to guard..."

        ></textarea>


        <br><br>


        <button

          onclick="adminReplyBroadcast('${broadcast.broadcastId}')"

        >

           Send Reply

        </button>

        <hr>

        <button

            onclick="archiveBroadcast('${id}')"

        >

            Archive

        </button>

        <button

            onclick="deleteBroadcast('${id}')"

        >

            Delete

        </button>

    `;

    broadcastModal.style.display="flex";

}

window.archiveBroadcast = async function(id){

    await updateDoc(

        doc(db,"broadcasts",id),

        {

            status:"Archived"

        }

    );

    closeModal(broadcastModal);
    broadcastModal.style.display="none";

}

window.deleteBroadcast = async function(id){

    if(

        !confirm(

            "Delete this broadcast?"

        )

    ) return;

    await deleteDoc(

        doc(db,"broadcasts",id)

    );

    broadcastModal.style.display="none";

}

window.adminReplyBroadcast = async function(broadcastId){


 const box =
 document.getElementById(
 "adminBroadcastReply"
 );
 
 
 const message =
 box.value.trim();
 

 if(message===""){

 alert("Enter reply.");

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

 senderType:
 "Admin",

 senderName:
 "Administrator",

 reply:
 message,

 repliedAt:
 serverTimestamp()

 });


 alert(
 "Reply sent."
 );


 box.value="";


};

closeBroadcastModal.addEventListener("click",()=>{

    broadcastModal.style.display="none";

});

window.addEventListener("click",event=>{

    if(event.target===broadcastModal){

        broadcastModal.style.display="none";

    }

});

// --------------------------------------------LIVE ATTENDANCE GUARD DEPARTMENT----------------------------------------------------
/*=====================================================
SHIFT MANAGEMENT
=====================================================*/

// DOM Elements
const shiftRecordBody = document.getElementById("shiftRecordBody");

const totalShifts = document.getElementById("totalShifts");
const onDutyGuards = document.getElementById("onDutyGuards");
const completedShifts = document.getElementById("completedShifts");
const lateGuards = document.getElementById("lateGuards");
const patrolCompliance = document.getElementById("patrolCompliance");

const shiftModal = document.getElementById("shiftModal");
const shiftDetails = document.getElementById("shiftDetails");

const shiftSearch = document.getElementById("shiftSearch");
const statusFilter = document.getElementById("statusFilter");
const attendanceFilter = document.getElementById("attendanceFilter");
const siteFilter = document.getElementById("siteFilter");
const shiftDateFilter = document.getElementById("shiftDateFilter");
const clearShiftFilters = document.getElementById("clearShiftFilters");

// Data
let shiftRecords = [];

/*=====================================================
LISTENER
=====================================================*/

function listenToShiftRecords() {

    onSnapshot(
        collection(db, "shiftRecords"),
        (snapshot) => {

            shiftRecords = [];

            snapshot.forEach((docSnap) => {
                shiftRecords.push({
                    id: docSnap.id,
                    ...docSnap.data()
                });
            });

            populateShiftSites();
            renderShiftRecords();
            loadShiftStatistics();
        }
    );
}

/*=====================================================
RENDER TABLE
=====================================================*/

function renderShiftRecords() {

    shiftRecordBody.innerHTML = "";

    const search = (shiftSearch.value || "").toLowerCase();
    const status = statusFilter.value;
    const attendance = attendanceFilter.value;
    const site = siteFilter.value;
    const date = shiftDateFilter.value;

    const filtered = shiftRecords.filter(record => {

        const guardName = (record.guardName || "").toLowerCase();
        const employeeID = (record.employeeID || "").toLowerCase();
        const department = (record.department || "").toLowerCase();

        const matchesSearch =
            guardName.includes(search) ||
            employeeID.includes(search) ||
            department.includes(search);

        const matchesStatus =
            !status || record.status === status;

        const matchesAttendance =
            !attendance || record.attendanceStatus === attendance;

        const matchesSite =
            !site || record.siteName === site;

        const matchesDate =
            !date || record.date === date;

        return (
            matchesSearch &&
            matchesStatus &&
            matchesAttendance &&
            matchesSite &&
            matchesDate
        );
    });

    if (filtered.length === 0) {

        shiftRecordBody.innerHTML = `
            <tr>
                <td colspan="11">No records found.</td>
            </tr>
        `;
        return;
    }

    filtered.forEach(record => {

        shiftRecordBody.innerHTML += `
            <tr>
                <td>${record.guardName || "-"}</td>
                <td>${record.employeeID || "-"}</td>
                <td>${record.department || "-"}</td>
                <td>${record.siteName || "-"}</td>
                <td>${record.shiftType || "-"}</td>
                <td>${formatDateTime(record.clockInTime)}</td>
                <td>${getStatusBadge(record.status || "-")}</td>
                <td>${getAttendanceBadge(record.attendanceStatus || "-")}</td>
                <td>${record.patrolCount || 0}</td>

                <td>
                    <div class="progress">
                        <div
                            class="progress-fill"
                            style="width:${record.compliance || 0}%">
                        </div>
                    </div>
                    <small>${record.compliance || 0}%</small>
                </td>

                <td class="action-buttons">

                    <button
                        class="view-btn"
                        onclick="viewShiftRecord('${record.id}')">
                        View
                    </button>

                    ${record.status === "ON DUTY"
                        ? `
                            <button
                                class="complete-btn"
                                onclick="completeShift('${record.id}')">
                                Complete
                            </button>

                            <button
                                class="location-btn"
                                onclick="viewGuardLocation('${record.id}')">
                                Location
                            </button>
                        `
                        : ""
                    }

                </td>
            </tr>
        `;
    });
}

/*=====================================================
FORMATTER
=====================================================*/

function formatDateTime(timestamp) {

    if (!timestamp) return "-";

    const date = timestamp.toDate
        ? timestamp.toDate()
        : new Date(timestamp);

    return date.toLocaleString();
}

/*=====================================================
STATISTICS
=====================================================*/

function loadShiftStatistics() {

    let total = shiftRecords.length;
    let onDuty = 0;
    let completed = 0;
    let late = 0;
    let complianceTotal = 0;

    shiftRecords.forEach(record => {

        if (record.status === "ON DUTY") onDuty++;
        if (record.shiftCompleted) completed++;
        if (record.attendanceStatus === "LATE") late++;

        complianceTotal += Number(record.compliance || 0);
    });

    totalShifts.textContent = total;
    onDutyGuards.textContent = onDuty;
    completedShifts.textContent = completed;
    lateGuards.textContent = late;

    patrolCompliance.textContent =
        total
            ? Math.round(complianceTotal / total) + "%"
            : "0%";
}

/*=====================================================
MODAL
=====================================================*/

function viewShiftRecord(id) {

    const record = shiftRecords.find(r => r.id === id);

    if (!record) {
        alert("Shift record not found.");
        return;
    }

    shiftDetails.innerHTML = `
        <div class="detail-grid">

            <div><strong>Guard Name:</strong> ${record.guardName || "-"}</div>
            <div><strong>Employee ID:</strong> ${record.employeeID || "-"}</div>
            <div><strong>Department:</strong> ${record.department || "-"}</div>
            <div><strong>Phone:</strong> ${record.phone || "-"}</div>
            <div><strong>Site:</strong> ${record.siteName || "-"}</div>
            <div><strong>Shift:</strong> ${record.shiftType || "-"}</div>
            <div><strong>Clock In:</strong> ${formatDateTime(record.clockInTime)}</div>
            <div><strong>Clock Out:</strong> ${formatDateTime(record.clockOutTime)}</div>
            <div><strong>Status:</strong> ${record.status || "-"}</div>
            <div><strong>Attendance:</strong> ${record.attendanceStatus || "-"}</div>
            <div><strong>Patrol Count:</strong> ${record.patrolCount || 0}</div>
            <div><strong>Compliance:</strong> ${record.compliance || 0}%</div>

        </div>
    `;

    shiftModal.style.display = "flex";
}

function closeShiftModal() {
    shiftModal.style.display = "none";
}

window.addEventListener("click", function (event) {
    if (event.target === shiftModal) {
        closeShiftModal();
    }
});

/*=====================================================
FILTERS
=====================================================*/

function populateShiftSites() {

    const sites = [...new Set(
        shiftRecords
            .map(record => record.siteName)
            .filter(Boolean)
    )];

    siteFilter.innerHTML = `<option value="">All Sites</option>`;

    sites.forEach(site => {
        siteFilter.innerHTML += `<option value="${site}">${site}</option>`;
    });
}

shiftSearch.addEventListener("input", renderShiftRecords);
statusFilter.addEventListener("change", renderShiftRecords);
attendanceFilter.addEventListener("change", renderShiftRecords);
siteFilter.addEventListener("change", renderShiftRecords);
shiftDateFilter.addEventListener("change", renderShiftRecords);

clearShiftFilters.addEventListener("click", () => {

    shiftSearch.value = "";
    statusFilter.value = "";
    attendanceFilter.value = "";
    siteFilter.value = "";
    shiftDateFilter.value = "";

    renderShiftRecords();
});

/*=====================================================
ACTIONS
=====================================================*/

async function completeShift(id) {

    if (!confirm("Complete this shift?")) return;

    try {

        await updateDoc(
            doc(db, "shiftRecords", id),
            {
                status: "COMPLETED",
                shiftCompleted: true,
                clockOutTime: new Date()
            }
        );

        alert("Shift completed successfully.");

    } catch (error) {

        console.error(error);
        alert(error.message);
    }
}

function viewGuardLocation(id) {

    const record = shiftRecords.find(r => r.id === id);

    if (!record) return;

    if (!record.clockInLatitude || !record.clockInLongitude) {
        alert("Location unavailable.");
        return;
    }

    const url =
        `https://www.google.com/maps?q=${record.clockInLatitude},${record.clockInLongitude}`;

    window.open(url, "_blank");
}

/*=====================================================
BADGES
=====================================================*/

function getStatusBadge(status) {

    switch (status) {

        case "ON DUTY":
            return `<span class="badge badge-success">ON DUTY</span>`;

        case "COMPLETED":
            return `<span class="badge badge-primary">COMPLETED</span>`;

        case "OFF DUTY":
            return `<span class="badge badge-secondary">OFF DUTY</span>`;

        default:
            return `<span class="badge badge-warning">${status}</span>`;
    }
}

function getAttendanceBadge(status) {

    switch (status) {

        case "ON TIME":
            return `<span class="badge badge-success">ON TIME</span>`;

        case "LATE":
            return `<span class="badge badge-danger">LATE</span>`;

        case "ABSENT":
            return `<span class="badge badge-warning">ABSENT</span>`;

        default:
            return status || "-";
    }
}

/*=====================================================
MAKE FUNCTIONS GLOBAL (IMPORTANT)
=====================================================*/

window.viewShiftRecord = viewShiftRecord;
window.viewGuardLocation = viewGuardLocation;
window.completeShift = completeShift;
window.closeShiftModal = closeShiftModal;

/*=====================================================
START
=====================================================*/

listenToShiftRecords();

// ---------------------------REPORT GUARD.HTML----------------------------------------------------------

/*=====================================================
REPORTS MODULE
=====================================================*/

// Filters
const reportType = document.getElementById("reportType");
const reportGuard = document.getElementById("reportGuard");
const reportCustomer = document.getElementById("reportCustomer");

const reportFromDate = document.getElementById("reportFromDate");
const reportToDate = document.getElementById("reportToDate");

// Buttons
const generateReportBtn = document.getElementById("generateReport");
const printReportBtn = document.getElementById("printReport");
const exportPDFBtn = document.getElementById("exportPDF");
const exportExcelBtn = document.getElementById("exportExcel");

// Report Area
const reportViewer = document.getElementById("reportViewer");

reportType.addEventListener("change", () => {

    reportGuard.style.display = "none";
    reportCustomer.style.display = "none";

    if(reportType.value === "single"){

        reportGuard.style.display = "block";

    }

    if(reportType.value === "customer"){

        reportCustomer.style.display = "block";

    }

});

async function loadReportGuards(){

    reportGuard.innerHTML =
        `<option value="">Select Guard</option>`;

    const snapshot = await getDocs(collection(db,"guards"));

    snapshot.forEach(doc=>{

        const guard = doc.data();

        reportGuard.innerHTML += `
      <option
     value="${guard.guardId}"
     data-employee="${guard.employeeID}"
     data-name="${guard.fullName}">
     ${guard.fullName}
     </option>
     `;

    });

}

async function loadReportCustomers(){

    reportCustomer.innerHTML =
        `<option value="">Select Customer</option>`;

    const snapshot = await getDocs(collection(db,"sites"));

    snapshot.forEach(doc=>{

        const site = doc.data();

        reportCustomer.innerHTML += `
            <option
               value="${site.siteId}">
               ${site.customerName}
            </option>
        `;

    });

}

loadReportGuards();

loadReportCustomers();

generateReportBtn.addEventListener("click",generateReport);

async function generateReport(){

    if(!reportFromDate.value){

        alert("Select From Date.");

        return;

    }

    if(!reportToDate.value){

        alert("Select To Date.");

        return;

    }

    switch(reportType.value){

        case "single":

            generateSingleGuardReport();

            break;

        case "all":

            generateAllGuardsReport();

            break;

        case "customer":

            generateCustomerReport();

            break;

        default:

            alert("Select Report Type.");

    }

}

async function generateSingleGuardReport(){

    if(!reportGuard.value){

        alert("Select a guard.");

        return;

    }

    const selectedOption =
    reportGuard.options[reportGuard.selectedIndex];

   const selectedGuardId =
    selectedOption.value;

   const selectedEmployeeID =
    selectedOption.dataset.employee;

    const snapshot = await getDocs(collection(db,"shiftRecords"));

    const records = [];

    snapshot.forEach(doc=>{

        const data = doc.data();

        if(

    data.guardId === selectedGuardId &&

    data.employeeID === selectedEmployeeID &&

    data.date >= reportFromDate.value &&

    data.date <= reportToDate.value

 ){

    records.push(data);

 }

    });

    if(records.length === 0){

        reportViewer.innerHTML = `
            <div class="report-placeholder">
                <h3>No records found.</h3>
            </div>
        `;

        return;

    }

    records.sort((a,b)=>a.date.localeCompare(b.date));

    const guard = records[0];

    const totals = calculateReportTotals(records);

    let dailyRows = "";

    records.forEach(record=>{

        dailyRows += `

        <tr>

            <td>${record.date}</td>

            <td>${formatDateTime(record.clockInTime)}</td>

            <td>${formatDateTime(record.clockOutTime)}</td>

            <td>${record.workedHours || 0}</td>

            <td>${formatDateTime(record.lunchIn)}</td>

            <td>${formatDateTime(record.lunchOut)}</td>

            <td>${record.lunchDuration || 0}</td>

            <td>${record.overtimeMinutes || 0}</td>

            <td>${record.attendanceStatus || "-"}</td>

            <td>${record.siteName || "-"}</td>

            <td>${record.customerName || "-"}</td>

            <td>${record.shiftType || "-"}</td>

        </tr>

        `;

    });

    reportViewer.innerHTML = `

<div class="report-page page-break">

<div class="report-header">

<div>

<img
src="images/logo.png"
class="company-logo">

</div>

<div class="company-details">

<h2>Y O U R I SECURITY SOLUTIONS</h2>

<h4>Guard Attendance Report</h4>

<p>

Reporting Period

<br>

${reportFromDate.value}

-

${reportToDate.value}

</p>

</div>

<div class="generated-details">

<p>

Generated

<br>

Generated By : ${generatedBy}<br>
Date : ${new Date().toLocaleDateString()}<br>
Time : ${new Date().toLocaleTimeString()}

</p>

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

<strong>Phone</strong>

<br>

${guard.phone || "-"}

</div>

</div>

<table class="report-table">

<thead>

<tr>

<th>Date</th>

<th>Clock In</th>

<th>Clock Out</th>

<th>Worked</th>

<th>Lunch In</th>

<th>Lunch Out</th>

<th>Lunch Minutes</th>

<th>Overtime</th>

<th>Status</th>

<th>Site</th>

<th>Customer</th>

<th>Shift</th>

</tr>

</thead>

<tbody>

${dailyRows}

</tbody>

</table>

<div class="report-summary">

<div class="summary-card">

<h4>Summary</h4>

<p>Total Working Days : ${totals.totalWorkingDays}</p>

<p>Present Days : ${totals.presentDays}</p>

<p>Absent Days : ${totals.absentDays}</p>

<p>Late Days : ${totals.lateDays}</p>

<p>Early Leave Days : ${totals.earlyLeaveDays}</p>

<p>Total Worked Hours : ${totals.workedHours}</p>

<p>Total Lunch Minutes : ${totals.lunchDuration}</p>

<p>Total Lunch Hours : ${totals.lunchHours} hrs</p>

<p>Total Overtime : ${totals.overtime} mins</p>

<hr>

<p>Total Patrols : ${totals.patrolCount}</p>

<p>Expected Patrols : ${totals.expectedPatrols}</p>

<p>Missed Patrols : ${totals.missedPatrols}</p>

<p>Average Compliance : ${totals.averageCompliance}%</p>

<hr>

<p>Total Incidents : ${totals.incidentCount}</p>

<p>Total Panic Alerts : ${totals.panicAlerts}</p>

<hr>

<p>Weekend Days : ${totals.weekends}</p>

<p>Public Holiday Days : ${totals.publicHolidays}</p>

<p>Average Hours Per Day : ${totals.averageHours}</p>

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

function calculateReportTotals(records){

    let present = 0;
    let absent = 0;
    let late = 0;
    let early = 0;

    let worked = 0;
    let lunchDuration = 0;
    let overtime = 0;

    let patrols = 0;
    let expectedPatrols = 0;
    let missedPatrols = 0;
    let compliance = 0;

    let incidents = 0;
    let panicAlerts = 0;

    let weekends = 0;
    let holidays = 0;

    records.forEach(record=>{

        switch(record.attendanceStatus){

            case "ON TIME":
                present++;
                break;

            case "LATE":
                present++;
                late++;
                break;

            case "ABSENT":
                absent++;
                break;

        }

        if(record.earlyLeave)
            early++;

        worked += Number(record.workedHours || 0);

        lunchDuration += Number(record.lunchDuration || 0);

        overtime += Number(record.overtimeMinutes || 0);

        patrols += Number(record.patrolCount || 0);

        expectedPatrols += Number(record.expectedPatrols || 0);

        missedPatrols += Number(record.missedPatrols || 0);

        compliance += Number(record.compliance || 0);

        incidents += Number(record.incidentCount || 0);

        panicAlerts += Number(record.panicAlerts || 0);

        const day = new Date(record.date).getDay();

        if(day===0 || day===6)
            weekends++;

        if(record.publicHoliday)
            holidays++;

    });

    return{

        totalWorkingDays: records.length,

        presentDays: present,

        absentDays: absent,

        lateDays: late,

        earlyLeaveDays: early,

        workedHours: worked.toFixed(2),

        lunchDuration,

        lunchHours: (lunchDuration/60).toFixed(2),

        overtime: overtime.toFixed(2),

        patrolCount: patrols,

        expectedPatrols: expectedPatrols,

        missedPatrols: missedPatrols,

        averageCompliance:
        records.length
        ?
        (compliance/records.length).toFixed(2)
        :
        "0.00",

        incidentCount: incidents,

        panicAlerts: panicAlerts,

        weekends: weekends,

        publicHolidays: holidays,

        averageHours:
        records.length
        ?
        (worked/records.length).toFixed(2)
        :
        "0.00"

    };

}

async function generateAllGuardsReport(){

    const snapshot = await getDocs(collection(db,"shiftRecords"));

    const groupedGuards = {};

    snapshot.forEach(doc=>{

        const record = doc.data();

        if(
            record.date >= reportFromDate.value &&
            record.date <= reportToDate.value
        ){

            const key =

             `${record.guardId}_${record.employeeID}`;

             if(!groupedGuards[key]){

             groupedGuards[key]=[];

           }

              groupedGuards[key].push(record);

        }

    });

    const guardIds = Object.keys(groupedGuards);

    if(guardIds.length===0){

        reportViewer.innerHTML=`

            <div class="report-placeholder">

                <h3>No records found.</h3>

            </div>

        `;

        return;

    }

    let html="";

    guardIds.forEach(key=>{

        const records = groupedGuards[key];

        records.sort((a,b)=>a.date.localeCompare(b.date));

        const guard=records[0];

        const totals=calculateReportTotals(records);

        let rows="";

        records.forEach(record=>{

            rows+=`

                <tr>

                    <td>${record.date}</td>

                    <td>${formatDateTime(record.clockInTime)}</td>

                    <td>${formatDateTime(record.clockOutTime)}</td>

                    <td>${record.workedHours || 0}</td>

                    <td>${formatDateTime(record.lunchIn)}</td>

                    <td>${formatDateTime(record.lunchOut)}</td>

                    <td>${record.lunchDuration || 0}</td>

                    <td>${record.overtimeMinutes || 0}</td>

                    <td>${record.attendanceStatus || "-"}</td>

                    <td>${record.siteName||"-"}</td>

                    <td>${record.customerName||"-"}</td>

                    <td>${record.shiftType||"-"}</td>

                </tr>

            `;

        });

        html+=`

<div class="report-page page-break">

<div class="report-header">

<div>

<img src="images/logo.png" class="company-logo">

</div>

<div class="company-details">

<h2>Y O U R I SECURITY SOLUTIONS</h2>

<h4>All Guards Attendance Report</h4>

<p>

${reportFromDate.value}

-

${reportToDate.value}

</p>

</div>

<div class="generated-details">

${new Date().toLocaleString()}

</div>

</div>

<div class="guard-info">

<div>

<strong>Guard</strong><br>

${guard.guardName}

</div>

<div>

<strong>Employee ID</strong><br>

${guard.employeeID}

</div>

<div>

<strong>Department</strong><br>

${guard.department}

</div>

<div>

<strong>Phone</strong><br>

${guard.phone||"-"}

</div>

</div>

<table class="report-table">

<thead>

<tr>

<th>Date</th>

<th>Clock In</th>

<th>Clock Out</th>

<th>Worked</th>

<th>Break</th>

<th>Overtime</th>

<th>Status</th>

<th>Site</th>

<th>Customer</th>

<th>Shift</th>

</tr>

</thead>

<tbody>

${rows}

</tbody>

</table>

<div class="report-summary">

<div class="summary-card">

<h4>Summary</h4>

<p>Total Working Days : ${totals.totalWorkingDays}</p>

<p>Present Days : ${totals.presentDays}</p>

<p>Absent Days : ${totals.absentDays}</p>

<p>Late Days : ${totals.lateDays}</p>

<p>Early Leave Days : ${totals.earlyLeaveDays}</p>

<p>Total Worked Hours : ${totals.workedHours}</p>

<p>Total Lunch Minutes : ${totals.lunchDuration}</p>

<p>Total Lunch Hours : ${totals.lunchHours} hrs</p>

<p>Total Overtime : ${totals.overtime} mins</p>

<hr>

<p>Total Patrols : ${totals.patrolCount}</p>

<p>Expected Patrols : ${totals.expectedPatrols}</p>

<p>Missed Patrols : ${totals.missedPatrols}</p>

<p>Average Compliance : ${totals.averageCompliance}%</p>

<hr>

<p>Total Incidents : ${totals.incidentCount}</p>

<p>Total Panic Alerts : ${totals.panicAlerts}</p>

<hr>

<p>Weekend Days : ${totals.weekends}</p>

<p>Public Holiday Days : ${totals.publicHolidays}</p>

<p>Average Hours Per Day : ${totals.averageHours}</p>

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

    reportViewer.innerHTML=html;

}

/*=====================================================
CUSTOMER REPORT
=====================================================*/

async function generateCustomerReport(){

    if(!reportCustomer.value){

        alert("Select a customer.");

        return;

    }

    const snapshot = await getDocs(collection(db,"shiftRecords"));

    const groupedGuards = {};

    snapshot.forEach(doc=>{

        const record = doc.data();

        if(

            record.siteId === reportCustomer.value &&

            record.date >= reportFromDate.value &&

            record.date <= reportToDate.value

        ){

            const key =

          `${record.siteId}_${record.guardId}_${record.employeeID}`;

          if(!groupedGuards[key]){

          groupedGuards[key]=[];

         }

groupedGuards[key].push(record);

        }

    });

    const guardIds = Object.keys(groupedGuards);

    if(guardIds.length === 0){

        reportViewer.innerHTML = `

            <div class="report-placeholder">

                <h3>No records found for this customer.</h3>

            </div>

        `;

        return;

    }

    let html = "";

    guardIds.forEach(key=>{

        const records = groupedGuards[key];

        records.sort((a,b)=>a.date.localeCompare(b.date));

        const guard = records[0];

        const totals = calculateReportTotals(records);

        let rows = "";

        records.forEach(record=>{

            rows += `

                <tr>

                    <td>${record.date}</td>

                    <td>${formatDateTime(record.clockInTime)}</td>

                    <td>${formatDateTime(record.clockOutTime)}</td>

                    <td>${record.workedHours || 0}</td>

                    <td>${formatDateTime(record.lunchIn)}</td>

                    <td>${formatDateTime(record.lunchOut)}</td>

                    <td>${record.lunchDuration || 0}</td>

                    <td>${record.overtimeMinutes || 0}</td>

                    <td>${record.attendanceStatus || "-"}</td>
                    <td>${record.siteName || "-"}</td>

                    <td>${record.shiftType || "-"}</td>

                </tr>

            `;

        });

        html += `

<div class="report-page page-break">

<div class="report-header">

<div>

<img src="images/logo.png" class="company-logo">

</div>

<div class="company-details">

<h2>Y O U R I SECURITY SOLUTIONS</h2>

<h4>Customer Attendance Report</h4>

<p><strong>Customer:</strong> ${reportCustomer.value}</p>

<p>${reportFromDate.value} - ${reportToDate.value}</p>

</div>

<div class="generated-details">

${new Date().toLocaleString()}

</div>

</div>

<div class="guard-info">

<div>

<strong>Guard</strong><br>

${guard.guardName || "-"}

</div>

<div>

<strong>Employee ID</strong><br>

${guard.employeeID || "-"}

</div>

<div>

<strong>Department</strong><br>

${guard.department || "-"}

</div>

<div>

<strong>Phone</strong><br>

${guard.phone || "-"}

</div>

</div>

<table class="report-table">

<thead>

<tr>

<th>Date</th>

<th>Clock In</th>

<th>Clock Out</th>

<th>Worked</th>

<th>Break</th>

<th>Overtime</th>

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

<h4>Summary</h4>

<p>Total Working Days : ${totals.totalWorkingDays}</p>

<p>Present Days : ${totals.presentDays}</p>

<p>Absent Days : ${totals.absentDays}</p>

<p>Late Days : ${totals.lateDays}</p>

<p>Early Leave Days : ${totals.earlyLeaveDays}</p>

<p>Total Worked Hours : ${totals.workedHours}</p>

<p>Total Lunch Minutes : ${totals.lunchDuration}</p>

<p>Total Lunch Hours : ${totals.lunchHours} hrs</p>

<p>Total Overtime : ${totals.overtime} mins</p>

<hr>

<p>Total Patrols : ${totals.patrolCount}</p>

<p>Expected Patrols : ${totals.expectedPatrols}</p>

<p>Missed Patrols : ${totals.missedPatrols}</p>

<p>Average Compliance : ${totals.averageCompliance}%</p>

<hr>

<p>Total Incidents : ${totals.incidentCount}</p>

<p>Total Panic Alerts : ${totals.panicAlerts}</p>

<hr>

<p>Weekend Days : ${totals.weekends}</p>

<p>Public Holiday Days : ${totals.publicHolidays}</p>

<p>Average Hours Per Day : ${totals.averageHours}</p>

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

    if(!reportViewer.innerHTML.trim()){

        alert("Generate a report first.");

        return;

    }

    const printWindow = window.open("", "_blank");

    printWindow.document.write(`
        <html>
        <head>
            <title>Y O U R I Security Solutions Report</title>
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

exportPDFBtn.addEventListener("click",()=>{

    const report=document.getElementById("reportViewer");

    report.style.width="210mm";
    report.style.maxWidth="210mm";
    report.style.background="#fff";

    html2pdf()
        .set({

            margin:5,

            filename:"Y O U R I Security Solutions_Report.pdf",

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
            }

        })
        .from(report)
        .save()
        .then(()=>{

            report.style.width="";
            report.style.maxWidth="";

        });

});
/*=====================================================
EXPORT EXCEL
=====================================================*/

exportExcelBtn.addEventListener("click", () => {

    const tables = reportViewer.querySelectorAll("table");

    if (tables.length === 0) {

        alert("Generate a report first.");

        return;

    }

    const workbook = XLSX.utils.book_new();

    tables.forEach((table, index) => {

        const worksheet = XLSX.utils.table_to_sheet(table);

        XLSX.utils.book_append_sheet(

            workbook,

            worksheet,

            `Guard ${index + 1}`

        );

    });

    XLSX.writeFile(

        workbook,

        "Y O U R I Security Solutions_Report.xlsx"

    );

});
const generatedBy = auth.currentUser
    ? auth.currentUser.email
    : "Administrator";


    // ----------------------------LIVE STAFF ATTENDANCE.HTML-------------------------

    /*=====================================================
ATTENDANCE MANAGEMENT
=====================================================*/

const attendanceBody =
document.getElementById("attendanceBody");

const attendanceSearch =
document.getElementById("attendanceSearch");

const attendanceStatusFilter =
document.getElementById("attendanceStatusFilter");

const attendanceActionFilter =
document.getElementById("attendanceActionFilter");

const attendanceDateFilter =
document.getElementById("attendanceDateFilter");

const attendanceClearFilters =
document.getElementById("attendanceClearFilters");

const attendanceTotal =
document.getElementById("attendanceTotal");

const attendanceIn =
document.getElementById("attendanceIn");

const attendanceOut =
document.getElementById("attendanceOut");

const attendanceOnDuty =
document.getElementById("attendanceOnDuty");

let attendanceRecords = [];

function listenToAttendance(){

    onSnapshot(

        collection(db,"attendance"),

        snapshot=>{

            attendanceRecords=[];

            snapshot.forEach(doc=>{

                attendanceRecords.push({

                    id:doc.id,

                    ...doc.data()

                });

            });

            renderAttendance();

            loadAttendanceStatistics();

        }

    );

}

listenToAttendance();

/*=====================================================
RENDER ATTENDANCE TABLE
=====================================================*/

function renderAttendance(){

    attendanceBody.innerHTML = "";

    const search =
        attendanceSearch.value.toLowerCase();

    const status =
        attendanceStatusFilter.value;

    const action =
        attendanceActionFilter.value;

    const date =
        attendanceDateFilter.value;

    const filtered = attendanceRecords.filter(record=>{

        const matchesSearch =

            (record.fullName || "")
            .toLowerCase()
            .includes(search)

            ||

            (record.employeeID || "")
            .toLowerCase()
            .includes(search);

        const matchesStatus =

            !status ||

            record.status === status;

        const matchesAction =

            !action ||

            record.action === action;

        const matchesDate =

            !date ||

            record.date === date;

        return(

            matchesSearch &&

            matchesStatus &&

            matchesAction &&

            matchesDate

        );

    });

    if(filtered.length===0){

        attendanceBody.innerHTML =

        `

        <tr>

            <td colspan="9">

                No attendance records found.

            </td>

        </tr>

        `;

        return;

    }

    filtered.sort((a,b)=>{

        const timeA =

            a.timestamp?.seconds || 0;

        const timeB =

            b.timestamp?.seconds || 0;

        return timeB-timeA;

    });

    filtered.forEach(record=>{

        attendanceBody.innerHTML += `

        <tr>

            <td>${record.fullName || "-"}</td>

            <td>${record.employeeID || "-"}</td>

            <td>${record.department || "-"}</td>

            <td>${record.siteName || "-"}</td>

           <td>

             ${getAttendanceStatusBadge(record.status)}

            </td>

            <td>

             ${getAttendanceActionBadge(record.action)}

            </td>

            <td>${record.date}</td>

            <td>${formatAttendanceTime(record.timestamp)}</td>

            <td class="action-buttons">

    <button
    class="view-btn"
    onclick="viewAttendanceRecord('${record.id}')">
    View
</button>

<button
    class="pdf-btn"
    onclick="exportAttendancePDF('${record.employeeID}')">
    PDF
</button>

<button
    class="excel-btn"
    onclick="exportAttendanceExcel('${record.employeeID}')">
    Excel
</button>

<button
    class="delete-btn"
    onclick="deleteAttendanceRecord('${record.id}')">
    Delete
</button>

</td>

        </tr>

        `;

    });

}

/*=====================================================
TIME FORMATTER
=====================================================*/

function formatAttendanceTime(timestamp){

    if(!timestamp) return "-";

    const date =

        timestamp.toDate
        ?

        timestamp.toDate()

        :

        new Date(timestamp);

    return date.toLocaleTimeString();

}

/*=====================================================
BADGES
=====================================================*/



function getActionBadge(action){

    switch(action){

        case "IN":

            return `
            <span class="badge badge-primary">
                CHECK IN
            </span>`;

        case "OUT":

            return `
            <span class="badge badge-danger">
                CHECK OUT
            </span>`;

        default:

            return action || "-";

    }

}

/*=====================================================
ATTENDANCE STATISTICS
=====================================================*/

function loadAttendanceStatistics(){

    attendanceTotal.textContent =

        attendanceRecords.length;

    attendanceIn.textContent =

        attendanceRecords.filter(r=>r.action==="IN").length;

    attendanceOut.textContent =

        attendanceRecords.filter(r=>r.action==="OUT").length;

    attendanceOnDuty.textContent =

        attendanceRecords.filter(r=>r.status==="ON DUTY").length;

}

/*=====================================================
FILTERS
=====================================================*/

attendanceSearch.addEventListener(

    "input",

    renderAttendance

);

attendanceStatusFilter.addEventListener(

    "change",

    renderAttendance

);

attendanceActionFilter.addEventListener(

    "change",

    renderAttendance

);

attendanceDateFilter.addEventListener(

    "change",

    renderAttendance

);

attendanceClearFilters.addEventListener(

    "click",

    ()=>{

        attendanceSearch.value="";

        attendanceStatusFilter.value="";

        attendanceActionFilter.value="";

        attendanceDateFilter.value="";

        renderAttendance();

    }

);

/*=====================================================
ATTENDANCE DETAILS MODAL
=====================================================*/

const attendanceModal =
document.getElementById("attendanceModal");

const attendanceDetails =
document.getElementById("attendanceDetails");

function viewAttendanceRecord(id){

    const record =
    attendanceRecords.find(r => r.id === id);

    if(!record){

        alert("Attendance record not found.");

        return;

    }

    attendanceDetails.innerHTML = `

        <div class="attendance-detail-grid">

            <div class="attendance-detail-card">

                <strong>Guard Name</strong>

                ${record.fullName || "-"}

            </div>

            <div class="attendance-detail-card">

                <strong>Employee ID</strong>

                ${record.employeeID || "-"}

            </div>

            <div class="attendance-detail-card">

                <strong>Department</strong>

                ${record.department || "-"}

            </div>

            <div class="attendance-detail-card">

                <strong>Role</strong>

                ${record.role || "-"}

            </div>

            <div class="attendance-detail-card">

                <strong>Site</strong>

                ${record.siteName || "-"}

            </div>

            <div class="attendance-detail-card">

                <strong>Status</strong>

                ${record.status || "-"}

            </div>

            <div class="attendance-detail-card">

                <strong>Action</strong>

                ${record.action || "-"}

            </div>

            <div class="attendance-detail-card">

                <strong>Date</strong>

                ${record.date || "-"}

            </div>

            <div class="attendance-detail-card">

                <strong>Time</strong>

                ${formatDateTime(record.timestamp)}

            </div>

            <div class="attendance-detail-card">

                <strong>Guard ID</strong>

                ${record.guardId || "-"}

            </div>

            <div class="attendance-detail-card">

                <strong>Site ID</strong>

                ${record.siteId || "-"}

            </div>

        </div>

    `;

    attendanceModal.style.display = "flex";

}

function closeAttendanceModal(){

    attendanceModal.style.display = "none";

}

window.addEventListener("click",(event)=>{

    if(event.target===attendanceModal){

        closeAttendanceModal();

    }

});

window.viewAttendanceRecord =
viewAttendanceRecord;

window.closeAttendanceModal =
closeAttendanceModal;

/*=====================================================
DELETE ATTENDANCE RECORD
=====================================================*/

async function deleteAttendanceRecord(id){

    if(!confirm("Delete this attendance record?")){

        return;

    }

    try{

        await deleteDoc(
            doc(db,"attendance",id)
        );

        alert("Attendance record deleted successfully.");

    }

    catch(error){

        console.error(error);

        alert(error.message);

    }

}

window.deleteAttendanceRecord =
deleteAttendanceRecord;

/*=====================================================
ATTENDANCE STATUS BADGE
=====================================================*/

function getAttendanceStatusBadge(status){

    switch(status){

        case "ON DUTY":

            return `
                <span class="badge badge-success">
                    ON DUTY
                </span>
            `;

        case "OFF DUTY":

            return `
                <span class="badge badge-secondary">
                    OFF DUTY
                </span>
            `;

        default:

            return `
                <span class="badge badge-warning">
                    ${status || "-"}
                </span>
            `;

    }

}

/*=====================================================
ATTENDANCE ACTION BADGE
=====================================================*/

function getAttendanceActionBadge(action){

    switch(action){

        case "IN":

            return `
                <span class="badge badge-primary">
                    IN
                </span>
            `;

        case "OUT":

            return `
                <span class="badge badge-danger">
                    OUT
                </span>
            `;

        default:

            return "-";

    }

}

async function exportAttendancePDF(employeeID){

    const snapshot = await getDocs(collection(db,"attendance"));

    const records = [];

    snapshot.forEach(doc=>{

        const data = doc.data();

        if(data.employeeID === employeeID){

            records.push(data);

        }

    });

    if(records.length===0){

        alert("No attendance history found.");

        return;

    }

    records.sort((a,b)=>{

        if(a.date===b.date){

            return (a.timestamp?.seconds||0) -
                   (b.timestamp?.seconds||0);

        }

        return a.date.localeCompare(b.date);

    });

    // Group by date
    const grouped = {};

    records.forEach(record=>{

        if(!grouped[record.date]){

            grouped[record.date]=[];

        }

        grouped[record.date].push(record);

    });

    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF("p","mm","a4");

    let y = 15;

    pdf.setFontSize(18);
    pdf.text("Y O U R I Security Solutions",105,y,{align:"center"});

    y+=8;

    pdf.setFontSize(14);
    pdf.text("Attendance History Report",105,y,{align:"center"});

    y+=12;

    pdf.setFontSize(11);

    pdf.text(`Guard : ${records[0].fullName}`,15,y);
    y+=6;

    pdf.text(`Employee ID : ${records[0].employeeID}`,15,y);
    y+=6;

    pdf.text(`Department : ${records[0].department || "-"}`,15,y);
    y+=6;

    pdf.text(`Site : ${records[0].siteName || "-"}`,15,y);
    y+=10;

    let totalIN=0;
    let totalOUT=0;

    Object.keys(grouped).forEach(date=>{

        if(y>250){

            pdf.addPage();

            y=20;

        }

        pdf.setFillColor(230,230,230);

        pdf.rect(10,y-4,190,8,"F");

        pdf.setFontSize(12);

        pdf.text(`DATE : ${date}`,15,y+1);

        y+=10;

        pdf.autoTable({

            startY:y,

            head:[["Time","Action","Status","Site"]],

            body:grouped[date].map(r=>{

                if(r.action==="IN") totalIN++;
                if(r.action==="OUT") totalOUT++;

                return [

                    formatAttendanceTime(r.timestamp),

                    r.action,

                    r.status,

                    r.siteName || "-"

                ];

            }),

            theme:"grid",

            styles:{

                fontSize:10

            }

        });

        y=pdf.lastAutoTable.finalY+8;

    });

    if(y>220){

        pdf.addPage();

        y=20;

    }

    pdf.setFontSize(13);

    pdf.text("SUMMARY",15,y);

    y+=8;

    pdf.setFontSize(11);

    pdf.text(`Total Working Days : ${Object.keys(grouped).length}`,15,y);

    y+=6;

    pdf.text(`Total Check IN : ${totalIN}`,15,y);

    y+=6;

    pdf.text(`Total Check OUT : ${totalOUT}`,15,y);

    y+=15;

    pdf.line(20,y,80,y);

    pdf.line(120,y,180,y);

    y+=5;

    pdf.text("Supervisor",35,y);

    pdf.text("Manager",145,y);

    pdf.save(`${employeeID}_AttendanceHistory.pdf`);

}

async function exportAttendanceExcel(employeeID){

    const snapshot = await getDocs(collection(db,"attendance"));

    const grouped = {};

    let employeeName = "";

    snapshot.forEach(doc=>{

        const data = doc.data();

        if(data.employeeID !== employeeID) return;

        employeeName = data.fullName || "";

        if(!grouped[data.date]){

            grouped[data.date] = [];

        }

        grouped[data.date].push(data);

    });

    if(Object.keys(grouped).length===0){

        alert("No attendance history.");

        return;

    }

    const workbook = XLSX.utils.book_new();

    Object.keys(grouped)

        .sort()

        .forEach(date=>{

            const records = grouped[date];

            records.sort((a,b)=>

                (a.timestamp?.seconds||0)

                -

                (b.timestamp?.seconds||0)

            );

            const rows = [];

            rows.push(["Y O U R I Security Solutions"]);
            rows.push(["Attendance History"]);
            rows.push([]);
            rows.push(["Guard Name",employeeName]);
            rows.push(["Employee ID",employeeID]);
            rows.push(["Date",date]);
            rows.push([]);

            rows.push([
                "Time",
                "Action",
                "Status",
                "Site"
            ]);

            let inCount = 0;
            let outCount = 0;

            records.forEach(r=>{

                if(r.action==="IN") inCount++;

                if(r.action==="OUT") outCount++;

                rows.push([

                    formatAttendanceTime(r.timestamp),

                    r.action,

                    r.status,

                    r.siteName

                ]);

            });

            rows.push([]);
            rows.push(["SUMMARY"]);
            rows.push(["Total Records",records.length]);
            rows.push(["Check IN",inCount]);
            rows.push(["Check OUT",outCount]);

            const sheet = XLSX.utils.aoa_to_sheet(rows);

            sheet["!cols"] = [

                {wch:18},

                {wch:15},

                {wch:18},

                {wch:30}

            ];

            XLSX.utils.book_append_sheet(

                workbook,

                sheet,

                date.replace(/-/g,"")

            );

        });

    XLSX.writeFile(

        workbook,

        `${employeeName}_Attendance_History.xlsx`

    );

}

window.exportAttendanceExcel = exportAttendanceExcel;

window.exportAttendancePDF = exportAttendancePDF;
window.exportAttendanceExcel = exportAttendanceExcel;

//---------------------------------------- STAFF ATTENDANCE REPORTS FOR PAYROLL----------------------------

/* ==========================================================
   FIRESTORE COLLECTIONS
========================================================== */

const attendanceCollection =

    collection(
        db,
        "attendanceRecords"
    );

const staffCollection =

    collection(
        db,
        "guards"
    );

const customerCollection =

    collection(
        db,
        "sites"
    );

    /* ==========================================================
   DOM ELEMENTS
========================================================== */

const staffReportType =

    document.getElementById(
        "staffReportType"
    );

const staffReportStaffGroup =

    document.getElementById(
        "staffReportStaffGroup"
    );

const staffReportCustomerGroup =

    document.getElementById(
        "staffReportCustomerGroup"
    );

const staffReportStaffSelect =

    document.getElementById(
        "staffReportStaffSelect"
    );

const staffReportCustomerSelect =

    document.getElementById(
        "staffReportCustomerSelect"
    );

const staffReportFromDate =

    document.getElementById(
        "staffReportFromDate"
    );

const staffReportToDate =

    document.getElementById(
        "staffReportToDate"
    );

const staffReportGenerateBtn =

    document.getElementById(
        "staffReportGenerateBtn"
    );

const staffReportPrintBtn =

    document.getElementById(
        "staffReportPrintBtn"
    );

const staffReportExportPdfBtn =

    document.getElementById(
        "staffReportExportPdfBtn"
    );

const staffReportExportExcelBtn =

    document.getElementById(
        "staffReportExportExcelBtn"
    );

const staffReportContainer =

    document.getElementById(
        "staffReportContainer"
    );

    /* ==========================================================
   MODULE INITIALIZATION
========================================================== */

document.addEventListener(

    "DOMContentLoaded",

    initializeStaffReports

);

/* ==========================================================
   INITIALIZE STAFF REPORTS
========================================================== */

async function initializeStaffReports() {

    try {

        await loadStaffReportStaff();

        await loadStaffReportCustomers();

        registerStaffReportEvents();

    }

    catch (error) {

        console.error(

            "Staff Reports Initialization Error:",

            error

        );

    }

}

/* ==========================================================
   REGISTER EVENTS
========================================================== */

function registerStaffReportEvents() {

    staffReportType.addEventListener(

        "change",

        handleStaffReportTypeChange

    );

    staffReportGenerateBtn.addEventListener(

        "click",

        generateStaffReport

    );

    staffReportPrintBtn.addEventListener(

        "click",

        printStaffReport

    );

    staffReportExportPdfBtn.addEventListener(

        "click",

        exportStaffReportPDF

    );

    staffReportExportExcelBtn.addEventListener(

        "click",

        exportStaffReportExcel

    );

}

/* ==========================================================
   REPORT TYPE HANDLER
========================================================== */

function handleStaffReportTypeChange() {

    const reportType =

        staffReportType.value;

    staffReportStaffGroup.classList.add(

        "hidden"

    );

    staffReportCustomerGroup.classList.add(

        "hidden"

    );

    if (reportType === "staff") {

        staffReportStaffGroup.classList.remove(

            "hidden"

        );

    }

    if (reportType === "customer") {

        staffReportCustomerGroup.classList.remove(

            "hidden"

        );

    }

}

/* ==========================================================
   LOAD STAFF
========================================================== */

async function loadStaffReportStaff() {

    try {

        const snapshot = await getDocs(

            staffCollection

        );

        staffReportStaffSelect.innerHTML = `

            <option value="">

                Select Staff

            </option>

        `;

        snapshot.forEach(document => {

            const staff = document.data();

            staffReportStaffSelect.innerHTML += `

                <option value="${staff.id}">

                    ${staff.fullName}

                </option>

            `;

        });

    }

    catch (error) {

        console.error(

            "Error loading staff:",

            error

        );

    }

}

/* ==========================================================
   LOAD CUSTOMERS
========================================================== */

async function loadStaffReportCustomers() {

    try {

        const snapshot = await getDocs(

            customerCollection

        );

        staffReportCustomerSelect.innerHTML = `

            <option value="">

                Select Customer

            </option>

        `;

        snapshot.forEach(document => {

            const customer = document.data();

            staffReportCustomerSelect.innerHTML += `

                <option value="${customer.siteId}">

                    ${customer.siteName}

                </option>

            `;

        });

    }

    catch (error) {

        console.error(

            "Error loading customers:",

            error

        );

    }

}

/* ==========================================================
   LOAD STAFF ATTENDANCE RECORDS
========================================================== */

async function loadStaffAttendanceRecords(filters = {}) {

    try {

        let constraints = [

            where(

                "recordDate",

                ">=",

                filters.fromDate

            ),

            where(

                "recordDate",

                "<=",

                filters.toDate

            ),

            orderBy(

                "recordDate",

                "asc"

            )

        ];

        if (filters.guardId) {

            constraints.push(

                where(

                    "guardId",

                    "==",

                    filters.guardId

                )

            );

        }

        if (filters.siteId) {

            constraints.push(

                where(

                    "siteId",

                    "==",

                    filters.siteId

                )

            );

        }

        const attendanceQuery = query(

            attendanceCollection,

            ...constraints

        );

        const snapshot = await getDocs(

            attendanceQuery

        );

        return snapshot.docs.map(document => ({

            id: document.id,

            ...document.data()

        }));

    }

    catch (error) {

        console.error(

            "Error loading attendance records:",

            error

        );

        return [];

    }

}

/* ==========================================================
   GROUP STAFF ATTENDANCE
========================================================== */

function groupStaffAttendance(records) {

    return records.reduce(

        (groups, record) => {

            if (

                !groups[record.guardId]

            ) {

                groups[record.guardId] = [];

            }

            groups[record.guardId].push(

                record

            );

            return groups;

        },

        {}

    );

}

/* ==========================================================
   CLEAR STAFF REPORT
========================================================== */

function clearStaffReport() {

    staffReportContainer.innerHTML = "";

}

/* ==========================================================
   SHOW LOADING
========================================================== */

function showStaffReportLoading() {

    staffReportContainer.innerHTML = `

        <div class="staff-report-empty">

            <i class="fas fa-spinner fa-spin"></i>

            <h2>

                Generating Staff Attendance Report...

            </h2>

        </div>

    `;

}

/* ==========================================================
   HIDE LOADING
========================================================== */

function hideStaffReportLoading() {

    // Reserved for future enhancements.

}

/* ==========================================================
   GENERATE STAFF REPORT
========================================================== */

async function generateStaffReport() {

    clearStaffReport();

    const reportType = staffReportType.value;

    const fromDate = staffReportFromDate.value;

    const toDate = staffReportToDate.value;

    if (!reportType) {

        alert("Please select a report type.");

        return;

    }

    if (!fromDate || !toDate) {

        alert("Please select a reporting period.");

        return;

    }

    if (new Date(fromDate) > new Date(toDate)) {

        alert("From Date cannot be greater than To Date.");

        return;

    }

    showStaffReportLoading();

    try {

        switch (reportType) {

            case "staff":

                if (!staffReportStaffSelect.value) {

                    alert("Please select a staff member.");

                    hideStaffReportLoading();

                    return;

                }

                await generateSingleStaffReport();

                break;

            case "all":

                await generateAllStaffReport();

                break;

            case "customer":

                if (!staffReportCustomerSelect.value) {

                    alert("Please select a customer.");

                    hideStaffReportLoading();

                    return;

                }

                await generateCustomerStaffReport();

                break;

        }

    }

    catch (error) {

        console.error(

            "Staff Report Error:",

            error

        );

        alert(

            "Failed to generate report."

        );

    }

    finally {

        hideStaffReportLoading();

    }

}

/* ==========================================================
   SINGLE STAFF REPORT
========================================================== */

async function generateSingleStaffReport() {

    const records = await loadStaffAttendanceRecords({

        guardId:

            staffReportStaffSelect.value,

        fromDate:

            staffReportFromDate.value,

        toDate:

            staffReportToDate.value

    });

    clearStaffReport();

    if (!records.length) {

        staffReportContainer.innerHTML = `

            <div class="staff-report-empty">

                <h2>

                    No attendance records found.

                </h2>

            </div>

        `;

        return;

    }

    const summary =

        calculateStaffReportSummary(

            records

        );

    renderStaffReport(

        records,

        summary

    );

}

/* ==========================================================
   ALL STAFF REPORT
========================================================== */

async function generateAllStaffReport() {

    const records = await loadStaffAttendanceRecords({

        fromDate:

            staffReportFromDate.value,

        toDate:

            staffReportToDate.value

    });

    clearStaffReport();

    if (!records.length) {

        staffReportContainer.innerHTML = `

            <div class="staff-report-empty">

                <h2>

                    No attendance records found.

                </h2>

            </div>

        `;

        return;

    }

    const grouped =

        groupStaffAttendance(records);

    Object.values(grouped).forEach(

        staffRecords => {

            const summary =

                calculateStaffReportSummary(

                    staffRecords

                );

            renderStaffReport(

                staffRecords,

                summary,

                true

            );

        }

    );

}

/* ==========================================================
   CUSTOMER STAFF REPORT
========================================================== */

async function generateCustomerStaffReport() {

    const records = await loadStaffAttendanceRecords({

        siteId:

            staffReportCustomerSelect.value,

        fromDate:

            staffReportFromDate.value,

        toDate:

            staffReportToDate.value

    });

    clearStaffReport();

    if (!records.length) {

        staffReportContainer.innerHTML = `

            <div class="staff-report-empty">

                <h2>

                    No attendance records found.

                </h2>

            </div>

        `;

        return;

    }

    const grouped =

        groupStaffAttendance(records);

    Object.values(grouped).forEach(

        staffRecords => {

            const summary =

                calculateStaffReportSummary(

                    staffRecords

                );

            renderStaffReport(

                staffRecords,

                summary,

                true

            );

        }

    );

}

/* ==========================================================
   CALCULATE STAFF REPORT SUMMARY
========================================================== */

function calculateStaffReportSummary(records) {

    const summary = {

        totalWorkingDays: records.length,

        presentDays: 0,

        absentDays: 0,

        lateDays: 0,

        earlyLeaveDays: 0,

        weekendDays: 0,

        publicHolidayDays: 0,

        totalWorkedHours: 0,

        totalExpectedHours: 0,

        totalBreakHours: 0,

        totalOvertimeHours: 0,

        totalShortageHours: 0,

        averageHoursPerDay: 0,

        averageAttendance: 0

    };

    let attendanceTotal = 0;

    records.forEach(record => {

        /* =========================================
           Attendance Status
        ========================================= */

        const attendanceStatus =

            String(
                record.attendanceStatus || ""
            ).toLowerCase();

        if (attendanceStatus === "present") {

            summary.presentDays++;

        }

        if (attendanceStatus === "absent") {

            summary.absentDays++;

        }

        /* =========================================
           Late
        ========================================= */

        if (Number(record.lateMinutes || 0) > 0) {

            summary.lateDays++;

        }

        /* =========================================
           Early Leave
        ========================================= */

        if (Number(record.shortageMinutes || 0) > 0) {

            summary.earlyLeaveDays++;

        }

        /* =========================================
           Hours
        ========================================= */

        summary.totalWorkedHours +=

            Number(record.totalWorkingHours || 0);

        summary.totalExpectedHours +=

            Number(record.expectedWorkingHours || 0);

        summary.totalBreakHours +=

            Number(record.lunchTakenMinutes || 0) / 60;

        summary.totalOvertimeHours +=

            Number(record.overtimeMinutes || 0) / 60;

        summary.totalShortageHours +=

            Number(record.shortageMinutes || 0) / 60;

        attendanceTotal +=

            Number(record.attendancePercentage || 0);

        /* =========================================
           Weekend
        ========================================= */

        if (record.recordDate) {

            const day =

                new Date(record.recordDate)

                .getDay();

            if (

                day === 0 ||

                day === 6

            ) {

                summary.weekendDays++;

            }

        }

        /* =========================================
           Public Holiday
        ========================================= */

        if (

            isStaffReportPublicHoliday(

                record.recordDate

            )

        ) {

            summary.publicHolidayDays++;

        }

    });

    if (summary.totalWorkingDays > 0) {

        summary.averageHoursPerDay =

            summary.totalWorkedHours /

            summary.totalWorkingDays;

        summary.averageAttendance =

            attendanceTotal /

            summary.totalWorkingDays;

    }

    return summary;

}

/* ==========================================================
   FORMAT HOURS
========================================================== */

function formatStaffReportHours(hours) {

    return Number(

        hours || 0

    ).toFixed(2) + " hrs";

}

/* ==========================================================
   FORMAT MINUTES
========================================================== */

function formatStaffReportMinutes(minutes) {

    const total =

        Number(minutes || 0);

    const hrs =

        Math.floor(total / 60);

    const mins =

        total % 60;

    return `${hrs}h ${mins}m`;

}

/* ==========================================================
   FORMAT DATE
========================================================== */

function formatStaffReportDate(date) {

    if (!date) {

        return "";

    }

    return new Date(date)

        .toLocaleDateString();

}

/* ==========================================================
   PUBLIC HOLIDAY
========================================================== */

function isStaffReportPublicHoliday(date) {

    /*
        Future Module:

        South African Public Holidays

        Will automatically detect
        public holidays.
    */

    return false;

}

/* ==========================================================
   GENERATED DATE
========================================================== */

function getStaffReportGeneratedDate() {

    return new Date()

        .toLocaleDateString();

}

/* ==========================================================
   GENERATED TIME
========================================================== */

function getStaffReportGeneratedTime() {

    return new Date()

        .toLocaleTimeString();

}

/* ==========================================================
   GENERATED BY
========================================================== */

function getStaffReportGeneratedBy() {

    if (

        auth.currentUser

    ) {

        return auth.currentUser.email;

    }

    return "System Administrator";

}

/* ==========================================================
   FORMAT NUMBER
========================================================== */

function formatStaffReportNumber(value) {

    return Number(

        value || 0

    ).toFixed(2);

}

/* ==========================================================
   RENDER STAFF REPORT
========================================================== */

function renderStaffReport(

    records,

    summary,

    pageBreak = false

) {

    const staff = records[0];

    const report =

        document.createElement("div");

    report.className =

        "staff-report-card";

    if (pageBreak) {

        report.classList.add(

            "page-break"

        );

    }

    report.innerHTML = `

        ${buildStaffReportHeader()}

        ${buildStaffReportInformation(staff)}

        ${buildStaffReportAttendanceTable(records)}

        ${buildStaffReportSummary(summary)}

        ${buildStaffReportSignatureSection()}

        ${buildStaffReportGeneratedInformation()}

    `;

    staffReportContainer.appendChild(

        report

    );

}

/* ==========================================================
   REPORT HEADER
========================================================== */

function buildStaffReportHeader() {

    return `

        <section class="staff-report-header-section">

            <div class="staff-report-company-header">

                <img

                    src="assets/images/logo.png"

                    class="staff-report-logo"

                    alt="Company Logo">

                <div>

                    <h2>

                        NEWLOOK SECURITY SYSTEM

                    </h2>

                    <h3>

                        STAFF ATTENDANCE REPORT

                    </h3>

                    <p>

                        Reporting Period

                    </p>

                    <p>

                        ${formatStaffReportDate(

                            staffReportFromDate.value

                        )}

                        -

                        ${formatStaffReportDate(

                            staffReportToDate.value

                        )}

                    </p>

                </div>

            </div>

        </section>

    `;

}

/* ==========================================================
   STAFF INFORMATION
========================================================== */

function buildStaffReportInformation(staff) {

    return `

        <section class="staff-information">

            <div class="info-card">

                <label>

                    Employee ID

                </label>

                <span>

                    ${staff.employeeID}

                </span>

            </div>

            <div class="info-card">

                <label>

                    Staff Name

                </label>

                <span>

                    ${staff.guardName}

                </span>

            </div>

            <div class="info-card">

                <label>

                    Department

                </label>

                <span>

                    ${staff.department}

                </span>

            </div>

            <div class="info-card">

                <label>

                    Site

                </label>

                <span>

                    ${staff.siteName}

                </span>

            </div>

            <div class="info-card">

                <label>

                    Shift

                </label>

                <span>

                    ${staff.assignedShift}

                </span>

            </div>

        </section>

    `;

}

/* ==========================================================
   ATTENDANCE TABLE
========================================================== */

function buildStaffReportAttendanceTable(records) {

    let rows = "";

    records.forEach(record => {

        rows += `

            <tr>

                <td>${formatStaffReportDate(record.recordDate)}</td>

                <td>${record.firstClockIn || "-"}</td>

                <td>${record.lastClockOut || "-"}</td>

                <td>${record.scheduledStart}</td>

                <td>${record.scheduledEnd}</td>

                <td>${formatStaffReportHours(record.totalWorkingHours)}</td>

                <td>${formatStaffReportHours(record.expectedWorkingHours)}</td>

                <td>${formatStaffReportMinutes(record.lunchTakenMinutes)}</td>

                <td>${formatStaffReportMinutes(record.overtimeMinutes)}</td>

                <td>${record.lateMinutes}</td>

                <td>${formatStaffReportMinutes(record.shortageMinutes)}</td>

                <td>${record.attendancePercentage}%</td>

                <td>${record.attendanceStatus}</td>

                <td>${record.workStatus}</td>

                <td>${record.siteName}</td>

            </tr>

        `;

    });

    return `

        <table class="report-table">

            <thead>

                <tr>

                    <th>Date</th>

                    <th>Clock In</th>

                    <th>Clock Out</th>

                    <th>Scheduled In</th>

                    <th>Scheduled Out</th>

                    <th>Worked</th>

                    <th>Expected</th>

                    <th>Break</th>

                    <th>Overtime</th>

                    <th>Late</th>

                    <th>Shortage</th>

                    <th>Attendance</th>

                    <th>Status</th>

                    <th>Work Status</th>

                    <th>Site</th>

                </tr>

            </thead>

            <tbody>

                ${rows}

            </tbody>

        </table>

    `;

}

/* ==========================================================
   STAFF REPORT SUMMARY
========================================================== */

function buildStaffReportSummary(summary) {

    return `

        <section class="summary-section">

            <h3>

                Staff Attendance Summary

            </h3>

            <div class="summary-grid">

                <div class="summary-card">

                    <h4>Total Working Days</h4>

                    <p>${summary.totalWorkingDays}</p>

                </div>

                <div class="summary-card">

                    <h4>Present Days</h4>

                    <p>${summary.presentDays}</p>

                </div>

                <div class="summary-card">

                    <h4>Absent Days</h4>

                    <p>${summary.absentDays}</p>

                </div>

                <div class="summary-card">

                    <h4>Late Days</h4>

                    <p>${summary.lateDays}</p>

                </div>

                <div class="summary-card">

                    <h4>Early Leave Days</h4>

                    <p>${summary.earlyLeaveDays}</p>

                </div>

                <div class="summary-card">

                    <h4>Total Worked Hours</h4>

                    <p>

                        ${formatStaffReportHours(

                            summary.totalWorkedHours

                        )}

                    </p>

                </div>

                <div class="summary-card">

                    <h4>Total Expected Hours</h4>

                    <p>

                        ${formatStaffReportHours(

                            summary.totalExpectedHours

                        )}

                    </p>

                </div>

                <div class="summary-card">

                    <h4>Total Break Hours</h4>

                    <p>

                        ${formatStaffReportHours(

                            summary.totalBreakHours

                        )}

                    </p>

                </div>

                <div class="summary-card">

                    <h4>Total Overtime</h4>

                    <p>

                        ${formatStaffReportHours(

                            summary.totalOvertimeHours

                        )}

                    </p>

                </div>

                <div class="summary-card">

                    <h4>Total Shortage</h4>

                    <p>

                        ${formatStaffReportHours(

                            summary.totalShortageHours

                        )}

                    </p>

                </div>

                <div class="summary-card">

                    <h4>Weekend Days</h4>

                    <p>${summary.weekendDays}</p>

                </div>

                <div class="summary-card">

                    <h4>Public Holidays</h4>

                    <p>${summary.publicHolidayDays}</p>

                </div>

                <div class="summary-card">

                    <h4>Average Hours / Day</h4>

                    <p>

                        ${formatStaffReportHours(

                            summary.averageHoursPerDay

                        )}

                    </p>

                </div>

                <div class="summary-card">

                    <h4>Average Attendance</h4>

                    <p>

                        ${summary.averageAttendance.toFixed(1)}%

                    </p>

                </div>

            </div>

        </section>

    `;

}

/* ==========================================================
   STAFF REPORT SIGNATURES
========================================================== */

function buildStaffReportSignatureSection() {

    return `

        <section class="signature-section">

            <div class="signature-box">

                <div class="signature-line"></div>

                <strong>

                    Supervisor Signature

                </strong>

            </div>

            <div class="signature-box">

                <div class="signature-line"></div>

                <strong>

                    Manager Signature

                </strong>

            </div>

        </section>

    `;

}

/* ==========================================================
   GENERATED INFORMATION
========================================================== */

function buildStaffReportGeneratedInformation() {

    return `

        <section class="generated-information">

            <p>

                <strong>

                    Generated By:

                </strong>

                ${getStaffReportGeneratedBy()}

            </p>

            <p>

                <strong>

                    Date Generated:

                </strong>

                ${getStaffReportGeneratedDate()}

            </p>

            <p>

                <strong>

                    Time Generated:

                </strong>

                ${getStaffReportGeneratedTime()}

            </p>

        </section>

    `;

}

/* ==========================================================
   PRINT STAFF REPORT
========================================================== */

function printStaffReport() {

    if (!staffReportContainer.children.length) {

        alert(

            "Please generate a report first."

        );

        return;

    }

    window.print();

}

/* ==========================================================
   EXPORT STAFF REPORT PDF
========================================================== */

async function exportStaffReportPDF() {

    if (!staffReportContainer.children.length) {

        alert(

            "Please generate a report first."

        );

        return;

    }

    const options = {

        margin: 0.3,

        filename:

            "Staff_Attendance_Report.pdf",

        image: {

            type: "jpeg",

            quality: 1

        },

        html2canvas: {

            scale: 2,

            useCORS: true

        },

        jsPDF: {

            unit: "in",

            format: "a4",

            orientation: "portrait"

        },

        pagebreak: {

            mode: [

                "css",

                "legacy"

            ]

        }

    };

    await html2pdf()

        .set(options)

        .from(

            staffReportContainer

        )

        .save();

}

/* ==========================================================
   EXPORT STAFF REPORT EXCEL
========================================================== */

async function exportStaffReportExcel() {

    if (!staffReportContainer.children.length) {

        alert(

            "Please generate a report first."

        );

        return;

    }

    let attendanceRecords = [];

    const reportType =

        staffReportType.value;

    if (reportType === "staff") {

        attendanceRecords =

            await loadStaffAttendanceRecords({

                guardId:

                    staffReportStaffSelect.value,

                fromDate:

                    staffReportFromDate.value,

                toDate:

                    staffReportToDate.value

            });

    }

    else if (

        reportType === "customer"

    ) {

        attendanceRecords =

            await loadStaffAttendanceRecords({

                siteId:

                    staffReportCustomerSelect.value,

                fromDate:

                    staffReportFromDate.value,

                toDate:

                    staffReportToDate.value

            });

    }

    else {

        attendanceRecords =

            await loadStaffAttendanceRecords({

                fromDate:

                    staffReportFromDate.value,

                toDate:

                    staffReportToDate.value

            });

    }

    const excelRows =

        attendanceRecords.map(record => ({

            Date:

                record.recordDate,

            EmployeeID:

                record.employeeID,

            StaffName:

                record.guardName,

            Department:

                record.department,

            Site:

                record.siteName,

            Shift:

                record.assignedShift,

            ScheduledStart:

                record.scheduledStart,

            ScheduledEnd:

                record.scheduledEnd,

            ClockIn:

                record.firstClockIn,

            ClockOut:

                record.lastClockOut,

            WorkedHours:

                record.totalWorkingHours,

            ExpectedHours:

                record.expectedWorkingHours,

            BreakMinutes:

                record.lunchTakenMinutes,

            LateMinutes:

                record.lateMinutes,

            OvertimeMinutes:

                record.overtimeMinutes,

            ShortageMinutes:

                record.shortageMinutes,

            AttendanceStatus:

                record.attendanceStatus,

            WorkStatus:

                record.workStatus,

            AttendancePercentage:

                record.attendancePercentage,

            PayrollReady:

                record.payrollReady

        }));

    const workbook =

        XLSX.utils.book_new();

    const worksheet =

        XLSX.utils.json_to_sheet(

            excelRows

        );

    XLSX.utils.book_append_sheet(

        workbook,

        worksheet,

        "Staff Attendance"

    );

    XLSX.writeFile(

        workbook,

        "Staff_Attendance_Report.xlsx"

    );

}