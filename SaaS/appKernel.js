import { auth } from '../Js/firebase.js';
import { loadSession } from './companySession.js';
import { roleOf, requireRole } from './core/access.js';
import { ROUTES } from './core/contracts.js';
export async function bootManagementApp(appName, allowed=['company_admin','operations_manager','supervisor']){
  const user=auth.currentUser;
  if(!user) { location.href=ROUTES.LOGIN; throw new Error('Authentication required.'); }
  const session=await loadSession(user);
  requireRole(session,allowed);
  window.NEWLOOK=window.NEWLOOK||{};
  window.NEWLOOK.app=appName; window.NEWLOOK.session=session; window.NEWLOOK.role=roleOf(session); window.NEWLOOK.companyId=session.companyId;
  return session;
}
export function registerManagementSession(appName,session){
  window.NEWLOOK=window.NEWLOOK||{};
  window.NEWLOOK.app=appName; window.NEWLOOK.session=session; window.NEWLOOK.role=roleOf(session); window.NEWLOOK.companyId=session?.companyId||null;
  return session;
}
export function bootDeviceApp(appName,deviceType,device){
  window.NEWLOOK=window.NEWLOOK||{};
  window.NEWLOOK.app=appName; window.NEWLOOK.deviceType=deviceType; window.NEWLOOK.device=device||null;
  return window.NEWLOOK;
}
export const enterpriseRoutes=ROUTES;
