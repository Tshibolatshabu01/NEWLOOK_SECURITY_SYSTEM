import { getCompanyId, readSession } from '../../Js/firebase.js';
export function tenantId(){ return getCompanyId(); }
export function tenantSession(){ return readSession(); }
export function requireTenant(){ const id=tenantId(); if(!id) throw new Error('NEWLOOK: companyId is required.'); return id; }
export function assertTenant(value){ const id=requireTenant(); if(String(value||'')!==String(id)) throw new Error('NEWLOOK: tenant boundary violation.'); return id; }
