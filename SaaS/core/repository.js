import { db, companyCollection, companyDoc } from '../../Js/firebase.js';
import { getDocs, getDoc, setDoc, addDoc, updateDoc, deleteDoc, query, limit, where, orderBy } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';

export const tenantCollection = name => companyCollection(db, name);
export const tenantDoc = (name, id) => companyDoc(db, name, id);

function buildQuery(ref, options = {}) {
  const clauses = [];
  (options.where || []).forEach(item => {
    if (Array.isArray(item) && item.length >= 3) clauses.push(where(item[0], item[1], item[2]));
  });
  if (options.orderBy) {
    const orders = Array.isArray(options.orderBy[0]) ? options.orderBy : [options.orderBy];
    orders.forEach(item => clauses.push(orderBy(item[0], item[1] || 'asc')));
  }
  clauses.push(limit(Math.min(Math.max(Number(options.limit || 500), 1), 500)));
  return query(ref, ...clauses);
}

export async function listTenant(name, options = {}) {
  const snap = await getDocs(buildQuery(tenantCollection(name), options));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function readTenant(name, id) {
  const s = await getDoc(tenantDoc(name, id));
  return s.exists() ? { id: s.id, ...s.data() } : null;
}

export async function createTenant(name, data, id = null) {
  const ref = id ? tenantDoc(name, id) : tenantDoc(tenantCollection(name));
  await setDoc(ref, data);
  return ref;
}

export async function updateTenant(name, id, data) {
  return updateDoc(tenantDoc(name, id), data);
}

export async function deleteTenant(name, id) {
  return deleteDoc(tenantDoc(name, id));
}

export async function appendTenant(name, data) {
  return addDoc(tenantCollection(name), data);
}
