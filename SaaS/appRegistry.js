export const APPLICATIONS=Object.freeze({
  admin:{entry:'admin.html',script:'Js/admin.js',css:'Css/admin.css',domain:'Customer administration'},
  guard:{entry:'guard.html',script:'Js/guard.js',css:'Css/guard.css',domain:'Security operations'},
  attendance:{entry:'attendance.html',script:'Js/attendance.js',css:'Css/attendance.css',domain:'Staff attendance'},
  payroll:{entry:'payroll.html',script:'Js/payroll.js',css:'Css/payroll.css',domain:'Payroll'},
  superAdmin:{entry:'superAdmin/superadmin.html',script:'superAdmin/superadmin.js',css:'superAdmin/superadmin.css',domain:'Platform administration'},
  login:{entry:'SaasLogin.html',script:'Js/auth.js',css:'SaasLogin.css',domain:'Authentication'}
});
export function applicationHealth(){ return Object.fromEntries(Object.entries(APPLICATIONS).map(([k,v])=>[k,{...v,status:'registered'}])); }
