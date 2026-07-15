import { auth, db } from "Js/firebase.js";

import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");

// ================= LOGIN =================

if (loginForm) {

    loginForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        message.style.color = "red";
        message.textContent = "";

        try {

            const userCredential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            const uid = userCredential.user.uid;

           const adminDoc = await getDoc(doc(db, "admins", uid));

if (!adminDoc.exists()) {

    await signOut(auth);

    message.textContent = "Administrator record not found.";

    return;

}

const admin = adminDoc.data();

console.log("Admin document:", admin);
console.log("Status:", admin.status);

            if (admin.status !== "Active") {

                await signOut(auth);

                message.textContent = "Your account has been suspended.";

                return;

            }

            if (admin.role === "admin") {

                window.location.href = "admin.html";

            } else {

                window.location.href = "admin.html";

            }

        }

        catch (error) {

            message.textContent = error.message;

        }

    });

}

// ================= LOGOUT =================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", async () => {

        await signOut(auth);

        window.location.href = "login.html";

    });

}

// ================= AUTH LISTENER =================

onAuthStateChanged(auth, async (user) => {

    const page = location.pathname.split("/").pop();

    if (!user) {

        if (
            page === "admin.html"
        ) {

            window.location.href = "login.html";

        }

        return;
    }

    if (page === "admin.html") {

        const userDoc = await getDoc(doc(db, "admins", user.uid));

        if (!userDoc.exists()) {

            await signOut(auth);

            return;

        }

        const admin = userDoc.data();

        if (admin.role !== "admin") {

            alert("Access Denied.");

            await signOut(auth);

        }

    }

});