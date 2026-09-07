import { auth, db, getCompanyId } from '../../Js/firebase.js';
import { collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
export async function auditEvent(action,data={}){
  const companyId=getCompanyId();
  if(!companyId || !auth.currentUser) return null;
  const payload={...data,action:String(action),actorUid:auth.currentUser.uid,actorRole:window.currentUser?.role||null,companyId,timestamp:serverTimestamp()};
  return addDoc(collection(db,'companies',companyId,'auditLogs'),payload);
}
