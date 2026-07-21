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

console.log("NEWLOOK ADMIN READY");

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

    pdf.text("NEWLOOK SECURITY SYSTEM", 14, 15);

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

    pdf.save("NEWLOOK_Guards_Report.pdf");

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

        "NEWLOOK_Guards_Report.xlsx"

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

        width: 250,

        height: 250

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
        "NEWLOOK_CHECKPOINT_QR.png";

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

const patrolTableBody =
document.getElementById("patrolTableBody");

const patrolSearch = document.getElementById("patrolSearch");
const patrolSiteFilter = document.getElementById("patrolSiteFilter");
const patrolDateFilter = document.getElementById("patrolDateFilter");
const clearPatrolFilter = document.getElementById("clearPatrolFilter");

const totalPatrols = document.getElementById("totalPatrols");
const guardsOnPatrol = document.getElementById("guardsOnPatrol");
const missedPatrols = document.getElementById("missedPatrols");
const patrolCompliance = document.getElementById("patrolCompliance");
let patrolData = [];
let siteList = [];
let guardCompliance = {};
let guardStatus = {};

function loadPatrols(){

    const q = query(

        collection(db,"patrols"),

        orderBy("scanTime","desc")

    );

    onSnapshot(q,(snapshot)=>{

        patrolData = [];

        snapshot.forEach(doc=>{

            patrolData.push({

                id:doc.id,

                ...doc.data()

            });

        });

        populateSiteFilter();

        renderPatrolTable(patrolData);

        loadPatrolStatistics(patrolData);

    });

}

async function loadPatrolStatistics(data){

    totalPatrols.textContent = data.length;

    const guards = new Set();

    data.forEach(p => guards.add(p.guardId));

    guardsOnPatrol.textContent = guards.size;

    await loadPatrolCompliance();

    await loadGuardPatrolStatus();

    renderPatrolTable(data);

}

loadPatrols();

function renderPatrolTable(data){

    patrolTableBody.innerHTML = "";

    data.forEach((patrol) => {

        const stats = guardCompliance[patrol.guardId] || {
            completed: 0,
            expected: 0,
            missed: 0,
            compliance: 0
        };

        const patrolStatus = guardStatus[patrol.guardId] || "Off Duty";

        let statusClass = "secondary";

        if (patrolStatus === "On Schedule") {
            statusClass = "active";
        } else if (patrolStatus === "Patrol Due") {
            statusClass = "warning";
        } else if (patrolStatus === "Overdue") {
            statusClass = "danger";
        }

        patrolTableBody.innerHTML += `

            <tr onclick="viewPatrol('${patrol.id}')">

                <td>${
                    patrol.createdAt
                        ? patrol.createdAt.toDate().toLocaleDateString()
                        : "-"
                }</td>

                <td>${patrol.guardName || "-"}</td>

                <td>${patrol.siteName || "-"}</td>

                <td>${patrol.checkpointName || "-"}</td>

                <td>${patrol.location || "-"}</td>

                <td>${
                    patrol.scanTime
                        ? patrol.scanTime.toDate().toLocaleTimeString()
                        : "-"
                }</td>

                <td>${stats.completed}</td>

                <td>${stats.expected}</td>

                <td>${stats.missed}</td>

                <td>${stats.compliance.toFixed(1)}%</td>

                <td>
                    <span class="status ${statusClass}">
                        ${patrolStatus}
                    </span>
                </td>

            </tr>

        `;

    });

}
function populateSiteFilter(){

    const sites=[

        ...new Set(

            patrolData.map(p=>p.siteName)

        )

    ];

    patrolSiteFilter.innerHTML=

        `<option value="">All Sites</option>`;

    sites.forEach(site=>{

        patrolSiteFilter.innerHTML+=`

            <option value="${site}">

                ${site}

            </option>

        `;

    });

}

patrolSearch.addEventListener("input",filterPatrols);
patrolSiteFilter.addEventListener("change",filterPatrols);
patrolDateFilter.addEventListener("change",filterPatrols);

