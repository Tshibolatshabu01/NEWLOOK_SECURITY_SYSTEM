/*
 * NEWLOOK Company SaaS compatibility layer.
 * The authoritative customer navigation/pages are built by
 * customerSaaSControl.js so every Company SaaS section shares one
 * tenant session, permission map and navigation lifecycle.
 * This file is intentionally kept as a stable entry point for older builds.
 */
import { auth } from '../Js/firebase.js';
import { loadSession } from './companySession.js';
import { normalizeRole } from './permissions.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';

onAuthStateChanged(auth, async user => {
  if (!user) return;
  try {
    const session = await loadSession(user);
    window.NEWLOOK_COMPANY_SAAS = {
      companyId: session.companyId,
      role: normalizeRole(session.role),
      version: 'unified-company-saas-v2',
      navigationOwner: 'SaaS/customerSaaSControl.js'
    };
  } catch (error) {
    console.error('NEWLOOK Company SaaS compatibility layer', error);
  }
});
