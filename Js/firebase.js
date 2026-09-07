import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getFirestore, collection, doc, addDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyD6tMtVxoyWdqJ7-Ikk2cOpy4ID-1d9CIA",
  authDomain: "newlook-dc1cf.firebaseapp.com",
  projectId: "newlook-dc1cf",
  storageBucket: "newlook-dc1cf.firebasestorage.app",
  messagingSenderId: "894852844690",
  appId: "1:894852844690:web:1dcae1e94fa99c76fa2a4b"
};

const app = getApps().find(a => a.name === "[DEFAULT]") || initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function readSession() {
  try { return JSON.parse(sessionStorage.getItem("newlookSession") || "null"); }
  catch { return null; }
}

function getCompanyId() {
  return readSession()?.companyId || sessionStorage.getItem("companyId") || localStorage.getItem("newlookDeviceCompanyId") || null;
}

function companyCollection(...args) {
  // Backward-compatible signature: companyCollection(name) OR companyCollection(db, name)
  const name = args.length === 1 ? args[0] : args[1];
  const companyId = getCompanyId();
  if (!companyId) throw new Error("NEWLOOK: companyId is required.");
  return collection(db, "companies", companyId, name);
}

function companyDoc(...args) {
  // Supported signatures:
  // companyDoc(collectionRef)
  // companyDoc(name, id)
  // companyDoc(db, name, id)
  const first = args[0];
  if (first && typeof first.path === "string" && first.type === "collection") {
    return doc(first);
  }
  let name, id;
  if (args.length === 2) [name, id] = args;
  else [, name, id] = args;
  const companyId = getCompanyId();
  if (!companyId) throw new Error("NEWLOOK: companyId is required.");
  if (id == null) return doc(collection(db, "companies", companyId, name));
  return doc(db, "companies", companyId, name, id);
}

export { app, auth, db, firebaseConfig, companyCollection, companyDoc, getCompanyId, readSession };