function filterPatrols(){

    let filtered=[...patrolData];

    const search=
        patrolSearch.value.toLowerCase();

    const site=
        patrolSiteFilter.value;

    const date=
        patrolDateFilter.value;

    if(search){

        filtered=filtered.filter(p=>

            p.guardName
            .toLowerCase()
            .includes(search)

        );

    }

    if(site){

        filtered=filtered.filter(p=>

            p.siteName===site

        );

    }

    if(date){

        filtered=filtered.filter(p=>{

            if(!p.createdAt) return false;

            return p.createdAt
                .toDate()
                .toISOString()
                .slice(0,10)===date;

        });

    }

    renderPatrolTable(filtered);

    loadPatrolStatistics(filtered);

}

clearPatrolFilter.addEventListener("click",()=>{

    patrolSearch.value="";

    patrolSiteFilter.value="";

    patrolDateFilter.value="";

    renderPatrolTable(patrolData);

    loadPatrolStatistics(patrolData);

});

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

    const stats = guardCompliance[patrol.guardId] || {

    completed: 0,

    expected: 0,

    missed: 0,

    compliance: 0

 };

 const status = guardStatus[patrol.guardId] || "Off Duty";

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
                <th>Location</th>
                <td>${patrol.location}</td>
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
                <td>${
                    patrol.scanTime
                    ? patrol.scanTime.toDate().toLocaleString()
                    : "-"
                }</td>
            </tr>

            <tr>
              <th>Completed Patrols</th>
              <td>${stats.completed}</td>
           </tr>

            <tr>
             <th>Expected Patrols</th>
             <td>${stats.expected}</td>
            </tr>

            <tr>
              <th>Missed Patrols</th>
              <td>${stats.missed}</td>
            </tr>

            <tr>
              <th>Compliance</th>
              <td>${stats.compliance.toFixed(1)}%</td>
            </tr>

            <tr>
              <th>Status</th>
              <td>${status}</td>
            </tr>

        </table>

    `;

    patrolModal.style.display="block";

}

closePatrolModal.onclick = () => {

    patrolModal.style.display = "none";

};

window.addEventListener("click", (event)=>{

    if(event.target===patrolModal){

        patrolModal.style.display="none";

    }

});

async function loadPatrolCompliance(){

    const today = getTodayDate();

    const shiftSnapshot = await getDocs(
        query(
            collection(db,"shiftRecords"),
            where("date","==",today)
        )
    );

    let expected = 0;
    let completed = 0;
    let missed = 0;

    for(const docSnap of shiftSnapshot.docs){

        const record = docSnap.data();

        completed += Number(record.patrolCount || 0);

        const shiftQuery = await getDocs(

            query(

                collection(db,"shifts"),

                where("shiftId","==",record.shiftId)

            )

        );

        if(shiftQuery.empty) continue;

        const shift = shiftQuery.docs[0].data();

        const shiftMinutes =
            getMinutesBetween(
                shift.startTime,
                shift.endTime
            );

        const expectedPatrols =
            Math.floor(

                shiftMinutes /

                Number(shift.patrolInterval)

            );

           expected += expectedPatrols;

        const completedPatrols =
             Number(record.patrolCount || 0);

        const missedPatrolsCount =
               Math.max(
                 0,
               expectedPatrols - completedPatrols
        );

        const compliance =
             expectedPatrols === 0
              ? 100
         : (
            completedPatrols /
            expectedPatrols
          ) * 100;

          guardCompliance[
          record.guardId
        ] = {

          completed: completedPatrols,

         expected: expectedPatrols,

         missed: missedPatrolsCount,

          compliance

        };

    }

    missed = Math.max(0, expected - completed);

    const compliance =
        expected === 0

        ? 100

        : ((completed / expected) * 100);

    missedPatrols.textContent = missed;

    patrolCompliance.textContent =
        compliance.toFixed(1) + "%";

}

function getMinutesBetween(start,end){

    const [sh, sm] = start.split(":").map(Number);

    const [eh, em] = end.split(":").map(Number);

    let startMinutes = sh * 60 + sm;

    let endMinutes = eh * 60 + em;

    if(endMinutes < startMinutes){

        endMinutes += 24 * 60;

    }

    return endMinutes - startMinutes;

}

async function loadGuardPatrolStatus(){

    const today = getTodayDate();

    const records = await getDocs(

        query(

            collection(db,"shiftRecords"),

            where("date","==",today)

        )

    );

    guardStatus = {};

    for(const docSnap of records.docs){

        const record = docSnap.data();

        const shiftQuery = await getDocs(

            query(

                collection(db,"shifts"),

                where("shiftId","==",record.shiftId)

            )

        );

        if(shiftQuery.empty) continue;

        const shift = shiftQuery.docs[0].data();

        const interval =
            Number(shift.patrolInterval);

        const grace =
            Number(shift.patrolGrace || 0);

        let status = "On Schedule";

        if(record.lastPatrolTime){

            const last =
                record.lastPatrolTime.toDate();

            const elapsed =
                Math.floor(

                    (Date.now() -

                    last.getTime())

                    /60000

                );

            if(elapsed >= interval + grace){

                status = "Overdue";

            }

            else if(elapsed >= interval){

                status = "Patrol Due";

            }

        }

        guardStatus[
            record.guardId
        ] = status;

    }
 
}

// EXCEL

const exportPatrolExcel =
document.getElementById("exportPatrolExcel");

exportPatrolExcel.addEventListener("click",exportPatrolsExcel);

function exportPatrolsExcel(){

    const table =
        document.querySelector("#patrols table");

    const workbook =
        XLSX.utils.table_to_book(
            table,
            {
                sheet:"Patrol Report"
            }
        );

    const today =
        new Date()
        .toISOString()
        .slice(0,10);

    XLSX.writeFile(

        workbook,

        `Patrol_Report_${today}.xlsx`

    );

}

// PDF

const exportPatrolPDF =
document.getElementById("exportPatrolPDF");

exportPatrolPDF.addEventListener("click",exportPatrolsPDF);

async function exportPatrolsPDF(){

    const { jsPDF } = window.jspdf;

    const doc = new jsPDF();

    doc.setFontSize(18);

    doc.text(
        "NEWLOOK SECURITY SYSTEM",
        14,
        15
    );

    doc.setFontSize(12);

    doc.text(
        "Patrol Monitoring Report",
        14,
        25
    );

    doc.text(
        "Generated: " +
        new Date().toLocaleString(),
        14,
        33
    );

    const rows=[];

    patrolData.forEach(p=>{

        const stats =
            guardCompliance[p.guardId] || {};

        rows.push([

            p.createdAt
            ? p.createdAt.toDate().toLocaleDateString()
            : "-",

            p.guardName,

            p.employeeID,

            p.siteName,

            p.checkpointName,

            p.location,

            p.scanTime
            ? p.scanTime.toDate().toLocaleTimeString()
            : "-",

            stats.completed || 0,

            stats.expected || 0,

            (stats.compliance || 0).toFixed(1)+"%",

            guardStatus[p.guardId] || "Off Duty"

        ]);

    });

    doc.autoTable({

        startY:40,

        head:[[
            "Date",
            "Guard",
            "Employee ID",
            "Site",
            "Checkpoint",
            "Location",
            "Scan Time",
            "Completed",
            "Expected",
            "Compliance",
            "Status"
        ]],

        body:rows

    });

    doc.save(

        "Patrol_Report.pdf"

    );

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
        "NEWLOOK SECURITY SYSTEM",
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

// --------------------------------------------LIVE ATTENDANCE----------------------------------------------------
const attendanceTableBody =
document.getElementById("attendanceTableBody");
console.log("attendanceTableBody =", attendanceTableBody);

const attendanceEmployee =
document.getElementById("attendanceEmployee");

const attendanceDepartment =
document.getElementById("attendanceDepartment");

const attendanceSite =
document.getElementById("attendanceSite");

const attendanceShift =
document.getElementById("attendanceShift");

const attendanceStatus =
document.getElementById("attendanceStatus");

const attendanceReportBody =
document.getElementById("attendanceReportBody");

const attendanceDetailsModal =
document.getElementById("attendanceDetailsModal");

const attendanceDetailsContent =
document.getElementById("attendanceDetailsContent");

const closeAttendanceDetails =
document.getElementById("closeAttendanceDetails");

const attendancePdfBtn =
document.getElementById("attendancePdfBtn");

const attendanceExcelBtn =
document.getElementById("attendanceExcelBtn");

const totalPresentCard =
document.getElementById("totalPresentCard");

const totalLateCard =
document.getElementById("totalLateCard");

const totalOvertimeCard =
document.getElementById("totalOvertimeCard");

const completedShiftCard =
document.getElementById("completedShiftCard");

const attendancePercentageCard =
document.getElementById("attendancePercentageCard");

const attendanceDate =
document.getElementById("attendanceDate");

const attendancePeriod =
document.getElementById("attendancePeriod");

const attendanceFrom =
document.getElementById("attendanceFrom");

const attendanceTo =
document.getElementById("attendanceTo");

attendanceEmployee.addEventListener("change", filterAttendanceReports);

attendanceDepartment.addEventListener("change", filterAttendanceReports);

attendanceSite.addEventListener("change", filterAttendanceReports);

attendanceShift.addEventListener("change", filterAttendanceReports);

attendanceStatus.addEventListener("change", filterAttendanceReports);

attendanceDate.addEventListener("change", filterAttendanceReports);

attendancePeriod.addEventListener("change", filterAttendanceReports);

attendanceFrom.addEventListener("change", filterAttendanceReports);

attendanceTo.addEventListener("change", filterAttendanceReports);

loadLiveAttendance();

loadAttendanceReports();
let liveAttendance = [];
//====================================================
// ATTENDANCE REPORTS
//====================================================

let attendanceReports = [];

let filteredAttendanceReports = [];

function loadLiveAttendance(){

    const q = query(

        collection(db,"attendance"),

        orderBy("timestamp","desc")

    );



    onSnapshot(q,(snapshot)=>{

        liveAttendance = [];



        snapshot.forEach(doc=>{

            liveAttendance.push({

                id:doc.id,

                ...doc.data()

            });

        });



        renderLiveAttendance();

        loadLiveAttendanceSummary();

    });

}

function getLatestAttendance(records){

    const latest = {};



    records.forEach(record=>{

        latest[record.employeeID] = record;

    });



    return Object.values(latest);

}

function renderLiveAttendance(){

    if(!attendanceTableBody){

        console.error("attendanceTableBody not found.");

        return;

    }

    const data = getLatestAttendance(liveAttendance);

    attendanceTableBody.innerHTML = "";

    data.forEach(record=>{

        const status =
        record.action === "IN"
        ? "ON DUTY"
        : "OFF DUTY";

        const badge =
        record.action === "IN"
        ? "status-active"
        : "status-off";

        attendanceTableBody.innerHTML += `

        <tr>

            <td>${record.employeeID}</td>

            <td>${record.fullName}</td>

            <td>${record.department}</td>

            <td>${record.role || "-"}</td>

            <td>${record.siteName}</td>

            <td>
                <span class="${badge}">
                    ${status}
                </span>
            </td>

            <td>

                ${
                record.timestamp
                ?
                record.timestamp.toDate().toLocaleTimeString()
                :
                "-"
                }

            </td>

        </tr>

        `;

    });

}
function loadLiveAttendanceSummary(){

    const latest = getLatestAttendance(liveAttendance);

    let present = 0;

    let offDuty = 0;

    latest.forEach(record=>{

        if(record.action==="IN"){

            present++;

        }else{

            offDuty++;

        }

    });

    console.log(
        "Present:",
        present,
        "Off Duty:",
        offDuty
    );

}

loadLiveAttendanceSummary();

function loadAttendanceReports(){

    const q = query(

        collection(db,"shiftRecords"),

        orderBy("recordDate","desc")

    );



    onSnapshot(q,(snapshot)=>{

        attendanceReports = [];



        snapshot.forEach(doc=>{

            attendanceReports.push({

                id:doc.id,

                ...doc.data()

            });

        });


 
        loadAttendanceFilters();

        filterAttendanceReports();

        loadAttendanceSummaryCards();

    });

}

function filterAttendanceReports(){

    let filtered = [...attendanceReports];



    const employee =

    attendanceEmployee.value;



    const department =

    attendanceDepartment.value;



    const site =

    attendanceSite.value;



    const shift =

    attendanceShift.value;



    const status =

    attendanceStatus.value;



    if(employee!=="all"){

        filtered = filtered.filter(

            r=>r.employeeID===employee

        );

    }



    if(department!=="all"){

        filtered = filtered.filter(

            r=>r.department===department

        );

    }



    if(site!=="all"){

        filtered = filtered.filter(

            r=>r.siteId===site

        );

    }



    if(shift!=="all"){

        filtered = filtered.filter(

            r=>r.assignedShift===shift

        );

    }



    if(status!=="all"){

        filtered = filtered.filter(

            r=>r.attendanceStatus===status

        );

    }



    filteredAttendanceReports = filtered;

    renderAttendanceReports(filtered);
}

function renderAttendanceReports(records){

    attendanceReportBody.innerHTML="";



    records.forEach(record=>{

        attendanceReportBody.innerHTML += `

        <tr>

        <td>${record.employeeID}</td>

        <td>${record.guardName}</td>

        <td>${record.department}</td>

        <td>${record.siteName}</td>

        <td>${record.assignedShift}</td>

        <td>${record.attendanceStatus}</td>

        <td>

        ${record.firstClockIn ?

        record.firstClockIn.toDate()

        .toLocaleTimeString()

        : ""}

        </td>

        <td>

        ${record.lastClockOut ?

        record.lastClockOut.toDate()

        .toLocaleTimeString()

        : ""}

        </td>

        <td>

        ${record.lateMinutes}

        </td>

        <td>

        ${record.totalWorkingHours}

        </td>

        <td>

        ${record.expectedWorkingHours}

        </td>

        <td>

        ${record.overtimeMinutes}

        </td>

        <td>

        ${record.attendancePercentage}%

        </td>

        <td>

        <button

        onclick="viewAttendanceRecord('${record.id}')">

        View

        </button>

        </td>

        </tr>

        `;

    });

}

//====================================================
// MAKE FUNCTIONS AVAILABLE TO HTML
//====================================================

window.viewAttendanceRecord = viewAttendanceRecord;
window.downloadAttendancePDF = downloadAttendancePDF;
window.downloadAttendanceExcel = downloadAttendanceExcel;

function loadAttendanceSummaryCards(){

    const today =

    new Date()

    .toISOString()

    .split("T")[0];



    const todayRecords =

    attendanceReports.filter(

        r=>r.recordDate===today

    );



    totalPresentCard.textContent =

    todayRecords.length;



    totalLateCard.textContent =

    todayRecords.filter(

        r=>r.lateMinutes>0

    ).length;



    totalOvertimeCard.textContent =

    todayRecords.filter(

        r=>r.overtimeMinutes>0

    ).length;



    completedShiftCard.textContent =

    todayRecords.filter(

        r=>r.workStatus==="Completed Shift"

    ).length;



    const average =

    todayRecords.reduce(

        (sum,r)=>

        sum+

        Number(

            r.attendancePercentage

        ),

        0

    );



    attendancePercentageCard.textContent =

    todayRecords.length

    ?

    (

        average/

        todayRecords.length

    ).toFixed(1)+"%"

    :

    "0%";

}

function viewAttendanceRecord(recordID){

    const record =

    attendanceReports.find(

        r=>r.id===recordID

    );



    if(!record){

        return;

    }



    attendanceDetailsContent.innerHTML = `

    <table class="details-table">

        <tr>

            <td>Employee No</td>

            <td>${record.employeeID}</td>

        </tr>

        <tr>

            <td>Name</td>

            <td>${record.guardName}</td>

        </tr>

        <tr>

            <td>Department</td>

            <td>${record.department}</td>

        </tr>

        <tr>

            <td>Site</td>

            <td>${record.siteName}</td>

        </tr>

        <tr>

            <td>Shift</td>

            <td>${record.assignedShift}</td>

        </tr>

        <tr>

            <td>Scheduled Start</td>

            <td>${record.scheduledStart}</td>

        </tr>

        <tr>

            <td>Scheduled End</td>

            <td>${record.scheduledEnd}</td>

        </tr>

        <tr>

            <td>Attendance Status</td>

            <td>${record.attendanceStatus}</td>

        </tr>

        <tr>

            <td>Late Minutes</td>

            <td>${record.lateMinutes}</td>

        </tr>

        <tr>

            <td>Total Hours</td>

            <td>${record.totalWorkingHours}</td>

        </tr>

        <tr>

            <td>Expected Hours</td>

            <td>${record.expectedWorkingHours}</td>

        </tr>

        <tr>

            <td>Overtime</td>

            <td>${record.overtimeMinutes}</td>

        </tr>

        <tr>

            <td>Shortage</td>

            <td>${record.shortageMinutes}</td>

        </tr>

        <tr>

            <td>Attendance %</td>

            <td>${record.attendancePercentage}%</td>

        </tr>

    </table>

    `;

    let periodsHTML = "";

 if(record.attendancePeriods){

 record.attendancePeriods.forEach(period=>{


    periodsHTML += `

    <tr>

        <td>

            ${new Date(period.clockIn).toLocaleTimeString()}

        </td>

        <td>

            ${new Date(period.clockOut).toLocaleTimeString()}

        </td>

        <td>

            ${period.minutes} min

        </td>

    </tr>

    `;

    attendanceDetailsContent.innerHTML += `

 <h3>Working Periods</h3>

 <table class="details-table">

 <tr>

 <th>Clock IN</th>

 <th>Clock OUT</th>

 <th>Minutes</th>

 </tr>

 ${periodsHTML}

 </table>

 `;

 });}



    attendanceDetailsModal.style.display="flex";

}

closeAttendanceDetails.onclick = ()=>{

    attendanceDetailsModal.style.display="none";

};

window.addEventListener("click",(e)=>{

    if(e.target===attendanceDetailsModal){

        attendanceDetailsModal.style.display="none";

    }

});

function calculateAttendancePercentage(record){

    if(record.expectedWorkingMinutes <= 0){

        return 0;

    }

    return (

        (record.totalWorkingMinutes /

        record.expectedWorkingMinutes)

        *100

    ).toFixed(1);

}

function calculatePayrollSummary(records){

    let totalWorked = 0;

    let totalExpected = 0;

    let totalOvertime = 0;

    let totalLate = 0;

    let totalShortage = 0;

    records.forEach(record=>{

        totalWorked +=

        Number(record.totalWorkingMinutes);

        totalExpected +=

        Number(record.expectedWorkingMinutes);

        totalOvertime +=

        Number(record.overtimeMinutes);

        totalLate +=

        Number(record.lateMinutes);

        totalShortage +=

        Number(record.shortageMinutes);

    });

    return{

        workedHours:

        (totalWorked/60).toFixed(2),

        expectedHours:

        (totalExpected/60).toFixed(2),

        overtimeHours:

        (totalOvertime/60).toFixed(2),

        lateMinutes:

        totalLate,

        shortageMinutes:

        totalShortage

    };

}

async function downloadAttendancePDF(){

    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF("landscape");

    const rows = [];

    filteredAttendanceReports.forEach(record=>{

        rows.push([

            record.employeeID,

            record.guardName,

            record.department,

            record.siteName,

            record.assignedShift,

            record.attendanceStatus,

            record.totalWorkingHours,

            record.expectedWorkingHours,

            record.overtimeMinutes,

            record.lateMinutes,

            record.attendancePercentage+"%"

        ]);

    });

    pdf.setFontSize(18);

    pdf.text(

        "NEWLOOK SECURITY SYSTEM",

        14,

        18

    );

    pdf.setFontSize(13);

    pdf.text(

        "Attendance Report",

        14,

        28

    );

    pdf.autoTable({

        startY:40,

        head:[[

            "Employee",

            "Name",

            "Department",

            "Site",

            "Shift",

            "Status",

            "Worked",

            "Expected",

            "Overtime",

            "Late",

            "%"

        ]],

        body:rows

    });

    pdf.save(

        "Attendance_Report.pdf"

    );

}

attendancePdfBtn.onclick = ()=>{

    downloadAttendancePDF();

};

function downloadAttendanceExcel(){

    const data = filteredAttendanceReports.map(record=>({

        EmployeeID: record.employeeID,

        Name: record.guardName,

        Department: record.department,

        Site: record.siteName,

        Shift: record.assignedShift,

        Status: record.attendanceStatus,

        WorkedHours: record.totalWorkingHours,

        ExpectedHours: record.expectedWorkingHours,

        AttendancePercentage: record.attendancePercentage,

        OvertimeMinutes: record.overtimeMinutes,

        LateMinutes: record.lateMinutes,

        ShortageMinutes: record.shortageMinutes

    }));

    const worksheet = XLSX.utils.json_to_sheet(data);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(

        workbook,

        worksheet,

        "Attendance"

    );

    XLSX.writeFile(

        workbook,

        "Attendance_Report.xlsx"

    );

}

attendanceExcelBtn.onclick = ()=>{

    downloadAttendanceExcel();

};

//====================================================
// LOAD ATTENDANCE FILTERS
//====================================================

async function loadAttendanceFilters(){

    const employeeSet = new Set();
    const departmentSet = new Set();
    const siteSet = new Set();
    const shiftSet = new Set();

    attendanceReports.forEach(record=>{

        if(record.employeeID){

            employeeSet.add(
                JSON.stringify({
                    id:record.employeeID,
                    name:record.guardName
                })
            );

        }

        if(record.department){

            departmentSet.add(record.department);

        }

        if(record.siteId){

            siteSet.add(
                JSON.stringify({
                    id:record.siteId,
                    name:record.siteName
                })
            );

        }

        if(record.assignedShift){

            shiftSet.add(record.assignedShift);

        }

    });

    attendanceEmployee.innerHTML =
    `<option value="all">All Employees</option>`;

    attendanceDepartment.innerHTML =
    `<option value="all">All Departments</option>`;

    attendanceSite.innerHTML =
    `<option value="all">All Sites</option>`;

    attendanceShift.innerHTML =
    `<option value="all">All Shifts</option>`;

    [...employeeSet].forEach(item=>{

        const employee = JSON.parse(item);

        attendanceEmployee.innerHTML += `
            <option value="${employee.id}">
                ${employee.name}
            </option>
        `;

    });

    [...departmentSet].sort().forEach(department=>{

        attendanceDepartment.innerHTML += `
            <option value="${department}">
                ${department}
            </option>
        `;

    });

    [...siteSet].forEach(item=>{

        const site = JSON.parse(item);

        attendanceSite.innerHTML += `
            <option value="${site.id}">
                ${site.name}
            </option>
        `;

    });

    [...shiftSet].sort().forEach(shift=>{

        attendanceShift.innerHTML += `
            <option value="${shift}">
                ${shift}
            </option>
        `;

    });

}