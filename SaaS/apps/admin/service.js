import { companyCollection, companyDoc, db, getCompanyId } from '../../../Js/firebase.js';
import { doc as firestoreDoc } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
import { listTenant, readTenant, createTenant, updateTenant, deleteTenant, appendTenant } from '../../core/repository.js';
import { assertTenant } from '../../core/tenant.js';

const guard = () => assertTenant(getCompanyId());
const collectionCompat = (...args) => {
  guard();
  const name = typeof args[0] === 'string' ? args[0] : args[1];
  return companyCollection(db, name);
};
const docCompat = (...args) => {
  guard();
  if (args.length === 1 && args[0] && typeof args[0] === 'object') return firestoreDoc(args[0]);
  const name = typeof args[0] === 'string' ? args[0] : args[1];
  const id = typeof args[0] === 'string' ? args[1] : args[2];
  return companyDoc(db, name, id);
};

export const adminService = Object.freeze({
  tenantId: () => guard(),
  list: (name, options) => (guard(), listTenant(name, options)),
  read: (name, id) => (guard(), readTenant(name, id)),
  create: (name, data, id) => (guard(), createTenant(name, data, id)),
  append: (name, data) => (guard(), appendTenant(name, data)),
  update: (name, id, data) => (guard(), updateTenant(name, id, data)),
  remove: (name, id) => (guard(), deleteTenant(name, id)),
  collection: collectionCompat,
  doc: docCompat
});
export { getCompanyId };
