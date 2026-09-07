import { db } from '../../../Js/firebase.js';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, addDoc } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';

const companyCollection = (companyId, name) => collection(db, 'companies', companyId, name);
const companyDoc = (companyId, name, id) => doc(db, 'companies', companyId, name, id);

export const superAdminService = Object.freeze({
  platformCollection: name => collection(db, name),
  platformDoc: (name, id) => doc(db, name, id),
  companyCollection,
  companyDoc,
  collection: name => collection(db, name),
  doc: (name, id) => doc(db, name, id),
  list: async name => (await getDocs(collection(db, name))).docs.map(d => ({ id: d.id, ...d.data() })),
  read: async (name, id) => { const s = await getDoc(doc(db, name, id)); return s.exists() ? { id: s.id, ...s.data() } : null; },
  create: async (name, id, data) => setDoc(doc(db, name, id), data),
  append: async (name, data) => addDoc(collection(db, name), data),
  update: async (name, id, data) => updateDoc(doc(db, name, id), data),
  tenantList: async (companyId, name) => (await getDocs(companyCollection(companyId, name))).docs.map(d => ({ id: d.id, ...d.data() })),
  tenantRead: async (companyId, name, id) => { const s = await getDoc(companyDoc(companyId, name, id)); return s.exists() ? { id: s.id, ...s.data() } : null; },
  tenantCreate: async (companyId, name, id, data) => setDoc(companyDoc(companyId, name, id), data),
  tenantAppend: async (companyId, name, data) => addDoc(companyCollection(companyId, name), data),
  tenantUpdate: async (companyId, name, id, data) => updateDoc(companyDoc(companyId, name, id), data)
});
